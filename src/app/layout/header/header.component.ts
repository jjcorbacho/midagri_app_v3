import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule, ChevronDown, User as UserIcon, KeyRound, LogOut } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { AreaService } from '../../core/services/area.service';
import { AREAS } from '../../core/constants/areas.const';

/**
 * Selector "ÁREA ACTIVA" del header: oculto para todos los perfiles por
 * requerimiento. El área activa sigue operando internamente (AreaService);
 * para volver a mostrar el selector basta poner esta bandera en true.
 */
const MOSTRAR_SELECTOR_AREA = false;

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <header class="h-16 bg-card ring-1 ring-zinc-950/5 flex items-center justify-between px-6 sticky top-0 z-20">
      <div class="flex items-center gap-6">
        <div class="flex flex-col">
          <span class="text-[10px] uppercase tracking-wider font-semibold text-brand">MIDAGRI</span>
          <span class="text-sm font-medium text-muted-foreground">Sistema de Capacitaciones</span>
        </div>
        @if (mostrarSelectorArea) {
          <div class="h-8 w-px bg-border"></div>

          <div class="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full ring-1 ring-black/5">
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
          <div class="size-9 rounded-full bg-secondary ring-1 ring-black/10 flex items-center justify-center">
            <span class="text-xs font-semibold text-muted-foreground">
              {{ iniciales() }}
            </span>
          </div>
          <lucide-angular [img]="ChevronDownIcon" class="size-4 text-muted-foreground" />
        </button>

        @if (menuOpen()) {
          <div class="fixed inset-0 z-30" (click)="menuOpen.set(false)"></div>
          <div class="absolute right-0 top-full mt-2 w-56 bg-card rounded-lg shadow-xl ring-1 ring-black/10 py-1.5 z-40">
            <button
              (click)="goPerfil()"
              class="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-secondary"
            >
              <lucide-angular [img]="UserIconRef" class="size-4 text-muted-foreground" /> Perfil
            </button>
            <button
              (click)="menuOpen.set(false); pwdOpen.set(true)"
              class="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-secondary"
            >
              <lucide-angular [img]="KeyRoundIcon" class="size-4 text-muted-foreground" /> Cambiar clave
            </button>
            <div class="border-t border-border my-1"></div>
            <button
              (click)="logout()"
              class="w-full flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
            >
              <lucide-angular [img]="LogOutIcon" class="size-4" /> Cerrar sesión
            </button>
          </div>
        }
      </div>

      @if (pwdOpen()) {
        <div class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" (click)="pwdOpen.set(false)">
          <div class="bg-card rounded-xl shadow-2xl w-full max-w-md p-6" (click)="$event.stopPropagation()">
            <h2 class="text-lg font-semibold mb-1">Cambiar clave</h2>
            <p class="text-xs text-muted-foreground mb-5">
              Mínimo 8 caracteres, una mayúscula, un número y un carácter especial (estándar SBS).
            </p>
            <form class="space-y-3" (submit)="$event.preventDefault(); pwdOpen.set(false)">
              @for (l of ['Clave actual', 'Clave nueva', 'Confirmar clave nueva']; track l) {
                <div>
                  <label class="block text-[11px] font-medium text-muted-foreground mb-1">{{ l }}</label>
                  <input
                    type="password"
                    required
                    class="w-full bg-background ring-1 ring-border rounded-lg px-3 py-2 text-sm focus:ring-brand outline-none"
                  />
                </div>
              }
              <div class="flex gap-2 justify-end pt-2">
                <button type="button" (click)="pwdOpen.set(false)" class="px-4 py-2 text-sm rounded-lg hover:bg-secondary">
                  Cancelar
                </button>
                <button class="px-4 py-2 text-sm bg-brand text-brand-foreground rounded-lg hover:bg-brand/90">
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
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

  readonly areas = AREAS;
  readonly mostrarSelectorArea = MOSTRAR_SELECTOR_AREA;
  readonly menuOpen = signal(false);
  readonly pwdOpen = signal(false);

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
