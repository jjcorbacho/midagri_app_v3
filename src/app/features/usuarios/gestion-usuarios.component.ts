import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  Users, UserCheck, UserX, Infinity as InfinityIcon, Clock, TriangleAlert,
  FileSpreadsheet, UserPlus, Search, UserPen, FilePlus2,
  KeyRound, MapPinned, Workflow, CirclePlus,
} from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { ToastService } from '../../core/services/toast.service';
import { estadoVigenciaDe, formatearPeriodo, mesesDeRango, UsuarioSodega, esUsuarioPermanente, toTitleCase } from '../../core/models/usuario-sodega.model';
import { formatearUbigeoTexto } from '../../core/constants/sodega.const';
import { ModalService } from '../../core/services/modal.service';
import { ColumnSelectorComponent, ColumnaTabla } from '../../shared/components/column-selector/column-selector.component';
import {
  ReasignarRegistroModalComponent,
  ResultadoReasignacion,
} from './reasignar-registro-modal.component';

type FiltroKpi = 'TOTAL' | 'HABILITADO' | 'INHABILITADO' | 'PERMANENTE' | 'CRITICOS' | 'VENCIDOS';

/** Badge pill base (mismo patrón que EstadoBadge de la bandeja N1). */
const BADGE_PILL =
  'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 whitespace-nowrap tracking-wide';

/**
 * Configuración de las columnas de la grilla de usuarios.
 * Para incorporar una columna nueva basta con añadir su entrada aquí y su
 * `@case` en la celda: la cabecera, el colspan y el selector son dinámicos.
 */
const COLUMNAS_USUARIOS: ColumnaTabla[] = [
  { id: 'acciones', nombre: 'Acciones', visible: true, obligatoria: true, orden: 1, clase: 'text-center min-w-[220px]' },
  { id: 'empleado', nombre: 'Empleado', visible: true, orden: 2, clase: 'w-56' },
  { id: 'estado', nombre: 'Estado', visible: false, orden: 3, clase: 'text-center w-28' },
  { id: 'usuario', nombre: 'Usuario', visible: false, orden: 4, clase: 'w-28' },
  { id: 'dni', nombre: 'DNI', visible: false, orden: 5, clase: 'w-24' },
  { id: 'perfil', nombre: 'Perfil', visible: true, orden: 6, clase: 'w-48' },
  { id: 'regimen', nombre: 'Tipo de Régimen', visible: true, orden: 7, clase: 'w-44' },
  { id: 'unidadResponsable', nombre: 'Unidad Responsable', visible: false, orden: 8, clase: 'w-64' },
  { id: 'unidadFuncional', nombre: 'Unidad Funcional', visible: false, orden: 9, clase: 'w-64' },
  { id: 'periodo', nombre: 'Periodo de Gestión', visible: true, orden: 10, clase: 'w-40' },
  { id: 'vigencia', nombre: 'Vigencia', visible: true, orden: 11, clase: 'w-48' },
  { id: 'vencimiento', nombre: 'Vencimiento', visible: true, orden: 12, clase: 'w-28' },
  { id: 'progPresup', nombre: 'Categoría', visible: false, orden: 13, clase: 'w-64' },
  { id: 'ubigeo', nombre: 'Ubigeo', visible: false, orden: 14, clase: 'w-24' },
];

/** Tonos de los iconos de acción (mismo patrón ICON_TONES de la bandeja N1). */
const ICON_TONES: Record<string, string> = {
  teal: 'bg-brand-soft text-brand hover:bg-brand hover:text-brand-foreground',
  blue: 'bg-state-validado-soft text-state-validado-foreground hover:bg-state-validado hover:text-primary-foreground',
  red: 'bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground',
  amber: 'bg-state-subsanado-soft text-state-subsanado-foreground hover:bg-state-subsanado hover:text-primary-foreground',
  slate: 'bg-muted text-muted-foreground hover:bg-foreground hover:text-background',
  /* Agregar Nuevo Servicio (renovación de vigencia expirada). */
  green: 'bg-state-aprobado-soft text-state-aprobado-foreground hover:bg-state-aprobado hover:text-primary-foreground',
};

/**
 * Gestión Integral de Usuarios (módulo base SODEGA).
 * Administra usuarios, perfiles, vigencias laborales, ámbitos presupuestales y permisos.
 */
@Component({
  selector: 'app-gestion-usuarios',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, ReasignarRegistroModalComponent, ColumnSelectorComponent],
  template: `
    <section class="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6 animate-page-in">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 class="text-h1 text-foreground">Gestión Integral de Usuarios</h1>
          <p class="text-sm text-muted-foreground mt-1 max-w-[70ch]">
            Administra usuarios, perfiles, vigencias laborales, ámbitos presupuestales y permisos de acceso del sistema SODEGA.
          </p>
        </div>
        <div class="text-[11px] px-2.5 py-1 rounded-full bg-brand-soft text-brand ring-1 ring-brand/30 font-bold whitespace-nowrap">
          Año Fiscal: <span class="font-black">2026</span>
        </div>
      </div>

      <!-- PANEL DE 6 TARJETAS KPI -->
      <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        @for (k of kpiDefs; track k.filtro) {
          <button
            (click)="setFiltro(k.filtro)"
            class="bg-card p-5 rounded-xl flex justify-between items-center text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
            [class]="filtro() === k.filtro ? 'ring-2 ring-brand shadow-md' : 'ring-1 ring-border shadow-sm'"
          >
            <div>
              <p class="text-[10px] font-bold uppercase tracking-wider mb-1" [class]="k.labelCls">{{ k.label }}</p>
              <p class="text-3xl font-bold tabular-nums" [class]="k.numCls">{{ kpis()[k.filtro] }}</p>
            </div>
            <div class="size-12 rounded-xl flex items-center justify-center shrink-0" [class]="k.iconBg">
              <lucide-angular [img]="k.icon" class="size-6" />
            </div>
          </button>
        }
      </div>

      <!-- BANNER EXCEL -->
      @if (toastExcel()) {
        <div class="bg-state-aprobado-soft ring-1 ring-state-aprobado/30 text-state-aprobado-foreground p-3 rounded-xl text-sm font-medium flex items-center justify-between transition-all">
          <div class="flex items-center gap-2">
            <lucide-angular [img]="FileSpreadsheetIcon" class="size-4" />
            <span>{{ toastExcel() }}</span>
          </div>
          <button (click)="toastExcel.set('')" class="hover:opacity-70 font-bold text-sm px-1.5 cursor-pointer transition-opacity">×</button>
        </div>
      }

      <!-- Panel principal: búsqueda + grilla + paginación -->
      <div class="bg-card rounded-xl ring-1 ring-border shadow-sm overflow-hidden">
        <!-- Barra de búsqueda y acciones -->
        <div class="p-4 bg-secondary/40 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div class="flex items-center gap-2 flex-1">
            <span class="text-sm font-medium text-muted-foreground shrink-0">Buscar:</span>
            <div class="relative flex-1 min-w-[200px] max-w-md">
              <lucide-angular [img]="SearchIcon" class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                [value]="q()"
                (input)="q.set($any($event.target).value); page.set(1)"
                placeholder="Buscar por DNI, Nombre, Rol..."
                class="w-full pl-10 pr-4 py-2 bg-card ring-1 ring-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
              />
            </div>
          </div>

          <div class="flex items-center gap-2">
            <app-column-selector
              [columnas]="columnasBase"
              storageKey="sodega.usuarios.columnas"
              (columnasChange)="columnas.set($event)"
            />
            <button (click)="exportarExcel()" class="btn-secondary">
              <lucide-angular [img]="FileSpreadsheetIcon" class="size-4 text-success" />
              <span>Exportar excel</span>
            </button>
            <button (click)="nuevoUsuario()" class="btn-primary">
              <lucide-angular [img]="UserPlusIcon" class="size-4" />
              <span>Nuevo usuario</span>
            </button>
          </div>
        </div>

        <!-- GRILLA DE DATOS -->
        <div class="overflow-auto max-h-[60vh]">
          <table class="w-full text-left" [style.min-width.px]="anchoMinimoTabla()">
            <thead class="bg-secondary sticky top-0 z-10 shadow-sm">
              <tr class="text-muted-foreground label-ds">
                @for (col of columnasVisibles(); track col.id) {
                  <th class="th-ds py-3" [class]="col.clase ?? ''">{{ col.nombre }}</th>
                }
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              @if (pageRows().length === 0) {
                <tr>
                  <td [attr.colspan]="columnasVisibles().length">
                    <div class="empty-state">
                      <lucide-angular [img]="SearchIcon" class="size-8 text-muted-foreground/40" />
                      <p class="text-sm font-medium text-foreground">Sin resultados</p>
                      <p class="text-xs">No se encontraron registros de usuarios con los criterios establecidos.</p>
                    </div>
                  </td>
                </tr>
              }
              @for (u of pageRows(); track u.id) {
                <tr class="hover:bg-secondary/40 transition-colors">
                  @for (col of columnasVisibles(); track col.id) {
                    @switch (col.id) {
                      @case ('acciones') {
                        <td class="td-ds py-4 whitespace-nowrap w-px">
                          <div class="flex items-center justify-center gap-1 flex-nowrap">
                            <button title="Editar Datos" aria-label="Editar Datos" (click)="accion('EDITAR', u)"
                              class="p-2 rounded-lg transition-all" [class]="tone('slate')">
                              <lucide-angular [img]="UserPenIcon" class="size-4" />
                            </button>
                            <button title="Agregar nueva Presup." aria-label="Agregar nueva Presupuestal" (click)="accion('PRESUPUESTO', u)"
                              class="p-2 rounded-lg transition-all" [class]="tone('teal')">
                              <lucide-angular [img]="FilePlus2Icon" class="size-4" />
                            </button>
                            <button title="Restablecer clave" aria-label="Restablecer clave" (click)="accion('CLAVE', u)"
                              class="p-2 rounded-lg transition-all" [class]="tone('amber')">
                              <lucide-angular [img]="KeyRoundIcon" class="size-4" />
                            </button>
                            @if (puedeReasignar(u)) {
                              <button title="Reasignar Registro" aria-label="Reasignar Registro" (click)="accion('REASIGNAR_REGISTRO', u)"
                                class="p-2 rounded-lg transition-all" [class]="tone('blue')">
                                <lucide-angular [img]="MapPinnedIcon" class="size-4" />
                              </button>
                            }
                            <button title="Cambiar Estado" aria-label="Cambiar Estado" (click)="accion('ESTADO', u)"
                              class="p-2 rounded-lg transition-all" [class]="tone('red')">
                              <lucide-angular [img]="WorkflowIcon" class="size-4" />
                            </button>
                            @if (puedeAgregarServicio(u)) {
                              <button title="Agregar Nuevo Servicio" aria-label="Agregar Nuevo Servicio" (click)="accion('NUEVO_SERVICIO', u)"
                                class="p-2 rounded-lg transition-all" [class]="tone('green')">
                                <lucide-angular [img]="CirclePlusIcon" class="size-4" />
                              </button>
                            }
                          </div>
                        </td>
                      }
                      @case ('empleado') {
                        <td class="td-ds py-4 font-semibold text-foreground leading-tight">{{ nombreFila(u) }}</td>
                      }
                      @case ('estado') {
                        <td class="td-ds py-4 text-center whitespace-nowrap">
                          <span
                            class="${BADGE_PILL}"
                            [class]="u.estado === 'HABILITADO'
                              ? 'bg-state-aprobado-soft text-state-aprobado-foreground ring-state-aprobado/30'
                              : 'bg-state-observado-soft text-state-observado-foreground ring-state-observado/30'"
                          >{{ u.estado }}</span>
                        </td>
                      }
                      @case ('usuario') {
                        <td class="td-ds py-4 text-muted-foreground font-medium">{{ u.userGen }}</td>
                      }
                      @case ('dni') {
                        <td class="td-ds py-4 font-mono tabular-nums text-foreground/80">{{ u.dni }}</td>
                      }
                      @case ('perfil') {
                        <td class="td-ds py-4 font-semibold text-foreground">{{ u.perfil }}</td>
                      }
                      @case ('regimen') {
                        <td class="td-ds py-4 text-foreground/80 whitespace-nowrap">{{ u.regimen || '—' }}</td>
                      }
                      @case ('unidadResponsable') {
                        <td class="td-ds py-4 text-muted-foreground truncate max-w-[220px]" [title]="unidadResponsableDe(u)">{{ unidadResponsableDe(u) }}</td>
                      }
                      @case ('unidadFuncional') {
                        <td class="td-ds py-4 text-muted-foreground truncate max-w-[220px]" [title]="opasDe(u)">{{ opasDe(u) }}</td>
                      }
                      @case ('periodo') {
                        <td class="td-ds py-4">
                          @if (mesesContrato(u); as meses) {
                            <!-- Temporales: meses comprendidos en el contrato -->
                            <span class="text-xs text-foreground/80 leading-snug">{{ meses }}</span>
                          } @else if (u.periodosGestion?.length) {
                            <div class="flex flex-col gap-1">
                              @for (pg of u.periodosGestion; track pg.anio) {
                                <span class="inline-flex w-fit px-2 py-0.5 rounded-full bg-brand-soft text-brand text-[11px] font-bold ring-1 ring-brand/20 whitespace-nowrap">
                                  {{ formatearPeriodo(pg) }}
                                </span>
                              }
                            </div>
                          } @else {
                            <span class="text-xs text-muted-foreground">—</span>
                          }
                        </td>
                      }
                      @case ('vigencia') {
                        <td class="td-ds py-4 whitespace-nowrap"><span [class]="vigenciaCls(u)">{{ u.vigenciaCalculada }}</span></td>
                      }
                      @case ('vencimiento') {
                        <td class="td-ds py-4 whitespace-nowrap"><span [class]="vencimientoCls(u)">{{ vencimientoDe(u) }}</span></td>
                      }
                      @case ('progPresup') {
                        <td class="td-ds py-4 text-muted-foreground truncate max-w-[180px]" [title]="progPresupDe(u)">{{ progPresupDe(u) }}</td>
                      }
                      @case ('ubigeo') {
                        <td class="td-ds py-4 text-foreground/80" [title]="ubigeoDe(u)">{{ ubigeoDe(u) }}</td>
                      }
                    }
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div class="p-4 border-t border-border bg-card flex flex-col md:flex-row justify-between items-center gap-3">
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Mostrar</span>
            <select
              [value]="pageSize()"
              (change)="pageSize.set(+$any($event.target).value); page.set(1)"
              class="px-2 py-1 ring-1 ring-border rounded text-xs font-medium bg-card"
            >
              @for (n of [5, 10, 20, 50]; track n) {
                <option [value]="n">{{ n }}</option>
              }
            </select>
            <span>registros · del {{ rangoDesde() }} al {{ rangoHasta() }} de un total de {{ filtered().length }}</span>
          </div>
          <div class="flex gap-1 items-center">
            <button
              (click)="page.set(page() - 1)"
              [disabled]="page() === 1"
              class="px-3 py-1 ring-1 ring-border rounded text-[11px] font-bold text-foreground/80 disabled:opacity-40 hover:bg-secondary transition-colors"
            >Anterior</button>
            @for (p of paginas(); track p) {
              <button
                (click)="page.set(p)"
                class="px-3 py-1 rounded text-[11px] font-bold transition-colors"
                [class]="page() === p ? 'bg-brand-soft ring-1 ring-brand/25 text-brand' : 'ring-1 ring-border text-foreground/80 hover:bg-secondary'"
              >{{ p }}</button>
            }
            <button
              (click)="page.set(page() + 1)"
              [disabled]="page() === totalPages()"
              class="px-3 py-1 ring-1 ring-border rounded text-[11px] font-bold text-foreground/80 disabled:opacity-40 hover:bg-secondary transition-colors"
            >Siguiente</button>
          </div>
        </div>
      </div>

      <!-- Modal Reasignar Registro: transferencia de capacitaciones y asistencias -->
      @if (reasignarOrigen(); as origen) {
        <app-reasignar-registro-modal
          [origen]="origen"
          (closed)="reasignarOrigen.set(null)"
          (reasignado)="onReasignado($event)"
        />
      }

    </section>
  `,
})
export class GestionUsuariosComponent {
  private readonly auth = inject(AuthService);
  private readonly modales = inject(ModalService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly FileSpreadsheetIcon = FileSpreadsheet;
  readonly UserPlusIcon = UserPlus;
  readonly SearchIcon = Search;
  readonly UserPenIcon = UserPen;
  readonly FilePlus2Icon = FilePlus2;
  readonly KeyRoundIcon = KeyRound;
  readonly MapPinnedIcon = MapPinned;
  readonly WorkflowIcon = Workflow;
  readonly CirclePlusIcon = CirclePlus;
  readonly formatearPeriodo = formatearPeriodo;

  readonly kpiDefs = [
    { filtro: 'TOTAL' as FiltroKpi, label: 'Total usuarios', icon: Users, numCls: 'text-foreground', labelCls: 'text-muted-foreground', iconBg: 'bg-info-soft text-info' },
    { filtro: 'HABILITADO' as FiltroKpi, label: 'Habilitados', icon: UserCheck, numCls: 'text-foreground', labelCls: 'text-muted-foreground', iconBg: 'bg-success-soft text-success' },
    { filtro: 'INHABILITADO' as FiltroKpi, label: 'Inhabilitados', icon: UserX, numCls: 'text-foreground', labelCls: 'text-muted-foreground', iconBg: 'bg-destructive/10 text-destructive' },
    { filtro: 'PERMANENTE' as FiltroKpi, label: 'Permanente', icon: InfinityIcon, numCls: 'text-foreground', labelCls: 'text-muted-foreground', iconBg: 'bg-brand-soft text-brand' },
    { filtro: 'CRITICOS' as FiltroKpi, label: 'Por vencer (30 días)', icon: Clock, numCls: 'text-foreground', labelCls: 'text-muted-foreground', iconBg: 'bg-warning-soft text-warning-foreground' },
    { filtro: 'VENCIDOS' as FiltroKpi, label: 'Vencidos', icon: TriangleAlert, numCls: 'text-foreground', labelCls: 'text-muted-foreground', iconBg: 'bg-destructive/10 text-destructive' },
  ];

  readonly filtro = signal<FiltroKpi>('TOTAL');
  readonly q = signal('');
  readonly page = signal(1);
  readonly pageSize = signal(5);
  readonly toastExcel = signal('');
  /** Registro de origen del modal "Reasignar Registro" (null = cerrado). */
  readonly reasignarOrigen = signal<UsuarioSodega | null>(null);

  /* ===== Columnas configurables de la grilla ===== */
  readonly columnasBase = COLUMNAS_USUARIOS;
  readonly columnas = signal<ColumnaTabla[]>(COLUMNAS_USUARIOS);
  readonly columnasVisibles = computed(() =>
    this.columnas().filter((c) => c.visible).sort((a, b) => a.orden - b.orden),
  );
  /** Ancho mínimo proporcional para no estirar la tabla con pocas columnas. */
  readonly anchoMinimoTabla = computed(() => this.columnasVisibles().length * 130);

  /** Registros visibles según los privilegios del perfil activo. */
  private readonly visibles = computed(() => {
    const s = this.auth.session();
    if (!s) return [];
    // Dependencia reactiva del listado global
    this.usuariosService.usuarios();
    return this.usuariosService.registrosVisibles(s.perfil, s.userGen, s.perfilAutenticado);
  });

  readonly kpis = computed<Record<FiltroKpi, number>>(() => {
    const lista = this.visibles();
    return {
      TOTAL: lista.length,
      HABILITADO: lista.filter((u) => u.estado === 'HABILITADO').length,
      INHABILITADO: lista.filter((u) => u.estado === 'INHABILITADO').length,
      PERMANENTE: lista.filter((u) => esUsuarioPermanente(u)).length,
      CRITICOS: lista.filter((u) => !esUsuarioPermanente(u) && (u.diasRestantes ?? -1) >= 0 && (u.diasRestantes ?? 99) <= 30).length,
      VENCIDOS: lista.filter((u) => !esUsuarioPermanente(u) && (u.diasRestantes ?? 0) < 0).length,
    };
  });

  readonly filtered = computed(() => {
    let list = this.visibles();
    const f = this.filtro();
    if (f === 'HABILITADO') list = list.filter((u) => u.estado === 'HABILITADO');
    else if (f === 'INHABILITADO') list = list.filter((u) => u.estado === 'INHABILITADO');
    else if (f === 'PERMANENTE') list = list.filter((u) => esUsuarioPermanente(u));
    else if (f === 'CRITICOS') list = list.filter((u) => !esUsuarioPermanente(u) && (u.diasRestantes ?? -1) >= 0 && (u.diasRestantes ?? 99) <= 30);
    else if (f === 'VENCIDOS') list = list.filter((u) => !esUsuarioPermanente(u) && (u.diasRestantes ?? 0) < 0);

    const texto = this.q().toLowerCase().trim();
    if (texto) {
      list = list.filter(
        (u) =>
          u.nombres.toLowerCase().includes(texto) ||
          u.apePat.toLowerCase().includes(texto) ||
          u.apeMat.toLowerCase().includes(texto) ||
          u.dni.includes(texto) ||
          u.perfil.toLowerCase().includes(texto) ||
          u.regimen.toLowerCase().includes(texto) ||
          u.unidad.toLowerCase().includes(texto) ||
          formatearUbigeoTexto(u.ubigeo).toLowerCase().includes(texto),
      );
    }
    return list;
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize())));
  readonly paginas = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  readonly pageRows = computed(() => {
    const p = Math.min(this.page(), this.totalPages());
    const size = this.pageSize();
    return this.filtered().slice((p - 1) * size, p * size);
  });
  readonly rangoDesde = computed(() =>
    this.filtered().length === 0 ? 0 : (Math.min(this.page(), this.totalPages()) - 1) * this.pageSize() + 1,
  );
  readonly rangoHasta = computed(() =>
    Math.min(Math.min(this.page(), this.totalPages()) * this.pageSize(), this.filtered().length),
  );

  setFiltro(f: FiltroKpi): void {
    this.filtro.set(f);
    this.page.set(1);
  }

  tone(t: string): string {
    return ICON_TONES[t] ?? '';
  }

  /* ===== Formato de fila (idéntico al prototipo) ===== */
  nombreFila(u: UsuarioSodega): string {
    return toTitleCase(`${u.apePat} ${u.apeMat}, ${u.nombres}`);
  }

  /**
   * La reasignación de registros solo aplica a técnicos de Capacitación y
   * Asistencia Técnica y la ejecuta el Administrador General.
   */
  /**
   * "Agregar Nuevo Servicio" aplica únicamente a contratos temporales
   * (Régimen CAS Temporal / Locador de Servicio) cuyo servicio terminó:
   * cuenta inhabilitada o vigencia expirada (función única del modelo).
   * Nunca para 728/276/CAS, aunque estén inhabilitados.
   */
  /** Meses del contrato (solo CAS Temporal / Locador); '' para los demás. */
  mesesContrato(u: UsuarioSodega): string {
    const esTemporal = u.regimen === 'Régimen CAS Temporal' || u.regimen === 'Locador de Servicio (OS)';
    return esTemporal ? mesesDeRango(u.fechaIni, u.fechaFin) : '';
  }

  puedeAgregarServicio(u: UsuarioSodega): boolean {
    const esTemporal = u.regimen === 'Régimen CAS Temporal' || u.regimen === 'Locador de Servicio (OS)';
    if (!esTemporal) return false;
    return u.estado === 'INHABILITADO' || estadoVigenciaDe(u) === 'Expirado';
  }

  puedeReasignar(u: UsuarioSodega): boolean {
    return (
      this.auth.session()?.perfil === 'Administrador General' &&
      u.perfil === 'Técnico Capacitación y Asistencia Técnica'
    );
  }

  unidadResponsableDe(u: UsuarioSodega): string {
    return u.perfil === 'Administrador General' ? '-' : u.unidad || '-';
  }

  ubigeoDe(u: UsuarioSodega): string {
    return formatearUbigeoTexto(u.ubigeo);
  }

  opasDe(u: UsuarioSodega): string {
    const conOpas = [
      'Jefe de Área',
      'Administrador Unidad Ejecutora(UE)',
      'Administrador DZ_Cap_Asit.',
      'Técnico Capacitación y Asistencia Técnica',
    ];
    return conOpas.includes(u.perfil) ? u.unidadFuncional || '-' : '-';
  }

  progPresupDe(u: UsuarioSodega): string {
    if (u.perfil === 'Administrador General' || u.perfil === 'Jefe de Área') return '-';
    return u.programaPresup || u.unidad || '-';
  }

  vencimientoDe(u: UsuarioSodega): string {
    if ((u.regimen === 'Locador de Servicio (OS)' || u.regimen === 'Régimen CAS Temporal') && u.fechaFin) {
      const parts = u.fechaFin.split('-');
      return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : u.fechaFin;
    }
    return 'Permanente';
  }

  vigenciaCls(u: UsuarioSodega): string {
    return this.badgeVigencia(u, false);
  }

  vencimientoCls(u: UsuarioSodega): string {
    return this.badgeVigencia(u, true);
  }

  private badgeVigencia(u: UsuarioSodega, inline: boolean): string {
    const base = BADGE_PILL + (inline ? ' font-mono tabular-nums' : '');
    if (esUsuarioPermanente(u)) {
      return `${base} bg-state-aprobado-soft text-state-aprobado-foreground ring-state-aprobado/30`;
    }
    const d = u.diasRestantes ?? 0;
    if (d < 0) return `${base} bg-state-observado-soft text-state-observado-foreground ring-state-observado/30`;
    if (d === 0) return `${base} bg-state-enviado-soft text-state-enviado-foreground ring-state-enviado/30`;
    if (d <= 30) return `${base} bg-state-subsanado-soft text-state-subsanado-foreground ring-state-subsanado/30`;
    return `${base} bg-state-validado-soft text-state-validado-foreground ring-state-validado/30`;
  }

  /* ===== Acciones ===== */
  nuevoUsuario(): void {
    this.router.navigate(['/usuarios/nuevo']);
  }

  accion(tipo: 'EDITAR' | 'PRESUPUESTO' | 'CLAVE' | 'REASIGNAR_REGISTRO' | 'ESTADO' | 'NUEVO_SERVICIO', u: UsuarioSodega): void {
    switch (tipo) {
      case 'EDITAR':
        this.router.navigate(['/usuarios', u.id], { queryParams: { modo: 'editar' } });
        break;
      case 'PRESUPUESTO':
        this.router.navigate(['/usuarios', u.id], { queryParams: { modo: 'presupuesto' } });
        break;
      case 'NUEVO_SERVICIO':
        // Renovación: reutiliza el formulario existente en modo servicio (histórico).
        this.router.navigate(['/usuarios', u.id], { queryParams: { modo: 'servicio' } });
        break;
      case 'CLAVE': {
        // TODO(backend): POST /usuarios/{id}/restablecer-clave
        const clave = this.usuariosService.restablecerClave();
        void this.modales.openInfo(
          'Restablecer clave',
          `Se ha generado una clave temporal de seguridad para el usuario unificado '${u.userGen}'. Clave Provisional: ${clave}`,
        );
        break;
      }
      case 'REASIGNAR_REGISTRO':
        this.reasignarOrigen.set(u);
        break;
      case 'ESTADO': {
        const actualizado = this.usuariosService.toggleEstado(u.id);
        void this.modales.openSuccess(
          'Estado Modificado',
          `El estado de la cuenta del servidor ${u.nombres} ${u.apePat} ahora es: ${actualizado?.estado}`,
        );
        break;
      }
    }
  }

  /** Cierre exitoso del modal Reasignar Registro: mensaje y refresco reactivo. */
  onReasignado(r: ResultadoReasignacion): void {
    const origen = this.reasignarOrigen();
    this.reasignarOrigen.set(null);
    const nombreOrigen = origen ? toTitleCase(`${origen.nombres} ${origen.apePat}`) : '';
    const nombreDestino = toTitleCase(`${r.destino.nombres} ${r.destino.apePat}`);
    void this.modales.openSuccess(
      'Reasignación Completada',
      `Se transfirieron ${r.capacitaciones} capacitación(es) y ${r.asistencias} asistencia(s) técnica(s) ` +
        `de ${nombreOrigen} hacia ${nombreDestino}. El historial institucional se conserva íntegro bajo el nuevo responsable.`,
    );
  }

  /** Exportación simulada (mensajes progresivos del prototipo). */
  exportarExcel(): void {
    // TODO(backend): GET /usuarios/reporte-excel
    this.toastExcel.set('Generando libro unificado de datos SODEGA (Procesando registros)...');
    setTimeout(() => {
      this.toastExcel.set('Consolidando Ámbitos Territoriales de las OPAs... 45%');
      setTimeout(() => {
        this.toastExcel.set('¡Libro unificado de Reporte SODEGA_2026.xlsx exportado con éxito!');
      }, 1000);
    }, 1000);
  }
}
