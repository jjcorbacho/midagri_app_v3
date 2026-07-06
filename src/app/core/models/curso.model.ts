/** Estados del flujo de vida de un evento (capacitación / asistencia técnica). */
export type EstadoCurso =
  | 'Registrado'
  | 'Enviado'
  | 'Enviado-Subsanado'
  | 'Validado'
  | 'Observado'
  | 'Aprobado';

export const ESTADOS: EstadoCurso[] = [
  'Registrado',
  'Enviado',
  'Enviado-Subsanado',
  'Validado',
  'Observado',
  'Aprobado',
];

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

const ESTADOS_BLOQUEADOS_EDICION: EstadoCurso[] = [
  'Enviado',
  'Enviado-Subsanado',
  'Validado',
  'Aprobado',
];

/** Editar solo si está en Registrado u Observado. */
export function canEditCurso(c: Curso): boolean {
  return c.estado === 'Registrado' || c.estado === 'Observado';
}

/** No eliminar si tiene participantes o está fuera de Registrado. */
export function canDeleteCurso(c: Curso): boolean {
  return c.estado === 'Registrado' && (c.participantes ?? 0) === 0;
}

export function canAddParticipants(c: Curso): boolean {
  return c.estado === 'Registrado' || c.estado === 'Observado';
}

export function canEditParticipant(c: Curso): boolean {
  return canAddParticipants(c);
}

export function canDeleteParticipant(c: Curso): boolean {
  return canAddParticipants(c);
}

export function canSendForReview(c: Curso): boolean {
  return (c.estado === 'Registrado' || c.estado === 'Observado') && (c.participantes ?? 0) > 0;
}

export function isLocked(c: Curso): boolean {
  return ESTADOS_BLOQUEADOS_EDICION.includes(c.estado);
}

export function nextEstadoOnSend(c: Curso): EstadoCurso {
  return c.estado === 'Observado' ? 'Enviado-Subsanado' : 'Enviado';
}
