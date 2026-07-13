import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import type { LucideIconData } from 'lucide-angular';

export type KpiTone = 'blue' | 'teal' | 'emerald' | 'indigo' | 'slate' | 'amber';

const TONE_MAP: Record<KpiTone, string> = {
  blue: 'bg-blue-50 text-blue-600',
  teal: 'bg-brand-soft text-brand',
  emerald: 'bg-success-soft text-success',
  indigo: 'bg-indigo-50 text-indigo-600',
  slate: 'bg-muted text-muted-foreground',
  amber: 'bg-warning-soft text-warning-foreground',
};

/** Tarjeta KPI de la bandeja N1 (contador + ícono con tono). */
@Component({
  selector: 'app-kpi-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <div class="bg-card p-5 rounded-xl ring-1 ring-border shadow-xs hover:shadow-md transition-shadow duration-200 flex justify-between items-center">
      <div>
        <p class="text-caption mb-1">{{ label() }}</p>
        <h3 class="kpi-number text-3xl">{{ value() }}</h3>
      </div>
      <div class="size-12 rounded-xl flex items-center justify-center" [class]="toneCls()">
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
