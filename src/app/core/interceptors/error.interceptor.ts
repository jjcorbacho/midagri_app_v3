import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';

/**
 * Manejo centralizado de errores HTTP.
 *  - 401: cierra sesión y redirige a /auth.
 *  - Resto: notifica con un toast y propaga el error.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        auth.logout();
        router.navigate(['/auth']);
      } else {
        toast.error('Error de comunicación con el servidor', error.message);
      }
      return throwError(() => error);
    }),
  );
};
