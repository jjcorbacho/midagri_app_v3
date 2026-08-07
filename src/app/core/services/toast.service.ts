import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

export type ToastKind = 'success' | 'info' | 'warning' | 'error';

/**
 * Notificaciones temporales del sistema, sobre `MatSnackBar`.
 *
 * La API pública (success / info / warning / error) no cambió al migrar a
 * Angular Material, por lo que todos los llamadores siguen igual. El tono se
 * aplica con una clase por tipo, resuelta con los tokens del tema activo.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string, description?: string): void { this.push('success', message, description); }
  info(message: string, description?: string): void { this.push('info', message, description); }
  warning(message: string, description?: string): void { this.push('warning', message, description); }
  error(message: string, description?: string): void { this.push('error', message, description); }

  private push(kind: ToastKind, message: string, description?: string): void {
    this.snackBar.open(description ? `${message} — ${description}` : message, 'Cerrar', {
      duration: kind === 'error' ? 7000 : 4000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: [`toast-${kind}`],
    });
  }

  /** Cierra la notificación visible (equivalente al descarte manual previo). */
  dismiss(): void {
    this.snackBar.dismiss();
  }
}
