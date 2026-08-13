import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ConfiguracionFlujoService } from '../services/configuracion-flujo.service';
import { ModalService } from '../services/modal.service';

/**
 * Protege la etapa 2 del flujo de configuración.
 *
 * "Estructura de formulario" solo tiene sentido sobre un registro concreto,
 * así que sin selección se avisa con el sistema de modales unificado y se
 * devuelve al usuario a la etapa 1.
 *
 * Nota: `/configuracion/reglas` NO se protege. Esa vista ya era navegable
 * directamente desde el menú lateral y opera sobre el área activa, de modo
 * que no requiere un registro seleccionado; guardarla habría roto la
 * navegación existente.
 */
export const configuracionFlujoGuard: CanActivateFn = () => {
  const flujo = inject(ConfiguracionFlujoService);
  const modales = inject(ModalService);
  const router = inject(Router);

  if (flujo.haySeleccion()) return true;

  void modales.openWarning(
    'Seleccione un registro',
    'Para administrar la estructura del formulario primero debe seleccionar una configuración en Configuración de campos.',
    { soloAceptar: true },
  );
  return router.createUrlTree(['/configuracion/campos']);
};
