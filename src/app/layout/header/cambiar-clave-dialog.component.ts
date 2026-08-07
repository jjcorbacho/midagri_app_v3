import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

/**
 * Cambio de clave desde el menú de usuario. Mantiene el mismo alcance que el
 * modal anterior: formulario de presentación con el estándar SBS informado.
 * TODO(backend): POST /auth/cambiar-clave.
 */
@Component({
  selector: 'app-cambiar-clave-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Cambiar clave</h2>
    <mat-dialog-content>
      <p class="descripcion">
        Mínimo 8 caracteres, una mayúscula, un número y un carácter especial (estándar SBS).
      </p>
      @for (etiqueta of campos; track etiqueta) {
        <mat-form-field class="campo">
          <mat-label>{{ etiqueta }}</mat-label>
          <input matInput type="password" required [attr.aria-label]="etiqueta" />
        </mat-form-field>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close>Cancelar</button>
      <button matButton="filled" mat-dialog-close="ok">Aceptar</button>
    </mat-dialog-actions>
  `,
  styles: `
    .descripcion {
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
      margin: 0 0 16px;
    }
    .campo { width: 100%; }
  `,
})
export class CambiarClaveDialogComponent {
  readonly campos = ['Clave actual', 'Clave nueva', 'Confirmar clave nueva'];
}
