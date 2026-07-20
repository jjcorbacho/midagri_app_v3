import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, Search } from 'lucide-angular';
import { Participante, TipoParticipante } from '../../../core/models/participante.model';
import { ProductoresService } from '../../../core/services/productores.service';
import { ToastService } from '../../../core/services/toast.service';
import { calcEdad } from '../../../shared/utils/fecha.util';
import { INPUT_BASE, INPUT_DISABLED, INPUT_REQUIRED } from '../../../shared/utils/input-styles.const';
import {
  ACTIVIDAD_OTRO_PARTICIPANTE,
  CRIANZAS_PARTICIPANTE,
  NIVELES_INSTRUCCION,
  PRINCIPAL_ACTIVIDAD,
  TIPOS_ORGANIZACION,
  TIPOS_PARTICIPANTE,
} from '../../../core/constants/catalogos.const';

export type ParticipanteFormMode = 'nuevo' | 'editar' | 'ver';

export interface ParticipanteFormSubmit {
  tipoParticipante: TipoParticipante;
  dni: string;
  apellidos: string;
  nombres: string;
  fechaNacimiento: string;
  primActividad: string;
}

/* Estilos de input del design system compartido (sin variantes locales). */
const LOCKED_INPUT = INPUT_DISABLED;
const ACTIVE_INPUT = INPUT_BASE;
const REQUIRED_INPUT = INPUT_REQUIRED;

@Component({
  selector: 'app-participante-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, LucideAngularModule],
  template: `
    <div>
      <form class="p-6 space-y-8" [formGroup]="form" (ngSubmit)="guardar()">
        <section class="space-y-4">
          <div class="flex items-center gap-2 border-b border-brand/15 pb-2">
            <span class="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">1</span>
            <h3 class="text-brand font-bold uppercase text-sm tracking-wide">Identidad y Demográficos</h3>
          </div>

          @if (mode() === 'nuevo') {
            <!-- DNI a ancho completo en una única fila (apila en móvil) -->
            <div class="bg-brand-soft/60 p-4 rounded-lg border border-brand/15 space-y-2">
              <div class="flex flex-col md:flex-row md:items-end gap-3">
                <div class="flex-1 min-w-0">
                  <label class="block text-xs font-semibold text-foreground mb-1">DNI (8 dígitos) <span class="text-destructive">*</span></label>
                  <input
                    type="text" inputmode="numeric" maxlength="8" placeholder="Ingrese DNI"
                    formControlName="dni"
                    (input)="soloDigitos()"
                    [class]="(dniLocked() ? lockedInput : requiredCls(false)) + ' font-mono w-full'"
                  />
                </div>
                <button type="button" (click)="buscarDNI()" [disabled]="dniLocked()"
                  class="btn-primary shrink-0 px-5">
                  <lucide-angular [img]="SearchIcon" class="size-4" />
                  Buscar
                </button>
                <button type="button" (click)="limpiar()"
                  class="btn-secondary shrink-0">
                  Limpiar
                </button>
              </div>
              @if (errors()['dni']) {
                <p class="text-[11px] text-destructive">{{ errors()['dni'] }}</p>
              }
              <p class="text-xs font-medium italic">
                @switch (busqueda()) {
                  @case ('ok') {
                    <span class="text-success">✓ Encontrado en la base de datos de Productores</span>
                  }
                  @case ('no-encontrado') {
                    <span class="text-warning-foreground">⚠ DNI no encontrado. Puede registrarlo manualmente.</span>
                  }
                  @default {
                    <span class="text-brand">* Ingrese el DNI para autocompletar.</span>
                  }
                }
              </p>
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label class="block">
                <span class="block text-xs font-semibold text-foreground mb-1">DNI</span>
                <input disabled [value]="form.controls.dni.value" [class]="lockedInput" />
              </label>
              @if (busqueda() === 'ok') {
                <div class="md:col-span-2 flex items-end text-xs italic text-success">
                  ✓ Encontrado en la base de datos de Productores
                </div>
              }
            </div>
          }

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="block">
              <span class="block text-xs font-semibold text-foreground mb-1">Apellidos <span class="text-destructive">*</span></span>
              <input formControlName="apellidos" [class]="requiredCls(demoLocked())" />
              @if (errors()['apellidos']) {
                <p class="text-[11px] text-destructive mt-1">{{ errors()['apellidos'] }}</p>
              }
            </label>
            <label class="block">
              <span class="block text-xs font-semibold text-foreground mb-1">Nombres <span class="text-destructive">*</span></span>
              <input formControlName="nombres" [class]="requiredCls(demoLocked())" />
              @if (errors()['nombres']) {
                <p class="text-[11px] text-destructive mt-1">{{ errors()['nombres'] }}</p>
              }
            </label>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <label class="block">
              <span class="block text-xs font-semibold text-foreground mb-1">Sexo</span>
              <select formControlName="sexo" [class]="inputCls(demoLocked())">
                <option value="">—</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
              </select>
            </label>
            <label class="block">
              <span class="block text-xs font-semibold text-foreground mb-1">Edad</span>
              <input disabled [value]="edad() ? edad() + ' años' : ''" [class]="lockedInput" />
            </label>
            <label class="block">
              <span class="block text-xs font-semibold text-foreground mb-1">Fecha Nacimiento <span class="text-destructive">*</span></span>
              <input type="date" formControlName="fechaNacimiento" [class]="requiredCls(demoLocked())" />
              @if (errors()['fecha']) {
                <p class="text-[11px] text-destructive mt-1">{{ errors()['fecha'] }}</p>
              }
            </label>
            <label class="block">
              <span class="block text-xs font-semibold text-foreground mb-1">Estado Civil</span>
              <input formControlName="estadoCivil" [class]="inputCls(demoLocked())" />
            </label>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="block">
              <span class="block text-xs font-semibold text-foreground mb-1">Ubigeo</span>
              <input formControlName="ubigeo" [class]="inputCls(demoLocked())" />
            </label>
            <label class="block">
              <span class="block text-xs font-semibold text-foreground mb-1">Dirección</span>
              <input formControlName="direccion" [class]="inputCls(demoLocked())" />
            </label>
          </div>
          <label class="block">
            <span class="block text-xs font-semibold text-foreground mb-1">Restricciones</span>
            <input formControlName="restricciones" [class]="inputCls(demoLocked())" />
          </label>
        </section>

        <section class="space-y-4 pt-2">
          <div class="flex items-center gap-2 border-b border-brand/15 pb-2">
            <span class="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">2</span>
            <h3 class="text-brand font-bold uppercase text-sm tracking-wide">Datos técnicos y comerciales</h3>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label class="block">
              <span class="block text-xs font-semibold text-foreground mb-1">Tipo Participante</span>
              <select formControlName="tipo" [class]="inputCls(false)">
                @for (t of tiposParticipante; track t) {
                  <option [value]="t">{{ t }}</option>
                }
              </select>
            </label>
            @if (tipoActual() === 'OTRO') {
              <label class="block">
                <span class="block text-xs font-semibold text-foreground mb-1">Actividad Otro Participante</span>
                <select formControlName="actividadOtro" [class]="inputCls(false)">
                  <option value="">— Seleccione —</option>
                  @for (a of actividadesOtro; track a) {
                    <option [value]="a">{{ a }}</option>
                  }
                </select>
              </label>
            }
            @if (tipoActual() === 'PRODUCTOR') {
              <label class="block">
                <span class="block text-xs font-semibold text-foreground mb-1">Principal Actividad</span>
                <select formControlName="primActividad" [class]="inputCls(false)">
                  <option value="">— Seleccione —</option>
                  @for (a of principalActividad; track a) {
                    <option [value]="a">{{ a }}</option>
                  }
                </select>
              </label>
            }
          </div>

          @if (tipoActual() === 'PRODUCTOR') {
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label class="block">
                <span class="block text-xs font-semibold text-foreground mb-1">Nombre cultivo principal</span>
                <input formControlName="cultivo" placeholder="Ej. Papa nativa" [class]="inputCls(false)" />
              </label>
              <label class="block">
                <span class="block text-xs font-semibold text-foreground mb-1">Principal plantación forestal</span>
                <input formControlName="plantacion" placeholder="Ej. Pino" [class]="inputCls(false)" />
              </label>
              <div class="hidden md:block"></div>
              <label class="block">
                <span class="block text-xs font-semibold text-foreground mb-1">Crianza principal</span>
                <select formControlName="crianzaPrincipal" [class]="inputCls(false)">
                  <option value="">— Seleccione —</option>
                  @for (c of crianzas; track c) {
                    <option [value]="c">{{ c }}</option>
                  }
                </select>
              </label>
              <label class="block">
                <span class="block text-xs font-semibold text-foreground mb-1">Crianza secundaria</span>
                <select formControlName="crianzaSecundaria" [class]="inputCls(false)">
                  <option value="">— Seleccione —</option>
                  @for (c of crianzas; track c) {
                    <option [value]="c">{{ c }}</option>
                  }
                </select>
              </label>
            </div>
          }
        </section>

        <section class="space-y-4 pt-2">
          <div class="flex items-center gap-2 border-b border-brand/15 pb-2">
            <span class="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">3</span>
            <h3 class="text-brand font-bold uppercase text-sm tracking-wide">Organización y participación social</h3>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <label class="block">
              <span class="block text-xs font-semibold text-foreground mb-1">¿Está asociado?</span>
              <div class="flex gap-4 py-2">
                <label class="inline-flex items-center text-sm">
                  <input type="radio" value="SI" formControlName="asociado" class="text-brand focus:ring-ring" />
                  <span class="ml-2 text-muted-foreground">SI</span>
                </label>
                <label class="inline-flex items-center text-sm">
                  <input type="radio" value="NO" formControlName="asociado" class="text-brand focus:ring-ring" />
                  <span class="ml-2 text-muted-foreground">NO</span>
                </label>
              </div>
            </label>
            @if (asociadoActual() === 'SI') {
              <label class="block">
                <span class="block text-xs font-semibold text-foreground mb-1">Tipo de Organización</span>
                <select formControlName="tipoOrg" [class]="inputCls(false)">
                  <option value="">— Seleccione —</option>
                  @for (t of tiposOrganizacion; track t) {
                    <option [value]="t">{{ t }}</option>
                  }
                </select>
                @if (errors()['tipoOrg']) {
                  <p class="text-[11px] text-destructive mt-1">{{ errors()['tipoOrg'] }}</p>
                }
              </label>
              <label class="block">
                <span class="block text-xs font-semibold text-foreground mb-1">Nombre de Organización</span>
                <input formControlName="nombreOrg" maxlength="160" [class]="inputCls(false)" />
                @if (errors()['nombreOrg']) {
                  <p class="text-[11px] text-destructive mt-1">{{ errors()['nombreOrg'] }}</p>
                }
              </label>
            }
          </div>
        </section>

        <section class="space-y-4 pt-2">
          <div class="flex items-center gap-2 border-b border-brand/15 pb-2">
            <span class="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">4</span>
            <h3 class="text-brand font-bold uppercase text-sm tracking-wide">Información adicional</h3>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="block">
              <span class="block text-xs font-semibold text-foreground mb-1">Nivel de instrucción</span>
              <select formControlName="nivelInstr" [class]="inputCls(false)">
                <option value="">— Seleccione —</option>
                @for (n of nivelesInstruccion; track n) {
                  <option [value]="n">{{ n }}</option>
                }
              </select>
            </label>
            <label class="block">
              <span class="block text-xs font-semibold text-foreground mb-1">Centro poblado</span>
              <input formControlName="centroPobl" [class]="inputCls(false)" />
            </label>
          </div>
        </section>
      </form>

      <div class="bg-surface-2 border-t border-border px-6 py-4 flex justify-end gap-3">
        <button
          type="button"
          (click)="cancelled.emit()"
          class="btn-ghost px-5"
        >
          {{ cancelLabel() ?? (mode() === 'ver' ? 'Volver' : 'Cancelar') }}
        </button>
        @if (mode() !== 'ver') {
          <button
            type="button"
            (click)="guardar()"
            class="btn-primary px-6"
          >
            {{ submitLabel() ?? (mode() === 'editar' ? 'Guardar cambios' : 'Registrar participante') }}
          </button>
        }
      </div>
    </div>
  `,
})
export class ParticipanteFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly productores = inject(ProductoresService);
  private readonly toast = inject(ToastService);

  readonly mode = input.required<ParticipanteFormMode>();
  readonly otrosExistentes = input<Participante[]>([]);
  readonly submitLabel = input<string | undefined>(undefined);
  readonly cancelLabel = input<string | undefined>(undefined);
  readonly resetOnSubmit = input(false);

  readonly submitted = output<ParticipanteFormSubmit>();
  readonly cancelled = output<void>();

  readonly SearchIcon = Search;
  readonly lockedInput = LOCKED_INPUT;

  readonly tiposParticipante = TIPOS_PARTICIPANTE;
  readonly actividadesOtro = ACTIVIDAD_OTRO_PARTICIPANTE;
  readonly principalActividad = PRINCIPAL_ACTIVIDAD;
  readonly crianzas = CRIANZAS_PARTICIPANTE;
  readonly tiposOrganizacion = TIPOS_ORGANIZACION;
  readonly nivelesInstruccion = NIVELES_INSTRUCCION;

  readonly dniLocked = signal(false);
  readonly busqueda = signal<null | 'ok' | 'no-encontrado'>(null);
  readonly demoLocked = signal(false);
  readonly errors = signal<Record<string, string>>({});
  private readonly formTick = signal(0);

  readonly form = this.fb.nonNullable.group({
    dni: '',
    apellidos: '',
    nombres: '',
    sexo: '',
    fechaNacimiento: '',
    estadoCivil: '',
    ubigeo: '',
    direccion: '',
    restricciones: '',
    tipo: 'PRODUCTOR' as TipoParticipante,
    actividadOtro: '',
    primActividad: '',
    cultivo: '',
    plantacion: '',
    crianzaPrincipal: '',
    crianzaSecundaria: '',
    asociado: 'NO' as 'SI' | 'NO',
    tipoOrg: '',
    nombreOrg: '',
    nivelInstr: '',
    centroPobl: '',
  });

  readonly edad = computed(() => {
    this.formTick();
    return calcEdad(this.form.controls.fechaNacimiento.value);
  });
  readonly tipoActual = computed(() => {
    this.formTick();
    return this.form.controls.tipo.value;
  });
  readonly asociadoActual = computed(() => {
    this.formTick();
    return this.form.controls.asociado.value;
  });

  constructor() {
    this.form.valueChanges.subscribe(() => this.formTick.update((t) => t + 1));
  }

  inputCls(locked: boolean): string {
    return locked || this.mode() === 'ver' ? LOCKED_INPUT : ACTIVE_INPUT;
  }

  /** Campos obligatorios: ámbar cuando son editables, neutro cuando están bloqueados. */
  requiredCls(locked: boolean): string {
    return locked || this.mode() === 'ver' ? LOCKED_INPUT : REQUIRED_INPUT;
  }

  soloDigitos(): void {
    const v = this.form.controls.dni.value.replace(/\D/g, '');
    if (v !== this.form.controls.dni.value) this.form.controls.dni.setValue(v);
  }

  /** Busca el DNI en el padrón de productores y autocompleta (GET /productores/{dni}). */
  buscarDNI(): void {
    const dni = this.form.controls.dni.value;
    if (!/^\d{8}$/.test(dni)) {
      this.errors.set({ dni: 'DNI debe tener 8 dígitos.' });
      return;
    }
    if (this.otrosExistentes().some((x) => x.dni === dni)) {
      this.errors.set({ dni: 'Este DNI ya está registrado en el evento.' });
      this.toast.warning('Este participante ya está registrado en el evento.');
      return;
    }
    this.errors.set({});
    const prod = this.productores.findByDni(dni);
    if (prod) {
      this.form.patchValue({
        apellidos: prod.apellidos,
        nombres: prod.nombres,
        fechaNacimiento: prod.fechaNacimiento,
        sexo: prod.sexo,
        primActividad: prod.primActividad,
        estadoCivil: prod.estadoCivil ?? '',
        ubigeo: prod.ubigeo ?? '',
        direccion: prod.direccion ?? '',
        restricciones: prod.restricciones ?? 'Ninguna',
      });
      this.busqueda.set('ok');
      this.demoLocked.set(true);
      this.toast.success('Encontrado en la base de datos de Productores');
    } else {
      this.busqueda.set('no-encontrado');
      this.demoLocked.set(false);
    }
    this.dniLocked.set(true);
    this.form.controls.dni.disable();
  }

  limpiar(): void {
    this.form.reset({
      dni: '', apellidos: '', nombres: '', sexo: '', fechaNacimiento: '',
      estadoCivil: '', ubigeo: '', direccion: '', restricciones: '',
      tipo: 'PRODUCTOR', actividadOtro: '', primActividad: '',
      cultivo: '', plantacion: '', crianzaPrincipal: '', crianzaSecundaria: '',
      asociado: 'NO', tipoOrg: '', nombreOrg: '', nivelInstr: '', centroPobl: '',
    });
    this.form.controls.dni.enable();
    this.dniLocked.set(false);
    this.busqueda.set(null);
    this.demoLocked.set(false);
    this.errors.set({});
  }

  /** Rellena con un productor del padrón (botón "Autocompletar" del stepper). */
  simular(): void {
    if (this.mode() === 'ver') return;
    const usados = new Set(this.otrosExistentes().map((x) => x.dni));
    const disponibles = this.productores.all().filter((p) => !usados.has(p.dni));
    const prod = disponibles[Math.floor(Math.random() * disponibles.length)] ?? this.productores.all()[0];
    if (!prod) return;
    this.form.controls.dni.enable();
    this.form.patchValue({
      dni: prod.dni,
      apellidos: prod.apellidos,
      nombres: prod.nombres,
      fechaNacimiento: prod.fechaNacimiento,
      sexo: prod.sexo,
      primActividad: prod.primActividad || 'AGRÍCOLA',
      estadoCivil: prod.estadoCivil ?? 'Soltero(a)',
      ubigeo: prod.ubigeo ?? '030101',
      direccion: prod.direccion ?? 'Av. Los Olivos s/n',
      restricciones: prod.restricciones ?? 'Ninguna',
      tipo: 'PRODUCTOR',
      cultivo: 'Papa nativa',
      plantacion: 'Eucalipto',
      crianzaPrincipal: 'VACUNOS DE LECHE',
      crianzaSecundaria: 'OVINOS',
      asociado: 'SI',
      tipoOrg: 'ASOCIACIÓN',
      nombreOrg: 'Asociación de Productores Andinos',
      nivelInstr: 'SECUNDARIA COMPLETA',
      centroPobl: 'Centro Poblado Los Andes',
    });
    this.form.controls.dni.disable();
    this.dniLocked.set(true);
    this.busqueda.set('ok');
    this.demoLocked.set(true);
    this.errors.set({});
    this.toast.success('Datos del participante simulados');
  }

  guardar(): void {
    if (this.mode() === 'ver') {
      this.cancelled.emit();
      return;
    }
    const v = this.form.getRawValue();
    const e: Record<string, string> = {};
    if (!/^\d{8}$/.test(v.dni)) e['dni'] = 'DNI debe tener 8 dígitos.';
    if (this.mode() === 'nuevo' && !this.dniLocked()) e['dni'] = 'Primero busque el DNI para autocompletar los datos.';
    if (!v.apellidos.trim()) e['apellidos'] = 'Obligatorio.';
    if (!v.nombres.trim()) e['nombres'] = 'Obligatorio.';
    if (!v.fechaNacimiento) e['fecha'] = 'Fecha de nacimiento requerida.';
    if (v.asociado === 'SI' && !v.tipoOrg) e['tipoOrg'] = 'Indique tipo de organización.';
    if (v.asociado === 'SI' && !v.nombreOrg.trim()) e['nombreOrg'] = 'Indique nombre de la organización.';
    if (this.mode() === 'nuevo' && this.otrosExistentes().some((x) => x.dni === v.dni))
      e['dni'] = 'Este DNI ya está registrado en el evento.';
    this.errors.set(e);
    if (Object.keys(e).length > 0) return;

    this.submitted.emit({
      tipoParticipante: v.tipo,
      dni: v.dni,
      apellidos: v.apellidos,
      nombres: v.nombres,
      fechaNacimiento: v.fechaNacimiento,
      primActividad: v.primActividad || v.actividadOtro || v.cultivo || v.crianzaPrincipal,
    });
    if (this.resetOnSubmit()) this.limpiar();
  }
}
