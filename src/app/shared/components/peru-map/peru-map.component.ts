import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  PERU_OUTLINE_D,
  REGION_LNGLAT_BBOX,
  SVG_HEIGHT,
  SVG_WIDTH,
  bboxToSvgRect,
  lngLatToSvg,
  svgToLngLat,
} from '../../utils/peru-regions.util';

interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

const PERU_VIEW: ViewBox = { x: 0, y: 0, w: SVG_WIDTH, h: SVG_HEIGHT };

/**
 * Mapa lateral compacto del Perú (SVG inline, sin librerías de mapas).
 * Zoom automático a la región elegida y clic para fijar coordenadas.
 */
@Component({
  selector: 'app-peru-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="mapa">
      <!-- Chip región activa -->
      <div class="region">
        <mat-icon fontSet="material-symbols-outlined">location_on</mat-icon>
        {{ region() ? 'Perú › ' + region() : 'Perú' }}
      </div>

      <!-- SVG mapa -->
      <svg
        #svgEl
        [attr.viewBox]="viewBoxAttr()"
        (click)="handleClick($event, $any(svgEl))"
        (pointermove)="moverArrastre($event, $any(svgEl))"
        (pointerup)="finalizarArrastre()"
        (pointerleave)="finalizarArrastre()"
        [class.inhabilitado]="disabled()"
        [class.seleccionable]="!disabled() && !!region()"
      >
        <!-- Contorno Perú -->
        <path [attr.d]="outlineD" class="contorno" [attr.stroke-width]="0.8" />

        <!-- Región resaltada -->
        @if (regionRect(); as r) {
          <rect
            [attr.x]="r.x" [attr.y]="r.y" [attr.width]="r.width" [attr.height]="r.height"
            class="resaltado"
            [attr.stroke-width]="1" stroke-dasharray="3 2" [attr.rx]="2"
          />
        }

        <!-- Pin (arrastrable: cada movimiento actualiza las coordenadas) -->
        @if (pinSvg(); as p) {
          <g
            [attr.transform]="'translate(' + p.x + ', ' + p.y + ')'"
            (pointerdown)="iniciarArrastre($event)"
            [class.arrastrable]="!disabled()"
            [class.arrastrando]="arrastrando()"
          >
            <circle [attr.r]="6" class="area-toque" />
            <circle [attr.r]="4" class="halo" />
            <circle [attr.r]="2.2" class="punto" [attr.stroke-width]="0.6" />
          </g>
        }
      </svg>

      <!-- Controles zoom -->
      <div class="controles">
        @if (showLocate()) {
          <button
            matIconButton
            type="button"
            class="control destacado"
            matTooltip="Centrar en mi ubicación"
            aria-label="Centrar en mi ubicación"
            (click)="locate.emit()"
          >
            <mat-icon fontSet="material-symbols-outlined">my_location</mat-icon>
          </button>
        }
        <button
          matIconButton
          type="button"
          class="control"
          matTooltip="Acercar"
          aria-label="Acercar"
          (click)="zoomBy(0.7)"
        >
          <mat-icon fontSet="material-symbols-outlined">add</mat-icon>
        </button>
        <button
          matIconButton
          type="button"
          class="control"
          matTooltip="Alejar"
          aria-label="Alejar"
          (click)="zoomBy(1.4)"
        >
          <mat-icon fontSet="material-symbols-outlined">remove</mat-icon>
        </button>
        <button
          matIconButton
          type="button"
          class="control"
          matTooltip="Ver Perú completo"
          aria-label="Restablecer vista"
          (click)="reset()"
        >
          <mat-icon fontSet="material-symbols-outlined">restart_alt</mat-icon>
        </button>
      </div>

      <!-- Ayuda inferior -->
      <p class="ayuda">
        {{ region()
          ? 'Haga clic dentro de la región para fijar el punto.'
          : 'Seleccione una región en Ubicación para activar la selección.' }}
      </p>
    </div>
  `,
  styles: `
    .mapa {
      position: relative;
      overflow: hidden;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-medium);
      background: var(--mat-sys-surface-container-low);
    }

    .region {
      position: absolute;
      top: 8px;
      left: 8px;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-small);
      background: var(--mat-sys-surface);
      font: var(--mat-sys-label-small);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--mat-sys-primary);
    }
    .region mat-icon { font-size: 14px; width: 14px; height: 14px; }

    svg {
      display: block;
      width: 100%;
      aspect-ratio: 13 / 19;
      touch-action: none;
      transition: all 400ms;
    }
    svg.inhabilitado { cursor: not-allowed; }
    svg.seleccionable { cursor: crosshair; }

    .contorno {
      fill: var(--mat-sys-surface-container-high);
      stroke: var(--mat-sys-outline-variant);
    }
    .resaltado {
      fill: color-mix(in srgb, var(--mat-sys-primary) 15%, transparent);
      stroke: var(--mat-sys-primary);
    }
    .arrastrable { cursor: grab; }
    .arrastrando { cursor: grabbing; }
    .area-toque { fill: transparent; }
    .halo {
      fill: color-mix(in srgb, var(--mat-sys-primary) 25%, transparent);
      pointer-events: none;
      /* El pin late para que se note dónde quedó el punto fijado. */
      animation: latido 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;
    }
    @keyframes latido {
      75%, 100% { transform: scale(2); opacity: 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .halo { animation: none; }
    }
    .punto {
      fill: var(--mat-sys-primary);
      stroke: var(--mat-sys-surface);
      pointer-events: none;
    }

    .controles {
      position: absolute;
      right: 8px;
      bottom: 40px;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    /* Controles compactos: el mapa es una columna lateral estrecha. */
    .controles .control {
      width: 32px;
      height: 32px;
      padding: 4px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-small);
      background: var(--mat-sys-surface);
      color: var(--mat-sys-on-surface-variant);
    }
    .controles .control.destacado {
      border-color: transparent;
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
    }
    .controles mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .ayuda {
      margin: 0;
      padding: 6px 12px;
      border-top: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface);
      font: var(--mat-sys-label-small);
      text-align: center;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class PeruMapComponent {
  readonly region = input<string | undefined>(undefined);
  readonly value = input<{ lng: number; lat: number } | null>(null);
  readonly disabled = input(false);
  /** Punto sobre el que centrar la vista (p. ej. la ubicación GPS del usuario). */
  readonly centro = input<{ lng: number; lat: number } | null>(null);
  /** Muestra el botón flotante de localización dentro del mapa. */
  readonly showLocate = input(false);
  readonly picked = output<{ lng: number; lat: number }>();
  /** El usuario pulsó el botón flotante de localización. */
  readonly locate = output<void>();

  readonly outlineD = PERU_OUTLINE_D;

  private readonly view = signal<ViewBox>(PERU_VIEW);
  readonly arrastrando = signal(false);

  readonly viewBoxAttr = computed(() => {
    const v = this.view();
    return `${v.x} ${v.y} ${v.w} ${v.h}`;
  });

  readonly regionRect = computed(() => {
    const r = this.region();
    if (!r) return null;
    const bbox = REGION_LNGLAT_BBOX[r];
    if (!bbox) return null;
    return bboxToSvgRect(bbox);
  });

  readonly pinSvg = computed(() => {
    const v = this.value();
    return v ? lngLatToSvg(v.lng, v.lat) : null;
  });

  constructor() {
    // Centrado bajo demanda (conserva el nivel de zoom actual)
    effect(() => {
      const c = this.centro();
      if (!c) return;
      const p = lngLatToSvg(c.lng, c.lat);
      this.view.update((v) => ({ x: p.x - v.w / 2, y: p.y - v.h / 2, w: v.w, h: v.h }));
    });
    // Zoom automático a la región seleccionada
    effect(() => {
      const rect = this.regionRect();
      if (!rect) {
        this.view.set(PERU_VIEW);
        return;
      }
      const pad = Math.max(rect.width, rect.height) * 0.25;
      this.view.set({
        x: rect.x - pad,
        y: rect.y - pad,
        w: rect.width + pad * 2,
        h: rect.height + pad * 2,
      });
    });
  }

  zoomBy(factor: number): void {
    this.view.update((v) => {
      const cx = v.x + v.w / 2;
      const cy = v.y + v.h / 2;
      const w = Math.min(Math.max(v.w * factor, SVG_WIDTH / 20), SVG_WIDTH);
      const h = Math.min(Math.max(v.h * factor, SVG_HEIGHT / 20), SVG_HEIGHT);
      return { x: cx - w / 2, y: cy - h / 2, w, h };
    });
  }

  reset(): void {
    this.view.set(PERU_VIEW);
  }

  handleClick(e: MouseEvent, svg: SVGSVGElement): void {
    this.emitirPuntoDesdeEvento(e, svg);
  }

  /* ===== Arrastre del pin: cada movimiento emite las nuevas coordenadas ===== */

  iniciarArrastre(e: PointerEvent): void {
    if (this.disabled()) return;
    e.stopPropagation();
    e.preventDefault();
    this.arrastrando.set(true);
  }

  moverArrastre(e: PointerEvent, svg: SVGSVGElement): void {
    if (!this.arrastrando()) return;
    this.emitirPuntoDesdeEvento(e, svg);
  }

  finalizarArrastre(): void {
    this.arrastrando.set(false);
  }

  private emitirPuntoDesdeEvento(e: MouseEvent, svg: SVGSVGElement): void {
    if (this.disabled()) return;
    const rect = svg.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    const v = this.view();
    const svgX = v.x + relX * v.w;
    const svgY = v.y + relY * v.h;

    // Si hay región activa, ignorar puntos fuera de su bbox
    const regionRect = this.regionRect();
    if (regionRect) {
      const inside =
        svgX >= regionRect.x &&
        svgX <= regionRect.x + regionRect.width &&
        svgY >= regionRect.y &&
        svgY <= regionRect.y + regionRect.height;
      if (!inside) return;
    }

    const { lng, lat } = svgToLngLat(svgX, svgY);
    this.picked.emit({
      lng: Number(lng.toFixed(4)),
      lat: Number(lat.toFixed(4)),
    });
  }
}
