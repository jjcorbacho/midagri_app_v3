import { Injectable, computed, inject } from '@angular/core';
import {
  EsquemaPermisosMenu,
  PermisosMenu,
  algunPermisoActivo,
  combinarPermisos,
  permisosPorDefecto,
  tienePermiso,
} from '../models/permisos-menu.model';
import { ESQUEMAS_PERMISOS_MENU } from '../constants/permisos-menu.const';
import { Perfil, UsuarioSodega } from '../models/usuario-sodega.model';
import { AuthService } from './auth.service';
import { UsuariosService } from './usuarios.service';

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

  /** Permisos efectivos del registro activo en sesión (defaults ⊕ guardados). */
  readonly permisosSesion = computed<PermisosMenu | null>(() => {
    const s = this.auth.session();
    if (!s) return null;
    const esquema = this.esquemaPara(s.perfil);
    if (!esquema) return null;
    const registro = this.usuariosService
      .usuarios()
      .find((u) => u.userGen === s.userGen && u.perfil === s.perfil && (!s.unidad || u.unidad === s.unidad))
      ?? this.usuariosService.usuarios().find((u) => u.userGen === s.userGen && u.perfil === s.perfil);
    return combinarPermisos(esquema, registro?.permisosMenu);
  });

  /* ===== Esquemas ===== */

  /** Esquema de permisos configurable para un perfil (undefined si no aplica). */
  esquemaPara(perfil: Perfil | ''): EsquemaPermisosMenu | undefined {
    return perfil ? ESQUEMAS_PERMISOS_MENU[perfil] : undefined;
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
