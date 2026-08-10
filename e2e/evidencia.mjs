#!/usr/bin/env node
/**
 * Documento de evidencia visual (PDF A4) de la Plataforma SODEGA / MIDAGRI.
 *
 *   node e2e/evidencia.mjs                 # usa capturas/ y escribe documentacion/
 *   node e2e/evidencia.mjs --origen=capturas --salida=documentacion
 *   node e2e/evidencia.mjs --sin-optimizar # imágenes a resolución original (PDF pesado)
 *
 * Entrega:
 *   documentacion/capturas/NNN_Nombre.png   · capturas renumeradas
 *   documentacion/evidencia_aplicacion.pdf  · documento imprimible
 *   documentacion/indice.json               · índice del documento
 *   documentacion/rutas_detectadas.json     · (lo genera analizar-codigo.mjs)
 *   documentacion/componentes_detectados.json
 *   documentacion/resumen.json              · totales de la corrida
 */

import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fichaDe } from './lib/descripciones.mjs';
import { servirEstatico } from './lib/server.mjs';
import { ESCENARIOS } from './lib/plan.mjs';

/** Nombres de los escenarios de estado, para clasificarlos en su capítulo. */
const NOMBRES_ESCENARIO = new Set(ESCENARIOS.map((e) => e.nombre));

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '..');
const INICIO = Date.now();

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v === undefined ? true : v];
  }),
);
const ORIGEN = resolve(RAIZ, args.origen || 'capturas');
const SALIDA = resolve(RAIZ, args.salida || 'documentacion');
const DIR_CAPTURAS = join(SALIDA, 'capturas');
const OPTIMIZAR = !args['sin-optimizar'];

/* Ancho objetivo de las imágenes del PDF: A4 útil a ~150 ppp. */
const ANCHO_PDF = 1240;
/* Relación alto/ancho a partir de la cual una captura se parte en varias páginas. */
const RATIO_CORTE = 1.7;

const log = (...m) => console.log(...m);

/* ===================== Capítulos ===================== */

const CAPITULOS = [
  { id: 1, nombre: 'Acceso y estructura de la aplicación' },
  { id: 2, nombre: 'Módulos y vistas del sistema' },
  { id: 3, nombre: 'Modales, alertas y notificaciones' },
  { id: 4, nombre: 'Estados de la interfaz' },
  { id: 5, nombre: 'Diseño responsive' },
  { id: 6, nombre: 'Tema visual alternativo' },
  { id: 7, nombre: 'Recorrido por perfil de usuario' },
];

/** Asigna cada captura a un capítulo según su carpeta, nombre y tipo. */
function capituloDe(c) {
  const { archivo, nombre = '', tipo } = c;
  const base = nombre || archivo.split('/').pop().replace(/^\d+-/, '').replace(/\.png$/, '');

  if (archivo.startsWith('perfiles/')) return 7;

  const esPrincipal = archivo.includes('tema-naturaleza-viva/');
  const esDesktop = archivo.includes('/desktop/');

  if (!esDesktop) return 5;
  if (!esPrincipal) return 6;

  if (/^login|^layout-/.test(base)) return 1;
  if (tipo === 'modal' || /^toast-/.test(base)) return 3;
  if (NOMBRES_ESCENARIO.has(base) || tipo === 'componente') return 4;
  return 2;
}

/* ===================== Utilidades ===================== */

function gitInfo() {
  const run = (cmd) => {
    try {
      return execSync(cmd, { cwd: RAIZ, encoding: 'utf8' }).trim();
    } catch {
      return '(no disponible)';
    }
  };
  return {
    remoto: run('git remote get-url origin'),
    rama: run('git rev-parse --abbrev-ref HEAD'),
    commit: run('git rev-parse HEAD'),
    commitCorto: run('git rev-parse --short HEAD'),
    autor: run('git log -1 --format=%an'),
    fechaCommit: run('git log -1 --format=%ad --date=iso'),
    mensaje: run('git log -1 --format=%s'),
    sucio: run('git status --porcelain').length > 0,
  };
}

const escapar = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function slugArchivo(nombre) {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .split('_')
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : ''))
    .join('_');
}

/* ===================== Optimización de imágenes ===================== */

/**
 * Reescala cada captura a `ANCHO_PDF` y la parte en segmentos verticales
 * cuando es demasiado alta para una página A4. Se hace dentro del navegador
 * con canvas para no añadir dependencias nativas al proyecto.
 *
 * Las imágenes se sirven por HTTP desde el mismo origen que la página: con
 * `file://` el lienzo queda contaminado y `toDataURL()` falla.
 */
async function prepararImagenes(page, entradas, dirTmp, baseUrl) {
  await mkdir(dirTmp, { recursive: true });
  await page.goto(`${baseUrl}/.trabajo.html`);

  for (const [i, e] of entradas.entries()) {
    const url = `capturas/${encodeURIComponent(e.archivoEntrega)}`;
    let segmentos;
    try {
      segmentos = await page.evaluate(
      async ([src, ancho, ratioCorte, optimizar]) => {
        // createImageBitmap sobre el blob es más fiable que Image+decode()
        // cuando se procesan cientos de archivos seguidos.
        const resp = await fetch(src, { cache: 'no-store' });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const img = await createImageBitmap(await resp.blob());
        const w = img.width;
        const h = img.height;
        const escala = optimizar ? Math.min(1, ancho / w) : 1;
        const dw = Math.round(w * escala);
        const dh = Math.round(h * escala);

        const altoMax = Math.round(dw * ratioCorte);
        const partes = Math.max(1, Math.ceil(dh / altoMax));
        const altoParte = Math.ceil(dh / partes);

        const salida = [];
        for (let p = 0; p < partes; p++) {
          const alto = Math.min(altoParte, dh - p * altoParte);
          const cv = document.createElement('canvas');
          cv.width = dw;
          cv.height = alto;
          const cx = cv.getContext('2d');
          cx.fillStyle = '#ffffff';
          cx.fillRect(0, 0, dw, alto);
          cx.drawImage(img, 0, (p * altoParte) / escala, w, alto / escala, 0, 0, dw, alto);
          salida.push({ dataUrl: cv.toDataURL('image/jpeg', 0.84), ancho: dw, alto });
        }
        img.close?.();
        return { partes: salida, originalAncho: w, originalAlto: h };
      },
        [url, ANCHO_PDF, RATIO_CORTE, OPTIMIZAR],
      );
    } catch (err) {
      throw new Error(`No se pudo procesar ${e.archivoEntrega} (${url}): ${String(err).slice(0, 200)}`);
    }

    e.dimensiones = { ancho: segmentos.originalAncho, alto: segmentos.originalAlto };
    e.segmentos = [];
    for (const [p, seg] of segmentos.partes.entries()) {
      const nombre = `${e.numero}_${p + 1}.jpg`;
      await writeFile(join(dirTmp, nombre), Buffer.from(seg.dataUrl.split(',')[1], 'base64'));
      e.segmentos.push({ src: `.imagenes-pdf/${nombre}`, ancho: seg.ancho, alto: seg.alto });
    }
    if ((i + 1) % 25 === 0) log(`   · ${i + 1}/${entradas.length} imágenes preparadas`);
  }
}

/* ===================== HTML del documento ===================== */

function htmlPortada(git, totales, fecha) {
  return `
  <section class="portada">
    <div class="marca">MIDAGRI · SODEGA</div>
    <h1>Evidencia visual de la aplicación</h1>
    <p class="subtitulo">Sistema de Capacitaciones y Asistencia Técnica N1</p>
    <table class="meta">
      <tr><th>Proyecto</th><td>midagri_app_v3</td></tr>
      <tr><th>Repositorio</th><td>${escapar(git.remoto)}</td></tr>
      <tr><th>Rama</th><td>${escapar(git.rama)}</td></tr>
      <tr><th>Commit</th><td><code>${escapar(git.commit)}</code></td></tr>
      <tr><th>Autor del commit</th><td>${escapar(git.autor)} — ${escapar(git.fechaCommit)}</td></tr>
      <tr><th>Mensaje</th><td>${escapar(git.mensaje)}</td></tr>
      <tr><th>Árbol de trabajo</th><td>${git.sucio ? 'Con cambios sin confirmar (instrumentación de captura)' : 'Limpio'}</td></tr>
      <tr><th>Fecha de generación</th><td>${escapar(fecha.fecha)}</td></tr>
      <tr><th>Hora de generación</th><td>${escapar(fecha.hora)} (${escapar(fecha.zona)})</td></tr>
      <tr><th>Capturas incluidas</th><td>${totales.capturas}</td></tr>
      <tr><th>Rutas documentadas</th><td>${totales.rutas}</td></tr>
    </table>
    <p class="pie-portada">
      Documento generado automáticamente con Playwright a partir del recorrido
      completo de la aplicación. Reproducible con
      <code>npm run screenshots &amp;&amp; npm run evidencia</code>.
    </p>
  </section>`;
}

function htmlIndice(secciones) {
  const porCapitulo = new Map();
  for (const s of secciones) {
    if (!porCapitulo.has(s.capitulo)) porCapitulo.set(s.capitulo, []);
    porCapitulo.get(s.capitulo).push(s);
  }
  let html = '<section class="indice"><h2>Índice</h2>';
  for (const cap of CAPITULOS) {
    const items = porCapitulo.get(cap.id);
    if (!items?.length) continue;
    html += `<h3>${cap.id}. ${escapar(cap.nombre)}</h3><ul class="toc">`;
    for (const s of items) {
      html += `<li><a href="#s${s.n}"><span class="toc-num">${s.n}</span><span class="toc-tit">${escapar(s.titulo)}</span><span class="toc-ruta">${escapar(s.ruta || '—')}</span></a></li>`;
    }
    html += '</ul>';
  }
  html += '</section>';
  return html;
}

function htmlSeccion(s) {
  const ficha = s.ficha;
  const paginas = s.segmentos
    .map(
      (seg, i) => `
      <figure class="captura">
        <img src="${seg.src}" alt="${escapar(s.titulo)}" />
        <figcaption>${escapar(s.archivoEntrega)}${s.segmentos.length > 1 ? ` — parte ${i + 1} de ${s.segmentos.length}` : ''}</figcaption>
      </figure>`,
    )
    .join('');

  return `
  <section class="pantalla" id="s${s.n}">
    <h2><span class="num">${s.n}.</span> ${escapar(s.titulo)}</h2>
    <table class="ficha">
      <tr><th>Ruta</th><td><code>${escapar(s.ruta || '(componente transversal)')}</code></td></tr>
      <tr><th>Módulo</th><td>${escapar(ficha.modulo)}</td></tr>
      <tr><th>Tipo</th><td>${escapar(s.tipo)}</td></tr>
      <tr><th>Tema / resolución</th><td>${escapar(s.tema)} · ${escapar(s.viewport)}${s.perfil && s.ruta !== '/auth' ? ` · sesión como ${escapar(s.perfil)}` : ''}</td></tr>
      <tr><th>Rol que puede acceder</th><td>${ficha.roles.map(escapar).join(' · ')}</td></tr>
      <tr><th>Descripción funcional</th><td>${escapar(ficha.descripcion)}</td></tr>
      <tr><th>Componentes presentes</th><td>${ficha.componentes.map((c) => `<code>${escapar(c)}</code>`).join(' ')}</td></tr>
      <tr><th>Notas relevantes</th><td>${escapar(ficha.notas)}${s.notasAuditoria ? `<br/><strong>Auditoría:</strong> ${escapar(s.notasAuditoria)}` : ''}</td></tr>
      <tr><th>Archivo</th><td><code>capturas/${escapar(s.archivoEntrega)}</code> — ${s.dimensiones.ancho}×${s.dimensiones.alto} px</td></tr>
    </table>
    ${paginas}
  </section>`;
}

function htmlResumen(resumen) {
  const fila = (k, v) => `<tr><th>${escapar(k)}</th><td>${escapar(v)}</td></tr>`;
  return `
  <section class="resumen">
    <h2>Resumen de la evidencia</h2>
    <table class="ficha">
      ${fila('Total de pantallas documentadas', resumen.pantallas)}
      ${fila('Total de capturas (imágenes)', resumen.capturas)}
      ${fila('Total de páginas de imagen en el PDF', resumen.paginasImagen)}
      ${fila('Total de rutas encontradas en el router', resumen.rutasDeclaradas)}
      ${fila('Rutas navegables documentadas', resumen.rutasDocumentadas)}
      ${fila('Total de formularios', resumen.formularios)}
      ${fila('Total de tablas', resumen.tablas)}
      ${fila('Total de modales', resumen.modales)}
      ${fila('Total de componentes Angular', resumen.componentes)}
      ${fila('Servicios', resumen.servicios)}
      ${fila('Perfiles recorridos', resumen.perfiles)}
      ${fila('Temas visuales', resumen.temas)}
      ${fila('Resoluciones', resumen.resoluciones)}
      ${fila('Errores de consola durante el recorrido', resumen.erroresConsola)}
      ${fila('Advertencias de consola', resumen.advertenciasConsola)}
      ${fila('Pasos del recorrido fallidos', resumen.pasosFallidos)}
      ${fila('Hallazgos de auditoría visual', resumen.hallazgos)}
    </table>

    <h3>Hallazgos por severidad</h3>
    <table class="ficha">
      ${fila('Alta prioridad', resumen.severidad.alta)}
      ${fila('Media prioridad', resumen.severidad.media)}
      ${fila('Baja prioridad', resumen.severidad.baja)}
    </table>

    <h3>Recomendaciones UX/UI detectadas</h3>
    <ol class="recomendaciones">
      ${resumen.recomendaciones.map((r) => `<li><strong>${escapar(r.titulo)}</strong> — ${escapar(r.detalle)}</li>`).join('')}
    </ol>

    <h3>Errores registrados durante la navegación</h3>
    ${
      resumen.errores.length
        ? `<ul class="errores">${resumen.errores.map((e) => `<li><code>${escapar(e.contexto)}</code>: ${escapar(e.error)}</li>`).join('')}</ul>`
        : '<p class="ok">No se registró ningún error de consola ni ningún paso fallido durante el recorrido completo.</p>'
    }
  </section>`;
}

const CSS = /* css */ `
  @page { size: A4; margin: 18mm 16mm 20mm 16mm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'DejaVu Sans', 'Helvetica Neue', Arial, sans-serif;
    font-size: 9.5pt; line-height: 1.45; color: #16232c; margin: 0;
  }
  code { font-family: 'DejaVu Sans Mono', Menlo, monospace; font-size: 8.5pt; background: #eef4f7; padding: 0 3px; border-radius: 3px; }

  .portada { height: 245mm; display: flex; flex-direction: column; justify-content: center; page-break-after: always; }
  .portada .marca { font-size: 10pt; letter-spacing: 3px; color: #2f7d8c; font-weight: 700; }
  .portada h1 { font-size: 30pt; margin: 6mm 0 2mm; line-height: 1.1; color: #12303f; }
  .portada .subtitulo { font-size: 13pt; color: #55707d; margin: 0 0 12mm; }
  .portada .meta { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
  .portada .meta th { text-align: left; width: 45mm; padding: 2mm 3mm 2mm 0; color: #55707d; font-weight: 600; vertical-align: top; border-bottom: 1px solid #e2ecf0; }
  .portada .meta td { padding: 2mm 0; border-bottom: 1px solid #e2ecf0; word-break: break-all; }
  .portada .pie-portada { margin-top: 14mm; font-size: 8.5pt; color: #7b929d; }

  .indice { page-break-after: always; }
  .indice h2 { font-size: 18pt; color: #12303f; margin: 0 0 6mm; }
  .indice h3 { font-size: 11pt; color: #2f7d8c; margin: 6mm 0 2mm; border-bottom: 1px solid #d8e6ec; padding-bottom: 1.5mm; }
  ul.toc { list-style: none; padding: 0; margin: 0; }
  ul.toc li a { display: flex; gap: 3mm; text-decoration: none; color: #16232c; padding: 1.1mm 0; border-bottom: 1px dotted #e6eef2; }
  .toc-num { width: 9mm; color: #7b929d; text-align: right; font-variant-numeric: tabular-nums; }
  .toc-tit { flex: 1; }
  .toc-ruta { color: #7b929d; font-family: 'DejaVu Sans Mono', monospace; font-size: 8pt; }

  .pantalla { page-break-before: always; }
  .pantalla h2 { font-size: 13.5pt; color: #12303f; margin: 0 0 3mm; border-bottom: 2px solid #2f7d8c; padding-bottom: 1.5mm; }
  .pantalla h2 .num { color: #2f7d8c; }
  table.ficha { width: 100%; border-collapse: collapse; margin-bottom: 4mm; }
  table.ficha th { width: 38mm; text-align: left; vertical-align: top; padding: 1.4mm 3mm 1.4mm 0; color: #55707d; font-weight: 600; font-size: 8.5pt; border-bottom: 1px solid #eef4f7; }
  table.ficha td { padding: 1.4mm 0; vertical-align: top; font-size: 8.5pt; border-bottom: 1px solid #eef4f7; }

  figure.captura { margin: 0 0 4mm; text-align: center; page-break-inside: avoid; }
  figure.captura img { max-width: 100%; max-height: 195mm; border: 1px solid #d8e6ec; border-radius: 2px; }
  figure.captura figcaption { font-size: 7.5pt; color: #7b929d; margin-top: 1.5mm; font-family: 'DejaVu Sans Mono', monospace; }

  .resumen { page-break-before: always; }
  .resumen h2 { font-size: 16pt; color: #12303f; margin: 0 0 4mm; border-bottom: 2px solid #2f7d8c; padding-bottom: 2mm; }
  .resumen h3 { font-size: 11pt; color: #2f7d8c; margin: 6mm 0 2mm; }
  ol.recomendaciones li { margin-bottom: 2.5mm; }
  ul.errores { font-size: 8pt; }
  .ok { color: #2c7a52; font-weight: 600; }
`;

/* ===================== Main ===================== */

async function main() {
  const jsonPath = join(ORIGEN, 'reporte', 'hallazgos.json');
  if (!existsSync(jsonPath)) {
    throw new Error(`No se encontró ${jsonPath}. Ejecute primero \`npm run screenshots\`.`);
  }
  const registro = JSON.parse(await readFile(jsonPath, 'utf8'));

  const rutasPath = join(SALIDA, 'rutas_detectadas.json');
  const compPath = join(SALIDA, 'componentes_detectados.json');
  if (!existsSync(rutasPath) || !existsSync(compPath)) {
    throw new Error('Faltan los JSON de análisis. Ejecute primero `node e2e/analizar-codigo.mjs`.');
  }
  const rutasJson = JSON.parse(await readFile(rutasPath, 'utf8'));
  const compJson = JSON.parse(await readFile(compPath, 'utf8'));

  /* --- Orden y numeración --- */
  const capturas = registro.capturas
    .map((c) => ({
      ...c,
      nombre: c.archivo.split('/').pop().replace(/^\d+-/, '').replace(/\.png$/, ''),
      capitulo: capituloDe({ ...c, nombre: c.archivo.split('/').pop().replace(/^\d+-/, '').replace(/\.png$/, '') }),
      ordenOriginal: parseInt(c.archivo.split('/').pop(), 10) || 0,
    }))
    .sort((a, b) => a.capitulo - b.capitulo || a.archivo.localeCompare(b.archivo, 'es', { numeric: true }));

  log(`→ ${capturas.length} capturas ordenadas en ${new Set(capturas.map((c) => c.capitulo)).size} capítulos.`);

  /* --- Copia renumerada --- */
  await rm(DIR_CAPTURAS, { recursive: true, force: true });
  await mkdir(DIR_CAPTURAS, { recursive: true });

  const hallazgosPorCaptura = new Map();
  for (const h of registro.hallazgos) {
    if (!hallazgosPorCaptura.has(h.contexto)) hallazgosPorCaptura.set(h.contexto, []);
    hallazgosPorCaptura.get(h.contexto).push(h);
  }

  const secciones = [];
  for (const [i, c] of capturas.entries()) {
    const n = i + 1;
    const numero = String(n).padStart(3, '0');
    const archivoEntrega = `${numero}_${slugArchivo(c.nombre)}.png`;
    const origen = join(ORIGEN, ...c.archivo.split('/'));
    await copyFile(origen, join(DIR_CAPTURAS, archivoEntrega));

    const hs = hallazgosPorCaptura.get(c.archivo) ?? [];
    const altas = hs.filter((h) => h.severidad === 'alta');
    const notasAuditoria = hs.length
      ? `${hs.length} hallazgo(s) — ${altas.length} de alta prioridad. ${(altas[0] ?? hs[0]).mensaje}`
      : '';

    secciones.push({
      n,
      numero,
      capitulo: c.capitulo,
      titulo: c.titulo,
      ruta: c.ruta || '',
      tipo: c.tipo,
      tema: c.tema || '—',
      viewport: c.viewport || '—',
      perfil: c.perfil || '',
      archivoEntrega,
      archivoOriginal: c.archivo,
      rutaAbsoluta: origen,
      ficha: fichaDe(c.ruta, c.tipo, c.nombre),
      notasAuditoria,
      hallazgos: hs.length,
      dimensiones: { ancho: 0, alto: 0 },
      segmentos: [],
    });
  }

  /* --- Preparación de imágenes y render del PDF --- */
  const PUERTO = 4519;
  const baseUrl = `http://127.0.0.1:${PUERTO}`;
  await writeFile(join(SALIDA, '.trabajo.html'), '<!doctype html><meta charset="utf-8"><title>preparando</title>', 'utf8');
  const servidor = await servirEstatico(SALIDA, PUERTO);

  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu'] });
  const page = await browser.newPage();
  const dirTmp = join(SALIDA, '.imagenes-pdf');
  log('→ Preparando imágenes para impresión…');
  await prepararImagenes(page, secciones, dirTmp, baseUrl);

  const paginasImagen = secciones.reduce((a, s) => a + s.segmentos.length, 0);
  const ahora = new Date();
  const fecha = {
    fecha: ahora.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }),
    hora: ahora.toLocaleTimeString('es-PE', { hour12: false }),
    zona: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
  const git = gitInfo();

  const severidad = { alta: 0, media: 0, baja: 0 };
  for (const h of registro.hallazgos) severidad[h.severidad] = (severidad[h.severidad] ?? 0) + 1;

  const porRegla = {};
  for (const h of registro.hallazgos) (porRegla[h.regla] ??= []).push(h);
  const recomendaciones = [
    porRegla['scroll-horizontal'] && {
      titulo: 'Convertir el sidebar en drawer por debajo de md',
      detalle:
        `el menú lateral conserva su ancho fijo en móvil y deja el contenido en unos 150 px, lo que provoca ` +
        `${porRegla['scroll-horizontal'].length} avisos de scroll horizontal y ${(porRegla['fuera-de-viewport'] ?? []).length} elementos fuera del viewport.`,
    },
    porRegla['contraste'] && {
      titulo: 'Ajustar los tokens de color por debajo de WCAG AA',
      detalle:
        `${porRegla['contraste'].length} textos quedan por debajo de la relación 4.5:1, concentrados en unos pocos tokens ` +
        `compartidos (texto del sidebar, texto secundario al 70 % de opacidad y los chips de estado). Corregirlos en src/styles.css resuelve la mayoría de una vez.`,
    },
    porRegla['tabla-desbordada'] || porRegla['fuera-de-viewport']
      ? {
          titulo: 'Declarar scroll horizontal explícito en las bandejas',
          detalle:
            'las tablas de capacitaciones, seguimiento y usuarios desbordan su contenedor desde 1366 px; conviene envolverlas en un contenedor con overflow-x-auto y ocultar columnas secundarias por breakpoint usando el selector de columnas existente.',
        }
      : null,
    porRegla['campo-sin-etiqueta'] && {
      titulo: 'Etiquetar los controles de formulario para lectores de pantalla',
      detalle: `${porRegla['campo-sin-etiqueta'].length} pantallas contienen campos sin label asociado, aria-label ni placeholder; el caso más denso es Configuración de campos.`,
    },
    porRegla['area-tactil'] && {
      titulo: 'Aumentar el área táctil de las acciones por fila',
      detalle: `${porRegla['area-tactil'].length} pantallas táctiles tienen controles por debajo de 32×32 px; la recomendación es 44×44 px.`,
    },
    porRegla['tabla-inconsistente'] && {
      titulo: 'Corregir el colspan de las filas de estado vacío',
      detalle: 'el modal de reasignación de registros muestra 6 encabezados frente a 1 celda, lo que rompe visualmente la tabla cuando no hay datos.',
    },
  ].filter(Boolean);

  const resumen = {
    pantallas: new Set(secciones.map((s) => s.ruta || s.titulo)).size,
    capturas: secciones.length,
    paginasImagen,
    rutasDeclaradas: rutasJson.totales.declaradas,
    rutasDocumentadas: new Set(secciones.map((s) => s.ruta).filter(Boolean)).size,
    formularios: secciones.filter((s) => s.tipo === 'formulario').length,
    tablas: secciones.filter((s) => s.tipo === 'tabla').length,
    modales: secciones.filter((s) => s.tipo === 'modal').length,
    componentes: compJson.totales.componentes,
    servicios: compJson.totales.servicios,
    perfiles: new Set(secciones.map((s) => s.perfil).filter(Boolean)).size,
    temas: new Set(secciones.map((s) => s.tema).filter((t) => t !== '—')).size,
    resoluciones: new Set(secciones.map((s) => s.viewport).filter((v) => v !== '—')).size,
    erroresConsola: registro.consola.filter((c) => c.nivel === 'error').length,
    advertenciasConsola: registro.consola.filter((c) => c.nivel === 'warning').length,
    pasosFallidos: registro.fallos.length,
    hallazgos: registro.hallazgos.length,
    severidad,
    recomendaciones,
    errores: [
      ...registro.consola.filter((c) => c.nivel === 'error').map((c) => ({ contexto: c.contexto, error: c.texto })),
      ...registro.fallos,
    ].slice(0, 40),
  };

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>${CSS}</style></head><body>
    ${htmlPortada(git, { capturas: secciones.length, rutas: resumen.rutasDocumentadas }, fecha)}
    ${htmlIndice(secciones)}
    ${secciones.map(htmlSeccion).join('')}
    ${htmlResumen(resumen)}
  </body></html>`;

  const htmlPath = join(SALIDA, '.evidencia.html');
  await writeFile(htmlPath, html, 'utf8');

  log('→ Renderizando el PDF…');
  await page.goto(`${baseUrl}/.evidencia.html`, { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'print' });

  const pdfPath = join(SALIDA, 'evidencia_aplicacion.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    margin: { top: '18mm', bottom: '20mm', left: '16mm', right: '16mm' },
    headerTemplate: `
      <div style="width:100%;font-size:7pt;font-family:Arial,sans-serif;color:#7b929d;padding:0 16mm;display:flex;justify-content:space-between;border-bottom:.5px solid #dfe9ee;padding-bottom:2mm;">
        <span>MIDAGRI · Plataforma SODEGA — Evidencia visual de la aplicación</span>
        <span>${escapar(git.rama)} · ${escapar(git.commitCorto)}</span>
      </div>`,
    footerTemplate: `
      <div style="width:100%;font-size:7pt;font-family:Arial,sans-serif;color:#7b929d;padding:0 16mm;display:flex;justify-content:space-between;border-top:.5px solid #dfe9ee;padding-top:2mm;">
        <span>Generado el ${escapar(fecha.fecha)} a las ${escapar(fecha.hora)}</span>
        <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
      </div>`,
  });

  await browser.close();

  /* --- JSON de índice y resumen --- */
  const indice = {
    generado: ahora.toISOString(),
    documento: 'evidencia_aplicacion.pdf',
    git,
    capitulos: CAPITULOS.filter((c) => secciones.some((s) => s.capitulo === c.id)),
    secciones: secciones.map((s) => ({
      n: s.n,
      capitulo: s.capitulo,
      titulo: s.titulo,
      ruta: s.ruta,
      tipo: s.tipo,
      modulo: s.ficha.modulo,
      roles: s.ficha.roles,
      componentes: s.ficha.componentes,
      descripcion: s.ficha.descripcion,
      notas: s.ficha.notas,
      tema: s.tema,
      viewport: s.viewport,
      perfil: s.perfil,
      archivo: `capturas/${s.archivoEntrega}`,
      archivoOriginal: s.archivoOriginal,
      dimensiones: s.dimensiones,
      paginasEnPdf: s.segmentos.length,
      hallazgos: s.hallazgos,
    })),
  };
  await writeFile(join(SALIDA, 'indice.json'), JSON.stringify(indice, null, 2), 'utf8');

  const duracion = Math.round((Date.now() - INICIO) / 1000);
  await writeFile(
    join(SALIDA, 'resumen.json'),
    JSON.stringify({ generado: ahora.toISOString(), git, duracionSegundos: duracion, ...resumen }, null, 2),
    'utf8',
  );

  await new Promise((ok) => servidor.close(ok));
  await rm(join(SALIDA, '.trabajo.html'), { force: true });
  // `--conservar-html` deja el HTML y las imágenes intermedias para poder
  // revisar la maqueta en el navegador sin regenerar todo el documento.
  if (!args['conservar-html']) {
    await rm(dirTmp, { recursive: true, force: true });
    await rm(htmlPath, { force: true });
  }

  log(`\n✔ ${secciones.length} secciones · ${paginasImagen} páginas de imagen · ${duracion}s`);
  log(`  ${pdfPath}`);
}

main().catch((e) => {
  console.error('\n✖ Falló la generación de la evidencia:', e);
  process.exit(1);
});
