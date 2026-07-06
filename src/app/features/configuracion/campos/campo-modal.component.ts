import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, X, Trash2 } from 'lucide-angular';
import { CampoPersonalizado, CampoTipo } from '../../../core/models/campo.model';

export const TIPOS_CAMPO: { value: CampoTipo; label: string; chip: string }[] = [
  { value: 'text', label: 'Texto corto', chip: 'bg-blue-50 text-blue-700 border-blue-100' },
  { value: 'number', label: 'Número', chip: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
  { value: 'select', label: 'Lista desplegable', chip: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  { value: 'date', label: 'Fecha', chip: 'bg-purple-50 text-purple-700 border-purple-100' },
  { value: 'radio', label: 'Opción única', chip: 'bg-pink-50 text-pink-700 border-pink-100' },
  { value: 'checkbox', label: 'Casillas', chip: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100' },
  { value: 'textarea', label: 'Texto largo', chip: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
];

export type CampoModalResult = Omit<CampoPersonalizado, 'id' | 'area' | 'formulario'>;

/** Modal de creación/edición de un campo personalizado. */
@Component({
  selector: 'app-campo-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div class="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 class="text-base font-bold text-slate-800">
            {{ initial() ? 'Editar campo personalizado' : 'Nuevo campo personalizado' }}
          </h3>
          <button (click)="closed.emit()" class="p-1 rounded hover:bg-slate-100" aria-label="Cerrar">
            <lucide-angular [img]="XIcon" class="size-4" />
          </button>
        </div>
        <div class="p-5 space-y-4 overflow-y-auto" [formGroup]="form">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Nombre del campo <span class="text-rose-500">*</span>
            </label>
            <input
              formControlName="nombre"
              placeholder="p. ej. Tipo de cultivo"
              class="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-100 outline-none"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Tipo de dato <span class="text-rose-500">*</span>
              @if (tieneData()) {
                <span class="ml-2 text-[10px] text-amber-600 font-bold uppercase">Bloqueado — tiene datos</span>
              }
            </label>
            <select
              formControlName="tipo"
              class="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-100 outline-none disabled:bg-slate-50 disabled:cursor-not-allowed"
            >
              @for (t of tipos; track t.value) {
                <option [value]="t.value">{{ t.label }}</option>
              }
            </select>
          </div>

          @if (needsOptions()) {
            <div class="bg-teal-50/40 border border-teal-100 rounded-lg p-3">
              <label class="block text-xs font-semibold text-teal-800 mb-2">Opciones de la lista</label>
              <div class="space-y-1.5">
                @for (o of opciones(); track $index; let i = $index) {
                  <div class="flex items-center gap-2">
                    <input
                      [value]="o"
                      (input)="setOpcion(i, $any($event.target).value)"
                      class="flex-1 bg-white border border-slate-200 rounded px-2 py-1.5 text-sm"
                    />
                    <button (click)="quitarOpcion(i)" class="p-1.5 text-rose-500 hover:bg-rose-50 rounded" title="Quitar">
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
                  class="flex-1 bg-white border border-slate-200 rounded px-2 py-1.5 text-sm"
                />
                <button (click)="addOpt()" class="px-3 py-1.5 text-xs font-bold bg-teal-700 text-white rounded hover:bg-teal-800">
                  Agregar
                </button>
              </div>
            </div>
          }

          @if (tipoActual() === 'date') {
            <div class="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <label class="block text-xs font-semibold text-slate-700 mb-2">Vista previa del calendario</label>
              <div class="flex justify-center">
                <input type="date" [value]="hoy" class="bg-white border border-slate-200 rounded px-3 py-2 text-sm" />
              </div>
              <p class="text-[11px] text-slate-500 mt-2 text-center">Por defecto se resalta la fecha actual.</p>
            </div>
          }

          <div class="flex items-center gap-6 pt-1">
            <label class="text-sm flex items-center gap-2 cursor-pointer">
              <input type="checkbox" formControlName="requerido" class="size-4 accent-teal-600" />
              ¿Es obligatorio?
            </label>
            <label class="text-sm flex items-center gap-2 cursor-pointer">
              <input type="checkbox" formControlName="activo" class="size-4 accent-teal-600" />
              Activo
            </label>
          </div>
        </div>
        <div class="p-4 border-t border-slate-200 flex justify-end gap-2">
          <button (click)="closed.emit()" class="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-200 hover:bg-slate-50">
            Cancelar
          </button>
          <button
            [disabled]="!canSave()"
            (click)="guardar()"
            class="px-5 py-2 text-sm font-semibold rounded-lg bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed"
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
