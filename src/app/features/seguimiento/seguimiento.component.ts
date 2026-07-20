import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule, ClipboardCheck, ShieldCheck } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { EstadoCurso } from '../../core/models/curso.model';
import { SeguimientoPanelComponent } from './seguimiento-panel.component';

type ModoSeguimiento = 'revision' | 'aprobacion';

interface ConfigModo {
  modo: ModoSeguimiento;
  tab: string;
  icono: typeof ClipboardCheck;
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
    icono: ClipboardCheck,
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
    icono: ShieldCheck,
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
 *  - El Administrador General alterna ambos modos con pestañas sin navegar.
 */
@Component({
  selector: 'app-seguimiento',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, SeguimientoPanelComponent],
  template: `
    @if (modosDisponibles().length > 1) {
      <div class="px-6 lg:px-8 pt-6 max-w-[1400px] mx-auto">
        <div class="inline-flex p-1 bg-card ring-1 ring-border rounded-lg" role="tablist" aria-label="Modo de seguimiento">
          @for (m of modosDisponibles(); track m.modo) {
            <button
              role="tab"
              [attr.aria-selected]="modoActivo().modo === m.modo"
              (click)="modo.set(m.modo)"
              class="h-8 px-3 rounded-md text-xs font-bold transition-colors flex items-center gap-2"
              [class]="modoActivo().modo === m.modo
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'"
            >
              <lucide-angular [img]="m.icono" class="size-4" /> {{ m.tab }}
            </button>
          }
        </div>
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
