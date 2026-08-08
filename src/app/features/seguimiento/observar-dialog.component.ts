import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormControl, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { dateAIso, isoADate, isoToDDMMYYYY, todayDDMMYYYY, todayISO } from '../../shared/utils/fecha.util';

/** Una descripción de solo espacios no vale como motivo. */
function textoRequerido(control: AbstractControl): ValidationErrors | null {
  return control.value?.trim() ? null : { required: true };
}

/** Datos de apertura: cuántos registros se van a observar. */
export interface ObservarData {
  cantidad: number;
}

/** Resultado: motivo y fecha (ISO) de la observación. */
export interface ObservarResultado {
  texto: string;
  fecha: string;
}

/**
 * Motivo de la observación para los registros seleccionados. Se cierra con el
 * texto y la fecha solo cuando hay descripción; el panel es quien aplica el
 * cambio de estado a la selección.
 */
@Component({
  selector: 'app-observar-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'es-PE' }],
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>Observar {{ data.cantidad }} registro(s)</h2>

    <mat-dialog-content>
      <div class="icono" aria-hidden="true">
        <mat-icon fontSet="material-symbols-outlined">warning</mat-icon>
      </div>
      <p class="mensaje">
        Indique el motivo de la observación. Los registros seleccionados regresarán al
        responsable para su subsanación.
      </p>

      <mat-form-field class="campo">
        <mat-label>Descripción de la observación</mat-label>
        <textarea
          matInput
          rows="5"
          required
          cdkFocusInitial
          [formControl]="texto"
          placeholder="Detalle qué debe corregir el área responsable…"
        ></textarea>
        <mat-error>Ingrese una descripción para la observación.</mat-error>
      </mat-form-field>

      <div class="fila-fecha">
        <mat-form-field class="campo-fecha">
          <mat-label>Fecha de registro</mat-label>
          <input matInput [matDatepicker]="dp" [value]="fechaDate()" (dateChange)="setFecha($event.value)" />
          <mat-datepicker-toggle matIconSuffix [for]="dp" />
          <mat-datepicker #dp />
        </mat-form-field>
        <span class="previsualizacion">→ {{ fechaTexto() }}</span>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="center">
      <button matButton [mat-dialog-close]="undefined">Cancelar</button>
      <button matButton="filled" type="button" (click)="aceptar()">Continuar</button>
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
    .campo { width: 100%; }
    .fila-fecha { display: flex; align-items: center; gap: 12px; }
    .campo-fecha { flex: 0 0 200px; }
    .previsualizacion {
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class ObservarDialogComponent {
  readonly data = inject<ObservarData>(MAT_DIALOG_DATA);
  private readonly ref = inject<MatDialogRef<ObservarDialogComponent, ObservarResultado>>(MatDialogRef);

  /** Control propio para que Material muestre el error del campo obligatorio. */
  readonly texto = new FormControl('', { nonNullable: true, validators: [textoRequerido] });
  readonly fecha = signal(todayISO());

  readonly fechaDate = computed(() => isoADate(this.fecha()));
  readonly fechaTexto = computed(() => isoToDDMMYYYY(this.fecha()) || todayDDMMYYYY());

  setFecha(f: Date | null): void {
    this.fecha.set(dateAIso(f) || todayISO());
  }

  aceptar(): void {
    const texto = this.texto.value.trim();
    if (!texto) {
      this.texto.markAsTouched();
      return;
    }
    this.ref.close({ texto, fecha: this.fecha() });
  }
}
