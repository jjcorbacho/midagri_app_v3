import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import {
  LucideAngularModule,
  Save, RotateCcw, GraduationCap, Headset, Users, Clock, Target,
  AlertTriangle, Info, Lock, CheckCircle2, Sprout,
} from 'lucide-angular';
import { AreaService } from '../../../core/services/area.service';
import { ReglasService } from '../../../core/services/reglas.service';
import { ToastService } from '../../../core/services/toast.service';
import { AreaConfig, CriterioExito, MetaGeneral, PeriodoMedicion } from '../../../core/models/area-config.model';
import { getArea } from '../../../core/constants/areas.const';

/** Título de la sección de meta global (modificable a futuro sin tocar el template). */
const TITULO_META_GENERAL = 'Meta General';

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
  imports: [LucideAngularModule],
  template: `
    <div class="min-h-full bg-muted/30 py-6 lg:py-8 px-4 lg:px-8 animate-page-in">
      <div class="max-w-6xl mx-auto bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">

        <!-- Header -->
        <header class="px-6 py-4 border-b border-border bg-card flex justify-between items-center gap-3">
          <div class="min-w-0">
            <h1 class="text-h1 text-foreground">Configurador de Reglas — {{ area().code }}</h1>
            <p class="text-xs text-muted-foreground truncate">
              {{ area().name }}. Define actividades, aforos y criterios de éxito del periodo.
            </p>
          </div>
          <span
            class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border"
            [class]="dirty() ? 'bg-warning-soft text-warning-foreground border-warning/30' : 'bg-brand/10 text-brand border-brand/20'"
          >{{ dirty() ? 'Borrador' : 'Publicado' }}</span>
        </header>

        <!-- Main form -->
        <div class="grid grid-cols-1 lg:grid-cols-12">
          <div class="lg:col-span-10 lg:col-start-2 p-6 space-y-9">

            <!-- 1. Actividades -->
            <section class="space-y-3">
              <div class="flex items-center gap-2">
                <span class="flex items-center justify-center size-5 rounded-full bg-brand text-brand-foreground text-[10px] font-bold">1</span>
                <h3 class="text-sm font-semibold text-foreground">Selección de actividades</h3>
              </div>
              <p class="text-xs text-muted-foreground -mt-1.5 pl-7">Elige qué actividades ejecuta esta área.</p>
              <div class="pt-1">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    (click)="setCapActiva(!draft().capacitacionActiva)"
                    class="text-left rounded-lg border p-3 transition-all"
                    [class]="draft().capacitacionActiva ? 'border-brand bg-brand/5' : 'border-border bg-background hover:bg-muted/40'"
                  >
                    <div class="flex items-start gap-3">
                      <span
                        class="size-8 rounded-md grid place-items-center shrink-0"
                        [class]="draft().capacitacionActiva ? 'bg-brand/15 text-brand' : 'bg-muted text-muted-foreground'"
                      ><lucide-angular [img]="GraduationCapIcon" class="size-4" /></span>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between gap-2">
                          <p class="text-sm font-semibold text-foreground">Capacitaciones grupales</p>
                          <span
                            role="switch"
                            [attr.aria-checked]="draft().capacitacionActiva"
                            (click)="$event.stopPropagation(); setCapActiva(!draft().capacitacionActiva)"
                            class="relative w-9 h-5 rounded-full transition-colors shrink-0 cursor-pointer"
                            [class]="draft().capacitacionActiva ? 'bg-brand' : 'bg-input'"
                          >
                            <span class="absolute top-0.5 left-0.5 size-4 bg-background rounded-full shadow transition-transform"
                              [class.translate-x-4]="draft().capacitacionActiva"></span>
                          </span>
                        </div>
                        <p class="text-[11px] text-muted-foreground mt-0.5">Eventos formativos con varios participantes.</p>
                      </div>
                    </div>
                  </button>
                  <div
                    role="button"
                    tabindex="0"
                    [attr.aria-pressed]="draft().asistenciaActiva"
                    (click)="setAtActiva(!draft().asistenciaActiva)"
                    (keydown.enter)="setAtActiva(!draft().asistenciaActiva)"
                    class="text-left rounded-lg border p-3 transition-all cursor-pointer"
                    [class]="draft().asistenciaActiva ? 'border-brand bg-brand/5' : 'border-border bg-background hover:bg-muted/40'"
                  >
                    <div class="flex items-start gap-3">
                      <span
                        class="size-8 rounded-md grid place-items-center shrink-0"
                        [class]="draft().asistenciaActiva ? 'bg-brand/15 text-brand' : 'bg-muted text-muted-foreground'"
                      ><lucide-angular [img]="HeadsetIcon" class="size-4" /></span>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between gap-2">
                          <p class="text-sm font-semibold text-foreground">Asistencia técnica</p>
                          <span
                            role="switch"
                            [attr.aria-checked]="draft().asistenciaActiva"
                            (click)="$event.stopPropagation(); setAtActiva(!draft().asistenciaActiva)"
                            class="relative w-9 h-5 rounded-full transition-colors shrink-0 cursor-pointer"
                            [class]="draft().asistenciaActiva ? 'bg-brand' : 'bg-input'"
                          >
                            <span class="absolute top-0.5 left-0.5 size-4 bg-background rounded-full shadow transition-transform"
                              [class.translate-x-4]="draft().asistenciaActiva"></span>
                          </span>
                        </div>
                        <p class="text-[11px] text-muted-foreground mt-0.5">Intervenciones individuales o grupales en campo.</p>

                        <!-- Subtipos de AT (misma lógica; reubicados dentro de la tarjeta) -->
                        <div
                          class="mt-2.5 pt-2.5 border-t border-border/60 flex flex-wrap gap-4 transition-opacity"
                          [class]="draft().asistenciaActiva ? 'opacity-100' : 'opacity-40 pointer-events-none'"
                          (click)="$event.stopPropagation()"
                          (keydown.enter)="$event.stopPropagation()"
                        >
                          <label class="flex items-center gap-2 cursor-pointer text-xs text-foreground/80 select-none">
                            <input
                              type="checkbox"
                              class="size-3.5 accent-brand cursor-pointer"
                              [checked]="draft().atIndividualActiva"
                              (change)="update({ atIndividualActiva: $any($event.target).checked })"
                            />
                            AT Individual
                          </label>
                          <label class="flex items-center gap-2 cursor-pointer text-xs text-foreground/80 select-none">
                            <input
                              type="checkbox"
                              class="size-3.5 accent-brand cursor-pointer"
                              [checked]="draft().atGrupalActiva"
                              (change)="update({ atGrupalActiva: $any($event.target).checked })"
                            />
                            AT Grupal
                          </label>
                          @if (draft().asistenciaActiva && !draft().atIndividualActiva && !draft().atGrupalActiva) {
                            <span class="text-[11px] text-destructive">Elige al menos un subtipo de AT.</span>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- 2. Aforos & duración -->
            <section class="space-y-3">
              <div class="flex items-center gap-2">
                <span class="flex items-center justify-center size-5 rounded-full bg-brand text-brand-foreground text-[10px] font-bold">2</span>
                <h3 class="text-sm font-semibold text-foreground">Aforos y duración permitida de la Capacitación y/o Asistencia técnica</h3>
              </div>
              <p class="text-xs text-muted-foreground -mt-1.5 pl-7">Rangos válidos para el registro de eventos.</p>
              <div class="pt-1">
                @if (!capOn() && !atOn()) {
                  <p class="text-xs text-muted-foreground italic">Activa al menos una actividad para configurar sus aforos.</p>
                }
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  @if (capOn()) {
                    <div class="rounded-lg border bg-background p-4 space-y-3" [class]="capInvalid() ? 'border-destructive/40' : 'border-border'">
                      <div class="flex items-center gap-2">
                        <span class="size-7 rounded-md grid place-items-center bg-brand/10 text-brand shrink-0">
                          <lucide-angular [img]="GraduationCapIcon" class="size-4" />
                        </span>
                        <div class="min-w-0">
                          <p class="text-sm font-semibold text-foreground">Capacitaciones grupales</p>
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                            <lucide-angular [img]="ClockIcon" class="size-3" /> Horas mínimas
                          </label>
                          <input type="number" min="1" [value]="draft().capacitacion.horasMin"
                            (input)="updateCap('horasMin', $event)"
                            class="w-full h-9 bg-background border border-input rounded-md px-3 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-brand" />
                        </div>
                        <div>
                          <label class="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                            <lucide-angular [img]="ClockIcon" class="size-3" /> Horas máximas
                          </label>
                          <input type="number" [min]="draft().capacitacion.horasMin" [value]="draft().capacitacion.horasMax"
                            (input)="updateCap('horasMax', $event)"
                            class="w-full h-9 bg-background border rounded-md px-3 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-brand"
                            [class]="draft().capacitacion.horasMax < draft().capacitacion.horasMin ? 'border-destructive' : 'border-input'" />
                        </div>
                        <div>
                          <label class="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                            <lucide-angular [img]="UsersIcon" class="size-3" /> Aforo mínimo
                          </label>
                          <div class="relative">
                            <input disabled value="1" readonly
                              class="w-full h-9 bg-muted/60 border border-input rounded-md px-3 text-sm text-muted-foreground tabular-nums cursor-not-allowed" />
                            <lucide-angular [img]="LockIcon" class="size-3 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2" />
                          </div>
                        </div>
                        <div>
                          <label class="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                            <lucide-angular [img]="UsersIcon" class="size-3" /> Aforo máximo
                          </label>
                          <input type="number" min="1" [value]="draft().capacitacion.participantesMax"
                            (input)="updateCap('participantesMax', $event)"
                            class="w-full h-9 bg-background border border-input rounded-md px-3 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-brand" />
                        </div>
                      </div>
                    </div>
                  }
                  @if (atOn()) {
                    <div class="rounded-lg border bg-background p-4 space-y-3" [class]="atInvalid() ? 'border-destructive/40' : 'border-border'">
                      <div class="flex items-center gap-2">
                        <span class="size-7 rounded-md grid place-items-center bg-brand/10 text-brand shrink-0">
                          <lucide-angular [img]="HeadsetIcon" class="size-4" />
                        </span>
                        <div class="min-w-0">
                          <p class="text-sm font-semibold text-foreground">Asistencia técnica</p>
                          <p class="text-[11px] text-muted-foreground">
                            {{ soloAtIndividual()
                              ? 'AT Individual · sin aforo grupal.'
                              : 'Aforo y duración únicos para AT (aplica a Individual y Grupal).' }}
                          </p>
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                            <lucide-angular [img]="ClockIcon" class="size-3" /> Horas mínimas
                          </label>
                          <input type="number" min="1" [value]="draft().asistencia.horasMin"
                            (input)="updateAt('horasMin', $event)"
                            class="w-full h-9 bg-background border border-input rounded-md px-3 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-brand" />
                        </div>
                        <div>
                          <label class="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                            <lucide-angular [img]="ClockIcon" class="size-3" /> Horas máximas
                          </label>
                          <input type="number" [min]="draft().asistencia.horasMin" [value]="draft().asistencia.horasMax"
                            (input)="updateAt('horasMax', $event)"
                            class="w-full h-9 bg-background border rounded-md px-3 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-brand"
                            [class]="draft().asistencia.horasMax < draft().asistencia.horasMin ? 'border-destructive' : 'border-input'" />
                        </div>
                        @if (!soloAtIndividual()) {
                          <div>
                            <label class="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                              <lucide-angular [img]="UsersIcon" class="size-3" /> Aforo mínimo
                            </label>
                            <div class="relative">
                              <input disabled value="1" readonly
                                class="w-full h-9 bg-muted/60 border border-input rounded-md px-3 text-sm text-muted-foreground tabular-nums cursor-not-allowed" />
                              <lucide-angular [img]="LockIcon" class="size-3 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2" />
                            </div>
                          </div>
                          <div>
                            <label class="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                              <lucide-angular [img]="UsersIcon" class="size-3" /> Aforo máximo
                            </label>
                            <input type="number" min="1" [value]="draft().asistencia.participantesMax"
                              (input)="updateAt('participantesMax', $event)"
                              class="w-full h-9 bg-background border border-input rounded-md px-3 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-brand" />
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            </section>

            <!-- 3. Meta General -->
            <section class="space-y-3">
              <div class="flex items-center gap-2">
                <span class="flex items-center justify-center size-5 rounded-full bg-brand text-brand-foreground text-[10px] font-bold">3</span>
                <h3 class="text-sm font-semibold text-foreground">{{ tituloMetaGeneral }}</h3>
              </div>
              <p class="text-xs text-muted-foreground -mt-1.5 pl-7">Meta global que deberá cumplir un participante durante el periodo.</p>
              <div class="pt-1">
                <div class="rounded-lg border border-border bg-background p-4 space-y-3">
                  <div class="flex items-center gap-2">
                    <span class="size-7 rounded-md grid place-items-center bg-brand/10 text-brand shrink-0">
                      <lucide-angular [img]="TargetIcon" class="size-4" />
                    </span>
                    <p class="text-sm font-semibold text-foreground">Criterio: {{ tituloMetaGeneral }}</p>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label for="meta-general-cap" class="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        <lucide-angular [img]="GraduationCapIcon" class="size-3" /> Cantidad de Capacitaciones
                      </label>
                      <input id="meta-general-cap" type="number" min="0" [value]="draft().metaGeneral.capacitaciones"
                        (input)="updateMetaGeneral('capacitaciones', $event)"
                        class="w-full h-9 bg-background border border-input rounded-md px-3 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-brand" />
                    </div>
                    <div>
                      <label for="meta-general-at" class="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        <lucide-angular [img]="HeadsetIcon" class="size-3" /> Cantidad de Asistencia Técnica
                      </label>
                      <input id="meta-general-at" type="number" min="0" [value]="draft().metaGeneral.asistenciasTecnicas"
                        (input)="updateMetaGeneral('asistenciasTecnicas', $event)"
                        class="w-full h-9 bg-background border border-input rounded-md px-3 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-brand" />
                    </div>
                    <div>
                      <label for="meta-general-ha" class="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        <lucide-angular [img]="SproutIcon" class="size-3" /> Cantidad de Hectáreas
                      </label>
                      <input id="meta-general-ha" type="number" min="0" [value]="draft().metaGeneral.hectareas"
                        (input)="updateMetaGeneral('hectareas', $event)"
                        class="w-full h-9 bg-background border border-input rounded-md px-3 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-brand" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- 4. Criterio de éxito -->
            <section class="space-y-3">
              <div class="flex items-center gap-2">
                <span class="flex items-center justify-center size-5 rounded-full bg-brand text-brand-foreground text-[10px] font-bold">4</span>
                <h3 class="text-sm font-semibold text-foreground">Criterio de éxito por periodo del participante</h3>
              </div>
              <p class="text-xs text-muted-foreground -mt-1.5 pl-7">Fórmula bajo la cual un participante completa el periodo.</p>
              <div class="pt-1">
                @if (ambosOff()) {
                  <div class="rounded-lg bg-destructive/10 border border-destructive/20 p-4 flex items-start gap-3">
                    <lucide-angular [img]="AlertTriangleIcon" class="size-4 text-destructive shrink-0 mt-0.5" />
                    <div class="text-xs">
                      <p class="font-semibold text-destructive">El área no computará progreso.</p>
                      <p class="text-destructive/80 mt-0.5">Activa al menos una actividad para definir el criterio de éxito.</p>
                    </div>
                  </div>
                } @else if (capOn() && atOn()) {
                  <div class="space-y-3">
                    <div class="p-1 bg-muted rounded-lg flex">
                      <button
                        type="button"
                        (click)="update({ criterioExito: 'combinada_paralela' })"
                        class="flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors"
                        [class]="draft().criterioExito !== 'combinada_cruzada' ? 'bg-card shadow-sm text-brand border border-border' : 'text-muted-foreground hover:text-foreground'"
                      >Independiente / paralela</button>
                      <button
                        type="button"
                        (click)="update({ criterioExito: 'combinada_cruzada' })"
                        class="flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors"
                        [class]="draft().criterioExito === 'combinada_cruzada' ? 'bg-card shadow-sm text-brand border border-border' : 'text-muted-foreground hover:text-foreground'"
                      >Configuración cruzada</button>
                    </div>
                    <div class="rounded-lg bg-brand/5 border border-brand/15 p-4">
                      @if (draft().criterioExito !== 'combinada_cruzada') {
                        <div class="space-y-4">
                          <p class="text-xs text-muted-foreground leading-relaxed">
                            Configura metas separadas para capacitaciones y AT. El participante puede alcanzar los estados
                            <span class="font-semibold text-foreground">Capacitado</span>,
                            <span class="font-semibold text-foreground">Asistido</span> o
                            <span class="font-semibold text-foreground">Capacitado y Asistido</span> según cuál meta cumpla.
                          </p>
                          <div class="grid grid-cols-2 gap-4">
                            <div>
                              <label class="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                                <lucide-angular [img]="TargetIcon" class="size-3" /> Meta capacitaciones
                              </label>
                              <input type="number" min="1" [value]="draft().metaCapacitaciones"
                                (input)="updateMeta('metaCapacitaciones', $event)"
                                class="w-full h-9 bg-background border rounded-md px-3 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-brand"
                                [class]="metaCapInvalid() ? 'border-destructive' : 'border-input'" />
                              <p class="text-[10px] text-muted-foreground mt-1">≥ N sesiones por periodo.</p>
                            </div>
                            <div>
                              <label class="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                                <lucide-angular [img]="TargetIcon" class="size-3" /> Meta asistencias técnicas
                              </label>
                              <input type="number" min="1" [value]="draft().metaAT"
                                (input)="updateMeta('metaAT', $event)"
                                class="w-full h-9 bg-background border rounded-md px-3 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-brand"
                                [class]="metaAtInvalid() ? 'border-destructive' : 'border-input'" />
                              <p class="text-[10px] text-muted-foreground mt-1">≥ N atenciones por periodo.</p>
                            </div>
                          </div>
                          <div class="grid grid-cols-3 gap-2">
                            <div class="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold bg-card border border-brand/30 text-brand">
                              <lucide-angular [img]="CheckCircle2Icon" class="size-3" /><span class="truncate">Capacitado</span>
                            </div>
                            <div class="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold bg-card border border-brand/30 text-brand">
                              <lucide-angular [img]="CheckCircle2Icon" class="size-3" /><span class="truncate">Asistido</span>
                            </div>
                            <div class="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold bg-brand text-brand-foreground">
                              <lucide-angular [img]="CheckCircle2Icon" class="size-3" /><span class="truncate">Capacitado y Asistido</span>
                            </div>
                          </div>
                        </div>
                      } @else {
                        <div class="space-y-4">
                          <p class="text-xs text-muted-foreground leading-relaxed">
                            Fórmula cruzada: el participante debe cumplir
                            <span class="font-semibold text-foreground">ambas metas</span> en el mismo periodo. Resulta en un
                            estatus único <span class="font-semibold text-brand">"Atendido"</span>.
                          </p>
                          <div class="grid grid-cols-2 gap-4">
                            <div>
                              <label class="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                                <lucide-angular [img]="TargetIcon" class="size-3" /> Capacitaciones ≥
                              </label>
                              <input type="number" min="1" [value]="draft().metaCapacitaciones"
                                (input)="updateMeta('metaCapacitaciones', $event)"
                                class="w-full h-9 bg-background border rounded-md px-3 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-brand"
                                [class]="metaCapInvalid() ? 'border-destructive' : 'border-input'" />
                              <p class="text-[10px] text-muted-foreground mt-1">Mínimo requerido.</p>
                            </div>
                            <div>
                              <label class="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                                <lucide-angular [img]="TargetIcon" class="size-3" /> Asistencias técnicas ≥
                              </label>
                              <input type="number" min="1" [value]="draft().metaAT"
                                (input)="updateMeta('metaAT', $event)"
                                class="w-full h-9 bg-background border rounded-md px-3 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-brand"
                                [class]="metaAtInvalid() ? 'border-destructive' : 'border-input'" />
                              <p class="text-[10px] text-muted-foreground mt-1">Mínimo requerido.</p>
                            </div>
                          </div>
                          <div class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold bg-brand text-brand-foreground">
                            <lucide-angular [img]="CheckCircle2Icon" class="size-3" />
                            <span class="truncate">Cumple ambas → "Atendido"</span>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                } @else {
                  <!-- Solo Cap o solo AT -->
                  <div class="rounded-lg bg-brand/5 border border-brand/20 p-4 space-y-3">
                    <p class="text-xs text-foreground/80 leading-relaxed">
                      @if (capOn()) {
                        Sólo capacitaciones activas. Define la meta para considerar al participante
                        <span class="font-semibold text-brand">"Capacitado"</span>.
                      } @else {
                        Sólo asistencia técnica activa. Define la meta para considerar al participante
                        <span class="font-semibold text-brand">"Asistido"</span>.
                      }
                    </p>
                    @if (capOn()) {
                      <div>
                        <label class="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          <lucide-angular [img]="TargetIcon" class="size-3" /> Meta de capacitaciones (por periodo)
                        </label>
                        <input type="number" min="1" [value]="draft().metaCapacitaciones"
                          (input)="updateMeta('metaCapacitaciones', $event)"
                          class="w-full h-9 bg-background border rounded-md px-3 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-brand"
                          [class]="metaCapInvalid() ? 'border-destructive' : 'border-input'" />
                        <p class="text-[10px] text-muted-foreground mt-1">Cantidad mínima para cumplir el criterio.</p>
                      </div>
                    } @else {
                      <div>
                        <label class="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          <lucide-angular [img]="TargetIcon" class="size-3" /> Meta de asistencias técnicas (por periodo)
                        </label>
                        <input type="number" min="1" [value]="draft().metaAT"
                          (input)="updateMeta('metaAT', $event)"
                          class="w-full h-9 bg-background border rounded-md px-3 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-brand"
                          [class]="metaAtInvalid() ? 'border-destructive' : 'border-input'" />
                        <p class="text-[10px] text-muted-foreground mt-1">Cantidad mínima para cumplir el criterio.</p>
                      </div>
                    }
                  </div>
                }
              </div>
            </section>

            <!-- 5. Periodo y cierre -->
            <section class="space-y-3">
              <div class="flex items-center gap-2">
                <span class="flex items-center justify-center size-5 rounded-full bg-brand text-brand-foreground text-[10px] font-bold">5</span>
                <h3 class="text-sm font-semibold text-foreground">Periodo de medición y cierre</h3>
              </div>
              <p class="text-xs text-muted-foreground -mt-1.5 pl-7">Frecuencia de evaluación y política de reinicio.</p>
              <div class="pt-1">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
                      Periodo de medición
                    </label>
                    <select
                      class="w-full h-9 bg-background border border-input rounded-md px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                      [value]="draft().periodoMedicion"
                      (change)="update({ periodoMedicion: $any($event.target).value })"
                    >
                      <option value="mensual">Mensual</option>
                      <option value="trimestral">Trimestral</option>
                      <option value="semestral">Semestral</option>
                      <option value="anual">Anual</option>
                    </select>
                  </div>
                  <div class="rounded-lg bg-brand/5 border border-brand/15 p-3 text-[11px] text-foreground/80 flex items-start gap-2">
                    <lucide-angular [img]="InfoIcon" class="size-4 text-brand shrink-0 mt-0.5" />
                    <div class="space-y-1 leading-snug">
                      <p><span class="font-semibold">Contabilización independiente por área.</span></p>
                      <p><span class="font-semibold">Cierre de periodo:</span> al finalizar se archiva el estado alcanzado y los contadores se reinician a 0.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <!-- Sticky footer -->
        <div class="px-6 py-3 bg-card border-t border-border flex justify-between items-center sticky bottom-0 z-20">
          <div class="text-[11px] text-muted-foreground flex items-center gap-1.5">
            @if (dirty()) {
              <span class="size-1.5 rounded-full bg-warning"></span> Cambios sin guardar
            } @else {
              <lucide-angular [img]="CheckCircle2Icon" class="size-3.5 text-brand" /> Sin cambios pendientes
            }
          </div>
          <div class="flex gap-2">
            <button
              (click)="descartar()"
              [disabled]="!dirty()"
              class="btn-secondary"
            >
              <lucide-angular [img]="RotateCcwIcon" class="size-4" /> Cancelar
            </button>
            <button
              (click)="guardar()"
              [disabled]="!canSave()"
              class="btn-primary px-5"
            >
              <lucide-angular [img]="SaveIcon" class="size-4" /> Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ReglasComponent {
  private readonly areaService = inject(AreaService);
  private readonly reglasService = inject(ReglasService);
  private readonly toast = inject(ToastService);

  readonly SaveIcon = Save;
  readonly RotateCcwIcon = RotateCcw;
  readonly GraduationCapIcon = GraduationCap;
  readonly HeadsetIcon = Headset;
  readonly UsersIcon = Users;
  readonly ClockIcon = Clock;
  readonly TargetIcon = Target;
  readonly AlertTriangleIcon = AlertTriangle;
  readonly InfoIcon = Info;
  readonly LockIcon = Lock;
  readonly CheckCircle2Icon = CheckCircle2;
  readonly SproutIcon = Sprout;

  readonly tituloMetaGeneral = TITULO_META_GENERAL;

  readonly area = computed(() => getArea(this.areaService.currentArea()));
  readonly saved = computed(() => this.reglasService.configs()[this.areaService.currentArea()]);

  readonly draft = signal<AreaConfig>(structuredClone(
    this.reglasService.configs()[this.areaService.currentArea()],
  ));

  private prev = { cap: this.draft().capacitacionActiva, at: this.draft().asistenciaActiva };

  constructor() {
    // Recarga el borrador al cambiar de área o al guardar.
    effect(() => {
      const s = this.saved();
      this.draft.set(structuredClone(s));
      this.prev = { cap: s.capacitacionActiva, at: s.asistenciaActiva };
    });

    // Ajuste automático del criterio de éxito según actividades activas.
    effect(() => {
      const d = this.draft();
      const cap = d.capacitacionActiva;
      const at = d.asistenciaActiva;
      const valid = computeValidCriterio(cap, at, d.criterioExito);
      if (valid !== d.criterioExito) {
        if (this.prev.cap !== cap || this.prev.at !== at) {
          if (valid === 'none') this.toast.warning('El área no computará progreso: sin actividades activas.');
          else this.toast.info('Criterio de éxito ajustado automáticamente a las actividades activas.');
        }
        this.draft.update((x) => ({ ...x, criterioExito: valid }));
      }
      this.prev = { cap, at };
    });
  }

  update(patch: Partial<AreaConfig>): void {
    this.draft.update((d) => ({ ...d, ...patch }));
  }

  updateCap(key: 'horasMin' | 'horasMax' | 'participantesMax', e: Event): void {
    const v = Number((e.target as HTMLInputElement).value) || 0;
    this.draft.update((d) => ({ ...d, capacitacion: { ...d.capacitacion, [key]: v } }));
  }

  updateAt(key: 'horasMin' | 'horasMax' | 'participantesMax', e: Event): void {
    const v = Number((e.target as HTMLInputElement).value) || 0;
    this.draft.update((d) => ({ ...d, asistencia: { ...d.asistencia, [key]: v } }));
  }

  updateMeta(key: 'metaCapacitaciones' | 'metaAT', e: Event): void {
    const v = Number((e.target as HTMLInputElement).value) || 0;
    this.update({ [key]: v } as Partial<AreaConfig>);
  }

  updateMetaGeneral(key: keyof MetaGeneral, e: Event): void {
    const v = Math.max(0, Number((e.target as HTMLInputElement).value) || 0);
    this.draft.update((d) => ({ ...d, metaGeneral: { ...d.metaGeneral, [key]: v } }));
  }

  setCapActiva(v: boolean): void {
    this.update({ capacitacionActiva: v });
  }

  setAtActiva(v: boolean): void {
    const d = this.draft();
    if (!v) {
      this.update({ asistenciaActiva: false, atIndividualActiva: false, atGrupalActiva: false });
    } else {
      this.update({
        asistenciaActiva: true,
        atIndividualActiva: d.atIndividualActiva || !d.atGrupalActiva,
        atGrupalActiva: d.atGrupalActiva || !d.atIndividualActiva,
      });
    }
  }

  /* ===== Flags derivados ===== */
  readonly capOn = computed(() => this.draft().capacitacionActiva);
  readonly atOn = computed(
    () => this.draft().asistenciaActiva && (this.draft().atIndividualActiva || this.draft().atGrupalActiva),
  );
  readonly soloAtIndividual = computed(
    () => this.atOn() && this.draft().atIndividualActiva && !this.draft().atGrupalActiva,
  );
  readonly ambosOff = computed(() => !this.capOn() && !this.atOn());

  /* ===== Validaciones ===== */
  readonly capInvalid = computed(() => {
    const d = this.draft();
    return this.capOn() && (d.capacitacion.horasMax < d.capacitacion.horasMin || d.capacitacion.participantesMax < 1);
  });
  readonly atInvalid = computed(() => {
    const d = this.draft();
    return this.atOn() && (
      d.asistencia.horasMax < d.asistencia.horasMin ||
      (!this.soloAtIndividual() && d.asistencia.participantesMax < 1)
    );
  });
  private readonly needsCap = computed(() =>
    ['solo_cap', 'combinada_paralela', 'combinada_cruzada'].includes(this.draft().criterioExito),
  );
  private readonly needsAt = computed(() =>
    ['solo_at', 'combinada_paralela', 'combinada_cruzada'].includes(this.draft().criterioExito),
  );
  readonly metaCapInvalid = computed(
    () => this.needsCap() && (!this.draft().metaCapacitaciones || this.draft().metaCapacitaciones < 1),
  );
  readonly metaAtInvalid = computed(
    () => this.needsAt() && (!this.draft().metaAT || this.draft().metaAT < 1),
  );

  readonly dirty = computed(() => JSON.stringify(this.draft()) !== JSON.stringify(this.saved()));
  readonly canSave = computed(
    () => this.dirty() && !this.capInvalid() && !this.atInvalid() && !this.metaCapInvalid() && !this.metaAtInvalid(),
  );

  descartar(): void {
    this.draft.set(structuredClone(this.saved()));
  }

  guardar(): void {
    this.reglasService.setConfig(this.areaService.currentArea(), this.draft());
    this.toast.success('Reglas del área guardadas.');
  }
}
