import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  GraduationCap,
  ClipboardCheck,
  ShieldCheck,
  FileText,
  Settings,
  UsersRound,
  ChevronRight,
} from 'lucide-angular';
import type { LucideIconData } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { AreaService } from '../../core/services/area.service';

interface DashboardItem {
  to: string;
  label: string;
  description: string;
  icon: LucideIconData;
  accent: string;
}

const BASE_ITEMS: DashboardItem[] = [
  {
    to: '/capacitaciones-n1',
    label: 'Capacitaciones / Asist. Técnica N1',
    description: 'Registro y gestión de eventos, participantes, sustentos y estados.',
    icon: GraduationCap,
    accent: 'bg-brand/10 text-brand',
  },
  {
    to: '/seguimiento/revision',
    label: 'Seguimiento y revisión',
    description: 'Revisar y validar los registros enviados por las áreas.',
    icon: ClipboardCheck,
    accent: 'bg-state-enviado-soft text-state-enviado-foreground',
  },
  {
    to: '/seguimiento/aprobacion',
    label: 'Seguimiento y aprobación',
    description: 'Aprobar u observar los registros que ya han sido validados.',
    icon: ShieldCheck,
    accent: 'bg-state-validado-soft text-state-validado-foreground',
  },
  {
    to: '/reportes',
    label: 'Reportes',
    description: 'Reportes y estadísticas institucionales de capacitaciones y asistencias.',
    icon: FileText,
    accent: 'bg-state-aprobado-soft text-state-aprobado-foreground',
  },
  {
    to: '/usuarios',
    label: 'Gestión de Usuarios',
    description: 'Usuarios, perfiles, vigencias laborales, ámbitos presupuestales y permisos SODEGA.',
    icon: UsersRound,
    accent: 'bg-brand-accent-soft text-brand-accent',
  },
  {
    to: '/configuracion',
    label: 'Configuración',
    description: 'Gestión de campos dinámicos y reglas de negocio por área.',
    icon: Settings,
    accent: 'bg-state-observado-soft text-state-observado-foreground',
  },
];

const TECNICO1_ITEMS: DashboardItem[] = [
  {
    to: '/capacitaciones-n1',
    label: 'Capacitaciones / Asist. Técnica N1',
    description: 'Registro de capacitaciones y asistencias técnicas de nivel 1.',
    icon: GraduationCap,
    accent: 'bg-brand/10 text-brand',
  },
];

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LucideAngularModule],
  template: `
    <section class="p-6 lg:p-8 max-w-7xl mx-auto animate-page-in">
      <header class="mb-8">
        <div class="text-caption">
          Área activa · {{ areaService.currentArea() }}
        </div>
        <h1 class="mt-1 text-h1 text-foreground">
          Bienvenido, {{ auth.user()?.nombre }} {{ auth.user()?.apellido }}
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Selecciona una opción para empezar a trabajar.
        </p>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (item of items(); track item.to) {
          <a [routerLink]="item.to" class="group focus:outline-none">
            <div class="h-full bg-card rounded-xl ring-1 ring-border shadow-xs transition-all duration-200 hover:shadow-md hover:ring-brand/40 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring">
              <div class="p-6 pb-3">
                <div class="flex items-start justify-between gap-3">
                  <div class="rounded-lg p-2.5" [class]="item.accent">
                    <lucide-angular [img]="item.icon" class="size-5" [strokeWidth]="1.75" />
                  </div>
                  <lucide-angular
                    [img]="ChevronRightIcon"
                    class="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground"
                  />
                </div>
                <h2 class="text-base font-semibold mt-3">{{ item.label }}</h2>
                <p class="text-sm text-muted-foreground leading-relaxed mt-1">
                  {{ item.description }}
                </p>
              </div>
              <div class="px-6 pb-6 pt-0">
                <span class="inline-flex items-center text-xs font-medium text-brand group-hover:underline">
                  Ir al módulo
                </span>
              </div>
            </div>
          </a>
        }
      </div>
    </section>
  `,
})
export class DashboardComponent {
  readonly auth = inject(AuthService);
  readonly areaService = inject(AreaService);
  readonly ChevronRightIcon = ChevronRight;

  /** Tarjetas por perfil SODEGA. */
  readonly items = computed<DashboardItem[]>(() => {
    if (this.auth.isJefeArea()) {
      return BASE_ITEMS.filter((i) =>
        ['/seguimiento/aprobacion', '/reportes', '/usuarios'].includes(i.to),
      );
    }
    if (this.auth.isAdminDZ()) {
      return BASE_ITEMS.filter((i) =>
        ['/seguimiento/revision', '/usuarios'].includes(i.to),
      );
    }
    if (this.auth.isAdminUE()) {
      return BASE_ITEMS.filter((i) =>
        ['/seguimiento/aprobacion', '/reportes', '/usuarios', '/configuracion'].includes(i.to),
      );
    }
    if (this.auth.isTecnico1()) return TECNICO1_ITEMS;
    return BASE_ITEMS;
  });
}
