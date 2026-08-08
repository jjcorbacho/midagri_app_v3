import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ObservacionItem } from '../../../core/models/curso.model';

/** Datos de apertura: historial de observaciones del registro y su código. */
export interface ObservacionesData {
  codigo: string;
  observaciones: ObservacionItem[];
}

/**
 * Historial de observaciones de un registro N1, en orden de llegada.
 * Sustituye al modal declarativo que mostraba el historial como texto plano.
 */
@Component({
  selector: 'app-observaciones-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Observaciones</h2>

    <mat-dialog-content>
      <p class="registro">Registro {{ data.codigo }}</p>
      @if (data.observaciones.length === 0) {
        <p class="vacio">Este registro no tiene observaciones.</p>
      }
      <ol class="historial">
        @for (o of data.observaciones; track $index) {
          <li>
            <div class="cabecera">
              <mat-icon fontSet="material-symbols-outlined">report</mat-icon>
              <span class="fecha">{{ o.fecha }}</span>
              @if (o.autor) {
                <span class="autor">· {{ o.autor }}</span>
              }
            </div>
            <p class="descripcion">{{ o.descripcion }}</p>
          </li>
        }
      </ol>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button matButton="filled" mat-dialog-close cdkFocusInitial>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: `
    .registro {
      margin: 0 0 12px;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }
    .vacio {
      margin: 0;
      font: var(--mat-sys-body-medium);
      font-style: italic;
      color: var(--mat-sys-on-surface-variant);
    }
    .historial { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 12px; }
    .historial li {
      padding: 12px;
      border-radius: var(--mat-sys-corner-medium);
      background: var(--estado-observado-fondo);
      color: var(--estado-observado);
    }
    .cabecera { display: flex; align-items: center; gap: 6px; }
    .cabecera mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .fecha { font: var(--mat-sys-label-large); }
    .autor { font: var(--mat-sys-label-small); opacity: 0.8; }
    .descripcion {
      margin: 6px 0 0;
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface);
      white-space: pre-wrap;
    }
  `,
})
export class ObservacionesDialogComponent {
  readonly data = inject<ObservacionesData>(MAT_DIALOG_DATA);
}
