import { ChangeDetectionStrategy, Component, model, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

/**
 * Editor de la lista de valores de un campo de opción (select, radio, checkbox).
 * Lo comparten el diálogo de creación/edición del campo y el de edición de
 * valores del ADMIN_UE, que solo se diferencian en lo que hay alrededor.
 */
@Component({
  selector: 'app-opciones-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  template: `
    <div class="lista">
      @for (o of opciones(); track $index; let i = $index) {
        <div class="fila">
          <mat-form-field subscriptSizing="dynamic" class="campo">
            <mat-label>Opción {{ i + 1 }}</mat-label>
            <input matInput [value]="o" (input)="editar(i, $any($event.target).value)" />
          </mat-form-field>
          <button
            matIconButton
            type="button"
            class="accion a-error"
            (click)="quitar(i)"
            [attr.aria-label]="'Quitar opción ' + (i + 1)"
          >
            <mat-icon fontSet="material-symbols-outlined">delete</mat-icon>
          </button>
        </div>
      }

      <div class="fila">
        <mat-form-field subscriptSizing="dynamic" class="campo">
          <mat-label>Nueva opción</mat-label>
          <input
            matInput
            [value]="nueva()"
            (input)="nueva.set($any($event.target).value)"
            (keydown.enter)="$event.preventDefault(); agregar()"
          />
        </mat-form-field>
        <button matButton="tonal" type="button" [disabled]="!nueva().trim()" (click)="agregar()">
          Agregar
        </button>
      </div>
    </div>
  `,
  styles: `
    .lista { display: flex; flex-direction: column; gap: 12px; }
    .fila { display: flex; align-items: center; gap: 8px; }
    .campo { flex: 1 1 auto; }
  `,
})
export class OpcionesEditorComponent {
  /** Valores del campo; el contenedor los recibe ya editados. */
  readonly opciones = model.required<string[]>();

  readonly nueva = signal('');

  editar(i: number, valor: string): void {
    this.opciones.update((prev) => prev.map((o, idx) => (idx === i ? valor : o)));
  }

  quitar(i: number): void {
    this.opciones.update((prev) => prev.filter((_, idx) => idx !== i));
  }

  agregar(): void {
    const valor = this.nueva().trim();
    if (!valor) return;
    this.opciones.update((prev) => [...prev, valor]);
    this.nueva.set('');
  }
}
