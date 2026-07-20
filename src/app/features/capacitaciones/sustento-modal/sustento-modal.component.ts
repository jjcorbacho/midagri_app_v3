import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { LucideAngularModule, X, UploadCloud, FileText, Trash2, Send } from 'lucide-angular';
import { Curso } from '../../../core/models/curso.model';
import { ParticipantesService } from '../../../core/services/participantes.service';
import { CursosService } from '../../../core/services/cursos.service';

const MAX_MB = 15;

/** Modal "Cargar Sustento de Expediente" — envía el registro a revisión. */
@Component({
  selector: 'app-sustento-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <div class="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-overlay-in" (click)="closed.emit()">
      <div class="bg-card text-foreground rounded-xl ring-1 ring-border shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col animate-modal-in" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="flex items-start justify-between p-6 border-b border-border">
          <div>
            <h2 class="text-lg font-bold tracking-tight">Cargar Sustento de Expediente</h2>
            <p class="text-sm text-muted-foreground mt-0.5">
              Último paso antes de enviar los datos al Supervisor de Área.
            </p>
          </div>
          <button (click)="closed.emit()" class="p-1 rounded-md hover:bg-muted text-muted-foreground" aria-label="Cerrar">
            <lucide-angular [img]="XIcon" class="size-5" />
          </button>
        </div>

        <!-- Body -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 overflow-auto">
          <!-- Izquierda: actividad + participantes -->
          <div class="space-y-4">
            <div class="bg-secondary/40 ring-1 ring-border rounded-lg p-4">
              <p class="text-[10px] font-bold text-brand uppercase tracking-wider mb-1">Actividad</p>
              <h3 class="text-base font-bold leading-tight">{{ curso().nombreTema }}</h3>
              <div class="flex justify-between text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                <span>{{ curso().tipo === 'capacitacion' ? 'Capacitación' : 'Asistencia Técnica' }}</span>
                <span>Fecha: {{ curso().fecha }}</span>
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
              </ul>
            </div>

            <p class="text-[11px] text-muted-foreground leading-relaxed">
              * El documento digital se enviará bloqueado para edición para garantizar la
              recepción exacta del archivo cargado y enviado.
            </p>
          </div>

          <!-- Derecha: upload -->
          <div class="space-y-4">
            <div>
              <p class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Documento de Sustento Requerido *
              </p>
              <p class="text-xs text-muted-foreground leading-relaxed">
                Sube un único archivo PDF que contenga la información solicitada.
              </p>
            </div>

            @if (!file()) {
              <button
                type="button"
                (click)="fileInput.click()"
                (dragover)="$event.preventDefault(); drag.set(true)"
                (dragleave)="drag.set(false)"
                (drop)="onDrop($event)"
                class="w-full flex flex-col items-center justify-center gap-2 py-8 px-4 rounded-lg border-2 border-dashed transition-colors"
                [class]="drag() ? 'border-brand bg-brand-soft/40' : 'border-border bg-secondary/40 hover:border-brand hover:bg-brand-soft/20'"
              >
                <div class="size-12 rounded-full bg-brand-soft text-brand flex items-center justify-center">
                  <lucide-angular [img]="UploadCloudIcon" class="size-6" />
                </div>
                <p class="text-sm font-semibold">Arrastra tu PDF aquí o haz clic para buscar</p>
                <p class="text-[11px] text-muted-foreground">Solo PDF de hasta {{ maxMb }}MB</p>
              </button>
            } @else {
              <div class="flex items-center gap-3 p-3 bg-state-aprobado-soft ring-1 ring-state-aprobado/30 rounded-lg">
                <div class="size-9 rounded-md bg-card flex items-center justify-center text-state-aprobado-foreground">
                  <lucide-angular [img]="FileTextIcon" class="size-5" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold truncate">{{ file()!.name }}</p>
                  <p class="text-[11px] text-state-aprobado-foreground/80">Listo para enviar</p>
                </div>
                <button (click)="file.set(null)" class="p-2 rounded-md text-muted-foreground hover:bg-card" aria-label="Quitar archivo">
                  <lucide-angular [img]="Trash2Icon" class="size-4" />
                </button>
              </div>
            }

            <input #fileInput type="file" accept="application/pdf" class="hidden" (change)="onFileInput($event)" />

            @if (error()) {
              <p class="text-xs text-destructive font-medium">{{ error() }}</p>
            }

            <label class="flex items-start gap-3 p-3 bg-state-subsanado-soft/40 ring-1 ring-state-subsanado/30 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                [checked]="declaro()"
                (change)="declaro.set($any($event.target).checked)"
                class="mt-0.5 size-4 accent-brand"
              />
              <span class="text-xs text-state-subsanado-foreground leading-relaxed">
                Declaro bajo juramento veracidad de la información adjunta en este documento como
                sustento de la actividad realizada .
              </span>
            </label>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-2 p-4 border-t border-border bg-secondary/30 rounded-b-xl">
          <button (click)="closed.emit()" class="btn-ghost">
            Cancelar
          </button>
          <button
            (click)="enviar()"
            [disabled]="!file() || !declaro()"
            class="btn-primary"
          >
            <lucide-angular [img]="SendIcon" class="size-4" /> Enviar
          </button>
        </div>
      </div>
    </div>
  `,
})
export class SustentoModalComponent {
  private readonly participantesService = inject(ParticipantesService);
  private readonly cursosService = inject(CursosService);

  readonly curso = input.required<Curso>();
  readonly closed = output<void>();

  readonly XIcon = X;
  readonly UploadCloudIcon = UploadCloud;
  readonly FileTextIcon = FileText;
  readonly Trash2Icon = Trash2;
  readonly SendIcon = Send;
  readonly maxMb = MAX_MB;

  readonly file = signal<File | null>(null);
  readonly drag = signal(false);
  readonly declaro = signal(false);
  readonly error = signal<string | null>(null);

  readonly participantes = computed(() => this.participantesService.participantesDe(this.curso().id));

  onFileInput(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0] ?? null;
    this.pickFile(f);
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
    this.cursosService.update(this.curso().id, { estado: 'Enviado', fotoSustento: f.name });
    this.closed.emit();
  }
}
