import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { LucideAngularModule, Columns3 } from 'lucide-angular';
import { ModalComponent } from '../modal/modal.component';

/**
 * Definición de una columna configurable de tabla.
 * Añadir una columna nueva solo requiere sumar una entrada a la configuración
 * del componente que la usa (no hay lógica por columna en la tabla).
 */
export interface ColumnaTabla {
  /** Identificador estable usado en el template y en la persistencia. */
  id: string;
  nombre: string;
  visible: boolean;
  /** Columnas que no pueden ocultarse (checkbox deshabilitado y marcado). */
  obligatoria?: boolean;
  orden: number;
  /** Clases de ancho/alineación del `th` (design system del proyecto). */
  clase?: string;
}

/**
 * Selector de columnas visibles de una tabla (botón + modal estándar).
 *
 * Reutilizable por cualquier grilla del sistema: recibe la configuración de
 * columnas y emite la configuración actualizada en cada cambio. La preferencia
 * se persiste por tabla en `localStorage` mediante `storageKey`, igual que el
 * resto de preferencias de interfaz del proyecto (tema, sidebar).
 */
@Component({
  selector: 'app-column-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, ModalComponent],
  template: `
    <button type="button" (click)="abierto.set(true)" class="btn-secondary" aria-haspopup="dialog">
      <lucide-angular [img]="ColumnsIcon" class="size-4 text-brand" />
      <span>Columnas</span>
      <span class="text-[11px] font-bold tabular-nums text-muted-foreground">({{ totalVisibles() }})</span>
    </button>

    @if (abierto()) {
      <app-modal title="Columnas visibles" maxWidth="max-w-md" (closed)="abierto.set(false)">
        <p class="text-xs text-muted-foreground leading-relaxed">
          Seleccione las columnas que desea visualizar en la tabla. La preferencia se conserva
          para las próximas sesiones en este dispositivo.
        </p>

        <div
          class="mt-3 max-h-[50vh] overflow-y-auto thin-scroll rounded-xl ring-1 ring-border divide-y divide-border"
          role="group"
          aria-label="Columnas disponibles"
        >
          @for (col of columnasOrdenadas(); track col.id) {
            <label
              class="flex items-center gap-3 px-3 py-2.5 text-sm transition-colors select-none"
              [class]="col.obligatoria ? 'cursor-not-allowed bg-secondary/40' : 'cursor-pointer hover:bg-secondary/60'"
            >
              <input
                type="checkbox"
                class="accent-brand size-4 shrink-0"
                [checked]="col.visible"
                [disabled]="col.obligatoria"
                (change)="alternar(col, $any($event.target).checked)"
              />
              <span class="flex-1 text-foreground/90">{{ col.nombre }}</span>
              @if (col.obligatoria) {
                <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Fija</span>
              }
            </label>
          }
        </div>

        <div class="flex justify-between items-center gap-2 mt-5 pt-4 border-t border-border">
          <button type="button" (click)="restaurar()" class="btn-ghost px-3 text-xs">
            Restaurar por defecto
          </button>
          <button type="button" (click)="abierto.set(false)" class="btn-primary px-6 min-w-[110px]">
            Aceptar
          </button>
        </div>
      </app-modal>
    }
  `,
})
export class ColumnSelectorComponent {
  /** Configuración por defecto de las columnas de la tabla. */
  readonly columnas = input.required<ColumnaTabla[]>();
  /** Clave de persistencia (una por tabla). */
  readonly storageKey = input.required<string>();
  /** Configuración vigente tras aplicar la preferencia guardada y cada cambio. */
  readonly columnasChange = output<ColumnaTabla[]>();

  readonly ColumnsIcon = Columns3;
  readonly abierto = signal(false);

  private readonly estado = signal<ColumnaTabla[]>([]);
  readonly columnasOrdenadas = computed(() => [...this.estado()].sort((a, b) => a.orden - b.orden));
  readonly totalVisibles = computed(() => this.estado().filter((c) => c.visible).length);

  constructor() {
    // Estado inicial: configuración por defecto ⊕ preferencia persistida.
    effect(() => {
      const base = this.columnas();
      const guardadas = this.leerPreferencia();
      this.aplicar(
        base.map((c) => ({
          ...c,
          visible: c.obligatoria ? true : (guardadas?.[c.id] ?? c.visible),
        })),
        false,
      );
    });
  }

  alternar(col: ColumnaTabla, visible: boolean): void {
    if (col.obligatoria) return;
    this.aplicar(
      this.estado().map((c) => (c.id === col.id ? { ...c, visible } : c)),
      true,
    );
  }

  restaurar(): void {
    this.aplicar(this.columnas().map((c) => ({ ...c })), true);
  }

  /** Actualiza el estado, notifica al padre y (opcionalmente) persiste. */
  private aplicar(columnas: ColumnaTabla[], persistir: boolean): void {
    this.estado.set(columnas);
    this.columnasChange.emit(columnas);
    if (persistir) this.guardarPreferencia(columnas);
  }

  private leerPreferencia(): Record<string, boolean> | null {
    try {
      const crudo = localStorage.getItem(this.storageKey());
      return crudo ? (JSON.parse(crudo) as Record<string, boolean>) : null;
    } catch {
      return null; // Almacenamiento no disponible: se usan los valores por defecto.
    }
  }

  private guardarPreferencia(columnas: ColumnaTabla[]): void {
    try {
      const mapa = Object.fromEntries(columnas.map((c) => [c.id, c.visible]));
      localStorage.setItem(this.storageKey(), JSON.stringify(mapa));
    } catch {
      /* Sin persistencia: la preferencia aplica solo a la sesión actual. */
    }
  }
}
