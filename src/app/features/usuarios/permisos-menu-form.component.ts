import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { LucideAngularModule, FolderOpen, Eye, ListChecks } from 'lucide-angular';
import type { LucideIconData } from 'lucide-angular';
import {
  EsquemaPermisosMenu,
  IconoGrupoPermiso,
  PermisosMenu,
} from '../../core/models/permisos-menu.model';

const ICONOS_GRUPO: Record<IconoGrupoPermiso, LucideIconData> = {
  registrar: FolderOpen,
  visualizar: Eye,
};

/**
 * Permisos de menú por usuario en dos tablas (Registrar | Visualizar),
 * según la matriz oficial permisos.xlsx. Componente 100 % presentacional:
 * la lógica vive en PermisosMenuService y en permisos-menu.model.ts.
 */
@Component({
  selector: 'app-permisos-menu-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <div class="border-t border-border pt-5 space-y-3">
      <div>
        <h4 class="label-ds text-brand flex items-center gap-2">
          <lucide-angular [img]="ListChecksIcon" class="size-4" /> {{ esquema().titulo }}
        </h4>
        <p class="text-xs text-muted-foreground mt-0.5">{{ esquema().descripcion }}</p>
      </div>

      <!-- Registrar | Visualizar: 50/50 en escritorio, apiladas en móvil -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        @for (grupo of esquema().grupos; track grupo.key) {
          <div class="bg-card rounded-xl ring-1 ring-border overflow-hidden flex flex-col">
            <div class="bg-brand-soft text-brand px-3 py-2 border-b border-brand/10 flex items-center justify-between gap-2">
              <span class="flex items-center gap-2 text-xs font-bold">
                <lucide-angular [img]="iconoDe(grupo.icono)" class="size-4" /> {{ grupo.label }}
              </span>
              <span class="text-[10px] font-bold bg-card/80 ring-1 ring-brand/20 rounded-full px-2 py-0.5 tabular-nums">
                {{ activosDe(grupo.key) }} / {{ grupo.items.length }}
              </span>
            </div>
            <div class="max-h-72 overflow-y-auto divide-y divide-border thin-scroll" role="group" [attr.aria-label]="grupo.label">
              @for (item of grupo.items; track item.key) {
                <label class="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground/90 cursor-pointer hover:bg-secondary/40 transition-colors select-none">
                  <input
                    type="checkbox"
                    class="accent-brand size-4 shrink-0"
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

  /** Esquema del perfil seleccionado (define grupos, ítems y defaults del Excel). */
  readonly esquema = input.required<EsquemaPermisosMenu>();
  /** Permisos del usuario en edición (two-way binding). */
  readonly permisos = model.required<PermisosMenu>();

  iconoDe(icono: IconoGrupoPermiso): LucideIconData {
    return ICONOS_GRUPO[icono];
  }

  estaActivo(grupo: string, item: string): boolean {
    return this.permisos()[grupo]?.[item] === true;
  }

  /** Cantidad de permisos activos del grupo (contador del encabezado). */
  activosDe(grupoKey: string): number {
    const valores = this.permisos()[grupoKey] ?? {};
    const grupo = this.esquema().grupos.find((g) => g.key === grupoKey);
    return (grupo?.items ?? []).filter((i) => valores[i.key] === true).length;
  }

  toggle(grupo: string, item: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.permisos.update((prev) => ({
      ...prev,
      [grupo]: { ...prev[grupo], [item]: checked },
    }));
  }
}
