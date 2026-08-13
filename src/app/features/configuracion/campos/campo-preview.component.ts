import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CampoTipo } from '../../../core/models/campo.model';

/** Campo individual de la vista previa del formulario (deshabilitado). */
@Component({
  selector: 'app-campo-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-1">
      <label class="text-xs font-bold text-muted-foreground uppercase">{{ nombre() }}</label>
      @switch (tipo()) {
        @case ('textarea') {
          <textarea disabled rows="2" class="w-full bg-surface-2 border border-border rounded px-3 py-1.5 text-xs"></textarea>
        }
        @case ('select') {
          <select disabled class="w-full bg-surface-2 border border-border rounded px-3 py-1.5 text-xs">
            <option>— seleccionar —</option>
            @for (o of opts(); track o) {
              <option>{{ o }}</option>
            }
          </select>
        }
        @case ('radio') {
          <div class="flex gap-3 flex-wrap">
            @for (o of opts(); track o) {
              <label class="text-xs flex items-center gap-1">
                <input type="radio" disabled /> {{ o }}
              </label>
            }
          </div>
        }
        @case ('checkbox') {
          <div class="flex gap-3 flex-wrap">
            @for (o of opts(); track o) {
              <label class="text-xs flex items-center gap-1">
                <input type="checkbox" disabled /> {{ o }}
              </label>
            }
          </div>
        }
        @default {
          <input [type]="tipo()" disabled class="w-full bg-surface-2 border border-border rounded px-3 py-1.5 text-xs" />
        }
      }
    </div>
  `,
})
export class CampoPreviewComponent {
  readonly nombre = input.required<string>();
  readonly tipo = input.required<CampoTipo>();
  readonly opciones = input<string[] | undefined>(undefined);

  readonly opts = computed(() => {
    const o = this.opciones();
    return o && o.length ? o : ['Opción A', 'Opción B'];
  });
}
