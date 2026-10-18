# Prompt — Landing page de Antojo con Astro + scroll-world (con vídeo ya generado)

> Pega este documento entero como prompt en una sesión nueva de Claude Code abierta en
> `/Users/perez/projects/antojo-web`.

---

## 0. Reglas que no se pueden saltar

1. **PROHIBIDO generar contenido con IA.** No llames a Higgsfield (`higgsfield …`), Monid,
   Codex ni a ningún otro modelo de imagen, vídeo o audio, **ni en el diseño ni en la
   implementación**. No se gastan créditos.
2. La skill **`scroll-world`** se usa **solo** por su motor de scroll (`references/scrub-engine.js`),
   las pautas de codificación (Step 6), el montaje (Step 7), la QA (Step 8) y los *Gotchas*.
   **Sáltate los Steps 0, 2, 3, 4 y 5** (bootstrap, stills, flotado, cámara y conectores)
   y la parte de generación del Step 1. No generes stills, clips, conectores ni la cadena 9:16.
3. Todo el material visual sale de lo que ya existe en `.media/`, procesado **en local** con
   `ffmpeg`, `sips` y `potrace` (ya instalados). **No hay codificador WebP**: este ffmpeg no
   trae libwebp y no están `cwebp` ni `magick`. Los pósteres van en JPEG, o en WebP/AVIF
   si los procesa `astro:assets` (sharp) a partir de los JPEG.
4. Antes de diseñar, carga la skill **`landing-page-design`** y sigue sus reglas de tipografía,
   espaciado, radios, iconos, movimiento y copy. Consulta también la documentación de Astro
   enlazada en `AGENTS.md` para páginas, componentes y estilos.
5. Servidor de desarrollo **siempre** en segundo plano: `astro dev --background`
   (`astro dev status`, `astro dev logs`, `astro dev stop`).
6. Usa una rama de git nueva (`feat/landing-scroll-world`). No hagas commit de `.media/`
   (fuentes pesadas): añádelo a `.gitignore` si no lo está.

---

## 1. Contexto del negocio

**Antojo — "Date el gusto"**, bar-restaurante en Utiel. Instagram: **@antojo.utiel**.

- Es un sitio para **disfrutar de la comida en familia**: los niños se entretienen en su zona
  y los padres disfrutan tranquilos.
- Hacen **comida callejera de todo el mundo**, única, con técnicas distintas: ahumador,
  horno de brasas, baja temperatura (sous-vide)…
- **Tono:** profesional, con ganas de hacer las cosas bien, pero también **canalla**,
  con aire *street food*. La referencia gráfica de marca es `.media/07-fin.png`: textura
  grunge, salpicaduras de pintura, rotulación a pincel y el mural de ojos de fondo.
  Inspírate en ella sin copiarla.

### Paleta (el cliente no sabe cómo combinarla: propón y justifica)

Colores pedidos: **burdeos**, **amarillo gualda** y **azul celeste**. Propuesta de partida,
que debes validar con la skill de diseño y comprobar en contraste AA:

| Rol | Color | Uso |
|---|---|---|
| Marca / dominante (~60%) | Burdeos `#6B1A2C` (es el del logo, compruébalo con un cuentagotas) | Fondos de secciones de texto, cabecera, pie, wordmark |
| Acción / energía (~30%) | Amarillo gualda `#F2B705` | Botones CTA, subrayados a pincel, precios y destacados. Aporta el toque de rótulo callejero |
| Acento (~10%) | Azul celeste `#7CC6E8` | Etiquetas, Zona de Niños, detalles. Conecta con los ojos del mural |
| Base | Crema papel `#F6EFE3` y tinta `#1A0F12` | Fondo claro y texto |

Para el toque canalla: el gualda sobre burdeos es la combinación principal (contraste alto,
lectura de cartel), con texturas grunge y salpicaduras sutiles en celeste y gualda. **Nunca**
celeste sobre gualda. Define los colores como variables CSS y sobrescribe los tokens del
motor (`--sw-bg`, `--sw-ink`, `--sw-accent`, `--sw-font-display`, `--sw-font-body`).
Ten en cuenta que el motor los envuelve en `@layer sw`.

### Logo

- `.media/logo_antojo_ajo.png` (440×400, sin transparencia, trazo burdeos sobre blanco):
  es **solo la mascota** (ajo con gafas de sol), recortada por abajo. **No incluye** la
  palabra "ANTOJO".
- Conviértelo a SVG **en local** con potrace. Este comando está probado en esta máquina y
  da un SVG de ~7 KB:
  ```bash
  mkdir -p src/assets/brand
  sips -s format bmp .media/logo_antojo_ajo.png --out /tmp/antojo-logo.bmp
  potrace /tmp/antojo-logo.bmp --svg --flat -k 0.5 -C "#6B1A2C" -o src/assets/brand/antojo-ajo.svg
  ```
  Revisa el SVG resultante, que debe tener un trazo limpio. Ajusta `viewBox` para quitar
  el espacio en blanco de la izquierda y de arriba. Úsalo con `currentColor`
  para poder ponerlo en crema sobre burdeos.
- El **wordmark "ANTOJO"** y el lema "DATE EL GUSTO" se componen con tipografía
  (redondeada y gruesa, parecida al rótulo de la fachada) junto al SVG de la mascota.
  Genera también `public/favicon.svg` a partir de la mascota.

---

## 2. Material disponible (NO regenerar)

### Vídeo final del recorrido

- **`.media/video/walkthrough-preview.mp4`**: 1920×1072, 24 fps, **721 fotogramas
  (30,04 s)**, H.264, sin audio, ~36 MB. Es el vídeo aprobado (el cliente lo llama "v4").
  Es un paseo continuo en primera persona por el local, sin cortes.
- Está montado con estos tramos. Los límites son fotogramas exactos del vídeo, porque al
  unir los clips se quitó el fotograma repetido de cada unión:

| Tramo | Fotogramas | Qué se ve | Clip de origen |
|---|---|---|---|
| A | 0–120 | Fachada nocturna con el rótulo → cruza la puerta → mapamundi | `clips/clip-1.mp4` |
| B | 121–240 | Gira: mapamundi y barra a la izquierda, arco al fondo, ojos y fotos a la derecha | `clips/clip-2a.mp4` |
| C | 241–360 | Sigue girando hasta la pared de fotos de ciudades | `clips/clip-2b.mp4` |
| D | 361–480 | Se desplaza a la izquierda hasta el mural de los ojos | `clips/clip-3-v2.mp4` |
| E | 481–600 | Gira hacia la esquina: celosía, tele y arco de hierro | `clips/clip-4a.mp4` |
| F | 601–720 | Cruza el arco hasta el rincón infantil | `clips/clip-4b.mp4` |

### Dónde quedó la generación (solo como referencia; no ejecutes nada de ahí)

- `.media/video/PROMPTS.md`: todos los prompts de retoque y de vídeo, con versiones v1–v5
  y la distribución real del local.
- `.media/video/retocadas/`: fotos retocadas (16:9, 2752×1536), que son los fotogramas
  clave del vídeo: `01-entrada`, `02-mapamundi` (más las versiones v1 y v2 descartadas),
  `03-vista-fondo` (más v1), `04-pictures`, `05-ojos`, `05b-esquina` y `06-ninyos`.
  **Son buenas imágenes estáticas** para pósteres, fondos de secciones y Open Graph.
- `.media/video/clips/`: los clips sueltos de Kling y Seedance (incluidos los descartados
  `-v2`, `-v3` y `-v4-test`).
- `.media/video/*.jpg`: fotos originales sin retocar.
- Las generaciones se hicieron con la cuenta de Higgsfield **antojo2112@gmail.com**.

### Otras imágenes en `.media/`

- `07-fin.png`: cartel "¡Mil gracias!", la **referencia de estilo** de marca.
- `IMG2026…jpg` / `image-1778253288390.jpg`: fotos reales (mural, café, zona infantil,
  obra). Úsalas solo si aportan algo y retócalas solo con ffmpeg/sips (recorte, exposición).
  Nada de IA.

### Imagen de la carta

El cliente la añadirá más adelante en **`public/carta/carta.jpg`**. La página debe usar
esa ruta tal cual. Si el archivo todavía no existe, muestra dentro del modal un marcador
neutro hecho con HTML/CSS (no lo generes con IA) con el enlace a Instagram, y que la
página no falle. Comprueba la existencia del archivo en tiempo de compilación o con
`onerror` en la imagen.

---

## 3. Preparación del vídeo para la web (ffmpeg, local)

Objetivo: archivos ligeros que permitan un scroll fluido. Parte de `walkthrough-preview.mp4`
y córtalo en **5 clips por sección**. Cada uno **empieza en el último fotograma del
anterior**, para que la unión sea idéntica y el fundido del motor no se note.

| Sección | Fotogramas | Archivo |
|---|---|---|
| 0 · Inicio | 0–120 | `s0-entrada` |
| 1 · Nosotros | 120–240 | `s1-nosotros` |
| 2 · Carta | 240–360 | `s2-carta` |
| 3 · Cocina | 360–480 | `s3-cocina` |
| 4 · Zona de Niños + contacto | 480–720 | `s4-ninos` |

Script de referencia. Guárdalo como `scripts/encode-video.sh` y ejecútalo con
`bash scripts/encode-video.sh`. En zsh no uses bucles con arrays: ver *Gotchas* de la skill.

```bash
#!/bin/bash
set -euo pipefail
SRC=.media/video/walkthrough-preview.mp4
OUT=public/video; POS=public/posters
mkdir -p "$OUT" "$POS"
cut() { # nombre inicio fin(incluido)
  # Escritorio: 1080p nativo, GOP 8, crf 22 (sube a 24 si el total pasa de ~20 MB)
  ffmpeg -v error -y -i "$SRC" -an \
    -vf "trim=start_frame=$2:end_frame=$(($3+1)),setpts=PTS-STARTPTS,unsharp=5:5:0.6:5:5:0.0" \
    -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p \
    -g 8 -keyint_min 8 -sc_threshold 0 -movflags +faststart "$OUT/$1.mp4"
  # Móvil: 720p, GOP 4, crf 26
  ffmpeg -v error -y -i "$SRC" -an \
    -vf "trim=start_frame=$2:end_frame=$(($3+1)),setpts=PTS-STARTPTS,scale=1280:-2" \
    -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p \
    -g 4 -keyint_min 4 -sc_threshold 0 -movflags +faststart "$OUT/$1-m.mp4"
  # Póster = primer fotograma exacto del clip
  ffmpeg -v error -y -i "$SRC" -vf "select=eq(n\,$2)" -frames:v 1 -q:v 4 "$POS/$1.jpg"
}
cut s0-entrada   0   120
cut s1-nosotros  120 240
cut s2-carta     240 360
cut s3-cocina    360 480
cut s4-ninos     480 720
ls -lh "$OUT" "$POS"
```

**Presupuesto de peso**, que debes comprobar e indicar al final:
- Escritorio: ≤ 20 MB en total.
- Móvil: ≤ 8 MB en total.
- Pósteres: ≤ 150 KB cada uno.

Si te pasas, sube el `crf` de dos en dos y vuelve a comprobar la nitidez del rótulo en `s0`.
Verifica con `ffprobe` que todos los clips **no tienen audio** y que el número de fotogramas
es el esperado (121 o 241).

**Móvil:** no existe una versión vertical 9:16, y está prohibido generarla. Los clips móviles
son el **recorte centrado de 16:9 (la *fallback* de la skill)**. Ajusta `object-position`
por sección si el motor lo permite, o adapta la maqueta para que el sujeto principal se lea
bien en vertical. Indícalo en el informe final, como exige la skill.

---

## 4. Estructura de la página

Menú superior: el *nav* del motor o uno propio fijo con la misma información, con logo,
**Nosotros · Carta · Cocina · Zona de Niños** y el botón **Contáctanos** (gualda).
**Botón flotante de WhatsApp** siempre visible.

- WhatsApp: `https://wa.me/34698960622?text=Hola%20Antojo%2C%20quer%C3%ADa%20informaci%C3%B3n`
- Teléfono: `tel:+34698960622`
- Instagram: `https://instagram.com/antojo.utiel`
- Dirección: **C/ S.S. León XIII, nº 3, bajo, 46300 Utiel (Valencia)**
- Google Maps (ficha del negocio): `https://www.google.com/maps/search/?api=1&query=Antojo%2C%20Calle%20S.S.%20Le%C3%B3n%20XIII%203%2C%2046300%20Utiel`
  Ábrelo una vez para comprobar que lleva a la ficha de Antojo y no a otro sitio. Si no es así,
  usa solo la dirección como búsqueda o pide al cliente el enlace "Compartir" de su ficha.
- Horario: **no se escribe en la web**. Se mantiene en Google, así que pon un enlace
  "Consulta nuestro horario actualizado en Google" que apunte a la misma ficha de Google Maps.

### Secciones (configuración de `mountScrollWorld`)

`sections` = 5 (una por clip de la tabla anterior) y `connectors: [null, null, null, null]`.
Las uniones ya son continuas, así que el motor solo hace un fundido corto entre secciones.
Pon `scroll` y `linger` más altos en Inicio y en Zona de Niños, y deja ágiles las
intermedias.

0. **Inicio** (`s0-entrada`): marca + lema "Date el gusto" + una frase que lo resuma
   (comida callejera del mundo para disfrutar en familia, con tono canalla). CTA principal
   *Ver la carta* y secundario *WhatsApp*.

1. **Nosotros** (`s1-nosotros`, aparece el mapamundi). Texto del cliente; corrige solo la
   ortografía y mantén el sentido:
   > "Antojo surge de la pasión por la cocina de una familia que, habiendo trabajado
   > alrededor del mundo en diferentes restaurantes, decide entregar lo aprendido a su
   > gente, pensando en los pequeños de la casa: un sitio familiar y a la vez canalla."

   **Etiquetas visibles:** `Pet friendly` · `Gluten free lovers` · `Celebración de eventos`.
   Al pulsar **Celebración de eventos** se despliegan las subetiquetas **Cumpleaños** y
   **Fiestas**. Hazlo accesible: es un `<button aria-expanded>` que controla una lista, con
   teclado y animación respetuosa con `prefers-reduced-motion`. Las `tags` del motor son
   estáticas, así que impleméntalo como mejora del DOM de la sección o como capa propia
   superpuesta.

2. **Carta** (`s2-carta`, pared con fotos de ciudades = sabores del mundo).
   Texto: **"Pincha para ver nuestros sabores más callejeros"**. Abre un **modal**
   (`<dialog>`) con la imagen de la carta (`public/carta/carta.jpg`), con zoom o
   desplazamiento en móvil, cierre con Esc o con un toque fuera, y foco gestionado.
   Dentro del modal, un mensaje visible: **"Visita la carta en Instagram @antojo.utiel para
   novedades"**, con enlace.

3. **Cocina** (`s3-cocina`, mural de los ojos, la parte más canalla). Título:
   **street world food**. Elementos destacados (chips o lista con iconos de la librería que
   indique la skill de diseño, sin emojis como iconos):
   ahumador · horno de brasas · baja temperatura sous-vide · tacos · la mejor burger de la
   zona · hot dog polaco · careta · vinos únicos.

4. **Zona de Niños** (`s4-ninos`, cruza el arco hasta el rincón infantil). Texto:
   **"Disfrutas tú, disfrutan ellos. Trae a tu familia a disfrutar."** Es la última sección
   y lleva la `cta`: primario **Contáctanos** y secundario **Escríbenos por WhatsApp**.

### Después del recorrido (contenido estático)

Bloque **Contacto** (destino de "Contáctanos"):
- Teléfono, WhatsApp e Instagram.
- Dirección (C/ S.S. León XIII, nº 3, bajo, Utiel) con el botón **"Cómo llegar"** hacia
  Google Maps, que abre en una pestaña nueva con `rel="noopener"`. No incrustes un mapa
  en un iframe: pesa y carga cookies de terceros.
- Horario: enlace **"Ver horario en Google"** a la ficha. No escribas ningún horario a mano.
- Pie con logo, dirección corta, enlaces y © Antojo.

### SEO y técnico

- `lang="es"`, título y descripción.
- Open Graph con `retocadas/01-entrada.png` recortada a JPEG de 1200×630 con ffmpeg (`-vf "scale=1200:-2,crop=1200:630" -q:v 3`).
- `viewport-fit=cover`.
- JSON-LD `Restaurant` con los datos que tenemos:
  - Nombre y teléfono `+34698960622`.
  - `address` (`streetAddress` "C/ S.S. León XIII, 3, bajo", `postalCode` "46300",
    `addressLocality` "Utiel", `addressRegion` "Valencia", `addressCountry` "ES").
  - `hasMap` con el enlace de Google Maps y `sameAs` con Instagram.
  - **Sin** `openingHours`, porque el horario vive en Google.
- Con `prefers-reduced-motion`: pósteres estáticos, sin vídeo.

---

## 5. Implementación en Astro

1. Elimina la plantilla de bienvenida (`Welcome.astro` y los assets de Astro que no se usen).
2. Copia `~/.claude/plugins/cache/scroll-world/scroll-world/0.8.0/skills/scroll-world/references/scrub-engine.js`
   a `src/scripts/scrub-engine.js` y móntalo desde un `<script>` de `index.astro`
   (script de cliente de Astro, que se empaqueta). **No toques** los atributos
   `muted`/`playsinline` ni la lógica de póster e iOS (ver *Gotchas*).
3. Componentes sugeridos: `Layout.astro` (head, fuentes, tokens), `Header.astro`,
   `WhatsAppFab.astro`, `CartaDialog.astro`, `EventTags.astro`, `Contact.astro`,
   `Footer.astro`. Los textos van en un único archivo de datos (`src/data/content.ts`)
   para que el cliente los cambie fácilmente.
4. Las fuentes se cargan solo de Google Fonts, con `display=swap` y *preconnect*.
5. Los vídeos y pósteres van en `public/`. El motor los carga como Blob, así que no hace
   falta que el servidor admita peticiones por rangos.

---

## 6. Fase de integración y validación (obligatoria)

### 6.1 Arranque de Astro
- `pnpm install` (si hace falta) y luego `pnpm astro check`. No debe dar errores.
- `pnpm build`: sin errores ni avisos importantes. Revisa el tamaño de `dist/`.
- `astro dev --background`, luego `astro dev status` y `astro dev logs`: la página carga
  sin errores.
- `pnpm preview` también funciona, porque así se sirve la versión de producción.

### 6.2 Escritorio
Con el navegador (skill `claude-in-chrome`):
- Haz scroll de principio a fin. El vídeo sigue al scroll sin congelarse
  (`video.seekable.end(0) > 0`) y la consola no muestra errores.
- **Uniones:** compara capturas justo antes y justo después de cada cambio de sección.
  La composición debe ser idéntica.
- Menú: cada enlace lleva a su sección. Comprueba el botón Contáctanos, el WhatsApp
  (URL correcta), el modal de la carta (abre, cierra y gestiona el foco) y que las
  etiquetas de eventos se despliegan.
- Comprueba también "Cómo llegar" y "Ver horario en Google": deben abrir la ficha de Antojo
  en Google Maps. La carta debe verse si existe `public/carta/carta.jpg` y, si no, debe
  aparecer el marcador.
- En la pestaña Network: en escritorio se sirven los `.mp4`, no los `-m.mp4`.

### 6.3 Móvil
- Emulación de iPhone y Android en vertical y horizontal, con la **CPU ralentizada 4–6×**:
  - Con un scroll rápido el vídeo no se congela.
  - El póster aparece al instante, sin escena negra.
  - Se sirven los `-m.mp4`.
  - La página no salta al esconderse la barra de direcciones.
  - El texto no queda tapado por la muesca ni por la barra inferior.
  - El botón de WhatsApp no tapa ninguna CTA.
- **Dispositivo real:** arranca `astro dev --background --host` y abre la URL de la red
  local en un móvil. **Pide al cliente** que lo pruebe en iPhone (Safari) y en Android
  (Chrome) y que confirme que funcionan el scroll, el modal, las etiquetas y el WhatsApp
  (que abra la app).
- Lighthouse en móvil: anota rendimiento, accesibilidad y SEO. Accesibilidad ≥ 95.
- Con `prefers-reduced-motion` se ven pósteres en lugar de vídeo.

### 6.4 Comprobación de que no se ha generado nada
- `grep -rn "higgsfield\|monid\|codex" src public scripts` no debe encontrar nada.
- El saldo de Higgsfield sigue igual: **solo si el cliente lo pide**, ejecuta
  `higgsfield account status`, que no gasta créditos. Antes de empezar había
  **143,75 créditos**.

---

## 7. Informe final al cliente

- Capturas de escritorio y móvil de cada sección.
- Pesos finales de los vídeos y pósteres (escritorio y móvil).
- Pendientes del cliente: dejar la **imagen de la carta** en `public/carta/carta.jpg`,
  confirmar que el enlace de Google Maps abre su ficha y revisar los textos.
- Aviso: en móvil se usa un recorte centrado del vídeo 16:9. No existe versión vertical
  nativa porque generar vídeo no estaba permitido.
- Cómo arrancar el proyecto (`astro dev --background`) y dónde se cambian los textos
  (`src/data/content.ts`).
