import { Injectable, inject, signal } from '@angular/core';
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

  /** GET /cursos/{cursoId}/participantes */
  participantesDe(cursoId: string): Participante[] {
    return this._participantes().filter((p) => p.cursoId === cursoId);
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
