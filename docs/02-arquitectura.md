# Documento de Arquitectura — MIDAGRI Angular

**Proyecto:** Sistema de Capacitaciones y Asistencias Técnicas (reconstrucción Angular 22)
**Patrón:** Feature-Based Architecture + Standalone Components + Signals
**Capa visual:** Angular Material 3 (ver §6) · *actualizado el 10/08/2026*

---

## 1. Diagrama de carpetas

```
midagri-angular/
├── .npmrc                      # legacy-peer-deps (@angular/animations pide core 22.1.0 exacto)
├── angular.json                # styles: theme.scss + styles.css
├── package.json
├── docs/
│   ├── 01-analisis.md          # Auditoría del sistema original (React)
│   ├── 02-arquitectura.md      # Este documento
│   ├── 03-analisis-index-nuevo.md
│   └── 04-auditoria-ux-rediseno.md
├── src/
│   ├── index.html              # lang=es, DM Sans / IBM Plex Mono + Material Symbols
│   ├── main.ts                 # bootstrapApplication
│   ├── styles.css              # Normalización base (Material no trae reset)
│   ├── styles/theme.scss       # Sistema de diseño: mat.theme() + convenciones compartidas
│   ├── environments/
│   │   ├── environment.ts      # apiBaseUrl + useMocks (dev)
│   │   └── environment.prod.ts
│   └── app/
│       ├── app.component.ts    # <router-outlet> + <app-theme-switcher>
│       ├── app.config.ts       # provideRouter + provideHttpClient(withInterceptors)
│       ├── app.routes.ts       # Rutas lazy + guards + 404
│       │
│       ├── core/               # Singleton: una sola instancia por app
│       │   ├── guards/
│       │   │   ├── auth.guard.ts        # Sesión activa → si no, /auth
│       │   │   └── role.guard.ts        # Matriz de acceso por rol + fallback
│       │   ├── interceptors/
│       │   │   ├── auth.interceptor.ts  # Bearer token (placeholder JWT)
│       │   │   └── error.interceptor.ts # 401 → logout; resto → toast
│       │   ├── models/                  # Interfaces del dominio
│       │   │   ├── user.model.ts        # User, Rol
│       │   │   ├── usuario-sodega.model.ts # Usuario SODEGA, vigencias, periodos
│       │   │   ├── curso.model.ts       # Curso, EstadoCurso, reglas de ciclo de vida
│       │   │   ├── participante.model.ts# Participante, ProductorBD
│       │   │   ├── area-config.model.ts # AreaConfig, CriterioExito, defaults
│       │   │   ├── campo.model.ts       # CampoPersonalizado, CampoBase, tipos
│       │   │   ├── lista-admin.model.ts # Catálogos maestros y sus opciones
│       │   │   └── permisos-menu.model.ts
│       │   ├── constants/               # areas · catalogos · campos-base · sodega ·
│       │   │                            # listas-admin · permisos-menu · usuarios-demo
│       │   │   └── mock-data.const.ts   # ⚠ Seeds de desarrollo (eliminar con backend)
│       │   └── services/                # Estado global con Signals + mocks CRUD
│       │       ├── auth.service.ts      # login/logout, sesión, computeds por rol
│       │       ├── area.service.ts      # Área activa (persistida en sessionStorage)
│       │       ├── cursos.service.ts    # GET/POST/PUT/PATCH-estado/DELETE
│       │       ├── participantes.service.ts
│       │       ├── campos.service.ts    # Campos dinámicos + visibilidad por área
│       │       ├── reglas.service.ts    # AreaConfig por área
│       │       ├── productores.service.ts # Padrón (búsqueda por DNI)
│       │       ├── usuarios.service.ts  # Gestión integral de usuarios SODEGA
│       │       ├── listas-admin.service.ts # Catálogos maestros (localStorage)
│       │       ├── permisos-menu.service.ts
│       │       ├── theme.service.ts     # Tema activo en <html> + localStorage
│       │       ├── modal.service.ts     # Feedback unificado sobre MatDialog
│       │       └── toast.service.ts     # Notificaciones sobre MatSnackBar
│       │
│       ├── shared/             # Reutilizable, sin estado propio de negocio
│       │   ├── components/
│       │   │   ├── estado-badge/        # Chip semántico de estados
│       │   │   ├── kpi-card/            # Tarjeta KPI de las bandejas
│       │   │   ├── modal/feedback-dialog.component.ts # Diálogo del ModalService
│       │   │   ├── autocomplete/        # Combobox WAI-ARIA
│       │   │   ├── carga-pdf/           # Subida de sustento (PDF ≤ 15 MB)
│       │   │   ├── column-selector/     # Columnas visibles de las grillas
│       │   │   ├── date-range-picker/   # Rango de fechas
│       │   │   ├── observaciones-dialog/# Historial de observaciones
│       │   │   ├── peru-map/            # Mapa SVG del Perú (zoom + pin)
│       │   │   └── theme-switcher/      # "Personalizar apariencia"
│       │   └── utils/
│       │       ├── utm.util.ts          # WGS84 → UTM
│       │       ├── peru-regions.util.ts # Contorno SVG + bboxes por región
│       │       ├── fecha.util.ts        # Edad, formatos dd/mm/yyyy, es-PE
│       │       ├── texto.util.ts        # Normalización de nombres de catálogo
│       │       ├── excel.util.ts        # Exportación a .xls sin dependencias
│       │       └── paginator-intl.es.ts # Etiquetas del paginador en español
│       │
│       ├── features/           # Un directorio por dominio funcional (lazy)
│       │   ├── autenticacion/login.component.ts        # Reactive Forms
│       │   │   └── recuperar-clave · seleccion-ingreso (diálogos)
│       │   ├── dashboard/dashboard.component.ts        # Tarjetas por rol
│       │   ├── capacitaciones/
│       │   │   ├── bandeja/bandeja.component.ts        # KPIs + tabla + filtros
│       │   │   ├── stepper/stepper.component.ts        # Flujo 3 pasos
│       │   │   ├── stepper/declaracion-dialog.component.ts
│       │   │   ├── curso-form/curso-form.component.ts  # Paso 1 (Reactive Forms)
│       │   │   ├── participante-form/…                 # Paso 2 (Reactive Forms + DNI)
│       │   │   ├── resumen-actividad/…                 # Resumen del evento
│       │   │   └── sustento-modal/sustento-dialog.component.ts
│       │   ├── seguimiento/
│       │   │   ├── seguimiento.component.ts            # Selector de modo por rol
│       │   │   ├── seguimiento-panel.component.ts      # Panel compartido DZ/UE
│       │   │   └── observar-dialog.component.ts        # Motivo + fecha
│       │   ├── usuarios/
│       │   │   ├── gestion-usuarios.component.ts       # Grilla + KPIs
│       │   │   ├── usuario-form.component.ts           # Alta/edición por bloques
│       │   │   ├── permisos-menu-form.component.ts
│       │   │   └── datos-presupuestales · reasignar-registro (diálogos)
│       │   ├── configuracion/
│       │   │   ├── campos/campos.component.ts          # Constructor de formularios
│       │   │   ├── campos/campo-dialog.component.ts    # Alta/edición de campo
│       │   │   ├── campos/opciones-dialog.component.ts # Edición de valores (UE)
│       │   │   ├── campos/opciones-editor.component.ts # Editor de valores compartido
│       │   │   ├── campos/campo-preview.component.ts   # Vista previa de un campo
│       │   │   ├── campos/preview-formulario.component.ts # Marco móvil/escritorio
│       │   │   └── reglas/reglas.component.ts          # Configurador de reglas
│       │   ├── administracion/listas/listas.component.ts # Catálogos maestros
│       │   │   └── opcion-dialog.component.ts          # Alta/edición de opción
│       │   ├── reportes/reportes.component.ts
│       │   ├── perfil/perfil.component.ts
│       │   └── errores/not-found.component.ts          # 404
│       │
│       └── layout/
│           ├── shell/shell.component.ts     # mat-sidenav + header + <router-outlet>
│           ├── sidebar/sidebar.component.ts # Menú por rol, colapsable, tooltips
│           └── header/header.component.ts   # Área activa, menú usuario, cambiar clave
└── public/favicon.ico                       # Recursos estáticos servidos tal cual
```

## 2. Relación entre módulos

```
                    ┌─────────────────────────────────────────┐
                    │                 app.routes               │
                    └──────┬───────────────────┬──────────────┘
                     /auth │             (shell)│ authGuard + roleGuard
                           ▼                    ▼
                 features/autenticacion   layout/shell ── sidebar + header
                           │                    │
                           │        ┌───────────┼───────────┬──────────┐
                           │        ▼           ▼           ▼          ▼
                           │   dashboard  capacitaciones seguimiento configuración …
                           │        │           │           │          │
                           └────────┴─────┬─────┴───────────┴──────────┘
                                          ▼
                          core/services (Signals, providedIn: 'root')
                     AuthService · AreaService · CursosService ·
                     ParticipantesService · CamposService · ReglasService ·
                     ProductoresService · UsuariosService · ListasAdminService ·
                     PermisosMenuService · ThemeService · ModalService · ToastService
                                          │
                                          ▼
                     core/constants (catálogos + ⚠ mock-data) → futuro: HttpClient → API REST
```

Reglas de dependencia:
- `features` y `layout` consumen `core` y `shared`; nunca al revés.
- `shared` no importa de `features` ni conoce servicios de dominio (salvo ToastService).
- `core/models` concentra los tipos: cualquier cambio de contrato se hace en un solo lugar.

## 3. Flujo de navegación y control de acceso

```
'' ──► /dashboard ──(sin sesión: authGuard)──► /auth
                                                 │ login()
                                                 ▼
   ┌──────────────────────── roleGuard en cada navegación hija ───────────────────────┐
   │ Administrador General → todas las rutas                                          │
   │ Jefe de Área    → /seguimiento/aprobacion /usuarios /capacitaciones-n1/:id       │
   │ Admin UE        → + /configuracion/**                                            │
   │ Admin DZ_Cap_Asit. → /seguimiento/revision /usuarios /capacitaciones-n1/:id      │
   │ Técnico Cap. y AT  → /capacitaciones-n1/**                                       │
   │ /dashboard y /perfil: siempre permitidos                                         │
   │ /administracion (Listas) y /reportes: según los permisos de menú del usuario     │
   │   (grupos Registrar/Visualizar de la matriz permisos.xlsx)                       │
   │ Ruta no permitida → redirect al fallback del rol                                 │
   └──────────────────────────────────────────────────────────────────────────────────┘
** → página inexistente → NotFoundComponent (404)
```

Ciclo de vida del registro (misma máquina de estados que el original):

```
Registrado ──enviar──► Enviado ──validar──► Validado ──aprobar──► Aprobado
     ▲                    │                    │
     │                 observar             observar
     └── editar ◄──── Observado ──reenviar──► Enviado-Subsanado ──► (Validado…)
Bloqueo de edición: Enviado, Enviado-Subsanado, Validado, Aprobado
```

## 4. Gestión de estado

- **Signals** en servicios raíz: `signal()` privado + `asReadonly()` público +
  `computed()` para derivados (contadores, filtros, flags por rol).
- Componentes con `ChangeDetectionStrategy.OnPush`; la reactividad la disparan
  los signals, no zone.js.
- **RxJS** presente donde aporta: `valueChanges` de Reactive Forms, interceptores,
  y los mocks devuelven `Observable` (misma firma que tendrá `HttpClient`).
- **NgRx:** no se incorpora. La complejidad actual (13 servicios, estado plano)
  no lo justifica; si el sistema crece (undo/redo, sincronización offline,
  colaboración), los servicios actuales se migran a `@ngrx/signals` sin tocar
  los componentes, porque ya consumen signals de solo lectura.

## 5. Estrategia de escalabilidad

1. **Nuevas features:** crear carpeta en `features/`, registrar ruta lazy en
   `app.routes.ts`; cero cambios en el resto del árbol.
2. **Backend:** los servicios documentan su contrato REST en cada método;
   sustituir el cuerpo por `this.http.…` y (opcional) borrar `mock-data.const.ts`.
   El flag `environment.useMocks` permite convivencia temporal mock/real.
3. **Design system:** todo el color y la tipografía salen de los tokens
   `--mat-sys-*` que emite `mat.theme()` en `styles/theme.scss` (ver §6).
   Prohibido hardcodear colores.
4. **Lazy loading verificado:** el build produce un chunk por pantalla
   (usuario-form 141 kB, stepper 113 kB, campos 59 kB, bandeja 34 kB…),
   initial bundle 779 kB raw / 167 kB transfer.
   ⚠ El presupuesto de bundle inicial (500 kB) está excedido; es deuda conocida,
   no una regresión de la migración a Material.
5. **Rendimiento:** OnPush + signals + `track` en todos los `@for`.

## 6. Sistema de diseño (Angular Material 3)

Único sistema de diseño de la aplicación desde agosto de 2026; no hay
framework de utilidades ni clases de presentación propias.

- **`src/styles/theme.scss`** — `mat.theme()` emite los tokens de sistema
  (`--mat-sys-primary`, `--mat-sys-surface`, `--mat-sys-body-medium`…) para
  color, tipografía, forma y elevación. Aquí viven además:
  - los dos temas conmutables (base *Naturaleza Viva*; `html[data-theme='innovacion-rural']`
    redefine **solo** color, de modo que tipografía y densidad no se duplican);
  - los **estados de negocio** del flujo N1 (`--estado-registrado/enviado/subsanado/
    validado/observado/aprobado` + `-fondo`), que Material no modela y son los
    únicos colores fuera de su paleta;
  - las convenciones compartidas de grilla: cabecera de `mat-table`, estado vacío
    (`.fila-vacia` / `.sin-datos`) y los tonos de acción por fila (`.accion.a-neutro`,
    `.a-marca`, `.a-info`, `.a-exito`, `.a-error`, `.excel`) y de chip (`.c-*`).
- **`src/styles.css`** — solo normalización: `box-sizing`, `border: 0 solid`,
  márgenes de encabezados y párrafos a cero, controles heredando tipografía y el
  foco visible global. Material no incluye reset y los componentes están escritos
  contra estas reglas.
- **Iconografía:** Material Symbols Outlined por ligadura
  (`<mat-icon fontSet="material-symbols-outlined">`), cargada en `index.html`.
- **Diálogos:** todo pasa por `MatDialog`. El feedback genérico (info, aviso,
  confirmación, éxito, error) va por `ModalService`, que devuelve promesas;
  los diálogos con formulario son componentes propios en su feature.
- **Regla de solo lectura:** un dato no editable se muestra con el control
  **deshabilitado**, nunca atenuado con clases.
