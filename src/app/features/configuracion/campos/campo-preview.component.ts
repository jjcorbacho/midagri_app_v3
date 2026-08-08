import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { CampoTipo } from '../../../core/models/campo.model';

/**
 * Un campo de la vista previa del formulario. Solo muestra cómo se verá el
 * control: todos van deshabilitados porque aquí no se captura información.
 */
@Component({
  selector: 'app-campo-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCheckboxModule, MatFormFieldModule, MatInputModule, MatRadioModule, MatSelectModule],
  template: `
    @switch (tipo()) {
      @case ('textarea') {
        <mat-form-field subscriptSizing="dynamic" class="campo">
          <mat-label>{{ nombre() }}</mat-label>
          <textarea matInput disabled rows="2"></textarea>
        </mat-form-field>
      }
      @case ('select') {
        <mat-form-field subscriptSizing="dynamic" class="campo">
          <mat-label>{{ nombre() }}</mat-label>
          <mat-select disabled placeholder="— seleccionar —">
            @for (o of opts(); track o) {
              <mat-option [value]="o">{{ o }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      }
      @case ('radio') {
        <div class="grupo">
          <span class="etiqueta">{{ nombre() }}</span>
          <mat-radio-group>
            @for (o of opts(); track o) {
              <mat-radio-button disabled [value]="o">{{ o }}</mat-radio-button>
            }
          </mat-radio-group>
        </div>
      }
      @case ('checkbox') {
        <div class="grupo">
          <span class="etiqueta">{{ nombre() }}</span>
          <div class="casillas">
            @for (o of opts(); track o) {
              <mat-checkbox disabled>{{ o }}</mat-checkbox>
            }
          </div>
        </div>
      }
      @default {
        <mat-form-field subscriptSizing="dynamic" class="campo">
          <mat-label>{{ nombre() }}</mat-label>
          <input matInput disabled [type]="tipo()" />
        </mat-form-field>
      }
    }
  `,
  styles: `
    :host { display: block; }
    .campo { width: 100%; }
    .grupo { display: flex; flex-direction: column; gap: 4px; padding: 4px 0; }
    .etiqueta {
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }
    mat-radio-group,
    .casillas { display: flex; flex-wrap: wrap; gap: 4px 12px; }
  `,
})
export class CampoPreviewComponent {
  readonly nombre = input.required<string>();
  readonly tipo = input.required<CampoTipo>();
  readonly opciones = input<string[] | undefined>(undefined);

  readonly opts = computed(() => {
    const o = this.opciones();
    return o && o.length ? o : ['Opción A', 'Opción B'];
  });
}
