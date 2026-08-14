// ============================================================
// Datos simulados (seed) — SOLO PARA DESARROLLO.
// El equipo backend debe eliminar este archivo cuando los
// servicios consuman el API real (ver core/services/*).
// Lógica de generación migrada 1:1 del prototipo original.
// ============================================================

import { Curso, EstadoCurso, esObservado } from '../models/curso.model';
import { CampoPersonalizado } from '../models/campo.model';
import { Participante, ProductorBD } from '../models/participante.model';
import { UsuarioSodega } from '../models/usuario-sodega.model';

// ============================================================
// DATOS DE PRUEBA — Modal "Reasignar registros" (solo desarrollo).
// Dos Técnicos de la misma Unidad Responsable/Funcional con
// Capacitaciones y Asistencias Técnicas a su nombre, para validar
// el flujo completo de reasignación. Eliminar junto con este archivo
// cuando los servicios consuman el API real.
// ============================================================

const TECNICO_DEMO_BASE = {
  estCivil: 'Soltero',
  direccion: 'Av. Los Incas 1250',
  ubigeo: 'Lima/Lima/San Isidro',
  restricciones: 'Ninguna',
  fechaNac: '10/03/1990',
  edad: '36',
  unidad: 'Dirección Gral. de Ganadería',
  regimen: 'Régimen CAS' as const,
  estado: 'HABILITADO' as const,
  fechaIni: '',
  fechaFin: '',
  nroOrden: '',
  perfil: 'Técnico Capacitación y Asistencia Técnica' as const,
  opa: 'DGGA',
  fuenteFinanc: 'Recursos Ordinarios',
  categoriaPresup: 'Categoría',
  programaPresup: '',
  unidadFuncional: 'Unidad Funcional Opas',
  creadoPor: 'ccandelaria',
  ambitos: [{ region: 'Lima', provincia: 'Lima', distrito: 'San Isidro' }],
};

export const TECNICOS_DEMO_REASIGNACION: UsuarioSodega[] = [
  {
    ...TECNICO_DEMO_BASE,
    id: 'demo-tec-1',
    dni: '41111111',
    nombres: 'Marcos',
    apePat: 'Torres',
    apeMat: 'Quispe',
    profesion: 'Ingeniero Agrónomo',
    sexo: 'Masculino',
    celular: '911111111',
    userGen: 'mtorres',
    correo: 'mtorres@midagri.gob.pe',
    // Contrato temporal vencido: prueba de "Agregar Nuevo Servicio" y meses.
    regimen: 'Régimen CAS Temporal',
    fechaIni: '2025-02-01',
    fechaFin: '2025-07-23',
    // El periodo cabe en la vigencia del contrato, como exige el formulario:
    // se guardan el rango y los meses que abarca, igual que al registrarlo.
    periodosGestion: [
      {
        tipo: 'Regular',
        anio: 2025,
        meses: [2, 3, 4, 5, 6, 7],
        fechaInicio: '2025-02-01',
        fechaFin: '2025-07-23',
      },
    ],
  },
  {
    ...TECNICO_DEMO_BASE,
    id: 'demo-tec-2',
    dni: '42222222',
    nombres: 'Lucia',
    apePat: 'Ramos',
    apeMat: 'Perez',
    profesion: 'Médico Veterinario',
    sexo: 'Femenino',
    celular: '922222222',
    userGen: 'lramos',
    correo: 'lramos@midagri.gob.pe',
    // Régimen CAS (permanente): el periodo abarca todo el año de gestión.
    periodosGestion: [
      {
        tipo: 'Regular',
        anio: 2026,
        meses: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        fechaInicio: '2026-01-01',
        fechaFin: '2026-12-31',
      },
    ],
  },
];

/** Registros de prueba del técnico origen (5 capacitaciones + 3 asistencias)
 *  y del técnico destino (2 capacitaciones + 1 asistencia). El nombre del
 *  `extensionista` coincide con "Nombres ApePat ApeMat" de los técnicos demo. */
const cursoDemoReasignacion = (
  n: number,
  extensionista: string,
  tipo: Curso['tipo'],
  nombreTema: string,
  estado: EstadoCurso,
): Curso => ({
  id: `demo-reasig-${n}`,
  codigo: `${tipo === 'capacitacion' ? 'CAP' : 'AST'}-DEMO-${String(n).padStart(3, '0')}`,
  nombreTema,
  estado,
  fecha: '10 Jul 2026',
  hora: '09:00',
  horas: 6,
  participantes: 15,
  region: 'Lima',
  provincia: 'Lima',
  distrito: 'San Isidro',
  area: 'SODEGA',
  tipo,
  extensionista,
});

export const CURSOS_DEMO_REASIGNACION: Curso[] = [
  // Origen: Marcos Torres Quispe — 5 Capacitaciones + 3 Asistencias Técnicas
  cursoDemoReasignacion(1, 'Marcos Torres Quispe', 'capacitacion', 'Sanidad animal en camélidos sudamericanos', 'Aprobado por UE'),
  cursoDemoReasignacion(2, 'Marcos Torres Quispe', 'capacitacion', 'Manejo de pastos altoandinos', 'Aprobado por DZ'),
  cursoDemoReasignacion(3, 'Marcos Torres Quispe', 'capacitacion', 'Mejoramiento genético de ganado vacuno', 'Enviado'),
  cursoDemoReasignacion(4, 'Marcos Torres Quispe', 'capacitacion', 'Elaboración de derivados lácteos', 'Registrado'),
  cursoDemoReasignacion(5, 'Marcos Torres Quispe', 'capacitacion', 'Buenas prácticas pecuarias', 'Observado por DZ'),
  cursoDemoReasignacion(6, 'Marcos Torres Quispe', 'asistencia', 'Vacunación de ganado vacuno', 'Aprobado por UE'),
  cursoDemoReasignacion(7, 'Marcos Torres Quispe', 'asistencia', 'Dosificación antiparasitaria en ovinos', 'Enviado'),
  cursoDemoReasignacion(8, 'Marcos Torres Quispe', 'asistencia', 'Manejo sanitario de cuyes', 'Registrado'),
  // Destino: Lucia Ramos Perez — 2 Capacitaciones + 1 Asistencia Técnica
  cursoDemoReasignacion(9, 'Lucia Ramos Perez', 'capacitacion', 'Buenas prácticas de ordeño', 'Aprobado por UE'),
  cursoDemoReasignacion(10, 'Lucia Ramos Perez', 'capacitacion', 'Conservación de forrajes', 'Aprobado por DZ'),
  cursoDemoReasignacion(11, 'Lucia Ramos Perez', 'asistencia', 'Diagnóstico de mastitis bovina', 'Registrado'),
];

export const CURSOS_INICIALES: Curso[] = [
  // Datos de prueba del modal "Reasignar registros" (ver bloque superior).
  ...CURSOS_DEMO_REASIGNACION,
  {
    id: '1',
    codigo: 'CAP-2024-001',
    nombreTema: 'Manejo de Suelos Orgánicos en Cacao',
    estado: 'Registrado',
    fecha: '12 May 2024',
    hora: '09:00',
    horas: 8,
    participantes: 3,
    region: 'Huancavelica',
    provincia: 'Angaraes',
    distrito: 'Lircay',
    area: 'SODEGA',
    tipo: 'capacitacion',
    extensionista: 'Ing. Marcos Torres Quispe',
  },
  {
    id: '2',
    codigo: 'CAP-2024-002',
    nombreTema: 'Riego Tecnificado por Goteo en Altura',
    estado: 'Enviado',
    fecha: '15 May 2024',
    hora: '08:30',
    horas: 12,
    participantes: 18,
    region: 'Cusco',
    provincia: 'Calca',
    distrito: 'Pisac',
    area: 'PSI',
    tipo: 'capacitacion',
    extensionista: 'Ing. Lucía Ramos Pérez',
    fotoSustento: 'sustento-002.pdf',
  },
  {
    id: '3',
    codigo: 'CAP-2024-005',
    nombreTema: 'Sanidad y Manejo Integrado de Papa Nativa',
    estado: 'Registrado',
    fecha: '18 May 2024',
    hora: '10:00',
    horas: 16,
    participantes: 0,
    region: 'Cajamarca',
    provincia: 'Hualgayoc',
    distrito: 'Bambamarca',
    area: 'DGDAA',
    tipo: 'capacitacion',
    extensionista: 'Ing. Pedro Salas Vega',
  },
  {
    id: '4',
    codigo: 'AST-2024-014',
    nombreTema: 'Control orgánico de plagas en café',
    estado: 'Observado por DZ',
    fecha: '22 May 2024',
    hora: '07:30',
    horas: 6,
    participantes: 12,
    region: 'Junín',
    provincia: 'Satipo',
    distrito: 'Río Tambo',
    area: 'AGRORURAL',
    tipo: 'asistencia',
    extensionista: 'Tec. Rosa Vilca',
    observacionesHistorial: [
      {
        fecha: '23/05/2024',
        descripcion: 'Falta adjuntar lista de asistencia firmada por los participantes.',
        autor: 'ADMIN_DZ',
      },
    ],
    fotoSustento: 'sustento-014.pdf',
  },
  {
    id: '5',
    codigo: 'AST-2024-021',
    nombreTema: 'Asistencia técnica en sanidad bovina',
    estado: 'Aprobado por UE',
    fecha: '25 May 2024',
    hora: '14:00',
    horas: 4,
    participantes: 9,
    region: 'Puno',
    provincia: 'Azángaro',
    distrito: 'Asillo',
    area: 'DGDG',
    tipo: 'asistencia',
    extensionista: 'MVZ. Carlos Apaza',
    fotoSustento: 'sustento-021.pdf',
  },
  {
    id: '6',
    codigo: 'CAP-2024-009',
    nombreTema: 'Buenas prácticas agrícolas en quinua',
    estado: 'Aprobado por DZ',
    fecha: '29 May 2024',
    hora: '09:00',
    horas: 10,
    participantes: 30,
    region: 'Ayacucho',
    provincia: 'Huamanga',
    distrito: 'Quinua',
    area: 'DGAAA',
    tipo: 'capacitacion',
    extensionista: 'Ing. Sofía Núñez',
    fotoSustento: 'sustento-009.pdf',
  },
];

export const PARTICIPANTES_INICIALES: Participante[] = [
  { id: 'p1', cursoId: '1', tipoParticipante: 'PRODUCTOR', dni: '45678912', apellidos: 'Quispe Mamani', nombres: 'Juan Carlos', fechaNacimiento: '1982-04-12', primActividad: 'Agricultura — Cacao' },
  { id: 'p2', cursoId: '1', tipoParticipante: 'PRODUCTOR', dni: '78451236', apellidos: 'Huamán Flores', nombres: 'María Elena', fechaNacimiento: '1986-09-03', primActividad: 'Agricultura — Café' },
  { id: 'p3', cursoId: '1', tipoParticipante: 'OTRO', dni: '12365478', apellidos: 'Ccahuana Yupanqui', nombres: 'Pedro', fechaNacimiento: '1973-01-25', primActividad: 'Asistencia técnica' },
];

// ============================================================
// FUENTE DE VERDAD DE PARTICIPANTES
// ------------------------------------------------------------
// `Curso.participantes` es solo un contador denormalizado (lo que
// devolverá el API en la bandeja). Las filas reales viven en
// `PARTICIPANTES_INICIALES`, que es lo que consume
// `ParticipantesService.participantesDe(cursoId)` y renderiza el
// Paso 2 del stepper.
//
// Regla de este archivo: todo curso con contador > 0 debe tener
// exactamente esas filas. Los seeds de más abajo generan las suyas
// y, al final, un pase de reconciliación recalcula el contador a
// partir del array para que ambos no puedan volver a divergir.
// ============================================================

/** Pools compartidos por los generadores del seed. */
const NOMBRES_POOL: readonly (readonly [string, string])[] = [
  ['Quispe Huamán', 'Carlos Alberto'], ['Mamani Condori', 'Rosa María'], ['Vilca Roque', 'Luis Enrique'],
  ['Ccahuana Yupanqui', 'Pedro Pablo'], ['Huamán Flores', 'María Elena'], ['Apaza Choque', 'Juana'],
  ['Salas Vega', 'Jorge'], ['Ramos Pérez', 'Lucía'], ['Núñez Castro', 'Sofía'], ['Torres Lima', 'Andrés'],
  ['Pari Coaquira', 'Felipe'], ['Suca Maquera', 'Elena'], ['Chávez Bravo', 'Manuel'],
  ['Rojas Ayala', 'Diana'], ['Sánchez Pinto', 'Óscar'], ['Cárdenas León', 'Beatriz'],
  ['Flores Quispe', 'Hernán'], ['Gutiérrez Mora', 'Isabel'], ['Choque Mamani', 'Víctor'],
  ['Pacheco Tito', 'Gladys'],
];

const ACTIVIDADES_POOL: readonly string[] = [
  'Agricultura — Papa', 'Agricultura — Café', 'Agricultura — Quinua', 'Ganadería — Bovinos',
  'Ganadería — Alpacas', 'Agricultura — Cacao', 'Agricultura — Arroz', 'Forestal — Eucalipto',
];

const TIPOS_PARTICIPANTE: readonly Participante['tipoParticipante'][] = ['PRODUCTOR', 'OTRO'];

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** Fecha de nacimiento determinista (mismo criterio en los tres generadores). */
const fechaNacSeed = (p: number, i: number): string =>
  `19${70 + ((p + i * 3) % 30)}-${String(((p + i) % 12) + 1).padStart(2, '0')}-${String(((p * 5 + i) % 27) + 1).padStart(2, '0')}`;

// ===== Participantes de los cursos escritos a mano (bloques de arriba) =====
// Estos cursos declaraban el contador pero no traían filas: la bandeja mostraba
// "18" en CAP-2024-002 y el Paso 2 salía vacío. Aquí se crean las filas que
// faltaban, respetando el contador ya declarado.
(() => {
  const yaTienenFilas = new Set(PARTICIPANTES_INICIALES.map((p) => p.cursoId));
  let partSeq = 1;
  let dniSeq = 70000000;

  CURSOS_INICIALES.forEach((curso, ci) => {
    if (yaTienenFilas.has(curso.id)) return;
    for (let p = 0; p < curso.participantes; p++) {
      const [apellidos, nombres] = NOMBRES_POOL[(p + ci) % NOMBRES_POOL.length];
      PARTICIPANTES_INICIALES.push({
        id: `m${partSeq++}`,
        cursoId: curso.id,
        tipoParticipante: TIPOS_PARTICIPANTE[(p + ci) % TIPOS_PARTICIPANTE.length],
        dni: String(dniSeq++),
        apellidos,
        nombres,
        fechaNacimiento: fechaNacSeed(p, ci),
        primActividad: ACTIVIDADES_POOL[(p + ci) % ACTIVIDADES_POOL.length],
      });
    }
  });
})();

// ===== Seed masivo: 11 registros para 3 áreas con 1-6 participantes c/u =====
(() => {
  const seedAreas = [
    { area: 'SODEGA', region: 'Huancavelica', provincia: 'Angaraes', distrito: 'Lircay', ext: 'Ing. Marcos Torres Quispe' },
    { area: 'DGDAA', region: 'Cajamarca', provincia: 'Hualgayoc', distrito: 'Bambamarca', ext: 'Ing. Pedro Salas Vega' },
    { area: 'AGRORURAL', region: 'Junín', provincia: 'Satipo', distrito: 'Río Tambo', ext: 'Tec. Rosa Vilca Roque' },
  ];
  const temasCap = [
    'Manejo integrado de plagas en papa',
    'Buenas prácticas en cosecha de café',
    'Fertilización balanceada en quinua',
    'Sanidad animal en alpacas',
    'Conservación de suelos en ladera',
    'Riego por aspersión en hortalizas',
    'Producción orgánica de cacao',
    'Manejo postcosecha de granos andinos',
    'Inseminación artificial en bovinos',
    'Reforestación con especies nativas',
    'Asociatividad y cadenas productivas',
  ];
  const temasAt = [
    'Asistencia técnica en injertos de palto',
    'AT en control fitosanitario de cítricos',
    'AT en pastos cultivados para ganadería',
    'AT en compostaje y biofertilizantes',
    'AT en manejo reproductivo bovino',
  ];
  const estadosSeed: EstadoCurso[] = ['Registrado', 'Enviado', 'Enviado-subsanado', 'Aprobado por DZ', 'Observado por DZ', 'Aprobado por UE'];
  const nombresPool = NOMBRES_POOL.slice(0, 12);
  const actividades = ACTIVIDADES_POOL.slice(0, 6);
  const tipos = TIPOS_PARTICIPANTE;
  const meses = MESES;

  let cursoSeq = 1000;
  let partSeq = 1000;
  let dniSeq = 50000000;

  seedAreas.forEach((a, ai) => {
    for (let i = 0; i < 11; i++) {
      const esCap = i % 3 !== 0; // mezcla capacitaciones y asistencias
      const tipo: Curso['tipo'] = esCap ? 'capacitacion' : 'asistencia';
      const tema = esCap ? temasCap[i % temasCap.length] : temasAt[i % temasAt.length];
      const estado = estadosSeed[(ai + i) % estadosSeed.length];
      const nParts = ((ai * 7 + i * 3) % 6) + 1; // 1..6
      const dia = ((i * 2) % 27) + 1;
      const fecha = `${String(dia).padStart(2, '0')} ${meses[(ai + i) % 12]} 2024`;
      const cursoId = `s${cursoSeq++}`;
      const codigo = `${esCap ? 'CAP' : 'AST'}-${a.area}-${String(100 + i).padStart(3, '0')}`;

      const necesitaHistorial = esObservado(estado);
      CURSOS_INICIALES.push({
        id: cursoId,
        codigo,
        nombreTema: tema,
        estado,
        fecha,
        hora: `${String(7 + (i % 6)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`,
        horas: 4 + (i % 9),
        participantes: nParts,
        region: a.region,
        provincia: a.provincia,
        distrito: a.distrito,
        area: a.area,
        tipo,
        extensionista: a.ext,
        fotoSustento: estado !== 'Registrado' ? `sustento-${codigo}.pdf` : undefined,
        observacionesHistorial: necesitaHistorial
          ? [{ fecha: '10/06/2024', descripcion: 'Adjuntar acta firmada y verificar coordenadas.', autor: 'ADMIN_DZ' }]
          : undefined,
      });

      for (let p = 0; p < nParts; p++) {
        const np = nombresPool[(p + i + ai) % nombresPool.length];
        PARTICIPANTES_INICIALES.push({
          id: `s${partSeq++}`,
          cursoId,
          tipoParticipante: tipos[(p + i) % tipos.length],
          dni: String(dniSeq++),
          apellidos: np[0],
          nombres: np[1],
          fechaNacimiento: fechaNacSeed(p, i),
          primActividad: actividades[(p + i + ai) % actividades.length],
        });
      }
    }
  });
})();

// ===== Seed extendido: 10 áreas × (11 capacitaciones + 10 asistencias), 1..20 participantes =====
(() => {
  const areas10 = [
    { area: 'PSI', region: 'Lima', provincia: 'Lima', distrito: 'San Isidro', ext: 'Ing. Andrés Paredes' },
    { area: 'UEFSA', region: 'Lima', provincia: 'Lima', distrito: 'La Molina', ext: 'Ing. Carla Vergara' },
    { area: '2328744', region: 'Áncash', provincia: 'Huaraz', distrito: 'Independencia', ext: 'Ing. Raúl Mendoza' },
    { area: '2308865', region: 'La Libertad', provincia: 'Trujillo', distrito: 'Laredo', ext: 'Ing. Patricia Soto' },
    { area: '2643338', region: 'Lambayeque', provincia: 'Chiclayo', distrito: 'Pomalca', ext: 'Ing. Daniel Ríos' },
    { area: 'PEBLT', region: 'Puno', provincia: 'Puno', distrito: 'Acora', ext: 'Ing. Mónica Ticona' },
    { area: 'PEBPT', region: 'Tumbes', provincia: 'Tumbes', distrito: 'Corrales', ext: 'Ing. Hugo Farfán' },
    { area: 'PEAH', region: 'Huánuco', provincia: 'Leoncio Prado', distrito: 'Rupa-Rupa', ext: 'Ing. Sandra Loayza' },
    { area: 'PEJSIB', region: 'San Martín', provincia: 'Moyobamba', distrito: 'Soritor', ext: 'Ing. Iván Pinedo' },
    { area: 'PEPP', region: 'Madre de Dios', provincia: 'Tambopata', distrito: 'Tambopata', ext: 'Ing. Karina Vela' },
  ];
  const temasCap2 = [
    'Manejo integrado de plagas en papa', 'Buenas prácticas en cosecha de café',
    'Fertilización balanceada en quinua', 'Sanidad animal en alpacas',
    'Conservación de suelos en ladera', 'Riego por aspersión en hortalizas',
    'Producción orgánica de cacao', 'Manejo postcosecha de granos andinos',
    'Inseminación artificial en bovinos', 'Reforestación con especies nativas',
    'Asociatividad y cadenas productivas',
  ];
  const temasAt2 = [
    'AT en injertos de palto', 'AT en control fitosanitario de cítricos',
    'AT en pastos cultivados para ganadería', 'AT en compostaje y biofertilizantes',
    'AT en manejo reproductivo bovino', 'AT en poda de cafetales',
    'AT en cosecha tecnificada de arroz', 'AT en sanidad de cuyes',
    'AT en manejo de invernaderos', 'AT en preparación de bioles',
  ];
  const estadosSeed2: EstadoCurso[] = ['Registrado', 'Enviado', 'Enviado-subsanado', 'Aprobado por DZ', 'Observado por DZ', 'Aprobado por UE'];
  const nombresPool2 = NOMBRES_POOL;
  const actividades2 = ACTIVIDADES_POOL;
  const tipos2 = TIPOS_PARTICIPANTE;
  const meses = MESES;

  let cursoSeq = 5000;
  let partSeq = 5000;
  let dniSeq = 60000000;

  areas10.forEach((a, ai) => {
    const total = 21; // 11 caps + 10 ats
    for (let i = 0; i < total; i++) {
      const esCap = i < 11;
      const tipo: Curso['tipo'] = esCap ? 'capacitacion' : 'asistencia';
      const idxTema = esCap ? i : i - 11;
      const tema = esCap ? temasCap2[idxTema] : temasAt2[idxTema];
      const estado = estadosSeed2[(ai * 2 + i) % estadosSeed2.length];
      const nParts = ((ai * 3 + i * 7) % 20) + 1; // 1..20
      const dia = ((i * 3 + ai) % 27) + 1;
      const fecha = `${String(dia).padStart(2, '0')} ${meses[(ai + i) % 12]} 2024`;
      const cursoId = `x${cursoSeq++}`;
      const codigo = `${esCap ? 'CAP' : 'AST'}-${a.area}-${String(200 + i).padStart(3, '0')}`;
      const necesitaHistorial = esObservado(estado);

      CURSOS_INICIALES.push({
        id: cursoId,
        codigo,
        nombreTema: tema,
        estado,
        fecha,
        hora: `${String(7 + (i % 9)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`,
        horas: esCap ? 4 + (i % 9) : 2 + (i % 7),
        participantes: nParts,
        region: a.region,
        provincia: a.provincia,
        distrito: a.distrito,
        area: a.area,
        tipo,
        extensionista: a.ext,
        fotoSustento: estado !== 'Registrado' ? `sustento-${codigo}.pdf` : undefined,
        observacionesHistorial: necesitaHistorial
          ? [{ fecha: '12/06/2024', descripcion: 'Verificar lista de asistencia y coordenadas GPS.', autor: 'ADMIN_DZ' }]
          : undefined,
      });

      for (let p = 0; p < nParts; p++) {
        const np = nombresPool2[(p + i + ai) % nombresPool2.length];
        PARTICIPANTES_INICIALES.push({
          id: `x${partSeq++}`,
          cursoId,
          tipoParticipante: tipos2[(p + i) % tipos2.length],
          dni: String(dniSeq++),
          apellidos: np[0],
          nombres: np[1],
          fechaNacimiento: fechaNacSeed(p, i),
          primActividad: actividades2[(p + i + ai) % actividades2.length],
        });
      }
    }
  });
})();

// ===== Reconciliación final: el contador se DERIVA de las filas =====
// Invariante del seed: `curso.participantes === participantesDe(curso.id).length`.
// A partir de aquí el contador ya no se escribe a mano; en runtime lo mantiene
// `CursosService.adjustParticipantes()` desde `ParticipantesService`.
(() => {
  const conteoPorCurso = new Map<string, number>();
  for (const p of PARTICIPANTES_INICIALES) {
    conteoPorCurso.set(p.cursoId, (conteoPorCurso.get(p.cursoId) ?? 0) + 1);
  }
  for (const c of CURSOS_INICIALES) {
    c.participantes = conteoPorCurso.get(c.id) ?? 0;
  }
})();

/** Padrón simulado de productores (búsqueda por DNI en Paso 2). */
export const PRODUCTORES_BD: ProductorBD[] = [
  { dni: '45678912', apellidos: 'Quispe Mamani', nombres: 'Juan Carlos', fechaNacimiento: '1982-04-12', sexo: 'Masculino', primActividad: 'Agricultura — Cacao', estadoCivil: 'Casado', ubigeo: '090301 - Huancavelica / Angaraes / Lircay', direccion: 'Jr. Bolognesi 245', restricciones: 'Ninguna' },
  { dni: '78451236', apellidos: 'Huamán Flores', nombres: 'María Elena', fechaNacimiento: '1986-09-03', sexo: 'Femenino', primActividad: 'Agricultura — Café', estadoCivil: 'Soltera', ubigeo: '080404 - Cusco / Calca / Pisac', direccion: 'Av. Cusco 1102', restricciones: 'Ninguna' },
  { dni: '12365478', apellidos: 'Ccahuana Yupanqui', nombres: 'Pedro', fechaNacimiento: '1973-01-25', sexo: 'Masculino', primActividad: 'Asistencia técnica', estadoCivil: 'Casado', ubigeo: '060601 - Cajamarca / Hualgayoc / Bambamarca', direccion: 'Calle Real 88', restricciones: 'Ninguna' },
  { dni: '87654321', apellidos: 'Mamani Condori', nombres: 'Rosa', fechaNacimiento: '1990-11-30', sexo: 'Femenino', primActividad: 'Ganadería — Bovinos', estadoCivil: 'Conviviente', ubigeo: '210301 - Puno / Azángaro / Asillo', direccion: 'Comunidad Asillo s/n', restricciones: 'Ninguna' },
  { dni: '23456789', apellidos: 'Vilca Roque', nombres: 'Luis', fechaNacimiento: '1978-07-14', sexo: 'Masculino', primActividad: 'Agricultura — Quinua', estadoCivil: 'Casado', ubigeo: '050108 - Ayacucho / Huamanga / Quinua', direccion: 'Jr. Sucre 412', restricciones: 'Ninguna' },
];

export const CAMPOS_PERSONALIZADOS_INICIALES: CampoPersonalizado[] = [
  {
    id: 'f-seed-1',
    area: 'SODEGA',
    formulario: 'capacitacion',
    nombre: 'Modalidad de ejecución',
    tipo: 'select',
    opciones: ['Presencial', 'Virtual', 'Mixta'],
    requerido: true,
    activo: true,
    tieneData: true,
    visiblePorArea: { SODEGA: true },
  },
  {
    id: 'f-seed-2',
    area: 'AGRORURAL_1',
    formulario: 'participante_cap',
    nombre: 'Nivel de instrucción del productor',
    tipo: 'radio',
    opciones: ['Primaria', 'Secundaria', 'Superior', 'Ninguno'],
    requerido: false,
    activo: true,
    tieneData: false,
    visiblePorArea: { AGRORURAL_1: false },
  },
];
