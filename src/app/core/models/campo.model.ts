/** Tipos de dato admitidos para campos dinámicos. */
export type CampoTipo =
  | 'text'
  | 'number'
  | 'select'
  | 'date'
  | 'radio'
  | 'checkbox'
  | 'textarea';

/** Formularios configurables del sistema. */
export type FormularioKey =
  | 'capacitacion'
  | 'asistencia'
  | 'participante_cap'
  | 'participante_at';

export interface CampoPersonalizado {
  id: string;
  area: string;
  formulario: FormularioKey;
  nombre: string;
  tipo: CampoTipo;
  opciones?: string[];
  requerido: boolean;
  activo: boolean;
  tieneData?: boolean;
  visiblePorArea?: Record<string, boolean>;
}

/** Campo base (no editable) de un formulario, agrupado por sección. */
export interface CampoBase {
  nombre: string;
  tipo: CampoTipo;
  seccion: string;
  requerido?: boolean;
}
