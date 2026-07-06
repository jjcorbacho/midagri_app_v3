// Catálogos centralizados del documento SODEGA y áreas relacionadas.
// Se usan en los formularios de capacitaciones, asistencias técnicas y participantes.

export const TEMATICAS = [
  '01 ANÁLISIS DE SUELOS',
  '02 TÉCNICAS DE LABRANZA DE LA TIERRA',
  '03 ROTACIÓN DE CULTIVOS',
  '04 TÉCNICAS DE MANEJO DE SEMILLAS',
  '05 OPERACIÓN Y MANTENIMIENTO DE SISTEMAS DE RIEGO',
  '06 SISTEMAS DE RIEGO TECNIFICADO',
  '07 PRÁCTICAS ADECUADAS DE RIEGO',
  '08 USO DE ABONOS Y FERTILIZANTES',
  '09 USO DE PLAGUICIDAS',
  '10 USO DE CONTROL BILÓGICO',
  '11 MANEJO INTEGRADO DE PLAGAS',
  '12 ESTÁNDARES DE CALIDAD DE AGUA PARA RIEGO',
  '13 PRODUCCIÓN ORGÁNICA',
  '14 OTRAS BUENAS PRÁCTICAS AGRÍCOLAS',
  '15 INSTALACIÓN Y MANEJO DE PASTOS',
  '16 PRÁCTICAS ADECUADAS DE ALIMENTACIÓN DE LOS ANIMALES DE CRIANZA',
  '17 TÉCNICAS DE MEJORAMIENTO GENÉTICO DE LOS ANIMALES DE CRIANZA',
  '18 USO ADECUADO DE VACUNAS Y/O MEDICAMENTOS VETERINARIOS',
  '19 PRÁCTICAS DE BIOSEGURIDAD',
  '20 OTRAS BUENAS PRÁCTICAS PECUARIAS',
  '21 MANIPULACIÓN E HIGIENE DE ALIMENTOS DE ORIGEN VEGETAL O ANIMAL',
  '22 ALMACENAMIENTO DE ALIMENTOS DE ORIGEN VEGETAL O ANIMAL',
  '23 CONTAMINACIÓN DE ALIMENTOS DE ORIGEN VEGETAL O ANIMAL',
  '24 OTRAS PRACTICAS DE INOCUIDAD',
  '25 MANEJO Y APROVECHAMIENTO FORESTAL',
  '26 FAUNA SILVESTRE',
  '27 INNOVACIÓN AGRARIA',
  '28 GESTIÓN DE ORGANIZACIONES',
  '29 SERVICIOS FINANCIEROS',
  '30 ARTICULACIÓN AL MERCADO',
  '31 OTROS',
] as const;

export const TIPOS_EVENTO = [
  '1.3 PASTURAS',
  '1.4 DORMIDEROS',
  '1.5 AHIJADERO',
  '2.3 CPR',
  '2.3 DIAGNÓSTICO CPR',
  '2.7 PM REPRODUCTIVO SANITARIO',
  '3.2 NUCLEO GENÉTICO',
  'CHARLA',
  'CONFERENCIA',
  'CURSO',
  'DÍA DE CAMPO (PRIMER)',
  'DÍA DE CAMPO (SEGUNDO)',
  'DÍA DE CAMPO (TERCER)',
  'OTRO',
  'PASANTIA',
  'RADIAL',
  'SEMINARIO',
  'SESIÓN - ECA',
  'TALLER',
  'TALLERES VIRTUALES - MEET',
  'TALLERES VIRTUALES - ZOOM',
  'TELEVISIVO',
  'VIRTUAL GRABADO',
  'VISITA AL PRODUCTOR (CUARTA)',
  'VISITA AL PRODUCTOR (DÉCIMA)',
  'VISITA AL PRODUCTOR (DUODÉCIMA)',
  'VISITA AL PRODUCTOR (NOVENA)',
  'VISITA AL PRODUCTOR (OCTAVA)',
  'VISITA AL PRODUCTOR (PRIMER)',
  'VISITA AL PRODUCTOR (QUINTA)',
  'VISITA AL PRODUCTOR (SEGUNDO)',
  'VISITA AL PRODUCTOR (SETIMA)',
  'VISITA AL PRODUCTOR (SEXTA)',
  'VISITA AL PRODUCTOR (TERCERA)',
  'VISITA AL PRODUCTOR (UNDÉCIMA)',
] as const;

export const MODALIDADES_AT = ['Individual', 'Grupal'] as const;

export const UTM_ZONAS = ['17S', '18S', '19S'] as const;

/* ===== Catálogos del formulario de participantes ===== */

export const TIPOS_PARTICIPANTE = ['PRODUCTOR', 'OTRO'] as const;

export const ACTIVIDAD_OTRO_PARTICIPANTE = [
  'ACUICULTOR', 'COMERCIANTE', 'CONSUMIDOR FINAL', 'CONSUMIDOR INTERMEDIO',
  'DOCENTE', 'ESPECIALISTA', 'ESTUDIANTE', 'GOBIERNO LOCAL', 'GOBIERNO REGIONAL',
  'PRESIDENTE ASOCIACION', 'TRANSPORTISTA', 'OTRO',
] as const;

export const PRINCIPAL_ACTIVIDAD = [
  'AGRÍCOLA', 'AGRÍCOLA Y FORESTAL', 'AGRÍCOLA Y PECUARIA',
  'AGRÍCOLA, PECUARIA Y FORESTAL', 'FORESTAL', 'PECUARIA', 'PECUARIA Y FORESTAL',
] as const;

export const CRIANZAS_PARTICIPANTE = [
  'ALPACA', 'AVES', 'CAPRINOS', 'CUYES', 'LLAMAS', 'OVINOS', 'PORCINOS',
  'VACUNOS DE CARNE', 'VACUNOS DE LECHE', 'VACUNOS DOBLE PROPÓSITO',
] as const;

export const TIPOS_ORGANIZACION = [
  'ASOCIACIÓN', 'COMITÉ', 'COMUNIDADES CAMPESINAS', 'COMUNIDADES NATIVAS',
  'COOPERATIVA', 'GRUPO DE APRENDIZAJE_ESTRATEGIA DESCENTRALIZADA',
  'JUNTA DE USUARIOS', 'OTROS',
] as const;

export const NIVELES_INSTRUCCION = [
  'SIN INSTRUCCIÓN / INICIAL', 'PRIMARIA INCOMPLETA', 'PRIMARIA COMPLETA',
  'SECUNDARIA INCOMPLETA', 'SECUNDARIA COMPLETA', 'TÉCNICO INCOMPLETO',
  'TÉCNICO COMPLETO', 'UNIVERSITARIO INCOMPLETO', 'UNIVERSITARIO COMPLETO',
] as const;

/* ===== Ubigeo simplificado (cascada Región → Provincia → Distrito → Centro Poblado) ===== */

export interface DistritoUbg {
  nombre: string;
  centrosPoblados: string[];
}
export interface ProvinciaUbg {
  nombre: string;
  distritos: DistritoUbg[];
}
export interface RegionUbg {
  nombre: string;
  provincias: ProvinciaUbg[];
}

export const UBIGEO: RegionUbg[] = [
  {
    nombre: 'Apurímac',
    provincias: [
      {
        nombre: 'Abancay',
        distritos: [
          { nombre: 'Abancay', centrosPoblados: ['Centro Abancay', 'Río Magdalena', 'Pachachaca'] },
          { nombre: 'Tamburco', centrosPoblados: ['Tamburco', 'Sahuanay'] },
          { nombre: 'Curahuasi', centrosPoblados: ['Curahuasi', 'San Cristóbal'] },
        ],
      },
      {
        nombre: 'Andahuaylas',
        distritos: [
          { nombre: 'Andahuaylas', centrosPoblados: ['Andahuaylas', 'Talavera'] },
          { nombre: 'San Jerónimo', centrosPoblados: ['San Jerónimo', 'Champaccocha'] },
        ],
      },
    ],
  },
  {
    nombre: 'Cusco',
    provincias: [
      {
        nombre: 'Calca',
        distritos: [
          { nombre: 'Pisac', centrosPoblados: ['Pisac', 'Amaru', 'Cuyo Grande'] },
          { nombre: 'Calca', centrosPoblados: ['Calca', 'Accha Alta'] },
        ],
      },
      {
        nombre: 'Quispicanchi',
        distritos: [{ nombre: 'Urcos', centrosPoblados: ['Urcos', 'Muñapata'] }],
      },
    ],
  },
  {
    nombre: 'Huancavelica',
    provincias: [
      {
        nombre: 'Angaraes',
        distritos: [{ nombre: 'Lircay', centrosPoblados: ['Lircay', 'Ccollpapampa'] }],
      },
    ],
  },
  {
    nombre: 'Cajamarca',
    provincias: [
      {
        nombre: 'Hualgayoc',
        distritos: [{ nombre: 'Bambamarca', centrosPoblados: ['Bambamarca', 'Llaucán'] }],
      },
    ],
  },
];

export function getProvincias(region: string): ProvinciaUbg[] {
  return UBIGEO.find((r) => r.nombre === region)?.provincias ?? [];
}
export function getDistritos(region: string, provincia: string): DistritoUbg[] {
  return getProvincias(region).find((p) => p.nombre === provincia)?.distritos ?? [];
}
export function getCentrosPoblados(region: string, provincia: string, distrito: string): string[] {
  return getDistritos(region, provincia).find((d) => d.nombre === distrito)?.centrosPoblados ?? [];
}
