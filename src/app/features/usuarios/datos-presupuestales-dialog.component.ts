import { ChangeDetectionStrategy, Component, Signal, computed, inject, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

/**
 * Contexto que necesita el diálogo. Trabaja sobre el **mismo** formulario del
 * usuario en edición y sobre los catálogos ya derivados por el componente
 * padre, de modo que las cascadas (Unidad Responsable → Unidad Funcional,
 * Categoría → Programa) siguen operando sin lógica duplicada.
 */
export interface DatosPresupuestalesData {
  form: FormGroup;
  /** Vista Jefe de Área: 3 campos y "Categoría" en lugar de Programa presupuestal. */
  modoJefeArea: Signal<boolean>;
  unidadesResponsables: Signal<readonly string[]>;
  fuentes: Signal<readonly string[]>;
  categorias: Signal<readonly string[]>;
  programas: Signal<readonly string[]>;
  unidadesFuncionales: Signal<readonly string[]>;
  programaHabilitado: Signal<boolean>;
  onCategoriaChange: () => void;
  onProgramaChange: () => void;
}

/**
 * Datos Presupuestales del Administrador General (→ UE / DZ / Técnico).
 *
 * Sustituye al modal declarativo del formulario: se cierra con `true` cuando
 * los cinco campos obligatorios están completos y con `false` (o `undefined`
 * al pulsar ESC) cuando se cancela, y es el padre quien restaura entonces los
 * valores previos.
 */
@Component({
  selector: 'app-datos-presupuestales-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>Datos Presupuestales</h2>

    <mat-dialog-content>
      <p class="descripcion">
        Complete la información presupuestal requerida para habilitar el registro del usuario.
      </p>

      <div class="campos" [formGroup]="data.form">
        <mat-form-field>
          <mat-label>Unidad Responsable</mat-label>
          <mat-select
            formControlName="unidad"
            required
            cdkFocusInitial
            [errorStateMatcher]="matcherDe('unidad')"
          >
            @for (u of data.unidadesResponsables(); track u) {
              <mat-option [value]="u">{{ u }}</mat-option>
            }
          </mat-select>
          <mat-error>{{ errores()['unidad'] }}</mat-error>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Fuente de Financiamiento</mat-label>
          <mat-select formControlName="fuenteFinanc" required [errorStateMatcher]="matcherDe('fuenteFinanc')">
            @for (f of data.fuentes(); track f) {
              <mat-option [value]="f">{{ f }}</mat-option>
            }
          </mat-select>
          <mat-error>{{ errores()['fuenteFinanc'] }}</mat-error>
        </mat-form-field>

        <!-- Categoría presupuestal: solo fuera de la vista Jefe de Área. -->
        @if (!data.modoJefeArea()) {
          <mat-form-field>
            <mat-label>Categoría presupuestal</mat-label>
            <mat-select
              formControlName="categoriaPresup"
              required
              [errorStateMatcher]="matcherDe('categoriaPresup')"
              (valueChange)="data.onCategoriaChange()"
            >
              @for (c of data.categorias(); track c) {
                <mat-option [value]="c">{{ c }}</mat-option>
              }
            </mat-select>
            <mat-error>{{ errores()['categoriaPresup'] }}</mat-error>
          </mat-form-field>
        }

        <mat-form-field>
          <mat-label>{{ data.modoJefeArea() ? 'Categoría' : 'Programa presupuestal' }}</mat-label>
          <mat-select
            formControlName="programaPresup"
            required
            [errorStateMatcher]="matcherDe('programaPresup')"
            (valueChange)="data.onProgramaChange()"
          >
            @for (p of data.programas(); track p) {
              <mat-option [value]="p">{{ p }}</mat-option>
            }
          </mat-select>
          @if (!data.programaHabilitado()) {
            <mat-hint>Seleccione primero la Categoría presupuestal.</mat-hint>
          }
          <mat-error>{{ errores()['programaPresup'] }}</mat-error>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Unidad Funcional</mat-label>
          <mat-select formControlName="unidadFuncional" required [errorStateMatcher]="matcherDe('unidadFuncional')">
            @for (u of data.unidadesFuncionales(); track u) {
              <mat-option [value]="u">{{ u }}</mat-option>
            }
          </mat-select>
          <mat-error>{{ errores()['unidadFuncional'] }}</mat-error>
        </mat-form-field>
      </div>

      <!-- Resumen accesible de la validación (se anuncia al fallar Aceptar). -->
      <p role="alert" aria-live="assertive" class="sr-only">{{ resumen() }}</p>
      @if (resumen(); as texto) {
        <div class="aviso">
          <mat-icon fontSet="material-symbols-outlined">warning</mat-icon>
          <p>{{ texto }}</p>
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button matButton [mat-dialog-close]="false">Cancelar</button>
      <button matButton="filled" type="button" (click)="aceptar()">Aceptar</button>
    </mat-dialog-actions>
  `,
  styles: `
    .descripcion {
      margin: 0 0 16px;
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
    }
    .campos { display: flex; flex-direction: column; }
    mat-form-field { width: 100%; }

    .aviso {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 8px 12px;
      border-radius: var(--mat-sys-corner-small);
      background: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
    }
    .aviso p { margin: 0; font: var(--mat-sys-body-small); }
    .aviso mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .sr-only {
      position: absolute;
      width: 1px; height: 1px;
      padding: 0; margin: -1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
      border: 0;
    }
  `,
})
export class DatosPresupuestalesDialogComponent {
  readonly data = inject<DatosPresupuestalesData>(MAT_DIALOG_DATA);
  private readonly ref =
    inject<MatDialogRef<DatosPresupuestalesDialogComponent, boolean>>(MatDialogRef);

  /** Mensaje por campo obligatorio vacío, calculado al pulsar Aceptar. */
  readonly errores = signal<Record<string, string>>({});

  readonly resumen = computed(() => {
    const n = Object.keys(this.errores()).length;
    if (!n) return '';
    return n === 1
      ? 'Falta completar 1 campo obligatorio de los datos presupuestales.'
      : `Faltan completar ${n} campos obligatorios de los datos presupuestales.`;
  });

  /**
   * Los campos no llevan validadores propios (el formulario es compartido con
   * el resto del alta), así que el estado de error de cada uno lo decide el
   * mapa `errores`. Los matchers se crean una sola vez por campo.
   */
  private readonly matchers = new Map<string, ErrorStateMatcher>();

  matcherDe(campo: string): ErrorStateMatcher {
    let matcher = this.matchers.get(campo);
    if (!matcher) {
      matcher = { isErrorState: () => !!this.errores()[campo] };
      this.matchers.set(campo, matcher);
    }
    return matcher;
  }

  /** Campos obligatorios, en el mismo orden en que se muestran. */
  private campos(): { control: string; etiqueta: string }[] {
    const jefe = this.data.modoJefeArea();
    const campos = [
      { control: 'unidad', etiqueta: 'Unidad Responsable' },
      { control: 'fuenteFinanc', etiqueta: 'Fuente de Financiamiento' },
    ];
    if (!jefe) campos.push({ control: 'categoriaPresup', etiqueta: 'Categoría presupuestal' });
    campos.push(
      { control: 'programaPresup', etiqueta: jefe ? 'Categoría' : 'Programa presupuestal' },
      { control: 'unidadFuncional', etiqueta: 'Unidad Funcional' },
    );
    return campos;
  }

  /**
   * Aceptar: si falta algún campo se marcan los controles y el diálogo no se
   * cierra; si están completos, los valores ya viven en el formulario del
   * padre y solo se confirma el cierre.
   */
  aceptar(): void {
    const valores = this.data.form.getRawValue() as Record<string, string>;
    const errores: Record<string, string> = {};
    for (const { control, etiqueta } of this.campos()) {
      if (!valores[control]) errores[control] = `${etiqueta} es obligatorio.`;
    }
    this.errores.set(errores);
    if (Object.keys(errores).length > 0) return;
    this.ref.close(true);
  }
}
