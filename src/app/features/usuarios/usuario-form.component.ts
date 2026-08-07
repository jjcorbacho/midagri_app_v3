import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { ListasAdminService } from '../../core/services/listas-admin.service';
import { PermisosMenuService } from '../../core/services/permisos-menu.service';
import { ModalService } from '../../core/services/modal.service';
import { ToastService } from '../../core/services/toast.service';
import {
  AmbitoTerritorial,
  MetaAmbitoTerritorial,
  PERFILES,
  Perfil,
  MESES_ES,
  PeriodoGestion,
  TipoPeriodoGestion,
  UsuarioSodega,
  anioGestionVigente,
  aplicaMetasPorAmbito,
  aniosDeRango,
  calcularDiasCalendarioEntre,
  esRegimenTemporal,
  excedeAnioGestion,
  fechaMaximaVigencia,
  formatearPeriodo,
  perfilRequiereAmbito,
  perfilSoloRegion,
  estadoPeriodo,
  mesesActivablesPeriodoRegular,
  nombresDeMeses,
  regimenesPermitidosParaNuevoServicio,
  toTitleCase,
} from '../../core/models/usuario-sodega.model';
import { PermisosMenu, combinarPermisos } from '../../core/models/permisos-menu.model';
import { PermisosMenuFormComponent } from './permisos-menu-form.component';
import {
  DatosPresupuestalesData,
  DatosPresupuestalesDialogComponent,
} from './datos-presupuestales-dialog.component';
import {
  CATEGORIAS_PRESUPUESTALES,
  CATEGORIAS_PRESUPUESTALES_JEFE_AREA,
  FUENTES_FINANCIAMIENTO,
  PROFESIONES,
  PROGRAMAS_MAESTROS,
  REGIMENES_LABORALES,
  UBIGEO_SODEGA,
  UNIDADES_FUNCIONALES_MAESTRAS,
  UNIDADES_FUNCIONALES_POR_UNIDAD_RESPONSABLE,
  UNIDADES_POR_PROGRAMA,
  UNIDADES_RESPONSABLES,
} from '../../core/constants/sodega.const';
import { AutocompleteComponent } from '../../shared/components/autocomplete/autocomplete.component';
import { normalizarBusqueda } from '../../shared/utils/texto.util';
import { dateAIso, isoADate } from '../../shared/utils/fecha.util';

type ModoForm = 'nuevo' | 'editar' | 'presupuesto' | 'servicio';

/** Fila del FormArray de metas por ámbito territorial (cantidades enteras ≥ 0). */
type MetaAmbitoForm = FormGroup<{
  cantidadCapacitaciones: FormControl<number>;
  cantidadAsistenciaTecnica: FormControl<number>;
}>;

/**
 * Formulario multi-pestaña de Gestión de Usuarios (Datos del usuario / Permisos).
 * Modos: nuevo · editar · presupuesto (nueva partida presupuestal para un
 * usuario existente) · servicio (nuevo servicio conservando el historial).
 */
@Component({
  selector: 'app-usuario-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'es-PE' }],
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    MatTabsModule,
    MatTooltipModule,
    PermisosMenuFormComponent,
    AutocompleteComponent,
  ],
  template: `
    <section class="pagina">
      <h1>{{ titulo() }}</h1>

      <mat-tab-group class="pestanas" [mat-stretch-tabs]="false" (selectedIndexChange)="onCambioTab($event)">
        <!-- ================= PESTAÑA A: DATOS DEL USUARIO ================= -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="icono-tab" fontSet="material-symbols-outlined">badge</mat-icon>
            Datos del usuario
          </ng-template>

          <div class="contenido-tab" [formGroup]="form">
            <!-- Datos personales -->
            <mat-card appearance="outlined" class="bloque">
              <div class="seccion">
                <mat-icon fontSet="material-symbols-outlined">how_to_reg</mat-icon>
                <h3>Datos Personales</h3>
              </div>

              <div class="rejilla">
                <div class="c4 consulta-dni">
                  <mat-form-field class="campo">
                    <mat-label>Nro DNI</mat-label>
                    <input
                      matInput
                      type="text"
                      maxlength="8"
                      required
                      placeholder="Ingrese DNI"
                      formControlName="dni"
                      [readonly]="!reniecEditable()"
                    />
                  </mat-form-field>
                  <button
                    matButton="filled"
                    type="button"
                    (click)="consultarReniec()"
                    [disabled]="!reniecEditable() || buscandoReniec()"
                  >
                    @if (buscandoReniec()) {
                      <mat-spinner diameter="16" />
                    } @else {
                      <mat-icon fontSet="material-symbols-outlined">search</mat-icon>
                    }
                    {{ buscandoReniec() ? 'Buscando...' : 'Buscar' }}
                  </button>
                </div>
              </div>

              <div class="rejilla">
                <mat-form-field class="c4">
                  <mat-label>Apellido paterno</mat-label>
                  <input matInput formControlName="apePat" readonly placeholder="Apellido paterno" />
                </mat-form-field>
                <mat-form-field class="c4">
                  <mat-label>Apellido materno</mat-label>
                  <input matInput formControlName="apeMat" readonly placeholder="Apellido materno" />
                </mat-form-field>
                <mat-form-field class="c4">
                  <mat-label>Nombre(s)</mat-label>
                  <input matInput formControlName="nombres" readonly placeholder="Nombre(s)" />
                </mat-form-field>
              </div>

              <div class="rejilla">
                <mat-form-field class="c3">
                  <mat-label>Estado civil</mat-label>
                  <input matInput formControlName="estCivil" readonly placeholder="Estado civil" />
                </mat-form-field>
                <mat-form-field class="c3">
                  <mat-label>Profesión - especialidad</mat-label>
                  <mat-select formControlName="profesion" required>
                    @for (p of profesiones(); track p) {
                      <mat-option [value]="p">{{ p }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field class="c3">
                  <mat-label>Dirección domiciliaria</mat-label>
                  <input matInput formControlName="direccion" readonly placeholder="Dirección domiciliaria" />
                </mat-form-field>
                <mat-form-field class="c3">
                  <mat-label>Ubigeo RENIEC</mat-label>
                  <input matInput formControlName="ubigeo" readonly placeholder="UBIGEO" />
                </mat-form-field>
              </div>

              <div class="rejilla">
                <mat-form-field class="c3">
                  <mat-label>Restricciones</mat-label>
                  <input matInput formControlName="restricciones" readonly placeholder="Restricciones" />
                </mat-form-field>
                <mat-form-field class="c3">
                  <mat-label>Sexo</mat-label>
                  <mat-select formControlName="sexo" required>
                    @for (s of sexos(); track s) {
                      <mat-option [value]="s">{{ s }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field class="c3">
                  <mat-label>Fecha nac. (RENIEC)</mat-label>
                  <input matInput formControlName="fechaNac" readonly placeholder="dd/mm/aaaa" />
                </mat-form-field>
                <mat-form-field class="c3">
                  <mat-label>Edad calculada</mat-label>
                  <input matInput formControlName="edad" readonly placeholder="Edad calculada" />
                </mat-form-field>
              </div>

              <div class="rejilla">
                <mat-form-field class="c3">
                  <mat-label>Celular de contacto</mat-label>
                  <input matInput formControlName="celular" placeholder="999 999 999" />
                </mat-form-field>
              </div>
            </mat-card>

            <!-- Datos presupuestales -->
            <mat-card appearance="outlined" class="bloque">
              <div class="seccion">
                <mat-icon fontSet="material-symbols-outlined">account_balance_wallet</mat-icon>
                <h3>Datos Presupuestales</h3>
              </div>

              <mat-form-field class="campo">
                <mat-label>Unidad Responsable</mat-label>
                <mat-select formControlName="unidad" required>
                  @for (u of unidadesResponsables(); track u) {
                    <mat-option [value]="u">{{ u }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              @if (mostrarPresupuesto()) {
                <div class="rejilla separada">
                  <mat-form-field [class]="modoJefeArea() ? 'c4' : 'c3'">
                    <mat-label>Fuente de financ.</mat-label>
                    <mat-select formControlName="fuenteFinanc" required>
                      @for (f of fuentes(); track f) {
                        <mat-option [value]="f">{{ f }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>

                  @if (!modoJefeArea()) {
                    <mat-form-field class="c3">
                      <mat-label>Categoría presup.</mat-label>
                      <mat-select formControlName="categoriaPresup" required (valueChange)="onCategoriaChange()">
                        @for (c of categorias(); track c) {
                          <mat-option [value]="c">{{ c }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  }

                  <mat-form-field [class]="modoJefeArea() ? 'c4' : 'c3'">
                    <mat-label>{{ modoJefeArea() ? 'Categoría' : 'Programa presupuestal' }}</mat-label>
                    <mat-select formControlName="programaPresup" required (valueChange)="onProgramaChange()">
                      @for (p of programas(); track p) {
                        <mat-option [value]="p">{{ p }}</mat-option>
                      }
                    </mat-select>
                    @if (!programaHabilitado()) {
                      <mat-hint>Seleccione primero la Categoría presupuestal.</mat-hint>
                    }
                  </mat-form-field>

                  <mat-form-field [class]="modoJefeArea() ? 'c4' : 'c3'">
                    <mat-label>{{ modoJefeArea() ? 'Unidad Funcional' : 'Unidad funcional (Opas)' }}</mat-label>
                    <mat-select formControlName="unidadFuncional" required>
                      @for (u of unidadesFuncionales(); track u) {
                        <mat-option [value]="u">{{ u }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>
              }
            </mat-card>

            <div class="botonera">
              <button matButton type="button" (click)="cancelar()">Cancelar</button>
              <button matButton="filled" type="button" (click)="guardarYContinuar()">
                Siguiente
                <mat-icon fontSet="material-symbols-outlined" iconPositionEnd>arrow_forward</mat-icon>
              </button>
            </div>
          </div>
        </mat-tab>

        <!-- ================= PESTAÑA B: PERMISOS ================= -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="icono-tab" fontSet="material-symbols-outlined">key</mat-icon>
            Permisos
          </ng-template>

          <div class="contenido-tab" [formGroup]="form">
            <mat-card appearance="outlined" class="bloque">
              <div class="seccion">
                <mat-icon fontSet="material-symbols-outlined">shield_person</mat-icon>
                <h3>Cuenta de acceso institucional</h3>
              </div>

              <div class="rejilla">
                <mat-form-field class="c3">
                  <mat-label>Usuario generado</mat-label>
                  <input matInput formControlName="userGen" readonly placeholder="Usuario Automático" />
                </mat-form-field>
                <mat-form-field class="c3">
                  <mat-label>Correo Personal</mat-label>
                  <input matInput formControlName="correo" required placeholder="correo@midagri.gob.pe" />
                </mat-form-field>
                <mat-form-field class="c3">
                  <mat-label>Régimen laboral</mat-label>
                  <mat-select formControlName="regimen" required (valueChange)="onRegimenChange()">
                    @for (r of regimenesDisponibles(); track r) {
                      <mat-option [value]="r">{{ r }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field class="c3">
                  <mat-label>Estado de cuenta</mat-label>
                  <mat-select formControlName="estado">
                    <mat-option value="HABILITADO">Habilitado</mat-option>
                    <mat-option value="INHABILITADO">Inhabilitado</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <!-- Fechas de contrato / Nro de orden (OS y CAS Temporal) -->
              @if (regimenTemporal()) {
                <div class="rejilla panel-marca">
                  <mat-form-field [class]="esLocador() ? 'c4' : 'c6'">
                    <mat-label>Fecha de inicio</mat-label>
                    <input
                      matInput
                      required
                      [matDatepicker]="dpIni"
                      [max]="fechaMaxVigenciaDate"
                      [value]="fechaIniDate()"
                      (dateChange)="setFechaContrato('fechaIni', $event.value)"
                    />
                    <mat-datepicker-toggle matIconSuffix [for]="dpIni" />
                    <mat-datepicker #dpIni />
                  </mat-form-field>
                  <mat-form-field [class]="esLocador() ? 'c4' : 'c6'">
                    <mat-label>Fecha fin</mat-label>
                    <input
                      matInput
                      required
                      [matDatepicker]="dpFin"
                      [max]="fechaMaxVigenciaDate"
                      [value]="fechaFinDate()"
                      (dateChange)="setFechaContrato('fechaFin', $event.value)"
                    />
                    <mat-datepicker-toggle matIconSuffix [for]="dpFin" />
                    <mat-datepicker #dpFin />
                  </mat-form-field>
                  @if (esLocador()) {
                    <mat-form-field class="c4">
                      <mat-label>Nro. de Orden (O.S.)</mat-label>
                      <input matInput required class="mayusculas" formControlName="nroOrden" placeholder="Ejem: O.S. N° 00421-2026" />
                    </mat-form-field>
                  }
                  <p class="c12 nota">
                    La vigencia no puede superar el {{ fechaMaxVigenciaTexto }} (año de gestión {{ anioGestion }}).
                  </p>
                </div>
              }

              <!-- Tipo de Periodo (se habilita al elegir el Régimen Laboral) -->
              @if (mostrarSeccionPeriodo()) {
                <div class="panel-marca periodo">
                  <p class="subtitulo">Tipo de Periodo</p>

                  <div class="rejilla">
                    <mat-form-field class="c6">
                      <mat-label>Tipo de periodo</mat-label>
                      <mat-select formControlName="periodoTipo" required (valueChange)="onTipoPeriodoChange()">
                        @for (t of tiposPeriodo; track t) {
                          <mat-option [value]="t">{{ t }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                    @if (form.controls.periodoTipo.value === 'Regular') {
                      <mat-form-field class="c6">
                        <mat-label>Año de Gestión</mat-label>
                        <mat-select formControlName="periodoAnio" required (valueChange)="onAnioGestionChange()">
                          @for (a of aniosGestion(); track a) {
                            <mat-option [value]="a.toString()">{{ a }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                    }
                  </div>

                  @if (form.controls.periodoTipo.value === 'Regular') {
                    <!-- Regular: selección múltiple de meses -->
                    <p class="etiqueta-meses">
                      Meses del periodo
                      @if (mesesAutomaticos()) {
                        <span> · calculados automáticamente según la vigencia del contrato</span>
                      } @else if (mesesHabilitados().length === 0) {
                        <span> · ningún mes puede activarse para el año de gestión seleccionado</span>
                      }
                    </p>
                    <div class="meses" role="group" aria-label="Meses del periodo">
                      @for (m of mesesCatalogo; track m.numero) {
                        <span [matTooltip]="ayudaMes(m.numero)" [matTooltipDisabled]="esMesHabilitado(m.numero)">
                          <mat-checkbox
                            [checked]="mesesSeleccionados().includes(m.numero)"
                            [disabled]="!esMesHabilitado(m.numero)"
                            (change)="toggleMes(m.numero, $event.checked)"
                          >{{ m.nombre }}</mat-checkbox>
                        </span>
                      }
                    </div>
                  } @else if (form.controls.periodoTipo.value === 'Extraordinario') {
                    <!-- Extraordinario: rango de fechas -->
                    <div class="rejilla">
                      <mat-form-field class="c6">
                        <mat-label>Fecha Inicio</mat-label>
                        <input
                          matInput
                          required
                          [matDatepicker]="dpPerIni"
                          [max]="fechaMaxVigenciaDate"
                          [value]="periodoIniDate()"
                          (dateChange)="setFechaPeriodo('periodoFechaIni', $event.value)"
                        />
                        <mat-datepicker-toggle matIconSuffix [for]="dpPerIni" />
                        <mat-datepicker #dpPerIni />
                      </mat-form-field>
                      <mat-form-field class="c6">
                        <mat-label>Fecha Fin</mat-label>
                        <input
                          matInput
                          required
                          [matDatepicker]="dpPerFin"
                          [max]="fechaMaxVigenciaDate"
                          [value]="periodoFinDate()"
                          (dateChange)="setFechaPeriodo('periodoFechaFin', $event.value)"
                        />
                        <mat-datepicker-toggle matIconSuffix [for]="dpPerFin" />
                        <mat-datepicker #dpPerFin />
                      </mat-form-field>
                    </div>
                  }

                  @if (form.controls.periodoTipo.value) {
                    <div class="botonera">
                      <button matButton="outlined" type="button" (click)="agregarPeriodo()">
                        <mat-icon fontSet="material-symbols-outlined">add_box</mat-icon>
                        Agregar Periodo
                      </button>
                    </div>
                  }

                  <!-- Tabla de periodos del servicio (máximo uno) -->
                  <div class="tabla-contenedor">
                    <table mat-table [dataSource]="filasPeriodo()">
                      <ng-container matColumnDef="tipo">
                        <th mat-header-cell *matHeaderCellDef>Tipo de Periodo</th>
                        <td mat-cell *matCellDef="let fila" class="destacado">{{ fila.pg.tipo }}</td>
                      </ng-container>
                      <ng-container matColumnDef="detalle">
                        <th mat-header-cell *matHeaderCellDef>Meses / Fechas Activas</th>
                        <td mat-cell *matCellDef="let fila">{{ formatearPeriodo(fila.pg) }}</td>
                      </ng-container>
                      <ng-container matColumnDef="estado">
                        <th mat-header-cell *matHeaderCellDef>Estado</th>
                        <td mat-cell *matCellDef="let fila">
                          <mat-chip
                            disableRipple
                            [class]="estadoPeriodo(fila.pg) === 'Expirado' ? 'c-observado' : 'c-aprobado'"
                          >{{ estadoPeriodo(fila.pg) }}</mat-chip>
                        </td>
                      </ng-container>
                      <ng-container matColumnDef="acciones">
                        <th mat-header-cell *matHeaderCellDef>Acciones</th>
                        <td mat-cell *matCellDef="let fila">
                          <button
                            matIconButton
                            type="button"
                            class="eliminar"
                            matTooltip="Eliminar periodo"
                            aria-label="Eliminar periodo"
                            (click)="eliminarPeriodo(fila.indice)"
                          >
                            <mat-icon fontSet="material-symbols-outlined">delete</mat-icon>
                          </button>
                        </td>
                      </ng-container>
                      <tr mat-header-row *matHeaderRowDef="columnasPeriodo"></tr>
                      <tr mat-row *matRowDef="let fila; columns: columnasPeriodo"></tr>
                      <tr class="fila-vacia" *matNoDataRow>
                        <td [attr.colspan]="columnasPeriodo.length">Sin periodo registrado para este servicio.</td>
                      </tr>
                    </table>
                  </div>
                </div>
              }

              <!-- Perfil autorizado + Ámbito asignado -->
              <div class="bloque-perfil">
                <mat-form-field class="campo">
                  <mat-label>Perfil autorizado</mat-label>
                  <mat-select formControlName="perfil" required (valueChange)="onPerfilChange()">
                    @for (p of perfilesRegistrables(); track p) {
                      <mat-option [value]="p">{{ p }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                @if (mostrarAmbito()) {
                  @if (esModoServicio()) {
                    <p class="nota">
                      Ámbitos territoriales del servicio anterior (solo lectura en un nuevo servicio).
                    </p>
                  } @else {
                    <!-- Fila territorial: Región | Provincia | Distrito | Agregar -->
                    <div class="rejilla">
                      <app-autocomplete
                        class="c3"
                        label="Región"
                        placeholder="Escriba para buscar una región..."
                        ariaLabel="Buscar región"
                        [options]="regiones"
                        [value]="ambitoRegion()"
                        (valueChange)="onRegionSeleccionada($event)"
                      />
                      <app-autocomplete
                        class="c3"
                        label="Provincia"
                        placeholder="Escriba para buscar una provincia..."
                        ariaLabel="Buscar provincia"
                        [options]="provinciasDisponibles()"
                        [value]="ambitoProvincia()"
                        [deshabilitado]="soloRegion() || !ambitoRegion()"
                        (valueChange)="onProvinciaSeleccionada($event)"
                      />

                      @if (esTecnicoSeleccionado()) {
                        <!-- Buscador + multi-selección de distritos (solo Técnicos) -->
                        <div class="c4">
                          <mat-form-field subscriptSizing="dynamic" class="campo">
                            <mat-label>Distrito</mat-label>
                            <input
                              matInput
                              type="text"
                              autocomplete="off"
                              aria-label="Buscar distrito"
                              placeholder="Escriba para filtrar distritos..."
                              [value]="distritoFiltro()"
                              [disabled]="!ambitoProvincia()"
                              (input)="distritoFiltro.set($any($event.target).value)"
                            />
                            <mat-icon matSuffix fontSet="material-symbols-outlined">search</mat-icon>
                          </mat-form-field>

                          <div class="lista-distritos">
                            <div class="cabecera-distritos">
                              <mat-checkbox
                                [checked]="todosDistritosSeleccionados()"
                                [disabled]="!ambitoProvincia() || distritosFiltrados().length === 0"
                                (change)="toggleTodosDistritos($event.checked)"
                              >Seleccionar todos</mat-checkbox>
                              <span class="contador">{{ distritosSeleccionados().length }} seleccionados</span>
                            </div>
                            <!-- Máx. 4 distritos visibles: el resto se alcanza con el scroll interno. -->
                            <div class="items-distritos" role="group" aria-label="Distritos disponibles">
                              @if (!ambitoProvincia()) {
                                <p class="vacio">Seleccione una Región y una Provincia para listar los distritos.</p>
                              } @else if (distritosFiltrados().length === 0) {
                                <p class="vacio">Sin coincidencias para "{{ distritoFiltro() }}".</p>
                              }
                              @for (d of distritosFiltrados(); track d) {
                                <mat-checkbox
                                  [checked]="distritosSeleccionados().includes(d)"
                                  (change)="toggleDistrito(d, $event.checked)"
                                >{{ d }}</mat-checkbox>
                              }
                            </div>
                          </div>
                        </div>
                      } @else {
                        <mat-form-field class="c4">
                          <mat-label>Distrito</mat-label>
                          <mat-select
                            [value]="ambitoDistrito()"
                            [disabled]="soloRegion() || !ambitoProvincia()"
                            (valueChange)="ambitoDistrito.set($event)"
                          >
                            @for (d of distritosDisponibles(); track d) {
                              <mat-option [value]="d">{{ d }}</mat-option>
                            }
                          </mat-select>
                        </mat-form-field>
                      }

                      <div class="c2 alinear-boton">
                        <button matButton="outlined" type="button" (click)="agregarAmbito()">
                          <mat-icon fontSet="material-symbols-outlined">add_box</mat-icon>
                          Agregar
                        </button>
                      </div>
                    </div>
                  }

                  <div class="tabla-contenedor">
                    <table mat-table [dataSource]="filasAmbito()">
                      <ng-container matColumnDef="region">
                        <th mat-header-cell *matHeaderCellDef>Región</th>
                        <td mat-cell *matCellDef="let fila">{{ fila.region }}</td>
                      </ng-container>
                      <ng-container matColumnDef="provincia">
                        <th mat-header-cell *matHeaderCellDef>Provincia</th>
                        <td mat-cell *matCellDef="let fila">{{ fila.provincia }}</td>
                      </ng-container>
                      <ng-container matColumnDef="distrito">
                        <th mat-header-cell *matHeaderCellDef>Distrito</th>
                        <td mat-cell *matCellDef="let fila">{{ fila.distrito }}</td>
                      </ng-container>
                      <ng-container matColumnDef="acciones">
                        <th mat-header-cell *matHeaderCellDef></th>
                        <td mat-cell *matCellDef="let fila">
                          @if (!esModoServicio()) {
                            <button
                              matIconButton
                              type="button"
                              class="eliminar"
                              matTooltip="Eliminar ámbito"
                              aria-label="Eliminar ámbito"
                              (click)="eliminarAmbito(fila.indice)"
                            >
                              <mat-icon fontSet="material-symbols-outlined">delete</mat-icon>
                            </button>
                          }
                        </td>
                      </ng-container>
                      <tr mat-header-row *matHeaderRowDef="columnasAmbito"></tr>
                      <tr mat-row *matRowDef="let fila; columns: columnasAmbito"></tr>
                      <tr class="fila-vacia" *matNoDataRow>
                        <td [attr.colspan]="columnasAmbito.length">Sin ámbitos territoriales asignados.</td>
                      </tr>
                    </table>
                  </div>

                  <!-- Metas asignadas por ámbito territorial (solo Admin DZ → Técnico) -->
                  @if (mostrarMetas()) {
                    <div class="seccion">
                      <mat-icon fontSet="material-symbols-outlined">target</mat-icon>
                      <h3>Metas asignadas por ámbito territorial</h3>
                    </div>
                    <div class="tabla-contenedor">
                      <table mat-table [dataSource]="filasMetas()">
                        <ng-container matColumnDef="region">
                          <th mat-header-cell *matHeaderCellDef>Región</th>
                          <td mat-cell *matCellDef="let fila">{{ fila.amb.region }}</td>
                        </ng-container>
                        <ng-container matColumnDef="provincia">
                          <th mat-header-cell *matHeaderCellDef>Provincia</th>
                          <td mat-cell *matCellDef="let fila">{{ fila.amb.provincia }}</td>
                        </ng-container>
                        <ng-container matColumnDef="distrito">
                          <th mat-header-cell *matHeaderCellDef>Distrito</th>
                          <td mat-cell *matCellDef="let fila">{{ fila.amb.distrito }}</td>
                        </ng-container>
                        <ng-container matColumnDef="capacitaciones">
                          <th mat-header-cell *matHeaderCellDef>Cantidad de Capacitaciones</th>
                          <!-- El formGroup vive en la propia celda: las plantillas de mat-table
                               se declaran fuera de la fila y no heredan su contenedor. -->
                          <td mat-cell *matCellDef="let fila" [formGroup]="fila.grupo">
                            <mat-form-field subscriptSizing="dynamic" class="meta">
                              <input
                                matInput
                                type="number"
                                min="0"
                                step="1"
                                inputmode="numeric"
                                aria-label="Cantidad de Capacitaciones"
                                formControlName="cantidadCapacitaciones"
                                (keydown)="bloquearNoEnteros($event)"
                                (blur)="normalizarMeta(fila.indice, 'cantidadCapacitaciones')"
                              />
                            </mat-form-field>
                          </td>
                        </ng-container>
                        <ng-container matColumnDef="asistencias">
                          <th mat-header-cell *matHeaderCellDef>Cantidad de Asistencia Técnica</th>
                          <td mat-cell *matCellDef="let fila" [formGroup]="fila.grupo">
                            <mat-form-field subscriptSizing="dynamic" class="meta">
                              <input
                                matInput
                                type="number"
                                min="0"
                                step="1"
                                inputmode="numeric"
                                aria-label="Cantidad de Asistencia Técnica"
                                formControlName="cantidadAsistenciaTecnica"
                                (keydown)="bloquearNoEnteros($event)"
                                (blur)="normalizarMeta(fila.indice, 'cantidadAsistenciaTecnica')"
                              />
                            </mat-form-field>
                          </td>
                        </ng-container>
                        <tr mat-header-row *matHeaderRowDef="columnasMetas"></tr>
                        <tr mat-row *matRowDef="let fila; columns: columnasMetas"></tr>
                      </table>
                    </div>
                  }
                }
              </div>

              <!-- Permisos de menú por usuario (esquema según perfil seleccionado) -->
              @if (esquemaPermisos(); as esquema) {
                <app-permisos-menu-form [esquema]="esquema" [(permisos)]="permisosMenuEdit" />
              }
            </mat-card>

            <div class="botonera">
              <button matButton type="button" (click)="irAPestana('datos')">
                <mat-icon fontSet="material-symbols-outlined">arrow_back</mat-icon>
                Atrás
              </button>
              @if (requierePresupuestoAdminGeneral()) {
                <!-- Abre el diálogo (no cambia de pestaña) y refleja el estado completado. -->
                <button
                  matButton="filled"
                  type="button"
                  [class.completado]="presupuestoRegistrado()"
                  [attr.aria-label]="presupuestoRegistrado()
                    ? 'Datos presupuestales registrados. Abrir para revisar o editar'
                    : 'Registrar datos presupuestales'"
                  (click)="abrirDialogoPresupuesto()"
                >
                  <mat-icon fontSet="material-symbols-outlined">
                    {{ presupuestoRegistrado() ? 'check_circle' : 'account_balance_wallet' }}
                  </mat-icon>
                  {{ presupuestoRegistrado() ? 'Datos Presupuestales Registrados' : 'Registrar Datos Presupuestales' }}
                </button>
              }
              <span [matTooltip]="guardarBloqueado() ? motivoGuardarBloqueado() : ''">
                <button
                  matButton="filled"
                  type="button"
                  class="guardar"
                  [disabled]="guardarBloqueado()"
                  (click)="guardarRegistroCompleto()"
                >
                  <mat-icon fontSet="material-symbols-outlined">save</mat-icon>
                  {{ modo() === 'editar' ? 'Guardar Cambios' : 'Guardar Registro' }}
                </button>
              </span>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </section>
  `,
  styles: `
    .pagina {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    @media (min-width: 1024px) { .pagina { padding: 32px; } }
    h1 {
      margin: 0;
      font: var(--mat-sys-headline-small);
      color: var(--mat-sys-on-surface);
    }

    /* Caja fija: la ligadura no ensancha la pestaña mientras carga la fuente
       (con el ancho provisional el encabezado activaba su paginación). */
    .icono-tab {
      margin-right: 8px;
      font-size: 20px; width: 20px; height: 20px;
      overflow: hidden;
    }
    .contenido-tab {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding-top: 20px;
    }

    .bloque {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .seccion {
      display: flex;
      align-items: center;
      gap: 8px;
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

    /* Rejilla de 12 columnas equivalente a la del design system anterior. */
    .rejilla {
      display: grid;
      grid-template-columns: repeat(12, minmax(0, 1fr));
      gap: 12px;
      align-items: start;
    }
    .rejilla > * { grid-column: span 12; }
    .separada { border-top: 1px solid var(--mat-sys-outline-variant); padding-top: 16px; }
    @media (min-width: 768px) {
      .rejilla > .c2 { grid-column: span 2; }
      .rejilla > .c3 { grid-column: span 3; }
      .rejilla > .c4 { grid-column: span 4; }
      .rejilla > .c6 { grid-column: span 6; }
    }
    .campo, mat-form-field { width: 100%; }

    .consulta-dni { display: flex; align-items: flex-start; gap: 8px; }
    .consulta-dni .campo { flex: 1 1 auto; }
    .consulta-dni button { margin-top: 8px; }
    .mayusculas { text-transform: uppercase; }

    .panel-marca {
      padding: 16px;
      border-radius: var(--mat-sys-corner-medium);
      background: var(--mat-sys-surface-container-low);
      border: 1px solid var(--mat-sys-outline-variant);
    }
    .periodo { display: flex; flex-direction: column; gap: 12px; }
    .subtitulo {
      margin: 0;
      font: var(--mat-sys-label-large);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--mat-sys-primary);
    }
    .nota, .etiqueta-meses {
      margin: 0;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }
    .etiqueta-meses { color: var(--mat-sys-primary); }
    .etiqueta-meses span { color: var(--mat-sys-on-surface-variant); }

    .meses {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0 16px;
    }
    @media (min-width: 640px) { .meses { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
    @media (min-width: 1024px) { .meses { grid-template-columns: repeat(4, minmax(0, 1fr)); } }

    .lista-distritos, .tabla-contenedor {
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-medium);
    }
    .lista-distritos { margin-top: 8px; overflow: hidden; }
    .cabecera-distritos {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 4px 8px;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }
    .contador {
      flex: 0 0 auto;
      padding: 2px 8px;
      border-radius: var(--mat-sys-corner-full);
      background: var(--mat-sys-surface);
      font: var(--mat-sys-label-small);
      font-variant-numeric: tabular-nums;
    }
    .items-distritos {
      display: flex;
      flex-direction: column;
      max-height: 150px;
      overflow-y: auto;
      padding: 4px 8px;
    }
    .items-distritos .vacio {
      margin: 0;
      padding: 8px;
      font: var(--mat-sys-body-small);
      font-style: italic;
      color: var(--mat-sys-on-surface-variant);
    }
    /* Alinea el botón con los campos que llevan label flotante. */
    .alinear-boton { padding-top: 8px; }

    .bloque-perfil {
      display: flex;
      flex-direction: column;
      gap: 16px;
      border-top: 1px solid var(--mat-sys-outline-variant);
      padding-top: 20px;
    }

    .tabla-contenedor { overflow: auto; }
    table { width: 100%; }
    th.mat-mdc-header-cell {
      font: var(--mat-sys-label-medium);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      white-space: nowrap;
    }
    .destacado { font-weight: 600; }
    .fila-vacia td {
      padding: 16px;
      text-align: center;
      font: var(--mat-sys-body-small);
      font-style: italic;
      color: var(--mat-sys-on-surface-variant);
    }
    /* Cantidades centradas en su columna, como en el diseño original. */
    .mat-column-capacitaciones, .mat-column-asistencias { text-align: center; }
    .meta { width: 96px; }
    .meta input { text-align: center; }
    .eliminar {
      background: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
      width: 36px; height: 36px; padding: 8px;
    }
    .eliminar mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .botonera {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
    }
    /* Guardado y presupuesto completado en el verde de estado aprobado. */
    .guardar:not([disabled]), .completado {
      --mat-button-filled-container-color: var(--estado-aprobado);
      --mat-button-filled-label-text-color: var(--mat-sys-on-primary);
    }
  `,
})
export class UsuarioFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly listasAdmin = inject(ListasAdminService);
  private readonly permisosService = inject(PermisosMenuService);
  private readonly modales = inject(ModalService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);

  /** Grupo de pestañas: la navegación programática y el veto pasan por aquí. */
  private readonly grupoTabs = viewChild.required(MatTabGroup);

  /* Catálogos reactivos: base del proyecto ⊕ opciones de Administración de Listas */
  readonly profesiones = computed(() => this.listasAdmin.opcionesFormulario('Profesión - Especialidad', PROFESIONES));
  readonly fuentes = computed(() => this.listasAdmin.opcionesFormulario('Fuente de Financiamiento', FUENTES_FINANCIAMIENTO));
  readonly categorias = computed(() => this.listasAdmin.opcionesFormulario('Categoría Presupuestal', CATEGORIAS_PRESUPUESTALES));
  readonly programas = computed(() =>
    this.modoJefeArea()
      ? [...CATEGORIAS_PRESUPUESTALES_JEFE_AREA]
      : this.listasAdmin.opcionesFormulario('Programas Presupuestales', PROGRAMAS_MAESTROS),
  );
  readonly unidadesResponsables = computed(() => this.listasAdmin.opcionesFormulario('Unidad Responsable', UNIDADES_RESPONSABLES));
  readonly sexos = computed(() => this.listasAdmin.opcionesFormulario('Sexo', ['Masculino', 'Femenino']));
  readonly regiones = Object.keys(UBIGEO_SODEGA);

  readonly modo = signal<ModoForm>('nuevo');
  readonly tab = signal<'datos' | 'permisos'>('datos');
  readonly buscandoReniec = signal(false);
  readonly reniecEditable = signal(true);
  readonly ambitos = signal<AmbitoTerritorial[]>([]);
  readonly ambitoRegion = signal('');
  readonly ambitoProvincia = signal('');
  readonly ambitoDistrito = signal('');
  /** Multi-selección de distritos (solo perfil objetivo Técnico). */
  readonly distritosSeleccionados = signal<string[]>([]);
  /** Filtro en vivo del buscador de distritos (sobre el selector múltiple). */
  readonly distritoFiltro = signal('');
  readonly formTick = signal(0);
  /** Permisos de menú en edición (esquema del perfil seleccionado). */
  readonly permisosMenuEdit = signal<PermisosMenu>({});

  /* Columnas de las tres tablas del formulario. */
  readonly columnasPeriodo = ['tipo', 'detalle', 'estado', 'acciones'];
  readonly columnasAmbito = ['region', 'provincia', 'distrito', 'acciones'];
  readonly columnasMetas = ['region', 'provincia', 'distrito', 'capacitaciones', 'asistencias'];

  private usuarioBase: UsuarioSodega | null = null;

  readonly form = this.fb.nonNullable.group({
    dni: '',
    apePat: '',
    apeMat: '',
    nombres: '',
    estCivil: '',
    profesion: '',
    direccion: '',
    ubigeo: '',
    restricciones: '',
    sexo: '',
    fechaNac: '',
    edad: '',
    celular: '',
    unidad: '',
    fuenteFinanc: '',
    categoriaPresup: '',
    programaPresup: '',
    unidadFuncional: '',
    userGen: '',
    correo: '',
    regimen: '',
    estado: 'HABILITADO',
    fechaIni: '',
    fechaFin: '',
    nroOrden: '',
    perfil: '' as Perfil | '',
    periodoTipo: '' as TipoPeriodoGestion | '',
    periodoAnio: String(new Date().getFullYear()),
    periodoFechaIni: '',
    periodoFechaFin: '',
    metasAmbito: this.fb.array<MetaAmbitoForm>([]),
  });

  /** Metas por ámbito: una fila por cada entrada de `ambitos()` (mismo índice). */
  get metasAmbito(): FormArray<MetaAmbitoForm> {
    return this.form.controls.metasAmbito;
  }

  constructor() {
    this.form.valueChanges.subscribe(() => this.formTick.update((t) => t + 1));
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const modoQP = this.route.snapshot.queryParamMap.get('modo');
    if (id) {
      this.usuarioBase = this.usuariosService.findById(id) ?? null;
      this.modo.set(modoQP === 'presupuesto' ? 'presupuesto' : modoQP === 'servicio' ? 'servicio' : 'editar');
      if (this.usuarioBase) this.cargarUsuario(this.usuarioBase);
    }
    this.aplicarBloqueosPorPerfilActivo();
  }

  private cargarUsuario(u: UsuarioSodega): void {
    const esPresupuesto = this.modo() === 'presupuesto';
    const esServicio = this.modo() === 'servicio';
    const nuevaPartida = esPresupuesto || esServicio;
    this.form.patchValue({
      dni: u.dni,
      apePat: u.apePat,
      apeMat: u.apeMat,
      nombres: u.nombres,
      estCivil: u.estCivil,
      profesion: u.profesion,
      direccion: u.direccion,
      ubigeo: u.ubigeo,
      restricciones: u.restricciones,
      sexo: u.sexo,
      fechaNac: u.fechaNac,
      edad: `${u.edad} AÑOS`,
      celular: u.celular,
      unidad: nuevaPartida ? '' : u.unidad,
      fuenteFinanc: nuevaPartida ? '' : u.fuenteFinanc,
      categoriaPresup: nuevaPartida ? '' : u.categoriaPresup,
      programaPresup: nuevaPartida ? '' : u.programaPresup,
      unidadFuncional: nuevaPartida ? '' : u.unidadFuncional,
      userGen: u.userGen,
      correo: u.correo,
      regimen: u.regimen,
      // El estado pertenece al servicio: un nuevo servicio nace habilitado
      // y nunca arrastra el estado del servicio anterior (T1).
      estado: esServicio ? 'HABILITADO' : u.estado,
      // Nuevo servicio: la vigencia y el periodo se registran desde cero.
      fechaIni: esServicio ? '' : u.fechaIni,
      fechaFin: esServicio ? '' : u.fechaFin,
      nroOrden: esServicio ? '' : u.nroOrden,
      perfil: u.perfil,
      periodoTipo: '',
    });
    // Cada servicio administra su propio periodo: en un nuevo servicio se
    // registra desde cero; al editar se cargan los del propio registro.
    this.periodos.set(esServicio ? [] : [...(u.periodosGestion ?? [])]);
    this.ambitos.set([...(u.ambitos ?? [])]);
    this.reconstruirMetasAmbito(u.ambitos ?? [], u.metasAmbito);
    this.sincronizarPermisosMenu();
    // En edición el DNI no cambia; en nueva partida/servicio la sección RENIEC queda bloqueada.
    this.reniecEditable.set(!nuevaPartida);
    if (this.modo() === 'editar') this.form.controls.dni.disable();
    // Nueva partida o nuevo servicio: la identidad viene de RENIEC y no se
    // reescribe aquí (antes solo se atenuaba visualmente).
    if (nuevaPartida) {
      ['dni', 'profesion', 'sexo'].forEach((c) => this.form.get(c)?.disable());
    }
    // Agregar Nuevo Servicio: además, la cuenta y el perfil se conservan.
    if (esServicio) {
      ['correo', 'perfil'].forEach((c) => this.form.get(c)?.disable());
    }
  }

  /** Unidad Responsable bloqueada para perfiles subordinados (prototipo). */
  private aplicarBloqueosPorPerfilActivo(): void {
    const s = this.auth.session();
    if (!s) return;
    const bloqueaUnidad =
      !this.auth.esAdminGeneralAutenticado() &&
      ['Jefe de Área', 'Administrador Unidad Ejecutora(UE)', 'Administrador DZ_Cap_Asit.'].includes(s.perfil);
    if (bloqueaUnidad && this.modo() !== 'presupuesto' && this.modo() !== 'servicio') {
      this.form.controls.unidad.setValue(s.unidad);
      this.form.controls.unidad.disable();
    }
    if (this.presupuestoBloqueado()) {
      const registroActivo = this.usuariosService
        .findByUserGen(s.userGen)
        .find((u) => u.perfil === s.perfil && u.unidad === s.unidad)
        ?? this.usuariosService.findByUserGen(s.userGen).find((u) => u.perfil === s.perfil);
      if (registroActivo) {
        this.form.patchValue({
          fuenteFinanc: registroActivo.fuenteFinanc || '',
          categoriaPresup: registroActivo.categoriaPresup || '',
          programaPresup: registroActivo.programaPresup || '',
          unidadFuncional: registroActivo.unidadFuncional || '',
        });
      }
      ['fuenteFinanc', 'categoriaPresup', 'programaPresup', 'unidadFuncional'].forEach((c) =>
        this.form.get(c)?.disable(),
      );
    }
  }

  /* ===== Derivados ===== */
  readonly titulo = computed(() => {
    const u = this.usuarioBase;
    if (this.modo() === 'editar' && u) return `MODIFICANDO REGISTRO: ${u.nombres} ${u.apePat}`;
    if (this.modo() === 'presupuesto' && u) return `ASIGNACIÓN DE NUEVO PRESUPUESTO: ${u.nombres} ${u.apePat}`;
    if (this.modo() === 'servicio' && u) return `AGREGAR NUEVO SERVICIO: ${u.nombres} ${u.apePat}`;
    return 'GESTIÓN INTEGRAL DE USUARIOS';
  });

  readonly perfilesRegistrables = computed<Perfil[]>(() => {
    const s = this.auth.session();
    if (!s) return [];
    // Perfiles oficiales + personalizados de la lista "Perfil Autorizado".
    const disponibles = this.listasAdmin.perfilesAutorizados(PERFILES);
    return this.usuariosService.perfilesRegistrables(s.perfil, disponibles);
  });

  presupuestoBloqueado(): boolean {
    const s = this.auth.session();
    if (!s || this.auth.esAdminGeneralAutenticado()) return false;
    return ['Administrador Unidad Ejecutora(UE)', 'Administrador DZ_Cap_Asit.'].includes(s.perfil);
  }

  /** Perfiles que heredan la vista presupuestal del Jefe de Área. */
  private static readonly PERFILES_HEREDEROS_PRESUPUESTO = [
    'Administrador Unidad Ejecutora(UE)',
    'Administrador DZ_Cap_Asit.',
    'Técnico Capacitación y Asistencia Técnica',
  ];

  /**
   * Vista presupuestal del Jefe de Área (3 columnas, "Categoría" en lugar de
   * Categoría presup. + Programa): aplica al Jefe de Área, a sus perfiles
   * herederos y al Admin General cuando registra uno de esos perfiles.
   */
  readonly modoJefeArea = computed(() => {
    this.formTick();
    const s = this.auth.session();
    if (!s) return false;
    const target = this.form.controls.perfil.value;
    const herederos = UsuarioFormComponent.PERFILES_HEREDEROS_PRESUPUESTO;
    return (
      s.perfil === 'Jefe de Área' ||
      herederos.includes(s.perfil) ||
      (s.perfilAutenticado === 'Administrador General' && herederos.includes(target))
    );
  });

  /**
   * Detalle presupuestal (fuente, categoría, programa y unidad funcional)
   * visible solo para perfiles de gestión: para el Administrador General
   * (como objetivo, o registrando sin perfil elegido aún) se muestra
   * únicamente la Unidad Responsable, igual que el prototipo.
   */
  readonly mostrarPresupuesto = computed(() => {
    this.formTick();
    const target = this.form.controls.perfil.value;
    const s = this.auth.session();
    if (target === 'Administrador General') return false;
    if (s?.perfil === 'Administrador General' && target === 'Jefe de Área') return false;
    const perfilesGestion = ['Jefe de Área', ...UsuarioFormComponent.PERFILES_HEREDEROS_PRESUPUESTO];
    return (
      perfilesGestion.includes(s?.perfil ?? '') ||
      perfilesGestion.includes(target) ||
      (this.auth.esAdminGeneralAutenticado() && this.permisosService.esPerfilPersonalizado(target))
    );
  });

  readonly programaHabilitado = computed(() => {
    this.formTick();
    return this.modoJefeArea() || this.form.controls.categoriaPresup.value === 'Programa Presupuestal';
  });

  readonly unidadesFuncionales = computed<string[]>(() => {
    this.formTick();
    const s = this.auth.session();
    // 1) Unidades funcionales asociadas a la Unidad Responsable en la
    //    Administración de Listas (tienen prioridad sobre los catálogos fijos).
    const unidadResponsable = this.form.getRawValue().unidad || s?.unidad || '';
    const relacionadas = this.listasAdmin.unidadesFuncionalesPorUnidadResponsable(unidadResponsable);
    if (relacionadas.length) return relacionadas;
    // 2) Jefe de Área en sesión: catálogo propio de su Unidad Responsable.
    if (this.modoJefeArea()) {
      const base =
        s?.perfil === 'Jefe de Área'
          ? UNIDADES_FUNCIONALES_POR_UNIDAD_RESPONSABLE[s.unidad] ?? UNIDADES_FUNCIONALES_MAESTRAS
          : UNIDADES_FUNCIONALES_MAESTRAS;
      return this.listasAdmin.opcionesFormulario('Unidad Funcional', base);
    }
    // 3) Cascada clásica Categoría → Programa → Unidad funcional.
    const cat = this.form.controls.categoriaPresup.value;
    const prog = this.form.controls.programaPresup.value;
    const base =
      cat === 'Programa Presupuestal' && prog
        ? UNIDADES_POR_PROGRAMA[prog] ?? UNIDADES_FUNCIONALES_MAESTRAS
        : UNIDADES_FUNCIONALES_MAESTRAS;
    return this.listasAdmin.opcionesFormulario('Unidad Funcional', base);
  });

  /**
   * ¿La sesión activa puede configurar los permisos del perfil objetivo?
   * Admin General master siempre; los demás solo sobre su subordinado directo
   * (Jefe → UE, UE → DZ, DZ → Técnico), igual que el prototipo.
   */
  private debeConfigurarPermisos(target: Perfil | ''): boolean {
    const s = this.auth.session();
    if (!s || !target) return false;
    if (s.perfilAutenticado === 'Administrador General') return true;
    const activo = s.perfil;
    const configuraUE =
      target === 'Administrador Unidad Ejecutora(UE)' &&
      ['Jefe de Área', 'Administrador Unidad Ejecutora(UE)', 'Administrador DZ_Cap_Asit.'].includes(activo);
    const configuraDzDesdeUE =
      activo === 'Administrador Unidad Ejecutora(UE)' && target === 'Administrador DZ_Cap_Asit.';
    const configuraTecnicoDesdeDz =
      activo === 'Administrador DZ_Cap_Asit.' && target === 'Técnico Capacitación y Asistencia Técnica';
    return configuraUE || configuraDzDesdeUE || configuraTecnicoDesdeDz;
  }

  /** Esquema de permisos del perfil seleccionado (según jerarquía de configuración). */
  readonly esquemaPermisos = computed(() => {
    this.formTick();
    const target = this.form.controls.perfil.value;
    if (!this.debeConfigurarPermisos(target)) return undefined;
    return this.permisosService.esquemaPara(target);
  });

  readonly regimenTemporal = computed(() => {
    this.formTick();
    const r = this.form.controls.regimen.value;
    return r === 'Locador de Servicio (OS)' || r === 'Régimen CAS Temporal';
  });

  readonly esModoServicio = computed(() => this.modo() === 'servicio');

  /* ===== Periodo de Gestión del servicio ===== */

  readonly tiposPeriodo: TipoPeriodoGestion[] = ['Regular', 'Extraordinario'];
  readonly mesesCatalogo = MESES_ES.map((nombre, i) => ({ numero: i + 1, nombre }));
  readonly formatearPeriodo = formatearPeriodo;
  readonly estadoPeriodo = estadoPeriodo;

  /** Periodo(s) del servicio en edición (máximo uno por servicio). */
  readonly periodos = signal<PeriodoGestion[]>([]);
  /** Meses marcados mientras se configura un periodo Regular. */
  readonly mesesSeleccionados = signal<number[]>([]);

  /** Filas de la tabla de periodos (con su índice para eliminar). */
  readonly filasPeriodo = computed(() =>
    this.periodos().map((pg, indice) => ({ pg, indice })),
  );

  /** La sección se habilita al elegir el Régimen Laboral. */
  readonly mostrarSeccionPeriodo = computed(() => {
    this.formTick();
    return !!this.form.controls.regimen.value;
  });

  /**
   * Regímenes seleccionables: en un nuevo servicio sobre un contrato temporal
   * solo se permiten CAS Temporal y Locador (regla de negocio del modelo,
   * aplicada también al validar el guardado).
   */
  readonly regimenesDisponibles = computed<readonly string[]>(() => {
    const previo = this.usuarioBase?.regimen ?? '';
    return this.modo() === 'servicio'
      ? regimenesPermitidosParaNuevoServicio(previo, REGIMENES_LABORALES)
      : REGIMENES_LABORALES;
  });

  /**
   * Años seleccionables. En CAS Temporal / Locador los define la vigencia del
   * contrato (puede cruzar de un año a otro); en el resto de regímenes, el año
   * actual hacia atrás (nunca futuros).
   */
  readonly aniosGestion = computed(() => {
    this.formTick();
    const actual = anioGestionVigente();
    if (this.regimenTemporal()) {
      // Nunca por encima del año de gestión (las fechas ya vienen acotadas).
      const anios = aniosDeRango(
        this.form.controls.fechaIni.value,
        this.form.controls.fechaFin.value,
      ).filter((a) => a <= actual);
      if (anios.length) return anios;
    }
    return Array.from({ length: 6 }, (_, i) => actual - i);
  });

  /** Meses activables según régimen y año de gestión (regla única del modelo). */
  readonly mesesHabilitados = computed(() => {
    this.formTick();
    return this.calcularMesesActivables();
  });

  /** ¿Los meses se derivan automáticamente del contrato (CAS Temporal / OS)? */
  readonly mesesAutomaticos = computed(() => {
    this.formTick();
    return (
      this.regimenTemporal() &&
      !!this.form.controls.fechaIni.value &&
      !!this.form.controls.fechaFin.value
    );
  });

  /** Regla de negocio única, compartida por la UI y la validación del alta. */
  private calcularMesesActivables(anio = Number(this.form.controls.periodoAnio.value)): number[] {
    return mesesActivablesPeriodoRegular({
      anio,
      regimen: this.form.controls.regimen.value,
      fechaIni: this.form.controls.fechaIni.value,
      fechaFin: this.form.controls.fechaFin.value,
    });
  }

  esMesHabilitado(mes: number): boolean {
    return this.mesesHabilitados().includes(mes);
  }

  /** Motivo por el que un mes no puede activarse (tooltip del checkbox). */
  ayudaMes(mes: number): string {
    if (this.esMesHabilitado(mes)) return '';
    return this.mesesAutomaticos()
      ? 'Este mes está fuera de la vigencia del contrato'
      : 'Este mes ya no puede activarse para el año de gestión seleccionado';
  }

  toggleMes(mes: number, marcado: boolean): void {
    // Defensa en profundidad: un mes bloqueado nunca entra a la selección.
    if (marcado && !this.esMesHabilitado(mes)) return;
    this.mesesSeleccionados.update((prev) =>
      marcado ? [...prev, mes].sort((a, b) => a - b) : prev.filter((m) => m !== mes),
    );
  }

  /** Al cambiar el año se descartan los meses que dejan de ser activables. */
  onAnioGestionChange(): void {
    this.formTick.update((t) => t + 1);
    if (this.sincronizarMesesDesdeContrato()) return;
    const habilitados = this.calcularMesesActivables();
    this.mesesSeleccionados.update((prev) => prev.filter((m) => habilitados.includes(m)));
  }

  onTipoPeriodoChange(): void {
    this.mesesSeleccionados.set([]);
    this.form.patchValue({
      periodoAnio: String(this.aniosGestion()[0] ?? new Date().getFullYear()),
      periodoFechaIni: '',
      periodoFechaFin: '',
    });
    this.formTick.update((t) => t + 1);
    this.sincronizarMesesDesdeContrato();
  }

  /**
   * CAS Temporal / Locador: al cambiar la Fecha de inicio o la Fecha fin se
   * valida el tope del año de gestión y se recalculan los años disponibles y
   * los meses marcados, de modo que no queden inconsistencias entre las fechas
   * del contrato y el periodo.
   */
  onFechasContratoChange(): void {
    this.formTick.update((t) => t + 1);
    if (this.rechazarFechasFueraDeAnioGestion()) return;
    const anios = this.aniosGestion();
    if (anios.length && !anios.includes(Number(this.form.controls.periodoAnio.value))) {
      this.form.patchValue({ periodoAnio: String(anios[0]) });
      this.formTick.update((t) => t + 1);
    }
    this.sincronizarMesesDesdeContrato();
  }

  /* ===== Tope de vigencia: 31 de diciembre del año de gestión ===== */

  /** Año de gestión y su último día, derivados del sistema (nunca fijos). */
  readonly anioGestion = anioGestionVigente();
  readonly fechaMaxVigencia = fechaMaximaVigencia();
  readonly fechaMaxVigenciaTexto = fechaMaximaVigencia().split('-').reverse().join('/');
  /** Tope para los `mat-datepicker` (mismo valor, en Date local). */
  readonly fechaMaxVigenciaDate = isoADate(fechaMaximaVigencia());

  /* Fechas del formulario expuestas como Date para los calendarios; el
     formulario sigue guardando ISO `YYYY-MM-DD`, que es lo que consumen las
     reglas de negocio y el backend. */
  readonly fechaIniDate = computed(() => {
    this.formTick();
    return isoADate(this.form.controls.fechaIni.value);
  });
  readonly fechaFinDate = computed(() => {
    this.formTick();
    return isoADate(this.form.controls.fechaFin.value);
  });
  readonly periodoIniDate = computed(() => {
    this.formTick();
    return isoADate(this.form.controls.periodoFechaIni.value);
  });
  readonly periodoFinDate = computed(() => {
    this.formTick();
    return isoADate(this.form.controls.periodoFechaFin.value);
  });

  /** Vigencia del contrato: escribe en ISO y dispara las reglas del periodo. */
  setFechaContrato(campo: 'fechaIni' | 'fechaFin', fecha: Date | null): void {
    this.form.patchValue({ [campo]: dateAIso(fecha) });
    this.onFechasContratoChange();
  }

  /** Fechas del periodo Extraordinario (se validan al agregar el periodo). */
  setFechaPeriodo(campo: 'periodoFechaIni' | 'periodoFechaFin', fecha: Date | null): void {
    this.form.patchValue({ [campo]: dateAIso(fecha) });
  }

  /**
   * El `max` del calendario impide elegir fechas posteriores, pero no cubre el
   * tecleo manual ni el pegado: aquí se detecta ese caso, se avisa con el modal
   * estándar y se limpia el campo infractor para que no quede una vigencia
   * inválida en el formulario. Devuelve `true` si hubo rechazo.
   */
  private rechazarFechasFueraDeAnioGestion(): boolean {
    const { fechaIni, fechaFin } = this.form.getRawValue();
    const invalidos: string[] = [];
    if (excedeAnioGestion(fechaIni)) invalidos.push('Fecha de inicio');
    if (excedeAnioGestion(fechaFin)) invalidos.push('Fecha fin');
    if (!invalidos.length) return false;

    if (excedeAnioGestion(fechaIni)) this.form.patchValue({ fechaIni: '' });
    if (excedeAnioGestion(fechaFin)) this.form.patchValue({ fechaFin: '' });
    this.mesesSeleccionados.set([]);
    this.formTick.update((t) => t + 1);
    void this.modales.openError(
      'Vigencia fuera del año de gestión',
      `${invalidos.join(' y ')} no puede superar el ${this.fechaMaxVigenciaTexto}, ` +
        `último día del año de gestión ${this.anioGestion}.`,
    );
    return true;
  }

  /**
   * Marca automáticamente todos los meses comprendidos en la vigencia del
   * contrato para el año de gestión activo. Devuelve `true` si la selección la
   * gobierna el contrato (y por tanto no debe tocarse manualmente después).
   */
  private sincronizarMesesDesdeContrato(): boolean {
    if (this.form.controls.periodoTipo.value !== 'Regular') return false;
    if (!esRegimenTemporal(this.form.controls.regimen.value)) return false;
    this.mesesSeleccionados.set(this.calcularMesesActivables());
    return true;
  }

  /** Alta del periodo del servicio (uno solo por servicio). */
  agregarPeriodo(): void {
    if (this.periodos().length > 0) {
      void this.modales.openWarning(
        'Periodo ya registrado',
        'Este servicio ya cuenta con un periodo registrado. Elimine el periodo actual si desea reemplazarlo.',
        { soloAceptar: true },
      );
      return;
    }
    const v = this.form.getRawValue();
    const tipo = v.periodoTipo as TipoPeriodoGestion;
    if (tipo === 'Regular') {
      const anio = Number(v.periodoAnio);
      const derivadoDelContrato = esRegimenTemporal(v.regimen);
      // Ninguna vigencia puede superar el año de gestión, tampoco en contratos
      // temporales: sus fechas ya quedan acotadas al 31/12 del año en curso.
      if (anio > this.anioGestion) {
        void this.modales.openError(
          'Año de gestión no permitido',
          `El Año de Gestión no puede ser mayor a ${this.anioGestion}, el año en curso del sistema.`,
        );
        return;
      }
      if (derivadoDelContrato && (!v.fechaIni || !v.fechaFin)) {
        void this.modales.openError(
          'Vigencia del contrato requerida',
          'Registre la Fecha de inicio y la Fecha fin del contrato antes de agregar el periodo Regular.',
        );
        return;
      }
      if (this.mesesSeleccionados().length === 0) {
        void this.modales.openError('Meses requeridos', 'Seleccione al menos un mes para el periodo Regular.');
        return;
      }
      // Validación de negocio (no solo visual): ningún mes bloqueado puede registrarse.
      const habilitados = this.calcularMesesActivables(anio);
      const bloqueados = this.mesesSeleccionados().filter((m) => !habilitados.includes(m));
      if (bloqueados.length) {
        void this.modales.openWarning(
          'Meses no disponibles',
          derivadoDelContrato
            ? `Los siguientes meses quedan fuera de la vigencia del contrato: ` +
                `${nombresDeMeses(bloqueados)}. Ajuste la Fecha de inicio o la Fecha fin.`
            : `Los siguientes meses ya no pueden ser activados para el año de gestión ${anio}: ` +
                `${nombresDeMeses(bloqueados)}. Seleccione únicamente meses disponibles.`,
          { soloAceptar: true },
        );
        return;
      }
      this.periodos.set([
        { tipo, anio, meses: [...this.mesesSeleccionados()] },
      ]);
    } else {
      if (!v.periodoFechaIni || !v.periodoFechaFin) {
        void this.modales.openError(
          'Fechas requeridas',
          'La Fecha Inicio y la Fecha Fin del periodo Extraordinario son obligatorias.',
        );
        return;
      }
      if (v.periodoFechaFin < v.periodoFechaIni) {
        void this.modales.openError(
          'Rango de fechas inválido',
          'La Fecha Fin no puede ser menor a la Fecha Inicio del periodo.',
        );
        return;
      }
      // El periodo Extraordinario también es una vigencia: mismo tope anual.
      if (excedeAnioGestion(v.periodoFechaIni) || excedeAnioGestion(v.periodoFechaFin)) {
        void this.modales.openError(
          'Vigencia fuera del año de gestión',
          `El periodo Extraordinario no puede superar el ${this.fechaMaxVigenciaTexto}, ` +
            `último día del año de gestión ${this.anioGestion}.`,
        );
        return;
      }
      this.periodos.set([
        {
          tipo,
          anio: Number(v.periodoFechaIni.slice(0, 4)),
          fechaInicio: v.periodoFechaIni,
          fechaFin: v.periodoFechaFin,
        },
      ]);
    }
    this.mesesSeleccionados.set([]);
    this.form.patchValue({
      periodoTipo: '',
      periodoAnio: String(this.aniosGestion()[0] ?? new Date().getFullYear()),
      periodoFechaIni: '',
      periodoFechaFin: '',
    });
    this.reiniciarCamposPeriodo();
  }

  /**
   * Los campos con los que se arma el periodo son de trabajo: al vaciarlos no
   * deben quedar marcados en rojo (su obligatoriedad se valida con mensaje al
   * pulsar "Agregar Periodo").
   */
  private reiniciarCamposPeriodo(): void {
    for (const nombre of ['periodoTipo', 'periodoFechaIni', 'periodoFechaFin'] as const) {
      const control = this.form.controls[nombre];
      control.markAsUntouched();
      control.markAsPristine();
    }
  }

  eliminarPeriodo(i: number): void {
    this.periodos.update((prev) => prev.filter((_, idx) => idx !== i));
  }

  onRegimenChange(): void {
    this.form.patchValue({ periodoTipo: '', periodoFechaIni: '', periodoFechaFin: '' });
    this.mesesSeleccionados.set([]);
    this.formTick.update((t) => t + 1);
    this.form.patchValue({
      periodoAnio: String(this.aniosGestion()[0] ?? new Date().getFullYear()),
    });
    this.formTick.update((t) => t + 1);
    this.reiniciarCamposPeriodo();
  }

  readonly esLocador = computed(() => {
    this.formTick();
    return this.form.controls.regimen.value === 'Locador de Servicio (OS)';
  });

  readonly mostrarAmbito = computed(() => {
    this.formTick();
    return perfilRequiereAmbito(this.form.controls.perfil.value);
  });

  readonly soloRegion = computed(() => {
    this.formTick();
    return perfilSoloRegion(this.form.controls.perfil.value);
  });

  /** El Técnico asigna varios distritos por vez (multi-selección). */
  readonly esTecnicoSeleccionado = computed(() => {
    this.formTick();
    return this.form.controls.perfil.value === 'Técnico Capacitación y Asistencia Técnica';
  });

  /** Admin UE y Admin DZ pueden registrar el ámbito solo con la región ("-"). */
  readonly provinciaDistritoOpcional = computed(() => {
    this.formTick();
    return ['Administrador Unidad Ejecutora(UE)', 'Administrador DZ_Cap_Asit.'].includes(
      this.form.controls.perfil.value,
    );
  });

  /** "Seleccionar todos" opera sobre los distritos visibles (filtrados). */
  readonly todosDistritosSeleccionados = computed(() => {
    const visibles = this.distritosFiltrados();
    return visibles.length > 0 && visibles.every((d) => this.distritosSeleccionados().includes(d));
  });

  /* ===== Presupuesto obligatorio para el Admin General (nuevo registro) ===== */

  /** Admin General registrando un perfil heredero nuevo: presupuesto obligatorio. */
  readonly requierePresupuestoAdminGeneral = computed(() => {
    this.formTick();
    const s = this.auth.session();
    return (
      s?.perfil === 'Administrador General' &&
      this.modo() === 'nuevo' &&
      UsuarioFormComponent.PERFILES_HEREDEROS_PRESUPUESTO.includes(this.form.controls.perfil.value)
    );
  });

  /** ¿Los datos presupuestales obligatorios están completos? */
  private presupuestoCompleto(): boolean {
    const v = this.form.getRawValue();
    const categoriaOk = this.modoJefeArea() || !!v.categoriaPresup;
    return !!(v.unidad && v.fuenteFinanc && categoriaOk && v.programaPresup && v.unidadFuncional);
  }

  /* ===== Diálogo de Datos Presupuestales ===== */

  /** Los datos presupuestales se aceptaron en el diálogo (habilita el guardado). */
  readonly presupuestoRegistrado = signal(false);
  /** Valores al abrir el diálogo; Cancelar los restaura sin guardar nada. */
  private snapshotPresupuesto: Record<string, string> | null = null;

  /**
   * Abre el diálogo conservando lo ya registrado (permite revisarlo y editarlo).
   * Trabaja sobre el mismo formulario, de modo que las cascadas de catálogos
   * siguen viviendo en un solo sitio.
   */
  abrirDialogoPresupuesto(): void {
    const v = this.form.getRawValue();
    this.snapshotPresupuesto = {
      unidad: v.unidad,
      fuenteFinanc: v.fuenteFinanc,
      categoriaPresup: v.categoriaPresup,
      programaPresup: v.programaPresup,
      unidadFuncional: v.unidadFuncional,
    };

    const datos: DatosPresupuestalesData = {
      form: this.form,
      modoJefeArea: this.modoJefeArea,
      unidadesResponsables: this.unidadesResponsables,
      fuentes: this.fuentes,
      categorias: this.categorias,
      programas: this.programas,
      unidadesFuncionales: this.unidadesFuncionales,
      programaHabilitado: this.programaHabilitado,
      onCategoriaChange: () => this.onCategoriaChange(),
      onProgramaChange: () => this.onProgramaChange(),
    };

    const ref = this.dialog.open<DatosPresupuestalesDialogComponent, DatosPresupuestalesData, boolean>(
      DatosPresupuestalesDialogComponent,
      {
        data: datos,
        width: '560px',
        maxWidth: '95vw',
        autoFocus: 'first-tabbable',
        restoreFocus: true,
      },
    );

    ref.afterClosed().subscribe((aceptado) => {
      if (aceptado) {
        this.snapshotPresupuesto = null;
        this.presupuestoRegistrado.set(true);
        this.formTick.update((t) => t + 1);
        this.toast.success(
          'Datos presupuestales registrados',
          'Ya puede continuar con el registro del usuario.',
        );
        return;
      }
      // Cancelar y ESC descartan los cambios del diálogo.
      if (this.snapshotPresupuesto) this.form.patchValue(this.snapshotPresupuesto);
      this.snapshotPresupuesto = null;
      this.formTick.update((t) => t + 1);
    });
  }

  /**
   * Datos obligatorios de ambas pestañas, con las mismas reglas de presencia que
   * ya aplican `guardarYContinuar` y `guardarRegistroCompleto` (aquí solo se
   * evalúan para habilitar el botón; los mensajes siguen viviendo allí).
   */
  private datosObligatoriosCompletos(): boolean {
    const v = this.form.getRawValue();
    const identidad = !!(v.dni.trim() && v.apePat && v.nombres && v.profesion && v.sexo);
    const cuenta = !!(v.correo.trim() && v.regimen && v.perfil && v.unidad);
    const temporal = !this.regimenTemporal() || !!(v.fechaIni && v.fechaFin);
    const orden = !this.esLocador() || !!v.nroOrden.trim();
    const periodo = this.periodos().length > 0;
    const ambito = !perfilRequiereAmbito(v.perfil) || this.ambitos().length > 0;
    const metas = !this.aplicaMetas() || this.metasAmbito.valid;
    return identidad && cuenta && temporal && orden && periodo && ambito && metas;
  }

  /**
   * En el flujo del Admin General el guardado exige, además del presupuesto
   * registrado en el diálogo, que el resto del formulario esté completo. Para
   * los demás perfiles se conserva el comportamiento actual.
   */
  readonly guardarBloqueado = computed(() => {
    this.formTick();
    if (!this.requierePresupuestoAdminGeneral()) return false;
    return (
      !this.presupuestoRegistrado() ||
      !this.presupuestoCompleto() ||
      !this.datosObligatoriosCompletos()
    );
  });

  /** Motivo del bloqueo, como ayuda contextual del botón deshabilitado. */
  motivoGuardarBloqueado(): string {
    if (!this.presupuestoRegistrado() || !this.presupuestoCompleto()) {
      return 'Registre los Datos Presupuestales antes de guardar.';
    }
    return 'Complete todos los datos obligatorios del formulario antes de guardar.';
  }

  /** Metas por ámbito: solo cuando un Admin DZ_Cap_Asit. registra un Técnico. */
  readonly aplicaMetas = computed(() => {
    this.formTick();
    return aplicaMetasPorAmbito(this.auth.session()?.perfil ?? '', this.form.controls.perfil.value);
  });

  /** La sección de metas aparece únicamente con al menos un ámbito agregado. */
  readonly mostrarMetas = computed(() => this.aplicaMetas() && this.ambitos().length > 0);

  readonly provinciasDisponibles = computed(() => {
    const r = this.ambitoRegion();
    return r ? Object.keys(UBIGEO_SODEGA[r] ?? {}) : [];
  });

  readonly distritosDisponibles = computed(() => {
    const r = this.ambitoRegion();
    const p = this.ambitoProvincia();
    return r && p ? UBIGEO_SODEGA[r]?.[p] ?? [] : [];
  });

  /** Distritos visibles en el selector múltiple según el buscador en vivo. */
  readonly distritosFiltrados = computed(() => {
    const filtro = normalizarBusqueda(this.distritoFiltro());
    const disponibles = this.distritosDisponibles();
    return filtro ? disponibles.filter((d) => normalizarBusqueda(d).includes(filtro)) : disponibles;
  });

  /** Filas de la tabla de ámbitos (con su índice para eliminar). */
  readonly filasAmbito = computed(() =>
    this.ambitos().map((amb, indice) => ({ ...amb, indice })),
  );

  /**
   * Filas de la tabla de metas: ámbito + su FormGroup, alineados por índice.
   * Depende solo de `ambitos()` para que teclear una cantidad no reconstruya
   * las filas (perdería el foco del campo).
   */
  readonly filasMetas = computed(() =>
    this.ambitos().map((amb, indice) => ({ amb, indice, grupo: this.metasAmbito.at(indice) })),
  );

  /* ===== Acciones ===== */

  onCategoriaChange(): void {
    this.form.patchValue({ programaPresup: '', unidadFuncional: '' });
  }

  onProgramaChange(): void {
    this.form.patchValue({ unidadFuncional: '' });
  }

  onPerfilChange(): void {
    if (!this.mostrarAmbito()) {
      this.ambitos.set([]);
      this.metasAmbito.clear();
    }
    this.limpiarDistritosSeleccionados();
    this.sincronizarPermisosMenu();
  }

  /**
   * Carga los permisos a editar: los guardados del usuario si el perfil
   * coincide, o los defaults del esquema del perfil seleccionado.
   */
  private sincronizarPermisosMenu(): void {
    const perfil = this.form.controls.perfil.value;
    const guardados =
      this.usuarioBase && this.usuarioBase.perfil === perfil ? this.usuarioBase.permisosMenu : undefined;
    const esquema = this.permisosService.esquemaPara(perfil);
    this.permisosMenuEdit.set(esquema ? combinarPermisos(esquema, guardados) : {});
  }

  /** Consulta simulada al Web Service de RENIEC (GET /reniec/{dni}). */
  consultarReniec(): void {
    const dni = this.form.controls.dni.value.trim();
    if (dni.length !== 8 || isNaN(Number(dni))) {
      this.mostrarAlerta({ titulo: 'Error RENIEC', mensaje: 'Debe ingresar un número de DNI válido de 8 dígitos.' });
      return;
    }
    this.buscandoReniec.set(true);
    this.usuariosService.consultarReniec(dni).subscribe((datos) => {
      this.buscandoReniec.set(false);
      this.form.patchValue({
        apePat: datos.apePat,
        apeMat: datos.apeMat,
        nombres: datos.nombres,
        estCivil: datos.estCivil,
        direccion: datos.direccion,
        ubigeo: datos.ubigeo,
        restricciones: datos.restricciones,
        fechaNac: datos.fechaNac,
        sexo: datos.sexo,
        edad: datos.edad,
        userGen: datos.userGenerado,
        correo: datos.correoSugerido,
      });
      if (!this.form.controls.celular.value) {
        this.form.controls.celular.setValue(datos.celularSugerido);
      }
      this.mostrarAlerta({
        titulo: 'Datos Recuperados',
        mensaje: `Se obtuvo correctamente la información desde el Web Service de RENIEC para el DNI N° ${dni}.`,
      });
    });
  }

  /* ===== Multi-selección de distritos (Técnico) ===== */

  toggleDistrito(distrito: string, seleccionado: boolean): void {
    this.distritosSeleccionados.update((prev) =>
      seleccionado ? [...prev, distrito] : prev.filter((d) => d !== distrito),
    );
  }

  /** Marca/desmarca los distritos visibles sin perder selecciones ocultas por el filtro. */
  toggleTodosDistritos(seleccionar: boolean): void {
    const visibles = this.distritosFiltrados();
    this.distritosSeleccionados.update((prev) =>
      seleccionar ? [...new Set([...prev, ...visibles])] : prev.filter((d) => !visibles.includes(d)),
    );
  }

  limpiarDistritosSeleccionados(): void {
    this.distritosSeleccionados.set([]);
    this.distritoFiltro.set('');
  }

  /* ===== Buscadores de ámbito territorial (Región / Provincia) ===== */

  onRegionSeleccionada(region: string): void {
    this.ambitoRegion.set(region);
    this.ambitoProvincia.set('');
    this.ambitoDistrito.set('');
    this.limpiarDistritosSeleccionados();
  }

  onProvinciaSeleccionada(provincia: string): void {
    this.ambitoProvincia.set(provincia);
    this.ambitoDistrito.set('');
    this.limpiarDistritosSeleccionados();
  }

  agregarAmbito(): void {
    const region = this.ambitoRegion();
    const soloRegion = this.soloRegion();
    const opcional = this.provinciaDistritoOpcional();
    const provincia = soloRegion || (opcional && !this.ambitoProvincia()) ? '-' : this.ambitoProvincia();
    const distrito = soloRegion || (opcional && !this.ambitoDistrito()) ? '-' : this.ambitoDistrito();

    if (!region) {
      this.mostrarAlerta({ titulo: 'Ámbito Incompleto', mensaje: 'Debe seleccionar una Región para poder agregar.' });
      return;
    }

    // Técnico: alta múltiple de distritos con aviso de duplicados.
    if (this.esTecnicoSeleccionado()) {
      const provinciaSeleccionada = this.ambitoProvincia();
      const seleccionados = this.distritosSeleccionados();
      if (!provinciaSeleccionada || seleccionados.length === 0) {
        this.mostrarAlerta({
          titulo: 'Ámbito Incompleto',
          mensaje: 'Debe seleccionar Provincia y al menos un Distrito para poder agregar.',
        });
        return;
      }
      const duplicados: string[] = [];
      const nuevos: AmbitoTerritorial[] = [];
      for (const dist of seleccionados) {
        const existe = this.ambitos().some(
          (a) => a.region === region && a.provincia === provinciaSeleccionada && a.distrito === dist,
        );
        if (existe) duplicados.push(dist);
        else nuevos.push({ region, provincia: provinciaSeleccionada, distrito: dist });
      }
      if (nuevos.length) {
        this.ambitos.update((prev) => [...prev, ...nuevos]);
        nuevos.forEach(() => this.metasAmbito.push(this.crearFilaMeta()));
        this.limpiarDistritosSeleccionados();
      }
      if (duplicados.length) {
        this.mostrarAlerta({
          titulo: 'Distritos Duplicados',
          mensaje: `No se agregaron los distritos ya existentes: ${duplicados.join(', ')}.`,
        });
      }
      return;
    }

    if (!soloRegion && !opcional && (!provincia || !distrito)) {
      this.mostrarAlerta({ titulo: 'Ámbito Incompleto', mensaje: 'Debe seleccionar Región, Provincia y Distrito para poder agregar.' });
      return;
    }
    const existe = this.ambitos().some(
      (a) => a.region === region && a.provincia === provincia && a.distrito === distrito,
    );
    if (existe) {
      this.mostrarAlerta({ titulo: 'Ámbito Duplicado', mensaje: 'Este ámbito territorial ya se encuentra asignado en el listado.' });
      return;
    }
    this.ambitos.update((prev) => [...prev, { region, provincia, distrito }]);
    this.metasAmbito.push(this.crearFilaMeta());
    this.ambitoDistrito.set('');
  }

  eliminarAmbito(i: number): void {
    this.ambitos.update((prev) => prev.filter((_, idx) => idx !== i));
    this.metasAmbito.removeAt(i);
  }

  /* ===== Metas asignadas por ámbito territorial ===== */

  private crearFilaMeta(capacitaciones = 0, asistencias = 0): MetaAmbitoForm {
    const validadores = [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)];
    return this.fb.nonNullable.group({
      cantidadCapacitaciones: [capacitaciones, validadores],
      cantidadAsistenciaTecnica: [asistencias, validadores],
    });
  }

  /** Reconstruye el FormArray de metas alineado a los ámbitos (edición). */
  private reconstruirMetasAmbito(ambitos: AmbitoTerritorial[], metas?: MetaAmbitoTerritorial[]): void {
    this.metasAmbito.clear();
    for (const amb of ambitos) {
      const meta = metas?.find(
        (m) => m.region === amb.region && m.provincia === amb.provincia && m.distrito === amb.distrito,
      );
      this.metasAmbito.push(
        this.crearFilaMeta(meta?.cantidadCapacitaciones ?? 0, meta?.cantidadAsistenciaTecnica ?? 0),
      );
    }
  }

  /** Bloquea signos, exponentes y decimales en los inputs de metas. */
  bloquearNoEnteros(ev: KeyboardEvent): void {
    if (['e', 'E', '+', '-', '.', ','].includes(ev.key)) ev.preventDefault();
  }

  /** Normaliza la meta al salir del campo: entero ≥ 0 (vacío/ inválido → 0). */
  normalizarMeta(i: number, campo: 'cantidadCapacitaciones' | 'cantidadAsistenciaTecnica'): void {
    const ctrl = this.metasAmbito.at(i)?.controls[campo];
    if (!ctrl) return;
    const v = Number(ctrl.value);
    ctrl.setValue(Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);
  }

  /** Payload de metas por ámbito para el backend (una fila por ámbito asignado). */
  private construirMetasAmbito(): MetaAmbitoTerritorial[] {
    return this.ambitos().map((amb, i) => {
      const fila = this.metasAmbito.at(i)?.getRawValue();
      return {
        ...amb,
        cantidadCapacitaciones: fila?.cantidadCapacitaciones ?? 0,
        cantidadAsistenciaTecnica: fila?.cantidadAsistenciaTecnica ?? 0,
      };
    });
  }

  /* ===== Navegación entre pestañas ===== */

  /** Identidad mínima exigida para configurar los permisos. */
  private identidadMinima(): boolean {
    const v = this.form.getRawValue();
    return !!(v.dni.trim() && v.apePat);
  }

  /**
   * La pestaña Permisos exige haber validado la identidad en RENIEC: si no,
   * se avisa y el grupo vuelve a Datos del usuario.
   */
  onCambioTab(indice: number): void {
    if (indice === 1 && !this.identidadMinima()) {
      this.mostrarAlerta({
        titulo: 'Acceso Restringido',
        mensaje: 'Debe ingresar el DNI y validar los datos de RENIEC antes de configurar los permisos.',
      });
      setTimeout(() => (this.grupoTabs().selectedIndex = 0));
      return;
    }
    this.tab.set(indice === 1 ? 'permisos' : 'datos');
  }

  irAPestana(tab: 'datos' | 'permisos'): void {
    if (tab === 'permisos' && !this.identidadMinima()) {
      this.mostrarAlerta({
        titulo: 'Acceso Restringido',
        mensaje: 'Debe ingresar el DNI y validar los datos de RENIEC antes de configurar los permisos.',
      });
      return;
    }
    this.grupoTabs().selectedIndex = tab === 'permisos' ? 1 : 0;
  }

  /** Validación de la pestaña Datos (equivale a guardarYContinuar del prototipo). */
  guardarYContinuar(): void {
    const v = this.form.getRawValue();
    if (!v.dni.trim()) {
      this.mostrarAlerta({ titulo: 'DNI Requerido', mensaje: 'Por favor, ingrese el número de DNI.' });
      return;
    }
    if (!v.apePat || !v.nombres) {
      this.mostrarAlerta({
        titulo: 'Verificación RENIEC Pendiente',
        mensaje: 'Debe completar la consulta a RENIEC mediante el botón Buscar antes de avanzar.',
      });
      return;
    }
    if (!v.profesion) {
      this.mostrarAlerta({ titulo: 'Profesión Requerida', mensaje: 'Debe seleccionar una Profesión o Especialidad.' });
      return;
    }
    if (!v.sexo) {
      this.mostrarAlerta({ titulo: 'Sexo Requerido', mensaje: 'Debe seleccionar el Sexo del colaborador.' });
      return;
    }
    if (!v.unidad) {
      this.mostrarAlerta({ titulo: 'Unidad Responsable Vacía', mensaje: 'Debe definir la Unidad Responsable del MIDAGRI.' });
      return;
    }
    if (!this.validarPresupuesto(v)) return;
    this.grupoTabs().selectedIndex = 1;
  }

  /** Perfiles cuyo Programa/Categoría y Unidad Funcional son opcionales al validar. */
  private programaOpasOpcional(perfil: string): boolean {
    return ['Jefe de Área', ...UsuarioFormComponent.PERFILES_HEREDEROS_PRESUPUESTO].includes(perfil);
  }

  private validarPresupuesto(v: ReturnType<typeof this.form.getRawValue>): boolean {
    const s = this.auth.session();
    const esAdminGeneral = v.perfil === 'Administrador General';
    const omitir = (s?.perfil === 'Administrador General' && v.perfil === 'Jefe de Área') || v.perfil === 'Jefe de Área';
    if (!this.mostrarPresupuesto() || esAdminGeneral || omitir) return true;
    const modoJefe = this.modoJefeArea();
    if (!v.fuenteFinanc) {
      this.mostrarAlerta({ titulo: 'Fuente de Financiamiento Requerida', mensaje: 'Debe seleccionar una Fuente de Financiamiento válida.' });
      return false;
    }
    if (!modoJefe && !v.categoriaPresup) {
      this.mostrarAlerta({ titulo: 'Categoría Presupuestal Requerida', mensaje: 'Debe seleccionar una Categoría Presupuestal.' });
      return false;
    }
    if (
      (modoJefe || v.categoriaPresup === 'Programa Presupuestal') &&
      !v.programaPresup &&
      !this.programaOpasOpcional(v.perfil)
    ) {
      this.mostrarAlerta(
        modoJefe
          ? { titulo: 'Categoría Requerida', mensaje: 'Debe seleccionar una Categoría.' }
          : { titulo: 'Programa Presupuestal Requerido', mensaje: 'Debe seleccionar un Programa Presupuestal estratégico.' },
      );
      return false;
    }
    if (!v.unidadFuncional && !this.programaOpasOpcional(v.perfil)) {
      this.mostrarAlerta({ titulo: 'Unidad Funcional Requerida', mensaje: 'Debe seleccionar una Unidad Funcional.' });
      return false;
    }
    return true;
  }

  /** Guardado final (equivale a guardarRegistroCompleto del prototipo). */
  guardarRegistroCompleto(): void {
    const v = this.form.getRawValue();
    const s = this.auth.session();
    if (!s) return;

    if (this.guardarBloqueado()) {
      this.mostrarAlerta({
        titulo: 'Datos Presupuestales requeridos',
        mensaje: 'Debe completar los Datos Presupuestales obligatorios antes de guardar el registro.',
      });
      return;
    }

    if (!v.correo.trim() || !v.regimen || !v.perfil || !v.unidad) {
      this.mostrarAlerta({
        titulo: 'Campos Incompletos',
        mensaje: 'Por favor complete todos los campos obligatorios (*) de Cuenta de Acceso, Unidad Responsable y Perfil Funcional.',
      });
      return;
    }

    if (this.modo() === 'presupuesto' && this.usuariosService.existeUnidadParaDni(v.dni, v.unidad)) {
      this.mostrarAlerta({
        titulo: 'Unidad Presupuestal Duplicada',
        mensaje: 'El colaborador ya tiene asignada esta Unidad Responsable. Seleccione una unidad diferente para esta nueva partida.',
      });
      return;
    }

    if (this.modo() === 'nuevo' && this.usuariosService.existeDni(v.dni)) {
      this.mostrarAlerta({
        titulo: 'Usuario Existente',
        mensaje: 'El número de DNI ingresado ya se encuentra registrado en el sistema SODEGA.',
      });
      return;
    }

    if (this.regimenTemporal()) {
      if (!v.fechaIni || !v.fechaFin) {
        this.mostrarAlerta({
          titulo: 'Campos Incompletos',
          mensaje: 'Para locadores de servicio (OS) o regímenes CAS Temporales es obligatorio registrar las fechas de inicio y fin de contrato.',
        });
        return;
      }
      // Tope del año de gestión: ninguna vigencia puede pasar del 31/12 en curso.
      if (excedeAnioGestion(v.fechaIni) || excedeAnioGestion(v.fechaFin)) {
        this.mostrarAlerta({
          titulo: 'Vigencia fuera del año de gestión',
          mensaje:
            `La vigencia del contrato no puede superar el ${this.fechaMaxVigenciaTexto}, ` +
            `último día del año de gestión ${this.anioGestion}.`,
        });
        return;
      }
      const diasContrato = calcularDiasCalendarioEntre(v.fechaIni, v.fechaFin);
      if (diasContrato === null || diasContrato <= 30) {
        this.mostrarAlerta({
          titulo: 'Vigencia no permitida',
          mensaje: 'La fecha de inicio y la fecha de fin deben tener una vigencia mayor a 30 días calendario.',
        });
        return;
      }
      if (this.esLocador() && !v.nroOrden.trim()) {
        this.mostrarAlerta({
          titulo: 'Orden de Servicio Requerida',
          mensaje: 'Para locadores de servicio (OS) es obligatorio registrar el Nro. de Orden (O.S.).',
        });
        return;
      }
    }

    // Nueva partida/servicio: fechas y Nro. de Orden distintos a los ya registrados
    // (solo aplica a regímenes temporales, que son los que registran fechas).
    if (this.modo() === 'presupuesto' || this.modo() === 'servicio') {
      if (this.regimenTemporal() && this.usuariosService.existeFechaContratoParaDni(v.dni, v.fechaIni, v.fechaFin)) {
        this.mostrarAlerta({
          titulo: 'Fechas ya registradas',
          mensaje: 'La fecha de inicio y la fecha fin deben ser diferentes a las fechas ya registradas para este usuario.',
        });
        return;
      }
      if (this.esLocador() && this.usuariosService.existeOrdenParaDni(v.dni, v.nroOrden)) {
        this.mostrarAlerta({
          titulo: 'Orden ya registrada',
          mensaje: 'El Nro. de Orden (O.S.) debe ser diferente al que ya fue registrado para este usuario.',
        });
        return;
      }
    }

    // Regla de negocio (no solo visual): régimen permitido para el servicio.
    if (!this.regimenesDisponibles().includes(v.regimen)) {
      this.mostrarAlerta({
        titulo: 'Régimen no permitido',
        mensaje:
          'Para un nuevo servicio sobre un contrato temporal solo puede registrarse ' +
          'Régimen CAS Temporal o Locador de Servicio (OS).',
      });
      return;
    }

    if (this.periodos().length === 0) {
      this.mostrarAlerta({
        titulo: 'Periodo de Gestión Requerido',
        mensaje: 'Debe registrar el periodo del servicio con el botón "Agregar Periodo" antes de guardar.',
      });
      return;
    }

    if (perfilRequiereAmbito(v.perfil) && this.ambitos().length === 0) {
      this.mostrarAlerta({
        titulo: 'Jurisdicción Vacía',
        mensaje: 'Debe asignar al menos un ámbito territorial de Región, Provincia y Distrito.',
      });
      return;
    }

    if (this.aplicaMetas() && this.metasAmbito.invalid) {
      this.mostrarAlerta({
        titulo: 'Metas por Ámbito Inválidas',
        mensaje: 'Las cantidades de Capacitaciones y Asistencia Técnica deben ser números enteros mayores o iguales a 0.',
      });
      return;
    }

    if (!this.validarPresupuesto(v)) return;

    const esAdminGeneral = v.perfil === 'Administrador General';
    // Usuario unificado único (desambiguado con apellido materno / correlativo).
    const userGen =
      this.usuariosService.generarUsuarioUnico(v.nombres, v.apePat, v.apeMat, v.dni) || v.userGen;
    const datos: Omit<UsuarioSodega, 'id'> = {
      dni: v.dni,
      nombres: toTitleCase(v.nombres.trim()),
      apePat: toTitleCase(v.apePat.trim()),
      apeMat: toTitleCase(v.apeMat.trim()),
      estCivil: toTitleCase(v.estCivil.trim()),
      profesion: v.profesion,
      direccion: v.direccion,
      ubigeo: v.ubigeo,
      restricciones: v.restricciones,
      sexo: v.sexo,
      fechaNac: v.fechaNac,
      edad: v.edad.replace(/ años/i, '').replace(' AÑOS', ''),
      celular: v.celular,
      unidad: v.unidad,
      userGen,
      correo: v.correo,
      regimen: v.regimen as UsuarioSodega['regimen'],
      estado: v.estado as UsuarioSodega['estado'],
      fechaIni: this.regimenTemporal() ? v.fechaIni : '',
      fechaFin: this.regimenTemporal() ? v.fechaFin : '',
      nroOrden: this.esLocador() ? v.nroOrden.trim() : '',
      // Periodo propio del servicio (independiente de otros servicios).
      periodosGestion: [...this.periodos()],
      perfil: v.perfil as Perfil,
      opa: this.usuariosService.derivarOpa(v.unidad),
      fuenteFinanc: esAdminGeneral ? '' : v.fuenteFinanc,
      categoriaPresup: esAdminGeneral ? '' : this.modoJefeArea() ? 'Categoría' : v.categoriaPresup,
      programaPresup: esAdminGeneral ? '' : v.programaPresup,
      unidadFuncional: esAdminGeneral ? '' : v.unidadFuncional,
      creadoPor: s.userGen,
      ambitos: perfilRequiereAmbito(v.perfil) ? [...this.ambitos()] : [],
      // Metas por ámbito: solo aplica al flujo Admin DZ → Técnico; si la sección
      // no es visible se preservan las del registro original.
      metasAmbito: this.aplicaMetas() ? this.construirMetasAmbito() : this.usuarioBase?.metasAmbito,
      // Permisos de menú: editados por el Admin General; si la sección no es
      // visible se preservan los del registro original.
      permisosMenu: this.esquemaPermisos()
        ? this.permisosMenuEdit()
        : this.usuarioBase?.permisosMenu,
      inhabilitadoPorVencimiento: false,
    };

    const nombreCompleto = `${datos.nombres} ${datos.apePat}`;
    if (this.modo() === 'presupuesto') {
      this.usuariosService.create(datos);
      this.mostrarAlerta({
        titulo: 'Nuevo Presupuesto Asignado',
        mensaje: `Se ha asignado con éxito el nuevo presupuesto en '${v.unidad}' para el servidor ${nombreCompleto}.`,
        cerrarYSalir: true,
      });
    } else if (this.modo() === 'servicio') {
      this.usuariosService.create(datos);
      this.mostrarAlerta({
        titulo: 'Nuevo Servicio Registrado',
        mensaje:
          `Se registró un nuevo servicio para ${nombreCompleto} conservando el historial anterior. ` +
          `El registro previo se mantiene como parte de la trazabilidad del colaborador.`,
        cerrarYSalir: true,
      });
    } else if (this.modo() === 'editar' && this.usuarioBase) {
      this.usuariosService.update(this.usuarioBase.id, {
        ...datos,
        creadoPor: this.usuarioBase.creadoPor || s.userGen,
      });
      this.mostrarAlerta({
        titulo: 'Registro Actualizado',
        mensaje: `El colaborador ${nombreCompleto} ha sido actualizado correctamente.`,
        cerrarYSalir: true,
      });
    } else {
      this.usuariosService.create(datos);
      this.mostrarAlerta({
        titulo: 'Registro Guardado',
        mensaje: `El colaborador ${nombreCompleto} ha sido registrado de manera exitosa.`,
        cerrarYSalir: true,
      });
    }
  }

  /**
   * Puente al sistema unificado de modales: éxito para operaciones
   * completadas, error para validaciones y avisos bloqueantes. Si el aviso
   * cierra el flujo (cerrarYSalir) se navega al aceptar.
   */
  private mostrarAlerta(a: { titulo: string; mensaje: string; cerrarYSalir?: boolean }): void {
    const esExito = /(recuperad|guardad|actualizad|asignad|completad|exitos)/i.test(a.titulo);
    const promesa = esExito
      ? this.modales.openSuccess(a.titulo, a.mensaje)
      : this.modales.openError(a.titulo, a.mensaje);
    void promesa.then(() => {
      if (a.cerrarYSalir) this.cancelar();
    });
  }

  cancelar(): void {
    this.router.navigate(['/usuarios']);
  }
}
