import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'info' | 'warning' | 'error';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
  description?: string;
}

/** Notificaciones tipo "sonner" (equivalente al toast del sistema original). */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  success(message: string, description?: string): void { this.push('success', message, description); }
  info(message: string, description?: string): void { this.push('info', message, description); }
  warning(message: string, description?: string): void { this.push('warning', message, description); }
  error(message: string, description?: string): void { this.push('error', message, description); }

  private push(kind: ToastKind, message: string, description?: string): void {
    const toast: Toast = { id: ++this.seq, kind, message, description };
    this._toasts.update((t) => [...t, toast]);
    setTimeout(() => this.dismiss(toast.id), 4000);
  }

  dismiss(id: number): void {
    this._toasts.update((t) => t.filter((x) => x.id !== id));
  }
}
