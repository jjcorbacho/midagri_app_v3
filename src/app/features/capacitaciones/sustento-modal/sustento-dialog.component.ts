import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { Curso } from '../../../core/models/curso.model';
import { ParticipantesService } from '../../../core/services/participantes.service';
import { CursosService } from '../../../core/services/cursos.service';
import { CargaPdfComponent } from '../../../shared/components/carga-pdf/carga-pdf.component';
import { ResumenActividadComponent } from '../resumen-actividad/resumen-actividad.component';

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
  imports: [MatDialogModule, MatButtonModule, MatCheckboxModule, MatIconModule, CargaPdfComponent, ResumenActividadComponent],
  template: `
    <h2 mat-dialog-title>Cargar Sustento de Expediente</h2>

    <mat-dialog-content>
      <p class="intro">Último paso antes de enviar los datos al Supervisor de Área.</p>

      <div class="columnas">
        <!-- Izquierda: actividad + participantes -->
        <app-resumen-actividad [curso]="curso" [participantes]="participantes()" />

        <!-- Derecha: carga del PDF y declaración jurada -->
        <div class="bloque">
          <div>
            <p class="antetitulo tenue">Documento de Sustento Requerido *</p>
            <p class="nota">Sube un único archivo PDF que contenga la información solicitada.</p>
            <p class="nota">
              * El documento digital se enviará bloqueado para edición para garantizar la
              recepción exacta del archivo cargado y enviado.
            </p>
          </div>

          <app-carga-pdf [(archivo)]="file" [maxMb]="maxMb" />

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

    .declaracion {
      padding: 12px;
      border-radius: var(--mat-sys-corner-medium);
      background: var(--estado-subsanado-fondo);
      color: var(--estado-subsanado);
    }
    .declaracion mat-checkbox { --mat-checkbox-label-text-size: 12px; }
  `,
})
export class SustentoDialogComponent {
  private readonly participantesService = inject(ParticipantesService);
  private readonly cursosService = inject(CursosService);
  private readonly ref = inject<MatDialogRef<SustentoDialogComponent, boolean>>(MatDialogRef);

  readonly curso = inject<SustentoData>(MAT_DIALOG_DATA).curso;

  readonly maxMb = MAX_MB;
  readonly file = signal<File | null>(null);
  readonly declaro = signal(false);

  readonly participantes = computed(() => this.participantesService.participantesDe(this.curso.id));

  enviar(): void {
    const f = this.file();
    if (!f || !this.declaro()) return;
    // TODO(backend): subir el PDF con multipart/form-data antes de cambiar el estado.
    this.cursosService.update(this.curso.id, { estado: 'Enviado', fotoSustento: f.name });
    this.ref.close(true);
  }
}
