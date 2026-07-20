import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LucideAngularModule, Check, Palette, X } from 'lucide-angular';
import { ThemeService } from '../../../core/services/theme.service';

/**
 * Botón flotante permanente (lado derecho) que abre el panel
 * "Personalizar apariencia" con los temas visuales de la plataforma.
 * Solo presentación: delega la aplicación y persistencia al ThemeService.
 */
@Component({
  selector: 'app-theme-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  host: { '(document:keydown.escape)': 'cerrar()' },
  template: `
    <!-- Botón flotante permanente -->
    <button
      type="button"
      (click)="abierto.set(!abierto())"
      aria-label="Personalizar apariencia"
      title="Personalizar apariencia"
      [attr.aria-expanded]="abierto()"
      class="fixed right-4 bottom-6 z-40 size-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
    >
      <lucide-angular [img]="PaletteIcon" class="size-5" />
    </button>

    @if (abierto()) {
      <!-- Fondo del panel -->
      <div class="fixed inset-0 z-40 bg-foreground/30 animate-overlay-in" (click)="cerrar()" aria-hidden="true"></div>

      <!-- Panel lateral -->
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Personalizar apariencia"
        class="fixed right-0 top-0 z-50 h-full w-full max-w-xs bg-card shadow-lg ring-1 ring-border flex flex-col animate-modal-in"
      >
        <header class="flex items-center justify-between gap-2 px-5 py-4 border-b border-border">
          <div class="flex items-center gap-2 text-brand">
            <lucide-angular [img]="PaletteIcon" class="size-4" />
            <h2 class="text-sm font-bold text-foreground">Personalizar apariencia</h2>
          </div>
          <button type="button" (click)="cerrar()" aria-label="Cerrar panel de apariencia" class="btn-icon">
            <lucide-angular [img]="XIcon" class="size-4" />
          </button>
        </header>

        <p class="px-5 pt-3 text-xs text-muted-foreground leading-relaxed">
          Elija el tema visual de la plataforma. El cambio se aplica al instante y se recuerda en este dispositivo.
        </p>

        <div class="flex-1 overflow-y-auto thin-scroll p-4 space-y-2" role="radiogroup" aria-label="Temas visuales">
          @for (tema of servicio.temas; track tema.id) {
            <button
              type="button"
              role="radio"
              [attr.aria-checked]="servicio.temaId() === tema.id"
              (click)="servicio.seleccionar(tema.id)"
              class="w-full text-left rounded-xl p-3 ring-1 transition-colors"
              [class]="
                servicio.temaId() === tema.id
                  ? 'bg-brand-soft ring-brand/40'
                  : 'bg-card ring-border hover:bg-secondary/60'
              "
            >
              <span class="flex items-center justify-between gap-2">
                <span class="text-sm font-semibold text-foreground">{{ tema.nombre }}</span>
                @if (servicio.temaId() === tema.id) {
                  <lucide-angular [img]="CheckIcon" class="size-4 text-brand shrink-0" />
                }
              </span>
              <span class="mt-1 block text-[11px] text-muted-foreground leading-snug">{{ tema.descripcion }}</span>
              <!-- Vista previa 60-30-10 -->
              <span class="mt-2 flex items-center gap-1.5" aria-hidden="true">
                <span class="h-3 flex-[6] rounded-full" [style.background]="tema.colores[0]"></span>
                <span class="h-3 flex-[3] rounded-full" [style.background]="tema.colores[1]"></span>
                <span class="h-3 flex-[1] rounded-full" [style.background]="tema.colores[2]"></span>
              </span>
            </button>
          }
        </div>

        <footer class="px-5 py-3 border-t border-border">
          <p class="text-[11px] text-muted-foreground leading-relaxed">
            Los colores de estados y alertas se mantienen en todos los temas para conservar su significado.
          </p>
        </footer>
      </aside>
    }
  `,
})
export class ThemeSwitcherComponent {
  readonly servicio = inject(ThemeService);
  readonly abierto = signal(false);

  readonly PaletteIcon = Palette;
  readonly XIcon = X;
  readonly CheckIcon = Check;

  cerrar(): void {
    this.abierto.set(false);
  }
}
