import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, User, Lock, ShieldCheck, CircleCheck, CircleX, Info, TriangleAlert, UserCog } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { UsuariosService } from '../../core/services/usuarios.service';
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
      <div class="hidden lg:flex flex-1 bg-sidebar text-white p-12 flex-col justify-between relative overflow-hidden">
        <div
          class="absolute inset-0 opacity-10"
          style="background-image: radial-gradient(circle at 20% 80%, #4FA6B1 0%, transparent 40%), radial-gradient(circle at 80% 20%, #327490 0%, transparent 40%)"
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
        <form [formGroup]="form" (ngSubmit)="procesarIngreso()" class="w-full max-w-sm space-y-6">
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
                  class="w-full bg-card ring-1 ring-border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:ring-brand outline-none"
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
                  class="w-full bg-card ring-1 ring-border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:ring-brand outline-none"
                  placeholder="••••••••"
                />
              </div>
              <a href="#" (click)="$event.preventDefault()" class="text-[11px] text-brand mt-1 inline-block hover:underline">¿Olvidaste tu clave?</a>
            </div>
          </div>

          <button class="w-full bg-brand text-brand-foreground py-2.5 rounded-lg font-medium text-sm hover:bg-brand/90 transition-colors">
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
      <div class="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <div class="bg-card rounded-2xl shadow-2xl p-6 w-[520px] max-w-full text-foreground border border-border">
          <div class="text-center mb-5">
            <div class="w-16 h-16 bg-brand-soft rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
              <lucide-angular [img]="UserCogIcon" class="size-8 text-brand" />
            </div>
            <h3 class="text-lg font-bold">
              {{ modo() === 'seleccion-perfil'
                ? 'Seleccione el Perfil para su ingreso al sistema'
                : 'Seleccione la Unidad Responsable para el Ingreso al Sistema' }}
            </h3>
            <p class="text-[11px] text-muted-foreground mt-2 leading-relaxed px-4 text-justify font-medium">
              Se han detectado múltiples registros o privilegios activos vinculados a su cuenta de acceso
              institucional. Por favor, seleccione la Unidad Responsable (OPA) y el perfil con el que desea
              iniciar la presente sesión de trabajo.
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
                  class="w-full ring-1 ring-border p-3 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand bg-card font-semibold"
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
                  class="w-full ring-1 ring-border p-3 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand bg-card font-semibold"
                >
                  @for (p of perfiles; track p) {
                    <option [value]="p">{{ p }}</option>
                  }
                </select>
              </div>
            }

            <div class="flex gap-2">
              <button
                (click)="modalOpen.set(false)"
                class="w-1/3 py-3 bg-secondary hover:bg-muted text-secondary-foreground font-bold rounded-xl text-xs transition"
              >Cancelar</button>
              <button
                (click)="confirmarIngreso()"
                class="w-2/3 py-3 bg-brand hover:bg-brand/90 text-brand-foreground font-bold rounded-xl text-xs transition"
              >Ingresar al Sistema</button>
            </div>
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
  private readonly router = inject(Router);

  readonly UserIcon = User;
  readonly LockIcon = Lock;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly TriangleAlertIcon = TriangleAlert;
  readonly UserCogIcon = UserCog;

  readonly perfiles = PERFILES;

  readonly error = signal('');
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
    return this.auth.usuarioReconocido(u) ? 'text-emerald-600' : 'text-rose-500';
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
        this.registros()[0] ??
        this.usuariosService.findByUserGen('ccandelaria')[0];
      if (!base) {
        this.error.set('Error de consistencia de privilegios al procesar su solicitud.');
        return;
      }
      // Admin General master: la unidad institucional por defecto (igual que el prototipo)
      this.auth.confirmarIngreso(base, perfil, 'Programa de Desarrollo Productivo Agrario Rural');
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
}
