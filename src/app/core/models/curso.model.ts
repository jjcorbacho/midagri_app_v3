/**
 * Estados del flujo de vida de un evento (capacitación / asistencia técnica).
 *
 * La denominación es la del cuadro oficial "Estados para los perfiles
 * Cap_Asist.tecnicas": observación y aprobación llevan el perfil que las
 * ejecutó, de modo que el estado dice por sí solo quién actuó. El antiguo
 * "Validado" del Administrador DZ es hoy "Aprobado por DZ", y "Observado"
 * pasó a ser "Observado por DZ/UE/JA".
 */
export type EstadoCurso =
  | 'Registrado'
  | 'Enviado'
  | 'Enviado-subsanado'
  | 'Observado por DZ'
  | 'Observado por UE'
  | 'Observado por JA'
  | 'Aprobado por DZ'
  | 'Aprobado por UE'
  | 'Aprobado por JA';

export const ESTADOS: EstadoCurso[] = [
  'Registrado',
  'Enviado',
  'Enviado-subsanado',
  'Observado por DZ',
  'Observado por UE',
  'Observado por JA',
  'Aprobado por DZ',
  'Aprobado por UE',
  'Aprobado por JA',
];

/** Instancia observada, sea cual sea el perfil que observó. */
export function esObservado(estado: EstadoCurso): boolean {
  return estado.startsWith('Observado por ');
}

/** Instancia aprobada por algún perfil evaluador (incluida la del DZ). */
export function esAprobado(estado: EstadoCurso): boolean {
  return estado.startsWith('Aprobado por ');
}

/**
 * Aprobación que cierra el recorrido del registro.
 *
 * La del Administrador DZ es un paso intermedio —el registro sigue camino
 * hacia la Unidad Ejecutora o la Jefatura de Área—, así que no cuenta como
 * aprobado para los indicadores, igual que no lo hacía el antiguo "Validado".
 */
export function esAprobacionFinal(estado: EstadoCurso): boolean {
  return estado === 'Aprobado por UE' || estado === 'Aprobado por JA';
}

/** Registro remitido por el técnico y pendiente de evaluación. */
export function esEnviado(estado: EstadoCurso): boolean {
  return estado === 'Enviado' || estado === 'Enviado-subsanado';
}

export type TipoCurso = 'capacitacion' | 'asistencia';

export interface ObservacionItem {
  fecha: string; // dd/mm/yyyy
  descripcion: string;
  autor?: string;
}

/** Detalle completo del evento tal como se captura en el formulario del Paso 1. */
export interface DetalleEvento {
  codigo: string;
  tematica: string;
  tipoEvento: string;
  modalidadAT: string;
  fecha: string;
  hora: string;
  horas: number;
  nombre: string;
  extensionista: string;
  observaciones: string;
  capacitacionVinculadaId: string;
  region: string;
  provincia: string;
  distrito: string;
  centroPoblado: string;
  utmZona: string;
  utmEste: string;
  utmNorte: string;
  longitud: string;
  latitud: string;
  altitud: string;
  archivoNombre: string;
  archivoRuta: string;
  custom: Record<string, string>;
}

export interface Curso {
  id: string;
  codigo: string;
  nombreTema: string;
  estado: EstadoCurso;
  fecha: string;
  hora: string;
  horas: number;
  participantes: number;
  region: string;
  provincia: string;
  distrito: string;
  area: string;
  tipo: TipoCurso;
  extensionista: string;
  observacionesHistorial?: ObservacionItem[];
  fotoSustento?: string;
  capacitacionVinculadaId?: string;
  detalle?: DetalleEvento;
}

/* ===== Reglas de negocio del ciclo de vida (idénticas al original) ===== */

/** Editar solo si está en Registrado o devuelto con observación. */
export function canEditCurso(c: Curso): boolean {
  return c.estado === 'Registrado' || esObservado(c.estado);
}

/** No eliminar si tiene participantes o está fuera de Registrado. */
export function canDeleteCurso(c: Curso): boolean {
  return c.estado === 'Registrado' && (c.participantes ?? 0) === 0;
}

export function canAddParticipants(c: Curso): boolean {
  return c.estado === 'Registrado' || esObservado(c.estado);
}

export function canEditParticipant(c: Curso): boolean {
  return canAddParticipants(c);
}

export function canDeleteParticipant(c: Curso): boolean {
  return canAddParticipants(c);
}

export function canSendForReview(c: Curso): boolean {
  return (c.estado === 'Registrado' || esObservado(c.estado)) && (c.participantes ?? 0) > 0;
}

/** Bloqueado mientras está en manos de los evaluadores o ya aprobado. */
export function isLocked(c: Curso): boolean {
  return esEnviado(c.estado) || esAprobado(c.estado);
}

/** Un registro devuelto se reenvía como subsanado; el resto, como enviado. */
export function nextEstadoOnSend(c: Curso): EstadoCurso {
  return esObservado(c.estado) ? 'Enviado-subsanado' : 'Enviado';
}
