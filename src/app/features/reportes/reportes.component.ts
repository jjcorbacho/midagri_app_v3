import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

/** Reportes institucionales (en construcción en el sistema original). */
@Component({
  selector: 'app-reportes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule],
  template: `
    <section class="pagina">
      <header class="cabecera">
        <h1>Reportes</h1>
        <p>Indicadores y exportes institucionales (en construcción).</p>
      </header>

      <div class="tarjetas">
        @for (t of tarjetas; track t) {
          <mat-card appearance="outlined">
            <span class="etiqueta">{{ t }}</span>
            <p class="valor">—</p>
          </mat-card>
        }
      </div>
    </section>
  `,
  styles: `
    .pagina {
      padding: 24px;
      max-width: 1100px;
      margin: 0 auto;
    }
    @media (min-width: 1024px) { .pagina { padding: 32px; } }

    .cabecera { margin-bottom: 24px; }
    .cabecera h1 {
      margin: 0;
      font: var(--mat-sys-headline-small);
      color: var(--mat-sys-on-surface);
    }
    .cabecera p {
      margin: 4px 0 0;
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
    }

    .tarjetas {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 16px;
    }
    @media (min-width: 640px) { .tarjetas { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

    mat-card { padding: 20px; }
    .etiqueta {
      font: var(--mat-sys-label-medium);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--mat-sys-on-surface-variant);
    }
    .valor {
      margin: 8px 0 0;
      font: var(--mat-sys-headline-medium);
      font-variant-numeric: tabular-nums;
      color: var(--mat-sys-primary);
    }
  `,
})
export class ReportesComponent {
  readonly tarjetas = ['Eventos por área', 'Productores capacitados', 'Horas dictadas'];
}
