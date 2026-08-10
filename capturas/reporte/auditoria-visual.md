# Auditoría visual — Plataforma SODEGA / MIDAGRI

> Generado automáticamente el 3/8/2026, 11:37:52 a. m. · 
duración del recorrido: 691 s · base: `http://127.0.0.1:4321`

Reejecutable con `npm run screenshots`.

## 1. Resumen de cobertura

| Concepto | Total |
| --- | --- |
| Imágenes generadas | 284 |
| Rutas distintas recorridas | 18 |
| Vistas capturadas | 54 |
| Formularios capturados | 48 |
| Tablas capturadas | 62 |
| Modales capturados | 60 |
| Componentes y estados capturados | 32 |
| Pantallas de error / sin acceso | 28 |
| Hallazgos visuales | 1165 |
| Errores de consola | 0 |
| Advertencias de consola | 0 |
| Pasos fallidos del recorrido | 0 |


### Distribución por carpeta

| Carpeta | Imágenes | Hallazgos |
| --- | --- | --- |
| `capturas/perfiles/administrador-dz/` | 10 | 30 |
| `capturas/perfiles/administrador-general/` | 10 | 28 |
| `capturas/perfiles/administrador-ue/` | 10 | 33 |
| `capturas/perfiles/jefe-de-area/` | 10 | 28 |
| `capturas/perfiles/tecnico-cap-asist/` | 10 | 44 |
| `capturas/tema-innovacion-rural/desktop/` | 75 | 137 |
| `capturas/tema-innovacion-rural/laptop/` | 14 | 77 |
| `capturas/tema-innovacion-rural/mobile/` | 14 | 169 |
| `capturas/tema-innovacion-rural/tablet/` | 14 | 118 |
| `capturas/tema-naturaleza-viva/desktop/` | 75 | 137 |
| `capturas/tema-naturaleza-viva/laptop/` | 14 | 77 |
| `capturas/tema-naturaleza-viva/mobile/` | 14 | 169 |
| `capturas/tema-naturaleza-viva/tablet/` | 14 | 118 |


## 2. Rutas recorridas

| Ruta | Capturas | Perfiles |
| --- | --- | --- |
| `/administracion/listas` | 21 | 5 |
| `/auth` | 14 | 1 |
| `/capacitaciones-n1` | 35 | 5 |
| `/capacitaciones-n1/1?paso=1` | 2 | 1 |
| `/capacitaciones-n1/1?paso=2` | 2 | 1 |
| `/capacitaciones-n1/1?paso=3` | 2 | 1 |
| `/capacitaciones-n1/nuevo` | 16 | 1 |
| `/configuracion/campos` | 17 | 5 |
| `/configuracion/reglas` | 13 | 5 |
| `/dashboard` | 41 | 5 |
| `/perfil` | 13 | 5 |
| `/reportes` | 13 | 5 |
| `/ruta-que-no-existe` | 8 | 1 |
| `/seguimiento/aprobacion` | 17 | 5 |
| `/seguimiento/revision` | 19 | 5 |
| `/usuarios` | 23 | 5 |
| `/usuarios/demo-qa-1` | 4 | 1 |
| `/usuarios/nuevo` | 24 | 1 |


## 3. Hallazgos de la auditoría visual

| Severidad | Hallazgos | Reglas distintas |
| --- | --- | --- |
| Alta prioridad | 214 | 3 |
| Media prioridad | 903 | 8 |
| Baja prioridad | 48 | 1 |


### Por tipo de problema

| Problema | Ocurrencias | Severidad máx. | Pantallas afectadas |
| --- | --- | --- | --- |
| Contraste insuficiente (WCAG AA) | 466 | alta | 222 |
| Elementos fuera del área visible | 351 | alta | 39 |
| Textos recortados o truncados | 126 | media | 56 |
| Campos de formulario sin etiqueta | 105 | media | 105 |
| Áreas táctiles por debajo del mínimo | 52 | media | 52 |
| Scroll horizontal en la página | 28 | alta | 28 |
| Controles superpuestos | 20 | media | 20 |
| Tablas con columnas desalineadas | 13 | media | 11 |
| Iconos SVG sin dimensiones | 4 | media | 4 |


### Alta prioridad (214)


#### Elementos fuera del área visible — 178 ocurrencia(s)

| Pantalla | Detalle | Selector |
| --- | --- | --- |
| `tema-naturaleza-viva/tablet/03-capacitaciones-bandeja.png` | Elemento fuera del área visible (121px). Texto: "Estado". | `table.w-full.text-left > thead.bg-secondary.sticky > tr.text-muted-foreground.text-[11px] > th.px-4.py-3` |
| `tema-naturaleza-viva/tablet/03-capacitaciones-bandeja.png` | Elemento fuera del área visible (52px). Texto: "Registrado". | `tr.hover:bg-secondary/40.transition-colors > td.px-4.py-4 > app-estado-badge > span.inline-flex.items-center` |
| `tema-naturaleza-viva/tablet/03-capacitaciones-bandeja.png` | Elemento fuera del área visible (105px). Texto: "Enviado-Subsanado". | `tr.hover:bg-secondary/40.transition-colors > td.px-4.py-4 > app-estado-badge > span.inline-flex.items-center` |
| `tema-naturaleza-viva/tablet/03-capacitaciones-bandeja.png` | Elemento fuera del área visible (41px). Texto: "Validado". | `tr.hover:bg-secondary/40.transition-colors > td.px-4.py-4 > app-estado-badge > span.inline-flex.items-center` |
| `tema-naturaleza-viva/tablet/03-capacitaciones-bandeja.png` | Elemento fuera del área visible (53px). Texto: "Observado". | `tr.hover:bg-secondary/40.transition-colors > td.px-4.py-4 > app-estado-badge > span.inline-flex.items-center` |
| `tema-naturaleza-viva/tablet/03-capacitaciones-bandeja.png` | Elemento fuera del área visible (48px). Texto: "Aprobado". | `tr.hover:bg-secondary/40.transition-colors > td.px-4.py-4 > app-estado-badge > span.inline-flex.items-center` |
| `tema-naturaleza-viva/tablet/03-capacitaciones-bandeja.png` | Elemento fuera del área visible (52px). Texto: "Registrado". | `tr.hover:bg-secondary/40.transition-colors > td.px-4.py-4 > app-estado-badge > span.inline-flex.items-center` |
| `tema-naturaleza-viva/tablet/03-capacitaciones-bandeja.png` | Elemento fuera del área visible (105px). Texto: "Enviado-Subsanado". | `tr.hover:bg-secondary/40.transition-colors > td.px-4.py-4 > app-estado-badge > span.inline-flex.items-center` |
| `tema-naturaleza-viva/tablet/05-seguimiento-revision.png` | Elemento fuera del área visible (50px). Texto: "Validar seleccionados (0)". | `section.p-4.md:p-8 > header.flex.flex-col > div.flex.gap-2 > button.btn-primary` |
| `tema-naturaleza-viva/tablet/05-seguimiento-revision.png` | Elemento fuera del área visible (132px). Texto: "Estado". | `table.w-full.text-left > thead.bg-secondary.sticky > tr.text-muted-foreground.text-[11px] > th.px-4.py-3` |
| `tema-naturaleza-viva/tablet/05-seguimiento-revision.png` | Elemento fuera del área visible (48px). Texto: "Enviado". | `tr.hover:bg-secondary/40.transition-colors > td.px-4.py-4 > app-estado-badge > span.inline-flex.items-center` |
| `tema-naturaleza-viva/tablet/05-seguimiento-revision.png` | Elemento fuera del área visible (48px). Texto: "Enviado". | `tr.hover:bg-secondary/40.transition-colors > td.px-4.py-4 > app-estado-badge > span.inline-flex.items-center` |


_… y 166 ocurrencia(s) más (ver `reporte/hallazgos.json`)._


#### Scroll horizontal en la página — 28 ocurrencia(s)

| Pantalla | Detalle | Selector |
| --- | --- | --- |
| `tema-naturaleza-viva/tablet/05-seguimiento-revision.png` | La página desborda horizontalmente: scrollWidth=943px frente a un viewport de 768px. | `html` |
| `tema-naturaleza-viva/tablet/06-seguimiento-aprobacion.png` | La página desborda horizontalmente: scrollWidth=960px frente a un viewport de 768px. | `html` |
| `tema-naturaleza-viva/mobile/02-dashboard.png` | La página desborda horizontalmente: scrollWidth=448px frente a un viewport de 390px. | `html` |
| `tema-naturaleza-viva/mobile/03-capacitaciones-bandeja.png` | La página desborda horizontalmente: scrollWidth=448px frente a un viewport de 390px. | `html` |
| `tema-naturaleza-viva/mobile/04-capacitaciones-nuevo-paso1.png` | La página desborda horizontalmente: scrollWidth=653px frente a un viewport de 390px. | `html` |
| `tema-naturaleza-viva/mobile/05-seguimiento-revision.png` | La página desborda horizontalmente: scrollWidth=604px frente a un viewport de 390px. | `html` |
| `tema-naturaleza-viva/mobile/06-seguimiento-aprobacion.png` | La página desborda horizontalmente: scrollWidth=613px frente a un viewport de 390px. | `html` |
| `tema-naturaleza-viva/mobile/07-reportes.png` | La página desborda horizontalmente: scrollWidth=448px frente a un viewport de 390px. | `html` |
| `tema-naturaleza-viva/mobile/08-usuarios-gestion.png` | La página desborda horizontalmente: scrollWidth=462px frente a un viewport de 390px. | `html` |
| `tema-naturaleza-viva/mobile/09-usuarios-nuevo.png` | La página desborda horizontalmente: scrollWidth=466px frente a un viewport de 390px. | `html` |
| `tema-naturaleza-viva/mobile/10-administracion-listas.png` | La página desborda horizontalmente: scrollWidth=485px frente a un viewport de 390px. | `html` |
| `tema-naturaleza-viva/mobile/11-configuracion-campos.png` | La página desborda horizontalmente: scrollWidth=448px frente a un viewport de 390px. | `html` |


_… y 16 ocurrencia(s) más (ver `reporte/hallazgos.json`)._


#### Contraste insuficiente (WCAG AA) — 8 ocurrencia(s)

| Pantalla | Detalle | Selector |
| --- | --- | --- |
| `tema-naturaleza-viva/desktop/22-error-404.png` | Contraste 1.36:1 (mínimo WCAG AA 3:1) para "404" — color oklab(0.44 -0.0401503 -0.0573406 / 0.2) sobre rgb(244,251,248). | `app-not-found > div.flex.min-h-screen > div.max-w-md.text-center > h1.text-7xl.font-bold` |
| `tema-innovacion-rural/desktop/23-error-404.png` | Contraste 1.38:1 (mínimo WCAG AA 3:1) para "404" — color oklab(0.42 -0.035 -0.0606218 / 0.2) sobre rgb(244,250,254). | `app-not-found > div.flex.min-h-screen > div.max-w-md.text-center > h1.text-7xl.font-bold` |
| `tema-naturaleza-viva/laptop/14-error-404.png` | Contraste 1.36:1 (mínimo WCAG AA 3:1) para "404" — color oklab(0.44 -0.0401503 -0.0573406 / 0.2) sobre rgb(244,251,248). | `app-not-found > div.flex.min-h-screen > div.max-w-md.text-center > h1.text-7xl.font-bold` |
| `tema-naturaleza-viva/tablet/14-error-404.png` | Contraste 1.36:1 (mínimo WCAG AA 3:1) para "404" — color oklab(0.44 -0.0401503 -0.0573406 / 0.2) sobre rgb(244,251,248). | `app-not-found > div.flex.min-h-screen > div.max-w-md.text-center > h1.text-7xl.font-bold` |
| `tema-naturaleza-viva/mobile/14-error-404.png` | Contraste 1.36:1 (mínimo WCAG AA 3:1) para "404" — color oklab(0.44 -0.0401503 -0.0573406 / 0.2) sobre rgb(244,251,248). | `app-not-found > div.flex.min-h-screen > div.max-w-md.text-center > h1.text-7xl.font-bold` |
| `tema-innovacion-rural/laptop/14-error-404.png` | Contraste 1.38:1 (mínimo WCAG AA 3:1) para "404" — color oklab(0.42 -0.035 -0.0606218 / 0.2) sobre rgb(244,250,254). | `app-not-found > div.flex.min-h-screen > div.max-w-md.text-center > h1.text-7xl.font-bold` |
| `tema-innovacion-rural/tablet/14-error-404.png` | Contraste 1.38:1 (mínimo WCAG AA 3:1) para "404" — color oklab(0.42 -0.035 -0.0606218 / 0.2) sobre rgb(244,250,254). | `app-not-found > div.flex.min-h-screen > div.max-w-md.text-center > h1.text-7xl.font-bold` |
| `tema-innovacion-rural/mobile/14-error-404.png` | Contraste 1.38:1 (mínimo WCAG AA 3:1) para "404" — color oklab(0.42 -0.035 -0.0606218 / 0.2) sobre rgb(244,250,254). | `app-not-found > div.flex.min-h-screen > div.max-w-md.text-center > h1.text-7xl.font-bold` |


### Media prioridad (903)


#### Contraste insuficiente (WCAG AA) — 458 ocurrencia(s)

| Pantalla | Detalle | Selector |
| --- | --- | --- |
| `tema-naturaleza-viva/desktop/01-login.png` | Contraste 4.21:1 (mínimo WCAG AA 4.5:1) para "Ministerio de Desarrollo Agrario y Riego" — color oklch(0.65 0.01 240) sobre rgb(20,49,65). | `div.relative > div.flex.items-center > div > div.text-[10px].uppercase` |
| `tema-naturaleza-viva/desktop/01-login.png` | Contraste 4.21:1 (mínimo WCAG AA 4.5:1) para "Registro centralizado para áreas usuaria" — color oklch(0.65 0.01 240) sobre rgb(20,49,65). | `div.min-h-screen.flex > div.hidden.lg:flex > div.relative.max-w-md > p.mt-4.text-sm` |
| `tema-naturaleza-viva/desktop/02-login-modal-recuperar-clave.png` | Contraste 4.21:1 (mínimo WCAG AA 4.5:1) para "Ministerio de Desarrollo Agrario y Riego" — color oklch(0.65 0.01 240) sobre rgb(20,49,65). | `div.relative > div.flex.items-center > div > div.text-[10px].uppercase` |
| `tema-naturaleza-viva/desktop/02-login-modal-recuperar-clave.png` | Contraste 4.21:1 (mínimo WCAG AA 4.5:1) para "Registro centralizado para áreas usuaria" — color oklch(0.65 0.01 240) sobre rgb(20,49,65). | `div.min-h-screen.flex > div.hidden.lg:flex > div.relative.max-w-md > p.mt-4.text-sm` |
| `tema-naturaleza-viva/desktop/03-login-modal-recuperar-enviado.png` | Contraste 4.21:1 (mínimo WCAG AA 4.5:1) para "Ministerio de Desarrollo Agrario y Riego" — color oklch(0.65 0.01 240) sobre rgb(20,49,65). | `div.relative > div.flex.items-center > div > div.text-[10px].uppercase` |
| `tema-naturaleza-viva/desktop/03-login-modal-recuperar-enviado.png` | Contraste 4.21:1 (mínimo WCAG AA 4.5:1) para "Registro centralizado para áreas usuaria" — color oklch(0.65 0.01 240) sobre rgb(20,49,65). | `div.min-h-screen.flex > div.hidden.lg:flex > div.relative.max-w-md > p.mt-4.text-sm` |
| `tema-naturaleza-viva/desktop/04-login-modal-seleccion-perfil.png` | Contraste 4.21:1 (mínimo WCAG AA 4.5:1) para "Ministerio de Desarrollo Agrario y Riego" — color oklch(0.65 0.01 240) sobre rgb(20,49,65). | `div.relative > div.flex.items-center > div > div.text-[10px].uppercase` |
| `tema-naturaleza-viva/desktop/04-login-modal-seleccion-perfil.png` | Contraste 4.21:1 (mínimo WCAG AA 4.5:1) para "Registro centralizado para áreas usuaria" — color oklch(0.65 0.01 240) sobre rgb(20,49,65). | `div.min-h-screen.flex > div.hidden.lg:flex > div.relative.max-w-md > p.mt-4.text-sm` |
| `tema-naturaleza-viva/desktop/11-toast-exito.png` | Contraste 4.21:1 (mínimo WCAG AA 4.5:1) para "Capacitaciones / Asist. Técnica N1" — color oklch(0.65 0.01 240) sobre rgb(20,49,65). | `aside.flex-shrink-0.bg-sidebar > nav.flex.flex-col > a.group.relative > span.text-sm` |
| `tema-naturaleza-viva/desktop/12-toast-info.png` | Contraste 4.21:1 (mínimo WCAG AA 4.5:1) para "Capacitaciones / Asist. Técnica N1" — color oklch(0.65 0.01 240) sobre rgb(20,49,65). | `aside.flex-shrink-0.bg-sidebar > nav.flex.flex-col > a.group.relative > span.text-sm` |
| `tema-naturaleza-viva/desktop/13-toast-advertencia.png` | Contraste 4.21:1 (mínimo WCAG AA 4.5:1) para "Capacitaciones / Asist. Técnica N1" — color oklch(0.65 0.01 240) sobre rgb(20,49,65). | `aside.flex-shrink-0.bg-sidebar > nav.flex.flex-col > a.group.relative > span.text-sm` |
| `tema-naturaleza-viva/desktop/14-toast-error.png` | Contraste 4.21:1 (mínimo WCAG AA 4.5:1) para "Capacitaciones / Asist. Técnica N1" — color oklch(0.65 0.01 240) sobre rgb(20,49,65). | `aside.flex-shrink-0.bg-sidebar > nav.flex.flex-col > a.group.relative > span.text-sm` |


_… y 446 ocurrencia(s) más (ver `reporte/hallazgos.json`)._


#### Elementos fuera del área visible — 173 ocurrencia(s)

| Pantalla | Detalle | Selector |
| --- | --- | --- |
| `tema-naturaleza-viva/laptop/03-capacitaciones-bandeja.png` | Elemento fuera del área visible (6px). Texto: "Ubicación". | `table.w-full.text-left > thead.bg-secondary.sticky > tr.text-muted-foreground.text-[11px] > th.px-4.py-3` |
| `tema-naturaleza-viva/laptop/03-capacitaciones-bandeja.png` | Elemento fuera del área visible (6px). Texto: "Cusco / Calca / Pisac". | `table.w-full.text-left > tbody.divide-y.divide-border > tr.hover:bg-secondary/40.transition-colors > td.px-4.py-4` |
| `tema-naturaleza-viva/laptop/03-capacitaciones-bandeja.png` | Elemento fuera del área visible (6px). Texto: "Lima / Lima / San Isidro". | `table.w-full.text-left > tbody.divide-y.divide-border > tr.hover:bg-secondary/40.transition-colors > td.px-4.py-4` |
| `tema-naturaleza-viva/laptop/03-capacitaciones-bandeja.png` | Elemento fuera del área visible (6px). Texto: "Lima / Lima / San Isidro". | `table.w-full.text-left > tbody.divide-y.divide-border > tr.hover:bg-secondary/40.transition-colors > td.px-4.py-4` |
| `tema-naturaleza-viva/laptop/03-capacitaciones-bandeja.png` | Elemento fuera del área visible (6px). Texto: "Lima / Lima / San Isidro". | `table.w-full.text-left > tbody.divide-y.divide-border > tr.hover:bg-secondary/40.transition-colors > td.px-4.py-4` |
| `tema-naturaleza-viva/laptop/03-capacitaciones-bandeja.png` | Elemento fuera del área visible (6px). Texto: "Lima / Lima / San Isidro". | `table.w-full.text-left > tbody.divide-y.divide-border > tr.hover:bg-secondary/40.transition-colors > td.px-4.py-4` |
| `tema-naturaleza-viva/laptop/03-capacitaciones-bandeja.png` | Elemento fuera del área visible (6px). Texto: "Lima / Lima / San Isidro". | `table.w-full.text-left > tbody.divide-y.divide-border > tr.hover:bg-secondary/40.transition-colors > td.px-4.py-4` |
| `tema-naturaleza-viva/laptop/03-capacitaciones-bandeja.png` | Elemento fuera del área visible (6px). Texto: "Lima / Lima / San Isidro". | `table.w-full.text-left > tbody.divide-y.divide-border > tr.hover:bg-secondary/40.transition-colors > td.px-4.py-4` |
| `tema-naturaleza-viva/laptop/03-capacitaciones-bandeja.png` | Elemento fuera del área visible (6px). Texto: "Lima / Lima / San Isidro". | `table.w-full.text-left > tbody.divide-y.divide-border > tr.hover:bg-secondary/40.transition-colors > td.px-4.py-4` |
| `tema-naturaleza-viva/laptop/03-capacitaciones-bandeja.png` | Elemento fuera del área visible (6px). Texto: "Lima / Lima / San Isidro". | `table.w-full.text-left > tbody.divide-y.divide-border > tr.hover:bg-secondary/40.transition-colors > td.px-4.py-4` |
| `tema-naturaleza-viva/laptop/03-capacitaciones-bandeja.png` | Elemento fuera del área visible (6px). Texto: "Lima / Lima / San Isidro". | `table.w-full.text-left > tbody.divide-y.divide-border > tr.hover:bg-secondary/40.transition-colors > td.px-4.py-4` |
| `tema-naturaleza-viva/laptop/05-seguimiento-revision.png` | Elemento fuera del área visible (6px). Texto: "Ubicación". | `table.w-full.text-left > thead.bg-secondary.sticky > tr.text-muted-foreground.text-[11px] > th.px-4.py-3` |


_… y 161 ocurrencia(s) más (ver `reporte/hallazgos.json`)._


#### Campos de formulario sin etiqueta — 105 ocurrencia(s)

| Pantalla | Detalle | Selector |
| --- | --- | --- |
| `tema-naturaleza-viva/desktop/04-login-modal-seleccion-perfil.png` | 1 campo(s) de formulario sin etiqueta asociada, aria-label ni placeholder. | `div.bg-card.rounded-2xl > div.space-y-4 > div > select.w-full.ring-1` |
| `tema-naturaleza-viva/desktop/23-capacitaciones-bandeja.png` | 1 campo(s) de formulario sin etiqueta asociada, aria-label ni placeholder. | `div.bg-card.rounded-xl > div.p-4.border-t > div.flex.items-center > select.px-2.py-1` |
| `tema-naturaleza-viva/desktop/24-capacitaciones-bandeja-columnas.png` | 1 campo(s) de formulario sin etiqueta asociada, aria-label ni placeholder. | `div.bg-card.rounded-xl > div.p-4.border-t > div.flex.items-center > select.px-2.py-1` |
| `tema-naturaleza-viva/desktop/29-capacitaciones-nuevo-paso1.png` | 12 campo(s) de formulario sin etiqueta asociada, aria-label ni placeholder. | `section.bg-card.rounded-xl > div.grid.grid-cols-1 > div > input.bg-muted/40.cursor-not-allowed` |
| `tema-naturaleza-viva/desktop/30-capacitaciones-editar-paso1.png` | 12 campo(s) de formulario sin etiqueta asociada, aria-label ni placeholder. | `section.bg-card.rounded-xl > div.grid.grid-cols-1 > div > input.bg-muted/40.cursor-not-allowed` |
| `tema-naturaleza-viva/desktop/43-usuarios-gestion.png` | 1 campo(s) de formulario sin etiqueta asociada, aria-label ni placeholder. | `div.bg-card.rounded-xl > div.p-4.border-t > div.flex.items-center > select.px-2.py-1` |
| `tema-naturaleza-viva/desktop/47-usuarios-nuevo.png` | 3 campo(s) de formulario sin etiqueta asociada, aria-label ni placeholder. | `div.bg-card.rounded-xl > div.grid.grid-cols-12 > div.col-span-3 > select.bg-warning-soft.duration-150` |
| `tema-naturaleza-viva/desktop/49-usuarios-nuevo-tab-periodos.png` | 3 campo(s) de formulario sin etiqueta asociada, aria-label ni placeholder. | `div.bg-card.rounded-xl > div.grid.grid-cols-12 > div.col-span-3 > select.bg-warning-soft.duration-150` |
| `tema-naturaleza-viva/desktop/50-configuracion-campos.png` | 22 campo(s) de formulario sin etiqueta asociada, aria-label ni placeholder. | `div.flex.flex-col > div.flex.flex-col > div.flex.flex-col > select.h-9.w-full` |
| `tema-naturaleza-viva/desktop/51-configuracion-campos-modal-nuevo-campo-personalizado.png` | 23 campo(s) de formulario sin etiqueta asociada, aria-label ni placeholder. | `div.flex.flex-col > div.flex.flex-col > div.flex.flex-col > select.h-9.w-full` |
| `tema-naturaleza-viva/desktop/52-configuracion-reglas.png` | 11 campo(s) de formulario sin etiqueta asociada, aria-label ni placeholder. | `div.rounded-lg.border > div.grid.grid-cols-2 > div > input.w-full.h-9` |
| `tema-innovacion-rural/desktop/04-login-modal-seleccion-perfil.png` | 1 campo(s) de formulario sin etiqueta asociada, aria-label ni placeholder. | `div.bg-card.rounded-2xl > div.space-y-4 > div > select.w-full.ring-1` |


_… y 93 ocurrencia(s) más (ver `reporte/hallazgos.json`)._


#### Textos recortados o truncados — 78 ocurrencia(s)

| Pantalla | Detalle | Selector |
| --- | --- | --- |
| `tema-naturaleza-viva/mobile/02-dashboard.png` | Texto recortado sin ellipsis (overflow no declarado): "Bienvenido, Carlos Candelaria Burgos". | `app-dashboard > section.p-6.lg:p-8 > header.mb-8 > h1.mt-1.text-h1` |
| `tema-naturaleza-viva/mobile/02-dashboard.png` | Texto recortado sin ellipsis (overflow no declarado): "Capacitaciones / Asist. Técnica N1". | `a.group.focus:outline-none > div.h-full.bg-card > div.p-6.pb-3 > h2.text-base.font-semibold` |
| `tema-naturaleza-viva/mobile/02-dashboard.png` | Texto recortado sin ellipsis (overflow no declarado): "Registro y gestión de eventos, participantes, sustentos y es". | `a.group.focus:outline-none > div.h-full.bg-card > div.p-6.pb-3 > p.text-sm.text-muted-foreground` |
| `tema-naturaleza-viva/mobile/02-dashboard.png` | Texto recortado sin ellipsis (overflow no declarado): "Seguimiento y revisión". | `a.group.focus:outline-none > div.h-full.bg-card > div.p-6.pb-3 > h2.text-base.font-semibold` |
| `tema-naturaleza-viva/mobile/02-dashboard.png` | Texto recortado sin ellipsis (overflow no declarado): "Revisar y validar los registros enviados por las áreas.". | `a.group.focus:outline-none > div.h-full.bg-card > div.p-6.pb-3 > p.text-sm.text-muted-foreground` |
| `tema-naturaleza-viva/mobile/02-dashboard.png` | Texto recortado sin ellipsis (overflow no declarado): "Seguimiento y aprobación". | `a.group.focus:outline-none > div.h-full.bg-card > div.p-6.pb-3 > h2.text-base.font-semibold` |
| `tema-naturaleza-viva/mobile/02-dashboard.png` | Texto recortado sin ellipsis (overflow no declarado): "Aprobar u observar los registros que ya han sido validados.". | `a.group.focus:outline-none > div.h-full.bg-card > div.p-6.pb-3 > p.text-sm.text-muted-foreground` |
| `tema-naturaleza-viva/mobile/02-dashboard.png` | Texto recortado sin ellipsis (overflow no declarado): "Reportes". | `a.group.focus:outline-none > div.h-full.bg-card > div.p-6.pb-3 > h2.text-base.font-semibold` |
| `tema-naturaleza-viva/mobile/02-dashboard.png` | Texto recortado sin ellipsis (overflow no declarado): "Reportes y estadísticas institucionales de capacitaciones y ". | `a.group.focus:outline-none > div.h-full.bg-card > div.p-6.pb-3 > p.text-sm.text-muted-foreground` |
| `tema-naturaleza-viva/mobile/02-dashboard.png` | Texto recortado sin ellipsis (overflow no declarado): "Gestión de Usuarios". | `a.group.focus:outline-none > div.h-full.bg-card > div.p-6.pb-3 > h2.text-base.font-semibold` |
| `tema-naturaleza-viva/mobile/02-dashboard.png` | Texto recortado sin ellipsis (overflow no declarado): "Usuarios, perfiles, vigencias laborales, ámbitos presupuesta". | `a.group.focus:outline-none > div.h-full.bg-card > div.p-6.pb-3 > p.text-sm.text-muted-foreground` |
| `tema-naturaleza-viva/mobile/02-dashboard.png` | Texto recortado sin ellipsis (overflow no declarado): "Configuración". | `a.group.focus:outline-none > div.h-full.bg-card > div.p-6.pb-3 > h2.text-base.font-semibold` |


_… y 66 ocurrencia(s) más (ver `reporte/hallazgos.json`)._


#### Áreas táctiles por debajo del mínimo — 52 ocurrencia(s)

| Pantalla | Detalle | Selector |
| --- | --- | --- |
| `tema-naturaleza-viva/tablet/01-login.png` | 1 control(es) con área táctil menor a 32x32 px (recomendado 44x44). Ej.: "Recuperar Contraseña". | `form.w-full.max-w-sm > div.space-y-3 > div > a.text-[11px].text-brand` |
| `tema-naturaleza-viva/tablet/02-dashboard.png` | 1 control(es) con área táctil menor a 32x32 px (recomendado 44x44). Ej.: "". | `app-sidebar > aside.flex-shrink-0.bg-sidebar > div.flex.items-center > button.p-1.5.rounded-md` |
| `tema-naturaleza-viva/tablet/03-capacitaciones-bandeja.png` | 13 control(es) con área táctil menor a 32x32 px (recomendado 44x44). Ej.: "". | `app-sidebar > aside.flex-shrink-0.bg-sidebar > div.flex.items-center > button.p-1.5.rounded-md` |
| `tema-naturaleza-viva/tablet/04-capacitaciones-nuevo-paso1.png` | 6 control(es) con área táctil menor a 32x32 px (recomendado 44x44). Ej.: "". | `app-sidebar > aside.flex-shrink-0.bg-sidebar > div.flex.items-center > button.p-1.5.rounded-md` |
| `tema-naturaleza-viva/tablet/05-seguimiento-revision.png` | 47 control(es) con área táctil menor a 32x32 px (recomendado 44x44). Ej.: "". | `app-sidebar > aside.flex-shrink-0.bg-sidebar > div.flex.items-center > button.p-1.5.rounded-md` |
| `tema-naturaleza-viva/tablet/06-seguimiento-aprobacion.png` | 47 control(es) con área táctil menor a 32x32 px (recomendado 44x44). Ej.: "". | `app-sidebar > aside.flex-shrink-0.bg-sidebar > div.flex.items-center > button.p-1.5.rounded-md` |
| `tema-naturaleza-viva/tablet/07-reportes.png` | 1 control(es) con área táctil menor a 32x32 px (recomendado 44x44). Ej.: "". | `app-sidebar > aside.flex-shrink-0.bg-sidebar > div.flex.items-center > button.p-1.5.rounded-md` |
| `tema-naturaleza-viva/tablet/08-usuarios-gestion.png` | 7 control(es) con área táctil menor a 32x32 px (recomendado 44x44). Ej.: "". | `app-sidebar > aside.flex-shrink-0.bg-sidebar > div.flex.items-center > button.p-1.5.rounded-md` |
| `tema-naturaleza-viva/tablet/09-usuarios-nuevo.png` | 3 control(es) con área táctil menor a 32x32 px (recomendado 44x44). Ej.: "". | `app-sidebar > aside.flex-shrink-0.bg-sidebar > div.flex.items-center > button.p-1.5.rounded-md` |
| `tema-naturaleza-viva/tablet/10-administracion-listas.png` | 3 control(es) con área táctil menor a 32x32 px (recomendado 44x44). Ej.: "". | `app-sidebar > aside.flex-shrink-0.bg-sidebar > div.flex.items-center > button.p-1.5.rounded-md` |
| `tema-naturaleza-viva/tablet/11-configuracion-campos.png` | 14 control(es) con área táctil menor a 32x32 px (recomendado 44x44). Ej.: "". | `app-sidebar > aside.flex-shrink-0.bg-sidebar > div.flex.items-center > button.p-1.5.rounded-md` |
| `tema-naturaleza-viva/tablet/12-configuracion-reglas.png` | 7 control(es) con área táctil menor a 32x32 px (recomendado 44x44). Ej.: "". | `app-sidebar > aside.flex-shrink-0.bg-sidebar > div.flex.items-center > button.p-1.5.rounded-md` |


_… y 40 ocurrencia(s) más (ver `reporte/hallazgos.json`)._


#### Controles superpuestos — 20 ocurrencia(s)

| Pantalla | Detalle | Selector |
| --- | --- | --- |
| `tema-naturaleza-viva/desktop/50-configuracion-campos.png` | 2 par(es) de controles interactivos superpuestos. Ej.: "" ⟷ "Descartar" | `body` |
| `tema-naturaleza-viva/desktop/51-configuracion-campos-modal-nuevo-campo-personalizado.png` | 3 par(es) de controles interactivos superpuestos. Ej.: "" ⟷ "Guardar" | `body` |
| `tema-innovacion-rural/desktop/51-configuracion-campos.png` | 2 par(es) de controles interactivos superpuestos. Ej.: "" ⟷ "Descartar" | `body` |
| `tema-innovacion-rural/desktop/52-configuracion-campos-modal-nuevo-campo-personalizado.png` | 3 par(es) de controles interactivos superpuestos. Ej.: "" ⟷ "Guardar" | `body` |
| `tema-naturaleza-viva/laptop/11-configuracion-campos.png` | 2 par(es) de controles interactivos superpuestos. Ej.: "" ⟷ "Descartar" | `body` |
| `tema-naturaleza-viva/tablet/03-capacitaciones-bandeja.png` | 3 par(es) de controles interactivos superpuestos. Ej.: "" ⟷ "5103050" | `body` |
| `tema-naturaleza-viva/tablet/11-configuracion-campos.png` | 2 par(es) de controles interactivos superpuestos. Ej.: "— seleccionar —Opción AOpción B" ⟷ "Descartar" | `body` |
| `tema-naturaleza-viva/mobile/03-capacitaciones-bandeja.png` | 3 par(es) de controles interactivos superpuestos. Ej.: "" ⟷ "Siguiente" | `body` |
| `tema-naturaleza-viva/mobile/08-usuarios-gestion.png` | 2 par(es) de controles interactivos superpuestos. Ej.: "" ⟷ "5102050" | `body` |
| `tema-innovacion-rural/laptop/11-configuracion-campos.png` | 2 par(es) de controles interactivos superpuestos. Ej.: "" ⟷ "Descartar" | `body` |
| `tema-innovacion-rural/tablet/03-capacitaciones-bandeja.png` | 3 par(es) de controles interactivos superpuestos. Ej.: "" ⟷ "5103050" | `body` |
| `tema-innovacion-rural/tablet/11-configuracion-campos.png` | 2 par(es) de controles interactivos superpuestos. Ej.: "— seleccionar —Opción AOpción B" ⟷ "Descartar" | `body` |


_… y 8 ocurrencia(s) más (ver `reporte/hallazgos.json`)._


#### Tablas con columnas desalineadas — 13 ocurrencia(s)

| Pantalla | Detalle | Selector |
| --- | --- | --- |
| `tema-naturaleza-viva/desktop/46-usuarios-gestion-modal-reasignar-registro.png` | Desalineación: 6 encabezados frente a 1 celdas en la primera fila. | `div.space-y-4 > div.rounded-xl.ring-1 > div.overflow-auto.max-h-[23vh] > table.w-full.text-left` |
| `tema-naturaleza-viva/desktop/46-usuarios-gestion-modal-reasignar-registro.png` | Desalineación: 6 encabezados frente a 1 celdas en la primera fila. | `div.space-y-4 > div.rounded-xl.ring-1 > div.overflow-auto.max-h-[23vh] > table.w-full.text-left` |
| `tema-innovacion-rural/desktop/46-usuarios-gestion-modal-reasignar-registro.png` | Desalineación: 6 encabezados frente a 1 celdas en la primera fila. | `div.space-y-4 > div.rounded-xl.ring-1 > div.overflow-auto.max-h-[23vh] > table.w-full.text-left` |
| `tema-innovacion-rural/desktop/46-usuarios-gestion-modal-reasignar-registro.png` | Desalineación: 6 encabezados frente a 1 celdas en la primera fila. | `div.space-y-4 > div.rounded-xl.ring-1 > div.overflow-auto.max-h-[23vh] > table.w-full.text-left` |
| `perfiles/jefe-de-area/06-usuarios.png` | Desalineación: 7 encabezados frente a 1 celdas en la primera fila. | `section.p-6.lg:p-8 > div.bg-card.rounded-xl > div.overflow-auto.max-h-[60vh] > table.w-full.text-left` |
| `tema-naturaleza-viva/desktop/56-bandeja-estado-sin-datos.png` | Desalineación: 7 encabezados frente a 1 celdas en la primera fila. | `section.p-6.lg:p-8 > div.bg-card.rounded-xl > div.overflow-auto.max-h-[60vh] > table.w-full.text-left` |
| `tema-naturaleza-viva/desktop/63-usuarios-estado-sin-datos.png` | Desalineación: 7 encabezados frente a 1 celdas en la primera fila. | `section.p-6.lg:p-8 > div.bg-card.rounded-xl > div.overflow-auto.max-h-[60vh] > table.w-full.text-left` |
| `tema-naturaleza-viva/desktop/64-seguimiento-estado-sin-datos.png` | Desalineación: 8 encabezados frente a 1 celdas en la primera fila. | `section.p-4.md:p-8 > div.bg-card.rounded-xl > div.overflow-auto.max-h-[60vh] > table.w-full.text-left` |
| `tema-naturaleza-viva/desktop/78-capacitacion-mensaje-exito-guardado.png` | Desalineación: 5 encabezados frente a 1 celdas en la primera fila. | `div.space-y-4 > div.bg-card.rounded-xl > div.overflow-auto.max-h-[40vh] > table.w-full.text-sm` |
| `tema-innovacion-rural/desktop/56-bandeja-estado-sin-datos.png` | Desalineación: 7 encabezados frente a 1 celdas en la primera fila. | `section.p-6.lg:p-8 > div.bg-card.rounded-xl > div.overflow-auto.max-h-[60vh] > table.w-full.text-left` |
| `tema-innovacion-rural/desktop/62-usuarios-estado-sin-datos.png` | Desalineación: 7 encabezados frente a 1 celdas en la primera fila. | `section.p-6.lg:p-8 > div.bg-card.rounded-xl > div.overflow-auto.max-h-[60vh] > table.w-full.text-left` |
| `tema-innovacion-rural/desktop/64-seguimiento-estado-sin-datos.png` | Desalineación: 8 encabezados frente a 1 celdas en la primera fila. | `section.p-4.md:p-8 > div.bg-card.rounded-xl > div.overflow-auto.max-h-[60vh] > table.w-full.text-left` |


_… y 1 ocurrencia(s) más (ver `reporte/hallazgos.json`)._


#### Iconos SVG sin dimensiones — 4 ocurrencia(s)

| Pantalla | Detalle | Selector |
| --- | --- | --- |
| `tema-naturaleza-viva/tablet/01-login.png` | 1 icono(s) SVG renderizados con ancho o alto 0. | `svg` |
| `tema-naturaleza-viva/mobile/01-login.png` | 1 icono(s) SVG renderizados con ancho o alto 0. | `svg` |
| `tema-innovacion-rural/tablet/01-login.png` | 1 icono(s) SVG renderizados con ancho o alto 0. | `svg` |
| `tema-innovacion-rural/mobile/01-login.png` | 1 icono(s) SVG renderizados con ancho o alto 0. | `svg` |


### Baja prioridad (48)


#### Textos recortados o truncados — 48 ocurrencia(s)

| Pantalla | Detalle | Selector |
| --- | --- | --- |
| `tema-naturaleza-viva/tablet/12-configuracion-reglas.png` | Texto truncado con ellipsis: "Capacitado y Asistido". | `div.space-y-4 > div.grid.grid-cols-3 > div.flex.items-center > span.truncate` |
| `tema-naturaleza-viva/mobile/03-capacitaciones-bandeja.png` | Texto truncado con ellipsis: "Rango de fechas". | `app-date-range-picker > div.relative > button.w-full.bg-card > span.flex-1.truncate` |
| `tema-naturaleza-viva/mobile/10-administracion-listas.png` | Texto truncado con ellipsis: "Fuente de Financiamiento". | `div.ring-1.ring-border > div.divide-y.divide-border > button.w-full.text-left > span.truncate` |
| `tema-naturaleza-viva/mobile/10-administracion-listas.png` | Texto truncado con ellipsis: "Programas Presupuestales". | `div.ring-1.ring-border > div.divide-y.divide-border > button.w-full.text-left > span.truncate` |
| `tema-innovacion-rural/tablet/12-configuracion-reglas.png` | Texto truncado con ellipsis: "Capacitado y Asistido". | `div.space-y-4 > div.grid.grid-cols-3 > div.flex.items-center > span.truncate` |
| `tema-innovacion-rural/mobile/03-capacitaciones-bandeja.png` | Texto truncado con ellipsis: "Rango de fechas". | `app-date-range-picker > div.relative > button.w-full.bg-card > span.flex-1.truncate` |
| `tema-innovacion-rural/mobile/10-administracion-listas.png` | Texto truncado con ellipsis: "Fuente de Financiamiento". | `div.ring-1.ring-border > div.divide-y.divide-border > button.w-full.text-left > span.truncate` |
| `tema-innovacion-rural/mobile/10-administracion-listas.png` | Texto truncado con ellipsis: "Programas Presupuestales". | `div.ring-1.ring-border > div.divide-y.divide-border > button.w-full.text-left > span.truncate` |
| `perfiles/jefe-de-area/01-dashboard-y-menu.png` | Texto truncado con ellipsis: "· Programa de Desarrollo Productivo Agrario Rural". | `button.flex.items-center > div.text-right.hidden > div.text-[11px].text-muted-foreground > span.truncate.max-w-[220px]` |
| `perfiles/jefe-de-area/02-capacitaciones-n1-sin-acceso.png` | Texto truncado con ellipsis: "· Programa de Desarrollo Productivo Agrario Rural". | `button.flex.items-center > div.text-right.hidden > div.text-[11px].text-muted-foreground > span.truncate.max-w-[220px]` |
| `perfiles/jefe-de-area/03-seguimiento-revision-sin-acceso.png` | Texto truncado con ellipsis: "· Programa de Desarrollo Productivo Agrario Rural". | `button.flex.items-center > div.text-right.hidden > div.text-[11px].text-muted-foreground > span.truncate.max-w-[220px]` |
| `perfiles/jefe-de-area/04-seguimiento-aprobacion.png` | Texto truncado con ellipsis: "· Programa de Desarrollo Productivo Agrario Rural". | `button.flex.items-center > div.text-right.hidden > div.text-[11px].text-muted-foreground > span.truncate.max-w-[220px]` |


_… y 36 ocurrencia(s) más (ver `reporte/hallazgos.json`)._


## 4. Consola del navegador

_Sin registros._


## 5. Pasos del recorrido que fallaron

_Sin registros._


## 6. Inventario completo de imágenes


<details><summary><code>capturas/perfiles/administrador-dz/</code> — 10 imágenes</summary>

| Archivo | Pantalla | Tipo | Ruta |
| --- | --- | --- | --- |
| [01-dashboard-y-menu.png](../perfiles/administrador-dz/01-dashboard-y-menu.png) | Administrador DZ_Cap_Asit. · Inicio y menú visible | vista | `/dashboard` |
| [02-capacitaciones-n1-sin-acceso.png](../perfiles/administrador-dz/02-capacitaciones-n1-sin-acceso.png) | Administrador DZ_Cap_Asit. · /capacitaciones-n1 (redirigido a /seguimiento/revision) | error | `/capacitaciones-n1` |
| [03-seguimiento-revision.png](../perfiles/administrador-dz/03-seguimiento-revision.png) | Administrador DZ_Cap_Asit. · /seguimiento/revision | vista | `/seguimiento/revision` |
| [04-seguimiento-aprobacion-sin-acceso.png](../perfiles/administrador-dz/04-seguimiento-aprobacion-sin-acceso.png) | Administrador DZ_Cap_Asit. · /seguimiento/aprobacion (redirigido a /seguimiento/revision) | error | `/seguimiento/aprobacion` |
| [05-reportes.png](../perfiles/administrador-dz/05-reportes.png) | Administrador DZ_Cap_Asit. · /reportes | vista | `/reportes` |
| [06-usuarios.png](../perfiles/administrador-dz/06-usuarios.png) | Administrador DZ_Cap_Asit. · /usuarios | vista | `/usuarios` |
| [07-administracion-listas-sin-acceso.png](../perfiles/administrador-dz/07-administracion-listas-sin-acceso.png) | Administrador DZ_Cap_Asit. · /administracion/listas (redirigido a /seguimiento/revision) | error | `/administracion/listas` |
| [08-configuracion-campos-sin-acceso.png](../perfiles/administrador-dz/08-configuracion-campos-sin-acceso.png) | Administrador DZ_Cap_Asit. · /configuracion/campos (redirigido a /seguimiento/revision) | error | `/configuracion/campos` |
| [09-configuracion-reglas-sin-acceso.png](../perfiles/administrador-dz/09-configuracion-reglas-sin-acceso.png) | Administrador DZ_Cap_Asit. · /configuracion/reglas (redirigido a /seguimiento/revision) | error | `/configuracion/reglas` |
| [10-perfil.png](../perfiles/administrador-dz/10-perfil.png) | Administrador DZ_Cap_Asit. · /perfil | vista | `/perfil` |


</details>


<details><summary><code>capturas/perfiles/administrador-general/</code> — 10 imágenes</summary>

| Archivo | Pantalla | Tipo | Ruta |
| --- | --- | --- | --- |
| [01-dashboard-y-menu.png](../perfiles/administrador-general/01-dashboard-y-menu.png) | Administrador General · Inicio y menú visible | vista | `/dashboard` |
| [02-capacitaciones-n1.png](../perfiles/administrador-general/02-capacitaciones-n1.png) | Administrador General · /capacitaciones-n1 | vista | `/capacitaciones-n1` |
| [03-seguimiento-revision.png](../perfiles/administrador-general/03-seguimiento-revision.png) | Administrador General · /seguimiento/revision | vista | `/seguimiento/revision` |
| [04-seguimiento-aprobacion.png](../perfiles/administrador-general/04-seguimiento-aprobacion.png) | Administrador General · /seguimiento/aprobacion | vista | `/seguimiento/aprobacion` |
| [05-reportes.png](../perfiles/administrador-general/05-reportes.png) | Administrador General · /reportes | vista | `/reportes` |
| [06-usuarios.png](../perfiles/administrador-general/06-usuarios.png) | Administrador General · /usuarios | vista | `/usuarios` |
| [07-administracion-listas.png](../perfiles/administrador-general/07-administracion-listas.png) | Administrador General · /administracion/listas | vista | `/administracion/listas` |
| [08-configuracion-campos.png](../perfiles/administrador-general/08-configuracion-campos.png) | Administrador General · /configuracion/campos | vista | `/configuracion/campos` |
| [09-configuracion-reglas.png](../perfiles/administrador-general/09-configuracion-reglas.png) | Administrador General · /configuracion/reglas | vista | `/configuracion/reglas` |
| [10-perfil.png](../perfiles/administrador-general/10-perfil.png) | Administrador General · /perfil | vista | `/perfil` |


</details>


<details><summary><code>capturas/perfiles/administrador-ue/</code> — 10 imágenes</summary>

| Archivo | Pantalla | Tipo | Ruta |
| --- | --- | --- | --- |
| [01-dashboard-y-menu.png](../perfiles/administrador-ue/01-dashboard-y-menu.png) | Administrador Unidad Ejecutora(UE) · Inicio y menú visible | vista | `/dashboard` |
| [02-capacitaciones-n1-sin-acceso.png](../perfiles/administrador-ue/02-capacitaciones-n1-sin-acceso.png) | Administrador Unidad Ejecutora(UE) · /capacitaciones-n1 (redirigido a /seguimiento/aprobacion) | error | `/capacitaciones-n1` |
| [03-seguimiento-revision-sin-acceso.png](../perfiles/administrador-ue/03-seguimiento-revision-sin-acceso.png) | Administrador Unidad Ejecutora(UE) · /seguimiento/revision (redirigido a /seguimiento/aprobacion) | error | `/seguimiento/revision` |
| [04-seguimiento-aprobacion.png](../perfiles/administrador-ue/04-seguimiento-aprobacion.png) | Administrador Unidad Ejecutora(UE) · /seguimiento/aprobacion | vista | `/seguimiento/aprobacion` |
| [05-reportes.png](../perfiles/administrador-ue/05-reportes.png) | Administrador Unidad Ejecutora(UE) · /reportes | vista | `/reportes` |
| [06-usuarios.png](../perfiles/administrador-ue/06-usuarios.png) | Administrador Unidad Ejecutora(UE) · /usuarios | vista | `/usuarios` |
| [07-administracion-listas-sin-acceso.png](../perfiles/administrador-ue/07-administracion-listas-sin-acceso.png) | Administrador Unidad Ejecutora(UE) · /administracion/listas (redirigido a /seguimiento/aprobacion) | error | `/administracion/listas` |
| [08-configuracion-campos.png](../perfiles/administrador-ue/08-configuracion-campos.png) | Administrador Unidad Ejecutora(UE) · /configuracion/campos | vista | `/configuracion/campos` |
| [09-configuracion-reglas.png](../perfiles/administrador-ue/09-configuracion-reglas.png) | Administrador Unidad Ejecutora(UE) · /configuracion/reglas | vista | `/configuracion/reglas` |
| [10-perfil.png](../perfiles/administrador-ue/10-perfil.png) | Administrador Unidad Ejecutora(UE) · /perfil | vista | `/perfil` |


</details>


<details><summary><code>capturas/perfiles/jefe-de-area/</code> — 10 imágenes</summary>

| Archivo | Pantalla | Tipo | Ruta |
| --- | --- | --- | --- |
| [01-dashboard-y-menu.png](../perfiles/jefe-de-area/01-dashboard-y-menu.png) | Jefe de Área · Inicio y menú visible | vista | `/dashboard` |
| [02-capacitaciones-n1-sin-acceso.png](../perfiles/jefe-de-area/02-capacitaciones-n1-sin-acceso.png) | Jefe de Área · /capacitaciones-n1 (redirigido a /seguimiento/aprobacion) | error | `/capacitaciones-n1` |
| [03-seguimiento-revision-sin-acceso.png](../perfiles/jefe-de-area/03-seguimiento-revision-sin-acceso.png) | Jefe de Área · /seguimiento/revision (redirigido a /seguimiento/aprobacion) | error | `/seguimiento/revision` |
| [04-seguimiento-aprobacion.png](../perfiles/jefe-de-area/04-seguimiento-aprobacion.png) | Jefe de Área · /seguimiento/aprobacion | vista | `/seguimiento/aprobacion` |
| [05-reportes.png](../perfiles/jefe-de-area/05-reportes.png) | Jefe de Área · /reportes | vista | `/reportes` |
| [06-usuarios.png](../perfiles/jefe-de-area/06-usuarios.png) | Jefe de Área · /usuarios | vista | `/usuarios` |
| [07-administracion-listas-sin-acceso.png](../perfiles/jefe-de-area/07-administracion-listas-sin-acceso.png) | Jefe de Área · /administracion/listas (redirigido a /seguimiento/aprobacion) | error | `/administracion/listas` |
| [08-configuracion-campos-sin-acceso.png](../perfiles/jefe-de-area/08-configuracion-campos-sin-acceso.png) | Jefe de Área · /configuracion/campos (redirigido a /seguimiento/aprobacion) | error | `/configuracion/campos` |
| [09-configuracion-reglas-sin-acceso.png](../perfiles/jefe-de-area/09-configuracion-reglas-sin-acceso.png) | Jefe de Área · /configuracion/reglas (redirigido a /seguimiento/aprobacion) | error | `/configuracion/reglas` |
| [10-perfil.png](../perfiles/jefe-de-area/10-perfil.png) | Jefe de Área · /perfil | vista | `/perfil` |


</details>


<details><summary><code>capturas/perfiles/tecnico-cap-asist/</code> — 10 imágenes</summary>

| Archivo | Pantalla | Tipo | Ruta |
| --- | --- | --- | --- |
| [01-dashboard-y-menu.png](../perfiles/tecnico-cap-asist/01-dashboard-y-menu.png) | Técnico Capacitación y Asistencia Técnica · Inicio y menú visible | vista | `/dashboard` |
| [02-capacitaciones-n1.png](../perfiles/tecnico-cap-asist/02-capacitaciones-n1.png) | Técnico Capacitación y Asistencia Técnica · /capacitaciones-n1 | vista | `/capacitaciones-n1` |
| [03-seguimiento-revision-sin-acceso.png](../perfiles/tecnico-cap-asist/03-seguimiento-revision-sin-acceso.png) | Técnico Capacitación y Asistencia Técnica · /seguimiento/revision (redirigido a /capacitaciones-n1) | error | `/seguimiento/revision` |
| [04-seguimiento-aprobacion-sin-acceso.png](../perfiles/tecnico-cap-asist/04-seguimiento-aprobacion-sin-acceso.png) | Técnico Capacitación y Asistencia Técnica · /seguimiento/aprobacion (redirigido a /capacitaciones-n1) | error | `/seguimiento/aprobacion` |
| [05-reportes-sin-acceso.png](../perfiles/tecnico-cap-asist/05-reportes-sin-acceso.png) | Técnico Capacitación y Asistencia Técnica · /reportes (redirigido a /capacitaciones-n1) | error | `/reportes` |
| [06-usuarios-sin-acceso.png](../perfiles/tecnico-cap-asist/06-usuarios-sin-acceso.png) | Técnico Capacitación y Asistencia Técnica · /usuarios (redirigido a /capacitaciones-n1) | error | `/usuarios` |
| [07-administracion-listas-sin-acceso.png](../perfiles/tecnico-cap-asist/07-administracion-listas-sin-acceso.png) | Técnico Capacitación y Asistencia Técnica · /administracion/listas (redirigido a /capacitaciones-n1) | error | `/administracion/listas` |
| [08-configuracion-campos-sin-acceso.png](../perfiles/tecnico-cap-asist/08-configuracion-campos-sin-acceso.png) | Técnico Capacitación y Asistencia Técnica · /configuracion/campos (redirigido a /capacitaciones-n1) | error | `/configuracion/campos` |
| [09-configuracion-reglas-sin-acceso.png](../perfiles/tecnico-cap-asist/09-configuracion-reglas-sin-acceso.png) | Técnico Capacitación y Asistencia Técnica · /configuracion/reglas (redirigido a /capacitaciones-n1) | error | `/configuracion/reglas` |
| [10-perfil.png](../perfiles/tecnico-cap-asist/10-perfil.png) | Técnico Capacitación y Asistencia Técnica · /perfil | vista | `/perfil` |


</details>


<details><summary><code>capturas/tema-innovacion-rural/desktop/</code> — 75 imágenes</summary>

| Archivo | Pantalla | Tipo | Ruta |
| --- | --- | --- | --- |
| [01-login.png](../tema-innovacion-rural/desktop/01-login.png) | Inicio de sesión | formulario | `/auth` |
| [02-login-modal-recuperar-clave.png](../tema-innovacion-rural/desktop/02-login-modal-recuperar-clave.png) | Modal · Recuperar contraseña | modal | `/auth` |
| [03-login-modal-recuperar-enviado.png](../tema-innovacion-rural/desktop/03-login-modal-recuperar-enviado.png) | Modal · Recuperar contraseña (éxito) | modal | `/auth` |
| [04-login-modal-seleccion-perfil.png](../tema-innovacion-rural/desktop/04-login-modal-seleccion-perfil.png) | Modal · Selección de perfil de ingreso | modal | `/auth` |
| [05-modal-info.png](../tema-innovacion-rural/desktop/05-modal-info.png) | Modal · Información | modal | `/dashboard` |
| [06-modal-advertencia.png](../tema-innovacion-rural/desktop/06-modal-advertencia.png) | Modal · Advertencia | modal | `/dashboard` |
| [07-modal-confirmacion.png](../tema-innovacion-rural/desktop/07-modal-confirmacion.png) | Modal · Confirmación | modal | `/dashboard` |
| [08-modal-exito.png](../tema-innovacion-rural/desktop/08-modal-exito.png) | Modal · Éxito | modal | `/dashboard` |
| [09-modal-error.png](../tema-innovacion-rural/desktop/09-modal-error.png) | Modal · Error | modal | `/dashboard` |
| [10-modal-vacio.png](../tema-innovacion-rural/desktop/10-modal-vacio.png) | Modal · Vacío (sin contenido) | modal | `/dashboard` |
| [11-toast-exito.png](../tema-innovacion-rural/desktop/11-toast-exito.png) | Toast · Éxito | componente | `/dashboard` |
| [12-toast-info.png](../tema-innovacion-rural/desktop/12-toast-info.png) | Toast · Información | componente | `/dashboard` |
| [13-toast-advertencia.png](../tema-innovacion-rural/desktop/13-toast-advertencia.png) | Toast · Advertencia | componente | `/dashboard` |
| [14-toast-error.png](../tema-innovacion-rural/desktop/14-toast-error.png) | Toast · Error | componente | `/dashboard` |
| [15-layout-sidebar-expandido.png](../tema-innovacion-rural/desktop/15-layout-sidebar-expandido.png) | Sidebar expandido | componente | `/dashboard` |
| [16-layout-sidebar-colapsado.png](../tema-innovacion-rural/desktop/16-layout-sidebar-colapsado.png) | Sidebar contraído | componente | `/dashboard` |
| [17-layout-sidebar-grupos-abiertos.png](../tema-innovacion-rural/desktop/17-layout-sidebar-grupos-abiertos.png) | Sidebar · grupos desplegados | componente | `/dashboard` |
| [18-layout-panel-apariencia.png](../tema-innovacion-rural/desktop/18-layout-panel-apariencia.png) | Panel de apariencia (selector de temas) | componente | `/dashboard` |
| [19-dashboard.png](../tema-innovacion-rural/desktop/19-dashboard.png) | Inicio / Dashboard | vista | `/dashboard` |
| [20-capacitaciones-editar-paso2.png](../tema-innovacion-rural/desktop/20-capacitaciones-editar-paso2.png) | Capacitaciones N1 · Edición (Paso 2 · Participantes) | formulario | `/capacitaciones-n1/1?paso=2` |
| [21-reportes.png](../tema-innovacion-rural/desktop/21-reportes.png) | Reportes | vista | `/reportes` |
| [22-perfil.png](../tema-innovacion-rural/desktop/22-perfil.png) | Mi perfil | vista | `/perfil` |
| [23-error-404.png](../tema-innovacion-rural/desktop/23-error-404.png) | Error 404 · Página no encontrada | error | `/ruta-que-no-existe` |
| [24-capacitaciones-bandeja.png](../tema-innovacion-rural/desktop/24-capacitaciones-bandeja.png) | Capacitaciones N1 · Bandeja | tabla | `/capacitaciones-n1` |
| [25-capacitaciones-bandeja-columnas.png](../tema-innovacion-rural/desktop/25-capacitaciones-bandeja-columnas.png) | Bandeja · Selector de columnas | componente | `/capacitaciones-n1` |
| [26-capacitaciones-bandeja-fechas.png](../tema-innovacion-rural/desktop/26-capacitaciones-bandeja-fechas.png) | Bandeja · Rango de fechas | componente | `/capacitaciones-n1` |
| [27-capacitaciones-bandeja-modal-rango-de-fechas.png](../tema-innovacion-rural/desktop/27-capacitaciones-bandeja-modal-rango-de-fechas.png) | Capacitaciones N1 · Bandeja | modal | `/capacitaciones-n1` |
| [28-capacitaciones-bandeja-modal-descargar-sustento.png](../tema-innovacion-rural/desktop/28-capacitaciones-bandeja-modal-descargar-sustento.png) | Capacitaciones N1 · Bandeja | modal | `/capacitaciones-n1` |
| [29-capacitaciones-bandeja-modal-adjuntar-sustento.png](../tema-innovacion-rural/desktop/29-capacitaciones-bandeja-modal-adjuntar-sustento.png) | Capacitaciones N1 · Bandeja | modal | `/capacitaciones-n1` |
| [30-capacitaciones-editar-paso1.png](../tema-innovacion-rural/desktop/30-capacitaciones-editar-paso1.png) | Capacitaciones N1 · Edición (Paso 1 · Datos del curso) | formulario | `/capacitaciones-n1/1?paso=1` |
| [31-capacitaciones-nuevo-paso1.png](../tema-innovacion-rural/desktop/31-capacitaciones-nuevo-paso1.png) | Capacitaciones N1 · Nuevo (Paso 1) | formulario | `/capacitaciones-n1/nuevo` |
| [32-capacitaciones-editar-paso3.png](../tema-innovacion-rural/desktop/32-capacitaciones-editar-paso3.png) | Capacitaciones N1 · Edición (Paso 3 · Sustento y cierre) | formulario | `/capacitaciones-n1/1?paso=3` |
| [33-seguimiento-revision.png](../tema-innovacion-rural/desktop/33-seguimiento-revision.png) | Seguimiento · Revisión | tabla | `/seguimiento/revision` |
| [34-seguimiento-revision-modal-descargar-sustento.png](../tema-innovacion-rural/desktop/34-seguimiento-revision-modal-descargar-sustento.png) | Seguimiento · Revisión | modal | `/seguimiento/revision` |
| [35-seguimiento-revision-modal-ver-observaciones.png](../tema-innovacion-rural/desktop/35-seguimiento-revision-modal-ver-observaciones.png) | Seguimiento · Revisión | modal | `/seguimiento/revision` |
| [36-seguimiento-aprobacion.png](../tema-innovacion-rural/desktop/36-seguimiento-aprobacion.png) | Seguimiento · Aprobación | tabla | `/seguimiento/aprobacion` |
| [37-seguimiento-aprobacion-modal-descargar-sustento.png](../tema-innovacion-rural/desktop/37-seguimiento-aprobacion-modal-descargar-sustento.png) | Seguimiento · Aprobación | modal | `/seguimiento/aprobacion` |
| [38-seguimiento-aprobacion-modal-ver-observaciones.png](../tema-innovacion-rural/desktop/38-seguimiento-aprobacion-modal-ver-observaciones.png) | Seguimiento · Aprobación | modal | `/seguimiento/aprobacion` |
| [39-administracion-listas.png](../tema-innovacion-rural/desktop/39-administracion-listas.png) | Administración · Listas | tabla | `/administracion/listas` |
| [40-administracion-listas-modal-nueva-opcion.png](../tema-innovacion-rural/desktop/40-administracion-listas-modal-nueva-opcion.png) | Administración · Listas | modal | `/administracion/listas` |
| [41-administracion-listas-modal-editar-opcion.png](../tema-innovacion-rural/desktop/41-administracion-listas-modal-editar-opcion.png) | Administración · Listas | modal | `/administracion/listas` |
| [42-administracion-listas-modal-inhabilitar-opcion.png](../tema-innovacion-rural/desktop/42-administracion-listas-modal-inhabilitar-opcion.png) | Administración · Listas | modal | `/administracion/listas` |
| [43-usuarios-gestion.png](../tema-innovacion-rural/desktop/43-usuarios-gestion.png) | Administración · Gestión de Usuarios | tabla | `/usuarios` |
| [44-usuarios-gestion-modal-columnas-7.png](../tema-innovacion-rural/desktop/44-usuarios-gestion-modal-columnas-7.png) | Administración · Gestión de Usuarios | modal | `/usuarios` |
| [45-usuarios-gestion-modal-cambiar-estado.png](../tema-innovacion-rural/desktop/45-usuarios-gestion-modal-cambiar-estado.png) | Administración · Gestión de Usuarios | modal | `/usuarios` |
| [46-usuarios-gestion-modal-reasignar-registro.png](../tema-innovacion-rural/desktop/46-usuarios-gestion-modal-reasignar-registro.png) | Administración · Gestión de Usuarios | modal | `/usuarios` |
| [47-usuarios-nuevo.png](../tema-innovacion-rural/desktop/47-usuarios-nuevo.png) | Administración · Nuevo usuario | formulario | `/usuarios/nuevo` |
| [48-usuarios-nuevo-tab-permisos.png](../tema-innovacion-rural/desktop/48-usuarios-nuevo-tab-permisos.png) | Nuevo usuario · Pestaña Permisos | componente | `/usuarios/nuevo` |
| [49-usuarios-nuevo-tab-periodos.png](../tema-innovacion-rural/desktop/49-usuarios-nuevo-tab-periodos.png) | Nuevo usuario · Pestaña Periodos | componente | `/usuarios/nuevo` |
| [50-configuracion-reglas.png](../tema-innovacion-rural/desktop/50-configuracion-reglas.png) | Configuración · Reglas | formulario | `/configuracion/reglas` |
| [51-configuracion-campos.png](../tema-innovacion-rural/desktop/51-configuracion-campos.png) | Configuración · Campos | tabla | `/configuracion/campos` |
| [52-configuracion-campos-modal-nuevo-campo-personalizado.png](../tema-innovacion-rural/desktop/52-configuracion-campos-modal-nuevo-campo-personalizado.png) | Configuración · Campos | modal | `/configuracion/campos` |
| [53-usuarios-editar.png](../tema-innovacion-rural/desktop/53-usuarios-editar.png) | Administración · Edición de usuario | formulario | `/usuarios/demo-qa-1` |
| [54-usuarios-editar-tab-permisos.png](../tema-innovacion-rural/desktop/54-usuarios-editar-tab-permisos.png) | Edición de usuario · Pestaña Permisos | componente | `/usuarios/demo-qa-1` |
| [55-bandeja-estado-con-datos.png](../tema-innovacion-rural/desktop/55-bandeja-estado-con-datos.png) | Bandeja · Tabla con datos (estado inicial) | tabla | `/capacitaciones-n1` |
| [56-bandeja-estado-sin-datos.png](../tema-innovacion-rural/desktop/56-bandeja-estado-sin-datos.png) | Bandeja · Estado vacío (sin resultados para el filtro) | tabla | `/capacitaciones-n1` |
| [57-bandeja-filtro-estado-aplicado.png](../tema-innovacion-rural/desktop/57-bandeja-filtro-estado-aplicado.png) | Bandeja · Filtro por estado aplicado | tabla | `/capacitaciones-n1` |
| [58-bandeja-paginacion-pagina-2.png](../tema-innovacion-rural/desktop/58-bandeja-paginacion-pagina-2.png) | Bandeja · Paginación (página 2) | tabla | `/capacitaciones-n1` |
| [59-bandeja-paginacion-50-registros.png](../tema-innovacion-rural/desktop/59-bandeja-paginacion-50-registros.png) | Bandeja · Paginación a 50 registros por página | tabla | `/capacitaciones-n1` |
| [60-bandeja-calendario-rango-fechas.png](../tema-innovacion-rural/desktop/60-bandeja-calendario-rango-fechas.png) | Bandeja · Calendario de rango de fechas abierto | componente | `/capacitaciones-n1` |
| [61-usuarios-selector-columnas.png](../tema-innovacion-rural/desktop/61-usuarios-selector-columnas.png) | Gestión de Usuarios · Selector de columnas desplegado | componente | `/usuarios` |
| [62-usuarios-estado-sin-datos.png](../tema-innovacion-rural/desktop/62-usuarios-estado-sin-datos.png) | Gestión de Usuarios · Estado vacío (sin coincidencias) | tabla | `/usuarios` |
| [63-usuario-formulario-vacio.png](../tema-innovacion-rural/desktop/63-usuario-formulario-vacio.png) | Nuevo usuario · Formulario vacío | formulario | `/usuarios/nuevo` |
| [64-seguimiento-estado-sin-datos.png](../tema-innovacion-rural/desktop/64-seguimiento-estado-sin-datos.png) | Seguimiento · Estado vacío (sin coincidencias) | tabla | `/seguimiento/revision` |
| [65-usuario-validacion-dni-invalido.png](../tema-innovacion-rural/desktop/65-usuario-validacion-dni-invalido.png) | Nuevo usuario · Validación de DNI inválido (modal de error) | modal | `/usuarios/nuevo` |
| [66-usuario-estado-carga-reniec.png](../tema-innovacion-rural/desktop/66-usuario-estado-carga-reniec.png) | Nuevo usuario · Estado de carga (consulta RENIEC en curso) | componente | `/usuarios/nuevo` |
| [67-usuario-mensaje-exito-reniec.png](../tema-innovacion-rural/desktop/67-usuario-mensaje-exito-reniec.png) | Nuevo usuario · Mensaje de éxito (datos recuperados de RENIEC) | modal | `/usuarios/nuevo` |
| [68-usuario-formulario-con-datos.png](../tema-innovacion-rural/desktop/68-usuario-formulario-con-datos.png) | Nuevo usuario · Formulario con datos cargados | formulario | `/usuarios/nuevo` |
| [69-usuario-validacion-guardar-incompleto.png](../tema-innovacion-rural/desktop/69-usuario-validacion-guardar-incompleto.png) | Nuevo usuario · Validación al guardar con datos incompletos | modal | `/usuarios/nuevo` |
| [70-capacitacion-formulario-vacio.png](../tema-innovacion-rural/desktop/70-capacitacion-formulario-vacio.png) | Nueva capacitación · Formulario vacío (Paso 1) | formulario | `/capacitaciones-n1/nuevo` |
| [71-capacitacion-validacion-guardar-vacio.png](../tema-innovacion-rural/desktop/71-capacitacion-validacion-guardar-vacio.png) | Nueva capacitación · Validación al guardar sin completar | modal | `/capacitaciones-n1/nuevo` |
| [72-capacitacion-formulario-con-datos.png](../tema-innovacion-rural/desktop/72-capacitacion-formulario-con-datos.png) | Nueva capacitación · Formulario con datos | formulario | `/capacitaciones-n1/nuevo` |
| [73-listas-modal-nueva-opcion-con-datos.png](../tema-innovacion-rural/desktop/73-listas-modal-nueva-opcion-con-datos.png) | Listas · Modal de nueva opción con datos | modal | `/administracion/listas` |
| [74-campos-modal-nuevo-con-datos.png](../tema-innovacion-rural/desktop/74-campos-modal-nuevo-con-datos.png) | Configuración de campos · Modal de campo personalizado con datos | modal | `/configuracion/campos` |
| [75-capacitacion-mensaje-exito-guardado.png](../tema-innovacion-rural/desktop/75-capacitacion-mensaje-exito-guardado.png) | Nueva capacitación · Mensaje de éxito al guardar | modal | `/capacitaciones-n1/nuevo` |


</details>


<details><summary><code>capturas/tema-innovacion-rural/laptop/</code> — 14 imágenes</summary>

| Archivo | Pantalla | Tipo | Ruta |
| --- | --- | --- | --- |
| [01-login.png](../tema-innovacion-rural/laptop/01-login.png) | Inicio de sesión | formulario | `/auth` |
| [02-dashboard.png](../tema-innovacion-rural/laptop/02-dashboard.png) | Inicio / Dashboard | vista | `/dashboard` |
| [03-capacitaciones-bandeja.png](../tema-innovacion-rural/laptop/03-capacitaciones-bandeja.png) | Capacitaciones N1 · Bandeja | tabla | `/capacitaciones-n1` |
| [04-capacitaciones-nuevo-paso1.png](../tema-innovacion-rural/laptop/04-capacitaciones-nuevo-paso1.png) | Capacitaciones N1 · Nuevo (Paso 1) | formulario | `/capacitaciones-n1/nuevo` |
| [05-seguimiento-revision.png](../tema-innovacion-rural/laptop/05-seguimiento-revision.png) | Seguimiento · Revisión | tabla | `/seguimiento/revision` |
| [06-seguimiento-aprobacion.png](../tema-innovacion-rural/laptop/06-seguimiento-aprobacion.png) | Seguimiento · Aprobación | tabla | `/seguimiento/aprobacion` |
| [07-reportes.png](../tema-innovacion-rural/laptop/07-reportes.png) | Reportes | vista | `/reportes` |
| [08-usuarios-gestion.png](../tema-innovacion-rural/laptop/08-usuarios-gestion.png) | Administración · Gestión de Usuarios | tabla | `/usuarios` |
| [09-usuarios-nuevo.png](../tema-innovacion-rural/laptop/09-usuarios-nuevo.png) | Administración · Nuevo usuario | formulario | `/usuarios/nuevo` |
| [10-administracion-listas.png](../tema-innovacion-rural/laptop/10-administracion-listas.png) | Administración · Listas | tabla | `/administracion/listas` |
| [11-configuracion-campos.png](../tema-innovacion-rural/laptop/11-configuracion-campos.png) | Configuración · Campos | tabla | `/configuracion/campos` |
| [12-configuracion-reglas.png](../tema-innovacion-rural/laptop/12-configuracion-reglas.png) | Configuración · Reglas | formulario | `/configuracion/reglas` |
| [13-perfil.png](../tema-innovacion-rural/laptop/13-perfil.png) | Mi perfil | vista | `/perfil` |
| [14-error-404.png](../tema-innovacion-rural/laptop/14-error-404.png) | Error 404 · Página no encontrada | error | `/ruta-que-no-existe` |


</details>


<details><summary><code>capturas/tema-innovacion-rural/mobile/</code> — 14 imágenes</summary>

| Archivo | Pantalla | Tipo | Ruta |
| --- | --- | --- | --- |
| [01-login.png](../tema-innovacion-rural/mobile/01-login.png) | Inicio de sesión | formulario | `/auth` |
| [02-dashboard.png](../tema-innovacion-rural/mobile/02-dashboard.png) | Inicio / Dashboard | vista | `/dashboard` |
| [03-capacitaciones-bandeja.png](../tema-innovacion-rural/mobile/03-capacitaciones-bandeja.png) | Capacitaciones N1 · Bandeja | tabla | `/capacitaciones-n1` |
| [04-capacitaciones-nuevo-paso1.png](../tema-innovacion-rural/mobile/04-capacitaciones-nuevo-paso1.png) | Capacitaciones N1 · Nuevo (Paso 1) | formulario | `/capacitaciones-n1/nuevo` |
| [05-seguimiento-revision.png](../tema-innovacion-rural/mobile/05-seguimiento-revision.png) | Seguimiento · Revisión | tabla | `/seguimiento/revision` |
| [06-seguimiento-aprobacion.png](../tema-innovacion-rural/mobile/06-seguimiento-aprobacion.png) | Seguimiento · Aprobación | tabla | `/seguimiento/aprobacion` |
| [07-reportes.png](../tema-innovacion-rural/mobile/07-reportes.png) | Reportes | vista | `/reportes` |
| [08-usuarios-gestion.png](../tema-innovacion-rural/mobile/08-usuarios-gestion.png) | Administración · Gestión de Usuarios | tabla | `/usuarios` |
| [09-usuarios-nuevo.png](../tema-innovacion-rural/mobile/09-usuarios-nuevo.png) | Administración · Nuevo usuario | formulario | `/usuarios/nuevo` |
| [10-administracion-listas.png](../tema-innovacion-rural/mobile/10-administracion-listas.png) | Administración · Listas | tabla | `/administracion/listas` |
| [11-configuracion-campos.png](../tema-innovacion-rural/mobile/11-configuracion-campos.png) | Configuración · Campos | tabla | `/configuracion/campos` |
| [12-configuracion-reglas.png](../tema-innovacion-rural/mobile/12-configuracion-reglas.png) | Configuración · Reglas | formulario | `/configuracion/reglas` |
| [13-perfil.png](../tema-innovacion-rural/mobile/13-perfil.png) | Mi perfil | vista | `/perfil` |
| [14-error-404.png](../tema-innovacion-rural/mobile/14-error-404.png) | Error 404 · Página no encontrada | error | `/ruta-que-no-existe` |


</details>


<details><summary><code>capturas/tema-innovacion-rural/tablet/</code> — 14 imágenes</summary>

| Archivo | Pantalla | Tipo | Ruta |
| --- | --- | --- | --- |
| [01-login.png](../tema-innovacion-rural/tablet/01-login.png) | Inicio de sesión | formulario | `/auth` |
| [02-dashboard.png](../tema-innovacion-rural/tablet/02-dashboard.png) | Inicio / Dashboard | vista | `/dashboard` |
| [03-capacitaciones-bandeja.png](../tema-innovacion-rural/tablet/03-capacitaciones-bandeja.png) | Capacitaciones N1 · Bandeja | tabla | `/capacitaciones-n1` |
| [04-capacitaciones-nuevo-paso1.png](../tema-innovacion-rural/tablet/04-capacitaciones-nuevo-paso1.png) | Capacitaciones N1 · Nuevo (Paso 1) | formulario | `/capacitaciones-n1/nuevo` |
| [05-seguimiento-revision.png](../tema-innovacion-rural/tablet/05-seguimiento-revision.png) | Seguimiento · Revisión | tabla | `/seguimiento/revision` |
| [06-seguimiento-aprobacion.png](../tema-innovacion-rural/tablet/06-seguimiento-aprobacion.png) | Seguimiento · Aprobación | tabla | `/seguimiento/aprobacion` |
| [07-reportes.png](../tema-innovacion-rural/tablet/07-reportes.png) | Reportes | vista | `/reportes` |
| [08-usuarios-gestion.png](../tema-innovacion-rural/tablet/08-usuarios-gestion.png) | Administración · Gestión de Usuarios | tabla | `/usuarios` |
| [09-usuarios-nuevo.png](../tema-innovacion-rural/tablet/09-usuarios-nuevo.png) | Administración · Nuevo usuario | formulario | `/usuarios/nuevo` |
| [10-administracion-listas.png](../tema-innovacion-rural/tablet/10-administracion-listas.png) | Administración · Listas | tabla | `/administracion/listas` |
| [11-configuracion-campos.png](../tema-innovacion-rural/tablet/11-configuracion-campos.png) | Configuración · Campos | tabla | `/configuracion/campos` |
| [12-configuracion-reglas.png](../tema-innovacion-rural/tablet/12-configuracion-reglas.png) | Configuración · Reglas | formulario | `/configuracion/reglas` |
| [13-perfil.png](../tema-innovacion-rural/tablet/13-perfil.png) | Mi perfil | vista | `/perfil` |
| [14-error-404.png](../tema-innovacion-rural/tablet/14-error-404.png) | Error 404 · Página no encontrada | error | `/ruta-que-no-existe` |


</details>


<details><summary><code>capturas/tema-naturaleza-viva/desktop/</code> — 75 imágenes</summary>

| Archivo | Pantalla | Tipo | Ruta |
| --- | --- | --- | --- |
| [01-login.png](../tema-naturaleza-viva/desktop/01-login.png) | Inicio de sesión | formulario | `/auth` |
| [02-login-modal-recuperar-clave.png](../tema-naturaleza-viva/desktop/02-login-modal-recuperar-clave.png) | Modal · Recuperar contraseña | modal | `/auth` |
| [03-login-modal-recuperar-enviado.png](../tema-naturaleza-viva/desktop/03-login-modal-recuperar-enviado.png) | Modal · Recuperar contraseña (éxito) | modal | `/auth` |
| [04-login-modal-seleccion-perfil.png](../tema-naturaleza-viva/desktop/04-login-modal-seleccion-perfil.png) | Modal · Selección de perfil de ingreso | modal | `/auth` |
| [05-modal-info.png](../tema-naturaleza-viva/desktop/05-modal-info.png) | Modal · Información | modal | `/dashboard` |
| [06-modal-advertencia.png](../tema-naturaleza-viva/desktop/06-modal-advertencia.png) | Modal · Advertencia | modal | `/dashboard` |
| [07-modal-confirmacion.png](../tema-naturaleza-viva/desktop/07-modal-confirmacion.png) | Modal · Confirmación | modal | `/dashboard` |
| [08-modal-exito.png](../tema-naturaleza-viva/desktop/08-modal-exito.png) | Modal · Éxito | modal | `/dashboard` |
| [09-modal-error.png](../tema-naturaleza-viva/desktop/09-modal-error.png) | Modal · Error | modal | `/dashboard` |
| [10-modal-vacio.png](../tema-naturaleza-viva/desktop/10-modal-vacio.png) | Modal · Vacío (sin contenido) | modal | `/dashboard` |
| [11-toast-exito.png](../tema-naturaleza-viva/desktop/11-toast-exito.png) | Toast · Éxito | componente | `/dashboard` |
| [12-toast-info.png](../tema-naturaleza-viva/desktop/12-toast-info.png) | Toast · Información | componente | `/dashboard` |
| [13-toast-advertencia.png](../tema-naturaleza-viva/desktop/13-toast-advertencia.png) | Toast · Advertencia | componente | `/dashboard` |
| [14-toast-error.png](../tema-naturaleza-viva/desktop/14-toast-error.png) | Toast · Error | componente | `/dashboard` |
| [15-layout-sidebar-expandido.png](../tema-naturaleza-viva/desktop/15-layout-sidebar-expandido.png) | Sidebar expandido | componente | `/dashboard` |
| [16-layout-sidebar-colapsado.png](../tema-naturaleza-viva/desktop/16-layout-sidebar-colapsado.png) | Sidebar contraído | componente | `/dashboard` |
| [17-layout-sidebar-grupos-abiertos.png](../tema-naturaleza-viva/desktop/17-layout-sidebar-grupos-abiertos.png) | Sidebar · grupos desplegados | componente | `/dashboard` |
| [18-layout-panel-apariencia.png](../tema-naturaleza-viva/desktop/18-layout-panel-apariencia.png) | Panel de apariencia (selector de temas) | componente | `/dashboard` |
| [19-dashboard.png](../tema-naturaleza-viva/desktop/19-dashboard.png) | Inicio / Dashboard | vista | `/dashboard` |
| [20-reportes.png](../tema-naturaleza-viva/desktop/20-reportes.png) | Reportes | vista | `/reportes` |
| [21-perfil.png](../tema-naturaleza-viva/desktop/21-perfil.png) | Mi perfil | vista | `/perfil` |
| [22-error-404.png](../tema-naturaleza-viva/desktop/22-error-404.png) | Error 404 · Página no encontrada | error | `/ruta-que-no-existe` |
| [23-capacitaciones-bandeja.png](../tema-naturaleza-viva/desktop/23-capacitaciones-bandeja.png) | Capacitaciones N1 · Bandeja | tabla | `/capacitaciones-n1` |
| [24-capacitaciones-bandeja-columnas.png](../tema-naturaleza-viva/desktop/24-capacitaciones-bandeja-columnas.png) | Bandeja · Selector de columnas | componente | `/capacitaciones-n1` |
| [25-capacitaciones-bandeja-fechas.png](../tema-naturaleza-viva/desktop/25-capacitaciones-bandeja-fechas.png) | Bandeja · Rango de fechas | componente | `/capacitaciones-n1` |
| [26-capacitaciones-bandeja-modal-rango-de-fechas.png](../tema-naturaleza-viva/desktop/26-capacitaciones-bandeja-modal-rango-de-fechas.png) | Capacitaciones N1 · Bandeja | modal | `/capacitaciones-n1` |
| [27-capacitaciones-bandeja-modal-descargar-sustento.png](../tema-naturaleza-viva/desktop/27-capacitaciones-bandeja-modal-descargar-sustento.png) | Capacitaciones N1 · Bandeja | modal | `/capacitaciones-n1` |
| [28-capacitaciones-bandeja-modal-adjuntar-sustento.png](../tema-naturaleza-viva/desktop/28-capacitaciones-bandeja-modal-adjuntar-sustento.png) | Capacitaciones N1 · Bandeja | modal | `/capacitaciones-n1` |
| [29-capacitaciones-nuevo-paso1.png](../tema-naturaleza-viva/desktop/29-capacitaciones-nuevo-paso1.png) | Capacitaciones N1 · Nuevo (Paso 1) | formulario | `/capacitaciones-n1/nuevo` |
| [30-capacitaciones-editar-paso1.png](../tema-naturaleza-viva/desktop/30-capacitaciones-editar-paso1.png) | Capacitaciones N1 · Edición (Paso 1 · Datos del curso) | formulario | `/capacitaciones-n1/1?paso=1` |
| [31-capacitaciones-editar-paso2.png](../tema-naturaleza-viva/desktop/31-capacitaciones-editar-paso2.png) | Capacitaciones N1 · Edición (Paso 2 · Participantes) | formulario | `/capacitaciones-n1/1?paso=2` |
| [32-capacitaciones-editar-paso3.png](../tema-naturaleza-viva/desktop/32-capacitaciones-editar-paso3.png) | Capacitaciones N1 · Edición (Paso 3 · Sustento y cierre) | formulario | `/capacitaciones-n1/1?paso=3` |
| [33-seguimiento-revision.png](../tema-naturaleza-viva/desktop/33-seguimiento-revision.png) | Seguimiento · Revisión | tabla | `/seguimiento/revision` |
| [34-seguimiento-revision-modal-descargar-sustento.png](../tema-naturaleza-viva/desktop/34-seguimiento-revision-modal-descargar-sustento.png) | Seguimiento · Revisión | modal | `/seguimiento/revision` |
| [35-seguimiento-revision-modal-ver-observaciones.png](../tema-naturaleza-viva/desktop/35-seguimiento-revision-modal-ver-observaciones.png) | Seguimiento · Revisión | modal | `/seguimiento/revision` |
| [36-seguimiento-aprobacion.png](../tema-naturaleza-viva/desktop/36-seguimiento-aprobacion.png) | Seguimiento · Aprobación | tabla | `/seguimiento/aprobacion` |
| [37-seguimiento-aprobacion-modal-descargar-sustento.png](../tema-naturaleza-viva/desktop/37-seguimiento-aprobacion-modal-descargar-sustento.png) | Seguimiento · Aprobación | modal | `/seguimiento/aprobacion` |
| [38-seguimiento-aprobacion-modal-ver-observaciones.png](../tema-naturaleza-viva/desktop/38-seguimiento-aprobacion-modal-ver-observaciones.png) | Seguimiento · Aprobación | modal | `/seguimiento/aprobacion` |
| [39-administracion-listas.png](../tema-naturaleza-viva/desktop/39-administracion-listas.png) | Administración · Listas | tabla | `/administracion/listas` |
| [40-administracion-listas-modal-nueva-opcion.png](../tema-naturaleza-viva/desktop/40-administracion-listas-modal-nueva-opcion.png) | Administración · Listas | modal | `/administracion/listas` |
| [41-administracion-listas-modal-editar-opcion.png](../tema-naturaleza-viva/desktop/41-administracion-listas-modal-editar-opcion.png) | Administración · Listas | modal | `/administracion/listas` |
| [42-administracion-listas-modal-inhabilitar-opcion.png](../tema-naturaleza-viva/desktop/42-administracion-listas-modal-inhabilitar-opcion.png) | Administración · Listas | modal | `/administracion/listas` |
| [43-usuarios-gestion.png](../tema-naturaleza-viva/desktop/43-usuarios-gestion.png) | Administración · Gestión de Usuarios | tabla | `/usuarios` |
| [44-usuarios-gestion-modal-columnas-7.png](../tema-naturaleza-viva/desktop/44-usuarios-gestion-modal-columnas-7.png) | Administración · Gestión de Usuarios | modal | `/usuarios` |
| [45-usuarios-gestion-modal-cambiar-estado.png](../tema-naturaleza-viva/desktop/45-usuarios-gestion-modal-cambiar-estado.png) | Administración · Gestión de Usuarios | modal | `/usuarios` |
| [46-usuarios-gestion-modal-reasignar-registro.png](../tema-naturaleza-viva/desktop/46-usuarios-gestion-modal-reasignar-registro.png) | Administración · Gestión de Usuarios | modal | `/usuarios` |
| [47-usuarios-nuevo.png](../tema-naturaleza-viva/desktop/47-usuarios-nuevo.png) | Administración · Nuevo usuario | formulario | `/usuarios/nuevo` |
| [48-usuarios-nuevo-tab-permisos.png](../tema-naturaleza-viva/desktop/48-usuarios-nuevo-tab-permisos.png) | Nuevo usuario · Pestaña Permisos | componente | `/usuarios/nuevo` |
| [49-usuarios-nuevo-tab-periodos.png](../tema-naturaleza-viva/desktop/49-usuarios-nuevo-tab-periodos.png) | Nuevo usuario · Pestaña Periodos | componente | `/usuarios/nuevo` |
| [50-configuracion-campos.png](../tema-naturaleza-viva/desktop/50-configuracion-campos.png) | Configuración · Campos | tabla | `/configuracion/campos` |
| [51-configuracion-campos-modal-nuevo-campo-personalizado.png](../tema-naturaleza-viva/desktop/51-configuracion-campos-modal-nuevo-campo-personalizado.png) | Configuración · Campos | modal | `/configuracion/campos` |
| [52-configuracion-reglas.png](../tema-naturaleza-viva/desktop/52-configuracion-reglas.png) | Configuración · Reglas | formulario | `/configuracion/reglas` |
| [53-usuarios-editar.png](../tema-naturaleza-viva/desktop/53-usuarios-editar.png) | Administración · Edición de usuario | formulario | `/usuarios/demo-qa-1` |
| [54-usuarios-editar-tab-permisos.png](../tema-naturaleza-viva/desktop/54-usuarios-editar-tab-permisos.png) | Edición de usuario · Pestaña Permisos | componente | `/usuarios/demo-qa-1` |
| [55-bandeja-estado-con-datos.png](../tema-naturaleza-viva/desktop/55-bandeja-estado-con-datos.png) | Bandeja · Tabla con datos (estado inicial) | tabla | `/capacitaciones-n1` |
| [56-bandeja-estado-sin-datos.png](../tema-naturaleza-viva/desktop/56-bandeja-estado-sin-datos.png) | Bandeja · Estado vacío (sin resultados para el filtro) | tabla | `/capacitaciones-n1` |
| [57-bandeja-filtro-estado-aplicado.png](../tema-naturaleza-viva/desktop/57-bandeja-filtro-estado-aplicado.png) | Bandeja · Filtro por estado aplicado | tabla | `/capacitaciones-n1` |
| [58-bandeja-paginacion-pagina-2.png](../tema-naturaleza-viva/desktop/58-bandeja-paginacion-pagina-2.png) | Bandeja · Paginación (página 2) | tabla | `/capacitaciones-n1` |
| [60-bandeja-calendario-rango-fechas.png](../tema-naturaleza-viva/desktop/60-bandeja-calendario-rango-fechas.png) | Bandeja · Calendario de rango de fechas abierto | componente | `/capacitaciones-n1` |
| [61-bandeja-paginacion-50-registros.png](../tema-naturaleza-viva/desktop/61-bandeja-paginacion-50-registros.png) | Bandeja · Paginación a 50 registros por página | tabla | `/capacitaciones-n1` |
| [62-usuarios-selector-columnas.png](../tema-naturaleza-viva/desktop/62-usuarios-selector-columnas.png) | Gestión de Usuarios · Selector de columnas desplegado | componente | `/usuarios` |
| [63-usuarios-estado-sin-datos.png](../tema-naturaleza-viva/desktop/63-usuarios-estado-sin-datos.png) | Gestión de Usuarios · Estado vacío (sin coincidencias) | tabla | `/usuarios` |
| [64-seguimiento-estado-sin-datos.png](../tema-naturaleza-viva/desktop/64-seguimiento-estado-sin-datos.png) | Seguimiento · Estado vacío (sin coincidencias) | tabla | `/seguimiento/revision` |
| [65-usuario-formulario-vacio.png](../tema-naturaleza-viva/desktop/65-usuario-formulario-vacio.png) | Nuevo usuario · Formulario vacío | formulario | `/usuarios/nuevo` |
| [66-usuario-validacion-dni-invalido.png](../tema-naturaleza-viva/desktop/66-usuario-validacion-dni-invalido.png) | Nuevo usuario · Validación de DNI inválido (modal de error) | modal | `/usuarios/nuevo` |
| [67-usuario-estado-carga-reniec.png](../tema-naturaleza-viva/desktop/67-usuario-estado-carga-reniec.png) | Nuevo usuario · Estado de carga (consulta RENIEC en curso) | componente | `/usuarios/nuevo` |
| [68-usuario-mensaje-exito-reniec.png](../tema-naturaleza-viva/desktop/68-usuario-mensaje-exito-reniec.png) | Nuevo usuario · Mensaje de éxito (datos recuperados de RENIEC) | modal | `/usuarios/nuevo` |
| [69-usuario-formulario-con-datos.png](../tema-naturaleza-viva/desktop/69-usuario-formulario-con-datos.png) | Nuevo usuario · Formulario con datos cargados | formulario | `/usuarios/nuevo` |
| [71-capacitacion-formulario-vacio.png](../tema-naturaleza-viva/desktop/71-capacitacion-formulario-vacio.png) | Nueva capacitación · Formulario vacío (Paso 1) | formulario | `/capacitaciones-n1/nuevo` |
| [73-capacitacion-formulario-con-datos.png](../tema-naturaleza-viva/desktop/73-capacitacion-formulario-con-datos.png) | Nueva capacitación · Formulario con datos | formulario | `/capacitaciones-n1/nuevo` |
| [74-usuario-validacion-guardar-incompleto.png](../tema-naturaleza-viva/desktop/74-usuario-validacion-guardar-incompleto.png) | Nuevo usuario · Validación al guardar con datos incompletos | modal | `/usuarios/nuevo` |
| [75-capacitacion-validacion-guardar-vacio.png](../tema-naturaleza-viva/desktop/75-capacitacion-validacion-guardar-vacio.png) | Nueva capacitación · Validación al guardar sin completar | modal | `/capacitaciones-n1/nuevo` |
| [76-listas-modal-nueva-opcion-con-datos.png](../tema-naturaleza-viva/desktop/76-listas-modal-nueva-opcion-con-datos.png) | Listas · Modal de nueva opción con datos | modal | `/administracion/listas` |
| [78-capacitacion-mensaje-exito-guardado.png](../tema-naturaleza-viva/desktop/78-capacitacion-mensaje-exito-guardado.png) | Nueva capacitación · Mensaje de éxito al guardar | modal | `/capacitaciones-n1/nuevo` |
| [79-campos-modal-nuevo-con-datos.png](../tema-naturaleza-viva/desktop/79-campos-modal-nuevo-con-datos.png) | Configuración de campos · Modal de campo personalizado con datos | modal | `/configuracion/campos` |


</details>


<details><summary><code>capturas/tema-naturaleza-viva/laptop/</code> — 14 imágenes</summary>

| Archivo | Pantalla | Tipo | Ruta |
| --- | --- | --- | --- |
| [01-login.png](../tema-naturaleza-viva/laptop/01-login.png) | Inicio de sesión | formulario | `/auth` |
| [02-dashboard.png](../tema-naturaleza-viva/laptop/02-dashboard.png) | Inicio / Dashboard | vista | `/dashboard` |
| [03-capacitaciones-bandeja.png](../tema-naturaleza-viva/laptop/03-capacitaciones-bandeja.png) | Capacitaciones N1 · Bandeja | tabla | `/capacitaciones-n1` |
| [04-capacitaciones-nuevo-paso1.png](../tema-naturaleza-viva/laptop/04-capacitaciones-nuevo-paso1.png) | Capacitaciones N1 · Nuevo (Paso 1) | formulario | `/capacitaciones-n1/nuevo` |
| [05-seguimiento-revision.png](../tema-naturaleza-viva/laptop/05-seguimiento-revision.png) | Seguimiento · Revisión | tabla | `/seguimiento/revision` |
| [06-seguimiento-aprobacion.png](../tema-naturaleza-viva/laptop/06-seguimiento-aprobacion.png) | Seguimiento · Aprobación | tabla | `/seguimiento/aprobacion` |
| [07-reportes.png](../tema-naturaleza-viva/laptop/07-reportes.png) | Reportes | vista | `/reportes` |
| [08-usuarios-gestion.png](../tema-naturaleza-viva/laptop/08-usuarios-gestion.png) | Administración · Gestión de Usuarios | tabla | `/usuarios` |
| [09-usuarios-nuevo.png](../tema-naturaleza-viva/laptop/09-usuarios-nuevo.png) | Administración · Nuevo usuario | formulario | `/usuarios/nuevo` |
| [10-administracion-listas.png](../tema-naturaleza-viva/laptop/10-administracion-listas.png) | Administración · Listas | tabla | `/administracion/listas` |
| [11-configuracion-campos.png](../tema-naturaleza-viva/laptop/11-configuracion-campos.png) | Configuración · Campos | tabla | `/configuracion/campos` |
| [12-configuracion-reglas.png](../tema-naturaleza-viva/laptop/12-configuracion-reglas.png) | Configuración · Reglas | formulario | `/configuracion/reglas` |
| [13-perfil.png](../tema-naturaleza-viva/laptop/13-perfil.png) | Mi perfil | vista | `/perfil` |
| [14-error-404.png](../tema-naturaleza-viva/laptop/14-error-404.png) | Error 404 · Página no encontrada | error | `/ruta-que-no-existe` |


</details>


<details><summary><code>capturas/tema-naturaleza-viva/mobile/</code> — 14 imágenes</summary>

| Archivo | Pantalla | Tipo | Ruta |
| --- | --- | --- | --- |
| [01-login.png](../tema-naturaleza-viva/mobile/01-login.png) | Inicio de sesión | formulario | `/auth` |
| [02-dashboard.png](../tema-naturaleza-viva/mobile/02-dashboard.png) | Inicio / Dashboard | vista | `/dashboard` |
| [03-capacitaciones-bandeja.png](../tema-naturaleza-viva/mobile/03-capacitaciones-bandeja.png) | Capacitaciones N1 · Bandeja | tabla | `/capacitaciones-n1` |
| [04-capacitaciones-nuevo-paso1.png](../tema-naturaleza-viva/mobile/04-capacitaciones-nuevo-paso1.png) | Capacitaciones N1 · Nuevo (Paso 1) | formulario | `/capacitaciones-n1/nuevo` |
| [05-seguimiento-revision.png](../tema-naturaleza-viva/mobile/05-seguimiento-revision.png) | Seguimiento · Revisión | tabla | `/seguimiento/revision` |
| [06-seguimiento-aprobacion.png](../tema-naturaleza-viva/mobile/06-seguimiento-aprobacion.png) | Seguimiento · Aprobación | tabla | `/seguimiento/aprobacion` |
| [07-reportes.png](../tema-naturaleza-viva/mobile/07-reportes.png) | Reportes | vista | `/reportes` |
| [08-usuarios-gestion.png](../tema-naturaleza-viva/mobile/08-usuarios-gestion.png) | Administración · Gestión de Usuarios | tabla | `/usuarios` |
| [09-usuarios-nuevo.png](../tema-naturaleza-viva/mobile/09-usuarios-nuevo.png) | Administración · Nuevo usuario | formulario | `/usuarios/nuevo` |
| [10-administracion-listas.png](../tema-naturaleza-viva/mobile/10-administracion-listas.png) | Administración · Listas | tabla | `/administracion/listas` |
| [11-configuracion-campos.png](../tema-naturaleza-viva/mobile/11-configuracion-campos.png) | Configuración · Campos | tabla | `/configuracion/campos` |
| [12-configuracion-reglas.png](../tema-naturaleza-viva/mobile/12-configuracion-reglas.png) | Configuración · Reglas | formulario | `/configuracion/reglas` |
| [13-perfil.png](../tema-naturaleza-viva/mobile/13-perfil.png) | Mi perfil | vista | `/perfil` |
| [14-error-404.png](../tema-naturaleza-viva/mobile/14-error-404.png) | Error 404 · Página no encontrada | error | `/ruta-que-no-existe` |


</details>


<details><summary><code>capturas/tema-naturaleza-viva/tablet/</code> — 14 imágenes</summary>

| Archivo | Pantalla | Tipo | Ruta |
| --- | --- | --- | --- |
| [01-login.png](../tema-naturaleza-viva/tablet/01-login.png) | Inicio de sesión | formulario | `/auth` |
| [02-dashboard.png](../tema-naturaleza-viva/tablet/02-dashboard.png) | Inicio / Dashboard | vista | `/dashboard` |
| [03-capacitaciones-bandeja.png](../tema-naturaleza-viva/tablet/03-capacitaciones-bandeja.png) | Capacitaciones N1 · Bandeja | tabla | `/capacitaciones-n1` |
| [04-capacitaciones-nuevo-paso1.png](../tema-naturaleza-viva/tablet/04-capacitaciones-nuevo-paso1.png) | Capacitaciones N1 · Nuevo (Paso 1) | formulario | `/capacitaciones-n1/nuevo` |
| [05-seguimiento-revision.png](../tema-naturaleza-viva/tablet/05-seguimiento-revision.png) | Seguimiento · Revisión | tabla | `/seguimiento/revision` |
| [06-seguimiento-aprobacion.png](../tema-naturaleza-viva/tablet/06-seguimiento-aprobacion.png) | Seguimiento · Aprobación | tabla | `/seguimiento/aprobacion` |
| [07-reportes.png](../tema-naturaleza-viva/tablet/07-reportes.png) | Reportes | vista | `/reportes` |
| [08-usuarios-gestion.png](../tema-naturaleza-viva/tablet/08-usuarios-gestion.png) | Administración · Gestión de Usuarios | tabla | `/usuarios` |
| [09-usuarios-nuevo.png](../tema-naturaleza-viva/tablet/09-usuarios-nuevo.png) | Administración · Nuevo usuario | formulario | `/usuarios/nuevo` |
| [10-administracion-listas.png](../tema-naturaleza-viva/tablet/10-administracion-listas.png) | Administración · Listas | tabla | `/administracion/listas` |
| [11-configuracion-campos.png](../tema-naturaleza-viva/tablet/11-configuracion-campos.png) | Configuración · Campos | tabla | `/configuracion/campos` |
| [12-configuracion-reglas.png](../tema-naturaleza-viva/tablet/12-configuracion-reglas.png) | Configuración · Reglas | formulario | `/configuracion/reglas` |
| [13-perfil.png](../tema-naturaleza-viva/tablet/13-perfil.png) | Mi perfil | vista | `/perfil` |
| [14-error-404.png](../tema-naturaleza-viva/tablet/14-error-404.png) | Error 404 · Página no encontrada | error | `/ruta-que-no-existe` |


</details>
