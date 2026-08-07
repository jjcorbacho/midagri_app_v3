import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';

/**
 * EstadoBadge — estado de un registro de capacitación / asistencia técnica.
 * Usa `mat-chip` con los tonos `c-*` del tema, compartidos con las grillas
 * del sistema.
 */
const CLASES_ESTADO: Record<string, string> = {
  Registrado: 'c-registrado',
  Enviado: 'c-enviado',
  'Enviado-Subsanado': 'c-subsanado',
  Validado: 'c-validado',
  Observado: 'c-observado',
  Aprobado: 'c-aprobado',
};

@Component({
  selector: 'app-estado-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatChipsModule],
  template: `
    <mat-chip [class]="cls()" [attr.aria-label]="'Estado: ' + estado()" disableRipple>
      {{ estado() }}
    </mat-chip>
  `,
})
export class EstadoBadgeComponent {
  readonly estado = input.required<string>();
  readonly cls = computed(() => CLASES_ESTADO[this.estado()] ?? 'c-registrado');
}
