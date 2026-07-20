import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/components/toast/toast-container.component';
import { ThemeSwitcherComponent } from './shared/components/theme-switcher/theme-switcher.component';
import { FeedbackModalComponent } from './shared/components/modal/feedback-modal.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, ToastContainerComponent, ThemeSwitcherComponent, FeedbackModalComponent],
  template: `
    <router-outlet />
    <!-- Personalizar apariencia: visible en todas las pantallas -->
    <app-theme-switcher />
    <!-- Sistema unificado de modales de feedback -->
    <app-feedback-modal />
    <app-toast-container />
  `,
})
export class AppComponent {}
