/** Utilidades de normalización de texto compartidas. */

/**
 * Normaliza un nombre de catálogo para comparaciones tolerantes:
 * minúsculas, sin tildes, sin signos `()._-` y espacios colapsados.
 * (Misma semántica que `normalizarNombreCatalogo` del prototipo SODEGA.)
 */
export function normalizarNombreCatalogo(texto: string): string {
  return (texto || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[()._-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
