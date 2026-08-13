import { Injectable, signal } from '@angular/core';
import { CampoPersonalizado, FormularioKey } from '../models/campo.model';
import { CAMPOS_PERSONALIZADOS_INICIALES } from '../constants/mock-data.const';

/**
 * Servicio de campos personalizados por área/formulario.
 *
 * ⚠ SIMULADO. Contratos sugeridos para el backend:
 *  - GET    /areas/{area}/formularios/{formulario}/campos
 *  - POST   /campos
 *  - PUT    /campos/{id}
 *  - PATCH  /campos/{id}/visibilidad   { area, visible }
 *  - DELETE /campos/{id}
 */
@Injectable({ providedIn: 'root' })
export class CamposService {
  private readonly _campos = signal<CampoPersonalizado[]>([...CAMPOS_PERSONALIZADOS_INICIALES]);
  readonly campos = this._campos.asReadonly();

  /** GET /areas/{area}/formularios/{formulario}/campos */
  camposDe(area: string, formulario: FormularioKey): CampoPersonalizado[] {
    return this._campos().filter((c) => c.area === area && c.formulario === formulario);
  }

  /** POST /campos */
  add(c: Omit<CampoPersonalizado, 'id'>): void {
    this._campos.update((prev) => [...prev, { ...c, id: `f${Date.now()}` }]);
  }

  /** PUT /campos/{id} */
  update(id: string, patch: Partial<CampoPersonalizado>): void {
    this._campos.update((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  /** PATCH /campos/{id}/visibilidad */
  setVisibilidad(id: string, area: string, visible: boolean): void {
    this._campos.update((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, visiblePorArea: { ...(c.visiblePorArea ?? {}), [area]: visible } }
          : c,
      ),
    );
  }

  /** DELETE /campos/{id} */
  delete(id: string): void {
    this._campos.update((prev) => prev.filter((c) => c.id !== id));
  }

  // --- Activación de campos BASE por registro (área + formulario) ----------
  // Antes vivía como estado local de la pantalla y se perdía al navegar, de
  // modo que "Guardar" no tenía efecto sobre los campos base. Se guarda aquí,
  // junto al resto de la configuración de campos y con la misma estrategia
  // en memoria del servicio.
  //  - GET   /areas/{area}/formularios/{formulario}/campos-base/inactivos
  //  - PUT   /areas/{area}/formularios/{formulario}/campos-base/inactivos
  private readonly _basesInactivos = signal<Record<string, string[]>>({});

  private claveBase(area: string, formulario: FormularioKey): string {
    return `${area}::${formulario}`;
  }

  /** Nombres de campos base desactivados para el registro indicado. */
  basesInactivosDe(area: string, formulario: FormularioKey): string[] {
    return this._basesInactivos()[this.claveBase(area, formulario)] ?? [];
  }

  /** Reemplaza la lista de campos base desactivados del registro. */
  setBasesInactivos(area: string, formulario: FormularioKey, nombres: string[]): void {
    const clave = this.claveBase(area, formulario);
    this._basesInactivos.update((prev) => ({ ...prev, [clave]: [...nombres] }));
  }
}
