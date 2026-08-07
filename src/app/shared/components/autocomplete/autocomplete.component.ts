import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { normalizarBusqueda } from '../../utils/texto.util';

/**
 * Buscador con sugerencias sobre `mat-autocomplete`. Conserva la API previa
 * (label, placeholder, ariaLabel, requerido, options, value, deshabilitado y
 * la salida valueChange), de modo que los llamadores no cambian.
 *
 * El filtrado ignora acentos y mayúsculas, igual que antes, reutilizando
 * `normalizarBusqueda`.
 */
@Component({
  selector: 'app-autocomplete',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
  ],
  template: `
    <mat-form-field subscriptSizing="dynamic" class="campo">
      @if (label()) {
        <mat-label>{{ label() }}</mat-label>
      }
      <input
        matInput
        type="text"
        [matAutocomplete]="auto"
        [value]="value()"
        [disabled]="deshabilitado()"
        [required]="requerido()"
        [placeholder]="placeholder()"
        [attr.aria-label]="ariaLabel() || label() || placeholder()"
        (input)="onEscribir($any($event.target).value)"
        (focus)="texto.set(value())"
      />

      @if (value() && !deshabilitado()) {
        <button
          matIconButton
          matSuffix
          type="button"
          (click)="limpiar()"
          aria-label="Limpiar selección"
        >
          <mat-icon fontSet="material-symbols-outlined">close</mat-icon>
        </button>
      } @else {
        <mat-icon matSuffix fontSet="material-symbols-outlined">search</mat-icon>
      }

      <mat-autocomplete #auto="matAutocomplete" (optionSelected)="elegir($event.option.value)">
        @for (o of filtradas(); track o) {
          <mat-option [value]="o">{{ o }}</mat-option>
        }
        @if (filtradas().length === 0) {
          <mat-option [disabled]="true">Sin coincidencias</mat-option>
        }
      </mat-autocomplete>
    </mat-form-field>
  `,
  styles: `
    :host { display: block; }
    .campo { width: 100%; }
  `,
})
export class AutocompleteComponent {
  readonly label = input('');
  readonly placeholder = input('Escriba para buscar...');
  readonly ariaLabel = input('');
  readonly requerido = input(false);
  readonly options = input<string[]>([]);
  readonly value = input('');
  readonly deshabilitado = input(false);
  readonly valueChange = output<string>();

  /** Texto tecleado; vacío muestra todas las opciones. */
  readonly texto = signal('');

  readonly filtradas = computed(() => {
    const q = normalizarBusqueda(this.texto().trim());
    const todas = this.options();
    if (!q) return todas;
    return todas.filter((o) => normalizarBusqueda(o).includes(q));
  });

  onEscribir(v: string): void {
    this.texto.set(v);
    // Se emite en vivo para no romper a quien filtra mientras se escribe.
    this.valueChange.emit(v);
  }

  elegir(v: string): void {
    this.texto.set(v);
    this.valueChange.emit(v);
  }

  limpiar(): void {
    this.texto.set('');
    this.valueChange.emit('');
  }
}
