import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SeguimientoPanelComponent } from './seguimiento-panel.component';
import { EstadoCurso } from '../../core/models/curso.model';

/** Bandeja del ADMIN_UE: aprueba registros validados o los devuelve observados. */
@Component({
  selector: 'app-aprobacion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SeguimientoPanelComponent],
  template: `
    <app-seguimiento-panel
      title="Seguimiento y aprobación"
      subtitle="Aprobar registros ya validados o devolverlos con observaciones."
      [estadosEntrada]="estados"
      estadoAprobar="Aprobado"
      labelAprobar="Aprobar"
      rol="ADMIN_UE"
      rolLabel="ADMINISTRADOR UNIDAD ORGANIZACIONAL"
    />
  `,
})
export class AprobacionComponent {
  readonly estados: EstadoCurso[] = ['Enviado', 'Enviado-Subsanado', 'Observado', 'Validado', 'Aprobado'];
}
