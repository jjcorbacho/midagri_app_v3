/**
 * Arranque del servidor para las capturas.
 *
 * Estrategia:
 *  1. Si ya hay algo escuchando en `baseUrl`, se reutiliza (no se levanta nada).
 *  2. Modo `static` (por defecto): `ng build --configuration development` y se
 *     sirve `dist/` con un servidor estático mínimo con fallback SPA. Es
 *     determinista, arranca en milisegundos y no depende del watcher.
 *  3. Modo `serve`: se lanza `npm start` (ng serve) y se espera a que responda.
 */

import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { createReadStream, existsSync, readdirSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

export async function estaVivo(baseUrl, timeoutMs = 2000) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const r = await fetch(baseUrl, { signal: ctrl.signal });
    clearTimeout(t);
    return r.ok || r.status === 304;
  } catch {
    return false;
  }
}

export async function esperarVivo(baseUrl, maxMs = 120000) {
  const fin = Date.now() + maxMs;
  while (Date.now() < fin) {
    if (await estaVivo(baseUrl)) return true;
    await new Promise((r) => setTimeout(r, 800));
  }
  return false;
}

function ejecutar(cmd, args, cwd) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32' });
    let salida = '';
    p.stdout.on('data', (d) => (salida += d));
    p.stderr.on('data', (d) => (salida += d));
    p.on('close', (code) => (code === 0 ? res(salida) : rej(new Error(cmd + ' salió con código ' + code + '\n' + salida.slice(-4000)))));
  });
}

/** Localiza el directorio de salida del build (dist/<proyecto>/browser o dist/<proyecto>). */
function localizarDist(raiz) {
  const dist = join(raiz, 'dist');
  if (!existsSync(dist)) return null;
  const candidatos = [];
  for (const p of readdirSync(dist)) {
    const base = join(dist, p);
    if (!statSync(base).isDirectory()) continue;
    const conBrowser = join(base, 'browser');
    if (existsSync(join(conBrowser, 'index.html'))) candidatos.push(conBrowser);
    else if (existsSync(join(base, 'index.html'))) candidatos.push(base);
  }
  return candidatos[0] ?? null;
}

/** Servidor estático con fallback SPA (todas las rutas desconocidas → index.html). */
export function servirEstatico(dir, port) {
  const raiz = resolve(dir);
  const server = createServer((req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    let archivo = join(raiz, normalize(url).replace(/^(\.\.[/\\])+/, ''));
    if (!archivo.startsWith(raiz)) archivo = join(raiz, 'index.html');
    if (existsSync(archivo) && statSync(archivo).isDirectory()) archivo = join(archivo, 'index.html');
    if (!existsSync(archivo)) archivo = join(raiz, 'index.html');
    res.writeHead(200, {
      'Content-Type': MIME[extname(archivo)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    createReadStream(archivo).pipe(res);
  });
  return new Promise((ok) => server.listen(port, '127.0.0.1', () => ok(server)));
}

/**
 * Deja la aplicación disponible en `baseUrl`.
 * Devuelve `{ detener() }` para apagar lo que este proceso haya levantado.
 */
export async function levantarApp({ raiz, baseUrl, modo = 'static', construir = true, log = console.log }) {
  if (await estaVivo(baseUrl)) {
    log('→ La aplicación ya responde en ' + baseUrl + ' (se reutiliza).');
    return { detener: async () => {} };
  }

  const port = Number(new URL(baseUrl).port || 80);

  if (modo === 'serve') {
    log('→ Levantando el servidor de desarrollo (ng serve)…');
    const p = spawn('npm', ['start', '--', '--port', String(port)], {
      cwd: raiz, stdio: 'ignore', shell: process.platform === 'win32',
    });
    if (!(await esperarVivo(baseUrl))) {
      p.kill();
      throw new Error('ng serve no respondió en ' + baseUrl + ' dentro del tiempo esperado.');
    }
    log('→ Servidor de desarrollo listo.');
    return { detener: async () => p.kill() };
  }

  if (construir) {
    log('→ Compilando la aplicación (ng build --configuration development)…');
    const salida = await ejecutar('npx', ['ng', 'build', '--configuration', 'development'], raiz);
    const errores = salida.split('\n').filter((l) => /^(ERROR|✘|Error:)/.test(l.trim()));
    if (errores.length) throw new Error('El build reportó errores:\n' + errores.join('\n'));
    log('→ Build sin errores.');
  }

  const dist = localizarDist(raiz);
  if (!dist) throw new Error('No se encontró la salida del build en dist/. Ejecute `npm run build` primero.');
  const server = await servirEstatico(dist, port);
  log('→ Sirviendo ' + dist + ' en ' + baseUrl);
  return { detener: async () => new Promise((ok) => server.close(ok)) };
}
