import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, Info, MapPin, Compass, Sparkles } from 'lucide-angular';
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

const INP = 'w-full bg-background ring-1 ring-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground/60 hover:ring-muted-foreground/30 focus:ring-2 focus:ring-ring focus:outline-none transition-[box-shadow,background-color] duration-150';
const INP_DISABLED = 'w-full bg-muted/40 ring-1 ring-border rounded-lg px-3 py-2 text-sm text-muted-foreground cursor-not-allowed';
/** Campo obligatorio: resaltado ámbar (misma convención que INPUT_REQUIRED compartido). */
const INP_REQ = 'w-full bg-warning-soft ring-1 ring-warning/40 rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:bg-card focus:ring-2 focus:ring-ring focus:outline-none transition-[box-shadow,background-color] duration-150';

@Component({
  selector: 'app-curso-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, LucideAngularModule, PeruMapComponent],
  template: `
    <div class="space-y-5">
      <fieldset [disabled]="readOnly()" class="space-y-5 m-0 p-0 border-0 disabled:opacity-95">
        <!-- Chips de reglas activas -->
        <div class="flex flex-wrap gap-2">
          <span class="text-[11px] px-2.5 py-1 rounded-full bg-card ring-1 ring-border text-muted-foreground">
            Horas: {{ cfg().horasMin }} – {{ cfg().horasMax }}
          </span>
          <span class="text-[11px] px-2.5 py-1 rounded-full bg-card ring-1 ring-border text-muted-foreground">
            Participantes: {{ cfg().participantesMin }} – {{ cfg().participantesMax }}
          </span>
          @if (tipo() === 'asistencia') {
            <span class="text-[11px] px-2.5 py-1 rounded-full bg-card ring-1 ring-border text-muted-foreground">
              Modalidad AT: {{ cfgArea().asistencia.modalidadAT }}
            </span>
          }
          @if (customs().length > 0) {
            <span class="text-[11px] px-2.5 py-1 rounded-full bg-card ring-1 ring-border text-muted-foreground">
              +{{ customs().length }} campo(s) personalizado(s)
            </span>
          }
        </div>

        <!-- 1. Datos generales -->
        <section class="bg-card rounded-xl ring-1 ring-border p-5">
          <div class="flex items-center gap-2 border-b border-border pb-2 mb-4 text-brand">
            <lucide-angular [img]="SparklesIcon" class="size-4" />
            <h3 class="text-[11px] font-semibold uppercase tracking-wider">Datos generales</h3>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3" [formGroup]="form">
            <div>
              <label class="block text-[11px] font-medium text-muted-foreground mb-1">Código</label>
              <input [value]="form.controls.codigo.value" disabled [class]="inpDisabled" />
            </div>
            <div>
              <label class="block text-[11px] font-medium text-muted-foreground mb-1">Temática *</label>
              <select formControlName="tematica" [class]="inpReq()">
                <option value="">— Seleccione —</option>
                @for (t of tematicas; track t) {
                  <option [value]="t">{{ t }}</option>
                }
              </select>
              @if (errores()['tematica']) {
                <p class="text-[11px] text-destructive mt-1">{{ errores()['tematica'] }}</p>
              }
            </div>
            <div>
              <label class="block text-[11px] font-medium text-muted-foreground mb-1">Tipo</label>
              <select formControlName="tipoEvento" [class]="inp">
                @for (t of tiposEvento; track t) {
                  <option [value]="t">{{ t }}</option>
                }
              </select>
            </div>
            @if (tipo() === 'asistencia') {
              <div>
                <label class="block text-[11px] font-medium text-muted-foreground mb-1">Modalidad *</label>
                <select formControlName="modalidadAT" [class]="inpReq()">
                  @for (m of modalidadesAt(); track m) {
                    <option [value]="m">{{ m }}</option>
                  }
                </select>
              </div>
            }
            <div>
              <label class="block text-[11px] font-medium text-muted-foreground mb-1">Fecha *</label>
              <input type="date" formControlName="fecha" [class]="inpReq()" />
              @if (errores()['fecha']) {
                <p class="text-[11px] text-destructive mt-1">{{ errores()['fecha'] }}</p>
              }
            </div>
            <div>
              <label class="block text-[11px] font-medium text-muted-foreground mb-1">Nro. Horas *</label>
              <input type="number" [min]="cfg().horasMin" [max]="cfg().horasMax" formControlName="horas" [class]="inpReq()" />
              @if (errores()['horas']) {
                <p class="text-[11px] text-destructive mt-1">{{ errores()['horas'] }}</p>
              }
            </div>
            <div class="md:col-span-2">
              <label class="block text-[11px] font-medium text-muted-foreground mb-1">Nombre *</label>
              <input formControlName="nombre" maxlength="200" [class]="inpReq()" />
              @if (errores()['nombre']) {
                <p class="text-[11px] text-destructive mt-1">{{ errores()['nombre'] }}</p>
              }
            </div>
            <div class="md:col-span-2">
              <label class="block text-[11px] font-medium text-muted-foreground mb-1">Extensionista *</label>
              <input formControlName="extensionista" maxlength="120" [class]="inpReq()" />
              @if (errores()['extensionista']) {
                <p class="text-[11px] text-destructive mt-1">{{ errores()['extensionista'] }}</p>
              }
            </div>
            <div class="md:col-span-2">
              <label class="block text-[11px] font-medium text-muted-foreground mb-1">Observaciones</label>
              <textarea rows="2" formControlName="observaciones" maxlength="500" [class]="inp"></textarea>
            </div>
            @if (mostrarVinculo()) {
              <div class="md:col-span-2">
                <label class="block text-[11px] font-medium text-muted-foreground mb-1">Capacitación vinculada</label>
                <select formControlName="capacitacionVinculadaId" [class]="inp">
                  <option value="">— Sin vincular —</option>
                  @for (c of capacitacionesVinculables(); track c.id) {
                    <option [value]="c.id">{{ c.codigo }} · {{ c.nombreTema }}</option>
                  }
                </select>
                <p class="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  <lucide-angular [img]="InfoIcon" class="size-3" /> Habilitado desde Configuración › Reglas.
                </p>
              </div>
            }
          </div>
        </section>

        <!-- 2. Ubicación (cascada) -->
        <section class="bg-card rounded-xl ring-1 ring-border p-5">
          <div class="flex items-center gap-2 border-b border-border pb-2 mb-4 text-brand">
            <lucide-angular [img]="MapPinIcon" class="size-4" />
            <h3 class="text-[11px] font-semibold uppercase tracking-wider">Ubicación</h3>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3" [formGroup]="form">
            <div>
              <label class="block text-[11px] font-medium text-muted-foreground mb-1">Región *</label>
              <select formControlName="region" (change)="onRegionChange()" [class]="inpReq()">
                <option value="">— Seleccione —</option>
                @for (r of ubigeo; track r.nombre) {
                  <option [value]="r.nombre">{{ r.nombre }}</option>
                }
              </select>
              @if (errores()['region']) {
                <p class="text-[11px] text-destructive mt-1">{{ errores()['region'] }}</p>
              }
            </div>
            <div>
              <label class="block text-[11px] font-medium text-muted-foreground mb-1">Provincia *</label>
              <select formControlName="provincia" (change)="onProvinciaChange()" [class]="inpReq()">
                <option value="">— Seleccione —</option>
                @for (p of provincias(); track p.nombre) {
                  <option [value]="p.nombre">{{ p.nombre }}</option>
                }
              </select>
              @if (errores()['provincia']) {
                <p class="text-[11px] text-destructive mt-1">{{ errores()['provincia'] }}</p>
              }
            </div>
            <div>
              <label class="block text-[11px] font-medium text-muted-foreground mb-1">Distrito *</label>
              <select formControlName="distrito" (change)="onDistritoChange()" [class]="inpReq()">
                <option value="">— Seleccione —</option>
                @for (d of distritos(); track d.nombre) {
                  <option [value]="d.nombre">{{ d.nombre }}</option>
                }
              </select>
              @if (errores()['distrito']) {
                <p class="text-[11px] text-destructive mt-1">{{ errores()['distrito'] }}</p>
              }
            </div>
            <div>
              <label class="block text-[11px] font-medium text-muted-foreground mb-1">Centro Poblado</label>
              <select formControlName="centroPoblado" [class]="inp">
                <option value="">— Seleccione —</option>
                @for (c of centrosPoblados(); track c) {
                  <option [value]="c">{{ c }}</option>
                }
              </select>
            </div>
          </div>
        </section>

        <!-- 3. Coordenadas -->
        <section class="bg-card rounded-xl ring-1 ring-border p-5">
          <div class="flex items-center gap-2 border-b border-border pb-2 mb-4 text-brand">
            <lucide-angular [img]="CompassIcon" class="size-4" />
            <h3 class="text-[11px] font-semibold uppercase tracking-wider">Coordenadas</h3>
          </div>
          <div class="flex flex-col md:flex-row gap-5">
            <!-- Mapa lateral -->
            <div class="w-full md:w-64 shrink-0">
              <p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Ubicación en el mapa
              </p>
              <app-peru-map
                [region]="regionSeleccionada()"
                [value]="coordsActuales()"
                [disabled]="readOnly()"
                (picked)="onMapPick($event)"
              />
            </div>

            <!-- Campos -->
            <div class="flex-1 space-y-5" [formGroup]="form">
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Coordenadas geográficas
                </p>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label class="block text-[11px] font-medium text-muted-foreground mb-1">Longitud</label>
                    <input formControlName="longitud" placeholder="-72.881" [class]="inp" />
                    @if (errores()['longitud']) {
                      <p class="text-[11px] text-destructive mt-1">{{ errores()['longitud'] }}</p>
                    }
                  </div>
                  <div>
                    <label class="block text-[11px] font-medium text-muted-foreground mb-1">Latitud</label>
                    <input formControlName="latitud" placeholder="-13.635" [class]="inp" />
                    @if (errores()['latitud']) {
                      <p class="text-[11px] text-destructive mt-1">{{ errores()['latitud'] }}</p>
                    }
                  </div>
                  <div>
                    <label class="block text-[11px] font-medium text-muted-foreground mb-1">Altitud (msnm)</label>
                    <input type="number" formControlName="altitud" placeholder="3200" [class]="inp" />
                  </div>
                </div>
              </div>

              <div class="pt-4 border-t border-dashed border-border">
                <p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Coordenadas UTM
                </p>
                <div class="grid grid-cols-1 md:grid-cols-[110px_1fr_1fr] gap-3">
                  <div>
                    <label class="block text-[11px] font-medium text-muted-foreground mb-1">Zona</label>
                    <input formControlName="utmZona" placeholder="18S" maxlength="4" [class]="inp" />
                  </div>
                  <div>
                    <label class="block text-[11px] font-medium text-muted-foreground mb-1">Coord. Este</label>
                    <input formControlName="utmEste" placeholder="000000.000" inputmode="decimal" [class]="inp" />
                  </div>
                  <div>
                    <label class="block text-[11px] font-medium text-muted-foreground mb-1">Coord. Norte</label>
                    <input formControlName="utmNorte" placeholder="0000000.000" inputmode="decimal" [class]="inp" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Campos personalizados del área -->
        @if (customs().length > 0) {
          <section class="bg-card rounded-xl ring-1 ring-border p-5">
            <div class="flex items-center gap-2 border-b border-border pb-2 mb-4 text-brand">
              <lucide-angular [img]="SparklesIcon" class="size-4" />
              <h3 class="text-[11px] font-semibold uppercase tracking-wider">Campos adicionales del área</h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              @for (c of customs(); track c.id) {
                <div>
                  <label class="block text-[11px] font-medium text-muted-foreground mb-1">
                    {{ c.nombre }}{{ c.requerido ? ' *' : '' }}
                  </label>
                  @switch (c.tipo) {
                    @case ('textarea') {
                      <textarea rows="2" [value]="customValue(c.id)" (input)="setCustom(c.id, $any($event.target).value)" [class]="c.requerido ? inpReq() : inp"></textarea>
                    }
                    @case ('select') {
                      <select [value]="customValue(c.id)" (change)="setCustom(c.id, $any($event.target).value)" [class]="c.requerido ? inpReq() : inp">
                        <option value="">— Seleccione —</option>
                        @for (o of c.opciones ?? []; track o) {
                          <option [value]="o">{{ o }}</option>
                        }
                      </select>
                    }
                    @case ('checkbox') {
                      <div class="flex gap-3 flex-wrap pt-1">
                        @for (o of c.opciones ?? []; track o) {
                          <label class="text-sm flex items-center gap-1">
                            <input
                              type="checkbox"
                              [checked]="customChecked(c.id, o)"
                              (change)="toggleCustomCheckbox(c.id, o, $any($event.target).checked)"
                            /> {{ o }}
                          </label>
                        }
                      </div>
                    }
                    @case ('radio') {
                      <div class="flex gap-3 flex-wrap pt-1">
                        @for (o of c.opciones ?? []; track o) {
                          <label class="text-sm flex items-center gap-1">
                            <input
                              type="radio"
                              [name]="'c_' + c.id"
                              [checked]="customValue(c.id) === o"
                              (change)="setCustom(c.id, o)"
                            /> {{ o }}
                          </label>
                        }
                      </div>
                    }
                    @default {
                      <input [type]="c.tipo" [value]="customValue(c.id)" (input)="setCustom(c.id, $any($event.target).value)" [class]="c.requerido ? inpReq() : inp" />
                    }
                  }
                  @if (errores()['c_' + c.id]) {
                    <p class="text-[11px] text-destructive mt-1">{{ errores()['c_' + c.id] }}</p>
                  }
                </div>
              }
            </div>
          </section>
        }
      </fieldset>

      <div class="flex justify-end gap-2 pt-2">
        <button type="button" (click)="cancelled.emit()" class="btn-secondary">
          {{ cancelLabel() ?? (readOnly() ? 'Volver' : 'Cancelar') }}
        </button>
        @if (!readOnly()) {
          <button
            type="button"
            (click)="guardar()"
            class="btn-primary px-5"
          >
            {{ saveLabel() ?? 'Guardar registro' }}
          </button>
        }
      </div>
    </div>
  `,
})
export class CursoFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly areaService = inject(AreaService);
  private readonly reglasService = inject(ReglasService);
  private readonly camposService = inject(CamposService);

  readonly tipo = input.required<TipoCurso>();
  readonly initial = input<Partial<CursoFormState> | undefined>(undefined);
  readonly readOnly = input(false);
  readonly saveLabel = input<string | undefined>(undefined);
  readonly cancelLabel = input<string | undefined>(undefined);
  readonly capacitacionesVinculables = input<{ id: string; codigo: string; nombreTema: string }[]>([]);

  readonly saved = output<CursoFormState>();
  readonly cancelled = output<void>();

  readonly SparklesIcon = Sparkles;
  readonly MapPinIcon = MapPin;
  readonly CompassIcon = Compass;
  readonly InfoIcon = Info;

  readonly inp = INP;
  /** Obligatorios en ámbar solo en edición; en modo lectura mantienen el estilo neutro. */
  readonly inpReq = computed(() => (this.readOnly() ? INP : INP_REQ));
  readonly inpDisabled = INP_DISABLED;
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

  ngOnInit(): void {
    const initial = this.initial();
    const codigoAuto =
      initial?.codigo ??
      `${this.tipo() === 'capacitacion' ? 'CAP' : 'AST'}-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
    this.form.patchValue({ ...EMPTY, ...initial, codigo: codigoAuto });
    this.custom.set({ ...(initial?.custom ?? {}) });
    this.form.valueChanges.subscribe(() => this.formTick.update((t) => t + 1));
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
