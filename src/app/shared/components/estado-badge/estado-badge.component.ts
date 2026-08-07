import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';

/**
 * EstadoBadge — estado de un registro de capacitación / asistencia técnica.
 * Usa `mat-chip` con los tokens semánticos `--estado-*` del tema.
 */
const CLASES_ESTADO: Record<string, string> = {
  Registrado: 'e-registrado',
  Enviado: 'e-enviado',
  'Enviado-Subsanado': 'e-subsanado',
  Validado: 'e-validado',
  Observado: 'e-observado',
  Aprobado: 'e-aprobado',
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
  styles: `
    mat-chip {
      --mdc-chip-label-text-size: 11px;
      --mdc-chip-container-height: 24px;
      font-weight: 600;
    }
    .e-registrado { --mdc-chip-elevated-container-color: var(--estado-registrado-fondo); --mdc-chip-label-text-color: var(--estado-registrado); }
    .e-enviado    { --mdc-chip-elevated-container-color: var(--estado-enviado-fondo);    --mdc-chip-label-text-color: var(--estado-enviado); }
    .e-subsanado  { --mdc-chip-elevated-container-color: var(--estado-subsanado-fondo);  --mdc-chip-label-text-color: var(--estado-subsanado); }
    .e-validado   { --mdc-chip-elevated-container-color: var(--estado-validado-fondo);   --mdc-chip-label-text-color: var(--estado-validado); }
    .e-observado  { --mdc-chip-elevated-container-color: var(--estado-observado-fondo);  --mdc-chip-label-text-color: var(--estado-observado); }
    .e-aprobado   { --mdc-chip-elevated-container-color: var(--estado-aprobado-fondo);   --mdc-chip-label-text-color: var(--estado-aprobado); }
  `,
})
export class EstadoBadgeComponent {
  readonly estado = input.required<string>();
  readonly cls = computed(() => CLASES_ESTADO[this.estado()] ?? 'e-registrado');
}
