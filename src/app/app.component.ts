import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeSwitcherComponent } from './shared/components/theme-switcher/theme-switcher.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, ThemeSwitcherComponent],
  template: `
    <router-outlet />
    <!-- Personalizar apariencia: visible en todas las pantallas -->
    <app-theme-switcher />
    <!-- El feedback (modales y notificaciones) lo montan MatDialog y
         MatSnackBar bajo demanda desde ModalService / ToastService. -->
  `,
})
export class AppComponent {}
