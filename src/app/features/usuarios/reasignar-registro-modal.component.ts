import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { LucideAngularModule, Search, TriangleAlert, UserCheck } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { CursosService } from '../../core/services/cursos.service';
import { UsuarioSodega, toTitleCase } from '../../core/models/usuario-sodega.model';
import { ModalComponent } from '../../shared/components/modal/modal.component';

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
  imports: [ReactiveFormsModule, LucideAngularModule, ModalComponent],
  template: `
    <app-modal title="Reasignar Registro" maxWidth="max-w-3xl" (closed)="closed.emit()">
      @if (paso() === 'seleccion') {
        <div class="space-y-5">
          <!-- Registro de origen (solo lectura) -->
          <div class="bg-secondary/60 rounded-xl ring-1 ring-border p-4">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Registro de origen</p>
            <p class="text-sm font-semibold text-foreground">{{ etiquetaOrigen() }}</p>
          </div>

          <!-- Personal asignado -->
          <div class="flex items-center gap-2 border-b border-border pb-2 text-brand">
            <lucide-angular [img]="UserCheckIcon" class="size-4" />
            <div>
              <h3 class="text-[11px] font-semibold uppercase tracking-wider">Personal asignado</h3>
              <p class="text-xs text-muted-foreground normal-case tracking-normal font-normal">
                Persona que asumirá todos los registros del técnico seleccionado.
              </p>
            </div>
          </div>

          <!-- Buscador de trabajadores (mismo patrón de la grilla de usuarios) -->
          <div class="relative">
            <lucide-angular [img]="SearchIcon" class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              [formControl]="busqueda"
              placeholder="Buscar por DNI, Apellidos, Nombres o Profesión..."
              class="w-full pl-10 pr-4 py-2 bg-card ring-1 ring-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
            />
          </div>

          <!-- Resultados: solo técnicos activos (fila seleccionable) -->
          <div class="rounded-xl ring-1 ring-border overflow-hidden">
            <div class="overflow-auto max-h-[38vh]">
              <table class="w-full text-left min-w-[680px]">
                <thead class="bg-secondary sticky top-0 z-10">
                  <tr class="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                    <th class="px-4 py-3 w-24">DNI</th>
                    <th class="px-4 py-3">Apellidos y Nombres</th>
                    <th class="px-4 py-3">Profesión</th>
                    <th class="px-4 py-3">Especialidad</th>
                    <th class="px-4 py-3 w-28">Celular</th>
                    <th class="px-4 py-3 w-28 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border">
                  @if (resultados().length === 0) {
                    <tr>
                      <td colspan="6" class="px-4 py-6 text-center text-sm text-muted-foreground italic">
                        No se encontraron técnicos activos disponibles para la reasignación.
                      </td>
                    </tr>
                  }
                  @for (c of resultados(); track c.id) {
                    <tr
                      (click)="seleccionar(c)"
                      class="cursor-pointer transition-colors"
                      [class]="seleccionadoDni() === c.dni ? 'bg-brand-soft ring-1 ring-inset ring-brand/30' : 'hover:bg-secondary/40'"
                      [attr.aria-selected]="seleccionadoDni() === c.dni"
                    >
                      <td class="px-4 py-3 text-sm font-mono tabular-nums text-foreground/80">
                        <span class="inline-flex items-center gap-2">
                          <span
                            class="size-3.5 rounded-full ring-2 shrink-0 transition-colors"
                            [class]="seleccionadoDni() === c.dni ? 'bg-brand ring-brand' : 'bg-card ring-border'"
                          ></span>
                          {{ c.dni }}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-sm font-semibold text-foreground">{{ nombreDe(c) }}</td>
                      <td class="px-4 py-3 text-sm text-muted-foreground">{{ profesionDe(c) }}</td>
                      <td class="px-4 py-3 text-sm text-muted-foreground">{{ especialidadDe(c) }}</td>
                      <td class="px-4 py-3 text-sm font-mono tabular-nums text-foreground/80">{{ c.celular || '-' }}</td>
                      <td class="px-4 py-3 text-center">
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 whitespace-nowrap tracking-wide bg-state-aprobado-soft text-state-aprobado-foreground ring-state-aprobado/30">
                          {{ c.estado }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          @if (error()) {
            <p class="text-xs text-destructive font-medium flex items-center gap-1.5">
              <lucide-angular [img]="AlertIcon" class="size-3.5" /> {{ error() }}
            </p>
          }

          <div class="flex justify-end gap-2 pt-1">
            <button (click)="closed.emit()" class="btn-secondary">Cancelar</button>
            <button (click)="solicitarConfirmacion()" class="btn-primary px-5">Guardar</button>
          </div>
        </div>
      } @else {
        <!-- Confirmación previa a la transferencia -->
        <div class="space-y-4">
          <div class="flex items-start gap-3 bg-warning-soft ring-1 ring-warning/40 rounded-xl p-4">
            <lucide-angular [img]="AlertIcon" class="size-5 text-warning-foreground shrink-0 mt-0.5" />
            <p class="text-sm text-foreground leading-relaxed">
              Está a punto de transferir todas las Capacitaciones y Asistencias Técnicas del trabajador
              seleccionado hacia otro técnico activo. Esta acción modificará el responsable de todos los
              registros asociados. ¿Desea continuar?
            </p>
          </div>
          <div class="text-sm text-foreground bg-secondary/60 rounded-xl ring-1 ring-border p-4 space-y-1">
            <p><span class="font-semibold text-muted-foreground">Origen:</span> {{ etiquetaOrigen() }}</p>
            <p><span class="font-semibold text-muted-foreground">Destino:</span> {{ etiquetaDestino() }}</p>
          </div>
          <div class="flex justify-end gap-2">
            <button (click)="paso.set('seleccion')" class="btn-secondary">Volver</button>
            <button (click)="confirmarReasignacion()" class="btn-success px-5">Sí, continuar</button>
          </div>
        </div>
      }
    </app-modal>
  `,
})
export class ReasignarRegistroModalComponent {
  private readonly auth = inject(AuthService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly cursosService = inject(CursosService);

  /** Registro de origen seleccionado en la grilla de usuarios. */
  readonly origen = input.required<UsuarioSodega>();
  readonly closed = output<void>();
  readonly reasignado = output<ResultadoReasignacion>();

  readonly SearchIcon = Search;
  readonly AlertIcon = TriangleAlert;
  readonly UserCheckIcon = UserCheck;

  readonly busqueda = new FormControl('', { nonNullable: true });
  private readonly termino = toSignal(this.busqueda.valueChanges, { initialValue: '' });

  readonly seleccionadoDni = signal<string | null>(null);
  readonly error = signal('');
  readonly paso = signal<'seleccion' | 'confirmacion'>('seleccion');

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
    const unicos = new Map<string, UsuarioSodega>();
    for (const u of this.usuariosService.registrosVisibles(s.perfil, s.userGen)) {
      if (u.estado !== 'HABILITADO') continue;
      if (u.perfil !== ReasignarRegistroModalComponent.PERFIL_RECEPTOR) continue;
      if (u.dni === this.origen().dni) continue;
      if (!unicos.has(u.dni)) unicos.set(u.dni, u);
    }
    return [...unicos.values()];
  });

  readonly resultados = computed(() => {
    const t = this.termino().toLowerCase().trim();
    if (!t) return this.candidatos();
    return this.candidatos().filter(
      (c) =>
        c.dni.includes(t) ||
        `${c.apePat} ${c.apeMat} ${c.nombres}`.toLowerCase().includes(t) ||
        c.profesion.toLowerCase().includes(t) ||
        c.celular.includes(t),
    );
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

  /** El catálogo guarda "Profesión - Especialidad" en un solo campo. */
  profesionDe(u: UsuarioSodega): string {
    return u.profesion.split(' - ')[0]?.trim() || '-';
  }

  especialidadDe(u: UsuarioSodega): string {
    return u.profesion.split(' - ')[1]?.trim() || '-';
  }

  seleccionar(c: UsuarioSodega): void {
    this.seleccionadoDni.set(c.dni);
    this.error.set('');
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
    this.paso.set('confirmacion');
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
