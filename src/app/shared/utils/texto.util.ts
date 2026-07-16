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

/**
 * Normaliza un texto para búsquedas en vivo: minúsculas y sin tildes,
 * preservando el resto de caracteres ("Junín" ≍ "junin", "Áncash" ≍ "ancash").
 */
export function normalizarBusqueda(texto: string): string {
  return (texto || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}
