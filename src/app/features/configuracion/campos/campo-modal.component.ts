import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, X, Trash2 } from 'lucide-angular';
import { CampoPersonalizado, CampoTipo } from '../../../core/models/campo.model';

/* Chips por tipo de campo: tonos derivados de los tokens del tema activo
   (sin colores fijos de la paleta Tailwind). */
export const TIPOS_CAMPO: { value: CampoTipo; label: string; chip: string }[] = [
  { value: 'text', label: 'Texto corto', chip: 'bg-info-soft text-info border-info/20' },
  { value: 'number', label: 'Número', chip: 'bg-brand-soft text-brand border-brand/20' },
  { value: 'select', label: 'Lista desplegable', chip: 'bg-state-validado-soft text-state-validado-foreground border-state-validado/20' },
  { value: 'date', label: 'Fecha', chip: 'bg-warning-soft text-warning-foreground border-warning/20' },
  { value: 'radio', label: 'Opción única', chip: 'bg-state-observado-soft text-state-observado-foreground border-state-observado/20' },
  { value: 'checkbox', label: 'Casillas', chip: 'bg-brand-accent-soft text-brand-accent border-brand-accent/20' },
  { value: 'textarea', label: 'Texto largo', chip: 'bg-success-soft text-success border-success/20' },
];

export type CampoModalResult = Omit<CampoPersonalizado, 'id' | 'area' | 'formulario'>;

/** Modal de creación/edición de un campo personalizado. */
@Component({
  selector: 'app-campo-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
      <div class="bg-card rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div class="p-4 border-b border-border flex items-center justify-between">
          <h3 class="text-base font-bold text-foreground">
            {{ initial() ? 'Editar campo personalizado' : 'Nuevo campo personalizado' }}
          </h3>
          <button (click)="closed.emit()" class="p-1 rounded hover:bg-muted" aria-label="Cerrar">
            <lucide-angular [img]="XIcon" class="size-4" />
          </button>
        </div>
        <div class="p-5 space-y-4 overflow-y-auto" [formGroup]="form">
          <div>
            <label class="block text-xs font-semibold text-foreground mb-1">
              Nombre del campo <span class="text-destructive">*</span>
            </label>
            <input
              formControlName="nombre"
              placeholder="p. ej. Tipo de cultivo"
              class="w-full bg-warning-soft border border-warning/40 rounded-lg px-3 py-2 text-sm focus:bg-card focus:ring-2 focus:ring-brand/15 outline-none transition"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-foreground mb-1">
              Tipo de dato <span class="text-destructive">*</span>
              @if (tieneData()) {
                <span class="ml-2 text-[10px] text-warning-foreground font-bold uppercase">Bloqueado — tiene datos</span>
              }
            </label>
            <select
              formControlName="tipo"
              class="w-full bg-warning-soft border border-warning/40 rounded-lg px-3 py-2 text-sm focus:bg-card focus:ring-2 focus:ring-brand/15 outline-none transition disabled:bg-muted/40 disabled:border-border disabled:cursor-not-allowed"
            >
              @for (t of tipos; track t.value) {
                <option [value]="t.value">{{ t.label }}</option>
              }
            </select>
          </div>

          @if (needsOptions()) {
            <div class="bg-brand-soft/40 border border-brand/15 rounded-lg p-3">
              <label class="block text-xs font-semibold text-brand mb-2">Opciones de la lista</label>
              <div class="space-y-1.5">
                @for (o of opciones(); track $index; let i = $index) {
                  <div class="flex items-center gap-2">
                    <input
                      [value]="o"
                      (input)="setOpcion(i, $any($event.target).value)"
                      class="flex-1 bg-card border border-border rounded px-2 py-1.5 text-sm"
                    />
                    <button (click)="quitarOpcion(i)" class="p-1.5 text-destructive hover:bg-destructive/10 rounded" title="Quitar">
                      <lucide-angular [img]="Trash2Icon" class="size-3.5" />
                    </button>
                  </div>
                }
              </div>
              <div class="flex gap-2 mt-2">
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
          }

          @if (tipoActual() === 'date') {
            <div class="bg-surface-2 border border-border rounded-lg p-3">
              <label class="block text-xs font-semibold text-foreground mb-2">Vista previa del calendario</label>
              <div class="flex justify-center">
                <input
                  type="date"
                  [value]="hoy"
                  disabled
                  aria-label="Vista previa del calendario"
                  class="bg-card border border-border rounded px-3 py-2 text-sm"
                />
              </div>
              <p class="text-[11px] text-muted-foreground mt-2 text-center">Por defecto se resalta la fecha actual.</p>
            </div>
          }

          <div class="flex items-center gap-6 pt-1">
            <label class="text-sm flex items-center gap-2 cursor-pointer">
              <input type="checkbox" formControlName="requerido" class="size-4 accent-brand" />
              ¿Es obligatorio?
            </label>
            <label class="text-sm flex items-center gap-2 cursor-pointer">
              <input type="checkbox" formControlName="activo" class="size-4 accent-brand" />
              Activo
            </label>
          </div>
        </div>
        <div class="p-4 border-t border-border flex justify-end gap-2">
          <button (click)="closed.emit()" class="btn-secondary">
            Cancelar
          </button>
          <button
            [disabled]="!canSave()"
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
export class CampoModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly initial = input<CampoPersonalizado | null>(null);
  readonly closed = output<void>();
  readonly saved = output<CampoModalResult>();

  readonly XIcon = X;
  readonly Trash2Icon = Trash2;
  readonly tipos = TIPOS_CAMPO;
  readonly hoy = new Date().toISOString().slice(0, 10);

  readonly opciones = signal<string[]>(['Opción A', 'Opción B']);
  readonly newOpt = signal('');
  private readonly formTick = signal(0);

  readonly form = this.fb.nonNullable.group({
    nombre: '',
    tipo: 'text' as CampoTipo,
    requerido: false,
    activo: false,
  });

  readonly tieneData = computed(() => !!this.initial()?.tieneData);
  readonly tipoActual = computed(() => {
    this.formTick();
    return this.form.controls.tipo.value;
  });
  readonly needsOptions = computed(() =>
    ['select', 'radio', 'checkbox'].includes(this.tipoActual()),
  );
  readonly canSave = computed(() => {
    this.formTick();
    return Boolean(this.form.controls.nombre.value.trim()) && (!this.needsOptions() || this.opciones().length > 0);
  });

  ngOnInit(): void {
    const i = this.initial();
    if (i) {
      this.form.patchValue({
        nombre: i.nombre,
        tipo: i.tipo,
        requerido: i.requerido,
        activo: i.activo,
      });
      this.opciones.set(i.opciones ?? ['Opción A', 'Opción B']);
      if (i.tieneData) this.form.controls.tipo.disable();
    }
    this.form.valueChanges.subscribe(() => this.formTick.update((t) => t + 1));
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
    const v = this.form.getRawValue();
    this.saved.emit({
      nombre: v.nombre.trim(),
      tipo: v.tipo,
      requerido: v.requerido,
      activo: v.activo,
      opciones: this.needsOptions()
        ? this.opciones().map((s) => s.trim()).filter(Boolean)
        : undefined,
      tieneData: this.initial()?.tieneData,
      visiblePorArea: this.initial()?.visiblePorArea,
    });
  }
}
