import { mountWalkthrough } from './walkthrough';
import { FrameRenderer, VideoRenderer, type Renderer } from './renderers';
import { recorrido, secciones } from '../data/content';
import { url } from '../lib/url';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const touch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
// Móvil = táctil o pantalla estrecha: secuencia de imágenes vertical en <canvas>
const mobile = touch || window.matchMedia('(max-width: 860px)').matches;
const world = document.getElementById('world');
const ids = secciones.map((s) => s.id);

// ---- Recorrido ----
let api: ReturnType<typeof mountWalkthrough> | null = null;
if (world) {
  const stage = world.querySelector<HTMLElement>('[data-stage]')!;
  const poster = world.querySelector<HTMLImageElement>('[data-poster]')!;
  const renderer: Renderer = mobile
    ? new FrameRenderer(
        (i) => url(recorrido.movil.ruta(i)),
        recorrido.movil.frames,
        recorrido.fps / recorrido.movil.fps,
        secciones.map((s) => Math.round(s.frame / (recorrido.fps / recorrido.movil.fps))),
        poster,
      )
    : new VideoRenderer(url(recorrido.video), recorrido.fps, recorrido.frames, poster);
  stage.appendChild(renderer.el);

  api = mountWalkthrough({
    sections: secciones.map((s) => ({ id: s.id, frame: s.frame, scroll: s.scroll, travel: s.travel })),
    renderer,
    cards: [...world.querySelectorAll<HTMLElement>('[data-card]')],
    track: world.querySelector<HTMLElement>('[data-track]')!,
    progress: world.querySelector<HTMLElement>('[data-progress]') ?? undefined,
    hint: world.querySelector<HTMLElement>('[data-hint]') ?? undefined,
    touch,
    reduce,
    onSection: (k) => {
      markSection(k);
      // con movimiento reducido no hay vídeo: se muestra la imagen de la parada
      if (reduce) {
        const base = `/posters/${secciones[k].poster}${mobile ? '-m' : ''}.jpg`;
        poster.src = url(base);
        poster.parentElement?.querySelector('source')?.setAttribute('srcset', url(base));
      }
    },
  });

  // "Leer más" en las tarjetas compactas de móvil (solo si el texto no cabe)
  world.querySelectorAll<HTMLElement>('[data-clamp]').forEach((body) => {
    const more = body.parentElement?.querySelector<HTMLButtonElement>('[data-more]');
    const p = body.querySelector('p');
    if (!more || !p) return;
    const update = () => {
      if (body.classList.contains('is-open')) return;
      more.hidden = p.scrollHeight <= p.clientHeight + 1;
    };
    more.addEventListener('click', () => {
      const open = body.classList.toggle('is-open');
      more.textContent = open ? 'Leer menos' : 'Leer más';
    });
    document.fonts.ready.then(update);
    window.addEventListener('resize', update);
  });
}

// ---- Navegación ----
function markSection(index: number) {
  setCurrent(ids[index]);
}

function setCurrent(id: string) {
  document.querySelectorAll<HTMLAnchorElement>('[data-section-link]').forEach((a) => {
    const match = a.dataset.sectionLink === id && id !== 'inicio' && !a.classList.contains('btn');
    if (match) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  });
}

function goTo(id: string) {
  const behavior: ScrollBehavior = reduce ? 'auto' : 'smooth';
  if (id === 'inicio') {
    if (api) api.jumpTo(0);
    else window.scrollTo({ top: 0, behavior });
    return;
  }
  const index = ids.indexOf(id as (typeof ids)[number]);
  if (index >= 0 && api) {
    api.jumpTo(index);
    return;
  }
  document.getElementById(id)?.scrollIntoView({ behavior });
}

document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  const link = target.closest<HTMLAnchorElement>('a[href^="#"]');
  if (!link) return;
  const id = link.getAttribute('href')!.slice(1);

  // "Ver la carta" abre la carta; el enlace del menú "Carta" navega a su sección
  if (link.hasAttribute('data-open-carta') || (id === 'carta' && !link.dataset.sectionLink)) {
    event.preventDefault();
    openCarta(link);
    return;
  }
  if (id === 'contenido') return;
  event.preventDefault();
  closeMenu();
  goTo(id);
  history.replaceState(null, '', id === 'inicio' ? location.pathname : `#${id}`);
});

if (location.hash) {
  const id = location.hash.slice(1);
  window.addEventListener('load', () => goTo(id), { once: true });
}

// ---- Menú móvil ----
const burger = document.querySelector<HTMLButtonElement>('[data-burger]');
const sheet = document.querySelector<HTMLElement>('[data-sheet]');

function openMenu() {
  if (!burger || !sheet) return;
  sheet.hidden = false;
  requestAnimationFrame(() => sheet.classList.add('is-open'));
  burger.setAttribute('aria-expanded', 'true');
  burger.querySelector('.visually-hidden')!.textContent = 'Cerrar menú';
  document.documentElement.style.overflow = 'hidden';
}

function closeMenu() {
  if (!burger || !sheet || sheet.hidden) return;
  sheet.classList.remove('is-open');
  burger.setAttribute('aria-expanded', 'false');
  burger.querySelector('.visually-hidden')!.textContent = 'Abrir menú';
  document.documentElement.style.overflow = '';
  window.setTimeout(() => {
    if (!sheet.classList.contains('is-open')) sheet.hidden = true;
  }, reduce ? 0 : 700);
}

burger?.addEventListener('click', () => {
  if (burger.getAttribute('aria-expanded') === 'true') closeMenu();
  else openMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});

// ---- Etiquetas de eventos ----
document.addEventListener('click', (event) => {
  const toggle = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-eventos]');
  if (!toggle) return;
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  toggle.parentElement?.querySelector('[data-eventos-sub]')?.classList.toggle('is-open', open);
});

// ---- Carta ----
const dialog = document.querySelector<HTMLDialogElement>('[data-carta]');
const cartaImg = dialog?.querySelector<HTMLImageElement>('[data-carta-img]');
const zoomBtn = dialog?.querySelector<HTMLButtonElement>('[data-carta-zoom]');
const empty = dialog?.querySelector<HTMLElement>('[data-carta-empty]');
let cartaTrigger: HTMLElement | null = null;

function showEmptyCarta() {
  if (zoomBtn) zoomBtn.hidden = true;
  if (empty) empty.hidden = false;
}

cartaImg?.addEventListener('error', showEmptyCarta);

function openCarta(trigger: HTMLElement) {
  if (!dialog) return;
  cartaTrigger = trigger;
  // La imagen se pide solo al abrir; si aún no existe se muestra el aviso
  if (cartaImg && !cartaImg.getAttribute('src') && cartaImg.dataset.src) {
    cartaImg.src = cartaImg.dataset.src;
  }
  dialog.showModal();
}

dialog?.querySelector('[data-carta-close]')?.addEventListener('click', () => dialog.close());
dialog?.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});
dialog?.addEventListener('close', () => {
  zoomBtn?.setAttribute('aria-pressed', 'false');
  cartaTrigger?.focus();
});
zoomBtn?.addEventListener('click', () => {
  const zoomed = zoomBtn.getAttribute('aria-pressed') === 'true';
  zoomBtn.setAttribute('aria-pressed', String(!zoomed));
});

// ---- Clip en bucle (etiqueta Ahumador) ----
const media = document.querySelector<HTMLDialogElement>('[data-media]');
const mediaVideo = media?.querySelector<HTMLVideoElement>('[data-media-video]');
let mediaTrigger: HTMLElement | null = null;

document.addEventListener('click', (event) => {
  const trigger = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-open-media]');
  if (!trigger || !media || !mediaVideo) return;
  mediaTrigger = trigger;
  media.querySelector('[data-media-title]')!.textContent = trigger.dataset.mediaTitle ?? '';
  mediaVideo.setAttribute('aria-label', trigger.dataset.mediaAlt ?? '');
  mediaVideo.poster = trigger.dataset.mediaPoster ?? '';
  if (mediaVideo.getAttribute('src') !== trigger.dataset.openMedia) mediaVideo.src = trigger.dataset.openMedia!;
  media.showModal();
  mediaVideo.currentTime = 0;
  // Con movimiento reducido no arranca solo: se muestran los controles
  if (reduce) mediaVideo.controls = true;
  else mediaVideo.play().catch(() => {});
});

media?.querySelector('[data-media-close]')?.addEventListener('click', () => media.close());
media?.addEventListener('click', (event) => {
  if (event.target === media) media.close();
});
media?.addEventListener('close', () => {
  mediaVideo?.pause();
  mediaTrigger?.focus();
});

// ---- Revelados al entrar en pantalla ----
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.2 },
);
document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

// Frase destacada: cada palabra se ilumina en orden al cruzar la línea de activación
const words = Array.from(document.querySelectorAll<HTMLElement>('[data-word]'));
const wordObserver = new IntersectionObserver(
  (entries) => {
    const lit = entries
      .filter((e) => e.isIntersecting)
      .map((e) => e.target as HTMLElement)
      .sort((a, b) => words.indexOf(a) - words.indexOf(b));
    lit.forEach((word, k) => {
      window.setTimeout(() => word.classList.add('is-lit'), reduce ? 0 : k * 90);
      wordObserver.unobserve(word);
    });
  },
  { rootMargin: '0px 0px -40% 0px', threshold: 1 },
);
words.forEach((w) => wordObserver.observe(w));

// Al salir del recorrido se ocultan la ruta y la pista de scroll, y se marca Contacto
const after = document.querySelector('.tagline');
if (after && world) {
  new IntersectionObserver(
    ([entry]) => {
      const past = entry.isIntersecting || entry.boundingClientRect.top < 0;
      world.classList.toggle('is-past', past);
    },
    { threshold: 0 },
  ).observe(after);
}

const contactSection = document.getElementById('contacto');
if (contactSection) {
  new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) setCurrent('contacto');
    },
    { threshold: 0.4 },
  ).observe(contactSection);
}

// Panel de diagnóstico: antojoutiel.com/?debug=1
if (new URLSearchParams(location.search).has('debug')) import('./debug');
