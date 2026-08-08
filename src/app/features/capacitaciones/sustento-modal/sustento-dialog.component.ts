import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild, ElementRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { Curso } from '../../../core/models/curso.model';
import { ParticipantesService } from '../../../core/services/participantes.service';
import { CursosService } from '../../../core/services/cursos.service';

const MAX_MB = 15;

/** Datos de apertura: registro al que se adjunta el sustento. */
export interface SustentoData {
  curso: Curso;
}

/**
 * Diálogo "Cargar Sustento de Expediente": adjunta el PDF del expediente y
 * envía el registro a revisión del Supervisor de Área. Se cierra con `true`
 * cuando el envío se realizó.
 */
@Component({
  selector: 'app-sustento-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatCheckboxModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Cargar Sustento de Expediente</h2>

    <mat-dialog-content>
      <p class="intro">Último paso antes de enviar los datos al Supervisor de Área.</p>

      <div class="columnas">
        <!-- Izquierda: actividad + participantes -->
        <div class="bloque">
          <div class="actividad">
            <p class="antetitulo">Actividad</p>
            <h3>{{ curso.nombreTema }}</h3>
            <div class="meta">
              <span>{{ curso.tipo === 'capacitacion' ? 'Capacitación' : 'Asistencia Técnica' }}</span>
              <span>Fecha: {{ curso.fecha }}</span>
            </div>
          </div>

          <div>
            <div class="titulo-lista">
              <p class="antetitulo tenue">Participantes registrados</p>
              <span class="contador">
                {{ participantes().length }} {{ participantes().length === 1 ? 'persona' : 'personas' }}
              </span>
            </div>
            <ul class="participantes">
              @for (p of participantes(); track p.id; let i = $index) {
                <li>
                  <span class="orden">{{ i + 1 }}</span>
                  <span class="datos">
                    <span class="nombre">{{ p.nombres }} {{ p.apellidos }}</span>
                    <span class="secundario">{{ p.dni }} | {{ p.primActividad }}</span>
                  </span>
                </li>
              }
            </ul>
          </div>

          <p class="nota">
            * El documento digital se enviará bloqueado para edición para garantizar la
            recepción exacta del archivo cargado y enviado.
          </p>
        </div>

        <!-- Derecha: carga del PDF y declaración jurada -->
        <div class="bloque">
          <div>
            <p class="antetitulo tenue">Documento de Sustento Requerido *</p>
            <p class="nota">Sube un único archivo PDF que contenga la información solicitada.</p>
          </div>

          @if (!file()) {
            <button
              type="button"
              class="zona-carga"
              [class.arrastrando]="drag()"
              (click)="abrirSelector()"
              (dragover)="$event.preventDefault(); drag.set(true)"
              (dragleave)="drag.set(false)"
              (drop)="onDrop($event)"
            >
              <span class="disco" aria-hidden="true">
                <mat-icon fontSet="material-symbols-outlined">cloud_upload</mat-icon>
              </span>
              <span class="titulo-carga">Arrastra tu PDF aquí o haz clic para buscar</span>
              <span class="nota">Solo PDF de hasta {{ maxMb }}MB</span>
            </button>
          } @else {
            <div class="archivo">
              <span class="icono" aria-hidden="true">
                <mat-icon fontSet="material-symbols-outlined">description</mat-icon>
              </span>
              <span class="datos">
                <span class="nombre">{{ file()!.name }}</span>
                <span class="secundario">Listo para enviar</span>
              </span>
              <button matIconButton type="button" (click)="file.set(null)" aria-label="Quitar archivo">
                <mat-icon fontSet="material-symbols-outlined">delete</mat-icon>
              </button>
            </div>
          }

          <input #entrada type="file" accept="application/pdf" hidden (change)="onFileInput($event)" />

          @if (error(); as e) {
            <p class="error" role="alert">{{ e }}</p>
          }

          <div class="declaracion">
            <mat-checkbox [checked]="declaro()" (change)="declaro.set($event.checked)">
              Declaro bajo juramento veracidad de la información adjunta en este documento como
              sustento de la actividad realizada.
            </mat-checkbox>
          </div>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close>Cancelar</button>
      <button matButton="filled" type="button" [disabled]="!file() || !declaro()" (click)="enviar()">
        Enviar
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .intro {
      margin: 0 0 16px;
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
    }
    .columnas { display: grid; grid-template-columns: 1fr; gap: 24px; }
    @media (min-width: 768px) { .columnas { grid-template-columns: 1fr 1fr; } }
    .bloque { display: flex; flex-direction: column; gap: 16px; }

    .antetitulo {
      margin: 0 0 4px;
      font: var(--mat-sys-label-small);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--mat-sys-primary);
    }
    .antetitulo.tenue { color: var(--mat-sys-on-surface-variant); }
    .nota {
      margin: 0;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }

    .actividad {
      padding: 16px;
      border-radius: var(--mat-sys-corner-medium);
      background: var(--mat-sys-surface-container-low);
      border: 1px solid var(--mat-sys-outline-variant);
    }
    .actividad h3 { margin: 0; font: var(--mat-sys-title-small); }
    .meta {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--mat-sys-outline-variant);
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }

    .titulo-lista { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .contador {
      padding: 2px 8px;
      border-radius: var(--mat-sys-corner-full);
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      font: var(--mat-sys-label-small);
    }
    .participantes {
      margin: 8px 0 0;
      padding: 0;
      list-style: none;
      max-height: 256px;
      overflow: auto;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-medium);
    }
    .participantes li {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
    }
    .participantes li + li { border-top: 1px solid var(--mat-sys-outline-variant); }
    .orden {
      width: 16px;
      text-align: right;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
      font-variant-numeric: tabular-nums;
    }
    .datos { display: flex; flex-direction: column; min-width: 0; flex: 1; }
    .nombre { font: var(--mat-sys-body-medium); font-weight: 600; }
    .secundario, .participantes .secundario {
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }

    .zona-carga {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 32px 16px;
      cursor: pointer;
      border: 2px dashed var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-medium);
      background: var(--mat-sys-surface-container-low);
      color: inherit;
      font: inherit;
      transition: background-color 120ms ease, border-color 120ms ease;
    }
    .zona-carga:hover, .zona-carga.arrastrando {
      border-color: var(--mat-sys-primary);
      background: var(--mat-sys-primary-container);
    }
    .titulo-carga { font: var(--mat-sys-body-medium); font-weight: 600; }
    .disco {
      width: 48px; height: 48px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 50%;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }

    .archivo {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: var(--mat-sys-corner-medium);
      background: var(--estado-aprobado-fondo);
      color: var(--estado-aprobado);
    }
    .archivo .icono {
      width: 36px; height: 36px;
      display: flex; align-items: center; justify-content: center;
      border-radius: var(--mat-sys-corner-small);
      background: var(--mat-sys-surface);
    }
    .archivo .secundario { color: inherit; opacity: 0.8; }

    .declaracion {
      padding: 12px;
      border-radius: var(--mat-sys-corner-medium);
      background: var(--estado-subsanado-fondo);
      color: var(--estado-subsanado);
    }
    .declaracion mat-checkbox { --mat-checkbox-label-text-size: 12px; }

    .error {
      margin: 0;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-error);
    }
  `,
})
export class SustentoDialogComponent {
  private readonly participantesService = inject(ParticipantesService);
  private readonly cursosService = inject(CursosService);
  private readonly ref = inject<MatDialogRef<SustentoDialogComponent, boolean>>(MatDialogRef);

  readonly curso = inject<SustentoData>(MAT_DIALOG_DATA).curso;
  /** Input de archivo oculto que abre el selector del sistema. */
  private readonly entradaArchivo = viewChild.required<ElementRef<HTMLInputElement>>('entrada');

  readonly maxMb = MAX_MB;
  readonly file = signal<File | null>(null);
  readonly drag = signal(false);
  readonly declaro = signal(false);
  readonly error = signal<string | null>(null);

  readonly participantes = computed(() => this.participantesService.participantesDe(this.curso.id));

  /** Abre el selector de archivos del sistema. */
  abrirSelector(): void {
    this.entradaArchivo().nativeElement.click();
  }

  onFileInput(e: Event): void {
    this.pickFile((e.target as HTMLInputElement).files?.[0] ?? null);
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.drag.set(false);
    this.pickFile(e.dataTransfer?.files?.[0] ?? null);
  }

  private pickFile(f: File | null): void {
    this.error.set(null);
    if (!f) return;
    if (f.type !== 'application/pdf') {
      this.error.set('El archivo debe ser PDF.');
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      this.error.set(`El archivo supera el límite de ${MAX_MB} MB.`);
      return;
    }
    this.file.set(f);
  }

  enviar(): void {
    const f = this.file();
    if (!f || !this.declaro()) return;
    // TODO(backend): subir el PDF con multipart/form-data antes de cambiar el estado.
    this.cursosService.update(this.curso.id, { estado: 'Enviado', fotoSustento: f.name });
    this.ref.close(true);
  }
}
