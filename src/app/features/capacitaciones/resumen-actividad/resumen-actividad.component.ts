import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Curso } from '../../../core/models/curso.model';
import { Participante } from '../../../core/models/participante.model';

/**
 * Resumen de la actividad y su lista de participantes: lo comparten el Paso 3
 * del asistente y el diálogo de sustento de la bandeja, que muestran lo mismo
 * junto a la carga del PDF.
 */
@Component({
  selector: 'app-resumen-actividad',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="actividad">
      <p class="antetitulo">Actividad</p>
      <h3>{{ curso().nombreTema }}</h3>
      <div class="meta">
        <span>{{ curso().tipo === 'capacitacion' ? 'Capacitación' : 'Asistencia Técnica' }}</span>
        <span>Fecha: {{ curso().fecha }}</span>
      </div>
    </div>

    <div>
      <div class="titulo-lista">
        <p class="antetitulo tenue">Participantes registrados</p>
        <span class="contador">
          {{ participantes().length }} {{ participantes().length === 1 ? 'persona' : 'personas' }}
        </span>
      </div>
      <ul>
        @for (p of participantes(); track p.id; let i = $index) {
          <li>
            <span class="orden">{{ i + 1 }}</span>
            <span class="datos">
              <span class="nombre">{{ p.nombres }} {{ p.apellidos }}</span>
              <span class="secundario">{{ p.dni }} | {{ p.primActividad }}</span>
            </span>
          </li>
        }
        @if (participantes().length === 0) {
          <li class="vacio">{{ mensajeVacio() }}</li>
        }
      </ul>
    </div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: 16px; }

    .antetitulo {
      margin: 0 0 4px;
      font: var(--mat-sys-label-small);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--mat-sys-primary);
    }
    .antetitulo.tenue { color: var(--mat-sys-on-surface-variant); }

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

    ul {
      margin: 8px 0 0;
      padding: 0;
      list-style: none;
      max-height: 256px;
      overflow: auto;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-medium);
    }
    li { display: flex; align-items: center; gap: 12px; padding: 12px; }
    li + li { border-top: 1px solid var(--mat-sys-outline-variant); }
    li.vacio {
      justify-content: center;
      font: var(--mat-sys-body-small);
      font-style: italic;
      color: var(--mat-sys-on-surface-variant);
    }
    .orden {
      width: 16px;
      text-align: right;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
      font-variant-numeric: tabular-nums;
    }
    .datos { display: flex; flex-direction: column; min-width: 0; flex: 1; }
    .nombre { font: var(--mat-sys-body-medium); font-weight: 600; }
    .secundario { font: var(--mat-sys-body-small); color: var(--mat-sys-on-surface-variant); }
  `,
})
export class ResumenActividadComponent {
  readonly curso = input.required<Curso>();
  readonly participantes = input.required<Participante[]>();
  readonly mensajeVacio = input('No hay participantes registrados.');
}
