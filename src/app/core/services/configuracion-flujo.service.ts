import { Injectable, computed, signal } from '@angular/core';
import { FORMULARIOS } from '../constants/campos-base.const';
import { TEMATICAS } from '../constants/catalogos.const';
import {
  UNIDADES_RESPONSABLES,
  UNIDADES_FUNCIONALES_POR_UNIDAD_RESPONSABLE,
} from '../constants/sodega.const';
import { FormularioKey } from '../models/campo.model';
import { normalizarNombreCatalogo } from '../../shared/utils/texto.util';

/** Valor mostrado cuando la unidad responsable no tiene unidades funcionales. */
export const UNIDAD_FUNCIONAL_NO_APLICA = 'No aplica';

/**
 * ¿El valor elegido en un selector del alta es utilizable?
 *
 * Rechaza el vacío (nada seleccionado) y "No aplica": ese marcador señala que
 * la dimensión no existe para la unidad elegida, así que una configuración que
 * lo incluya no identifica un registro real y no puede entrar a la grilla.
 * La comparación es tolerante a tildes, mayúsculas y espacios.
 */
export function esSeleccionValida(valor: string | null | undefined): boolean {
  const texto = (valor ?? '').trim();
  if (!texto) return false;
  return normalizarNombreCatalogo(texto) !== normalizarNombreCatalogo(UNIDAD_FUNCIONAL_NO_APLICA);
}

/** Resultado del alta en la grilla, para que la vista elija el aviso. */
export type ResultadoAlta = 'ok' | 'duplicada' | 'invalida';

/**
 * Registro que se está configurando en el flujo de tres etapas.
 *
 * Lo identifican las cuatro dimensiones del formulario SODEGA: unidad
 * responsable, unidad funcional, formulario y temática. Todas provienen de
 * catálogos ya existentes (`UNIDADES_RESPONSABLES`,
 * `UNIDADES_FUNCIONALES_POR_UNIDAD_RESPONSABLE`, `FORMULARIOS`, `TEMATICAS`).
 */
export interface RegistroConfiguracion {
  /** Concatenación de las 4 dimensiones — determinista, sin contadores. */
  id: string;
  unidadResponsable: string;
  unidadFuncional: string;
  formulario: FormularioKey;
  tematica: string;
}

const STORAGE_KEY = 'sodega.configuracion.flujo';

interface EstadoPersistido {
  configuraciones: RegistroConfiguracion[];
  seleccionId: string | null;
  guardadas: string[];
}

export function idRegistro(
  unidadResponsable: string,
  unidadFuncional: string,
  formulario: FormularioKey,
  tematica: string,
): string {
  return [unidadResponsable, unidadFuncional, formulario, tematica].join('::');
}

/**
 * Unidades funcionales de una unidad responsable.
 * Las unidades responsables sin unidades propias devuelven "No aplica",
 * igual que el formulario de referencia.
 */
export function unidadesFuncionalesDe(unidadResponsable: string): string[] {
  const propias = UNIDADES_FUNCIONALES_POR_UNIDAD_RESPONSABLE[unidadResponsable];
  return propias?.length ? propias : [UNIDAD_FUNCIONAL_NO_APLICA];
}

/**
 * Estado compartido de las tres etapas de Configuración:
 * campos (selección) → estructura de formulario → reglas.
 *
 * Persiste en `sessionStorage` con la misma convención que `AuthService`
 * (`sodega.*`) y `AreaService`, para no añadir una segunda arquitectura de
 * almacenamiento. Solo guarda la *selección* del flujo: los campos y las
 * reglas siguen viviendo en `CamposService` y `ReglasService`.
 */
@Injectable({ providedIn: 'root' })
export class ConfiguracionFlujoService {
  private readonly _configuraciones = signal<RegistroConfiguracion[]>([]);
  private readonly _seleccionId = signal<string | null>(null);
  /** Ids cuya estructura ya pasó por "Guardar" en esta sesión. */
  private readonly _guardadas = signal<Set<string>>(new Set());

  readonly configuraciones = this._configuraciones.asReadonly();
  readonly seleccionId = this._seleccionId.asReadonly();

  /** Registro activo del flujo, o `null` si no hay ninguno seleccionado. */
  readonly registro = computed<RegistroConfiguracion | null>(
    () => this._configuraciones().find((c) => c.id === this._seleccionId()) ?? null,
  );

  readonly haySeleccion = computed(() => this.registro() !== null);

  /** `true` cuando el registro activo ya ejecutó Guardar en la etapa 2. */
  readonly estructuraGuardada = computed(() => {
    const r = this.registro();
    return r ? this._guardadas().has(r.id) : false;
  });

  constructor() {
    this.restaurar();
  }

  /** Etiqueta legible del formulario (reutiliza el catálogo existente). */
  labelFormulario(formulario: FormularioKey): string {
    return FORMULARIOS.find((f) => f.key === formulario)?.label ?? formulario;
  }

  /**
   * Añade una configuración a la grilla.
   *
   * Revalida las cuatro dimensiones aquí —no solo en la vista— para que una
   * llamada directa al método tampoco pueda meter en la grilla un registro
   * incompleto o con "No aplica". Devuelve el motivo para que la vista muestre
   * el aviso con el sistema de modales existente.
   */
  agregar(
    unidadResponsable: string,
    unidadFuncional: string,
    formulario: FormularioKey,
    tematica: string,
  ): ResultadoAlta {
    const valores = [unidadResponsable, unidadFuncional, formulario, tematica];
    if (!valores.every(esSeleccionValida)) return 'invalida';
    if (!esSeleccionValida(this.labelFormulario(formulario))) return 'invalida';

    const id = idRegistro(unidadResponsable, unidadFuncional, formulario, tematica);
    if (this._configuraciones().some((c) => c.id === id)) return 'duplicada';
    this._configuraciones.update((prev) => [
      ...prev,
      { id, unidadResponsable, unidadFuncional, formulario, tematica },
    ]);
    this.persistir();
    return 'ok';
  }

  seleccionar(id: string | null): void {
    this._seleccionId.set(id && this._configuraciones().some((c) => c.id === id) ? id : null);
    this.persistir();
  }

  /**
   * Marca la estructura del registro activo como guardada.
   * Es idempotente: pulsar Guardar sin cambios es una operación válida y
   * habilita igualmente los botones de continuación.
   */
  marcarEstructuraGuardada(): void {
    const r = this.registro();
    if (!r) return;
    this._guardadas.update((prev) => new Set(prev).add(r.id));
    this.persistir();
  }

  /**
   * Guardado explícito de la etapa 1 (botón "Guardar" de `/configuracion/campos`).
   *
   * La grilla y la selección ya se persisten en cada alta para no perder
   * trabajo, así que esto reescribe el mismo estado en el mismo almacén: no
   * añade una segunda fuente de datos, solo da al usuario un punto de guardado
   * confirmable. Devuelve `false` cuando no hay nada que guardar.
   */
  guardarConfiguraciones(): boolean {
    if (this._configuraciones().length === 0) return false;
    this.persistir();
    return true;
  }

  /**
   * Cierra el flujo: limpia solo el estado temporal de navegación
   * (selección activa). Las configuraciones de la grilla y los datos
   * guardados en `CamposService`/`ReglasService` permanecen intactos.
   */
  finalizar(): void {
    this._seleccionId.set(null);
    this.persistir();
  }

  private persistir(): void {
    try {
      const estado: EstadoPersistido = {
        configuraciones: this._configuraciones(),
        seleccionId: this._seleccionId(),
        guardadas: [...this._guardadas()],
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
    } catch {
      /* Sin persistencia disponible: el flujo aplica solo a la vista actual. */
    }
  }

  private restaurar(): void {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const estado = JSON.parse(raw) as Partial<EstadoPersistido>;
      const validas = (estado.configuraciones ?? []).filter(
        (c) =>
          c &&
          typeof c.id === 'string' &&
          UNIDADES_RESPONSABLES.includes(c.unidadResponsable as never) &&
          unidadesFuncionalesDe(c.unidadResponsable).includes(c.unidadFuncional) &&
          FORMULARIOS.some((f) => f.key === c.formulario) &&
          TEMATICAS.includes(c.tematica as never),
      );
      this._configuraciones.set(validas);
      const sel = estado.seleccionId ?? null;
      this._seleccionId.set(sel && validas.some((c) => c.id === sel) ? sel : null);
      this._guardadas.set(
        new Set((estado.guardadas ?? []).filter((id) => validas.some((c) => c.id === id))),
      );
    } catch {
      /* Estado corrupto: se arranca con el flujo vacío. */
    }
  }
}
