import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PermisosMenuService } from '../services/permisos-menu.service';
import { Perfil } from '../models/usuario-sodega.model';
import { GRUPO_ADMINISTRACION, PERMISO_ADMIN_LISTAS } from '../constants/permisos-menu.const';

/**
 * Matriz de acceso por perfil SODEGA.
 * Mapea los módulos existentes a la jerarquía de perfiles del prototipo base:
 *  - Técnico registra capacitaciones/AT → Admin DZ evalúa técnicos →
 *    Admin UO evalúa a los DZ → Jefe de Área aprueba a las UO.
 *  - Gestión de Usuarios: todos los perfiles administrativos (no el Técnico).
 *  - Administración → Listas: Admin General siempre; Jefe de Área, Admin UO y
 *    Admin DZ solo si su permiso de menú `administracion.listas` está activo.
 */
function isAllowed(path: string, perfil: Perfil, puedeVerListas: boolean): boolean {
  if (perfil === 'Administrador General') return true;
  if (path.startsWith('/perfil') || path.startsWith('/dashboard')) return true;

  if (path.startsWith('/administracion')) return puedeVerListas;

  if (perfil === 'Jefe de Área') {
    if (path.startsWith('/seguimiento/aprobacion')) return true;
    if (path.startsWith('/reportes')) return true;
    if (path.startsWith('/usuarios')) return true;
    if (path.startsWith('/capacitaciones-n1/')) return true;
    return false;
  }
  if (perfil === 'Administrador Unidad Organizacional') {
    if (path.startsWith('/seguimiento/aprobacion')) return true;
    if (path.startsWith('/configuracion/campos')) return true;
    if (path.startsWith('/configuracion/reglas')) return true;
    if (path.startsWith('/configuracion')) return true; // redirect interno → reglas
    if (path.startsWith('/usuarios')) return true;
    if (path.startsWith('/reportes')) return true;
    if (path.startsWith('/capacitaciones-n1/')) return true;
    return false;
  }
  if (perfil === 'Administrador DZ_Cap_Asit.') {
    if (path.startsWith('/seguimiento/revision')) return true;
    if (path.startsWith('/usuarios')) return true;
    if (path.startsWith('/capacitaciones-n1/')) return true;
    return false;
  }
  if (perfil === 'Técnico Capacitación y Asistencia Técnica') {
    if (path.startsWith('/capacitaciones-n1')) return true;
    return false;
  }
  return false;
}

/** Ruta de aterrizaje cuando el perfil no tiene acceso a la URL solicitada. */
function fallbackFor(perfil: Perfil): string {
  switch (perfil) {
    case 'Jefe de Área': return '/seguimiento/aprobacion';
    case 'Administrador Unidad Organizacional': return '/seguimiento/aprobacion';
    case 'Administrador DZ_Cap_Asit.': return '/seguimiento/revision';
    case 'Técnico Capacitación y Asistencia Técnica': return '/capacitaciones-n1';
    default: return '/dashboard';
  }
}

export const roleGuard: CanActivateChildFn = (_route, state) => {
  const auth = inject(AuthService);
  const permisosMenu = inject(PermisosMenuService);
  const router = inject(Router);
  const perfil = auth.perfil();
  if (!perfil) return router.createUrlTree(['/auth']);
  const puedeVerListas = permisosMenu.sesionTiene(GRUPO_ADMINISTRACION, PERMISO_ADMIN_LISTAS);
  if (isAllowed(state.url, perfil, puedeVerListas)) return true;
  return router.createUrlTree([fallbackFor(perfil)]);
};
