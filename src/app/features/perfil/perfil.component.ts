import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideAngularModule, Mail, Briefcase, Building2, ShieldCheck } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { AreaService } from '../../core/services/area.service';

@Component({
  selector: 'app-perfil',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    @if (auth.user(); as user) {
      <section class="p-6 lg:p-8 max-w-3xl mx-auto animate-page-in">
        <h1 class="text-h1 mb-1">Mi Perfil</h1>
        <p class="text-sm text-muted-foreground mb-6">Información de la cuenta institucional.</p>

        <div class="bg-card rounded-xl ring-1 ring-border shadow-xs overflow-hidden">
          <div class="px-6 py-8 bg-gradient-to-br from-brand/10 to-transparent flex items-center gap-5">
            <div class="size-20 rounded-full bg-brand text-brand-foreground flex items-center justify-center text-2xl font-semibold">
              {{ user.nombre[0] }}{{ user.apellido[0] }}
            </div>
            <div>
              <h2 class="text-xl font-semibold">{{ user.nombre }} {{ user.apellido }}</h2>
              <p class="text-sm text-muted-foreground">&#64;{{ user.username }}</p>
            </div>
          </div>
          <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="flex items-start gap-3 p-3 rounded-lg bg-secondary/40">
              <lucide-angular [img]="MailIcon" class="size-4 text-brand mt-0.5" />
              <div>
                <div class="label-ds">Correo institucional</div>
                <div class="text-sm font-medium">{{ user.email }}</div>
              </div>
            </div>
            <div class="flex items-start gap-3 p-3 rounded-lg bg-secondary/40">
              <lucide-angular [img]="BriefcaseIcon" class="size-4 text-brand mt-0.5" />
              <div>
                <div class="label-ds">Rol</div>
                <div class="text-sm font-medium">{{ user.rol }}</div>
              </div>
            </div>
            <div class="flex items-start gap-3 p-3 rounded-lg bg-secondary/40">
              <lucide-angular [img]="Building2Icon" class="size-4 text-brand mt-0.5" />
              <div>
                <div class="label-ds">Área activa</div>
                <div class="text-sm font-medium">{{ areaService.currentArea() }}</div>
              </div>
            </div>
            <div class="flex items-start gap-3 p-3 rounded-lg bg-secondary/40">
              <lucide-angular [img]="ShieldCheckIcon" class="size-4 text-brand mt-0.5" />
              <div>
                <div class="label-ds">Estado</div>
                <div class="text-sm font-medium">Activo</div>
              </div>
            </div>
          </div>
        </div>

        <p class="text-[10px] text-muted-foreground mt-6 uppercase tracking-widest">
          Datos protegidos bajo Ley N° 29733 (LPDP)
        </p>
      </section>
    }
  `,
})
export class PerfilComponent {
  readonly auth = inject(AuthService);
  readonly areaService = inject(AreaService);

  readonly MailIcon = Mail;
  readonly BriefcaseIcon = Briefcase;
  readonly Building2Icon = Building2;
  readonly ShieldCheckIcon = ShieldCheck;
}
