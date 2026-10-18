// Pintores del recorrido. Ambos reciben un fotograma (decimal, en fotogramas de 24 fps)
// con setFrame() y lo muestran en tick(), una vez por fotograma de pantalla.
//
// - VideoRenderer (escritorio): un único <video>. Sin cambios de reproductor entre
//   secciones, que era lo que paraba la cámara al saltar (plans/scroll-plan.md, P2).
// - FrameRenderer (móvil): secuencia de imágenes en <canvas>. En el Android del cliente
//   cada búsqueda de <video> tardaba 27–58 ms y el vídeo no pasaba de ~14 fps (P5);
//   dibujar una imagen ya descodificada cuesta ~1 ms.

export interface Renderer {
  readonly el: HTMLElement;
  setFrame(frame: number): void;
  tick(): void;
  load(): void;
  /** true cuando puede mostrar cualquier fotograma del recorrido */
  isReady(): boolean;
  resize(): void;
}

const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

// ---------------------------------------------------------------------------
export class VideoRenderer implements Renderer {
  readonly el: HTMLVideoElement;
  private ready = false;
  private target = 0;
  private cur = 0;

  constructor(
    private src: string,
    private fps: number,
    private frames: number,
    private poster: HTMLImageElement,
  ) {
    const v = document.createElement('video');
    v.className = 'wt__media';
    v.muted = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    v.setAttribute('aria-hidden', 'true');
    v.dataset.walkthrough = 'video';
    this.el = v;
  }

  load() {
    // Como Blob: siempre se puede buscar, aunque el servidor no admita rangos
    fetch(this.src)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then((blob) => {
        const v = this.el;
        v.addEventListener(
          'loadeddata',
          () => {
            this.ready = true;
            v.currentTime = this.timeOf(this.cur);
          },
          { once: true },
        );
        // se oculta el póster cuando hay un fotograma pintado de verdad
        v.addEventListener('seeked', () => this.poster.classList.add('is-hidden'), { once: true });
        v.src = URL.createObjectURL(blob);
      })
      .catch(() => {});
  }

  isReady() {
    return this.ready;
  }

  setFrame(frame: number) {
    this.target = clamp(frame, 0, this.frames - 1);
  }

  private timeOf(frame: number) {
    // centro del fotograma, para que el navegador no redondee al anterior
    return (frame + 0.5) / this.fps;
  }

  tick() {
    if (!this.ready || this.el.seeking) return; // nunca se encola una búsqueda sobre otra
    this.cur += (this.target - this.cur) * 0.35;
    if (Math.abs(this.target - this.cur) < 0.01) this.cur = this.target;
    const t = this.timeOf(this.cur);
    if (Math.abs(this.el.currentTime - t) > 0.5 / this.fps) this.el.currentTime = t;
  }

  resize() {}
}

// ---------------------------------------------------------------------------
type Slot = { blob?: Blob; bitmap?: ImageBitmap; decoding?: boolean; loading?: boolean };

export class FrameRenderer implements Renderer {
  readonly el: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private slots: Slot[];
  private target = 0;
  private cur = 0; // en índices de la secuencia
  private drawn = '';
  private decoded: number[] = []; // orden de uso, para liberar memoria
  private decodingNow = 0;
  private dir = 1;
  private readonly KEEP = 36; // imágenes descodificadas en memoria (~60 MB a 480x854)

  constructor(
    private url: (i: number) => string,
    private count: number,
    private ratio: number, // fotogramas del vídeo por imagen (24 fps / 12 fps = 2)
    private priority: number[], // imágenes que se cargan primero (paradas)
    private poster: HTMLImageElement,
  ) {
    const c = document.createElement('canvas');
    c.className = 'wt__media';
    c.setAttribute('aria-hidden', 'true');
    c.dataset.walkthrough = 'frames';
    this.el = c;
    this.ctx = c.getContext('2d', { alpha: false })!;
    this.slots = Array.from({ length: count }, () => ({}));
  }

  isReady() {
    return this.slots.every((s) => s.blob);
  }

  load() {
    // Orden: la imagen actual, las paradas y después todas en orden.
    const order = [...new Set([Math.round(this.cur), ...this.priority, ...this.slots.keys()])];
    let next = 0;
    const worker = async () => {
      while (next < order.length) {
        const i = order[next++];
        const slot = this.slots[i];
        if (slot.blob || slot.loading) continue;
        slot.loading = true;
        try {
          const r = await fetch(this.url(i));
          if (r.ok) slot.blob = await r.blob();
        } catch {
          /* se reintentará al pedirla */
        }
        slot.loading = false;
        if (Math.abs(i - this.cur) < 8) this.decodeAround();
      }
    };
    for (let k = 0; k < 6; k++) worker();
  }

  setFrame(frame: number) {
    const t = clamp(frame / this.ratio, 0, this.count - 1);
    if (t !== this.target) this.dir = t > this.target ? 1 : -1;
    this.target = t;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = this.el.getBoundingClientRect();
    this.el.width = Math.round(r.width * dpr);
    this.el.height = Math.round(r.height * dpr);
    this.drawn = '';
  }

  private decodeAround() {
    // las 2 de atrás y las 8 de delante en la dirección del scroll
    const base = Math.round(this.cur);
    const want: number[] = [];
    for (let d = -2; d <= 8; d++) want.push(base + d * this.dir);
    for (const i of want) {
      if (i < 0 || i >= this.count || this.decodingNow >= 3) continue;
      const s = this.slots[i];
      if (!s.blob || s.bitmap || s.decoding) continue;
      s.decoding = true;
      this.decodingNow++;
      createImageBitmap(s.blob)
        .then((bmp) => {
          s.bitmap = bmp;
          this.decoded.push(i);
          this.evict();
          this.drawn = '';
        })
        .catch(() => {})
        .finally(() => {
          s.decoding = false;
          this.decodingNow--;
        });
    }
  }

  private evict() {
    while (this.decoded.length > this.KEEP) {
      // libera la más lejana a la posición actual
      let far = 0;
      for (let k = 1; k < this.decoded.length; k++)
        if (Math.abs(this.decoded[k] - this.cur) > Math.abs(this.decoded[far] - this.cur)) far = k;
      const [i] = this.decoded.splice(far, 1);
      this.slots[i].bitmap?.close();
      this.slots[i].bitmap = undefined;
    }
  }

  private nearest(i: number) {
    for (let d = 0; d < this.count; d++) {
      if (this.slots[i - d]?.bitmap) return i - d;
      if (this.slots[i + d]?.bitmap) return i + d;
    }
    return -1;
  }

  tick() {
    this.cur += (this.target - this.cur) * 0.5;
    if (Math.abs(this.target - this.cur) < 0.002) this.cur = this.target;
    this.decodeAround();

    const i0 = Math.floor(this.cur);
    const frac = this.cur - i0;
    const a = this.slots[i0]?.bitmap ? i0 : this.nearest(i0);
    if (a < 0) return;
    const b = frac > 0.02 && this.slots[i0 + 1]?.bitmap && a === i0 ? i0 + 1 : -1;
    const key = `${a}:${b}:${b >= 0 ? frac.toFixed(2) : ''}:${this.el.width}`;
    if (key === this.drawn) return;
    this.drawn = key;

    this.draw(this.slots[a].bitmap!, 1);
    // mezcla con la siguiente imagen para suavizar los 12 fps
    if (b >= 0) this.draw(this.slots[b].bitmap!, frac);
    this.poster.classList.add('is-hidden');
    this.el.dispatchEvent(new Event('wt-frame')); // para el panel ?debug=1
  }

  private draw(img: ImageBitmap, alpha: number) {
    const { width: W, height: H } = this.el;
    const s = Math.max(W / img.width, H / img.height); // como object-fit: cover
    const w = img.width * s;
    const h = img.height * s;
    this.ctx.globalAlpha = alpha;
    this.ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
    this.ctx.globalAlpha = 1;
  }
}
