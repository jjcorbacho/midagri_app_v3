import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Rol } from '../models/user.model';

/** Matriz de acceso por rol (idéntica a la del sistema original). */
function isAllowed(path: string, role: Rol): boolean {
  if (role === 'ADMINISTRADOR') return true;
  if (path.startsWith('/perfil') || path.startsWith('/dashboard')) return true;
  if (role === 'ADMIN_DZ') {
    if (path.startsWith('/seguimiento/revision')) return true;
    if (path.startsWith('/capacitaciones-n1/')) return true;
    return false;
  }
  if (role === 'ADMIN_UE') {
    if (path.startsWith('/seguimiento/aprobacion')) return true;
    if (path.startsWith('/configuracion/campos')) return true;
    if (path.startsWith('/capacitaciones-n1/')) return true;
    return false;
  }
  if (role === 'TECNICO1') {
    if (path.startsWith('/capacitaciones-n1')) return true;
    return false;
  }
  return false;
}

/** Ruta de aterrizaje cuando el rol no tiene acceso a la URL solicitada. */
function fallbackFor(role: Rol): string {
  switch (role) {
    case 'ADMIN_DZ': return '/seguimiento/revision';
    case 'ADMIN_UE': return '/seguimiento/aprobacion';
    default: return '/capacitaciones-n1';
  }
}

export const roleGuard: CanActivateChildFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.user();
  if (!user) return router.createUrlTree(['/auth']);
  const role = (user.rol as Rol) ?? 'ADMINISTRADOR';
  if (isAllowed(state.url, role)) return true;
  return router.createUrlTree([fallbackFor(role)]);
};
