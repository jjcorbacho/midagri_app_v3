import { ChangeDetectionStrategy, Component, OnInit, input, output, signal } from '@angular/core';
import { LucideAngularModule, X, Trash2 } from 'lucide-angular';
import { CampoPersonalizado } from '../../../core/models/campo.model';

/** Modal del ADMIN_UE para editar los valores de un campo de lista. */
@Component({
  selector: 'app-opciones-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <div class="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
      <div class="bg-card rounded-xl shadow-2xl w-full max-w-md">
        <div class="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 class="text-base font-bold text-foreground">Editar valores del campo</h3>
            <p class="text-xs text-muted-foreground mt-0.5">{{ campo().nombre }}</p>
          </div>
          <button (click)="closed.emit()" class="p-1 rounded hover:bg-muted" aria-label="Cerrar">
            <lucide-angular [img]="XIcon" class="size-4" />
          </button>
        </div>
        <div class="p-5 space-y-2">
          @for (o of opciones(); track $index; let i = $index) {
            <div class="flex items-center gap-2">
              <input
                [value]="o"
                (input)="setOpcion(i, $any($event.target).value)"
                class="flex-1 bg-card border border-border rounded px-2 py-1.5 text-sm"
              />
              <button (click)="quitarOpcion(i)" class="p-1.5 text-destructive hover:bg-destructive/10 rounded">
                <lucide-angular [img]="Trash2Icon" class="size-3.5" />
              </button>
            </div>
          }
          <div class="flex gap-2 pt-1">
            <input
              [value]="newOpt()"
              (input)="newOpt.set($any($event.target).value)"
              (keydown.enter)="$event.preventDefault(); addOpt()"
              placeholder="Nueva opción"
              class="flex-1 bg-card border border-border rounded px-2 py-1.5 text-sm"
            />
            <button (click)="addOpt()" class="btn-primary h-7 px-3 text-xs">
              Agregar
            </button>
          </div>
        </div>
        <div class="p-4 border-t border-border flex justify-end gap-2">
          <button (click)="closed.emit()" class="btn-secondary">
            Cancelar
          </button>
          <button
            (click)="guardar()"
            class="btn-primary px-5"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  `,
})
export class OpcionesModalComponent implements OnInit {
  readonly campo = input.required<CampoPersonalizado>();
  readonly closed = output<void>();
  readonly saved = output<string[]>();

  readonly XIcon = X;
  readonly Trash2Icon = Trash2;

  readonly opciones = signal<string[]>([]);
  readonly newOpt = signal('');

  ngOnInit(): void {
    this.opciones.set([...(this.campo().opciones ?? [])]);
  }

  setOpcion(i: number, v: string): void {
    this.opciones.update((p) => p.map((x, idx) => (idx === i ? v : x)));
  }

  quitarOpcion(i: number): void {
    this.opciones.update((p) => p.filter((_, idx) => idx !== i));
  }

  addOpt(): void {
    const v = this.newOpt().trim();
    if (!v) return;
    this.opciones.update((p) => [...p, v]);
    this.newOpt.set('');
  }

  guardar(): void {
    this.saved.emit(this.opciones().map((s) => s.trim()).filter(Boolean));
  }
}
