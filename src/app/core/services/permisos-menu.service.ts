import { Injectable, computed, inject } from '@angular/core';
import {
  EsquemaPermisosMenu,
  PermisosMenu,
  algunPermisoActivo,
  combinarPermisos,
  permisosPorDefecto,
  tienePermiso,
} from '../models/permisos-menu.model';
import { ESQUEMAS_PERMISOS_MENU, esquemaPerfilPersonalizado } from '../constants/permisos-menu.const';
import { PERFILES, Perfil, PerfilConocido, UsuarioSodega } from '../models/usuario-sodega.model';
import { AuthService } from './auth.service';
import { ListasAdminService } from './listas-admin.service';
import { UsuariosService } from './usuarios.service';
import { normalizarNombreCatalogo } from '../../shared/utils/texto.util';

/**
 * Permisos de menú por usuario (lógica desacoplada de la interfaz).
 *
 * ⚠ SIMULADO: los permisos se guardan en el registro del usuario (UsuariosService).
 * Contratos sugeridos para el backend:
 *  - GET /usuarios/{id}/permisos
 *  - PUT /usuarios/{id}/permisos
 */
@Injectable({ providedIn: 'root' })
export class PermisosMenuService {
  private readonly auth = inject(AuthService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly listasAdmin = inject(ListasAdminService);

  /** Permisos efectivos del registro activo en sesión (defaults ⊕ guardados). */
  readonly permisosSesion = computed<PermisosMenu | null>(() => {
    const s = this.auth.session();
    if (!s) return null;
    const esquema = this.esquemaPara(s.perfil);
    if (!esquema) return null;
    const registro = this.usuariosService
      .usuarios()
      .find((u) => u.userGen === s.userGen && u.perfil === s.perfil && (!s.unidad || u.unidad === s.unidad))
      ?? this.usuariosService.usuarios().find((u) => u.userGen === s.userGen && u.perfil === s.perfil)
      // Perfil personalizado sin registro propio (Admin General master operando
      // con él): hereda los permisos guardados de un usuario de ese perfil.
      ?? (this.esPerfilPersonalizado(s.perfil)
        ? this.usuariosService.usuarios().find((u) => u.perfil === s.perfil && u.permisosMenu)
        : undefined);
    return combinarPermisos(esquema, registro?.permisosMenu);
  });

  /* ===== Esquemas ===== */

  /** ¿El perfil es personalizado (creado en la lista "Perfil Autorizado")? */
  esPerfilPersonalizado(perfil: Perfil | ''): boolean {
    if (!perfil) return false;
    const clave = normalizarNombreCatalogo(perfil);
    if (PERFILES.some((p) => normalizarNombreCatalogo(p) === clave)) return false;
    return this.listasAdmin
      .perfilesAutorizados(PERFILES)
      .some((p) => normalizarNombreCatalogo(p) === clave);
  }

  /** Esquema de permisos configurable para un perfil (undefined si no aplica). */
  esquemaPara(perfil: Perfil | ''): EsquemaPermisosMenu | undefined {
    if (!perfil) return undefined;
    const conocido = ESQUEMAS_PERMISOS_MENU[perfil as PerfilConocido];
    if (conocido) return conocido;
    return this.esPerfilPersonalizado(perfil) ? esquemaPerfilPersonalizado(perfil) : undefined;
  }

  /** Permisos por defecto del perfil (usuario nuevo). */
  permisosIniciales(perfil: Perfil | ''): PermisosMenu | null {
    const esquema = this.esquemaPara(perfil);
    return esquema ? permisosPorDefecto(esquema) : null;
  }

  /* ===== Consulta / recuperación ===== */

  /** Permisos efectivos de un usuario (defaults del perfil ⊕ guardados). */
  permisosDe(usuario: Pick<UsuarioSodega, 'perfil' | 'permisosMenu'>): PermisosMenu | null {
    const esquema = this.esquemaPara(usuario.perfil);
    return esquema ? combinarPermisos(esquema, usuario.permisosMenu) : null;
  }

  /** ¿El registro activo en sesión tiene el permiso indicado? */
  sesionTiene(grupo: string, item: string): boolean {
    return tienePermiso(this.permisosSesion(), grupo, item);
  }

  /** ¿El registro activo en sesión tiene algún permiso del grupo? */
  sesionTieneGrupo(grupo: string): boolean {
    return algunPermisoActivo(this.permisosSesion(), grupo);
  }

  /* ===== Guardado ===== */

  /** PUT /usuarios/{id}/permisos — persiste los permisos de un usuario. */
  guardar(usuarioId: string, permisos: PermisosMenu): void {
    this.usuariosService.update(usuarioId, { permisosMenu: permisos });
  }
}
