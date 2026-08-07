import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from '../../../core/services/theme.service';

/**
 * Botón flotante permanente que abre "Personalizar apariencia" con los temas
 * visuales de la plataforma, sobre `mat-fab` + `mat-menu`.
 * Solo presentación: delega la aplicación y persistencia al ThemeService.
 */
@Component({
  selector: 'app-theme-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatDividerModule, MatTooltipModule],
  template: `
    <button
      matFab
      class="flotante"
      [matMenuTriggerFor]="menu"
      aria-label="Personalizar apariencia"
      matTooltip="Personalizar apariencia"
      matTooltipPosition="left"
    >
      <mat-icon fontSet="material-symbols-outlined">palette</mat-icon>
    </button>

    <mat-menu #menu="matMenu" class="menu-temas">
      <div class="cabecera" (click)="$event.stopPropagation()">
        <p class="titulo">Personalizar apariencia</p>
        <p class="ayuda">
          El cambio se aplica al instante y se recuerda en este dispositivo.
        </p>
      </div>
      <mat-divider />

      @for (tema of servicio.temas; track tema.id) {
        <button mat-menu-item (click)="servicio.seleccionar(tema.id)" class="opcion">
          <mat-icon fontSet="material-symbols-outlined">
            {{ servicio.temaId() === tema.id ? 'radio_button_checked' : 'radio_button_unchecked' }}
          </mat-icon>
          <span class="cuerpo">
            <span class="nombre">{{ tema.nombre }}</span>
            <span class="descripcion">{{ tema.descripcion }}</span>
            <span class="muestra" aria-hidden="true">
              @for (c of tema.colores; track $index) {
                <span class="franja" [style.background]="c"></span>
              }
            </span>
          </span>
        </button>
      }

      <mat-divider />
      <div class="pie" (click)="$event.stopPropagation()">
        Los colores de estados y alertas se mantienen en todos los temas para conservar su significado.
      </div>
    </mat-menu>
  `,
  styles: `
    .flotante {
      position: fixed;
      right: 24px;
      bottom: 24px;
      z-index: 40;
    }
    .cabecera { padding: 12px 16px 8px; max-width: 320px; }
    .titulo { margin: 0; font: var(--mat-sys-title-small); }
    .ayuda {
      margin: 4px 0 0;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
      white-space: normal;
    }
    .opcion { height: auto; padding-block: 10px; }
    .cuerpo { display: flex; flex-direction: column; gap: 2px; max-width: 260px; }
    .nombre { font: var(--mat-sys-body-medium); }
    .descripcion {
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
      white-space: normal;
      line-height: 1.3;
    }
    .muestra { display: flex; gap: 4px; margin-top: 6px; }
    .franja { height: 10px; border-radius: 999px; flex: 1; }
    .franja:first-child { flex: 6; }
    .franja:nth-child(2) { flex: 3; }
    .pie {
      padding: 8px 16px;
      max-width: 320px;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
      white-space: normal;
    }
  `,
})
export class ThemeSwitcherComponent {
  readonly servicio = inject(ThemeService);
}
