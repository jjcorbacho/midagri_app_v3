/**
 * Generación del reporte de auditoría visual (Markdown).
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SEVERIDADES = [
  ['alta', 'Alta prioridad'],
  ['media', 'Media prioridad'],
  ['baja', 'Baja prioridad'],
];

const DESCRIPCION_REGLA = {
  'scroll-horizontal': 'Scroll horizontal en la página',
  'fuera-de-viewport': 'Elementos fuera del área visible',
  'texto-cortado': 'Textos recortados o truncados',
  contraste: 'Contraste insuficiente (WCAG AA)',
  'icono-sin-dimension': 'Iconos SVG sin dimensiones',
  'tabla-vacia': 'Tablas sin registros',
  'tabla-desbordada': 'Tablas que desbordan su contenedor',
  'tabla-inconsistente': 'Tablas con columnas desalineadas',
  'sin-nombre-accesible': 'Controles sin nombre accesible',
  'area-tactil': 'Áreas táctiles por debajo del mínimo',
  superposicion: 'Controles superpuestos',
  'scroll-innecesario': 'Scroll vertical innecesario',
  'img-sin-alt': 'Imágenes sin texto alternativo',
  'campo-sin-etiqueta': 'Campos de formulario sin etiqueta',
};

const agrupar = (lista, fn) =>
  lista.reduce((acc, x) => {
    const k = fn(x);
    (acc[k] ??= []).push(x);
    return acc;
  }, {});

function tabla(cabeceras, filas) {
  if (!filas.length) return '_Sin registros._\n';
  return (
    `| ${cabeceras.join(' | ')} |\n` +
    `| ${cabeceras.map(() => '---').join(' | ')} |\n` +
    filas.map((f) => `| ${f.map((c) => String(c ?? '').replace(/\|/g, '\\|')).join(' | ')} |`).join('\n') +
    '\n'
  );
}

export async function escribirReporte(registro, salida) {
  const { capturas, hallazgos, consola, fallos } = registro;

  const porTipo = agrupar(capturas, (c) => c.tipo);
  const porSeveridad = agrupar(hallazgos, (h) => h.severidad);
  const porRegla = agrupar(hallazgos, (h) => h.regla);
  const porCarpeta = agrupar(capturas, (c) => c.archivo.split('/').slice(0, -1).join('/'));

  const vistasUnicas = new Set(capturas.filter((c) => c.ruta).map((c) => c.ruta));
  const erroresConsola = consola.filter((c) => c.nivel === 'error');
  const avisosConsola = consola.filter((c) => c.nivel === 'warning');

  const L = [];
  L.push('# Auditoría visual — Plataforma SODEGA / MIDAGRI\n');
  L.push(`> Generado automáticamente el ${new Date(registro.generado).toLocaleString('es-PE')} · `);
  L.push(`duración del recorrido: ${registro.duracionSegundos ?? '—'} s · base: \`${registro.baseUrl}\`\n`);
  L.push('Reejecutable con `npm run screenshots`.\n');

  /* ---------- Resumen ---------- */
  L.push('## 1. Resumen de cobertura\n');
  L.push(
    tabla(
      ['Concepto', 'Total'],
      [
        ['Imágenes generadas', capturas.length],
        ['Rutas distintas recorridas', vistasUnicas.size],
        ['Vistas capturadas', (porTipo.vista ?? []).length],
        ['Formularios capturados', (porTipo.formulario ?? []).length],
        ['Tablas capturadas', (porTipo.tabla ?? []).length],
        ['Modales capturados', (porTipo.modal ?? []).length],
        ['Componentes y estados capturados', (porTipo.componente ?? []).length],
        ['Pantallas de error / sin acceso', (porTipo.error ?? []).length],
        ['Hallazgos visuales', hallazgos.length],
        ['Errores de consola', erroresConsola.length],
        ['Advertencias de consola', avisosConsola.length],
        ['Pasos fallidos del recorrido', fallos.length],
      ],
    ),
  );

  L.push('\n### Distribución por carpeta\n');
  L.push(
    tabla(
      ['Carpeta', 'Imágenes', 'Hallazgos'],
      Object.entries(porCarpeta)
        .sort()
        .map(([carpeta, cs]) => [
          `\`capturas/${carpeta}/\``,
          cs.length,
          hallazgos.filter((h) => h.contexto.startsWith(carpeta + '/')).length,
        ]),
    ),
  );

  /* ---------- Rutas ---------- */
  L.push('\n## 2. Rutas recorridas\n');
  const rutas = agrupar(capturas.filter((c) => c.ruta), (c) => c.ruta);
  L.push(
    tabla(
      ['Ruta', 'Capturas', 'Perfiles'],
      Object.entries(rutas)
        .sort()
        .map(([ruta, cs]) => [
          `\`${ruta}\``,
          cs.length,
          [...new Set(cs.map((c) => c.perfil).filter(Boolean))].length,
        ]),
    ),
  );

  /* ---------- Hallazgos ---------- */
  L.push('\n## 3. Hallazgos de la auditoría visual\n');
  L.push(
    tabla(
      ['Severidad', 'Hallazgos', 'Reglas distintas'],
      SEVERIDADES.map(([sev, etiqueta]) => [
        etiqueta,
        (porSeveridad[sev] ?? []).length,
        new Set((porSeveridad[sev] ?? []).map((h) => h.regla)).size,
      ]),
    ),
  );

  L.push('\n### Por tipo de problema\n');
  L.push(
    tabla(
      ['Problema', 'Ocurrencias', 'Severidad máx.', 'Pantallas afectadas'],
      Object.entries(porRegla)
        .sort((a, b) => b[1].length - a[1].length)
        .map(([regla, hs]) => {
          const sev = ['alta', 'media', 'baja'].find((s) => hs.some((h) => h.severidad === s));
          return [
            DESCRIPCION_REGLA[regla] ?? regla,
            hs.length,
            sev ?? '—',
            new Set(hs.map((h) => h.contexto)).size,
          ];
        }),
    ),
  );

  for (const [sev, etiqueta] of SEVERIDADES) {
    const lista = porSeveridad[sev] ?? [];
    L.push(`\n### ${etiqueta} (${lista.length})\n`);
    if (!lista.length) {
      L.push('_Sin hallazgos en esta categoría._\n');
      continue;
    }
    const porReglaSev = agrupar(lista, (h) => h.regla);
    for (const [regla, hs] of Object.entries(porReglaSev).sort((a, b) => b[1].length - a[1].length)) {
      L.push(`\n#### ${DESCRIPCION_REGLA[regla] ?? regla} — ${hs.length} ocurrencia(s)\n`);
      const muestras = hs.slice(0, 12);
      L.push(
        tabla(
          ['Pantalla', 'Detalle', 'Selector'],
          muestras.map((h) => [
            `\`${h.contexto}\``,
            h.mensaje,
            h.selector ? `\`${h.selector}\`` : '—',
          ]),
        ),
      );
      if (hs.length > muestras.length) {
        L.push(`\n_… y ${hs.length - muestras.length} ocurrencia(s) más (ver \`reporte/hallazgos.json\`)._\n`);
      }
    }
  }

  /* ---------- Consola ---------- */
  L.push('\n## 4. Consola del navegador\n');
  const consolaAgrupada = agrupar(consola, (c) => c.nivel + '|' + c.texto.slice(0, 160));
  L.push(
    tabla(
      ['Nivel', 'Mensaje', 'Veces', 'Primer contexto'],
      Object.values(consolaAgrupada)
        .sort((a, b) => b.length - a.length)
        .slice(0, 25)
        .map((g) => [g[0].nivel === 'error' ? 'Error' : 'Advertencia', g[0].texto.slice(0, 160), g.length, g[0].contexto]),
    ),
  );

  /* ---------- Fallos ---------- */
  L.push('\n## 5. Pasos del recorrido que fallaron\n');
  L.push(tabla(['Contexto', 'Error'], fallos.slice(0, 30).map((f) => [f.contexto, f.error])));

  /* ---------- Inventario ---------- */
  L.push('\n## 6. Inventario completo de imágenes\n');
  for (const [carpeta, cs] of Object.entries(porCarpeta).sort()) {
    L.push(`\n<details><summary><code>capturas/${carpeta}/</code> — ${cs.length} imágenes</summary>\n`);
    L.push(
      tabla(
        ['Archivo', 'Pantalla', 'Tipo', 'Ruta'],
        cs.map((c) => [
          `[${c.archivo.split('/').pop()}](../${c.archivo})`,
          c.titulo,
          c.tipo,
          c.ruta ? `\`${c.ruta}\`` : '—',
        ]),
      ),
    );
    L.push('\n</details>\n');
  }

  await mkdir(join(salida, 'reporte'), { recursive: true });
  await writeFile(join(salida, 'reporte', 'auditoria-visual.md'), L.join('\n'), 'utf8');
}
