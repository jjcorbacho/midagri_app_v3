// ============================================================
// USUARIOS DE PRUEBA (QA) — SOLO DESARROLLO Y PRUEBAS.
//
// Siete registros que cubren la matriz de escenarios de Gestión de Usuarios:
// los tres regímenes laborales con periodo (CAS Temporal, Locador de Servicio
// y Régimen CAS), periodos Regulares y Extraordinarios, y cuatro perfiles
// distintos. Todos quedan HABILITADOS y con vigencia activa.
//
// CÓMO SE CARGAN: `UsuariosService` los agrega al estado inicial únicamente
// cuando `environment.production === false` (ver src/environments/), de modo
// que jamás llegan a un build productivo. La inserción es idempotente: solo se
// añaden los que aún no existan (ver `usuariosDemoFaltantes`).
//
// CÓMO SE ELIMINAN: borrar este archivo y su uso en `UsuariosService`. No hay
// ninguna otra dependencia; los `id` llevan el prefijo `demo-qa-` para poder
// identificarlos y depurarlos también del lado del backend.
//
// Todos los valores (unidad responsable, categoría/programa presupuestal,
// unidad funcional, región/provincia/distrito, profesión y régimen) provienen
// de los catálogos oficiales de `sodega.const.ts`, por lo que cada registro se
// puede reabrir y volver a guardar desde el formulario sin corregir nada.
// ============================================================

import { ESQUEMAS_PERMISOS_MENU } from './permisos-menu.const';
import { permisosPorDefecto } from '../models/permisos-menu.model';
import type { Perfil, UsuarioSodega } from '../models/usuario-sodega.model';

/** Permisos de menú por defecto del perfil (mismos que aplica el formulario). */
function permisosDe(perfil: Perfil) {
  const esquema = ESQUEMAS_PERMISOS_MENU[perfil];
  return esquema ? permisosPorDefecto(esquema) : undefined;
}

/** Campos comunes a los siete registros de prueba. */
const BASE = {
  estCivil: 'Soltero',
  restricciones: 'Ninguna',
  estado: 'HABILITADO' as const,
  fuenteFinanc: 'Recursos Ordinarios',
  creadoPor: 'ccandelaria',
  nroOrden: '',
  fechaIni: '',
  fechaFin: '',
};

/**
 * Escenarios de prueba.
 *
 * Nota sobre los meses de los contratos temporales: en CAS Temporal y Locador
 * los meses de un periodo Regular se derivan de la vigencia del contrato, que
 * (regla del año de gestión) no puede pasar del 31 de diciembre del año en
 * curso, y la cuenta se inhabilita sola cuando la fecha fin ya pasó. Ambas
 * reglas juntas acotan los meses posibles a los que van del mes actual a
 * diciembre: por eso los usuarios 1 y 2 cubren ese tramo y no meses ya
 * transcurridos, que darían una cuenta INHABILITADA.
 */
export const USUARIOS_DEMO_QA: UsuarioSodega[] = [
  // 1) CAS Temporal · Administrador UE · Regular (Enero, Febrero y Marzo)
  {
    ...BASE,
    id: 'demo-qa-1',
    dni: '40200001',
    nombres: 'Renzo',
    apePat: 'Bustamante',
    apeMat: 'Rojas',
    profesion: 'Ingeniero Agrónomo',
    direccion: 'Av. Grau 812',
    ubigeo: 'Piura/Piura/Piura',
    sexo: 'Masculino',
    fechaNac: '12/04/1985',
    edad: '41',
    celular: '912340001',
    unidad: 'Programa Subsectorial de Irrigaciones',
    userGen: 'rbustamante',
    correo: 'rbustamante@midagri.gob.pe',
    // Caso límite: la vigencia termina exactamente el último día permitido.
    regimen: 'Régimen CAS Temporal',
    fechaIni: '2026-08-01',
    fechaFin: '2026-12-31',
    perfil: 'Administrador Unidad Ejecutora(UE)',
    opa: 'SEDE CENTRAL',
    categoriaPresup: 'Programa Presupuestal',
    programaPresup: 'PP 0042 – Aprovechamiento de los Recursos Hídricos para Uso Agrario',
    unidadFuncional: 'ACT1 0042 PSI',
    // Admin UE asigna ámbito solo a nivel de región (perfilSoloRegion).
    ambitos: [{ region: 'Piura', provincia: '-', distrito: '-' }],
    periodosGestion: [{ tipo: 'Regular', anio: 2026, meses: [8, 9, 10, 11, 12] }],
    permisosMenu: permisosDe('Administrador Unidad Ejecutora(UE)'),
  },

  // 2) CAS Temporal · Técnico · Regular (Abril, Mayo, Junio y Julio)
  {
    ...BASE,
    id: 'demo-qa-2',
    dni: '40200002',
    nombres: 'Katia',
    apePat: 'Villanueva',
    apeMat: 'Alfaro',
    profesion: 'Médico Veterinario',
    estCivil: 'Casada',
    direccion: 'Jr. Pumacurco 245',
    ubigeo: 'Cusco/Urubamba/Pisac',
    sexo: 'Femenino',
    fechaNac: '03/09/1991',
    edad: '34',
    celular: '912340002',
    unidad: 'Programa de Desarrollo Productivo Agrario Rural',
    userGen: 'kvillanueva',
    correo: 'kvillanueva@midagri.gob.pe',
    regimen: 'Régimen CAS Temporal',
    fechaIni: '2026-07-01',
    fechaFin: '2026-09-30',
    perfil: 'Técnico Capacitación y Asistencia Técnica',
    opa: 'OGTI',
    categoriaPresup: 'Programa Presupuestal',
    programaPresup:
      'PP 0121 – Mejora de la Articulación de los Pequeños Productores Agropecuarios al Mercado',
    unidadFuncional: 'AGRORURAL CAMELIDOS SANTA ANA',
    ambitos: [{ region: 'Cusco', provincia: 'Urubamba', distrito: 'Pisac' }],
    periodosGestion: [{ tipo: 'Regular', anio: 2026, meses: [7, 8, 9] }],
    permisosMenu: permisosDe('Técnico Capacitación y Asistencia Técnica'),
  },

  // 3) CAS Temporal · Administrador DZ · Extraordinario (15/03/2026 – 20/08/2026)
  {
    ...BASE,
    id: 'demo-qa-3',
    dni: '40200003',
    nombres: 'Hugo',
    apePat: 'Paredes',
    apeMat: 'Salazar',
    profesion: 'Economista Agrícola',
    estCivil: 'Casado',
    direccion: 'Av. Centenario 1130',
    ubigeo: 'Ancash/Huaraz/Independencia',
    sexo: 'Masculino',
    fechaNac: '28/11/1979',
    edad: '46',
    celular: '912340003',
    unidad: 'P.E. Sierra Centro Sur',
    userGen: 'hparedes',
    correo: 'hparedes@midagri.gob.pe',
    regimen: 'Régimen CAS Temporal',
    fechaIni: '2026-03-15',
    fechaFin: '2026-08-20',
    perfil: 'Administrador DZ_Cap_Asit.',
    opa: 'OPP',
    categoriaPresup: 'Programa Presupuestal',
    programaPresup: 'PP 0042 – Aprovechamiento de los Recursos Hídricos para Uso Agrario',
    unidadFuncional:
      'PESCS CUI N° 2104591 PROY. DE RIEGO CHINCHO, DIST. CHINCHO - ANGARAES - HUANCAVELICA',
    ambitos: [{ region: 'Ancash', provincia: 'Huaraz', distrito: 'Independencia' }],
    periodosGestion: [
      { tipo: 'Extraordinario', anio: 2026, fechaInicio: '2026-03-15', fechaFin: '2026-08-20' },
    ],
    permisosMenu: permisosDe('Administrador DZ_Cap_Asit.'),
  },

  // 4) Locador de Servicio (OS) · Técnico · Regular (Agosto, Septiembre y Octubre)
  {
    ...BASE,
    id: 'demo-qa-4',
    dni: '40200004',
    nombres: 'Silvana',
    apePat: 'Ojeda',
    apeMat: 'Mendoza',
    profesion: 'Ingeniero Forestal',
    direccion: 'Calle Bolívar 407',
    ubigeo: 'Lima/Cañete/Imperial',
    sexo: 'Femenino',
    fechaNac: '17/06/1988',
    edad: '38',
    celular: '912340004',
    // Comparte Unidad Responsable y Unidad Funcional con `demo-qa-2` a
    // propósito: son los dos únicos requisitos para que un Técnico pueda ser
    // origen/destino en "Reasignar Registro", así el flujo queda probable
    // entre dos regímenes distintos (CAS Temporal ↔ Locador).
    unidad: 'Programa de Desarrollo Productivo Agrario Rural',
    userGen: 'sojeda',
    correo: 'sojeda@midagri.gob.pe',
    regimen: 'Locador de Servicio (OS)',
    fechaIni: '2026-08-01',
    fechaFin: '2026-10-31',
    nroOrden: 'O.S. N° 00418-2026',
    perfil: 'Técnico Capacitación y Asistencia Técnica',
    opa: 'OGTI',
    categoriaPresup: 'Programa Presupuestal',
    programaPresup:
      'PP 0121 – Mejora de la Articulación de los Pequeños Productores Agropecuarios al Mercado',
    unidadFuncional: 'AGRORURAL CAMELIDOS SANTA ANA',
    ambitos: [{ region: 'Lima', provincia: 'Cañete', distrito: 'Imperial' }],
    periodosGestion: [{ tipo: 'Regular', anio: 2026, meses: [8, 9, 10] }],
    permisosMenu: permisosDe('Técnico Capacitación y Asistencia Técnica'),
  },

  // 5) Locador de Servicio (OS) · Administrador UE · Extraordinario (01/09/2026 – 15/12/2026)
  {
    ...BASE,
    id: 'demo-qa-5',
    dni: '40200005',
    nombres: 'Gonzalo',
    apePat: 'Espinoza',
    apeMat: 'Tapia',
    profesion: 'Especialista TI',
    estCivil: 'Divorciado',
    direccion: 'Jr. Deustua 356',
    ubigeo: 'Puno/Puno/Puno',
    sexo: 'Masculino',
    fechaNac: '05/02/1983',
    edad: '43',
    celular: '912340005',
    unidad: 'Autoridad Nacional del Agua',
    userGen: 'gespinoza',
    correo: 'gespinoza@midagri.gob.pe',
    regimen: 'Locador de Servicio (OS)',
    fechaIni: '2026-09-01',
    fechaFin: '2026-12-15',
    nroOrden: 'O.S. N° 00527-2026',
    perfil: 'Administrador Unidad Ejecutora(UE)',
    opa: 'ANA',
    categoriaPresup: 'Acciones Centrales',
    programaPresup: 'MIDAGRI',
    unidadFuncional: 'OGPP',
    ambitos: [{ region: 'Puno', provincia: '-', distrito: '-' }],
    periodosGestion: [
      { tipo: 'Extraordinario', anio: 2026, fechaInicio: '2026-09-01', fechaFin: '2026-12-15' },
    ],
    permisosMenu: permisosDe('Administrador Unidad Ejecutora(UE)'),
  },

  // 6) Régimen CAS · Administrador DZ · Regular (todo el año 2026)
  {
    ...BASE,
    id: 'demo-qa-6',
    dni: '40200006',
    nombres: 'Milagros',
    apePat: 'Zegarra',
    apeMat: 'Bermudez',
    profesion: 'Ingeniero Agrónomo',
    estCivil: 'Casada',
    direccion: 'Av. Panamericana 990',
    ubigeo: 'Piura/Sullana/Marcavelica',
    sexo: 'Femenino',
    fechaNac: '21/07/1986',
    edad: '40',
    celular: '912340006',
    unidad: 'Servicio Nacional de Sanidad Agraria',
    userGen: 'mzegarra',
    correo: 'mzegarra@midagri.gob.pe',
    // Régimen indeterminado: sin fechas de contrato (vigencia permanente).
    regimen: 'Régimen CAS',
    perfil: 'Administrador DZ_Cap_Asit.',
    opa: 'ANA',
    categoriaPresup: 'Programa Presupuestal',
    programaPresup: 'MIDAGRI',
    unidadFuncional: 'SENASA',
    ambitos: [{ region: 'Piura', provincia: 'Sullana', distrito: 'Marcavelica' }],
    periodosGestion: [
      { tipo: 'Regular', anio: 2026, meses: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    ],
    permisosMenu: permisosDe('Administrador DZ_Cap_Asit.'),
  },

  // 7) Régimen CAS · Técnico · Extraordinario (10/05/2026 – 30/11/2026)
  {
    ...BASE,
    id: 'demo-qa-7',
    dni: '40200007',
    nombres: 'Alonso',
    apePat: 'Chirinos',
    apeMat: 'Meza',
    profesion: 'Médico Veterinario',
    direccion: 'Jr. San Román 128',
    ubigeo: 'Puno/San Román/Juliaca',
    sexo: 'Masculino',
    fechaNac: '09/12/1993',
    edad: '32',
    celular: '912340007',
    unidad: 'P.E.B. Lago Titicaca',
    userGen: 'achirinos',
    correo: 'achirinos@midagri.gob.pe',
    regimen: 'Régimen CAS',
    perfil: 'Técnico Capacitación y Asistencia Técnica',
    opa: 'OPP',
    categoriaPresup: 'Programa Presupuestal',
    programaPresup:
      'PP 0121 – Mejora de la Articulación de los Pequeños Productores Agropecuarios al Mercado',
    unidadFuncional:
      'PEBLT CUI 2472312 MEJORAMIENTO DE LA GESTION TECNOLOGICA DE LA CADENA PRODUCTIVA DEL GANADO VACUNO LECHERO EN LA CUENCA LLALLIMAYO',
    ambitos: [{ region: 'Puno', provincia: 'San Román', distrito: 'Juliaca' }],
    periodosGestion: [
      { tipo: 'Extraordinario', anio: 2026, fechaInicio: '2026-05-10', fechaFin: '2026-11-30' },
    ],
    permisosMenu: permisosDe('Técnico Capacitación y Asistencia Técnica'),
  },
];

/**
 * Carga idempotente: devuelve solo los usuarios de prueba que aún no existen
 * en el registro, comparando por id, DNI, usuario generado y correo. Así, si el
 * escenario ya está cargado (total o parcialmente) no se duplica nada y solo se
 * completan los que falten.
 */
export function usuariosDemoFaltantes(existentes: readonly UsuarioSodega[]): UsuarioSodega[] {
  const ids = new Set(existentes.map((u) => u.id));
  const dnis = new Set(existentes.map((u) => u.dni.trim()));
  const usuarios = new Set(existentes.map((u) => u.userGen.trim().toLowerCase()));
  const correos = new Set(existentes.map((u) => u.correo.trim().toLowerCase()));

  return USUARIOS_DEMO_QA.filter(
    (u) =>
      !ids.has(u.id) &&
      !dnis.has(u.dni) &&
      !usuarios.has(u.userGen.toLowerCase()) &&
      !correos.has(u.correo.toLowerCase()),
  );
}
