import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Bloquea las rutas del shell si no hay sesión activa.
 * TODO(backend): validar además la vigencia del token JWT.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.user()) return true;
  console.warn(
    '[DIAGNÓSTICO SODEGA] Estado de sesión: no existe una sesión activa. Redirigiendo a /auth.',
  );
  return router.createUrlTree(['/auth']);
};
