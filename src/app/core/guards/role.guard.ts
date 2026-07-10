import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PermisosMenuService } from '../services/permisos-menu.service';
import { Perfil } from '../models/usuario-sodega.model';
import {
  GRUPO_REGISTRAR,
  GRUPO_VISUALIZAR,
  PERMISO_LISTAS,
  PERMISO_REPORTE_ASISTENCIA,
  PERMISO_REPORTE_CAPACITACIONES,
} from '../constants/permisos-menu.const';

/** Permisos del usuario en sesión que condicionan rutas (matriz permisos.xlsx). */
interface FlagsPermisos {
  puedeVerListas: boolean;
  puedeVerReportes: boolean;
}

/**
 * Matriz de acceso por perfil SODEGA.
 * Mapea los módulos existentes a la jerarquía de perfiles del prototipo base:
 *  - Técnico registra capacitaciones/AT → Admin DZ evalúa técnicos →
 *    Admin UO evalúa a los DZ → Jefe de Área aprueba a las UO.
 *  - Gestión de Usuarios: todos los perfiles administrativos (no el Técnico).
 *  - Administración → Listas y Reportes: según los permisos de menú del
 *    usuario (grupos Registrar/Visualizar de la matriz permisos.xlsx).
 */
function isAllowed(path: string, perfil: Perfil, flags: FlagsPermisos): boolean {
  if (perfil === 'Administrador General') return true;
  if (path.startsWith('/perfil') || path.startsWith('/dashboard')) return true;

  if (path.startsWith('/administracion')) return flags.puedeVerListas;

  if (perfil === 'Jefe de Área') {
    if (path.startsWith('/seguimiento/aprobacion')) return true;
    if (path.startsWith('/reportes')) return flags.puedeVerReportes;
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
    if (path.startsWith('/reportes')) return flags.puedeVerReportes;
    if (path.startsWith('/capacitaciones-n1/')) return true;
    return false;
  }
  if (perfil === 'Administrador DZ_Cap_Asit.') {
    if (path.startsWith('/seguimiento/revision')) return true;
    if (path.startsWith('/reportes')) return flags.puedeVerReportes;
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
  const flags: FlagsPermisos = {
    puedeVerListas: permisosMenu.sesionTiene(GRUPO_REGISTRAR, PERMISO_LISTAS),
    puedeVerReportes:
      permisosMenu.sesionTiene(GRUPO_VISUALIZAR, PERMISO_REPORTE_CAPACITACIONES) ||
      permisosMenu.sesionTiene(GRUPO_VISUALIZAR, PERMISO_REPORTE_ASISTENCIA),
  };
  if (isAllowed(state.url, perfil, flags)) return true;
  return router.createUrlTree([fallbackFor(perfil)]);
};
