import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  LucideAngularModule,
  IdCard, KeyRound, UserCheck, Wallet, ShieldHalf, Search, LoaderCircle,
  ArrowLeft, ArrowRight, Save, Trash2, SquarePlus, Target, CircleCheck, TriangleAlert,
} from 'lucide-angular';
import { isoToDDMMYYYY, todayISO } from '../../shared/utils/fecha.util';
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
  PeriodoGestion,
  TipoPeriodoGestion,
  UsuarioSodega,
  anioGestionVigente,
  aplicaMetasPorAmbito,
  calcularDiasCalendarioEntre,
  esRegimenTemporal,
  excedeAnioGestion,
  fechaMaximaVigencia,
  formatearPeriodo,
  perfilRequiereAmbito,
  perfilSoloRegion,
  estadoPeriodo,
  mesesDeRangoNumeros,
  regimenesPermitidosParaNuevoServicio,
  toTitleCase,
} from '../../core/models/usuario-sodega.model';
import { PermisosMenu, combinarPermisos } from '../../core/models/permisos-menu.model';
import { PermisosMenuFormComponent } from './permisos-menu-form.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { INPUT_BASE, INPUT_DISABLED, INPUT_REQUIRED } from '../../shared/utils/input-styles.const';
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

type ModoForm = 'nuevo' | 'editar' | 'presupuesto' | 'servicio';

/** Fila del FormArray de metas por ámbito territorial (cantidades enteras ≥ 0). */
type MetaAmbitoForm = FormGroup<{
  cantidadCapacitaciones: FormControl<number>;
  cantidadAsistenciaTecnica: FormControl<number>;
}>;

/* Estilos de input compartidos del design system N1 (obligatorios en ámbar). */
const INP_MANDATORY = INPUT_REQUIRED;
const INP_DISABLED = INPUT_DISABLED;
const INP_NORMAL = INPUT_BASE;

/**
 * Formulario multi-pestaña de Gestión de Usuarios (Datos del usuario / Permisos).
 * Modos: nuevo · editar · presupuesto (nueva partida presupuestal para un usuario existente).
 */
@Component({
  selector: 'app-usuario-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    PermisosMenuFormComponent,
    AutocompleteComponent,
    ModalComponent,
  ],
  // ESC cierra el modal presupuestal descartando los cambios (igual que Cancelar).
  host: { '(document:keydown.escape)': 'onEscape()' },
  template: `
    <section class="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-5 animate-page-in">
      <h1 class="text-h1 text-foreground">{{ titulo() }}</h1>

      <div class="inline-flex p-1 bg-card ring-1 ring-border rounded-lg">
        <button
          (click)="irAPestana('datos')"
          class="h-8 px-3 rounded-md text-xs font-bold transition-colors flex items-center gap-2"
          [class]="tab() === 'datos' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'"
        >
          <lucide-angular [img]="IdCardIcon" class="size-4" /> Datos del usuario
        </button>
        <button
          (click)="irAPestana('permisos')"
          class="h-8 px-3 rounded-md text-xs font-bold transition-colors flex items-center gap-2"
          [class]="tab() === 'permisos' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'"
        >
          <lucide-angular [img]="KeyRoundIcon" class="size-4" /> Permisos
        </button>
      </div>

      <!-- ================= PESTAÑA A: DATOS DEL USUARIO ================= -->
      @if (tab() === 'datos') {
        <div class="space-y-5" [formGroup]="form">
          <!-- Datos personales -->
          <div class="bg-card rounded-xl ring-1 ring-border shadow-sm p-5 space-y-4">
            <div class="flex items-center gap-2 border-b border-border pb-2 text-brand">
              <lucide-angular [img]="UserCheckIcon" class="size-4" />
              <h3 class="label-ds">Datos Personales</h3>
            </div>

            <div class="grid grid-cols-12 gap-3">
              <div class="col-span-4">
                <label class="block text-xs font-medium text-muted-foreground mb-1">Nro DNI <span class="text-destructive">*</span></label>
                <div class="flex gap-1.5">
                  <input
                    type="text" maxlength="8" placeholder="Ingrese DNI"
                    formControlName="dni"
                    class="w-2/3"
                    [class]="reniecEditable() ? inpMandatory : inpDisabled"
                  />
                  <button
                    type="button"
                    (click)="consultarReniec()"
                    [disabled]="!reniecEditable() || buscandoReniec()"
                    class="btn-primary w-1/3 px-2"
                  >
                    <span>{{ buscandoReniec() ? 'Buscando...' : 'Buscar' }}</span>
                    <lucide-angular [img]="buscandoReniec() ? LoaderIcon : SearchIcon" class="size-3 ml-1" [class.animate-spin]="buscandoReniec()" />
                  </button>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-12 gap-3">
              <div class="col-span-4">
                <label class="block text-xs font-medium text-muted-foreground mb-1">Apellido paterno</label>
                <input formControlName="apePat" readonly placeholder="Apellido paterno" [class]="inpDisabled" />
              </div>
              <div class="col-span-4">
                <label class="block text-xs font-medium text-muted-foreground mb-1">Apellido materno</label>
                <input formControlName="apeMat" readonly placeholder="Apellido materno" [class]="inpDisabled" />
              </div>
              <div class="col-span-4">
                <label class="block text-xs font-medium text-muted-foreground mb-1">Nombre(s)</label>
                <input formControlName="nombres" readonly placeholder="Nombre(s)" [class]="inpDisabled" />
              </div>
            </div>

            <div class="grid grid-cols-12 gap-3">
              <div class="col-span-3">
                <label class="block text-xs font-medium text-muted-foreground mb-1">Estado civil</label>
                <input formControlName="estCivil" readonly placeholder="Estado civil" [class]="inpDisabled" />
              </div>
              <div class="col-span-3">
                <label class="block text-xs font-medium text-muted-foreground mb-1">Profesión - especialidad <span class="text-destructive">*</span></label>
                <select formControlName="profesion" [class]="reniecEditable() ? inpMandatory : inpDisabled">
                  <option value="">--Seleccione--</option>
                  @for (p of profesiones(); track p) {
                    <option [value]="p">{{ p }}</option>
                  }
                </select>
              </div>
              <div class="col-span-3">
                <label class="block text-xs font-medium text-muted-foreground mb-1">Dirección domiciliaria</label>
                <input formControlName="direccion" readonly placeholder="Dirección domiciliaria" [class]="inpDisabled" />
              </div>
              <div class="col-span-3">
                <label class="block text-xs font-medium text-muted-foreground mb-1">Ubigeo RENIEC</label>
                <input formControlName="ubigeo" readonly placeholder="UBIGEO" [class]="inpDisabled" />
              </div>
            </div>

            <div class="grid grid-cols-12 gap-3">
              <div class="col-span-3">
                <label class="block text-xs font-medium text-muted-foreground mb-1">Restricciones</label>
                <input formControlName="restricciones" readonly placeholder="Restricciones" [class]="inpDisabled" />
              </div>
              <div class="col-span-3">
                <label class="block text-xs font-medium text-muted-foreground mb-1">Sexo <span class="text-destructive">*</span></label>
                <select formControlName="sexo" [class]="reniecEditable() ? inpMandatory : inpDisabled">
                  <option value="">--Seleccione--</option>
                  @for (s of sexos(); track s) {
                    <option [value]="s">{{ s }}</option>
                  }
                </select>
              </div>
              <div class="col-span-3">
                <label class="block text-xs font-medium text-muted-foreground mb-1">Fecha nac. (RENIEC)</label>
                <input formControlName="fechaNac" readonly placeholder="dd/mm/aaaa" [class]="inpDisabled" />
              </div>
              <div class="col-span-3">
                <label class="block text-xs font-medium text-muted-foreground mb-1">Edad calculada</label>
                <input formControlName="edad" readonly placeholder="Edad calculada" [class]="inpDisabled" />
              </div>
            </div>

            <div class="grid grid-cols-12">
              <div class="col-span-3">
                <label class="block text-xs font-medium text-muted-foreground mb-1">Celular de contacto</label>
                <input formControlName="celular" placeholder="999 999 999" [class]="inpNormal" />
              </div>
            </div>
          </div>

          <!-- Datos presupuestales -->
          <div class="bg-card rounded-xl ring-1 ring-border shadow-sm p-5 space-y-4">
            <div class="flex items-center gap-2 border-b border-border pb-2 text-brand">
              <lucide-angular [img]="WalletIcon" class="size-4" />
              <h3 class="label-ds">Datos Presupuestales</h3>
            </div>
            <div>
              <label class="block text-xs font-medium text-muted-foreground mb-1">Unidad Responsable <span class="text-destructive">*</span></label>
              <select formControlName="unidad" [class]="unidadBloqueada() ? inpDisabled : inpMandatory">
                <option value="">--Seleccione--</option>
                @for (u of unidadesResponsables(); track u) {
                  <option [value]="u">{{ u }}</option>
                }
              </select>
            </div>

            @if (mostrarPresupuesto()) {
              <div class="grid gap-3 border-t border-border pt-4" [class]="modoJefeArea() ? 'grid-cols-3' : 'grid-cols-4'">
                <div>
                  <label class="block text-xs font-medium text-muted-foreground mb-1">Fuente de financ. <span class="text-destructive">*</span></label>
                  <select formControlName="fuenteFinanc" [class]="presupuestoBloqueado() ? inpDisabled : inpMandatory">
                    <option value="">Seleccione</option>
                    @for (f of fuentes(); track f) {
                      <option [value]="f">{{ f }}</option>
                    }
                  </select>
                </div>
                @if (!modoJefeArea()) {
                  <div>
                    <label class="block text-xs font-medium text-muted-foreground mb-1">Categoría presup. <span class="text-destructive">*</span></label>
                    <select formControlName="categoriaPresup" (change)="onCategoriaChange()" [class]="presupuestoBloqueado() ? inpDisabled : inpMandatory">
                      <option value="">Seleccione</option>
                      @for (c of categorias(); track c) {
                        <option [value]="c">{{ c }}</option>
                      }
                    </select>
                  </div>
                }
                <div>
                  <label class="block text-xs font-medium text-muted-foreground mb-1">
                    {{ modoJefeArea() ? 'Categoría' : 'Programa presupuestal' }} <span class="text-destructive">*</span>
                  </label>
                  <select formControlName="programaPresup" (change)="onProgramaChange()" [class]="presupuestoBloqueado() || !programaHabilitado() ? inpDisabled : inpMandatory">
                    <option value="">Seleccione</option>
                    @for (p of programas(); track p) {
                      <option [value]="p">{{ p }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-muted-foreground mb-1">
                    {{ modoJefeArea() ? 'Unidad Funcional' : 'Unidad funcional (Opas)' }} <span class="text-destructive">*</span>
                  </label>
                  <select formControlName="unidadFuncional" [class]="presupuestoBloqueado() ? inpDisabled : inpMandatory">
                    <option value="">Seleccione</option>
                    @for (u of unidadesFuncionales(); track u) {
                      <option [value]="u">{{ u }}</option>
                    }
                  </select>
                </div>
              </div>
            }
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button (click)="cancelar()" class="btn-secondary">
              Cancelar
            </button>
            <button (click)="guardarYContinuar()" class="btn-primary px-5">
              <span>Siguiente</span> <lucide-angular [img]="ArrowRightIcon" class="size-3.5" />
            </button>
          </div>
        </div>
      }

      <!-- ================= PESTAÑA B: PERMISOS ================= -->
      @if (tab() === 'permisos') {
        <div class="space-y-5" [formGroup]="form">
          <div class="bg-card rounded-xl ring-1 ring-border shadow-sm p-5 space-y-4">
            <div class="flex items-center gap-2 border-b border-border pb-2 text-brand">
              <lucide-angular [img]="ShieldHalfIcon" class="size-4" />
              <h3 class="label-ds">Cuenta de acceso institucional</h3>
            </div>

            <div class="grid grid-cols-12 gap-3">
              <div class="col-span-3">
                <label class="block text-xs font-medium text-muted-foreground mb-1">Usuario generado</label>
                <input formControlName="userGen" readonly placeholder="Usuario Automático" [class]="inpDisabled" />
              </div>
              <div class="col-span-3">
                <label class="block text-xs font-medium text-muted-foreground mb-1">Correo Personal <span class="text-destructive">*</span></label>
                <input formControlName="correo" placeholder="correo@midagri.gob.pe" [class]="inpMandatory" />
              </div>
              <div class="col-span-3">
                <label class="block text-xs font-medium text-muted-foreground mb-1">Régimen laboral <span class="text-destructive">*</span></label>
                <select formControlName="regimen" (change)="onRegimenChange()" [class]="inpMandatory">
                  <option value="">--Seleccione--</option>
                  @for (r of regimenesDisponibles(); track r) {
                    <option [value]="r">{{ r }}</option>
                  }
                </select>
              </div>
              <div class="col-span-3">
                <label class="block text-xs font-medium text-muted-foreground mb-1">Estado de cuenta</label>
                <select formControlName="estado" [class]="inpNormal">
                  <option value="HABILITADO">Habilitado</option>
                  <option value="INHABILITADO">Inhabilitado</option>
                </select>
              </div>
            </div>

            <!-- Fechas de contrato / Nro de orden (OS y CAS Temporal) -->
            @if (regimenTemporal()) {
              <div class="grid grid-cols-12 gap-3 p-4 bg-brand-soft/50 rounded-xl ring-1 ring-brand/20">
                <div [class]="esLocador() ? 'col-span-4' : 'col-span-6'">
                  <label class="block text-xs font-medium text-brand mb-1">Fecha de inicio <span class="text-destructive">*</span></label>
                  <input
                    type="date"
                    formControlName="fechaIni"
                    [max]="fechaMaxVigencia"
                    (change)="onFechasContratoChange()"
                    [class]="inpMandatory"
                  />
                </div>
                <div [class]="esLocador() ? 'col-span-4' : 'col-span-6'">
                  <label class="block text-xs font-medium text-brand mb-1">Fecha fin <span class="text-destructive">*</span></label>
                  <input
                    type="date"
                    formControlName="fechaFin"
                    [max]="fechaMaxVigencia"
                    (change)="onFechasContratoChange()"
                    [class]="inpMandatory"
                  />
                </div>
                <p class="col-span-12 text-[11px] text-muted-foreground">
                  La vigencia no puede superar el {{ fechaMaxVigenciaTexto }} (año de gestión {{ anioGestion }}).
                </p>
                @if (esLocador()) {
                  <div class="col-span-4">
                    <label class="block text-xs font-medium text-brand mb-1">Nro. de Orden (O.S.) <span class="text-destructive">*</span></label>
                    <input formControlName="nroOrden" placeholder="Ejem: O.S. N° 00421-2026" [class]="inpMandatory + ' uppercase'" />
                  </div>
                }
              </div>
            }

            <!-- Tipo de Periodo (se habilita al elegir el Régimen Laboral) -->
            @if (mostrarSeccionPeriodo()) {
              <div class="p-4 bg-brand-soft/50 rounded-xl ring-1 ring-brand/20 space-y-3">
                <p class="label-ds text-brand">Tipo de Periodo</p>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label for="periodo-tipo" class="block text-xs font-medium text-brand mb-1">
                      Tipo de periodo <span class="text-destructive">*</span>
                    </label>
                    <select id="periodo-tipo" formControlName="periodoTipo" (change)="onTipoPeriodoChange()" [class]="inpMandatory">
                      <option value="">--Seleccione--</option>
                      @for (t of tiposPeriodo; track t) {
                        <option [value]="t">{{ t }}</option>
                      }
                    </select>
                  </div>
                </div>

                <!-- Ambos tipos de periodo se registran con un rango de fechas.
                     Solo cambian los topes: Regular no admite fechas anteriores
                     al día de alta y, en CAS Temporal / Locador (OS), tampoco
                     posteriores al fin de la vigencia del contrato. -->
                @if (form.controls.periodoTipo.value) {
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label for="periodo-desde" class="block text-xs font-medium text-brand mb-1">
                        Fecha Inicio <span class="text-destructive">*</span>
                      </label>
                      <input
                        id="periodo-desde"
                        type="date"
                        formControlName="periodoFechaIni"
                        [min]="periodoFechaMin()"
                        [max]="periodoFechaMax()"
                        [class]="inpMandatory"
                      />
                    </div>
                    <div>
                      <label for="periodo-hasta" class="block text-xs font-medium text-brand mb-1">
                        Fecha Fin <span class="text-destructive">*</span>
                      </label>
                      <input
                        id="periodo-hasta"
                        type="date"
                        formControlName="periodoFechaFin"
                        [min]="form.controls.periodoFechaIni.value || periodoFechaMin()"
                        [max]="periodoFechaMax()"
                        [class]="inpMandatory"
                      />
                    </div>
                  </div>
                  @if (ayudaPeriodo(); as ayuda) {
                    <p class="text-[11px] text-muted-foreground leading-relaxed">{{ ayuda }}</p>
                  }
                }

                @if (form.controls.periodoTipo.value) {
                  <div class="flex justify-end">
                    <button type="button" (click)="agregarPeriodo()" class="btn-secondary">
                      <span>Agregar Periodo</span>
                      <lucide-angular [img]="SquarePlusIcon" class="size-4 text-muted-foreground" />
                    </button>
                  </div>
                }

                <!-- Tabla de periodos del servicio (máximo uno) -->
                <div class="bg-card rounded-xl ring-1 ring-border shadow-sm overflow-x-auto">
                  <table class="w-full min-w-[520px] text-left">
                    <thead class="bg-secondary">
                      <tr class="label-ds">
                        <th class="th-ds py-3 w-40">Tipo de Periodo</th>
                        <th class="th-ds py-3">Meses / Fechas Activas</th>
                        <th class="th-ds py-3 w-32 text-center">Estado</th>
                        <th class="th-ds py-3 w-20 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-border">
                      @if (periodos().length === 0) {
                        <tr>
                          <td colspan="4" class="px-4 py-4 text-center text-sm text-muted-foreground italic">
                            Sin periodo registrado para este servicio.
                          </td>
                        </tr>
                      }
                      @for (pg of periodos(); track $index; let i = $index) {
                        <tr class="hover:bg-secondary/40 transition-colors">
                          <td class="td-ds font-semibold text-foreground">{{ pg.tipo }}</td>
                          <td class="td-ds text-foreground/80">{{ formatearPeriodo(pg) }}</td>
                          <td class="td-ds text-center">
                            <span
                              class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 whitespace-nowrap"
                              [class]="estadoPeriodo(pg) === 'Expirado'
                                ? 'bg-destructive/10 text-destructive ring-destructive/30'
                                : 'bg-state-aprobado-soft text-state-aprobado-foreground ring-state-aprobado/30'"
                            >{{ estadoPeriodo(pg) }}</span>
                          </td>
                          <td class="td-ds px-2 text-center">
                            <button type="button" (click)="eliminarPeriodo(i)" class="p-2 rounded-lg transition-all bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground" title="Eliminar periodo" aria-label="Eliminar periodo">
                              <lucide-angular [img]="Trash2Icon" class="size-3.5" />
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }

            <!-- Perfil autorizado + Ámbito asignado (apilado a ancho completo) -->
            <div class="space-y-4 border-t border-border pt-5">
              <div class="space-y-1">
                <label for="perfil-autorizado" class="block text-xs font-medium text-muted-foreground mb-1">Perfil autorizado <span class="text-destructive">*</span></label>
                <select id="perfil-autorizado" formControlName="perfil" (change)="onPerfilChange()" [class]="inpMandatory">
                  <option value="">--Seleccione--</option>
                  @for (p of perfilesRegistrables(); track p) {
                    <option [value]="p">{{ p }}</option>
                  }
                </select>
              </div>

              @if (mostrarAmbito()) {
                <div class="space-y-4">
                  @if (esModoServicio()) {
                    <p class="text-[11px] text-muted-foreground italic">
                      Ámbitos territoriales del servicio anterior (solo lectura en un nuevo servicio).
                    </p>
                  }
                  @if (!esModoServicio()) {
                  <!-- Fila territorial: Región | Provincia | Distrito | Agregar (apila en móvil) -->
                  <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                    <div class="md:col-span-3">
                      <app-autocomplete
                        label="Región"
                        placeholder="Escriba para buscar una región..."
                        ariaLabel="Buscar región"
                        [options]="regiones"
                        [value]="ambitoRegion()"
                        (valueChange)="onRegionSeleccionada($event)"
                      />
                    </div>

                    <div class="md:col-span-3">
                      <app-autocomplete
                        label="Provincia"
                        placeholder="Escriba para buscar una provincia..."
                        ariaLabel="Buscar provincia"
                        [options]="provinciasDisponibles()"
                        [value]="ambitoProvincia()"
                        [deshabilitado]="soloRegion() || !ambitoRegion()"
                        (valueChange)="onProvinciaSeleccionada($event)"
                      />
                    </div>

                  @if (esTecnicoSeleccionado()) {
                    <!-- Buscador + multi-selección de distritos (solo Técnicos) -->
                    <div class="md:col-span-4">
                      <label for="buscador-distrito" class="block text-xs font-medium text-muted-foreground mb-1">Distrito</label>
                      <div class="relative">
                        <input
                          id="buscador-distrito"
                          type="text"
                          autocomplete="off"
                          aria-label="Buscar distrito"
                          placeholder="Escriba para filtrar distritos..."
                          [value]="distritoFiltro()"
                          (input)="distritoFiltro.set($any($event.target).value)"
                          [disabled]="!ambitoProvincia()"
                          [class]="(!ambitoProvincia() ? inpDisabled : inpNormal) + ' pr-9'"
                        />
                        <lucide-angular [img]="SearchIcon" class="size-4 text-muted-foreground/60 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      <div class="mt-2 rounded-xl ring-1 ring-border bg-card overflow-hidden">
                        <div class="flex items-center justify-between gap-2 px-3 py-2 bg-brand-soft border-b border-brand/10">
                          <label class="flex items-center gap-2 text-xs font-bold text-brand cursor-pointer select-none">
                            <input
                              type="checkbox"
                              class="accent-brand size-4"
                              [checked]="todosDistritosSeleccionados()"
                              [disabled]="!ambitoProvincia() || distritosFiltrados().length === 0"
                              (change)="toggleTodosDistritos($any($event.target).checked)"
                            />
                            <span>Seleccionar todos</span>
                          </label>
                          <span class="shrink-0 rounded-full bg-card px-2 py-0.5 text-[10px] font-bold text-brand tabular-nums ring-1 ring-brand/20">
                            {{ distritosSeleccionados().length }} seleccionados
                          </span>
                        </div>
                        <!-- Máx. 4 distritos visibles: el resto se alcanza con el scroll interno. -->
                        <div class="max-h-[150px] overflow-y-auto p-2 space-y-0.5 thin-scroll" role="group" aria-label="Distritos disponibles">
                          @if (!ambitoProvincia()) {
                            <p class="px-2 py-2 text-sm text-muted-foreground italic">Seleccione una Región y una Provincia para listar los distritos.</p>
                          } @else if (distritosFiltrados().length === 0) {
                            <p class="px-2 py-2 text-sm text-muted-foreground italic">Sin coincidencias para "{{ distritoFiltro() }}".</p>
                          }
                          @for (d of distritosFiltrados(); track d) {
                            <label class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground/90 hover:bg-secondary/60 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                class="accent-brand size-4"
                                [checked]="distritosSeleccionados().includes(d)"
                                (change)="toggleDistrito(d, $any($event.target).checked)"
                              />
                              <span>{{ d }}</span>
                            </label>
                          }
                        </div>
                      </div>
                    </div>
                  } @else {
                    <div class="md:col-span-4">
                      <label for="ambito-distrito" class="block text-xs font-medium text-muted-foreground mb-1">Distrito</label>
                      <select
                        id="ambito-distrito"
                        [value]="ambitoDistrito()"
                        (change)="ambitoDistrito.set($any($event.target).value)"
                        [disabled]="soloRegion() || !ambitoProvincia()"
                        class="w-full bg-background ring-1 ring-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none transition-colors disabled:bg-muted/40 disabled:text-muted-foreground disabled:cursor-not-allowed"
                      >
                        <option value="">Seleccione</option>
                        @for (d of distritosDisponibles(); track d) {
                          <option [value]="d">{{ d }}</option>
                        }
                      </select>
                    </div>
                  }

                    <div class="md:col-span-2">
                      <!-- Espaciador con la altura del label para alinear el botón con los campos. -->
                      <span class="hidden md:block text-[11px] font-medium mb-1" aria-hidden="true">&nbsp;</span>
                      <button
                        type="button"
                        (click)="agregarAmbito()"
                        class="btn-secondary w-full"
                      >
                        <span>Agregar</span>
                        <lucide-angular [img]="SquarePlusIcon" class="size-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  }

                  <div class="mt-2 bg-card rounded-xl ring-1 ring-border shadow-sm overflow-hidden">
                    <table class="w-full text-left">
                      <thead class="bg-secondary">
                        <tr class="label-ds">
                          <th class="th-ds py-3 w-1/3 text-center">Región</th>
                          <th class="th-ds py-3 w-1/3 text-center">Provincia</th>
                          <th class="th-ds py-3 w-1/3 text-center">Distrito</th>
                          <th class="th-ds py-3 w-12 text-center"></th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-border">
                        @if (ambitos().length === 0) {
                          <tr>
                            <td colspan="4" class="px-4 py-4 text-center text-sm text-muted-foreground italic">Sin ámbitos territoriales asignados.</td>
                          </tr>
                        }
                        @for (amb of ambitos(); track $index; let i = $index) {
                          <tr class="hover:bg-secondary/40 transition-colors">
                            <td class="td-ds text-foreground/80 text-center">{{ amb.region }}</td>
                            <td class="td-ds text-foreground/80 text-center">{{ amb.provincia }}</td>
                            <td class="td-ds text-foreground/80 text-center">{{ amb.distrito }}</td>
                            <td class="td-ds px-2 text-center">
                              @if (!esModoServicio()) {
                                <button type="button" (click)="eliminarAmbito(i)" class="p-2 rounded-lg transition-all bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground" title="Eliminar ámbito">
                                  <lucide-angular [img]="Trash2Icon" class="size-3.5" />
                                </button>
                              }
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>

                  <!-- Metas asignadas por ámbito territorial (solo Admin DZ → Técnico) -->
                  @if (mostrarMetas()) {
                    <div class="space-y-3 pt-1">
                      <div class="flex items-center gap-2 border-b border-border pb-2 text-brand">
                        <lucide-angular [img]="TargetIcon" class="size-4" />
                        <h3 class="label-ds">Metas asignadas por ámbito territorial</h3>
                      </div>
                      <div class="bg-card rounded-xl ring-1 ring-border shadow-sm overflow-x-auto">
                        <table class="w-full min-w-[640px] text-left">
                          <thead class="bg-secondary">
                            <tr class="label-ds">
                              <th class="th-ds py-3 text-center">Región</th>
                              <th class="th-ds py-3 text-center">Provincia</th>
                              <th class="th-ds py-3 text-center">Distrito</th>
                              <th class="th-ds py-3 text-center">Cantidad de Capacitaciones</th>
                              <th class="th-ds py-3 text-center">Cantidad de Asistencia Técnica</th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-border">
                            <!-- track por instancia de FormGroup: al eliminar un ámbito se
                                 destruye su fila (formGroupName por índice no se re-vincula). -->
                            @for (grupo of metasAmbito.controls; track grupo; let i = $index) {
                              <tr [formGroup]="grupo" class="hover:bg-secondary/40 transition-colors">
                                <td class="td-ds text-foreground/80 text-center">{{ ambitos()[i]?.region }}</td>
                                <td class="td-ds text-foreground/80 text-center">{{ ambitos()[i]?.provincia }}</td>
                                <td class="td-ds text-foreground/80 text-center">{{ ambitos()[i]?.distrito }}</td>
                                <td class="td-ds py-2 text-center">
                                  <input
                                    type="number" min="0" step="1" inputmode="numeric"
                                    formControlName="cantidadCapacitaciones"
                                    (keydown)="bloquearNoEnteros($event)"
                                    (blur)="normalizarMeta(i, 'cantidadCapacitaciones')"
                                    [class]="inpNormal + ' max-w-[110px] mx-auto text-center'"
                                  />
                                </td>
                                <td class="td-ds py-2 text-center">
                                  <input
                                    type="number" min="0" step="1" inputmode="numeric"
                                    formControlName="cantidadAsistenciaTecnica"
                                    (keydown)="bloquearNoEnteros($event)"
                                    (blur)="normalizarMeta(i, 'cantidadAsistenciaTecnica')"
                                    [class]="inpNormal + ' max-w-[110px] mx-auto text-center'"
                                  />
                                </td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Permisos de menú por usuario (esquema según perfil seleccionado) -->
            @if (esquemaPermisos(); as esquema) {
              <app-permisos-menu-form [esquema]="esquema" [(permisos)]="permisosMenuEdit" />
            }
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button (click)="irAPestana('datos')" class="btn-secondary">
              <lucide-angular [img]="ArrowLeftIcon" class="size-3.5" /> Atrás
            </button>
            @if (requierePresupuestoAdminGeneral()) {
              <!-- Abre el modal (no cambia de pestaña) y refleja el estado completado. -->
              <button
                (click)="abrirModalPresupuesto()"
                [class]="(presupuestoRegistrado() ? 'btn-success' : 'btn-primary') + ' px-5'"
                [attr.aria-label]="presupuestoRegistrado()
                  ? 'Datos presupuestales registrados. Abrir para revisar o editar'
                  : 'Registrar datos presupuestales'"
              >
                <lucide-angular [img]="presupuestoRegistrado() ? CircleCheckIcon : WalletIcon" class="size-3.5" />
                <span>{{ presupuestoRegistrado() ? 'Datos Presupuestales Registrados' : 'Registrar Datos Presupuestales' }}</span>
              </button>
            }
            <button
              (click)="guardarRegistroCompleto()"
              [disabled]="guardarBloqueado()"
              [title]="guardarBloqueado() ? motivoGuardarBloqueado() : ''"
              class="btn-success px-5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <lucide-angular [img]="SaveIcon" class="size-3.5" />
              <span>{{ modo() === 'editar' ? 'Guardar Cambios' : 'Guardar Registro' }}</span>
            </button>
          </div>
        </div>
      }

      <!-- ===== Modal Datos Presupuestales (Admin General → UE / DZ / Técnico) =====
           Reutiliza los mismos controles del formulario y sus catálogos, por lo que
           las cascadas (Unidad Responsable → Unidad Funcional) siguen operando sin
           lógica duplicada. Cancelar restaura el estado previo a abrir el modal. -->
      @if (modalPresupuesto()) {
        <app-modal
          title="Datos Presupuestales"
          maxWidth="max-w-2xl"
          mensaje="Complete la información presupuestal requerida para habilitar el registro del usuario."
          (closed)="cancelarPresupuesto()"
        >
          <div class="space-y-4 text-left" [formGroup]="form">
            <div>
              <label for="mp-unidad" class="block text-xs font-medium text-muted-foreground mb-1">
                Unidad Responsable <span class="text-destructive">*</span>
              </label>
              <select
                id="mp-unidad"
                formControlName="unidad"
                aria-label="Unidad Responsable"
                [attr.aria-invalid]="!!erroresPresupuesto()['unidad']"
                [attr.aria-describedby]="erroresPresupuesto()['unidad'] ? 'mp-unidad-error' : null"
                [class]="unidadBloqueada() ? inpDisabled : inpMandatory"
              >
                <option value="">--Seleccione--</option>
                @for (u of unidadesResponsables(); track u) {
                  <option [value]="u">{{ u }}</option>
                }
              </select>
              @if (erroresPresupuesto()['unidad']; as e) {
                <p id="mp-unidad-error" class="text-[11px] text-destructive mt-1">{{ e }}</p>
              }
            </div>

            <div>
              <label for="mp-fuente" class="block text-xs font-medium text-muted-foreground mb-1">
                Fuente de Financiamiento <span class="text-destructive">*</span>
              </label>
              <select
                id="mp-fuente"
                formControlName="fuenteFinanc"
                aria-label="Fuente de Financiamiento"
                [attr.aria-invalid]="!!erroresPresupuesto()['fuenteFinanc']"
                [attr.aria-describedby]="erroresPresupuesto()['fuenteFinanc'] ? 'mp-fuente-error' : null"
                [class]="presupuestoBloqueado() ? inpDisabled : inpMandatory"
              >
                <option value="">Seleccione</option>
                @for (f of fuentes(); track f) {
                  <option [value]="f">{{ f }}</option>
                }
              </select>
              @if (erroresPresupuesto()['fuenteFinanc']; as e) {
                <p id="mp-fuente-error" class="text-[11px] text-destructive mt-1">{{ e }}</p>
              }
            </div>

            <!-- Categoría presupuestal: solo fuera de la vista Jefe de Área (mismo criterio del formulario). -->
            @if (!modoJefeArea()) {
              <div>
                <label for="mp-categoria-presup" class="block text-xs font-medium text-muted-foreground mb-1">
                  Categoría presupuestal <span class="text-destructive">*</span>
                </label>
                <select
                  id="mp-categoria-presup"
                  formControlName="categoriaPresup"
                  (change)="onCategoriaChange()"
                  aria-label="Categoría presupuestal"
                  [class]="presupuestoBloqueado() ? inpDisabled : inpMandatory"
                >
                  <option value="">Seleccione</option>
                  @for (c of categorias(); track c) {
                    <option [value]="c">{{ c }}</option>
                  }
                </select>
                @if (erroresPresupuesto()['categoriaPresup']; as e) {
                  <p class="text-[11px] text-destructive mt-1">{{ e }}</p>
                }
              </div>
            }

            <div>
              <label for="mp-categoria" class="block text-xs font-medium text-muted-foreground mb-1">
                {{ modoJefeArea() ? 'Categoría' : 'Programa presupuestal' }} <span class="text-destructive">*</span>
              </label>
              <select
                id="mp-categoria"
                formControlName="programaPresup"
                (change)="onProgramaChange()"
                [attr.aria-label]="modoJefeArea() ? 'Categoría' : 'Programa presupuestal'"
                [attr.aria-invalid]="!!erroresPresupuesto()['programaPresup']"
                [attr.aria-describedby]="erroresPresupuesto()['programaPresup'] ? 'mp-categoria-error' : null"
                [class]="presupuestoBloqueado() || !programaHabilitado() ? inpDisabled : inpMandatory"
              >
                <option value="">Seleccione</option>
                @for (p of programas(); track p) {
                  <option [value]="p">{{ p }}</option>
                }
              </select>
              @if (erroresPresupuesto()['programaPresup']; as e) {
                <p id="mp-categoria-error" class="text-[11px] text-destructive mt-1">{{ e }}</p>
              }
            </div>

            <div>
              <label for="mp-unidad-func" class="block text-xs font-medium text-muted-foreground mb-1">
                Unidad Funcional <span class="text-destructive">*</span>
              </label>
              <select
                id="mp-unidad-func"
                formControlName="unidadFuncional"
                aria-label="Unidad Funcional"
                [attr.aria-invalid]="!!erroresPresupuesto()['unidadFuncional']"
                [attr.aria-describedby]="erroresPresupuesto()['unidadFuncional'] ? 'mp-unidad-func-error' : null"
                [class]="presupuestoBloqueado() ? inpDisabled : inpMandatory"
              >
                <option value="">Seleccione</option>
                @for (u of unidadesFuncionales(); track u) {
                  <option [value]="u">{{ u }}</option>
                }
              </select>
              @if (erroresPresupuesto()['unidadFuncional']; as e) {
                <p id="mp-unidad-func-error" class="text-[11px] text-destructive mt-1">{{ e }}</p>
              }
            </div>

            <!-- Resumen accesible de la validación (se anuncia al fallar Aceptar). -->
            <p role="alert" aria-live="assertive" class="sr-only">{{ resumenErroresPresupuesto() }}</p>
            @if (resumenErroresPresupuesto()) {
              <div class="flex items-start gap-2 rounded-lg bg-destructive/10 ring-1 ring-destructive/25 px-3 py-2">
                <lucide-angular [img]="TriangleAlertIcon" class="size-4 text-destructive shrink-0 mt-0.5" />
                <p class="text-xs text-destructive">{{ resumenErroresPresupuesto() }}</p>
              </div>
            }
          </div>

          <!-- Botonera propia, alineada a la derecha (mostrarAcciones queda en false). -->
          <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-8">
            <button
              type="button"
              (click)="cancelarPresupuesto()"
              class="btn-secondary w-full sm:w-auto sm:min-w-[130px]"
            >Cancelar</button>
            <button
              type="button"
              (click)="aceptarPresupuesto()"
              class="btn-primary w-full sm:w-auto sm:min-w-[130px]"
            >Aceptar</button>
          </div>
        </app-modal>
      }

    </section>
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

  readonly IdCardIcon = IdCard;
  readonly KeyRoundIcon = KeyRound;
  readonly UserCheckIcon = UserCheck;
  readonly WalletIcon = Wallet;
  readonly ShieldHalfIcon = ShieldHalf;
  readonly SearchIcon = Search;
  readonly LoaderIcon = LoaderCircle;
  readonly ArrowLeftIcon = ArrowLeft;
  readonly ArrowRightIcon = ArrowRight;
  readonly SaveIcon = Save;
  readonly Trash2Icon = Trash2;
  readonly SquarePlusIcon = SquarePlus;
  readonly TargetIcon = Target;
  readonly CircleCheckIcon = CircleCheck;
  readonly TriangleAlertIcon = TriangleAlert;

  readonly inpMandatory = INP_MANDATORY;
  readonly inpDisabled = INP_DISABLED;
  readonly inpNormal = INP_NORMAL;

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
    // Agregar Nuevo Servicio: identidad completa bloqueada, solo el celular es editable.
    if (esServicio) {
      ['dni', 'profesion', 'sexo', 'correo', 'perfil'].forEach((c) => this.form.get(c)?.disable());
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

  readonly unidadBloqueada = computed(() => {
    this.formTick();
    return this.form.controls.unidad.disabled;
  });

  presupuestoBloqueado(): boolean {
    const s = this.auth.session();
    if (!s || this.auth.esAdminGeneralAutenticado()) return false;
    return ['Administrador Unidad Ejecutora(UE)', 'Administrador DZ_Cap_Asit.'].includes(s.perfil);
  }

  /**
   * Detalle presupuestal (fuente, categoría, programa y unidad funcional)
   * visible solo para perfiles de gestión: para el Administrador General
   * (como objetivo, o registrando sin perfil elegido aún) se muestra
   * únicamente la Unidad Responsable, igual que el prototipo.
   */
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
  readonly formatearPeriodo = formatearPeriodo;
  readonly estadoPeriodo = estadoPeriodo;

  /** Periodo(s) del servicio en edición (máximo uno por servicio). */
  readonly periodos = signal<PeriodoGestion[]>([]);
  /** Meses marcados mientras se configura un periodo Regular. */

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


  /** Día de alta en ISO: tope inferior del periodo Regular. */
  readonly hoyISO = todayISO();

  /**
   * Fecha mínima seleccionable del periodo.
   *
   * Regular no puede empezar antes del día de creación del registro. En
   * contratos temporales (CAS Temporal / Locador de Servicio (OS)) tampoco
   * antes del inicio de la vigencia: el periodo debe caer dentro del contrato,
   * que es la regla que antes imponía el cálculo automático de meses.
   * Extraordinario conserva su comportamiento anterior (sin mínimo).
   */
  readonly periodoFechaMin = computed(() => {
    this.formTick();
    if (this.form.controls.periodoTipo.value !== 'Regular') return '';
    const inicioContrato = this.regimenTemporal() ? this.form.controls.fechaIni.value : '';
    return inicioContrato && inicioContrato > this.hoyISO ? inicioContrato : this.hoyISO;
  });

  /**
   * Fecha máxima seleccionable del periodo: el 31/12 del año de gestión y,
   * en contratos temporales, el fin de la vigencia si es anterior.
   */
  readonly periodoFechaMax = computed(() => {
    this.formTick();
    const tope = this.fechaMaxVigencia;
    if (this.form.controls.periodoTipo.value !== 'Regular') return tope;
    const finContrato = this.regimenTemporal() ? this.form.controls.fechaFin.value : '';
    return finContrato && finContrato < tope ? finContrato : tope;
  });

  /** Texto de ayuda bajo el rango, explicando el tope aplicado. */
  readonly ayudaPeriodo = computed(() => {
    this.formTick();
    if (this.form.controls.periodoTipo.value !== 'Regular') return '';
    if (this.regimenTemporal()) {
      const ini = this.form.controls.fechaIni.value;
      const fin = this.form.controls.fechaFin.value;
      if (!ini || !fin) {
        return 'Registre la vigencia del contrato para acotar el periodo Regular.';
      }
      return `El periodo debe estar dentro de la vigencia del contrato y no puede iniciar antes de hoy.`;
    }
    return `El periodo no puede iniciar antes de hoy ni superar el ${this.fechaMaxVigenciaTexto}.`;
  });





  /**
   * CAS Temporal / Locador: al cambiar la Fecha de inicio o la Fecha fin se
   * valida el tope del año de gestión y se recalculan los años disponibles y
   * los meses marcados, de modo que no queden inconsistencias entre las fechas
   * del contrato y el periodo.
   */
  onFechasContratoChange(): void {
    this.formTick.update((t) => t + 1);
    if (this.rechazarFechasFueraDeAnioGestion()) return;
  }

  /** Al cambiar de tipo de periodo se limpia el rango introducido. */
  onTipoPeriodoChange(): void {
    this.form.patchValue({ periodoFechaIni: '', periodoFechaFin: '' });
    this.formTick.update((t) => t + 1);
  }

  /* ===== Tope de vigencia: 31 de diciembre del año de gestión ===== */

  /** Año de gestión y su último día, derivados del sistema (nunca fijos). */
  readonly anioGestion = anioGestionVigente();
  readonly fechaMaxVigencia = fechaMaximaVigencia();
  readonly fechaMaxVigenciaTexto = fechaMaximaVigencia().split('-').reverse().join('/');

  /**
   * El atributo `max` impide elegir fechas posteriores en el calendario, pero
   * no cubre el tecleo manual ni el pegado: aquí se detecta ese caso, se avisa
   * con el modal estándar y se limpia el campo infractor para que no quede una
   * vigencia inválida en el formulario. Devuelve `true` si hubo rechazo.
   */
  private rechazarFechasFueraDeAnioGestion(): boolean {
    const { fechaIni, fechaFin } = this.form.getRawValue();
    const invalidos: string[] = [];
    if (excedeAnioGestion(fechaIni)) invalidos.push('Fecha de inicio');
    if (excedeAnioGestion(fechaFin)) invalidos.push('Fecha fin');
    if (!invalidos.length) return false;

    if (excedeAnioGestion(fechaIni)) this.form.patchValue({ fechaIni: '' });
    if (excedeAnioGestion(fechaFin)) this.form.patchValue({ fechaFin: '' });
    this.formTick.update((t) => t + 1);
    void this.modales.openError(
      'Vigencia fuera del año de gestión',
      `${invalidos.join(' y ')} no puede superar el ${this.fechaMaxVigenciaTexto}, ` +
        `último día del año de gestión ${this.anioGestion}.`,
    );
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
      const derivadoDelContrato = esRegimenTemporal(v.regimen);
      if (derivadoDelContrato && (!v.fechaIni || !v.fechaFin)) {
        void this.modales.openError(
          'Vigencia del contrato requerida',
          'Registre la Fecha de inicio y la Fecha fin del contrato antes de agregar el periodo Regular.',
        );
        return;
      }
      if (!v.periodoFechaIni || !v.periodoFechaFin) {
        void this.modales.openError(
          'Fechas requeridas',
          'La Fecha Inicio y la Fecha Fin del periodo Regular son obligatorias.',
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
      // Los topes del calendario son solo una ayuda visual: se revalidan aquí
      // porque el control de fecha admite escritura manual.
      const min = this.periodoFechaMin();
      const max = this.periodoFechaMax();
      if (v.periodoFechaIni < min) {
        void this.modales.openError(
          'Fecha de inicio no permitida',
          derivadoDelContrato && min !== this.hoyISO
            ? `El periodo Regular no puede iniciar antes del ${isoToDDMMYYYY(min)}, inicio de la vigencia del contrato.`
            : 'El periodo Regular no puede iniciar antes del día de creación del registro.',
        );
        return;
      }
      if (v.periodoFechaFin > max) {
        void this.modales.openError(
          'Vigencia no permitida',
          derivadoDelContrato && max !== this.fechaMaxVigencia
            ? `El periodo Regular no puede superar el ${isoToDDMMYYYY(max)}, fin de la vigencia del contrato.`
            : `El periodo Regular no puede superar el ${this.fechaMaxVigenciaTexto}, ` +
                `último día del año de gestión ${this.anioGestion}.`,
        );
        return;
      }
      const anio = Number(v.periodoFechaIni.slice(0, 4));
      this.periodos.set([
        {
          tipo,
          anio,
          // Los meses se siguen almacenando —derivados del rango— para no
          // alterar cómo se muestra el periodo en la tabla y los listados.
          meses: mesesDeRangoNumeros(v.periodoFechaIni, v.periodoFechaFin, anio),
          fechaInicio: v.periodoFechaIni,
          fechaFin: v.periodoFechaFin,
        },
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
    this.form.patchValue({
      periodoTipo: '',
      periodoFechaIni: '',
      periodoFechaFin: '',
    });
  }

  eliminarPeriodo(i: number): void {
    this.periodos.update((prev) => prev.filter((_, idx) => idx !== i));
  }

  onRegimenChange(): void {
    this.form.patchValue({ periodoTipo: '', periodoFechaIni: '', periodoFechaFin: '' });
    this.formTick.update((t) => t + 1);
    this.form.patchValue({
    });
    this.formTick.update((t) => t + 1);
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

  /* ===== Modal de Datos Presupuestales ===== */

  readonly modalPresupuesto = signal(false);
  /** Los datos presupuestales se aceptaron en el modal (habilita el guardado). */
  readonly presupuestoRegistrado = signal(false);
  readonly erroresPresupuesto = signal<Record<string, string>>({});
  /** Valores al abrir el modal; Cancelar los restaura sin guardar nada. */
  private snapshotPresupuesto: Record<string, string> | null = null;

  readonly resumenErroresPresupuesto = computed(() => {
    const n = Object.keys(this.erroresPresupuesto()).length;
    if (!n) return '';
    return n === 1
      ? 'Falta completar 1 campo obligatorio de los datos presupuestales.'
      : `Faltan completar ${n} campos obligatorios de los datos presupuestales.`;
  });

  /** Campos del modal, en el mismo orden en que se muestran. */
  private camposPresupuesto(): { control: string; etiqueta: string }[] {
    const campos = [
      { control: 'unidad', etiqueta: 'Unidad Responsable' },
      { control: 'fuenteFinanc', etiqueta: 'Fuente de Financiamiento' },
    ];
    if (!this.modoJefeArea()) campos.push({ control: 'categoriaPresup', etiqueta: 'Categoría presupuestal' });
    campos.push(
      { control: 'programaPresup', etiqueta: this.modoJefeArea() ? 'Categoría' : 'Programa presupuestal' },
      { control: 'unidadFuncional', etiqueta: 'Unidad Funcional' },
    );
    return campos;
  }

  /** Abre el modal conservando lo ya registrado (permite revisarlo y editarlo). */
  abrirModalPresupuesto(): void {
    const v = this.form.getRawValue();
    this.snapshotPresupuesto = {
      unidad: v.unidad,
      fuenteFinanc: v.fuenteFinanc,
      categoriaPresup: v.categoriaPresup,
      programaPresup: v.programaPresup,
      unidadFuncional: v.unidadFuncional,
    };
    this.erroresPresupuesto.set({});
    this.modalPresupuesto.set(true);
    // Foco inicial en el primer campo (mismo patrón de scroll/foco del formulario).
    setTimeout(() => (document.getElementById('mp-unidad') as HTMLSelectElement | null)?.focus(), 60);
  }

  /** Cancelar: restaura los valores previos y no registra nada. */
  cancelarPresupuesto(): void {
    if (this.snapshotPresupuesto) this.form.patchValue(this.snapshotPresupuesto);
    this.snapshotPresupuesto = null;
    this.erroresPresupuesto.set({});
    this.modalPresupuesto.set(false);
    this.formTick.update((t) => t + 1);
  }

  /** ESC equivale a Cancelar (descarta los cambios del modal). */
  onEscape(): void {
    if (this.modalPresupuesto()) this.cancelarPresupuesto();
  }

  /**
   * Aceptar: valida que no quede ningún campo vacío. Si falta alguno, marca los
   * controles y no cierra; si está completo, deja los valores en el formulario
   * (ya escritos por los propios controles) y marca el registro como completado.
   */
  aceptarPresupuesto(): void {
    const v = this.form.getRawValue() as unknown as Record<string, string>;
    const errores: Record<string, string> = {};
    for (const { control, etiqueta } of this.camposPresupuesto()) {
      if (!v[control]) errores[control] = `${etiqueta} es obligatorio.`;
    }
    this.erroresPresupuesto.set(errores);
    if (Object.keys(errores).length > 0) return;

    this.snapshotPresupuesto = null;
    this.presupuestoRegistrado.set(true);
    this.modalPresupuesto.set(false);
    this.formTick.update((t) => t + 1);
    this.toast.success(
      'Datos presupuestales registrados',
      'Ya puede continuar con el registro del usuario.',
    );
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
   * registrado en el modal, que el resto del formulario esté completo. Para los
   * demás perfiles se conserva el comportamiento actual.
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


  irAPestana(tab: 'datos' | 'permisos'): void {
    if (tab === 'permisos') {
      const v = this.form.getRawValue();
      if (!v.dni.trim() || !v.apePat) {
        this.mostrarAlerta({
          titulo: 'Acceso Restringido',
          mensaje: 'Debe ingresar el DNI y validar los datos de RENIEC antes de configurar los permisos.',
        });
        return;
      }
    }
    this.tab.set(tab);
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
      this.mostrarAlerta({ titulo: 'Unidad Responsable Vacía', mensaje: 'Debe definir la Unidad Responsable del SODEGA.' });
      return;
    }
    if (!this.validarPresupuesto(v)) return;
    this.tab.set('permisos');
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
