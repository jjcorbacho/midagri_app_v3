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
