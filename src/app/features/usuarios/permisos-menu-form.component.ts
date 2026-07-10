import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import {
  LucideAngularModule,
  FolderOpen, ClipboardCheck, Search, FileText, Settings, TrendingUp, CircleHelp, ListChecks,
} from 'lucide-angular';
import type { LucideIconData } from 'lucide-angular';
import {
  EsquemaPermisosMenu,
  IconoGrupoPermiso,
  PermisosMenu,
} from '../../core/models/permisos-menu.model';

const ICONOS_GRUPO: Record<IconoGrupoPermiso, LucideIconData> = {
  registrar: FolderOpen,
  evaluacion: ClipboardCheck,
  consulta: Search,
  reportes: FileText,
  administracion: Settings,
  ejecutivo: TrendingUp,
  ayuda: CircleHelp,
};

/**
 * Grilla de permisos de menú (checkboxes por grupo), dirigida por el esquema
 * del perfil. Componente 100 % presentacional: la lógica vive en
 * PermisosMenuService y en el modelo permisos-menu.model.ts.
 */
@Component({
  selector: 'app-permisos-menu-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <div class="border-t border-border pt-5 space-y-3">
      <div>
        <h4 class="text-[11px] font-semibold uppercase tracking-wider text-teal-700 flex items-center gap-2">
          <lucide-angular [img]="ListChecksIcon" class="size-4" /> {{ esquema().titulo }}
        </h4>
        <p class="text-xs text-muted-foreground mt-0.5">{{ esquema().descripcion }}</p>
      </div>
      <div
        class="grid grid-cols-1 gap-3"
        [class]="esquema().columnas === 4 ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-2 xl:grid-cols-3'"
      >
        @for (grupo of esquema().grupos; track grupo.key) {
          <div class="bg-card rounded-xl ring-1 ring-border overflow-hidden">
            <div class="bg-brand-soft text-brand px-3 py-2 text-xs font-bold border-b border-brand/10 flex items-center gap-2">
              <lucide-angular [img]="iconoDe(grupo.icono)" class="size-4" /> {{ grupo.label }}
            </div>
            <div class="p-3 space-y-2">
              @for (item of grupo.items; track item.key) {
                <label class="flex items-center gap-2 text-sm text-foreground/90 cursor-pointer">
                  <input
                    type="checkbox"
                    class="accent-teal-700 size-4"
                    [checked]="estaActivo(grupo.key, item.key)"
                    (change)="toggle(grupo.key, item.key, $event)"
                  />
                  {{ item.label }}
                </label>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class PermisosMenuFormComponent {
  readonly ListChecksIcon = ListChecks;

  /** Esquema del perfil seleccionado (define grupos, ítems y defaults). */
  readonly esquema = input.required<EsquemaPermisosMenu>();
  /** Permisos del usuario en edición (two-way binding). */
  readonly permisos = model.required<PermisosMenu>();

  iconoDe(icono: IconoGrupoPermiso): LucideIconData {
    return ICONOS_GRUPO[icono];
  }

  estaActivo(grupo: string, item: string): boolean {
    return this.permisos()[grupo]?.[item] === true;
  }

  toggle(grupo: string, item: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.permisos.update((prev) => ({
      ...prev,
      [grupo]: { ...prev[grupo], [item]: checked },
    }));
  }
}
