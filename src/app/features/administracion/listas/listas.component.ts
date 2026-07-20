import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  LucideAngularModule,
  ListChecks, TableProperties, Search, Plus, FileSpreadsheet, FileDown, RotateCw,
  Pencil, X, Check, Save,
} from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { ListasAdminService } from '../../../core/services/listas-admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalService } from '../../../core/services/modal.service';
import { OpcionLista, generarCodigoOpcion } from '../../../core/models/lista-admin.model';
import { UNIDADES_RESPONSABLES } from '../../../core/constants/sodega.const';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { INPUT_BASE, INPUT_REQUIRED } from '../../../shared/utils/input-styles.const';

const INP = INPUT_BASE;
const INP_REQ = INPUT_REQUIRED;

/**
 * Administración de Listas (Administración → Listas).
 * Migrada del prototipo (VISTA D): catálogo de listas + opciones con
 * alta, edición y habilitación/deshabilitación por opción.
 */
@Component({
  selector: 'app-listas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, ModalComponent],
  template: `
    <section class="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6 animate-page-in">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 class="text-h1 text-foreground">Administración de Listas</h1>
          <p class="text-sm text-muted-foreground mt-1 max-w-[70ch]">
            Gestiona catálogos maestros y opciones de lista utilizados por los formularios del sistema SODEGA.
          </p>
        </div>
        <div class="text-[11px] px-2.5 py-1 rounded-full bg-brand-soft text-brand ring-1 ring-brand/30 font-bold whitespace-nowrap">
          Perfil: <span class="font-black">{{ perfilActivo() }}</span>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-5">
        <!-- Catálogo de listas -->
        <section class="col-span-12 lg:col-span-4 bg-card rounded-xl ring-1 ring-border shadow-sm overflow-hidden">
          <div class="px-4 py-3 border-b border-border bg-secondary/40 flex items-center justify-between">
            <h2 class="text-[11px] font-bold text-brand uppercase tracking-wider flex items-center gap-2">
              <lucide-angular [img]="ListChecksIcon" class="size-4" /> Listas
            </h2>
            <span class="text-[11px] px-2.5 py-0.5 rounded-full bg-card ring-1 ring-border text-muted-foreground font-bold">
              {{ listasFiltradas().length }}
            </span>
          </div>
          <div class="p-3 space-y-3">
            <div class="p-3 bg-secondary/40 ring-1 ring-border rounded-lg">
              <label class="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Agregar lista</label>
              <div class="flex gap-2">
                <input
                  type="text"
                  placeholder="Nombre de la lista"
                  [value]="nuevaLista()"
                  (input)="nuevaLista.set($any($event.target).value)"
                  (keyup.enter)="agregarLista()"
                  class="flex-1 ${INP}"
                />
                <button
                  (click)="agregarLista()"
                  title="Guardar lista"
                  aria-label="Guardar lista"
                  class="btn-primary size-9 shrink-0 px-0"
                >
                  <lucide-angular [img]="PlusIcon" class="size-4" />
                </button>
              </div>
            </div>

            <div class="relative">
              <lucide-angular [img]="SearchIcon" class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar lista..."
                [value]="qListas()"
                (input)="qListas.set($any($event.target).value)"
                class="w-full pl-10 pr-4 py-2 bg-card ring-1 ring-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
              />
            </div>

            <div class="ring-1 ring-border rounded-lg overflow-hidden">
              <div class="divide-y divide-border max-h-[520px] overflow-y-auto bg-card">
                @if (listasFiltradas().length === 0) {
                  <div class="px-4 py-8 text-center text-sm text-muted-foreground italic">No se encontraron listas.</div>
                }
                @for (l of listasFiltradas(); track l.nombre) {
                  <button
                    type="button"
                    (click)="seleccionar(l.nombre)"
                    class="w-full text-left px-3 py-2.5 text-sm font-medium transition-colors flex items-center justify-between gap-2"
                    [class]="l.nombre === listaActiva() ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-brand-soft/60 text-foreground'"
                  >
                    <span class="truncate">{{ l.nombre }}</span>
                    <span
                      class="text-[11px] font-bold tabular-nums shrink-0"
                      [class]="l.nombre === listaActiva() ? 'text-primary-foreground/80' : 'text-muted-foreground'"
                    >{{ l.opciones.length }}</span>
                  </button>
                }
              </div>
            </div>
          </div>
        </section>

        <!-- Opciones de la lista seleccionada -->
        <section class="col-span-12 lg:col-span-8 bg-card rounded-xl ring-1 ring-border shadow-sm overflow-hidden">
          <div class="px-4 py-3 border-b border-border bg-secondary/40 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 class="text-[11px] font-bold text-brand uppercase tracking-wider flex items-center gap-2">
                <lucide-angular [img]="TablePropertiesIcon" class="size-4" /> Opciones de lista
              </h2>
              <p class="text-xs text-muted-foreground mt-0.5">{{ subtituloOpciones() }}</p>
            </div>
            <!-- Acciones de cabecera: cuadradas con bordes redondeados (patrón /usuarios) -->
            <div class="flex items-center gap-1 flex-wrap">
              <button (click)="abrirModalOpcion(null)" title="Nuevo" aria-label="Nueva opción"
                class="p-2 rounded-lg transition-all bg-primary text-primary-foreground hover:bg-primary/85 shadow-sm">
                <lucide-angular [img]="PlusIcon" class="size-4" />
              </button>
              <button (click)="exportarExcel()" title="Excel" aria-label="Exportar Excel"
                class="p-2 rounded-lg transition-all bg-success text-success-foreground hover:bg-success/85 shadow-sm">
                <lucide-angular [img]="FileSpreadsheetIcon" class="size-4" />
              </button>
              <button (click)="imprimir()" title="PDF" aria-label="Exportar PDF"
                class="p-2 rounded-lg transition-all bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground shadow-sm">
                <lucide-angular [img]="FileDownIcon" class="size-4" />
              </button>
              <button (click)="actualizar()" title="Actualizar" aria-label="Actualizar"
                class="p-2 rounded-lg transition-all bg-muted text-muted-foreground hover:bg-foreground hover:text-background shadow-sm">
                <lucide-angular [img]="RotateCwIcon" class="size-4" />
              </button>
            </div>
          </div>

          <div class="p-3 space-y-3">
            <div class="flex justify-end">
              <label class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                Buscar:
                <input
                  type="text"
                  [value]="qOpciones()"
                  (input)="qOpciones.set($any($event.target).value)"
                  class="w-56 ${INP}"
                />
              </label>
            </div>

            <div class="ring-1 ring-border rounded-lg overflow-auto bg-card max-h-[420px]">
              <table class="w-full min-w-[680px] text-left">
                <thead class="bg-secondary sticky top-0 z-10 shadow-sm">
                  <tr class="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                    <th class="px-4 py-3 w-28 text-center">Acciones</th>
                    <th class="px-4 py-3">Descripción</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border">
                  @if (opcionesFiltradas().length === 0) {
                    <tr>
                      <td colspan="2">
                        <div class="empty-state">
                          <lucide-angular [img]="SearchIcon" class="size-8 text-muted-foreground/40" />
                          <p class="text-sm font-medium text-foreground">Sin opciones</p>
                          <p class="text-xs">No se encontraron opciones para la búsqueda ingresada.</p>
                        </div>
                      </td>
                    </tr>
                  }
                  @for (fila of opcionesFiltradas(); track fila.indice) {
                    <tr class="hover:bg-secondary/40 transition-colors">
                      <td class="px-4 py-2.5">
                        <!-- Acciones visibles (mismo patrón de la columna Acciones de /usuarios) -->
                        <div class="flex items-center justify-center gap-1 flex-wrap">
                          <button (click)="abrirModalOpcion(fila.indice)" title="Editar" aria-label="Editar opción"
                            class="p-2 rounded-lg transition-all bg-muted text-muted-foreground hover:bg-foreground hover:text-background">
                            <lucide-angular [img]="PencilIcon" class="size-4" />
                          </button>
                          <button (click)="confirmarEstado(fila.indice)"
                            [title]="fila.opcion.activo ? 'Inhabilitar' : 'Habilitar'"
                            [attr.aria-label]="fila.opcion.activo ? 'Inhabilitar opción' : 'Habilitar opción'"
                            class="p-2 rounded-lg transition-all"
                            [class]="fila.opcion.activo
                              ? 'bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground'
                              : 'bg-state-aprobado-soft text-state-aprobado-foreground hover:bg-state-aprobado hover:text-primary-foreground'">
                            <lucide-angular [img]="fila.opcion.activo ? XIcon : CheckIcon" class="size-4" />
                          </button>
                        </div>
                      </td>
                      <td
                        class="px-4 py-2.5 text-sm"
                        [class]="fila.opcion.activo ? 'text-foreground/90 font-medium' : 'text-destructive font-semibold line-through decoration-destructive/40'"
                      >{{ fila.opcion.nombre }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      <!-- Modal nueva / editar opción -->
      @if (modalOpcionAbierto()) {
        <app-modal [title]="tituloModalOpcion()" maxWidth="max-w-lg" (closed)="cerrarModalOpcion()">
          <div class="space-y-4">
            <div>
              <label class="block text-[11px] font-medium text-muted-foreground mb-1">Código <span class="text-destructive">*</span></label>
              <input
                type="text"
                placeholder="Código automático"
                [value]="modalCodigo()"
                readonly
                aria-disabled="true"
                class="${INP_REQ} uppercase opacity-70 cursor-not-allowed"
              />
            </div>
            @if (listaActivaEsUnidadFuncional()) {
              <div>
                <label class="block text-[11px] font-medium text-muted-foreground mb-1">
                  Unidad Responsable <span class="text-destructive">*</span>
                </label>
                <select
                  [value]="modalUnidadResponsable()"
                  (change)="modalUnidadResponsable.set($any($event.target).value)"
                  class="${INP_REQ}"
                >
                  <option value="">Seleccione Unidad Responsable</option>
                  @for (u of unidadesResponsables(); track u) {
                    <option [value]="u">{{ u }}</option>
                  }
                </select>
              </div>
            }
            <div>
              <label class="block text-[11px] font-medium text-muted-foreground mb-1">
                Nombre {{ listaActivaEsUnidadFuncional() ? 'Unidad Funcional' : listaActiva() }} <span class="text-destructive">*</span>
              </label>
              <input
                type="text"
                [placeholder]="listaActivaEsUnidadFuncional() ? 'Ingrese nombre de Unidad Funcional' : 'Ingrese descripción'"
                [value]="modalNombre()"
                (input)="modalNombre.set($any($event.target).value)"
                (keyup.enter)="guardarOpcion()"
                [disabled]="listaActivaEsUnidadFuncional() && !modalUnidadResponsable()"
                class="${INP_REQ} disabled:opacity-70 disabled:cursor-not-allowed"
              />
            </div>
            <div class="flex justify-end gap-2 pt-2 border-t border-border">
              <button (click)="cerrarModalOpcion()" class="btn-secondary">
                Cancelar
              </button>
              <button (click)="guardarOpcion()" class="btn-primary px-5">
                <lucide-angular [img]="SaveIcon" class="size-3.5" /> Guardar
              </button>
            </div>
          </div>
        </app-modal>
      }

    </section>
  `,
})
export class ListasComponent {
  private readonly auth = inject(AuthService);
  private readonly listasService = inject(ListasAdminService);
  private readonly toast = inject(ToastService);
  private readonly modales = inject(ModalService);

  readonly ListChecksIcon = ListChecks;
  readonly TablePropertiesIcon = TableProperties;
  readonly SearchIcon = Search;
  readonly PlusIcon = Plus;
  readonly FileSpreadsheetIcon = FileSpreadsheet;
  readonly FileDownIcon = FileDown;
  readonly RotateCwIcon = RotateCw;
  readonly PencilIcon = Pencil;
  readonly XIcon = X;
  readonly CheckIcon = Check;
  readonly SaveIcon = Save;

  readonly nuevaLista = signal('');
  readonly qListas = signal('');
  readonly qOpciones = signal('');

  /** Índice de la opción en edición (null = nueva) + estado del modal. */
  readonly opcionEnEdicion = signal<number | null>(null);
  readonly modalOpcionAbierto = signal(false);
  readonly modalCodigo = signal('');
  readonly modalNombre = signal('');
  readonly modalUnidadResponsable = signal('');

  readonly perfilActivo = computed(() => this.auth.session()?.perfil ?? '');
  readonly listaActiva = this.listasService.listaActiva;
  readonly listaActivaEsUnidadFuncional = computed(() =>
    this.listasService.esListaUnidadFuncional(this.listaActiva()),
  );
  /** Unidades Responsables activas (para asociar Unidades Funcionales). */
  readonly unidadesResponsables = computed(() =>
    this.listasService.opcionesFormulario('Unidad Responsable', UNIDADES_RESPONSABLES),
  );

  readonly listasFiltradas = computed(() => {
    const filtro = this.qListas().toLowerCase().trim();
    return this.listasService.listas().filter((l) => l.nombre.toLowerCase().includes(filtro));
  });

  readonly subtituloOpciones = computed(() => {
    const lista = this.listasService.activa();
    return lista
      ? `${lista.nombre} - ${lista.opciones.length} opciones registradas`
      : 'Seleccione una lista para ver sus opciones.';
  });

  /** Opciones filtradas conservando su índice original (para editar/cambiar estado). */
  readonly opcionesFiltradas = computed<{ opcion: OpcionLista; indice: number }[]>(() => {
    const lista = this.listasService.activa();
    if (!lista) return [];
    const filtro = this.qOpciones().toLowerCase().trim();
    return lista.opciones
      .map((opcion, indice) => ({ opcion, indice }))
      .filter(({ opcion }) => `${opcion.codigo} - ${opcion.nombre}`.toLowerCase().includes(filtro));
  });

  readonly tituloModalOpcion = computed(() =>
    `${this.opcionEnEdicion() !== null ? 'Editar Opción' : 'Nueva Opción'}: ${this.listaActiva()}`,
  );

  /* ===== Catálogo ===== */

  seleccionar(nombre: string): void {
    this.listasService.seleccionar(nombre);
    this.qOpciones.set('');
  }

  agregarLista(): void {
    const resultado = this.listasService.agregarLista(this.nuevaLista());
    if (resultado.ok) {
      this.nuevaLista.set('');
      this.qListas.set('');
      this.toast.success(resultado.titulo, resultado.mensaje);
    } else {
      this.toast.error(resultado.titulo, resultado.mensaje);
    }
  }

  /* ===== Opciones ===== */

  abrirModalOpcion(indice: number | null): void {
    const lista = this.listasService.activa();
    if (!lista) {
      this.toast.error('Lista no seleccionada', 'Seleccione una lista antes de agregar una opción.');
      return;
    }
    const opcion = indice !== null ? lista.opciones[indice] : undefined;
    this.opcionEnEdicion.set(indice);
    this.modalCodigo.set(
      opcion
        ? opcion.codigo || generarCodigoOpcion(indice ?? 0)
        : this.listasService.siguienteCodigoOpcion(),
    );
    this.modalNombre.set(opcion?.nombre ?? '');
    this.modalUnidadResponsable.set(opcion?.unidadResponsable ?? '');
    this.modalOpcionAbierto.set(true);
  }

  cerrarModalOpcion(): void {
    this.modalOpcionAbierto.set(false);
    this.opcionEnEdicion.set(null);
    this.modalCodigo.set('');
    this.modalNombre.set('');
    this.modalUnidadResponsable.set('');
  }

  guardarOpcion(): void {
    const resultado = this.listasService.guardarOpcion(
      this.modalCodigo(),
      this.modalNombre(),
      this.opcionEnEdicion(),
      this.listaActivaEsUnidadFuncional() ? this.modalUnidadResponsable() : '',
    );
    if (resultado.ok) {
      this.cerrarModalOpcion();
      this.toast.success(resultado.titulo, resultado.mensaje);
    } else {
      this.toast.error(resultado.titulo, resultado.mensaje);
    }
  }

  confirmarEstado(indice: number): void {
    const opcion = this.listasService.activa()?.opciones[indice];
    if (!opcion) return;
    const descripcion = `${opcion.codigo} - ${opcion.nombre}`;
    const pregunta = opcion.activo
      ? `¿Desea deshabilitar la descripción "${descripcion}"?`
      : `¿Desea habilitar nuevamente la descripción "${descripcion}"?`;
    void this.modales.openConfirm('¿Está seguro?', pregunta).then((ok) => {
      if (!ok) return;
      const resultado = this.listasService.cambiarEstadoOpcion(indice);
      if (resultado.ok) this.toast.success(resultado.titulo, resultado.mensaje);
      else this.toast.error(resultado.titulo, resultado.mensaje);
    });
  }

  /* ===== Acciones simuladas (igual que el prototipo) ===== */

  exportarExcel(): void {
    // TODO(backend): GET /listas/{nombre}/opciones/reporte-excel
    this.toast.success('Exportar Excel', 'Preparando la exportación de opciones de lista en formato Excel.');
  }

  imprimir(): void {
    this.toast.success('Imprimir', 'Preparando la impresión de opciones de lista.');
  }

  actualizar(): void {
    this.qOpciones.set('');
    this.toast.info('Administración de listas', 'Listado de opciones actualizado.');
  }
}
