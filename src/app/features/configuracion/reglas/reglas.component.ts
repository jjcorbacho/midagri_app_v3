import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AreaService } from '../../../core/services/area.service';
import { ReglasService } from '../../../core/services/reglas.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  AreaConfig,
  CriterioExito,
  MetaGeneral,
  PeriodoMedicion,
} from '../../../core/models/area-config.model';
import { getArea } from '../../../core/constants/areas.const';

/** Título de la sección de meta global (modificable a futuro sin tocar el template). */
const TITULO_META_GENERAL = 'Meta General';

/** Subconjunto de la configuración que edita esta pantalla. El resto de
 *  `AreaConfig` (campos legacy) se conserva tal cual al guardar. */
interface ReglasEditables {
  capacitacionActiva: boolean;
  asistenciaActiva: boolean;
  atIndividualActiva: boolean;
  atGrupalActiva: boolean;
  capacitacion: { horasMin: number; horasMax: number; participantesMax: number };
  asistencia: { horasMin: number; horasMax: number; participantesMax: number };
  metaGeneral: MetaGeneral;
  metaCapacitaciones: number;
  metaAT: number;
  criterioExito: CriterioExito;
  periodoMedicion: PeriodoMedicion;
}

/** Un campo numérico vaciado llega como `null`: cuenta como 0. */
const num = (v: number): number => Number(v) || 0;

/** Proyección explícita — el orden de las claves lo aprovecha `dirty()`. */
function editablesDe(c: ReglasEditables | AreaConfig): ReglasEditables {
  return {
    capacitacionActiva: c.capacitacionActiva,
    asistenciaActiva: c.asistenciaActiva,
    atIndividualActiva: c.atIndividualActiva,
    atGrupalActiva: c.atGrupalActiva,
    capacitacion: {
      horasMin: num(c.capacitacion.horasMin),
      horasMax: num(c.capacitacion.horasMax),
      participantesMax: num(c.capacitacion.participantesMax),
    },
    asistencia: {
      horasMin: num(c.asistencia.horasMin),
      horasMax: num(c.asistencia.horasMax),
      participantesMax: num(c.asistencia.participantesMax),
    },
    metaGeneral: {
      capacitaciones: num(c.metaGeneral.capacitaciones),
      asistenciasTecnicas: num(c.metaGeneral.asistenciasTecnicas),
      hectareas: num(c.metaGeneral.hectareas),
    },
    metaCapacitaciones: num(c.metaCapacitaciones),
    metaAT: num(c.metaAT),
    criterioExito: c.criterioExito,
    periodoMedicion: c.periodoMedicion,
  };
}

function computeValidCriterio(cap: boolean, at: boolean, current: CriterioExito): CriterioExito {
  if (!cap && !at) return 'none';
  if (!cap && at) return 'solo_at';
  if (cap && !at) return 'solo_cap';
  // ambos ON
  if (current === 'solo_cap' || current === 'solo_at' || current === 'none') return 'combinada_paralela';
  return current;
}

/** Configurador de Reglas — actividades, aforos y criterios de éxito del área. */
@Component({
  selector: 'app-reglas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  template: `
    <section class="pagina" [formGroup]="form">
      <header class="cabecera">
        <div>
          <h1>Configurador de Reglas — {{ area().code }}</h1>
          <p>{{ area().name }}. Define actividades, aforos y criterios de éxito del periodo.</p>
        </div>
        <mat-chip disableRipple [class]="dirty() ? 'c-enviado' : 'c-aprobado'">
          {{ dirty() ? 'Borrador' : 'Publicado' }}
        </mat-chip>
      </header>

      <mat-card appearance="outlined" class="panel">
        <!-- 1. Actividades -->
        <section class="paso">
          <div class="titulo-paso">
            <span class="numero">1</span>
            <h2>Selección de actividades</h2>
          </div>
          <p class="ayuda">Elige qué actividades ejecuta esta área.</p>

          <div class="rejilla-2">
            <mat-card appearance="outlined" class="tarjeta" [class.activa]="valor().capacitacionActiva">
              <div class="encabezado-tarjeta">
                <span class="icono"><mat-icon fontSet="material-symbols-outlined">school</mat-icon></span>
                <div class="texto">
                  <p class="nombre">Capacitaciones grupales</p>
                  <p class="detalle">Eventos formativos con varios participantes.</p>
                </div>
                <mat-slide-toggle formControlName="capacitacionActiva" aria-label="Capacitaciones grupales" />
              </div>
            </mat-card>

            <mat-card appearance="outlined" class="tarjeta" [class.activa]="valor().asistenciaActiva">
              <div class="encabezado-tarjeta">
                <span class="icono"><mat-icon fontSet="material-symbols-outlined">support_agent</mat-icon></span>
                <div class="texto">
                  <p class="nombre">Asistencia técnica</p>
                  <p class="detalle">Intervenciones individuales o grupales en campo.</p>
                </div>
                <mat-slide-toggle formControlName="asistenciaActiva" aria-label="Asistencia técnica" />
              </div>

              <div class="subtipos" [class.inhabilitada]="!valor().asistenciaActiva">
                <mat-checkbox formControlName="atIndividualActiva">AT Individual</mat-checkbox>
                <mat-checkbox formControlName="atGrupalActiva">AT Grupal</mat-checkbox>
                @if (sinSubtipos()) {
                  <span class="error">Elige al menos un subtipo de AT.</span>
                }
              </div>
            </mat-card>
          </div>
        </section>

        <!-- 2. Aforos y duración -->
        <section class="paso">
          <div class="titulo-paso">
            <span class="numero">2</span>
            <h2>Aforos y duración permitida de la Capacitación y/o Asistencia técnica</h2>
          </div>
          <p class="ayuda">Rangos válidos para el registro de eventos.</p>

          @if (ambosOff()) {
            <p class="vacio">Activa al menos una actividad para configurar sus aforos.</p>
          }

          <div class="rejilla-2">
            @if (capOn()) {
              <mat-card appearance="outlined" class="tarjeta" formGroupName="capacitacion">
                <div class="encabezado-tarjeta">
                  <span class="icono"><mat-icon fontSet="material-symbols-outlined">school</mat-icon></span>
                  <div class="texto"><p class="nombre">Capacitaciones grupales</p></div>
                </div>
                <div class="rejilla-campos">
                  <mat-form-field class="campo">
                    <mat-label>Horas mínimas</mat-label>
                    <input matInput type="number" min="1" formControlName="horasMin" />
                  </mat-form-field>
                  <mat-form-field class="campo">
                    <mat-label>Horas máximas</mat-label>
                    <input
                      matInput
                      type="number"
                      formControlName="horasMax"
                      [errorStateMatcher]="matcherDe('capHorasMax')"
                    />
                    <mat-error>{{ errores()['capHorasMax'] }}</mat-error>
                  </mat-form-field>
                  <mat-form-field class="campo">
                    <mat-label>Aforo mínimo</mat-label>
                    <!-- Fijo en 1: el control va deshabilitado, no solo atenuado. -->
                    <input matInput disabled value="1" />
                    <mat-icon matSuffix fontSet="material-symbols-outlined">lock</mat-icon>
                  </mat-form-field>
                  <mat-form-field class="campo">
                    <mat-label>Aforo máximo</mat-label>
                    <input
                      matInput
                      type="number"
                      min="1"
                      formControlName="participantesMax"
                      [errorStateMatcher]="matcherDe('capAforoMax')"
                    />
                    <mat-error>{{ errores()['capAforoMax'] }}</mat-error>
                  </mat-form-field>
                </div>
              </mat-card>
            }

            @if (atOn()) {
              <mat-card appearance="outlined" class="tarjeta" formGroupName="asistencia">
                <div class="encabezado-tarjeta">
                  <span class="icono"><mat-icon fontSet="material-symbols-outlined">support_agent</mat-icon></span>
                  <div class="texto">
                    <p class="nombre">Asistencia técnica</p>
                    <p class="detalle">
                      {{ soloAtIndividual()
                        ? 'AT Individual · sin aforo grupal.'
                        : 'Aforo y duración únicos para AT (aplica a Individual y Grupal).' }}
                    </p>
                  </div>
                </div>
                <div class="rejilla-campos">
                  <mat-form-field class="campo">
                    <mat-label>Horas mínimas</mat-label>
                    <input matInput type="number" min="1" formControlName="horasMin" />
                  </mat-form-field>
                  <mat-form-field class="campo">
                    <mat-label>Horas máximas</mat-label>
                    <input
                      matInput
                      type="number"
                      formControlName="horasMax"
                      [errorStateMatcher]="matcherDe('atHorasMax')"
                    />
                    <mat-error>{{ errores()['atHorasMax'] }}</mat-error>
                  </mat-form-field>
                  @if (!soloAtIndividual()) {
                    <mat-form-field class="campo">
                      <mat-label>Aforo mínimo</mat-label>
                      <input matInput disabled value="1" />
                      <mat-icon matSuffix fontSet="material-symbols-outlined">lock</mat-icon>
                    </mat-form-field>
                    <mat-form-field class="campo">
                      <mat-label>Aforo máximo</mat-label>
                      <input
                        matInput
                        type="number"
                        min="1"
                        formControlName="participantesMax"
                        [errorStateMatcher]="matcherDe('atAforoMax')"
                      />
                      <mat-error>{{ errores()['atAforoMax'] }}</mat-error>
                    </mat-form-field>
                  }
                </div>
              </mat-card>
            }
          </div>
        </section>

        <!-- 3. Meta General -->
        <section class="paso">
          <div class="titulo-paso">
            <span class="numero">3</span>
            <h2>{{ tituloMetaGeneral }}</h2>
          </div>
          <p class="ayuda">Meta global que deberá cumplir un participante durante el periodo.</p>

          <mat-card appearance="outlined" class="tarjeta" formGroupName="metaGeneral">
            <div class="encabezado-tarjeta">
              <span class="icono"><mat-icon fontSet="material-symbols-outlined">target</mat-icon></span>
              <div class="texto"><p class="nombre">Criterio: {{ tituloMetaGeneral }}</p></div>
            </div>
            <div class="rejilla-campos tres">
              <mat-form-field class="campo">
                <mat-label>Cantidad de Capacitaciones</mat-label>
                <input matInput type="number" min="0" formControlName="capacitaciones" />
              </mat-form-field>
              <mat-form-field class="campo">
                <mat-label>Cantidad de Asistencia Técnica</mat-label>
                <input matInput type="number" min="0" formControlName="asistenciasTecnicas" />
              </mat-form-field>
              <mat-form-field class="campo">
                <mat-label>Cantidad de Hectáreas</mat-label>
                <input matInput type="number" min="0" formControlName="hectareas" />
              </mat-form-field>
            </div>
          </mat-card>
        </section>

        <!-- 4. Criterio de éxito -->
        <section class="paso">
          <div class="titulo-paso">
            <span class="numero">4</span>
            <h2>Criterio de éxito por periodo del participante</h2>
          </div>
          <p class="ayuda">Fórmula bajo la cual un participante completa el periodo.</p>

          @if (ambosOff()) {
            <mat-card appearance="outlined" class="tarjeta alerta">
              <div class="encabezado-tarjeta">
                <span class="icono error"><mat-icon fontSet="material-symbols-outlined">warning</mat-icon></span>
                <div class="texto">
                  <p class="nombre">El área no computará progreso.</p>
                  <p class="detalle">Activa al menos una actividad para definir el criterio de éxito.</p>
                </div>
              </div>
            </mat-card>
          } @else if (capOn() && atOn()) {
            <div class="combinada">
              <mat-button-toggle-group
                [value]="modoCombinado()"
                (valueChange)="setModoCombinado($event)"
                hideSingleSelectionIndicator
                aria-label="Forma de combinar las metas"
              >
                <mat-button-toggle value="paralela">Independiente / paralela</mat-button-toggle>
                <mat-button-toggle value="cruzada">Configuración cruzada</mat-button-toggle>
              </mat-button-toggle-group>

              <mat-card appearance="outlined" class="tarjeta">
                @if (modoCombinado() === 'paralela') {
                  <p class="detalle">
                    Configura metas separadas para capacitaciones y AT. El participante puede alcanzar los
                    estados <strong>Capacitado</strong>, <strong>Asistido</strong> o
                    <strong>Capacitado y Asistido</strong> según cuál meta cumpla.
                  </p>
                } @else {
                  <p class="detalle">
                    Fórmula cruzada: el participante debe cumplir <strong>ambas metas</strong> en el mismo
                    periodo. Resulta en un estatus único <strong>“Atendido”</strong>.
                  </p>
                }

                <div class="rejilla-campos">
                  <mat-form-field class="campo">
                    <mat-label>{{ modoCombinado() === 'paralela' ? 'Meta capacitaciones' : 'Capacitaciones ≥' }}</mat-label>
                    <input
                      matInput
                      type="number"
                      min="1"
                      formControlName="metaCapacitaciones"
                      [errorStateMatcher]="matcherDe('metaCapacitaciones')"
                    />
                    @if (errores()['metaCapacitaciones']) {
                      <mat-error>{{ errores()['metaCapacitaciones'] }}</mat-error>
                    } @else {
                      <mat-hint>≥ N sesiones por periodo.</mat-hint>
                    }
                  </mat-form-field>
                  <mat-form-field class="campo">
                    <mat-label>{{ modoCombinado() === 'paralela' ? 'Meta asistencias técnicas' : 'Asistencias técnicas ≥' }}</mat-label>
                    <input
                      matInput
                      type="number"
                      min="1"
                      formControlName="metaAT"
                      [errorStateMatcher]="matcherDe('metaAT')"
                    />
                    @if (errores()['metaAT']) {
                      <mat-error>{{ errores()['metaAT'] }}</mat-error>
                    } @else {
                      <mat-hint>≥ N atenciones por periodo.</mat-hint>
                    }
                  </mat-form-field>
                </div>

                <div class="resultados">
                  @if (modoCombinado() === 'paralela') {
                    <mat-chip disableRipple class="c-validado">Capacitado</mat-chip>
                    <mat-chip disableRipple class="c-validado">Asistido</mat-chip>
                    <mat-chip disableRipple class="c-marca">Capacitado y Asistido</mat-chip>
                  } @else {
                    <mat-chip disableRipple class="c-marca">Cumple ambas → “Atendido”</mat-chip>
                  }
                </div>
              </mat-card>
            </div>
          } @else {
            <mat-card appearance="outlined" class="tarjeta">
              <p class="detalle">
                @if (capOn()) {
                  Sólo capacitaciones activas. Define la meta para considerar al participante
                  <strong>“Capacitado”</strong>.
                } @else {
                  Sólo asistencia técnica activa. Define la meta para considerar al participante
                  <strong>“Asistido”</strong>.
                }
              </p>
              @if (capOn()) {
                <mat-form-field class="campo">
                  <mat-label>Meta de capacitaciones (por periodo)</mat-label>
                  <input
                    matInput
                    type="number"
                    min="1"
                    formControlName="metaCapacitaciones"
                    [errorStateMatcher]="matcherDe('metaCapacitaciones')"
                  />
                  @if (errores()['metaCapacitaciones']) {
                    <mat-error>{{ errores()['metaCapacitaciones'] }}</mat-error>
                  } @else {
                    <mat-hint>Cantidad mínima para cumplir el criterio.</mat-hint>
                  }
                </mat-form-field>
              } @else {
                <mat-form-field class="campo">
                  <mat-label>Meta de asistencias técnicas (por periodo)</mat-label>
                  <input
                    matInput
                    type="number"
                    min="1"
                    formControlName="metaAT"
                    [errorStateMatcher]="matcherDe('metaAT')"
                  />
                  @if (errores()['metaAT']) {
                    <mat-error>{{ errores()['metaAT'] }}</mat-error>
                  } @else {
                    <mat-hint>Cantidad mínima para cumplir el criterio.</mat-hint>
                  }
                </mat-form-field>
              }
            </mat-card>
          }
        </section>

        <!-- 5. Periodo y cierre -->
        <section class="paso">
          <div class="titulo-paso">
            <span class="numero">5</span>
            <h2>Periodo de medición y cierre</h2>
          </div>
          <p class="ayuda">Frecuencia de evaluación y política de reinicio.</p>

          <div class="rejilla-2">
            <mat-form-field class="campo">
              <mat-label>Periodo de medición</mat-label>
              <mat-select formControlName="periodoMedicion">
                <mat-option value="mensual">Mensual</mat-option>
                <mat-option value="trimestral">Trimestral</mat-option>
                <mat-option value="semestral">Semestral</mat-option>
                <mat-option value="anual">Anual</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-card appearance="outlined" class="tarjeta nota">
              <div class="encabezado-tarjeta">
                <span class="icono"><mat-icon fontSet="material-symbols-outlined">info</mat-icon></span>
                <div class="texto">
                  <p class="detalle"><strong>Contabilización independiente por área.</strong></p>
                  <p class="detalle">
                    <strong>Cierre de periodo:</strong> al finalizar se archiva el estado alcanzado y los
                    contadores se reinician a 0.
                  </p>
                </div>
              </div>
            </mat-card>
          </div>
        </section>

        <!-- Pie fijo -->
        <div class="pie">
          <span class="estado">
            <mat-icon fontSet="material-symbols-outlined">{{ dirty() ? 'edit' : 'check_circle' }}</mat-icon>
            {{ dirty() ? 'Cambios sin guardar' : 'Sin cambios pendientes' }}
          </span>
          <div class="botones">
            <button matButton type="button" [disabled]="!dirty()" (click)="descartar()">
              <mat-icon fontSet="material-symbols-outlined">restart_alt</mat-icon>
              Cancelar
            </button>
            <button matButton="filled" type="button" [disabled]="!canSave()" (click)="guardar()">
              <mat-icon fontSet="material-symbols-outlined">save</mat-icon>
              Guardar cambios
            </button>
          </div>
        </div>
      </mat-card>
    </section>
  `,
  styles: `
    .pagina {
      padding: 24px;
      max-width: 1100px;
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

    .panel { padding: 0; overflow: hidden; }

    .paso { padding: 24px; border-bottom: 1px solid var(--mat-sys-outline-variant); }
    .titulo-paso { display: flex; align-items: center; gap: 8px; }
    .numero {
      flex: none;
      width: 22px;
      height: 22px;
      display: grid;
      place-items: center;
      border-radius: var(--mat-sys-corner-full);
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      font: var(--mat-sys-label-small);
      font-weight: 700;
    }
    .titulo-paso h2 {
      margin: 0;
      font: var(--mat-sys-title-small);
      color: var(--mat-sys-on-surface);
    }
    .ayuda {
      margin: 4px 0 16px 30px;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }
    .vacio {
      margin: 0 0 16px;
      font: var(--mat-sys-body-small);
      font-style: italic;
      color: var(--mat-sys-on-surface-variant);
    }

    .rejilla-2 {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 16px;
      align-items: start;
    }
    @media (min-width: 768px) { .rejilla-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

    .tarjeta { padding: 16px; }
    .tarjeta.activa { border-color: var(--mat-sys-primary); }
    .tarjeta.alerta { border-color: var(--mat-sys-error); }
    .encabezado-tarjeta { display: flex; align-items: flex-start; gap: 12px; }
    .icono {
      flex: none;
      width: 32px;
      height: 32px;
      display: grid;
      place-items: center;
      border-radius: var(--mat-sys-corner-small);
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }
    .icono.error {
      background: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
    }
    .icono mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .texto { flex: 1 1 auto; min-width: 0; }
    .nombre {
      margin: 0;
      font: var(--mat-sys-body-medium);
      font-weight: 600;
      color: var(--mat-sys-on-surface);
    }
    .detalle {
      margin: 4px 0 0;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }

    .subtipos {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px 16px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--mat-sys-outline-variant);
      transition: opacity 120ms;
    }
    .subtipos.inhabilitada { opacity: 0.5; }
    .error { font: var(--mat-sys-body-small); color: var(--mat-sys-error); }

    .rejilla-campos {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 4px 16px;
      margin-top: 16px;
    }
    .rejilla-campos.tres { grid-template-columns: minmax(0, 1fr); }
    @media (min-width: 768px) {
      .rejilla-campos.tres { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
    .campo { width: 100%; }
    /* Un campo suelto en la tarjeta necesita aire: la etiqueta flotante de
       Material se dibuja sobre el borde y pisaría el párrafo anterior. */
    .tarjeta > .campo { margin-top: 16px; }
    input[type='number'] { font-variant-numeric: tabular-nums; }

    .combinada { display: flex; flex-direction: column; gap: 16px; }
    .resultados { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
    .tarjeta.nota { background: var(--mat-sys-surface-container-low); }

    .pie {
      position: sticky;
      bottom: 0;
      z-index: 2;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 24px;
      background: var(--mat-sys-surface-container-low);
      border-top: 1px solid var(--mat-sys-outline-variant);
    }
    .estado {
      display: flex;
      align-items: center;
      gap: 6px;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }
    .estado mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .botones { display: flex; gap: 8px; }
  `,
})
export class ReglasComponent {
  private readonly areaService = inject(AreaService);
  private readonly reglasService = inject(ReglasService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly tituloMetaGeneral = TITULO_META_GENERAL;

  readonly area = computed(() => getArea(this.areaService.currentArea()));
  readonly saved = computed(() => this.reglasService.configs()[this.areaService.currentArea()]);

  readonly form = this.fb.nonNullable.group({
    capacitacionActiva: true,
    asistenciaActiva: true,
    atIndividualActiva: true,
    atGrupalActiva: true,
    capacitacion: this.fb.nonNullable.group({ horasMin: 1, horasMax: 1, participantesMax: 1 }),
    asistencia: this.fb.nonNullable.group({ horasMin: 1, horasMax: 1, participantesMax: 1 }),
    metaGeneral: this.fb.nonNullable.group({
      capacitaciones: 0,
      asistenciasTecnicas: 0,
      hectareas: 0,
    }),
    metaCapacitaciones: 1,
    metaAT: 1,
    criterioExito: 'combinada_paralela' as CriterioExito,
    periodoMedicion: 'anual' as PeriodoMedicion,
  });

  /** Los cambios del formulario no son señales: este contador los propaga. */
  private readonly cambios = signal(0);

  readonly valor = computed<ReglasEditables>(() => {
    this.cambios();
    return editablesDe(this.form.getRawValue());
  });

  private prev = { cap: true, at: true };

  constructor() {
    // Recarga el formulario al cambiar de área o al guardar. Sin `emitEvent`
    // para que la cascada de subtipos no reinterprete los datos cargados.
    effect(() => {
      const s = this.saved();
      this.form.reset(editablesDe(s), { emitEvent: false });
      this.prev = { cap: s.capacitacionActiva, at: s.asistenciaActiva };
      this.cambios.update((c) => c + 1);
    });

    this.form.valueChanges.subscribe(() => this.cambios.update((c) => c + 1));

    // Activar/desactivar AT arrastra sus subtipos: al apagarla se limpian y al
    // encenderla debe quedar al menos uno marcado.
    this.form.controls.asistenciaActiva.valueChanges.subscribe((activa) => {
      const { atIndividualActiva, atGrupalActiva } = this.form.getRawValue();
      if (!activa) {
        this.form.patchValue({ atIndividualActiva: false, atGrupalActiva: false });
      } else if (!atIndividualActiva && !atGrupalActiva) {
        this.form.patchValue({ atIndividualActiva: true, atGrupalActiva: true });
      }
    });

    // Ajuste automático del criterio de éxito según las actividades activas.
    effect(() => {
      const v = this.valor();
      const cap = v.capacitacionActiva;
      const at = v.asistenciaActiva;
      const valido = computeValidCriterio(cap, at, v.criterioExito);
      if (valido !== v.criterioExito) {
        if (this.prev.cap !== cap || this.prev.at !== at) {
          if (valido === 'none') this.toast.warning('El área no computará progreso: sin actividades activas.');
          else this.toast.info('Criterio de éxito ajustado automáticamente a las actividades activas.');
        }
        this.form.controls.criterioExito.setValue(valido);
      }
      this.prev = { cap, at };
    });
  }

  /* ===== Flags derivados ===== */
  readonly capOn = computed(() => this.valor().capacitacionActiva);
  readonly atOn = computed(() => {
    const v = this.valor();
    return v.asistenciaActiva && (v.atIndividualActiva || v.atGrupalActiva);
  });
  readonly soloAtIndividual = computed(
    () => this.atOn() && this.valor().atIndividualActiva && !this.valor().atGrupalActiva,
  );
  readonly ambosOff = computed(() => !this.capOn() && !this.atOn());
  readonly sinSubtipos = computed(() => {
    const v = this.valor();
    return v.asistenciaActiva && !v.atIndividualActiva && !v.atGrupalActiva;
  });

  /** Pestaña activa del criterio combinado. */
  readonly modoCombinado = computed(() =>
    this.valor().criterioExito === 'combinada_cruzada' ? 'cruzada' : 'paralela',
  );

  setModoCombinado(modo: 'paralela' | 'cruzada'): void {
    this.form.controls.criterioExito.setValue(
      modo === 'cruzada' ? 'combinada_cruzada' : 'combinada_paralela',
    );
  }

  /**
   * La validación es propia (mensajes por campo en `errores`), así que el estado
   * de error de cada campo lo decide ese mapa y no los validadores del control.
   */
  readonly errores = computed<Record<string, string>>(() => {
    const v = this.valor();
    const e: Record<string, string> = {};
    if (this.capOn()) {
      if (v.capacitacion.horasMax < v.capacitacion.horasMin) {
        e['capHorasMax'] = 'Debe ser mayor o igual a las horas mínimas.';
      }
      if (v.capacitacion.participantesMax < 1) {
        e['capAforoMax'] = 'El aforo máximo debe ser al menos 1.';
      }
    }
    if (this.atOn()) {
      if (v.asistencia.horasMax < v.asistencia.horasMin) {
        e['atHorasMax'] = 'Debe ser mayor o igual a las horas mínimas.';
      }
      if (!this.soloAtIndividual() && v.asistencia.participantesMax < 1) {
        e['atAforoMax'] = 'El aforo máximo debe ser al menos 1.';
      }
    }
    if (['solo_cap', 'combinada_paralela', 'combinada_cruzada'].includes(v.criterioExito) && v.metaCapacitaciones < 1) {
      e['metaCapacitaciones'] = 'Indique al menos 1 capacitación.';
    }
    if (['solo_at', 'combinada_paralela', 'combinada_cruzada'].includes(v.criterioExito) && v.metaAT < 1) {
      e['metaAT'] = 'Indique al menos 1 asistencia técnica.';
    }
    return e;
  });

  private readonly matchers = new Map<string, ErrorStateMatcher>();

  matcherDe(campo: string): ErrorStateMatcher {
    let matcher = this.matchers.get(campo);
    if (!matcher) {
      matcher = { isErrorState: () => !!this.errores()[campo] };
      this.matchers.set(campo, matcher);
    }
    return matcher;
  }

  readonly dirty = computed(
    () => JSON.stringify(this.valor()) !== JSON.stringify(editablesDe(this.saved())),
  );
  readonly canSave = computed(
    () => this.dirty() && Object.keys(this.errores()).length === 0 && !this.sinSubtipos(),
  );

  descartar(): void {
    this.form.reset(editablesDe(this.saved()), { emitEvent: false });
    this.cambios.update((c) => c + 1);
  }

  guardar(): void {
    const v = this.valor();
    const base = this.saved();
    // Los campos legacy de `AreaConfig` no se editan aquí: se conservan.
    this.reglasService.setConfig(this.areaService.currentArea(), {
      ...base,
      ...v,
      capacitacion: { ...base.capacitacion, ...v.capacitacion },
      asistencia: { ...base.asistencia, ...v.asistencia },
      metaGeneral: { ...v.metaGeneral },
    });
    this.toast.success('Reglas del área guardadas.');
  }
}
