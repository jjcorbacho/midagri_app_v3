import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthService } from '../../core/services/auth.service';
import { CambiarClaveDialogComponent } from './cambiar-clave-dialog.component';
import { AreaService } from '../../core/services/area.service';
import { AREAS } from '../../core/constants/areas.const';
import { etiquetaPeriodoCabecera } from '../../core/models/usuario-sodega.model';

/**
 * Selector "ÁREA ACTIVA" del header: oculto para todos los perfiles por
 * requerimiento. El área activa sigue operando internamente (AreaService);
 * para volver a mostrar el selector basta poner esta bandera en true.
 */
const MOSTRAR_SELECTOR_AREA = false;

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSelectModule,
    MatFormFieldModule,
  ],
  template: `
    <mat-toolbar class="cabecera">
      @if (mostrarBotonMenu()) {
        <button matIconButton (click)="menuClick.emit()" aria-label="Abrir menú de navegación">
          <mat-icon fontSet="material-symbols-outlined">menu</mat-icon>
        </button>
      }
      <div class="identidad">
        <span class="ministerio">MIDAGRI</span>
        <span class="sistema">Sistema de Capacitaciones</span>
        <!-- Periodo de gestión del usuario autenticado (visible en toda la app). -->
        @if (periodoTexto(); as periodo) {
          <span class="periodo" [title]="'Periodo: ' + periodo">
            <mat-icon fontSet="material-symbols-outlined">date_range</mat-icon>
            <span class="periodo-texto">Periodo: {{ periodo }}</span>
          </span>
        }
      </div>

      @if (mostrarSelectorArea) {
        <mat-form-field subscriptSizing="dynamic" class="selector-area">
          <mat-label>Área activa</mat-label>
          <mat-select
            [value]="areaService.currentArea()"
            (valueChange)="areaService.setCurrentArea($event)"
            aria-label="Área activa"
          >
            @for (a of areas; track a.code) {
              <mat-option [value]="a.code">{{ a.code }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      }

      <span class="separador"></span>

      <button matButton [matMenuTriggerFor]="menuUsuario" class="boton-usuario" aria-label="Menú de usuario">
        <span class="datos-usuario">
          <span class="nombre">{{ nombreHeader() }}</span>
          <span class="perfil">
            {{ perfilHeader() }}
            @if (!auth.isAdministrador()) {
              <span class="unidad" [title]="auth.session()?.unidad">· {{ auth.session()?.unidad }}</span>
            }
          </span>
        </span>
        <span class="avatar" aria-hidden="true">{{ iniciales() }}</span>
        <mat-icon fontSet="material-symbols-outlined">expand_more</mat-icon>
      </button>

      <mat-menu #menuUsuario="matMenu">
        <button mat-menu-item (click)="goPerfil()">
          <mat-icon fontSet="material-symbols-outlined">person</mat-icon>
          <span>Perfil</span>
        </button>
        <button mat-menu-item (click)="abrirCambiarClave()">
          <mat-icon fontSet="material-symbols-outlined">key</mat-icon>
          <span>Cambiar clave</span>
        </button>
        <button mat-menu-item (click)="logout()">
          <mat-icon fontSet="material-symbols-outlined">logout</mat-icon>
          <span>Cerrar sesión</span>
        </button>
      </mat-menu>
    </mat-toolbar>
  `,
  styles: `
    /* La cabecera ya no necesita sticky: vive fuera del área desplazable del
       shell. Se le da altura propia porque el bloque de usuario (nombre +
       perfil + unidad) es más alto que los 64 px por defecto de mat-toolbar. */
    .cabecera {
      flex: 0 0 auto;
      height: auto;
      min-height: 72px;
      padding-block: 8px;
      align-items: center;
      background: var(--mat-sys-surface);
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      gap: 16px;
    }
    .identidad {
      display: flex;
      flex-direction: column;
      justify-content: center;
      line-height: 1.2;
      min-width: 0;
    }
    .ministerio {
      font: var(--mat-sys-label-small);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--mat-sys-primary);
      font-weight: 600;
    }
    .sistema {
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
    }
    .periodo {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 2px;
      min-width: 0;
      font: var(--mat-sys-label-small);
      color: var(--mat-sys-primary);
    }
    .periodo mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .periodo-texto {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 220px;
    }
    @media (min-width: 640px) { .periodo-texto { max-width: 420px; } }
    @media (min-width: 1024px) { .periodo-texto { max-width: 560px; } }

    .separador { flex: 1 1 auto; }
    .selector-area { width: 160px; }

    .boton-usuario { height: auto; min-height: 52px; padding-block: 4px; }
    .datos-usuario {
      display: none;
      flex-direction: column;
      align-items: flex-end;
      line-height: 1.2;
      margin-right: 8px;
    }
    @media (min-width: 640px) { .datos-usuario { display: flex; } }
    .nombre { font: var(--mat-sys-body-medium); }
    .perfil {
      font: var(--mat-sys-label-small);
      color: var(--mat-sys-on-surface-variant);
    }
    .unidad {
      display: inline-block;
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      vertical-align: bottom;
    }
    .avatar {
      width: 36px; height: 36px;
      display: inline-flex; align-items: center; justify-content: center;
      border-radius: 50%;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      font: var(--mat-sys-label-large);
    }
  `,
})
export class HeaderComponent {
  readonly auth = inject(AuthService);
  readonly areaService = inject(AreaService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly areas = AREAS;
  readonly mostrarSelectorArea = MOSTRAR_SELECTOR_AREA;

  /** En pantallas pequeñas el menú lateral se abre desde la cabecera. */
  readonly mostrarBotonMenu = input(false);
  readonly menuClick = output<void>();

  /**
   * Periodo(s) del usuario autenticado, con el formato de la cabecera:
   * "Regular | Marzo - Abril" o "Extraordinario | 15/03/2026 al 20/08/2026".
   * Vacío cuando el servicio no tiene periodo asignado (no se muestra la línea).
   */
  readonly periodoTexto = computed(() =>
    this.auth.periodosSesion().map(etiquetaPeriodoCabecera).join('  ·  '),
  );

  iniciales(): string {
    const u = this.auth.user();
    if (!u) return '';
    return `${u.nombre[0] ?? ''}${u.apellido[0] ?? ''}`;
  }

  /** "Carlos Candelaria B." — formato de header del prototipo SODEGA. */
  nombreHeader(): string {
    const nombre = this.auth.session()?.nombreCompleto ?? '';
    const partes = nombre.trim().split(/\s+/).filter(Boolean);
    if (partes.length >= 3) {
      const primerNombre = partes[0];
      const apellidoPaterno = partes[partes.length - 2];
      const inicialMaterno = partes[partes.length - 1].charAt(0).toUpperCase() + '.';
      return `${primerNombre} ${apellidoPaterno} ${inicialMaterno}`;
    }
    return nombre;
  }

  perfilHeader(): string {
    const perfil = this.auth.session()?.perfil ?? '';
    return perfil === 'Administrador General' ? 'Administrador G.' : perfil;
  }

  abrirCambiarClave(): void {
    this.dialog.open(CambiarClaveDialogComponent, {
      width: '420px',
      maxWidth: '95vw',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
  }

  goPerfil(): void {
    this.router.navigate(['/perfil']);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
