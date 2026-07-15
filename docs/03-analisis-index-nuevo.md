# Informe de Análisis — Integración de `index_nuevo.html` (SODEGA v3.1.2)

**Fecha:** 15/07/2026
**Origen funcional:** `~/Downloads/index_nuevo.html` (6.854 líneas, vanilla JS + Tailwind CDN)
**Base visual y arquitectónica:** proyecto Angular 22 `midagri_app_v3` (standalone components, signals, OnPush, lazy `loadComponent`)

---

## 1. Análisis del proyecto Angular (estado actual)

Arquitectura ya consolidada en migraciones previas (commits `23bcd38` … `c7b24f1`):

| Capa | Implementación |
|---|---|
| Ruteo | `app.routes.ts` — lazy `loadComponent`, `authGuard` + `roleGuard` (canActivateChild) |
| Autenticación | `AuthService` (signals + sessionStorage) con flujo `resolverIngreso()` del prototipo: selección de perfil (Admin General master), selección de OPA (multi-registro), ingreso directo |
| Usuarios | `UsuariosService` (estado en memoria + contratos REST documentados): vigencias, jerarquía de perfiles, RENIEC simulado, derivación de OPA |
| Permisos de menú | Esquema **declarativo** (`permisos-menu.const.ts` según matriz oficial `permisos.xlsx`, grupos Registrar/Visualizar) + `PermisosMenuService`; consumido por sidebar y `roleGuard` |
| Listas | `ListasAdminService` (signals + localStorage `sodega_listas_admin_db_v1`) + pantalla `ListasComponent`; los formularios consumen `opcionesFormulario()` reactivamente |
| Gestión de usuarios | KPIs con filtro, búsqueda, paginación, acciones por iconos, modal Reasignar Registro (transferencia total vía `CursosService`) |
| Formulario de usuario | Reactive Forms multi-pestaña (Datos / Permisos), modos nuevo·editar·presupuesto, ámbitos territoriales, metas por ámbito (Admin DZ → Técnico), RENIEC |
| Design system | Light-only con tokens (`bg-card`, `ring-border`, `bg-primary` teal, `state-*`, `btn-primary/secondary/success`, `INPUT_BASE/REQUIRED/DISABLED`) — **fuente de verdad visual** |

## 2. Análisis del HTML nuevo

`index_nuevo.html` es un superconjunto estricto del prototipo de referencia guardado en
`docs/referencia/sodega-login-permisos.html` (3.250 líneas): conserva todas sus funciones
y agrega ~150 nuevas. Bloques funcionales del HTML:

1. Login + modal selección de perfil/OPA + **modal Recuperar Contraseña** (nuevo)
2. Sidebar dinámico por permisos (Registrar, Consulta, Reporte, Administración, Ejecutivo, Ayuda, Evaluación)
3. Gestión Integral de Usuarios: KPIs (6), grilla con 12 columnas, paginación, dropdown de acciones (Editar / Nueva Presup. / Restablecer clave / **Reasignar Registro** / Cambiar Estado)
4. Formulario multi-pestaña con RENIEC, datos presupuestales (incluye **modo Jefe de Área**), régimen laboral con fechas/OS, ámbito territorial (con **multi-selección de distritos** para Técnicos), **metas DZ→Técnico**, permisos de menú unificados con accordion
5. Administración de Listas (catálogos + opciones con estado, códigos automáticos, **Unidad Funcional ligada a Unidad Responsable**, sincronización con formularios, localStorage)
6. Reasignación de registros con doble grilla origen/destino
7. Perfiles personalizados creados desde la lista "Perfil Autorizado"

## 3. Matriz de diferencias (HTML nuevo vs Angular actual)

| Funcionalidad | Angular | HTML | Cambió | Actualizar | Conservar | Prioridad |
|---|---|---|---|---|---|---|
| Login unificado + selección perfil/OPA | SÍ | SÍ | NO | NO | SÍ | — |
| **Recuperar Contraseña (modal)** | NO | SÍ | — | SÍ | — | Alta |
| Perfil "Administrador Unidad **Ejecutora(UE)**" (renombrado desde "Unidad Organizacional") | NO | SÍ | SÍ | SÍ | — | Alta |
| **Perfiles personalizados** desde lista Perfil Autorizado (login + combo + permisos propios) | NO | SÍ | — | SÍ | — | Media |
| `perfilAutenticado` en sesión (Admin General operando como otro perfil: visibilidad filtrada por perfil, permisos configurables, presupuesto editable) | NO | SÍ | — | SÍ | — | Alta |
| Vigencias, KPIs, paginación, exportación simulada | SÍ | SÍ | NO | NO | SÍ | — |
| Grilla: columna **Unidad Responsable** + **ubigeo textual** (Región/Provincia/Distrito) | PARCIAL | SÍ | SÍ | SÍ | — | Media |
| Acción Reasignar Registro **solo Admin General sobre Técnicos**; destinos de la misma Unidad Responsable/Funcional | PARCIAL | SÍ | SÍ | SÍ | — | Alta |
| RENIEC simulado | SÍ | SÍ | NO | NO | SÍ | — |
| **Usuario generado único** (inicial + apellidos + correlativo, sin colisiones entre DNIs) | NO | SÍ | — | SÍ | — | Alta |
| Validación **vigencia de contrato > 30 días** (OS / CAS Temporal) | NO | SÍ | — | SÍ | — | Alta |
| Modo presupuesto: **fechas y Nro. de Orden no repetidos** por DNI | NO | SÍ | — | SÍ | — | Media |
| Ámbito: Admin UE solo región | SÍ | SÍ | NO | NO | SÍ | — |
| Ámbito: **provincia/distrito opcional** para UE y DZ ("-") | NO | SÍ | — | SÍ | — | Media |
| Ámbito: **multi-selección de distritos** para Técnicos (checkboxes + Seleccionar todos + aviso de duplicados) | NO | SÍ | — | SÍ | — | Alta |
| Metas DZ→Técnico | SÍ (por ámbito, versión mejorada aprobada) | SÍ (2 campos globales) | SÍ | NO | SÍ (versión Angular) | — |
| Presupuesto: cascada Categoría→Programa→Unidad funcional | SÍ | SÍ | NO | NO | SÍ | — |
| **Presupuesto modo Jefe de Área**: 3 columnas, "Categoría" (10 valores), programas/unidades por Unidad Responsable (16 catálogos) | NO | SÍ | — | SÍ | — | Alta |
| **Botón "Registrar Datos Presupuestales" + guardar bloqueado** (Admin General → UE/DZ/Técnico) | NO | SÍ | — | SÍ | — | Media |
| Permisos de menú por perfil (matriz oficial Excel) | SÍ (esquema declarativo, aprobado) | SÍ (checkboxes con data-perm-profile) | SÍ | NO (estructura) | SÍ (matriz Angular) | — |
| Permisos configurables por **flujos jerárquicos** (Jefe→UE, UE→DZ, DZ→Técnico, además del Admin General) | NO | SÍ | — | SÍ | — | Media |
| Administración de Listas (CRUD, estado, códigos, localStorage, sincronización con formularios) | SÍ | SÍ | NO | NO | SÍ | — |
| Lista **"Unidad Funcional" con Unidad Responsable asociada** (campo en la opción, obligatorio en el modal, filtra las OPAS del formulario) | NO | SÍ | — | SÍ | — | Alta |
| Opciones retiradas de Unidad Responsable (depuración) | NO | SÍ | — | SÍ | — | Baja |
| Sidebar por permisos | SÍ | SÍ | NO | NO | SÍ | — |
| Módulos Pastos/Cobertizos, Ejecutivo Dashboard/Visor | NO | Placeholders ocultos/alertas | — | NO (sin funcionalidad real) | — | Baja |

## 4-8. Componentes / servicios / modelos afectados

- **Modelos:** `usuario-sodega.model.ts` (renombrado de perfil, tipo abierto a perfiles personalizados, `calcularDiasCalendarioEntre`), `lista-admin.model.ts` (`OpcionLista.unidadResponsable`), `permisos-menu.model.ts` (sin cambios estructurales).
- **Constantes:** `sodega.const.ts` (+ `PRESUPUESTO_JEFE_AREA` por unidad responsable, `CATEGORIAS_PRESUPUESTALES_JEFE_AREA`), `listas-admin.const.ts` (lista "Unidad Funcional"), `permisos-menu.const.ts` (clave del perfil renombrado, esquema para perfiles personalizados).
- **Servicios:** `AuthService` (`perfilAutenticado`, migración de sesión), `UsuariosService` (`generarUsuarioUnico`, visibilidad por perfil autenticado, perfiles registrables con personalizados), `ListasAdminService` (migraciones de nombre, `unidadesFuncionalesPorUnidadResponsable`, guardado con unidad responsable), `PermisosMenuService` (esquema para personalizados).
- **Componentes:** `login` (recuperar contraseña, perfiles desde lista), `usuario-form` (modo Jefe de Área, multi-distrito, validaciones, botón presupuestal, permisos por flujo), `gestion-usuarios` (gating reasignar, columnas, ubigeo), `reasignar-registro-modal` (destinos restringidos), `listas` (unidad responsable en modal).
- **Utils:** `texto.util.ts` (ya tiene `normalizarNombreCatalogo`), nuevo `formatearUbigeoTexto`.

## 9. Riesgos

1. **Renombrado del perfil UE**: aparece en tipos, guard, sidebar y datos persistidos (sesión y lista Perfil Autorizado en localStorage) → se agregan migraciones al restaurar.
2. **Perfiles personalizados**: el tipo `Perfil` deja de ser unión cerrada; se mantiene autocompletado con `PerfilConocido | (string & {})` y ramas de guard/permiso explícitas.
3. **Divergencias deliberadas del repo** (matriz de permisos del Excel, metas por ámbito, rediseño visual): se **conservan** — el HTML solo aporta lógica donde el repo no la tiene.
4. Catálogos presupuestales Jefe de Área: gran volumen de datos → van en constantes declarativas, sin lógica duplicada (se elimina el patrón esJefeAreaXXX por un mapa por unidad).

## 10. Plan de migración (fases)

1. Renombrado de perfil + migraciones de almacenamiento.
2. Perfiles personalizados + `perfilAutenticado`.
3. Login: Recuperar Contraseña.
4. UsuariosService: usuario único, ubigeo textual.
5. Formulario: validaciones de contrato, multi-distrito, presupuesto Jefe de Área, botón presupuestal, permisos por flujo.
6. Listas: Unidad Funcional ↔ Unidad Responsable.
7. Gestión/Reasignación: gating y columnas.
8. Compilación + verificación en preview.
