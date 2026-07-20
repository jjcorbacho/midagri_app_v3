/**
 * Exportación de tablas a Excel sin dependencias externas.
 *
 * Genera un libro en formato HTML compatible con Excel (`.xls`): admite
 * encabezados con formato, anchos de columna calculados según el contenido y
 * texto plano seguro (los DNI/códigos se marcan como texto para no perder
 * ceros a la izquierda). El equipo backend puede sustituirlo más adelante por
 * una exportación server-side sin cambiar a los llamadores.
 */

export interface ColumnaExcel<T> {
  titulo: string;
  valor: (fila: T) => string | number;
}

const escapeHtml = (v: string): string =>
  v.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/** Marca de tiempo `YYYY-MM-DD_HH-mm` para nombres de archivo descriptivos. */
export function marcaDeTiempoArchivo(fecha = new Date()): string {
  const dosDigitos = (n: number) => String(n).padStart(2, '0');
  return (
    `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}` +
    `_${dosDigitos(fecha.getHours())}-${dosDigitos(fecha.getMinutes())}`
  );
}

/**
 * Descarga `filas` como `NombreBase_YYYY-MM-DD_HH-mm.xls`, en el mismo orden
 * en el que se reciben (el llamador decide filtros y ordenamiento).
 */
export function exportarTablaExcel<T>(
  nombreBase: string,
  columnas: ColumnaExcel<T>[],
  filas: T[],
): void {
  const valores = filas.map((f) => columnas.map((c) => String(c.valor(f) ?? '')));

  // Ancho por columna según el contenido más largo (aprox. 7 px por carácter).
  const anchos = columnas.map((c, i) => {
    const maxLargo = Math.max(c.titulo.length, ...valores.map((v) => v[i].length), 8);
    return Math.min(maxLargo * 7 + 16, 320);
  });

  const thEstilo =
    'background:#1B4965;color:#FFFFFF;font-weight:bold;text-align:left;' +
    'padding:6px 10px;border:1px solid #9DB2BF;font-family:Segoe UI,Arial,sans-serif;font-size:12px;';
  const tdEstilo =
    'padding:4px 10px;border:1px solid #D8E1E8;font-family:Segoe UI,Arial,sans-serif;font-size:11px;';

  const html =
    '<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table>' +
    `<colgroup>${anchos.map((w) => `<col width="${w}">`).join('')}</colgroup>` +
    `<thead><tr>${columnas.map((c) => `<th style="${thEstilo}">${escapeHtml(c.titulo)}</th>`).join('')}</tr></thead>` +
    `<tbody>${valores
      .map(
        (v) =>
          `<tr>${v
            .map((celda) => `<td style="${tdEstilo}mso-number-format:'\\@';">${escapeHtml(celda)}</td>`)
            .join('')}</tr>`,
      )
      .join('')}</tbody>` +
    '</table></body></html>';

  const blob = new Blob(['﻿' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `${nombreBase}_${marcaDeTiempoArchivo()}.xls`;
  enlace.click();
  URL.revokeObjectURL(url);
}
