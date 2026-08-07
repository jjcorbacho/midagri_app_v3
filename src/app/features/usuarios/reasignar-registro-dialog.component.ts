import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from '../../core/services/auth.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { CursosService } from '../../core/services/cursos.service';
import { UsuarioSodega, toTitleCase } from '../../core/models/usuario-sodega.model';
import { Curso } from '../../core/models/curso.model';
import { normalizarNombreCatalogo } from '../../shared/utils/texto.util';
import { ModalService } from '../../core/services/modal.service';
import { EstadoBadgeComponent } from '../../shared/components/estado-badge/estado-badge.component';

/** Datos de apertura del diálogo: registro de origen elegido en la grilla. */
export interface ReasignarRegistroData {
  origen: UsuarioSodega;
}

/** Resultado devuelto al completar la transferencia de registros. */
export interface ResultadoReasignacion {
  destino: UsuarioSodega;
  capacitaciones: number;
  asistencias: number;
}

/** Fila de las grillas de registros (origen y asignado). */
interface FilaRegistro {
  id: string;
  dni: string;
  nombre: string;
  profesion: string;
  tematica: string;
  tipo: string;
  estado: string;
}

const COLUMNAS = ['dni', 'nombre', 'profesion', 'tematica', 'tipo', 'estado'];

/**
 * Diálogo "Reasignar Registro": transfiere todas las Capacitaciones y
 * Asistencias Técnicas de un técnico (registro de origen) hacia otro
 * técnico activo, conservando el historial institucional completo.
 *
 * Se cierra devolviendo `ResultadoReasignacion` cuando la transferencia se
 * ejecuta, y `undefined` si el usuario cancela.
 */
@Component({
  selector: 'app-reasignar-registro-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    EstadoBadgeComponent,
  ],
  template: `
    <h2 mat-dialog-title>Reasignar registros</h2>

    <mat-dialog-content>
      <!-- Encabezado: registro de origen (solo lectura) + carga de sus registros -->
      <div class="origen">
        <mat-form-field subscriptSizing="dynamic" class="campo-origen">
          <mat-label>Registro de origen</mat-label>
          <input
            matInput
            readonly
            tabindex="-1"
            [value]="etiquetaOrigen()"
            aria-label="Registro de origen (solo lectura)"
          />
        </mat-form-field>
        <button
          matButton="filled"
          type="button"
          (click)="buscarRegistrosOrigen()"
          aria-label="Buscar registros del personal de origen"
        >
          <mat-icon fontSet="material-symbols-outlined">search</mat-icon>
          Buscar Registros
        </button>
      </div>

      <!-- Sección 1: grilla de registros del personal de origen -->
      <div class="tabla-contenedor">
        <table mat-table [dataSource]="filasOrigen()" aria-label="Registros del personal de origen">
          @for (col of columnas; track col) {
            <ng-container [matColumnDef]="col">
              <th mat-header-cell *matHeaderCellDef>{{ etiquetas[col] }}</th>
              <td mat-cell *matCellDef="let fila" [class]="'celda-' + col">
                @if (col === 'estado') {
                  <app-estado-badge [estado]="fila.estado" />
                } @else {
                  {{ valorDe(fila, col) }}
                }
              </td>
            </ng-container>
          }
          <tr mat-header-row *matHeaderRowDef="columnas; sticky: true"></tr>
          <tr mat-row *matRowDef="let fila; columns: columnas"></tr>
          <tr class="fila-vacia" *matNoDataRow>
            <td [attr.colspan]="columnas.length">
              {{ busquedaOrigenEjecutada()
                ? 'El trabajador de origen no tiene Capacitaciones ni Asistencias Técnicas registradas.'
                : 'Pulse "Buscar Registros" para cargar las Capacitaciones y Asistencias Técnicas del personal de origen.' }}
            </td>
          </tr>
        </table>
      </div>
      <p class="conteo">
        Registros encontrados del personal de origen:
        <strong>{{ filasOrigen().length }}</strong>
      </p>

      <!-- Sección 2: trabajador asignado (candidatos habilitados) -->
      <div class="seccion">
        <mat-icon fontSet="material-symbols-outlined">how_to_reg</mat-icon>
        <div>
          <h3>Trabajador asignado (Personal que tomará el cargo)</h3>
          <p>Persona que asumirá todos los registros del técnico seleccionado.</p>
        </div>
      </div>

      <mat-form-field class="campo">
        <mat-label>Trabajador asignado</mat-label>
        <mat-select
          [value]="seleccionadoDni()"
          [disabled]="candidatos().length === 0"
          (valueChange)="onDestinoChange($event)"
          aria-label="Seleccionar trabajador asignado"
        >
          @for (c of candidatos(); track c.dni) {
            <mat-option [value]="c.dni">{{ nombreDe(c) }} — DNI {{ c.dni }}</mat-option>
          }
        </mat-select>
        @if (candidatos().length === 0) {
          <mat-hint>No existen técnicos habilitados para recibir registros en esta Unidad.</mat-hint>
        }
      </mat-form-field>

      <!-- Sección 3: grilla de registros del personal asignado -->
      <div class="tabla-contenedor">
        <table mat-table [dataSource]="filasDestino()" aria-label="Registros del personal asignado">
          @for (col of columnas; track col) {
            <ng-container [matColumnDef]="col">
              <th mat-header-cell *matHeaderCellDef>{{ etiquetas[col] }}</th>
              <td mat-cell *matCellDef="let fila" [class]="'celda-' + col">
                @if (col === 'estado') {
                  <app-estado-badge [estado]="fila.estado" />
                } @else {
                  {{ valorDe(fila, col) }}
                }
              </td>
            </ng-container>
          }
          <tr mat-header-row *matHeaderRowDef="columnas; sticky: true"></tr>
          <tr mat-row *matRowDef="let fila; columns: columnas"></tr>
          <tr class="fila-vacia" *matNoDataRow>
            <td [attr.colspan]="columnas.length">
              {{ seleccionado()
                ? 'El trabajador asignado aún no tiene Capacitaciones ni Asistencias Técnicas registradas.'
                : 'Seleccione al trabajador asignado para visualizar sus registros.' }}
            </td>
          </tr>
        </table>
      </div>
      <p class="conteo">
        Registros encontrados del personal asignado:
        <strong>{{ filasDestino().length }}</strong>
      </p>

      @if (error(); as e) {
        <p class="error" role="alert">
          <mat-icon fontSet="material-symbols-outlined">warning</mat-icon> {{ e }}
        </p>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close>Cancelar</button>
      <button matButton="filled" type="button" (click)="solicitarConfirmacion()">Reasignar</button>
    </mat-dialog-actions>
  `,
  styles: `
    mat-dialog-content { display: flex; flex-direction: column; gap: 12px; }

    .origen {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
      padding-top: 8px;
    }
    .campo-origen { flex: 1 1 320px; }
    .campo { width: 100%; }

    /* Sin encogimiento: las grillas no se comprimen cuando el contenido del
       diálogo es más alto que la ventana; el que desplaza es el diálogo. */
    .tabla-contenedor {
      flex: none;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-medium);
      overflow: auto;
      max-height: 220px;
    }
    table { width: 100%; min-width: 760px; }
    th.mat-mdc-header-cell {
      font: var(--mat-sys-label-medium);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .celda-dni { font-variant-numeric: tabular-nums; white-space: nowrap; }
    .celda-nombre { font-weight: 600; }
    .fila-vacia td {
      padding: 16px;
      text-align: center;
      font: var(--mat-sys-body-small);
      font-style: italic;
      color: var(--mat-sys-on-surface-variant);
    }

    .conteo {
      margin: 0;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }
    .conteo strong { color: var(--mat-sys-on-surface); font-variant-numeric: tabular-nums; }

    .seccion {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-top: 4px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      color: var(--mat-sys-primary);
    }
    .seccion mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .seccion h3 {
      margin: 0;
      font: var(--mat-sys-label-large);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .seccion p {
      margin: 2px 0 0;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }

    .error {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-error);
    }
    .error mat-icon { font-size: 18px; width: 18px; height: 18px; }
  `,
})
export class ReasignarRegistroDialogComponent {
  private readonly auth = inject(AuthService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly cursosService = inject(CursosService);
  private readonly modales = inject(ModalService);
  private readonly ref =
    inject<MatDialogRef<ReasignarRegistroDialogComponent, ResultadoReasignacion>>(MatDialogRef);
  private readonly data = inject<ReasignarRegistroData>(MAT_DIALOG_DATA);

  /** Registro de origen seleccionado en la grilla de usuarios. */
  readonly origen = this.data.origen;

  readonly columnas = COLUMNAS;
  readonly etiquetas: Record<string, string> = {
    dni: 'DNI',
    nombre: 'Apellidos y Nombres',
    profesion: 'Profesión - Especialidad',
    tematica: 'Temática',
    tipo: 'Tipo',
    estado: 'Estado',
  };

  readonly seleccionadoDni = signal<string | null>(null);
  readonly error = signal('');
  /** La grilla de origen se puebla al pulsar "Buscar Registros". */
  readonly busquedaOrigenEjecutada = signal(false);

  private static readonly PERFIL_RECEPTOR = 'Técnico Capacitación y Asistencia Técnica';

  /**
   * Trabajadores habilitados para recibir la reasignación: técnicos ACTIVOS
   * visibles según los privilegios del perfil en sesión, excluyendo al
   * trabajador de origen (una fila por trabajador aunque tenga varias partidas).
   */
  readonly candidatos = computed<UsuarioSodega[]>(() => {
    const s = this.auth.session();
    if (!s) return [];
    this.usuariosService.usuarios(); // dependencia reactiva del listado global
    const origen = this.origen;
    const unicos = new Map<string, UsuarioSodega>();
    for (const u of this.usuariosService.registrosVisibles(s.perfil, s.userGen, s.perfilAutenticado)) {
      if (u.estado !== 'HABILITADO') continue;
      if (u.perfil !== ReasignarRegistroDialogComponent.PERFIL_RECEPTOR) continue;
      if (u.dni === origen.dni) continue;
      // Solo técnicos de la misma Unidad Responsable y Unidad Funcional del origen.
      if (normalizarNombreCatalogo(u.unidad) !== normalizarNombreCatalogo(origen.unidad)) continue;
      if (normalizarNombreCatalogo(u.unidadFuncional) !== normalizarNombreCatalogo(origen.unidadFuncional)) continue;
      if (!unicos.has(u.dni)) unicos.set(u.dni, u);
    }
    return [...unicos.values()];
  });

  readonly seleccionado = computed(
    () => this.candidatos().find((c) => c.dni === this.seleccionadoDni()) ?? null,
  );

  readonly etiquetaOrigen = computed(() => this.etiquetaDe(this.origen));

  readonly etiquetaDestino = computed(() => {
    const d = this.seleccionado();
    return d ? this.etiquetaDe(d) : '';
  });

  private etiquetaDe(u: UsuarioSodega): string {
    return `${u.dni} - ${this.nombreCompletoDe(u)}`;
  }

  private nombreCompletoDe(u: UsuarioSodega): string {
    return toTitleCase(`${u.nombres} ${u.apePat} ${u.apeMat}`);
  }

  nombreDe(u: UsuarioSodega): string {
    return toTitleCase(`${u.apePat} ${u.apeMat}, ${u.nombres}`);
  }

  /* ===== Registros (cursos) por trabajador: mismas reglas de coincidencia
     por responsable que usa CursosService.reasignarResponsable(). ===== */

  /** Normalización idéntica a la de la transferencia (mayúsculas/tildes/espacios). */
  private normalizarNombre(nombre: string): string {
    return nombre
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, ' ');
  }

  private registrosDe(u: UsuarioSodega | null): Curso[] {
    if (!u) return [];
    const clave = this.normalizarNombre(this.nombreCompletoDe(u));
    return this.cursosService.cursos().filter((c) => this.normalizarNombre(c.extensionista) === clave);
  }

  /** Filas de la grilla a partir de los cursos a cargo de un trabajador. */
  private filasDe(u: UsuarioSodega | null): FilaRegistro[] {
    if (!u) return [];
    return this.registrosDe(u).map((c) => ({
      id: c.id,
      dni: u.dni,
      nombre: this.nombreDe(u),
      profesion: u.profesion,
      tematica: this.tematicaDe(c),
      tipo: this.tipoDe(c),
      estado: c.estado,
    }));
  }

  /** Capacitaciones y Asistencias Técnicas a cargo del trabajador de origen. */
  readonly registrosOrigen = computed(() => this.registrosDe(this.origen));

  /** Filas visibles de la grilla de origen (vacía hasta pulsar "Buscar Registros"). */
  readonly filasOrigen = computed(() =>
    this.busquedaOrigenEjecutada() ? this.filasDe(this.origen) : [],
  );

  /** Registros ya a cargo del trabajador asignado (destino). */
  readonly filasDestino = computed(() => this.filasDe(this.seleccionado()));

  /** Valor de la celda por identificador de columna (tabla genérica). */
  valorDe(fila: FilaRegistro, col: string): string {
    return (fila as unknown as Record<string, string>)[col] ?? '';
  }

  tematicaDe(c: Curso): string {
    return c.detalle?.tematica || c.nombreTema;
  }

  tipoDe(c: Curso): string {
    return c.tipo === 'capacitacion' ? 'Capacitación' : 'Asistencia Técnica';
  }

  seleccionar(c: UsuarioSodega): void {
    this.seleccionadoDni.set(c.dni);
    this.error.set('');
  }

  /** Carga la grilla de origen validando que exista el registro de origen. */
  buscarRegistrosOrigen(): void {
    if (!this.origen) {
      this.error.set('Debe seleccionar un registro de origen antes de buscar sus registros.');
      return;
    }
    this.error.set('');
    this.busquedaOrigenEjecutada.set(true);
  }

  /** Selección directa del trabajador asignado desde el selector. */
  onDestinoChange(dni: string): void {
    if (!dni) {
      this.seleccionadoDni.set(null);
      return;
    }
    const candidato = this.candidatos().find((c) => c.dni === dni);
    if (candidato) this.seleccionar(candidato);
  }

  /** Valida la selección y muestra el diálogo de confirmación. */
  solicitarConfirmacion(): void {
    const destino = this.seleccionado();
    if (!destino) {
      this.error.set('Debe seleccionar al trabajador que asumirá los registros.');
      return;
    }
    if (destino.dni === this.origen.dni) {
      this.error.set('No es posible reasignar los registros al mismo trabajador de origen.');
      return;
    }
    if (destino.estado !== 'HABILITADO') {
      this.error.set('El trabajador seleccionado se encuentra inactivo y no puede recibir registros.');
      return;
    }
    if (destino.perfil !== ReasignarRegistroDialogComponent.PERFIL_RECEPTOR) {
      this.error.set('El trabajador seleccionado no tiene permisos para recibir Capacitaciones ni Asistencias Técnicas.');
      return;
    }
    // Confirmación mediante el sistema unificado de modales.
    void this.modales
      .openConfirm(
        'Reasignar registros',
        `Está a punto de transferir todas las Capacitaciones y Asistencias Técnicas de ` +
          `${this.etiquetaOrigen()} hacia ${this.etiquetaDestino()}. Esta acción modificará el ` +
          `responsable de todos los registros asociados. ¿Desea continuar?`,
      )
      .then((ok) => {
        if (ok) this.confirmarReasignacion();
      });
  }

  /** Ejecuta la transferencia completa y cierra devolviendo el resultado. */
  confirmarReasignacion(): void {
    const destino = this.seleccionado();
    if (!destino) return;
    const totales = this.cursosService.reasignarResponsable(
      this.nombreCompletoDe(this.origen),
      this.nombreCompletoDe(destino),
    );
    this.ref.close({ destino, ...totales });
  }
}
