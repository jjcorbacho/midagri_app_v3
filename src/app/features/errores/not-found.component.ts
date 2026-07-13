import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Pantalla 404 — manejo de rutas no encontradas. */
@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-background px-4">
      <div class="max-w-md text-center animate-page-in">
        <h1 class="text-7xl font-bold text-brand/20 select-none">404</h1>
        <h2 class="mt-4 text-h2">Página no encontrada</h2>
        <p class="mt-2 text-sm text-muted-foreground">
          La página que buscas no existe o ha sido movida.
        </p>
        <a routerLink="/" class="btn-primary mt-6">
          Ir al inicio
        </a>
      </div>
    </div>
  `,
})
export class NotFoundComponent {}
