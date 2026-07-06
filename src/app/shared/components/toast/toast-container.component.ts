import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideAngularModule, CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-angular';
import { ToastService, Toast } from '../../../core/services/toast.service';

/** Contenedor global de notificaciones (equivalente al <Toaster /> de sonner). */
@Component({
  selector: 'app-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <div class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[356px] max-w-[calc(100vw-2rem)]">
      @for (t of toastService.toasts(); track t.id) {
        <div
          class="bg-card text-foreground ring-1 ring-border rounded-lg shadow-lg px-4 py-3 flex items-start gap-3 animate-in fade-in-0 slide-in-from-bottom-2"
        >
          <lucide-angular [img]="iconFor(t)" class="size-4 shrink-0 mt-0.5" [class]="colorFor(t)" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold leading-tight">{{ t.message }}</p>
            @if (t.description) {
              <p class="text-xs text-muted-foreground mt-0.5">{{ t.description }}</p>
            }
          </div>
          <button
            (click)="toastService.dismiss(t.id)"
            class="text-muted-foreground hover:text-foreground"
            aria-label="Cerrar notificación"
          >
            <lucide-angular [img]="XIcon" class="size-3.5" />
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
  readonly XIcon = X;

  iconFor(t: Toast) {
    switch (t.kind) {
      case 'success': return CheckCircle2;
      case 'warning': return AlertTriangle;
      case 'error': return XCircle;
      default: return Info;
    }
  }

  colorFor(t: Toast): string {
    switch (t.kind) {
      case 'success': return 'text-state-aprobado';
      case 'warning': return 'text-state-enviado';
      case 'error': return 'text-destructive';
      default: return 'text-brand';
    }
  }
}
