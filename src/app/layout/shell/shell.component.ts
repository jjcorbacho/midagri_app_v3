import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';

/**
 * Layout principal autenticado: `mat-sidenav-container` con el menú lateral y
 * el contenido. En pantallas pequeñas el menú pasa a modo `over` (se superpone
 * y se cierra al navegar), detectado con el BreakpointObserver del CDK.
 */
@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, MatSidenavModule, SidebarComponent, HeaderComponent],
  template: `
    <mat-sidenav-container class="contenedor" [hasBackdrop]="esMovil()">
      <mat-sidenav
        #drawer
        class="lateral"
        [mode]="esMovil() ? 'over' : 'side'"
        [opened]="!esMovil()"
        [fixedInViewport]="esMovil()"
      >
        <app-sidebar />
      </mat-sidenav>

      <mat-sidenav-content class="contenido">
        <app-header [mostrarBotonMenu]="esMovil()" (menuClick)="drawer.toggle()" />
        <main class="area-scroll">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: `
    .contenedor {
      height: 100dvh;
      background: var(--mat-sys-background);
    }
    /* El ancho lo gobierna la propia barra (colapsada / expandida), así que el
       drawer se ajusta al contenido en lugar de imponer un ancho fijo. */
    .lateral {
      width: auto;
      border-right: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface-container-highest);
    }
    .lateral ::ng-deep .mat-drawer-inner-container {
      width: auto;
      overflow: hidden;
    }
    /* La cabecera queda fija y solo desplaza el contenido. */
    .contenido {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .area-scroll {
      flex: 1;
      min-width: 0;
      overflow-y: auto;
    }
  `,
})
export class ShellComponent {
  private readonly breakpoints = inject(BreakpointObserver);

  /** Handset y tablet vertical usan el menú superpuesto. */
  readonly esMovil = toSignal(
    this.breakpoints
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .pipe(map((r) => r.matches)),
    { initialValue: false },
  );
}
