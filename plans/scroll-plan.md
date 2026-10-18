# Plan — Scroll del recorrido en vídeo (escritorio y móvil)

Objetivo: que el recorrido por el local se sienta como **un único vídeo continuo**
controlado por el scroll, con la tarjeta de la sección siempre visible, en
escritorio y en móvil, y poder **medirlo** en vez de opinarlo.

---

## 1. Problemas reportados

| # | Dónde | Síntoma |
|---|---|---|
| P1 | Escritorio | Hay tramos de scroll en los que no se ve ninguna tarjeta, solo la imagen. La tarjeta de cada sección debe verse hasta llegar a la siguiente, y el cambio puede ser un desplazamiento en lugar de un fundido. |
| P2 | Escritorio | Al saltar 2 o más secciones desde el menú, la cámara se para en las secciones intermedias en lugar de ir fluida hasta el destino. |
| P3 | Móvil | El recorte lateral corta el rótulo "ANTOJO" de la fachada. Se puede recortar, pero el rótulo debe verse entero. |
| P4 | Móvil | El vídeo no ocupa toda la pantalla: abajo queda una franja vacía. |
| P5 | Móvil | El movimiento del vídeo no es lo bastante fluido. |

---

## 2. Análisis de causas

### P1 — Tramos sin tarjeta (causa conocida)
Cada sección se divide en **viaje** (`travel`, ~50% del tramo) y **parada**. La
tarjeta solo se muestra en la parada, así que durante el viaje de la siguiente
sección no hay ninguna. Es una decisión de diseño de la última iteración, no un
error; hay que cambiarla.

### P2 — Paradas al saltar varias secciones (causa NO reproducida)
Medición de fotogramas **presentados** (`requestVideoFrameCallback`) durante un
salto Nosotros → Zona de niños:

| Entorno | fps presentados | Hueco máx. | Huecos > 100 ms |
|---|---|---|---|
| Chrome sin interfaz, escritorio 1440×900 | 59,7 | 33 ms | 0 |
| Chrome sin interfaz, móvil emulado (CPU ×4) | 57 | 50 ms | 0 |

En el entorno de pruebas el salto es continuo (Carta 8,7 s → Cocina 0,1 s → Niños
0,2 s, sin repetir fotogramas). **En el navegador del cliente no lo es.** Hipótesis,
de más a menos probable:

1. **Cambio de `<video>` en cada sección.** El motor usa un `<video>` por sección.
   Al cruzar una unión, el navegador tiene que empezar a decodificar con *otro*
   decodificador. Con decodificación por hardware (Safari, Chrome con GPU), el
   primer fotograma de un vídeo nuevo puede tardar 100–300 ms, y eso es justo
   una "parada en la sección saltada". El Chrome sin interfaz decodifica por
   software y no lo muestra.
2. **Búsquedas lentas en 1080p con GOP 8** en el decodificador por hardware: cada
   salto en el vídeo decodifica hasta 7 fotogramas de 1080p.
3. **Caché de GitHub Pages** (`max-age=600`): el cliente pudo probar una versión
   anterior a la corrección de los saltos. Hoy no hay forma de saber qué versión
   está viendo.
4. Lag del suavizado de scroll o del *lerp* del vídeo en un hardware concreto.

### P3 — Rótulo cortado en móvil (causa conocida)
La versión móvil es un recorte 9:16 de 603 px de ancho sobre 1920. El rótulo
ocupa unos 1450 px. A pantalla completa en vertical **no cabe entero** sin reducir
la imagen: hay que componer el encuadre de la fachada de otra manera (ver F3).

### P4 — Franja vacía abajo en móvil (causa conocida)
La desplacé a propósito (`top: -14svh`) para que el elemento de cada sección
quedara por encima de la tarjeta. El resultado es esa franja sin vídeo.

### P5 — Fluidez en móvil (causa NO medida en dispositivo real)
Las búsquedas con `video.currentTime` en móviles, sobre todo en iOS Safari, son
asíncronas y lentas, aunque todos los fotogramas sean clave. Además, el cambio
de `<video>` entre secciones (hipótesis 1 de P2) también afecta al móvil. Sin
medir en el teléfono real no sé cuál de las dos domina.

---

## 2b. Mediciones F0 en los dispositivos del cliente (versión 33dd8df)

Salto Nosotros → Zona de niños con `?debug=1`:

| Métrica | Ordenador (Brave, macOS, 1728×879 @2x) | Móvil (Chrome 155, Android 10, 360×764 @3x) |
|---|---|---|
| fps de pantalla | **30** | 86 (pantalla de 90 Hz) |
| fps de vídeo durante el scroll | 30 | **14,2** |
| Hueco máximo | **1934 ms** (1 hueco de más de 100 ms) | **1277 ms** (3 huecos) |
| Búsqueda en el vídeo p50 / p95 | 6 / 10 ms | **27 / 58 ms** |

Conclusiones:
- **P2 confirmado y localizado:** en el ordenador las búsquedas son rápidas, pero hay
  una parada de casi 2 s. Encaja con la hipótesis 1: el cambio de `<video>` en las
  uniones, o un tramo todavía sin listo. En el entorno de pruebas no aparece.
  → **F1 (vídeo único) pasa a ser obligatoria.**
- **Ordenador limitado a 30 fps:** afecta a todo el navegador. La causa probable es
  el ahorro de energía de Brave/Chrome, que limita a 30 fps sin cargador. Se
  documenta; no se puede corregir desde la web.
- **P5 confirmado:** en el Android del cliente cada búsqueda tarda 27–58 ms y
  van una a una, así que el vídeo se queda en ~14 fps. Ningún ajuste del `<video>`
  lo arregla. → **F4.2 (secuencia de imágenes en `<canvas>`) pasa a ser la
  solución para móvil**, sin esperar a otra medición.

## 3. Lección de las iteraciones anteriores

He validado con Chrome sin interfaz, que **no reproduce el hardware del cliente**.
Mis métricas salían bien y el cliente seguía viendo fallos. Este plan cambia eso:
la validación decisiva se hace **en el navegador y el dispositivo del cliente**,
con una herramienta de medida integrada en la web.

---

## 4. Plan por fases

### F0 — Instrumentación (antes de tocar el comportamiento)
1. **Panel de diagnóstico** en `?debug=1`, solo visible con ese parámetro:
   - versión desplegada (hash del commit, inyectado al compilar), para descartar la caché;
   - navegador, dispositivo, `devicePixelRatio` y vídeo servido (escritorio o móvil);
   - **fps presentados** del vídeo (`requestVideoFrameCallback`) y fps de pantalla;
   - latencia de búsqueda (p50 y p95), búsquedas descartadas y huecos > 100 ms;
   - sección y tiempo de vídeo actuales;
   - botón **"Copiar informe"**, que copia un JSON con 10 s de métricas para enviármelo.
2. Script de QA en el repositorio (`qa/`, `pnpm qa`) con puppeteer-core, que incluya
   las pruebas de esta conversación: sincronización tarjeta–vídeo, saltos,
   golpes de rueda, clics reales y fotogramas presentados.
3. **Medición de referencia:** el cliente abre `antojoutiel.com/?debug=1` en su
   ordenador y en su móvil, hace un scroll normal y un salto Nosotros → Zona de
   niños, y me pasa los dos informes.

### F1 — Un solo vídeo continuo (arquitectura)
Sustituir los 5 `<video>` por **un único `<video>` por dispositivo** con el
recorrido completo (721 fotogramas). Las secciones pasan a ser solo una tabla de
correspondencias scroll ↔ tiempo de vídeo.

- Elimina el cambio de decodificador en las uniones (hipótesis 1 de P2 y P5) y el
  fundido entre escenas.
- Precarga más simple: un archivo de escritorio (~15 MB) y uno de móvil (~6 MB).
- Salto = animar el tiempo de vídeo de forma continua hasta el fotograma de la
  sección destino.
- Escritorio: valorar GOP 4 en lugar de 8 si F0 muestra búsquedas lentas.
- Se sustituye el motor de varias escenas de scroll-world por un controlador
  propio más simple (`src/scripts/walkthrough.ts`), manteniendo lo que funciona:
  carga como Blob, búsquedas agrupadas, arreglos para iOS, `svh` y movimiento reducido.

### F2 — Tarjetas continuas (P1)
- La tarjeta de la sección *k* se ve desde que la cámara llega a su elemento hasta
  que llega al de la sección *k+1*. **Nunca hay un tramo sin tarjeta.**
- Transición tipo carrusel vertical, ligada al scroll: la tarjeta actual sube y
  sale mientras la siguiente entra desde abajo. Ocupa la última parte del viaje,
  para que al llegar al elemento la nueva tarjeta ya esté en su sitio.
- Durante un salto, las tarjetas intermedias no se muestran (como ahora).

### F3 — Encuadre móvil (P3 y P4)
- **P4:** vídeo a `100lvh` desde `top: 0`, sin desplazamiento, para que cubra
  también la zona de la barra de direcciones.
- Para que el elemento quede visible sin subir el vídeo, la **tarjeta móvil se
  compacta**:
  - etiqueta y título siempre visibles;
  - texto limitado a 3 líneas, con "Leer más";
  - etiquetas en una sola fila con desplazamiento horizontal;
  - objetivo: la tarjeta ocupa como mucho el 38% inferior de la pantalla.
- **P3:** recorte con **ancho variable** en la versión móvil:
  - fachada: recorte de ~1500 px de ancho, el rótulo entero;
  - al cruzar la puerta, el recorte se cierra hasta 603 px, como un zoom de entrada;
  - para que la fachada llene igualmente la pantalla vertical, ese encuadre
    ancho va sobre un fondo con la misma imagen ampliada y desenfocada, todo
    generado con ffmpeg en local.
  - **Decisión del cliente:** en vez de fondo desenfocado o franjas, **regenerar
    la entrada en vertical con la cámara más alejada**, para que se vea el rótulo
    entero llenando la pantalla. Se hace con Higgsfield (ver F3b).

### F3b — Entrada vertical regenerada (solo versión móvil)
Créditos disponibles: 143,75. Presupuesto previsto: ~10–20 créditos con repeticiones.

1. **Fotograma inicial vertical** (Nano Banana Pro, 2K, 9:16, 2 créditos): a partir
   de `retocadas/01-entrada.png`, ampliar la escena hacia arriba y hacia abajo con la
   cámara más alejada, para que el rótulo "DATE EL GUSTO ANTOJO", la mascota y la
   puerta quepan enteros en vertical. Mantener rótulo, mascota y logo idénticos.
2. **Clip de entrada vertical** (Kling 3.0 Omni Frames pro, 9:16, 5 s, sin sonido,
   6,25 créditos):
   - inicio: el fotograma vertical del paso 1;
   - final: el fotograma vertical del vídeo móvil en el que la cámara ya ha
     cruzado la puerta. Se elige uno en el que el encuadre 9:16 actual ya vea bien.
3. **Versión móvil:** ese clip sustituye los primeros fotogramas del vídeo móvil. La
   unión con el resto se comprueba fotograma a fotograma; si no coincide del todo, se
   hace un fundido corto (0,2 s).
4. En escritorio no cambia nada.

Si el resultado no convence tras 2 o 3 intentos, la alternativa sin créditos es la
composición con fondo desenfocado hecha con ffmpeg.

### F4 — Fluidez en móvil (P5) — decidido tras F0: secuencia de imágenes
1. Tras F1, medir en el teléfono del cliente con `?debug=1`.
   **Objetivo: ≥ 30 fps presentados durante el scroll y ningún hueco > 100 ms.**
2. Si no se alcanza, y en iOS es probable, pasar el móvil a **secuencia de imágenes
   en `<canvas>`**, la técnica de las páginas de producto de Apple:
   - el vídeo móvil se exporta como fotogramas JPEG de 480×854 a 12–15 fps
     (~360 imágenes, ~6–8 MB);
   - se cargan de forma progresiva, con las secciones cercanas primero;
   - el scroll dibuja la imagen correspondiente en un `<canvas>`, sin decodificador
     de vídeo ni búsquedas, a 60 fps;
   - opcional: fundido entre dos imágenes consecutivas para suavizar los 12–15 fps.
3. Volver a medir en el teléfono y comparar con la referencia de F0.

### F5 — Regresión y despliegue
- `pnpm qa` en verde: escritorio y móvil, sincronización, saltos, clics, carta,
  etiquetas y vídeo del ahumador.
- `astro check` y `astro build` sin errores.
- Despliegue y comprobación de la versión con `?debug=1`, que el hash coincida.
- El cliente repite las medidas de F0 y confirma visualmente.

---

## 5. Matriz de navegadores

| Navegador | Cómo se prueba |
|---|---|
| Chrome escritorio | `pnpm qa` (puppeteer-core, Chrome instalado) y `?debug=1` |
| Firefox escritorio | `pnpm qa` (puppeteer-core vía WebDriver BiDi, Firefox instalado) y `?debug=1` |
| Brave escritorio (el del cliente) | Mismo motor que Chrome; `pnpm qa` con el ejecutable de Brave y `?debug=1` del cliente |
| Chrome móvil (el del cliente) | Emulación en `pnpm qa` y, como prueba decisiva, `?debug=1` en el teléfono del cliente |

Los criterios de aceptación tienen que cumplirse en los cuatro.

## 6. Criterios de aceptación

| # | Criterio | Cómo se mide |
|---|---|---|
| P1 | Siempre hay una tarjeta visible entre la primera sección y el final del recorrido; los cambios son desplazamientos | QA: barrido de scroll cada 10 px |
| P2 | Salto de 2+ secciones: tiempo de vídeo presentado monótono, sin huecos > 100 ms, ≥ 45 fps presentados | `?debug=1` en el navegador del cliente y QA |
| P3 | En la fachada se ve "ANTOJO" entero en un móvil de 390×844 | Captura en QA y confirmación del cliente |
| P4 | El vídeo cubre el 100% de la pantalla, con la barra de direcciones visible u oculta | Captura en QA y confirmación del cliente |
| P5 | ≥ 30 fps presentados durante el scroll en el teléfono del cliente; sin tirones visibles | `?debug=1` en el teléfono del cliente |
| — | Sin regresiones: carta, etiquetas, ahumador, WhatsApp, menú móvil | `pnpm qa` |

---

## 7. Bucle de iteración

1. Implementar una fase en una rama.
2. `pnpm qa` hasta que pase en verde.
3. Push a `main`; el despliegue es automático.
4. El cliente abre `?debug=1`, comprueba que el hash es el nuevo y pasa los informes.
5. Si algún criterio falla, se ajusta con esos datos y se vuelve al paso 1.

Cada iteración cambia **una sola cosa** y se mide, para saber qué ha mejorado o empeorado.

---

## 8. Lo que necesito del cliente

1. ~~Navegadores~~: móvil **Chrome**, ordenador **Brave**. Pendiente: ¿el móvil es
   **Android o iPhone**? En iPhone, Chrome usa por dentro el motor de Safari.
2. Los informes de `?debug=1` en F0 y tras cada fase.
3. ~~Fachada en móvil~~: regenerar la entrada en vertical con la cámara más alejada (F3b).
4. Opcional, para Android: depuración remota (`chrome://inspect` con el móvil por
   cable) para grabar un perfil de rendimiento real.

---

## 9. Riesgos

- **Secuencia de imágenes (F4.2):** son más descargas y más trabajo. Solo se aplica
  si el vídeo no llega al objetivo en el teléfono real.
- **Un solo vídeo (F1):** hay que esperar a que se descargue el archivo entero de
  ~15 MB en escritorio antes de poder recorrerlo. Mitigación: el póster de la
  fachada se ve al instante, y el vídeo de móvil es ligero.
- **Encuadre con fondo desenfocado (F3):** sale muy bien en la fachada, pero hay que
  revisar la transición del zoom fotograma a fotograma.
