import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AreaService } from '../../core/services/area.service';
import { CursosService } from '../../core/services/cursos.service';
import { ModalService } from '../../core/services/modal.service';
import { ParticipantesService } from '../../core/services/participantes.service';
import { Curso, EstadoCurso } from '../../core/models/curso.model';
import { Participante } from '../../core/models/participante.model';
import { EstadoBadgeComponent } from '../../shared/components/estado-badge/estado-badge.component';
import {
  ObservacionesData,
  ObservacionesDialogComponent,
} from '../../shared/components/observaciones-dialog/observaciones-dialog.component';
import {
  ObservarData,
  ObservarDialogComponent,
  ObservarResultado,
} from './observar-dialog.component';
import { exportarTablaExcel } from '../../shared/utils/excel.util';
import { isoToDDMMYYYY, todayDDMMYYYY } from '../../shared/utils/fecha.util';

const ACCIONABLES_DZ: EstadoCurso[] = ['Enviado', 'Enviado-Subsanado'];
const ACCIONABLES_UE: EstadoCurso[] = ['Enviado', 'Enviado-Subsanado', 'Validado'];

/** Acción de fila: icono, ayuda y tono del tema. */
interface AccionFila {
  tipo: 'VER_DATOS' | 'VER_PARTICIPANTES' | 'OBSERVACIONES' | 'DESCARGAR';
  icono: string;
  etiqueta: string;
  tono: string;
}

/** Columnas de datos; `detalle` es la fila expandible de participantes. */
const COLUMNAS = ['seleccion', 'acciones', 'tema', 'estado', 'fecha', 'horas', 'participantes', 'ubicacion'];

/** Bandeja de revisión/aprobación con selección múltiple y observaciones. */
@Component({
  selector: 'app-seguimiento-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    MatTooltipModule,
    EstadoBadgeComponent,
  ],
  template: `
    <section class="pagina">
      <header class="cabecera">
        <div>
          <div class="titulo">
            <mat-icon fontSet="material-symbols-outlined">assignment</mat-icon>
            <h1>{{ title() }}</h1>
            <mat-chip disableRipple class="perfil">{{ rolLabel() || rol() }}</mat-chip>
          </div>
          <p class="subtitulo">{{ subtitle() }}</p>
        </div>
        <div class="acciones-masivas">
          <button matButton="filled" [disabled]="sel().size === 0" (click)="confirmarValidacionSeleccion()">
            <mat-icon fontSet="material-symbols-outlined">check_circle</mat-icon>
            {{ labelAprobar() }} seleccionados ({{ sel().size }})
          </button>
          <button matButton="filled" class="observar" [disabled]="sel().size === 0" (click)="abrirObservar()">
            <mat-icon fontSet="material-symbols-outlined">feedback</mat-icon>
            Observar
          </button>
        </div>
      </header>

      <mat-card appearance="outlined" class="panel">
        <!-- Filtros -->
        <div class="filtros">
          <mat-chip-listbox
            [value]="tab()"
            (change)="tab.set($event.value ?? 'TODOS')"
            hideSingleSelectionIndicator
            aria-label="Filtrar por estado"
          >
            <mat-chip-option value="TODOS">Todos ({{ counts()['TODOS'] }})</mat-chip-option>
            @for (e of estadosEntrada(); track e) {
              <mat-chip-option [value]="e">{{ e }} ({{ counts()[e] ?? 0 }})</mat-chip-option>
            }
          </mat-chip-listbox>

          <div class="fila-busqueda">
            <mat-button-toggle-group
              [value]="tipoFiltro()"
              (valueChange)="tipoFiltro.set($event)"
              hideSingleSelectionIndicator
              aria-label="Filtrar por tipo"
            >
              @for (t of tiposFiltro; track t.k) {
                <mat-button-toggle [value]="t.k">{{ t.label }}</mat-button-toggle>
              }
            </mat-button-toggle-group>

            <mat-form-field subscriptSizing="dynamic" class="buscador">
              <mat-label>Buscar</mat-label>
              <mat-icon matPrefix fontSet="material-symbols-outlined">search</mat-icon>
              <input
                matInput
                type="text"
                [value]="q()"
                placeholder="Buscar por código, tema o extensionista…"
                aria-label="Buscar registros"
                (input)="q.set($any($event.target).value)"
              />
              @if (q()) {
                <button matIconButton matSuffix type="button" (click)="q.set('')" aria-label="Limpiar búsqueda">
                  <mat-icon fontSet="material-symbols-outlined">close</mat-icon>
                </button>
              }
            </mat-form-field>

            <button
              matIconButton
              class="excel"
              matTooltip="Exportar Excel"
              aria-label="Exportar la tabla a Excel"
              (click)="exportarExcel()"
            >
              <mat-icon fontSet="material-symbols-outlined">table_view</mat-icon>
            </button>

            @if (selectables().length > 0) {
              <mat-checkbox
                [checked]="todosSeleccionados()"
                [indeterminate]="algunosSeleccionados()"
                (change)="toggleAll()"
              >Seleccionar accionables ({{ selectables().length }})</mat-checkbox>
            }
          </div>
        </div>

        <!-- Grilla -->
        <div class="tabla-contenedor">
          <table mat-table [dataSource]="filtered()" multiTemplateDataRows>
            <ng-container matColumnDef="seleccion">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let c">
                <mat-checkbox
                  [checked]="sel().has(c.id)"
                  [disabled]="!isSelectable(c)"
                  [matTooltip]="isSelectable(c) ? 'Seleccionar' : 'Estado no accionable'"
                  (change)="toggleSel(c.id)"
                />
              </td>
            </ng-container>

            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef>Acciones</th>
              <td mat-cell *matCellDef="let c">
                <div class="acciones-fila">
                  @for (a of accionesDe(c); track a.tipo) {
                    <button
                      matIconButton
                      class="accion"
                      [class]="a.tono"
                      [matTooltip]="a.etiqueta"
                      [attr.aria-label]="a.etiqueta"
                      (click)="accion(a.tipo, c)"
                    >
                      <mat-icon fontSet="material-symbols-outlined">{{ a.icono }}</mat-icon>
                    </button>
                  }
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="tema">
              <th mat-header-cell *matHeaderCellDef>Tipo / Tema</th>
              <td mat-cell *matCellDef="let c">
                <div class="linea-tipo">
                  <mat-chip disableRipple [class]="c.tipo === 'capacitacion' ? 'c-validado' : 'c-aprobado'">
                    {{ c.tipo === 'capacitacion' ? 'Capacitación' : 'Asist. Técnica' }}
                  </mat-chip>
                  <span class="codigo">{{ c.codigo }}</span>
                </div>
                <p class="tema">{{ c.nombreTema }}</p>
                <p class="extensionista">{{ c.extensionista }}</p>
              </td>
            </ng-container>

            <ng-container matColumnDef="estado">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let c"><app-estado-badge [estado]="c.estado" /></td>
            </ng-container>

            <ng-container matColumnDef="fecha">
              <th mat-header-cell *matHeaderCellDef>Fecha</th>
              <td mat-cell *matCellDef="let c" class="tenue">{{ c.fecha }}</td>
            </ng-container>

            <ng-container matColumnDef="horas">
              <th mat-header-cell *matHeaderCellDef>Horas</th>
              <td mat-cell *matCellDef="let c" class="numerico">{{ c.horas }} h</td>
            </ng-container>

            <ng-container matColumnDef="participantes">
              <th mat-header-cell *matHeaderCellDef>Participantes</th>
              <td mat-cell *matCellDef="let c">
                <button
                  matButton="outlined"
                  type="button"
                  class="participantes"
                  [class.activo]="isExpanded(c)"
                  [disabled]="(c.participantes ?? 0) === 0"
                  [attr.aria-expanded]="isExpanded(c)"
                  [attr.aria-label]="showCount(c) + ' participante(s)'"
                  (click)="toggleExpand(c.id)"
                >
                  <mat-icon fontSet="material-symbols-outlined">groups</mat-icon>
                  {{ showCount(c) }}{{ queryActive() && matchesDe(c.id).length > 0 ? ' / ' + (c.participantes ?? 0) : '' }}
                  @if ((c.participantes ?? 0) > 0) {
                    <mat-icon fontSet="material-symbols-outlined" iconPositionEnd>
                      {{ isExpanded(c) ? 'expand_less' : 'expand_more' }}
                    </mat-icon>
                  }
                </button>
              </td>
            </ng-container>

            <ng-container matColumnDef="ubicacion">
              <th mat-header-cell *matHeaderCellDef>Ubicación</th>
              <td mat-cell *matCellDef="let c">
                <span class="ubicacion">
                  <mat-icon fontSet="material-symbols-outlined">location_on</mat-icon>
                  {{ c.region }} / {{ c.provincia }} / {{ c.distrito }}
                </span>
              </td>
            </ng-container>

            <!-- Fila expandible: existe siempre y colapsa a cero altura. -->
            <ng-container matColumnDef="detalle">
              <td mat-cell *matCellDef="let c" [attr.colspan]="columnas.length" class="celda-detalle">
                @if (isExpanded(c) && (c.participantes ?? 0) > 0) {
                  <div class="detalle">
                    @if (subRows(c).length === 0) {
                      <p class="sin-coincidencias">Sin coincidencias en los participantes de este registro.</p>
                    } @else {
                      <ul>
                        @for (p of subRows(c); track p.id) {
                          <li [class.resaltado]="esMatch(c, p)">
                            <span class="dni">{{ p.dni }}</span>
                            <span class="nombre">{{ p.nombres }} {{ p.apellidos }}</span>
                            <mat-chip
                              disableRipple
                              [class]="p.tipoParticipante === 'PRODUCTOR' ? 'c-aprobado' : 'c-registrado'"
                            >{{ p.tipoParticipante }}</mat-chip>
                          </li>
                        }
                      </ul>
                    }
                  </div>
                }
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columnas; sticky: true"></tr>
            <tr mat-row *matRowDef="let c; columns: columnas" class="fila-datos"></tr>
            <tr mat-row *matRowDef="let c; columns: ['detalle']" class="fila-detalle"></tr>
            <tr class="fila-vacia" *matNoDataRow>
              <td [attr.colspan]="columnas.length">
                <div class="sin-datos">
                  <mat-icon fontSet="material-symbols-outlined">assignment</mat-icon>
                  <p class="titulo-vacio">Bandeja vacía</p>
                  <p>No hay registros en bandeja para los filtros actuales.</p>
                </div>
              </td>
            </tr>
          </table>
        </div>
      </mat-card>
    </section>
  `,
  styles: `
    .pagina {
      padding: 16px;
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    @media (min-width: 768px) { .pagina { padding: 32px; } }

    .cabecera {
      display: flex;
      flex-direction: column;
      gap: 16px;
      justify-content: space-between;
    }
    @media (min-width: 768px) { .cabecera { flex-direction: row; align-items: flex-end; } }
    .titulo { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .titulo mat-icon { color: var(--mat-sys-primary); }
    .titulo h1 { margin: 0; font: var(--mat-sys-headline-small); }
    .perfil {
      --mat-chip-label-text-size: 11px;
      --mat-chip-container-height: 24px;
      --mat-chip-outline-width: 0;
      --mat-chip-elevated-container-color: var(--mat-sys-surface-container-highest);
      --mat-chip-label-text-color: var(--mat-sys-on-surface-variant);
      letter-spacing: 0.1em;
    }
    .subtitulo {
      margin: 4px 0 0;
      max-width: 80ch;
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
    }
    .acciones-masivas { display: flex; flex-wrap: wrap; gap: 8px; }
    /* Observar devuelve el registro al responsable: tono de error del tema. */
    .observar:not([disabled]) {
      --mat-button-filled-container-color: var(--mat-sys-error);
      --mat-button-filled-label-text-color: var(--mat-sys-on-error);
    }

    .panel { padding: 0; overflow: hidden; }
    .filtros {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      background: var(--mat-sys-surface-container-low);
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }
    .fila-busqueda { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
    .buscador { flex: 1 1 240px; }

    .tabla-contenedor { overflow: auto; max-height: 60vh; }
    table { width: 100%; min-width: 1100px; }
    .mat-column-seleccion { width: 40px; }
    .mat-column-acciones { width: 1px; white-space: nowrap; }
    .mat-column-estado, .mat-column-fecha { white-space: nowrap; }
    .mat-column-horas, .mat-column-participantes { text-align: center; }

    .acciones-fila { display: flex; align-items: center; justify-content: center; gap: 2px; }
    .linea-tipo { display: flex; align-items: center; gap: 8px; }
    .codigo { font-family: monospace; font-size: 11px; color: var(--mat-sys-on-surface-variant); }
    .tema {
      margin: 4px 0 0;
      max-width: 24rem;
      font: var(--mat-sys-body-medium);
      font-weight: 600;
      line-height: 1.3;
    }
    .extensionista {
      margin: 2px 0 0;
      max-width: 24rem;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .tenue { color: var(--mat-sys-on-surface-variant); }
    .numerico { font-variant-numeric: tabular-nums; font-weight: 600; }
    .ubicacion {
      display: inline-flex;
      align-items: flex-start;
      gap: 4px;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }
    .ubicacion mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .participantes {
      --mat-button-outlined-container-shape: var(--mat-sys-corner-medium);
      height: 32px;
      font-variant-numeric: tabular-nums;
    }
    .participantes.activo {
      --mat-button-outlined-label-text-color: var(--mat-sys-on-primary-container);
      background: var(--mat-sys-primary-container);
    }
    .participantes mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .celda-detalle { padding: 0; }
    tr.fila-detalle { height: auto; }
    .detalle { max-height: 156px; overflow-y: auto; background: var(--mat-sys-surface-container-low); }
    .detalle ul { margin: 0; padding: 0; list-style: none; }
    .detalle li {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 24px;
      border-left: 4px solid transparent;
      font: var(--mat-sys-body-small);
    }
    .detalle li + li { border-top: 1px solid var(--mat-sys-outline-variant); }
    .detalle li.resaltado {
      background: var(--estado-subsanado-fondo);
      border-left-color: var(--estado-subsanado);
    }
    .detalle .dni { width: 6rem; font-variant-numeric: tabular-nums; color: var(--mat-sys-on-surface-variant); }
    .detalle .nombre { flex: 1; font-weight: 600; }
    .sin-coincidencias {
      margin: 0;
      padding: 12px 24px;
      font: var(--mat-sys-body-small);
      font-style: italic;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class SeguimientoPanelComponent {
  private readonly areaService = inject(AreaService);
  private readonly cursosService = inject(CursosService);
  private readonly modales = inject(ModalService);
  private readonly participantesService = inject(ParticipantesService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly estadosEntrada = input.required<EstadoCurso[]>();
  readonly estadoAprobar = input.required<EstadoCurso>();
  readonly labelAprobar = input.required<string>();
  readonly rol = input<'ADMIN_DZ' | 'ADMIN_UE'>('ADMIN_DZ');
  /** Etiqueta visible del perfil (los códigos DZ/UE controlan los estados accionables). */
  readonly rolLabel = input<string>('');

  readonly columnas = COLUMNAS;

  readonly tiposFiltro = [
    { k: 'TODOS' as const, label: 'Todos' },
    { k: 'capacitacion' as const, label: 'Capacitaciones' },
    { k: 'asistencia' as const, label: 'Asist. Técnicas' },
  ];

  readonly q = signal('');
  readonly tab = signal<'TODOS' | EstadoCurso>('TODOS');
  readonly tipoFiltro = signal<'TODOS' | 'capacitacion' | 'asistencia'>('TODOS');
  readonly sel = signal<Set<string>>(new Set());
  readonly expanded = signal<Set<string>>(new Set());

  private readonly accionables = computed(() =>
    this.rol() === 'ADMIN_UE' ? ACCIONABLES_UE : ACCIONABLES_DZ,
  );

  readonly inbox = computed(() =>
    this.cursosService
      .cursos()
      .filter((c) => this.estadosEntrada().includes(c.estado) && c.area === this.areaService.currentArea()),
  );

  readonly counts = computed(() => {
    const inbox = this.inbox();
    const out: Record<string, number> = { TODOS: inbox.length };
    this.estadosEntrada().forEach((e) => (out[e] = inbox.filter((c) => c.estado === e).length));
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

  /** Estado del "Seleccionar accionables": todo, parte (indeterminado) o nada. */
  readonly todosSeleccionados = computed(
    () => this.selectables().length > 0 && this.sel().size === this.selectables().length,
  );
  readonly algunosSeleccionados = computed(
    () => this.sel().size > 0 && !this.todosSeleccionados(),
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

  isSelectable(c: Curso): boolean {
    return this.accionables().includes(c.estado);
  }

  /** Acciones disponibles para el registro (ver datos, participantes, obs., sustento). */
  accionesDe(c: Curso): AccionFila[] {
    const acciones: AccionFila[] = [
      { tipo: 'VER_DATOS', icono: 'description', etiqueta: 'Ver datos', tono: 'a-info' },
      { tipo: 'VER_PARTICIPANTES', icono: 'groups', etiqueta: 'Ver participantes', tono: 'a-marca' },
    ];
    if ((c.observacionesHistorial?.length ?? 0) > 0) {
      acciones.push({ tipo: 'OBSERVACIONES', icono: 'warning', etiqueta: 'Ver observaciones', tono: 'a-alerta' });
    }
    if (c.fotoSustento) {
      acciones.push({ tipo: 'DESCARGAR', icono: 'download', etiqueta: 'Descargar sustento', tono: 'a-marca' });
    }
    return acciones;
  }

  accion(tipo: AccionFila['tipo'], c: Curso): void {
    switch (tipo) {
      case 'VER_DATOS':
        this.irPaso(c, 1);
        break;
      case 'VER_PARTICIPANTES':
        this.irPaso(c, 2);
        break;
      case 'OBSERVACIONES':
        this.verObservaciones(c);
        break;
      case 'DESCARGAR':
        this.descargaSimulada();
        break;
    }
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

  verObservaciones(c: Curso): void {
    this.dialog.open<ObservacionesDialogComponent, ObservacionesData>(ObservacionesDialogComponent, {
      data: { codigo: c.codigo, observaciones: c.observacionesHistorial ?? [] },
      width: '560px',
      maxWidth: '95vw',
      autoFocus: 'dialog',
      restoreFocus: true,
    });
  }

  /** Confirmación mediante el sistema unificado de modales. */
  confirmarValidacionSeleccion(): void {
    const n = this.sel().size;
    if (!n) return;
    void this.modales
      .openConfirm(
        'Confirmar validación',
        `¿Está seguro de ${this.labelAprobar().toLowerCase()} ${n} registro(s)? ` +
          `Esta acción cambiará el estado de todos los registros seleccionados a "${this.estadoAprobar()}".`,
      )
      .then((ok) => {
        if (ok) this.confirmarValidar();
      });
  }

  confirmarValidar(): void {
    this.sel().forEach((id) => this.cursosService.updateEstado(id, this.estadoAprobar()));
    this.sel.set(new Set());
  }

  /** Motivo de la observación en diálogo; al aceptar se aplica a la selección. */
  abrirObservar(): void {
    if (this.sel().size === 0) return;
    const ref = this.dialog.open<ObservarDialogComponent, ObservarData, ObservarResultado>(
      ObservarDialogComponent,
      {
        data: { cantidad: this.sel().size },
        width: '520px',
        maxWidth: '95vw',
        autoFocus: 'first-tabbable',
        restoreFocus: true,
      },
    );
    ref.afterClosed().subscribe((r) => {
      if (r) this.observarSeleccion(r);
    });
  }

  private observarSeleccion({ texto, fecha }: ObservarResultado): void {
    const fechaTxt = isoToDDMMYYYY(fecha) || todayDDMMYYYY();
    const descripcion = `${texto}  ·  Fecha: ${fechaTxt}`;
    this.sel().forEach((id) => this.cursosService.updateEstado(id, 'Observado', descripcion));
    this.sel.set(new Set());
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
      { titulo: 'Participantes', valor: (c) => c.participantes },
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
