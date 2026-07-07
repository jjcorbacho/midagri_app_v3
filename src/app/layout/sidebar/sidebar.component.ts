import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import {
  LucideAngularModule,
  Home,
  GraduationCap,
  ClipboardCheck,
  ShieldCheck,
  FileText,
  Settings,
  Sliders,
  Wrench,
  UsersRound,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-angular';
import type { LucideIconData } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';

interface NavChild {
  to: string;
  label: string;
  icon: LucideIconData;
}

interface NavItem {
  to: string;
  label: string;
  icon: LucideIconData;
  matchPrefix?: string[];
  children?: NavChild[];
}

const NAV_FULL: NavItem[] = [
  { to: '/dashboard', label: 'Inicio', icon: Home },
  {
    to: '/capacitaciones-n1',
    label: 'Capacitaciones / Asist. Técnica N1',
    icon: GraduationCap,
    matchPrefix: ['/capacitaciones-n1'],
  },
  { to: '/seguimiento/revision', label: 'Seguimiento y revisión', icon: ClipboardCheck },
  { to: '/seguimiento/aprobacion', label: 'Seguimiento y aprobación', icon: ShieldCheck },
  { to: '/reportes', label: 'Reportes', icon: FileText },
  { to: '/usuarios', label: 'Gestión de Usuarios', icon: UsersRound, matchPrefix: ['/usuarios'] },
  {
    to: '/configuracion',
    label: 'Configuración',
    icon: Settings,
    matchPrefix: ['/configuracion'],
    children: [
      { to: '/configuracion/campos', label: 'Configuración Campos', icon: Sliders },
      { to: '/configuracion/reglas', label: 'Configuración Reglas', icon: Wrench },
    ],
  },
];

const COLLAPSE_KEY = 'midagri.sidebar.collapsed';

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LucideAngularModule],
  template: `
    <aside
      class="flex-shrink-0 bg-sidebar text-sidebar-foreground flex flex-col py-3 z-30 sticky top-0 h-screen transition-[width] duration-200"
      [class]="collapsed() ? 'w-16 items-center' : 'w-60'"
    >
      <div class="flex items-center mb-3 w-full" [class]="collapsed() ? 'justify-center' : 'justify-between px-3'">
        <a
          routerLink="/dashboard"
          class="size-10 rounded-md flex items-center justify-center ring-1 ring-white/20 bg-brand text-white font-bold text-sm shrink-0"
          aria-label="MIDAGRI - Inicio"
        >M</a>
        @if (!collapsed()) {
          <span class="text-[11px] font-semibold tracking-wider text-white/70 uppercase">MIDAGRI</span>
        }
        <button
          (click)="toggle()"
          class="p-1.5 rounded-md hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          [class]="collapsed() ? 'absolute top-3 right-[-12px] bg-sidebar ring-1 ring-white/15' : ''"
          [attr.aria-label]="collapsed() ? 'Expandir menú' : 'Colapsar menú'"
          [title]="collapsed() ? 'Expandir menú' : 'Colapsar menú'"
        >
          <lucide-angular [img]="collapsed() ? ChevronRightIcon : ChevronLeftIcon" class="size-4" />
        </button>
      </div>

      <nav class="flex flex-col gap-0.5 flex-1 w-full" [class]="collapsed() ? 'items-center px-0' : 'px-2'">
        @for (item of nav(); track item.to) {
          @if (item.children?.length && !collapsed()) {
            <div class="flex flex-col">
              <button
                (click)="configOpen.set(!configOpen())"
                class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors w-full text-left"
                [class]="isActive(item) ? 'bg-brand text-white' : 'text-sidebar-muted hover:text-white hover:bg-white/10'"
              >
                <lucide-angular [img]="item.icon" class="size-5 shrink-0" [strokeWidth]="1.75" />
                <span class="text-sm flex-1">{{ item.label }}</span>
                <lucide-angular [img]="ChevronDownIcon" class="size-4 transition-transform" [class.rotate-180]="configOpen()" />
              </button>
              @if (configOpen()) {
                <div class="ml-7 flex flex-col gap-0.5 mt-0.5 mb-1">
                  @for (sub of item.children; track sub.to) {
                    <a
                      [routerLink]="sub.to"
                      class="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors"
                      [class]="pathname() === sub.to ? 'bg-white/15 text-white' : 'text-sidebar-muted hover:text-white hover:bg-white/5'"
                    >
                      <lucide-angular [img]="sub.icon" class="size-4" [strokeWidth]="1.75" />
                      <span>{{ sub.label }}</span>
                    </a>
                  }
                </div>
              }
            </div>
          } @else {
            <a
              [routerLink]="item.to"
              class="group relative flex items-center gap-3 rounded-lg transition-colors"
              [class]="(collapsed() ? 'p-2.5 justify-center ' : 'px-3 py-2 ') + (isActive(item) ? 'bg-brand text-white' : 'text-sidebar-muted hover:text-white hover:bg-white/10')"
            >
              <lucide-angular [img]="item.icon" class="size-5 shrink-0" [strokeWidth]="1.75" />
              @if (!collapsed()) {
                <span class="text-sm">{{ item.label }}</span>
              } @else {
                <span class="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all bg-zinc-800 text-white text-xs font-medium px-2.5 py-1.5 rounded whitespace-nowrap z-50 shadow-lg">
                  {{ item.label }}
                </span>
              }
            </a>
          }
        }
      </nav>

      <div class="flex flex-col gap-1 w-full" [class]="collapsed() ? 'items-center px-0' : 'px-2'">
        <button
          (click)="logout()"
          class="group relative flex items-center gap-3 rounded-lg text-sidebar-muted hover:text-white hover:bg-white/10 transition-colors"
          [class]="collapsed() ? 'p-2.5 justify-center' : 'px-3 py-2'"
          aria-label="Cerrar sesión"
        >
          <lucide-angular [img]="LogOutIcon" class="size-5 shrink-0" [strokeWidth]="1.75" />
          @if (!collapsed()) {
            <span class="text-sm">Cerrar sesión</span>
          } @else {
            <span class="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all bg-zinc-800 text-white text-xs font-medium px-2.5 py-1.5 rounded whitespace-nowrap z-50 shadow-lg">
              Cerrar sesión
            </span>
          }
        </button>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly ChevronLeftIcon = ChevronLeft;
  readonly ChevronRightIcon = ChevronRight;
  readonly ChevronDownIcon = ChevronDown;
  readonly LogOutIcon = LogOut;

  readonly collapsed = signal(this.restoreCollapsed());
  readonly configOpen = signal(false);

  readonly pathname = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects.split('?')[0]),
      startWith(this.router.url.split('?')[0]),
    ),
    { initialValue: this.router.url.split('?')[0] },
  );

  /** Menú filtrado por perfil SODEGA. */
  readonly nav = computed<NavItem[]>(() => {
    if (this.auth.isJefeArea()) {
      return [
        { to: '/dashboard', label: 'Inicio', icon: Home },
        { to: '/seguimiento/aprobacion', label: 'Aprobación de Evaluaciones UO', icon: ShieldCheck },
        { to: '/reportes', label: 'Reportes', icon: FileText },
        { to: '/usuarios', label: 'Gestión de Usuarios', icon: UsersRound, matchPrefix: ['/usuarios'] },
      ];
    }
    if (this.auth.isAdminDZ()) {
      return [
        { to: '/dashboard', label: 'Inicio', icon: Home },
        { to: '/seguimiento/revision', label: 'Evaluación de Técnicos', icon: ClipboardCheck },
        { to: '/usuarios', label: 'Gestión de Usuarios', icon: UsersRound, matchPrefix: ['/usuarios'] },
      ];
    }
    if (this.auth.isAdminUE()) {
      return [
        { to: '/dashboard', label: 'Inicio', icon: Home },
        { to: '/seguimiento/aprobacion', label: 'Evaluación de Administrador DZ', icon: ShieldCheck },
        { to: '/reportes', label: 'Reportes', icon: FileText },
        { to: '/usuarios', label: 'Gestión de Usuarios', icon: UsersRound, matchPrefix: ['/usuarios'] },
        {
          to: '/configuracion',
          label: 'Configuración',
          icon: Settings,
          matchPrefix: ['/configuracion'],
          children: [{ to: '/configuracion/campos', label: 'Configuración Campos', icon: Sliders }],
        },
      ];
    }
    if (this.auth.isTecnico1()) {
      return [
        { to: '/dashboard', label: 'Inicio', icon: Home },
        {
          to: '/capacitaciones-n1',
          label: 'Capacitaciones / Asist. Técnica N1',
          icon: GraduationCap,
          matchPrefix: ['/capacitaciones-n1'],
        },
      ];
    }
    return NAV_FULL;
  });

  constructor() {
    // Abre el grupo Configuración al navegar dentro de él
    effect(() => {
      if (this.pathname().startsWith('/configuracion')) this.configOpen.set(true);
    });
  }

  private restoreCollapsed(): boolean {
    try {
      const v = sessionStorage.getItem(COLLAPSE_KEY);
      if (v !== null) return v === '1';
    } catch { /* noop */ }
    return true;
  }

  toggle(): void {
    this.collapsed.update((c) => {
      const next = !c;
      try { sessionStorage.setItem(COLLAPSE_KEY, next ? '1' : '0'); } catch { /* noop */ }
      return next;
    });
  }

  isActive(item: NavItem): boolean {
    const path = this.pathname();
    if (path === item.to) return true;
    return item.matchPrefix?.some((p) => path.startsWith(p)) ?? false;
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/auth']);
  }
}
