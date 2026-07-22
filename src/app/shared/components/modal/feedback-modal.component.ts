import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { LucideAngularModule, CircleAlert, CircleCheck, CircleHelp, CircleX, Info } from 'lucide-angular';
import { ModalService, TipoModalFeedback } from '../../../core/services/modal.service';
import { ModalComponent } from './modal.component';

interface EstiloModal {
  icono: typeof Info;
  /** Clases del contenedor del icono (color principal del tipo). */
  tono: string;
  botonPrincipal: string;
  etiquetaPrincipal: string;
  conCancelar: boolean;
}

const ESTILOS: Record<TipoModalFeedback, EstiloModal> = {
  info: {
    icono: Info,
    tono: 'bg-info-soft text-info',
    botonPrincipal: 'btn-primary',
    etiquetaPrincipal: 'Aceptar',
    conCancelar: false,
  },
  warning: {
    icono: CircleAlert,
    tono: 'bg-warning-soft text-warning-foreground',
    botonPrincipal: 'btn-primary',
    etiquetaPrincipal: 'Continuar',
    conCancelar: true,
  },
  confirm: {
    icono: CircleHelp,
    tono: 'bg-brand-soft text-brand',
    botonPrincipal: 'btn-primary',
    etiquetaPrincipal: 'Confirmar',
    conCancelar: true,
  },
  success: {
    icono: CircleCheck,
    tono: 'bg-success-soft text-success',
    botonPrincipal: 'btn-success',
    etiquetaPrincipal: 'Aceptar',
    conCancelar: false,
  },
  error: {
    icono: CircleX,
    tono: 'bg-destructive/10 text-destructive',
    botonPrincipal: 'btn-danger',
    etiquetaPrincipal: 'Aceptar',
    conCancelar: false,
  },
};

/**
 * Modal unificado de feedback (info · advertencia · confirmación · éxito · error).
 * Se monta una sola vez en AppComponent y renderiza la solicitud activa del
 * ModalService. Todos los tipos comparten contenedor, tipografía, espaciado y
 * animaciones; solo cambian color principal, icono y textos.
 */
@Component({
  selector: 'app-feedback-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, ModalComponent],
  template: `
    @if (servicio.solicitud(); as s) {
      <app-modal [title]="s.titulo" maxWidth="max-w-md" (closed)="servicio.cerrar(false)">
        <div class="flex flex-col items-center text-center gap-3 pt-1">
          <div class="size-12 rounded-full flex items-center justify-center" [class]="estilo().tono" aria-hidden="true">
            <lucide-angular [img]="estilo().icono" class="size-6" />
          </div>
          <p class="text-sm text-foreground leading-relaxed">{{ s.mensaje }}</p>
        </div>
        <div class="flex justify-center gap-2 mt-6">
          @if (estilo().conCancelar && !s.soloAceptar) {
            <button (click)="servicio.cerrar(false)" class="btn-secondary px-6 min-w-[110px]">Cancelar</button>
          }
          <button (click)="servicio.cerrar(true)" [class]="estilo().botonPrincipal + ' px-6 min-w-[110px]'">
            {{ s.soloAceptar ? 'Aceptar' : estilo().etiquetaPrincipal }}
          </button>
        </div>
      </app-modal>
    }
  `,
})
export class FeedbackModalComponent {
  readonly servicio = inject(ModalService);
  readonly estilo = computed(() => ESTILOS[this.servicio.solicitud()?.tipo ?? 'info']);
}
