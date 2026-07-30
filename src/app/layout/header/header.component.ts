import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule, ChevronDown, User as UserIcon, KeyRound, LogOut, CalendarRange } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
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
  imports: [LucideAngularModule, ModalComponent],
  template: `
    <header class="h-16 bg-card/95 backdrop-blur border-b border-border flex items-center justify-between px-6 sticky top-0 z-20">
      <div class="flex items-center gap-6">
        <div class="flex flex-col justify-center leading-tight min-w-0">
          <span class="text-[10px] uppercase tracking-wider font-semibold text-brand">MIDAGRI</span>
          <span class="text-sm font-medium text-muted-foreground">Sistema de Capacitaciones</span>
          <!-- Periodo de gestión del usuario autenticado (visible en toda la app). -->
          @if (periodoTexto(); as periodo) {
            <span
              class="flex items-center gap-1 text-[11px] text-brand font-medium mt-0.5 min-w-0"
              [title]="'Periodo: ' + periodo"
            >
              <lucide-angular [img]="CalendarRangeIcon" class="size-3 shrink-0" />
              <span class="truncate max-w-[220px] sm:max-w-[420px] lg:max-w-[560px]">
                Periodo: {{ periodo }}
              </span>
            </span>
          }
        </div>
        @if (mostrarSelectorArea) {
          <div class="h-8 w-px bg-border"></div>

          <div class="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full ring-1 ring-border">
            <span class="text-[11px] font-semibold text-muted-foreground">ÁREA ACTIVA:</span>
            <select
              [value]="areaService.currentArea()"
              (change)="onAreaChange($event)"
              class="bg-transparent text-sm font-semibold text-brand focus:outline-none cursor-pointer max-w-[280px]"
            >
              @for (a of areas; track a.code) {
                <option [value]="a.code">{{ a.code }}</option>
              }
            </select>
          </div>
          <span class="hidden md:inline text-xs text-muted-foreground truncate max-w-xs">
            {{ areaService.area().name }}
          </span>
        }
      </div>

      <div class="flex items-center gap-3 relative">
        <button
          (click)="menuOpen.set(!menuOpen())"
          class="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-secondary transition-colors"
        >
          <div class="text-right hidden sm:block">
            <div class="text-sm font-medium">{{ nombreHeader() }}</div>
            <div class="text-[11px] text-muted-foreground tracking-tight">
              <span class="font-bold text-brand">{{ perfilHeader() }}</span>
              @if (!auth.isAdministrador()) {
                <span class="truncate max-w-[220px] inline-block align-bottom" [title]="auth.session()?.unidad">
                  · {{ auth.session()?.unidad }}
                </span>
              }
            </div>
          </div>
          <div class="size-9 rounded-full bg-secondary ring-1 ring-border flex items-center justify-center">
            <span class="text-xs font-semibold text-muted-foreground">
              {{ iniciales() }}
            </span>
          </div>
          <lucide-angular [img]="ChevronDownIcon" class="size-4 text-muted-foreground" />
        </button>

        @if (menuOpen()) {
          <div class="fixed inset-0 z-30" (click)="menuOpen.set(false)"></div>
          <div class="absolute right-0 top-full mt-2 w-56 bg-popover rounded-xl shadow-lg ring-1 ring-border py-1.5 z-40 animate-modal-in">
            <button
              (click)="goPerfil()"
              class="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
            >
              <lucide-angular [img]="UserIconRef" class="size-4 text-muted-foreground" /> Perfil
            </button>
            <button
              (click)="menuOpen.set(false); pwdOpen.set(true)"
              class="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
            >
              <lucide-angular [img]="KeyRoundIcon" class="size-4 text-muted-foreground" /> Cambiar clave
            </button>
            <div class="border-t border-border my-1"></div>
            <button
              (click)="logout()"
              class="w-full flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <lucide-angular [img]="LogOutIcon" class="size-4" /> Cerrar sesión
            </button>
          </div>
        }
      </div>

      @if (pwdOpen()) {
        <app-modal
          title="Cambiar clave"
          maxWidth="max-w-md"
          tipo="info"
          mensaje="Mínimo 8 caracteres, una mayúscula, un número y un carácter especial (estándar SBS)."
          [mostrarAcciones]="true"
          (aceptado)="pwdOpen.set(false)"
          (cancelado)="pwdOpen.set(false)"
          (closed)="pwdOpen.set(false)"
        >
            <form class="space-y-3" (submit)="$event.preventDefault(); pwdOpen.set(false)">
              @for (l of ['Clave actual', 'Clave nueva', 'Confirmar clave nueva']; track l) {
                <div>
                  <label class="block text-[11px] font-medium text-muted-foreground mb-1">{{ l }}</label>
                  <input
                    type="password"
                    required
                    class="w-full bg-background ring-1 ring-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring outline-none transition-[box-shadow] duration-150"
                  />
                </div>
              }
            </form>
        </app-modal>
      }
    </header>
  `,
})
export class HeaderComponent {
  readonly auth = inject(AuthService);
  readonly areaService = inject(AreaService);
  private readonly router = inject(Router);

  readonly ChevronDownIcon = ChevronDown;
  readonly UserIconRef = UserIcon;
  readonly KeyRoundIcon = KeyRound;
  readonly LogOutIcon = LogOut;
  readonly CalendarRangeIcon = CalendarRange;

  readonly areas = AREAS;
  readonly mostrarSelectorArea = MOSTRAR_SELECTOR_AREA;
  readonly menuOpen = signal(false);
  readonly pwdOpen = signal(false);

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

  onAreaChange(event: Event): void {
    this.areaService.setCurrentArea((event.target as HTMLSelectElement).value);
  }

  goPerfil(): void {
    this.menuOpen.set(false);
    this.router.navigate(['/perfil']);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
