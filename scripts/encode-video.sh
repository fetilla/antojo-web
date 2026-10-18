#!/bin/bash
# Corta el recorrido aprobado en un clip por sección y lo codifica para scroll-scrub.
# Solo ffmpeg local: no genera contenido nuevo.
set -euo pipefail
SRC=.media/video/walkthrough-preview.mp4
OUT=public/video
POS=public/posters
CRF_D=${CRF_D:-27}
CRF_M=${CRF_M:-30}
mkdir -p "$OUT" "$POS"

cut() { # nombre primer_fotograma ultimo_fotograma
  local end=$(($3 + 1))
  ffmpeg -v error -y -i "$SRC" -an \
    -vf "trim=start_frame=$2:end_frame=$end,setpts=PTS-STARTPTS,unsharp=5:5:0.6:5:5:0.0" \
    -c:v libx264 -preset slow -crf "$CRF_D" -pix_fmt yuv420p \
    -g 8 -keyint_min 8 -sc_threshold 0 -movflags +faststart "$OUT/$1.mp4"
  ffmpeg -v error -y -i "$SRC" -an \
    -vf "trim=start_frame=$2:end_frame=$end,setpts=PTS-STARTPTS,scale=854:-2" \
    -c:v libx264 -preset slow -crf "$CRF_M" -pix_fmt yuv420p \
    -g 1 -keyint_min 1 -sc_threshold 0 -movflags +faststart "$OUT/$1-m.mp4"
  ffmpeg -v error -y -i "$SRC" -vf "select=eq(n\,$2)" -frames:v 1 -q:v 6 "$POS/$1.jpg"
  ffmpeg -v error -y -i "$SRC" -vf "select=eq(n\,$2),scale=1280:-2" -frames:v 1 -q:v 7 "$POS/$1-m.jpg"
}

# Cada tramo TERMINA en el elemento de su sección: la cámara viaja hasta él y se
# para ahí mientras se ve la tarjeta (ver `travel` en src/data/content.ts).
cut s0-entrada   0   24    # fachada (leve acercamiento)
cut s1-nosotros  24  120   # → mapamundi
cut s2-carta     120 360   # → vista del fondo → pared de fotos
cut s3-cocina    360 480   # → mural de los ojos
cut s4-ninos     480 720   # → esquina → cruza el arco → rincón infantil

ls -lh "$OUT" "$POS"

# Clip del ahumador (etiqueta "Ahumador" de Cocina): 4 s en bucle, sin audio
mkdir -p public/media
ffmpeg -v error -y -ss 3.2 -to 7.2 -i .media/ahumador.mp4 -an \
  -vf "scale=540:-2,unsharp=5:5:0.5:5:5:0.0" \
  -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -movflags +faststart public/media/ahumador.mp4
ffmpeg -v error -y -i public/media/ahumador.mp4 -frames:v 1 -q:v 5 public/media/ahumador-poster.jpg
