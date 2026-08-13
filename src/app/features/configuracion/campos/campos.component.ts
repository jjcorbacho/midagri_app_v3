import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  ChevronRight, Plus, Trash2, LayoutGrid, Info,
} from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { ModalService } from '../../../core/services/modal.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  ConfiguracionFlujoService,
  RegistroConfiguracion,
  unidadesFuncionalesDe,
} from '../../../core/services/configuracion-flujo.service';
import { FORMULARIOS } from '../../../core/constants/campos-base.const';
import { TEMATICAS } from '../../../core/constants/catalogos.const';
import { UNIDADES_RESPONSABLES } from '../../../core/constants/sodega.const';
import { FormularioKey } from '../../../core/models/campo.model';

/**
 * Etapa 1 del flujo de Configuración: alta y selección del registro.
 *
 * El "registro" es el par (oficina responsable, formulario) — la misma unidad
 * sobre la que ya operaban `CamposService` y `ReglasService`. Al seleccionarlo
 * se habilita "Seguir con estructura de formulario", que lleva a la etapa 2.
 * La administración de campos vive ahora en `EstructuraFormularioComponent`.
 */
@Component({
  selector: 'app-campos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <section class="p-6 lg:p-8 max-w-7xl mx-auto animate-page-in">
      <div class="bg-card rounded-xl shadow-xl border border-border overflow-hidden flex flex-col">
        <!-- Header -->
        <header class="p-6 border-b border-border">
          <div class="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
            <div class="min-w-0">
              <div class="flex items-center gap-2 text-xs font-semibold text-brand uppercase tracking-wider mb-1">
                <span>Configuración</span>
                <lucide-angular [img]="ChevronRightIcon" class="size-3 text-muted-foreground/60" />
                <span class="text-muted-foreground">Configuración de campos</span>
                <span
                  class="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  [class]="isAdmin() ? 'bg-state-aprobado-soft text-state-aprobado-foreground' : 'bg-state-enviado-soft text-state-enviado-foreground'"
                >{{ isAdmin() ? 'ADMINISTRADOR GENERAL' : 'ADMIN. UNIDAD ORGANIZACIONAL' }}</span>
              </div>
              <h1 class="text-h1 text-foreground">Configuración de Formularios</h1>
              <p class="text-sm text-muted-foreground mt-1">
                Agregue una configuración y selecciónela para administrar la estructura del formulario.
              </p>
            </div>
          </div>
        </header>

        <!-- Alta de configuración: las 4 dimensiones del registro SODEGA -->
        <div class="p-6 border-b border-border/60 bg-surface-2/40">
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div class="flex flex-col gap-1.5 min-w-0">
              <label for="cfg-unidad-responsable" class="label-ds">
                Unidad Responsable <span class="text-destructive">*</span>
              </label>
              <select
                id="cfg-unidad-responsable"
                [value]="unidadResponsableSel()"
                (change)="onUnidadResponsableChange($any($event.target).value)"
                class="h-9 w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 focus:ring-2 focus:ring-ring outline-none"
              >
                <option value="">Seleccione una unidad responsable</option>
                @for (u of unidadesResponsables; track u) {
                  <option [value]="u">{{ u }}</option>
                }
              </select>
            </div>

            <div class="flex flex-col gap-1.5 min-w-0">
              <label for="cfg-unidad-funcional" class="label-ds">
                Unidad Funcional <span class="text-destructive">*</span>
              </label>
              <!-- Depende de la unidad responsable; sin ella queda inhabilitada. -->
              <select
                id="cfg-unidad-funcional"
                [value]="unidadFuncionalSel()"
                (change)="unidadFuncionalSel.set($any($event.target).value)"
                [disabled]="!unidadResponsableSel()"
                class="h-9 w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 focus:ring-2 focus:ring-ring outline-none disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
              >
                <option value="">Seleccione una unidad funcional</option>
                @for (uf of unidadesFuncionales(); track uf) {
                  <option [value]="uf">{{ uf }}</option>
                }
              </select>
            </div>

            <div class="flex flex-col gap-1.5 min-w-0">
              <label for="cfg-formulario" class="label-ds">
                Formulario <span class="text-destructive">*</span>
              </label>
              <select
                id="cfg-formulario"
                [value]="formularioSel()"
                (change)="formularioSel.set($any($event.target).value)"
                class="h-9 w-full bg-background border border-border text-foreground text-sm font-medium rounded-lg px-3 focus:ring-2 focus:ring-ring outline-none"
              >
                <option value="">Seleccione un formulario</option>
                @for (f of formularios; track f.key) {
                  <option [value]="f.key">{{ f.label }}</option>
                }
              </select>
            </div>

            <div class="flex flex-col gap-1.5 min-w-0">
              <label for="cfg-tematica" class="label-ds">
                Temática <span class="text-destructive">*</span>
              </label>
              <select
                id="cfg-tematica"
                [value]="tematicaSel()"
                (change)="tematicaSel.set($any($event.target).value)"
                class="h-9 w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 focus:ring-2 focus:ring-ring outline-none"
              >
                <option value="">Seleccione una temática</option>
                @for (t of tematicas; track t) {
                  <option [value]="t">{{ t }}</option>
                }
              </select>
            </div>
          </div>

          <div class="flex justify-end mt-4">
            <!-- Solo se habilita con las cuatro dimensiones completas. -->
            <button
              (click)="agregar()"
              [disabled]="!puedeAgregar()"
              class="btn-primary h-9 justify-center px-6"
            >
              <lucide-angular [img]="PlusIcon" class="size-4" />
              Agregar
            </button>
          </div>
        </div>

        <!-- Grilla de configuración -->
        <div class="p-6">
          <div class="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <h2 class="text-sm font-bold text-foreground flex items-center gap-2">
              <lucide-angular [img]="LayoutGridIcon" class="size-4 text-brand" />
              Grilla de configuración
            </h2>
            <span class="text-xs text-muted-foreground">{{ configuraciones().length }} registros</span>
          </div>

          <div class="rounded-xl ring-1 ring-border overflow-x-auto">
            <table class="w-full">
              <thead class="bg-secondary/60">
                <tr>
                  <th scope="col" class="th-ds text-center w-28">Seleccionar</th>
                  <th scope="col" class="th-ds">Unidad Responsable</th>
                  <th scope="col" class="th-ds">Unidad Funcional</th>
                  <th scope="col" class="th-ds">Formulario</th>
                  <th scope="col" class="th-ds">Temática</th>
                  <th scope="col" class="th-ds text-center w-20">Estado</th>
                  @if (isAdmin()) {
                    <th scope="col" class="th-ds text-center w-16">—</th>
                  }
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                @for (c of configuraciones(); track c.id) {
                  <tr
                    class="tr-hover cursor-pointer"
                    [class]="flujo.seleccionId() === c.id ? 'bg-brand-soft/50' : ''"
                    (click)="flujo.seleccionar(c.id)"
                  >
                    <td class="td-ds text-center">
                      <input
                        type="radio"
                        name="registro-configuracion"
                        class="accent-brand size-4 align-middle"
                        [checked]="flujo.seleccionId() === c.id"
                        (change)="flujo.seleccionar(c.id)"
                        [attr.aria-label]="'Seleccionar ' + c.unidadResponsable + ' — ' + flujo.labelFormulario(c.formulario)"
                      />
                    </td>
                    <td class="td-ds font-medium text-foreground">{{ c.unidadResponsable }}</td>
                    <td class="td-ds">{{ c.unidadFuncional }}</td>
                    <td class="td-ds">{{ flujo.labelFormulario(c.formulario) }}</td>
                    <td class="td-ds">{{ c.tematica }}</td>
                    <td class="td-ds text-center">
                      @if (guardadaId() === c.id) {
                        <span class="bg-state-aprobado-soft text-state-aprobado-foreground text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                          Guardada
                        </span>
                      } @else {
                        <span class="text-xs text-muted-foreground">—</span>
                      }
                    </td>
                    @if (isAdmin()) {
                      <td class="td-ds text-center">
                        <button
                          type="button"
                          (click)="$event.stopPropagation(); quitar(c)"
                          class="btn-icon text-destructive hover:text-destructive"
                          title="Quitar de la grilla"
                          aria-label="Quitar configuración de la grilla"
                        >
                          <lucide-angular [img]="Trash2Icon" class="size-4" />
                        </button>
                      </td>
                    }
                  </tr>
                } @empty {
                  <tr>
                    <td [attr.colspan]="isAdmin() ? 7 : 6" class="px-6 py-10 text-center italic text-muted-foreground">
                      No existen configuraciones. Complete los cuatro campos y pulse Agregar.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Footer: continuación del flujo -->
        <div class="px-6 py-4 border-t border-border/60 bg-card flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-2 text-xs text-muted-foreground/70 italic">
            <lucide-angular [img]="InfoIcon" class="size-4" />
            Seleccione un registro de la grilla para continuar.
          </div>
          <!-- Solo se habilita con un registro seleccionado (etapa 1 → 2). -->
          <button
            (click)="seguirAEstructura()"
            [disabled]="!flujo.haySeleccion()"
            class="btn-primary px-6 justify-center"
          >
            Seguir con estructura de formulario
            <lucide-angular [img]="ChevronRightIcon" class="size-4" />
          </button>
        </div>
      </div>
    </section>
  `,
})
export class CamposComponent {
  readonly flujo = inject(ConfiguracionFlujoService);
  private readonly auth = inject(AuthService);
  private readonly modales = inject(ModalService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly ChevronRightIcon = ChevronRight;
  readonly PlusIcon = Plus;
  readonly Trash2Icon = Trash2;
  readonly LayoutGridIcon = LayoutGrid;
  readonly InfoIcon = Info;

  readonly unidadesResponsables = UNIDADES_RESPONSABLES;
  readonly formularios = FORMULARIOS;
  readonly tematicas = TEMATICAS;

  readonly isAdmin = computed(() => this.auth.isAdministrador());
  readonly configuraciones = this.flujo.configuraciones;

  /** Id del registro cuya estructura ya se guardó (para el badge de la grilla). */
  readonly guardadaId = computed(() =>
    this.flujo.estructuraGuardada() ? this.flujo.seleccionId() : null,
  );

  readonly unidadResponsableSel = signal('');
  readonly unidadFuncionalSel = signal('');
  readonly formularioSel = signal<FormularioKey | ''>('');
  readonly tematicaSel = signal('');

  /** Unidades funcionales de la unidad responsable elegida (cascada). */
  readonly unidadesFuncionales = computed(() =>
    this.unidadResponsableSel() ? unidadesFuncionalesDe(this.unidadResponsableSel()) : [],
  );

  readonly puedeAgregar = computed(
    () =>
      !!this.unidadResponsableSel() &&
      !!this.unidadFuncionalSel() &&
      !!this.formularioSel() &&
      !!this.tematicaSel(),
  );

  /**
   * Al cambiar la unidad responsable se reinicia la funcional dependiente.
   * No se preselecciona ninguna opción —ni siquiera cuando solo hay una—
   * para que el control siempre refleje una elección explícita del usuario.
   */
  onUnidadResponsableChange(valor: string): void {
    this.unidadResponsableSel.set(valor);
    this.unidadFuncionalSel.set('');
  }

  agregar(): void {
    if (!this.puedeAgregar()) return;
    const agregada = this.flujo.agregar(
      this.unidadResponsableSel(),
      this.unidadFuncionalSel(),
      this.formularioSel() as FormularioKey,
      this.tematicaSel(),
    );
    if (agregada) {
      this.toast.success('Configuración agregada a la grilla.');
      return;
    }
    void this.modales.openWarning(
      'Configuración duplicada',
      'Esa combinación de unidad responsable, unidad funcional, formulario y temática ya existe en la grilla.',
      { soloAceptar: true },
    );
  }

  async quitar(c: RegistroConfiguracion): Promise<void> {
    const ok = await this.modales.openConfirm(
      'Quitar configuración',
      `¿Desea quitar «${c.unidadResponsable} — ${this.flujo.labelFormulario(c.formulario)}» de la grilla? Los campos y reglas ya configurados no se eliminan.`,
    );
    if (ok) this.flujo.quitar(c.id);
  }

  seguirAEstructura(): void {
    if (!this.flujo.haySeleccion()) return;
    void this.router.navigate(['/configuracion/estructura-formulario']);
  }
}
