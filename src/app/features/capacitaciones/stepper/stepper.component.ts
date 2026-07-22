import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  ArrowLeft, Check, ChevronRight, AlertTriangle, Trash2,
  UploadCloud, FileText, Send, Lock, Plus, X,
} from 'lucide-angular';
import { AreaService } from '../../../core/services/area.service';
import { CursosService } from '../../../core/services/cursos.service';
import { ParticipantesService } from '../../../core/services/participantes.service';
import { ToastService } from '../../../core/services/toast.service';
import { getArea } from '../../../core/constants/areas.const';
import { Curso, TipoCurso, isLocked } from '../../../core/models/curso.model';
import { isoToFechaCorta } from '../../../shared/utils/fecha.util';
import { EstadoBadgeComponent } from '../../../shared/components/estado-badge/estado-badge.component';
import { CursoFormComponent, CursoFormState } from '../curso-form/curso-form.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ParticipanteFormComponent, ParticipanteFormSubmit } from '../participante-form/participante-form.component';

const MAX_MB = 15;

type Paso = 1 | 2 | 3;

/**
 * Flujo de registro N1 en 3 pasos (nuevo/editar según data de la ruta).
 * Rutas: /capacitaciones-n1/nuevo?tipo=… y /capacitaciones-n1/:id?paso=…
 */
@Component({
  selector: 'app-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink,
    LucideAngularModule,
    EstadoBadgeComponent,
    CursoFormComponent,
    ParticipanteFormComponent, ModalComponent],
  template: `
    <section class="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-5 animate-page-in">
      <div class="flex items-center gap-2 text-xs text-muted-foreground">
        <a routerLink="/capacitaciones-n1" class="hover:text-brand flex items-center gap-1">
          <lucide-angular [img]="ArrowLeftIcon" class="size-3" /> Bandeja N1
        </a>
        <span>/</span>
        <span class="text-foreground">{{ mode === 'nuevo' ? 'Nuevo registro' : 'Edición' }}</span>
        @if (cursoActivo(); as curso) {
          <span>/</span>
          <span class="font-mono text-foreground">{{ curso.codigo }}</span>
          <app-estado-badge [estado]="curso.estado" />
        }
      </div>

      <!-- Stepper bar -->
      <div class="bg-card ring-1 ring-border rounded-xl p-4 flex items-center justify-between">
        @for (s of steps; track s.n; let i = $index) {
          <div class="flex items-center flex-1">
            <button
              type="button"
              [disabled]="!clickable(s.n)"
              (click)="clickable(s.n) && paso.set(s.n)"
              class="flex items-center gap-2"
              [class]="clickable(s.n) ? 'cursor-pointer' : 'cursor-default'"
            >
              <span
                class="size-8 rounded-full flex items-center justify-center text-xs font-bold ring-2 transition-colors"
                [class]="paso() === s.n
                  ? 'bg-brand text-brand-foreground ring-brand'
                  : paso() > s.n
                    ? 'bg-success text-success-foreground ring-success'
                    : 'bg-card text-muted-foreground ring-border'"
              >
                @if (paso() > s.n) {
                  <lucide-angular [img]="CheckIcon" class="size-4" />
                } @else {
                  {{ s.n }}
                }
              </span>
              <span
                class="text-xs font-semibold uppercase tracking-wide"
                [class]="paso() === s.n ? 'text-brand' : paso() > s.n ? 'text-success' : 'text-muted-foreground'"
              >Paso {{ s.n }}: {{ s.label }}</span>
            </button>
            @if (i < steps.length - 1) {
              <div class="flex-1 h-0.5 mx-3" [class]="paso() > s.n ? 'bg-success' : 'bg-border'"></div>
            }
          </div>
        }
      </div>

      @if (bloqueado()) {
        <div class="rounded-lg bg-warning-soft ring-1 ring-warning/30 p-3 text-xs text-warning-foreground flex items-center gap-2">
          <lucide-angular [img]="LockIcon" class="size-4" /> Registro en estado
          <strong>{{ cursoActivo()?.estado }}</strong>: interfaz en solo lectura.
        </div>
      }

      <!-- ============ Paso 1 ============ -->
      @if (paso() === 1) {
        <div class="space-y-4">
          @if (cursoActivo()?.estado === 'Observado' && observaciones().length > 0) {
            <div class="rounded-xl ring-1 ring-destructive/25 bg-destructive/5 p-4">
              <div class="flex items-center gap-2 text-destructive font-semibold text-sm mb-2">
                <lucide-angular [img]="AlertTriangleIcon" class="size-4" />
                Observaciones pendientes de subsanación
              </div>
              <ul class="space-y-2">
                @for (o of observaciones(); track $index) {
                  <li class="text-xs text-destructive bg-card/70 ring-1 ring-destructive/25 rounded-md px-3 py-2">
                    <span class="font-mono font-bold mr-2 text-destructive">{{ o.fecha }}</span>
                    {{ o.descripcion }}
                    @if (o.autor) {
                      <span class="ml-2 text-destructive/70">— {{ o.autor }}</span>
                    }
                  </li>
                }
              </ul>
            </div>
          }

          <div class="bg-card rounded-xl ring-1 ring-border overflow-hidden">
            <div class="px-6 py-4 border-b border-border bg-gradient-to-br from-brand/5 to-transparent flex items-start justify-between gap-3">
              <div>
                <div class="text-[10px] font-bold uppercase tracking-widest text-brand">
                  Paso 1 · Datos del evento
                </div>
                <h1 class="text-lg font-semibold mt-0.5">{{ tituloPaso1() }}</h1>
                <p class="text-xs text-muted-foreground mt-0.5">
                  Área: <span class="font-semibold text-foreground">{{ area().code }}</span> — {{ area().name }}
                </p>
              </div>
              @if (!bloqueado() && !isEdit()) {
                <button
                  type="button"
                  (click)="cursoForm()?.simular()"
                  class="btn-secondary h-8"
                >Autocompletar</button>
              }
            </div>

            <div class="p-6 bg-secondary/30">
              <app-curso-form
                [tipo]="tipo()"
                [initial]="initialPaso1()"
                [readOnly]="bloqueado()"
                saveLabel="Guardar y continuar"
                cancelLabel="Cancelar"
                (saved)="handleSavePaso1($event)"
                (cancelled)="volverABandeja()"
              />
            </div>
          </div>
        </div>
      }

      <!-- ============ Paso 2 ============ -->
      @if (paso() === 2 && cursoActivo(); as curso) {
        <div class="space-y-4">
          @if (!bloqueado() && showForm()) {
            <div class="bg-card rounded-xl ring-1 ring-border overflow-hidden">
              <div class="px-6 py-4 border-b border-border bg-gradient-to-br from-brand/5 to-transparent flex items-start justify-between gap-3">
                <div>
                  <div class="text-[10px] font-bold uppercase tracking-widest text-brand">
                    Paso 2 · Registro de participantes
                  </div>
                  <h2 class="text-lg font-semibold mt-0.5">Nuevo participante</h2>
                  <p class="text-xs text-muted-foreground mt-0.5">
                    Curso: <span class="font-mono">{{ curso.codigo }}</span> — {{ curso.nombreTema }}
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="participanteForm()?.simular()"
                    class="btn-secondary h-8"
                  >Autocompletar</button>
                  <button
                    type="button"
                    (click)="showForm.set(false)"
                    aria-label="Cerrar formulario"
                    class="btn-icon"
                  >
                    <lucide-angular [img]="XIcon" class="size-4" />
                  </button>
                </div>
              </div>
              <app-participante-form
                mode="nuevo"
                [otrosExistentes]="participantes()"
                submitLabel="Agregar participante"
                cancelLabel="Cancelar"
                [resetOnSubmit]="true"
                (submitted)="agregarParticipante($event)"
                (cancelled)="showForm.set(false)"
              />
            </div>
          }

          <div class="bg-card rounded-xl ring-1 ring-border overflow-hidden">
              <div class="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
                <div>
                  <h2 class="text-sm font-bold uppercase tracking-wider">Participantes registrados</h2>
                  <p class="text-xs text-muted-foreground">Total: {{ participantes().length }}</p>
                </div>
                @if (!bloqueado() && !showForm()) {
                  <button
                    type="button"
                    (click)="showForm.set(true)"
                    class="btn-primary h-8"
                  >
                    <lucide-angular [img]="PlusIcon" class="size-4" /> Nuevo participante
                  </button>
                }
              </div>
              <div class="overflow-auto max-h-[40vh]">
                <table class="w-full text-sm">
                  <thead class="bg-secondary/60 sticky top-0 z-10">
                    <tr class="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                      <th class="px-3 py-2 text-left">DNI</th>
                      <th class="px-3 py-2 text-left">Apellidos y Nombres</th>
                      <th class="px-3 py-2 text-left">Tipo</th>
                      <th class="px-3 py-2 text-left">Actividad</th>
                      @if (!bloqueado()) {
                        <th class="px-3 py-2 text-center w-16">—</th>
                      }
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-border">
                    @if (participantes().length === 0) {
                      <tr>
                        <td colspan="5" class="px-6 py-10 text-center italic text-muted-foreground">
                          {{ bloqueado()
                            ? 'No hay participantes registrados.'
                            : 'Aún no hay participantes. Haz clic en "Nuevo participante" para agregar.' }}
                        </td>
                      </tr>
                    }
                    @for (p of participantes(); track p.id) {
                      <tr class="hover:bg-secondary/40">
                        <td class="px-3 py-2 font-mono text-xs">{{ p.dni }}</td>
                        <td class="px-3 py-2 font-medium">{{ p.apellidos }}, {{ p.nombres }}</td>
                        <td class="px-3 py-2">
                          <span class="text-[10px] px-1.5 py-0.5 font-bold uppercase rounded-sm bg-muted text-foreground">
                            {{ p.tipoParticipante }}
                          </span>
                        </td>
                        <td class="px-3 py-2 text-muted-foreground">{{ p.primActividad }}</td>
                        @if (!bloqueado()) {
                          <td class="px-3 py-2">
                            <div class="flex justify-center">
                              <button
                                (click)="eliminarParticipante(p.id)"
                                class="p-1.5 rounded-md text-destructive hover:bg-destructive/10"
                                aria-label="Eliminar participante"
                              >
                                <lucide-angular [img]="Trash2Icon" class="size-4" />
                              </button>
                            </div>
                          </td>
                        }
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              @if (!bloqueado()) {
                <!-- Declaración jurada: cierre del Paso 2, antes de continuar -->
                <div class="px-5 py-4 border-t border-border">
                  <label class="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      class="accent-brand size-4 mt-0.5 shrink-0"
                      [checked]="declaracionJurada()"
                      (change)="declaracionJurada.set($any($event.target).checked)"
                    />
                    <span class="text-sm text-foreground leading-relaxed">
                      Declaro bajo juramento que la información proporcionada es correcta.
                      <span class="text-destructive">*</span>
                    </span>
                  </label>
                </div>
              }

              <div class="px-5 py-3 border-t border-border bg-secondary/30 flex items-center justify-between gap-2">
                <button
                  (click)="paso.set(1)"
                  class="btn-secondary h-8"
                >
                  <lucide-angular [img]="ArrowLeftIcon" class="size-4" /> Volver al Paso 1
                </button>
                <button
                  (click)="continuarAPaso3()"
                  [disabled]="participantes().length === 0 && !bloqueado()"
                  class="btn-primary h-8"
                >
                  Continuar al Paso 3 <lucide-angular [img]="ChevronRightIcon" class="size-4" />
                </button>
              </div>
          </div>
        </div>
      }

      <!-- ============ Paso 3 ============ -->
      @if (paso() === 3 && cursoActivo(); as curso) {
        <div class="bg-card rounded-xl ring-1 ring-border overflow-hidden">
          <div class="px-6 py-4 border-b border-border bg-gradient-to-br from-brand/5 to-transparent">
            <div class="text-[10px] font-bold uppercase tracking-widest text-brand">
              Paso 3 · Sustento y envío
            </div>
            <h2 class="text-lg font-semibold mt-0.5">Cargar acta firmada y enviar</h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <div class="space-y-4">
              <div class="bg-secondary/40 ring-1 ring-border rounded-lg p-4">
                <p class="text-[10px] font-bold text-brand uppercase tracking-wider mb-1">Actividad</p>
                <h3 class="text-base font-bold leading-tight">{{ curso.nombreTema }}</h3>
                <div class="flex justify-between text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                  <span>{{ curso.tipo === 'capacitacion' ? 'Capacitación' : 'Asistencia Técnica' }}</span>
                  <span>Fecha: {{ curso.fecha }}</span>
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between mb-2">
                  <p class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Participantes registrados
                  </p>
                  <span class="text-[11px] font-bold bg-brand-soft text-brand px-2 py-0.5 rounded-full">
                    {{ participantes().length }} {{ participantes().length === 1 ? 'persona' : 'personas' }}
                  </span>
                </div>
                <ul class="ring-1 ring-border rounded-lg divide-y divide-border bg-card max-h-64 overflow-auto">
                  @for (p of participantes(); track p.id; let i = $index) {
                    <li class="flex items-center gap-3 p-3">
                      <span class="text-xs font-mono text-muted-foreground w-4 text-right">{{ i + 1 }}</span>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold truncate">{{ p.nombres }} {{ p.apellidos }}</p>
                        <p class="text-[11px] text-muted-foreground font-mono truncate">
                          {{ p.dni }} <span class="font-sans">| {{ p.primActividad }}</span>
                        </p>
                      </div>
                    </li>
                  }
                  @if (participantes().length === 0) {
                    <li class="px-4 py-6 text-xs text-center italic text-muted-foreground">
                      No hay participantes. Vuelve al Paso 2.
                    </li>
                  }
                </ul>
              </div>
            </div>

            <div class="space-y-4">
              <div>
                <p class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Documento de Sustento *
                </p>
                <p class="text-xs text-muted-foreground">Sube un único archivo PDF (máx. {{ maxMb }} MB).</p>
              </div>

              @if (!file() && !existingName()) {
                <button
                  type="button"
                  [disabled]="bloqueado()"
                  (click)="fileInput.click()"
                  (dragover)="$event.preventDefault(); drag.set(true)"
                  (dragleave)="drag.set(false)"
                  (drop)="onDrop($event)"
                  class="w-full flex flex-col items-center justify-center gap-2 py-10 px-4 rounded-lg border-2 border-dashed transition-colors"
                  [class]="(drag() ? 'border-brand bg-brand-soft/40' : 'border-border bg-secondary/40 hover:border-brand hover:bg-brand-soft/20') + (bloqueado() ? ' opacity-50 cursor-not-allowed' : '')"
                >
                  <div class="size-12 rounded-full bg-brand-soft text-brand flex items-center justify-center">
                    <lucide-angular [img]="UploadCloudIcon" class="size-6" />
                  </div>
                  <p class="text-sm font-semibold">Arrastra tu PDF aquí o haz clic para buscar</p>
                  <p class="text-[11px] text-muted-foreground">Solo PDF de hasta {{ maxMb }} MB</p>
                </button>
              } @else {
                <div class="flex items-center gap-3 p-3 bg-success-soft ring-1 ring-success/25 rounded-lg">
                  <div class="size-9 rounded-md bg-card flex items-center justify-center text-success">
                    <lucide-angular [img]="FileTextIcon" class="size-5" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold truncate">{{ file()?.name ?? existingName() }}</p>
                    <p class="text-[11px] text-success">
                      {{ file() ? 'Listo para enviar' : 'Archivo previamente cargado' }}
                    </p>
                  </div>
                  @if (!bloqueado()) {
                    <button
                      (click)="fileInput.click()"
                      class="p-2 rounded-md text-muted-foreground hover:bg-card text-[11px] font-semibold"
                    >Reemplazar</button>
                    <button
                      (click)="file.set(null); existingName.set(undefined)"
                      class="p-2 rounded-md text-muted-foreground hover:bg-card"
                      aria-label="Quitar archivo"
                    >
                      <lucide-angular [img]="Trash2Icon" class="size-4" />
                    </button>
                  }
                </div>
              }

              <input #fileInput type="file" accept="application/pdf" class="hidden" (change)="onFileInput($event)" />

              @if (fileError()) {
                <p class="text-xs text-destructive font-medium">{{ fileError() }}</p>
              }

              <label
                class="flex items-start gap-3 p-3 ring-1 rounded-lg"
                [class]="bloqueado() ? 'opacity-60' : 'bg-warning-soft ring-warning/30 cursor-pointer'"
              >
                <input
                  type="checkbox"
                  [disabled]="bloqueado()"
                  [checked]="declaro()"
                  (change)="declaro.set($any($event.target).checked)"
                  class="mt-0.5 size-4 accent-brand"
                />
                <span class="text-xs text-warning-foreground leading-relaxed">
                  Declaro bajo juramento la veracidad de la información adjunta como sustento de la actividad realizada.
                </span>
              </label>
            </div>
          </div>

          <div class="px-6 py-4 border-t border-border bg-secondary/30 flex items-center justify-between gap-2">
            <button
              (click)="paso.set(2)"
              class="btn-secondary h-8"
            >
              <lucide-angular [img]="ArrowLeftIcon" class="size-4" /> Volver al Paso 2
            </button>
            <button
              (click)="enviar()"
              [disabled]="!puedeEnviar()"
              class="btn-primary h-8"
            >
              <lucide-angular [img]="SendIcon" class="size-4" /> Enviar
            </button>
          </div>
        </div>
      }
    <!-- Declaración jurada pendiente: modal estandarizado del sistema -->
      @if (modalDeclaracion()) {
        <app-modal
          title="Declaración jurada pendiente"
          maxWidth="max-w-md"
          tipo="warning"
          mensaje="Para continuar al siguiente paso debe aceptar la declaración jurada del registro."
          [mostrarAcciones]="true"
          labelAceptar="Continuar"
          [aceptarDeshabilitado]="!declaracionJurada()"
          (aceptado)="confirmarDeclaracion()"
          (cancelado)="modalDeclaracion.set(false)"
          (closed)="modalDeclaracion.set(false)"
        >
          <label class="flex items-start gap-3 bg-secondary/60 rounded-xl ring-1 ring-border p-4 cursor-pointer select-none">
            <input
              type="checkbox"
              class="accent-brand size-4 mt-0.5 shrink-0"
              [checked]="declaracionJurada()"
              (change)="declaracionJurada.set($any($event.target).checked)"
            />
            <span class="text-sm text-foreground leading-relaxed text-left">
              Declaro bajo juramento que la información proporcionada es correcta.
            </span>
          </label>
        </app-modal>
      }

    </section>
  `,
})
export class StepperComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly areaService = inject(AreaService);
  private readonly cursosService = inject(CursosService);
  private readonly participantesService = inject(ParticipantesService);
  private readonly toast = inject(ToastService);

  readonly ArrowLeftIcon = ArrowLeft;
  readonly CheckIcon = Check;
  readonly ChevronRightIcon = ChevronRight;
  readonly AlertTriangleIcon = AlertTriangle;
  readonly Trash2Icon = Trash2;
  readonly UploadCloudIcon = UploadCloud;
  readonly FileTextIcon = FileText;
  readonly SendIcon = Send;
  readonly LockIcon = Lock;
  readonly PlusIcon = Plus;
  readonly XIcon = X;
  readonly maxMb = MAX_MB;

  readonly steps: { n: Paso; label: string }[] = [
    { n: 1, label: 'Datos del Evento' },
    { n: 2, label: 'Registro de Participantes' },
    { n: 3, label: 'Sustento y Envío' },
  ];

  readonly cursoForm = viewChild(CursoFormComponent);
  readonly participanteForm = viewChild(ParticipanteFormComponent);

  mode: 'nuevo' | 'editar' = 'nuevo';
  private tipoInit: TipoCurso = 'capacitacion';

  readonly paso = signal<Paso>(1);
  /** Declaración jurada del Paso 2 (se conserva al navegar entre pasos). */
  readonly declaracionJurada = signal(false);
  readonly modalDeclaracion = signal(false);
  readonly createdId = signal<string | null>(null);
  readonly showForm = signal(false);

  // Paso 3
  readonly file = signal<File | null>(null);
  readonly existingName = signal<string | undefined>(undefined);
  readonly drag = signal(false);
  readonly declaro = signal(false);
  readonly fileError = signal<string | null>(null);

  readonly area = computed(() => getArea(this.areaService.currentArea()));

  readonly cursoActivo = computed<Curso | undefined>(() => {
    const id = this.createdId();
    if (!id) return undefined;
    return this.cursosService.cursos().find((c) => c.id === id);
  });

  readonly tipo = computed<TipoCurso>(() => this.cursoActivo()?.tipo ?? this.tipoInit);
  readonly bloqueado = computed(() => {
    const c = this.cursoActivo();
    return c ? isLocked(c) : false;
  });
  readonly observaciones = computed(() => this.cursoActivo()?.observacionesHistorial ?? []);
  readonly participantes = computed(() => {
    const id = this.createdId();
    // Dependencia reactiva del listado global para refrescar el computed.
    this.participantesService.participantes();
    return id ? this.participantesService.participantesDe(id) : [];
  });

  readonly isEdit = computed(() => this.mode === 'editar' && !!this.cursoActivo());

  readonly tituloPaso1 = computed(() => {
    const t = this.tipo();
    return this.isEdit()
      ? t === 'capacitacion' ? 'Editar Capacitación' : 'Editar Asistencia Técnica'
      : t === 'capacitacion' ? 'Nueva Capacitación' : 'Nueva Asistencia Técnica';
  });

  readonly initialPaso1 = computed<Partial<CursoFormState> | undefined>(() => {
    const curso = this.cursoActivo();
    if (!curso) return undefined;
    return {
      ...(curso.detalle ?? {}),
      codigo: curso.codigo,
      nombre: curso.nombreTema,
      hora: curso.hora,
      horas: curso.horas,
      extensionista: curso.extensionista,
      region: curso.region,
      provincia: curso.provincia,
      distrito: curso.distrito,
    };
  });

  readonly puedeEnviar = computed(
    () =>
      !this.bloqueado() &&
      Boolean(this.file() || this.existingName()) &&
      this.declaro() &&
      this.participantes().length > 0,
  );

  ngOnInit(): void {
    this.mode = (this.route.snapshot.data['mode'] as 'nuevo' | 'editar') ?? 'nuevo';
    const qp = this.route.snapshot.queryParamMap;
    if (this.mode === 'nuevo') {
      this.tipoInit = qp.get('tipo') === 'asistencia' ? 'asistencia' : 'capacitacion';
      this.paso.set(1);
    } else {
      const id = this.route.snapshot.paramMap.get('id');
      this.createdId.set(id);
      const p = Number(qp.get('paso'));
      this.paso.set(p === 1 || p === 2 || p === 3 ? (p as Paso) : 2);
    }
    this.existingName.set(this.cursoActivo()?.fotoSustento);
  }

  clickable(n: Paso): boolean {
    return Boolean(this.createdId()) && n <= this.paso();
  }

  /** Paso 2 → Paso 3: exige la declaración jurada (modal estandarizado). */
  continuarAPaso3(): void {
    if (!this.bloqueado() && !this.declaracionJurada()) {
      this.modalDeclaracion.set(true);
      return;
    }
    this.paso.set(3);
  }

  /** Continúa automáticamente tras aceptar la declaración dentro del modal. */
  confirmarDeclaracion(): void {
    if (!this.declaracionJurada()) return;
    this.modalDeclaracion.set(false);
    this.paso.set(3);
  }

  volverABandeja(): void {
    this.router.navigate(['/capacitaciones-n1']);
  }

  /* ===== Paso 1 ===== */
  handleSavePaso1(data: CursoFormState): void {
    const existingId = this.createdId();
    if (existingId && this.cursoActivo()) {
      this.cursosService.update(existingId, {
        codigo: data.codigo,
        nombreTema: data.nombre,
        horas: data.horas,
        hora: data.hora,
        extensionista: data.extensionista,
        region: data.region,
        provincia: data.provincia,
        distrito: data.distrito,
        detalle: data,
      });
      this.toast.success('Datos del evento actualizados');
      this.paso.set(2);
      return;
    }
    const fecha = isoToFechaCorta(data.fecha);
    const tipo = this.tipo();
    const nuevo = this.cursosService.create({
      codigo: data.codigo || `${tipo === 'capacitacion' ? 'CAP' : 'AT'}-${String(Date.now()).slice(-4)}`,
      nombreTema: data.nombre,
      estado: 'Registrado',
      fecha,
      hora: data.hora,
      horas: data.horas,
      participantes: 0,
      region: data.region,
      provincia: data.provincia,
      distrito: data.distrito,
      area: this.areaService.currentArea(),
      tipo,
      extensionista: data.extensionista,
      detalle: data,
    });
    this.createdId.set(nuevo.id);
    this.toast.success('Borrador guardado · puedes continuar con los participantes');
    this.paso.set(2);
  }

  /* ===== Paso 2 ===== */
  agregarParticipante(data: ParticipanteFormSubmit): void {
    const cursoId = this.createdId();
    if (!cursoId) return;
    this.participantesService.add({
      cursoId,
      tipoParticipante: data.tipoParticipante,
      dni: data.dni,
      apellidos: data.apellidos.toUpperCase(),
      nombres: data.nombres.toUpperCase(),
      fechaNacimiento: data.fechaNacimiento,
      primActividad: data.primActividad,
    });
    this.toast.success('Participante agregado');
    this.showForm.set(false);
  }

  eliminarParticipante(id: string): void {
    this.participantesService.delete(id);
  }

  /* ===== Paso 3 ===== */
  onFileInput(e: Event): void {
    this.pickFile((e.target as HTMLInputElement).files?.[0] ?? null);
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.drag.set(false);
    if (!this.bloqueado()) this.pickFile(e.dataTransfer?.files?.[0] ?? null);
  }

  private pickFile(f: File | null): void {
    this.fileError.set(null);
    if (!f) return;
    if (f.type !== 'application/pdf') {
      this.fileError.set('El archivo debe ser PDF.');
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      this.fileError.set(`El archivo supera el límite de ${MAX_MB} MB.`);
      return;
    }
    this.file.set(f);
    this.existingName.set(undefined);
  }

  enviar(): void {
    const curso = this.cursoActivo();
    if (!curso) return;
    if (this.participantes().length === 0) {
      this.toast.error('Debe haber al menos 1 participante.');
      return;
    }
    if (!this.file() && !this.existingName()) {
      this.toast.error('Adjunta el documento de sustento.');
      return;
    }
    if (!this.declaro()) {
      this.toast.error('Debes aceptar la declaración jurada.');
      return;
    }
    const fileName = this.file()?.name ?? this.existingName() ?? 'sustento.pdf';
    const nuevoEstado = curso.estado === 'Observado' ? 'Enviado-Subsanado' : 'Enviado';
    // TODO(backend): subir el PDF (multipart) y luego PATCH /cursos/{id}/estado.
    this.cursosService.update(curso.id, { estado: nuevoEstado, fotoSustento: fileName });
    this.toast.success('Registro enviado correctamente');
    this.volverABandeja();
  }
}
