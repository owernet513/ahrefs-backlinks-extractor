# Ahrefs Backlinks Extractor

Script de JavaScript para extraer backlinks desde la interfaz web de Ahrefs y descargarlos como CSV. Pensado para usarse directamente desde la consola del navegador, sin necesidad de API ni dependencias.

## ¿Por qué?

La exportación nativa de Ahrefs requiere créditos de API o planes superiores. Este script lee la tabla ya renderizada en pantalla y la convierte a CSV en un clic.

## Uso

1. Abre Ahrefs y navega a **Site Explorer → Backlinks** del dominio que quieras analizar.
2. Ajusta los filtros (Dofollow, New, Lost, etc.) y pon el máximo de resultados por página.
3. Abre la consola del navegador (`F12` → pestaña Console).
4. Pega el contenido de [`extract.js`](./extract.js) y pulsa Enter.
5. Se descargará automáticamente un archivo `ahrefs_backlinks_<timestamp>.csv`.
6. Pasa a la siguiente página y repite.

## Campos extraídos

| Campo | Descripción |
|---|---|
| `domain_from` | Dominio que enlaza |
| `url_from` | URL exacta de la página que enlaza |
| `url_to` | URL de destino (antes de redirects) |
| `url_to_final` | URL final tras la cadena de redirects |
| `redirect_chain` | Códigos HTTP de los redirects (p. ej. `301→302`) |
| `anchor` | Texto de ancla |
| `text_pre` / `text_post` | Texto que rodea al anchor |
| `dofollow` | `true` si es dofollow |
| `link_type` | `content` o `image` |
| `link_badges` | Etiquetas del enlace (CONTENT, NOFOLLOW, IMAGE…) |
| `dr` / `ur` | Domain Rating / URL Rating |
| `domain_traffic` | Tráfico orgánico estimado del dominio |
| `refdomains_to_page` | Dominios de referencia hacia la página |
| `linked_domains` | Dominios enlazados desde la página |
| `external_links` | Enlaces externos totales |
| `page_traffic` | Tráfico estimado de la página |
| `keywords` | Keywords posicionadas |
| `page_type` | Tipo de página (Article, Site page, Listing…) |
| `page_from_title` | Título de la página |
| `author` | Autor detectado por Ahrefs (si existe) |
| `tld_from` | TLD del dominio de origen |
| `tech_badges` | Tecnologías detectadas (WordPress, Ecommerce…) |
| `domain_to` | Dominio de destino |
| `is_new` / `is_lost` | Estado del enlace |
| `first_seen` / `last_seen` / `lost_date` | Fechas relevantes |

## Unir varios CSV

Si extraes varias páginas, cada descarga tendrá timestamp propio. Para juntarlas:

**macOS / Linux:**
```bash
# Primer archivo con cabecera, el resto sin cabecera
head -1 ahrefs_backlinks_*.csv | head -1 > all.csv
for f in ahrefs_backlinks_*.csv; do tail -n +2 "$f" >> all.csv; done
```

**Python:**
```python
import pandas as pd, glob
df = pd.concat([pd.read_csv(f) for f in glob.glob('ahrefs_backlinks_*.csv')])
df.drop_duplicates(subset=['url_from', 'url_to', 'anchor']).to_csv('all.csv', index=False)
```

## Limitaciones

- Solo extrae lo renderizado en el DOM. Para volúmenes grandes tendrás que paginar manualmente.
- Los nombres de clases CSS de Ahrefs cambian entre builds. El script usa selectores por posición de columna e índices parciales (`[class*="badge"]`) para minimizar roturas, pero si Ahrefs rediseña la tabla habrá que ajustar los índices.
- Las filas "hijas" de un mismo referring page (varios enlaces desde la misma URL) heredan los datos del padre automáticamente.
- No sustituye a la [API oficial de Ahrefs](https://ahrefs.com/api), que es la opción recomendada para uso serio o a escala.

## Depuración

Si el script devuelve `0 backlinks`, ejecuta esto en la consola para inspeccionar la estructura:

```javascript
const rows = document.querySelectorAll('tbody tr');
rows.forEach((r, i) => {
  const cells = r.querySelectorAll('td');
  console.log(`Fila ${i}: ${cells.length} celdas`,
    Array.from(cells).map(c => (c.innerText || '').trim().substring(0, 30)));
});
```

Comparte la salida en un issue y se ajustan los índices de columna.

## Aviso legal

Este script automatiza la lectura de datos que ya están disponibles en tu sesión autenticada de Ahrefs. Revisa los [Términos de Servicio de Ahrefs](https://ahrefs.com/terms) antes de usarlo. El uso es bajo tu propia responsabilidad.

## Licencia

MIT
