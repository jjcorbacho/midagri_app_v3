import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/services/auth.service';
import { ListasAdminService } from '../../../core/services/listas-admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalService } from '../../../core/services/modal.service';
import { OpcionLista } from '../../../core/models/lista-admin.model';
import { OpcionDialogComponent, OpcionDialogData } from './opcion-dialog.component';

/** Fila de la grilla: la opción y su posición original en la lista. */
interface FilaOpcion {
  opcion: OpcionLista;
  indice: number;
}

/**
 * Administración de Listas (Administración → Listas): catálogo de listas y
 * sus opciones, con alta, edición y habilitación/deshabilitación por opción.
 */
@Component({
  selector: 'app-listas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatTableModule,
    MatTooltipModule,
  ],
  template: `
    <section class="pagina">
      <header class="cabecera">
        <div>
          <h1>Administración de Listas</h1>
          <p>
            Gestiona catálogos maestros y opciones de lista utilizados por los formularios del
            sistema SODEGA.
          </p>
        </div>
        <mat-chip disableRipple class="c-marca">Perfil: {{ perfilActivo() }}</mat-chip>
      </header>

      <div class="columnas">
        <!-- Catálogo de listas -->
        <mat-card appearance="outlined" class="panel">
          <div class="barra">
            <h2>
              <mat-icon fontSet="material-symbols-outlined">checklist</mat-icon>
              Listas
            </h2>
            <mat-chip disableRipple class="c-registrado">{{ listasFiltradas().length }}</mat-chip>
          </div>

          <div class="contenido">
            <mat-form-field subscriptSizing="dynamic" class="campo">
              <mat-label>Agregar lista</mat-label>
              <input
                matInput
                [value]="nuevaLista()"
                (input)="nuevaLista.set($any($event.target).value)"
                (keyup.enter)="agregarLista()"
                placeholder="Nombre de la lista"
              />
              <button
                matIconButton
                matSuffix
                type="button"
                matTooltip="Guardar lista"
                aria-label="Guardar lista"
                (click)="agregarLista()"
              >
                <mat-icon fontSet="material-symbols-outlined">add</mat-icon>
              </button>
            </mat-form-field>

            <mat-form-field subscriptSizing="dynamic" class="campo">
              <mat-label>Buscar lista</mat-label>
              <mat-icon matPrefix fontSet="material-symbols-outlined">search</mat-icon>
              <input
                matInput
                [value]="qListas()"
                (input)="qListas.set($any($event.target).value)"
                aria-label="Buscar lista"
              />
            </mat-form-field>

            <div class="catalogo">
              @if (listasFiltradas().length === 0) {
                <div class="sin-datos">
                  <mat-icon fontSet="material-symbols-outlined">search_off</mat-icon>
                  <p class="titulo-vacio">No se encontraron listas.</p>
                </div>
              } @else {
                <mat-nav-list>
                  @for (l of listasFiltradas(); track l.nombre) {
                    <button
                      mat-list-item
                      type="button"
                      [activated]="l.nombre === listaActiva()"
                      (click)="seleccionar(l.nombre)"
                    >
                      <span matListItemTitle>{{ l.nombre }}</span>
                      <span matListItemMeta class="numerico">{{ l.opciones.length }}</span>
                    </button>
                  }
                </mat-nav-list>
              }
            </div>
          </div>
        </mat-card>

        <!-- Opciones de la lista seleccionada -->
        <mat-card appearance="outlined" class="panel">
          <div class="barra">
            <div>
              <h2>
                <mat-icon fontSet="material-symbols-outlined">table_rows</mat-icon>
                Opciones de lista
              </h2>
              <p class="subtitulo">{{ subtituloOpciones() }}</p>
            </div>
            <div class="acciones-barra">
              <button
                matIconButton
                type="button"
                class="accion a-primario"
                matTooltip="Nueva opción"
                aria-label="Nueva opción"
                (click)="abrirOpcion(null)"
              >
                <mat-icon fontSet="material-symbols-outlined">add</mat-icon>
              </button>
              <button
                matIconButton
                type="button"
                class="accion excel"
                matTooltip="Exportar Excel"
                aria-label="Exportar Excel"
                (click)="exportarExcel()"
              >
                <mat-icon fontSet="material-symbols-outlined">table_view</mat-icon>
              </button>
              <button
                matIconButton
                type="button"
                class="accion a-error"
                matTooltip="Exportar PDF"
                aria-label="Exportar PDF"
                (click)="imprimir()"
              >
                <mat-icon fontSet="material-symbols-outlined">picture_as_pdf</mat-icon>
              </button>
              <button
                matIconButton
                type="button"
                class="accion a-neutro"
                matTooltip="Actualizar"
                aria-label="Actualizar"
                (click)="actualizar()"
              >
                <mat-icon fontSet="material-symbols-outlined">refresh</mat-icon>
              </button>
            </div>
          </div>

          <div class="contenido">
            <mat-form-field subscriptSizing="dynamic" class="buscador">
              <mat-label>Buscar</mat-label>
              <mat-icon matPrefix fontSet="material-symbols-outlined">search</mat-icon>
              <input
                matInput
                [value]="qOpciones()"
                (input)="qOpciones.set($any($event.target).value)"
                aria-label="Buscar opción"
              />
            </mat-form-field>

            <div class="tabla-contenedor">
              <table mat-table [dataSource]="opcionesFiltradas()">
                <ng-container matColumnDef="acciones">
                  <th mat-header-cell *matHeaderCellDef>Acciones</th>
                  <td mat-cell *matCellDef="let fila">
                    <div class="acciones-fila">
                      <button
                        matIconButton
                        type="button"
                        class="accion a-neutro"
                        matTooltip="Editar"
                        aria-label="Editar opción"
                        (click)="abrirOpcion(fila.indice)"
                      >
                        <mat-icon fontSet="material-symbols-outlined">edit</mat-icon>
                      </button>
                      <button
                        matIconButton
                        type="button"
                        class="accion"
                        [class.a-error]="fila.opcion.activo"
                        [class.a-exito]="!fila.opcion.activo"
                        [matTooltip]="fila.opcion.activo ? 'Inhabilitar' : 'Habilitar'"
                        [attr.aria-label]="fila.opcion.activo ? 'Inhabilitar opción' : 'Habilitar opción'"
                        (click)="confirmarEstado(fila.indice)"
                      >
                        <mat-icon fontSet="material-symbols-outlined">
                          {{ fila.opcion.activo ? 'close' : 'check' }}
                        </mat-icon>
                      </button>
                    </div>
                  </td>
                </ng-container>

                <ng-container matColumnDef="descripcion">
                  <th mat-header-cell *matHeaderCellDef>Descripción</th>
                  <td mat-cell *matCellDef="let fila">
                    <span [class.deshabilitada]="!fila.opcion.activo">{{ fila.opcion.nombre }}</span>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="columnas; sticky: true"></tr>
                <tr mat-row *matRowDef="let fila; columns: columnas"></tr>

                <tr class="fila-vacia" *matNoDataRow>
                  <td [attr.colspan]="columnas.length">
                    <div class="sin-datos">
                      <mat-icon fontSet="material-symbols-outlined">search_off</mat-icon>
                      <p class="titulo-vacio">Sin opciones</p>
                      <p>No se encontraron opciones para la búsqueda ingresada.</p>
                    </div>
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </mat-card>
      </div>
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
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }
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

    .columnas {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 20px;
      align-items: start;
    }
    @media (min-width: 1024px) { .columnas { grid-template-columns: 1fr 2fr; } }

    .panel { padding: 0; overflow: hidden; }
    .barra {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 16px;
      background: var(--mat-sys-surface-container-low);
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }
    .barra h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      font: var(--mat-sys-label-large);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--mat-sys-primary);
    }
    .barra mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .subtitulo {
      margin: 4px 0 0;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }
    .acciones-barra { display: flex; flex-wrap: wrap; gap: 8px; }

    .contenido { display: flex; flex-direction: column; gap: 12px; padding: 16px; }
    .campo { width: 100%; }
    .buscador { align-self: flex-end; width: 260px; max-width: 100%; }

    .catalogo {
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-medium);
      overflow: auto;
      max-height: 520px;
    }
    mat-nav-list { padding: 0; }
    /* El elemento es un <button>: hereda el centrado del agente de usuario. */
    mat-nav-list button { text-align: left; }
    .numerico { font-variant-numeric: tabular-nums; }

    .tabla-contenedor {
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-medium);
      overflow: auto;
      max-height: 420px;
    }
    table { width: 100%; }
    td.mat-mdc-cell { font: var(--mat-sys-body-medium); }
    .mat-column-acciones { width: 1px; white-space: nowrap; }
    .acciones-fila { display: flex; align-items: center; gap: 4px; }
    .deshabilitada {
      color: var(--mat-sys-error);
      font-weight: 600;
      text-decoration: line-through;
    }
  `,
})
export class ListasComponent {
  private readonly auth = inject(AuthService);
  private readonly listasService = inject(ListasAdminService);
  private readonly toast = inject(ToastService);
  private readonly modales = inject(ModalService);
  private readonly dialog = inject(MatDialog);

  readonly columnas = ['acciones', 'descripcion'];

  readonly nuevaLista = signal('');
  readonly qListas = signal('');
  readonly qOpciones = signal('');

  readonly perfilActivo = computed(() => this.auth.session()?.perfil ?? '');
  readonly listaActiva = this.listasService.listaActiva;

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
  readonly opcionesFiltradas = computed<FilaOpcion[]>(() => {
    const lista = this.listasService.activa();
    if (!lista) return [];
    const filtro = this.qOpciones().toLowerCase().trim();
    return lista.opciones
      .map((opcion, indice) => ({ opcion, indice }))
      .filter(({ opcion }) => `${opcion.codigo} - ${opcion.nombre}`.toLowerCase().includes(filtro));
  });

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

  /** Alta (`null`) o edición de una opción de la lista activa. */
  abrirOpcion(indice: number | null): void {
    if (!this.listasService.activa()) {
      this.toast.error('Lista no seleccionada', 'Seleccione una lista antes de agregar una opción.');
      return;
    }
    this.dialog.open<OpcionDialogComponent, OpcionDialogData, boolean>(OpcionDialogComponent, {
      data: { indice },
      maxWidth: '95vw',
      autoFocus: 'dialog',
    });
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
