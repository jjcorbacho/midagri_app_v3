// Definición de los campos base por formulario, agrupados por sección.
// Se usan en Configuración › Campos y en la vista previa de formularios.

import { CampoBase, FormularioKey } from '../models/campo.model';

export const FORMULARIOS: { key: FormularioKey; label: string }[] = [
  { key: 'capacitacion', label: 'Capacitaciones' },
  { key: 'asistencia', label: 'Asistencia Técnica' },
  { key: 'participante_cap', label: 'Participantes — Capacitación' },
  { key: 'participante_at', label: 'Participantes — Asistencia Técnica' },
];

const eventoBase: CampoBase[] = [
  { seccion: 'Datos Generales', nombre: 'Código Evento', tipo: 'text', requerido: true },
  { seccion: 'Datos Generales', nombre: 'Temática', tipo: 'select', requerido: true },
  { seccion: 'Datos Generales', nombre: 'Tipo', tipo: 'select', requerido: true },
  { seccion: 'Datos Generales', nombre: 'Fecha', tipo: 'date', requerido: true },
  { seccion: 'Datos Generales', nombre: 'Nro Horas', tipo: 'number', requerido: true },
  { seccion: 'Datos Generales', nombre: 'Nombre de la capacitación', tipo: 'text', requerido: true },
  { seccion: 'Datos Generales', nombre: 'Extensionista', tipo: 'text', requerido: true },
  { seccion: 'Datos Generales', nombre: 'Observaciones', tipo: 'textarea' },
  { seccion: 'Ubicación', nombre: 'Distrito', tipo: 'select', requerido: true },
  { seccion: 'Ubicación', nombre: 'Provincia', tipo: 'select', requerido: true },
  { seccion: 'Ubicación', nombre: 'Región', tipo: 'select', requerido: true },
  { seccion: 'Ubicación', nombre: 'Centro Poblado', tipo: 'text', requerido: true },
  { seccion: 'Coordenadas', nombre: 'Longitud', tipo: 'text' },
  { seccion: 'Coordenadas', nombre: 'Latitud', tipo: 'text' },
  { seccion: 'Coordenadas', nombre: 'Altitud', tipo: 'text' },
  { seccion: 'Coordenadas', nombre: 'Zona', tipo: 'text' },
  { seccion: 'Coordenadas', nombre: 'Coord. Este', tipo: 'text' },
  { seccion: 'Coordenadas', nombre: 'Coord. Norte', tipo: 'text' },
  { seccion: 'Documento Sustentatorio', nombre: 'Nombre Archivo', tipo: 'text' },
  { seccion: 'Documento Sustentatorio', nombre: 'Ruta Archivo', tipo: 'text' },
];

const participanteBase: CampoBase[] = [
  { seccion: 'Datos de Identidad y Demográficos', nombre: 'DNI', tipo: 'number', requerido: true },
  { seccion: 'Datos de Identidad y Demográficos', nombre: 'Apellidos', tipo: 'text' },
  { seccion: 'Datos de Identidad y Demográficos', nombre: 'Nombres', tipo: 'text' },
  { seccion: 'Datos de Identidad y Demográficos', nombre: 'Sexo', tipo: 'text' },
  { seccion: 'Datos de Identidad y Demográficos', nombre: 'Edad', tipo: 'text' },
  { seccion: 'Datos de Identidad y Demográficos', nombre: 'Fecha de nacimiento', tipo: 'date' },
  { seccion: 'Datos de Identidad y Demográficos', nombre: 'Estado Civil', tipo: 'text' },
  { seccion: 'Datos de Identidad y Demográficos', nombre: 'Ubigeo', tipo: 'text' },
  { seccion: 'Datos de Identidad y Demográficos', nombre: 'Dirección', tipo: 'text' },
  { seccion: 'Datos de Identidad y Demográficos', nombre: 'Restricciones', tipo: 'text' },
  { seccion: 'Datos técnicos y comerciales', nombre: 'Tipo Participante', tipo: 'select' },
  { seccion: 'Datos técnicos y comerciales', nombre: 'Actividad Otro Participante', tipo: 'select' },
  { seccion: 'Datos técnicos y comerciales', nombre: 'Principal Actividad', tipo: 'select' },
  { seccion: 'Datos técnicos y comerciales', nombre: 'Nombre de cultivo principal', tipo: 'text' },
  { seccion: 'Datos técnicos y comerciales', nombre: 'Principal plantación forestal', tipo: 'text' },
  { seccion: 'Datos técnicos y comerciales', nombre: 'Crianza principal', tipo: 'select' },
  { seccion: 'Datos técnicos y comerciales', nombre: 'Crianza secundaria', tipo: 'select' },
  { seccion: 'Organización y participación social', nombre: '¿Está asociado?', tipo: 'select' },
  { seccion: 'Organización y participación social', nombre: 'Tipo de Organización', tipo: 'select' },
  { seccion: 'Organización y participación social', nombre: 'Nombre de Organización', tipo: 'text' },
  { seccion: 'Información adicional', nombre: 'Nivel de instrucción', tipo: 'select' },
  { seccion: 'Información adicional', nombre: 'Centro poblado', tipo: 'text' },
];

export const CAMPOS_BASE: Record<FormularioKey, CampoBase[]> = {
  capacitacion: eventoBase,
  asistencia: eventoBase,
  participante_cap: participanteBase,
  participante_at: participanteBase,
};
