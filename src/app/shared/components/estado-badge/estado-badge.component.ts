import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * EstadoBadge — Renderiza el estado de un registro de capacitación / asist. técnica.
 * Usa tokens semánticos `--state-*` definidos en src/styles.css.
 */
const STATE_CLASSES: Record<string, string> = {
  Registrado:
    'bg-state-registrado-soft text-state-registrado-foreground ring-state-registrado/30',
  Enviado:
    'bg-state-enviado-soft text-state-enviado-foreground ring-state-enviado/30',
  'Enviado-Subsanado':
    'bg-state-subsanado-soft text-state-subsanado-foreground ring-state-subsanado/30',
  Validado:
    'bg-state-validado-soft text-state-validado-foreground ring-state-validado/30',
  Observado:
    'bg-state-observado-soft text-state-observado-foreground ring-state-observado/30',
  Aprobado:
    'bg-state-aprobado-soft text-state-aprobado-foreground ring-state-aprobado/30',
};

@Component({
  selector: 'app-estado-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 whitespace-nowrap tracking-wide"
      [class]="cls()"
    >{{ estado() }}</span>
  `,
})
export class EstadoBadgeComponent {
  readonly estado = input.required<string>();
  readonly cls = computed(
    () => STATE_CLASSES[this.estado()] ?? 'bg-muted text-muted-foreground ring-border',
  );
}
