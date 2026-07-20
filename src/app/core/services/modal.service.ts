import { Injectable, signal } from '@angular/core';

/** Tipos de modal del sistema unificado de feedback. */
export type TipoModalFeedback = 'info' | 'warning' | 'confirm' | 'success' | 'error';

/** Solicitud de modal en curso (una a la vez, igual que un diálogo nativo). */
export interface SolicitudModal {
  tipo: TipoModalFeedback;
  titulo: string;
  mensaje: string;
  /** true = aceptado/confirmado · false = cancelado (siempre true en modales de un botón). */
  resolver: (resultado: boolean) => void;
}

/**
 * Servicio centralizado del sistema unificado de modales.
 *
 * Reemplaza a `alert()`, `confirm()` y a los modales de aviso repetidos por
 * componente. El `FeedbackModalComponent` (montado una sola vez en AppComponent)
 * renderiza la solicitud activa; cada método devuelve una promesa que se
 * resuelve al cerrar:
 *
 *   await modales.openConfirm('Eliminar registro', '¿Desea continuar?');
 */
@Injectable({ providedIn: 'root' })
export class ModalService {
  private readonly _solicitud = signal<SolicitudModal | null>(null);
  readonly solicitud = this._solicitud.asReadonly();

  /** Modal informativo: icono info + Aceptar. */
  openInfo(titulo: string, mensaje: string): Promise<boolean> {
    return this.abrir('info', titulo, mensaje);
  }

  /** Modal de advertencia: icono alerta + Continuar / Cancelar. */
  openWarning(titulo: string, mensaje: string): Promise<boolean> {
    return this.abrir('warning', titulo, mensaje);
  }

  /** Modal de confirmación de acciones: icono pregunta + Confirmar / Cancelar. */
  openConfirm(titulo: string, mensaje: string): Promise<boolean> {
    return this.abrir('confirm', titulo, mensaje);
  }

  /** Modal de éxito: icono check + Aceptar. */
  openSuccess(titulo: string, mensaje: string): Promise<boolean> {
    return this.abrir('success', titulo, mensaje);
  }

  /** Modal de error: icono error + Aceptar. */
  openError(titulo: string, mensaje: string): Promise<boolean> {
    return this.abrir('error', titulo, mensaje);
  }

  /** Cierra la solicitud activa resolviendo su promesa. */
  cerrar(resultado: boolean): void {
    const actual = this._solicitud();
    this._solicitud.set(null);
    actual?.resolver(resultado);
  }

  private abrir(tipo: TipoModalFeedback, titulo: string, mensaje: string): Promise<boolean> {
    // Si hubiera un modal previo abierto se resuelve como cancelado.
    this._solicitud()?.resolver(false);
    return new Promise<boolean>((resolver) => {
      this._solicitud.set({ tipo, titulo, mensaje, resolver });
    });
  }
}
