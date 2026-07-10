import type { Perfil } from './usuario-sodega.model';

/**
 * Modelo de permisos de menú por usuario (pestaña Permisos de Gestión de Usuarios).
 * Migrado del prototipo (secciones "Permisos de menú para Técnico / Administrador DZ / Jefe de Área").
 *
 * El esquema es declarativo: cada perfil define grupos e ítems con su valor por
 * defecto, y los permisos efectivos de un usuario son `defaults ⊕ guardados`.
 * Esto evita lógica repetida por checkbox y permite agregar perfiles/permisos
 * sin tocar componentes.
 */

/** Estado de los permisos de un grupo: clave de ítem → activado. */
export type PermisosGrupo = Record<string, boolean>;

/** Permisos de menú completos de un usuario: clave de grupo → ítems. */
export type PermisosMenu = Record<string, PermisosGrupo>;

/** Iconografía semántica de los grupos (el componente la mapea a Lucide). */
export type IconoGrupoPermiso = 'registrar' | 'visualizar';

/** Definición de un permiso individual (checkbox). */
export interface PermisoItemDef {
  key: string;
  label: string;
  /** Valor por defecto cuando el usuario aún no tiene permisos guardados. */
  defecto: boolean;
}

/** Definición de un grupo de permisos (tarjeta con checkboxes). */
export interface PermisosGrupoDef {
  key: string;
  label: string;
  icono: IconoGrupoPermiso;
  items: PermisoItemDef[];
}

/** Esquema completo de permisos de menú para un perfil. */
export interface EsquemaPermisosMenu {
  perfil: Perfil;
  titulo: string;
  descripcion: string;
  grupos: PermisosGrupoDef[];
}

/** Permisos por defecto derivados del esquema. */
export function permisosPorDefecto(esquema: EsquemaPermisosMenu): PermisosMenu {
  const permisos: PermisosMenu = {};
  for (const grupo of esquema.grupos) {
    permisos[grupo.key] = Object.fromEntries(grupo.items.map((i) => [i.key, i.defecto]));
  }
  return permisos;
}

/** Todos los permisos del esquema activados (cuentas master). */
export function permisosCompletos(esquema: EsquemaPermisosMenu): PermisosMenu {
  const permisos: PermisosMenu = {};
  for (const grupo of esquema.grupos) {
    permisos[grupo.key] = Object.fromEntries(grupo.items.map((i) => [i.key, true]));
  }
  return permisos;
}

/**
 * Combina permisos guardados sobre los defaults del esquema (tolerante a
 * datos parciales). Solo conserva las claves definidas en el esquema: los
 * permisos guardados que ya no existan para el perfil se descartan al cargar.
 */
export function combinarPermisos(
  esquema: EsquemaPermisosMenu,
  guardados?: PermisosMenu | null,
): PermisosMenu {
  if (!guardados) return permisosPorDefecto(esquema);
  const permisos: PermisosMenu = {};
  for (const grupo of esquema.grupos) {
    const guardadosGrupo = guardados[grupo.key] ?? {};
    permisos[grupo.key] = Object.fromEntries(
      grupo.items.map((i) => [i.key, guardadosGrupo[i.key] ?? i.defecto]),
    );
  }
  return permisos;
}

/** Consulta segura de un permiso individual. */
export function tienePermiso(permisos: PermisosMenu | null | undefined, grupo: string, item: string): boolean {
  return permisos?.[grupo]?.[item] === true;
}

/** ¿Algún permiso del grupo está activo? (para mostrar/ocultar secciones de menú). */
export function algunPermisoActivo(permisos: PermisosMenu | null | undefined, grupo: string): boolean {
  const g = permisos?.[grupo];
  return !!g && Object.values(g).some(Boolean);
}
