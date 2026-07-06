import { Injectable, signal } from '@angular/core';
import { AreaConfig, DEFAULT_AREA_CONFIG } from '../models/area-config.model';
import { AREAS } from '../constants/areas.const';

/**
 * Configuración de reglas de negocio por área (Configurador de Reglas).
 *
 * ⚠ SIMULADO. Contratos sugeridos para el backend:
 *  - GET /areas/{area}/config
 *  - PUT /areas/{area}/config
 */
@Injectable({ providedIn: 'root' })
export class ReglasService {
  private readonly _configs = signal<Record<string, AreaConfig>>(
    Object.fromEntries(AREAS.map((a) => [a.code, structuredClone(DEFAULT_AREA_CONFIG)])),
  );
  readonly configs = this._configs.asReadonly();

  /** GET /areas/{area}/config */
  configDe(area: string): AreaConfig {
    return this._configs()[area] ?? structuredClone(DEFAULT_AREA_CONFIG);
  }

  /** PUT /areas/{area}/config */
  setConfig(area: string, cfg: AreaConfig): void {
    this._configs.update((prev) => ({ ...prev, [area]: cfg }));
  }
}
