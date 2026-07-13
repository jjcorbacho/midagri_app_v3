/**
 * Estilos compartidos de inputs del design system N1.
 *
 * Los campos obligatorios se resaltan en ámbar (además del asterisco del
 * label) para indicar al usuario que debe completarlos; al recibir foco
 * vuelven al fondo normal. Misma convención que el `input-mandatory`
 * del prototipo SODEGA.
 */

export const INPUT_BASE =
  'w-full bg-background ring-1 ring-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground/60 hover:ring-muted-foreground/30 focus:ring-2 focus:ring-ring focus:outline-none transition-[box-shadow,background-color] duration-150';

export const INPUT_REQUIRED =
  'w-full bg-warning-soft ring-1 ring-warning/40 rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:bg-card focus:ring-2 focus:ring-ring focus:outline-none transition-[box-shadow,background-color] duration-150';

export const INPUT_DISABLED =
  'w-full bg-muted/40 ring-1 ring-border rounded-lg px-3 py-2 text-sm text-muted-foreground cursor-not-allowed';
