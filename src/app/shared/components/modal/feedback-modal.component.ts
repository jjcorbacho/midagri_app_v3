import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ModalService, TipoModalFeedback } from '../../../core/services/modal.service';
import { ModalComponent, TipoModalVisual } from './modal.component';

/**
 * Mapa entre los tipos funcionales del `ModalService` y las variantes visuales
 * del componente base. Las confirmaciones comparten la variante de advertencia
 * (ámbar) porque requieren la atención del usuario antes de continuar.
 */
const VARIANTE_POR_TIPO: Record<TipoModalFeedback, TipoModalVisual> = {
  info: 'info',
  warning: 'warning',
  confirm: 'warning',
  success: 'success',
  error: 'error',
};

/** Tipos que, por naturaleza, solo informan (una única acción: Aceptar). */
const TIPOS_INFORMATIVOS: TipoModalFeedback[] = ['info', 'success', 'error'];

/**
 * Modal unificado de feedback (info · advertencia · confirmación · éxito · error).
 * Se monta una sola vez en AppComponent y renderiza la solicitud activa del
 * ModalService delegando toda la presentación en el componente base `app-modal`.
 */
@Component({
  selector: 'app-feedback-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalComponent],
  template: `
    @if (servicio.solicitud(); as s) {
      <app-modal
        [title]="s.titulo"
        maxWidth="max-w-md"
        [tipo]="variante()"
        [mensaje]="s.mensaje"
        [mostrarAcciones]="true"
        [mostrarCancelar]="mostrarCancelar()"
        (aceptado)="servicio.cerrar(true)"
        (cancelado)="servicio.cerrar(false)"
        (closed)="servicio.cerrar(false)"
      />
    }
  `,
})
export class FeedbackModalComponent {
  readonly servicio = inject(ModalService);

  readonly variante = computed<TipoModalVisual>(
    () => VARIANTE_POR_TIPO[this.servicio.solicitud()?.tipo ?? 'info'],
  );

  /** Solo las acciones que el usuario puede rechazar ofrecen "Cancelar". */
  readonly mostrarCancelar = computed(() => {
    const s = this.servicio.solicitud();
    if (!s || s.soloAceptar) return false;
    return !TIPOS_INFORMATIVOS.includes(s.tipo);
  });
}
