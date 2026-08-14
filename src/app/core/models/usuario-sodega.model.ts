/**
 * Modelo de usuarios y perfiles de la Plataforma SODEGA.
 * Migrado del prototipo base (docs/referencia/sodega-login-permisos.html).
 */
import type { PermisosMenu } from './permisos-menu.model';

/** Perfiles oficiales del sistema (jerarquía descendente). */
export type PerfilConocido =
  | 'Administrador General'
  | 'Jefe de Área'
  | 'Administrador Unidad Ejecutora(UE)'
  | 'Administrador DZ_Cap_Asit.'
  | 'Técnico Capacitación y Asistencia Técnica';

/**
 * Perfil autorizado: los cinco oficiales más los perfiles personalizados
 * creados desde Administración de Listas → "Perfil Autorizado".
 * (`string & {}` conserva el autocompletado de los perfiles conocidos.)
 */
export type Perfil = PerfilConocido | (string & {});

export const PERFILES: PerfilConocido[] = [
  'Administrador General',
  'Jefe de Área',
  'Administrador Unidad Ejecutora(UE)',
  'Administrador DZ_Cap_Asit.',
  'Técnico Capacitación y Asistencia Técnica',
];

/**
 * Seguimiento (revisión / aprobación) no corresponde al Administrador General:
 * su rol es configurar y administrar, no evaluar registros de las áreas.
 *
 * Es la regla de negocio única que consultan el menú lateral, el `roleGuard` y
 * las tarjetas del inicio, para que visibilidad y acceso no puedan divergir.
 */
export function perfilAccedeASeguimiento(perfil: Perfil | ''): boolean {
  return !!perfil && perfil !== 'Administrador General';
}

export type RegimenLaboral =
  | 'Decreto Legislativo 728'
  | 'Decreto Legislativo 276'
  | 'Régimen CAS'
  | 'Régimen CAS Temporal'
  | 'Locador de Servicio (OS)';

export type EstadoCuenta = 'HABILITADO' | 'INHABILITADO';

export interface AmbitoTerritorial {
  region: string;
  provincia: string; // '-' cuando el perfil es solo-región (Admin UO)
  distrito: string;  // '-' cuando el perfil es solo-región (Admin UO)
}

/**
 * Meta operativa asignada a un ámbito territorial. Aplica cuando un
 * Administrador DZ_Cap_Asit. registra un Técnico Capacitación y Asistencia
 * Técnica (una fila por ámbito, cantidades enteras ≥ 0).
 */
export interface MetaAmbitoTerritorial extends AmbitoTerritorial {
  cantidadCapacitaciones: number;
  cantidadAsistenciaTecnica: number;
}

/** Registro de usuario SODEGA (un usuario puede tener varios registros por unidad). */
export interface UsuarioSodega {
  id: string;
  dni: string;
  nombres: string;
  apePat: string;
  apeMat: string;
  estCivil: string;
  profesion: string;
  direccion: string;
  ubigeo: string;
  restricciones: string;
  sexo: string;
  fechaNac: string; // dd/mm/aaaa (RENIEC)
  edad: string;
  celular: string;
  unidad: string; // Unidad Responsable
  userGen: string; // usuario unificado generado
  correo: string;
  regimen: RegimenLaboral | '';
  estado: EstadoCuenta;
  fechaIni: string; // ISO — solo OS / CAS Temporal
  fechaFin: string; // ISO — solo OS / CAS Temporal
  nroOrden: string; // solo Locador de Servicio (OS)
  perfil: Perfil;
  opa: string;
  fuenteFinanc: string;
  categoriaPresup: string;
  programaPresup: string;
  unidadFuncional: string;
  creadoPor?: string;
  ambitos: AmbitoTerritorial[];
  /** Metas por ámbito territorial (solo Técnicos registrados por un Admin DZ_Cap_Asit.). */
  metasAmbito?: MetaAmbitoTerritorial[];
  /**
   * Periodos de gestión del servicio (REQ Gestión de Periodos):
   *  - 728 / 276 / CAS: un periodo elegido por el usuario (tipo + año).
   *  - CAS Temporal / Locador: generados automáticamente del rango de fechas.
   * Opcional para compatibilidad con registros previos a la funcionalidad.
   */
  periodosGestion?: PeriodoGestion[];
  /** Permisos de menú del usuario (solo perfiles con esquema configurable). */
  permisosMenu?: PermisosMenu;
  inhabilitadoPorVencimiento?: boolean;
  // Derivados (recalculados por el servicio)
  diasRestantes?: number | null;
  vigenciaCalculada?: string;
}

/** Datos devueltos por la consulta RENIEC (simulada). */
export interface DatosReniec {
  apePat: string;
  apeMat: string;
  nombres: string;
  estCivil: string;
  direccion: string;
  ubigeo: string;
  restricciones: string;
  fechaNac: string;
  sexo: string;
  edad: string;
  celularSugerido: string;
  userGenerado: string;
  correoSugerido: string;
}

/* ===== Periodos de gestión por régimen laboral ===== */

export type TipoPeriodoGestion = 'Regular' | 'Extraordinario';

export interface PeriodoGestion {
  tipo: TipoPeriodoGestion;
  /** Año de referencia del periodo (compatibilidad y reglas de vigencia). */
  anio: number;
  /** Regular: meses seleccionados (1–12) en orden cronológico. */
  meses?: number[];
  /** Extraordinario: rango de fechas ISO `YYYY-MM-DD`. */
  fechaInicio?: string;
  fechaFin?: string;
}

/** Regímenes de contrato temporal (vigencia por fechas). */
export const REGIMENES_TEMPORALES: readonly string[] = [
  'Régimen CAS Temporal',
  'Locador de Servicio (OS)',
];

export function esRegimenTemporal(regimen: string): boolean {
  return REGIMENES_TEMPORALES.includes(regimen);
}

/**
 * Regímenes seleccionables al registrar un NUEVO SERVICIO sobre un registro
 * existente: si el servicio previo es temporal (CAS Temporal / Locador), el
 * nuevo servicio solo puede ser de esos mismos regímenes. Regla de negocio
 * única, usada tanto para poblar el selector como para validar el guardado.
 */
export function regimenesPermitidosParaNuevoServicio(
  regimenPrevio: string,
  disponibles: readonly string[],
): readonly string[] {
  return esRegimenTemporal(regimenPrevio)
    ? disponibles.filter((r) => esRegimenTemporal(r))
    : disponibles;
}

/** Regímenes cuyo periodo de gestión lo elige el usuario (tipo + año). */
export const REGIMENES_CON_PERIODO: readonly string[] = [
  'Decreto Legislativo 728',
  'Decreto Legislativo 276',
  'Régimen CAS',
];

export function regimenConPeriodo(regimen: string): boolean {
  return REGIMENES_CON_PERIODO.includes(regimen);
}

/** ISO `YYYY-MM-DD` → `DD/MM/YYYY`. */
function aDDMMYYYY(iso: string): string {
  return iso.split('-').reverse().join('/');
}

/**
 * Rango de fechas que cubre un periodo de gestión, en ISO.
 *
 * Los periodos registrados desde el formulario guardan el rango elegido. Los
 * anteriores solo guardaban los meses, así que se deriva: del día 1 del primer
 * mes al último día del último mes. Con meses no contiguos el rango abarca
 * desde el primero hasta el último, que es como se presenta el periodo.
 */
export function rangoDePeriodo(p: PeriodoGestion): { desde: string; hasta: string } | null {
  if (p.fechaInicio && p.fechaFin) return { desde: p.fechaInicio, hasta: p.fechaFin };
  const meses = [...new Set(p.meses ?? [])].sort((a, b) => a - b);
  if (!meses.length) return null;
  const primero = meses[0];
  const ultimo = meses[meses.length - 1];
  const dd = (n: number) => String(n).padStart(2, '0');
  // Día 0 del mes siguiente = último día del mes pedido.
  const ultimoDia = new Date(p.anio, ultimo, 0).getDate();
  return {
    desde: `${p.anio}-${dd(primero)}-01`,
    hasta: `${p.anio}-${dd(ultimo)}-${dd(ultimoDia)}`,
  };
}

/**
 * Etiqueta única del periodo (tabla, formulario y cabecera): siempre el
 * intervalo de fechas, "01/01/2026 - 30/04/2026", nunca la lista de meses.
 * Sin datos suficientes (registros previos) cae al tipo y el año.
 */
export function formatearPeriodo(p: PeriodoGestion): string {
  const rango = rangoDePeriodo(p);
  return rango ? `${aDDMMYYYY(rango.desde)} - ${aDDMMYYYY(rango.hasta)}` : `${p.tipo} ${p.anio}`;
}

/**
 * Años calendario que abarca el rango de un contrato temporal.
 * Ej.: 2026-11-01 → 2027-03-15 produce [2026, 2027].
 */
export function aniosDeRango(fechaIniISO: string, fechaFinISO: string): number[] {
  const anioIni = Number(fechaIniISO?.slice(0, 4));
  const anioFin = Number(fechaFinISO?.slice(0, 4));
  if (!Number.isInteger(anioIni) || !Number.isInteger(anioFin) || anioFin < anioIni) return [];
  return Array.from({ length: anioFin - anioIni + 1 }, (_, i) => anioIni + i);
}

/**
 * Periodos Regulares generados automáticamente a partir del rango de un
 * contrato temporal (uno por cada año calendario que abarque el rango).
 * Ej.: 2026-11-01 → 2027-03-15 produce [Regular 2026, Regular 2027].
 */
export function periodosDesdeRango(fechaIniISO: string, fechaFinISO: string): PeriodoGestion[] {
  return aniosDeRango(fechaIniISO, fechaFinISO).map((anio) => ({ tipo: 'Regular' as const, anio }));
}

/**
 * Meses (1–12) comprendidos en el rango de un contrato temporal, en orden
 * ascendente y sin repetidos. Con `anio` se acota a ese año calendario, que es
 * lo que necesita un contrato que cruza de un año a otro.
 *
 * Ej.: 2026-03-15 → 2026-08-20 devuelve [3, 4, 5, 6, 7, 8].
 * Ej.: 2026-11-01 → 2027-03-15 con `anio` 2027 devuelve [1, 2, 3].
 */
export function mesesDeRangoNumeros(
  fechaIniISO: string,
  fechaFinISO: string,
  anio?: number,
): number[] {
  const ini = fechaIniISO?.split('-').map(Number);
  const fin = fechaFinISO?.split('-').map(Number);
  if (!ini || !fin || ini.length < 2 || fin.length < 2) return [];
  if (ini.some(Number.isNaN) || fin.some(Number.isNaN)) return [];
  const desde = ini[0] * 12 + (ini[1] - 1);
  const hasta = fin[0] * 12 + (fin[1] - 1);
  if (hasta < desde) return [];
  const meses = new Set<number>();
  for (let m = desde; m <= hasta && meses.size < 12; m++) {
    if (anio !== undefined && Math.floor(m / 12) !== anio) continue;
    meses.add((m % 12) + 1);
  }
  return [...meses].sort((a, b) => a - b);
}

/* ===== Año de gestión y tope de vigencia ===== */

/**
 * Año de gestión del sistema: el año calendario en curso. Es la única fuente de
 * verdad — no hay ningún año codificado en la aplicación, así que al cambiar de
 * ejercicio todas las reglas que dependen de él se ajustan solas.
 */
export function anioGestionVigente(hoy = new Date()): number {
  return hoy.getFullYear();
}

/**
 * Último día permitido para cualquier vigencia (contratos temporales y periodos
 * Extraordinarios): 31 de diciembre del año de gestión, en formato ISO
 * `YYYY-MM-DD` para poder usarlo directamente en el atributo `max` de los
 * `<input type="date">` y en comparaciones de cadena.
 */
export function fechaMaximaVigencia(hoy = new Date()): string {
  return `${anioGestionVigente(hoy)}-12-31`;
}

/** ¿La fecha ISO supera el 31 de diciembre del año de gestión? */
export function excedeAnioGestion(fechaISO: string, hoy = new Date()): boolean {
  return !!fechaISO && fechaISO > fechaMaximaVigencia(hoy);
}

/**
 * Meses (1–12) que aún pueden activarse en un periodo **Regular** del año de
 * gestión indicado. Regla de negocio única, usada tanto para deshabilitar los
 * checkboxes como para validar el alta del periodo:
 *  - Año de gestión = año actual → desde el mes en curso hasta diciembre.
 *  - Año de gestión anterior     → ninguno (histórico: ya no puede activarse).
 *  - Año de gestión futuro       → ninguno (el sistema no admite años futuros).
 */
export function mesesHabilitadosParaAnio(anio: number, hoy = new Date()): number[] {
  if (!Number.isInteger(anio) || anio !== anioGestionVigente(hoy)) return [];
  const mesActual = hoy.getMonth() + 1;
  return Array.from({ length: 12 - mesActual + 1 }, (_, i) => mesActual + i);
}

/** ¿El mes puede activarse en el año de gestión indicado? */
export function mesHabilitadoParaAnio(mes: number, anio: number, hoy = new Date()): boolean {
  return mesesHabilitadosParaAnio(anio, hoy).includes(mes);
}

/**
 * Regla única de meses activables en un periodo **Regular**, según el régimen:
 *  - CAS Temporal / Locador de Servicio (OS): los meses vienen dados por la
 *    vigencia del contrato (Fecha de inicio → Fecha fin). Fuera de ese rango
 *    ningún mes puede marcarse, aunque sea del año en curso.
 *  - Resto de regímenes: la regla por Año de Gestión (`mesesHabilitadosParaAnio`).
 *
 * La usan tanto el formulario (para marcar/deshabilitar los checkboxes) como la
 * validación del alta del periodo, de modo que no puedan divergir.
 */
export function mesesActivablesPeriodoRegular(
  opciones: { anio: number; regimen: string; fechaIni?: string; fechaFin?: string },
  hoy = new Date(),
): number[] {
  if (esRegimenTemporal(opciones.regimen)) {
    return mesesDeRangoNumeros(opciones.fechaIni ?? '', opciones.fechaFin ?? '', opciones.anio);
  }
  return mesesHabilitadosParaAnio(opciones.anio, hoy);
}

/**
 * Detalle del periodo en la cabecera: el mismo intervalo de fechas que las
 * tablas. Sin datos suficientes queda el año, porque el tipo ya se antepone.
 */
export function detallePeriodoCabecera(p: PeriodoGestion): string {
  const rango = rangoDePeriodo(p);
  return rango ? `${aDDMMYYYY(rango.desde)} - ${aDDMMYYYY(rango.hasta)}` : String(p.anio);
}

/** "Regular | Marzo - Abril - Mayo - Junio" (línea informativa de la cabecera). */
export function etiquetaPeriodoCabecera(p: PeriodoGestion): string {
  return `${p.tipo} | ${detallePeriodoCabecera(p)}`;
}

export type EstadoVigencia = 'Vigente' | 'Próximo a vencer' | 'Expirado';

/**
 * Estado de vigencia del servicio (función única, sin lógica duplicada):
 *  - CAS Temporal / Locador: por fecha fin (expirado si ya pasó; próximo a
 *    vencer dentro de los últimos 30 días de contrato).
 *  - Regímenes con periodo: el periodo permitido por negocio es el del año
 *    en curso — un periodo de un año anterior está expirado y, durante
 *    diciembre, el periodo del año en curso queda próximo a vencer.
 *  - Registros sin datos de periodo (previos a la funcionalidad): Vigente.
 */
function estadoPorFechaFin(fechaFin: string): EstadoVigencia {
  const dias = calcularDiasRestantes(fechaFin);
  if (dias === null) return 'Vigente';
  if (dias < 0) return 'Expirado';
  return dias <= 30 ? 'Próximo a vencer' : 'Vigente';
}

/** Estado de un periodo concreto (Extraordinario por rango; Regular por año). */
export function estadoPeriodo(p: PeriodoGestion, hoy = new Date()): EstadoVigencia {
  if (p.tipo === 'Extraordinario' && p.fechaFin) return estadoPorFechaFin(p.fechaFin);
  if (p.anio < hoy.getFullYear()) return 'Expirado';
  return hoy.getMonth() === 11 && p.anio === hoy.getFullYear() ? 'Próximo a vencer' : 'Vigente';
}

export function estadoVigenciaDe(
  u: Pick<UsuarioSodega, 'regimen' | 'fechaFin' | 'periodosGestion'>,
  hoy = new Date(),
): EstadoVigencia {
  if (esRegimenTemporal(u.regimen)) return estadoPorFechaFin(u.fechaFin);
  const periodos = u.periodosGestion ?? [];
  if (!periodos.length) return 'Vigente';
  // El servicio está expirado solo si todos sus periodos lo están.
  const estados = periodos.map((p) => estadoPeriodo(p, hoy));
  if (estados.every((e) => e === 'Expirado')) return 'Expirado';
  return estados.includes('Próximo a vencer') && !estados.includes('Vigente')
    ? 'Próximo a vencer'
    : 'Vigente';
}

/* ===== Reglas de vigencia (idénticas al prototipo) ===== */

/** Permanente = régimen indeterminado o sin fecha fin. */
export function esUsuarioPermanente(u: Pick<UsuarioSodega, 'regimen' | 'fechaFin'>): boolean {
  return !(u.regimen === 'Locador de Servicio (OS)' || u.regimen === 'Régimen CAS Temporal') || !u.fechaFin;
}

/**
 * Días calendario entre dos fechas ISO (yyyy-mm-dd); null si son inválidas.
 * Usado para validar la vigencia mínima de contratos OS / CAS Temporal.
 */
export function calcularDiasCalendarioEntre(fechaIni: string, fechaFin: string): number | null {
  const inicio = fechaIni.split('-').map(Number);
  const fin = fechaFin.split('-').map(Number);
  if (inicio.length !== 3 || fin.length !== 3 || inicio.some(Number.isNaN) || fin.some(Number.isNaN)) return null;
  const inicioUtc = Date.UTC(inicio[0], inicio[1] - 1, inicio[2]);
  const finUtc = Date.UTC(fin[0], fin[1] - 1, fin[2]);
  return Math.round((finUtc - inicioUtc) / (1000 * 60 * 60 * 24));
}

/** Días hasta la fecha fin (−1 si ya expiró; null si no aplica). */
export function calcularDiasRestantes(fechaFin: string): number | null {
  if (!fechaFin) return null;
  const partes = fechaFin.split('-').map(Number);
  if (partes.length !== 3 || partes.some(Number.isNaN)) return null;
  const [anio, mes, dia] = partes;
  const finInicioDia = new Date(anio, mes - 1, dia);
  const finCierreDia = new Date(anio, mes - 1, dia, 23, 59, 59, 999);
  const ahora = new Date();
  if (ahora > finCierreDia) return -1;
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  return Math.max(0, Math.round((finInicioDia.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)));
}

/** Perfiles que requieren ámbito territorial asignado. */
export function perfilRequiereAmbito(perfil: string): boolean {
  return (
    perfil === 'Administrador Unidad Ejecutora(UE)' ||
    perfil === 'Administrador DZ_Cap_Asit.' ||
    perfil === 'Técnico Capacitación y Asistencia Técnica'
  );
}

/** Admin UO asigna ámbito solo a nivel de región. */
export function perfilSoloRegion(perfil: string): boolean {
  return perfil === 'Administrador Unidad Ejecutora(UE)';
}

/**
 * Las metas por ámbito territorial aplican únicamente cuando un
 * Administrador DZ_Cap_Asit. registra un Técnico Capacitación y Asistencia Técnica.
 */
export function aplicaMetasPorAmbito(perfilActivo: string, perfilObjetivo: string): boolean {
  return (
    perfilActivo === 'Administrador DZ_Cap_Asit.' &&
    perfilObjetivo === 'Técnico Capacitación y Asistencia Técnica'
  );
}

/**
 * Partículas de los nombres y apellidos españoles que se escriben en minúscula
 * cuando no encabezan el texto ("Luis de la Cruz", "María del Carmen").
 */
const PARTICULAS_NOMBRE = new Set([
  'de', 'del', 'la', 'las', 'lo', 'los', 'y', 'e', 'i',
  'da', 'das', 'do', 'dos', 'van', 'von', 'di', 'le', 'san', 'santa',
]);

/**
 * Capitaliza nombres propios en español.
 *
 * Recorre las palabras con `\p{L}` (bandera `u`, disponible desde ES2018; el
 * proyecto compila a ES2022), de modo que las letras acentuadas, la ñ y la
 * diéresis forman parte de la palabra y no rompen el límite: la versión previa
 * usaba `\b\w`, donde `\w` es solo `[A-Za-z0-9_]`, y producía "RíOs", "HuamáN"
 * o "IbáñEz". Las partículas quedan en minúscula salvo cuando abren el texto, y
 * los separadores (espacios, guiones, apóstrofos, comas, paréntesis) se
 * conservan intactos.
 *
 *   toTitleCase('JOSÉ ÁLVAREZ')      → 'José Álvarez'
 *   toTitleCase('maría del carmen')  → 'María del Carmen'
 *   toTitleCase('LUIS DE LA CRUZ')   → 'Luis de la Cruz'
 */
export function toTitleCase(str: string): string {
  if (!str) return '';
  let esPrimera = true;
  return str
    .trim()
    .toLowerCase()
    .replace(/[\p{L}\p{N}]+/gu, (palabra) => {
      const capitalizada = palabra.charAt(0).toUpperCase() + palabra.slice(1);
      const resultado = !esPrimera && PARTICULAS_NOMBRE.has(palabra) ? palabra : capitalizada;
      esPrimera = false;
      return resultado;
    });
}
