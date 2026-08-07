import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

/** Tonos del indicador; los nombres se conservan para no tocar los llamadores. */
export type KpiTone =
  | 'blue'
  | 'teal'
  | 'emerald'
  | 'indigo'
  | 'slate'
  | 'amber'
  | 'subsanado'
  | 'error';

const TONOS: Record<KpiTone, string> = {
  blue: 't-info',
  teal: 't-marca',
  emerald: 't-exito',
  indigo: 't-validado',
  slate: 't-neutro',
  amber: 't-alerta',
  /* Mismo token que el badge del estado "Enviado-Subsanado". */
  subsanado: 't-subsanado',
  /* Cuentas inhabilitadas y vigencias vencidas. */
  error: 't-error',
};

/**
 * Tarjeta KPI (contador + icono con tono).
 *
 * Con `interactivo` la tarjeta se comporta como filtro: su contenido pasa a
 * ser un botón que emite `seleccion`, y `seleccionado` marca el filtro activo
 * (así lo usa la grilla de Gestión de Usuarios).
 */
@Component({
  selector: 'app-kpi-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatIconModule, NgTemplateOutlet],
  template: `
    <mat-card appearance="outlined" class="kpi" [class.activa]="seleccionado()">
      @if (interactivo()) {
        <button
          type="button"
          class="contenido disparador"
          [attr.aria-pressed]="seleccionado()"
          (click)="seleccion.emit()"
        >
          <ng-container [ngTemplateOutlet]="cuerpo" />
        </button>
      } @else {
        <mat-card-content class="contenido">
          <ng-container [ngTemplateOutlet]="cuerpo" />
        </mat-card-content>
      }
    </mat-card>

    <ng-template #cuerpo>
      <span class="datos">
        <span class="etiqueta">{{ label() }}</span>
        <span class="valor">{{ value() }}</span>
      </span>
      <span class="disco" [class]="toneCls()" aria-hidden="true">
        <mat-icon fontSet="material-symbols-outlined">{{ icon() }}</mat-icon>
      </span>
    </ng-template>
  `,
  styles: `
    .kpi { height: 100%; }
    .kpi.activa {
      border-color: var(--mat-sys-primary);
      box-shadow: var(--mat-sys-level1);
    }
    .contenido {
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
    }
    /* El disparador ocupa toda la tarjeta para que el área de clic coincida. */
    .disparador {
      width: 100%;
      padding: 16px;
      border: 0;
      background: none;
      font: inherit;
      color: inherit;
      text-align: left;
      cursor: pointer;
      border-radius: inherit;
      transition: background-color 120ms ease;
    }
    .disparador:hover { background: var(--mat-sys-surface-container-low); }
    .disparador:focus-visible { outline: 2px solid var(--mat-sys-primary); outline-offset: -2px; }

    .datos { display: flex; flex-direction: column; min-width: 0; }
    .etiqueta {
      margin: 0 0 4px;
      font: var(--mat-sys-label-medium);
      color: var(--mat-sys-on-surface-variant);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .valor {
      margin: 0;
      font: var(--mat-sys-headline-medium);
      color: var(--mat-sys-on-surface);
      font-variant-numeric: tabular-nums;
    }
    .disco {
      width: 48px; height: 48px; flex: 0 0 48px;
      border-radius: var(--mat-sys-corner-medium);
      display: flex; align-items: center; justify-content: center;
    }
    .t-info     { background: var(--mat-sys-secondary-container); color: var(--mat-sys-on-secondary-container); }
    .t-marca    { background: var(--mat-sys-primary-container);   color: var(--mat-sys-on-primary-container); }
    .t-exito    { background: var(--estado-aprobado-fondo);       color: var(--estado-aprobado); }
    .t-validado { background: var(--estado-validado-fondo);       color: var(--estado-validado); }
    .t-neutro   { background: var(--mat-sys-surface-container-highest); color: var(--mat-sys-on-surface-variant); }
    .t-alerta   { background: var(--estado-enviado-fondo);        color: var(--estado-enviado); }
    .t-subsanado{ background: var(--estado-subsanado-fondo);      color: var(--estado-subsanado); }
    .t-error    { background: var(--mat-sys-error-container);     color: var(--mat-sys-on-error-container); }
  `,
})
export class KpiCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  /** Ligadura de Material Symbols. */
  readonly icon = input.required<string>();
  readonly tone = input.required<KpiTone>();
  /** La tarjeta actúa como filtro seleccionable. */
  readonly interactivo = input(false);
  readonly seleccionado = input(false);
  readonly seleccion = output<void>();
  readonly toneCls = computed(() => TONOS[this.tone()]);
}
