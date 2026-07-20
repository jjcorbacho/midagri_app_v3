import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  Plus, Search, BookOpen, ClipboardCheck, Wrench, Users, UserPlus, Pencil,
  Trash2, Download, AlertTriangle, MapPin, UploadCloud, ChevronDown, ChevronUp,
  FileEdit, SendHorizonal, AlertOctagon, BadgeCheck, FileText, FileSpreadsheet,
} from 'lucide-angular';
import { AreaService } from '../../../core/services/area.service';
import { CursosService } from '../../../core/services/cursos.service';
import { ParticipantesService } from '../../../core/services/participantes.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalService } from '../../../core/services/modal.service';
import { Curso, ESTADOS, EstadoCurso, canDeleteCurso } from '../../../core/models/curso.model';
import { Participante } from '../../../core/models/participante.model';
import { EstadoBadgeComponent } from '../../../shared/components/estado-badge/estado-badge.component';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { SustentoModalComponent } from '../sustento-modal/sustento-modal.component';
import { exportarTablaExcel } from '../../../shared/utils/excel.util';
import { parseFechaCurso } from '../../../shared/utils/fecha.util';
import { UBIGEO, getProvincias, getDistritos } from '../../../core/constants/catalogos.const';
import { DateRangePickerComponent, RangoFechas } from '../../../shared/components/date-range-picker/date-range-picker.component';

type Tab = 'todos' | 'capacitacion' | 'asistencia';
/** Campo único sobre el que opera el buscador de la bandeja. */
type CampoBusqueda = 'codigo' | 'tema' | 'ubicacion' | 'extensionista' | 'nombres' | 'apellidos' | 'dni';

const CAMPOS_BUSQUEDA: { k: CampoBusqueda; label: string }[] = [
  { k: 'codigo', label: 'Código' },
  { k: 'tema', label: 'Tema' },
  { k: 'ubicacion', label: 'Ubicación' },
  { k: 'extensionista', label: 'Extensionista' },
  { k: 'nombres', label: 'Nombres' },
  { k: 'apellidos', label: 'Apellidos' },
  { k: 'dni', label: 'DNI' },
];
type EstadoFiltro = 'TODOS' | EstadoCurso;

const ICON_TONES: Record<string, string> = {
  teal: 'bg-brand-soft text-brand hover:bg-brand hover:text-brand-foreground',
  blue: 'bg-state-validado-soft text-state-validado-foreground hover:bg-state-validado hover:text-primary-foreground',
  red: 'bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground',
  amber: 'bg-state-subsanado-soft text-state-subsanado-foreground hover:bg-state-subsanado hover:text-primary-foreground',
  slate: 'bg-muted text-muted-foreground hover:bg-foreground hover:text-background',
  /* Descargar: azul informativo, distinto del teal de marca de la misma fila. */
  indigo: 'bg-info-soft text-info hover:bg-info hover:text-primary-foreground',
  /* Subir documentos: color primario del tema activo (nunca negro fijo). */
  dark: 'bg-primary text-primary-foreground hover:bg-primary/85 ring-1 ring-primary/25 shadow-sm',
};

@Component({
  selector: 'app-bandeja',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, EstadoBadgeComponent, KpiCardComponent, ModalComponent, SustentoModalComponent, DateRangePickerComponent],
  template: `
    <section class="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6 animate-page-in">
      <!-- KPIs -->
      <div class="space-y-3">
        <div class="flex justify-start">
          <div role="tablist" aria-label="Vista de indicadores" class="inline-flex p-1 bg-muted/70 rounded-xl ring-1 ring-border/60">
            @for (opt of kpiOptions; track opt.k) {
              <button
                role="tab"
                [attr.aria-selected]="kpiView() === opt.k"
                (click)="kpiView.set(opt.k)"
                class="px-4 h-8 rounded-lg text-xs font-semibold transition-all duration-200"
                [class]="kpiView() === opt.k ? 'bg-card text-brand shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground'"
              >{{ opt.label }}</button>
            }
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-300 animate-in fade-in-0">
          @if (kpiView() === 'general') {
            <app-kpi-card label="Eventos Registrados" [value]="counts().registrados" [icon]="BookOpenIcon" tone="blue" />
            <app-kpi-card label="Capacitaciones" [value]="counts().caps" [icon]="ClipboardCheckIcon" tone="teal" />
            <app-kpi-card label="Asistencias Técnicas" [value]="counts().ast" [icon]="WrenchIcon" tone="emerald" />
            <app-kpi-card label="Participantes Inscritos" [value]="counts().productores" [icon]="UsersIcon" tone="indigo" />
          } @else {
            <app-kpi-card label="Pendiente de envío (registrado)" [value]="counts().pendientes" [icon]="FileEditIcon" tone="slate" />
            <app-kpi-card label="Enviados a Revisión (enviado)" [value]="counts().enviados" [icon]="SendHorizonalIcon" tone="blue" />
            <app-kpi-card label="Observados" [value]="counts().observados" [icon]="AlertOctagonIcon" tone="amber" />
            <app-kpi-card label="Aprobado" [value]="counts().aprobados" [icon]="BadgeCheckIcon" tone="emerald" />
          }
        </div>
      </div>

      <!-- Main panel -->
      <div class="bg-card rounded-xl ring-1 ring-border shadow-sm overflow-hidden">
        <div class="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 class="text-h2 text-foreground">
              Bandeja de Control de {{ areaService.currentArea() }}
            </h2>
            <p class="text-sm text-muted-foreground mt-1 max-w-[70ch]">
              Consulte e ingrese capacitaciones agrarias.
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button (click)="nuevo('capacitacion')" class="btn-primary">
              <lucide-angular [img]="PlusIcon" class="size-4" /> Registrar Capacitación
            </button>
            <button (click)="nuevo('asistencia')" class="btn-primary">
              <lucide-angular [img]="PlusIcon" class="size-4" /> Registrar Asis. Técnica
            </button>
          </div>
        </div>

        <!-- Filtros (organización según la referencia filtros.xlsx) -->
        <div class="p-4 bg-secondary/40 border-b border-border space-y-3">
          <!-- Fila 1: indicadores por tipo + buscador por campo + exportación -->
          <div class="flex flex-col lg:flex-row gap-3 lg:items-center">
            <div class="inline-flex p-1 bg-card ring-1 ring-border rounded-lg self-start shrink-0" role="tablist" aria-label="Filtrar por tipo">
              @for (t of tabs; track t.k) {
                <button
                  role="tab"
                  [attr.aria-selected]="tab() === t.k"
                  (click)="setTab(t.k)"
                  class="h-8 px-3 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5"
                  [class]="tab() === t.k ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'"
                >
                  {{ t.label }}
                  <span
                    class="px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums"
                    [class]="tab() === t.k ? 'bg-primary-foreground/25' : 'bg-secondary ring-1 ring-border'"
                  >{{ conteoTipos()[t.k] }}</span>
                </button>
              }
            </div>

            <select
              [value]="campoBusqueda()"
              (change)="setCampoBusqueda($event)"
              aria-label="Campo de búsqueda"
              class="px-3 py-2 bg-card ring-1 ring-border rounded-lg text-sm font-medium shrink-0"
            >
              @for (c of camposBusqueda; track c.k) {
                <option [value]="c.k">Buscar por: {{ c.label }}</option>
              }
            </select>

            <div class="relative flex-1 min-w-[200px]">
              <lucide-angular [img]="SearchIcon" class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                [value]="q()"
                (input)="setQ($event)"
                type="text"
                [placeholder]="'Buscar por ' + etiquetaCampoBusqueda() + '…'"
                class="w-full pl-10 pr-4 py-2 bg-card ring-1 ring-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
              />
            </div>

            <!-- Exportación junto al buscador -->
            <button
              (click)="exportarExcel()"
              title="Exportar Excel"
              aria-label="Exportar la tabla a Excel"
              class="p-2 rounded-lg transition-all bg-success text-success-foreground hover:bg-success/85 shadow-sm shrink-0"
            >
              <lucide-angular [img]="FileSpreadsheetIcon" class="size-4" />
            </button>
          </div>

          <!-- Fila 2: filtros uniformes y alineados -->
          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
            <div>
              <label for="filtro-estado" class="block text-[11px] font-medium text-muted-foreground mb-1">Estado</label>
              <select
                id="filtro-estado"
                [value]="estado()"
                (change)="setEstado($event)"
                class="w-full px-3 py-2 bg-card ring-1 ring-border rounded-lg text-sm font-medium"
              >
                <option value="TODOS">Todos</option>
                @for (e of estados; track e) {
                  <option [value]="e">{{ e }}</option>
                }
              </select>
            </div>
            <div>
              <label for="filtro-region" class="block text-[11px] font-medium text-muted-foreground mb-1">Región</label>
              <select
                id="filtro-region"
                [value]="fRegion()"
                (change)="setFiltroRegion($event)"
                class="w-full px-3 py-2 bg-card ring-1 ring-border rounded-lg text-sm font-medium"
              >
                <option value="">Todas</option>
                @for (r of regionesFiltro; track r) {
                  <option [value]="r">{{ r }}</option>
                }
              </select>
            </div>
            <div>
              <label for="filtro-provincia" class="block text-[11px] font-medium text-muted-foreground mb-1">Provincia</label>
              <select
                id="filtro-provincia"
                [value]="fProvincia()"
                (change)="setFiltroProvincia($event)"
                [disabled]="!fRegion()"
                class="w-full px-3 py-2 bg-card ring-1 ring-border rounded-lg text-sm font-medium disabled:bg-muted/40 disabled:text-muted-foreground disabled:cursor-not-allowed"
              >
                <option value="">Todas</option>
                @for (pr of provinciasFiltro(); track pr) {
                  <option [value]="pr">{{ pr }}</option>
                }
              </select>
            </div>
            <div>
              <label for="filtro-distrito" class="block text-[11px] font-medium text-muted-foreground mb-1">Distrito</label>
              <select
                id="filtro-distrito"
                [value]="fDistrito()"
                (change)="setFiltroDistrito($event)"
                [disabled]="!fProvincia()"
                class="w-full px-3 py-2 bg-card ring-1 ring-border rounded-lg text-sm font-medium disabled:bg-muted/40 disabled:text-muted-foreground disabled:cursor-not-allowed"
              >
                <option value="">Todos</option>
                @for (d of distritosFiltro(); track d) {
                  <option [value]="d">{{ d }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-medium text-muted-foreground mb-1">Rango de fechas</label>
              <app-date-range-picker [desde]="fDesde()" [hasta]="fHasta()" (rangoChange)="setRangoFechas($event)" />
            </div>
          </div>
        </div>

        <!-- Tabla -->
        <div class="overflow-auto max-h-[60vh]">
          <table class="w-full text-left min-w-[1100px]">
            <thead class="bg-secondary sticky top-0 z-10 shadow-sm">
              <tr class="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                <th class="px-4 py-3 text-center">Acciones</th>
                <th class="px-4 py-3">Tipo / Tema</th>
                <th class="px-4 py-3">Estado</th>
                <th class="px-4 py-3">Fecha</th>
                <th class="px-4 py-3 text-center">Horas</th>
                <th class="px-4 py-3 text-center">Participantes</th>
                <th class="px-4 py-3">Ubicación</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              @for (c of pageRows(); track c.id) {
                <tr class="hover:bg-secondary/40 transition-colors">
                  <td class="px-4 py-4">
                    <div class="flex items-center justify-center gap-1 flex-wrap">
                      @if (tieneObs(c)) {
                        <button [title]="'Ver observaciones'" aria-label="Ver observaciones" (click)="verObservaciones(c)"
                          class="p-2 rounded-lg transition-all" [class]="tone('amber')">
                          <lucide-angular [img]="AlertTriangleIcon" class="size-4" />
                        </button>
                      }
                      @if (editable(c)) {
                        <button title="Registrar participantes" aria-label="Registrar participantes" (click)="irPaso(c, 2)"
                          class="p-2 rounded-lg transition-all" [class]="tone('teal')">
                          <lucide-angular [img]="UserPlusIcon" class="size-4" />
                        </button>
                      }
                      @if (bloqueado(c)) {
                        <button title="Ver participantes" aria-label="Ver participantes" (click)="irPaso(c, 2)"
                          class="p-2 rounded-lg transition-all" [class]="tone('indigo')">
                          <lucide-angular [img]="UsersIcon" class="size-4" />
                        </button>
                        <button title="Ver datos" aria-label="Ver datos" (click)="irPaso(c, 1)"
                          class="p-2 rounded-lg transition-all" [class]="tone('blue')">
                          <lucide-angular [img]="FileTextIcon" class="size-4" />
                        </button>
                      }
                      @if (editable(c)) {
                        <button title="Editar" aria-label="Editar" (click)="irPaso(c, 1)"
                          class="p-2 rounded-lg transition-all" [class]="tone('slate')">
                          <lucide-angular [img]="PencilIcon" class="size-4" />
                        </button>
                        <button
                          [title]="deleteBlocked(c) ? 'No es posible eliminar: tiene participantes registrados' : 'Eliminar'"
                          aria-label="Eliminar"
                          (click)="intentarEliminar(c)"
                          class="p-2 rounded-lg transition-all"
                          [class]="tone('red') + (deleteBlocked(c) ? ' opacity-50' : '')"
                        >
                          <lucide-angular [img]="Trash2Icon" class="size-4" />
                        </button>
                        <button
                          [title]="c.estado === 'Observado' ? 'Reemplazar sustento y reenviar' : 'Adjuntar sustento'"
                          aria-label="Adjuntar sustento"
                          (click)="abrirSustento(c)"
                          class="p-2 rounded-lg transition-all" [class]="tone('dark')">
                          <lucide-angular [img]="UploadCloudIcon" class="size-4" />
                        </button>
                      }
                      @if (bloqueado(c) && c.fotoSustento) {
                        <button title="Descargar sustento" aria-label="Descargar sustento" (click)="descargaSimulada()"
                          class="p-2 rounded-lg transition-all" [class]="tone('indigo')">
                          <lucide-angular [img]="DownloadIcon" class="size-4" />
                        </button>
                      }
                    </div>
                  </td>

                  <td class="px-4 py-4">
                    <div class="mb-1">
                      <span
                        class="text-[9px] px-1.5 py-0.5 font-bold uppercase rounded-sm"
                        [class]="c.tipo === 'capacitacion' ? 'bg-state-validado-soft text-state-validado-foreground' : 'bg-success-soft text-success'"
                      >{{ c.tipo === 'capacitacion' ? 'Capacitación' : 'Asist. Técnica' }}</span>
                      <span class="ml-2 text-[10px] font-mono text-muted-foreground">{{ c.codigo }}</span>
                    </div>
                    <p class="text-sm font-semibold text-foreground leading-tight max-w-sm">{{ c.nombreTema }}</p>
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap"><app-estado-badge [estado]="c.estado" /></td>
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground font-medium">{{ c.fecha }}</td>
                  <td class="px-4 py-4 text-center text-sm font-bold text-foreground/80 tabular-nums">{{ c.horas }} h</td>
                  <td class="px-4 py-4 text-center">
                    <button
                      type="button"
                      (click)="toggleExpand(c.id)"
                      [disabled]="(c.participantes ?? 0) === 0"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ring-1 text-xs font-bold tabular-nums transition-colors"
                      [class]="participantesBtnCls(c)"
                      [attr.aria-expanded]="isExpanded(c)"
                      [attr.aria-label]="showCount(c) + ' participante(s)'"
                    >
                      <lucide-angular [img]="UsersIcon" class="size-3.5" />
                      <span>{{ showCount(c) }}{{ queryActive() && matchesDe(c.id).length > 0 ? ' / ' + (c.participantes ?? 0) : '' }}</span>
                      @if ((c.participantes ?? 0) > 0) {
                        <lucide-angular [img]="isExpanded(c) ? ChevronUpIcon : ChevronDownIcon" class="size-3.5" />
                      }
                    </button>
                  </td>
                  <td class="px-4 py-4">
                    <div class="flex items-start text-xs text-muted-foreground">
                      <lucide-angular [img]="MapPinIcon" class="size-3 mr-1 mt-0.5 text-muted-foreground/70 shrink-0" />
                      <span>{{ c.region }} / {{ c.provincia }} / {{ c.distrito }}</span>
                    </div>
                  </td>
                </tr>
                @if (isExpanded(c) && (c.participantes ?? 0) > 0) {
                  <tr class="bg-secondary/20">
                    <td colspan="7" class="px-0 py-0">
                      <div class="thin-scroll max-h-[120px] overflow-y-auto">
                        @if (subRows(c).length === 0) {
                          <div class="px-6 py-3 text-xs italic text-muted-foreground">
                            Sin coincidencias en los participantes de este registro.
                          </div>
                        } @else {
                          <ul class="divide-y divide-border/60">
                            @for (p of subRows(c); track p.id) {
                              <li
                                class="flex items-center gap-3 px-6 py-2 text-xs"
                                [class]="esMatch(c, p) ? 'bg-warning-soft border-l-4 border-l-warning' : 'border-l-4 border-l-transparent'"
                              >
                                <span class="hidden md:inline text-muted-foreground/60 font-mono select-none">└─</span>
                                <span class="font-mono tabular-nums text-foreground/80 w-24 shrink-0">{{ p.dni }}</span>
                                <span class="font-semibold text-foreground truncate flex-1">
                                  {{ p.nombres }} {{ p.apellidos }}
                                </span>
                                <span
                                  class="ml-auto px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase shrink-0"
                                  [class]="p.tipoParticipante === 'PRODUCTOR' ? 'bg-success-soft text-success' : 'bg-muted text-foreground'"
                                >{{ p.tipoParticipante }}</span>
                              </li>
                            }
                          </ul>
                        }
                      </div>
                    </td>
                  </tr>
                }
              }
              @if (pageRows().length === 0) {
                <tr>
                  <td colspan="7">
                    <div class="empty-state">
                      <lucide-angular [img]="SearchIcon" class="size-8 text-muted-foreground/40" />
                      <p class="text-sm font-medium text-foreground">Sin resultados</p>
                      <p class="text-xs">No hay registros que coincidan con los filtros aplicados.</p>
                    </div>
                  </td>
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
              (change)="setPageSize($event)"
              class="px-2 py-1 ring-1 ring-border rounded text-xs font-medium bg-card"
            >
              @for (n of pageSizes; track n) {
                <option [value]="n">{{ n }}</option>
              }
            </select>
            <span>registros · {{ filtered().length }} totales</span>
          </div>
          <div class="flex gap-1 items-center">
            <button
              (click)="prevPage()"
              [disabled]="safePage() === 1"
              class="px-3 py-1 ring-1 ring-border rounded-md text-[11px] font-bold text-foreground/80 hover:bg-secondary transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
            >Anterior</button>
            <span class="px-3 py-1 bg-brand-soft ring-1 ring-brand/25 rounded text-[11px] font-bold text-brand">
              {{ safePage() }} / {{ totalPages() }}
            </span>
            <button
              (click)="nextPage()"
              [disabled]="safePage() === totalPages()"
              class="px-3 py-1 ring-1 ring-border rounded-md text-[11px] font-bold text-foreground/80 hover:bg-secondary transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
            >Siguiente</button>
          </div>
        </div>
      </div>

      <!-- Modal observaciones -->
      @if (obsModal(); as texto) {
        <app-modal title="Observaciones" (closed)="obsModal.set(null)">
          <p class="text-sm text-foreground whitespace-pre-wrap">{{ texto }}</p>
        </app-modal>
      }

      <!-- Modal sustento -->
      @if (sustentoCurso(); as curso) {
        <app-sustento-modal [curso]="curso" (closed)="sustentoCurso.set(null)" />
      }
    </section>
  `,
})
export class BandejaComponent {
  readonly areaService = inject(AreaService);
  private readonly modales = inject(ModalService);
  private readonly cursosService = inject(CursosService);
  private readonly participantesService = inject(ParticipantesService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  // Iconos
  readonly PlusIcon = Plus; readonly SearchIcon = Search; readonly BookOpenIcon = BookOpen;
  readonly ClipboardCheckIcon = ClipboardCheck; readonly WrenchIcon = Wrench; readonly UsersIcon = Users;
  readonly UserPlusIcon = UserPlus; readonly PencilIcon = Pencil; readonly Trash2Icon = Trash2;
  readonly DownloadIcon = Download; readonly AlertTriangleIcon = AlertTriangle; readonly MapPinIcon = MapPin;
  readonly UploadCloudIcon = UploadCloud; readonly ChevronDownIcon = ChevronDown; readonly ChevronUpIcon = ChevronUp;
  readonly FileEditIcon = FileEdit; readonly SendHorizonalIcon = SendHorizonal; readonly AlertOctagonIcon = AlertOctagon;
  readonly BadgeCheckIcon = BadgeCheck; readonly FileTextIcon = FileText;
  readonly FileSpreadsheetIcon = FileSpreadsheet;

  readonly tabs: { k: Tab; label: string }[] = [
    { k: 'todos', label: 'Todos' },
    { k: 'capacitacion', label: 'Capacitaciones' },
    { k: 'asistencia', label: 'Asistencias' },
  ];
  readonly kpiOptions = [
    { k: 'general' as const, label: 'Vista general' },
    { k: 'estados' as const, label: 'Estados y Progreso' },
  ];
  readonly estados = ESTADOS;
  readonly pageSizes = [5, 10, 30, 50];

  readonly tab = signal<Tab>('todos');
  readonly kpiView = signal<'general' | 'estados'>('general');
  readonly q = signal('');
  readonly camposBusqueda = CAMPOS_BUSQUEDA;
  readonly campoBusqueda = signal<CampoBusqueda>('codigo');
  readonly etiquetaCampoBusqueda = computed(
    () => CAMPOS_BUSQUEDA.find((c) => c.k === this.campoBusqueda())?.label ?? 'Código',
  );
  readonly estado = signal<EstadoFiltro>('TODOS');
  /* Filtros territoriales y de rango de fechas (referencia filtros.xlsx). */
  readonly fRegion = signal('');
  readonly fProvincia = signal('');
  readonly fDistrito = signal('');
  readonly fDesde = signal('');
  readonly fHasta = signal('');
  readonly regionesFiltro = UBIGEO.map((r) => r.nombre);
  readonly provinciasFiltro = computed(() =>
    this.fRegion() ? getProvincias(this.fRegion()).map((pr) => pr.nombre) : [],
  );
  readonly distritosFiltro = computed(() =>
    this.fRegion() && this.fProvincia()
      ? getDistritos(this.fRegion(), this.fProvincia()).map((d) => d.nombre)
      : [],
  );
  readonly pageSize = signal(10);
  readonly page = signal(1);
  readonly obsModal = signal<string | null>(null);
  readonly sustentoCurso = signal<Curso | null>(null);
  readonly expanded = signal<Set<string>>(new Set());

  readonly counts = computed(() => {
    const delArea = this.cursosService.cursos().filter((c) => c.area === this.areaService.currentArea());
    const caps = delArea.filter((c) => c.tipo === 'capacitacion').length;
    const ast = delArea.filter((c) => c.tipo === 'asistencia').length;
    return {
      registrados: caps + ast,
      caps,
      ast,
      productores: delArea.reduce((acc, c) => acc + (c.participantes || 0), 0),
      pendientes: delArea.filter((c) => c.estado === 'Registrado').length,
      enviados: delArea.filter((c) => c.estado === 'Enviado' || c.estado === 'Enviado-Subsanado').length,
      observados: delArea.filter((c) => c.estado === 'Observado').length,
      aprobados: delArea.filter((c) => c.estado === 'Aprobado').length,
    };
  });

  /** Contadores de los indicadores Todos / Capacitaciones / Asistencias. */
  readonly conteoTipos = computed(() => {
    const base = this.cursosService.cursos().filter((c) => c.area === this.areaService.currentArea());
    return {
      todos: base.length,
      capacitacion: base.filter((c) => c.tipo === 'capacitacion').length,
      asistencia: base.filter((c) => c.tipo === 'asistencia').length,
    };
  });

  readonly queryActive = computed(() => this.q().trim().length > 0);
  private readonly queryLower = computed(() => this.q().trim().toLowerCase());

  readonly filtered = computed(() => {
    let base = this.cursosService.cursos().filter((c) => c.area === this.areaService.currentArea());
    if (this.tab() !== 'todos') base = base.filter((c) => c.tipo === this.tab());
    if (this.estado() !== 'TODOS') base = base.filter((c) => c.estado === this.estado());
    if (this.fRegion()) base = base.filter((c) => c.region === this.fRegion());
    if (this.fProvincia()) base = base.filter((c) => c.provincia === this.fProvincia());
    if (this.fDistrito()) base = base.filter((c) => c.distrito === this.fDistrito());
    const desde = this.fDesde();
    const hasta = this.fHasta();
    if (desde || hasta) {
      const min = desde ? (parseFechaCurso(desde) ?? Number.NEGATIVE_INFINITY) : Number.NEGATIVE_INFINITY;
      const max = hasta ? (parseFechaCurso(hasta) ?? Number.POSITIVE_INFINITY) + 86_399_999 : Number.POSITIVE_INFINITY;
      base = base.filter((c) => {
        const t = parseFechaCurso(c.fecha);
        return t !== null && t >= min && t <= max;
      });
    }
    if (this.queryActive()) {
      const s = this.queryLower();
      base = base.filter((c) => {
        switch (this.campoBusqueda()) {
          case 'codigo':
            return c.codigo.toLowerCase().includes(s);
          case 'tema':
            return c.nombreTema.toLowerCase().includes(s);
          case 'ubicacion':
            return (
              c.region.toLowerCase().includes(s) ||
              c.provincia.toLowerCase().includes(s) ||
              c.distrito.toLowerCase().includes(s)
            );
          case 'extensionista':
            return c.extensionista.toLowerCase().includes(s);
          // Campos de participante: el registro coincide si algún participante coincide.
          default:
            return this.matchesDe(c.id).length > 0;
        }
      });
    }
    return base;
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize())));
  readonly safePage = computed(() => Math.min(this.page(), this.totalPages()));
  readonly pageRows = computed(() => {
    const p = this.safePage();
    const size = this.pageSize();
    return this.filtered().slice((p - 1) * size, p * size);
  });

  /** Participantes del curso que coinciden con la búsqueda por el campo elegido. */
  matchesDe(cursoId: string): Participante[] {
    if (!this.queryActive()) return [];
    const campo = this.campoBusqueda();
    if (campo !== 'nombres' && campo !== 'apellidos' && campo !== 'dni') return [];
    const s = this.queryLower();
    return this.participantesService.participantesDe(cursoId).filter((p) => {
      if (campo === 'nombres') return p.nombres.toLowerCase().includes(s);
      if (campo === 'apellidos') return p.apellidos.toLowerCase().includes(s);
      return p.dni.toLowerCase().includes(s);
    });
  }

  subRows(c: Curso): Participante[] {
    const campo = this.campoBusqueda();
    const filtraParticipantes =
      this.queryActive() && (campo === 'nombres' || campo === 'apellidos' || campo === 'dni');
    return filtraParticipantes ? this.matchesDe(c.id) : this.participantesService.participantesDe(c.id);
  }

  showCount(c: Curso): number {
    return this.queryActive() ? this.matchesDe(c.id).length : (c.participantes ?? 0);
  }

  esMatch(c: Curso, p: Participante): boolean {
    return this.queryActive() && this.matchesDe(c.id).some((m) => m.id === p.id);
  }

  isExpanded(c: Curso): boolean {
    if (this.queryActive()) return this.matchesDe(c.id).length > 0 || this.expanded().has(c.id);
    return this.expanded().has(c.id);
  }

  toggleExpand(id: string): void {
    this.expanded.update((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  editable(c: Curso): boolean {
    return c.estado === 'Registrado' || c.estado === 'Observado';
  }

  bloqueado(c: Curso): boolean {
    return (
      c.estado === 'Enviado' ||
      c.estado === 'Enviado-Subsanado' ||
      c.estado === 'Validado' ||
      c.estado === 'Aprobado'
    );
  }

  tieneObs(c: Curso): boolean {
    return (c.observacionesHistorial?.length ?? 0) > 0;
  }

  deleteBlocked(c: Curso): boolean {
    return (c.participantes ?? 0) > 0 || c.estado !== 'Registrado';
  }

  participantesBtnCls(c: Curso): string {
    const total = c.participantes ?? 0;
    if (total === 0) return 'ring-border text-muted-foreground/60 cursor-not-allowed';
    return this.isExpanded(c)
      ? 'bg-brand text-brand-foreground ring-brand'
      : 'bg-brand-soft text-brand ring-brand/30 hover:bg-brand hover:text-brand-foreground';
  }

  tone(t: string): string {
    return ICON_TONES[t] ?? '';
  }

  setTab(t: Tab): void { this.tab.set(t); this.page.set(1); }
  setQ(e: Event): void { this.q.set((e.target as HTMLInputElement).value); this.page.set(1); }
  setFiltroRegion(e: Event): void {
    this.fRegion.set((e.target as HTMLSelectElement).value);
    this.fProvincia.set('');
    this.fDistrito.set('');
    this.page.set(1);
  }

  setFiltroProvincia(e: Event): void {
    this.fProvincia.set((e.target as HTMLSelectElement).value);
    this.fDistrito.set('');
    this.page.set(1);
  }

  setFiltroDistrito(e: Event): void {
    this.fDistrito.set((e.target as HTMLSelectElement).value);
    this.page.set(1);
  }

  /** La tabla se recalcula automáticamente al cambiar el rango (signals). */
  setRangoFechas(r: RangoFechas): void {
    this.fDesde.set(r.desde);
    this.fHasta.set(r.hasta);
    this.page.set(1);
  }

  setCampoBusqueda(e: Event): void {
    this.campoBusqueda.set((e.target as HTMLSelectElement).value as CampoBusqueda);
    this.page.set(1);
  }

  setEstado(e: Event): void { this.estado.set((e.target as HTMLSelectElement).value as EstadoFiltro); this.page.set(1); }
  setPageSize(e: Event): void { this.pageSize.set(Number((e.target as HTMLSelectElement).value)); this.page.set(1); }
  prevPage(): void { this.page.update((p) => Math.max(1, p - 1)); }
  nextPage(): void { this.page.update((p) => Math.min(this.totalPages(), p + 1)); }

  nuevo(tipo: 'capacitacion' | 'asistencia'): void {
    this.router.navigate(['/capacitaciones-n1/nuevo'], { queryParams: { tipo } });
  }

  irPaso(c: Curso, paso: 1 | 2): void {
    this.router.navigate(['/capacitaciones-n1', c.id], { queryParams: { paso } });
  }

  verObservaciones(c: Curso): void {
    const texto = (c.observacionesHistorial ?? [])
      .map((o) => `[${o.fecha}] ${o.descripcion}`)
      .join('\n\n');
    this.obsModal.set(texto);
  }

  abrirSustento(c: Curso): void {
    if ((c.participantes ?? 0) < 1) {
      this.toast.warning(
        'Agrega al menos un participante',
        'Debes registrar mínimo un participante antes de subir el archivo de sustento.',
      );
      return;
    }
    this.sustentoCurso.set(c);
  }

  intentarEliminar(c: Curso): void {
    if (this.deleteBlocked(c)) {
      this.toast.info('No es posible eliminar el registro porque tiene participantes registrados.');
      return;
    }
    if (!canDeleteCurso(c)) {
      this.toast.info("No es posible eliminar: el registro tiene participantes o no está en estado 'Registrado'.");
      return;
    }
    void this.modales
      .openConfirm('Eliminar registro', `¿Eliminar el registro ${c.codigo}?`)
      .then((ok) => {
        if (!ok) return;
        this.cursosService.delete(c.id);
        this.toast.success('Registro eliminado');
      });
  }

  /**
   * Exporta a Excel los registros actualmente filtrados (pestaña, estado,
   * búsqueda por campo) en el orden mostrado. Se exportan TODAS las páginas
   * del resultado filtrado, no solo la página visible: es el comportamiento
   * esperado de un reporte y evita exportaciones parciales accidentales.
   */
  exportarExcel(): void {
    exportarTablaExcel('Capacitaciones_N1', [
      { titulo: 'Código', valor: (c) => c.codigo },
      { titulo: 'Tipo', valor: (c) => (c.tipo === 'capacitacion' ? 'Capacitación' : 'Asistencia Técnica') },
      { titulo: 'Tema', valor: (c) => c.nombreTema },
      { titulo: 'Estado', valor: (c) => c.estado },
      { titulo: 'Fecha', valor: (c) => c.fecha },
      { titulo: 'Hora', valor: (c) => c.hora },
      { titulo: 'Horas', valor: (c) => c.horas },
      { titulo: 'Participantes', valor: (c) => c.participantes },
      { titulo: 'Región', valor: (c) => c.region },
      { titulo: 'Provincia', valor: (c) => c.provincia },
      { titulo: 'Distrito', valor: (c) => c.distrito },
      { titulo: 'Extensionista', valor: (c) => c.extensionista },
    ], this.filtered());
  }

  descargaSimulada(): void {
    void this.modales.openInfo('Descarga de sustento', 'Descarga simulada (disponible al conectar el API real).');
  }
}
