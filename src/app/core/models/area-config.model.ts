export type TipoActividadArea = 'capacitaciones' | 'asistencias' | 'ambas';
export type ModalidadAT = 'individual' | 'grupal' | 'ambas';
export type PeriodoMedicion = 'mensual' | 'trimestral' | 'semestral' | 'anual';
export type CriterioExito =
  | 'solo_cap'
  | 'solo_at'
  | 'combinada_paralela'
  | 'combinada_cruzada'
  | 'none';

export interface ActivityRules {
  participantesMin: number; // bloqueado en 1
  participantesMax: number;
  horasMin: number;
  horasMax: number;
  paraConsiderado: number; // legacy — eventos en el periodo para considerar al participante
}

export interface AreaConfig {
  // Legacy (mantenido para compatibilidad con lectores existentes)
  tipoActividad: TipoActividadArea;
  periodoMedicion: PeriodoMedicion;
  capacitacion: ActivityRules;
  asistencia: ActivityRules & {
    modalidadAT: ModalidadAT;
    vinculadaACapacitacion: boolean;
  };
  mixtoParaCapacitadoYAsistido: number;

  // Nuevo modelo del Configurador de Reglas
  capacitacionActiva: boolean;
  asistenciaActiva: boolean;
  atIndividualActiva: boolean;
  atGrupalActiva: boolean;
  criterioExito: CriterioExito;
  metaCapacitaciones: number;
  metaAT: number;
}

const defaultCapRules: ActivityRules = {
  participantesMin: 1,
  participantesMax: 99999,
  horasMin: 1,
  horasMax: 12,
  paraConsiderado: 2,
};

const defaultAtRules: ActivityRules = {
  participantesMin: 1,
  participantesMax: 99999,
  horasMin: 1,
  horasMax: 8,
  paraConsiderado: 2,
};

export const DEFAULT_AREA_CONFIG: AreaConfig = {
  tipoActividad: 'ambas',
  periodoMedicion: 'anual',
  capacitacion: { ...defaultCapRules },
  asistencia: { ...defaultAtRules, modalidadAT: 'ambas', vinculadaACapacitacion: false },
  mixtoParaCapacitadoYAsistido: 3,
  capacitacionActiva: true,
  asistenciaActiva: true,
  atIndividualActiva: true,
  atGrupalActiva: true,
  criterioExito: 'combinada_paralela',
  metaCapacitaciones: 2,
  metaAT: 2,
};
