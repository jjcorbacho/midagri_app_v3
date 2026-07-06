import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** Modal genérico (overlay + tarjeta), equivalente al Modal del original. */
@Component({
  selector: 'app-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      (click)="closed.emit()"
    >
      <div
        class="bg-card rounded-xl ring-1 ring-black/10 shadow-xl w-full p-6"
        [class]="maxWidth()"
        (click)="$event.stopPropagation()"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-semibold">{{ title() }}</h3>
          <button
            (click)="closed.emit()"
            class="text-muted-foreground hover:text-foreground text-xl leading-none"
            aria-label="Cerrar"
          >×</button>
        </div>
        <ng-content />
      </div>
    </div>
  `,
})
export class ModalComponent {
  readonly title = input.required<string>();
  readonly maxWidth = input<string>('max-w-lg');
  readonly closed = output<void>();
}
