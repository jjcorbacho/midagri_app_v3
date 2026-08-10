import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { AreaService } from '../../core/services/area.service';

interface DashboardItem {
  to: string;
  label: string;
  description: string;
  /** Ligadura de Material Symbols. */
  icono: string;
  /** Clase de tono del icono, declarada en los estilos del componente. */
  tono: string;
}

const BASE_ITEMS: DashboardItem[] = [
  {
    to: '/capacitaciones-n1',
    label: 'Capacitaciones / Asist. Técnica N1',
    description: 'Registro y gestión de eventos, participantes, sustentos y estados.',
    icono: 'school',
    tono: 't-marca',
  },
  {
    to: '/seguimiento/revision',
    label: 'Seguimiento y revisión',
    description: 'Revisar y validar los registros enviados por las áreas.',
    icono: 'assignment_turned_in',
    tono: 't-enviado',
  },
  {
    to: '/seguimiento/aprobacion',
    label: 'Seguimiento y aprobación',
    description: 'Aprobar u observar los registros que ya han sido validados.',
    icono: 'verified_user',
    tono: 't-validado',
  },
  {
    to: '/reportes',
    label: 'Reportes',
    description: 'Reportes y estadísticas institucionales de capacitaciones y asistencias.',
    icono: 'description',
    tono: 't-aprobado',
  },
  {
    to: '/usuarios',
    label: 'Gestión de Usuarios',
    description: 'Usuarios, perfiles, vigencias laborales, ámbitos presupuestales y permisos SODEGA.',
    icono: 'group',
    tono: 't-terciario',
  },
  {
    to: '/configuracion',
    label: 'Configuración',
    description: 'Gestión de campos dinámicos y reglas de negocio por área.',
    icono: 'settings',
    tono: 't-observado',
  },
];

const TECNICO1_ITEMS: DashboardItem[] = [
  {
    to: '/capacitaciones-n1',
    label: 'Capacitaciones / Asist. Técnica N1',
    description: 'Registro de capacitaciones y asistencias técnicas de nivel 1.',
    icono: 'school',
    tono: 't-marca',
  },
];

/** Portada del sistema: accesos a los módulos habilitados para el perfil. */
@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatCardModule, MatIconModule],
  template: `
    <section class="pagina">
      <header class="cabecera">
        <span class="area">Área activa · {{ areaService.currentArea() }}</span>
        <h1>Bienvenido, {{ auth.user()?.nombre }} {{ auth.user()?.apellido }}</h1>
        <p>Selecciona una opción para empezar a trabajar.</p>
      </header>

      <div class="tarjetas">
        @for (item of items(); track item.to) {
          <a class="acceso" [routerLink]="item.to">
            <mat-card appearance="outlined">
              <div class="encabezado">
                <span class="icono" [class]="item.tono">
                  <mat-icon fontSet="material-symbols-outlined">{{ item.icono }}</mat-icon>
                </span>
                <mat-icon class="flecha" fontSet="material-symbols-outlined">chevron_right</mat-icon>
              </div>
              <h2>{{ item.label }}</h2>
              <p>{{ item.description }}</p>
              <span class="ir">Ir al módulo</span>
            </mat-card>
          </a>
        }
      </div>
    </section>
  `,
  styles: `
    .pagina {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }
    @media (min-width: 1024px) { .pagina { padding: 32px; } }

    .cabecera { margin-bottom: 32px; }
    .area {
      font: var(--mat-sys-label-medium);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--mat-sys-on-surface-variant);
    }
    .cabecera h1 {
      margin: 4px 0 0;
      font: var(--mat-sys-headline-small);
      color: var(--mat-sys-on-surface);
    }
    .cabecera p {
      margin: 4px 0 0;
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
    }

    .tarjetas {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 16px;
    }
    @media (min-width: 768px) { .tarjetas { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (min-width: 1280px) { .tarjetas { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

    .acceso { display: block; height: 100%; text-decoration: none; color: inherit; }
    .acceso mat-card {
      height: 100%;
      padding: 24px;
      transition: box-shadow 150ms, border-color 150ms;
    }
    .acceso:hover mat-card,
    .acceso:focus-visible mat-card {
      border-color: var(--mat-sys-primary);
      box-shadow: var(--mat-sys-level2);
    }
    .acceso:focus-visible { outline: none; }

    .encabezado { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
    .icono {
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      border-radius: var(--mat-sys-corner-medium);
    }
    .flecha {
      color: var(--mat-sys-on-surface-variant);
      transition: transform 150ms;
    }
    .acceso:hover .flecha { transform: translateX(4px); }

    /* Tonos de módulo: los estados de negocio del flujo N1 más los del tema. */
    .t-marca { background: var(--mat-sys-primary-container); color: var(--mat-sys-on-primary-container); }
    .t-terciario { background: var(--mat-sys-tertiary-container); color: var(--mat-sys-on-tertiary-container); }
    .t-enviado { background: var(--estado-enviado-fondo); color: var(--estado-enviado); }
    .t-validado { background: var(--estado-validado-fondo); color: var(--estado-validado); }
    .t-aprobado { background: var(--estado-aprobado-fondo); color: var(--estado-aprobado); }
    .t-observado { background: var(--estado-observado-fondo); color: var(--estado-observado); }

    .acceso h2 {
      margin: 16px 0 0;
      font: var(--mat-sys-title-small);
      color: var(--mat-sys-on-surface);
    }
    .acceso p {
      margin: 4px 0 0;
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
    }
    .ir {
      display: inline-block;
      margin-top: 16px;
      font: var(--mat-sys-label-large);
      color: var(--mat-sys-primary);
    }
    .acceso:hover .ir { text-decoration: underline; }
  `,
})
export class DashboardComponent {
  readonly auth = inject(AuthService);
  readonly areaService = inject(AreaService);

  /** Tarjetas por perfil SODEGA. */
  readonly items = computed<DashboardItem[]>(() => {
    if (this.auth.isJefeArea()) {
      return BASE_ITEMS.filter((i) =>
        ['/seguimiento/aprobacion', '/reportes', '/usuarios'].includes(i.to),
      );
    }
    if (this.auth.isAdminDZ()) {
      return BASE_ITEMS.filter((i) => ['/seguimiento/revision', '/usuarios'].includes(i.to));
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
