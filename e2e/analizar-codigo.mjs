#!/usr/bin/env node
/**
 * Análisis estático del código fuente para la documentación de evidencia.
 *
 *   node e2e/analizar-codigo.mjs [--salida=documentacion]
 *
 * Produce:
 *   rutas_detectadas.json      · todas las rutas del router, con guards, lazy
 *                                loading, título y componente destino
 *   componentes_detectados.json · todos los componentes Angular del proyecto,
 *                                con selector, tipo, imports y dónde se usan
 *
 * No ejecuta la aplicación: lee `src/` directamente, de modo que descubre
 * también las rutas que no aparecen en ningún menú.
 */

import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '..');
const SRC = join(RAIZ, 'src');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v === undefined ? true : v];
  }),
);
const SALIDA = resolve(RAIZ, args.salida || 'documentacion');

/* ===================== Utilidades ===================== */

async function listarArchivos(dir, ext = '.ts') {
  const out = [];
  for (const entrada of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entrada.name);
    if (entrada.isDirectory()) out.push(...(await listarArchivos(p, ext)));
    else if (entrada.name.endsWith(ext)) out.push(p);
  }
  return out;
}

const rel = (p) => relative(RAIZ, p).split('\\').join('/');

/* ===================== Rutas ===================== */

/**
 * Parser del array `routes` de `app.routes.ts`.
 * Recorre el texto contando llaves para aislar cada objeto de ruta y conserva
 * la jerarquía padre/hijo para reconstruir los paths completos.
 */
function parsearRutas(texto) {
  const inicio = texto.indexOf('export const routes');
  if (inicio < 0) return [];
  const abre = texto.indexOf('[', inicio);
  const cuerpo = recortarBloque(texto, abre, '[', ']');
  return parsearArrayRutas(cuerpo, '');
}

function recortarBloque(texto, desde, apertura, cierre) {
  let nivel = 0;
  for (let i = desde; i < texto.length; i++) {
    if (texto[i] === apertura) nivel++;
    else if (texto[i] === cierre) {
      nivel--;
      if (nivel === 0) return texto.slice(desde + 1, i);
    }
  }
  return '';
}

/** Divide el contenido de un array en objetos `{ … }` de primer nivel. */
function objetosDePrimerNivel(cuerpo) {
  const objetos = [];
  let nivel = 0;
  let inicio = -1;
  for (let i = 0; i < cuerpo.length; i++) {
    if (cuerpo[i] === '{') {
      if (nivel === 0) inicio = i;
      nivel++;
    } else if (cuerpo[i] === '}') {
      nivel--;
      if (nivel === 0 && inicio >= 0) {
        objetos.push(cuerpo.slice(inicio + 1, i));
        inicio = -1;
      }
    }
  }
  return objetos;
}

function parsearArrayRutas(cuerpo, prefijo) {
  const rutas = [];
  for (const obj of objetosDePrimerNivel(cuerpo)) {
    // Las propiedades de la ruta se leen sólo de su parte "propia": si tiene
    // `children`, ese bloque se recorta antes para no heredar por error el
    // componente o el título del primer hijo.
    const idxHijosProp = obj.indexOf('children:');
    const propio = idxHijosProp >= 0 ? obj.slice(0, idxHijosProp) : obj;

    const path = (propio.match(/(?:^|[\s,{])path:\s*'([^']*)'/) ?? [])[1] ?? '';
    const titulo = (propio.match(/title:\s*'([^']*)'/) ?? [])[1] ?? '';
    const redirect = (propio.match(/redirectTo:\s*'([^']*)'/) ?? [])[1] ?? '';
    const componente = (propio.match(/=>\s*m\.(\w+)/) ?? [])[1] ?? '';
    const archivo = (propio.match(/import\('([^']+)'\)/) ?? [])[1] ?? '';
    const canActivate = (propio.match(/canActivate:\s*\[([^\]]*)\]/) ?? [])[1] ?? '';
    const canActivateChild = (propio.match(/canActivateChild:\s*\[([^\]]*)\]/) ?? [])[1] ?? '';
    const data = (propio.match(/data:\s*\{([^}]*)\}/) ?? [])[1] ?? '';

    const completo = path === '' ? prefijo || '/' : `${prefijo}/${path}`.replace(/\/+/g, '/');

    const entrada = {
      path: path || '(vacío)',
      rutaCompleta: completo,
      titulo,
      componente,
      archivoComponente: archivo ? archivo.replace(/^\.\//, 'src/app/') + '.ts' : '',
      lazy: Boolean(archivo),
      redirectTo: redirect,
      guards: [canActivate, canActivateChild]
        .join(',')
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean),
      data: data.trim(),
      comodin: path === '**',
    };

    const idxHijos = obj.indexOf('children:');
    if (idxHijos >= 0) {
      const abre = obj.indexOf('[', idxHijos);
      entrada.hijos = parsearArrayRutas(
        recortarBloque(obj, abre, '[', ']'),
        completo === '/' ? '' : completo,
      );
    }
    rutas.push(entrada);
  }
  return rutas;
}

function aplanar(rutas, acc = []) {
  for (const r of rutas) {
    acc.push({ ...r, hijos: undefined, tieneHijos: Boolean(r.hijos?.length) });
    if (r.hijos) aplanar(r.hijos, acc);
  }
  return acc;
}

/* ===================== Componentes ===================== */

async function analizarComponentes(archivos) {
  const componentes = [];
  for (const f of archivos) {
    const txt = await readFile(f, 'utf8');
    if (!/@Component\s*\(/.test(txt)) continue;

    const selector = (txt.match(/selector:\s*'([^']+)'/) ?? [])[1] ?? '';
    const clase = (txt.match(/export class (\w+)/) ?? [])[1] ?? '';
    const importsBloque = (txt.match(/imports:\s*\[([^\]]*)\]/) ?? [])[1] ?? '';
    const imports = importsBloque
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith('//'));

    const ruta = rel(f);
    let categoria = 'otro';
    if (ruta.includes('/features/')) categoria = 'vista';
    else if (ruta.includes('/layout/')) categoria = 'layout';
    else if (ruta.includes('/shared/components/')) categoria = 'compartido';
    else if (ruta.endsWith('app.component.ts')) categoria = 'raíz';

    const esModal = /modal/i.test(ruta) || /role="dialog"|app-modal/.test(txt);

    componentes.push({
      clase,
      selector,
      categoria,
      archivo: ruta,
      lineas: txt.split('\n').length,
      esModal,
      usaFormularios: /ReactiveFormsModule|FormBuilder|formControlName/.test(txt),
      tieneTabla: /<table/.test(txt),
      señales: (txt.match(/signal\(/g) ?? []).length,
      computados: (txt.match(/computed\(/g) ?? []).length,
      importa: imports,
      usadoPor: [],
    });
  }

  // Referencias cruzadas: qué componente usa a cuál (por selector en plantillas).
  const porSelector = new Map(componentes.filter((c) => c.selector).map((c) => [c.selector, c]));
  for (const f of archivos) {
    const txt = await readFile(f, 'utf8');
    const clase = (txt.match(/export class (\w+)/) ?? [])[1];
    if (!clase) continue;
    for (const [sel, cmp] of porSelector) {
      if (cmp.clase === clase) continue;
      if (new RegExp(`<${sel}[\\s/>]`).test(txt)) cmp.usadoPor.push(clase);
    }
  }
  return componentes;
}

/* ===================== Servicios, guards y modelos ===================== */

async function analizarSoporte(archivos) {
  const servicios = [];
  const guards = [];
  for (const f of archivos) {
    const txt = await readFile(f, 'utf8');
    const ruta = rel(f);
    if (/@Injectable/.test(txt)) {
      servicios.push({
        clase: (txt.match(/export class (\w+)/) ?? [])[1] ?? '',
        archivo: ruta,
        metodos: [...txt.matchAll(/^\s{2}(?:readonly\s+)?(\w+)\s*\(/gm)].map((m) => m[1]).filter((m) => m !== 'constructor'),
      });
    }
    if (/CanActivateFn|CanActivateChildFn/.test(txt)) {
      guards.push({
        nombre: (txt.match(/export const (\w+)/) ?? [])[1] ?? '',
        archivo: ruta,
        tipo: /CanActivateChildFn/.test(txt) ? 'canActivateChild' : 'canActivate',
      });
    }
  }
  return { servicios, guards };
}

/* ===================== Main ===================== */

async function main() {
  const archivos = await listarArchivos(SRC);
  const rutasTexto = await readFile(join(SRC, 'app', 'app.routes.ts'), 'utf8');

  const arbol = parsearRutas(rutasTexto);
  const planas = aplanar(arbol);
  const navegables = planas.filter((r) => !r.redirectTo && !r.tieneHijos && r.path !== '(vacío)');

  const componentes = await analizarComponentes(archivos);
  const { servicios, guards } = await analizarSoporte(archivos);

  const paquete = JSON.parse(await readFile(join(RAIZ, 'package.json'), 'utf8'));

  const rutasJson = {
    generado: new Date().toISOString(),
    proyecto: paquete.name,
    fuente: 'src/app/app.routes.ts',
    totales: {
      declaradas: planas.length,
      navegables: navegables.length,
      conRedireccion: planas.filter((r) => r.redirectTo).length,
      protegidas: planas.filter((r) => r.guards.length).length,
      lazy: planas.filter((r) => r.lazy).length,
      comodin: planas.filter((r) => r.comodin).length,
    },
    guards,
    arbol,
    rutas: planas,
  };

  const componentesJson = {
    generado: new Date().toISOString(),
    proyecto: paquete.name,
    totales: {
      componentes: componentes.length,
      vistas: componentes.filter((c) => c.categoria === 'vista').length,
      compartidos: componentes.filter((c) => c.categoria === 'compartido').length,
      layout: componentes.filter((c) => c.categoria === 'layout').length,
      modales: componentes.filter((c) => c.esModal).length,
      conFormulario: componentes.filter((c) => c.usaFormularios).length,
      conTabla: componentes.filter((c) => c.tieneTabla).length,
      servicios: servicios.length,
    },
    servicios,
    componentes: componentes.sort((a, b) => a.categoria.localeCompare(b.categoria) || a.clase.localeCompare(b.clase)),
  };

  await mkdir(SALIDA, { recursive: true });
  await writeFile(join(SALIDA, 'rutas_detectadas.json'), JSON.stringify(rutasJson, null, 2), 'utf8');
  await writeFile(join(SALIDA, 'componentes_detectados.json'), JSON.stringify(componentesJson, null, 2), 'utf8');

  console.log(`✔ ${planas.length} rutas (${navegables.length} navegables) · ${componentes.length} componentes · ${servicios.length} servicios`);
  console.log(`  ${join(SALIDA, 'rutas_detectadas.json')}`);
  console.log(`  ${join(SALIDA, 'componentes_detectados.json')}`);
}

main().catch((e) => {
  console.error('✖ Falló el análisis:', e);
  process.exit(1);
});
