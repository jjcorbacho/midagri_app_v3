import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { LucideAngularModule, Search, X } from 'lucide-angular';
import { INPUT_BASE, INPUT_DISABLED } from '../../utils/input-styles.const';
import { normalizarBusqueda } from '../../utils/texto.util';

let siguienteId = 0;

/**
 * Buscador inteligente (combobox WAI-ARIA) del design system N1.
 *
 * Filtra en vivo una lista de opciones planas (case/tilde-insensitive,
 * debounce 250 ms), con navegación por teclado (↑/↓, Enter selecciona,
 * Escape cierra) y scroll automático a la opción activa. La fuente de
 * datos la provee el padre; el componente no consulta servicios.
 */
@Component({
  selector: 'app-autocomplete',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="relative" (focusout)="onFocusOut($event)">
      @if (label()) {
        <label [for]="inputId" class="block text-[11px] font-medium text-muted-foreground mb-1">
          {{ label() }}
          @if (requerido()) {
            <span class="text-destructive">*</span>
          }
        </label>
      }
      <div class="relative">
        <input
          #campo
          type="text"
          role="combobox"
          [id]="inputId"
          [formControl]="texto"
          [placeholder]="placeholder()"
          [attr.aria-label]="ariaLabel() || label() || placeholder()"
          [attr.aria-expanded]="abierto()"
          [attr.aria-controls]="listboxId"
          [attr.aria-activedescendant]="abierto() && indiceActivo() >= 0 ? idOpcion(indiceActivo()) : null"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          autocomplete="off"
          [class]="(deshabilitado() ? inpDisabled : inpBase) + ' pr-16'"
          (focus)="abrir()"
          (click)="abrir()"
          (input)="haEscrito.set(true)"
          (keydown)="onKeydown($event)"
        />
        <div class="absolute inset-y-0 right-2.5 flex items-center gap-1.5">
          @if (!deshabilitado() && texto.value) {
            <button
              type="button"
              tabindex="-1"
              class="p-0.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              [attr.aria-label]="'Limpiar ' + (label() || 'búsqueda')"
              (mousedown)="$event.preventDefault()"
              (click)="limpiar()"
            >
              <lucide-angular [img]="XIcon" class="size-3.5" />
            </button>
          }
          <lucide-angular [img]="SearchIcon" class="size-4 text-muted-foreground/60 pointer-events-none" />
        </div>
      </div>

      @if (abierto() && !deshabilitado()) {
        <ul
          #listbox
          [id]="listboxId"
          role="listbox"
          [attr.aria-label]="'Coincidencias de ' + (label() || 'búsqueda')"
          class="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto thin-scroll rounded-xl bg-popover ring-1 ring-border shadow-lg p-2 space-y-0.5 animate-modal-in"
        >
          @if (opcionesFiltradas().length === 0) {
            <li class="px-2 py-2 text-sm text-muted-foreground italic" role="presentation">
              Sin coincidencias para "{{ texto.value }}".
            </li>
          }
          @for (opcion of opcionesFiltradas(); track opcion; let i = $index) {
            <li
              role="option"
              [id]="idOpcion(i)"
              [attr.aria-selected]="opcion === value()"
              class="rounded-lg px-2 py-1.5 text-sm cursor-pointer select-none transition-colors"
              [class]="
                i === indiceActivo()
                  ? 'bg-brand-soft text-brand font-medium'
                  : opcion === value()
                    ? 'bg-secondary/60 text-foreground'
                    : 'text-foreground/90 hover:bg-secondary/60'
              "
              (mousedown)="$event.preventDefault()"
              (mouseenter)="indiceActivo.set(i)"
              (click)="seleccionar(opcion)"
            >
              {{ opcion }}
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class AutocompleteComponent {
  readonly label = input('');
  readonly placeholder = input('Escriba para buscar...');
  readonly ariaLabel = input('');
  readonly requerido = input(false);
  readonly options = input<string[]>([]);
  readonly value = input('');
  readonly deshabilitado = input(false);
  readonly valueChange = output<string>();

  readonly SearchIcon = Search;
  readonly XIcon = X;
  readonly inpBase = INPUT_BASE;
  readonly inpDisabled = INPUT_DISABLED;

  readonly inputId = `autocomplete-${siguienteId++}`;
  readonly listboxId = `${this.inputId}-listbox`;

  private readonly campo = viewChild.required<ElementRef<HTMLInputElement>>('campo');
  private readonly listbox = viewChild<ElementRef<HTMLUListElement>>('listbox');

  readonly texto = new FormControl('', { nonNullable: true });
  readonly abierto = signal(false);
  readonly indiceActivo = signal(-1);
  /** Solo se filtra tras teclear; al abrir con foco/click se listan todas. */
  readonly haEscrito = signal(false);

  /** Término de búsqueda con debounce (250 ms) y sin repeticiones. */
  private readonly termino = toSignal(
    this.texto.valueChanges.pipe(debounceTime(250), distinctUntilChanged()),
    { initialValue: '' },
  );

  readonly opcionesFiltradas = computed(() => {
    const opciones = this.options();
    if (!this.haEscrito()) return opciones;
    const filtro = normalizarBusqueda(this.termino());
    return filtro ? opciones.filter((o) => normalizarBusqueda(o).includes(filtro)) : opciones;
  });

  constructor() {
    // Sincroniza el texto visible cuando el padre cambia/limpia el valor.
    effect(() => {
      const v = this.value();
      if (this.texto.value !== v) this.texto.setValue(v);
    });
    effect(() => {
      const off = this.deshabilitado();
      if (off && !this.texto.disabled) {
        this.texto.disable();
        this.cerrar();
      } else if (!off && this.texto.disabled) {
        this.texto.enable();
      }
    });
    // El debounce puede reducir la lista con la opción activa fuera de rango.
    effect(() => {
      const total = this.opcionesFiltradas().length;
      if (this.indiceActivo() >= total) this.indiceActivo.set(total ? 0 : -1);
    });
  }

  idOpcion(i: number): string {
    return `${this.listboxId}-opcion-${i}`;
  }

  abrir(): void {
    if (this.deshabilitado() || this.abierto()) return;
    this.haEscrito.set(false);
    this.indiceActivo.set(this.value() ? this.opcionesFiltradas().indexOf(this.value()) : -1);
    this.abierto.set(true);
    this.desplazarAOpcionActiva();
  }

  cerrar(): void {
    this.abierto.set(false);
    this.indiceActivo.set(-1);
    this.haEscrito.set(false);
    // Restaura el texto a la selección vigente si quedó una búsqueda a medias.
    if (this.texto.value !== this.value()) this.texto.setValue(this.value());
  }

  limpiar(): void {
    this.texto.setValue('');
    this.haEscrito.set(false);
    if (this.value()) this.valueChange.emit('');
    this.abierto.set(true);
    this.campo().nativeElement.focus();
  }

  seleccionar(opcion: string): void {
    this.texto.setValue(opcion);
    this.abierto.set(false);
    this.indiceActivo.set(-1);
    this.haEscrito.set(false);
    if (opcion !== this.value()) this.valueChange.emit(opcion);
  }

  onKeydown(ev: KeyboardEvent): void {
    if (this.deshabilitado()) return;
    switch (ev.key) {
      // 'Down'/'Up' son alias legados de algunos motores/drivers de teclado.
      case 'ArrowDown':
      case 'Down':
      case 'ArrowUp':
      case 'Up': {
        ev.preventDefault();
        if (!this.abierto()) this.abrir();
        const total = this.opcionesFiltradas().length;
        if (!total) return;
        const delta = ev.key === 'ArrowUp' || ev.key === 'Up' ? -1 : 1;
        this.indiceActivo.update((i) => (i + delta + total) % total);
        this.desplazarAOpcionActiva();
        break;
      }
      case 'Enter': {
        if (!this.abierto()) return;
        ev.preventDefault();
        const opciones = this.opcionesFiltradas();
        const i = this.indiceActivo();
        if (i >= 0 && opciones[i]) this.seleccionar(opciones[i]);
        else if (opciones.length === 1) this.seleccionar(opciones[0]);
        break;
      }
      case 'Escape':
        if (this.abierto()) {
          ev.stopPropagation();
          this.cerrar();
        }
        break;
      case 'Tab':
        this.cerrar();
        break;
    }
  }

  onFocusOut(ev: FocusEvent): void {
    const contenedor = ev.currentTarget as HTMLElement;
    if (!contenedor.contains(ev.relatedTarget as Node | null)) this.cerrar();
  }

  /** Scroll automático para mantener visible la opción activa del listado. */
  private desplazarAOpcionActiva(): void {
    setTimeout(() => {
      const i = this.indiceActivo();
      if (i < 0) return;
      this.listbox()
        ?.nativeElement.querySelector(`#${CSS.escape(this.idOpcion(i))}`)
        ?.scrollIntoView({ block: 'nearest' });
    });
  }
}
