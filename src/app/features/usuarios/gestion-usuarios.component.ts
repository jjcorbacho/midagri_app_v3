import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { ToastService } from '../../core/services/toast.service';
import { estadoVigenciaDe, formatearPeriodo, mesesDeRango, UsuarioSodega, esUsuarioPermanente, toTitleCase } from '../../core/models/usuario-sodega.model';
import { formatearUbigeoTexto } from '../../core/constants/sodega.const';
import { ModalService } from '../../core/services/modal.service';
import { ColumnSelectorComponent, ColumnaTabla } from '../../shared/components/column-selector/column-selector.component';
import { KpiCardComponent, KpiTone } from '../../shared/components/kpi-card/kpi-card.component';
import { paginatorIntlEs } from '../../shared/utils/paginator-intl.es';
import {
  ReasignarRegistroData,
  ReasignarRegistroDialogComponent,
  ResultadoReasignacion,
} from './reasignar-registro-dialog.component';

type FiltroKpi = 'TOTAL' | 'HABILITADO' | 'INHABILITADO' | 'PERMANENTE' | 'CRITICOS' | 'VENCIDOS';

/**
 * Configuración de las columnas de la grilla de usuarios.
 * Para incorporar una columna nueva basta con añadir su entrada aquí y su
 * `@case` en la celda: la cabecera, el paginado y el selector son dinámicos.
 * El ancho de cada columna vive en los estilos, en `.mat-column-<id>`.
 */
const COLUMNAS_USUARIOS: ColumnaTabla[] = [
  { id: 'acciones', nombre: 'Acciones', visible: true, obligatoria: true, orden: 1 },
  { id: 'empleado', nombre: 'Empleado', visible: true, orden: 2 },
  { id: 'estado', nombre: 'Estado', visible: false, orden: 3 },
  { id: 'usuario', nombre: 'Usuario', visible: false, orden: 4 },
  { id: 'dni', nombre: 'DNI', visible: false, orden: 5 },
  { id: 'perfil', nombre: 'Perfil', visible: true, orden: 6 },
  { id: 'regimen', nombre: 'Tipo de Régimen', visible: true, orden: 7 },
  { id: 'unidadResponsable', nombre: 'Unidad Responsable', visible: false, orden: 8 },
  { id: 'unidadFuncional', nombre: 'Unidad Funcional', visible: false, orden: 9 },
  { id: 'periodo', nombre: 'Periodo de Gestión', visible: true, orden: 10 },
  { id: 'vigencia', nombre: 'Vigencia', visible: true, orden: 11 },
  { id: 'vencimiento', nombre: 'Vencimiento', visible: true, orden: 12 },
  { id: 'progPresup', nombre: 'Prog. presupuestal', visible: false, orden: 13 },
  { id: 'ubigeo', nombre: 'Ubigeo', visible: false, orden: 14 },
];

/** Acciones de fila: icono, tono y ayuda contextual. */
interface AccionFila {
  tipo: 'EDITAR' | 'PRESUPUESTO' | 'CLAVE' | 'REASIGNAR_REGISTRO' | 'ESTADO' | 'NUEVO_SERVICIO';
  icono: string;
  etiqueta: string;
  tono: string;
}

const ACCIONES: AccionFila[] = [
  { tipo: 'EDITAR', icono: 'edit', etiqueta: 'Editar Datos', tono: 'a-neutro' },
  { tipo: 'PRESUPUESTO', icono: 'note_add', etiqueta: 'Agregar nueva Presupuestal', tono: 'a-marca' },
  { tipo: 'CLAVE', icono: 'key', etiqueta: 'Restablecer clave', tono: 'a-alerta' },
  { tipo: 'REASIGNAR_REGISTRO', icono: 'pin_drop', etiqueta: 'Reasignar Registro', tono: 'a-info' },
  { tipo: 'ESTADO', icono: 'toggle_on', etiqueta: 'Cambiar Estado', tono: 'a-error' },
  { tipo: 'NUEVO_SERVICIO', icono: 'add_circle', etiqueta: 'Agregar Nuevo Servicio', tono: 'a-exito' },
];

/**
 * Gestión Integral de Usuarios (módulo base SODEGA).
 * Administra usuarios, perfiles, vigencias laborales, ámbitos presupuestales y permisos.
 */
@Component({
  selector: 'app-gestion-usuarios',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Etiquetas del paginador en español; se declara aquí para que Material
  // viaje en el chunk diferido de la vista y no en el bundle inicial.
  providers: [{ provide: MatPaginatorIntl, useFactory: paginatorIntlEs }],
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatTableModule,
    MatTooltipModule,
    ColumnSelectorComponent,
    KpiCardComponent,
  ],
  template: `
    <section class="pagina">
      <header class="cabecera">
        <div>
          <h1>Gestión Integral de Usuarios</h1>
          <p>
            Administra usuarios, perfiles, vigencias laborales, ámbitos presupuestales y permisos de acceso del sistema SODEGA.
          </p>
        </div>
        <span class="anio-fiscal">Año Fiscal: <strong>2026</strong></span>
      </header>

      <!-- PANEL DE 6 TARJETAS KPI (cada una filtra la grilla) -->
      <div class="kpis">
        @for (k of kpiDefs; track k.filtro) {
          <app-kpi-card
            [label]="k.label"
            [value]="kpis()[k.filtro]"
            [icon]="k.icono"
            [tone]="k.tono"
            [interactivo]="true"
            [seleccionado]="filtro() === k.filtro"
            (seleccion)="setFiltro(k.filtro)"
          />
        }
      </div>

      <!-- Panel principal: búsqueda + grilla + paginación -->
      <mat-card appearance="outlined" class="panel">
        <div class="barra">
          <mat-form-field subscriptSizing="dynamic" class="buscador">
            <mat-label>Buscar</mat-label>
            <mat-icon matPrefix fontSet="material-symbols-outlined">search</mat-icon>
            <input
              matInput
              type="text"
              [value]="q()"
              (input)="buscar($any($event.target).value)"
              placeholder="Buscar por DNI, Nombre, Rol..."
              aria-label="Buscar usuarios"
            />
            @if (q()) {
              <button matIconButton matSuffix type="button" (click)="buscar('')" aria-label="Limpiar búsqueda">
                <mat-icon fontSet="material-symbols-outlined">close</mat-icon>
              </button>
            }
          </mat-form-field>

          <div class="acciones-barra">
            <app-column-selector
              [columnas]="columnasBase"
              storageKey="sodega.usuarios.columnas"
              (columnasChange)="columnas.set($event)"
            />
            <button matButton (click)="exportarExcel()">
              <mat-icon fontSet="material-symbols-outlined">table_view</mat-icon>
              Exportar excel
            </button>
            <button matButton="filled" (click)="nuevoUsuario()">
              <mat-icon fontSet="material-symbols-outlined">person_add</mat-icon>
              Nuevo usuario
            </button>
          </div>
        </div>

        <!-- GRILLA DE DATOS -->
        <div class="tabla-contenedor">
          <table mat-table [dataSource]="pageRows()" [style.min-width.px]="anchoMinimoTabla()">
            @for (col of columnasBase; track col.id) {
              <ng-container [matColumnDef]="col.id">
                <th mat-header-cell *matHeaderCellDef>{{ col.nombre }}</th>
                <td mat-cell *matCellDef="let u">
                  @switch (col.id) {
                    @case ('acciones') {
                      <div class="acciones-fila">
                        @for (a of accionesDe(u); track a.tipo) {
                          <button
                            matIconButton
                            class="accion"
                            [class]="a.tono"
                            [matTooltip]="a.etiqueta"
                            [attr.aria-label]="a.etiqueta"
                            (click)="accion(a.tipo, u)"
                          >
                            <mat-icon fontSet="material-symbols-outlined">{{ a.icono }}</mat-icon>
                          </button>
                        }
                      </div>
                    }
                    @case ('empleado') { <span class="empleado">{{ nombreFila(u) }}</span> }
                    @case ('estado') {
                      <mat-chip
                        disableRipple
                        [class]="u.estado === 'HABILITADO' ? 'c-aprobado' : 'c-observado'"
                      >{{ u.estado }}</mat-chip>
                    }
                    @case ('usuario') { <span class="tenue">{{ u.userGen }}</span> }
                    @case ('dni') { <span class="numerico">{{ u.dni }}</span> }
                    @case ('perfil') { <span class="empleado">{{ u.perfil }}</span> }
                    @case ('regimen') { {{ u.regimen || '—' }} }
                    @case ('unidadResponsable') {
                      <span class="truncado tenue" [title]="unidadResponsableDe(u)">{{ unidadResponsableDe(u) }}</span>
                    }
                    @case ('unidadFuncional') {
                      <span class="truncado tenue" [title]="opasDe(u)">{{ opasDe(u) }}</span>
                    }
                    @case ('periodo') {
                      @if (mesesContrato(u); as meses) {
                        <!-- Temporales: meses comprendidos en el contrato -->
                        <span class="meses">{{ meses }}</span>
                      } @else if (u.periodosGestion?.length) {
                        <div class="periodos">
                          @for (pg of u.periodosGestion; track pg.anio) {
                            <mat-chip disableRipple class="c-marca">{{ formatearPeriodo(pg) }}</mat-chip>
                          }
                        </div>
                      } @else {
                        <span class="tenue">—</span>
                      }
                    }
                    @case ('vigencia') {
                      <mat-chip disableRipple [class]="claseVigencia(u)">{{ u.vigenciaCalculada }}</mat-chip>
                    }
                    @case ('vencimiento') {
                      <mat-chip disableRipple class="numerico" [class]="claseVigencia(u)">{{ vencimientoDe(u) }}</mat-chip>
                    }
                    @case ('progPresup') {
                      <span class="truncado tenue" [title]="progPresupDe(u)">{{ progPresupDe(u) }}</span>
                    }
                    @case ('ubigeo') { <span [title]="ubigeoDe(u)">{{ ubigeoDe(u) }}</span> }
                  }
                </td>
              </ng-container>
            }

            <tr mat-header-row *matHeaderRowDef="columnasVisiblesIds(); sticky: true"></tr>
            <tr mat-row *matRowDef="let fila; columns: columnasVisiblesIds()"></tr>
            <tr class="fila-vacia" *matNoDataRow>
              <td [attr.colspan]="columnasVisiblesIds().length">
                <div class="sin-datos">
                  <mat-icon fontSet="material-symbols-outlined">search_off</mat-icon>
                  <p class="titulo-vacio">Sin resultados</p>
                  <p>No se encontraron registros de usuarios con los criterios establecidos.</p>
                </div>
              </td>
            </tr>
          </table>
        </div>

        <mat-paginator
          [length]="filtered().length"
          [pageSize]="pageSize()"
          [pageIndex]="pageIndex()"
          [pageSizeOptions]="[5, 10, 20, 50]"
          showFirstLastButtons
          aria-label="Paginación de usuarios"
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

    .cabecera {
      display: flex;
      flex-direction: column;
      gap: 12px;
      justify-content: space-between;
    }
    @media (min-width: 768px) { .cabecera { flex-direction: row; align-items: center; } }
    .cabecera h1 {
      margin: 0;
      font: var(--mat-sys-headline-small);
      color: var(--mat-sys-on-surface);
    }
    .cabecera p {
      margin: 4px 0 0;
      max-width: 70ch;
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
    }
    .anio-fiscal {
      align-self: flex-start;
      white-space: nowrap;
      padding: 4px 12px;
      border-radius: var(--mat-sys-corner-full);
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      font: var(--mat-sys-label-medium);
    }

    .kpis {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }
    @media (min-width: 768px) { .kpis { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
    @media (min-width: 1280px) { .kpis { grid-template-columns: repeat(6, minmax(0, 1fr)); } }

    .panel { padding: 0; overflow: hidden; }

    .barra {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      background: var(--mat-sys-surface-container-low);
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }
    @media (min-width: 768px) {
      .barra { flex-direction: row; align-items: center; justify-content: space-between; }
    }
    .buscador { flex: 1 1 auto; max-width: 420px; }
    .acciones-barra { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }

    .tabla-contenedor { overflow: auto; max-height: 60vh; }
    table { width: 100%; }
    th.mat-mdc-header-cell {
      font: var(--mat-sys-label-medium);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      white-space: nowrap;
    }
    td.mat-mdc-cell { font: var(--mat-sys-body-medium); }

    /* Anchos por columna (mat-table genera .mat-column-<id>). */
    .mat-column-acciones { width: 1px; white-space: nowrap; }
    .mat-column-empleado { width: 14rem; }
    .mat-column-estado { width: 7rem; text-align: center; }
    .mat-column-usuario { width: 7rem; }
    .mat-column-dni { width: 6rem; }
    .mat-column-perfil { width: 12rem; }
    .mat-column-regimen { width: 11rem; white-space: nowrap; }
    .mat-column-unidadResponsable,
    .mat-column-unidadFuncional { width: 16rem; }
    .mat-column-periodo { width: 10rem; }
    .mat-column-vigencia { width: 12rem; }
    .mat-column-vencimiento { width: 7rem; }
    .mat-column-progPresup { width: 16rem; }
    .mat-column-ubigeo { width: 6rem; }

    .acciones-fila { display: flex; align-items: center; justify-content: center; gap: 2px; }
    .accion { --mdc-icon-button-icon-size: 18px; width: 36px; height: 36px; padding: 8px; }
    .accion mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .a-neutro { background: var(--mat-sys-surface-container-highest); color: var(--mat-sys-on-surface-variant); }
    .a-marca  { background: var(--mat-sys-primary-container); color: var(--mat-sys-on-primary-container); }
    .a-alerta { background: var(--estado-subsanado-fondo); color: var(--estado-subsanado); }
    .a-info   { background: var(--estado-validado-fondo); color: var(--estado-validado); }
    .a-error  { background: var(--mat-sys-error-container); color: var(--mat-sys-on-error-container); }
    .a-exito  { background: var(--estado-aprobado-fondo); color: var(--estado-aprobado); }

    .empleado { font-weight: 600; }
    .tenue { color: var(--mat-sys-on-surface-variant); }
    .numerico { font-variant-numeric: tabular-nums; }
    .truncado {
      display: inline-block;
      max-width: 14rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      vertical-align: bottom;
    }
    .meses { font: var(--mat-sys-body-small); }
    .periodos { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }

    .fila-vacia td { padding: 0; }
    .sin-datos {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 40px 16px;
      color: var(--mat-sys-on-surface-variant);
      text-align: center;
    }
    .sin-datos mat-icon { font-size: 32px; width: 32px; height: 32px; opacity: 0.5; }
    .sin-datos p { margin: 0; font: var(--mat-sys-body-small); }
    .titulo-vacio { font: var(--mat-sys-body-medium) !important; color: var(--mat-sys-on-surface); }
  `,
})
export class GestionUsuariosComponent {
  private readonly auth = inject(AuthService);
  private readonly modales = inject(ModalService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly formatearPeriodo = formatearPeriodo;

  readonly kpiDefs: { filtro: FiltroKpi; label: string; icono: string; tono: KpiTone }[] = [
    { filtro: 'TOTAL', label: 'Total usuarios', icono: 'group', tono: 'blue' },
    { filtro: 'HABILITADO', label: 'Habilitados', icono: 'how_to_reg', tono: 'emerald' },
    { filtro: 'INHABILITADO', label: 'Inhabilitados', icono: 'person_off', tono: 'error' },
    { filtro: 'PERMANENTE', label: 'Permanente', icono: 'all_inclusive', tono: 'teal' },
    { filtro: 'CRITICOS', label: 'Por vencer (30 días)', icono: 'schedule', tono: 'amber' },
    { filtro: 'VENCIDOS', label: 'Vencidos', icono: 'warning', tono: 'error' },
  ];

  readonly filtro = signal<FiltroKpi>('TOTAL');
  readonly q = signal('');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(5);

  /* ===== Columnas configurables de la grilla ===== */
  readonly columnasBase = COLUMNAS_USUARIOS;
  readonly columnas = signal<ColumnaTabla[]>(COLUMNAS_USUARIOS);
  readonly columnasVisibles = computed(() =>
    this.columnas().filter((c) => c.visible).sort((a, b) => a.orden - b.orden),
  );
  readonly columnasVisiblesIds = computed(() => this.columnasVisibles().map((c) => c.id));
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
  readonly pageRows = computed(() => {
    const p = Math.min(this.pageIndex(), this.totalPages() - 1);
    const size = this.pageSize();
    return this.filtered().slice(p * size, (p + 1) * size);
  });

  buscar(texto: string): void {
    this.q.set(texto);
    this.pageIndex.set(0);
  }

  onPagina(e: PageEvent): void {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
  }

  setFiltro(f: FiltroKpi): void {
    this.filtro.set(f);
    this.pageIndex.set(0);
  }

  /* ===== Formato de fila (idéntico al prototipo) ===== */
  nombreFila(u: UsuarioSodega): string {
    return toTitleCase(`${u.apePat} ${u.apeMat}, ${u.nombres}`);
  }

  /** Acciones aplicables al registro, en el orden fijo de la grilla. */
  accionesDe(u: UsuarioSodega): AccionFila[] {
    return ACCIONES.filter((a) => {
      if (a.tipo === 'REASIGNAR_REGISTRO') return this.puedeReasignar(u);
      if (a.tipo === 'NUEVO_SERVICIO') return this.puedeAgregarServicio(u);
      return true;
    });
  }

  /** Meses del contrato (solo CAS Temporal / Locador); '' para los demás. */
  mesesContrato(u: UsuarioSodega): string {
    const esTemporal = u.regimen === 'Régimen CAS Temporal' || u.regimen === 'Locador de Servicio (OS)';
    return esTemporal ? mesesDeRango(u.fechaIni, u.fechaFin) : '';
  }

  /**
   * "Agregar Nuevo Servicio" aplica únicamente a contratos temporales
   * (Régimen CAS Temporal / Locador de Servicio) cuyo servicio terminó:
   * cuenta inhabilitada o vigencia expirada (función única del modelo).
   * Nunca para 728/276/CAS, aunque estén inhabilitados.
   */
  puedeAgregarServicio(u: UsuarioSodega): boolean {
    const esTemporal = u.regimen === 'Régimen CAS Temporal' || u.regimen === 'Locador de Servicio (OS)';
    if (!esTemporal) return false;
    return u.estado === 'INHABILITADO' || estadoVigenciaDe(u) === 'Expirado';
  }

  /**
   * La reasignación de registros solo aplica a técnicos de Capacitación y
   * Asistencia Técnica y la ejecuta el Administrador General.
   */
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

  /** Tono del chip de vigencia/vencimiento según los días restantes. */
  claseVigencia(u: UsuarioSodega): string {
    if (esUsuarioPermanente(u)) return 'c-aprobado';
    const d = u.diasRestantes ?? 0;
    if (d < 0) return 'c-observado';
    if (d === 0) return 'c-enviado';
    if (d <= 30) return 'c-subsanado';
    return 'c-validado';
  }

  /* ===== Acciones ===== */
  nuevoUsuario(): void {
    this.router.navigate(['/usuarios/nuevo']);
  }

  accion(tipo: AccionFila['tipo'], u: UsuarioSodega): void {
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
        this.abrirReasignarRegistro(u);
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

  /** Transferencia de capacitaciones y asistencias hacia otro técnico. */
  private abrirReasignarRegistro(origen: UsuarioSodega): void {
    const ref = this.dialog.open<
      ReasignarRegistroDialogComponent,
      ReasignarRegistroData,
      ResultadoReasignacion
    >(ReasignarRegistroDialogComponent, {
      data: { origen },
      width: '1100px',
      maxWidth: '95vw',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
    ref.afterClosed().subscribe((r) => {
      if (r) this.onReasignado(origen, r);
    });
  }

  /** Cierre exitoso del diálogo Reasignar Registro: mensaje y refresco reactivo. */
  private onReasignado(origen: UsuarioSodega, r: ResultadoReasignacion): void {
    const nombreOrigen = toTitleCase(`${origen.nombres} ${origen.apePat}`);
    const nombreDestino = toTitleCase(`${r.destino.nombres} ${r.destino.apePat}`);
    void this.modales.openSuccess(
      'Reasignación Completada',
      `Se transfirieron ${r.capacitaciones} capacitación(es) y ${r.asistencias} asistencia(s) técnica(s) ` +
        `de ${nombreOrigen} hacia ${nombreDestino}. El historial institucional se conserva íntegro bajo el nuevo responsable.`,
    );
  }

  /** Exportación simulada (mensajes progresivos del prototipo, ahora en snackbar). */
  exportarExcel(): void {
    // TODO(backend): GET /usuarios/reporte-excel
    this.toast.info('Generando libro unificado de datos SODEGA (Procesando registros)...');
    setTimeout(() => {
      this.toast.info('Consolidando Ámbitos Territoriales de las OPAs... 45%');
      setTimeout(() => {
        this.toast.success('¡Libro unificado de Reporte SODEGA_2026.xlsx exportado con éxito!');
      }, 1000);
    }, 1000);
  }
}
