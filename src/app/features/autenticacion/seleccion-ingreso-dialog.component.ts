import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Perfil, UsuarioSodega } from '../../core/models/usuario-sodega.model';

export type ModoSeleccionIngreso = 'seleccion-perfil' | 'seleccion-opa';

export interface SeleccionIngresoData {
  modo: ModoSeleccionIngreso;
  registros: UsuarioSodega[];
  perfiles: Perfil[];
}

/** Resultado devuelto al cerrar: perfil elegido o unidad (OPA) elegida. */
export interface SeleccionIngresoResult {
  perfil?: Perfil;
  unidad?: string;
}

/**
 * Acceso selectivo del login: el Administrador General master elige el perfil
 * con el que opera la sesión y las cuentas con varios registros eligen la
 * Unidad Responsable. La lógica de resolución sigue en AuthService; este
 * diálogo solo recoge la elección.
 */
@Component({
  selector: 'app-seleccion-ingreso-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
  ],
  template: `
    <div class="cabecera">
      <div class="avatar" aria-hidden="true">
        <mat-icon fontSet="material-symbols-outlined">manage_accounts</mat-icon>
      </div>
      <h2 mat-dialog-title>
        {{ data.modo === 'seleccion-perfil'
          ? 'Seleccione el Perfil para su ingreso al sistema'
          : 'Seleccione la Unidad Responsable para el Ingreso al Sistema' }}
      </h2>
    </div>

    <mat-dialog-content>
      <p class="descripcion">
        Se ha detectado múltiples registros o privilegios activos a su cuenta de acceso
        institucional. Por favor, seleccione el perfil con el que desea iniciar la presente
        sesión de trabajo.
      </p>

      @if (data.modo === 'seleccion-opa') {
        <mat-form-field class="campo">
          <mat-label>Unidad Responsable / OPA</mat-label>
          <mat-select
            [value]="opaSeleccionada()"
            (valueChange)="opaSeleccionada.set($event)"
            required
            aria-label="Unidad Responsable"
          >
            @for (r of data.registros; track r.id) {
              <mat-option [value]="r.unidad">{{ r.unidad }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field class="campo">
          <mat-label>Perfil Autorizado</mat-label>
          <input matInput readonly [value]="perfilPorOpa()" aria-label="Perfil autorizado" />
        </mat-form-field>
      } @else {
        <mat-form-field class="campo">
          <mat-label>Perfil Autorizado</mat-label>
          <mat-select
            [value]="perfilSeleccionado()"
            (valueChange)="perfilSeleccionado.set($event)"
            required
            aria-label="Perfil autorizado"
          >
            @for (p of data.perfiles; track p) {
              <mat-option [value]="p">{{ p }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close>Cancelar</button>
      <button matButton="filled" (click)="confirmar()">Ingresar al Sistema</button>
    </mat-dialog-actions>
  `,
  styles: `
    .cabecera { text-align: center; padding-top: 8px; }
    .avatar {
      width: 64px; height: 64px; margin: 0 auto 12px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }
    .avatar mat-icon { font-size: 32px; width: 32px; height: 32px; }
    h2 { text-align: center; }
    .descripcion {
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
      text-align: center;
      margin: 0 0 20px;
    }
    .campo { width: 100%; }
  `,
})
export class SeleccionIngresoDialogComponent {
  readonly data = inject<SeleccionIngresoData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<SeleccionIngresoDialogComponent, SeleccionIngresoResult>);

  readonly opaSeleccionada = signal(this.data.registros[0]?.unidad ?? '');
  readonly perfilSeleccionado = signal<Perfil>('Administrador General');

  /** Perfil asociado a la unidad elegida (solo lectura, informativo). */
  readonly perfilPorOpa = computed(
    () => this.data.registros.find((r) => r.unidad === this.opaSeleccionada())?.perfil ?? '',
  );

  confirmar(): void {
    this.ref.close(
      this.data.modo === 'seleccion-perfil'
        ? { perfil: this.perfilSeleccionado() }
        : { unidad: this.opaSeleccionada() },
    );
  }
}
