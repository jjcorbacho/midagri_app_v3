# Inventario visual y evidencia automatizada

Recorre toda la aplicación con Playwright, captura cada vista a página completa,
audita el resultado y arma un documento PDF de evidencia. **No toca la lógica de
negocio**: sólo navega, fotografía y mide.

Dos entregables independientes:

| Comando | Produce |
| --- | --- |
| `npm run screenshots` | `capturas/` + reporte de auditoría visual |
| `npm run evidencia` | `documentacion/` + `evidencia_aplicacion.pdf` |
| `npm run documentacion` | los dos, en orden |

## Puesta en marcha

```bash
npm install
npm run screenshots:setup     # descarga Chromium (una sola vez)
npm run documentacion         # recorrido completo + PDF (~10 min)
```

El resultado queda en `capturas/`:

```
capturas/
  tema-naturaleza-viva/
    desktop/  laptop/  tablet/  mobile/
  tema-innovacion-rural/
    desktop/  laptop/  tablet/  mobile/
  perfiles/
    administrador-general/  jefe-de-area/  administrador-ue/
    administrador-dz/       tecnico-cap-asist/
  reporte/
    auditoria-visual.md     ← reporte legible
    hallazgos.json          ← datos crudos (para diffs y CI)
```

Las imágenes están en `.gitignore`; el reporte no.

Y `npm run evidencia` produce:

```
documentacion/
  capturas/
    001_Login.png
    002_Login_Modal_Recuperar_Clave.png
    …
  evidencia_aplicacion.pdf     ← documento A4 imprimible
  indice.json                  ← índice del documento, sección a sección
  rutas_detectadas.json        ← rutas del router con guards y componentes
  componentes_detectados.json  ← componentes, servicios y referencias cruzadas
  resumen.json                 ← totales, errores y recomendaciones
```

## Qué hace, paso a paso

1. **Levanta la app.** Si nada responde en la URL base, compila con
   `ng build --configuration development` y sirve `dist/` con un servidor
   estático propio (con fallback SPA). Aborta si el build reporta errores.
2. **Inicia sesión solo.** Usa la cuenta master `ccandelaria` del prototipo y
   elige el perfil en el modal de acceso selectivo. Sin intervención manual.
3. **Recorre las rutas** declaradas en `lib/plan.mjs` (derivadas de
   `src/app/app.routes.ts`), esperando a que terminen la red, los spinners, las
   fuentes y las animaciones antes de disparar cada captura.
4. **Abre estados internos**: pasos del stepper, pestañas de formulario,
   selector de columnas, rango de fechas, sidebar expandido/contraído, grupos
   del menú y el panel de apariencia.
5. **Descubre modales** de forma genérica: pulsa los disparadores plausibles de
   cada vista, detecta si aparece un overlay real (`role=dialog` o panel fijo a
   pantalla completa con z-index alto) y lo fotografía. Las variantes del
   `ModalService` (info, advertencia, confirmación, éxito, error, vacío) y del
   `ToastService` se disparan mediante `window.ng`, disponible en builds de
   desarrollo.
6. **Audita** cada captura en el navegador (ver `lib/audit.mjs`) y agrega los
   hallazgos al reporte.

## El documento de evidencia

`e2e/evidencia.mjs` toma las capturas ya generadas y arma el PDF:

1. Las **ordena en siete capítulos** (acceso y layout, módulos, modales,
   estados, responsive, tema alternativo, perfiles) y las renumera a
   `NNN_Nombre.png`.
2. **Reescala** cada imagen a 1240 px de ancho dentro del propio navegador
   (canvas, sin dependencias nativas) y **parte en varias páginas** las que son
   demasiado altas para un A4, numerándolas «parte 1 de 3».
3. Compone portada con los datos de git, índice con enlaces internos, una
   sección por captura (ruta, módulo, tipo, rol que accede, descripción
   funcional, componentes, notas y hallazgos de auditoría) y un resumen final.
4. Imprime en A4 con márgenes uniformes, encabezado del proyecto y pie con
   numeración de páginas.

Las descripciones funcionales viven en `e2e/lib/descripciones.mjs`, escritas a
partir de la lectura de cada componente. Al añadir una pantalla nueva conviene
añadir también su entrada allí.

`e2e/analizar-codigo.mjs` es análisis estático puro: parsea `app.routes.ts` para
descubrir **todas** las rutas —incluidas las que no aparecen en ningún menú— y
recorre `src/` para inventariar componentes, servicios, guards y quién usa a
quién.

## Opciones

### `npm run evidencia`

| Flag | Para qué |
| --- | --- |
| `--origen=capturas` | Carpeta de la que leer las capturas |
| `--salida=documentacion` | Carpeta de entrega |
| `--sin-optimizar` | No reescala las imágenes (PDF mucho más pesado) |
| `--conservar-html` | Deja el HTML intermedio para revisar la maqueta |

### `npm run screenshots`

| Flag | Para qué |
| --- | --- |
| `--fase=principal,estados,responsive,perfiles` | Ejecuta sólo las fases indicadas |
| `--temas=naturaleza-viva,innovacion-rural` | Filtra temas |
| `--viewports=desktop,laptop,tablet,mobile` | Filtra resoluciones |
| `--perfiles=administrador-general,...` | Filtra perfiles (fase `perfiles`) |
| `--vistas=dashboard,reportes` | Filtra vistas por nombre de `plan.mjs` |
| `--sin-extras` / `--solo-extras` | Excluye o aísla login, modales, toasts y layout |
| `--sin-build` | Reutiliza el `dist/` existente |
| `--modo=serve` | Usa `ng serve` en vez del build estático |
| `--base-url=…` | Apunta a una instancia ya levantada |
| `--fusionar` | Acumula sobre el reporte anterior (para correr por partes) |
| `--salida=carpeta` | Cambia el destino de las capturas |
| `--fuentes-offline` | Sirve DM Sans / IBM Plex Mono desde `node_modules` |

### Fuentes sin internet

`index.html` carga DM Sans e IBM Plex Mono desde Google Fonts. En CI o en
contenedores sin salida a internet esa petición falla y las capturas salen con
una tipografía de reemplazo, lo que desplaza el texto y dispara falsos
positivos de truncado. Para evitarlo:

```bash
npm i -D @fontsource/dm-sans @fontsource/ibm-plex-mono
npm run screenshots -- --fuentes-offline
```

## Qué detecta la auditoría

Scroll horizontal, elementos fuera del viewport, textos recortados, contraste
por debajo de WCAG AA (resolviendo `oklch()` vía canvas), iconos SVG sin
dimensiones, tablas vacías / desbordadas / con columnas desalineadas, controles
sin nombre accesible, áreas táctiles menores a 32 px, controles superpuestos,
scroll vertical residual, imágenes sin `alt` y campos sin etiqueta. Además
registra todo error y advertencia de la consola del navegador.

Cuando hay un modal abierto, la auditoría se limita al modal: el fondo está
tapado a propósito y ya se analizó en su propia captura.

## Cómo extenderlo

- **Nueva pantalla** → entrada en `VISTAS` (`lib/plan.mjs`) + ficha en
  `lib/descripciones.mjs`.
- **Nuevo estado** (validación, filtro, carga…) → entrada en `ESCENARIOS`
  (`lib/plan.mjs`), con sus pasos declarativos.
- **Nueva regla de auditoría** → un bloque en `AUDIT_FN` (`lib/audit.mjs`).
- **Nuevo tema** → añadirlo a `TEMAS` (debe coincidir con `theme.service.ts`).

## Notas

- El proyecto define **2 temas visuales**, no 5: `naturaleza-viva` e
  `innovacion-rural` (`src/app/core/services/theme.service.ts`).
- Los datos son los mocks en memoria del prototipo; no hace falta backend ni
  variables de entorno: `src/environments/environment.ts` trae `useMocks: true`.
- El recorrido completo tarda unos 10 minutos y genera ~285 imágenes (~54 MB);
  el PDF resultante ronda las 440 páginas y 25 MB.
- Los escenarios de estado crean datos de prueba en la memoria de la sesión
  (un curso, una opción de lista). Como todo vive en `localStorage` y en
  señales, se descarta al cerrar el navegador.
