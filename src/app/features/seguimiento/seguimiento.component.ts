import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { EstadoCurso } from '../../core/models/curso.model';
import { SeguimientoPanelComponent } from './seguimiento-panel.component';

type ModoSeguimiento = 'revision' | 'aprobacion';

interface ConfigModo {
  modo: ModoSeguimiento;
  tab: string;
  /** Ligadura de Material Symbols. */
  icono: string;
  title: string;
  subtitle: string;
  estadoAprobar: EstadoCurso;
  labelAprobar: string;
  rol: 'ADMIN_DZ' | 'ADMIN_UE';
  rolLabel: string;
}

const ESTADOS_ENTRADA: EstadoCurso[] = ['Enviado', 'Enviado-Subsanado', 'Observado', 'Validado', 'Aprobado'];

/** Configuración por modo (idéntica a las antiguas vistas Revisión / Aprobación). */
const CONFIGS: Record<ModoSeguimiento, ConfigModo> = {
  revision: {
    modo: 'revision',
    tab: 'Revisión',
    icono: 'assignment_turned_in',
    title: 'Seguimiento y revisión',
    subtitle: 'Validar registros enviados u observar con un comentario.',
    estadoAprobar: 'Validado',
    labelAprobar: 'Validar',
    rol: 'ADMIN_DZ',
    rolLabel: 'ADMINISTRADOR DZ_CAP_ASIT.',
  },
  aprobacion: {
    modo: 'aprobacion',
    tab: 'Aprobación',
    icono: 'verified_user',
    title: 'Seguimiento y aprobación',
    subtitle: 'Aprobar registros ya validados o devolverlos con observaciones.',
    estadoAprobar: 'Aprobado',
    labelAprobar: 'Aprobar',
    rol: 'ADMIN_UE',
    rolLabel: 'ADMINISTRADOR UNIDAD ORGANIZACIONAL',
  },
};

/**
 * Vista unificada de Seguimiento (fusión de /seguimiento/revision y
 * /seguimiento/aprobacion). Ambas rutas cargan este componente — así los
 * guards, el sidebar y los permisos existentes siguen operando sin cambios —
 * y la ruta define la pestaña inicial. La lógica completa vive en el panel
 * compartido `app-seguimiento-panel`; aquí solo se selecciona el modo:
 *  - Admin DZ ve Revisión; Jefe de Área y Admin UE ven Aprobación.
 *  - El Administrador General alterna ambos modos con un conmutador, sin navegar.
 */
@Component({
  selector: 'app-seguimiento',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonToggleModule, MatIconModule, SeguimientoPanelComponent],
  template: `
    @if (modosDisponibles().length > 1) {
      <div class="conmutador">
        <mat-button-toggle-group
          [value]="modo()"
          (valueChange)="modo.set($event)"
          hideSingleSelectionIndicator
          aria-label="Modo de seguimiento"
        >
          @for (m of modosDisponibles(); track m.modo) {
            <mat-button-toggle [value]="m.modo">
              <mat-icon fontSet="material-symbols-outlined">{{ m.icono }}</mat-icon>
              {{ m.tab }}
            </mat-button-toggle>
          }
        </mat-button-toggle-group>
      </div>
    }

    @if (modoActivo(); as cfg) {
      <app-seguimiento-panel
        [title]="cfg.title"
        [subtitle]="cfg.subtitle"
        [estadosEntrada]="estados"
        [estadoAprobar]="cfg.estadoAprobar"
        [labelAprobar]="cfg.labelAprobar"
        [rol]="cfg.rol"
        [rolLabel]="cfg.rolLabel"
      />
    }
  `,
  styles: `
    .conmutador {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px 16px 0;
    }
    @media (min-width: 768px) { .conmutador { padding: 24px 32px 0; } }
    /* Caja fija: la ligadura no ensancha la opción mientras carga la fuente. */
    mat-icon { margin-right: 8px; font-size: 20px; width: 20px; height: 20px; overflow: hidden; }
  `,
})
export class SeguimientoComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);

  readonly estados = ESTADOS_ENTRADA;

  /** Modos habilitados según el perfil en sesión (misma matriz del role.guard). */
  readonly modosDisponibles = computed<ConfigModo[]>(() => {
    const perfil = this.auth.session()?.perfil ?? '';
    if (perfil === 'Administrador DZ_Cap_Asit.') return [CONFIGS.revision];
    if (perfil === 'Jefe de Área' || perfil === 'Administrador Unidad Ejecutora(UE)') {
      return [CONFIGS.aprobacion];
    }
    return [CONFIGS.revision, CONFIGS.aprobacion];
  });

  /** Pestaña inicial marcada por la ruta de entrada (data.modo). */
  readonly modo = signal<ModoSeguimiento>(
    (this.route.snapshot.data['modo'] as ModoSeguimiento | undefined) ?? 'revision',
  );

  readonly modoActivo = computed<ConfigModo>(() => {
    const disponibles = this.modosDisponibles();
    return disponibles.find((m) => m.modo === this.modo()) ?? disponibles[0];
  });
}
