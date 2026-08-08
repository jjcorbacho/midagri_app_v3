import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CampoBase, CampoPersonalizado } from '../../../core/models/campo.model';
import { CampoPreviewComponent } from './campo-preview.component';

/** Sección del formulario tal como se muestra en la vista previa. */
export interface GrupoPreview {
  seccion: string;
  campos: CampoBase[];
}

/**
 * Vista previa del formulario configurado, en marco de móvil o de escritorio.
 * Solo pinta: no conoce el catálogo ni los permisos, los recibe ya filtrados.
 */
@Component({
  selector: 'app-preview-formulario',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    MatButtonToggleModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    CampoPreviewComponent,
  ],
  template: `
    <div class="barra">
      <h3>
        <mat-icon fontSet="material-symbols-outlined">visibility</mat-icon>
        Vista previa
      </h3>
      <mat-button-toggle-group
        [value]="dispositivo()"
        (valueChange)="dispositivo.set($event)"
        hideSingleSelectionIndicator
        aria-label="Dispositivo de la vista previa"
      >
        <mat-button-toggle value="mobile" matTooltip="Móvil">
          <mat-icon fontSet="material-symbols-outlined">smartphone</mat-icon>
        </mat-button-toggle>
        <mat-button-toggle value="desktop" matTooltip="Escritorio">
          <mat-icon fontSet="material-symbols-outlined">desktop_windows</mat-icon>
        </mat-button-toggle>
      </mat-button-toggle-group>
    </div>

    @if (dispositivo() === 'mobile') {
      <div class="telefono">
        <div class="encabezado-app">
          <span class="ruta">{{ area() }} › {{ formulario() }}</span>
          <strong>Registro</strong>
        </div>
        <div class="cuerpo">
          <ng-container *ngTemplateOutlet="contenido" />
        </div>
      </div>
    } @else {
      <mat-card appearance="outlined" class="escritorio">
        <ng-container *ngTemplateOutlet="contenido" />
      </mat-card>
    }

    <ng-template #contenido>
      @for (grupo of grupos(); track grupo.seccion) {
        <div class="seccion">
          <h4>{{ grupo.seccion }}</h4>
          @for (b of grupo.campos; track b.nombre) {
            <app-campo-preview [nombre]="b.nombre + (b.requerido ? ' *' : '')" [tipo]="b.tipo" />
          }
        </div>
      }
      @if (personalizados().length > 0) {
        <div class="seccion">
          <h4>Personalizados</h4>
          @for (c of personalizados(); track c.id) {
            <app-campo-preview
              [nombre]="c.nombre + (c.requerido ? ' *' : '')"
              [tipo]="c.tipo"
              [opciones]="c.opciones"
            />
          }
        </div>
      }
    </ng-template>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    .barra {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      width: 100%;
      max-width: 360px;
    }
    .barra h3 {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0;
      font: var(--mat-sys-label-large);
      color: var(--mat-sys-on-surface-variant);
    }
    mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .telefono {
      display: flex;
      flex-direction: column;
      width: 100%;
      max-width: 340px;
      height: 600px;
      overflow: hidden;
      border: 8px solid var(--mat-sys-inverse-surface);
      border-radius: 40px;
      background: var(--mat-sys-surface);
    }
    .encabezado-app {
      display: flex;
      flex-direction: column;
      padding: 16px;
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
    }
    .ruta { font: var(--mat-sys-label-small); opacity: 0.85; }
    .cuerpo { flex: 1 1 auto; overflow-y: auto; padding: 16px; }
    .escritorio { width: 100%; padding: 24px; }

    .seccion { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
    .seccion h4 {
      margin: 0;
      padding-bottom: 4px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      font: var(--mat-sys-label-medium);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--mat-sys-primary);
    }
  `,
})
export class PreviewFormularioComponent {
  /** Código del área, para la cabecera simulada de la aplicación móvil. */
  readonly area = input.required<string>();
  readonly formulario = input.required<string>();
  readonly grupos = input.required<GrupoPreview[]>();
  readonly personalizados = input.required<CampoPersonalizado[]>();

  readonly dispositivo = signal<'desktop' | 'mobile'>('mobile');
}
