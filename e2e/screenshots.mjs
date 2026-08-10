#!/usr/bin/env node
/**
 * Inventario visual automatizado de la Plataforma SODEGA / MIDAGRI.
 *
 *   npm run screenshots                    # recorrido completo
 *   npm run screenshots -- --temas=naturaleza-viva
 *   npm run screenshots -- --viewports=desktop,mobile
 *   npm run screenshots -- --perfiles=administrador-general
 *   npm run screenshots -- --fase=principal|responsive|perfiles
 *   npm run screenshots -- --base-url=http://localhost:4200 --modo=serve
 *   npm run screenshots -- --sin-build                 # reutiliza dist/
 *
 * El script NO toca la lógica de negocio: sólo navega, captura y audita.
 */

import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  TEMAS, VIEWPORTS, PERFILES, VISTAS, ESTADOS_LAYOUT, ESCENARIOS,
  MODALES_FEEDBACK, TOASTS, RUTAS_POR_PERFIL, USUARIO_QA, CLAVE_QA,
} from './lib/plan.mjs';
import { AUDIT_FN, METRICAS_FN } from './lib/audit.mjs';
import { levantarApp } from './lib/server.mjs';
import { escribirReporte } from './lib/report.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '..');

/* ===================== CLI ===================== */
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v === undefined ? true : v];
  }),
);

const BASE_URL = args['base-url'] || 'http://127.0.0.1:4321';
const SALIDA = resolve(RAIZ, args.salida || 'capturas');
const MODO = args.modo || 'static';
const CONSTRUIR = !args['sin-build'];
const FASES = String(args.fase || 'principal,estados,responsive,perfiles').split(',');
const TEMAS_SEL = args.temas ? TEMAS.filter((t) => String(args.temas).split(',').includes(t.id)) : TEMAS;
const VIEWPORTS_SEL = args.viewports ? VIEWPORTS.filter((v) => String(args.viewports).split(',').includes(v.slug)) : VIEWPORTS;
const PERFILES_SEL = args.perfiles ? PERFILES.filter((p) => String(args.perfiles).split(',').includes(p.slug)) : PERFILES;
const SOLO_VISTAS = args.vistas ? String(args.vistas).split(',') : null;
/** `--sin-extras` omite login, modales de feedback, toasts y estados de layout. */
const SIN_EXTRAS = !!args['sin-extras'];
/** `--solo-extras` captura únicamente esos extras (útil para partir la corrida). */
const SOLO_EXTRAS = !!args['solo-extras'];
/** `--fuentes-offline` sirve DM Sans / IBM Plex Mono desde node_modules. */
const FUENTES_OFFLINE = !!args['fuentes-offline'];

const log = (...m) => console.log(...m);

/* ===================== Estado acumulado ===================== */
const registro = {
  generado: new Date().toISOString(),
  baseUrl: BASE_URL,
  capturas: [],   // { archivo, titulo, tipo, tema, viewport, perfil, ruta, metricas }
  hallazgos: [],  // { ...hallazgo, contexto }
  consola: [],    // { nivel, texto, contexto }
  fallos: [],     // { contexto, error }
};

const contadores = new Map();
function siguienteIndice(dir) {
  const n = (contadores.get(dir) ?? 0) + 1;
  contadores.set(dir, n);
  return String(n).padStart(2, '0');
}

/**
 * Carga el reporte de una corrida previa para poder ejecutar el recorrido por
 * partes (`--fusionar`) sin reiniciar la numeración ni perder los hallazgos.
 */
async function cargarPrevio(jsonPath) {
  if (!args.fusionar || !existsSync(jsonPath)) return;
  try {
    const previo = JSON.parse(await readFile(jsonPath, 'utf8'));
    registro.capturas = previo.capturas ?? [];
    registro.hallazgos = previo.hallazgos ?? [];
    registro.consola = previo.consola ?? [];
    registro.fallos = previo.fallos ?? [];
    registro.duracionSegundos = previo.duracionSegundos ?? 0;
    for (const c of registro.capturas) {
      const partes = c.archivo.split('/');
      const dir = partes.slice(0, -1).join('/');
      const n = parseInt(partes.at(-1), 10);
      if (Number.isFinite(n)) contadores.set(dir, Math.max(contadores.get(dir) ?? 0, n));
    }
    log(`→ Fusionando con una corrida previa (${registro.capturas.length} capturas).`);
  } catch {
    log('→ El reporte previo no se pudo leer; se genera uno nuevo.');
  }
}

/* ===================== Utilidades de página ===================== */

/** Espera a que la vista esté estable: red, spinners, animaciones y fuentes. */
async function esperarEstable(page, selectorExtra) {
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  if (selectorExtra) await page.waitForSelector(selectorExtra, { timeout: 8000 }).catch(() => {});

  // Indicadores de carga fuera de pantalla
  await page
    .waitForFunction(
      () => !document.querySelector('.animate-spin, [role=progressbar], [aria-busy=true]'),
      null,
      { timeout: 6000 },
    )
    .catch(() => {});

  // Fuentes e iconos
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  // Fin de animaciones de entrada (animate-overlay-in / animate-modal-in ≈ 200ms)
  await page
    .waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'), null, { timeout: 4000 })
    .catch(() => {});
  await page.waitForTimeout(250);
}

/** Captura full-page + auditoría + métricas. */
async function capturar(page, { dir, nombre, titulo, tipo, meta }) {
  const carpeta = join(SALIDA, dir);
  await mkdir(carpeta, { recursive: true });
  const archivo = `${siguienteIndice(dir)}-${nombre}.png`;
  const ruta = join(carpeta, archivo);

  await page.screenshot({ path: ruta, fullPage: true, animations: 'disabled' });

  const metricas = await page.evaluate(METRICAS_FN).catch(() => ({}));
  const hallazgos = await page.evaluate(AUDIT_FN).catch(() => []);

  const contexto = `${dir}/${archivo}`;
  registro.capturas.push({ archivo: contexto, titulo, tipo, ruta: meta?.ruta ?? '', ...meta, metricas });
  for (const h of hallazgos) registro.hallazgos.push({ ...h, contexto, titulo, ...meta });

  log(`   · ${contexto}${hallazgos.length ? `  (${hallazgos.length} hallazgo/s)` : ''}`);
  return contexto;
}

/* ===================== Fuentes offline ===================== */
/**
 * `index.html` carga DM Sans e IBM Plex Mono desde Google Fonts. En entornos
 * sin salida a internet (CI, contenedores) esa petición falla y las capturas
 * salen con una tipografía de reemplazo, lo que altera métricas de texto y
 * dispara falsos positivos de truncado.
 *
 * Con `--fuentes-offline` se interceptan esas peticiones y se sirven las
 * mismas familias desde los paquetes `@fontsource/*` instalados localmente:
 *   npm i -D @fontsource/dm-sans @fontsource/ibm-plex-mono
 */
const FUENTES = [
  { familia: 'DM Sans', paquete: '@fontsource/dm-sans', prefijo: 'dm-sans-latin', pesos: [400, 500, 600, 700] },
  { familia: 'IBM Plex Mono', paquete: '@fontsource/ibm-plex-mono', prefijo: 'ibm-plex-mono-latin', pesos: [400, 500] },
];

function archivosDeFuentes() {
  const mapa = new Map();
  const reglas = [];
  for (const f of FUENTES) {
    for (const peso of f.pesos) {
      const nombre = `${f.prefijo}-${peso}-normal.woff2`;
      const ruta = join(RAIZ, 'node_modules', f.paquete, 'files', nombre);
      if (!existsSync(ruta)) continue;
      mapa.set(nombre, ruta);
      reglas.push(
        `@font-face{font-family:'${f.familia}';font-style:normal;font-weight:${peso};` +
          `font-display:swap;src:url('/__fuentes/${nombre}') format('woff2');}`,
      );
    }
  }
  return { mapa, css: reglas.join('\n') };
}

async function instalarFuentesOffline(ctx) {
  const { mapa, css } = archivosDeFuentes();
  if (!mapa.size) return false;

  await ctx.route(/fonts\.googleapis\.com/, (route) =>
    route.fulfill({ status: 200, contentType: 'text/css; charset=utf-8', body: css }),
  );
  await ctx.route('**/__fuentes/*', async (route) => {
    const nombre = route.request().url().split('/').pop().split('?')[0];
    const ruta = mapa.get(nombre);
    if (!ruta) return route.fulfill({ status: 404, body: '' });
    route.fulfill({ status: 200, contentType: 'font/woff2', body: await readFile(ruta) });
  });
  await ctx.route(/fonts\.gstatic\.com/, (route) => route.fulfill({ status: 404, body: '' }));
  return true;
}

/** Nuevo contexto de navegador con tema, sidebar y sesión preconfigurados. */
async function nuevoContexto(browser, { viewport, tema, sidebarColapsado = false, sesion = null }) {
  const ctx = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.dsf,
    hasTouch: !!viewport.touch,
    isMobile: !!viewport.touch && viewport.width < 500,
    locale: 'es-PE',
    timezoneId: 'America/Lima',
    colorScheme: 'light',
    reducedMotion: 'reduce',
  });

  await ctx.addInitScript(
    ([temaId, colapsado, ses]) => {
      try {
        localStorage.setItem('sodega.tema', temaId);
        sessionStorage.setItem('midagri.sidebar.collapsed', colapsado ? '1' : '0');
        if (ses) localStorage.setItem('sodega.session', ses);
      } catch { /* almacenamiento no disponible */ }
    },
    [tema.id, sidebarColapsado, sesion],
  );

  if (FUENTES_OFFLINE) await instalarFuentesOffline(ctx);
  return ctx;
}

/** Engancha la captura de errores de consola y de página. */
function escucharConsola(page, contextoRef) {
  page.on('console', (msg) => {
    const nivel = msg.type();
    if (nivel !== 'error' && nivel !== 'warning') return;
    const texto = msg.text();
    if (/favicon|DevTools|Download the Angular DevTools/i.test(texto)) return;
    registro.consola.push({ nivel, texto: texto.slice(0, 400), contexto: contextoRef.valor });
  });
  page.on('pageerror', (err) => {
    registro.consola.push({ nivel: 'error', texto: String(err).slice(0, 400), contexto: contextoRef.valor });
  });
}

/* ===================== Autenticación ===================== */

/**
 * Inicia sesión por la UI con el perfil indicado y devuelve el storageState.
 * El prototipo autentica en memoria: `ccandelaria` es la cuenta master que
 * puede elegir con qué perfil operar la sesión.
 */
async function iniciarSesion(page, perfilNombre) {
  await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[formcontrolname="usuario"]', { timeout: 15000 });
  await page.fill('input[formcontrolname="usuario"]', USUARIO_QA);
  await page.fill('input[type="password"]', CLAVE_QA);
  await page.locator('form button:has-text("Ingresar al sistema")').first().click();

  // La cuenta master abre el diálogo de selección de perfil/unidad. Desde la
  // migración a Angular Material el desplegable es un `mat-select`: se abre con
  // un click y la opción vive en un overlay aparte.
  // `isVisible()` no espera: hay que usar waitFor para dar tiempo al overlay.
  const desplegable = page.locator('mat-dialog-container mat-select').first();
  const hayModal = await desplegable
    .waitFor({ state: 'visible', timeout: 6000 })
    .then(() => true)
    .catch(() => false);

  if (hayModal) {
    await desplegable.click();
    const opcion = page.locator(`mat-option:has-text("${perfilNombre}")`).first();
    const elegida = await opcion
      .waitFor({ state: 'visible', timeout: 3000 })
      .then(() => true)
      .catch(() => false);
    await (elegida ? opcion : page.locator('mat-option').first()).click();
    // El botón del diálogo comparte texto con el del formulario (has-text ignora
    // mayúsculas): se toma el último, que es el del overlay.
    await page.locator('button:has-text("Ingresar al Sistema")').last().click();
  }

  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await esperarEstable(page);
}

/* ===================== Disparadores in-app ===================== */

/**
 * Invoca un servicio Angular a través de las herramientas de depuración
 * globales (`window.ng`, disponibles en builds de desarrollo). Se usa sólo para
 * *mostrar* modales y toasts de feedback; no altera datos ni reglas.
 */
async function invocarServicio(page, { selector, propiedad, metodo, args }) {
  return page.evaluate(
    ([sel, prop, met, params]) => {
      const ng = window.ng;
      const host = document.querySelector(sel);
      if (!ng || !host) return false;
      const cmp = ng.getComponent(host);
      const servicio = cmp?.[prop];
      if (!servicio || typeof servicio[met] !== 'function') return false;
      servicio[met](...params);
      ng.applyChanges?.(cmp);
      return true;
    },
    [selector, propiedad, metodo, args],
  );
}

/**
 * Detecta un overlay modal real y devuelve una "firma" con su texto (o null).
 *
 * No basta con buscar `.fixed.inset-0`: los controles flotantes del mapa y
 * otros adornos también son `fixed`. Se exige `role=dialog` o un panel fijo con
 * z-index alto que cubra prácticamente todo el viewport.
 */
const DETECTOR_OVERLAY = /* js */ `(() => {
  const vw = innerWidth, vh = innerHeight;
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.1) continue;
    const r = el.getBoundingClientRect();
    if (el.getAttribute('role') === 'dialog') {
      if (r.width > 120 && r.height > 60) return (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 140) || 'dialog';
      continue;
    }
    if (cs.position !== 'fixed') continue;
    if ((parseInt(cs.zIndex, 10) || 0) < 30) continue;
    if (r.width >= vw * 0.9 && r.height >= vh * 0.9) {
      return (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 140) || 'overlay';
    }
  }
  return null;
})()`;

async function firmaOverlay(page) {
  return page.evaluate(DETECTOR_OVERLAY).catch(() => null);
}

/** Espera hasta `ms` a que aparezca un overlay; devuelve su firma o null. */
async function esperarOverlay(page, ms = 1500) {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    const f = await firmaOverlay(page);
    if (f) return f;
    await page.waitForTimeout(150);
  }
  return null;
}

/** Cierra cualquier overlay abierto. */
async function cerrarOverlays(page) {
  for (let i = 0; i < 3; i++) {
    if (!(await firmaOverlay(page))) break;
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(150);
    const cerrar = page.locator('button[aria-label="Cerrar"], button:has-text("Cancelar")').first();
    if (await cerrar.isVisible().catch(() => false)) await cerrar.click({ timeout: 1500 }).catch(() => {});
    await page.waitForTimeout(200);
  }
}

/**
 * Descubrimiento genérico de modales: recorre los disparadores plausibles de la
 * vista, comprueba si aparece un overlay y lo fotografía.
 */
const PATRON_DISPARADORES =
  'button:has-text("Nuevo"), button:has-text("Agregar"), button:has-text("Añadir"), ' +
  'button:has-text("Editar"), button:has-text("Eliminar"), button:has-text("Sustento"), ' +
  'button:has-text("Reasignar"), button:has-text("Opciones"), button:has-text("Columnas"), ' +
  'button:has-text("Filtros"), button:has-text("Ver"), button:has-text("Detalle"), ' +
  'button:has-text("Importar"), button:has-text("Exportar"), button[title], button[aria-label]';

async function descubrirModales(page, { dir, base, meta, maximo = 5 }) {
  const disparadores = page.locator(PATRON_DISPARADORES);
  const total = Math.min(await disparadores.count().catch(() => 0), 24);
  const vistos = new Set();
  const firmasVistas = new Set();
  let capturados = 0;

  for (let i = 0; i < total && capturados < maximo; i++) {
    const btn = disparadores.nth(i);
    if (!(await btn.isVisible().catch(() => false))) continue;
    if (await btn.isDisabled().catch(() => false)) continue;

    const etiqueta = (
      (await btn.getAttribute('aria-label').catch(() => null)) ||
      (await btn.getAttribute('title').catch(() => null)) ||
      (await btn.innerText().catch(() => '')) ||
      ''
    ).trim().replace(/\s+/g, ' ').slice(0, 40);
    if (!etiqueta || vistos.has(etiqueta)) continue;
    vistos.add(etiqueta);
    // Controles de chrome y del mapa: no abren modales.
    if (/cerrar|salir|colapsar|expandir|apariencia|acercar|alejar|centrar|restablecer|ubicaci|zoom|anterior|siguiente|p[áa]gina/i.test(etiqueta)) continue;

    const antes = page.url();
    await btn.click({ timeout: 2500 }).catch(() => {});
    await page.waitForTimeout(350);

    if (page.url() !== antes) {
      await page.goBack().catch(() => {});
      await esperarEstable(page);
      continue;
    }

    const firma = await esperarOverlay(page, 1200);
    if (firma && !firmasVistas.has(firma)) {
      firmasVistas.add(firma);
      const slug = etiqueta
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 30);
      await capturar(page, {
        dir,
        nombre: `${base}-modal-${slug || i}`,
        titulo: `${meta.titulo} · Modal "${etiqueta}"`,
        tipo: 'modal',
        meta,
      });
      capturados++;
    }
    if (firma) await cerrarOverlays(page);
    await esperarEstable(page);
  }
  return capturados;
}

/**
 * Ejecuta una lista de pasos declarativos.
 * Pasos: click · fill · select · check · press · esperar · esperarSelector.
 * Un paso que no encuentra su objetivo no aborta el escenario: se registra y
 * el recorrido continúa (requisito de la evidencia: nunca detener el proceso).
 */
async function ejecutarPasos(page, pasos = [], contexto = '') {
  for (const paso of pasos) {
    try {
      if (paso.click) await page.locator(paso.click).first().click({ timeout: 3000 });
      if (paso.fill !== undefined && paso.fill) {
        await page.locator(paso.fill).first().fill(String(paso.valor ?? ''), { timeout: 3000 });
      }
      if (paso.select) await page.locator(paso.select).first().selectOption(paso.valor, { timeout: 3000 });
      if (paso.check) await page.locator(paso.check).first().check({ timeout: 3000 });
      if (paso.press) await page.keyboard.press(paso.press);
      if (paso.esperarSelector) await page.waitForSelector(paso.esperarSelector, { timeout: 5000 });
      if (paso.esperar) await page.waitForTimeout(paso.esperar);
    } catch (e) {
      if (contexto) {
        registro.fallos.push({
          contexto,
          error: `Paso omitido (${Object.keys(paso).filter((k) => k !== 'valor').join('/')}): ${String(e).slice(0, 160)}`,
        });
      }
    }
    await page.waitForTimeout(200);
  }
}

/* ===================== Fases ===================== */

/** Fase 1 — recorrido exhaustivo (perfil principal, un viewport, un tema). */
async function faseCompleta(browser, { tema, viewport }) {
  const dir = join(tema.slug, viewport.slug);
  const meta = { tema: tema.nombre, viewport: viewport.nombre, perfil: 'Administrador General' };
  const refCtx = { valor: dir };

  log(`\n▸ ${tema.nombre} · ${viewport.nombre} · recorrido completo`);

  /* --- Vistas públicas (login y sus modales) --- */
  if (!SIN_EXTRAS) {
    const ctx = await nuevoContexto(browser, { viewport, tema });
    const page = await ctx.newPage();
    escucharConsola(page, refCtx);
    const login = VISTAS.find((v) => v.publica);

    await page.goto(BASE_URL + login.ruta, { waitUntil: 'domcontentloaded' });
    await esperarEstable(page, login.espera);
    refCtx.valor = `${dir} · ${login.titulo}`;
    await capturar(page, { dir, nombre: login.nombre, titulo: login.titulo, tipo: login.tipo, meta: { ...meta, ruta: login.ruta } });

    for (const accion of login.acciones ?? []) {
      await page.goto(BASE_URL + login.ruta, { waitUntil: 'domcontentloaded' });
      await esperarEstable(page, login.espera);
      if (accion.click) await page.locator(accion.click).first().click({ timeout: 3000 }).catch(() => {});
      await ejecutarPasos(page, accion.luego);
      await page.waitForTimeout(350);
      await capturar(page, { dir, nombre: accion.nombre, titulo: accion.titulo, tipo: accion.tipo, meta: { ...meta, ruta: login.ruta } });
    }
    await ctx.close();
  }

  /* --- Sesión autenticada --- */
  const ctx = await nuevoContexto(browser, { viewport, tema });
  const page = await ctx.newPage();
  escucharConsola(page, refCtx);
  await iniciarSesion(page, 'Administrador General');

  const vistasPrivadas = SOLO_EXTRAS
    ? []
    : VISTAS.filter((v) => !v.publica).filter((v) => !SOLO_VISTAS || SOLO_VISTAS.includes(v.nombre));

  for (const vista of vistasPrivadas) {
    refCtx.valor = `${dir} · ${vista.titulo}`;
    try {
      await page.goto(BASE_URL + vista.ruta, { waitUntil: 'domcontentloaded' });
      await esperarEstable(page, vista.espera);
      await capturar(page, { dir, nombre: vista.nombre, titulo: vista.titulo, tipo: vista.tipo, meta: { ...meta, ruta: vista.ruta } });

      for (const accion of vista.acciones ?? []) {
        await ejecutarPasos(page, [{ click: accion.click }, ...(accion.luego ?? [])]);
        await page.waitForTimeout(300);
        await capturar(page, { dir, nombre: accion.nombre, titulo: accion.titulo, tipo: accion.tipo, meta: { ...meta, ruta: vista.ruta } });
        await cerrarOverlays(page);
        await page.goto(BASE_URL + vista.ruta, { waitUntil: 'domcontentloaded' });
        await esperarEstable(page, vista.espera);
      }

      if (['tabla', 'formulario'].includes(vista.tipo)) {
        await descubrirModales(page, { dir, base: vista.nombre, meta: { ...meta, ruta: vista.ruta, titulo: vista.titulo } });
      }
    } catch (e) {
      registro.fallos.push({ contexto: refCtx.valor, error: String(e).slice(0, 300) });
      log(`   ! fallo en ${vista.ruta}: ${String(e).slice(0, 120)}`);
    }
  }

  /* --- Modales de feedback (ModalService) --- */
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
  await esperarEstable(page);
  for (const m of SIN_EXTRAS ? [] : MODALES_FEEDBACK) {
    refCtx.valor = `${dir} · ${m.titulo}`;
    const metodo = m.tipo === 'vacio' ? 'openInfo' : 'open' + m.tipo[0].toUpperCase() + m.tipo.slice(1);
    const ok = await invocarServicio(page, {
      selector: 'app-feedback-modal', propiedad: 'servicio', metodo, args: m.args,
    }).catch(() => false);
    if (!ok) { log(`   ~ omitido ${m.nombre} (window.ng no disponible)`); continue; }
    await page.waitForTimeout(400);
    await capturar(page, { dir, nombre: m.nombre, titulo: m.titulo, tipo: 'modal', meta: { ...meta, ruta: '/dashboard' } });
    await cerrarOverlays(page);
  }

  /* --- Toasts (ToastService) --- */
  for (const t of SIN_EXTRAS ? [] : TOASTS) {
    refCtx.valor = `${dir} · ${t.titulo}`;
    const ok = await invocarServicio(page, {
      selector: 'app-toast-container', propiedad: 'toastService', metodo: t.tipo, args: t.args,
    }).catch(() => false);
    if (!ok) { log(`   ~ omitido ${t.nombre} (window.ng no disponible)`); continue; }
    await page.waitForTimeout(400);
    await capturar(page, { dir, nombre: t.nombre, titulo: t.titulo, tipo: 'componente', meta: { ...meta, ruta: '/dashboard' } });
    await page.waitForTimeout(1200);
  }

  await ctx.close();

  /* --- Estados de layout (sidebar, panel de apariencia) --- */
  for (const estado of SIN_EXTRAS ? [] : ESTADOS_LAYOUT) {
    const c = await nuevoContexto(browser, { viewport, tema, sidebarColapsado: !!estado.sidebarColapsado });
    const p = await c.newPage();
    escucharConsola(p, refCtx);
    refCtx.valor = `${dir} · ${estado.titulo}`;
    try {
      await iniciarSesion(p, 'Administrador General');
      await p.goto(BASE_URL + estado.ruta, { waitUntil: 'domcontentloaded' });
      await esperarEstable(p);
      for (const sel of estado.clicks ?? []) {
        await p.locator(sel).first().click({ timeout: 3000 }).catch(() => {});
        await p.waitForTimeout(350);
      }
      await capturar(p, { dir, nombre: estado.nombre, titulo: estado.titulo, tipo: 'componente', meta: { ...meta, ruta: estado.ruta } });
    } catch (e) {
      registro.fallos.push({ contexto: refCtx.valor, error: String(e).slice(0, 300) });
    }
    await c.close();
  }
}

/** Fase 2 — vistas principales en el resto de resoluciones. */
async function faseResponsive(browser, { tema, viewport }) {
  const dir = join(tema.slug, viewport.slug);
  const meta = { tema: tema.nombre, viewport: viewport.nombre, perfil: 'Administrador General' };
  const refCtx = { valor: dir };
  log(`\n▸ ${tema.nombre} · ${viewport.nombre} · vistas principales`);

  const ctx = await nuevoContexto(browser, { viewport, tema });
  const page = await ctx.newPage();
  escucharConsola(page, refCtx);

  const login = VISTAS.find((v) => v.publica);
  await page.goto(BASE_URL + login.ruta, { waitUntil: 'domcontentloaded' });
  await esperarEstable(page, login.espera);
  refCtx.valor = `${dir} · ${login.titulo}`;
  await capturar(page, { dir, nombre: login.nombre, titulo: login.titulo, tipo: login.tipo, meta: { ...meta, ruta: login.ruta } });

  await iniciarSesion(page, 'Administrador General');

  for (const vista of VISTAS.filter((v) => v.principal && !v.publica)) {
    refCtx.valor = `${dir} · ${vista.titulo}`;
    try {
      await page.goto(BASE_URL + vista.ruta, { waitUntil: 'domcontentloaded' });
      await esperarEstable(page, vista.espera);
      await capturar(page, { dir, nombre: vista.nombre, titulo: vista.titulo, tipo: vista.tipo, meta: { ...meta, ruta: vista.ruta } });
    } catch (e) {
      registro.fallos.push({ contexto: refCtx.valor, error: String(e).slice(0, 300) });
    }
  }
  await ctx.close();
}

/**
 * Fase 4 — escenarios de estado: formularios con datos, validaciones,
 * mensajes de éxito y error, paginación, filtros, estados vacíos, calendario
 * y estados de carga.
 */
async function faseEstados(browser, { tema, viewport }) {
  const dir = join(tema.slug, viewport.slug);
  const meta = { tema: tema.nombre, viewport: viewport.nombre, perfil: 'Administrador General' };
  const refCtx = { valor: dir };
  log(`\n▸ ${tema.nombre} · ${viewport.nombre} · escenarios de estado`);

  const ctx = await nuevoContexto(browser, { viewport, tema });
  const page = await ctx.newPage();
  escucharConsola(page, refCtx);
  await iniciarSesion(page, 'Administrador General');

  const lista = SOLO_VISTAS ? ESCENARIOS.filter((e) => SOLO_VISTAS.includes(e.nombre)) : ESCENARIOS;

  for (const esc of lista) {
    refCtx.valor = `${dir} · ${esc.titulo}`;
    try {
      await page.goto(BASE_URL + esc.ruta, { waitUntil: 'domcontentloaded' });
      await esperarEstable(page);
      await ejecutarPasos(page, esc.pasos, refCtx.valor);
      if (!esc.sinEsperar) await esperarEstable(page);
      await capturar(page, {
        dir, nombre: esc.nombre, titulo: esc.titulo, tipo: esc.tipo,
        meta: { ...meta, ruta: esc.ruta },
      });
      await cerrarOverlays(page);
    } catch (e) {
      registro.fallos.push({ contexto: refCtx.valor, error: String(e).slice(0, 300) });
      log(`   ! fallo en ${esc.nombre}: ${String(e).slice(0, 120)}`);
    }
  }

  await ctx.close();
}

/** Fase 3 — recorrido por perfil (menús y rutas visibles según permisos). */
async function fasePerfiles(browser, { tema, viewport }) {
  for (const perfil of PERFILES_SEL) {
    const dir = join('perfiles', perfil.slug);
    const meta = { tema: tema.nombre, viewport: viewport.nombre, perfil: perfil.nombre };
    const refCtx = { valor: dir };
    log(`\n▸ Perfil: ${perfil.nombre}`);

    const ctx = await nuevoContexto(browser, { viewport, tema, sidebarColapsado: false });
    const page = await ctx.newPage();
    escucharConsola(page, refCtx);

    try {
      await iniciarSesion(page, perfil.nombre);
      await capturar(page, {
        dir, nombre: 'dashboard-y-menu', titulo: `${perfil.nombre} · Inicio y menú visible`,
        tipo: 'vista', meta: { ...meta, ruta: '/dashboard' },
      });

      for (const ruta of RUTAS_POR_PERFIL) {
        if (ruta === '/dashboard') continue;
        refCtx.valor = `${dir} · ${ruta}`;
        const nombre = ruta.replace(/^\//, '').replace(/\//g, '-');
        await page.goto(BASE_URL + ruta, { waitUntil: 'domcontentloaded' });
        await esperarEstable(page);
        const urlFinal = new URL(page.url()).pathname;
        const bloqueada = urlFinal !== ruta;
        await capturar(page, {
          dir,
          nombre: bloqueada ? `${nombre}-sin-acceso` : nombre,
          titulo: `${perfil.nombre} · ${ruta}${bloqueada ? ` (redirigido a ${urlFinal})` : ''}`,
          tipo: bloqueada ? 'error' : 'vista',
          meta: { ...meta, ruta },
        });
      }
    } catch (e) {
      registro.fallos.push({ contexto: refCtx.valor, error: String(e).slice(0, 300) });
      log(`   ! fallo con ${perfil.nombre}: ${String(e).slice(0, 140)}`);
    }
    await ctx.close();
  }
}

/* ===================== Main ===================== */
async function main() {
  const inicio = Date.now();
  log('╭──────────────────────────────────────────────╮');
  log('│  Inventario visual · Plataforma SODEGA        │');
  log('╰──────────────────────────────────────────────╯');

  const jsonPath = join(SALIDA, 'reporte', 'hallazgos.json');
  await cargarPrevio(jsonPath);

  const app = await levantarApp({ raiz: RAIZ, baseUrl: BASE_URL, modo: MODO, construir: CONSTRUIR, log });
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu', '--font-render-hinting=none'] });

  try {
    const principal = VIEWPORTS_SEL.find((v) => v.slug === 'desktop') ?? VIEWPORTS_SEL[0];

    if (FASES.includes('principal')) {
      for (const tema of TEMAS_SEL) await faseCompleta(browser, { tema, viewport: principal });
    }
    if (FASES.includes('responsive')) {
      for (const tema of TEMAS_SEL) {
        for (const vp of VIEWPORTS_SEL.filter((v) => v.slug !== principal.slug)) {
          await faseResponsive(browser, { tema, viewport: vp });
        }
      }
    }
    if (FASES.includes('estados')) {
      for (const tema of TEMAS_SEL) await faseEstados(browser, { tema, viewport: principal });
    }
    if (FASES.includes('perfiles')) {
      await fasePerfiles(browser, { tema: TEMAS_SEL[0], viewport: principal });
    }
  } finally {
    await browser.close();
    await app.detener();
  }

  registro.duracionSegundos = (registro.duracionSegundos ?? 0) + Math.round((Date.now() - inicio) / 1000);
  await mkdir(join(SALIDA, 'reporte'), { recursive: true });
  await writeFile(jsonPath, JSON.stringify(registro, null, 2), 'utf8');
  await escribirReporte(registro, SALIDA);

  log(`\n✔ ${registro.capturas.length} capturas · ${registro.hallazgos.length} hallazgos · ${registro.duracionSegundos}s`);
  log(`  Reporte: ${join(SALIDA, 'reporte', 'auditoria-visual.md')}`);
}

main().catch((e) => {
  console.error('\n✖ El recorrido falló:', e);
  process.exit(1);
});
