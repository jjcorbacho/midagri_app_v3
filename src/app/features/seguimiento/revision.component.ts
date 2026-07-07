import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SeguimientoPanelComponent } from './seguimiento-panel.component';
import { EstadoCurso } from '../../core/models/curso.model';

/** Bandeja del ADMIN_DZ: valida u observa los registros enviados. */
@Component({
  selector: 'app-revision',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SeguimientoPanelComponent],
  template: `
    <app-seguimiento-panel
      title="Seguimiento y revisión"
      subtitle="Validar registros enviados u observar con un comentario."
      [estadosEntrada]="estados"
      estadoAprobar="Validado"
      labelAprobar="Validar"
      rol="ADMIN_DZ"
      rolLabel="ADMINISTRADOR DZ_CAP_ASIT."
    />
  `,
})
export class RevisionComponent {
  readonly estados: EstadoCurso[] = ['Enviado', 'Enviado-Subsanado', 'Observado', 'Validado', 'Aprobado'];
}
