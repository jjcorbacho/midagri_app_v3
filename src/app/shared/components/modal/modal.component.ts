import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LucideAngularModule, CircleCheck, Info, OctagonAlert, TriangleAlert } from 'lucide-angular';

/**
 * Variante visual del modal según el contexto del mensaje:
 *  - `warning` (ámbar)   → advertencias, confirmaciones y acciones que requieren atención
 *  - `error`   (rojo)    → errores, datos faltantes y validaciones bloqueantes
 *  - `success` (verde)   → operaciones completadas o verificadas
 *  - `info`    (celeste) → notas informativas que no bloquean el flujo
 */
export type TipoModalVisual = 'warning' | 'error' | 'success' | 'info';

interface EstiloVariante {
  icono: typeof Info;
  /** Fondo + color del disco del icono (tokens del tema activo). */
  tono: string;
}

const VARIANTES: Record<TipoModalVisual, EstiloVariante> = {
  warning: { icono: TriangleAlert, tono: 'bg-warning-soft text-warning-foreground' },
  error: { icono: OctagonAlert, tono: 'bg-destructive/10 text-destructive' },
  success: { icono: CircleCheck, tono: 'bg-success-soft text-success' },
  info: { icono: Info, tono: 'bg-info-soft text-info' },
};

/**
 * Componente base único de los modales del sistema (overlay + tarjeta centrada).
 *
 * Estructura estandarizada, en este orden:
 *   1. Icono grande centrado según la variante (`tipo`).
 *   2. Texto descriptivo centrado (`mensaje`).
 *   3. Contenido específico proyectado (formularios, tablas, inputs…).
 *   4. Botonera Cancelar / Aceptar (`mostrarAcciones`).
 *
 * Todas las secciones son opcionales: un modal informativo usa `tipo` +
 * `mensaje`; uno de formulario proyecta su contenido; y los que necesitan una
 * botonera propia la proyectan dejando `mostrarAcciones` en false. La lógica de
 * negocio permanece en cada componente: aquí solo vive la presentación.
 */
@Component({
  selector: 'app-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-[2px] p-4 animate-overlay-in"
      (click)="closed.emit()"
    >
      <div
        class="bg-card rounded-xl ring-1 ring-border shadow-lg w-full p-6 max-h-[calc(100vh-2rem)] overflow-y-auto thin-scroll animate-modal-in"
        [class]="maxWidth()"
        role="dialog"
        aria-modal="true"
        (click)="$event.stopPropagation()"
      >
        <div class="flex items-center justify-between gap-4 mb-4">
          <h3 class="text-h3 text-foreground">{{ title() }}</h3>
          <button
            (click)="closed.emit()"
            class="btn-icon -mr-1.5 -mt-1 text-xl leading-none"
            aria-label="Cerrar"
          >×</button>
        </div>

        <!-- 1. Icono principal de la variante -->
        @if (variante(); as v) {
          <div class="flex justify-center my-6">
            <div class="size-20 rounded-full flex items-center justify-center" [class]="v.tono" aria-hidden="true">
              <lucide-angular [img]="v.icono" class="size-10" />
            </div>
          </div>
        }

        <!-- 2. Texto descriptivo -->
        @if (mensaje()) {
          <p class="text-center text-sm sm:text-base text-foreground leading-relaxed px-2 sm:px-4">
            {{ mensaje() }}
          </p>
        }

        <!-- 3. Contenido específico del modal -->
        <div [class]="mensaje() || variante() ? 'mt-6' : ''">
          <ng-content />
        </div>

        <!-- 4. Botonera estándar -->
        @if (mostrarAcciones()) {
          <div class="flex flex-col-reverse sm:flex-row justify-center gap-2 mt-8">
            @if (mostrarCancelar()) {
              <button type="button" (click)="cancelado.emit()" class="btn-secondary w-full sm:w-auto sm:min-w-[130px]">
                {{ labelCancelar() }}
              </button>
            }
            <button
              type="button"
              (click)="aceptado.emit()"
              [disabled]="aceptarDeshabilitado()"
              class="btn-primary w-full sm:w-auto sm:min-w-[130px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ labelAceptar() }}
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export class ModalComponent {
  readonly title = input.required<string>();
  readonly maxWidth = input<string>('max-w-lg');
  /** Variante visual (icono + color); omitir en modales sin mensaje de estado. */
  readonly tipo = input<TipoModalVisual | undefined>(undefined);
  /** Texto descriptivo centrado bajo el icono. */
  readonly mensaje = input<string>('');
  /** Botonera estándar Cancelar / Aceptar. */
  readonly mostrarAcciones = input(false);
  readonly mostrarCancelar = input(true);
  readonly labelAceptar = input('Aceptar');
  readonly labelCancelar = input('Cancelar');
  readonly aceptarDeshabilitado = input(false);

  readonly closed = output<void>();
  readonly aceptado = output<void>();
  readonly cancelado = output<void>();

  readonly variante = computed<EstiloVariante | null>(() => {
    const t = this.tipo();
    return t ? VARIANTES[t] : null;
  });
}
