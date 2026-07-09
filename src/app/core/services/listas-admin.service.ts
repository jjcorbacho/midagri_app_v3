import { Injectable, computed, signal } from '@angular/core';
import {
  CatalogoSistema,
  ListaAdmin,
  OpcionLista,
  ResultadoLista,
  crearOpcionLista,
} from '../models/lista-admin.model';
import {
  CATALOGOS_SISTEMA_REGISTRADOS,
  LISTAS_ADMIN_INICIALES,
} from '../constants/listas-admin.const';
import { normalizarNombreCatalogo } from '../../shared/utils/texto.util';

const STORAGE_KEY = 'sodega_listas_admin_db_v1';

/**
 * Administración de Listas (catálogos maestros SODEGA).
 *
 * ⚠ SIMULADO: estado en memoria (Signals) + persistencia en localStorage.
 * Contratos sugeridos para el backend:
 *  - GET    /listas                          (catálogos con sus opciones)
 *  - POST   /listas                          (registrar lista de catálogo del sistema)
 *  - POST   /listas/{nombre}/opciones        (nueva opción)
 *  - PUT    /listas/{nombre}/opciones/{cod}  (editar opción)
 *  - PATCH  /listas/{nombre}/opciones/{cod}/estado (habilitar/deshabilitar)
 */
@Injectable({ providedIn: 'root' })
export class ListasAdminService {
  private readonly _listas = signal<ListaAdmin[]>(this.cargarDesdeBaseLocal());
  private readonly _listaActiva = signal<string>('Unidad Responsable');

  readonly listas = this._listas.asReadonly();
  readonly listaActiva = this._listaActiva.asReadonly();

  /** Lista actualmente seleccionada en la pantalla de administración. */
  readonly activa = computed<ListaAdmin | undefined>(() => {
    const nombre = this._listaActiva();
    return this._listas().find((l) => l.nombre === nombre) ?? this._listas()[0];
  });

  constructor() {
    // Garantiza que la lista activa exista tras restaurar la base local.
    const nombres = this._listas().map((l) => l.nombre);
    if (!nombres.includes(this._listaActiva())) {
      this._listaActiva.set(nombres[0] ?? '');
    }
  }

  /* ===== Consultas ===== */

  listaPorNombre(nombre: string): ListaAdmin | undefined {
    const buscado = normalizarNombreCatalogo(nombre);
    return this._listas().find((l) => normalizarNombreCatalogo(l.nombre) === buscado);
  }

  /**
   * Opciones efectivas para un formulario: el catálogo base del proyecto
   * menos las opciones deshabilitadas, más las opciones activas agregadas
   * desde Administración de Listas (mismo comportamiento que el prototipo).
   */
  opcionesFormulario(nombreLista: string, base: readonly string[]): string[] {
    const lista = this.listaPorNombre(nombreLista);
    if (!lista) return [...base];

    const inactivas = new Set(
      lista.opciones.filter((o) => !o.activo).map((o) => normalizarNombreCatalogo(o.nombre)),
    );
    const resultado = base.filter((texto) => !inactivas.has(normalizarNombreCatalogo(texto)));

    const existentes = new Set(resultado.map(normalizarNombreCatalogo));
    for (const opcion of lista.opciones) {
      if (!opcion.activo) continue;
      const texto = opcion.nombre.trim();
      const clave = normalizarNombreCatalogo(texto);
      if (!texto || existentes.has(clave)) continue;
      resultado.push(texto);
      existentes.add(clave);
    }
    return resultado;
  }

  private catalogoSistemaPorNombre(nombre: string): CatalogoSistema | undefined {
    const buscado = normalizarNombreCatalogo(nombre);
    return CATALOGOS_SISTEMA_REGISTRADOS.find((c) =>
      [c.nombre, ...c.alias].map(normalizarNombreCatalogo).includes(buscado),
    );
  }

  /* ===== Mutaciones ===== */

  seleccionar(nombre: string): void {
    this._listaActiva.set(nombre);
  }

  /**
   * POST /listas — agrega una lista siempre que corresponda a un catálogo
   * registrado del sistema; si ya existe, recarga sus opciones oficiales.
   */
  agregarLista(nombre: string): ResultadoLista {
    const texto = nombre.trim();
    if (!texto) {
      return { ok: false, titulo: 'Lista requerida', mensaje: 'Ingrese el nombre de la lista que desea agregar.' };
    }

    const catalogo = this.catalogoSistemaPorNombre(texto);
    if (!catalogo) {
      return {
        ok: false,
        titulo: 'Lista no registrada',
        mensaje: 'El nombre ingresado no coincide con un campo, formulario u opción registrada en el sistema SODEGA.',
      };
    }

    const existente = this.listaPorNombre(catalogo.nombre);
    if (existente) {
      this._listas.update((listas) =>
        listas.map((l) =>
          l.nombre === existente.nombre
            ? { ...l, opciones: catalogo.opciones.map((o, i) => crearOpcionLista(this.codigoCorrelativo(i), o)) }
            : l,
        ),
      );
      this._listaActiva.set(existente.nombre);
      this.persistir();
      return {
        ok: true,
        titulo: 'Lista encontrada',
        mensaje: `La lista '${existente.nombre}' ya estaba registrada. Se cargaron sus opciones del sistema.`,
      };
    }

    this._listas.update((listas) => [
      ...listas,
      { nombre: catalogo.nombre, opciones: catalogo.opciones.map((o, i) => crearOpcionLista(this.codigoCorrelativo(i), o)) },
    ]);
    this._listaActiva.set(catalogo.nombre);
    this.persistir();
    return {
      ok: true,
      titulo: 'Lista guardada',
      mensaje: `La lista '${catalogo.nombre}' fue agregada correctamente con sus opciones registradas.`,
    };
  }

  /**
   * POST/PUT /listas/{nombre}/opciones — crea o edita una opción de la lista activa.
   * `indice` es la posición original en la lista (null = nueva opción).
   */
  guardarOpcion(codigo: string, nombre: string, indice: number | null): ResultadoLista {
    const lista = this.activa();
    if (!lista) {
      return { ok: false, titulo: 'Lista no seleccionada', mensaje: 'Seleccione una lista antes de agregar una opción.' };
    }

    const cod = codigo.trim().toUpperCase();
    const nom = nombre.trim();
    if (!cod || !nom) {
      return { ok: false, titulo: 'Campos incompletos', mensaje: 'Debe ingresar el código y el nombre de la opción.' };
    }

    const duplicada = lista.opciones.some((opcion, i) => {
      if (indice !== null && i === indice) return false;
      return (
        opcion.codigo.toLowerCase() === cod.toLowerCase() ||
        normalizarNombreCatalogo(opcion.nombre) === normalizarNombreCatalogo(nom)
      );
    });
    if (duplicada) {
      return { ok: false, titulo: 'Opción duplicada', mensaje: 'Ya existe una opción con el código ingresado para la lista seleccionada.' };
    }

    this._listas.update((listas) =>
      listas.map((l) => {
        if (l.nombre !== lista.nombre) return l;
        const opciones = [...l.opciones];
        if (indice !== null && opciones[indice]) {
          opciones[indice] = crearOpcionLista(cod, nom, opciones[indice].activo);
        } else {
          opciones.push(crearOpcionLista(cod, nom, true));
        }
        return { ...l, opciones };
      }),
    );
    this.persistir();
    return {
      ok: true,
      titulo: 'Opción guardada',
      mensaje: `La opción '${cod} - ${nom}' fue guardada en la lista '${lista.nombre}'.`,
    };
  }

  /** PATCH /listas/{nombre}/opciones/{cod}/estado — alterna habilitada/deshabilitada. */
  cambiarEstadoOpcion(indice: number): ResultadoLista {
    const lista = this.activa();
    const opcion = lista?.opciones[indice];
    if (!lista || !opcion) {
      return { ok: false, titulo: 'Opción no encontrada', mensaje: 'Seleccione una opción válida de la grilla.' };
    }

    const nuevaActividad = !opcion.activo;
    this._listas.update((listas) =>
      listas.map((l) =>
        l.nombre === lista.nombre
          ? { ...l, opciones: l.opciones.map((o, i) => (i === indice ? { ...o, activo: nuevaActividad } : o)) }
          : l,
      ),
    );
    this.persistir();
    return {
      ok: true,
      titulo: nuevaActividad ? 'Descripción habilitada' : 'Descripción deshabilitada',
      mensaje: `La descripción '${opcion.codigo} - ${opcion.nombre}' ahora está ${nuevaActividad ? 'habilitada' : 'deshabilitada'}.`,
    };
  }

  /* ===== Persistencia local (reemplazable por API REST) ===== */

  private codigoCorrelativo(index: number): string {
    return `OPC${String(index + 1).padStart(3, '0')}`;
  }

  private cargarDesdeBaseLocal(): ListaAdmin[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return LISTAS_ADMIN_INICIALES;
      const guardadas = JSON.parse(raw) as ListaAdmin[];
      if (!Array.isArray(guardadas) || guardadas.length === 0) return LISTAS_ADMIN_INICIALES;
      // Normaliza opciones antiguas guardadas como texto plano.
      return guardadas.map((l) => ({
        nombre: l.nombre,
        opciones: (l.opciones ?? []).map((o: OpcionLista | string, i: number) =>
          typeof o === 'string' ? crearOpcionLista(this.codigoCorrelativo(i), o) : { activo: o.activo !== false, codigo: o.codigo ?? this.codigoCorrelativo(i), nombre: o.nombre },
        ),
      }));
    } catch {
      return LISTAS_ADMIN_INICIALES;
    }
  }

  private persistir(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._listas()));
    } catch {
      /* base local no disponible: el estado en memoria sigue vigente */
    }
  }
}
