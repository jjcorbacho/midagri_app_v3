export type TipoParticipante = 'PRODUCTOR' | 'OTRO';

export interface Participante {
  id: string;
  cursoId: string;
  tipoParticipante: TipoParticipante;
  dni: string;
  apellidos: string;
  nombres: string;
  fechaNacimiento: string; // ISO yyyy-mm-dd
  primActividad: string;
  fotoSustento?: string;
}

/** Registro del padrón de productores (búsqueda por DNI). */
export interface ProductorBD {
  dni: string;
  apellidos: string;
  nombres: string;
  fechaNacimiento: string;
  sexo: 'Masculino' | 'Femenino';
  primActividad: string;
  estadoCivil?: string;
  ubigeo?: string;
  direccion?: string;
  restricciones?: string;
}
