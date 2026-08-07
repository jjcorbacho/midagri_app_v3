import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';
import { PermisosMenuService } from '../../core/services/permisos-menu.service';
import {
  GRUPO_REGISTRAR,
  GRUPO_VISUALIZAR,
  PERMISO_APROBACION_EVALUACION_UO,
  PERMISO_ASISTENCIA_TECNICA,
  PERMISO_CAPACITACION,
  PERMISO_CONFIG_CAMPOS,
  PERMISO_CONFIG_REGLAS,
  PERMISO_EVALUACION_ADMIN_DZ,
  PERMISO_EVALUACION_TECNICOS,
  PERMISO_GESTION_USUARIOS,
  PERMISO_LISTAS,
  PERMISO_REPORTE_ASISTENCIA,
  PERMISO_REPORTE_CAPACITACIONES,
  PERMISO_SEGUIMIENTO_APROBACION,
  PERMISO_SEGUIMIENTO_REVISION,
} from '../../core/constants/permisos-menu.const';

interface NavChild {
  to: string;
  label: string;
  /** Ligadura de Material Symbols. */
  icon: string;
}

interface NavItem {
  to: string;
  label: string;
  icon: string;
  matchPrefix?: string[];
  children?: NavChild[];
}

const CHILD_USUARIOS: NavChild = { to: '/usuarios', label: 'Gestión de Usuarios', icon: 'group' };
const CHILD_LISTAS: NavChild = { to: '/administracion/listas', label: 'Listas', icon: 'checklist' };
const CHILD_CONFIG_CAMPOS: NavChild = { to: '/configuracion/campos', label: 'Configuración Campos', icon: 'tune' };
const CHILD_CONFIG_REGLAS: NavChild = { to: '/configuracion/reglas', label: 'Configuración Reglas', icon: 'build' };

/** Grupo Administración (Gestión de Usuarios + Listas, según permisos). */
function grupoAdministracion(children: NavChild[]): NavItem {
  return {
    to: children[0]?.to ?? '/usuarios',
    label: 'Administración',
    icon: 'admin_panel_settings',
    matchPrefix: ['/usuarios', '/administracion'],
    children,
  };
}

/** Grupo Configuración (Campos + Reglas, según permisos). */
function grupoConfiguracion(children: NavChild[]): NavItem {
  return {
    to: children[0]?.to ?? '/configuracion',
    label: 'Configuración',
    icon: 'settings',
    matchPrefix: ['/configuracion'],
    children,
  };
}

const NAV_FULL: NavItem[] = [
  { to: '/dashboard', label: 'Inicio', icon: 'home' },
  {
    to: '/capacitaciones-n1',
    label: 'Capacitaciones / Asist. Técnica N1',
    icon: 'school',
    matchPrefix: ['/capacitaciones-n1'],
  },
  // Vista unificada: la botonera interna Revisión/Aprobación cambia de modo.
  { to: '/seguimiento/revision', label: 'Seguimiento', icon: 'fact_check', matchPrefix: ['/seguimiento'] },
  { to: '/reportes', label: 'Reportes', icon: 'description' },
  grupoAdministracion([CHILD_USUARIOS, CHILD_LISTAS]),
  {
    to: '/configuracion',
    label: 'Configuración',
    icon: 'settings',
    matchPrefix: ['/configuracion'],
    children: [
      { to: '/configuracion/campos', label: 'Configuración Campos', icon: 'tune' },
      { to: '/configuracion/reglas', label: 'Configuración Reglas', icon: 'build' },
    ],
  },
];

const COLLAPSE_KEY = 'midagri.sidebar.collapsed';

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  template: `
    <div class="barra" [class.colapsada]="collapsed()">
      <div class="cabecera">
        <a routerLink="/dashboard" class="logo" aria-label="MIDAGRI - Inicio">M</a>
        @if (!collapsed()) {
          <span class="marca">MIDAGRI</span>
        }
        <button
          matIconButton
          (click)="toggle()"
          [attr.aria-label]="collapsed() ? 'Expandir menú' : 'Colapsar menú'"
          [matTooltip]="collapsed() ? 'Expandir menú' : 'Colapsar menú'"
          matTooltipPosition="right"
        >
          <mat-icon fontSet="material-symbols-outlined">{{ collapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
        </button>
      </div>

      <mat-nav-list class="navegacion">
        @for (item of nav(); track item.to) {
          @if (item.children?.length && !collapsed()) {
            <a
              mat-list-item
              (click)="toggleGroup(item.to)"
              [activated]="isActive(item)"
              [attr.aria-expanded]="isGroupOpen(item.to)"
              class="grupo"
            >
              <mat-icon matListItemIcon fontSet="material-symbols-outlined">{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
              <mat-icon matListItemMeta fontSet="material-symbols-outlined" class="chevron" [class.abierto]="isGroupOpen(item.to)">expand_more</mat-icon>
            </a>
            @if (isGroupOpen(item.to)) {
              <div class="subnivel">
                @for (sub of item.children; track sub.to) {
                  <a mat-list-item [routerLink]="sub.to" [activated]="isChildActive(sub)">
                    <mat-icon matListItemIcon fontSet="material-symbols-outlined">{{ sub.icon }}</mat-icon>
                    <span matListItemTitle>{{ sub.label }}</span>
                  </a>
                }
              </div>
            }
          } @else {
            <a
              mat-list-item
              [routerLink]="item.to"
              [activated]="isActive(item)"
              [matTooltip]="collapsed() ? item.label : ''"
              matTooltipPosition="right"
              [attr.aria-label]="item.label"
            >
              <mat-icon matListItemIcon fontSet="material-symbols-outlined">{{ item.icon }}</mat-icon>
              @if (!collapsed()) {
                <span matListItemTitle>{{ item.label }}</span>
              }
            </a>
          }
        }
      </mat-nav-list>

      <mat-divider />

      <mat-nav-list class="pie">
        <a
          mat-list-item
          (click)="logout()"
          [matTooltip]="collapsed() ? 'Cerrar sesión' : ''"
          matTooltipPosition="right"
          aria-label="Cerrar sesión"
        >
          <mat-icon matListItemIcon fontSet="material-symbols-outlined">logout</mat-icon>
          @if (!collapsed()) {
            <span matListItemTitle>Cerrar sesión</span>
          }
        </a>
      </mat-nav-list>
    </div>
  `,
  styles: `
    :host { display: block; height: 100%; }
    /* Superficie del menú: Material no define una variante "sidebar",
       así que se deriva de los tokens del tema activo. */
    .barra {
      height: 100%;
      display: flex;
      flex-direction: column;
      width: 240px;
      background: var(--mat-sys-surface-container-highest);
      color: var(--mat-sys-on-surface);
      transition: width 200ms var(--mat-sys-motion-easing-standard, ease);
      overflow-x: hidden;
    }
    .barra.colapsada { width: 72px; }

    .cabecera {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      min-height: 64px;
    }
    .colapsada .cabecera { flex-direction: column; gap: 4px; }
    .logo {
      width: 40px; height: 40px; flex: 0 0 40px;
      display: flex; align-items: center; justify-content: center;
      border-radius: var(--mat-sys-corner-small);
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      font: var(--mat-sys-title-medium);
      font-weight: 700;
      text-decoration: none;
    }
    .marca {
      flex: 1;
      font: var(--mat-sys-label-medium);
      letter-spacing: 0.1em;
      color: var(--mat-sys-on-surface-variant);
    }

    .navegacion { flex: 1; overflow-y: auto; overflow-x: hidden; }
    .pie { padding-bottom: 8px; }
    .grupo { cursor: pointer; }
    .chevron { transition: transform 200ms ease; }
    .chevron.abierto { transform: rotate(180deg); }
    .subnivel { padding-left: 16px; }

    /* En modo colapsado la lista muestra solo el icono, centrado. */
    .colapsada .mat-mdc-list-item { padding-left: 16px; padding-right: 16px; }
  `,
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);
  private readonly permisosMenu = inject(PermisosMenuService);
  private readonly router = inject(Router);

  readonly collapsed = signal(this.restoreCollapsed());
  private readonly openGroups = signal<Set<string>>(new Set());

  readonly pathname = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects.split('?')[0]),
      startWith(this.router.url.split('?')[0]),
    ),
    { initialValue: this.router.url.split('?')[0] },
  );

  /** Menú filtrado por perfil SODEGA + permisos de menú del usuario (matriz permisos.xlsx). */
  readonly nav = computed<NavItem[]>(() => {
    if (this.auth.isJefeArea()) {
      const items: NavItem[] = [{ to: '/dashboard', label: 'Inicio', icon: 'home' }];
      if (this.registra(PERMISO_APROBACION_EVALUACION_UO)) {
        items.push({ to: '/seguimiento/aprobacion', label: 'Seguimiento', icon: 'fact_check', matchPrefix: ['/seguimiento'] });
      }
      if (this.puedeVerReportes()) {
        items.push({ to: '/reportes', label: 'Reportes', icon: 'description' });
      }
      const admin = this.childrenAdministracion();
      if (admin.length) items.push(grupoAdministracion(admin));
      return items;
    }
    if (this.auth.isAdminDZ()) {
      const items: NavItem[] = [{ to: '/dashboard', label: 'Inicio', icon: 'home' }];
      if (this.registra(PERMISO_EVALUACION_TECNICOS)) {
        items.push({ to: '/seguimiento/revision', label: 'Seguimiento', icon: 'fact_check', matchPrefix: ['/seguimiento'] });
      }
      if (this.puedeVerReportes()) {
        items.push({ to: '/reportes', label: 'Reportes', icon: 'description' });
      }
      const admin = this.childrenAdministracion();
      if (admin.length) items.push(grupoAdministracion(admin));
      return items;
    }
    if (this.auth.isAdminUE()) {
      const items: NavItem[] = [{ to: '/dashboard', label: 'Inicio', icon: 'home' }];
      if (this.registra(PERMISO_EVALUACION_ADMIN_DZ)) {
        items.push({ to: '/seguimiento/aprobacion', label: 'Seguimiento', icon: 'fact_check', matchPrefix: ['/seguimiento'] });
      }
      if (this.puedeVerReportes()) {
        items.push({ to: '/reportes', label: 'Reportes', icon: 'description' });
      }
      const admin = this.childrenAdministracion();
      if (admin.length) items.push(grupoAdministracion(admin));
      const config = this.childrenConfiguracion();
      if (config.length) items.push(grupoConfiguracion(config));
      return items;
    }
    if (this.auth.isTecnico1()) {
      const items: NavItem[] = [{ to: '/dashboard', label: 'Inicio', icon: 'home' }];
      if (this.registra(PERMISO_CAPACITACION) || this.registra(PERMISO_ASISTENCIA_TECNICA)) {
        items.push({
          to: '/capacitaciones-n1',
          label: 'Capacitaciones / Asist. Técnica N1',
          icon: 'school',
          matchPrefix: ['/capacitaciones-n1'],
        });
      }
      return items;
    }
    // Administrador General y perfiles personalizados (lista "Perfil Autorizado"):
    // menú derivado íntegramente de los permisos del registro activo.
    if (this.auth.session()) {
      const items: NavItem[] = [{ to: '/dashboard', label: 'Inicio', icon: 'home' }];
      if (this.registra(PERMISO_CAPACITACION) || this.registra(PERMISO_ASISTENCIA_TECNICA)) {
        items.push({
          to: '/capacitaciones-n1',
          label: 'Capacitaciones / Asist. Técnica N1',
          icon: 'school',
          matchPrefix: ['/capacitaciones-n1'],
        });
      }
      // Entrada única "Seguimiento": abre revisión si el permiso lo cubre;
      // de lo contrario, aprobación. La botonera interna alterna los modos.
      if (this.registra(PERMISO_SEGUIMIENTO_REVISION)) {
        items.push({ to: '/seguimiento/revision', label: 'Seguimiento', icon: 'fact_check', matchPrefix: ['/seguimiento'] });
      } else if (this.registra(PERMISO_SEGUIMIENTO_APROBACION)) {
        items.push({ to: '/seguimiento/aprobacion', label: 'Seguimiento', icon: 'fact_check', matchPrefix: ['/seguimiento'] });
      }
      if (this.puedeVerReportes()) {
        items.push({ to: '/reportes', label: 'Reportes', icon: 'description' });
      }
      const admin = this.childrenAdministracion();
      if (admin.length) items.push(grupoAdministracion(admin));
      const config = this.childrenConfiguracion();
      if (config.length) items.push(grupoConfiguracion(config));
      return items;
    }
    return NAV_FULL;
  });

  /* ===== Helpers de permisos (grupos Registrar / Visualizar del Excel) ===== */

  private registra(permiso: string): boolean {
    return this.permisosMenu.sesionTiene(GRUPO_REGISTRAR, permiso);
  }

  private puedeVerReportes(): boolean {
    return (
      this.permisosMenu.sesionTiene(GRUPO_VISUALIZAR, PERMISO_REPORTE_CAPACITACIONES) ||
      this.permisosMenu.sesionTiene(GRUPO_VISUALIZAR, PERMISO_REPORTE_ASISTENCIA)
    );
  }

  /** Hijos del grupo Administración según los permisos del registro activo. */
  private childrenAdministracion(): NavChild[] {
    const children: NavChild[] = [];
    if (this.registra(PERMISO_GESTION_USUARIOS)) children.push(CHILD_USUARIOS);
    if (this.registra(PERMISO_LISTAS)) children.push(CHILD_LISTAS);
    return children;
  }

  /** Hijos del grupo Configuración según los permisos del registro activo. */
  private childrenConfiguracion(): NavChild[] {
    const children: NavChild[] = [];
    if (this.registra(PERMISO_CONFIG_CAMPOS)) children.push(CHILD_CONFIG_CAMPOS);
    if (this.registra(PERMISO_CONFIG_REGLAS)) children.push(CHILD_CONFIG_REGLAS);
    return children;
  }

  constructor() {
    // Abre el grupo correspondiente al navegar dentro de sus rutas
    effect(() => {
      const path = this.pathname();
      for (const item of this.nav()) {
        if (!item.children?.length) continue;
        const dentro =
          item.matchPrefix?.some((p) => path.startsWith(p)) ||
          item.children.some((c) => path.startsWith(c.to));
        if (dentro) this.openGroup(item.to);
      }
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

  isGroupOpen(key: string): boolean {
    return this.openGroups().has(key);
  }

  toggleGroup(key: string): void {
    this.openGroups.update((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  private openGroup(key: string): void {
    this.openGroups.update((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }

  isActive(item: NavItem): boolean {
    const path = this.pathname();
    if (path === item.to) return true;
    return item.matchPrefix?.some((p) => path.startsWith(p)) ?? false;
  }

  isChildActive(sub: NavChild): boolean {
    return this.pathname().startsWith(sub.to);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/auth']);
  }
}
