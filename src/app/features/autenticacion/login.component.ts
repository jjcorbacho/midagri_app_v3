import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, User, Lock, ShieldCheck, CircleCheck, CircleX, Info, TriangleAlert, UserCog, KeyRound, Send, X } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { ListasAdminService } from '../../core/services/listas-admin.service';
import { Perfil, PERFILES, UsuarioSodega } from '../../core/models/usuario-sodega.model';

/**
 * Login unificado SODEGA (base del proyecto — docs/referencia/sodega-login-permisos.html)
 * con el diseño institucional de dos columnas del sistema MIDAGRI:
 *  - Validación en vivo del usuario unificado.
 *  - Modal de selección: Admin General elige perfil; múltiples registros eligen Unidad (OPA).
 * TODO(backend): validar credenciales contra POST /auth/login.
 */
@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen flex bg-background">
      <!-- Panel institucional -->
      <div class="hidden lg:flex flex-1 bg-sidebar text-sidebar-foreground p-12 flex-col justify-between relative overflow-hidden">
        <div
          class="absolute inset-0 opacity-10"
          style="background-image: radial-gradient(circle at 20% 80%, var(--brand-secondary) 0%, transparent 40%), radial-gradient(circle at 80% 20%, var(--brand) 0%, transparent 40%)"
        ></div>
        <div class="relative">
          <div class="flex items-center gap-3">
            <div class="size-10 bg-brand rounded-md flex items-center justify-center font-bold">M</div>
            <div>
              <div class="text-[10px] uppercase tracking-widest text-sidebar-muted">Ministerio de Desarrollo Agrario y Riego</div>
              <div class="font-semibold">MIDAGRI · Perú</div>
            </div>
          </div>
        </div>
        <div class="relative max-w-md">
          <h1 class="text-3xl font-semibold leading-tight">Sistema institucional de capacitaciones y asistencias técnicas.</h1>
          <p class="mt-4 text-sm text-sidebar-muted">
            Registro centralizado para áreas usuarias: SODEGA, DGDG, DGDAA, DGAAA, DGASFS, PSI, UEFSA, AGRORURAL, ANA y PEAH.
          </p>
        </div>
        <div class="relative text-[11px] text-sidebar-muted flex items-center gap-2">
          <lucide-angular [img]="ShieldCheckIcon" class="size-3.5" />
          Cumplimiento con los estándares de seguridad de la institución.
        </div>
      </div>

      <!-- Panel de acceso -->
      <div class="flex-1 flex items-center justify-center p-6">
        <form [formGroup]="form" (ngSubmit)="procesarIngreso()" class="w-full max-w-sm space-y-6 animate-page-in">
          <div>
            <div class="text-[10px] uppercase tracking-widest text-brand font-semibold mb-2">Acceso institucional</div>
            <h2 class="text-2xl font-semibold">Iniciar sesión</h2>
            <p class="text-sm text-muted-foreground mt-1">Usa tu usuario institucional MIDAGRI.</p>
            <div class="mt-3 rounded-md bg-brand/10 ring-1 ring-brand/20 px-3 py-2 text-[11px] text-brand space-y-0.5">
              <div><strong>Acceso unificado SODEGA</strong> · cualquier clave</div>
              <div>• <code>ccandelaria</code> — Administrador General (elige su perfil al ingresar)</div>
              <div>• <code>candelab</code> — alias del mismo usuario master</div>
              <div>• Los demás usuarios se crean en <strong>Gestión de Usuarios</strong></div>
            </div>
          </div>

          @if (error()) {
            <div class="rounded-md bg-destructive/10 ring-1 ring-destructive/30 px-3 py-2 text-xs text-destructive flex items-center gap-2">
              <lucide-angular [img]="TriangleAlertIcon" class="size-4 shrink-0" />
              {{ error() }}
            </div>
          }

          <div class="space-y-3">
            <div>
              <label class="block text-[11px] font-medium text-muted-foreground mb-1">Usuario</label>
              <div class="relative">
                <lucide-angular [img]="UserIcon" class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  formControlName="usuario"
                  required
                  class="w-full bg-card ring-1 ring-border rounded-lg pl-9 pr-3 py-2.5 text-sm placeholder:text-muted-foreground/60 hover:ring-muted-foreground/30 focus:ring-2 focus:ring-ring outline-none transition-[box-shadow] duration-150"
                  placeholder="ccandelaria"
                />
              </div>
              <div class="text-[10px] mt-1.5 font-bold flex items-center gap-1.5" [class]="validacionClase()">
                <lucide-angular [img]="validacionIcono()" class="size-3" />
                {{ validacionTexto() }}
              </div>
            </div>
            <div>
              <label class="block text-[11px] font-medium text-muted-foreground mb-1">Contraseña</label>
              <div class="relative">
                <lucide-angular [img]="LockIcon" class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="password"
                  formControlName="password"
                  required
                  class="w-full bg-card ring-1 ring-border rounded-lg pl-9 pr-3 py-2.5 text-sm placeholder:text-muted-foreground/60 hover:ring-muted-foreground/30 focus:ring-2 focus:ring-ring outline-none transition-[box-shadow] duration-150"
                  placeholder="••••••••"
                />
              </div>
              <a href="#" (click)="$event.preventDefault(); abrirRecuperarClave()" class="text-[11px] text-brand mt-1 inline-block hover:underline">Recuperar Contraseña</a>
            </div>
          </div>

          <button class="btn-primary w-full h-11">
            Ingresar al sistema
          </button>

          <p class="text-[11px] text-muted-foreground text-center">
            Al ingresar aceptas las políticas de protección de datos personales (Ley N° 29733).
          </p>
        </form>
      </div>
    </div>

    <!-- Modal Selección de ingreso (Acceso Selectivo) -->
    @if (modalOpen()) {
      <div class="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-foreground/70 backdrop-blur-sm animate-overlay-in">
        <div class="bg-card rounded-2xl shadow-lg ring-1 ring-border p-6 w-[520px] max-w-full text-foreground animate-modal-in">
          <div class="text-center mb-5">
            <div class="w-16 h-16 bg-brand-soft rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
              <lucide-angular [img]="UserCogIcon" class="size-8 text-brand" />
            </div>
            <h3 class="text-lg font-bold">
              {{ modo() === 'seleccion-perfil'
                ? 'Seleccione el Perfil para su ingreso al sistema'
                : 'Seleccione la Unidad Responsable para el Ingreso al Sistema' }}
            </h3>
            <p class="text-[11px] text-muted-foreground mt-2 leading-relaxed px-4 font-medium">
              Se ha detectado múltiples registros o privilegios activos a su cuenta de acceso
              institucional. Por favor, seleccione el perfil con el que desea iniciar la presente
              sesión de trabajo.
            </p>
          </div>
          <div class="space-y-4">
            @if (modo() === 'seleccion-opa') {
              <div>
                <label class="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Unidad Responsable / OPA <span class="text-destructive">*</span>
                </label>
                <select
                  [value]="opaSeleccionada()"
                  (change)="opaSeleccionada.set($any($event.target).value)"
                  class="w-full ring-1 ring-border p-3 rounded-xl text-xs outline-none focus:ring-2 focus:ring-ring bg-card font-semibold transition-[box-shadow] duration-150"
                >
                  @for (r of registros(); track r.id) {
                    <option [value]="r.unidad">{{ r.unidad }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Perfil Autorizado</label>
                <input
                  type="text"
                  readonly
                  [value]="perfilPorOpa()"
                  class="w-full ring-1 ring-border p-3 rounded-xl text-xs outline-none bg-muted font-bold text-muted-foreground cursor-not-allowed"
                />
              </div>
            } @else {
              <div>
                <label class="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Perfil Autorizado <span class="text-destructive">*</span>
                </label>
                <select
                  [value]="perfilSeleccionado()"
                  (change)="perfilSeleccionado.set($any($event.target).value)"
                  class="w-full ring-1 ring-border p-3 rounded-xl text-xs outline-none focus:ring-2 focus:ring-ring bg-card font-semibold transition-[box-shadow] duration-150"
                >
                  @for (p of perfiles(); track p) {
                    <option [value]="p">{{ p }}</option>
                  }
                </select>
              </div>
            }

            <div class="flex gap-2">
              <button
                (click)="modalOpen.set(false)"
                class="btn-secondary w-1/3 h-11"
              >Cancelar</button>
              <button
                (click)="confirmarIngreso()"
                class="btn-primary w-2/3 h-11"
              >Ingresar al Sistema</button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Modal Recuperar Contraseña -->
    @if (recuperarOpen()) {
      <div class="fixed inset-0 z-[96] flex items-center justify-center p-4 bg-foreground/70 backdrop-blur-sm animate-overlay-in">
        <div class="bg-card rounded-2xl shadow-lg ring-1 ring-border w-[460px] max-w-full text-foreground overflow-hidden animate-modal-in">
          <div class="px-6 py-4 bg-primary text-primary-foreground flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="size-10 rounded-xl bg-primary-foreground/15 flex items-center justify-center">
                <lucide-angular [img]="KeyRoundIcon" class="size-5" />
              </div>
              <div>
                <h3 class="text-base font-bold">Recuperar Contraseña</h3>
                <p class="text-[10px] opacity-80 font-semibold mt-0.5">Sistema SODEGA</p>
              </div>
            </div>
            <button (click)="recuperarOpen.set(false)" class="size-8 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors flex items-center justify-center" title="Cerrar" aria-label="Cerrar">
              <lucide-angular [img]="XIcon" class="size-4" />
            </button>
          </div>
          <div class="p-6 space-y-4">
            @if (recuperarEnviado()) {
              <div class="rounded-md bg-success-soft ring-1 ring-success/30 px-3 py-2 text-xs text-success flex items-center gap-2">
                <lucide-angular [img]="CircleCheckIcon" class="size-4 shrink-0" />
                La nueva clave fue enviada al correo electrónico registrado.
              </div>
              <div class="flex justify-end">
                <button (click)="recuperarOpen.set(false)" class="btn-primary px-6">Aceptar</button>
              </div>
            } @else {
              <p class="text-xs text-muted-foreground leading-relaxed">
                Por favor, ingrese el correo electrónico que tiene registrado en el sistema, la nueva clave se enviará a este correo.
              </p>
              <div>
                <label class="block text-[11px] font-medium text-muted-foreground mb-1">
                  Correo electrónico <span class="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  [value]="recuperarCorreo()"
                  (input)="recuperarCorreo.set($any($event.target).value); recuperarError.set('')"
                  (keyup.enter)="enviarNuevaClave()"
                  placeholder="correo@midagri.gob.pe"
                  class="w-full bg-card ring-1 ring-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring outline-none transition-[box-shadow] duration-150"
                />
                @if (recuperarError()) {
                  <p class="text-[11px] text-destructive font-semibold mt-1.5">{{ recuperarError() }}</p>
                }
              </div>
              <div class="flex justify-end gap-2 pt-2 border-t border-border">
                <button (click)="recuperarOpen.set(false)" class="btn-secondary">Cancelar</button>
                <button (click)="enviarNuevaClave()" class="btn-primary px-5">
                  <lucide-angular [img]="SendIcon" class="size-3.5" /> Enviar nueva clave
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly listasAdmin = inject(ListasAdminService);
  private readonly router = inject(Router);

  readonly UserIcon = User;
  readonly LockIcon = Lock;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly TriangleAlertIcon = TriangleAlert;
  readonly UserCogIcon = UserCog;
  readonly KeyRoundIcon = KeyRound;
  readonly SendIcon = Send;
  readonly XIcon = X;
  readonly CircleCheckIcon = CircleCheck;

  /** Perfiles oficiales + personalizados de la lista "Perfil Autorizado". */
  readonly perfiles = computed(() => this.listasAdmin.perfilesAutorizados(PERFILES));

  readonly error = signal('');
  /* Modal Recuperar Contraseña */
  readonly recuperarOpen = signal(false);
  readonly recuperarCorreo = signal('');
  readonly recuperarError = signal('');
  readonly recuperarEnviado = signal(false);
  readonly modalOpen = signal(false);
  readonly modo = signal<'seleccion-perfil' | 'seleccion-opa'>('seleccion-opa');
  readonly registros = signal<UsuarioSodega[]>([]);
  readonly opaSeleccionada = signal('');
  readonly perfilSeleccionado = signal<Perfil>('Administrador General');
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
    if (!u) return 'text-muted-foreground';
    return this.auth.usuarioReconocido(u) ? 'text-success' : 'text-destructive';
  });

  readonly validacionIcono = computed(() => {
    const u = this.usuarioActual();
    if (!u) return Info;
    return this.auth.usuarioReconocido(u) ? CircleCheck : CircleX;
  });

  /** Perfil asociado a la unidad elegida en el modo selección de OPA. */
  readonly perfilPorOpa = computed(() => {
    const reg = this.registros().find((r) => r.unidad === this.opaSeleccionada());
    return reg?.perfil ?? '';
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
        this.registros.set(resolucion.registros);
        this.modo.set('seleccion-perfil');
        this.perfilSeleccionado.set('Administrador General');
        this.modalOpen.set(true);
        return;
      case 'seleccion-opa':
        this.registros.set(resolucion.registros);
        this.modo.set('seleccion-opa');
        this.opaSeleccionada.set(resolucion.registros[0]?.unidad ?? '');
        this.modalOpen.set(true);
        return;
      case 'directo':
        this.auth.confirmarIngreso(resolucion.registro);
        this.router.navigate(['/dashboard']);
        return;
    }
  }

  confirmarIngreso(): void {
    if (this.modo() === 'seleccion-perfil') {
      const perfil = this.perfilSeleccionado();
      const base =
        this.registros().find((r) => r.perfil === perfil) ??
        // Perfil personalizado: hereda el registro habilitado de un usuario de ese perfil
        this.usuariosService.usuarios().find((u) => u.estado === 'HABILITADO' && u.perfil === perfil) ??
        this.registros()[0] ??
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
      const registro = this.registros().find((r) => r.unidad === this.opaSeleccionada());
      if (!registro) {
        this.error.set('Error de consistencia de privilegios al procesar su solicitud.');
        return;
      }
      this.auth.confirmarIngreso(registro);
    }
    this.modalOpen.set(false);
    this.router.navigate(['/dashboard']);
  }

  /* ===== Recuperar Contraseña (POST /auth/recuperar-clave simulado) ===== */

  abrirRecuperarClave(): void {
    this.recuperarCorreo.set('');
    this.recuperarError.set('');
    this.recuperarEnviado.set(false);
    this.recuperarOpen.set(true);
  }

  enviarNuevaClave(): void {
    const correo = this.recuperarCorreo().trim().toLowerCase();
    const formatoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
    if (!correo || !formatoValido) {
      this.recuperarError.set('Ingrese un correo electrónico válido.');
      return;
    }
    const existe = this.usuariosService
      .usuarios()
      .some((u) => (u.correo || '').trim().toLowerCase() === correo);
    if (!existe) {
      this.recuperarError.set('El correo ingresado no se encuentra registrado en el sistema.');
      return;
    }
    // TODO(backend): POST /auth/recuperar-clave { correo }
    this.recuperarEnviado.set(true);
  }
}
