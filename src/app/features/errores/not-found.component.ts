import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Pantalla 404 — manejo de rutas no encontradas. */
@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-background px-4">
      <div class="max-w-md text-center">
        <h1 class="text-7xl font-bold text-foreground">404</h1>
        <h2 class="mt-4 text-xl font-semibold">Página no encontrada</h2>
        <p class="mt-2 text-sm text-muted-foreground">
          La página que buscas no existe o ha sido movida.
        </p>
        <a
          routerLink="/"
          class="mt-6 inline-flex items-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground"
        >
          Ir al inicio
        </a>
      </div>
    </div>
  `,
})
export class NotFoundComponent {}
