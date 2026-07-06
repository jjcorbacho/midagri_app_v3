import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import type { LucideIconData } from 'lucide-angular';

export type KpiTone = 'blue' | 'teal' | 'emerald' | 'indigo' | 'slate' | 'amber';

const TONE_MAP: Record<KpiTone, string> = {
  blue: 'bg-blue-50 text-blue-600',
  teal: 'bg-teal-50 text-teal-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  slate: 'bg-slate-100 text-slate-600',
  amber: 'bg-amber-50 text-amber-600',
};

/** Tarjeta KPI de la bandeja N1 (contador + ícono con tono). */
@Component({
  selector: 'app-kpi-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <div class="bg-card p-5 rounded-xl ring-1 ring-black/5 shadow-sm flex justify-between items-center">
      <div>
        <p class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{{ label() }}</p>
        <h3 class="text-3xl font-bold text-foreground tabular-nums">{{ value() }}</h3>
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
