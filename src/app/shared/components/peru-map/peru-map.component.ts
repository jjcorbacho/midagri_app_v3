import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { LucideAngularModule, LocateFixed, MapPin, Plus, Minus, RotateCcw } from 'lucide-angular';
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
  imports: [LucideAngularModule],
  template: `
    <div class="relative bg-secondary/40 ring-1 ring-border rounded-lg overflow-hidden">
      <!-- Chip región activa -->
      <div class="absolute top-2 left-2 z-10 flex items-center gap-1.5 bg-card/90 backdrop-blur px-2 py-1 rounded-md ring-1 ring-border text-[10px] font-semibold uppercase tracking-wide text-brand shadow-sm">
        <lucide-angular [img]="MapPinIcon" class="size-3" />
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
        class="w-full aspect-[13/19] block touch-none"
        [class.cursor-not-allowed]="disabled()"
        [class.cursor-crosshair]="!disabled() && !!region()"
        style="transition-property: all; transition-duration: 400ms"
      >
        <!-- Contorno Perú -->
        <path [attr.d]="outlineD" class="fill-muted stroke-border" [attr.stroke-width]="0.8" />

        <!-- Región resaltada -->
        @if (regionRect(); as r) {
          <rect
            [attr.x]="r.x" [attr.y]="r.y" [attr.width]="r.width" [attr.height]="r.height"
            class="fill-brand/15 stroke-brand"
            [attr.stroke-width]="1" stroke-dasharray="3 2" [attr.rx]="2"
          />
        }

        <!-- Pin (arrastrable: cada movimiento actualiza las coordenadas) -->
        @if (pinSvg(); as p) {
          <g
            [attr.transform]="'translate(' + p.x + ', ' + p.y + ')'"
            (pointerdown)="iniciarArrastre($event)"
            [class.cursor-grab]="!disabled()"
            [class.cursor-grabbing]="arrastrando()"
          >
            <circle [attr.r]="6" class="fill-transparent" />
            <circle [attr.r]="4" class="fill-brand/25 animate-ping pointer-events-none" />
            <circle [attr.r]="2.2" class="fill-brand stroke-card pointer-events-none" [attr.stroke-width]="0.6" />
          </g>
        }
      </svg>

      <!-- Controles zoom -->
      <div class="absolute bottom-2 right-2 z-10 flex flex-col gap-1">
        @if (showLocate()) {
          <button type="button" (click)="locate.emit()" aria-label="Centrar en mi ubicación" title="Centrar en mi ubicación"
            class="size-7 rounded-md bg-primary text-primary-foreground shadow-sm flex items-center justify-center hover:bg-primary/85 transition-colors">
            <lucide-angular [img]="LocateFixedIcon" class="size-3.5" />
          </button>
        }
        <button type="button" (click)="zoomBy(0.7)" aria-label="Acercar" title="Acercar"
          class="size-7 rounded-md bg-card ring-1 ring-border shadow-sm flex items-center justify-center text-foreground/70 hover:text-brand hover:ring-brand transition-colors">
          <lucide-angular [img]="PlusIcon" class="size-3.5" />
        </button>
        <button type="button" (click)="zoomBy(1.4)" aria-label="Alejar" title="Alejar"
          class="size-7 rounded-md bg-card ring-1 ring-border shadow-sm flex items-center justify-center text-foreground/70 hover:text-brand hover:ring-brand transition-colors">
          <lucide-angular [img]="MinusIcon" class="size-3.5" />
        </button>
        <button type="button" (click)="reset()" aria-label="Restablecer vista" title="Ver Perú completo"
          class="size-7 rounded-md bg-card ring-1 ring-border shadow-sm flex items-center justify-center text-foreground/70 hover:text-brand hover:ring-brand transition-colors">
          <lucide-angular [img]="RotateCcwIcon" class="size-3.5" />
        </button>
      </div>

      <!-- Ayuda inferior -->
      <div class="px-3 py-1.5 bg-card/80 border-t border-border text-[10px] text-muted-foreground text-center leading-tight">
        {{ region()
          ? 'Haga clic dentro de la región para fijar el punto.'
          : 'Seleccione una región en Ubicación para activar la selección.' }}
      </div>
    </div>
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

  readonly MapPinIcon = MapPin;
  readonly LocateFixedIcon = LocateFixed;
  readonly PlusIcon = Plus;
  readonly MinusIcon = Minus;
  readonly RotateCcwIcon = RotateCcw;
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
