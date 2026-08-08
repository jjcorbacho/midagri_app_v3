import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/services/auth.service';
import { AreaService } from '../../../core/services/area.service';
import { CamposService } from '../../../core/services/campos.service';
import { ToastService } from '../../../core/services/toast.service';
import { AREAS } from '../../../core/constants/areas.const';
import { CAMPOS_BASE, FORMULARIOS } from '../../../core/constants/campos-base.const';
import { CampoBase, CampoPersonalizado, CampoTipo, FormularioKey } from '../../../core/models/campo.model';
import { PreviewFormularioComponent } from './preview-formulario.component';
import {
  CampoDialogComponent,
  CampoDialogData,
  CampoDialogResult,
  TIPOS_CAMPO,
} from './campo-dialog.component';
import { OpcionesDialogComponent, OpcionesDialogData } from './opciones-dialog.component';

/** Ligadura de Material Symbols por sección del formulario. */
const ICONOS_SECCION: Record<string, string> = {
  'Datos Generales': 'description',
  'Ubicación': 'location_on',
  'Coordenadas': 'explore',
  'Documento Sustentatorio': 'attach_file',
  'Datos de Identidad y Demográficos': 'person',
  'Datos técnicos y comerciales': 'work',
  'Organización y participación social': 'groups',
  'Información adicional': 'info',
};

/** Tipos de campo cuyos valores puede editar el ADMIN_UE. */
const TIPOS_CON_OPCIONES: CampoTipo[] = ['select', 'radio', 'checkbox'];

/** Configuración de Formularios — campos base y personalizados por área. */
@Component({
  selector: 'app-campos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTooltipModule,
    PreviewFormularioComponent,
  ],
  template: `
    <section class="pagina">
      <header class="cabecera">
        <div class="titulo">
          <div class="ruta">
            <span>Configuración</span>
            <mat-icon fontSet="material-symbols-outlined">chevron_right</mat-icon>
            <span>Gestión de campos</span>
            <mat-chip disableRipple [class]="isAdmin() ? 'c-aprobado' : 'c-enviado'">
              {{ isAdmin() ? 'Administrador general' : 'Admin. unidad organizacional' }}
            </mat-chip>
          </div>
          <h1>Configuración de Formularios — {{ area().code }}</h1>
        </div>

        <div class="filtros">
          @if (isAdmin()) {
            <mat-form-field subscriptSizing="dynamic" class="filtro">
              <mat-label>Oficina responsable</mat-label>
              <mat-select
                [value]="areaService.currentArea()"
                (valueChange)="areaService.setCurrentArea($event)"
              >
                @for (a of areas; track a.code) {
                  <mat-option [value]="a.code">{{ a.code }} — {{ a.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          } @else {
            <!-- El área del ADMIN_UE es fija: el control va deshabilitado. -->
            <mat-form-field subscriptSizing="dynamic" class="filtro">
              <mat-label>Oficina responsable</mat-label>
              <input matInput disabled [value]="area().code + ' — ' + area().name" />
              <mat-icon matSuffix fontSet="material-symbols-outlined">lock</mat-icon>
            </mat-form-field>
          }

          <mat-form-field subscriptSizing="dynamic" class="filtro">
            <mat-label>Formulario a configurar</mat-label>
            <mat-select [value]="formulario()" (valueChange)="formulario.set($event)">
              @for (f of formularios; track f.key) {
                <mat-option [value]="f.key">{{ f.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
      </header>

      <mat-card appearance="outlined" class="panel">
        <div class="division">
          <!-- Estructura del formulario -->
          <div class="estructura">
            <div class="barra">
              <h2>
                Estructura del formulario
                <mat-chip disableRipple class="c-registrado">
                  {{ totalActivos() }} {{ isAdmin() ? 'campos activos' : 'campos visibles' }}
                </mat-chip>
              </h2>
              @if (isAdmin()) {
                <button matButton="filled" type="button" (click)="abrirCampo(null)">
                  <mat-icon fontSet="material-symbols-outlined">add</mat-icon>
                  Nuevo campo personalizado
                </button>
              }
            </div>

            <mat-accordion multi displayMode="flat">
              @for (grupo of grupos(); track grupo.seccion) {
                <mat-expansion-panel
                  [expanded]="!estaColapsada(grupo.seccion)"
                  (opened)="setColapso(grupo.seccion, false)"
                  (closed)="setColapso(grupo.seccion, true)"
                >
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <mat-icon fontSet="material-symbols-outlined">{{ iconoSeccion(grupo.seccion) }}</mat-icon>
                      {{ grupo.seccion }}
                    </mat-panel-title>
                    <mat-panel-description>{{ grupo.campos.length }} campos</mat-panel-description>
                  </mat-expansion-panel-header>

                  <div class="campos">
                    @for (b of grupo.campos; track b.nombre) {
                      <div class="fila-campo" [class.inactiva]="esBaseInactivo(b)">
                        <mat-icon class="asa" fontSet="material-symbols-outlined">drag_indicator</mat-icon>
                        <div class="datos">
                          <div class="nombre">
                            <span [class.tachado]="esBaseInactivo(b)">{{ b.nombre }}</span>
                            <mat-chip disableRipple class="c-registrado">Base</mat-chip>
                          </div>
                          <div class="etiquetas">
                            <mat-chip disableRipple [class]="tipoChip(b.tipo)">{{ tipoLabel(b.tipo) }}</mat-chip>
                            @if (b.requerido) {
                              <mat-chip disableRipple class="c-observado">Obligatorio</mat-chip>
                            }
                          </div>
                        </div>
                        @if (isAdmin()) {
                          <mat-slide-toggle
                            [checked]="!esBaseInactivo(b)"
                            (change)="alternarBase(b)"
                            [aria-label]="'Activar ' + b.nombre"
                          >{{ esBaseInactivo(b) ? 'Inactivo' : 'Activo' }}</mat-slide-toggle>
                        }
                      </div>
                    }
                  </div>
                </mat-expansion-panel>
              }
            </mat-accordion>

            <!-- Campos personalizados -->
            <div class="personalizados">
              <div class="titulo-personalizados">
                <mat-icon fontSet="material-symbols-outlined">auto_awesome</mat-icon>
                <h3>Campos personalizados</h3>
                <span class="conteo">{{ customsVisibles().length }} campos</span>
              </div>

              @if (customsVisibles().length === 0) {
                <div class="vacio">
                  <p>
                    {{ isAdmin()
                      ? 'Sin campos personalizados en este formulario.'
                      : 'El administrador general aún no ha publicado campos personalizados activos.' }}
                  </p>
                  @if (isAdmin()) {
                    <button matButton type="button" (click)="abrirCampo(null)">Agregar el primero</button>
                  }
                </div>
              } @else {
                <div class="campos">
                  @for (c of customsVisibles(); track c.id) {
                    <div class="fila-campo destacada" [class.inactiva]="isAdmin() && !c.activo">
                      <mat-icon class="asa" fontSet="material-symbols-outlined">drag_indicator</mat-icon>
                      <div class="datos">
                        <div class="nombre">
                          <span>{{ c.nombre }}</span>
                          @if (c.tieneData) {
                            <mat-chip disableRipple class="c-enviado" matTooltip="Con información registrada">
                              Con datos
                            </mat-chip>
                          }
                        </div>
                        <div class="etiquetas">
                          <mat-chip disableRipple [class]="tipoChip(c.tipo)">{{ tipoLabel(c.tipo) }}</mat-chip>
                          <mat-chip disableRipple [class]="c.requerido ? 'c-observado' : 'c-registrado'">
                            {{ c.requerido ? 'Obligatorio' : 'Opcional' }}
                          </mat-chip>
                        </div>
                      </div>

                      @if (isAdmin()) {
                        <div class="acciones">
                          <button
                            matIconButton
                            type="button"
                            class="accion a-neutro"
                            matTooltip="Editar"
                            (click)="abrirCampo(c)"
                            [attr.aria-label]="'Editar ' + c.nombre"
                          >
                            <mat-icon fontSet="material-symbols-outlined">edit</mat-icon>
                          </button>
                          <button
                            matIconButton
                            type="button"
                            class="accion a-error"
                            [class.atenuada]="c.tieneData"
                            [matTooltip]="c.tieneData ? 'Bloqueado: tiene datos registrados' : 'Eliminar'"
                            (click)="eliminarCampo(c)"
                            [attr.aria-label]="'Eliminar ' + c.nombre"
                          >
                            <mat-icon fontSet="material-symbols-outlined">delete</mat-icon>
                          </button>
                          <mat-slide-toggle
                            [checked]="c.activo"
                            (change)="camposService.update(c.id, { activo: !c.activo })"
                            [aria-label]="'Activar ' + c.nombre"
                          >{{ c.activo ? 'Activo' : 'Inactivo' }}</mat-slide-toggle>
                        </div>
                      } @else {
                        <div class="acciones">
                          @if (tieneOpciones(c)) {
                            <button
                              matIconButton
                              type="button"
                              class="accion a-marca"
                              matTooltip="Editar valores"
                              (click)="abrirOpciones(c)"
                              [attr.aria-label]="'Editar valores de ' + c.nombre"
                            >
                              <mat-icon fontSet="material-symbols-outlined">tune</mat-icon>
                            </button>
                          }
                          <mat-slide-toggle
                            [checked]="visibleUE(c)"
                            (change)="camposService.setVisibilidad(c.id, areaService.currentArea(), !visibleUE(c))"
                            [aria-label]="'Mostrar ' + c.nombre"
                          >{{ visibleUE(c) ? 'Visible' : 'No visible' }}</mat-slide-toggle>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <app-preview-formulario
            class="previa"
            [area]="area().code"
            [formulario]="formLabel()"
            [grupos]="gruposPreview()"
            [personalizados]="customsRender()"
          />
        </div>

        <div class="pie">
          <p class="ayuda">
            <mat-icon fontSet="material-symbols-outlined">info</mat-icon>
            {{ isAdmin()
              ? 'Los cambios se guardan como catálogo y se reflejan en la vista del Administrador Unidad Ejecutora(UE).'
              : 'Marca como visibles los campos que deben aparecer en los formularios de los técnicos.' }}
          </p>
          <div class="botones">
            @if (isAdmin()) {
              <button matButton type="button">Descartar</button>
              <button matButton="filled" type="button" (click)="toast.success('Configuración guardada')">
                Guardar
              </button>
            } @else {
              <button matButton="filled" type="button" (click)="publicar()">
                <mat-icon fontSet="material-symbols-outlined">send</mat-icon>
                Publicar formulario
              </button>
            }
          </div>
        </div>
      </mat-card>
    </section>
  `,
  styles: `
    .pagina {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    @media (min-width: 1024px) { .pagina { padding: 32px; } }

    .cabecera {
      display: flex;
      flex-direction: column;
      gap: 16px;
      justify-content: space-between;
    }
    @media (min-width: 1280px) { .cabecera { flex-direction: row; align-items: flex-start; } }
    .ruta {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      font: var(--mat-sys-label-medium);
      color: var(--mat-sys-on-surface-variant);
    }
    .ruta mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .cabecera h1 {
      margin: 8px 0 0;
      font: var(--mat-sys-headline-small);
      color: var(--mat-sys-on-surface);
    }
    .filtros { display: flex; flex-wrap: wrap; gap: 16px; }
    .filtro { width: 260px; }

    .panel { padding: 0; overflow: hidden; }
    .division { display: flex; flex-direction: column; }
    @media (min-width: 1024px) { .division { flex-direction: row; } }

    .estructura {
      padding: 24px;
      background: var(--mat-sys-surface-container-lowest);
    }
    @media (min-width: 1024px) {
      .estructura {
        width: 58%;
        border-right: 1px solid var(--mat-sys-outline-variant);
      }
    }
    .barra {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }
    .barra h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      font: var(--mat-sys-title-medium);
      color: var(--mat-sys-on-surface);
    }

    mat-expansion-panel { background: var(--mat-sys-surface); }
    mat-panel-title { display: flex; align-items: center; gap: 8px; font-weight: 600; }
    mat-panel-title mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--mat-sys-primary); }

    .campos { display: flex; flex-direction: column; gap: 8px; }
    .fila-campo {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-medium);
      background: var(--mat-sys-surface);
    }
    .fila-campo.destacada {
      border-color: color-mix(in srgb, var(--mat-sys-primary) 35%, transparent);
      background: var(--mat-sys-primary-container);
    }
    .fila-campo.inactiva { opacity: 0.6; }
    .asa { color: var(--mat-sys-outline); cursor: grab; }
    .datos { flex: 1 1 auto; min-width: 0; }
    .nombre {
      display: flex;
      align-items: center;
      gap: 8px;
      font: var(--mat-sys-body-medium);
      font-weight: 600;
      color: var(--mat-sys-on-surface);
    }
    .nombre .tachado { text-decoration: line-through; color: var(--mat-sys-on-surface-variant); }
    .etiquetas { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
    .acciones { display: flex; align-items: center; gap: 4px; }
    mat-slide-toggle { --mat-slide-toggle-label-text-size: 11px; white-space: nowrap; }

    .personalizados { margin-top: 24px; }
    .titulo-personalizados {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-bottom: 8px;
      margin-bottom: 12px;
      border-bottom: 1px solid color-mix(in srgb, var(--mat-sys-primary) 30%, transparent);
      color: var(--mat-sys-primary);
    }
    .titulo-personalizados h3 { margin: 0; font: var(--mat-sys-title-small); }
    .titulo-personalizados .conteo { margin-left: auto; font: var(--mat-sys-label-medium); }
    .vacio {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 24px;
      border: 1px dashed color-mix(in srgb, var(--mat-sys-primary) 35%, transparent);
      border-radius: var(--mat-sys-corner-medium);
      text-align: center;
    }
    .vacio p { margin: 0; font: var(--mat-sys-body-small); color: var(--mat-sys-on-surface-variant); }

    .previa {
      flex: 1 1 auto;
      padding: 24px;
      background: var(--mat-sys-surface-container);
    }

    .pie {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface-container-low);
    }
    .ayuda {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      max-width: 70ch;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }
    .ayuda mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .botones { display: flex; gap: 8px; }
  `,
})
export class CamposComponent {
  readonly areaService = inject(AreaService);
  readonly camposService = inject(CamposService);
  readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  readonly areas = AREAS;
  readonly formularios = FORMULARIOS;

  // ADMINISTRADOR = super-admin con edición total; ADMIN_UE = solo visibilidad por área.
  readonly isAdmin = computed(() => this.auth.isAdministrador());
  readonly area = computed(
    () => AREAS.find((a) => a.code === this.areaService.currentArea()) ?? AREAS[0],
  );

  readonly formulario = signal<FormularioKey>('capacitacion');
  readonly baseInactive = signal<Record<string, boolean>>({});
  readonly collapsed = signal<Record<string, boolean>>({});

  readonly formLabel = computed(
    () => FORMULARIOS.find((f) => f.key === this.formulario())!.label,
  );

  readonly customs = computed(() =>
    this.camposService.camposDe(this.areaService.currentArea(), this.formulario()),
  );
  readonly customsVisibles = computed(() =>
    this.isAdmin() ? this.customs() : this.customs().filter((c) => c.activo),
  );

  readonly baseCampos = computed(() => CAMPOS_BASE[this.formulario()]);

  readonly grupos = computed(() => {
    const map = new Map<string, CampoBase[]>();
    for (const c of this.baseCampos()) {
      if (!map.has(c.seccion)) map.set(c.seccion, []);
      map.get(c.seccion)!.push(c);
    }
    return Array.from(map.entries()).map(([seccion, campos]) => ({ seccion, campos }));
  });

  readonly gruposPreview = computed(() => {
    const inactive = this.baseInactive();
    const visibles = this.baseCampos().filter((b) => !inactive[this.keyOf(b)]);
    const map = new Map<string, CampoBase[]>();
    visibles.forEach((b) => {
      if (!map.has(b.seccion)) map.set(b.seccion, []);
      map.get(b.seccion)!.push(b);
    });
    return Array.from(map.entries()).map(([seccion, campos]) => ({ seccion, campos }));
  });

  readonly customsRender = computed(() =>
    this.customs().filter((c) =>
      this.isAdmin() ? c.activo : c.activo && c.visiblePorArea?.[this.areaService.currentArea()],
    ),
  );

  readonly totalActivos = computed(() => {
    const inactive = this.baseInactive();
    const baseActivos = this.baseCampos().filter((b) => !inactive[this.keyOf(b)]).length;
    if (this.isAdmin()) {
      return baseActivos + this.customs().filter((c) => c.activo).length;
    }
    return (
      baseActivos +
      this.customsVisibles().filter((c) => c.visiblePorArea?.[this.areaService.currentArea()]).length
    );
  });

  constructor() {
    // Al cambiar de formulario: solo la primera sección queda expandida.
    effect(() => {
      const form = this.formulario();
      const next: Record<string, boolean> = {};
      this.grupos().forEach((g, i) => {
        next[`${form}:${g.seccion}`] = i !== 0;
      });
      this.collapsed.set(next);
    });
  }

  private keyOf(b: CampoBase): string {
    return `${this.formulario()}:${b.nombre}`;
  }

  iconoSeccion(seccion: string): string {
    return ICONOS_SECCION[seccion] ?? 'description';
  }

  tipoLabel(t: CampoTipo): string {
    return TIPOS_CAMPO.find((x) => x.value === t)!.label;
  }

  tipoChip(t: CampoTipo): string {
    return TIPOS_CAMPO.find((x) => x.value === t)!.chip;
  }

  tieneOpciones(c: CampoPersonalizado): boolean {
    return TIPOS_CON_OPCIONES.includes(c.tipo);
  }

  estaColapsada(seccion: string): boolean {
    return this.collapsed()[`${this.formulario()}:${seccion}`] ?? false;
  }

  setColapso(seccion: string, colapsada: boolean): void {
    const key = `${this.formulario()}:${seccion}`;
    if (this.collapsed()[key] === colapsada) return;
    this.collapsed.update((p) => ({ ...p, [key]: colapsada }));
  }

  esBaseInactivo(b: CampoBase): boolean {
    return !!this.baseInactive()[this.keyOf(b)];
  }

  alternarBase(b: CampoBase): void {
    const key = this.keyOf(b);
    this.baseInactive.update((p) => ({ ...p, [key]: !p[key] }));
  }

  visibleUE(c: CampoPersonalizado): boolean {
    return !!c.visiblePorArea?.[this.areaService.currentArea()];
  }

  eliminarCampo(c: CampoPersonalizado): void {
    if (c.tieneData) {
      this.toast.warning('Este campo tiene información registrada. Solo puede inactivarse.');
      return;
    }
    this.camposService.delete(c.id);
  }

  /** Alta (`null`) o edición de un campo personalizado. */
  abrirCampo(campo: CampoPersonalizado | null): void {
    this.dialog
      .open<CampoDialogComponent, CampoDialogData, CampoDialogResult>(CampoDialogComponent, {
        data: { initial: campo },
        maxWidth: '95vw',
        autoFocus: 'dialog',
      })
      .afterClosed()
      .subscribe((datos) => {
        if (!datos) return;
        if (campo) this.camposService.update(campo.id, datos);
        else {
          this.camposService.add({
            ...datos,
            area: this.areaService.currentArea(),
            formulario: this.formulario(),
          });
        }
      });
  }

  /** Edición de los valores de un campo de lista (ADMIN_UE). */
  abrirOpciones(campo: CampoPersonalizado): void {
    this.dialog
      .open<OpcionesDialogComponent, OpcionesDialogData, string[]>(OpcionesDialogComponent, {
        data: { campo },
        maxWidth: '95vw',
        autoFocus: 'dialog',
      })
      .afterClosed()
      .subscribe((opciones) => {
        if (!opciones) return;
        this.camposService.update(campo.id, { opciones });
        this.toast.success('Valores actualizados');
      });
  }

  publicar(): void {
    this.toast.success(
      'Formulario publicado',
      'Los campos visibles aparecerán en las pantallas de los técnicos.',
    );
  }
}
