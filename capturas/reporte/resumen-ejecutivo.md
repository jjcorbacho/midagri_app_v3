# Resumen ejecutivo — Auditoría visual SODEGA / MIDAGRI

**Fecha:** 3 de agosto de 2026 · **Cobertura:** 242 capturas · 17 rutas · 5 perfiles ·
2 temas · 4 resoluciones · **1 049 hallazgos** · 0 errores de consola · 0 pasos fallidos.

Este documento resume e interpreta los datos de
[`auditoria-visual.md`](./auditoria-visual.md) (generado automáticamente) y
[`hallazgos.json`](./hallazgos.json). Se escribe a mano: **no lo sobrescribe**
`npm run screenshots`.

---

## Veredicto general

En **escritorio (1920×1080) la aplicación está sólida**: layout estable, sin
scroll horizontal, sin elementos fuera de pantalla y sin errores de consola en
ninguna de las 17 rutas, con los dos temas. Los problemas se concentran en dos
frentes: **el comportamiento responsive** y **el contraste de algunos tokens de
color**.

| Resolución | Hallazgos | Diagnóstico |
| --- | --- | --- |
| Desktop 1920×1080 | 158 | Correcto. Casi todo es contraste y etiquetado de campos. |
| Laptop 1366×768 | 154 | Aceptable. Las tablas anchas empiezan a desbordar ~6 px. |
| Tablet 768×1024 | 236 | Degradado. 132 elementos fuera del viewport. |
| Móvil 390×844 | 338 | **Roto.** Layout inutilizable. |

---

## Alta prioridad

### 1. El sidebar no se oculta en móvil — el layout colapsa

**Impacto: bloqueante en móvil y tablet.** El `<aside>` es `sticky` con ancho
fijo (`w-60` / `w-16`) y sin ningún breakpoint. En un viewport de 390 px ocupa
240 px, dejando ~150 px de contenido: las tarjetas KPI se apilan a una columna
de texto ilegible, los títulos se parten letra a letra, las tablas se salen de
la pantalla y toda la página gana scroll horizontal.

- Evidencia: `capturas/tema-naturaleza-viva/mobile/03-capacitaciones-bandeja.png`
  y todas las demás de `mobile/`.
- Métricas: **24 de 28** avisos de scroll horizontal, **132** elementos fuera
  del viewport y **84** textos recortados provienen de móvil.
- Corrección sugerida: convertir el sidebar en drawer por debajo de `md`
  (oculto por defecto + overlay al abrir) y añadir un botón de menú en el
  header. Es un cambio localizado en `layout/sidebar` y `layout/shell`.

### 2. Las tablas desbordan desde 1366 px

Las bandejas (`/capacitaciones-n1`, `/seguimiento/*`, `/usuarios`,
`/administracion/listas`) desbordan su contenedor unos 6 px en laptop y mucho
más en tablet. La columna «Ubicación» (`Región / Provincia / Distrito`) es la
que empuja.

- Evidencia: `capturas/tema-naturaleza-viva/laptop/03-capacitaciones-bandeja.png`.
- Corrección sugerida: envolver la tabla en un contenedor con
  `overflow-x-auto` explícito y, en pantallas pequeñas, colapsar las columnas
  secundarias (el selector de columnas ya existe: puede venir con un preset por
  breakpoint).

### 3. Contraste por debajo de WCAG AA en tokens compartidos

Ocho ocurrencias son de alta severidad y 372 de severidad media, pero casi
todas se reducen a **cinco tokens** que se repiten en todas las pantallas:

| Token / uso | Contraste | Mínimo AA | Dónde |
| --- | --- | --- | --- |
| `--sidebar-muted` sobre `--sidebar` | **4.21 : 1** | 4.5 : 1 | Todos los ítems del menú lateral |
| Texto secundario al 70 % de opacidad sobre `card` | **3.31 : 1** | 4.5 : 1 | Etiquetas de filtros, contadores, estados |
| Chip verde (`oklch(0.55 0.13 155)` sobre verde claro) | **4.08 : 1** | 4.5 : 1 | Badges «Texto largo», estados activos |
| Chip celeste (`oklch(0.55 0.11 220)`) | **4.04 : 1** | 4.5 : 1 | Badges de tipo de campo |
| Blanco sobre `rgb(91,129,150)` | **4.07 : 1** | 4.5 : 1 | Contadores del header |

Están *cerca* del umbral: subir la luminosidad del texto un escalón (o bajar la
del fondo) en `src/styles.css` corrige cientos de ocurrencias de una sola vez.
Afecta por igual a los dos temas.

---

## Media prioridad

### 4. 75 pantallas con campos sin etiqueta accesible

Los peores casos están en **Configuración de campos** (22–23 campos por
pantalla) y en los `<select>` de paginación y de filtros de las bandejas. Son
controles con etiqueta *visual* pero sin `<label for>`, `aria-label` ni
`placeholder`, así que un lector de pantalla los anuncia vacíos.

- Evidencia: `capturas/tema-naturaleza-viva/desktop/50-configuracion-campos.png`.
- Corrección: añadir `aria-label` a los selects sueltos y `id`/`for` en los
  formularios generados dinámicamente.

### 5. Áreas táctiles por debajo del mínimo (52 pantallas táctiles)

Los botones de acción por fila (iconos de participantes, sustento, editar) y
los checkboxes quedan por debajo de 32×32 px en tablet y móvil; la
recomendación es 44×44.

### 6. Tabla del modal «Reasignar registro» desalineada

6 encabezados frente a 1 celda en la primera fila: la fila de estado vacío usa
`colspan` sin cubrir la cabecera, y visualmente la tabla se ve rota.

- Evidencia: `capturas/tema-naturaleza-viva/desktop/46-usuarios-gestion-modal-reasignar-registro.png`.
- Mismo patrón en `perfiles/jefe-de-area/06-usuarios.png` (7 encabezados / 1 celda).

### 7. Controles superpuestos en Configuración de campos

La barra de acciones inferior (`Descartar` / `Guardar`) se superpone con
controles de la lista en 16 capturas, sobre todo al reducir el ancho.

---

## Baja prioridad

### 8. Icono SVG con dimensión 0 en el login (tablet y móvil)

Un icono del panel lateral del login se renderiza con ancho o alto 0 por debajo
de 768 px. Sin impacto funcional, pero deja un hueco.

### 9. Textos truncados con ellipsis

40 casos en las vistas por perfil, todos con `text-overflow: ellipsis`
declarado — es decir, truncado *intencional*. Se listan sólo como inventario;
conviene revisar que el `title` esté presente para ver el texto completo.

---

## Lo que está bien

- **Paridad entre temas**: «Naturaleza Viva» e «Innovación Rural» producen
  exactamente los mismos 72 hallazgos en desktop. El cambio de tema no rompe
  nada; el contraste falla igual en ambos, lo que confirma que es un problema de
  los tokens base y no de un tema concreto.
- **Consola limpia**: 0 errores y 0 advertencias en las 242 capturas.
- **Guards y permisos coherentes**: el recorrido por los 5 perfiles muestra que
  cada uno ve sólo su menú y que las rutas no autorizadas redirigen — 28
  pantallas de «sin acceso» capturadas, todas correctas
  (`capturas/perfiles/*/…-sin-acceso.png`).
- **Modales consistentes**: las 6 variantes del `ModalService` y los 4 toasts
  comparten estructura, iconografía y espaciado.

---

## Siguiente paso sugerido

1. Sidebar responsive (arregla ~60 % de todos los hallazgos de golpe).
2. Ajuste de los 5 tokens de contraste en `src/styles.css`.
3. `overflow-x-auto` en las bandejas + preset de columnas por breakpoint.
4. Volver a correr `npm run screenshots` y comparar `hallazgos.json` contra esta
   línea base.
