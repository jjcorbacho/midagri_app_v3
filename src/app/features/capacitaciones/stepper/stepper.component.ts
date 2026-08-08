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
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { AreaService } from '../../../core/services/area.service';
import { CursosService } from '../../../core/services/cursos.service';
import { ParticipantesService } from '../../../core/services/participantes.service';
import { ToastService } from '../../../core/services/toast.service';
import { getArea } from '../../../core/constants/areas.const';
import { Curso, TipoCurso, isLocked } from '../../../core/models/curso.model';
import { isoToFechaCorta } from '../../../shared/utils/fecha.util';
import { EstadoBadgeComponent } from '../../../shared/components/estado-badge/estado-badge.component';
import { CargaPdfComponent } from '../../../shared/components/carga-pdf/carga-pdf.component';
import { ResumenActividadComponent } from '../resumen-actividad/resumen-actividad.component';
import { CursoFormComponent, CursoFormState } from '../curso-form/curso-form.component';
import { DeclaracionDialogComponent } from './declaracion-dialog.component';
import { ParticipanteFormComponent, ParticipanteFormSubmit } from '../participante-form/participante-form.component';

const MAX_MB = 15;

type Paso = 1 | 2 | 3;

/** Columnas de la grilla de participantes del Paso 2. */
const COLUMNAS = ['dni', 'nombre', 'tipo', 'actividad', 'acciones'];

/**
 * Flujo de registro N1 en 3 pasos (nuevo/editar según data de la ruta).
 * Rutas: /capacitaciones-n1/nuevo?tipo=… y /capacitaciones-n1/:id?paso=…
 */
@Component({
  selector: 'app-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatIconModule,
    MatStepperModule,
    MatTableModule,
    MatTooltipModule,
    EstadoBadgeComponent,
    CargaPdfComponent,
    ResumenActividadComponent,
    CursoFormComponent,
    ParticipanteFormComponent,
  ],
  template: `
    <section class="pagina">
      <nav class="miga">
        <a routerLink="/capacitaciones-n1">
          <mat-icon fontSet="material-symbols-outlined">arrow_back</mat-icon>
          Bandeja N1
        </a>
        <span>/</span>
        <span class="actual">{{ mode === 'nuevo' ? 'Nuevo registro' : 'Edición' }}</span>
        @if (cursoActivo(); as curso) {
          <span>/</span>
          <span class="codigo">{{ curso.codigo }}</span>
          <app-estado-badge [estado]="curso.estado" />
        }
      </nav>

      @if (bloqueado()) {
        <div class="aviso-bloqueo">
          <mat-icon fontSet="material-symbols-outlined">lock</mat-icon>
          Registro en estado <strong>{{ cursoActivo()?.estado }}</strong>: interfaz en solo lectura.
        </div>
      }

      <mat-stepper
        [linear]="true"
        [selectedIndex]="paso() - 1"
        (selectionChange)="onCambioPaso($event)"
      >
        <!-- ============ Paso 1 ============ -->
        <mat-step label="Datos del Evento" [completed]="!!createdId()">
          <div class="contenido-paso">
            @if (cursoActivo()?.estado === 'Observado' && observaciones().length > 0) {
              <mat-card appearance="outlined" class="observaciones">
                <header>
                  <mat-icon fontSet="material-symbols-outlined">warning</mat-icon>
                  Observaciones pendientes de subsanación
                </header>
                <ul>
                  @for (o of observaciones(); track $index) {
                    <li>
                      <span class="fecha">{{ o.fecha }}</span>
                      {{ o.descripcion }}
                      @if (o.autor) {
                        <span class="autor">— {{ o.autor }}</span>
                      }
                    </li>
                  }
                </ul>
              </mat-card>
            }

            <mat-card appearance="outlined" class="tarjeta-paso">
              <header class="cabecera-paso">
                <div>
                  <p class="antetitulo">Paso 1 · Datos del evento</p>
                  <h1>{{ tituloPaso1() }}</h1>
                  <p class="area">Área: <strong>{{ area().code }}</strong> — {{ area().name }}</p>
                </div>
                @if (!bloqueado() && !isEdit()) {
                  <button matButton="outlined" type="button" (click)="cursoForm()?.simular()">
                    Autocompletar
                  </button>
                }
              </header>

              <div class="cuerpo-paso">
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
            </mat-card>
          </div>
        </mat-step>

        <!-- ============ Paso 2 ============ -->
        <mat-step label="Registro de Participantes" [completed]="participantes().length > 0">
          <ng-template matStepContent>
            @if (cursoActivo(); as curso) {
              <div class="contenido-paso">
                @if (!bloqueado() && showForm()) {
                  <mat-card appearance="outlined" class="tarjeta-paso">
                    <header class="cabecera-paso">
                      <div>
                        <p class="antetitulo">Paso 2 · Registro de participantes</p>
                        <h2>Nuevo participante</h2>
                        <p class="area">
                          Curso: <span class="codigo">{{ curso.codigo }}</span> — {{ curso.nombreTema }}
                        </p>
                      </div>
                      <div class="acciones-cabecera">
                        <button matButton="outlined" type="button" (click)="participanteForm()?.simular()">
                          Autocompletar
                        </button>
                        <button
                          matIconButton
                          type="button"
                          aria-label="Cerrar formulario"
                          (click)="showForm.set(false)"
                        >
                          <mat-icon fontSet="material-symbols-outlined">close</mat-icon>
                        </button>
                      </div>
                    </header>

                    <app-participante-form
                      mode="nuevo"
                      [otrosExistentes]="participantes()"
                      submitLabel="Agregar participante"
                      cancelLabel="Cancelar"
                      [resetOnSubmit]="true"
                      (submitted)="agregarParticipante($event)"
                      (cancelled)="showForm.set(false)"
                    >
                      <!-- Declaración jurada del Paso 2: cierra "4. Información
                           adicional", justo antes del botón "Agregar participante". -->
                      <div class="declaracion">
                        <mat-checkbox
                          [checked]="declaracionJurada()"
                          (change)="declaracionJurada.set($event.checked)"
                        >
                          Declaro bajo juramento que la información proporcionada es correcta. *
                        </mat-checkbox>
                      </div>
                    </app-participante-form>
                  </mat-card>
                }

                <mat-card appearance="outlined" class="tarjeta-paso">
                  <header class="cabecera-lista">
                    <div>
                      <h2>Participantes registrados</h2>
                      <p class="area">Total: {{ participantes().length }}</p>
                    </div>
                    @if (!bloqueado() && !showForm()) {
                      <button matButton="filled" type="button" (click)="showForm.set(true)">
                        <mat-icon fontSet="material-symbols-outlined">add</mat-icon>
                        Nuevo participante
                      </button>
                    }
                  </header>

                  <div class="tabla-contenedor">
                    <table mat-table [dataSource]="participantes()">
                      <ng-container matColumnDef="dni">
                        <th mat-header-cell *matHeaderCellDef>DNI</th>
                        <td mat-cell *matCellDef="let p" class="numerico">{{ p.dni }}</td>
                      </ng-container>
                      <ng-container matColumnDef="nombre">
                        <th mat-header-cell *matHeaderCellDef>Apellidos y Nombres</th>
                        <td mat-cell *matCellDef="let p" class="destacado">{{ p.apellidos }}, {{ p.nombres }}</td>
                      </ng-container>
                      <ng-container matColumnDef="tipo">
                        <th mat-header-cell *matHeaderCellDef>Tipo</th>
                        <td mat-cell *matCellDef="let p">
                          <mat-chip
                            disableRipple
                            [class]="p.tipoParticipante === 'PRODUCTOR' ? 'c-aprobado' : 'c-registrado'"
                          >{{ p.tipoParticipante }}</mat-chip>
                        </td>
                      </ng-container>
                      <ng-container matColumnDef="actividad">
                        <th mat-header-cell *matHeaderCellDef>Actividad</th>
                        <td mat-cell *matCellDef="let p" class="tenue">{{ p.primActividad }}</td>
                      </ng-container>
                      <ng-container matColumnDef="acciones">
                        <th mat-header-cell *matHeaderCellDef></th>
                        <td mat-cell *matCellDef="let p">
                          @if (!bloqueado()) {
                            <button
                              matIconButton
                              class="accion a-error"
                              type="button"
                              matTooltip="Eliminar participante"
                              aria-label="Eliminar participante"
                              (click)="eliminarParticipante(p.id)"
                            >
                              <mat-icon fontSet="material-symbols-outlined">delete</mat-icon>
                            </button>
                          }
                        </td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="columnas; sticky: true"></tr>
                      <tr mat-row *matRowDef="let p; columns: columnas"></tr>
                      <tr class="fila-vacia" *matNoDataRow>
                        <td [attr.colspan]="columnas.length">
                          {{ bloqueado()
                            ? 'No hay participantes registrados.'
                            : 'Aún no hay participantes. Haz clic en "Nuevo participante" para agregar.' }}
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- La declaración jurada vive en el formulario de participante
                       (tras "4. Información adicional"); si el formulario está
                       cerrado, el diálogo de "Continuar al Paso 3" la solicita. -->
                  <footer class="pie-paso">
                    <button matButton type="button" (click)="irAPaso(1)">
                      <mat-icon fontSet="material-symbols-outlined">arrow_back</mat-icon>
                      Volver al Paso 1
                    </button>
                    <button
                      matButton="filled"
                      type="button"
                      [disabled]="participantes().length === 0 && !bloqueado()"
                      (click)="continuarAPaso3()"
                    >
                      Continuar al Paso 3
                      <mat-icon fontSet="material-symbols-outlined" iconPositionEnd>chevron_right</mat-icon>
                    </button>
                  </footer>
                </mat-card>
              </div>
            }
          </ng-template>
        </mat-step>

        <!-- ============ Paso 3 ============ -->
        <mat-step label="Sustento y Envío">
          <ng-template matStepContent>
            @if (cursoActivo(); as curso) {
              <div class="contenido-paso">
                <mat-card appearance="outlined" class="tarjeta-paso">
                  <header class="cabecera-paso">
                    <div>
                      <p class="antetitulo">Paso 3 · Sustento y envío</p>
                      <h2>Cargar acta firmada y enviar</h2>
                    </div>
                  </header>

                  <div class="columnas">
                    <app-resumen-actividad
                      [curso]="curso"
                      [participantes]="participantes()"
                      mensajeVacio="No hay participantes. Vuelve al Paso 2."
                    />

                    <div class="bloque">
                      <div>
                        <p class="antetitulo tenue">Documento de Sustento *</p>
                        <p class="nota">Sube un único archivo PDF (máx. {{ maxMb }} MB).</p>
                      </div>

                      <app-carga-pdf
                        [(archivo)]="file"
                        [nombreExistente]="existingName()"
                        [deshabilitado]="bloqueado()"
                        [maxMb]="maxMb"
                        (quitado)="existingName.set(undefined)"
                      />

                      <div class="declaracion-envio" [class.inactiva]="bloqueado()">
                        <mat-checkbox
                          [checked]="declaro()"
                          [disabled]="bloqueado()"
                          (change)="declaro.set($event.checked)"
                        >
                          Declaro bajo juramento la veracidad de la información adjunta como sustento
                          de la actividad realizada.
                        </mat-checkbox>
                      </div>
                    </div>
                  </div>

                  <footer class="pie-paso">
                    <button matButton type="button" (click)="irAPaso(2)">
                      <mat-icon fontSet="material-symbols-outlined">arrow_back</mat-icon>
                      Volver al Paso 2
                    </button>
                    <button matButton="filled" type="button" [disabled]="!puedeEnviar()" (click)="enviar()">
                      <mat-icon fontSet="material-symbols-outlined">send</mat-icon>
                      Enviar
                    </button>
                  </footer>
                </mat-card>
              </div>
            }
          </ng-template>
        </mat-step>
      </mat-stepper>
    </section>
  `,
  styles: `
    .pagina {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    @media (min-width: 1024px) { .pagina { padding: 32px; } }

    .miga {
      display: flex;
      align-items: center;
      gap: 8px;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }
    .miga a {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: inherit;
      text-decoration: none;
    }
    .miga a:hover { color: var(--mat-sys-primary); }
    .miga mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .miga .actual { color: var(--mat-sys-on-surface); }
    .codigo { font-family: monospace; color: var(--mat-sys-on-surface); }

    .aviso-bloqueo {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      border-radius: var(--mat-sys-corner-medium);
      background: var(--estado-subsanado-fondo);
      color: var(--estado-subsanado);
      font: var(--mat-sys-body-small);
    }
    .aviso-bloqueo mat-icon { font-size: 18px; width: 18px; height: 18px; }

    mat-stepper { background: transparent; }
    .contenido-paso { display: flex; flex-direction: column; gap: 16px; }
    .tarjeta-paso { padding: 0; overflow: hidden; }

    .cabecera-paso, .cabecera-lista {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      padding: 16px 24px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }
    .cabecera-lista { align-items: center; }
    .antetitulo {
      margin: 0;
      font: var(--mat-sys-label-small);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--mat-sys-primary);
    }
    .antetitulo.tenue { color: var(--mat-sys-on-surface-variant); }
    .cabecera-paso h1, .cabecera-paso h2, .cabecera-lista h2 {
      margin: 2px 0 0;
      font: var(--mat-sys-title-medium);
    }
    .cabecera-lista h2 {
      font: var(--mat-sys-label-large);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .area {
      margin: 2px 0 0;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }
    .acciones-cabecera { display: flex; align-items: center; gap: 8px; }
    .cuerpo-paso { padding: 24px; background: var(--mat-sys-surface-container-low); }

    .observaciones {
      padding: 16px;
      background: var(--estado-observado-fondo);
      border-color: color-mix(in srgb, var(--estado-observado) 30%, transparent);
    }
    .observaciones header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font: var(--mat-sys-label-large);
      color: var(--estado-observado);
    }
    .observaciones ul { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .observaciones li {
      padding: 8px 12px;
      border-radius: var(--mat-sys-corner-small);
      background: var(--mat-sys-surface);
      font: var(--mat-sys-body-small);
    }
    .observaciones .fecha { font-family: monospace; font-weight: 700; margin-right: 8px; }
    .observaciones .autor { color: var(--mat-sys-on-surface-variant); }

    .declaracion {
      padding-top: 8px;
      border-top: 1px solid var(--mat-sys-outline-variant);
    }

    .tabla-contenedor { overflow: auto; max-height: 40vh; }
    table { width: 100%; }
    .numerico { font-variant-numeric: tabular-nums; }
    .destacado { font-weight: 600; }
    .tenue { color: var(--mat-sys-on-surface-variant); }
    .fila-vacia td {
      padding: 32px 24px;
      text-align: center;
      font: var(--mat-sys-body-small);
      font-style: italic;
      color: var(--mat-sys-on-surface-variant);
    }

    .pie-paso {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 16px 24px;
      border-top: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface-container-low);
    }

    .columnas { display: grid; grid-template-columns: 1fr; gap: 24px; padding: 24px; }
    @media (min-width: 768px) { .columnas { grid-template-columns: 1fr 1fr; } }
    .bloque { display: flex; flex-direction: column; gap: 16px; }
    .nota { margin: 0; font: var(--mat-sys-body-small); color: var(--mat-sys-on-surface-variant); }

    .declaracion-envio {
      padding: 12px;
      border-radius: var(--mat-sys-corner-medium);
      background: var(--estado-subsanado-fondo);
      color: var(--estado-subsanado);
    }
    .declaracion-envio.inactiva { opacity: 0.6; background: var(--mat-sys-surface-container-low); }
  `,
})
export class StepperComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly areaService = inject(AreaService);
  private readonly cursosService = inject(CursosService);
  private readonly participantesService = inject(ParticipantesService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);

  readonly maxMb = MAX_MB;
  readonly columnas = COLUMNAS;

  private readonly stepper = viewChild.required(MatStepper);
  readonly cursoForm = viewChild(CursoFormComponent);
  readonly participanteForm = viewChild(ParticipanteFormComponent);

  mode: 'nuevo' | 'editar' = 'nuevo';
  private tipoInit: TipoCurso = 'capacitacion';

  readonly paso = signal<Paso>(1);
  /** Declaración jurada del Paso 2 (se conserva al navegar entre pasos). */
  readonly declaracionJurada = signal(false);
  readonly createdId = signal<string | null>(null);
  readonly showForm = signal(false);

  // Paso 3
  readonly file = signal<File | null>(null);
  readonly existingName = signal<string | undefined>(undefined);
  readonly declaro = signal(false);

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

  /** El encabezado del stepper es la única fuente de la navegación manual. */
  onCambioPaso(e: StepperSelectionEvent): void {
    this.paso.set((e.selectedIndex + 1) as Paso);
  }

  /**
   * Movimiento programático (botones "Volver a…" y guardado del Paso 1). Se
   * aplaza un tick porque el stepper es lineal y evalúa `completed` del paso
   * anterior en el momento del salto: la marca llega con la detección de
   * cambios que sigue al guardado.
   */
  irAPaso(n: Paso): void {
    setTimeout(() => (this.stepper().selectedIndex = n - 1));
  }

  /** Paso 2 → Paso 3: exige la declaración jurada (diálogo estandarizado). */
  continuarAPaso3(): void {
    if (!this.bloqueado() && !this.declaracionJurada()) {
      const ref = this.dialog.open<DeclaracionDialogComponent, undefined, boolean>(
        DeclaracionDialogComponent,
        { width: '480px', maxWidth: '95vw', autoFocus: 'dialog', restoreFocus: true },
      );
      ref.afterClosed().subscribe((aceptada) => {
        if (!aceptada) return;
        this.declaracionJurada.set(true);
        this.irAPaso(3);
      });
      return;
    }
    this.irAPaso(3);
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
      this.irAPaso(2);
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
    this.irAPaso(2);
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
