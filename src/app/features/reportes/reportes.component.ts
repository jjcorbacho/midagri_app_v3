import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Reportes institucionales (en construcción en el sistema original). */
@Component({
  selector: 'app-reportes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="p-6 max-w-5xl mx-auto">
      <h1 class="text-2xl font-semibold mb-1">Reportes</h1>
      <p class="text-sm text-muted-foreground mb-6">Indicadores y exportes institucionales (en construcción).</p>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        @for (t of tarjetas; track t) {
          <div class="bg-card rounded-xl ring-1 ring-black/5 p-5">
            <div class="text-[11px] uppercase tracking-wider text-muted-foreground">{{ t }}</div>
            <div class="text-3xl font-semibold mt-2 text-brand">—</div>
          </div>
        }
      </div>
    </section>
  `,
})
export class ReportesComponent {
  readonly tarjetas = ['Eventos por área', 'Productores capacitados', 'Horas dictadas'];
}
