// Esquemas de permisos de menú por perfil (pestaña Permisos de Gestión de Usuarios).
// Migrados del prototipo: PERMISOS_MENU_TECNICO_DEFAULT, PERMISOS_MENU_DZ_DEFAULT
// y PERMISOS_MENU_JEFE_DEFAULT + las secciones de checkboxes correspondientes.

import { EsquemaPermisosMenu, PermisosGrupoDef } from '../models/permisos-menu.model';
import { Perfil } from '../models/usuario-sodega.model';

/** Claves de grupo compartidas por los esquemas. */
export const GRUPO_REGISTRAR = 'registrar';
export const GRUPO_EVALUACION = 'evaluacion';
export const GRUPO_CONSULTA = 'consulta';
export const GRUPO_REPORTES = 'reportes';
export const GRUPO_ADMINISTRACION = 'administracion';
export const GRUPO_EJECUTIVO = 'ejecutivo';
export const GRUPO_AYUDA = 'ayuda';

/** Claves de permisos de Administración usadas por menú y guards. */
export const PERMISO_ADMIN_LISTAS = 'listas';
export const PERMISO_ADMIN_USUARIOS = 'usuarios';

const ESQUEMA_TECNICO: EsquemaPermisosMenu = {
  perfil: 'Técnico Capacitación y Asistencia Técnica',
  titulo: 'Permisos de menú para Técnico Capacitación y Asistencia Técnica',
  descripcion: 'Seleccione las opciones que visualizará el técnico al ingresar al sistema.',
  columnas: 4,
  grupos: [
    {
      key: GRUPO_REGISTRAR,
      label: 'Registrar',
      icono: 'registrar',
      items: [
        { key: 'capacitaciones', label: 'Capacitaciones', defecto: true },
        { key: 'asistenciaTecnica', label: 'Asistencia Técnica', defecto: true },
        { key: 'pastos', label: 'Pastos', defecto: false },
        { key: 'cobertizos', label: 'Cobertizos', defecto: false },
        { key: 'aprobacionPastos', label: 'Aprobación Pastos', defecto: false },
        { key: 'aprobacionCobertizos', label: 'Aprobación Cobertizos', defecto: false },
        { key: 'aprobacionCapacitacion', label: 'Aprobación Capacitación', defecto: false },
        { key: 'aprobacionAsistenciaTecnica', label: 'Aprobación Asistencia Técnica', defecto: false },
      ],
    },
    {
      key: GRUPO_CONSULTA,
      label: 'Consulta',
      icono: 'consulta',
      items: [
        { key: 'capacitaciones', label: 'Capacitaciones', defecto: true },
        { key: 'asistenciaTecnica', label: 'Asistencia Técnica', defecto: true },
        { key: 'pastos', label: 'Pastos', defecto: false },
        { key: 'cobertizos', label: 'Cobertizos', defecto: false },
      ],
    },
    {
      key: GRUPO_REPORTES,
      label: 'Reportes',
      icono: 'reportes',
      items: [
        { key: 'capacitaciones', label: 'Capacitaciones', defecto: false },
        { key: 'asistenciaTecnica', label: 'Asistencia Técnica', defecto: false },
        { key: 'pastos', label: 'Pastos', defecto: false },
        { key: 'cobertizos', label: 'Cobertizos', defecto: false },
      ],
    },
    {
      key: GRUPO_AYUDA,
      label: 'Ayuda',
      icono: 'ayuda',
      items: [{ key: 'videoInformativo', label: 'Video Informativo', defecto: true }],
    },
  ],
};

/**
 * Grupos compartidos por los perfiles de gestión: el prototipo usa la misma
 * sección de checkboxes (con los mismos defaults) para el Administrador DZ y
 * el Administrador Unidad Organizacional.
 */
const GRUPOS_GESTION: PermisosGrupoDef[] = [
    {
      key: GRUPO_EVALUACION,
      label: 'Registrar Evaluación de Técnico',
      icono: 'evaluacion',
      items: [
        { key: 'pastos', label: 'Aprobación Pastos', defecto: false },
        { key: 'cobertizos', label: 'Aprobación Cobertizos', defecto: false },
        { key: 'capacitacion', label: 'Aprobación Capacitación', defecto: true },
        { key: 'asistenciaTecnica', label: 'Aprobación Asistencia Técnica', defecto: true },
      ],
    },
    {
      key: GRUPO_CONSULTA,
      label: 'Consultas',
      icono: 'consulta',
      items: [
        { key: 'capacitaciones', label: 'Capacitaciones', defecto: false },
        { key: 'asistenciaTecnica', label: 'Asistencia Técnica', defecto: false },
        { key: 'pastos', label: 'Pastos', defecto: false },
        { key: 'cobertizos', label: 'Cobertizos', defecto: false },
      ],
    },
    {
      key: GRUPO_REPORTES,
      label: 'Reportes',
      icono: 'reportes',
      items: [
        { key: 'capacitaciones', label: 'Capacitaciones', defecto: true },
        { key: 'asistenciaTecnica', label: 'Asistencia Técnica', defecto: true },
        { key: 'pastos', label: 'Pastos', defecto: false },
        { key: 'cobertizos', label: 'Cobertizos', defecto: false },
      ],
    },
    {
      key: GRUPO_ADMINISTRACION,
      label: 'Administración',
      icono: 'administracion',
      items: [
        { key: PERMISO_ADMIN_LISTAS, label: 'Listas', defecto: false },
        { key: PERMISO_ADMIN_USUARIOS, label: 'Gestión de Usuario', defecto: true },
        { key: 'configuracion', label: 'Configuración', defecto: false },
      ],
    },
    {
      key: GRUPO_EJECUTIVO,
      label: 'Ejecutivo',
      icono: 'ejecutivo',
      items: [{ key: 'resumenEjecutivo', label: 'Resumen Ejecutivo', defecto: true }],
    },
    {
      key: GRUPO_AYUDA,
      label: 'Ayuda',
      icono: 'ayuda',
      items: [{ key: 'videoInformativo', label: 'Video Informativo', defecto: true }],
    },
];

const ESQUEMA_ADMIN_DZ: EsquemaPermisosMenu = {
  perfil: 'Administrador DZ_Cap_Asit.',
  titulo: 'Permisos de menú para Administrador DZ_Cap_Asit.',
  descripcion: 'Seleccione las opciones que visualizará el Administrador DZ al ingresar al sistema.',
  columnas: 3,
  grupos: GRUPOS_GESTION,
};

const ESQUEMA_ADMIN_UO: EsquemaPermisosMenu = {
  perfil: 'Administrador Unidad Organizacional',
  titulo: 'Permisos de menú para Administrador Unidad Organizacional',
  descripcion: 'Seleccione las opciones que visualizará el Administrador Unidad Organizacional al ingresar al sistema.',
  columnas: 3,
  grupos: GRUPOS_GESTION,
};

/** Grupos del Jefe de Área (el Administrador General reutiliza los mismos con otros defaults). */
const GRUPOS_JEFE: PermisosGrupoDef[] = [
    {
      key: GRUPO_REGISTRAR,
      label: 'Registrar',
      icono: 'registrar',
      items: [
        { key: 'capacitaciones', label: 'Capacitaciones', defecto: true },
        { key: 'asistenciaTecnica', label: 'Asistencia Técnica', defecto: true },
        { key: 'pastos', label: 'Pastos', defecto: false },
        { key: 'cobertizos', label: 'Cobertizos', defecto: false },
        { key: 'aprobacionPastos', label: 'Aprobación Pastos', defecto: false },
        { key: 'aprobacionCobertizos', label: 'Aprobación Cobertizos', defecto: false },
        { key: 'aprobacionCapacitacion', label: 'Aprobación Capacitación', defecto: true },
        { key: 'aprobacionAsistenciaTecnica', label: 'Aprobación Asistencia Técnica', defecto: true },
      ],
    },
    {
      key: GRUPO_CONSULTA,
      label: 'Consultas',
      icono: 'consulta',
      items: [
        { key: 'capacitaciones', label: 'Capacitaciones', defecto: true },
        { key: 'asistenciaTecnica', label: 'Asistencia Técnica', defecto: true },
        { key: 'pastos', label: 'Pastos', defecto: false },
        { key: 'cobertizos', label: 'Cobertizos', defecto: false },
      ],
    },
    {
      key: GRUPO_REPORTES,
      label: 'Reportes',
      icono: 'reportes',
      items: [
        { key: 'capacitaciones', label: 'Capacitaciones', defecto: true },
        { key: 'asistenciaTecnica', label: 'Asistencia Técnica', defecto: true },
        { key: 'pastos', label: 'Pastos', defecto: false },
        { key: 'cobertizos', label: 'Cobertizos', defecto: false },
      ],
    },
    {
      key: GRUPO_ADMINISTRACION,
      label: 'Administración',
      icono: 'administracion',
      items: [
        { key: PERMISO_ADMIN_LISTAS, label: 'Listas', defecto: false },
        { key: PERMISO_ADMIN_USUARIOS, label: 'Usuarios', defecto: true },
        { key: 'configuracion', label: 'Configuración', defecto: false },
      ],
    },
    {
      key: GRUPO_EJECUTIVO,
      label: 'Ejecutivo',
      icono: 'ejecutivo',
      items: [
        { key: 'resumenEjecutivo', label: 'Resumen Ejecutivo', defecto: true },
        { key: 'dashboard', label: 'Dashboard', defecto: false },
        { key: 'visor', label: 'Visor', defecto: false },
      ],
    },
    {
      key: GRUPO_AYUDA,
      label: 'Ayuda',
      icono: 'ayuda',
      items: [{ key: 'videoInformativo', label: 'Video Informativo', defecto: true }],
    },
];

/** Clona grupos sobreescribiendo defaults puntuales (grupo → ítem → valor). */
function conDefectos(
  grupos: PermisosGrupoDef[],
  overrides: Record<string, Record<string, boolean>>,
): PermisosGrupoDef[] {
  return grupos.map((g) => ({
    ...g,
    items: g.items.map((i) => ({ ...i, defecto: overrides[g.key]?.[i.key] ?? i.defecto })),
  }));
}

const ESQUEMA_JEFE_AREA: EsquemaPermisosMenu = {
  perfil: 'Jefe de Área',
  titulo: 'Permisos de menú para Jefe de Área',
  descripcion: 'Seleccione las opciones que visualizará el Jefe de Área al ingresar al sistema.',
  columnas: 3,
  grupos: GRUPOS_JEFE,
};

/**
 * El Administrador General usa los grupos del Jefe de Área con `listas`
 * habilitada por defecto (PERMISOS_MENU_ADMIN_DEFAULT del prototipo).
 */
const ESQUEMA_ADMIN_GENERAL: EsquemaPermisosMenu = {
  perfil: 'Administrador General',
  titulo: 'Permisos de menú para Administrador General',
  descripcion: 'Seleccione las opciones que visualizará el Administrador General al ingresar al sistema.',
  columnas: 3,
  grupos: conDefectos(GRUPOS_JEFE, {
    [GRUPO_ADMINISTRACION]: { [PERMISO_ADMIN_LISTAS]: true },
  }),
};

/** Esquemas disponibles, indexados por perfil (los demás perfiles no tienen permisos de menú configurables). */
export const ESQUEMAS_PERMISOS_MENU: Partial<Record<Perfil, EsquemaPermisosMenu>> = {
  'Técnico Capacitación y Asistencia Técnica': ESQUEMA_TECNICO,
  'Administrador DZ_Cap_Asit.': ESQUEMA_ADMIN_DZ,
  'Administrador Unidad Organizacional': ESQUEMA_ADMIN_UO,
  'Jefe de Área': ESQUEMA_JEFE_AREA,
  'Administrador General': ESQUEMA_ADMIN_GENERAL,
};
