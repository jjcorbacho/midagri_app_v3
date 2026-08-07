import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';

export interface ColumnaTabla {
  /** Identificador estable usado en el template y en la persistencia. */
  id: string;
  nombre: string;
  visible: boolean;
  /** Columnas que no pueden ocultarse (checkbox deshabilitado y marcado). */
  obligatoria?: boolean;
  orden: number;
  /** Clases de ancho/alineación del `th`. */
  clase?: string;
}

/**
 * Selector de columnas visibles de una tabla, sobre `mat-menu` con
 * `mat-checkbox`. Conserva la API previa (columnas, storageKey y la salida
 * columnasChange) y la persistencia por tabla en localStorage.
 */
@Component({
  selector: 'app-column-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatMenuModule, MatButtonModule, MatIconModule, MatCheckboxModule, MatDividerModule],
  template: `
    <button matButton [matMenuTriggerFor]="menu" aria-label="Configurar columnas visibles">
      <mat-icon fontSet="material-symbols-outlined">view_column</mat-icon>
      Columnas ({{ visibles().length }})
    </button>

    <mat-menu #menu="matMenu" class="menu-columnas">
      <div class="cabecera" (click)="$event.stopPropagation()">
        <span>Columnas visibles</span>
      </div>
      <mat-divider />
      @for (c of ordenadas(); track c.id) {
        <div class="fila" (click)="$event.stopPropagation()">
          <mat-checkbox
            [checked]="c.visible"
            [disabled]="!!c.obligatoria"
            (change)="alternar(c.id, $event.checked)"
          >{{ c.nombre }}</mat-checkbox>
        </div>
      }
      <mat-divider />
      <div class="pie" (click)="$event.stopPropagation()">
        <button matButton (click)="restablecer()">Restablecer</button>
      </div>
    </mat-menu>
  `,
  styles: `
    .cabecera {
      padding: 8px 16px;
      font: var(--mat-sys-label-large);
      color: var(--mat-sys-on-surface-variant);
    }
    .fila { padding: 4px 16px; }
    .pie { padding: 4px 8px; display: flex; justify-content: flex-end; }
  `,
})
export class ColumnSelectorComponent {
  readonly columnas = input.required<ColumnaTabla[]>();
  readonly storageKey = input.required<string>();
  readonly columnasChange = output<ColumnaTabla[]>();

  /** Snapshot inicial para poder restablecer. */
  private readonly inicial = signal<ColumnaTabla[] | null>(null);

  readonly ordenadas = computed(() => [...this.columnas()].sort((a, b) => a.orden - b.orden));
  readonly visibles = computed(() => this.columnas().filter((c) => c.visible));

  alternar(id: string, visible: boolean): void {
    if (!this.inicial()) this.inicial.set(this.columnas().map((c) => ({ ...c })));
    const siguiente = this.columnas().map((c) =>
      c.id === id && !c.obligatoria ? { ...c, visible } : c,
    );
    this.persistir(siguiente);
    this.columnasChange.emit(siguiente);
  }

  restablecer(): void {
    const base = this.inicial() ?? this.columnas();
    const siguiente = base.map((c) => ({ ...c, visible: true }));
    this.persistir(siguiente);
    this.columnasChange.emit(siguiente);
  }

  /** Persistencia por tabla (misma clave que la versión anterior). */
  private persistir(cols: ColumnaTabla[]): void {
    try {
      const ocultas = cols.filter((c) => !c.visible).map((c) => c.id);
      localStorage.setItem(this.storageKey(), JSON.stringify(ocultas));
    } catch { /* noop */ }
  }
}
