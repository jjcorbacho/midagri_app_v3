import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ListasAdminService } from '../../../core/services/listas-admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { generarCodigoOpcion } from '../../../core/models/lista-admin.model';
import { UNIDADES_RESPONSABLES } from '../../../core/constants/sodega.const';

/** Datos de apertura: posición de la opción en la lista activa (null = nueva). */
export interface OpcionDialogData {
  indice: number | null;
}

/**
 * Alta y edición de una opción de la lista activa.
 *
 * El guardado se hace desde aquí (y no devolviendo los datos al llamador)
 * porque la validación vive en `ListasAdminService`: si rechaza el registro
 * —duplicado, unidad responsable ausente— el diálogo debe seguir abierto con
 * lo que el usuario escribió. Se cierra con `true` solo cuando se guardó.
 */
@Component({
  selector: 'app-opcion-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ titulo() }}</h2>

    <mat-dialog-content>
      <p class="mensaje">{{ mensaje() }}</p>

      <mat-form-field class="campo">
        <mat-label>Código</mat-label>
        <!-- Correlativo automático: el control va deshabilitado, no solo atenuado. -->
        <input matInput disabled [value]="codigo()" />
        <mat-icon matSuffix fontSet="material-symbols-outlined">lock</mat-icon>
      </mat-form-field>

      @if (esUnidadFuncional()) {
        <mat-form-field class="campo">
          <mat-label>Unidad Responsable</mat-label>
          <mat-select required [value]="unidadResponsable()" (valueChange)="unidadResponsable.set($event)">
            @for (u of unidadesResponsables(); track u) {
              <mat-option [value]="u">{{ u }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      }

      <mat-form-field class="campo">
        <mat-label>{{ etiquetaNombre() }}</mat-label>
        <input
          matInput
          required
          cdkFocusInitial
          [value]="nombre()"
          [disabled]="esUnidadFuncional() && !unidadResponsable()"
          (input)="nombre.set($any($event.target).value)"
          (keyup.enter)="guardar()"
          [placeholder]="esUnidadFuncional() ? 'Ingrese nombre de Unidad Funcional' : 'Ingrese descripción'"
        />
        @if (esUnidadFuncional() && !unidadResponsable()) {
          <mat-hint>Seleccione primero la Unidad Responsable.</mat-hint>
        }
      </mat-form-field>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close>Cancelar</button>
      <button matButton="filled" type="button" (click)="guardar()">Guardar</button>
    </mat-dialog-actions>
  `,
  styles: `
    mat-dialog-content { min-width: min(460px, 70vw); }
    .mensaje {
      margin: 0 0 16px;
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
    }
    .campo { width: 100%; }
  `,
})
export class OpcionDialogComponent {
  private readonly data = inject<OpcionDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject<MatDialogRef<OpcionDialogComponent, boolean>>(MatDialogRef);
  private readonly listasService = inject(ListasAdminService);
  private readonly toast = inject(ToastService);

  private readonly indice = this.data.indice;
  private readonly opcion =
    this.indice !== null ? this.listasService.activa()?.opciones[this.indice] : undefined;

  readonly listaActiva = this.listasService.listaActiva;
  readonly esUnidadFuncional = computed(() =>
    this.listasService.esListaUnidadFuncional(this.listaActiva()),
  );
  readonly unidadesResponsables = computed(() =>
    this.listasService.opcionesFormulario('Unidad Responsable', UNIDADES_RESPONSABLES),
  );

  readonly codigo = signal(
    this.opcion
      ? this.opcion.codigo || generarCodigoOpcion(this.indice ?? 0)
      : this.listasService.siguienteCodigoOpcion(),
  );
  readonly nombre = signal(this.opcion?.nombre ?? '');
  readonly unidadResponsable = signal(this.opcion?.unidadResponsable ?? '');

  readonly titulo = computed(
    () => `${this.indice !== null ? 'Editar Opción' : 'Nueva Opción'}: ${this.listaActiva()}`,
  );
  readonly mensaje = computed(() =>
    this.indice === null
      ? `Registre una nueva opción para la lista "${this.listaActiva()}".`
      : `Actualice los datos de la opción seleccionada de "${this.listaActiva()}".`,
  );
  readonly etiquetaNombre = computed(() =>
    this.esUnidadFuncional() ? 'Nombre Unidad Funcional' : `Nombre ${this.listaActiva()}`,
  );

  guardar(): void {
    const resultado = this.listasService.guardarOpcion(
      this.codigo(),
      this.nombre(),
      this.indice,
      this.esUnidadFuncional() ? this.unidadResponsable() : '',
    );
    if (resultado.ok) {
      this.toast.success(resultado.titulo, resultado.mensaje);
      this.ref.close(true);
    } else {
      this.toast.error(resultado.titulo, resultado.mensaje);
    }
  }
}
