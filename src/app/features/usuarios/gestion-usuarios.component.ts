import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  Users, UserCheck, UserX, Infinity as InfinityIcon, Clock, TriangleAlert,
  FileSpreadsheet, UserPlus, Search, EllipsisVertical, UserPen, FilePlus2,
  KeyRound, MapPinned, Workflow,
} from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { ToastService } from '../../core/services/toast.service';
import { UsuarioSodega, esUsuarioPermanente, toTitleCase } from '../../core/models/usuario-sodega.model';
import { ModalComponent } from '../../shared/components/modal/modal.component';

type FiltroKpi = 'TOTAL' | 'HABILITADO' | 'INHABILITADO' | 'PERMANENTE' | 'CRITICOS' | 'VENCIDOS';

/**
 * Gestión Integral de Usuarios (módulo base SODEGA).
 * Administra usuarios, perfiles, vigencias laborales, ámbitos presupuestales y permisos.
 */
@Component({
  selector: 'app-gestion-usuarios',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, ModalComponent],
  template: `
    <section class="p-5 lg:p-6 max-w-[1400px] mx-auto">
      <div class="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
        <div>
          <h1 class="text-xl font-extrabold text-slate-800 uppercase tracking-wide">Gestión Integral de Usuarios</h1>
          <p class="text-xs text-slate-500 mt-0.5">
            Administra usuarios, perfiles, vigencias laborales, ámbitos presupuestales y permisos de acceso del sistema SODEGA.
          </p>
        </div>
        <div class="text-[11px] bg-sky-100 text-sky-800 px-3 py-1 rounded-full font-bold border border-sky-200">
          Año Fiscal: <span class="font-black">2026</span>
        </div>
      </div>

      <!-- PANEL DE 6 TARJETAS KPI -->
      <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
        @for (k of kpiDefs; track k.filtro) {
          <button
            (click)="setFiltro(k.filtro)"
            class="bg-white p-3 rounded-xl flex items-center justify-between shadow-sm border text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
            [class]="filtro() === k.filtro ? 'border-2 border-[#007287] bg-teal-50/40' : 'border-slate-200'"
          >
            <div>
              <p class="text-2xl font-extrabold mb-0.5" [class]="k.numCls">{{ kpis()[k.filtro] }}</p>
              <p class="text-[9px] font-bold uppercase tracking-wide" [class]="k.labelCls">{{ k.label }}</p>
            </div>
            <div class="text-xl w-8 h-8 rounded-lg flex items-center justify-center" [class]="k.iconBg">
              <lucide-angular [img]="k.icon" class="size-4" />
            </div>
          </button>
        }
      </div>

      <!-- BANNER EXCEL -->
      @if (toastExcel()) {
        <div class="mb-4 bg-emerald-50 border border-emerald-300 text-emerald-800 p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div class="flex items-center gap-2">
            <lucide-angular [img]="FileSpreadsheetIcon" class="size-4 text-emerald-600 animate-bounce" />
            <span>{{ toastExcel() }}</span>
          </div>
          <button (click)="toastExcel.set('')" class="text-emerald-900 hover:text-black font-bold text-sm px-1.5 cursor-pointer">×</button>
        </div>
      }

      <!-- Barra de búsqueda y acciones -->
      <div class="flex justify-between items-center mb-4 bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm">
        <div class="flex items-center gap-1.5 text-xs text-slate-700">
          <span class="font-semibold text-slate-500">Buscar:</span>
          <div class="relative">
            <input
              type="text"
              [value]="q()"
              (input)="q.set($any($event.target).value); page.set(1)"
              placeholder="Buscar por DNI, Nombre, Rol..."
              class="border border-slate-200 p-1.5 pl-7 rounded-lg outline-none focus:ring-1 focus:ring-teal-500 w-60 bg-white text-xs font-semibold"
            />
            <lucide-angular [img]="SearchIcon" class="absolute left-2.5 top-2 size-3 text-slate-400" />
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            (click)="exportarExcel()"
            class="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <lucide-angular [img]="FileSpreadsheetIcon" class="size-4 text-emerald-600" />
            <span>Exportar excel</span>
          </button>
          <button
            (click)="nuevoUsuario()"
            class="bg-[#007287] hover:bg-teal-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <lucide-angular [img]="UserPlusIcon" class="size-4 text-emerald-300" />
            <span>Nuevo usuario</span>
          </button>
        </div>
      </div>

      <!-- GRILLA DE DATOS -->
      <div class="border border-slate-200 rounded-xl shadow-sm bg-white overflow-hidden">
        <div class="overflow-x-auto max-w-full">
          <table class="w-full text-left text-[11px] border-collapse min-w-[1300px]">
            <thead class="bg-[#007287] text-white">
              <tr class="divide-x divide-teal-800/40">
                <th class="p-3 text-center w-24 font-bold">Acciones</th>
                <th class="p-3 w-56 font-bold">Empleado</th>
                <th class="p-3 text-center w-28 font-bold">Estado</th>
                <th class="p-3 w-28 font-bold">Usuario</th>
                <th class="p-3 w-24 font-bold">DNI</th>
                <th class="p-3 w-48 font-bold">Perfil</th>
                <th class="p-3 w-64 font-bold">OPAS</th>
                <th class="p-3 w-48 font-bold">Vigencia</th>
                <th class="p-3 w-28 font-bold">Vencimiento</th>
                <th class="p-3 w-64 font-bold">Prog. presupuestal</th>
                <th class="p-3 w-24 font-bold">Ubigeo</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @if (pageRows().length === 0) {
                <tr>
                  <td colspan="11" class="p-8 text-center text-slate-400 font-bold">
                    No se encontraron registros de usuarios con los criterios establecidos.
                  </td>
                </tr>
              }
              @for (u of pageRows(); track u.id) {
                <tr class="hover:bg-slate-50/80 transition-colors divide-x divide-slate-100 text-slate-700 font-bold">
                  <td class="p-3 text-center relative">
                    <button
                      (click)="toggleDropdown($event, u.id)"
                      class="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-950 rounded-lg transition-all text-xs focus:ring-1 focus:ring-teal-500 font-bold"
                    >
                      <lucide-angular [img]="EllipsisIcon" class="size-3.5" />
                    </button>
                    @if (dropdownDe() === u.id) {
                      <div class="fixed inset-0 z-40" (click)="dropdownDe.set(null)"></div>
                      <div class="absolute left-3 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-50 text-left overflow-hidden">
                        <button (click)="accion('EDITAR', u)" class="w-full px-3 py-2 text-[10px] text-slate-700 hover:bg-teal-50 hover:text-[#007287] font-bold flex items-center gap-2 border-b border-slate-100 transition">
                          <lucide-angular [img]="UserPenIcon" class="size-3.5 text-slate-400" /> Editar Datos
                        </button>
                        <button (click)="accion('PRESUPUESTO', u)" class="w-full px-3 py-2 text-[10px] text-slate-700 hover:bg-teal-50 hover:text-[#007287] font-bold flex items-center gap-2 border-b border-slate-100 transition">
                          <lucide-angular [img]="FilePlus2Icon" class="size-3.5 text-slate-400" /> Agregar nueva Presup.
                        </button>
                        <button (click)="accion('CLAVE', u)" class="w-full px-3 py-2 text-[10px] text-slate-700 hover:bg-teal-50 hover:text-[#007287] font-bold flex items-center gap-2 border-b border-slate-100 transition">
                          <lucide-angular [img]="KeyRoundIcon" class="size-3.5 text-slate-400" /> Restablecer clave
                        </button>
                        <button (click)="accion('REASIGNAR', u)" class="w-full px-3 py-2 text-[10px] text-slate-700 hover:bg-teal-50 hover:text-[#007287] font-bold flex items-center gap-2 border-b border-slate-100 transition">
                          <lucide-angular [img]="MapPinnedIcon" class="size-3.5 text-slate-400" /> Reasignar OPA
                        </button>
                        <button (click)="accion('ESTADO', u)" class="w-full px-3 py-2 text-[10px] text-slate-700 hover:bg-teal-50 hover:text-[#007287] font-bold flex items-center gap-2 transition">
                          <lucide-angular [img]="WorkflowIcon" class="size-3.5 text-slate-400" /> Cambiar Estado
                        </button>
                      </div>
                    }
                  </td>
                  <td class="p-3 text-slate-900 font-bold">{{ nombreFila(u) }}</td>
                  <td class="p-3 text-center">
                    <span
                      class="px-2 py-0.5 rounded-full text-[9px] font-black border"
                      [class]="u.estado === 'HABILITADO' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'"
                    >{{ u.estado }}</span>
                  </td>
                  <td class="p-3 text-slate-500 font-medium">{{ u.userGen }}</td>
                  <td class="p-3 font-mono font-bold">{{ u.dni }}</td>
                  <td class="p-3 text-slate-800 font-bold">{{ u.perfil }}</td>
                  <td class="p-3 text-slate-700 font-bold">{{ opasDe(u) }}</td>
                  <td class="p-3"><span [class]="vigenciaCls(u)">{{ u.vigenciaCalculada }}</span></td>
                  <td class="p-3 font-mono font-bold"><span [class]="vencimientoCls(u)">{{ vencimientoDe(u) }}</span></td>
                  <td class="p-3 text-slate-500 truncate max-w-[150px] font-bold" [title]="progPresupDe(u)">{{ progPresupDe(u) }}</td>
                  <td class="p-3 font-mono font-bold">{{ u.ubigeo }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Paginación -->
      <div class="flex justify-between items-center mt-3 text-[10px] text-slate-500 font-bold">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm">
            <span class="font-bold text-slate-500">Mostrar:</span>
            <select
              [value]="pageSize()"
              (change)="pageSize.set(+$any($event.target).value); page.set(1)"
              class="bg-transparent text-[10px] font-extrabold text-[#007287] outline-none cursor-pointer"
            >
              @for (n of [5, 10, 20, 50]; track n) {
                <option [value]="n">{{ n }}</option>
              }
            </select>
          </div>
          <p>Mostrando registros del {{ rangoDesde() }} al {{ rangoHasta() }} de un total de {{ filtered().length }}</p>
        </div>
        <div class="flex gap-1 border border-slate-300 rounded-lg overflow-hidden font-bold">
          <button
            (click)="page.set(page() - 1)"
            [disabled]="page() === 1"
            class="px-3 py-1.5"
            [class]="page() === 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'"
          >Anterior</button>
          @for (p of paginas(); track p) {
            <button
              (click)="page.set(p)"
              class="px-3 py-1.5 border-x"
              [class]="page() === p ? 'bg-[#007287] text-white font-bold' : 'bg-white text-slate-600 hover:bg-slate-50'"
            >{{ p }}</button>
          }
          <button
            (click)="page.set(page() + 1)"
            [disabled]="page() === totalPages()"
            class="px-3 py-1.5"
            [class]="page() === totalPages() ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'"
          >Siguiente</button>
        </div>
      </div>

      <!-- Modal alerta (equivalente a la alerta personalizada del prototipo) -->
      @if (alerta(); as a) {
        <app-modal [title]="a.titulo" maxWidth="max-w-md" (closed)="alerta.set(null)">
          <p class="text-xs text-slate-600 leading-relaxed font-semibold">{{ a.mensaje }}</p>
          <div class="flex justify-center mt-5">
            <button
              (click)="alerta.set(null)"
              class="px-6 py-2.5 bg-[#007287] hover:bg-teal-800 text-white font-bold rounded-xl text-xs transition min-w-[120px]"
            >Aceptar</button>
          </div>
        </app-modal>
      }
    </section>
  `,
})
export class GestionUsuariosComponent {
  private readonly auth = inject(AuthService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly FileSpreadsheetIcon = FileSpreadsheet;
  readonly UserPlusIcon = UserPlus;
  readonly SearchIcon = Search;
  readonly EllipsisIcon = EllipsisVertical;
  readonly UserPenIcon = UserPen;
  readonly FilePlus2Icon = FilePlus2;
  readonly KeyRoundIcon = KeyRound;
  readonly MapPinnedIcon = MapPinned;
  readonly WorkflowIcon = Workflow;

  readonly kpiDefs = [
    { filtro: 'TOTAL' as FiltroKpi, label: 'Total usuarios', icon: Users, numCls: 'text-slate-800', labelCls: 'text-[#007287]', iconBg: 'bg-slate-50 text-[#007287]' },
    { filtro: 'HABILITADO' as FiltroKpi, label: 'Habilitados', icon: UserCheck, numCls: 'text-slate-800', labelCls: 'text-emerald-600', iconBg: 'bg-emerald-50 text-emerald-500' },
    { filtro: 'INHABILITADO' as FiltroKpi, label: 'Inhabilitados', icon: UserX, numCls: 'text-slate-800', labelCls: 'text-red-600', iconBg: 'bg-red-50 text-red-500' },
    { filtro: 'PERMANENTE' as FiltroKpi, label: 'Permanente', icon: InfinityIcon, numCls: 'text-emerald-600', labelCls: 'text-emerald-600', iconBg: 'bg-emerald-50 text-emerald-500' },
    { filtro: 'CRITICOS' as FiltroKpi, label: 'Por vencer (30 días)', icon: Clock, numCls: 'text-amber-600', labelCls: 'text-amber-600', iconBg: 'bg-amber-50 text-amber-500' },
    { filtro: 'VENCIDOS' as FiltroKpi, label: 'Vencidos', icon: TriangleAlert, numCls: 'text-red-700', labelCls: 'text-red-700', iconBg: 'bg-red-50 text-red-600 animate-pulse' },
  ];

  readonly filtro = signal<FiltroKpi>('TOTAL');
  readonly q = signal('');
  readonly page = signal(1);
  readonly pageSize = signal(5);
  readonly dropdownDe = signal<string | null>(null);
  readonly toastExcel = signal('');
  readonly alerta = signal<{ titulo: string; mensaje: string } | null>(null);

  /** Registros visibles según los privilegios del perfil activo. */
  private readonly visibles = computed(() => {
    const s = this.auth.session();
    if (!s) return [];
    // Dependencia reactiva del listado global
    this.usuariosService.usuarios();
    return this.usuariosService.registrosVisibles(s.perfil, s.userGen);
  });

  readonly kpis = computed<Record<FiltroKpi, number>>(() => {
    const lista = this.visibles();
    return {
      TOTAL: lista.length,
      HABILITADO: lista.filter((u) => u.estado === 'HABILITADO').length,
      INHABILITADO: lista.filter((u) => u.estado === 'INHABILITADO').length,
      PERMANENTE: lista.filter((u) => esUsuarioPermanente(u)).length,
      CRITICOS: lista.filter((u) => !esUsuarioPermanente(u) && (u.diasRestantes ?? -1) >= 0 && (u.diasRestantes ?? 99) <= 30).length,
      VENCIDOS: lista.filter((u) => !esUsuarioPermanente(u) && (u.diasRestantes ?? 0) < 0).length,
    };
  });

  readonly filtered = computed(() => {
    let list = this.visibles();
    const f = this.filtro();
    if (f === 'HABILITADO') list = list.filter((u) => u.estado === 'HABILITADO');
    else if (f === 'INHABILITADO') list = list.filter((u) => u.estado === 'INHABILITADO');
    else if (f === 'PERMANENTE') list = list.filter((u) => esUsuarioPermanente(u));
    else if (f === 'CRITICOS') list = list.filter((u) => !esUsuarioPermanente(u) && (u.diasRestantes ?? -1) >= 0 && (u.diasRestantes ?? 99) <= 30);
    else if (f === 'VENCIDOS') list = list.filter((u) => !esUsuarioPermanente(u) && (u.diasRestantes ?? 0) < 0);

    const texto = this.q().toLowerCase().trim();
    if (texto) {
      list = list.filter(
        (u) =>
          u.nombres.toLowerCase().includes(texto) ||
          u.apePat.toLowerCase().includes(texto) ||
          u.apeMat.toLowerCase().includes(texto) ||
          u.dni.includes(texto) ||
          u.perfil.toLowerCase().includes(texto) ||
          u.regimen.toLowerCase().includes(texto) ||
          u.unidad.toLowerCase().includes(texto),
      );
    }
    return list;
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize())));
  readonly paginas = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  readonly pageRows = computed(() => {
    const p = Math.min(this.page(), this.totalPages());
    const size = this.pageSize();
    return this.filtered().slice((p - 1) * size, p * size);
  });
  readonly rangoDesde = computed(() =>
    this.filtered().length === 0 ? 0 : (Math.min(this.page(), this.totalPages()) - 1) * this.pageSize() + 1,
  );
  readonly rangoHasta = computed(() =>
    Math.min(Math.min(this.page(), this.totalPages()) * this.pageSize(), this.filtered().length),
  );

  setFiltro(f: FiltroKpi): void {
    this.filtro.set(f);
    this.page.set(1);
  }

  toggleDropdown(e: Event, id: string): void {
    e.stopPropagation();
    this.dropdownDe.update((actual) => (actual === id ? null : id));
  }

  /* ===== Formato de fila (idéntico al prototipo) ===== */
  nombreFila(u: UsuarioSodega): string {
    return toTitleCase(`${u.apePat} ${u.apeMat}, ${u.nombres}`);
  }

  opasDe(u: UsuarioSodega): string {
    const conOpas = [
      'Jefe de Área',
      'Administrador Unidad Organizacional',
      'Administrador DZ_Cap_Asit.',
      'Técnico Capacitación y Asistencia Técnica',
    ];
    return conOpas.includes(u.perfil) ? u.unidadFuncional || '-' : '-';
  }

  progPresupDe(u: UsuarioSodega): string {
    if (u.perfil === 'Administrador General' || u.perfil === 'Jefe de Área') return '-';
    return u.programaPresup || u.unidad || '-';
  }

  vencimientoDe(u: UsuarioSodega): string {
    if ((u.regimen === 'Locador de Servicio (OS)' || u.regimen === 'Régimen CAS Temporal') && u.fechaFin) {
      const parts = u.fechaFin.split('-');
      return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : u.fechaFin;
    }
    return 'Permanente';
  }

  vigenciaCls(u: UsuarioSodega): string {
    return this.badgeVigencia(u, false);
  }

  vencimientoCls(u: UsuarioSodega): string {
    return this.badgeVigencia(u, true);
  }

  private badgeVigencia(u: UsuarioSodega, inline: boolean): string {
    const sufijo = inline ? ' inline-block' : '';
    if (esUsuarioPermanente(u)) {
      return 'text-emerald-700 font-extrabold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200' + sufijo;
    }
    const d = u.diasRestantes ?? 0;
    if (d < 0) return 'text-white font-black bg-red-700 px-2 py-1 rounded-lg border border-red-800 animate-pulse' + sufijo;
    if (d === 0) return 'text-amber-950 font-black bg-amber-300 px-2 py-1 rounded-lg border border-amber-500 animate-pulse' + sufijo;
    if (d <= 30) return 'text-amber-800 font-black bg-amber-100 px-2 py-1 rounded-lg border border-amber-300' + sufijo;
    return 'text-sky-800 font-extrabold bg-sky-50 px-2 py-1 rounded-lg border border-sky-200' + sufijo;
  }

  /* ===== Acciones ===== */
  nuevoUsuario(): void {
    this.router.navigate(['/usuarios/nuevo']);
  }

  accion(tipo: 'EDITAR' | 'PRESUPUESTO' | 'CLAVE' | 'REASIGNAR' | 'ESTADO', u: UsuarioSodega): void {
    this.dropdownDe.set(null);
    switch (tipo) {
      case 'EDITAR':
        this.router.navigate(['/usuarios', u.id], { queryParams: { modo: 'editar' } });
        break;
      case 'PRESUPUESTO':
        this.router.navigate(['/usuarios', u.id], { queryParams: { modo: 'presupuesto' } });
        break;
      case 'CLAVE': {
        // TODO(backend): POST /usuarios/{id}/restablecer-clave
        const clave = this.usuariosService.restablecerClave();
        this.alerta.set({
          titulo: 'Restablecer clave',
          mensaje: `Se ha generado una clave temporal de seguridad para el usuario unificado '${u.userGen}'. Clave Provisional: ${clave}`,
        });
        break;
      }
      case 'REASIGNAR':
        this.alerta.set({
          titulo: 'Reasignar Jurisdicción',
          mensaje: `Simulación de transferencia de ámbito regional. El usuario '${u.userGen}' será trasladado de la OPA '${u.opa}' hacia una nueva zona.`,
        });
        break;
      case 'ESTADO': {
        const actualizado = this.usuariosService.toggleEstado(u.id);
        this.alerta.set({
          titulo: 'Estado Modificado',
          mensaje: `El estado de la cuenta del servidor ${u.nombres} ${u.apePat} ahora es: ${actualizado?.estado}`,
        });
        break;
      }
    }
  }

  /** Exportación simulada (mensajes progresivos del prototipo). */
  exportarExcel(): void {
    // TODO(backend): GET /usuarios/reporte-excel
    this.toastExcel.set('Generando libro unificado de datos SODEGA (Procesando registros)...');
    setTimeout(() => {
      this.toastExcel.set('Consolidando Ámbitos Territoriales de las OPAs... 45%');
      setTimeout(() => {
        this.toastExcel.set('¡Libro unificado de Reporte SODEGA_2026.xlsx exportado con éxito!');
      }, 1000);
    }, 1000);
  }
}
