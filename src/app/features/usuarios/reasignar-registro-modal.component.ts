import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { LucideAngularModule, Search, TriangleAlert, UserCheck } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { CursosService } from '../../core/services/cursos.service';
import { UsuarioSodega, toTitleCase } from '../../core/models/usuario-sodega.model';
import { Curso } from '../../core/models/curso.model';
import { normalizarNombreCatalogo } from '../../shared/utils/texto.util';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ModalService } from '../../core/services/modal.service';
import { EstadoBadgeComponent } from '../../shared/components/estado-badge/estado-badge.component';

/** Resultado emitido al completar la transferencia de registros. */
export interface ResultadoReasignacion {
  destino: UsuarioSodega;
  capacitaciones: number;
  asistencias: number;
}

/**
 * Modal "Reasignar Registro": transfiere todas las Capacitaciones y
 * Asistencias Técnicas de un técnico (registro de origen) hacia otro
 * técnico activo, conservando el historial institucional completo.
 */
@Component({
  selector: 'app-reasignar-registro-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, ModalComponent, EstadoBadgeComponent],
  template: `
    <app-modal title="Reasignar registros" maxWidth="max-w-5xl" (closed)="closed.emit()">
        <div class="space-y-4">
          <!-- Encabezado: registro de origen (solo lectura) + botón que carga sus registros -->
          <div class="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 md:items-center">
            <p class="md:col-span-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Registro de origen
            </p>
            <div class="md:col-span-6">
              <input
                type="text"
                readonly
                tabindex="-1"
                [value]="etiquetaOrigen()"
                aria-label="Registro de origen (solo lectura)"
                class="w-full px-4 py-2 bg-secondary/60 ring-1 ring-border rounded-lg text-sm font-semibold text-foreground cursor-default focus:outline-none"
              />
            </div>
            <div class="md:col-span-3">
              <button
                type="button"
                (click)="buscarRegistrosOrigen()"
                [disabled]="!origen()"
                aria-label="Buscar registros del personal de origen"
                class="btn-primary w-full"
              >
                <span>Buscar Registros</span>
                <lucide-angular [img]="SearchIcon" class="size-4" />
              </button>
            </div>
          </div>

          <!-- Sección 1: grilla de registros del personal de origen -->
          <div class="rounded-xl ring-1 ring-border overflow-hidden">
            <div class="overflow-auto max-h-[23vh] thin-scroll">
              <table class="w-full text-left min-w-[760px]" aria-label="Registros del personal de origen">
                <thead class="bg-secondary sticky top-0 z-10">
                  <tr class="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                    <th class="px-4 py-3 w-24">DNI</th>
                    <th class="px-4 py-3">Apellidos y Nombres</th>
                    <th class="px-4 py-3">Profesión - Especialidad</th>
                    <th class="px-4 py-3">Temática</th>
                    <th class="px-4 py-3 w-36">Tipo</th>
                    <th class="px-4 py-3 w-32 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border">
                  @if (!busquedaOrigenEjecutada()) {
                    <tr>
                      <td colspan="6" class="px-4 py-6 text-center text-sm text-muted-foreground italic">
                        Pulse "Buscar Registros" para cargar las Capacitaciones y Asistencias Técnicas del personal de origen.
                      </td>
                    </tr>
                  } @else if (registrosOrigen().length === 0) {
                    <tr>
                      <td colspan="6" class="px-4 py-6 text-center text-sm text-muted-foreground italic">
                        El trabajador de origen no tiene Capacitaciones ni Asistencias Técnicas registradas.
                      </td>
                    </tr>
                  }
                  @for (r of registrosOrigenVisibles(); track r.id) {
                    <tr class="hover:bg-secondary/40 transition-colors">
                      <td class="px-4 py-3 text-sm font-mono tabular-nums text-foreground/80">{{ origen().dni }}</td>
                      <td class="px-4 py-3 text-sm font-semibold text-foreground">{{ nombreDe(origen()) }}</td>
                      <td class="px-4 py-3 text-sm text-muted-foreground">{{ origen().profesion }}</td>
                      <td class="px-4 py-3 text-sm text-foreground/80">{{ tematicaDe(r) }}</td>
                      <td class="px-4 py-3 text-sm text-muted-foreground">{{ tipoDe(r) }}</td>
                      <td class="px-4 py-3 text-center"><app-estado-badge [estado]="r.estado" /></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
          <p class="text-xs text-muted-foreground">
            Registros encontrados del personal de origen:
            <span class="font-bold text-foreground tabular-nums">{{ registrosOrigenVisibles().length }}</span>
          </p>

          <!-- Sección 2: trabajador asignado (autocomplete sobre los candidatos habilitados) -->
          <div class="flex items-center gap-2 border-b border-border pb-2 text-brand">
            <lucide-angular [img]="UserCheckIcon" class="size-4" />
            <div>
              <h3 class="text-[11px] font-semibold uppercase tracking-wider">Trabajador asignado (Personal que tomará el cargo)</h3>
              <p class="text-xs text-muted-foreground normal-case tracking-normal font-normal">
                Persona que asumirá todos los registros del técnico seleccionado.
              </p>
            </div>
          </div>

          <!-- Selector directo de candidatos habilitados (sin buscador manual) -->
          <select
            aria-label="Seleccionar trabajador asignado"
            [value]="seleccionadoDni() ?? ''"
            [disabled]="candidatos().length === 0"
            (change)="onDestinoChange($any($event.target).value)"
            class="w-full bg-background ring-1 ring-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none transition-colors disabled:bg-muted/40 disabled:text-muted-foreground disabled:cursor-not-allowed"
          >
            @if (candidatos().length === 0) {
              <option value="">No existen técnicos habilitados para recibir registros en esta Unidad.</option>
            } @else {
              <option value="">-- Seleccionar usuario --</option>
              @for (c of candidatos(); track c.dni) {
                <option [value]="c.dni">{{ nombreDe(c) }} — DNI {{ c.dni }}</option>
              }
            }
          </select>

          <!-- Sección 3: grilla de registros del personal asignado -->
          <div class="rounded-xl ring-1 ring-border overflow-hidden">
            <div class="overflow-auto max-h-[23vh] thin-scroll">
              <table class="w-full text-left min-w-[760px]" aria-label="Registros del personal asignado">
                <thead class="bg-secondary sticky top-0 z-10">
                  <tr class="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                    <th class="px-4 py-3 w-24">DNI</th>
                    <th class="px-4 py-3">Apellidos y Nombres</th>
                    <th class="px-4 py-3">Profesión - Especialidad</th>
                    <th class="px-4 py-3">Temática</th>
                    <th class="px-4 py-3 w-36">Tipo</th>
                    <th class="px-4 py-3 w-32 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border">
                  @if (!seleccionado()) {
                    <tr>
                      <td colspan="6" class="px-4 py-6 text-center text-sm text-muted-foreground italic">
                        Busque y seleccione al trabajador asignado para visualizar sus registros.
                      </td>
                    </tr>
                  } @else if (registrosDestino().length === 0) {
                    <tr>
                      <td colspan="6" class="px-4 py-6 text-center text-sm text-muted-foreground italic">
                        El trabajador asignado aún no tiene Capacitaciones ni Asistencias Técnicas registradas.
                      </td>
                    </tr>
                  }
                  @for (r of registrosDestino(); track r.id) {
                    <tr class="hover:bg-secondary/40 transition-colors">
                      <td class="px-4 py-3 text-sm font-mono tabular-nums text-foreground/80">{{ seleccionado()?.dni }}</td>
                      <td class="px-4 py-3 text-sm font-semibold text-foreground">{{ nombreDe(seleccionado()!) }}</td>
                      <td class="px-4 py-3 text-sm text-muted-foreground">{{ seleccionado()?.profesion }}</td>
                      <td class="px-4 py-3 text-sm text-foreground/80">{{ tematicaDe(r) }}</td>
                      <td class="px-4 py-3 text-sm text-muted-foreground">{{ tipoDe(r) }}</td>
                      <td class="px-4 py-3 text-center"><app-estado-badge [estado]="r.estado" /></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
          <p class="text-xs text-muted-foreground">
            Registros encontrados del personal asignado:
            <span class="font-bold text-foreground tabular-nums">{{ registrosDestino().length }}</span>
          </p>

          @if (error()) {
            <p class="text-xs text-destructive font-medium flex items-center gap-1.5" role="alert">
              <lucide-angular [img]="AlertIcon" class="size-3.5" /> {{ error() }}
            </p>
          }

          <div class="flex justify-end gap-2 pt-1">
            <button (click)="closed.emit()" class="btn-secondary">Cancelar</button>
            <button (click)="solicitarConfirmacion()" class="btn-primary px-5">Reasignar</button>
          </div>
        </div>
    </app-modal>
  `,
})
export class ReasignarRegistroModalComponent {
  private readonly auth = inject(AuthService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly cursosService = inject(CursosService);
  private readonly modales = inject(ModalService);

  /** Registro de origen seleccionado en la grilla de usuarios. */
  readonly origen = input.required<UsuarioSodega>();
  readonly closed = output<void>();
  readonly reasignado = output<ResultadoReasignacion>();

  readonly SearchIcon = Search;
  readonly AlertIcon = TriangleAlert;
  readonly UserCheckIcon = UserCheck;

  readonly seleccionadoDni = signal<string | null>(null);
  readonly error = signal('');
  /** La grilla de origen se puebla al pulsar "Buscar Registros". */
  readonly busquedaOrigenEjecutada = signal(false);

  private static readonly PERFIL_RECEPTOR = 'Técnico Capacitación y Asistencia Técnica';

  /**
   * Trabajadores habilitados para recibir la reasignación: técnicos ACTIVOS
   * visibles según los privilegios del perfil en sesión, excluyendo al
   * trabajador de origen (una fila por trabajador aunque tenga varias partidas).
   */
  readonly candidatos = computed<UsuarioSodega[]>(() => {
    const s = this.auth.session();
    if (!s) return [];
    this.usuariosService.usuarios(); // dependencia reactiva del listado global
    const origen = this.origen();
    const unicos = new Map<string, UsuarioSodega>();
    for (const u of this.usuariosService.registrosVisibles(s.perfil, s.userGen, s.perfilAutenticado)) {
      if (u.estado !== 'HABILITADO') continue;
      if (u.perfil !== ReasignarRegistroModalComponent.PERFIL_RECEPTOR) continue;
      if (u.dni === origen.dni) continue;
      // Solo técnicos de la misma Unidad Responsable y Unidad Funcional del origen.
      if (normalizarNombreCatalogo(u.unidad) !== normalizarNombreCatalogo(origen.unidad)) continue;
      if (normalizarNombreCatalogo(u.unidadFuncional) !== normalizarNombreCatalogo(origen.unidadFuncional)) continue;
      if (!unicos.has(u.dni)) unicos.set(u.dni, u);
    }
    return [...unicos.values()];
  });

  readonly seleccionado = computed(
    () => this.candidatos().find((c) => c.dni === this.seleccionadoDni()) ?? null,
  );

  readonly etiquetaOrigen = computed(() => this.etiquetaDe(this.origen()));

  readonly etiquetaDestino = computed(() => {
    const d = this.seleccionado();
    return d ? this.etiquetaDe(d) : '';
  });

  private etiquetaDe(u: UsuarioSodega): string {
    return `${u.dni} - ${this.nombreCompletoDe(u)}`;
  }

  private nombreCompletoDe(u: UsuarioSodega): string {
    return toTitleCase(`${u.nombres} ${u.apePat} ${u.apeMat}`);
  }

  nombreDe(u: UsuarioSodega): string {
    return toTitleCase(`${u.apePat} ${u.apeMat}, ${u.nombres}`);
  }

  /* ===== Registros (cursos) por trabajador: mismas reglas de coincidencia
     por responsable que usa CursosService.reasignarResponsable(). ===== */

  /** Normalización idéntica a la de la transferencia (mayúsculas/tildes/espacios). */
  private normalizarNombre(nombre: string): string {
    return nombre
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, ' ');
  }

  private registrosDe(u: UsuarioSodega | null): Curso[] {
    if (!u) return [];
    const clave = this.normalizarNombre(this.nombreCompletoDe(u));
    return this.cursosService.cursos().filter((c) => this.normalizarNombre(c.extensionista) === clave);
  }

  /** Capacitaciones y Asistencias Técnicas a cargo del trabajador de origen. */
  readonly registrosOrigen = computed(() => this.registrosDe(this.origen()));

  /** Filas visibles de la grilla de origen (vacía hasta pulsar "Buscar Registros"). */
  readonly registrosOrigenVisibles = computed(() =>
    this.busquedaOrigenEjecutada() ? this.registrosOrigen() : [],
  );

  /** Registros ya a cargo del trabajador asignado (destino). */
  readonly registrosDestino = computed(() => this.registrosDe(this.seleccionado()));

  tematicaDe(c: Curso): string {
    return c.detalle?.tematica || c.nombreTema;
  }

  tipoDe(c: Curso): string {
    return c.tipo === 'capacitacion' ? 'Capacitación' : 'Asistencia Técnica';
  }

  seleccionar(c: UsuarioSodega): void {
    this.seleccionadoDni.set(c.dni);
    this.error.set('');
  }

  /** Carga la grilla de origen validando que exista el registro de origen. */
  buscarRegistrosOrigen(): void {
    if (!this.origen()) {
      this.error.set('Debe seleccionar un registro de origen antes de buscar sus registros.');
      return;
    }
    this.error.set('');
    this.busquedaOrigenEjecutada.set(true);
  }

  /** Selección directa del trabajador asignado desde el selector. */
  onDestinoChange(dni: string): void {
    if (!dni) {
      this.seleccionadoDni.set(null);
      return;
    }
    const candidato = this.candidatos().find((c) => c.dni === dni);
    if (candidato) this.seleccionar(candidato);
  }

  /** Valida la selección y muestra el diálogo de confirmación. */
  solicitarConfirmacion(): void {
    const destino = this.seleccionado();
    if (!destino) {
      this.error.set('Debe seleccionar al trabajador que asumirá los registros.');
      return;
    }
    if (destino.dni === this.origen().dni) {
      this.error.set('No es posible reasignar los registros al mismo trabajador de origen.');
      return;
    }
    if (destino.estado !== 'HABILITADO') {
      this.error.set('El trabajador seleccionado se encuentra inactivo y no puede recibir registros.');
      return;
    }
    if (destino.perfil !== ReasignarRegistroModalComponent.PERFIL_RECEPTOR) {
      this.error.set('El trabajador seleccionado no tiene permisos para recibir Capacitaciones ni Asistencias Técnicas.');
      return;
    }
    // Confirmación mediante el sistema unificado de modales.
    void this.modales
      .openConfirm(
        'Reasignar registros',
        `Está a punto de transferir todas las Capacitaciones y Asistencias Técnicas de ` +
          `${this.etiquetaOrigen()} hacia ${this.etiquetaDestino()}. Esta acción modificará el ` +
          `responsable de todos los registros asociados. ¿Desea continuar?`,
      )
      .then((ok) => {
        if (ok) this.confirmarReasignacion();
      });
  }

  /** Ejecuta la transferencia completa y notifica al componente padre. */
  confirmarReasignacion(): void {
    const destino = this.seleccionado();
    if (!destino) return;
    const totales = this.cursosService.reasignarResponsable(
      this.nombreCompletoDe(this.origen()),
      this.nombreCompletoDe(destino),
    );
    this.reasignado.emit({ destino, ...totales });
  }
}
