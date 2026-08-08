import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Zona de carga del PDF de sustento: arrastrar y soltar o selector del
 * sistema, con validación de tipo y tamaño. La usan el diálogo de sustento de
 * la bandeja y el Paso 3 del asistente, que solo aportan el estado.
 *
 *   <app-carga-pdf [(archivo)]="file" [nombreExistente]="existingName()"
 *                  (quitado)="existingName.set(undefined)" />
 */
@Component({
  selector: 'app-carga-pdf',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
  template: `
    @if (!archivo() && !nombreExistente()) {
      <button
        type="button"
        class="zona"
        [class.arrastrando]="arrastrando()"
        [disabled]="deshabilitado()"
        (click)="abrirSelector()"
        (dragover)="$event.preventDefault(); arrastrando.set(true)"
        (dragleave)="arrastrando.set(false)"
        (drop)="onDrop($event)"
      >
        <span class="disco" aria-hidden="true">
          <mat-icon fontSet="material-symbols-outlined">cloud_upload</mat-icon>
        </span>
        <span class="titulo">Arrastra tu PDF aquí o haz clic para buscar</span>
        <span class="nota">Solo PDF de hasta {{ maxMb() }} MB</span>
      </button>
    } @else {
      <div class="cargado">
        <span class="icono" aria-hidden="true">
          <mat-icon fontSet="material-symbols-outlined">description</mat-icon>
        </span>
        <span class="datos">
          <span class="nombre">{{ archivo()?.name ?? nombreExistente() }}</span>
          <span class="estado">{{ archivo() ? 'Listo para enviar' : 'Archivo previamente cargado' }}</span>
        </span>
        @if (!deshabilitado()) {
          <button matButton type="button" (click)="abrirSelector()">Reemplazar</button>
          <button matIconButton type="button" (click)="quitar()" aria-label="Quitar archivo">
            <mat-icon fontSet="material-symbols-outlined">delete</mat-icon>
          </button>
        }
      </div>
    }

    <input #entrada type="file" accept="application/pdf" hidden (change)="onFileInput($event)" />

    @if (error(); as e) {
      <p class="error" role="alert">{{ e }}</p>
    }
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: 8px; }

    .zona {
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
    .zona:hover:not(:disabled), .zona.arrastrando {
      border-color: var(--mat-sys-primary);
      background: var(--mat-sys-primary-container);
    }
    .zona:disabled { opacity: 0.5; cursor: not-allowed; }
    .disco {
      width: 48px; height: 48px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 50%;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }
    .titulo { font: var(--mat-sys-body-medium); font-weight: 600; }
    .nota { font: var(--mat-sys-body-small); color: var(--mat-sys-on-surface-variant); }

    .cargado {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: var(--mat-sys-corner-medium);
      background: var(--estado-aprobado-fondo);
      color: var(--estado-aprobado);
    }
    .cargado .icono {
      width: 36px; height: 36px;
      display: flex; align-items: center; justify-content: center;
      border-radius: var(--mat-sys-corner-small);
      background: var(--mat-sys-surface);
    }
    .datos { display: flex; flex-direction: column; min-width: 0; flex: 1; }
    .nombre {
      font: var(--mat-sys-body-medium);
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .estado { font: var(--mat-sys-body-small); opacity: 0.85; }

    .error { margin: 0; font: var(--mat-sys-body-small); color: var(--mat-sys-error); }
  `,
})
export class CargaPdfComponent {
  /** Archivo elegido (two-way binding con el contenedor). */
  readonly archivo = model<File | null>(null);
  /** Nombre de un archivo ya cargado en el registro (solo lectura). */
  readonly nombreExistente = input<string | undefined>(undefined);
  readonly deshabilitado = input(false);
  readonly maxMb = input(15);
  /** Se emite al quitar el archivo, para que el contenedor olvide el existente. */
  readonly quitado = output<void>();

  private readonly entrada = viewChild.required<ElementRef<HTMLInputElement>>('entrada');
  readonly arrastrando = signal(false);
  readonly error = signal<string | null>(null);

  abrirSelector(): void {
    if (this.deshabilitado()) return;
    this.entrada().nativeElement.click();
  }

  onFileInput(e: Event): void {
    this.elegir((e.target as HTMLInputElement).files?.[0] ?? null);
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.arrastrando.set(false);
    if (!this.deshabilitado()) this.elegir(e.dataTransfer?.files?.[0] ?? null);
  }

  quitar(): void {
    this.archivo.set(null);
    this.error.set(null);
    this.quitado.emit();
  }

  private elegir(f: File | null): void {
    this.error.set(null);
    if (!f) return;
    if (f.type !== 'application/pdf') {
      this.error.set('El archivo debe ser PDF.');
      return;
    }
    if (f.size > this.maxMb() * 1024 * 1024) {
      this.error.set(`El archivo supera el límite de ${this.maxMb()} MB.`);
      return;
    }
    // El archivo elegido tiene prioridad sobre el nombre existente al mostrar
    // y al enviar, así que no hace falta avisar al contenedor.
    this.archivo.set(f);
  }
}
