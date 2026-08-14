import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  ChevronRight, Plus, LayoutGrid, Info, Save, Search,
} from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { ModalService } from '../../../core/services/modal.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  ConfiguracionFlujoService,
  esSeleccionValida,
  unidadesFuncionalesDe,
} from '../../../core/services/configuracion-flujo.service';
import { FORMULARIOS } from '../../../core/constants/campos-base.const';
import { TEMATICAS } from '../../../core/constants/catalogos.const';
import { UNIDADES_RESPONSABLES } from '../../../core/constants/sodega.const';
import { FormularioKey } from '../../../core/models/campo.model';
import { normalizarBusqueda } from '../../../shared/utils/texto.util';

/** Filas visibles antes de que la grilla empiece a desplazarse. */
const FILAS_VISIBLES = 5;

/**
 * Etapa 1 del flujo de Configuración: alta y selección del registro.
 *
 * El "registro" es el par (oficina responsable, formulario) — la misma unidad
 * sobre la que ya operaban `CamposService` y `ReglasService`. "Guardar" deja
 * la grilla registrada sin salir de la vista y, al seleccionar un registro, se
 * habilita "Seguir", que lleva a la etapa 2.
 * La administración de campos vive ahora en `EstructuraFormularioComponent`.
 */
@Component({
  selector: 'app-campos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <section class="p-6 lg:p-8 max-w-7xl mx-auto animate-page-in">
      <div class="bg-card rounded-xl shadow-xl border border-border overflow-hidden flex flex-col">
        <!-- Header -->
        <header class="p-6 border-b border-border">
          <div class="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
            <div class="min-w-0">
              <div class="flex items-center gap-2 text-xs font-semibold text-brand uppercase tracking-wider mb-1">
                <span>Configuración</span>
                <lucide-angular [img]="ChevronRightIcon" class="size-3 text-muted-foreground/60" />
                <span class="text-muted-foreground">Configuración de campos</span>
                <span
                  class="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  [class]="isAdmin() ? 'bg-state-aprobado-soft text-state-aprobado-foreground' : 'bg-state-enviado-soft text-state-enviado-foreground'"
                >{{ isAdmin() ? 'ADMINISTRADOR GENERAL' : 'ADMIN. UNIDAD ORGANIZACIONAL' }}</span>
              </div>
              <h1 class="text-h1 text-foreground">Configuración de Formularios</h1>
              <p class="text-sm text-muted-foreground mt-1">
                Agregue una configuración y selecciónela para administrar la estructura del formulario.
              </p>
            </div>
          </div>
        </header>

        <!-- Alta de configuración: las 4 dimensiones del registro SODEGA -->
        <div class="p-6 border-b border-border/60 bg-surface-2/40">
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div class="flex flex-col gap-1.5 min-w-0">
              <label for="cfg-unidad-responsable" class="label-ds">
                Unidad Responsable <span class="text-destructive">*</span>
              </label>
              <select
                id="cfg-unidad-responsable"
                [value]="unidadResponsableSel()"
                (change)="onUnidadResponsableChange($any($event.target).value)"
                class="h-9 w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 focus:ring-2 focus:ring-ring outline-none"
              >
                <option value="">Seleccione una unidad responsable</option>
                @for (u of unidadesResponsables; track u) {
                  <option [value]="u">{{ u }}</option>
                }
              </select>
            </div>

            <div class="flex flex-col gap-1.5 min-w-0">
              <label for="cfg-unidad-funcional" class="label-ds">
                Unidad Funcional <span class="text-destructive">*</span>
              </label>
              <!-- Depende de la unidad responsable; sin ella queda inhabilitada. -->
              <select
                id="cfg-unidad-funcional"
                [value]="unidadFuncionalSel()"
                (change)="unidadFuncionalSel.set($any($event.target).value)"
                [disabled]="!unidadResponsableSel()"
                class="h-9 w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 focus:ring-2 focus:ring-ring outline-none disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
              >
                <option value="">Seleccione una unidad funcional</option>
                @for (uf of unidadesFuncionales(); track uf) {
                  <option [value]="uf">{{ uf }}</option>
                }
              </select>
            </div>

            <div class="flex flex-col gap-1.5 min-w-0">
              <label for="cfg-formulario" class="label-ds">
                Formulario <span class="text-destructive">*</span>
              </label>
              <select
                id="cfg-formulario"
                [value]="formularioSel()"
                (change)="formularioSel.set($any($event.target).value)"
                class="h-9 w-full bg-background border border-border text-foreground text-sm font-medium rounded-lg px-3 focus:ring-2 focus:ring-ring outline-none"
              >
                <option value="">Seleccione un formulario</option>
                @for (f of formularios; track f.key) {
                  <option [value]="f.key">{{ f.label }}</option>
                }
              </select>
            </div>

            <div class="flex flex-col gap-1.5 min-w-0">
              <label for="cfg-tematica" class="label-ds">
                Temática <span class="text-destructive">*</span>
              </label>
              <select
                id="cfg-tematica"
                [value]="tematicaSel()"
                (change)="tematicaSel.set($any($event.target).value)"
                class="h-9 w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 focus:ring-2 focus:ring-ring outline-none"
              >
                <option value="">Seleccione una temática</option>
                @for (t of tematicas; track t) {
                  <option [value]="t">{{ t }}</option>
                }
              </select>
            </div>
          </div>

          <div class="flex justify-end mt-4">
            <!-- Solo se habilita con las cuatro dimensiones completas. -->
            <button
              (click)="agregar()"
              [disabled]="!puedeAgregar()"
              class="btn-primary h-9 justify-center px-6"
            >
              <lucide-angular [img]="PlusIcon" class="size-4" />
              Agregar
            </button>
          </div>
        </div>

        <!-- Grilla de configuración -->
        <div class="p-6">
          <div class="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <h2 class="text-sm font-bold text-foreground flex items-center gap-2">
              <lucide-angular [img]="LayoutGridIcon" class="size-4 text-brand" />
              Grilla de configuración
            </h2>
            <span class="text-xs text-muted-foreground">
              @if (hayBusqueda()) {
                {{ configuracionesFiltradas().length }} de {{ configuraciones().length }} registros
              } @else {
                {{ configuraciones().length }} registros
              }
            </span>
          </div>

          <!-- Buscador global sobre las cuatro dimensiones del registro. -->
          <div class="relative mb-3 max-w-md">
            <lucide-angular
              [img]="SearchIcon"
              class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
            />
            <input
              type="search"
              [value]="busqueda()"
              (input)="busqueda.set($any($event.target).value)"
              placeholder="Buscar configuración..."
              aria-label="Buscar configuración por unidad responsable, unidad funcional, formulario o temática"
              class="w-full pl-10 pr-4 py-2 bg-background ring-1 ring-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <!-- El scroll vive en este contenedor (no en la página) y su alto es
               el de las 5 primeras filas realmente renderizadas. -->
          <div
            #contenedorGrilla
            class="rounded-xl ring-1 ring-border overflow-x-auto overflow-y-auto"
            [style.maxHeight.px]="altoMaximoGrilla()"
          >
            <table class="w-full">
              <thead class="sticky top-0 z-10 bg-card">
                <tr class="bg-secondary/60">
                  <th scope="col" class="th-ds text-center w-28">Seleccionar</th>
                  <th scope="col" class="th-ds">Unidad Responsable</th>
                  <th scope="col" class="th-ds">Unidad Funcional</th>
                  <th scope="col" class="th-ds">Formulario</th>
                  <th scope="col" class="th-ds">Temática</th>
                </tr>
              </thead>
              <tbody #cuerpoGrilla class="divide-y divide-border">
                @for (c of configuracionesFiltradas(); track c.id) {
                  <tr
                    class="tr-hover cursor-pointer"
                    [class]="flujo.seleccionId() === c.id ? 'bg-brand-soft/50' : ''"
                    (click)="flujo.seleccionar(c.id)"
                  >
                    <td class="td-ds text-center">
                      <input
                        type="radio"
                        name="registro-configuracion"
                        class="accent-brand size-4 align-middle"
                        [checked]="flujo.seleccionId() === c.id"
                        (change)="flujo.seleccionar(c.id)"
                        [attr.aria-label]="'Seleccionar ' + c.unidadResponsable + ' — ' + flujo.labelFormulario(c.formulario)"
                      />
                    </td>
                    <td class="td-ds font-medium text-foreground">{{ c.unidadResponsable }}</td>
                    <td class="td-ds">{{ c.unidadFuncional }}</td>
                    <td class="td-ds">{{ flujo.labelFormulario(c.formulario) }}</td>
                    <td class="td-ds">{{ c.tematica }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="px-6 py-10 text-center italic text-muted-foreground">
                      @if (hayBusqueda()) {
                        Ninguna configuración coincide con «{{ busqueda() }}».
                      } @else {
                        No existen configuraciones. Complete los cuatro campos y pulse Agregar.
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Footer: continuación del flujo -->
        <div class="px-6 py-4 border-t border-border/60 bg-card flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-2 text-xs text-muted-foreground/70 italic">
            <lucide-angular [img]="InfoIcon" class="size-4" />
            Seleccione un registro de la grilla para continuar.
          </div>
          <div class="flex items-center gap-3 flex-wrap">
            <!-- Guarda la grilla y permanece en la vista. -->
            <button
              (click)="guardar()"
              [disabled]="configuraciones().length === 0"
              class="btn-primary px-6 justify-center"
            >
              <lucide-angular [img]="SaveIcon" class="size-4" />
              Guardar
            </button>
            <!-- Solo se habilita con un registro seleccionado (etapa 1 → 2). -->
            <button
              (click)="seguirAEstructura()"
              [disabled]="!flujo.haySeleccion()"
              class="btn-secondary px-6 justify-center"
            >
              Seguir
              <lucide-angular [img]="ChevronRightIcon" class="size-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class CamposComponent {
  readonly flujo = inject(ConfiguracionFlujoService);
  private readonly auth = inject(AuthService);
  private readonly modales = inject(ModalService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly ChevronRightIcon = ChevronRight;
  readonly PlusIcon = Plus;
  readonly LayoutGridIcon = LayoutGrid;
  readonly InfoIcon = Info;
  readonly SaveIcon = Save;
  readonly SearchIcon = Search;

  readonly unidadesResponsables = UNIDADES_RESPONSABLES;
  readonly formularios = FORMULARIOS;
  readonly tematicas = TEMATICAS;

  readonly isAdmin = computed(() => this.auth.isAdministrador());
  readonly configuraciones = this.flujo.configuraciones;

  /* ===== Buscador de la grilla ===== */

  readonly busqueda = signal('');
  readonly hayBusqueda = computed(() => normalizarBusqueda(this.busqueda()).length > 0);

  /**
   * Filtrado en vivo sobre las cuatro dimensiones visibles del registro
   * (del formulario se busca su etiqueta, que es lo que ve el usuario).
   * Deriva de `configuraciones()` sin mutarla: los datos guardados no cambian.
   */
  readonly configuracionesFiltradas = computed(() => {
    const texto = normalizarBusqueda(this.busqueda());
    const todas = this.configuraciones();
    if (!texto) return todas;
    return todas.filter((c) =>
      [c.unidadResponsable, c.unidadFuncional, this.flujo.labelFormulario(c.formulario), c.tematica]
        .some((valor) => normalizarBusqueda(valor ?? '').includes(texto)),
    );
  });

  /* ===== Alto de la grilla (scroll a partir de la quinta fila) ===== */

  private readonly contenedorGrilla = viewChild<ElementRef<HTMLElement>>('contenedorGrilla');
  private readonly cuerpoGrilla = viewChild<ElementRef<HTMLTableSectionElement>>('cuerpoGrilla');
  /** Ancho útil de la grilla: al cambiar, los textos largos ocupan más líneas. */
  private readonly anchoGrilla = signal(0);
  /** Alto máximo del contenedor de filas; `null` = sin scroll (hasta 5 filas). */
  readonly altoMaximoGrilla = signal<number | null>(null);

  constructor() {
    // El observador va sobre el contenedor, no sobre el <tbody>: las cajas
    // internas de tabla no reportan cambios de tamaño de forma fiable.
    const observador = new ResizeObserver(([entrada]) =>
      this.anchoGrilla.set(Math.round(entrada.contentRect.width)),
    );
    effect(() => {
      const contenedor = this.contenedorGrilla()?.nativeElement;
      observador.disconnect();
      if (contenedor) observador.observe(contenedor);
    });
    // Medición después del render y con dependencias explícitas: se rehace al
    // cambiar las filas visibles (alta o búsqueda) y al cambiar el ancho.
    afterRenderEffect(() => {
      this.configuracionesFiltradas();
      this.anchoGrilla();
      this.medirAltoGrilla();
    });
    inject(DestroyRef).onDestroy(() => observador.disconnect());
  }

  /**
   * El límite sale de las cinco primeras filas realmente renderizadas, no de
   * una altura fija: así el corte cae siempre en la quinta fila aunque los
   * nombres largos ocupen dos líneas o cambie el ancho de la pantalla.
   */
  private medirAltoGrilla(): void {
    const filas = Array.from(this.cuerpoGrilla()?.nativeElement.rows ?? []);
    if (filas.length <= FILAS_VISIBLES) {
      this.altoMaximoGrilla.set(null);
      return;
    }
    const alto = filas
      .slice(0, FILAS_VISIBLES)
      .reduce((total, fila) => total + fila.getBoundingClientRect().height, 0);
    this.altoMaximoGrilla.set(Math.round(alto));
  }

  readonly unidadResponsableSel = signal('');
  readonly unidadFuncionalSel = signal('');
  readonly formularioSel = signal<FormularioKey | ''>('');
  readonly tematicaSel = signal('');

  /** Unidades funcionales de la unidad responsable elegida (cascada). */
  readonly unidadesFuncionales = computed(() =>
    this.unidadResponsableSel() ? unidadesFuncionalesDe(this.unidadResponsableSel()) : [],
  );

  /**
   * Alta habilitada solo con las cuatro dimensiones resueltas: ninguna vacía y
   * ninguna con "No aplica" (ese marcador aparece en Unidad Funcional cuando la
   * unidad responsable no tiene unidades propias). Del formulario se valida
   * también la etiqueta, que es el texto que ve el usuario.
   */
  readonly puedeAgregar = computed(
    () =>
      esSeleccionValida(this.unidadResponsableSel()) &&
      esSeleccionValida(this.unidadFuncionalSel()) &&
      esSeleccionValida(this.formularioSel()) &&
      esSeleccionValida(this.flujo.labelFormulario(this.formularioSel() as FormularioKey)) &&
      esSeleccionValida(this.tematicaSel()),
  );

  /**
   * Al cambiar la unidad responsable se reinicia la funcional dependiente.
   * No se preselecciona ninguna opción —ni siquiera cuando solo hay una—
   * para que el control siempre refleje una elección explícita del usuario.
   */
  onUnidadResponsableChange(valor: string): void {
    this.unidadResponsableSel.set(valor);
    this.unidadFuncionalSel.set('');
  }

  /**
   * Alta del registro. Doble barrera: el botón está deshabilitado si la
   * selección no es válida y, además, se revalida aquí y en el servicio, de
   * modo que una llamada directa tampoco pueda ensuciar la grilla.
   */
  agregar(): void {
    if (!this.puedeAgregar()) {
      this.avisarSeleccionInvalida();
      return;
    }
    const resultado = this.flujo.agregar(
      this.unidadResponsableSel(),
      this.unidadFuncionalSel(),
      this.formularioSel() as FormularioKey,
      this.tematicaSel(),
    );
    if (resultado === 'ok') {
      this.toast.success('Configuración agregada a la grilla.');
      return;
    }
    if (resultado === 'invalida') {
      this.avisarSeleccionInvalida();
      return;
    }
    void this.modales.openWarning(
      'Configuración duplicada',
      'Esa combinación de unidad responsable, unidad funcional, formulario y temática ya existe en la grilla.',
      { soloAceptar: true },
    );
  }

  /** Aviso único de selección incompleta o con "No aplica". */
  private avisarSeleccionInvalida(): void {
    void this.modales.openWarning(
      'No se puede agregar la configuración',
      'Debe seleccionar una Unidad Responsable, Unidad Funcional, Formulario y Temática. Ninguno puede tener el valor «No aplica».',
      { soloAceptar: true },
    );
  }

  /**
   * Guarda la configuración de esta etapa y mantiene al usuario en la vista.
   * Reutiliza el almacén del flujo (no hay una segunda fuente de datos) y da
   * el feedback con el sistema de avisos ya usado en esta pantalla.
   */
  guardar(): void {
    if (this.flujo.guardarConfiguraciones()) {
      this.toast.success('Configuración guardada', 'La grilla quedó registrada.');
      return;
    }
    void this.modales.openWarning(
      'Nada que guardar',
      'Agregue al menos una configuración a la grilla antes de guardar.',
      { soloAceptar: true },
    );
  }

  /**
   * Avanza a la etapa 2. No guarda por su cuenta: la grilla y la selección ya
   * se persisten al agregarlas o seleccionarlas, así que navegar no puede
   * perder información.
   */
  seguirAEstructura(): void {
    if (!this.flujo.haySeleccion()) return;
    void this.router.navigate(['/configuracion/estructura-formulario']);
  }
}
