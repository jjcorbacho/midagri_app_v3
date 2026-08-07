import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { TipoModalFeedback } from '../../../core/services/modal.service';

export interface FeedbackDialogData {
  tipo: TipoModalFeedback;
  titulo: string;
  mensaje: string;
  /** Advertencias informativas: un único botón "Aceptar" (sin Cancelar). */
  soloAceptar?: boolean;
}

interface Variante {
  /** Ligadura de Material Symbols. */
  icono: string;
  /** Clase de color sobre tokens del tema activo. */
  tono: string;
  labelAceptar: string;
}

const VARIANTES: Record<TipoModalFeedback, Variante> = {
  info: { icono: 'info', tono: 'tono-info', labelAceptar: 'Aceptar' },
  warning: { icono: 'warning', tono: 'tono-warning', labelAceptar: 'Continuar' },
  confirm: { icono: 'help', tono: 'tono-confirm', labelAceptar: 'Confirmar' },
  success: { icono: 'check_circle', tono: 'tono-success', labelAceptar: 'Aceptar' },
  error: { icono: 'error', tono: 'tono-error', labelAceptar: 'Aceptar' },
};

/**
 * Diálogo único del sistema de feedback (info, advertencia, confirmación,
 * éxito y error). Lo abre `ModalService`, que resuelve su promesa con el
 * resultado del cierre: true = aceptado, false = cancelado.
 */
@Component({
  selector: 'app-feedback-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>{{ data.titulo }}</h2>

    <mat-dialog-content>
      <div class="icono" [class]="variante().tono" aria-hidden="true">
        <mat-icon fontSet="material-symbols-outlined">{{ variante().icono }}</mat-icon>
      </div>
      <p class="mensaje">{{ data.mensaje }}</p>
    </mat-dialog-content>

    <mat-dialog-actions align="center">
      @if (!soloAceptar()) {
        <button matButton [mat-dialog-close]="false">Cancelar</button>
      }
      <button matButton="filled" [mat-dialog-close]="true" cdkFocusInitial>
        {{ variante().labelAceptar }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .icono {
      width: 80px; height: 80px;
      margin: 8px auto 24px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }
    .icono mat-icon { font-size: 40px; width: 40px; height: 40px; }
    .tono-info { background: var(--mat-sys-secondary-container); color: var(--mat-sys-on-secondary-container); }
    .tono-warning,
    .tono-confirm { background: var(--mat-sys-tertiary-container); color: var(--mat-sys-on-tertiary-container); }
    .tono-success { background: var(--mat-sys-primary-container); color: var(--mat-sys-on-primary-container); }
    .tono-error { background: var(--mat-sys-error-container); color: var(--mat-sys-on-error-container); }
    .mensaje {
      text-align: center;
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface);
      margin: 0;
      padding: 0 8px;
    }
  `,
})
export class FeedbackDialogComponent {
  readonly data = inject<FeedbackDialogData>(MAT_DIALOG_DATA);

  readonly variante = computed(() => VARIANTES[this.data.tipo] ?? VARIANTES.info);

  /** Un solo botón en info/success/error y en advertencias informativas. */
  soloAceptar(): boolean {
    return (
      this.data.soloAceptar === true ||
      this.data.tipo === 'info' ||
      this.data.tipo === 'success' ||
      this.data.tipo === 'error'
    );
  }
}
