import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DATE_LOCALE, ErrorStateMatcher, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { AreaService } from '../../../core/services/area.service';
import { ReglasService } from '../../../core/services/reglas.service';
import { CamposService } from '../../../core/services/campos.service';
import { CampoPersonalizado, FormularioKey } from '../../../core/models/campo.model';
import { DetalleEvento, TipoCurso } from '../../../core/models/curso.model';
import {
  TEMATICAS,
  TIPOS_EVENTO,
  MODALIDADES_AT,
  UBIGEO,
  getProvincias,
  getDistritos,
  getCentrosPoblados,
} from '../../../core/constants/catalogos.const';
import { PeruMapComponent } from '../../../shared/components/peru-map/peru-map.component';
import { ModalService } from '../../../core/services/modal.service';
import { dateAIso, isoADate } from '../../../shared/utils/fecha.util';
import { lngLatToUTM } from '../../../shared/utils/utm.util';

/** Estado completo del formulario del Paso 1 (mismo shape que el original). */
export type CursoFormState = DetalleEvento;

const EMPTY: CursoFormState = {
  codigo: '',
  tematica: '',
  tipoEvento: 'CURSO',
  modalidadAT: 'Individual',
  fecha: '',
  hora: '09:00',
  horas: 1,
  nombre: '',
  extensionista: '',
  observaciones: '',
  capacitacionVinculadaId: '',
  region: '',
  provincia: '',
  distrito: '',
  centroPoblado: '',
  utmZona: '18S',
  utmEste: '',
  utmNorte: '',
  longitud: '',
  latitud: '',
  altitud: '',
  archivoNombre: '',
  archivoRuta: '',
  custom: {},
};

@Component({
  selector: 'app-curso-form',
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
    MatRadioModule,
    MatSelectModule,
    PeruMapComponent,
  ],
  template: `
    <div class="formulario" [formGroup]="form">
      <!-- Reglas activas del área -->
      <mat-chip-set aria-label="Reglas activas del área">
        <mat-chip disableRipple>Horas: {{ cfg().horasMin }} – {{ cfg().horasMax }}</mat-chip>
        <mat-chip disableRipple>
          Participantes: {{ cfg().participantesMin }} – {{ cfg().participantesMax }}
        </mat-chip>
        @if (tipo() === 'asistencia') {
          <mat-chip disableRipple>Modalidad AT: {{ cfgArea().asistencia.modalidadAT }}</mat-chip>
        }
        @if (customs().length > 0) {
          <mat-chip disableRipple>+{{ customs().length }} campo(s) personalizado(s)</mat-chip>
        }
      </mat-chip-set>

      <!-- 1. Datos generales -->
      <mat-card appearance="outlined" class="bloque">
        <header class="seccion">
          <mat-icon fontSet="material-symbols-outlined">auto_awesome</mat-icon>
          <h3>Datos generales</h3>
        </header>

        <div class="rejilla dos">
          <mat-form-field>
            <mat-label>Código</mat-label>
            <input matInput readonly [value]="form.controls.codigo.value" />
          </mat-form-field>

          <mat-form-field>
            <mat-label>Temática</mat-label>
            <mat-select formControlName="tematica" required [errorStateMatcher]="matcherDe('tematica')">
              <mat-option value="">— Seleccione —</mat-option>
              @for (t of tematicas; track t) {
                <mat-option [value]="t">{{ t }}</mat-option>
              }
            </mat-select>
            <mat-error>{{ errores()['tematica'] }}</mat-error>
          </mat-form-field>

          <mat-form-field>
            <mat-label>Tipo</mat-label>
            <mat-select formControlName="tipoEvento">
              @for (t of tiposEvento; track t) {
                <mat-option [value]="t">{{ t }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          @if (tipo() === 'asistencia') {
            <mat-form-field>
              <mat-label>Modalidad</mat-label>
              <mat-select formControlName="modalidadAT" required>
                @for (m of modalidadesAt(); track m) {
                  <mat-option [value]="m">{{ m }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          }

          <mat-form-field>
            <mat-label>Fecha</mat-label>
            <input
              matInput
              required
              [matDatepicker]="dpFecha"
              [disabled]="readOnly()"
              [value]="fechaDate()"
              [errorStateMatcher]="matcherDe('fecha')"
              (dateChange)="setFecha($event.value)"
            />
            <mat-datepicker-toggle matIconSuffix [for]="dpFecha" />
            <mat-datepicker #dpFecha />
            <mat-error>{{ errores()['fecha'] }}</mat-error>
          </mat-form-field>

          <mat-form-field>
            <mat-label>Nro. Horas</mat-label>
            <input
              matInput
              type="number"
              required
              [min]="cfg().horasMin"
              [max]="cfg().horasMax"
              formControlName="horas"
              [errorStateMatcher]="matcherDe('horas')"
            />
            <mat-error>{{ errores()['horas'] }}</mat-error>
          </mat-form-field>

          <mat-form-field class="ancho-completo">
            <mat-label>Nombre</mat-label>
            <input
              matInput
              required
              maxlength="200"
              formControlName="nombre"
              [errorStateMatcher]="matcherDe('nombre')"
            />
            <mat-error>{{ errores()['nombre'] }}</mat-error>
          </mat-form-field>

          <mat-form-field class="ancho-completo">
            <mat-label>Extensionista</mat-label>
            <input
              matInput
              required
              maxlength="120"
              formControlName="extensionista"
              [errorStateMatcher]="matcherDe('extensionista')"
            />
            <mat-error>{{ errores()['extensionista'] }}</mat-error>
          </mat-form-field>

          <mat-form-field class="ancho-completo">
            <mat-label>Observaciones</mat-label>
            <textarea matInput rows="2" maxlength="500" formControlName="observaciones"></textarea>
          </mat-form-field>

          @if (mostrarVinculo()) {
            <mat-form-field class="ancho-completo">
              <mat-label>Capacitación vinculada</mat-label>
              <mat-select formControlName="capacitacionVinculadaId">
                <mat-option value="">— Sin vincular —</mat-option>
                @for (c of capacitacionesVinculables(); track c.id) {
                  <mat-option [value]="c.id">{{ c.codigo }} · {{ c.nombreTema }}</mat-option>
                }
              </mat-select>
              <mat-hint>Habilitado desde Configuración › Reglas.</mat-hint>
            </mat-form-field>
          }
        </div>
      </mat-card>

      <!-- 2. Ubicación (cascada) -->
      <mat-card appearance="outlined" class="bloque">
        <header class="seccion">
          <mat-icon fontSet="material-symbols-outlined">location_on</mat-icon>
          <h3>Ubicación</h3>
        </header>

        <div class="rejilla dos">
          <mat-form-field>
            <mat-label>Región</mat-label>
            <mat-select
              formControlName="region"
              required
              [errorStateMatcher]="matcherDe('region')"
              (valueChange)="onRegionChange()"
            >
              <mat-option value="">— Seleccione —</mat-option>
              @for (r of ubigeo; track r.nombre) {
                <mat-option [value]="r.nombre">{{ r.nombre }}</mat-option>
              }
            </mat-select>
            <mat-error>{{ errores()['region'] }}</mat-error>
          </mat-form-field>

          <mat-form-field>
            <mat-label>Provincia</mat-label>
            <mat-select
              formControlName="provincia"
              required
              [errorStateMatcher]="matcherDe('provincia')"
              (valueChange)="onProvinciaChange()"
            >
              <mat-option value="">— Seleccione —</mat-option>
              @for (p of provincias(); track p.nombre) {
                <mat-option [value]="p.nombre">{{ p.nombre }}</mat-option>
              }
            </mat-select>
            <mat-error>{{ errores()['provincia'] }}</mat-error>
          </mat-form-field>

          <mat-form-field>
            <mat-label>Distrito</mat-label>
            <mat-select
              formControlName="distrito"
              required
              [errorStateMatcher]="matcherDe('distrito')"
              (valueChange)="onDistritoChange()"
            >
              <mat-option value="">— Seleccione —</mat-option>
              @for (d of distritos(); track d.nombre) {
                <mat-option [value]="d.nombre">{{ d.nombre }}</mat-option>
              }
            </mat-select>
            <mat-error>{{ errores()['distrito'] }}</mat-error>
          </mat-form-field>

          <mat-form-field>
            <mat-label>Centro Poblado</mat-label>
            <mat-select formControlName="centroPoblado">
              <mat-option value="">— Seleccione —</mat-option>
              @for (c of centrosPoblados(); track c) {
                <mat-option [value]="c">{{ c }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
      </mat-card>

      <!-- 3. Coordenadas -->
      <mat-card appearance="outlined" class="bloque">
        <header class="seccion">
          <mat-icon fontSet="material-symbols-outlined">explore</mat-icon>
          <h3>Coordenadas</h3>
        </header>

        <div class="coordenadas">
          <!-- Mapa lateral -->
          <div class="mapa">
            <p class="subtitulo">Ubicación en el mapa</p>
            <app-peru-map
              [region]="regionSeleccionada()"
              [value]="coordsActuales()"
              [disabled]="readOnly()"
              [centro]="centroMapa()"
              [showLocate]="!readOnly()"
              (picked)="onMapPick($event)"
              (locate)="obtenerUbicacion()"
            />
            @if (!readOnly()) {
              <button
                matButton="outlined"
                type="button"
                class="ubicacion"
                [disabled]="buscandoUbicacion()"
                (click)="obtenerUbicacion()"
              >
                @if (buscandoUbicacion()) {
                  <mat-spinner diameter="16" />
                } @else {
                  <mat-icon fontSet="material-symbols-outlined">my_location</mat-icon>
                }
                {{ buscandoUbicacion() ? 'Obteniendo ubicación…' : 'Obtener mi ubicación' }}
              </button>
            }
          </div>

          <!-- Campos -->
          <div class="campos-coordenadas">
            <div>
              <p class="subtitulo">Coordenadas geográficas</p>
              <div class="rejilla tres">
                <mat-form-field>
                  <mat-label>Longitud</mat-label>
                  <input
                    matInput
                    placeholder="-72.881"
                    formControlName="longitud"
                    [errorStateMatcher]="matcherDe('longitud')"
                  />
                  <mat-error>{{ errores()['longitud'] }}</mat-error>
                </mat-form-field>
                <mat-form-field>
                  <mat-label>Latitud</mat-label>
                  <input
                    matInput
                    placeholder="-13.635"
                    formControlName="latitud"
                    [errorStateMatcher]="matcherDe('latitud')"
                  />
                  <mat-error>{{ errores()['latitud'] }}</mat-error>
                </mat-form-field>
                <mat-form-field>
                  <mat-label>Altitud (msnm)</mat-label>
                  <input matInput type="number" placeholder="3200" formControlName="altitud" />
                </mat-form-field>
              </div>
            </div>

            <div class="bloque-utm">
              <p class="subtitulo">Coordenadas UTM</p>
              <div class="rejilla utm">
                <mat-form-field>
                  <mat-label>Zona</mat-label>
                  <input matInput maxlength="4" placeholder="18S" formControlName="utmZona" />
                </mat-form-field>
                <mat-form-field>
                  <mat-label>Coord. Este</mat-label>
                  <input matInput inputmode="decimal" placeholder="000000.000" formControlName="utmEste" />
                </mat-form-field>
                <mat-form-field>
                  <mat-label>Coord. Norte</mat-label>
                  <input matInput inputmode="decimal" placeholder="0000000.000" formControlName="utmNorte" />
                </mat-form-field>
              </div>
            </div>
          </div>
        </div>
      </mat-card>

      <!-- Campos personalizados del área -->
      @if (customs().length > 0) {
        <mat-card appearance="outlined" class="bloque">
          <header class="seccion">
            <mat-icon fontSet="material-symbols-outlined">auto_awesome</mat-icon>
            <h3>Campos adicionales del área</h3>
          </header>

          <div class="rejilla dos">
            @for (c of customs(); track c.id) {
              @switch (c.tipo) {
                @case ('textarea') {
                  <mat-form-field>
                    <mat-label>{{ c.nombre }}</mat-label>
                    <textarea
                      matInput
                      rows="2"
                      [required]="!!c.requerido"
                      [disabled]="readOnly()"
                      [value]="customValue(c.id)"
                      [errorStateMatcher]="matcherDe('c_' + c.id)"
                      (input)="setCustom(c.id, $any($event.target).value)"
                    ></textarea>
                    <mat-error>{{ errores()['c_' + c.id] }}</mat-error>
                  </mat-form-field>
                }
                @case ('select') {
                  <mat-form-field>
                    <mat-label>{{ c.nombre }}</mat-label>
                    <mat-select
                      [required]="!!c.requerido"
                      [disabled]="readOnly()"
                      [value]="customValue(c.id)"
                      [errorStateMatcher]="matcherDe('c_' + c.id)"
                      (valueChange)="setCustom(c.id, $event)"
                    >
                      <mat-option value="">— Seleccione —</mat-option>
                      @for (o of c.opciones ?? []; track o) {
                        <mat-option [value]="o">{{ o }}</mat-option>
                      }
                    </mat-select>
                    <mat-error>{{ errores()['c_' + c.id] }}</mat-error>
                  </mat-form-field>
                }
                @case ('checkbox') {
                  <div class="grupo-opciones">
                    <span class="etiqueta">{{ c.nombre }}{{ c.requerido ? ' *' : '' }}</span>
                    <div class="opciones">
                      @for (o of c.opciones ?? []; track o) {
                        <mat-checkbox
                          [checked]="customChecked(c.id, o)"
                          [disabled]="readOnly()"
                          (change)="toggleCustomCheckbox(c.id, o, $event.checked)"
                        >{{ o }}</mat-checkbox>
                      }
                    </div>
                    @if (errores()['c_' + c.id]; as e) {
                      <p class="error">{{ e }}</p>
                    }
                  </div>
                }
                @case ('radio') {
                  <div class="grupo-opciones">
                    <span class="etiqueta">{{ c.nombre }}{{ c.requerido ? ' *' : '' }}</span>
                    <mat-radio-group
                      [value]="customValue(c.id)"
                      [disabled]="readOnly()"
                      (change)="setCustom(c.id, $event.value)"
                      [attr.aria-label]="c.nombre"
                    >
                      @for (o of c.opciones ?? []; track o) {
                        <mat-radio-button [value]="o">{{ o }}</mat-radio-button>
                      }
                    </mat-radio-group>
                    @if (errores()['c_' + c.id]; as e) {
                      <p class="error">{{ e }}</p>
                    }
                  </div>
                }
                @default {
                  <mat-form-field>
                    <mat-label>{{ c.nombre }}</mat-label>
                    <input
                      matInput
                      [type]="c.tipo"
                      [required]="!!c.requerido"
                      [disabled]="readOnly()"
                      [value]="customValue(c.id)"
                      [errorStateMatcher]="matcherDe('c_' + c.id)"
                      (input)="setCustom(c.id, $any($event.target).value)"
                    />
                    <mat-error>{{ errores()['c_' + c.id] }}</mat-error>
                  </mat-form-field>
                }
              }
            }
          </div>
        </mat-card>
      }

      <div class="botonera">
        <button matButton type="button" (click)="cancelled.emit()">
          {{ cancelLabel() ?? (readOnly() ? 'Volver' : 'Cancelar') }}
        </button>
        @if (!readOnly()) {
          <button matButton="filled" type="button" (click)="guardar()">
            {{ saveLabel() ?? 'Guardar registro' }}
          </button>
        }
      </div>
    </div>
  `,
  styles: `
    .formulario { display: flex; flex-direction: column; gap: 20px; }
    .bloque { padding: 20px; }

    .seccion {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
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
    .subtitulo {
      margin: 0 0 8px;
      font: var(--mat-sys-label-medium);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--mat-sys-on-surface-variant);
    }

    .rejilla { display: grid; grid-template-columns: 1fr; gap: 0 12px; }
    @media (min-width: 768px) {
      .rejilla.dos { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .rejilla.tres { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .rejilla.utm { grid-template-columns: 110px 1fr 1fr; }
      .ancho-completo { grid-column: span 2; }
    }
    mat-form-field { width: 100%; }

    .coordenadas { display: flex; flex-direction: column; gap: 20px; }
    @media (min-width: 768px) { .coordenadas { flex-direction: row; } }
    .mapa { width: 100%; flex: 0 0 auto; }
    @media (min-width: 768px) { .mapa { width: 256px; } }
    .ubicacion { width: 100%; margin-top: 8px; }
    .campos-coordenadas { flex: 1; display: flex; flex-direction: column; gap: 16px; }
    .bloque-utm { padding-top: 16px; border-top: 1px dashed var(--mat-sys-outline-variant); }

    .grupo-opciones { display: flex; flex-direction: column; gap: 4px; padding: 4px 0 16px; }
    .grupo-opciones .etiqueta {
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }
    .opciones, mat-radio-group { display: flex; flex-wrap: wrap; gap: 16px; }
    .error { margin: 0; font: var(--mat-sys-body-small); color: var(--mat-sys-error); }

    .botonera { display: flex; justify-content: flex-end; gap: 8px; }
  `,
})
export class CursoFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly areaService = inject(AreaService);
  private readonly reglasService = inject(ReglasService);
  private readonly camposService = inject(CamposService);
  private readonly modales = inject(ModalService);

  readonly tipo = input.required<TipoCurso>();
  readonly initial = input<Partial<CursoFormState> | undefined>(undefined);
  readonly readOnly = input(false);
  readonly saveLabel = input<string | undefined>(undefined);
  readonly cancelLabel = input<string | undefined>(undefined);
  readonly capacitacionesVinculables = input<{ id: string; codigo: string; nombreTema: string }[]>([]);

  readonly saved = output<CursoFormState>();
  readonly cancelled = output<void>();

  readonly tematicas = TEMATICAS;
  readonly tiposEvento = TIPOS_EVENTO;
  readonly ubigeo = UBIGEO;

  readonly errores = signal<Record<string, string>>({});
  /** Valores de los campos personalizados del área (fase B). */
  readonly custom = signal<Record<string, string>>({});
  private readonly formTick = signal(0);

  readonly cfgArea = computed(() => this.reglasService.configs()[this.areaService.currentArea()]);
  readonly cfg = computed(() =>
    this.tipo() === 'capacitacion' ? this.cfgArea().capacitacion : this.cfgArea().asistencia,
  );
  readonly customs = computed<CampoPersonalizado[]>(() => {
    const area = this.areaService.currentArea();
    const formKey: FormularioKey = this.tipo() === 'capacitacion' ? 'capacitacion' : 'asistencia';
    return this.camposService
      .camposDe(area, formKey)
      .filter((c) => c.activo && c.visiblePorArea?.[area] === true);
  });
  readonly mostrarVinculo = computed(
    () => this.tipo() === 'asistencia' && this.cfgArea().asistencia.vinculadaACapacitacion,
  );
  readonly modalidadesAt = computed(() => {
    const modo = this.cfgArea().asistencia.modalidadAT;
    return MODALIDADES_AT.filter((m) => modo === 'ambas' || modo === m.toLowerCase());
  });

  readonly form = this.fb.nonNullable.group({
    codigo: new FormControl('', { nonNullable: true }),
    tematica: '',
    tipoEvento: 'CURSO',
    modalidadAT: 'Individual',
    fecha: '',
    hora: '09:00',
    horas: 1,
    nombre: '',
    extensionista: '',
    observaciones: '',
    capacitacionVinculadaId: '',
    region: '',
    provincia: '',
    distrito: '',
    centroPoblado: '',
    utmZona: '18S',
    utmEste: '',
    utmNorte: '',
    longitud: '',
    latitud: '',
    altitud: '',
    archivoNombre: '',
    archivoRuta: '',
  });

  constructor() {
    // Registro bloqueado (Enviado, Validado, Aprobado…): todo en solo lectura.
    effect(() => {
      if (this.readOnly()) this.form.disable({ emitEvent: false });
      else this.form.enable({ emitEvent: false });
    });
  }

  ngOnInit(): void {
    const initial = this.initial();
    const codigoAuto =
      initial?.codigo ??
      `${this.tipo() === 'capacitacion' ? 'CAP' : 'AST'}-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
    this.form.patchValue({ ...EMPTY, ...initial, codigo: codigoAuto });
    this.custom.set({ ...(initial?.custom ?? {}) });
    this.form.valueChanges.subscribe(() => this.formTick.update((t) => t + 1));
  }

  /**
   * La validación es propia (mensajes por campo en `errores`), así que el estado
   * de error de cada campo lo decide ese mapa y no los validadores del control.
   */
  private readonly matchers = new Map<string, ErrorStateMatcher>();

  matcherDe(campo: string): ErrorStateMatcher {
    let matcher = this.matchers.get(campo);
    if (!matcher) {
      matcher = { isErrorState: () => !!this.errores()[campo] };
      this.matchers.set(campo, matcher);
    }
    return matcher;
  }

  /* ===== Cascada Región → Provincia → Distrito → Centro Poblado ===== */
  readonly provincias = computed(() => {
    this.formTick();
    return getProvincias(this.form.controls.region.value);
  });
  readonly distritos = computed(() => {
    this.formTick();
    return getDistritos(this.form.controls.region.value, this.form.controls.provincia.value);
  });
  readonly centrosPoblados = computed(() => {
    this.formTick();
    return getCentrosPoblados(
      this.form.controls.region.value,
      this.form.controls.provincia.value,
      this.form.controls.distrito.value,
    );
  });
  readonly regionSeleccionada = computed(() => {
    this.formTick();
    return this.form.controls.region.value || undefined;
  });
  readonly coordsActuales = computed(() => {
    this.formTick();
    const lng = this.form.controls.longitud.value;
    const lat = this.form.controls.latitud.value;
    if (lng && lat && !Number.isNaN(Number(lng)) && !Number.isNaN(Number(lat))) {
      return { lng: Number(lng), lat: Number(lat) };
    }
    return null;
  });
  /** La fecha del evento vive en ISO; el calendario trabaja con Date. */
  readonly fechaDate = computed(() => {
    this.formTick();
    return isoADate(this.form.controls.fecha.value);
  });

  setFecha(fecha: Date | null): void {
    this.form.patchValue({ fecha: dateAIso(fecha) });
  }

  onRegionChange(): void {
    this.form.patchValue({ provincia: '', distrito: '', centroPoblado: '' });
  }
  onProvinciaChange(): void {
    this.form.patchValue({ distrito: '', centroPoblado: '' });
  }
  onDistritoChange(): void {
    this.form.patchValue({ centroPoblado: '' });
  }

  /* ===== Mapa ===== */
  /** Centro solicitado para el mapa (se fija al usar la geolocalización). */
  readonly centroMapa = signal<{ lng: number; lat: number } | null>(null);
  readonly buscandoUbicacion = signal(false);

  /**
   * Obtiene la ubicación GPS del navegador, completa Longitud/Latitud (con su
   * conversión UTM) y centra el mapa colocando el marcador, que luego puede
   * arrastrarse manualmente. Los errores usan el sistema unificado de modales.
   */
  obtenerUbicacion(): void {
    if (this.readOnly() || this.buscandoUbicacion()) return;
    if (!('geolocation' in navigator)) {
      void this.modales.openError(
        'Geolocalización no disponible',
        'Su navegador no soporta la captura de ubicación. Ingrese las coordenadas manualmente o seleccione el punto en el mapa.',
      );
      return;
    }
    this.buscandoUbicacion.set(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.buscandoUbicacion.set(false);
        const punto = {
          lng: Number(pos.coords.longitude.toFixed(4)),
          lat: Number(pos.coords.latitude.toFixed(4)),
        };
        this.onMapPick(punto);
        this.centroMapa.set(punto);
      },
      (err) => {
        this.buscandoUbicacion.set(false);
        if (err.code === err.PERMISSION_DENIED) {
          void this.modales.openWarning(
            'Permiso de ubicación denegado',
            'El navegador no tiene permiso para acceder a su ubicación. Actívelo en la configuración del sitio y vuelva a intentarlo, o seleccione el punto directamente en el mapa.',
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          void this.modales.openError(
            'Ubicación no disponible',
            'No fue posible determinar su posición (GPS deshabilitado o sin señal). Verifique el GPS del dispositivo o seleccione el punto en el mapa.',
          );
        } else {
          void this.modales.openError(
            'Tiempo de espera agotado',
            'La captura de ubicación tardó demasiado. Inténtelo nuevamente o seleccione el punto en el mapa.',
          );
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }

  onMapPick({ lng, lat }: { lng: number; lat: number }): void {
    const utm = lngLatToUTM(lng, lat);
    this.form.patchValue({
      longitud: lng.toFixed(4),
      latitud: lat.toFixed(4),
      utmZona: utm.zone,
      utmEste: utm.easting.toFixed(3),
      utmNorte: utm.northing.toFixed(3),
    });
  }

  /* ===== Campos personalizados ===== */
  customValue(id: string): string {
    return this.custom()[id] ?? '';
  }
  setCustom(id: string, v: string): void {
    this.custom.update((c) => ({ ...c, [id]: v }));
  }
  customChecked(id: string, opcion: string): boolean {
    return (this.custom()[id] ?? '').split('|').includes(opcion);
  }
  toggleCustomCheckbox(id: string, opcion: string, checked: boolean): void {
    const arr = (this.custom()[id] ?? '').split('|').filter(Boolean);
    const next = checked ? [...arr, opcion] : arr.filter((x) => x !== opcion);
    this.setCustom(id, next.join('|'));
  }

  /* ===== Simulación (botón "Autocompletar" del stepper) ===== */
  simular(): void {
    const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const region = pick(UBIGEO);
    const prov = pick(region.provincias);
    const dist = pick(prov.distritos);
    const cp = dist.centrosPoblados.length ? pick(dist.centrosPoblados) : '';
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const cfg = this.cfg();
    const horasSim = Math.min(cfg.horasMax, Math.max(cfg.horasMin, 4));
    const nombresExt = ['Juan Pérez Quispe', 'María Huamán Soto', 'Luis Mamani Choque', 'Rosa Ccahuana Ríos', 'Carlos Apaza León'];
    const temas = [
      'Manejo integrado de plagas en cultivos andinos',
      'Buenas prácticas de riego tecnificado por goteo',
      'Producción orgánica de café en zonas altoandinas',
      'Sanidad y nutrición en crianza de cuyes',
      'Conservación de suelos en laderas',
    ];
    const customFill: Record<string, string> = {};
    this.customs().forEach((c) => {
      if (c.tipo === 'select' || c.tipo === 'radio' || c.tipo === 'checkbox') {
        customFill[c.id] = c.opciones?.[0] ?? '';
      } else if (c.tipo === 'number') {
        customFill[c.id] = String(Math.floor(Math.random() * 50) + 1);
      } else if (c.tipo === 'date') {
        customFill[c.id] = `${yyyy}-${mm}-${dd}`;
      } else if (c.tipo === 'textarea') {
        customFill[c.id] = 'Observación generada automáticamente para pruebas.';
      } else {
        customFill[c.id] = 'Dato simulado';
      }
    });
    this.form.patchValue({
      tematica: pick(TEMATICAS),
      tipoEvento: pick(TIPOS_EVENTO),
      modalidadAT: pick(MODALIDADES_AT),
      fecha: `${yyyy}-${mm}-${dd}`,
      hora: '09:00',
      horas: horasSim,
      nombre: pick(temas),
      extensionista: pick(nombresExt),
      observaciones: 'Datos simulados para pruebas rápidas del formulario.',
      region: region.nombre,
      provincia: prov.nombre,
      distrito: dist.nombre,
      centroPoblado: cp,
      utmZona: '18S',
      utmEste: (Math.random() * 1000000).toFixed(3),
      utmNorte: (Math.random() * 10000000).toFixed(3),
      longitud: (-72 - Math.random()).toFixed(4),
      latitud: (-13 - Math.random()).toFixed(4),
      altitud: String(2500 + Math.floor(Math.random() * 1500)),
      archivoNombre: 'sustento_simulado.pdf',
      archivoRuta: `/uploads/${this.areaService.currentArea()}/sustento_simulado.pdf`,
    });
    this.custom.update((c) => ({ ...c, ...customFill }));
    this.errores.set({});
  }

  /* ===== Validación y guardado (mismas reglas que el original) ===== */
  private validar(s: CursoFormState): boolean {
    const cfg = this.cfg();
    const e: Record<string, string> = {};
    if (!s.tematica) e['tematica'] = 'Seleccione una temática.';
    if (!s.fecha) e['fecha'] = 'La fecha es obligatoria.';
    if (!s.nombre.trim()) e['nombre'] = 'Nombre obligatorio.';
    if (!s.extensionista.trim()) e['extensionista'] = 'Indique el extensionista.';
    if (s.horas < cfg.horasMin || s.horas > cfg.horasMax)
      e['horas'] = `Horas debe estar entre ${cfg.horasMin} y ${cfg.horasMax}.`;
    if (!s.region) e['region'] = 'Región obligatoria.';
    if (!s.provincia) e['provincia'] = 'Provincia obligatoria.';
    if (!s.distrito) e['distrito'] = 'Distrito obligatorio.';
    if (s.latitud && Number.isNaN(Number(s.latitud))) e['latitud'] = 'Latitud no válida.';
    if (s.longitud && Number.isNaN(Number(s.longitud))) e['longitud'] = 'Longitud no válida.';
    this.customs()
      .filter((c) => c.requerido)
      .forEach((c) => {
        if (!s.custom[c.id]) e[`c_${c.id}`] = `${c.nombre} es obligatorio.`;
      });
    this.errores.set(e);
    return Object.keys(e).length === 0;
  }

  guardar(): void {
    const raw = this.form.getRawValue();
    const state: CursoFormState = {
      ...raw,
      horas: Number(raw.horas) || 0,
      custom: { ...this.custom() },
    };
    if (this.validar(state)) this.saved.emit(state);
  }
}
