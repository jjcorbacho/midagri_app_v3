import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, Sliders, Wrench } from 'lucide-angular';
import type { LucideIconData } from 'lucide-angular';

interface TabConfiguracion {
  to: string;
  label: string;
  icon: LucideIconData;
}

/**
 * Pestañas de Configuración: estructura de formulario ↔ reglas.
 *
 * Son navegación real entre vistas (`routerLink`), no un selector interno, y
 * la pestaña activa la resuelve el propio router mediante `routerLinkActive`:
 * la URL es la única fuente de verdad, así que entrar por el menú lateral, por
 * las pestañas o escribiendo la ruta produce siempre el mismo estado.
 */
@Component({
  selector: 'app-configuracion-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <!-- En móvil las dos pestañas se apilan en lugar de quedar fuera del
         borde; en escritorio siguen en una sola línea. -->
    <div
      class="inline-flex flex-wrap gap-1 max-w-full p-1 bg-card ring-1 ring-border rounded-lg"
      role="tablist"
      aria-label="Configuración"
    >
      @for (t of tabs; track t.to) {
        <a
          [routerLink]="t.to"
          routerLinkActive
          #rla="routerLinkActive"
          [routerLinkActiveOptions]="{ exact: true }"
          role="tab"
          [attr.aria-selected]="rla.isActive"
          class="h-8 px-3 rounded-md text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap"
          [class]="rla.isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'"
        >
          <lucide-angular [img]="t.icon" class="size-4 shrink-0" />
          {{ t.label }}
        </a>
      }
    </div>
  `,
})
export class ConfiguracionTabsComponent {
  readonly tabs: TabConfiguracion[] = [
    { to: '/configuracion/estructura-formulario', label: 'Configuración de Campos', icon: Sliders },
    { to: '/configuracion/reglas', label: 'Configuración de reglas', icon: Wrench },
  ];
}
