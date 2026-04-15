(() => {
  const tables = document.querySelectorAll('table');
  let table = null, maxRows = 0;
  tables.forEach(t => {
    const n = t.querySelectorAll('tbody tr').length;
    if (n > maxRows) { maxRows = n; table = t; }
  });
  if (!table) { console.error('❌ No se encontró tabla'); return; }

  const rows = table.querySelectorAll('tbody tr');
  const data = [];
  let lastRef = {};

  const txt = el => el ? (el.innerText || '').trim().replace(/\s+/g, ' ') : '';
  const href = el => el ? el.getAttribute('href') : '';
  const parseNum = s => {
    if (!s) return null;
    s = String(s).replace(/,/g, '').trim();
    if (/K$/i.test(s)) return Math.round(parseFloat(s) * 1000);
    if (/M$/i.test(s)) return Math.round(parseFloat(s) * 1000000);
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
  };
  const domain = url => { try { return new URL(url).hostname; } catch { return ''; } };
  const tldOf = d => { const p = (d || '').split('.'); return p[p.length - 1] || ''; };

  // Mapa fijo de columnas (tras el primer td vacío de gap):
  // 0: gap | 1: Referring page | 2: Page type+Category | 3: DR | 4: UR
  // 5: Domain traffic | 6: Ref domains | 7: Linked domains | 8: External
  // 9: Page traffic | 10: Keywords | 11: Anchor + target URL
  // 12: First/Last/Lost seen | 13: Inspect | 14: gap

  rows.forEach(row => {
    const c = row.querySelectorAll('td');
    if (c.length < 13) return;

    const refCell = c[1];
    const hasRef = refCell && refCell.querySelector('a');

    let ref;
    if (hasRef) {
      const links = refCell.querySelectorAll('a');
      const titleLink = links[0];
      const urlLink = links[1] || titleLink;
      // Badges: TLD y otros (ECOMMERCE, WORDPRESS...)
      const badges = Array.from(refCell.querySelectorAll('[class*="badge"]'))
        .map(b => txt(b)).filter(Boolean);
      const tld_from = badges[0] ? badges[0].toLowerCase() : '';
      const tech_badges = badges.slice(1).join(',');
      // Autor: texto pequeño debajo del bloque de badges
      const authorEl = Array.from(refCell.querySelectorAll('div'))
        .find(d => /^By\s+/i.test(txt(d)));
      const author = authorEl ? txt(authorEl).replace(/^By\s+/i, '') : '';

      ref = {
        page_from_title: txt(titleLink),
        url_from: href(urlLink) || href(titleLink),
        tld_from,
        tech_badges,
        author,
        page_type: txt(c[2]),
        dr: parseNum(txt(c[3])),
        ur: parseNum(txt(c[4])),
        domain_traffic: parseNum(txt(c[5])),
        refdomains: parseNum(txt(c[6])),
        linked_domains: parseNum(txt(c[7])),
        external_links: parseNum(txt(c[8])),
        page_traffic: parseNum(txt(c[9])),
        keywords: parseNum(txt(c[10]))
      };
      lastRef = ref;
    } else {
      ref = { ...lastRef };
    }

    // Celda 11: anchor + target
    const anchorCell = c[11];
    if (!anchorCell) return;
    const anchorLinks = anchorCell.querySelectorAll('a');
    if (!anchorLinks.length) return;

    // El primer <a> suele ser el anchor (texto de ancla)
    const anchorEl = anchorLinks[0];
    const anchor = txt(anchorEl);

    // Texto surrounding: buscar el contenedor del anchor
    const wrapper = anchorEl.closest('div');
    const fullText = txt(wrapper);
    const idx = fullText.indexOf(anchor);
    const text_pre = idx > 0 ? fullText.substring(0, idx).trim() : '';
    const text_post = idx >= 0 ? fullText.substring(idx + anchor.length).trim().split('\n')[0] : '';

    // Badges del enlace
    const linkBadges = Array.from(anchorCell.querySelectorAll('[class*="badge"]'))
      .map(b => txt(b).toUpperCase())
      .filter(b => /^(CONTENT|NOFOLLOW|IMAGE|UGC|SPONSORED|REDIRECT|\d{3})$/.test(b));
    const dofollow = !linkBadges.some(b => /NOFOLLOW|UGC|SPONSORED/.test(b));
    const link_type = linkBadges.includes('IMAGE') ? 'image' : 'content';

    // url_to = primer link que NO sea el anchor (target directo)
    // url_to_final = último link de la cadena de redirects
    let url_to = '', url_to_final = '';
    if (anchorLinks.length >= 2) {
      url_to = href(anchorLinks[1]);
      url_to_final = href(anchorLinks[anchorLinks.length - 1]);
    } else {
      url_to = href(anchorEl);
      url_to_final = url_to;
    }

    // Cadena de códigos HTTP de redirects (301, 302...)
    const redirectCodes = Array.from(anchorCell.querySelectorAll('[class*="badge"]'))
      .map(b => txt(b))
      .filter(t => /^\d{3}$/.test(t))
      .join('→');

    // Estado new/lost: badge con texto que contiene "Lost" o "New"
    const statusBadge = Array.from(anchorCell.querySelectorAll('[class*="badge"]'))
      .map(b => txt(b))
      .find(t => /lost|new/i.test(t)) || '';
    const is_lost = /lost/i.test(statusBadge);
    const is_new = /new/i.test(statusBadge);

    // Fechas: celda 12
    const dateCell = c[12];
    const dateText = txt(dateCell);
    const dateParts = dateText.split(' ').reduce((acc, w, i, arr) => {
      // Reconstruir las fechas originales separadas por saltos de línea en el innerText original
      return acc;
    }, []);
    // Mejor: usar el innerText crudo con saltos de línea
    const rawDates = (dateCell.innerText || '').split('\n').map(s => s.trim()).filter(Boolean);
    const [first_seen = '', last_seen = '', lost_date = ''] = rawDates;

    const domain_from = domain(ref.url_from || '');
    const domain_to = domain(url_to);

    data.push({
      domain_from,
      url_from: ref.url_from || '',
      url_to,
      url_to_final,
      redirect_chain: redirectCodes,
      anchor,
      text_pre,
      text_post,
      dofollow,
      link_type,
      link_badges: linkBadges.join(','),
      dr: ref.dr,
      ur: ref.ur,
      domain_traffic: ref.domain_traffic,
      refdomains_to_page: ref.refdomains,
      linked_domains: ref.linked_domains,
      external_links: ref.external_links,
      page_traffic: ref.page_traffic,
      keywords: ref.keywords,
      page_type: ref.page_type,
      page_from_title: ref.page_from_title,
      author: ref.author,
      tld_from: ref.tld_from || tldOf(domain_from),
      tech_badges: ref.tech_badges,
      domain_to,
      is_new,
      is_lost,
      first_seen,
      last_seen,
      lost_date
    });
  });

  console.log(`✅ Extraídos ${data.length} backlinks`);
  if (!data.length) return;
  console.table(data.slice(0, 3));

  const headers = Object.keys(data[0]);
  const esc = v => {
    if (v === null || v === undefined) return '';
    const s = String(v).replace(/"/g, '""');
    return /[",\n;]/.test(s) ? `"${s}"` : s;
  };
  const csv = [
    headers.join(','),
    ...data.map(r => headers.map(h => esc(r[h])).join(','))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ahrefs_backlinks_${Date.now()}.csv`;
  a.click();

  return data;
})();
