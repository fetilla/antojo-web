#!/bin/bash
# Prepara los recursos del recorrido a partir del vídeo aprobado. Solo ffmpeg local:
# no genera contenido nuevo. Ver plans/scroll-plan.md (F1 y F4).
#
#   Escritorio → public/video/recorrido.mp4   un único vídeo (721 fotogramas, 24 fps)
#   Móvil      → public/frames/0000-0360.jpg  secuencia vertical 480x854 a 12 fps
#   Pósteres   → public/posters/sN-*.jpg      fotograma de la parada de cada sección
set -euo pipefail
SRC=.media/video/walkthrough-preview.mp4
CRF_D=${CRF_D:-27}
Q_M=${Q_M:-9}

mkdir -p public/video public/frames public/posters

# ---- Escritorio: un solo vídeo, GOP 8, sin audio ----
ffmpeg -v error -y -i "$SRC" -an -vf "unsharp=5:5:0.6:5:5:0.0" \
  -c:v libx264 -preset slow -crf "$CRF_D" -pix_fmt yuv420p \
  -g 8 -keyint_min 8 -sc_threshold 0 -movflags +faststart public/video/recorrido.mp4

# ---- Móvil: recorte vertical 9:16 (603x1072 de 1920x1072) con encuadre que sigue
# al elemento de cada sección. CX(n) = x del recorte en el fotograma n (24 fps):
#   centrado 658 · mapamundi 359 (parada en n=120) · ojo del mural 960 (n=480)
CX="if(lt(n,24),658,if(lt(n,120),658-299*(n-24)/96,if(lt(n,216),359+299*(n-120)/96,if(lt(n,360),658,if(lt(n,480),658+302*(n-360)/120,if(lt(n,576),960-302*(n-480)/96,658))))))"
rm -f public/frames/*.jpg
ffmpeg -v error -y -i "$SRC" \
  -vf "crop=603:1072:x='$CX':y=0,scale=480:-2,select='not(mod(n\,2))'" \
  -fps_mode vfr -q:v "$Q_M" -start_number 0 public/frames/%04d.jpg

# ---- Pósteres (fotograma de la parada de cada sección) ----
poster() { # nombre fotograma x_recorte_movil
  ffmpeg -v error -y -i "$SRC" -vf "select=eq(n\,$2)" -frames:v 1 -q:v 6 "public/posters/$1.jpg"
  ffmpeg -v error -y -i "$SRC" -vf "select=eq(n\,$2),crop=603:1072:$3:0,scale=480:-2" -frames:v 1 -q:v 6 "public/posters/$1-m.jpg"
}
poster s0-entrada  0   658
poster s1-nosotros 120 359
poster s2-carta    360 658
poster s3-cocina   480 960
poster s4-ninos    720 658

# ---- Clip del ahumador (etiqueta "Ahumador" de Cocina): 4 s en bucle, sin audio ----
mkdir -p public/media
ffmpeg -v error -y -ss 3.2 -to 7.2 -i .media/ahumador.mp4 -an \
  -vf "scale=540:-2,unsharp=5:5:0.5:5:5:0.0" \
  -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -movflags +faststart public/media/ahumador.mp4
ffmpeg -v error -y -i public/media/ahumador.mp4 -frames:v 1 -q:v 5 public/media/ahumador-poster.jpg

echo "recorrido.mp4: $(du -h public/video/recorrido.mp4 | cut -f1)"
echo "frames: $(ls public/frames | wc -l | tr -d ' ') imágenes, $(cat public/frames/*.jpg | wc -c | awk '{printf "%.1f MB", $1/1048576}')"
