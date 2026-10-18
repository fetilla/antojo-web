// Recorrido por el local controlado por el scroll (plans/scroll-plan.md, F1 y F2).
//
// Todo el recorrido es una sola línea de tiempo en fotogramas (24 fps). Cada sección
// tiene un fotograma de parada; su tramo de scroll se divide en viaje (desde la parada
// anterior) y parada. Las tarjetas cambian como un carrusel vertical ligado al scroll:
// la de una sección se ve hasta que la cámara llega a la siguiente.
import type { Renderer } from './renderers';

export interface WalkSection {
  id: string;
  frame: number;
  scroll: number;
  travel: number;
}

interface Laid extends WalkSection {
  start: number; // y donde empieza la sección
  arrive: number; // y donde la cámara llega a la parada
  end: number;
  from: number; // fotograma de la parada anterior
}

export interface WalkOptions {
  sections: WalkSection[];
  renderer: Renderer;
  cards: HTMLElement[];
  track: HTMLElement;
  progress?: HTMLElement;
  hint?: HTMLElement;
  touch: boolean;
  reduce: boolean;
  onSection?: (index: number) => void;
}

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (x: number) => x * x * (3 - 2 * x);
// viaje: arranca y llega suave; y su inversa, para pasar de fotograma a scroll
const ease = (x: number) => (1 - Math.cos(Math.PI * x)) / 2;
const easeInv = (u: number) => Math.acos(1 - 2 * clamp(u)) / Math.PI;

const SLIDE_VH = 10; // desplazamiento de las tarjetas en el carrusel
const CHANGE = 0.4; // parte final del viaje en la que cambia la tarjeta
const JUMP_FPS = 192; // velocidad del vídeo en los saltos: 8 veces la real
const JUMP_MIN_MS = 900;
const JUMP_MAX_MS = 4500;

export function mountWalkthrough(o: WalkOptions) {
  const { renderer, cards } = o;
  const N = o.sections.length;
  let vh = window.innerHeight;
  let laidW = window.innerWidth;
  let S: Laid[] = [];

  function layout() {
    vh = window.innerHeight;
    laidW = window.innerWidth;
    let y = 0;
    S = o.sections.map((s, k) => {
      const len = s.scroll * vh;
      const laid = {
        ...s,
        start: y,
        arrive: y + len * s.travel,
        end: y + len,
        from: k ? o.sections[k - 1].frame : s.frame,
      };
      y += len;
      return laid;
    });
    // +1 pantalla al final: la última tarjeta se queda mientras sube el contenido
    o.track.style.height = `${y + vh}px`;
    renderer.resize();
    draw(true);
  }

  // ---- scroll ↔ fotograma ----
  function sectionAt(y: number) {
    let k = 0;
    for (let i = 0; i < N; i++) if (y >= S[i].start) k = i;
    return k;
  }

  function frameAt(y: number) {
    const s = S[sectionAt(y)];
    if (y >= s.arrive || s.arrive === s.start) return s.frame;
    return s.from + (s.frame - s.from) * ease((y - s.start) / (s.arrive - s.start));
  }

  function yAt(frame: number) {
    // posición dentro del viaje que muestra ese fotograma (nunca en una parada)
    for (let k = 1; k < N; k++) {
      const s = S[k];
      if (frame <= s.frame) return s.start + (s.arrive - s.start) * easeInv((frame - s.from) / (s.frame - s.from));
    }
    return S[N - 1].arrive;
  }

  const holdY = (k: number) => (k === 0 ? 0 : (S[k].arrive + S[k].end) / 2);

  // ---- tarjetas ----
  const cardState: { op: string; tr: string; vis: string }[] = cards.map(() => ({ op: '', tr: '', vis: '' }));
  function setCard(i: number, p: number, offsetVh: number) {
    const st = cardState[i];
    const op = p.toFixed(3);
    const tr = o.reduce ? 'none' : `translateY(${offsetVh.toFixed(2)}vh)`;
    const vis = p > 0.01 ? 'visible' : 'hidden';
    const el = cards[i];
    if (st.op !== op) el.style.opacity = st.op = op;
    if (st.tr !== tr) el.style.transform = st.tr = tr;
    if (st.vis !== vis) {
      el.style.visibility = st.vis = vis;
      el.toggleAttribute('inert', vis === 'hidden');
    }
    el.style.pointerEvents = p > 0.5 ? 'auto' : 'none';
  }

  function cardsAt(y: number) {
    // tarjeta actual: la de la última parada alcanzada; la siguiente entra en la parte
    // final de su viaje (carrusel: una sube y sale mientras la otra sube y entra)
    let cur = 0;
    for (let k = 1; k < N; k++) if (y >= S[k].arrive) cur = k;
    const next = cur + 1 < N ? cur + 1 : -1;
    let p = 0;
    if (next >= 0) {
      const s = S[next];
      const from = s.arrive - (s.arrive - s.start) * CHANGE;
      p = smooth(clamp((y - from) / (s.arrive - from)));
    }
    return { cur, next, p };
  }

  let jump: null | { to: number; from: number; f0: number; f1: number; t0: number; dur: number; raf: number } = null;
  let active = -1;

  function draw(force = false, frameOverride?: number) {
    const y = ys;
    const frame = frameOverride ?? frameAt(y);
    renderer.setFrame(frame);

    let { cur, next, p } = cardsAt(y);
    if (jump) {
      // en un salto solo se ven la tarjeta de origen y la de destino
      const t = clamp((performance.now() - jump.t0) / jump.dur);
      cur = jump.from;
      next = jump.to;
      p = smooth(clamp((t - 0.6) / 0.4));
    }
    for (let i = 0; i < N; i++) {
      if (i === cur) setCard(i, 1 - p, -SLIDE_VH * p);
      else if (i === next) setCard(i, p, SLIDE_VH * (1 - p));
      else setCard(i, 0, SLIDE_VH);
    }

    const now = jump ? jump.to : p > 0.5 && next >= 0 ? next : cur;
    if (now !== active || force) {
      active = now;
      o.onSection?.(now);
    }
    if (o.progress) o.progress.style.transform = `scaleX(${clamp(y / S[N - 1].end).toFixed(4)})`;
    if (o.hint) o.hint.style.opacity = String(clamp(1 - y / (0.25 * vh)));
  }

  // ---- bucle: posición suavizada (rueda del ratón) y pintado ----
  let ys = window.scrollY;
  let last = NaN;
  let lastT = performance.now();
  function loop(now: number) {
    const dt = Math.min(64, now - lastT);
    lastT = now;
    if (jump) {
      const t = clamp((now - jump.t0) / jump.dur);
      const f = jump.f0 + (jump.f1 - jump.f0) * ease(t);
      if (t < 1) {
        const y = yAt(f);
        window.scrollTo(0, y);
        ys = y;
        draw(false, f);
      } else {
        const k = jump.to;
        jump = null;
        window.scrollTo(0, holdY(k));
        ys = holdY(k);
        draw(true);
      }
    } else {
      const real = window.scrollY;
      // con el dedo ya hay inercia nativa; con rueda, cada golpe se convierte en un deslizamiento
      if (o.touch || o.reduce) ys = real;
      else {
        ys += (real - ys) * (1 - Math.pow(1 - 0.12, dt / 16.67));
        if (Math.abs(real - ys) < 0.5) ys = real;
      }
      if (ys !== last) {
        last = ys;
        draw();
      }
    }
    renderer.tick();
    requestAnimationFrame(loop);
  }

  // ---- saltos del menú: el fotograma avanza de forma continua hasta la parada destino ----
  function endJump() {
    if (!jump) return;
    jump = null;
    draw(true);
  }
  ['wheel', 'touchstart', 'keydown'].forEach((ev) => window.addEventListener(ev, endJump, { passive: true }));

  function jumpTo(k: number) {
    const target = holdY(k);
    const f0 = frameAt(window.scrollY);
    const f1 = S[k].frame;
    if (o.reduce || Math.abs(f1 - f0) < 0.5) {
      jump = null;
      window.scrollTo(0, target);
      ys = target;
      draw(true);
      return;
    }
    const dur = clamp((Math.abs(f1 - f0) / JUMP_FPS) * 1000, JUMP_MIN_MS, JUMP_MAX_MS);
    jump = { to: k, from: active, f0, f1, t0: performance.now(), dur, raf: 0 };
  }

  // ---- arranque ----
  const onResize = () => {
    // en táctil la barra de direcciones cambia el alto: solo se recoloca si cambia el ancho
    if (o.touch && window.innerWidth === laidW) return;
    layout();
  };
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', () => setTimeout(layout, 200));
  layout();
  if (!o.reduce) renderer.load();
  requestAnimationFrame(loop);

  return { jumpTo, count: N };
}
