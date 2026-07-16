import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  LucideAngularModule,
  ChevronRight, ChevronDown, Plus, Pencil, Trash2, GripVertical,
  FileText, MapPin, Compass, Paperclip, User, Briefcase, Users, Info,
  Sparkles, Monitor, Smartphone, Eye, EyeOff, Lock, Settings2, Send,
} from 'lucide-angular';
import type { LucideIconData } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { AreaService } from '../../../core/services/area.service';
import { CamposService } from '../../../core/services/campos.service';
import { ToastService } from '../../../core/services/toast.service';
import { AREAS } from '../../../core/constants/areas.const';
import { CAMPOS_BASE, FORMULARIOS } from '../../../core/constants/campos-base.const';
import { CampoBase, CampoPersonalizado, CampoTipo, FormularioKey } from '../../../core/models/campo.model';
import { CampoPreviewComponent } from './campo-preview.component';
import { CampoModalComponent, CampoModalResult, TIPOS_CAMPO } from './campo-modal.component';
import { OpcionesModalComponent } from './opciones-modal.component';

const SECTION_ICONS: Record<string, LucideIconData> = {
  'Datos Generales': FileText,
  'Ubicación': MapPin,
  'Coordenadas': Compass,
  'Documento Sustentatorio': Paperclip,
  'Datos de Identidad y Demográficos': User,
  'Datos técnicos y comerciales': Briefcase,
  'Organización y participación social': Users,
  'Información adicional': Info,
};

/** Configuración de Formularios — gestión de campos base y personalizados por área. */
@Component({
  selector: 'app-campos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, LucideAngularModule, CampoPreviewComponent, CampoModalComponent, OpcionesModalComponent],
  template: `
    <section class="p-6 lg:p-8 max-w-7xl mx-auto animate-page-in">
      <div class="bg-card rounded-xl shadow-xl border border-border overflow-hidden flex flex-col">
        <!-- Header -->
        <header class="p-6 border-b border-border">
          <div class="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
            <div class="min-w-0">
              <div class="flex items-center gap-2 text-xs font-semibold text-brand uppercase tracking-wider mb-1">
                <span>Configuración</span>
                <lucide-angular [img]="ChevronRightIcon" class="size-3 text-muted-foreground/60" />
                <span class="text-muted-foreground">Gestión de campos</span>
                <span
                  class="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  [class]="isAdmin() ? 'bg-state-aprobado-soft text-state-aprobado-foreground' : 'bg-state-enviado-soft text-state-enviado-foreground'"
                >{{ isAdmin() ? 'ADMINISTRADOR GENERAL' : 'ADMIN. UNIDAD ORGANIZACIONAL' }}</span>
              </div>
              <h1 class="text-h1 text-foreground">Configuración de Formularios — {{ area().code }}</h1>
            </div>

            <!-- Filter bar -->
            <div class="flex flex-col sm:flex-row items-start gap-4 shrink-0">
              <div class="flex flex-col gap-1.5 w-full sm:w-64">
                <label class="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Oficina responsable
                </label>
                @if (isAdmin()) {
                  <select
                    [value]="areaService.currentArea()"
                    (change)="areaService.setCurrentArea($any($event.target).value)"
                    class="h-9 w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 focus:ring-2 focus:ring-ring outline-none"
                  >
                    @for (a of areas; track a.code) {
                      <option [value]="a.code">{{ a.code }} — {{ a.name }}</option>
                    }
                  </select>
                } @else {
                  <div class="relative">
                    <input
                      disabled
                      [value]="area().code + ' — ' + area().name"
                      class="h-9 w-full bg-muted border border-border text-muted-foreground text-sm rounded-lg px-3 pr-8 cursor-not-allowed truncate"
                    />
                    <lucide-angular [img]="LockIcon" class="size-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                }
              </div>

              <div class="flex flex-col gap-1.5 w-full sm:w-64">
                <label class="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Formulario a configurar
                </label>
                <select
                  class="h-9 w-full bg-background border border-border text-foreground text-sm font-medium rounded-lg px-3 focus:ring-2 focus:ring-ring outline-none"
                  [value]="formulario()"
                  (change)="formulario.set($any($event.target).value)"
                >
                  @for (f of formularios; track f.key) {
                    <option [value]="f.key">{{ f.label }}</option>
                  }
                </select>
              </div>
            </div>
          </div>
        </header>

        <!-- Main split -->
        <div class="flex flex-col lg:flex-row min-h-[600px]">
          <!-- Left: structure -->
          <div class="lg:w-3/5 border-r border-border/60 bg-surface-2/50 p-6 overflow-y-auto">
            <div class="flex items-center justify-between mb-6 gap-3 flex-wrap">
              <h2 class="text-lg font-bold text-foreground flex items-center gap-2">
                Estructura del formulario
                <span class="bg-surface-3 text-muted-foreground text-[10px] px-2 py-0.5 rounded-full uppercase font-semibold">
                  {{ totalActivos() }} {{ isAdmin() ? 'campos activos' : 'campos visibles' }}
                </span>
              </h2>
              @if (isAdmin()) {
                <button
                  (click)="editing.set(null); showModal.set(true)"
                  class="btn-primary"
                >
                  <lucide-angular [img]="PlusIcon" class="size-4" />
                  Nuevo campo personalizado
                </button>
              }
            </div>

            <!-- Grupos base -->
            @for (grupo of grupos(); track grupo.seccion) {
              <div class="mb-8">
                <button
                  type="button"
                  (click)="toggleSeccion(grupo.seccion)"
                  class="w-full flex items-center gap-3 mb-3 pb-2 border-b border-border text-left hover:border-brand/40 transition-colors"
                  [attr.aria-expanded]="!isCollapsed(grupo.seccion)"
                >
                  <div class="w-8 h-8 rounded-lg bg-brand-soft flex items-center justify-center">
                    <lucide-angular [img]="sectionIcon(grupo.seccion)" class="size-4 text-brand" />
                  </div>
                  <h3 class="text-sm font-bold text-foreground uppercase tracking-tight">{{ grupo.seccion }}</h3>
                  <span class="text-[10px] text-muted-foreground/70 ml-auto font-semibold">{{ grupo.campos.length }} campos</span>
                  <lucide-angular
                    [img]="ChevronDownIcon"
                    class="size-4 text-muted-foreground/70 transition-transform"
                    [class.-rotate-90]="isCollapsed(grupo.seccion)"
                  />
                </button>
                @if (!isCollapsed(grupo.seccion)) {
                  <div class="space-y-2">
                    @for (b of grupo.campos; track b.nombre) {
                      <div
                        class="group bg-card border border-border p-3 rounded-xl flex items-center justify-between transition-all hover:shadow-md hover:border-brand/25"
                        [class.opacity-60]="isBaseInactive(b)"
                      >
                        <div class="flex items-center gap-4 min-w-0">
                          <div class="cursor-grab text-muted-foreground/50 group-hover:text-brand-secondary">
                            <lucide-angular [img]="GripVerticalIcon" class="size-5" />
                          </div>
                          <div class="min-w-0">
                            <div class="flex items-center gap-2">
                              <span
                                class="text-sm font-semibold text-foreground truncate"
                                [class]="isBaseInactive(b) ? 'line-through text-muted-foreground' : ''"
                              >{{ b.nombre }}</span>
                              <span class="bg-muted text-muted-foreground text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">
                                Base
                              </span>
                            </div>
                            <div class="flex items-center gap-2 mt-1 flex-wrap">
                              <span class="text-[10px] px-2 py-0.5 rounded-full border" [class]="tipoChip(b.tipo)">
                                {{ tipoLabel(b.tipo) }}
                              </span>
                              @if (b.requerido) {
                                <span class="bg-state-observado-soft text-state-observado-foreground text-[10px] px-2 py-0.5 rounded-full border border-state-observado/25 font-medium">
                                  Obligatorio
                                </span>
                              }
                            </div>
                          </div>
                        </div>
                        @if (isAdmin()) {
                          <div class="flex items-center gap-2">
                            <span class="text-[10px] font-bold uppercase" [class]="isBaseInactive(b) ? 'text-muted-foreground/50' : 'text-muted-foreground/70'">
                              {{ isBaseInactive(b) ? 'Inactivo' : 'Activo' }}
                            </span>
                            <button
                              (click)="toggleBase(b)"
                              class="w-10 h-5 rounded-full relative transition-colors"
                              [class]="isBaseInactive(b) ? 'bg-surface-3' : 'bg-primary'"
                              aria-label="Activar/Inactivar"
                            >
                              <div
                                class="absolute top-0.5 bg-card w-4 h-4 rounded-full shadow-sm transition-all"
                                [class]="isBaseInactive(b) ? 'left-0.5' : 'right-0.5'"
                              ></div>
                            </button>
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            }

            <!-- Personalizados -->
            <div class="mb-2">
              <div class="flex items-center gap-3 mb-3 pb-2 border-b border-brand/25">
                <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <lucide-angular [img]="SparklesIcon" class="size-4 text-white" />
                </div>
                <h3 class="text-sm font-bold text-brand uppercase tracking-tight">Campos personalizados</h3>
                <span class="text-[10px] text-brand ml-auto font-semibold">{{ customsVisibles().length }} campos</span>
              </div>

              @if (customsVisibles().length === 0) {
                <div class="bg-brand-soft/30 border border-dashed border-brand/25 rounded-xl p-6 text-center">
                  <p class="text-sm text-brand/70 italic">
                    {{ isAdmin()
                      ? 'Sin campos personalizados en este formulario.'
                      : 'El ADMINISTRADOR GENERAL aún no ha publicado campos personalizados activos.' }}
                  </p>
                  @if (isAdmin()) {
                    <button
                      (click)="editing.set(null); showModal.set(true)"
                      class="mt-2 text-brand text-xs font-bold hover:underline"
                    >+ Agregar el primero</button>
                  }
                </div>
              } @else {
                <div class="space-y-2">
                  @for (c of customsVisibles(); track c.id) {
                    <div
                      class="group bg-brand-soft/50 border border-brand/25 p-3 rounded-xl flex items-center justify-between shadow-sm"
                      [class.opacity-60]="isAdmin() && !c.activo"
                    >
                      <div class="flex items-center gap-4 min-w-0">
                        <div class="cursor-grab text-brand-secondary">
                          <lucide-angular [img]="GripVerticalIcon" class="size-5" />
                        </div>
                        <div class="min-w-0">
                          <div class="flex items-center gap-2">
                            <span class="text-sm font-semibold text-brand truncate">{{ c.nombre }}</span>
                            @if (c.tieneData) {
                              <span
                                title="Con información registrada"
                                class="bg-warning-soft text-warning-foreground text-[9px] px-1.5 py-0.5 rounded font-bold uppercase"
                              >Con datos</span>
                            }
                          </div>
                          <div class="flex items-center gap-2 mt-1 flex-wrap">
                            <span class="text-[10px] px-2 py-0.5 rounded-full border" [class]="tipoChip(c.tipo)">
                              {{ tipoLabel(c.tipo) }}
                            </span>
                            <span
                              class="text-[10px] px-2 py-0.5 rounded-full border font-medium"
                              [class]="c.requerido ? 'bg-state-observado-soft text-state-observado-foreground border-state-observado/25' : 'bg-muted text-muted-foreground border-border'"
                            >{{ c.requerido ? 'Obligatorio' : 'Opcional' }}</span>
                          </div>
                        </div>
                      </div>

                      @if (isAdmin()) {
                        <div class="flex items-center gap-3">
                          <div class="flex items-center gap-1 border-r border-brand/25 pr-3">
                            <button
                              (click)="editing.set(c); showModal.set(true)"
                              class="p-1.5 text-brand hover:text-brand transition-colors"
                              title="Editar"
                            >
                              <lucide-angular [img]="PencilIcon" class="size-4" />
                            </button>
                            <button
                              (click)="eliminarCampo(c)"
                              class="p-1.5 transition-colors"
                              [class]="c.tieneData ? 'text-muted-foreground/50 cursor-not-allowed' : 'text-destructive hover:text-destructive'"
                              [title]="c.tieneData ? 'Bloqueado: tiene datos registrados' : 'Eliminar'"
                            >
                              <lucide-angular [img]="Trash2Icon" class="size-4" />
                            </button>
                          </div>
                          <div class="flex items-center gap-2">
                            <span class="text-[10px] font-bold uppercase" [class]="c.activo ? 'text-brand' : 'text-muted-foreground/70'">
                              {{ c.activo ? 'Activo' : 'Inactivo' }}
                            </span>
                            <button
                              (click)="camposService.update(c.id, { activo: !c.activo })"
                              class="w-10 h-5 rounded-full relative transition-colors"
                              [class]="c.activo ? 'bg-primary' : 'bg-surface-3'"
                            >
                              <div
                                class="absolute top-0.5 bg-card w-4 h-4 rounded-full shadow-sm transition-all"
                                [class]="c.activo ? 'right-0.5' : 'left-0.5'"
                              ></div>
                            </button>
                          </div>
                        </div>
                      } @else {
                        <div class="flex items-center gap-3">
                          @if (c.tipo === 'select' || c.tipo === 'radio' || c.tipo === 'checkbox') {
                            <button
                              (click)="editOptionsOf.set(c)"
                              class="p-1.5 text-brand hover:text-brand"
                              title="Editar valores"
                            >
                              <lucide-angular [img]="Settings2Icon" class="size-4" />
                            </button>
                          }
                          <div class="flex items-center gap-2">
                            <span
                              class="text-[10px] font-bold uppercase flex items-center gap-1"
                              [class]="visibleUE(c) ? 'text-brand' : 'text-muted-foreground/70'"
                            >
                              <lucide-angular [img]="visibleUE(c) ? EyeIcon : EyeOffIcon" class="size-3" />
                              {{ visibleUE(c) ? 'Visible' : 'No visible' }}
                            </span>
                            <button
                              (click)="camposService.setVisibilidad(c.id, areaService.currentArea(), !visibleUE(c))"
                              class="w-10 h-5 rounded-full relative transition-colors"
                              [class]="visibleUE(c) ? 'bg-primary' : 'bg-surface-3'"
                            >
                              <div
                                class="absolute top-0.5 bg-card w-4 h-4 rounded-full shadow-sm transition-all"
                                [class]="visibleUE(c) ? 'right-0.5' : 'left-0.5'"
                              ></div>
                            </button>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Right: preview -->
          <div class="lg:flex-1 bg-muted p-8 flex flex-col items-center overflow-y-auto">
            <div class="flex items-center justify-between w-full max-w-sm mb-6">
              <h3 class="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <lucide-angular [img]="EyeIcon" class="size-3.5" /> Vista previa
              </h3>
              <div class="flex bg-card rounded-lg p-1 shadow-sm border border-border">
                <button
                  (click)="previewDevice.set('mobile')"
                  class="p-1 rounded"
                  [class]="previewDevice() === 'mobile' ? 'bg-muted text-foreground' : 'text-muted-foreground/70'"
                  title="Móvil"
                >
                  <lucide-angular [img]="SmartphoneIcon" class="size-4" />
                </button>
                <button
                  (click)="previewDevice.set('desktop')"
                  class="p-1 rounded"
                  [class]="previewDevice() === 'desktop' ? 'bg-muted text-foreground' : 'text-muted-foreground/70'"
                  title="Escritorio"
                >
                  <lucide-angular [img]="MonitorIcon" class="size-4" />
                </button>
              </div>
            </div>

            @if (previewDevice() === 'mobile') {
              <div class="w-full max-w-[340px] bg-card rounded-[40px] border-[8px] border-slate-800 shadow-2xl h-[600px] overflow-hidden flex flex-col">
                <div class="h-6 bg-slate-800 flex justify-center items-end pb-1">
                  <div class="w-12 h-1 bg-slate-700 rounded-full"></div>
                </div>
                <div class="bg-primary p-4 text-white">
                  <div class="text-[10px] font-medium opacity-80 mb-1">
                    {{ area().code }} › {{ formLabel() }}
                  </div>
                  <div class="text-sm font-bold">Registro</div>
                </div>
                <div class="flex-1 p-5 overflow-y-auto space-y-4">
                  <ng-container *ngTemplateOutlet="previewBody" />
                </div>
              </div>
            } @else {
              <div class="w-full bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
                <ng-container *ngTemplateOutlet="previewBody" />
              </div>
            }

            <ng-template #previewBody>
              @for (grupo of gruposPreview(); track grupo.seccion) {
                <div class="space-y-3">
                  <h4 class="text-[10px] font-bold text-brand uppercase tracking-wider border-b border-border/60 pb-1">
                    {{ grupo.seccion }}
                  </h4>
                  @for (b of grupo.campos; track b.nombre) {
                    <app-campo-preview [nombre]="b.nombre + (b.requerido ? ' *' : '')" [tipo]="b.tipo" />
                  }
                </div>
              }
              @if (customsRender().length > 0) {
                <div class="space-y-3 pt-2">
                  <h4 class="text-[10px] font-bold text-brand uppercase tracking-wider border-b border-brand/15 pb-1">
                    Personalizados
                  </h4>
                  @for (c of customsRender(); track c.id) {
                    <app-campo-preview
                      [nombre]="c.nombre + (c.requerido ? ' *' : '')"
                      [tipo]="c.tipo"
                      [opciones]="c.opciones"
                    />
                  }
                </div>
              }
            </ng-template>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-border/60 bg-card flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-2 text-xs text-muted-foreground/70 italic">
            <lucide-angular [img]="InfoIcon" class="size-4" />
            {{ isAdmin()
              ? 'Los cambios se guardan como catálogo y se reflejan en la vista del Administrador Unidad Ejecutora(UE).'
              : 'Marca como visibles los campos que deben aparecer en los formularios de los técnicos.' }}
          </div>
          <div class="flex gap-3">
            @if (isAdmin()) {
              <button class="btn-secondary px-6">
                Descartar
              </button>
              <button
                (click)="toast.success('Configuración guardada')"
                class="btn-primary px-8 bg-foreground text-background hover:bg-foreground/85"
              >Guardar</button>
            } @else {
              <button
                (click)="publicar()"
                class="btn-primary px-8"
              >
                <lucide-angular [img]="SendIcon" class="size-4" />
                Publicar formulario
              </button>
            }
          </div>
        </div>
      </div>

      @if (showModal()) {
        <app-campo-modal
          [initial]="editing()"
          (closed)="showModal.set(false)"
          (saved)="guardarCampo($event)"
        />
      }

      @if (editOptionsOf(); as campo) {
        <app-opciones-modal
          [campo]="campo"
          (closed)="editOptionsOf.set(null)"
          (saved)="guardarOpciones(campo, $event)"
        />
      }
    </section>
  `,
})
export class CamposComponent {
  readonly areaService = inject(AreaService);
  readonly camposService = inject(CamposService);
  readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  readonly ChevronRightIcon = ChevronRight;
  readonly ChevronDownIcon = ChevronDown;
  readonly PlusIcon = Plus;
  readonly PencilIcon = Pencil;
  readonly Trash2Icon = Trash2;
  readonly GripVerticalIcon = GripVertical;
  readonly SparklesIcon = Sparkles;
  readonly MonitorIcon = Monitor;
  readonly SmartphoneIcon = Smartphone;
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;
  readonly LockIcon = Lock;
  readonly Settings2Icon = Settings2;
  readonly SendIcon = Send;
  readonly InfoIcon = Info;

  readonly areas = AREAS;
  readonly formularios = FORMULARIOS;

  // ADMINISTRADOR = super-admin con edición total; ADMIN_UE = solo lectura/visibilidad por área.
  readonly isAdmin = computed(() => this.auth.isAdministrador());
  readonly area = computed(
    () => AREAS.find((a) => a.code === this.areaService.currentArea()) ?? AREAS[0],
  );

  readonly formulario = signal<FormularioKey>('capacitacion');
  readonly showModal = signal(false);
  readonly editing = signal<CampoPersonalizado | null>(null);
  readonly editOptionsOf = signal<CampoPersonalizado | null>(null);
  readonly baseInactive = signal<Record<string, boolean>>({});
  readonly previewDevice = signal<'desktop' | 'mobile'>('mobile');
  readonly collapsed = signal<Record<string, boolean>>({});

  readonly formLabel = computed(
    () => FORMULARIOS.find((f) => f.key === this.formulario())!.label,
  );

  readonly customs = computed(() =>
    this.camposService.camposDe(this.areaService.currentArea(), this.formulario()),
  );
  readonly customsVisibles = computed(() =>
    this.isAdmin() ? this.customs() : this.customs().filter((c) => c.activo),
  );

  readonly baseCampos = computed(() => CAMPOS_BASE[this.formulario()]);

  readonly grupos = computed(() => {
    const map = new Map<string, CampoBase[]>();
    for (const c of this.baseCampos()) {
      if (!map.has(c.seccion)) map.set(c.seccion, []);
      map.get(c.seccion)!.push(c);
    }
    return Array.from(map.entries()).map(([seccion, campos]) => ({ seccion, campos }));
  });

  readonly gruposPreview = computed(() => {
    const inactive = this.baseInactive();
    const visibles = this.baseCampos().filter((b) => !inactive[this.keyOf(b)]);
    const map = new Map<string, CampoBase[]>();
    visibles.forEach((b) => {
      if (!map.has(b.seccion)) map.set(b.seccion, []);
      map.get(b.seccion)!.push(b);
    });
    return Array.from(map.entries()).map(([seccion, campos]) => ({ seccion, campos }));
  });

  readonly customsRender = computed(() =>
    this.customs().filter((c) =>
      this.isAdmin() ? c.activo : c.activo && c.visiblePorArea?.[this.areaService.currentArea()],
    ),
  );

  readonly totalActivos = computed(() => {
    const inactive = this.baseInactive();
    const baseActivos = this.baseCampos().filter((b) => !inactive[this.keyOf(b)]).length;
    if (this.isAdmin()) {
      return baseActivos + this.customs().filter((c) => c.activo).length;
    }
    return (
      baseActivos +
      this.customsVisibles().filter((c) => c.visiblePorArea?.[this.areaService.currentArea()]).length
    );
  });

  constructor() {
    // Al cambiar de formulario: solo la primera sección expandida (igual que el original).
    effect(() => {
      const form = this.formulario();
      const next: Record<string, boolean> = {};
      this.grupos().forEach((g, i) => {
        next[`${form}:${g.seccion}`] = i !== 0;
      });
      this.collapsed.set(next);
    });
  }

  private keyOf(b: CampoBase): string {
    return `${this.formulario()}:${b.nombre}`;
  }

  sectionIcon(s: string): LucideIconData {
    return SECTION_ICONS[s] ?? FileText;
  }

  tipoLabel(t: CampoTipo): string {
    return TIPOS_CAMPO.find((x) => x.value === t)!.label;
  }

  tipoChip(t: CampoTipo): string {
    return TIPOS_CAMPO.find((x) => x.value === t)!.chip;
  }

  isCollapsed(seccion: string): boolean {
    return this.collapsed()[`${this.formulario()}:${seccion}`] ?? false;
  }

  toggleSeccion(seccion: string): void {
    const key = `${this.formulario()}:${seccion}`;
    this.collapsed.update((p) => ({ ...p, [key]: !p[key] }));
  }

  isBaseInactive(b: CampoBase): boolean {
    return !!this.baseInactive()[this.keyOf(b)];
  }

  toggleBase(b: CampoBase): void {
    const key = this.keyOf(b);
    this.baseInactive.update((p) => ({ ...p, [key]: !p[key] }));
  }

  visibleUE(c: CampoPersonalizado): boolean {
    return !!c.visiblePorArea?.[this.areaService.currentArea()];
  }

  eliminarCampo(c: CampoPersonalizado): void {
    if (c.tieneData) {
      this.toast.warning('Este campo tiene información registrada. Solo puede inactivarse.');
      return;
    }
    this.camposService.delete(c.id);
  }

  guardarCampo(data: CampoModalResult): void {
    const editing = this.editing();
    if (editing) this.camposService.update(editing.id, data);
    else this.camposService.add({ ...data, area: this.areaService.currentArea(), formulario: this.formulario() });
    this.showModal.set(false);
  }

  guardarOpciones(campo: CampoPersonalizado, opciones: string[]): void {
    this.camposService.update(campo.id, { opciones });
    this.editOptionsOf.set(null);
    this.toast.success('Valores actualizados');
  }

  publicar(): void {
    this.toast.success(
      'Formulario publicado',
      'Los campos visibles aparecerán en las pantallas de los técnicos.',
    );
  }
}
