import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, ChevronRight } from 'lucide-angular';
import { ConfiguracionFlujoService } from '../../core/services/configuracion-flujo.service';

/**
 * "Registro en configuración": qué registro se está configurando.
 *
 * Lo consultan la estructura de formulario y las reglas, así que vive en un
 * único componente en lugar de repetirse en cada vista. No recibe entradas: lee
 * la selección de `ConfiguracionFlujoService`, la misma fuente que alimenta la
 * grilla de `/configuracion/campos`, de modo que las dos vistas muestran
 * siempre el mismo registro sin duplicar datos.
 */
@Component({
  selector: 'app-registro-configuracion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LucideAngularModule],
  template: `
    <div class="rounded-xl ring-1 ring-border bg-surface-2/60 px-4 py-3 min-w-0">
      <p class="label-ds mb-1">Registro en configuración</p>
      @if (flujo.registro(); as registro) {
        <p class="text-sm font-semibold text-foreground break-words">
          {{ registro.unidadResponsable }}
        </p>
        <dl class="mt-1 space-y-0.5 text-xs text-muted-foreground">
          <div class="flex gap-1.5">
            <dt class="shrink-0">Unidad funcional:</dt>
            <dd class="font-medium text-foreground break-words">{{ registro.unidadFuncional }}</dd>
          </div>
          <div class="flex gap-1.5">
            <dt class="shrink-0">Formulario:</dt>
            <dd class="font-medium text-foreground">
              {{ flujo.labelFormulario(registro.formulario) }}
            </dd>
          </div>
          <div class="flex gap-1.5">
            <dt class="shrink-0">Temática:</dt>
            <dd class="font-medium text-foreground break-words">{{ registro.tematica }}</dd>
          </div>
        </dl>
      } @else {
        <!-- Reglas es navegable sin pasar por la etapa 1, así que aquí puede no
             haber selección; se dice qué falta en lugar de dejar el bloque vacío. -->
        <p class="text-xs text-muted-foreground italic">
          Sin registro seleccionado. Elija uno en Configuración de campos.
        </p>
      }
      <a
        routerLink="/configuracion/campos"
        class="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
      >
        <lucide-angular [img]="ChevronRightIcon" class="size-3 rotate-180" />
        Cambiar registro
      </a>
    </div>
  `,
})
export class RegistroConfiguracionComponent {
  readonly flujo = inject(ConfiguracionFlujoService);
  readonly ChevronRightIcon = ChevronRight;
}
