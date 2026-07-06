import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Lock, User, ShieldCheck } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';

/** Clave de demostración del prototipo. TODO(backend): validar credenciales en el API. */
const DEFAULT_PASSWORD = 'Midagri2026*';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen flex bg-background">
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

      <div class="flex-1 flex items-center justify-center p-6">
        <form [formGroup]="form" (ngSubmit)="submit()" class="w-full max-w-sm space-y-6">
          <div>
            <div class="text-[10px] uppercase tracking-widest text-brand font-semibold mb-2">Acceso institucional</div>
            <h2 class="text-2xl font-semibold">Iniciar sesión</h2>
            <p class="text-sm text-muted-foreground mt-1">Usa tu usuario institucional MIDAGRI.</p>
            <div class="mt-3 rounded-md bg-brand/10 ring-1 ring-brand/20 px-3 py-2 text-[11px] text-brand space-y-0.5">
              <div><strong>Credenciales de prueba</strong> · clave <code>Midagri2026*</code></div>
              <div>• <code>mtorres</code> — Administrador (acceso total)</div>
              <div>• <code>admindz</code> — Admin DZ (solo Seguimiento y revisión)</div>
              <div>• <code>adminue</code> — Admin UE (Aprobación + Config. Campos lectura)</div>
              <div>• <code>tecnico1</code> — Técnico N1 (flujo de registro en 3 pasos)</div>
            </div>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-[11px] font-medium text-muted-foreground mb-1">Usuario</label>
              <div class="relative">
                <lucide-angular [img]="UserIcon" class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  formControlName="username"
                  required
                  class="w-full bg-card ring-1 ring-border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:ring-brand outline-none"
                  placeholder="mtorres"
                />
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

          @if (error()) {
            <div class="rounded-md bg-destructive/10 ring-1 ring-destructive/30 px-3 py-2 text-xs text-destructive">
              {{ error() }}
            </div>
          }

          <button class="w-full bg-brand text-brand-foreground py-2.5 rounded-lg font-medium text-sm hover:bg-brand/90 transition-colors">
            Ingresar al sistema
          </button>

          <p class="text-[11px] text-muted-foreground text-center">
            Al ingresar aceptas las políticas de protección de datos personales (Ley N° 29733).
          </p>
        </form>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly UserIcon = User;
  readonly LockIcon = Lock;
  readonly ShieldCheckIcon = ShieldCheck;

  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    username: ['mtorres', Validators.required],
    password: [DEFAULT_PASSWORD, Validators.required],
  });

  submit(): void {
    this.error.set('');
    const { username, password } = this.form.getRawValue();
    const u = username.trim();
    if (!u) {
      this.error.set('Ingrese su usuario.');
      return;
    }
    // TODO(backend): delegar la validación de credenciales al API de autenticación.
    if (password !== DEFAULT_PASSWORD) {
      this.error.set('Credenciales inválidas. Use la clave de prueba: Midagri2026*');
      return;
    }
    this.auth.login(u).subscribe(() => this.router.navigate(['/dashboard']));
  }
}
