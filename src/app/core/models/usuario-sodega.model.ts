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

/**
 * Etiqueta única del periodo (tabla y formulario):
 *  - Regular con meses      → "Enero, Febrero y Marzo"
 *  - Extraordinario con rango → "01/03/2026 - 31/08/2026"
 *  - Sin detalle (registros previos) → "Regular 2026"
 */
export function formatearPeriodo(p: PeriodoGestion): string {
  if (p.tipo === 'Regular' && p.meses?.length) return nombresDeMeses(p.meses);
  if (p.tipo === 'Extraordinario' && p.fechaInicio && p.fechaFin) {
    const dm = (iso: string) => iso.split('-').reverse().join('/');
    return `${dm(p.fechaInicio)} - ${dm(p.fechaFin)}`;
  }
  return `${p.tipo} ${p.anio}`;
}

/**
 * Periodos Regulares generados automáticamente a partir del rango de un
 * contrato temporal (uno por cada año calendario que abarque el rango).
 * Ej.: 2026-11-01 → 2027-03-15 produce [Regular 2026, Regular 2027].
 */
export function periodosDesdeRango(fechaIniISO: string, fechaFinISO: string): PeriodoGestion[] {
  const anioIni = Number(fechaIniISO?.slice(0, 4));
  const anioFin = Number(fechaFinISO?.slice(0, 4));
  if (!Number.isInteger(anioIni) || !Number.isInteger(anioFin) || anioFin < anioIni) return [];
  return Array.from({ length: anioFin - anioIni + 1 }, (_, i) => ({
    tipo: 'Regular' as const,
    anio: anioIni + i,
  }));
}

export const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/** "Enero, Marzo y Julio" a partir de los números de mes (1–12). */
export function nombresDeMeses(meses: readonly number[]): string {
  const ordenados = [...new Set(meses)].sort((a, b) => a - b).map((m) => MESES_ES[m - 1]).filter(Boolean);
  if (ordenados.length === 0) return '';
  if (ordenados.length === 1) return ordenados[0];
  return `${ordenados.slice(0, -1).join(', ')} y ${ordenados[ordenados.length - 1]}`;
}

/**
 * Meses comprendidos en el rango de un contrato temporal, en orden
 * cronológico, sin repetidos, con nombres completos en español y sin año.
 * Ej.: 2026-02-01 → 2026-07-23 = "Febrero, Marzo, Abril, Mayo, Junio y Julio".
 */
export function mesesDeRango(fechaIniISO: string, fechaFinISO: string): string {
  const ini = fechaIniISO?.split('-').map(Number);
  const fin = fechaFinISO?.split('-').map(Number);
  if (!ini || !fin || ini.length < 2 || fin.length < 2 || ini.some(Number.isNaN) || fin.some(Number.isNaN)) return '';
  const desde = ini[0] * 12 + (ini[1] - 1);
  const hasta = fin[0] * 12 + (fin[1] - 1);
  if (hasta < desde) return '';
  const meses: string[] = [];
  for (let m = desde; m <= hasta && meses.length < 12; m++) {
    const nombre = MESES_ES[m % 12];
    if (!meses.includes(nombre)) meses.push(nombre);
  }
  if (meses.length === 1) return meses[0];
  return `${meses.slice(0, -1).join(', ')} y ${meses[meses.length - 1]}`;
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

export function toTitleCase(str: string): string {
  if (!str) return '';
  return str.trim().toLowerCase().replace(/\b\w/g, (s) => s.toUpperCase());
}
