#!/bin/bash
# Corta el recorrido aprobado en un clip por sección y lo codifica para scroll-scrub.
# Solo ffmpeg local: no genera contenido nuevo.
set -euo pipefail
SRC=.media/video/walkthrough-preview.mp4
OUT=public/video
POS=public/posters
CRF_D=${CRF_D:-27}
CRF_M=${CRF_M:-29}
mkdir -p "$OUT" "$POS"

cut() { # nombre primer_fotograma ultimo_fotograma
  local end=$(($3 + 1))
  ffmpeg -v error -y -i "$SRC" -an \
    -vf "trim=start_frame=$2:end_frame=$end,setpts=PTS-STARTPTS,unsharp=5:5:0.6:5:5:0.0" \
    -c:v libx264 -preset slow -crf "$CRF_D" -pix_fmt yuv420p \
    -g 8 -keyint_min 8 -sc_threshold 0 -movflags +faststart "$OUT/$1.mp4"
  ffmpeg -v error -y -i "$SRC" -an \
    -vf "trim=start_frame=$2:end_frame=$end,setpts=PTS-STARTPTS,scale=960:-2" \
    -c:v libx264 -preset slow -crf "$CRF_M" -pix_fmt yuv420p \
    -g 4 -keyint_min 4 -sc_threshold 0 -movflags +faststart "$OUT/$1-m.mp4"
  ffmpeg -v error -y -i "$SRC" -vf "select=eq(n\,$2)" -frames:v 1 -q:v 6 "$POS/$1.jpg"
  ffmpeg -v error -y -i "$SRC" -vf "select=eq(n\,$2),scale=1280:-2" -frames:v 1 -q:v 7 "$POS/$1-m.jpg"
}

cut s0-entrada   0   120
cut s1-nosotros  120 240
cut s2-carta     240 360
cut s3-cocina    360 480
cut s4-ninos     480 720

ls -lh "$OUT" "$POS"
