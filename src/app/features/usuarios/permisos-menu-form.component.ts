import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import {
  EsquemaPermisosMenu,
  IconoGrupoPermiso,
  PermisosMenu,
} from '../../core/models/permisos-menu.model';

/** Ligaduras de Material Symbols por tipo de grupo. */
const ICONOS_GRUPO: Record<IconoGrupoPermiso, string> = {
  registrar: 'folder_open',
  visualizar: 'visibility',
};

/**
 * Permisos de menú por usuario en dos tarjetas (Registrar | Visualizar),
 * según la matriz oficial permisos.xlsx. Componente 100 % presentacional:
 * la lógica vive en PermisosMenuService y en permisos-menu.model.ts.
 */
@Component({
  selector: 'app-permisos-menu-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatCheckboxModule, MatDividerModule, MatIconModule],
  template: `
    <section class="permisos">
      <header class="encabezado">
        <mat-icon fontSet="material-symbols-outlined">checklist</mat-icon>
        <div>
          <h4>{{ esquema().titulo }}</h4>
          <p>{{ esquema().descripcion }}</p>
        </div>
      </header>

      <!-- Registrar | Visualizar: 50/50 en escritorio, apiladas en móvil -->
      <div class="grupos">
        @for (grupo of esquema().grupos; track grupo.key) {
          <mat-card appearance="outlined" class="grupo">
            <div class="cabecera">
              <span class="titulo-grupo">
                <mat-icon fontSet="material-symbols-outlined">{{ iconoDe(grupo.icono) }}</mat-icon>
                {{ grupo.label }}
              </span>
              <span class="contador">{{ activosDe(grupo.key) }} / {{ grupo.items.length }}</span>
            </div>
            <mat-divider />
            <div class="items" role="group" [attr.aria-label]="grupo.label">
              @for (item of grupo.items; track item.key) {
                <mat-checkbox
                  [checked]="estaActivo(grupo.key, item.key)"
                  (change)="toggle(grupo.key, item.key, $event.checked)"
                >{{ item.label }}</mat-checkbox>
              }
            </div>
          </mat-card>
        }
      </div>
    </section>
  `,
  styles: `
    :host { display: block; }
    .permisos {
      border-top: 1px solid var(--mat-sys-outline-variant);
      padding-top: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .encabezado {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      color: var(--mat-sys-primary);
    }
    .encabezado mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .encabezado h4 {
      margin: 0;
      font: var(--mat-sys-label-large);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .encabezado p {
      margin: 2px 0 0;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }
    .grupos {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      align-items: start;
    }
    @media (min-width: 768px) { .grupos { grid-template-columns: 1fr 1fr; } }

    .grupo { padding: 0; overflow: hidden; }
    .cabecera {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 8px 12px;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }
    .titulo-grupo {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font: var(--mat-sys-label-large);
    }
    .titulo-grupo mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .contador {
      font: var(--mat-sys-label-small);
      font-variant-numeric: tabular-nums;
      background: var(--mat-sys-surface);
      border-radius: var(--mat-sys-corner-full);
      padding: 2px 8px;
    }
    /* Máx. ~8 ítems visibles: el resto se alcanza con el scroll interno. */
    .items {
      display: flex;
      flex-direction: column;
      max-height: 288px;
      overflow-y: auto;
      padding: 4px 12px 8px;
    }
  `,
})
export class PermisosMenuFormComponent {
  /** Esquema del perfil seleccionado (define grupos, ítems y defaults del Excel). */
  readonly esquema = input.required<EsquemaPermisosMenu>();
  /** Permisos del usuario en edición (two-way binding). */
  readonly permisos = model.required<PermisosMenu>();

  iconoDe(icono: IconoGrupoPermiso): string {
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

  toggle(grupo: string, item: string, marcado: boolean): void {
    this.permisos.update((prev) => ({
      ...prev,
      [grupo]: { ...prev[grupo], [item]: marcado },
    }));
  }
}
