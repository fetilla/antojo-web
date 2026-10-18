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

# Móvil: recorte vertical 9:16 del vídeo (603x1072 de 1920x1072) a 480x854, todos los
# fotogramas clave (cada salto decodifica un solo fotograma) y pantalla completa.
# CX = x del recorte: centrado salvo donde el elemento de la sección queda a un lado.
CX_CENTRO=658
CX_MAPA=359
CX_OJO=960

cut() { # nombre primer_fotograma ultimo_fotograma fotograma_del_poster [x_recorte_movil] [x_poster_movil]
  local end=$(($3 + 1))
  local cx=${5:-$CX_CENTRO} px=${6:-$CX_CENTRO}
  ffmpeg -v error -y -i "$SRC" -an \
    -vf "trim=start_frame=$2:end_frame=$end,setpts=PTS-STARTPTS,unsharp=5:5:0.6:5:5:0.0" \
    -c:v libx264 -preset slow -crf "$CRF_D" -pix_fmt yuv420p \
    -g 8 -keyint_min 8 -sc_threshold 0 -movflags +faststart "$OUT/$1.mp4"
  ffmpeg -v error -y -i "$SRC" -an \
    -vf "trim=start_frame=$2:end_frame=$end,setpts=PTS-STARTPTS,crop=603:1072:x='$cx':y=0,scale=480:-2" \
    -c:v libx264 -preset slow -crf "$CRF_M" -pix_fmt yuv420p \
    -g 1 -keyint_min 1 -sc_threshold 0 -movflags +faststart "$OUT/$1-m.mp4"
  # Póster = fotograma donde se para la sección (el último del tramo; el primero en el inicio)
  ffmpeg -v error -y -i "$SRC" -vf "select=eq(n\,$4)" -frames:v 1 -q:v 6 "$POS/$1.jpg"
  ffmpeg -v error -y -i "$SRC" -vf "select=eq(n\,$4),crop=603:1072:$px:0,scale=480:-2" -frames:v 1 -q:v 6 "$POS/$1-m.jpg"
}

# Cada tramo TERMINA en el elemento de su sección: la cámara viaja hasta él y se
# para ahí mientras se ve la tarjeta (ver `travel` en src/data/content.ts).
cut s0-entrada   0   24  0     # fachada (leve acercamiento)
# en móvil el encuadre se desplaza hacia el mapamundi y luego vuelve al centro
cut s1-nosotros  24  120 120 "$CX_CENTRO-($CX_CENTRO-$CX_MAPA)*min(1\,n/96)" "$CX_MAPA"
cut s2-carta     120 360 360 "$CX_MAPA+($CX_CENTRO-$CX_MAPA)*min(1\,n/96)"
# en móvil el encuadre va hacia el ojo del mural y luego vuelve al centro
cut s3-cocina    360 480 480 "$CX_CENTRO+($CX_OJO-$CX_CENTRO)*min(1\,n/120)" "$CX_OJO"
cut s4-ninos     480 720 720 "$CX_OJO-($CX_OJO-$CX_CENTRO)*min(1\,n/96)"

ls -lh "$OUT" "$POS"

# Clip del ahumador (etiqueta "Ahumador" de Cocina): 4 s en bucle, sin audio
mkdir -p public/media
ffmpeg -v error -y -ss 3.2 -to 7.2 -i .media/ahumador.mp4 -an \
  -vf "scale=540:-2,unsharp=5:5:0.5:5:5:0.0" \
  -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -movflags +faststart public/media/ahumador.mp4
ffmpeg -v error -y -i public/media/ahumador.mp4 -frames:v 1 -q:v 5 public/media/ahumador-poster.jpg
