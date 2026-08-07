import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

/** Tonos del indicador; los nombres se conservan para no tocar los llamadores. */
export type KpiTone = 'blue' | 'teal' | 'emerald' | 'indigo' | 'slate' | 'amber' | 'subsanado';

const TONOS: Record<KpiTone, string> = {
  blue: 't-info',
  teal: 't-marca',
  emerald: 't-exito',
  indigo: 't-validado',
  slate: 't-neutro',
  amber: 't-alerta',
  /* Mismo token que el badge del estado "Enviado-Subsanado". */
  subsanado: 't-subsanado',
};

/** Tarjeta KPI de la bandeja N1 (contador + icono con tono). */
@Component({
  selector: 'app-kpi-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatIconModule],
  template: `
    <mat-card appearance="outlined" class="kpi">
      <mat-card-content class="contenido">
        <div class="datos">
          <p class="etiqueta">{{ label() }}</p>
          <p class="valor">{{ value() }}</p>
        </div>
        <div class="disco" [class]="toneCls()" aria-hidden="true">
          <mat-icon fontSet="material-symbols-outlined">{{ icon() }}</mat-icon>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .kpi { height: 100%; }
    .contenido {
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
    }
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
  `,
})
export class KpiCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  /** Ligadura de Material Symbols. */
  readonly icon = input.required<string>();
  readonly tone = input.required<KpiTone>();
  readonly toneCls = computed(() => TONOS[this.tone()]);
}
