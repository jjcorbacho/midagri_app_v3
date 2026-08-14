import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import type { LucideIconData } from 'lucide-angular';

export type KpiTone = 'blue' | 'teal' | 'emerald' | 'indigo' | 'slate' | 'amber' | 'subsanado';

const TONE_MAP: Record<KpiTone, string> = {
  blue: 'bg-info-soft text-info',
  teal: 'bg-brand-soft text-brand',
  emerald: 'bg-success-soft text-success',
  indigo: 'bg-state-validado-soft text-state-validado',
  slate: 'bg-muted text-muted-foreground',
  amber: 'bg-warning-soft text-warning-foreground',
  /* Mismo token que el badge del estado "Enviado-subsanado" (app-estado-badge). */
  subsanado: 'bg-state-subsanado-soft text-state-subsanado-foreground',
};

/** Tarjeta KPI de la bandeja N1 (contador + ícono con tono). */
@Component({
  selector: 'app-kpi-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <!-- h-full: la tarjeta ocupa toda la celda del grid, así las etiquetas de
         una y dos líneas quedan a la misma altura en la fila. El bloque de
         texto se estira y reparte (etiqueta arriba, cifra abajo) para que los
         números queden alineados entre tarjetas. -->
    <div class="bg-card h-full p-5 rounded-xl ring-1 ring-border shadow-xs hover:shadow-md transition-shadow duration-200 flex justify-between items-stretch gap-1">
      <div class="flex flex-col justify-between">
        <p class="text-caption mb-1">{{ label() }}</p>
        <h3 class="kpi-number text-3xl">{{ value() }}</h3>
      </div>
      <!-- shrink-0: sin esto el flex comprime el ancho del recuadro cuando la
           etiqueta es larga y el ícono queda ovalado (33×48 en vez de 48×48). -->
      <div class="size-12 shrink-0 self-center rounded-xl flex items-center justify-center" [class]="toneCls()">
        <lucide-angular [img]="icon()" class="size-6" />
      </div>
    </div>
  `,
})
export class KpiCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  readonly icon = input.required<LucideIconData>();
  readonly tone = input.required<KpiTone>();
  readonly toneCls = computed(() => TONE_MAP[this.tone()]);
}
