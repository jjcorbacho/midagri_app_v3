import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { CampoPersonalizado, CampoTipo } from '../../../core/models/campo.model';
import { OpcionesEditorComponent } from './opciones-editor.component';

/**
 * Tipos de campo con el tono de chip que los identifica en la estructura del
 * formulario. Los tonos `c-*` son los estados de negocio declarados en
 * `theme.scss`: aquí solo se reutilizan como paleta de categorías.
 */
export const TIPOS_CAMPO: { value: CampoTipo; label: string; chip: string }[] = [
  { value: 'text', label: 'Texto corto', chip: 'c-validado' },
  { value: 'number', label: 'Número', chip: 'c-marca' },
  { value: 'select', label: 'Lista desplegable', chip: 'c-aprobado' },
  { value: 'date', label: 'Fecha', chip: 'c-enviado' },
  { value: 'radio', label: 'Opción única', chip: 'c-observado' },
  { value: 'checkbox', label: 'Casillas', chip: 'c-registrado' },
  { value: 'textarea', label: 'Texto largo', chip: 'c-subsanado' },
];

/** Tipos que necesitan una lista de valores. */
const TIPOS_CON_OPCIONES: CampoTipo[] = ['select', 'radio', 'checkbox'];

/** Datos de apertura: el campo a editar, o `null` para uno nuevo. */
export interface CampoDialogData {
  initial: CampoPersonalizado | null;
}

/** Resultado: el campo sin los datos que fija el contenedor (área y formulario). */
export type CampoDialogResult = Omit<CampoPersonalizado, 'id' | 'area' | 'formulario'>;

/** Alta y edición de un campo personalizado del formulario en configuración. */
@Component({
  selector: 'app-campo-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'es-PE' }],
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    OpcionesEditorComponent,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.initial ? 'Editar campo personalizado' : 'Nuevo campo personalizado' }}
    </h2>

    <mat-dialog-content>
      <div class="formulario" [formGroup]="form">
        <mat-form-field class="campo">
          <mat-label>Nombre del campo</mat-label>
          <input matInput required cdkFocusInitial formControlName="nombre" placeholder="p. ej. Tipo de cultivo" />
          <mat-error>Ingrese el nombre del campo.</mat-error>
        </mat-form-field>

        <mat-form-field class="campo">
          <mat-label>Tipo de dato</mat-label>
          <mat-select required formControlName="tipo">
            @for (t of tipos; track t.value) {
              <mat-option [value]="t.value">{{ t.label }}</mat-option>
            }
          </mat-select>
          @if (tieneData) {
            <mat-hint>Bloqueado: el campo ya tiene información registrada.</mat-hint>
          }
        </mat-form-field>

        @if (necesitaOpciones()) {
          <section class="bloque">
            <h3>Opciones de la lista</h3>
            <app-opciones-editor [(opciones)]="opciones" />
            @if (opciones().length === 0) {
              <p class="aviso">Agregue al menos una opción para poder guardar.</p>
            }
          </section>
        }

        @if (tipoActual() === 'date') {
          <section class="bloque">
            <h3>Vista previa del calendario</h3>
            <mat-form-field subscriptSizing="dynamic" class="campo-fecha">
              <mat-label>Fecha</mat-label>
              <input matInput disabled [matDatepicker]="dp" [value]="hoy" />
              <mat-datepicker-toggle matIconSuffix disabled [for]="dp" />
              <mat-datepicker #dp />
            </mat-form-field>
            <p class="nota">Por defecto se resalta la fecha actual.</p>
          </section>
        }

        <div class="banderas">
          <mat-checkbox formControlName="requerido">¿Es obligatorio?</mat-checkbox>
          <mat-checkbox formControlName="activo">Activo</mat-checkbox>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close>Cancelar</button>
      <button matButton="filled" type="button" [disabled]="!puedeGuardar()" (click)="guardar()">
        Guardar
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .formulario { display: flex; flex-direction: column; gap: 4px; min-width: min(480px, 70vw); }
    .campo { width: 100%; }
    .bloque {
      margin: 4px 0 16px;
      padding: 16px;
      border-radius: var(--mat-sys-corner-medium);
      background: var(--mat-sys-surface-container-low);
    }
    .bloque h3 {
      margin: 0 0 12px;
      font: var(--mat-sys-title-small);
      color: var(--mat-sys-on-surface);
    }
    .campo-fecha { width: 200px; }
    .aviso {
      margin: 12px 0 0;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-error);
    }
    .nota {
      margin: 8px 0 0;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }
    .banderas { display: flex; flex-wrap: wrap; gap: 24px; padding: 4px 0 8px; }
  `,
})
export class CampoDialogComponent {
  readonly data = inject<CampoDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject<MatDialogRef<CampoDialogComponent, CampoDialogResult>>(MatDialogRef);
  private readonly fb = inject(FormBuilder);

  readonly tipos = TIPOS_CAMPO;
  readonly hoy = new Date();
  readonly tieneData = !!this.data.initial?.tieneData;

  readonly opciones = signal<string[]>(this.data.initial?.opciones ?? ['Opción A', 'Opción B']);

  readonly form = this.fb.nonNullable.group({
    nombre: [this.data.initial?.nombre ?? '', Validators.required],
    tipo: this.data.initial?.tipo ?? ('text' as CampoTipo),
    requerido: this.data.initial?.requerido ?? false,
    activo: this.data.initial?.activo ?? false,
  });

  /** Los cambios del formulario no son señales: este contador los propaga. */
  private readonly cambios = signal(0);

  readonly tipoActual = computed(() => {
    this.cambios();
    return this.form.controls.tipo.value;
  });
  readonly necesitaOpciones = computed(() => TIPOS_CON_OPCIONES.includes(this.tipoActual()));
  readonly puedeGuardar = computed(() => {
    this.cambios();
    return (
      Boolean(this.form.controls.nombre.value.trim()) &&
      (!this.necesitaOpciones() || this.opciones().length > 0)
    );
  });

  constructor() {
    // El tipo de un campo con datos registrados no se puede cambiar: no basta
    // con atenuarlo, hay que deshabilitar el control.
    if (this.tieneData) this.form.controls.tipo.disable();
    this.form.valueChanges.subscribe(() => this.cambios.update((c) => c + 1));
  }

  guardar(): void {
    const v = this.form.getRawValue();
    if (!v.nombre.trim()) {
      this.form.controls.nombre.markAsTouched();
      return;
    }
    this.ref.close({
      nombre: v.nombre.trim(),
      tipo: v.tipo,
      requerido: v.requerido,
      activo: v.activo,
      opciones: this.necesitaOpciones()
        ? this.opciones().map((o) => o.trim()).filter(Boolean)
        : undefined,
      tieneData: this.data.initial?.tieneData,
      visiblePorArea: this.data.initial?.visiblePorArea,
    });
  }
}
