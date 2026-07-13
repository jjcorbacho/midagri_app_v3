import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Reportes institucionales (en construcción en el sistema original). */
@Component({
  selector: 'app-reportes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="p-6 lg:p-8 max-w-5xl mx-auto animate-page-in">
      <h1 class="text-h1 mb-1">Reportes</h1>
      <p class="text-sm text-muted-foreground mb-6">Indicadores y exportes institucionales (en construcción).</p>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        @for (t of tarjetas; track t) {
          <div class="bg-card rounded-xl ring-1 ring-border shadow-xs p-5 hover:shadow-md transition-shadow duration-200">
            <div class="text-caption">{{ t }}</div>
            <div class="kpi-number mt-2 text-brand">—</div>
          </div>
        }
      </div>
    </section>
  `,
})
export class ReportesComponent {
  readonly tarjetas = ['Eventos por área', 'Productores capacitados', 'Horas dictadas'];
}
