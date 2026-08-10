import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { AreaService } from '../../core/services/area.service';

/** Dato de la cuenta mostrado en la ficha. */
interface DatoPerfil {
  /** Ligadura de Material Symbols. */
  icono: string;
  etiqueta: string;
  valor: string;
}

/** Mi Perfil — información de la cuenta institucional (solo lectura). */
@Component({
  selector: 'app-perfil',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatIconModule],
  template: `
    @if (auth.user(); as user) {
      <section class="pagina">
        <header class="cabecera">
          <h1>Mi Perfil</h1>
          <p>Información de la cuenta institucional.</p>
        </header>

        <mat-card appearance="outlined" class="ficha">
          <div class="identidad">
            <span class="avatar">{{ user.nombre[0] }}{{ user.apellido[0] }}</span>
            <div>
              <h2>{{ user.nombre }} {{ user.apellido }}</h2>
              <p>&#64;{{ user.username }}</p>
            </div>
          </div>

          <div class="datos">
            @for (d of datos(); track d.etiqueta) {
              <div class="dato">
                <mat-icon fontSet="material-symbols-outlined">{{ d.icono }}</mat-icon>
                <div>
                  <span class="etiqueta">{{ d.etiqueta }}</span>
                  <p class="valor">{{ d.valor }}</p>
                </div>
              </div>
            }
          </div>
        </mat-card>

        <p class="aviso-legal">Datos protegidos bajo Ley N° 29733 (LPDP)</p>
      </section>
    }
  `,
  styles: `
    .pagina {
      padding: 24px;
      max-width: 900px;
      margin: 0 auto;
    }
    @media (min-width: 1024px) { .pagina { padding: 32px; } }

    .cabecera { margin-bottom: 24px; }
    .cabecera h1 {
      margin: 0;
      font: var(--mat-sys-headline-small);
      color: var(--mat-sys-on-surface);
    }
    .cabecera p {
      margin: 4px 0 0;
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
    }

    .ficha { padding: 0; overflow: hidden; }
    .identidad {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 32px 24px;
      background: var(--mat-sys-surface-container-low);
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }
    .avatar {
      flex: none;
      width: 80px;
      height: 80px;
      display: grid;
      place-items: center;
      border-radius: var(--mat-sys-corner-full);
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      font: var(--mat-sys-headline-small);
    }
    .identidad h2 {
      margin: 0;
      font: var(--mat-sys-title-medium);
      color: var(--mat-sys-on-surface);
    }
    .identidad p {
      margin: 4px 0 0;
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
    }

    .datos {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 16px;
      padding: 24px;
    }
    @media (min-width: 768px) { .datos { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    .dato {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      border-radius: var(--mat-sys-corner-medium);
      background: var(--mat-sys-surface-container-low);
    }
    .dato mat-icon {
      flex: none;
      color: var(--mat-sys-primary);
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .etiqueta {
      font: var(--mat-sys-label-small);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--mat-sys-on-surface-variant);
    }
    .valor {
      margin: 2px 0 0;
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface);
    }

    .aviso-legal {
      margin: 24px 0 0;
      font: var(--mat-sys-label-small);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class PerfilComponent {
  readonly auth = inject(AuthService);
  readonly areaService = inject(AreaService);

  readonly datos = computed<DatoPerfil[]>(() => {
    const user = this.auth.user();
    return [
      { icono: 'mail', etiqueta: 'Correo institucional', valor: user?.email ?? '' },
      { icono: 'work', etiqueta: 'Rol', valor: user?.rol ?? '' },
      { icono: 'apartment', etiqueta: 'Área activa', valor: this.areaService.currentArea() },
      { icono: 'verified_user', etiqueta: 'Estado', valor: 'Activo' },
    ];
  });
}
