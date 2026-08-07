import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { UsuariosService } from '../../core/services/usuarios.service';

/**
 * Recuperación de clave del login. Conserva las validaciones previas: formato
 * de correo y existencia en el registro de usuarios.
 * TODO(backend): POST /auth/recuperar-clave { correo }
 */
@Component({
  selector: 'app-recuperar-clave-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>Recuperar Contraseña</h2>

    <mat-dialog-content>
      @if (enviado()) {
        <div class="aviso-exito" role="status">
          <mat-icon fontSet="material-symbols-outlined">check_circle</mat-icon>
          <span>La nueva clave fue enviada al correo electrónico registrado.</span>
        </div>
      } @else {
        <p class="descripcion">
          Por favor, ingrese el correo electrónico que tiene registrado en el sistema, la nueva
          clave se enviará a este correo.
        </p>
        <mat-form-field class="campo">
          <mat-label>Correo electrónico</mat-label>
          <mat-icon matPrefix fontSet="material-symbols-outlined">mail</mat-icon>
          <input
            matInput
            type="email"
            [formControl]="correo"
            (keyup.enter)="enviar()"
            placeholder="correo@midagri.gob.pe"
            aria-label="Correo electrónico registrado"
          />
          <mat-error>{{ mensajeError() }}</mat-error>
        </mat-form-field>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      @if (enviado()) {
        <button matButton="filled" mat-dialog-close>Aceptar</button>
      } @else {
        <button matButton mat-dialog-close>Cancelar</button>
        <button matButton="filled" (click)="enviar()">
          <mat-icon fontSet="material-symbols-outlined">send</mat-icon>
          Enviar nueva clave
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: `
    .descripcion {
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
      margin: 0 0 16px;
    }
    .campo { width: 100%; }
    .aviso-exito {
      display: flex; align-items: center; gap: 8px;
      padding: 12px;
      border-radius: var(--mat-sys-corner-small);
      background: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
      font: var(--mat-sys-body-medium);
    }
  `,
})
export class RecuperarClaveDialogComponent {
  private readonly usuariosService = inject(UsuariosService);
  private readonly ref = inject(MatDialogRef<RecuperarClaveDialogComponent>);

  readonly enviado = signal(false);

  /** Mismas reglas que antes: formato válido y correo dado de alta. */
  readonly correo = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)],
  });

  /** Texto del `mat-error` según el error activo del control. */
  mensajeError(): string {
    return this.correo.hasError('noRegistrado')
      ? 'El correo ingresado no se encuentra registrado en el sistema.'
      : 'Ingrese un correo electrónico válido.';
  }

  enviar(): void {
    // `markAsTouched` hace visible el mat-error (estado de error de Material).
    this.correo.markAsTouched();
    if (this.correo.invalid) return;

    const correo = this.correo.value.trim().toLowerCase();
    const existe = this.usuariosService
      .usuarios()
      .some((u) => (u.correo || '').trim().toLowerCase() === correo);
    if (!existe) {
      this.correo.setErrors({ noRegistrado: true });
      return;
    }
    // TODO(backend): POST /auth/recuperar-clave { correo }
    this.enviado.set(true);
  }

  cerrar(): void {
    this.ref.close();
  }
}
