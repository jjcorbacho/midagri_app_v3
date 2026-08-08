import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';

/**
 * Declaración jurada pendiente al pasar del Paso 2 al Paso 3. Se cierra con
 * `true` solo si se acepta la declaración dentro del propio diálogo.
 */
@Component({
  selector: 'app-declaracion-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatCheckboxModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Declaración jurada pendiente</h2>

    <mat-dialog-content>
      <div class="icono" aria-hidden="true">
        <mat-icon fontSet="material-symbols-outlined">warning</mat-icon>
      </div>
      <p class="mensaje">
        Para continuar al siguiente paso debe aceptar la declaración jurada del registro.
      </p>
      <div class="declaracion">
        <mat-checkbox [checked]="aceptada()" (change)="aceptada.set($event.checked)">
          Declaro bajo juramento que la información proporcionada es correcta.
        </mat-checkbox>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="center">
      <button matButton [mat-dialog-close]="false">Cancelar</button>
      <button matButton="filled" [disabled]="!aceptada()" [mat-dialog-close]="true">Continuar</button>
    </mat-dialog-actions>
  `,
  styles: `
    .icono {
      width: 80px; height: 80px;
      margin: 8px auto 24px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
    }
    .icono mat-icon { font-size: 40px; width: 40px; height: 40px; }
    .mensaje {
      margin: 0 0 16px;
      text-align: center;
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface);
    }
    .declaracion {
      padding: 16px;
      border-radius: var(--mat-sys-corner-medium);
      background: var(--mat-sys-surface-container-low);
    }
  `,
})
export class DeclaracionDialogComponent {
  readonly aceptada = signal(false);
}
