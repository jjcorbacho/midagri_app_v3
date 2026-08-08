import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AreaService } from '../../../core/services/area.service';
import { CursosService } from '../../../core/services/cursos.service';
import { ParticipantesService } from '../../../core/services/participantes.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalService } from '../../../core/services/modal.service';
import { Curso, ESTADOS, EstadoCurso, canDeleteCurso } from '../../../core/models/curso.model';
import { Participante } from '../../../core/models/participante.model';
import { EstadoBadgeComponent } from '../../../shared/components/estado-badge/estado-badge.component';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { SustentoData, SustentoDialogComponent } from '../sustento-modal/sustento-dialog.component';
import { ObservacionesData, ObservacionesDialogComponent } from './observaciones-dialog.component';
import { exportarTablaExcel } from '../../../shared/utils/excel.util';
import { parseFechaCurso } from '../../../shared/utils/fecha.util';
import { paginatorIntlEs } from '../../../shared/utils/paginator-intl.es';
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

/** Acción de fila: icono, ayuda y tono sobre los tokens del tema. */
interface AccionFila {
  tipo: 'OBSERVACIONES' | 'PARTICIPANTES' | 'VER_PARTICIPANTES' | 'VER_DATOS' | 'EDITAR' | 'ELIMINAR' | 'SUSTENTO' | 'DESCARGAR';
  icono: string;
  etiqueta: string;
  tono: string;
}

/** Columnas de datos de la grilla; `detalle` es la fila expandible. */
const COLUMNAS = ['acciones', 'tema', 'estado', 'fecha', 'horas', 'participantes', 'ubicacion'];

@Component({
  selector: 'app-bandeja',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Paginador en español dentro del chunk diferido de la vista.
  providers: [{ provide: MatPaginatorIntl, useFactory: paginatorIntlEs }],
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
    EstadoBadgeComponent,
    KpiCardComponent,
    DateRangePickerComponent,
  ],
  template: `
    <section class="pagina">
      <!-- INDICADORES -->
      <div class="kpis-bloque">
        <mat-button-toggle-group
          [value]="kpiView()"
          (valueChange)="kpiView.set($event)"
          hideSingleSelectionIndicator
          aria-label="Vista de indicadores"
        >
          @for (opt of kpiOptions; track opt.k) {
            <mat-button-toggle [value]="opt.k">{{ opt.label }}</mat-button-toggle>
          }
        </mat-button-toggle-group>

        <!-- 4 tarjetas en la vista general; 5 en "Estados y Progreso" (incluye Subsanados). -->
        <div class="kpis" [class.kpis-estados]="kpiView() === 'estados'">
          @if (kpiView() === 'general') {
            <app-kpi-card label="Eventos Registrados" [value]="counts().registrados" icon="menu_book" tone="blue" />
            <app-kpi-card label="Capacitaciones" [value]="counts().caps" icon="assignment_turned_in" tone="teal" />
            <app-kpi-card label="Asistencias Técnicas" [value]="counts().ast" icon="build" tone="emerald" />
            <app-kpi-card label="Participantes Inscritos" [value]="counts().productores" icon="groups" tone="indigo" />
          } @else {
            <app-kpi-card label="Pendiente de envío (registrado)" [value]="counts().pendientes" icon="edit_document" tone="slate" />
            <app-kpi-card label="Enviados a Revisión (enviado)" [value]="counts().enviados" icon="send" tone="blue" />
            <app-kpi-card label="Observados" [value]="counts().observados" icon="report" tone="amber" />
            <app-kpi-card label="Subsanados" [value]="counts().subsanados" icon="fact_check" tone="subsanado" />
            <app-kpi-card label="Aprobado" [value]="counts().aprobados" icon="verified" tone="emerald" />
          }
        </div>
      </div>

      <mat-card appearance="outlined" class="panel">
        <div class="encabezado">
          <div>
            <h2>Bandeja de Control de {{ areaService.currentArea() }}</h2>
            <p>Consulte e ingrese capacitaciones agrarias.</p>
          </div>
          <div class="acciones-alta">
            <button matButton="filled" (click)="nuevo('capacitacion')">
              <mat-icon fontSet="material-symbols-outlined">add</mat-icon>
              Registrar Capacitación
            </button>
            <button matButton="filled" (click)="nuevo('asistencia')">
              <mat-icon fontSet="material-symbols-outlined">add</mat-icon>
              Registrar Asis. Técnica
            </button>
          </div>
        </div>

        <!-- Filtros (organización según la referencia filtros.xlsx) -->
        <div class="filtros">
          <!-- Fila 1: tipo + buscador por campo + exportación -->
          <div class="fila-busqueda">
            <mat-button-toggle-group
              [value]="tab()"
              (valueChange)="setTab($event)"
              hideSingleSelectionIndicator
              aria-label="Filtrar por tipo"
            >
              @for (t of tabs; track t.k) {
                <mat-button-toggle [value]="t.k">
                  {{ t.label }}
                  <span class="conteo">{{ conteoTipos()[t.k] }}</span>
                </mat-button-toggle>
              }
            </mat-button-toggle-group>

            <mat-form-field subscriptSizing="dynamic" class="campo-busqueda">
              <mat-label>Buscar por</mat-label>
              <mat-select
                [value]="campoBusqueda()"
                (valueChange)="setCampoBusqueda($event)"
                aria-label="Campo de búsqueda"
              >
                @for (c of camposBusqueda; track c.k) {
                  <mat-option [value]="c.k">{{ c.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field subscriptSizing="dynamic" class="termino">
              <mat-label>Búsqueda</mat-label>
              <mat-icon matPrefix fontSet="material-symbols-outlined">search</mat-icon>
              <input
                matInput
                type="text"
                [value]="q()"
                (input)="setQ($any($event.target).value)"
                [placeholder]="'Buscar por ' + etiquetaCampoBusqueda() + '…'"
                [attr.aria-label]="'Buscar por ' + etiquetaCampoBusqueda()"
              />
              @if (q()) {
                <button matIconButton matSuffix type="button" (click)="setQ('')" aria-label="Limpiar búsqueda">
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
          </div>

          <!-- Fila 2: estado, cascada territorial y rango de fechas -->
          <div class="fila-filtros">
            <mat-form-field subscriptSizing="dynamic">
              <mat-label>Estado</mat-label>
              <mat-select id="filtro-estado" [value]="estado()" (valueChange)="setEstado($event)">
                <mat-option value="TODOS">Todos</mat-option>
                @for (e of estados; track e) {
                  <mat-option [value]="e">{{ e }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field subscriptSizing="dynamic">
              <mat-label>Región</mat-label>
              <mat-select id="filtro-region" [value]="fRegion()" (valueChange)="setFiltroRegion($event)">
                <mat-option value="">Todas</mat-option>
                @for (r of regionesFiltro; track r) {
                  <mat-option [value]="r">{{ r }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field subscriptSizing="dynamic">
              <mat-label>Provincia</mat-label>
              <mat-select
                id="filtro-provincia"
                [value]="fProvincia()"
                [disabled]="!fRegion()"
                (valueChange)="setFiltroProvincia($event)"
              >
                <mat-option value="">Todas</mat-option>
                @for (pr of provinciasFiltro(); track pr) {
                  <mat-option [value]="pr">{{ pr }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field subscriptSizing="dynamic">
              <mat-label>Distrito</mat-label>
              <mat-select
                id="filtro-distrito"
                [value]="fDistrito()"
                [disabled]="!fProvincia()"
                (valueChange)="setFiltroDistrito($event)"
              >
                <mat-option value="">Todos</mat-option>
                @for (d of distritosFiltro(); track d) {
                  <mat-option [value]="d">{{ d }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <app-date-range-picker [desde]="fDesde()" [hasta]="fHasta()" (rangoChange)="setRangoFechas($event)" />
          </div>
        </div>

        <!-- GRILLA -->
        <div class="tabla-contenedor">
          <table mat-table [dataSource]="pageRows()" multiTemplateDataRows>
            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef>Acciones</th>
              <td mat-cell *matCellDef="let c">
                <div class="acciones-fila">
                  @for (a of accionesDe(c); track a.tipo) {
                    <button
                      matIconButton
                      class="accion"
                      [class]="a.tono"
                      [class.atenuada]="a.tipo === 'ELIMINAR' && deleteBlocked(c)"
                      [matTooltip]="etiquetaAccion(a, c)"
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

            <!-- Fila expandible con los participantes del registro. La fila existe
                 siempre y colapsa a cero cuando no está desplegada. -->
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
                  <mat-icon fontSet="material-symbols-outlined">search_off</mat-icon>
                  <p class="titulo-vacio">Sin resultados</p>
                  <p>No hay registros que coincidan con los filtros aplicados.</p>
                </div>
              </td>
            </tr>
          </table>
        </div>

        <mat-paginator
          [length]="filtered().length"
          [pageSize]="pageSize()"
          [pageIndex]="pageIndex()"
          [pageSizeOptions]="pageSizes"
          showFirstLastButtons
          aria-label="Paginación de la bandeja"
          (page)="onPagina($event)"
        />
      </mat-card>
    </section>
  `,
  styles: `
    .pagina {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    @media (min-width: 1024px) { .pagina { padding: 32px; } }

    .kpis-bloque { display: flex; flex-direction: column; gap: 12px; align-items: flex-start; }
    .kpis {
      display: grid;
      width: 100%;
      gap: 16px;
      grid-template-columns: 1fr;
    }
    @media (min-width: 768px) { .kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (min-width: 1024px) {
      .kpis { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .kpis.kpis-estados { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
    @media (min-width: 1280px) {
      .kpis.kpis-estados { grid-template-columns: repeat(5, minmax(0, 1fr)); }
    }

    .panel { padding: 0; overflow: hidden; }
    .encabezado {
      display: flex;
      flex-direction: column;
      gap: 16px;
      justify-content: space-between;
      padding: 24px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }
    @media (min-width: 768px) { .encabezado { flex-direction: row; align-items: center; } }
    .encabezado h2 { margin: 0; font: var(--mat-sys-title-large); }
    .encabezado p {
      margin: 4px 0 0;
      max-width: 70ch;
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
    }
    .acciones-alta { display: flex; flex-wrap: wrap; gap: 8px; }

    .filtros {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      background: var(--mat-sys-surface-container-low);
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }
    .fila-busqueda { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
    .campo-busqueda { width: 180px; }
    .termino { flex: 1 1 240px; }
    .conteo {
      margin-left: 6px;
      padding: 1px 6px;
      border-radius: var(--mat-sys-corner-full);
      background: var(--mat-sys-surface-container-highest);
      font: var(--mat-sys-label-small);
      font-variant-numeric: tabular-nums;
    }
    .excel {
      background: var(--estado-aprobado);
      color: var(--mat-sys-on-primary);
    }
    .fila-filtros {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      align-items: start;
    }
    @media (min-width: 640px) { .fila-filtros { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (min-width: 1280px) { .fila-filtros { grid-template-columns: repeat(5, minmax(0, 1fr)); } }
    mat-form-field { width: 100%; }

    .tabla-contenedor { overflow: auto; max-height: 60vh; }
    table { width: 100%; min-width: 1100px; }
    .mat-column-acciones { width: 1px; white-space: nowrap; }
    .mat-column-estado, .mat-column-fecha { white-space: nowrap; }
    .mat-column-horas, .mat-column-participantes { text-align: center; }

    .acciones-fila { display: flex; align-items: center; justify-content: center; gap: 2px; }

    .linea-tipo { display: flex; align-items: center; gap: 8px; }
    .codigo {
      font-family: monospace;
      font-size: 11px;
      color: var(--mat-sys-on-surface-variant);
    }
    .tema {
      margin: 4px 0 0;
      max-width: 24rem;
      font: var(--mat-sys-body-medium);
      font-weight: 600;
      line-height: 1.3;
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
    .detalle { max-height: 160px; overflow-y: auto; background: var(--mat-sys-surface-container-low); }
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
export class BandejaComponent {
  readonly areaService = inject(AreaService);
  private readonly modales = inject(ModalService);
  private readonly cursosService = inject(CursosService);
  private readonly participantesService = inject(ParticipantesService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly columnas = COLUMNAS;

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
  readonly pageIndex = signal(0);
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
      /* Registros observados que ya fueron corregidos y reenviados. Se cuentan
         además dentro de "Enviados a Revisión" — el cálculo de las demás
         tarjetas se mantiene intacto por requerimiento. */
      subsanados: delArea.filter((c) => c.estado === 'Enviado-Subsanado').length,
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
  readonly pageRows = computed(() => {
    const p = Math.min(this.pageIndex(), this.totalPages() - 1);
    const size = this.pageSize();
    return this.filtered().slice(p * size, (p + 1) * size);
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

  /** Acciones disponibles para el registro según su estado. */
  accionesDe(c: Curso): AccionFila[] {
    const acciones: AccionFila[] = [];
    if (this.tieneObs(c)) {
      acciones.push({ tipo: 'OBSERVACIONES', icono: 'warning', etiqueta: 'Ver observaciones', tono: 'a-alerta' });
    }
    if (this.editable(c)) {
      acciones.push({ tipo: 'PARTICIPANTES', icono: 'person_add', etiqueta: 'Registrar participantes', tono: 'a-marca' });
    }
    if (this.bloqueado(c)) {
      acciones.push(
        { tipo: 'VER_PARTICIPANTES', icono: 'groups', etiqueta: 'Ver participantes', tono: 'a-info' },
        { tipo: 'VER_DATOS', icono: 'description', etiqueta: 'Ver datos', tono: 'a-info' },
      );
    }
    if (this.editable(c)) {
      acciones.push(
        { tipo: 'EDITAR', icono: 'edit', etiqueta: 'Editar', tono: 'a-neutro' },
        { tipo: 'ELIMINAR', icono: 'delete', etiqueta: 'Eliminar', tono: 'a-error' },
        { tipo: 'SUSTENTO', icono: 'cloud_upload', etiqueta: 'Adjuntar sustento', tono: 'a-primario' },
      );
    }
    if (this.bloqueado(c) && c.fotoSustento) {
      acciones.push({ tipo: 'DESCARGAR', icono: 'download', etiqueta: 'Descargar sustento', tono: 'a-info' });
    }
    return acciones;
  }

  /** Ayuda contextual: eliminar y sustento cambian de texto según el registro. */
  etiquetaAccion(a: AccionFila, c: Curso): string {
    if (a.tipo === 'ELIMINAR' && this.deleteBlocked(c)) {
      return 'No es posible eliminar: tiene participantes registrados';
    }
    if (a.tipo === 'SUSTENTO' && c.estado === 'Observado') return 'Reemplazar sustento y reenviar';
    return a.etiqueta;
  }

  accion(tipo: AccionFila['tipo'], c: Curso): void {
    switch (tipo) {
      case 'OBSERVACIONES':
        this.verObservaciones(c);
        break;
      case 'PARTICIPANTES':
      case 'VER_PARTICIPANTES':
        this.irPaso(c, 2);
        break;
      case 'VER_DATOS':
      case 'EDITAR':
        this.irPaso(c, 1);
        break;
      case 'ELIMINAR':
        this.intentarEliminar(c);
        break;
      case 'SUSTENTO':
        this.abrirSustento(c);
        break;
      case 'DESCARGAR':
        this.descargaSimulada();
        break;
    }
  }

  setTab(t: Tab): void { this.tab.set(t); this.pageIndex.set(0); }
  setQ(texto: string): void { this.q.set(texto); this.pageIndex.set(0); }

  setFiltroRegion(region: string): void {
    this.fRegion.set(region);
    this.fProvincia.set('');
    this.fDistrito.set('');
    this.pageIndex.set(0);
  }

  setFiltroProvincia(provincia: string): void {
    this.fProvincia.set(provincia);
    this.fDistrito.set('');
    this.pageIndex.set(0);
  }

  setFiltroDistrito(distrito: string): void {
    this.fDistrito.set(distrito);
    this.pageIndex.set(0);
  }

  /** La tabla se recalcula automáticamente al cambiar el rango (signals). */
  setRangoFechas(r: RangoFechas): void {
    this.fDesde.set(r.desde);
    this.fHasta.set(r.hasta);
    this.pageIndex.set(0);
  }

  setCampoBusqueda(campo: CampoBusqueda): void {
    this.campoBusqueda.set(campo);
    this.pageIndex.set(0);
  }

  setEstado(estado: EstadoFiltro): void {
    this.estado.set(estado);
    this.pageIndex.set(0);
  }

  onPagina(e: PageEvent): void {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
  }

  nuevo(tipo: 'capacitacion' | 'asistencia'): void {
    this.router.navigate(['/capacitaciones-n1/nuevo'], { queryParams: { tipo } });
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

  abrirSustento(c: Curso): void {
    if ((c.participantes ?? 0) < 1) {
      this.toast.warning(
        'Agrega al menos un participante',
        'Debes registrar mínimo un participante antes de subir el archivo de sustento.',
      );
      return;
    }
    const ref = this.dialog.open<SustentoDialogComponent, SustentoData, boolean>(SustentoDialogComponent, {
      data: { curso: c },
      width: '900px',
      maxWidth: '95vw',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
    ref.afterClosed().subscribe((enviado) => {
      if (enviado) this.toast.success('Registro enviado a revisión', `Expediente ${c.codigo} con sustento adjunto.`);
    });
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
