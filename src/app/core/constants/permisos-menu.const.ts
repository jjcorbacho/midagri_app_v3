// Esquemas de permisos de menú por perfil.
// Fuente oficial: matriz de permisos permisos.xlsx (hoja "Hoja 1").
// Cada perfil tiene exactamente dos grupos — Registrar (acciones que modifican
// información) y Visualizar (reportes y consulta) — con los ítems y valores
// por defecto (1 = marcado, 0 = desmarcado) definidos en el Excel.

import { EsquemaPermisosMenu, PermisoItemDef } from '../models/permisos-menu.model';
import { Perfil } from '../models/usuario-sodega.model';

/* ===== Claves de grupo ===== */
export const GRUPO_REGISTRAR = 'registrar';
export const GRUPO_VISUALIZAR = 'visualizar';

/* ===== Claves de permisos (consumidas por sidebar y guards) ===== */
export const PERMISO_CAPACITACION = 'capacitacion';
export const PERMISO_ASISTENCIA_TECNICA = 'asistenciaTecnica';
export const PERMISO_SEGUIMIENTO_REVISION = 'seguimientoRevision';
export const PERMISO_SEGUIMIENTO_APROBACION = 'seguimientoAprobacion';
export const PERMISO_GESTION_USUARIOS = 'gestionUsuarios';
export const PERMISO_LISTAS = 'listas';
export const PERMISO_CONFIG_CAMPOS = 'configuracionCampos';
export const PERMISO_CONFIG_REGLAS = 'configuracionReglas';
export const PERMISO_APROBACION_EVALUACION_UO = 'aprobacionEvaluacionUO';
export const PERMISO_EVALUACION_ADMIN_DZ = 'evaluacionAdminDZ';
export const PERMISO_EVALUACION_TECNICOS = 'evaluacionTecnicos';
export const PERMISO_REPORTE_CAPACITACIONES = 'reporteCapacitaciones';
export const PERMISO_REPORTE_ASISTENCIA = 'reporteAsistenciaTecnica';
export const PERMISO_VIDEO_INFORMATIVO = 'videoInformativo';

/* ===== Fábricas (DRY) ===== */

function item(key: string, label: string, defecto: boolean): PermisoItemDef {
  return { key, label, defecto };
}

function esquema(
  perfil: Perfil,
  registrar: PermisoItemDef[],
  visualizar: PermisoItemDef[],
): EsquemaPermisosMenu {
  return {
    perfil,
    titulo: `Permisos de menú para ${perfil}`,
    descripcion: `Seleccione las opciones que visualizará el perfil ${perfil} al ingresar al sistema.`,
    grupos: [
      { key: GRUPO_REGISTRAR, label: 'Registrar', icono: 'registrar', items: registrar },
      { key: GRUPO_VISUALIZAR, label: 'Visualizar', icono: 'visualizar', items: visualizar },
    ],
  };
}

/* Ítems de Visualizar compartidos por los perfiles administrativos (Excel: todos en 1). */
const VISUALIZAR_ADMINISTRATIVO: PermisoItemDef[] = [
  item(PERMISO_REPORTE_CAPACITACIONES, 'Reporte de capacitaciones', true),
  item(PERMISO_REPORTE_ASISTENCIA, 'Reporte de asistencia técnica', true),
  item(PERMISO_VIDEO_INFORMATIVO, 'Video informativo', true),
];

/* ===== Esquemas por perfil (matriz permisos.xlsx) ===== */

const ESQUEMA_ADMIN_GENERAL = esquema(
  'Administrador General',
  [
    item(PERMISO_CAPACITACION, 'Capacitación', true),
    item(PERMISO_ASISTENCIA_TECNICA, 'Asistencia técnica', true),
    item(PERMISO_SEGUIMIENTO_REVISION, 'Seguimiento y revisión', false),
    item(PERMISO_SEGUIMIENTO_APROBACION, 'Seguimiento y aprobación', false),
    item(PERMISO_GESTION_USUARIOS, 'Gestión de usuarios', true),
    item(PERMISO_LISTAS, 'Listas', true),
    item(PERMISO_CONFIG_CAMPOS, 'Configuración de campos', false),
    item(PERMISO_CONFIG_REGLAS, 'Configuración de reglas', false),
  ],
  [...VISUALIZAR_ADMINISTRATIVO],
);

// Nota: "Asistencia técnica" fue retirado de Jefe de Área y Admin UO por
// requerimiento (no disponible ni asignable para estos dos perfiles).
const ESQUEMA_JEFE_AREA = esquema(
  'Jefe de Área',
  [
    item(PERMISO_APROBACION_EVALUACION_UO, 'Aprobación de Evaluación UO', true),
    item(PERMISO_GESTION_USUARIOS, 'Gestión de usuarios', true),
  ],
  [...VISUALIZAR_ADMINISTRATIVO],
);

const ESQUEMA_ADMIN_UO = esquema(
  'Administrador Unidad Ejecutora(UE)',
  [
    item(PERMISO_EVALUACION_ADMIN_DZ, 'Evaluación de administrador DZ', true),
    item(PERMISO_GESTION_USUARIOS, 'Gestión de usuarios', true),
    item(PERMISO_CONFIG_REGLAS, 'Configuración de reglas', false),
    item(PERMISO_CONFIG_CAMPOS, 'Configuración de campos', true),
  ],
  [...VISUALIZAR_ADMINISTRATIVO],
);

const ESQUEMA_ADMIN_DZ = esquema(
  'Administrador DZ_Cap_Asit.',
  [
    item(PERMISO_EVALUACION_TECNICOS, 'Evaluación de técnicos', true),
    item(PERMISO_GESTION_USUARIOS, 'Gestión de usuarios', true),
  ],
  [...VISUALIZAR_ADMINISTRATIVO],
);

const ESQUEMA_TECNICO = esquema(
  'Técnico Capacitación y Asistencia Técnica',
  [
    item(PERMISO_CAPACITACION, 'Capacitación', true),
    item(PERMISO_ASISTENCIA_TECNICA, 'Asistencia técnica', true),
  ],
  [item(PERMISO_VIDEO_INFORMATIVO, 'Video informativo', true)],
);

/**
 * Esquema para perfiles personalizados (lista "Perfil Autorizado"): las mismas
 * opciones del Administrador General pero sin ningún permiso marcado por defecto.
 */
export function esquemaPerfilPersonalizado(perfil: Perfil): EsquemaPermisosMenu {
  return esquema(
    perfil,
    ESQUEMA_ADMIN_GENERAL.grupos[0].items.map((i) => item(i.key, i.label, false)),
    ESQUEMA_ADMIN_GENERAL.grupos[1].items.map((i) => item(i.key, i.label, false)),
  );
}

/** Esquemas disponibles, indexados por perfil. */
export const ESQUEMAS_PERMISOS_MENU: Partial<Record<Perfil, EsquemaPermisosMenu>> = {
  'Administrador General': ESQUEMA_ADMIN_GENERAL,
  'Jefe de Área': ESQUEMA_JEFE_AREA,
  'Administrador Unidad Ejecutora(UE)': ESQUEMA_ADMIN_UO,
  'Administrador DZ_Cap_Asit.': ESQUEMA_ADMIN_DZ,
  'Técnico Capacitación y Asistencia Técnica': ESQUEMA_TECNICO,
};
