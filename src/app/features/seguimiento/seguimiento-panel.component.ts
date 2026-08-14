import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  Search, AlertTriangle, Download, CheckCircle2, MessageSquareWarning,
  MapPin, ClipboardList, Users, ChevronDown, ChevronUp, X, FileText, FileSpreadsheet,
} from 'lucide-angular';
import { AreaService } from '../../core/services/area.service';
import { CursosService } from '../../core/services/cursos.service';
import { ModalService } from '../../core/services/modal.service';
import { ParticipantesService } from '../../core/services/participantes.service';
import { EstadoPermisosService } from '../../core/services/estado-permisos.service';
import { Curso, EstadoCurso } from '../../core/models/curso.model';
import { Participante } from '../../core/models/participante.model';
import { EstadoBadgeComponent } from '../../shared/components/estado-badge/estado-badge.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { exportarTablaExcel } from '../../shared/utils/excel.util';
import { isoToDDMMYYYY, todayDDMMYYYY, todayISO } from '../../shared/utils/fecha.util';

// Sobre qué estados actúa cada eslabón del flujo: el DZ evalúa lo que envía el
// técnico y el UE/JA evalúa además lo que el DZ ya aprobó. Es lógica de flujo;
// el estado que se produce al actuar lo decide la matriz del perfil.
const ACCIONABLES_DZ: EstadoCurso[] = ['Enviado', 'Enviado-subsanado'];
const ACCIONABLES_UE: EstadoCurso[] = ['Enviado', 'Enviado-subsanado', 'Aprobado por DZ'];

const ICON_TONES: Record<string, string> = {
  blue: 'bg-state-validado-soft text-state-validado-foreground hover:bg-state-validado hover:text-primary-foreground',
  amber: 'bg-state-subsanado-soft text-state-subsanado-foreground hover:bg-state-subsanado hover:text-primary-foreground',
  indigo: 'bg-brand-soft text-brand hover:bg-brand hover:text-brand-foreground',
};

/** Bandeja de revisión/aprobación con selección múltiple y observaciones. */
@Component({
  selector: 'app-seguimiento-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, EstadoBadgeComponent, ModalComponent],
  template: `
    <section class="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6 pb-32 animate-page-in">
      <!-- Header -->
      <header class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <lucide-angular [img]="ClipboardListIcon" class="size-5 text-brand" />
            <h1 class="text-h1">{{ title() }}</h1>
            <span class="px-2.5 py-1 bg-secondary text-muted-foreground font-semibold text-[11px] rounded-md ml-1 tracking-widest">
              {{ rolLabel() || rol() }}
            </span>
          </div>
          <p class="text-sm text-muted-foreground max-w-[80ch]">{{ subtitle() }}</p>
        </div>
        <!-- Cada acción existe solo si el cuadro de estados autoriza al perfil
             en sesión a producir el estado correspondiente. -->
        <div class="flex gap-2">
          @if (estadoAprobar(); as estadoAprobado) {
            <button
              (click)="confirmarValidacionSeleccion()"
              [disabled]="sel().size === 0"
              class="btn-primary"
              [title]="'Marcar como ' + estadoAprobado"
            >
              <lucide-angular [img]="CheckCircle2Icon" class="size-4" />
              {{ labelAprobar() }} seleccionados ({{ sel().size }})
            </button>
          }
          @if (estadoObservar(); as estadoObservado) {
            <button
              (click)="observarOpen.set(true)"
              [disabled]="sel().size === 0"
              class="btn-danger"
              [title]="'Marcar como ' + estadoObservado"
            >
              <lucide-angular [img]="MessageSquareWarningIcon" class="size-4" />
              Observar
            </button>
          }
        </div>
      </header>

      <!-- Panel grilla -->
      <div class="bg-card rounded-xl ring-1 ring-border shadow-sm overflow-hidden">
        <!-- Filtros -->
        <div class="p-4 bg-secondary/40 border-b border-border flex flex-col md:flex-row gap-3 flex-wrap items-stretch md:items-center">
          <div class="flex flex-wrap gap-2">
            <button
              (click)="tab.set('TODOS')"
              class="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
              [class]="tab() === 'TODOS' ? 'bg-brand text-brand-foreground border-brand' : 'bg-card text-muted-foreground border-border hover:text-foreground'"
            >Todos ({{ counts()['TODOS'] }})</button>
            @for (e of estadosVisiblesEnBandeja(); track e) {
              <button
                (click)="tab.set(e)"
                class="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
                [class]="tab() === e ? 'bg-brand text-brand-foreground border-brand' : 'bg-card text-muted-foreground border-border hover:text-foreground'"
              >{{ e }} ({{ counts()[e] ?? 0 }})</button>
            }
          </div>

          <div class="flex items-center gap-1 ring-1 ring-border rounded-lg p-0.5 bg-card">
            @for (t of tiposFiltro; track t.k) {
              <button
                (click)="tipoFiltro.set(t.k)"
                class="px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors"
                [class]="tipoFiltro() === t.k ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'"
              >{{ t.label }}</button>
            }
          </div>

          <div class="relative flex-1 min-w-[220px]">
            <lucide-angular [img]="SearchIcon" class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              [value]="q()"
              (input)="q.set($any($event.target).value)"
              type="text"
              placeholder="Buscar por código, tema o extensionista…"
              class="w-full pl-10 pr-9 py-2 bg-card ring-1 ring-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
            />
            @if (q()) {
              <button
                (click)="q.set('')"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Limpiar búsqueda"
              >
                <lucide-angular [img]="XIcon" class="size-4" />
              </button>
            }
          </div>

          <!-- Exportación junto al buscador (misma identidad que la Bandeja N1) -->
          <button
            (click)="exportarExcel()"
            title="Exportar Excel"
            aria-label="Exportar la tabla a Excel"
            class="p-2 rounded-lg transition-all bg-success text-success-foreground hover:bg-success/85 shadow-sm shrink-0"
          >
            <lucide-angular [img]="FileSpreadsheetIcon" class="size-4" />
          </button>

          @if (selectables().length > 0) {
            <label class="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                [checked]="sel().size === selectables().length && selectables().length > 0"
                (change)="toggleAll()"
                class="size-4 accent-primary rounded"
              />
              Seleccionar accionables ({{ selectables().length }})
            </label>
          }
        </div>

        <!-- Tabla -->
        <div class="overflow-auto max-h-[60vh]">
          <table class="w-full text-left min-w-[1100px]">
            <thead class="bg-secondary sticky top-0 z-10 shadow-sm">
              <tr class="text-muted-foreground label-ds">
                <th class="th-ds py-3 w-10"></th>
                <th class="th-ds py-3 text-center">Acciones</th>
                <th class="th-ds py-3">Tipo / Tema</th>
                <th class="th-ds py-3">Estado</th>
                <th class="th-ds py-3">Fecha</th>
                <th class="th-ds py-3 text-center">Horas</th>
                <th class="th-ds py-3 text-center">Participantes</th>
                <th class="th-ds py-3">Ubicación</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              @for (c of filtered(); track c.id) {
                <tr class="hover:bg-secondary/40 transition-colors">
                  <td class="td-ds py-4">
                    <input
                      type="checkbox"
                      [checked]="sel().has(c.id)"
                      [disabled]="!isSelectable(c)"
                      (change)="toggleSel(c.id)"
                      [title]="isSelectable(c) ? 'Seleccionar' : 'Estado no accionable'"
                      class="size-4 accent-primary disabled:opacity-30 disabled:cursor-not-allowed"
                    />
                  </td>
                  <td class="td-ds py-4">
                    <div class="flex items-center justify-center gap-1 flex-wrap">
                      <button title="Ver datos" aria-label="Ver datos" (click)="irPaso(c, 1)"
                        class="p-2 rounded-lg transition-all" [class]="tone('blue')">
                        <lucide-angular [img]="FileTextIcon" class="size-4" />
                      </button>
                      <button title="Ver participantes" aria-label="Ver participantes" (click)="irPaso(c, 2)"
                        class="p-2 rounded-lg transition-all" [class]="tone('indigo')">
                        <lucide-angular [img]="UsersIcon" class="size-4" />
                      </button>
                      @if ((c.observacionesHistorial?.length ?? 0) > 0) {
                        <button title="Ver observaciones" aria-label="Ver observaciones" (click)="obsView.set(c)"
                          class="p-2 rounded-lg transition-all" [class]="tone('amber')">
                          <lucide-angular [img]="AlertTriangleIcon" class="size-4" />
                        </button>
                      }
                      @if (c.fotoSustento) {
                        <button title="Descargar sustento" aria-label="Descargar sustento" (click)="descargaSimulada()"
                          class="p-2 rounded-lg transition-all" [class]="tone('indigo')">
                          <lucide-angular [img]="DownloadIcon" class="size-4" />
                        </button>
                      }
                    </div>
                  </td>
                  <td class="td-ds py-4">
                    <div class="mb-1">
                      <span
                        class="text-[9px] px-1.5 py-0.5 font-bold uppercase rounded-sm"
                        [class]="c.tipo === 'capacitacion' ? 'bg-state-validado-soft text-state-validado-foreground' : 'bg-success-soft text-success'"
                      >{{ c.tipo === 'capacitacion' ? 'Capacitación' : 'Asist. Técnica' }}</span>
                      <span class="ml-2 text-[10px] font-mono text-muted-foreground">{{ c.codigo }}</span>
                    </div>
                    <p class="text-sm font-semibold text-foreground leading-tight max-w-sm">{{ c.nombreTema }}</p>
                    <p class="text-[11px] text-muted-foreground mt-0.5 truncate max-w-sm">{{ c.extensionista }}</p>
                  </td>
                  <td class="td-ds py-4 whitespace-nowrap"><app-estado-badge [estado]="c.estado" /></td>
                  <td class="td-ds py-4 whitespace-nowrap text-muted-foreground font-medium">{{ c.fecha }}</td>
                  <td class="td-ds py-4 text-center font-bold text-foreground/80 tabular-nums">{{ c.horas }} h</td>
                  <td class="td-ds py-4 text-center">
                    <button
                      type="button"
                      (click)="toggleExpand(c.id)"
                      [disabled]="totalDe(c) === 0"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ring-1 text-xs font-bold tabular-nums transition-colors"
                      [class]="participantesBtnCls(c)"
                      [attr.aria-expanded]="isExpanded(c)"
                      [attr.aria-label]="showCount(c) + ' participante(s)'"
                    >
                      <lucide-angular [img]="UsersIcon" class="size-3.5" />
                      <span>{{ showCount(c) }}{{ queryActive() && matchesDe(c.id).length > 0 ? ' / ' + totalDe(c) : '' }}</span>
                      @if (totalDe(c) > 0) {
                        <lucide-angular [img]="isExpanded(c) ? ChevronUpIcon : ChevronDownIcon" class="size-3.5" />
                      }
                    </button>
                  </td>
                  <td class="td-ds py-4">
                    <div class="flex items-start text-xs text-muted-foreground">
                      <lucide-angular [img]="MapPinIcon" class="size-3 mr-1 mt-0.5 text-muted-foreground/70 shrink-0" />
                      <span>{{ c.region }} / {{ c.provincia }} / {{ c.distrito }}</span>
                    </div>
                  </td>
                </tr>
                @if (isExpanded(c) && totalDe(c) > 0) {
                  <tr class="bg-secondary/20">
                    <td colspan="8" class="px-0 py-0">
                      <div class="thin-scroll max-h-[156px] overflow-y-auto">
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
              @if (filtered().length === 0) {
                <tr>
                  <td colspan="8">
                    <div class="empty-state">
                      <lucide-angular [img]="ClipboardListIcon" class="size-8 text-muted-foreground/40" />
                      <p class="text-sm font-medium text-foreground">Bandeja vacía</p>
                      <p class="text-xs">No hay registros en bandeja para los filtros actuales.</p>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal observaciones (historial) -->
      @if (obsView(); as curso) {
        <app-modal [title]="'Observaciones — ' + curso.codigo" (closed)="obsView.set(null)">
          @if ((curso.observacionesHistorial?.length ?? 0) > 0) {
            <ul class="space-y-3">
              @for (o of curso.observacionesHistorial; track $index) {
                <li class="text-sm border-l-2 border-state-observado pl-3">
                  <p class="text-[11px] text-muted-foreground">{{ o.fecha }} · {{ o.autor ?? '—' }}</p>
                  <p class="text-foreground">{{ o.descripcion }}</p>
                </li>
              }
            </ul>
          } @else {
            <p class="text-sm text-muted-foreground">Sin observaciones.</p>
          }
        </app-modal>
      }


      <!-- Modal observar -->
      @if (observarOpen()) {
        <app-modal
          [title]="'Observar ' + sel().size + ' registro(s)'"
          tipo="warning"
          mensaje="Indique el motivo de la observación. Los registros seleccionados regresarán al responsable para su subsanación."
          [mostrarAcciones]="true"
          (aceptado)="confirmarObservar()"
          (cancelado)="observarOpen.set(false)"
          (closed)="observarOpen.set(false)"
        >
          <label class="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
            Descripción de la observación
          </label>
          <textarea
            rows="5"
            [value]="observarTexto()"
            (input)="observarTexto.set($any($event.target).value)"
            placeholder="Detalle qué debe corregir el área responsable…"
            class="w-full bg-background ring-1 ring-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
          ></textarea>
          <label class="block text-xs font-semibold text-muted-foreground mb-1 mt-4 uppercase tracking-wider">
            Fecha de registro (dd/mm/yyyy)
          </label>
          <div class="flex items-center gap-3">
            <input
              type="date"
              [value]="observarFecha()"
              (input)="observarFecha.set($any($event.target).value)"
              class="bg-background ring-1 ring-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
            <span class="text-xs text-muted-foreground">
              → {{ fechaObservacionTexto() }}
            </span>
          </div>
        </app-modal>
      }
    </section>
  `,
})
export class SeguimientoPanelComponent {
  private readonly areaService = inject(AreaService);
  private readonly cursosService = inject(CursosService);
  private readonly modales = inject(ModalService);
  private readonly participantesService = inject(ParticipantesService);
  private readonly estadoPermisos = inject(EstadoPermisosService);
  private readonly router = inject(Router);

  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly estadosEntrada = input.required<EstadoCurso[]>();
  readonly labelAprobar = input.required<string>();
  readonly rol = input<'ADMIN_DZ' | 'ADMIN_UE'>('ADMIN_DZ');
  /** Etiqueta visible del perfil (los códigos DZ/UE controlan los estados accionables). */
  readonly rolLabel = input<string>('');

  readonly SearchIcon = Search;
  readonly AlertTriangleIcon = AlertTriangle;
  readonly DownloadIcon = Download;
  readonly CheckCircle2Icon = CheckCircle2;
  readonly MessageSquareWarningIcon = MessageSquareWarning;
  readonly MapPinIcon = MapPin;
  readonly ClipboardListIcon = ClipboardList;
  readonly UsersIcon = Users;
  readonly ChevronDownIcon = ChevronDown;
  readonly ChevronUpIcon = ChevronUp;
  readonly XIcon = X;
  readonly FileTextIcon = FileText;
  readonly FileSpreadsheetIcon = FileSpreadsheet;

  readonly tiposFiltro = [
    { k: 'TODOS' as const, label: 'Todos' },
    { k: 'capacitacion' as const, label: 'Capacitaciones' },
    { k: 'asistencia' as const, label: 'Asist. Técnicas' },
  ];

  readonly q = signal('');
  readonly tab = signal<'TODOS' | EstadoCurso>('TODOS');
  readonly tipoFiltro = signal<'TODOS' | 'capacitacion' | 'asistencia'>('TODOS');
  readonly sel = signal<Set<string>>(new Set());
  readonly obsView = signal<Curso | null>(null);
  readonly expanded = signal<Set<string>>(new Set());
  readonly observarOpen = signal(false);
  readonly observarTexto = signal('');
  readonly observarFecha = signal(todayISO());

  private readonly accionables = computed(() =>
    this.rol() === 'ADMIN_UE' ? ACCIONABLES_UE : ACCIONABLES_DZ,
  );

  /**
   * Estados que produce el perfil en sesión al aprobar u observar, según el
   * cuadro oficial. `null` = el cuadro no le autoriza esa acción, y entonces
   * el botón correspondiente no se ofrece.
   */
  readonly estadoAprobar = this.estadoPermisos.estadoAprobarSesion;
  readonly estadoObservar = this.estadoPermisos.estadoObservarSesion;

  /**
   * Estados que este perfil ve en la bandeja: los que le toca evaluar (flujo)
   * más los que el cuadro le autoriza a visualizar. Sin la primera parte, un
   * evaluador no vería los registros que debe atender; sin la segunda, vería
   * estados que el cuadro no le asigna.
   */
  readonly estadosVisiblesEnBandeja = computed(() =>
    this.estadosEntrada().filter(
      (estado) =>
        this.accionables().includes(estado) || this.estadoPermisos.sesionPuedeVisualizar(estado),
    ),
  );

  readonly inbox = computed(() =>
    this.cursosService
      .cursos()
      .filter(
        (c) =>
          this.estadosVisiblesEnBandeja().includes(c.estado) &&
          c.area === this.areaService.currentArea(),
      ),
  );

  readonly counts = computed(() => {
    const inbox = this.inbox();
    const out: Record<string, number> = { TODOS: inbox.length };
    this.estadosVisiblesEnBandeja().forEach(
      (e) => (out[e] = inbox.filter((c) => c.estado === e).length),
    );
    return out;
  });

  readonly queryActive = computed(() => this.q().trim().length > 0);
  private readonly qLower = computed(() => this.q().trim().toLowerCase());

  readonly filtered = computed(() => {
    let base = this.tab() === 'TODOS' ? this.inbox() : this.inbox().filter((c) => c.estado === this.tab());
    if (this.tipoFiltro() !== 'TODOS') base = base.filter((c) => c.tipo === this.tipoFiltro());
    if (this.queryActive()) {
      const s = this.qLower();
      base = base.filter((c) => {
        const hitCurso =
          c.codigo.toLowerCase().includes(s) ||
          c.nombreTema.toLowerCase().includes(s) ||
          c.extensionista.toLowerCase().includes(s);
        if (hitCurso) return true;
        return this.matchesDe(c.id).length > 0;
      });
    }
    return base;
  });

  readonly selectables = computed(() =>
    this.filtered().filter((c) => this.accionables().includes(c.estado)),
  );

  readonly fechaObservacionTexto = computed(
    () => isoToDDMMYYYY(this.observarFecha()) || todayDDMMYYYY(),
  );

  matchesDe(cursoId: string): Participante[] {
    if (!this.queryActive()) return [];
    const s = this.qLower();
    return this.participantesService.participantesDe(cursoId).filter(
      (p) =>
        p.nombres.toLowerCase().includes(s) ||
        p.apellidos.toLowerCase().includes(s) ||
        `${p.nombres} ${p.apellidos}`.toLowerCase().includes(s) ||
        `${p.apellidos} ${p.nombres}`.toLowerCase().includes(s) ||
        p.dni.toLowerCase().includes(s),
    );
  }

  subRows(c: Curso): Participante[] {
    return this.queryActive() ? this.matchesDe(c.id) : this.participantesService.participantesDe(c.id);
  }

  /** Total real de participantes (fuente de verdad: `ParticipantesService`). */
  totalDe(c: Curso): number {
    return this.participantesService.totalDe(c.id);
  }

  showCount(c: Curso): number {
    return this.queryActive() ? this.matchesDe(c.id).length : this.totalDe(c);
  }

  esMatch(c: Curso, p: Participante): boolean {
    return this.queryActive() && this.matchesDe(c.id).some((m) => m.id === p.id);
  }

  isExpanded(c: Curso): boolean {
    if (this.queryActive()) return this.matchesDe(c.id).length > 0 || this.expanded().has(c.id);
    return this.expanded().has(c.id);
  }

  isSelectable(c: Curso): boolean {
    return this.accionables().includes(c.estado);
  }

  participantesBtnCls(c: Curso): string {
    const total = this.totalDe(c);
    if (total === 0) return 'ring-border text-muted-foreground/60 cursor-not-allowed';
    return this.isExpanded(c)
      ? 'bg-brand text-brand-foreground ring-brand'
      : 'bg-brand-soft text-brand ring-brand/30 hover:bg-brand hover:text-brand-foreground';
  }

  tone(t: string): string {
    return ICON_TONES[t] ?? '';
  }

  toggleExpand(id: string): void {
    this.expanded.update((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  toggleSel(id: string): void {
    this.sel.update((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  toggleAll(): void {
    this.sel.update((prev) =>
      prev.size === this.selectables().length
        ? new Set<string>()
        : new Set(this.selectables().map((c) => c.id)),
    );
  }

  irPaso(c: Curso, paso: 1 | 2): void {
    this.router.navigate(['/capacitaciones-n1', c.id], { queryParams: { paso } });
  }

  /** Confirmación mediante el sistema unificado de modales. */
  confirmarValidacionSeleccion(): void {
    const estado = this.estadoAprobar();
    const n = this.sel().size;
    if (!n || !estado) return;
    void this.modales
      .openConfirm(
        'Confirmar aprobación',
        `¿Está seguro de ${this.labelAprobar().toLowerCase()} ${n} registro(s)? ` +
          `Esta acción cambiará el estado de todos los registros seleccionados a "${estado}".`,
      )
      .then((ok) => {
        if (ok) this.confirmarValidar();
      });
  }

  confirmarValidar(): void {
    // Se revalida contra el cuadro: el estado no se aplica si el perfil no lo
    // tiene autorizado, aunque se llegue aquí por otra vía.
    const estado = this.estadoAprobar();
    if (!estado || !this.estadoPermisos.sesionPuedeRealizar(estado)) return;
    this.sel().forEach((id) => this.cursosService.updateEstado(id, estado));
    this.sel.set(new Set());
  }

  confirmarObservar(): void {
    const estado = this.estadoObservar();
    if (!estado || !this.estadoPermisos.sesionPuedeRealizar(estado)) return;
    if (!this.observarTexto().trim()) {
      void this.modales.openError('Observación incompleta', 'Ingrese una descripción para la observación.');
      return;
    }
    const fechaTxt = this.fechaObservacionTexto();
    const texto = `${this.observarTexto().trim()}  ·  Fecha: ${fechaTxt}`;
    this.sel().forEach((id) => this.cursosService.updateEstado(id, estado, texto));
    this.sel.set(new Set());
    this.observarTexto.set('');
    this.observarFecha.set(todayISO());
    this.observarOpen.set(false);
  }

  /**
   * Exporta la tabla tal como está en pantalla: respeta la pestaña de estado,
   * el filtro por tipo y la búsqueda activa (`filtered()`), en el mismo orden
   * mostrado. Reutiliza el exportador único del sistema (`excel.util`), el
   * mismo que usa la Bandeja N1.
   */
  exportarExcel(): void {
    const base = this.rol() === 'ADMIN_UE' ? 'Seguimiento_Aprobacion' : 'Seguimiento_Revision';
    exportarTablaExcel(base, [
      { titulo: 'Código', valor: (c) => c.codigo },
      { titulo: 'Tipo', valor: (c) => (c.tipo === 'capacitacion' ? 'Capacitación' : 'Asistencia Técnica') },
      { titulo: 'Tema', valor: (c) => c.nombreTema },
      { titulo: 'Estado', valor: (c) => c.estado },
      { titulo: 'Fecha', valor: (c) => c.fecha },
      { titulo: 'Hora', valor: (c) => c.hora },
      { titulo: 'Horas', valor: (c) => c.horas },
      { titulo: 'Participantes', valor: (c) => this.totalDe(c) },
      { titulo: 'Región', valor: (c) => c.region },
      { titulo: 'Provincia', valor: (c) => c.provincia },
      { titulo: 'Distrito', valor: (c) => c.distrito },
      { titulo: 'Extensionista', valor: (c) => c.extensionista },
      { titulo: 'Sustento', valor: (c) => c.fotoSustento ?? '' },
      { titulo: 'Observaciones', valor: (c) => (c.observacionesHistorial ?? []).map((o) => `[${o.fecha}] ${o.descripcion}`).join(' | ') },
    ], this.filtered());
  }

  descargaSimulada(): void {
    void this.modales.openInfo('Descarga de sustento', 'Descarga simulada (disponible al conectar el API real).');
  }
}
