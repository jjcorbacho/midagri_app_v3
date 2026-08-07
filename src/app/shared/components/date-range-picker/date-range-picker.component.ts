import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';

/** Rango emitido por el selector (fechas ISO `YYYY-MM-DD`; '' = sin límite). */
export interface RangoFechas {
  desde: string;
  hasta: string;
}

/** ISO `YYYY-MM-DD` ↔ Date, en hora local para no desplazar el día. */
function isoADate(iso: string): Date | null {
  if (!iso) return null;
  const [a, m, d] = iso.split('-').map(Number);
  return Number.isFinite(a) && Number.isFinite(m) && Number.isFinite(d) ? new Date(a, m - 1, d) : null;
}

function dateAIso(fecha: Date | null): string {
  if (!fecha) return '';
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

/**
 * Selector de rango de fechas sobre `mat-date-range-picker`. Mantiene la misma
 * API que la versión anterior (inputs `desde` / `hasta` en ISO y salida
 * `rangoChange`), por lo que los llamadores no cambian.
 */
@Component({
  selector: 'app-date-range-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()],
  imports: [
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
  ],
  template: `
    <mat-form-field subscriptSizing="dynamic" class="campo">
      <mat-label>Rango de fechas</mat-label>
      <mat-date-range-input [rangePicker]="picker">
        <input
          matStartDate
          placeholder="Desde"
          aria-label="Fecha desde"
          [value]="desdeFecha()"
          (dateChange)="onDesde($event.value)"
        />
        <input
          matEndDate
          placeholder="Hasta"
          aria-label="Fecha hasta"
          [value]="hastaFecha()"
          (dateChange)="onHasta($event.value)"
        />
      </mat-date-range-input>

      @if (desde() || hasta()) {
        <button
          matIconButton
          matSuffix
          type="button"
          (click)="limpiar(); $event.stopPropagation()"
          aria-label="Limpiar rango de fechas"
        >
          <mat-icon fontSet="material-symbols-outlined">close</mat-icon>
        </button>
      }
      <mat-datepicker-toggle matIconSuffix [for]="picker" />
      <mat-date-range-picker #picker />
    </mat-form-field>
  `,
  styles: `
    :host { display: block; }
    .campo { width: 100%; }
  `,
})
export class DateRangePickerComponent {
  readonly desde = input('');
  readonly hasta = input('');
  readonly rangoChange = output<RangoFechas>();

  readonly desdeFecha = computed(() => isoADate(this.desde()));
  readonly hastaFecha = computed(() => isoADate(this.hasta()));

  private emitir(desde: string, hasta: string): void {
    this.rangoChange.emit({ desde, hasta });
  }

  onDesde(fecha: Date | null): void {
    this.emitir(dateAIso(fecha), this.hasta());
  }

  onHasta(fecha: Date | null): void {
    this.emitir(this.desde(), dateAIso(fecha));
  }

  limpiar(): void {
    this.emitir('', '');
  }
}
