import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  FeedbackDialogComponent,
  FeedbackDialogData,
} from '../../shared/components/modal/feedback-dialog.component';

/** Tipos de modal del sistema unificado de feedback. */
export type TipoModalFeedback = 'info' | 'warning' | 'confirm' | 'success' | 'error';

/**
 * Servicio centralizado del sistema unificado de modales.
 *
 * Reemplaza a `alert()`, `confirm()` y a los modales de aviso repetidos por
 * componente. Se apoya en `MatDialog`: cada método abre el
 * `FeedbackDialogComponent` y devuelve una promesa que se resuelve al cerrar
 * (true = aceptado/confirmado, false = cancelado).
 *
 *   await modales.openConfirm('Eliminar registro', '¿Desea continuar?');
 *
 * La API pública no cambió al migrar a Angular Material, por lo que todos los
 * llamadores siguen igual.
 */
@Injectable({ providedIn: 'root' })
export class ModalService {
  private readonly dialog = inject(MatDialog);

  /** Modal informativo: icono info + Aceptar. */
  openInfo(titulo: string, mensaje: string): Promise<boolean> {
    return this.abrir({ tipo: 'info', titulo, mensaje });
  }

  /** Modal de advertencia: icono alerta + Continuar / Cancelar
   *  (o solo "Aceptar" cuando es una advertencia informativa). */
  openWarning(titulo: string, mensaje: string, opciones?: { soloAceptar?: boolean }): Promise<boolean> {
    return this.abrir({ tipo: 'warning', titulo, mensaje, soloAceptar: opciones?.soloAceptar });
  }

  /** Modal de confirmación de acciones: icono pregunta + Confirmar / Cancelar. */
  openConfirm(titulo: string, mensaje: string): Promise<boolean> {
    return this.abrir({ tipo: 'confirm', titulo, mensaje });
  }

  /** Modal de éxito: icono check + Aceptar. */
  openSuccess(titulo: string, mensaje: string): Promise<boolean> {
    return this.abrir({ tipo: 'success', titulo, mensaje });
  }

  /** Modal de error: icono error + Aceptar. */
  openError(titulo: string, mensaje: string): Promise<boolean> {
    return this.abrir({ tipo: 'error', titulo, mensaje });
  }

  private abrir(data: FeedbackDialogData): Promise<boolean> {
    // Igual que antes, solo hay un modal de feedback a la vez.
    this.dialog.closeAll();
    const ref = this.dialog.open<FeedbackDialogComponent, FeedbackDialogData, boolean>(
      FeedbackDialogComponent,
      {
        data,
        width: '480px',
        maxWidth: '95vw',
        autoFocus: 'dialog',
        restoreFocus: true,
      },
    );
    return new Promise<boolean>((resolver) => {
      ref.afterClosed().subscribe((r) => resolver(r === true));
    });
  }
}
