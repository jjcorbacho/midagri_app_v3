/**
 * Modelo de Administración de Listas (catálogos maestros SODEGA).
 * Migrado del prototipo (index.html — VISTA D: Administración de Listas).
 */

/** Opción individual de una lista maestra. */
export interface OpcionLista {
  codigo: string;
  nombre: string;
  activo: boolean;
}

/** Lista maestra administrable (catálogo del sistema). */
export interface ListaAdmin {
  nombre: string;
  opciones: OpcionLista[];
}

/**
 * Catálogo registrado del sistema: solo estas listas pueden agregarse
 * desde la pantalla de administración (con alias tolerantes de búsqueda).
 */
export interface CatalogoSistema {
  nombre: string;
  alias: string[];
  opciones: string[];
}

/** Resultado tipado de las operaciones de administración de listas. */
export interface ResultadoLista {
  ok: boolean;
  titulo: string;
  mensaje: string;
}

/** Crea una opción de lista normalizada. */
export function crearOpcionLista(codigo: string, nombre: string, activo = true): OpcionLista {
  return { codigo, nombre, activo };
}

/** Código autogenerado correlativo (OPC001, OPC002, …). */
export function generarCodigoOpcion(index: number): string {
  return `OPC${String(index + 1).padStart(3, '0')}`;
}

/** Convierte un arreglo de textos planos en opciones activas con código correlativo. */
export function opcionesDesdeTextos(textos: readonly string[]): OpcionLista[] {
  return textos.map((nombre, i) => crearOpcionLista(generarCodigoOpcion(i), nombre, true));
}
