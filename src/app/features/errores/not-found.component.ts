import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

/** Pantalla 404 — manejo de rutas no encontradas. */
@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule],
  template: `
    <div class="pantalla">
      <div class="contenido">
        <p class="codigo" aria-hidden="true">404</p>
        <h1>Página no encontrada</h1>
        <p class="detalle">La página que buscas no existe o ha sido movida.</p>
        <a matButton="filled" routerLink="/">Ir al inicio</a>
      </div>
    </div>
  `,
  styles: `
    .pantalla {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 16px;
      background: var(--mat-sys-surface);
    }
    .contenido { max-width: 28rem; text-align: center; }
    .codigo {
      margin: 0;
      font: var(--mat-sys-display-large);
      font-weight: 700;
      user-select: none;
      color: color-mix(in srgb, var(--mat-sys-primary) 25%, transparent);
    }
    .contenido h1 {
      margin: 16px 0 0;
      font: var(--mat-sys-headline-small);
      color: var(--mat-sys-on-surface);
    }
    .detalle {
      margin: 8px 0 24px;
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class NotFoundComponent {}
