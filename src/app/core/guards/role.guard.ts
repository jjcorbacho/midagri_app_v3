import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Perfil } from '../models/usuario-sodega.model';

/**
 * Matriz de acceso por perfil SODEGA.
 * Mapea los módulos existentes a la jerarquía de perfiles del prototipo base:
 *  - Técnico registra capacitaciones/AT → Admin DZ evalúa técnicos →
 *    Admin UO evalúa a los DZ → Jefe de Área aprueba a las UO.
 *  - Gestión de Usuarios: todos los perfiles administrativos (no el Técnico).
 */
function isAllowed(path: string, perfil: Perfil): boolean {
  if (perfil === 'Administrador General') return true;
  if (path.startsWith('/perfil') || path.startsWith('/dashboard')) return true;

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
  const router = inject(Router);
  const perfil = auth.perfil();
  if (!perfil) return router.createUrlTree(['/auth']);
  if (isAllowed(state.url, perfil)) return true;
  return router.createUrlTree([fallbackFor(perfil)]);
};
