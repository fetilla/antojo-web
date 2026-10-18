import { mountScrollWorld } from './scrub-engine.js';
import { secciones } from '../data/content';
import { url } from '../lib/url';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const world = document.getElementById('world');
const ids = secciones.map((s) => s.id);

// ---- Recorrido en vídeo ----
const api = world
  ? mountScrollWorld(world, {
      nav: false,
      atmosphere: false,
      hint: 'Desliza para entrar',
      diveScroll: 1.4,
      crossfade: 0.08,
      copyFade: 0.18,
      onSection: markSection,
      sections: secciones.map((s) => ({
        id: s.id,
        label: s.label,
        accent: s.accent,
        eyebrow: s.eyebrow,
        title: s.title,
        body: s.body,
        scroll: s.scroll,
        linger: s.linger,
        cta: 'cta' in s ? s.cta : undefined,
        clip: url(`/video/${s.clip}.mp4`),
        clipMobile: url(`/video/${s.clip}-m.mp4`),
        still: url(`/posters/${s.clip}.jpg`),
        stillMobile: url(`/posters/${s.clip}-m.jpg`),
      })),
      connectors: secciones.slice(1).map(() => null),
    })
  : null;

if (world) {
  const copies = world.querySelectorAll<HTMLElement>('.sw-copy');

  copies.forEach((copy, i) => {
    copy.id = `copy-${ids[i]}`;
    // Contenido interactivo de cada sección
    const tpl = document.querySelector<HTMLTemplateElement>(`template[data-extra="${ids[i]}"]`);
    if (tpl) {
      const cta = copy.querySelector('.sw-copy__cta');
      copy.insertBefore(tpl.content.cloneNode(true), cta);
    }
    // Los enlaces externos del motor se abren en otra pestaña
    copy.querySelectorAll<HTMLAnchorElement>('a[href^="http"]').forEach((a) => {
      a.target = '_blank';
      a.rel = 'noopener';
    });
  });

  // El título del inicio es el h1 de la página
  const firstTitle = copies[0]?.querySelector('h2');
  if (firstTitle) {
    const h1 = document.createElement('h1');
    h1.className = firstTitle.className;
    h1.textContent = firstTitle.textContent;
    firstTitle.replaceWith(h1);
  }
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
    if (api) api.jumpTo(0, { top: 0 });
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
