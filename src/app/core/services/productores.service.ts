import { Injectable } from '@angular/core';
import { ProductorBD } from '../models/participante.model';
import { PRODUCTORES_BD } from '../constants/mock-data.const';

/**
 * Padrón de productores (autocompletado por DNI en el Paso 2).
 *
 * ⚠ SIMULADO. Contrato sugerido para el backend:
 *  - GET /productores/{dni}  → 200 con datos del padrón | 404 si no existe.
 */
@Injectable({ providedIn: 'root' })
export class ProductoresService {
  /** GET /productores/{dni} */
  findByDni(dni: string): ProductorBD | undefined {
    return PRODUCTORES_BD.find((p) => p.dni === dni);
  }

  /** Devuelve el padrón completo (solo para el botón "Autocompletar" de pruebas). */
  all(): ProductorBD[] {
    return PRODUCTORES_BD;
  }
}
