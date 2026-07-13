import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  IdCard, KeyRound, UserCheck, Wallet, ShieldHalf, Search, LoaderCircle,
  ArrowLeft, ArrowRight, Save, Trash2, SquarePlus,
} from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { ListasAdminService } from '../../core/services/listas-admin.service';
import { PermisosMenuService } from '../../core/services/permisos-menu.service';
import {
  AmbitoTerritorial,
  Perfil,
  UsuarioSodega,
  perfilRequiereAmbito,
  perfilSoloRegion,
  toTitleCase,
} from '../../core/models/usuario-sodega.model';
import { PermisosMenu, combinarPermisos } from '../../core/models/permisos-menu.model';
import { PermisosMenuFormComponent } from './permisos-menu-form.component';
import { INPUT_BASE, INPUT_DISABLED, INPUT_REQUIRED } from '../../shared/utils/input-styles.const';
import {
  CATEGORIAS_PRESUPUESTALES,
  FUENTES_FINANCIAMIENTO,
  PROFESIONES,
  PROGRAMAS_MAESTROS,
  REGIMENES_LABORALES,
  UBIGEO_SODEGA,
  UNIDADES_FUNCIONALES_MAESTRAS,
  UNIDADES_POR_PROGRAMA,
  UNIDADES_RESPONSABLES,
} from '../../core/constants/sodega.const';
import { ModalComponent } from '../../shared/components/modal/modal.component';

type ModoForm = 'nuevo' | 'editar' | 'presupuesto';

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
  imports: [ReactiveFormsModule, LucideAngularModule, ModalComponent, PermisosMenuFormComponent],
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
              <h3 class="text-[11px] font-semibold uppercase tracking-wider">Datos Personales</h3>
            </div>

            <div class="grid grid-cols-12 gap-3">
              <div class="col-span-4">
                <label class="block text-[11px] font-medium text-muted-foreground mb-1">Nro DNI <span class="text-destructive">*</span></label>
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
                    class="w-1/3 bg-foreground hover:bg-foreground/85 text-background rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>{{ buscandoReniec() ? 'Buscando...' : 'Buscar' }}</span>
                    <lucide-angular [img]="buscandoReniec() ? LoaderIcon : SearchIcon" class="size-3 ml-1" [class.animate-spin]="buscandoReniec()" />
                  </button>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-12 gap-3">
              <div class="col-span-4">
                <label class="block text-[11px] font-medium text-muted-foreground mb-1">Apellido paterno</label>
                <input formControlName="apePat" readonly placeholder="Apellido paterno" [class]="inpDisabled" />
              </div>
              <div class="col-span-4">
                <label class="block text-[11px] font-medium text-muted-foreground mb-1">Apellido materno</label>
                <input formControlName="apeMat" readonly placeholder="Apellido materno" [class]="inpDisabled" />
              </div>
              <div class="col-span-4">
                <label class="block text-[11px] font-medium text-muted-foreground mb-1">Nombre(s)</label>
                <input formControlName="nombres" readonly placeholder="Nombre(s)" [class]="inpDisabled" />
              </div>
            </div>

            <div class="grid grid-cols-12 gap-3">
              <div class="col-span-3">
                <label class="block text-[11px] font-medium text-muted-foreground mb-1">Estado civil</label>
                <input formControlName="estCivil" readonly placeholder="Estado civil" [class]="inpDisabled" />
              </div>
              <div class="col-span-3">
                <label class="block text-[11px] font-medium text-muted-foreground mb-1">Profesión - especialidad <span class="text-destructive">*</span></label>
                <select formControlName="profesion" [class]="reniecEditable() ? inpMandatory : inpDisabled">
                  <option value="">--Seleccione--</option>
                  @for (p of profesiones(); track p) {
                    <option [value]="p">{{ p }}</option>
                  }
                </select>
              </div>
              <div class="col-span-3">
                <label class="block text-[11px] font-medium text-muted-foreground mb-1">Dirección domiciliaria</label>
                <input formControlName="direccion" readonly placeholder="Dirección domiciliaria" [class]="inpDisabled" />
              </div>
              <div class="col-span-3">
                <label class="block text-[11px] font-medium text-muted-foreground mb-1">Ubigeo RENIEC</label>
                <input formControlName="ubigeo" readonly placeholder="UBIGEO" [class]="inpDisabled" />
              </div>
            </div>

            <div class="grid grid-cols-12 gap-3">
              <div class="col-span-3">
                <label class="block text-[11px] font-medium text-muted-foreground mb-1">Restricciones</label>
                <input formControlName="restricciones" readonly placeholder="Restricciones" [class]="inpDisabled" />
              </div>
              <div class="col-span-3">
                <label class="block text-[11px] font-medium text-muted-foreground mb-1">Sexo <span class="text-destructive">*</span></label>
                <select formControlName="sexo" [class]="reniecEditable() ? inpMandatory : inpDisabled">
                  <option value="">--Seleccione--</option>
                  @for (s of sexos(); track s) {
                    <option [value]="s">{{ s }}</option>
                  }
                </select>
              </div>
              <div class="col-span-3">
                <label class="block text-[11px] font-medium text-muted-foreground mb-1">Fecha nac. (RENIEC)</label>
                <input formControlName="fechaNac" readonly placeholder="dd/mm/aaaa" [class]="inpDisabled" />
              </div>
              <div class="col-span-3">
                <label class="block text-[11px] font-medium text-muted-foreground mb-1">Edad calculada</label>
                <input formControlName="edad" readonly placeholder="Edad calculada" [class]="inpDisabled" />
              </div>
            </div>

            <div class="grid grid-cols-12">
              <div class="col-span-3">
                <label class="block text-[11px] font-medium text-muted-foreground mb-1">Celular de contacto</label>
                <input formControlName="celular" placeholder="999 999 999" [class]="inpNormal" />
              </div>
            </div>
          </div>

          <!-- Datos presupuestales -->
          <div class="bg-card rounded-xl ring-1 ring-border shadow-sm p-5 space-y-4">
            <div class="flex items-center gap-2 border-b border-border pb-2 text-brand">
              <lucide-angular [img]="WalletIcon" class="size-4" />
              <h3 class="text-[11px] font-semibold uppercase tracking-wider">Datos Presupuestales</h3>
            </div>
            <div>
              <label class="block text-[11px] font-medium text-muted-foreground mb-1">Unidad Responsable <span class="text-destructive">*</span></label>
              <select formControlName="unidad" [class]="unidadBloqueada() ? inpDisabled : inpMandatory">
                <option value="">--Seleccione--</option>
                @for (u of unidadesResponsables(); track u) {
                  <option [value]="u">{{ u }}</option>
                }
              </select>
            </div>

            @if (mostrarPresupuesto()) {
              <div class="grid grid-cols-4 gap-3 border-t border-border pt-4">
                <div>
                  <label class="block text-[11px] font-medium text-muted-foreground mb-1">Fuente de financ. <span class="text-destructive">*</span></label>
                  <select formControlName="fuenteFinanc" [class]="presupuestoBloqueado() ? inpDisabled : inpMandatory">
                    <option value="">Seleccione</option>
                    @for (f of fuentes(); track f) {
                      <option [value]="f">{{ f }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-[11px] font-medium text-muted-foreground mb-1">Categoría presup. <span class="text-destructive">*</span></label>
                  <select formControlName="categoriaPresup" (change)="onCategoriaChange()" [class]="presupuestoBloqueado() ? inpDisabled : inpMandatory">
                    <option value="">Seleccione</option>
                    @for (c of categorias(); track c) {
                      <option [value]="c">{{ c }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-[11px] font-medium text-muted-foreground mb-1">Programa presupuestal <span class="text-destructive">*</span></label>
                  <select formControlName="programaPresup" (change)="onProgramaChange()" [class]="presupuestoBloqueado() || !programaHabilitado() ? inpDisabled : inpMandatory">
                    <option value="">Seleccione</option>
                    @for (p of programas(); track p) {
                      <option [value]="p">{{ p }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-[11px] font-medium text-muted-foreground mb-1">Unidad funcional (Opas) <span class="text-destructive">*</span></label>
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
              <h3 class="text-[11px] font-semibold uppercase tracking-wider">Cuenta de acceso institucional</h3>
            </div>

            <div class="grid grid-cols-12 gap-3">
              <div class="col-span-3">
                <label class="block text-[11px] font-medium text-muted-foreground mb-1">Usuario generado</label>
                <input formControlName="userGen" readonly placeholder="Usuario Automático" [class]="inpDisabled" />
              </div>
              <div class="col-span-3">
                <label class="block text-[11px] font-medium text-muted-foreground mb-1">Correo Personal <span class="text-destructive">*</span></label>
                <input formControlName="correo" placeholder="correo@midagri.gob.pe" [class]="inpMandatory" />
              </div>
              <div class="col-span-3">
                <label class="block text-[11px] font-medium text-muted-foreground mb-1">Régimen laboral <span class="text-destructive">*</span></label>
                <select formControlName="regimen" (change)="formTick.set(formTick() + 1)" [class]="inpMandatory">
                  <option value="">--Seleccione--</option>
                  @for (r of regimenes; track r) {
                    <option [value]="r">{{ r }}</option>
                  }
                </select>
              </div>
              <div class="col-span-3">
                <label class="block text-[11px] font-medium text-muted-foreground mb-1">Estado de cuenta</label>
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
                  <label class="block text-[11px] font-medium text-brand mb-1">Fecha de inicio <span class="text-destructive">*</span></label>
                  <input type="date" formControlName="fechaIni" [class]="inpMandatory" />
                </div>
                <div [class]="esLocador() ? 'col-span-4' : 'col-span-6'">
                  <label class="block text-[11px] font-medium text-brand mb-1">Fecha fin <span class="text-destructive">*</span></label>
                  <input type="date" formControlName="fechaFin" [class]="inpMandatory" />
                </div>
                @if (esLocador()) {
                  <div class="col-span-4">
                    <label class="block text-[11px] font-medium text-brand mb-1">Nro. de Orden (O.S.) <span class="text-destructive">*</span></label>
                    <input formControlName="nroOrden" placeholder="Ejem: O.S. N° 00421-2026" [class]="inpMandatory + ' uppercase'" />
                  </div>
                }
              </div>
            }

            <!-- Perfil autorizado + Ámbito asignado -->
            <div class="grid grid-cols-12 gap-6 items-start border-t border-border pt-5">
              <div class="col-span-5 space-y-1">
                <label class="block text-[11px] font-medium text-muted-foreground mb-1">Perfil autorizado <span class="text-destructive">*</span></label>
                <select formControlName="perfil" (change)="onPerfilChange()" [class]="inpMandatory">
                  <option value="">--Seleccione--</option>
                  @for (p of perfilesRegistrables(); track p) {
                    <option [value]="p">{{ p }}</option>
                  }
                </select>
              </div>

              @if (mostrarAmbito()) {
                <div class="col-span-7 space-y-4">
                  <div class="grid grid-cols-3 gap-3">
                    <div>
                      <label class="block text-[11px] font-medium text-muted-foreground mb-1">Región</label>
                      <select
                        [value]="ambitoRegion()"
                        (change)="ambitoRegion.set($any($event.target).value); ambitoProvincia.set(''); ambitoDistrito.set('')"
                        class="w-full bg-background ring-1 ring-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none transition-colors"
                      >
                        <option value="">Seleccione</option>
                        @for (r of regiones; track r) {
                          <option [value]="r">{{ r }}</option>
                        }
                      </select>
                    </div>
                    <div>
                      <label class="block text-[11px] font-medium text-muted-foreground mb-1">Provincia</label>
                      <select
                        [value]="ambitoProvincia()"
                        (change)="ambitoProvincia.set($any($event.target).value); ambitoDistrito.set('')"
                        [disabled]="soloRegion() || !ambitoRegion()"
                        class="w-full bg-background ring-1 ring-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none transition-colors disabled:bg-muted/40 disabled:text-muted-foreground disabled:cursor-not-allowed"
                      >
                        <option value="">Seleccione</option>
                        @for (p of provinciasDisponibles(); track p) {
                          <option [value]="p">{{ p }}</option>
                        }
                      </select>
                    </div>
                    <div>
                      <label class="block text-[11px] font-medium text-muted-foreground mb-1">Distrito</label>
                      <select
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
                  </div>

                  <div class="flex justify-end">
                    <button
                      type="button"
                      (click)="agregarAmbito()"
                      class="btn-secondary"
                    >
                      <span>Agregar</span>
                      <lucide-angular [img]="SquarePlusIcon" class="size-4 text-muted-foreground" />
                    </button>
                  </div>

                  <div class="mt-2 bg-card rounded-xl ring-1 ring-border shadow-sm overflow-hidden">
                    <table class="w-full text-left">
                      <thead class="bg-secondary">
                        <tr class="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                          <th class="px-4 py-3 w-1/3 text-center">Región</th>
                          <th class="px-4 py-3 w-1/3 text-center">Provincia</th>
                          <th class="px-4 py-3 w-1/3 text-center">Distrito</th>
                          <th class="px-4 py-3 w-12 text-center"></th>
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
                            <td class="px-4 py-3 text-sm text-foreground/80 text-center">{{ amb.region }}</td>
                            <td class="px-4 py-3 text-sm text-foreground/80 text-center">{{ amb.provincia }}</td>
                            <td class="px-4 py-3 text-sm text-foreground/80 text-center">{{ amb.distrito }}</td>
                            <td class="px-2 py-3 text-center">
                              <button type="button" (click)="eliminarAmbito(i)" class="p-2 rounded-lg transition-all bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground" title="Eliminar ámbito">
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
            <button (click)="guardarRegistroCompleto()" class="btn-success px-5">
              <lucide-angular [img]="SaveIcon" class="size-3.5" />
              <span>{{ modo() === 'editar' ? 'Guardar Cambios' : 'Guardar Registro' }}</span>
            </button>
          </div>
        </div>
      }

      <!-- Modal de alerta -->
      @if (alerta(); as a) {
        <app-modal [title]="a.titulo" maxWidth="max-w-md" (closed)="cerrarAlerta()">
          <p class="text-sm text-foreground leading-relaxed">{{ a.mensaje }}</p>
          <div class="flex justify-center mt-5">
            <button (click)="cerrarAlerta()" class="btn-primary px-6 min-w-[120px]">
              Aceptar
            </button>
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

  readonly inpMandatory = INP_MANDATORY;
  readonly inpDisabled = INP_DISABLED;
  readonly inpNormal = INP_NORMAL;

  /* Catálogos reactivos: base del proyecto ⊕ opciones de Administración de Listas */
  readonly profesiones = computed(() => this.listasAdmin.opcionesFormulario('Profesión - Especialidad', PROFESIONES));
  readonly regimenes = REGIMENES_LABORALES;
  readonly fuentes = computed(() => this.listasAdmin.opcionesFormulario('Fuente de Financiamiento', FUENTES_FINANCIAMIENTO));
  readonly categorias = computed(() => this.listasAdmin.opcionesFormulario('Categoría Presupuestal', CATEGORIAS_PRESUPUESTALES));
  readonly programas = computed(() => this.listasAdmin.opcionesFormulario('Programas Presupuestales', PROGRAMAS_MAESTROS));
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
  readonly alerta = signal<{ titulo: string; mensaje: string; cerrarYSalir?: boolean } | null>(null);
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
  });

  constructor() {
    this.form.valueChanges.subscribe(() => this.formTick.update((t) => t + 1));
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const modoQP = this.route.snapshot.queryParamMap.get('modo');
    if (id) {
      this.usuarioBase = this.usuariosService.findById(id) ?? null;
      this.modo.set(modoQP === 'presupuesto' ? 'presupuesto' : 'editar');
      if (this.usuarioBase) this.cargarUsuario(this.usuarioBase);
    }
    this.aplicarBloqueosPorPerfilActivo();
  }

  private cargarUsuario(u: UsuarioSodega): void {
    const esPresupuesto = this.modo() === 'presupuesto';
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
      unidad: esPresupuesto ? '' : u.unidad,
      fuenteFinanc: esPresupuesto ? '' : u.fuenteFinanc,
      categoriaPresup: esPresupuesto ? '' : u.categoriaPresup,
      programaPresup: esPresupuesto ? '' : u.programaPresup,
      unidadFuncional: esPresupuesto ? '' : u.unidadFuncional,
      userGen: u.userGen,
      correo: u.correo,
      regimen: u.regimen,
      estado: u.estado,
      fechaIni: u.fechaIni,
      fechaFin: u.fechaFin,
      nroOrden: u.nroOrden,
      perfil: u.perfil,
    });
    this.ambitos.set([...(u.ambitos ?? [])]);
    this.sincronizarPermisosMenu();
    // En edición el DNI no cambia; en modo presupuesto la sección RENIEC queda bloqueada.
    this.reniecEditable.set(!esPresupuesto && false ? true : !esPresupuesto);
    if (this.modo() === 'editar') this.form.controls.dni.disable();
    if (esPresupuesto) this.reniecEditable.set(false);
  }

  /** Unidad Responsable bloqueada para perfiles subordinados (prototipo). */
  private aplicarBloqueosPorPerfilActivo(): void {
    const s = this.auth.session();
    if (!s) return;
    const bloqueaUnidad = ['Jefe de Área', 'Administrador Unidad Organizacional', 'Administrador DZ_Cap_Asit.'].includes(s.perfil);
    if (bloqueaUnidad && this.modo() !== 'presupuesto') {
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
    return 'GESTIÓN INTEGRAL DE USUARIOS';
  });

  readonly perfilesRegistrables = computed<Perfil[]>(() => {
    const s = this.auth.session();
    return s ? this.usuariosService.perfilesRegistrables(s.perfil) : [];
  });

  readonly unidadBloqueada = computed(() => {
    this.formTick();
    return this.form.controls.unidad.disabled;
  });

  presupuestoBloqueado(): boolean {
    const s = this.auth.session();
    return !!s && ['Administrador Unidad Organizacional', 'Administrador DZ_Cap_Asit.'].includes(s.perfil);
  }

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
    const perfilesGestion = ['Jefe de Área', 'Administrador Unidad Organizacional', 'Administrador DZ_Cap_Asit.', 'Técnico Capacitación y Asistencia Técnica'];
    return perfilesGestion.includes(s?.perfil ?? '') || perfilesGestion.includes(target);
  });

  readonly programaHabilitado = computed(() => {
    this.formTick();
    return this.form.controls.categoriaPresup.value === 'Programa Presupuestal';
  });

  readonly unidadesFuncionales = computed<string[]>(() => {
    this.formTick();
    const cat = this.form.controls.categoriaPresup.value;
    const prog = this.form.controls.programaPresup.value;
    const base =
      cat === 'Programa Presupuestal' && prog
        ? UNIDADES_POR_PROGRAMA[prog] ?? UNIDADES_FUNCIONALES_MAESTRAS
        : UNIDADES_FUNCIONALES_MAESTRAS;
    return this.listasAdmin.opcionesFormulario('Unidad Funcional (OPAS)', base);
  });

  /** Esquema de permisos del perfil seleccionado (solo lo configura el Admin General). */
  readonly esquemaPermisos = computed(() => {
    this.formTick();
    if (this.auth.session()?.perfil !== 'Administrador General') return undefined;
    return this.permisosService.esquemaPara(this.form.controls.perfil.value);
  });

  readonly regimenTemporal = computed(() => {
    this.formTick();
    const r = this.form.controls.regimen.value;
    return r === 'Locador de Servicio (OS)' || r === 'Régimen CAS Temporal';
  });

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

  readonly provinciasDisponibles = computed(() => {
    const r = this.ambitoRegion();
    return r ? Object.keys(UBIGEO_SODEGA[r] ?? {}) : [];
  });

  readonly distritosDisponibles = computed(() => {
    const r = this.ambitoRegion();
    const p = this.ambitoProvincia();
    return r && p ? UBIGEO_SODEGA[r]?.[p] ?? [] : [];
  });

  /* ===== Acciones ===== */

  onCategoriaChange(): void {
    this.form.patchValue({ programaPresup: '', unidadFuncional: '' });
  }

  onProgramaChange(): void {
    this.form.patchValue({ unidadFuncional: '' });
  }

  onPerfilChange(): void {
    if (!this.mostrarAmbito()) this.ambitos.set([]);
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
      this.alerta.set({ titulo: 'Error RENIEC', mensaje: 'Debe ingresar un número de DNI válido de 8 dígitos.' });
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
      this.alerta.set({
        titulo: 'Datos Recuperados',
        mensaje: `Se obtuvo correctamente la información desde el Web Service de RENIEC para el DNI N° ${dni}.`,
      });
    });
  }

  agregarAmbito(): void {
    const region = this.ambitoRegion();
    const soloRegion = this.soloRegion();
    const provincia = soloRegion ? '-' : this.ambitoProvincia();
    const distrito = soloRegion ? '-' : this.ambitoDistrito();

    if (!region) {
      this.alerta.set({ titulo: 'Ámbito Incompleto', mensaje: 'Debe seleccionar una Región para poder agregar.' });
      return;
    }
    if (!soloRegion && (!provincia || !distrito)) {
      this.alerta.set({ titulo: 'Ámbito Incompleto', mensaje: 'Debe seleccionar Región, Provincia y Distrito para poder agregar.' });
      return;
    }
    const existe = this.ambitos().some(
      (a) => a.region === region && a.provincia === provincia && a.distrito === distrito,
    );
    if (existe) {
      this.alerta.set({ titulo: 'Ámbito Duplicado', mensaje: 'Este ámbito territorial ya se encuentra asignado en el listado.' });
      return;
    }
    this.ambitos.update((prev) => [...prev, { region, provincia, distrito }]);
    this.ambitoDistrito.set('');
  }

  eliminarAmbito(i: number): void {
    this.ambitos.update((prev) => prev.filter((_, idx) => idx !== i));
  }

  irAPestana(tab: 'datos' | 'permisos'): void {
    if (tab === 'permisos') {
      const v = this.form.getRawValue();
      if (!v.dni.trim() || !v.apePat) {
        this.alerta.set({
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
      this.alerta.set({ titulo: 'DNI Requerido', mensaje: 'Por favor, ingrese el número de DNI.' });
      return;
    }
    if (!v.apePat || !v.nombres) {
      this.alerta.set({
        titulo: 'Verificación RENIEC Pendiente',
        mensaje: 'Debe completar la consulta a RENIEC mediante el botón Buscar antes de avanzar.',
      });
      return;
    }
    if (!v.profesion) {
      this.alerta.set({ titulo: 'Profesión Requerida', mensaje: 'Debe seleccionar una Profesión o Especialidad.' });
      return;
    }
    if (!v.sexo) {
      this.alerta.set({ titulo: 'Sexo Requerido', mensaje: 'Debe seleccionar el Sexo del colaborador.' });
      return;
    }
    if (!v.unidad) {
      this.alerta.set({ titulo: 'Unidad Responsable Vacía', mensaje: 'Debe definir la Unidad Responsable del MIDAGRI.' });
      return;
    }
    if (!this.validarPresupuesto(v)) return;
    this.tab.set('permisos');
  }

  private validarPresupuesto(v: ReturnType<typeof this.form.getRawValue>): boolean {
    const s = this.auth.session();
    const esAdminGeneral = v.perfil === 'Administrador General';
    const omitir = s?.perfil === 'Administrador General' && v.perfil === 'Jefe de Área';
    if (!this.mostrarPresupuesto() || esAdminGeneral || omitir) return true;
    if (!v.fuenteFinanc) {
      this.alerta.set({ titulo: 'Fuente de Financiamiento Requerida', mensaje: 'Debe seleccionar una Fuente de Financiamiento válida.' });
      return false;
    }
    if (!v.categoriaPresup) {
      this.alerta.set({ titulo: 'Categoría Presupuestal Requerida', mensaje: 'Debe seleccionar una Categoría Presupuestal.' });
      return false;
    }
    if (v.categoriaPresup === 'Programa Presupuestal' && !v.programaPresup) {
      this.alerta.set({ titulo: 'Programa Presupuestal Requerido', mensaje: 'Debe seleccionar un Programa Presupuestal estratégico.' });
      return false;
    }
    if (!v.unidadFuncional) {
      this.alerta.set({ titulo: 'Unidad Funcional Requerida', mensaje: 'Debe seleccionar una Unidad Funcional de OPAS.' });
      return false;
    }
    return true;
  }

  /** Guardado final (equivale a guardarRegistroCompleto del prototipo). */
  guardarRegistroCompleto(): void {
    const v = this.form.getRawValue();
    const s = this.auth.session();
    if (!s) return;

    if (!v.correo.trim() || !v.regimen || !v.perfil || !v.unidad) {
      this.alerta.set({
        titulo: 'Campos Incompletos',
        mensaje: 'Por favor complete todos los campos obligatorios (*) de Cuenta de Acceso, Unidad Responsable y Perfil Funcional.',
      });
      return;
    }

    if (this.modo() === 'presupuesto' && this.usuariosService.existeUnidadParaDni(v.dni, v.unidad)) {
      this.alerta.set({
        titulo: 'Unidad Presupuestal Duplicada',
        mensaje: 'El colaborador ya tiene asignada esta Unidad Responsable. Seleccione una unidad diferente para esta nueva partida.',
      });
      return;
    }

    if (this.modo() === 'nuevo' && this.usuariosService.existeDni(v.dni)) {
      this.alerta.set({
        titulo: 'Usuario Existente',
        mensaje: 'El número de DNI ingresado ya se encuentra registrado en el sistema SODEGA.',
      });
      return;
    }

    if (this.regimenTemporal()) {
      if (!v.fechaIni || !v.fechaFin) {
        this.alerta.set({
          titulo: 'Campos Incompletos',
          mensaje: 'Para locadores de servicio (OS) o regímenes CAS Temporales es obligatorio registrar las fechas de inicio y fin de contrato.',
        });
        return;
      }
      if (this.esLocador() && !v.nroOrden.trim()) {
        this.alerta.set({
          titulo: 'Orden de Servicio Requerida',
          mensaje: 'Para locadores de servicio (OS) es obligatorio registrar el Nro. de Orden (O.S.).',
        });
        return;
      }
    }

    if (perfilRequiereAmbito(v.perfil) && this.ambitos().length === 0) {
      this.alerta.set({
        titulo: 'Jurisdicción Vacía',
        mensaje: 'Debe asignar al menos un ámbito territorial de Región, Provincia y Distrito.',
      });
      return;
    }

    if (!this.validarPresupuesto(v)) return;

    const esAdminGeneral = v.perfil === 'Administrador General';
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
      userGen: v.userGen,
      correo: v.correo,
      regimen: v.regimen as UsuarioSodega['regimen'],
      estado: v.estado as UsuarioSodega['estado'],
      fechaIni: this.regimenTemporal() ? v.fechaIni : '',
      fechaFin: this.regimenTemporal() ? v.fechaFin : '',
      nroOrden: this.esLocador() ? v.nroOrden.trim() : '',
      perfil: v.perfil as Perfil,
      opa: this.usuariosService.derivarOpa(v.unidad),
      fuenteFinanc: esAdminGeneral ? '' : v.fuenteFinanc,
      categoriaPresup: esAdminGeneral ? '' : v.categoriaPresup,
      programaPresup: esAdminGeneral ? '' : v.programaPresup,
      unidadFuncional: esAdminGeneral ? '' : v.unidadFuncional,
      creadoPor: s.userGen,
      ambitos: perfilRequiereAmbito(v.perfil) ? [...this.ambitos()] : [],
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
      this.alerta.set({
        titulo: 'Nuevo Presupuesto Asignado',
        mensaje: `Se ha asignado con éxito el nuevo presupuesto en '${v.unidad}' para el servidor ${nombreCompleto}.`,
        cerrarYSalir: true,
      });
    } else if (this.modo() === 'editar' && this.usuarioBase) {
      this.usuariosService.update(this.usuarioBase.id, {
        ...datos,
        creadoPor: this.usuarioBase.creadoPor || s.userGen,
      });
      this.alerta.set({
        titulo: 'Registro Actualizado',
        mensaje: `El colaborador ${nombreCompleto} ha sido actualizado correctamente.`,
        cerrarYSalir: true,
      });
    } else {
      this.usuariosService.create(datos);
      this.alerta.set({
        titulo: 'Registro Guardado',
        mensaje: `El colaborador ${nombreCompleto} ha sido registrado de manera exitosa.`,
        cerrarYSalir: true,
      });
    }
  }

  cerrarAlerta(): void {
    const salir = this.alerta()?.cerrarYSalir;
    this.alerta.set(null);
    if (salir) this.cancelar();
  }

  cancelar(): void {
    this.router.navigate(['/usuarios']);
  }
}
