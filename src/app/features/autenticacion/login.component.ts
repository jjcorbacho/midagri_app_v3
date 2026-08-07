import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/services/auth.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { ListasAdminService } from '../../core/services/listas-admin.service';
import { PERFILES, UsuarioSodega } from '../../core/models/usuario-sodega.model';
import { RecuperarClaveDialogComponent } from './recuperar-clave-dialog.component';
import {
  ModoSeleccionIngreso,
  SeleccionIngresoDialogComponent,
  SeleccionIngresoResult,
} from './seleccion-ingreso-dialog.component';

/**
 * Login unificado SODEGA (base del proyecto — docs/referencia/sodega-login-permisos.html)
 * con el diseño institucional de dos columnas del sistema MIDAGRI:
 *  - Validación en vivo del usuario unificado.
 *  - Diálogo de selección: Admin General elige perfil; múltiples registros eligen Unidad (OPA).
 * TODO(backend): validar credenciales contra POST /auth/login.
 */
@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  template: `
    <div class="acceso">
      <!-- Panel institucional -->
      <aside class="panel-institucional">
        <div class="marca">
          <div class="logo" aria-hidden="true">M</div>
          <div>
            <p class="ministerio">Ministerio de Desarrollo Agrario y Riego</p>
            <p class="pais">MIDAGRI · Perú</p>
          </div>
        </div>

        <div class="lema">
          <h1>Sistema institucional de capacitaciones y asistencias técnicas.</h1>
          <p>
            Registro centralizado para áreas usuarias: SODEGA, DGDG, DGDAA, DGAAA, DGASFS, PSI,
            UEFSA, AGRORURAL, ANA y PEAH.
          </p>
        </div>

        <p class="seguridad">
          <mat-icon fontSet="material-symbols-outlined">verified_user</mat-icon>
          Cumplimiento con los estándares de seguridad de la institución.
        </p>
      </aside>

      <!-- Panel de acceso -->
      <main class="panel-acceso">
        <mat-card appearance="outlined" class="tarjeta">
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="procesarIngreso()">
              <p class="antetitulo">Acceso institucional</p>
              <h2>Iniciar sesión</h2>
              <p class="subtitulo">Usa tu usuario institucional MIDAGRI.</p>

              <div class="ayuda-demo">
                <p><strong>Acceso unificado SODEGA</strong> · cualquier clave</p>
                <p>• <code>ccandelaria</code> — Administrador General (elige su perfil al ingresar)</p>
                <p>• <code>candelab</code> — alias del mismo usuario master</p>
                <p>• Los demás usuarios se crean en <strong>Gestión de Usuarios</strong></p>
              </div>

              @if (error(); as e) {
                <div class="aviso-error" role="alert">
                  <mat-icon fontSet="material-symbols-outlined">warning</mat-icon>
                  <span>{{ e }}</span>
                </div>
              }

              <mat-form-field class="campo">
                <mat-label>Usuario</mat-label>
                <mat-icon matPrefix fontSet="material-symbols-outlined">person</mat-icon>
                <input
                  matInput
                  formControlName="usuario"
                  required
                  placeholder="ccandelaria"
                  autocomplete="username"
                  aria-label="Usuario institucional"
                />
                <mat-hint [class]="validacionClase()">
                  <mat-icon fontSet="material-symbols-outlined" class="icono-hint">{{ validacionIcono() }}</mat-icon>
                  {{ validacionTexto() }}
                </mat-hint>
              </mat-form-field>

              <mat-form-field class="campo">
                <mat-label>Contraseña</mat-label>
                <mat-icon matPrefix fontSet="material-symbols-outlined">lock</mat-icon>
                <input
                  matInput
                  type="password"
                  formControlName="password"
                  required
                  autocomplete="current-password"
                  aria-label="Contraseña"
                />
              </mat-form-field>

              <button matButton type="button" class="enlace-clave" (click)="abrirRecuperarClave()">
                Recuperar Contraseña
              </button>

              <button matButton="filled" type="submit" class="boton-ingresar">
                Ingresar al sistema
              </button>

              <p class="legal">
                Al ingresar aceptas las políticas de protección de datos personales (Ley N° 29733).
              </p>
            </form>
          </mat-card-content>
        </mat-card>
      </main>
    </div>
  `,
  styles: `
    /* Maquetación a dos columnas: Angular Material no ofrece un componente de
       layout para este patrón, por lo que se resuelve con CSS Grid sobre los
       tokens del tema. */
    .acceso {
      min-height: 100dvh;
      display: grid;
      grid-template-columns: 1fr;
      background: var(--mat-sys-background);
    }
    @media (min-width: 1024px) {
      .acceso { grid-template-columns: 1fr 1fr; }
      .panel-institucional { display: flex !important; }
    }

    .panel-institucional {
      display: none;
      flex-direction: column;
      justify-content: space-between;
      gap: 32px;
      padding: 48px;
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
    }
    .marca { display: flex; align-items: center; gap: 12px; }
    .logo {
      width: 40px; height: 40px;
      display: flex; align-items: center; justify-content: center;
      border-radius: var(--mat-sys-corner-small);
      background: var(--mat-sys-on-primary);
      color: var(--mat-sys-primary);
      font: var(--mat-sys-title-medium);
      font-weight: 700;
    }
    .ministerio {
      margin: 0;
      font: var(--mat-sys-label-small);
      text-transform: uppercase;
      letter-spacing: 0.12em;
      opacity: 0.85;
    }
    .pais { margin: 0; font: var(--mat-sys-title-small); }
    .lema { max-width: 30rem; }
    .lema h1 { font: var(--mat-sys-headline-large); margin: 0 0 16px; }
    .lema p { font: var(--mat-sys-body-medium); margin: 0; opacity: 0.85; }
    .seguridad {
      display: flex; align-items: center; gap: 8px;
      font: var(--mat-sys-label-medium);
      opacity: 0.85;
      margin: 0;
    }
    .seguridad mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .panel-acceso {
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
    }
    .tarjeta { width: 100%; max-width: 26rem; }
    form { display: flex; flex-direction: column; }
    .antetitulo {
      margin: 0 0 4px;
      font: var(--mat-sys-label-small);
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--mat-sys-primary);
      font-weight: 600;
    }
    h2 { font: var(--mat-sys-headline-small); margin: 0; }
    .subtitulo {
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
      margin: 4px 0 16px;
    }
    .ayuda-demo {
      padding: 12px;
      border-radius: var(--mat-sys-corner-small);
      background: var(--mat-sys-surface-container);
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
      margin-bottom: 20px;
    }
    .ayuda-demo p { margin: 0 0 2px; }
    .ayuda-demo code { font-family: 'IBM Plex Mono', monospace; }
    .aviso-error {
      display: flex; align-items: center; gap: 8px;
      padding: 12px;
      border-radius: var(--mat-sys-corner-small);
      background: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
      font: var(--mat-sys-body-small);
      margin-bottom: 16px;
    }
    .campo { width: 100%; }
    mat-hint { display: flex; align-items: center; gap: 4px; }
    .icono-hint { font-size: 14px; width: 14px; height: 14px; }
    .hint-ok { color: var(--mat-sys-primary); }
    .hint-error { color: var(--mat-sys-error); }
    .hint-neutro { color: var(--mat-sys-on-surface-variant); }
    .enlace-clave { align-self: flex-start; margin-bottom: 8px; }
    .boton-ingresar { height: 48px; margin-top: 8px; }
    .legal {
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
      text-align: center;
      margin: 16px 0 0;
    }
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly listasAdmin = inject(ListasAdminService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  /** Perfiles oficiales + personalizados de la lista "Perfil Autorizado". */
  readonly perfiles = computed(() => this.listasAdmin.perfilesAutorizados(PERFILES));

  readonly error = signal('');
  private readonly formTick = signal(0);

  readonly form = this.fb.nonNullable.group({
    usuario: ['ccandelaria', Validators.required],
    password: ['********', Validators.required],
  });

  constructor() {
    this.form.valueChanges.subscribe(() => this.formTick.update((t) => t + 1));
  }

  /* ===== Validación en vivo del usuario unificado ===== */
  private readonly usuarioActual = computed(() => {
    this.formTick();
    return this.form.controls.usuario.value.trim();
  });

  readonly validacionTexto = computed(() => {
    const u = this.usuarioActual();
    if (!u) return 'Ingrese su credencial unificada';
    return this.auth.usuarioReconocido(u)
      ? 'Usuario unificado reconocido'
      : 'Usuario no registrado en SODEGA';
  });

  readonly validacionClase = computed(() => {
    const u = this.usuarioActual();
    if (!u) return 'hint-neutro';
    return this.auth.usuarioReconocido(u) ? 'hint-ok' : 'hint-error';
  });

  /** Ligadura de Material Symbols equivalente al icono anterior. */
  readonly validacionIcono = computed(() => {
    const u = this.usuarioActual();
    if (!u) return 'info';
    return this.auth.usuarioReconocido(u) ? 'check_circle' : 'cancel';
  });

  /* ===== Flujo de ingreso ===== */
  procesarIngreso(): void {
    this.error.set('');
    const usuario = this.usuarioActual();
    if (!usuario) {
      this.error.set('Por favor ingrese un usuario unificado.');
      return;
    }

    const resolucion = this.auth.resolverIngreso(usuario);
    switch (resolucion.status) {
      case 'no-registrado':
        this.error.set('El usuario ingresado no está registrado en la base de datos.');
        return;
      case 'inhabilitado':
        this.error.set('Su cuenta se encuentra actualmente INHABILITADA en el sistema.');
        return;
      case 'seleccion-perfil':
        this.abrirSeleccion('seleccion-perfil', resolucion.registros);
        return;
      case 'seleccion-opa':
        this.abrirSeleccion('seleccion-opa', resolucion.registros);
        return;
      case 'directo':
        this.auth.confirmarIngreso(resolucion.registro);
        this.router.navigate(['/dashboard']);
        return;
    }
  }

  private abrirSeleccion(modo: ModoSeleccionIngreso, registros: UsuarioSodega[]): void {
    this.dialog
      .open(SeleccionIngresoDialogComponent, {
        data: { modo, registros, perfiles: this.perfiles() },
        width: '520px',
        maxWidth: '95vw',
        autoFocus: 'first-tabbable',
        restoreFocus: true,
      })
      .afterClosed()
      .subscribe((r: SeleccionIngresoResult | undefined) => {
        if (r) this.confirmarIngreso(r, registros);
      });
  }

  private confirmarIngreso(seleccion: SeleccionIngresoResult, registros: UsuarioSodega[]): void {
    if (seleccion.perfil) {
      const perfil = seleccion.perfil;
      const base =
        registros.find((r) => r.perfil === perfil) ??
        // Perfil personalizado: hereda el registro habilitado de un usuario de ese perfil
        this.usuariosService.usuarios().find((u) => u.estado === 'HABILITADO' && u.perfil === perfil) ??
        registros[0] ??
        this.usuariosService.findByUserGen('ccandelaria')[0];
      if (!base) {
        this.error.set('Error de consistencia de privilegios al procesar su solicitud.');
        return;
      }
      // Admin General master: conserva sus privilegios de autenticación
      // aunque opere la sesión con otro perfil (perfilAutenticado).
      this.auth.confirmarIngreso(
        base,
        perfil,
        'Programa de Desarrollo Productivo Agrario Rural',
        'Administrador General',
      );
    } else {
      const registro = registros.find((r) => r.unidad === seleccion.unidad);
      if (!registro) {
        this.error.set('Error de consistencia de privilegios al procesar su solicitud.');
        return;
      }
      this.auth.confirmarIngreso(registro);
    }
    this.router.navigate(['/dashboard']);
  }

  /* ===== Recuperar Contraseña (POST /auth/recuperar-clave simulado) ===== */
  abrirRecuperarClave(): void {
    this.dialog.open(RecuperarClaveDialogComponent, {
      width: '460px',
      maxWidth: '95vw',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
  }
}
