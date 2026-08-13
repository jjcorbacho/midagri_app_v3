import { Injectable, computed, inject, signal } from '@angular/core';
import { Participante } from '../models/participante.model';
import { PARTICIPANTES_INICIALES } from '../constants/mock-data.const';
import { CursosService } from './cursos.service';

/**
 * Servicio de participantes de un evento.
 *
 * ⚠ SIMULADO: estado en memoria. Contratos sugeridos para el backend:
 *  - GET    /cursos/{cursoId}/participantes
 *  - POST   /cursos/{cursoId}/participantes
 *  - PUT    /participantes/{id}
 *  - DELETE /participantes/{id}
 */
@Injectable({ providedIn: 'root' })
export class ParticipantesService {
  private readonly cursosService = inject(CursosService);

  private readonly _participantes = signal<Participante[]>([...PARTICIPANTES_INICIALES]);
  readonly participantes = this._participantes.asReadonly();

  /**
   * Total de participantes por curso, derivado del propio array.
   *
   * `Curso.participantes` es un contador denormalizado (lo que devolverá el
   * API); la fuente de verdad son estas filas. Las bandejas leen el total de
   * aquí para que la columna PARTICIPANTES no pueda discrepar de la lista que
   * muestra el Paso 2 del stepper.
   */
  private readonly totalPorCurso = computed(() => {
    const conteo = new Map<string, number>();
    for (const p of this._participantes()) {
      conteo.set(p.cursoId, (conteo.get(p.cursoId) ?? 0) + 1);
    }
    return conteo;
  });

  /** GET /cursos/{cursoId}/participantes */
  participantesDe(cursoId: string): Participante[] {
    return this._participantes().filter((p) => p.cursoId === cursoId);
  }

  /** Nº de participantes del curso (mismas filas que devuelve `participantesDe`). */
  totalDe(cursoId: string): number {
    return this.totalPorCurso().get(cursoId) ?? 0;
  }

  /** POST /cursos/{cursoId}/participantes */
  add(p: Omit<Participante, 'id'>): Participante {
    const nuevo: Participante = { ...p, id: `p${Date.now()}` };
    this._participantes.update((prev) => [nuevo, ...prev]);
    this.cursosService.adjustParticipantes(p.cursoId, +1);
    return nuevo;
  }

  /** PUT /participantes/{id} */
  update(id: string, patch: Partial<Participante>): void {
    this._participantes.update((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    );
  }

  /** DELETE /participantes/{id} */
  delete(id: string): void {
    const target = this._participantes().find((p) => p.id === id);
    this._participantes.update((prev) => prev.filter((p) => p.id !== id));
    if (target) this.cursosService.adjustParticipantes(target.cursoId, -1);
  }
}
