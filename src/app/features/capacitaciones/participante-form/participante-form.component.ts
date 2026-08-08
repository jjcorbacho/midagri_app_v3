import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DATE_LOCALE, ErrorStateMatcher, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { Participante, TipoParticipante } from '../../../core/models/participante.model';
import { ProductoresService } from '../../../core/services/productores.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalService } from '../../../core/services/modal.service';
import { calcEdad, dateAIso, isoADate } from '../../../shared/utils/fecha.util';
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

/** Campos que llegan del padrón de productores y no se reescriben a mano. */
const CAMPOS_DEMOGRAFICOS = [
  'apellidos',
  'nombres',
  'sexo',
  'fechaNacimiento',
  'estadoCivil',
  'ubigeo',
  'direccion',
  'restricciones',
] as const;

@Component({
  selector: 'app-participante-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'es-PE' }],
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="guardar()">
      <!-- 1. Identidad y demográficos -->
      <section>
        <header class="seccion">
          <span class="numero">1</span>
          <h3>Identidad y Demográficos</h3>
        </header>

        @if (mode() === 'nuevo') {
          <!-- DNI a ancho completo en una única fila (apila en móvil) -->
          <div class="bloque-dni">
            <div class="fila-dni">
              <mat-form-field subscriptSizing="dynamic" class="campo-dni">
                <mat-label>DNI (8 dígitos)</mat-label>
                <input
                  matInput
                  type="text"
                  inputmode="numeric"
                  maxlength="8"
                  required
                  placeholder="Ingrese DNI"
                  formControlName="dni"
                  [errorStateMatcher]="matcherDe('dni')"
                  (input)="soloDigitos()"
                />
                <mat-error>{{ errors()['dni'] }}</mat-error>
              </mat-form-field>
              <button matButton="filled" type="button" [disabled]="dniLocked()" (click)="buscarDNI()">
                <mat-icon fontSet="material-symbols-outlined">search</mat-icon>
                Buscar
              </button>
              <button matButton type="button" (click)="limpiar()">Limpiar</button>
            </div>
            @if (!busqueda()) {
              <p class="ayuda">* Ingrese el DNI para autocompletar.</p>
            }
          </div>
        } @else {
          <div class="rejilla tres">
            <mat-form-field>
              <mat-label>DNI</mat-label>
              <input matInput readonly [value]="form.controls.dni.value" />
            </mat-form-field>
            @if (busqueda() === 'ok') {
              <p class="encontrado">✓ Encontrado en la base de datos de Productores</p>
            }
          </div>
        }

        <div class="rejilla dos">
          <mat-form-field>
            <mat-label>Apellidos</mat-label>
            <input matInput required formControlName="apellidos" [errorStateMatcher]="matcherDe('apellidos')" />
            <mat-error>{{ errors()['apellidos'] }}</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Nombres</mat-label>
            <input matInput required formControlName="nombres" [errorStateMatcher]="matcherDe('nombres')" />
            <mat-error>{{ errors()['nombres'] }}</mat-error>
          </mat-form-field>
        </div>

        <div class="rejilla cuatro">
          <mat-form-field>
            <mat-label>Sexo</mat-label>
            <mat-select formControlName="sexo">
              <mat-option value="">—</mat-option>
              <mat-option value="Masculino">Masculino</mat-option>
              <mat-option value="Femenino">Femenino</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Edad</mat-label>
            <input matInput readonly [value]="edad() ? edad() + ' años' : ''" />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Fecha Nacimiento</mat-label>
            <input
              matInput
              required
              [matDatepicker]="dpNac"
              [disabled]="demoLocked() || mode() === 'ver'"
              [value]="fechaNacimientoDate()"
              [errorStateMatcher]="matcherDe('fecha')"
              (dateChange)="setFechaNacimiento($event.value)"
            />
            <mat-datepicker-toggle matIconSuffix [for]="dpNac" />
            <mat-datepicker #dpNac startView="multi-year" />
            <mat-error>{{ errors()['fecha'] }}</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Estado Civil</mat-label>
            <input matInput formControlName="estadoCivil" />
          </mat-form-field>
        </div>

        <div class="rejilla dos">
          <mat-form-field>
            <mat-label>Ubigeo</mat-label>
            <input matInput formControlName="ubigeo" />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Dirección</mat-label>
            <input matInput formControlName="direccion" />
          </mat-form-field>
        </div>

        <mat-form-field>
          <mat-label>Restricciones</mat-label>
          <input matInput formControlName="restricciones" />
        </mat-form-field>
      </section>

      <!-- 2. Datos técnicos y comerciales -->
      <section>
        <header class="seccion">
          <span class="numero">2</span>
          <h3>Datos técnicos y comerciales</h3>
        </header>

        <div class="rejilla tres">
          <mat-form-field>
            <mat-label>Tipo Participante</mat-label>
            <mat-select formControlName="tipo">
              @for (t of tiposParticipante; track t) {
                <mat-option [value]="t">{{ t }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          @if (tipoActual() === 'OTRO') {
            <mat-form-field>
              <mat-label>Actividad Otro Participante</mat-label>
              <mat-select formControlName="actividadOtro">
                <mat-option value="">— Seleccione —</mat-option>
                @for (a of actividadesOtro; track a) {
                  <mat-option [value]="a">{{ a }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          }
          @if (tipoActual() === 'PRODUCTOR') {
            <mat-form-field>
              <mat-label>Principal Actividad</mat-label>
              <mat-select formControlName="primActividad">
                <mat-option value="">— Seleccione —</mat-option>
                @for (a of principalActividad; track a) {
                  <mat-option [value]="a">{{ a }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          }
        </div>

        @if (tipoActual() === 'PRODUCTOR') {
          <div class="rejilla tres">
            <mat-form-field>
              <mat-label>Nombre cultivo principal</mat-label>
              <input matInput formControlName="cultivo" placeholder="Ej. Papa nativa" />
            </mat-form-field>
            <mat-form-field>
              <mat-label>Principal plantación forestal</mat-label>
              <input matInput formControlName="plantacion" placeholder="Ej. Pino" />
            </mat-form-field>
            <span class="hueco"></span>
            <mat-form-field>
              <mat-label>Crianza principal</mat-label>
              <mat-select formControlName="crianzaPrincipal">
                <mat-option value="">— Seleccione —</mat-option>
                @for (c of crianzas; track c) {
                  <mat-option [value]="c">{{ c }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field>
              <mat-label>Crianza secundaria</mat-label>
              <mat-select formControlName="crianzaSecundaria">
                <mat-option value="">— Seleccione —</mat-option>
                @for (c of crianzas; track c) {
                  <mat-option [value]="c">{{ c }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>
        }
      </section>

      <!-- 3. Organización y participación social -->
      <section>
        <header class="seccion">
          <span class="numero">3</span>
          <h3>Organización y participación social</h3>
        </header>

        <div class="rejilla tres">
          <div class="grupo-radio">
            <span class="etiqueta">¿Está asociado?</span>
            <mat-radio-group formControlName="asociado" aria-label="¿Está asociado?">
              <mat-radio-button value="SI">SI</mat-radio-button>
              <mat-radio-button value="NO">NO</mat-radio-button>
            </mat-radio-group>
          </div>
          @if (asociadoActual() === 'SI') {
            <mat-form-field>
              <mat-label>Tipo de Organización</mat-label>
              <mat-select formControlName="tipoOrg" [errorStateMatcher]="matcherDe('tipoOrg')">
                <mat-option value="">— Seleccione —</mat-option>
                @for (t of tiposOrganizacion; track t) {
                  <mat-option [value]="t">{{ t }}</mat-option>
                }
              </mat-select>
              <mat-error>{{ errors()['tipoOrg'] }}</mat-error>
            </mat-form-field>
            <mat-form-field>
              <mat-label>Nombre de Organización</mat-label>
              <input
                matInput
                maxlength="160"
                formControlName="nombreOrg"
                [errorStateMatcher]="matcherDe('nombreOrg')"
              />
              <mat-error>{{ errors()['nombreOrg'] }}</mat-error>
            </mat-form-field>
          }
        </div>
      </section>

      <!-- 4. Información adicional -->
      <section>
        <header class="seccion">
          <span class="numero">4</span>
          <h3>Información adicional</h3>
        </header>

        <div class="rejilla dos">
          <mat-form-field>
            <mat-label>Nivel de instrucción</mat-label>
            <mat-select formControlName="nivelInstr">
              <mat-option value="">— Seleccione —</mat-option>
              @for (n of nivelesInstruccion; track n) {
                <mat-option [value]="n">{{ n }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Centro poblado</mat-label>
            <input matInput formControlName="centroPobl" />
          </mat-form-field>
        </div>
      </section>

      <!--
        Cierre del formulario: contenido proyectado por el contenedor (el
        stepper inyecta aquí la declaración jurada del Paso 2). Queda después
        del bloque "4. Información adicional" y antes de la botonera.
      -->
      <ng-content />
    </form>

    <mat-divider />

    <div class="botonera">
      <button matButton type="button" (click)="cancelled.emit()">
        {{ cancelLabel() ?? (mode() === 'ver' ? 'Volver' : 'Cancelar') }}
      </button>
      @if (mode() !== 'ver') {
        <button matButton="filled" type="button" (click)="guardar()">
          {{ submitLabel() ?? (mode() === 'editar' ? 'Guardar cambios' : 'Registrar participante') }}
        </button>
      }
    </div>
  `,
  styles: `
    form {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 24px;
    }
    section { display: flex; flex-direction: column; gap: 4px; }

    .seccion {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }
    .seccion h3 {
      margin: 0;
      font: var(--mat-sys-label-large);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--mat-sys-primary);
    }
    .numero {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      font: var(--mat-sys-label-small);
      font-weight: 700;
    }

    .rejilla { display: grid; grid-template-columns: 1fr; gap: 0 16px; }
    @media (min-width: 768px) {
      .rejilla.dos { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .rejilla.tres { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .rejilla.cuatro { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    }
    @media (min-width: 480px) and (max-width: 767px) {
      .rejilla.cuatro { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    mat-form-field { width: 100%; }
    .hueco { display: none; }
    @media (min-width: 768px) { .hueco { display: block; } }

    .bloque-dni {
      padding: 16px;
      margin-bottom: 16px;
      border-radius: var(--mat-sys-corner-medium);
      background: var(--mat-sys-primary-container);
    }
    .fila-dni { display: flex; flex-direction: column; gap: 12px; }
    @media (min-width: 768px) { .fila-dni { flex-direction: row; align-items: center; } }
    .campo-dni { flex: 1 1 auto; }
    .campo-dni input { font-family: monospace; }
    .ayuda {
      margin: 8px 0 0;
      font: var(--mat-sys-body-small);
      font-style: italic;
      color: var(--mat-sys-on-primary-container);
    }
    .encontrado {
      margin: 0;
      align-self: center;
      font: var(--mat-sys-body-small);
      font-style: italic;
      color: var(--estado-aprobado);
    }

    .grupo-radio { display: flex; flex-direction: column; gap: 4px; padding-top: 4px; }
    .grupo-radio .etiqueta {
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }
    mat-radio-group { display: flex; gap: 16px; }

    .botonera {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      background: var(--mat-sys-surface-container-low);
    }
  `,
})
export class ParticipanteFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly productores = inject(ProductoresService);
  private readonly modales = inject(ModalService);
  private readonly toast = inject(ToastService);

  readonly mode = input.required<ParticipanteFormMode>();
  readonly otrosExistentes = input<Participante[]>([]);
  readonly submitLabel = input<string | undefined>(undefined);
  readonly cancelLabel = input<string | undefined>(undefined);
  readonly resetOnSubmit = input(false);

  readonly submitted = output<ParticipanteFormSubmit>();
  readonly cancelled = output<void>();

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
  /** La fecha de nacimiento vive en ISO; el calendario trabaja con Date. */
  readonly fechaNacimientoDate = computed(() => {
    this.formTick();
    return isoADate(this.form.controls.fechaNacimiento.value);
  });

  constructor() {
    this.form.valueChanges.subscribe(() => this.formTick.update((t) => t + 1));
    // Modo consulta: todo el formulario en solo lectura.
    effect(() => {
      if (this.mode() === 'ver') this.form.disable({ emitEvent: false });
    });
  }

  /**
   * La validación es propia (mensajes por campo en `errors`), así que el estado
   * de error de cada campo lo decide ese mapa y no los validadores del control.
   */
  private readonly matchers = new Map<string, ErrorStateMatcher>();

  matcherDe(campo: string): ErrorStateMatcher {
    let matcher = this.matchers.get(campo);
    if (!matcher) {
      matcher = { isErrorState: () => !!this.errors()[campo] };
      this.matchers.set(campo, matcher);
    }
    return matcher;
  }

  setFechaNacimiento(fecha: Date | null): void {
    this.form.patchValue({ fechaNacimiento: dateAIso(fecha) });
  }

  /** Los datos que llegan del padrón quedan en solo lectura. */
  private bloquearDemograficos(bloquear: boolean): void {
    this.demoLocked.set(bloquear);
    for (const campo of CAMPOS_DEMOGRAFICOS) {
      const control = this.form.controls[campo];
      if (bloquear) control.disable({ emitEvent: false });
      else control.enable({ emitEvent: false });
    }
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
      this.bloquearDemograficos(true);
      // Modal informativo estándar; al aceptar continúa la carga ya realizada.
      void this.modales.openInfo('DNI encontrado', 'DNI encontrado en la base de datos de productores.');
    } else {
      this.busqueda.set('no-encontrado');
      this.bloquearDemograficos(false);
      // Advertencia informativa (solo Aceptar); luego continúa el registro manual.
      void this.modales.openWarning(
        'DNI no encontrado',
        'El DNI ingresado no se encuentra en la base de datos de productores. Puede continuar registrando la información manualmente.',
        { soloAceptar: true },
      );
    }
    this.dniLocked.set(true);
    this.form.controls.dni.disable();
  }

  limpiar(): void {
    this.bloquearDemograficos(false);
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
    this.errors.set({});
  }

  /** Rellena con un productor del padrón (botón "Autocompletar" del stepper). */
  simular(): void {
    if (this.mode() === 'ver') return;
    const usados = new Set(this.otrosExistentes().map((x) => x.dni));
    const disponibles = this.productores.all().filter((p) => !usados.has(p.dni));
    const prod = disponibles[Math.floor(Math.random() * disponibles.length)] ?? this.productores.all()[0];
    if (!prod) return;
    this.bloquearDemograficos(false);
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
    this.bloquearDemograficos(true);
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
