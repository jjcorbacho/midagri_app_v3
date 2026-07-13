import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** Modal genérico (overlay + tarjeta), equivalente al Modal del original. */
@Component({
  selector: 'app-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 animate-overlay-in"
      (click)="closed.emit()"
    >
      <div
        class="bg-card rounded-xl ring-1 ring-border shadow-lg w-full p-6 max-h-[calc(100vh-2rem)] overflow-y-auto thin-scroll animate-modal-in"
        [class]="maxWidth()"
        role="dialog"
        aria-modal="true"
        (click)="$event.stopPropagation()"
      >
        <div class="flex items-center justify-between gap-4 mb-4">
          <h3 class="text-h3 text-foreground">{{ title() }}</h3>
          <button
            (click)="closed.emit()"
            class="btn-icon -mr-1.5 -mt-1 text-xl leading-none"
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
