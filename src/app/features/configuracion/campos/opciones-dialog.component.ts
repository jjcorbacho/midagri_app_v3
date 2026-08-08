import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CampoPersonalizado } from '../../../core/models/campo.model';
import { OpcionesEditorComponent } from './opciones-editor.component';

/** Datos de apertura: el campo de lista cuyos valores se editan. */
export interface OpcionesDialogData {
  campo: CampoPersonalizado;
}

/**
 * Edición de los valores de un campo de lista. Es la única parte del campo que
 * el ADMIN_UE puede tocar: el resto de la definición la fija el administrador
 * general.
 */
@Component({
  selector: 'app-opciones-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatDialogModule, OpcionesEditorComponent],
  template: `
    <h2 mat-dialog-title>Editar valores del campo</h2>

    <mat-dialog-content>
      <p class="campo-nombre">{{ data.campo.nombre }}</p>
      <app-opciones-editor [(opciones)]="opciones" />
      @if (opciones().length === 0) {
        <p class="aviso">El campo quedará sin valores para elegir.</p>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close>Cancelar</button>
      <button matButton="filled" type="button" (click)="guardar()">Guardar</button>
    </mat-dialog-actions>
  `,
  styles: `
    .campo-nombre {
      margin: 0 0 16px;
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
    }
    .aviso {
      margin: 12px 0 0;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }
    mat-dialog-content { min-width: min(420px, 70vw); }
  `,
})
export class OpcionesDialogComponent {
  readonly data = inject<OpcionesDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject<MatDialogRef<OpcionesDialogComponent, string[]>>(MatDialogRef);

  readonly opciones = signal<string[]>([...(this.data.campo.opciones ?? [])]);

  guardar(): void {
    this.ref.close(this.opciones().map((o) => o.trim()).filter(Boolean));
  }
}
