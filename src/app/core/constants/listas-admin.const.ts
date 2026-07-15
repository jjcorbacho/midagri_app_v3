// Catálogos de la Administración de Listas SODEGA.
// Migrados del prototipo (index.html — LISTAS_ADMIN_DATA y CATALOGOS_SISTEMA_REGISTRADOS),
// reutilizando los catálogos maestros existentes del proyecto (sodega.const.ts).

import { CatalogoSistema, ListaAdmin, opcionesDesdeTextos } from '../models/lista-admin.model';
import { PERFILES } from '../models/usuario-sodega.model';
import {
  CATEGORIAS_PRESUPUESTALES,
  FUENTES_FINANCIAMIENTO,
  PROFESIONES,
  PROGRAMAS_MAESTROS,
  REGIMENES_LABORALES,
  UBIGEO_SODEGA,
  UNIDADES_FUNCIONALES_MAESTRAS,
  UNIDADES_RESPONSABLES,
} from './sodega.const';

const ESTADOS_CIVILES = ['Soltero', 'Casado', 'Viudo', 'Divorciado', 'Conviviente'];
const SEXOS = ['Masculino', 'Femenino'];

/** Listas maestras precargadas (semilla del prototipo). */
export const LISTAS_ADMIN_INICIALES: ListaAdmin[] = [
  { nombre: 'Categoría Presupuestal', opciones: opcionesDesdeTextos(CATEGORIAS_PRESUPUESTALES) },
  { nombre: 'Estado Civil', opciones: opcionesDesdeTextos(ESTADOS_CIVILES) },
  { nombre: 'Fuente de Financiamiento', opciones: opcionesDesdeTextos(FUENTES_FINANCIAMIENTO) },
  { nombre: 'Unidad Funcional', opciones: opcionesDesdeTextos(UNIDADES_FUNCIONALES_MAESTRAS.slice(0, 30)) },
  { nombre: 'Programas Presupuestales', opciones: opcionesDesdeTextos(PROGRAMAS_MAESTROS) },
  { nombre: 'Unidad Responsable', opciones: opcionesDesdeTextos(UNIDADES_RESPONSABLES) },
  { nombre: 'Perfil Autorizado', opciones: opcionesDesdeTextos(PERFILES) },
  { nombre: 'Sexo', opciones: opcionesDesdeTextos(SEXOS) },
];

/**
 * Catálogos registrados del sistema: únicos nombres aceptados al "Agregar lista"
 * (con alias tolerantes, igual que el prototipo).
 */
export const CATALOGOS_SISTEMA_REGISTRADOS: CatalogoSistema[] = [
  { nombre: 'Profesión - Especialidad', alias: ['profesion', 'profesión', 'especialidad', 'profesion especialidad', 'profesión especialidad'], opciones: [...PROFESIONES] },
  { nombre: 'Sexo', alias: ['sexo'], opciones: SEXOS },
  { nombre: 'Estado Civil', alias: ['estado civil'], opciones: ESTADOS_CIVILES },
  { nombre: 'Régimen Laboral', alias: ['regimen laboral', 'régimen laboral'], opciones: [...REGIMENES_LABORALES] },
  { nombre: 'Estado de Cuenta', alias: ['estado cuenta', 'estado de cuenta'], opciones: ['Habilitado', 'Inhabilitado'] },
  { nombre: 'Perfil Autorizado', alias: ['perfil autorizado', 'perfil', 'perfiles'], opciones: [...PERFILES] },
  { nombre: 'Unidad Responsable', alias: ['unidad responsable', 'responsable', 'unidad'], opciones: [...UNIDADES_RESPONSABLES] },
  { nombre: 'Fuente de Financiamiento', alias: ['fuente de financiamiento', 'fuente financiamiento', 'fuente de financ.', 'fuente financ.'], opciones: [...FUENTES_FINANCIAMIENTO] },
  { nombre: 'Categoría Presupuestal', alias: ['categoria presupuestal', 'categoría presupuestal', 'categoria presup.', 'categoría presup.'], opciones: [...CATEGORIAS_PRESUPUESTALES] },
  { nombre: 'Programas Presupuestales', alias: ['programas presupuestales', 'programa presupuestal', 'programa presup.', 'programa presup'], opciones: [...PROGRAMAS_MAESTROS] },
  { nombre: 'Unidad Funcional', alias: ['unidad funcional', 'unidad funcional opas', 'opas', 'unidad funcional (opas)'], opciones: [...UNIDADES_FUNCIONALES_MAESTRAS] },
  { nombre: 'Región', alias: ['region', 'región'], opciones: Object.keys(UBIGEO_SODEGA) },
  { nombre: 'Registrar', alias: ['registrar', 'opciones de registrar'], opciones: ['Capacitación', 'Asistencia Técnica', 'Aprobación Capacitación', 'Aprobación Asistencia Técnica'] },
  { nombre: 'Consulta', alias: ['consulta', 'consultas'], opciones: ['Búsqueda de usuarios', 'Filtro por DNI', 'Filtro por nombre', 'Filtro por perfil', 'Filtro por régimen'] },
  { nombre: 'Reporte', alias: ['reporte', 'reportes'], opciones: ['Capacitación', 'Asistencia Técnica'] },
  { nombre: 'Administración', alias: ['administracion', 'administración'], opciones: ['Listas', 'Gestión de Usuarios'] },
  { nombre: 'Ejecutivo', alias: ['ejecutivo'], opciones: ['Resumen Ejecutivo'] },
  { nombre: 'Reporte Ejecutivo', alias: ['reporte ejecutivo'], opciones: ['Panel de analítica avanzada SODEGA'] },
  { nombre: 'Ayuda', alias: ['ayuda'], opciones: ['Centro de Ayuda SODEGA', 'Mesa de Ayuda OGTI'] },
];
