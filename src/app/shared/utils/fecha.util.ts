/** Utilidades de fecha compartidas (mismas semánticas que el original). */

export function calcEdad(fechaISO: string): string {
  if (!fechaISO) return '';
  const d = new Date(fechaISO);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const age = new Date(diff).getUTCFullYear() - 1970;
  return age >= 0 ? String(age) : '';
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function todayDDMMYYYY(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export function isoToDDMMYYYY(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** Formatea una fecha ISO al estilo "12 May 2024" (es-PE). */
export function isoToFechaCorta(iso: string): string {
  const base = iso ? new Date(iso) : new Date();
  return base.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

const MESES_CORTOS: Record<string, number> = {
  ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
  jul: 6, ago: 7, sep: 8, set: 8, oct: 9, nov: 10, dic: 11,
};

/**
 * Convierte las fechas de curso a timestamp local (medianoche) para poder
 * compararlas en filtros de rango. Acepta los dos formatos presentes en el
 * sistema — ISO `YYYY-MM-DD` y corto `12 May 2024` (es-PE) — y devuelve
 * `null` si el texto no es interpretable.
 */
export function parseFechaCurso(fecha: string): number | null {
  if (!fecha) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha.trim());
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]).getTime();
  const corto = /^(\d{1,2})\s+([A-Za-zÁ-ú]{3,})\.?\s+(\d{4})$/.exec(fecha.trim());
  if (corto) {
    const mes = MESES_CORTOS[corto[2].slice(0, 3).toLowerCase()];
    if (mes !== undefined) return new Date(+corto[3], mes, +corto[1]).getTime();
  }
  const t = Date.parse(fecha);
  return Number.isNaN(t) ? null : t;
}
