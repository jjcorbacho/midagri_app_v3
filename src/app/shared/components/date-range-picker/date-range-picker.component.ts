import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { LucideAngularModule, Calendar, ChevronLeft, ChevronRight, X } from 'lucide-angular';

/** Rango emitido por el selector (fechas ISO `YYYY-MM-DD`; '' = sin límite). */
export interface RangoFechas {
  desde: string;
  hasta: string;
}

interface CeldaDia {
  iso: string;
  dia: number;
  delMes: boolean;
}

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
const MESES_LARGOS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const aIso = (a: number, m: number, d: number): string =>
  `${a}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

const isoADdmm = (iso: string): string => {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
};

/**
 * Selector de rango de fechas del design system N1 (calendario flotante
 * propio, sin librerías externas ni diálogos del navegador).
 *
 * Primer clic fija la fecha inicial, el segundo la final (se reordenan si
 * llegan invertidas), el rango queda resaltado y el panel se cierra solo al
 * completar la selección. "Limpiar" reinicia y notifica al padre.
 */
@Component({
  selector: 'app-date-range-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  host: { '(document:keydown.escape)': 'cerrar()' },
  template: `
    <div class="relative" (focusout)="onFocusOut($event)">
      <!-- Disparador con apariencia de input del sistema -->
      <button
        type="button"
        (click)="alternar()"
        [attr.aria-expanded]="abierto()"
        aria-haspopup="dialog"
        [attr.aria-label]="'Rango de fechas' + (etiqueta() ? ': ' + etiqueta() : '')"
        class="w-full bg-card ring-1 ring-border rounded-lg px-3 py-2 text-sm text-left flex items-center gap-2 hover:ring-muted-foreground/30 focus:ring-2 focus:ring-ring focus:outline-none transition-[box-shadow] duration-150"
      >
        <lucide-angular [img]="CalendarIcon" class="size-4 text-muted-foreground shrink-0" />
        <span class="flex-1 truncate" [class]="etiqueta() ? 'text-foreground' : 'text-muted-foreground/70'">
          {{ etiqueta() || 'Rango de fechas' }}
        </span>
        @if (etiqueta()) {
          <span
            role="button"
            tabindex="0"
            aria-label="Limpiar rango de fechas"
            (click)="limpiar($event)"
            (keydown.enter)="limpiar($event)"
            class="p-0.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
          >
            <lucide-angular [img]="XIcon" class="size-3.5" />
          </span>
        }
      </button>

      @if (abierto()) {
        <div
          role="dialog"
          aria-label="Seleccionar rango de fechas"
          class="absolute z-50 mt-1 w-72 max-w-[calc(100vw-2rem)] rounded-xl bg-popover ring-1 ring-border shadow-lg p-3 animate-modal-in"
        >
          <!-- Cabecera de mes -->
          <div class="flex items-center justify-between mb-2">
            <button type="button" (click)="moverMes(-1)" aria-label="Mes anterior" class="btn-icon size-7">
              <lucide-angular [img]="ChevronLeftIcon" class="size-4" />
            </button>
            <p class="text-sm font-bold text-foreground" aria-live="polite">
              {{ nombreMes() }} {{ anioVisible() }}
            </p>
            <button type="button" (click)="moverMes(1)" aria-label="Mes siguiente" class="btn-icon size-7">
              <lucide-angular [img]="ChevronRightIcon" class="size-4" />
            </button>
          </div>

          <!-- Días de la semana -->
          <div class="grid grid-cols-7 mb-1">
            @for (d of diasSemana; track d) {
              <span class="text-center text-[10px] font-bold uppercase text-muted-foreground py-1">{{ d }}</span>
            }
          </div>

          <!-- Cuadrícula de días -->
          <div class="grid grid-cols-7 gap-y-0.5">
            @for (celda of celdas(); track celda.iso) {
              <button
                type="button"
                (click)="elegirDia(celda)"
                [attr.aria-label]="'Día ' + celda.iso"
                [attr.aria-pressed]="esExtremo(celda.iso)"
                class="h-8 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                [class]="claseDia(celda)"
              >{{ celda.dia }}</button>
            }
          </div>

          <!-- Pie: estado y limpiar -->
          <div class="flex items-center justify-between mt-2 pt-2 border-t border-border">
            <p class="text-[11px] text-muted-foreground">
              {{ inicioTentativo() && !desde() ? 'Seleccione la fecha final' : 'Seleccione la fecha inicial' }}
            </p>
            <button type="button" (click)="limpiar($event)" class="btn-ghost h-7 px-2 text-xs">
              Limpiar
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class DateRangePickerComponent {
  /** Rango vigente (ISO); el padre es la fuente de la verdad. */
  readonly desde = input('');
  readonly hasta = input('');
  readonly rangoChange = output<RangoFechas>();

  readonly CalendarIcon = Calendar;
  readonly ChevronLeftIcon = ChevronLeft;
  readonly ChevronRightIcon = ChevronRight;
  readonly XIcon = X;
  readonly diasSemana = DIAS_SEMANA;

  readonly abierto = signal(false);
  /** Fecha inicial provisional mientras se elige la final. */
  readonly inicioTentativo = signal('');

  private readonly hoy = new Date();
  readonly anioVisible = signal(this.hoy.getFullYear());
  readonly mesVisible = signal(this.hoy.getMonth());

  readonly nombreMes = computed(() => MESES_LARGOS[this.mesVisible()]);

  readonly etiqueta = computed(() => {
    const d = this.desde();
    const h = this.hasta();
    if (!d && !h) return '';
    return `${d ? isoADdmm(d) : '…'} – ${h ? isoADdmm(h) : '…'}`;
  });

  /** 6 semanas visibles comenzando en lunes (celdas fuera del mes atenuadas). */
  readonly celdas = computed<CeldaDia[]>(() => {
    const a = this.anioVisible();
    const m = this.mesVisible();
    const primerDia = new Date(a, m, 1);
    const offset = (primerDia.getDay() + 6) % 7; // lunes = 0
    const inicio = new Date(a, m, 1 - offset);
    return Array.from({ length: 42 }, (_, i) => {
      const f = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i);
      return {
        iso: aIso(f.getFullYear(), f.getMonth(), f.getDate()),
        dia: f.getDate(),
        delMes: f.getMonth() === m,
      };
    });
  });

  alternar(): void {
    if (this.abierto()) {
      this.cerrar();
      return;
    }
    // Abre en el mes de la fecha inicial vigente (o el actual).
    const base = this.desde() || this.hasta();
    if (base) {
      const [a, m] = base.split('-').map(Number);
      this.anioVisible.set(a);
      this.mesVisible.set(m - 1);
    }
    this.inicioTentativo.set('');
    this.abierto.set(true);
  }

  cerrar(): void {
    this.abierto.set(false);
    this.inicioTentativo.set('');
  }

  moverMes(delta: number): void {
    const total = this.mesVisible() + delta;
    this.anioVisible.update((a) => a + Math.floor((total + 12) / 12) - 1);
    this.mesVisible.set(((total % 12) + 12) % 12);
  }

  elegirDia(celda: CeldaDia): void {
    const inicio = this.inicioTentativo();
    if (!inicio) {
      this.inicioTentativo.set(celda.iso);
      // Selección en curso: se limpia el rango anterior visualmente.
      this.rangoChange.emit({ desde: '', hasta: '' });
      return;
    }
    const [d, h] = inicio <= celda.iso ? [inicio, celda.iso] : [celda.iso, inicio];
    this.rangoChange.emit({ desde: d, hasta: h });
    this.cerrar();
  }

  limpiar(ev: Event): void {
    ev.stopPropagation();
    this.inicioTentativo.set('');
    this.rangoChange.emit({ desde: '', hasta: '' });
  }

  esExtremo(iso: string): boolean {
    return iso === this.desde() || iso === this.hasta() || iso === this.inicioTentativo();
  }

  claseDia(celda: CeldaDia): string {
    const base = celda.delMes ? '' : 'opacity-35 ';
    if (this.esExtremo(celda.iso)) return base + 'bg-primary text-primary-foreground rounded-md font-bold';
    const d = this.desde();
    const h = this.hasta();
    if (d && h && celda.iso > d && celda.iso < h) return base + 'bg-brand-soft text-brand';
    return base + 'text-foreground/85 hover:bg-secondary rounded-md';
  }

  onFocusOut(ev: FocusEvent): void {
    const contenedor = ev.currentTarget as HTMLElement;
    if (!contenedor.contains(ev.relatedTarget as Node | null)) this.cerrar();
  }
}
