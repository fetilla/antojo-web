// Panel de diagnóstico del recorrido (solo con ?debug=1). Mide en el navegador real:
// fotogramas de pantalla, fotogramas de vídeo presentados, huecos y búsquedas.
// "Copiar informe" copia un JSON con los últimos 15 s para enviarlo.

declare const __BUILD__: string;

type Sample = { t: number; scrolling: boolean };

const WINDOW_MS = 15000;
const raf: number[] = [];
const presented: Sample[] = [];
const seeks: { t: number; ms: number }[] = [];
let lastScroll = -1e9;
let maxGapScrolling = 0;
let gapsOver100 = 0;
let lastPresented = 0;

const now = () => performance.now();
const scrolling = () => now() - lastScroll < 300;
const trim = <T extends { t: number } | number>(arr: T[]) => {
  const limit = now() - WINDOW_MS;
  while (arr.length && (typeof arr[0] === 'number' ? (arr[0] as number) : (arr[0] as { t: number }).t) < limit) arr.shift();
};
const pct = (a: number[], q: number) => {
  if (!a.length) return 0;
  const x = [...a].sort((m, n) => m - n);
  return x[Math.floor(q * (x.length - 1))];
};

window.addEventListener('scroll', () => (lastScroll = now()), { passive: true });

function onFrame() {
  raf.push(now());
  requestAnimationFrame(onFrame);
}
requestAnimationFrame(onFrame);

// Engancha cada <video> del recorrido (se crean al cargar los tramos)
const hooked = new WeakSet<HTMLVideoElement>();
const supportsRVFC = 'requestVideoFrameCallback' in HTMLVideoElement.prototype;

// Solo cuenta el vídeo que está encima: en las uniones se funden dos a la vez
function isOnTop(v: HTMLVideoElement) {
  const scene = v.closest<HTMLElement>('.sw-scene');
  return !scene || scene.style.zIndex === '120';
}

function hook(v: HTMLVideoElement) {
  if (hooked.has(v)) return;
  hooked.add(v);
  let seekStart = 0;
  v.addEventListener('seeking', () => (seekStart = now()));
  v.addEventListener('seeked', () => seekStart && seeks.push({ t: now(), ms: now() - seekStart }));
  if (!supportsRVFC) return;
  const cb = () => {
    if (isOnTop(v)) {
      const t = now();
      const s = scrolling();
      if (lastPresented && s) {
        const gap = t - lastPresented;
        maxGapScrolling = Math.max(maxGapScrolling, gap);
        if (gap > 100) gapsOver100++;
      }
      lastPresented = t;
      presented.push({ t, scrolling: s });
    }
    v.requestVideoFrameCallback(cb);
  };
  v.requestVideoFrameCallback(cb);
}

// El recorrido en móvil es un <canvas>: cada imagen dibujada cuenta como fotograma presentado
const hookedCanvas = new WeakSet<HTMLCanvasElement>();
function hookCanvas(c: HTMLCanvasElement) {
  if (hookedCanvas.has(c)) return;
  hookedCanvas.add(c);
  c.addEventListener('wt-frame', () => {
    const t = now();
    const s = scrolling();
    if (lastPresented && s) {
      const gap = t - lastPresented;
      maxGapScrolling = Math.max(maxGapScrolling, gap);
      if (gap > 100) gapsOver100++;
    }
    lastPresented = t;
    presented.push({ t, scrolling: s });
  });
}

new MutationObserver(() => {
  document.querySelectorAll('video').forEach(hook);
  document.querySelectorAll<HTMLCanvasElement>('canvas[data-walkthrough]').forEach(hookCanvas);
}).observe(document.body, {
  childList: true,
  subtree: true,
});
document.querySelectorAll('video').forEach(hook);
document.querySelectorAll<HTMLCanvasElement>('canvas[data-walkthrough]').forEach(hookCanvas);

function env() {
  const mobile = matchMedia('(hover: none) and (pointer: coarse)').matches || matchMedia('(max-width: 860px)').matches;
  return {
    version: __BUILD__,
    navegador: navigator.userAgent,
    pantalla: `${innerWidth}x${innerHeight} @${devicePixelRatio}x`,
    videoServido: document.querySelector('canvas[data-walkthrough]') ? 'móvil (imágenes en canvas)' : 'escritorio (vídeo único)',
    rVFC: supportsRVFC,
  };
}

function stats() {
  [raf, presented, seeks].forEach((a) => trim(a as never[]));
  const t = now();
  const last1s = (arr: number[]) => arr.filter((x) => x > t - 1000).length;
  const scrollFrames = presented.filter((p) => p.scrolling);
  const span = scrollFrames.length > 1 ? (scrollFrames[scrollFrames.length - 1].t - scrollFrames[0].t) / 1000 : 0;
  const seekMs = seeks.map((s) => s.ms);
  return {
    fpsPantalla: last1s(raf),
    fpsVideo: last1s(presented.map((p) => p.t)),
    fpsVideoDuranteScroll: span ? +(scrollFrames.length / span).toFixed(1) : null,
    huecoMaxScrollMs: Math.round(maxGapScrolling),
    huecosMayores100ms: gapsOver100,
    busquedas15s: seeks.length,
    busquedaP50ms: Math.round(pct(seekMs, 0.5)),
    busquedaP95ms: Math.round(pct(seekMs, 0.95)),
    seccion: document.querySelector('[data-section-link][aria-current]')?.getAttribute('data-section-link') ?? 'inicio',
    scrollY: Math.round(scrollY),
  };
}

// ---- Panel ----
const panel = document.createElement('div');
panel.setAttribute('role', 'status');
panel.style.cssText =
  'position:fixed;left:8px;bottom:8px;z-index:9999;max-width:min(92vw,340px);padding:8px 12px;border-radius:8px;' +
  'background:rgba(0,0,0,.82);color:#7cc6e8;font:12px/16px ui-monospace,Menlo,monospace;white-space:pre;pointer-events:auto';
const out = document.createElement('div');
const actions = document.createElement('div');
actions.style.cssText = 'display:flex;gap:8px;margin-top:8px';
const btn = (label: string, fn: () => void) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.style.cssText = 'font:inherit;padding:4px 8px;border:0;border-radius:4px;background:#f2b705;color:#1a0f12;cursor:pointer';
  b.addEventListener('click', fn);
  actions.appendChild(b);
  return b;
};
const reset = () => {
  maxGapScrolling = 0;
  gapsOver100 = 0;
  lastPresented = 0;
  presented.length = 0;
  seeks.length = 0;
};
const copy = btn('Copiar informe', async () => {
  const report = JSON.stringify({ ...env(), ...stats(), fecha: new Date().toISOString() }, null, 1);
  try {
    await navigator.clipboard.writeText(report);
    copy.textContent = 'Copiado';
  } catch {
    const ta = document.createElement('textarea');
    ta.value = report;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    copy.textContent = 'Copiado';
  }
  setTimeout(() => (copy.textContent = 'Copiar informe'), 1500);
});
btn('Reiniciar', reset);
panel.append(out, actions);
document.body.appendChild(panel);

const e = env();
setInterval(() => {
  const s = stats();
  out.textContent =
    `versión ${e.version} · ${e.videoServido}\n` +
    `pantalla ${s.fpsPantalla} fps · vídeo ${s.fpsVideo} fps\n` +
    `vídeo con scroll ${s.fpsVideoDuranteScroll ?? '-'} fps\n` +
    `hueco máx ${s.huecoMaxScrollMs} ms · >100 ms: ${s.huecosMayores100ms}\n` +
    `búsquedas ${s.busquedas15s} · p50 ${s.busquedaP50ms} ms · p95 ${s.busquedaP95ms} ms\n` +
    `sección ${s.seccion} · y ${s.scrollY}` +
    (e.rVFC ? '' : '\n(sin requestVideoFrameCallback)');
}, 500);

// Para las pruebas automáticas
(window as unknown as { __antojoDebug: unknown }).__antojoDebug = { env, stats, reset };

export {};
