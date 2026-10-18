// QA del recorrido (plans/scroll-plan.md). Uso:
//   pnpm qa                       → contra http://localhost:4321 (astro dev --background)
//   pnpm qa https://antojoutiel.com
// Prueba Chrome, Firefox y Brave en escritorio y Chrome en móvil emulado, y comprueba
// los criterios de aceptación P1, P2 y P4 más las interacciones básicas.
import puppeteer from 'puppeteer-core';

const BASE = (process.argv[2] || 'http://localhost:4321').replace(/\/$/, '');
const URL = `${BASE}/?debug=1`;
const BROWSERS = [
  { name: 'Chrome', browser: 'chrome', path: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' },
  { name: 'Firefox', browser: 'firefox', path: '/Applications/Firefox.app/Contents/MacOS/firefox' },
  { name: 'Brave', browser: 'chrome', path: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser' },
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (env, criterion, ok, detail) => results.push({ env, criterion, ok, detail });

async function openPage(b, mobile) {
  const p = await b.newPage();
  if (mobile) {
    await p.emulate({
      viewport: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36',
    });
    await p.emulateCPUThrottling(4);
  } else {
    await p.setViewport({ width: 1440, height: 900 });
  }
  await p.goto(URL, { waitUntil: 'load', timeout: 90000 });
  // deja que la precarga de los vídeos termine
  await p.waitForFunction(() => document.querySelectorAll('.sw-scene video, video[data-walkthrough]').length > 0, { timeout: 60000 }).catch(() => {});
  await sleep(8000);
  return p;
}

const navClick = (p, mobile, id) =>
  mobile
    ? p.evaluate(async (id) => {
        document.querySelector('[data-burger]').click();
        await new Promise((r) => setTimeout(r, 900));
        document.querySelector(`.sheet a[href="#${id}"]`).click();
      }, id)
    : p.evaluate((id) => document.querySelector(`.island__link[href="#${id}"]`).click(), id);

async function run(env, b, mobile) {
  console.log(`· ${env}…`); // tarda ~1 min por entorno
  const p = await openPage(b, mobile);
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));

  // P2 — salto de 2+ secciones: fotogramas de vídeo presentados y huecos
  await navClick(p, mobile, 'nosotros');
  await sleep(5000);
  await p.evaluate(() => window.__antojoDebug?.reset());
  await navClick(p, mobile, 'ninos');
  await sleep(5000);
  const s = await p.evaluate(() => window.__antojoDebug?.stats());
  if (s) {
    const ok = s.huecosMayores100ms === 0 && (s.fpsVideoDuranteScroll ?? 0) >= 45;
    check(env, 'P2 salto Nosotros→Niños', ok, `vídeo ${s.fpsVideoDuranteScroll} fps · hueco máx ${s.huecoMaxScrollMs} ms · >100ms ${s.huecosMayores100ms}`);
  } else check(env, 'P2 salto Nosotros→Niños', false, 'panel de diagnóstico no disponible');

  // P1 — barrido de scroll: posiciones del recorrido sin ninguna tarjeta visible
  const sweep = await p.evaluate(async () => {
    const world = document.getElementById('world');
    const end = world.getBoundingClientRect().height + scrollY - innerHeight;
    const cards = () => [...document.querySelectorAll('.sw-copy, [data-card]')];
    let empty = 0, n = 0;
    for (let y = 0; y < end; y += 10) {
      scrollTo(0, y);
      for (let k = 0; k < 8; k++) await new Promise((r) => requestAnimationFrame(r));
      n++;
      const visible = cards().some((c) => {
        const r = c.getBoundingClientRect();
        return +getComputedStyle(c).opacity > 0.5 && getComputedStyle(c).visibility !== 'hidden' && r.bottom > 0 && r.top < innerHeight;
      });
      if (!visible) empty++;
    }
    return { empty, n };
  });
  check(env, 'P1 siempre hay tarjeta', sweep.empty === 0, `${sweep.empty} de ${sweep.n} posiciones sin tarjeta`);

  // P4 — el vídeo cubre toda la pantalla
  const cover = await p.evaluate(() => {
    scrollTo(0, 0);
    // el medio visible: el vídeo de la escena de arriba (o el lienzo/vídeo único)
    const top = [...document.querySelectorAll('.sw-scene')].find((s) => s.style.zIndex === '120');
    const el = document.querySelector('video[data-walkthrough], canvas[data-walkthrough]') || top?.querySelector('video') || top?.querySelector('img');
    const v = el?.getBoundingClientRect();
    if (!v) return null;
    return { top: Math.round(v.top), bottom: Math.round(v.bottom), left: Math.round(v.left), right: Math.round(v.right), vh: innerHeight, vw: innerWidth };
  });
  const covers = cover && cover.top <= 0 && cover.bottom >= cover.vh && cover.left <= 0 && cover.right >= cover.vw;
  check(env, 'P4 vídeo a pantalla completa', !!covers, cover ? `vídeo ${cover.top}→${cover.bottom} de ${cover.vh}px` : 'sin vídeo');

  // Interacciones: carta y etiquetas de eventos (clic real)
  await navClick(p, mobile, 'carta');
  await sleep(7000);
  const btn = await p.evaluate(() => {
    const r = document.querySelector('[data-open-carta]')?.getBoundingClientRect();
    return r ? { x: r.x + r.width / 2, y: r.y + r.height / 2 } : null;
  });
  if (btn) {
    if (mobile) await p.touchscreen.tap(btn.x, btn.y); else await p.mouse.click(btn.x, btn.y);
    await sleep(1500);
  }
  // espera a que la imagen de la carta (1 MB) termine de cargar
  const carta = await p
    .waitForFunction(() => { const d = document.querySelector('[data-carta]'); return d?.open && d.querySelector('img').naturalWidth > 0; }, { timeout: 8000 })
    .then(() => true, () => false);
  await p.evaluate(() => document.querySelector('[data-carta]')?.close());
  check(env, 'Carta se abre con imagen', !!carta, '');
  check(env, 'Sin errores de JavaScript', errors.length === 0, errors.slice(0, 2).join(' | '));
  await p.close();
}

for (const def of BROWSERS) {
  let b;
  try {
    b = await puppeteer.launch({ browser: def.browser, executablePath: def.path, headless: true });
  } catch (e) {
    check(def.name, 'Arranque del navegador', false, e.message.split('\n')[0]);
    continue;
  }
  try {
    await run(`${def.name} escritorio`, b, false);
    if (def.name === 'Chrome') await run('Chrome móvil (emulado)', b, true);
  } catch (e) {
    check(def.name, 'Ejecución', false, e.message.split('\n')[0]);
  }
  await b.close();
}

const pad = (s, n) => String(s).padEnd(n);
console.log(`\nQA ${BASE}\n`);
for (const r of results) console.log(`${r.ok ? '✅' : '❌'} ${pad(r.env, 24)} ${pad(r.criterion, 28)} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} en verde`);
process.exitCode = failed ? 1 : 0;
