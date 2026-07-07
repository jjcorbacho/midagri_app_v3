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
import {
  AmbitoTerritorial,
  Perfil,
  UsuarioSodega,
  perfilRequiereAmbito,
  perfilSoloRegion,
  toTitleCase,
} from '../../core/models/usuario-sodega.model';
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

const INP_MANDATORY = 'w-full bg-amber-50 border-[1.5px] border-amber-200 p-2 rounded-lg text-xs font-bold outline-none focus:bg-white focus:border-[#007287] focus:ring-2 focus:ring-[#007287]/15 text-slate-700 transition';
const INP_DISABLED = 'w-full bg-slate-100 text-slate-500 border border-slate-200 p-2 rounded-lg text-xs font-semibold outline-none cursor-not-allowed opacity-80';
const INP_NORMAL = 'w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-teal-500';

/**
 * Formulario multi-pestaña de Gestión de Usuarios (Datos del usuario / Permisos).
 * Modos: nuevo · editar · presupuesto (nueva partida presupuestal para un usuario existente).
 */
@Component({
  selector: 'app-usuario-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, LucideAngularModule, ModalComponent],
  template: `
    <section class="p-5 lg:p-6 max-w-[1200px] mx-auto">
      <h1 class="text-lg font-bold text-slate-800 uppercase border-b border-slate-200 pb-2 mb-3">{{ titulo() }}</h1>

      <div class="flex border-b border-slate-200 mb-4 text-xs font-bold uppercase">
        <button
          (click)="irAPestana('datos')"
          class="py-2.5 px-5 transition duration-150 cursor-pointer flex items-center gap-2 rounded-t-lg"
          [class]="tab() === 'datos' ? 'bg-[#007287] text-white shadow' : 'bg-slate-200 text-slate-600 hover:bg-slate-300 hover:text-slate-900'"
        >
          <lucide-angular [img]="IdCardIcon" class="size-4" /> Datos del usuario
        </button>
        <button
          (click)="irAPestana('permisos')"
          class="py-2.5 px-5 transition duration-150 cursor-pointer flex items-center gap-2 rounded-t-lg"
          [class]="tab() === 'permisos' ? 'bg-[#007287] text-white shadow' : 'bg-slate-200 text-slate-600 hover:bg-slate-300 hover:text-slate-900'"
        >
          <lucide-angular [img]="KeyRoundIcon" class="size-4" /> Permisos
        </button>
      </div>

      <!-- ================= PESTAÑA A: DATOS DEL USUARIO ================= -->
      @if (tab() === 'datos') {
        <div class="space-y-4" [formGroup]="form">
          <!-- Datos personales -->
          <div class="border border-slate-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
            <h3 class="text-xs font-bold text-[#007287] flex items-center gap-2">
              <lucide-angular [img]="UserCheckIcon" class="size-4" /> Datos Personales
            </h3>

            <div class="grid grid-cols-12 gap-3.5">
              <div class="col-span-4">
                <label class="block text-[10px] font-bold text-slate-500 mb-1">Nro DNI <span class="text-red-500">*</span></label>
                <div class="flex gap-1.5 font-bold">
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
                    class="w-1/3 bg-[#0b0f19] hover:bg-[#1a2035] text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>{{ buscandoReniec() ? 'Buscando...' : 'Buscar' }}</span>
                    <lucide-angular [img]="buscandoReniec() ? LoaderIcon : SearchIcon" class="size-2.5 ml-1" [class.animate-spin]="buscandoReniec()" />
                  </button>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-12 gap-3.5">
              <div class="col-span-4">
                <label class="block text-[10px] font-bold text-slate-500 mb-1">Apellido paterno</label>
                <input formControlName="apePat" readonly placeholder="Apellido paterno" [class]="inpDisabled" />
              </div>
              <div class="col-span-4">
                <label class="block text-[10px] font-bold text-slate-500 mb-1">Apellido materno</label>
                <input formControlName="apeMat" readonly placeholder="Apellido materno" [class]="inpDisabled" />
              </div>
              <div class="col-span-4">
                <label class="block text-[10px] font-bold text-slate-500 mb-1">Nombre(s)</label>
                <input formControlName="nombres" readonly placeholder="Nombre(s)" [class]="inpDisabled" />
              </div>
            </div>

            <div class="grid grid-cols-12 gap-3.5">
              <div class="col-span-3">
                <label class="block text-[10px] font-bold text-slate-500 mb-1">Estado civil</label>
                <input formControlName="estCivil" readonly placeholder="Estado civil" [class]="inpDisabled" />
              </div>
              <div class="col-span-3">
                <label class="block text-[10px] font-bold text-slate-500 mb-1">Profesión - especialidad <span class="text-red-500">*</span></label>
                <select formControlName="profesion" [class]="reniecEditable() ? inpMandatory : inpDisabled">
                  <option value="">--Seleccione--</option>
                  @for (p of profesiones; track p) {
                    <option [value]="p">{{ p }}</option>
                  }
                </select>
              </div>
              <div class="col-span-3">
                <label class="block text-[10px] font-bold text-slate-500 mb-1">Dirección domiciliaria</label>
                <input formControlName="direccion" readonly placeholder="Dirección domiciliaria" [class]="inpDisabled" />
              </div>
              <div class="col-span-3">
                <label class="block text-[10px] font-bold text-slate-500 mb-1">Ubigeo RENIEC</label>
                <input formControlName="ubigeo" readonly placeholder="UBIGEO" [class]="inpDisabled" />
              </div>
            </div>

            <div class="grid grid-cols-12 gap-3.5">
              <div class="col-span-3">
                <label class="block text-[10px] font-bold text-slate-500 mb-1">Restricciones</label>
                <input formControlName="restricciones" readonly placeholder="Restricciones" [class]="inpDisabled" />
              </div>
              <div class="col-span-3">
                <label class="block text-[10px] font-bold text-slate-500 mb-1">Sexo <span class="text-red-500">*</span></label>
                <select formControlName="sexo" [class]="reniecEditable() ? inpMandatory : inpDisabled">
                  <option value="">--Seleccione--</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                </select>
              </div>
              <div class="col-span-3">
                <label class="block text-[10px] font-bold text-slate-500 mb-1">Fecha nac. (RENIEC)</label>
                <input formControlName="fechaNac" readonly placeholder="dd/mm/aaaa" [class]="inpDisabled" />
              </div>
              <div class="col-span-3">
                <label class="block text-[10px] font-bold text-slate-500 mb-1">Edad calculada</label>
                <input formControlName="edad" readonly placeholder="Edad calculada" [class]="inpDisabled" />
              </div>
            </div>

            <div class="grid grid-cols-12">
              <div class="col-span-3">
                <label class="block text-[10px] font-bold text-slate-500 mb-1">Celular de contacto</label>
                <input formControlName="celular" placeholder="999 999 999" [class]="inpNormal" />
              </div>
            </div>
          </div>

          <!-- Datos presupuestales -->
          <div class="border border-slate-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
            <h3 class="text-xs font-bold text-[#007287] flex items-center gap-2">
              <lucide-angular [img]="WalletIcon" class="size-4" /> Datos Presupuestales
            </h3>
            <div>
              <label class="block text-[10px] font-bold text-slate-500 mb-1">Unidad Responsable <span class="text-red-500">*</span></label>
              <select formControlName="unidad" [class]="unidadBloqueada() ? inpDisabled : inpMandatory">
                <option value="">--Seleccione--</option>
                @for (u of unidadesResponsables; track u) {
                  <option [value]="u">{{ u }}</option>
                }
              </select>
            </div>

            @if (mostrarPresupuesto()) {
              <div class="grid grid-cols-4 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <label class="block text-[10px] font-bold text-slate-500 mb-1">Fuente de financ. <span class="text-red-500">*</span></label>
                  <select formControlName="fuenteFinanc" [class]="presupuestoBloqueado() ? inpDisabled : inpMandatory">
                    <option value="">Seleccione</option>
                    @for (f of fuentes; track f) {
                      <option [value]="f">{{ f }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-slate-500 mb-1">Categoría presup. <span class="text-red-500">*</span></label>
                  <select formControlName="categoriaPresup" (change)="onCategoriaChange()" [class]="presupuestoBloqueado() ? inpDisabled : inpMandatory">
                    <option value="">Seleccione</option>
                    @for (c of categorias; track c) {
                      <option [value]="c">{{ c }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-slate-500 mb-1">Programa presupuestal <span class="text-red-500">*</span></label>
                  <select formControlName="programaPresup" (change)="onProgramaChange()" [class]="presupuestoBloqueado() || !programaHabilitado() ? inpDisabled : inpMandatory">
                    <option value="">Seleccione</option>
                    @for (p of programas; track p) {
                      <option [value]="p">{{ p }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-[#007287] mb-1">Unidad funcional (Opas) <span class="text-red-500">*</span></label>
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
            <button (click)="cancelar()" class="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition">
              Cancelar
            </button>
            <button (click)="guardarYContinuar()" class="px-6 py-2.5 bg-[#007287] hover:bg-teal-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5">
              <span>Siguiente</span> <lucide-angular [img]="ArrowRightIcon" class="size-3.5" />
            </button>
          </div>
        </div>
      }

      <!-- ================= PESTAÑA B: PERMISOS ================= -->
      @if (tab() === 'permisos') {
        <div class="space-y-4" [formGroup]="form">
          <div class="border border-slate-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
            <h3 class="text-xs font-bold text-[#007287] flex items-center gap-2">
              <lucide-angular [img]="ShieldHalfIcon" class="size-4" /> Cuenta de acceso institucional
            </h3>

            <div class="grid grid-cols-12 gap-4">
              <div class="col-span-3">
                <label class="block text-[10px] font-bold text-slate-500 mb-1">Usuario generado</label>
                <input formControlName="userGen" readonly placeholder="Usuario Automático" [class]="inpDisabled" />
              </div>
              <div class="col-span-3">
                <label class="block text-[10px] font-bold text-slate-500 mb-1">Correo Personal <span class="text-red-500">*</span></label>
                <input formControlName="correo" placeholder="correo@midagri.gob.pe" [class]="inpMandatory" />
              </div>
              <div class="col-span-3">
                <label class="block text-[10px] font-bold text-slate-500 mb-1">Régimen laboral <span class="text-red-500">*</span></label>
                <select formControlName="regimen" (change)="formTick.set(formTick() + 1)" [class]="inpMandatory">
                  <option value="">--Seleccione--</option>
                  @for (r of regimenes; track r) {
                    <option [value]="r">{{ r }}</option>
                  }
                </select>
              </div>
              <div class="col-span-3">
                <label class="block text-[10px] font-bold text-slate-500 mb-1">Estado de cuenta</label>
                <select formControlName="estado" [class]="inpNormal">
                  <option value="HABILITADO">Habilitado</option>
                  <option value="INHABILITADO">Inhabilitado</option>
                </select>
              </div>
            </div>

            <!-- Fechas de contrato / Nro de orden (OS y CAS Temporal) -->
            @if (regimenTemporal()) {
              <div class="grid grid-cols-12 gap-4 p-4 bg-teal-50/55 rounded-xl border border-teal-100 font-bold">
                <div [class]="esLocador() ? 'col-span-4' : 'col-span-6'">
                  <label class="block text-[10px] font-bold text-[#007287] mb-1">Fecha de inicio <span class="text-red-500">*</span></label>
                  <input type="date" formControlName="fechaIni" class="w-full p-2 bg-white border border-[#007287]/30 rounded-lg text-xs font-bold outline-none" />
                </div>
                <div [class]="esLocador() ? 'col-span-4' : 'col-span-6'">
                  <label class="block text-[10px] font-bold text-[#007287] mb-1">Fecha fin <span class="text-red-500">*</span></label>
                  <input type="date" formControlName="fechaFin" class="w-full p-2 bg-white border border-[#007287]/30 rounded-lg text-xs font-bold outline-none" />
                </div>
                @if (esLocador()) {
                  <div class="col-span-4">
                    <label class="block text-[10px] font-bold text-[#007287] mb-1">Nro. de Orden (O.S.) <span class="text-red-500">*</span></label>
                    <input formControlName="nroOrden" placeholder="Ejem: O.S. N° 00421-2026" class="w-full p-2 bg-white border border-[#007287]/30 rounded-lg text-xs font-bold outline-none uppercase" />
                  </div>
                }
              </div>
            }

            <!-- Perfil autorizado + Ámbito asignado -->
            <div class="grid grid-cols-12 gap-6 items-start border-t border-slate-100 pt-5">
              <div class="col-span-5 space-y-1">
                <label class="block text-[10px] font-bold text-[#007287] mb-1">Perfil autorizado <span class="text-red-500">*</span></label>
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
                      <label class="block text-[10px] font-bold text-slate-500 mb-1">Región</label>
                      <select
                        [value]="ambitoRegion()"
                        (change)="ambitoRegion.set($any($event.target).value); ambitoProvincia.set(''); ambitoDistrito.set('')"
                        class="w-full border border-slate-200 p-2 rounded-lg text-xs font-bold bg-white text-slate-700 outline-none focus:ring-1 focus:ring-teal-500"
                      >
                        <option value="">Seleccione</option>
                        @for (r of regiones; track r) {
                          <option [value]="r">{{ r }}</option>
                        }
                      </select>
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 mb-1">Provincia</label>
                      <select
                        [value]="ambitoProvincia()"
                        (change)="ambitoProvincia.set($any($event.target).value); ambitoDistrito.set('')"
                        [disabled]="soloRegion() || !ambitoRegion()"
                        class="w-full border border-slate-200 p-2 rounded-lg text-xs font-bold bg-white text-slate-700 outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Seleccione</option>
                        @for (p of provinciasDisponibles(); track p) {
                          <option [value]="p">{{ p }}</option>
                        }
                      </select>
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 mb-1">Distrito</label>
                      <select
                        [value]="ambitoDistrito()"
                        (change)="ambitoDistrito.set($any($event.target).value)"
                        [disabled]="soloRegion() || !ambitoProvincia()"
                        class="w-full border border-slate-200 p-2 rounded-lg text-xs font-bold bg-white text-slate-700 outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
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
                      class="bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold px-5 py-2 rounded-full text-xs flex items-center gap-1.5 shadow-sm transition"
                    >
                      <span>Agregar</span>
                      <lucide-angular [img]="SquarePlusIcon" class="size-4 text-slate-700" />
                    </button>
                  </div>

                  <div class="mt-2 border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                    <table class="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr class="bg-slate-200 text-slate-700 font-bold border-b border-slate-300">
                          <th class="p-2.5 w-1/3 text-center">Región</th>
                          <th class="p-2.5 w-1/3 text-center">Provincia</th>
                          <th class="p-2.5 w-1/3 text-center">Distrito</th>
                          <th class="p-2.5 w-12 text-center"></th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100 font-bold text-slate-600">
                        @if (ambitos().length === 0) {
                          <tr>
                            <td colspan="4" class="p-3 text-center text-slate-400 font-bold">Sin ámbitos territoriales asignados.</td>
                          </tr>
                        }
                        @for (amb of ambitos(); track $index; let i = $index) {
                          <tr class="hover:bg-slate-50 transition-colors divide-x divide-slate-100">
                            <td class="p-2.5 text-slate-700 text-center">{{ amb.region }}</td>
                            <td class="p-2.5 text-slate-700 text-center">{{ amb.provincia }}</td>
                            <td class="p-2.5 text-slate-700 text-center">{{ amb.distrito }}</td>
                            <td class="p-2 text-center">
                              <button type="button" (click)="eliminarAmbito(i)" class="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition" title="Eliminar ámbito">
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
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button (click)="irAPestana('datos')" class="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5">
              <lucide-angular [img]="ArrowLeftIcon" class="size-3.5" /> Atrás
            </button>
            <button (click)="guardarRegistroCompleto()" class="px-6 py-2.5 bg-[#7bb31a] hover:bg-[#689914] text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5">
              <lucide-angular [img]="SaveIcon" class="size-3.5" />
              <span>{{ modo() === 'editar' ? 'Guardar Cambios' : 'Guardar Registro' }}</span>
            </button>
          </div>
        </div>
      }

      <!-- Modal de alerta -->
      @if (alerta(); as a) {
        <app-modal [title]="a.titulo" maxWidth="max-w-md" (closed)="cerrarAlerta()">
          <p class="text-xs text-slate-600 leading-relaxed font-semibold">{{ a.mensaje }}</p>
          <div class="flex justify-center mt-5">
            <button (click)="cerrarAlerta()" class="px-6 py-2.5 bg-[#007287] hover:bg-teal-800 text-white font-bold rounded-xl text-xs transition min-w-[120px]">
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

  readonly profesiones = PROFESIONES;
  readonly regimenes = REGIMENES_LABORALES;
  readonly fuentes = FUENTES_FINANCIAMIENTO;
  readonly categorias = CATEGORIAS_PRESUPUESTALES;
  readonly programas = PROGRAMAS_MAESTROS;
  readonly unidadesResponsables = UNIDADES_RESPONSABLES;
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

  /** Sección presupuestal visible salvo Admin General o Jefe de Área creado por Admin General. */
  readonly mostrarPresupuesto = computed(() => {
    this.formTick();
    const target = this.form.controls.perfil.value;
    const s = this.auth.session();
    if (target === 'Administrador General') return false;
    if (s?.perfil === 'Administrador General' && target === 'Jefe de Área') return false;
    const perfilesGestion = ['Jefe de Área', 'Administrador Unidad Organizacional', 'Administrador DZ_Cap_Asit.', 'Técnico Capacitación y Asistencia Técnica'];
    return perfilesGestion.includes(s?.perfil ?? '') || perfilesGestion.includes(target) || target === '';
  });

  readonly programaHabilitado = computed(() => {
    this.formTick();
    return this.form.controls.categoriaPresup.value === 'Programa Presupuestal';
  });

  readonly unidadesFuncionales = computed<string[]>(() => {
    this.formTick();
    const cat = this.form.controls.categoriaPresup.value;
    const prog = this.form.controls.programaPresup.value;
    if (cat === 'Programa Presupuestal' && prog) {
      return UNIDADES_POR_PROGRAMA[prog] ?? UNIDADES_FUNCIONALES_MAESTRAS;
    }
    return UNIDADES_FUNCIONALES_MAESTRAS;
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
