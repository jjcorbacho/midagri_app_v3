/**
 * Estilos compartidos de inputs del design system N1.
 *
 * Los campos obligatorios se resaltan en ámbar (además del asterisco del
 * label) para indicar al usuario que debe completarlos; al recibir foco
 * vuelven al fondo normal. Misma convención que el `input-mandatory`
 * del prototipo SODEGA.
 */

export const INPUT_BASE =
  'w-full bg-background ring-1 ring-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none transition-colors';

export const INPUT_REQUIRED =
  'w-full bg-amber-50 ring-1 ring-amber-300 rounded-lg px-3 py-2 text-sm focus:bg-card focus:ring-2 focus:ring-teal-500 focus:outline-none transition-colors';

export const INPUT_DISABLED =
  'w-full bg-muted/40 ring-1 ring-border rounded-lg px-3 py-2 text-sm text-muted-foreground cursor-not-allowed';
