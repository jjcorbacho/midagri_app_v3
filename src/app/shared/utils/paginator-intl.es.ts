import { MatPaginatorIntl } from '@angular/material/paginator';

/**
 * Etiquetas del paginador de Material en español (las trae en inglés).
 * Se registra una sola vez en `appConfig`, de modo que todas las tablas
 * paginadas del sistema comparten el mismo texto.
 */
export function paginatorIntlEs(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = 'Registros por página';
  intl.nextPageLabel = 'Página siguiente';
  intl.previousPageLabel = 'Página anterior';
  intl.firstPageLabel = 'Primera página';
  intl.lastPageLabel = 'Última página';
  intl.getRangeLabel = (pagina: number, tamano: number, total: number) => {
    if (total === 0 || tamano === 0) return `0 de ${total}`;
    const desde = pagina * tamano + 1;
    const hasta = Math.min((pagina + 1) * tamano, total);
    return `del ${desde} al ${hasta} de un total de ${total}`;
  };
  return intl;
}
