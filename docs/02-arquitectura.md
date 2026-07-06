# Documento de Arquitectura — MIDAGRI Angular

**Proyecto:** Sistema de Capacitaciones y Asistencias Técnicas (reconstrucción Angular 22)
**Patrón:** Feature-Based Architecture + Standalone Components + Signals

---

## 1. Diagrama de carpetas

```
midagri-angular/
├── .npmrc                      # legacy-peer-deps (lucide-angular ↔ Angular 22)
├── .postcssrc.json             # Tailwind CSS 4 vía @tailwindcss/postcss
├── angular.json
├── package.json
├── docs/
│   ├── 01-analisis.md          # Auditoría del sistema original
│   └── 02-arquitectura.md      # Este documento
├── src/
│   ├── index.html              # lang=es, fuentes DM Sans / IBM Plex Mono
│   ├── main.ts                 # bootstrapApplication
│   ├── styles.css              # Design system MIDAGRI (tokens oklch, light/dark)
│   ├── environments/
│   │   ├── environment.ts      # apiBaseUrl + useMocks (dev)
│   │   └── environment.prod.ts
│   └── app/
│       ├── app.component.ts    # <router-outlet> + <app-toast-container>
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
│       │   │   ├── curso.model.ts       # Curso, EstadoCurso, reglas de ciclo de vida
│       │   │   ├── participante.model.ts# Participante, ProductorBD
│       │   │   ├── area-config.model.ts # AreaConfig, CriterioExito, defaults
│       │   │   └── campo.model.ts       # CampoPersonalizado, CampoBase, tipos
│       │   ├── constants/
│       │   │   ├── areas.const.ts       # 26 áreas usuarias oficiales
│       │   │   ├── catalogos.const.ts   # Temáticas, tipos de evento, ubigeo…
│       │   │   ├── campos-base.const.ts # Campos base por formulario
│       │   │   └── mock-data.const.ts   # ⚠ Seeds de desarrollo (eliminar con backend)
│       │   └── services/                # Estado global con Signals + mocks CRUD
│       │       ├── auth.service.ts      # login/logout, sesión, computeds por rol
│       │       ├── area.service.ts      # Área activa (persistida en sessionStorage)
│       │       ├── cursos.service.ts    # GET/POST/PUT/PATCH-estado/DELETE
│       │       ├── participantes.service.ts
│       │       ├── campos.service.ts    # Campos dinámicos + visibilidad por área
│       │       ├── reglas.service.ts    # AreaConfig por área
│       │       ├── productores.service.ts # Padrón (búsqueda por DNI)
│       │       └── toast.service.ts     # Notificaciones globales
│       │
│       ├── shared/             # Reutilizable, sin estado propio de negocio
│       │   ├── components/
│       │   │   ├── estado-badge/        # Badge semántico de estados
│       │   │   ├── kpi-card/            # Tarjeta KPI de la bandeja
│       │   │   ├── modal/               # Modal genérico (unifica 3 duplicados)
│       │   │   ├── peru-map/            # Mapa SVG del Perú (zoom + pin)
│       │   │   └── toast/               # Contenedor de notificaciones
│       │   ├── directives/              # (reservado)
│       │   ├── pipes/                   # (reservado)
│       │   ├── interfaces/              # (reservado)
│       │   └── utils/
│       │       ├── utm.util.ts          # WGS84 → UTM
│       │       ├── peru-regions.util.ts # Contorno SVG + bboxes por región
│       │       └── fecha.util.ts        # Edad, formatos dd/mm/yyyy, es-PE
│       │
│       ├── features/           # Un directorio por dominio funcional (lazy)
│       │   ├── autenticacion/login.component.ts        # Reactive Forms
│       │   ├── dashboard/dashboard.component.ts        # Tarjetas por rol
│       │   ├── capacitaciones/
│       │   │   ├── bandeja/bandeja.component.ts        # KPIs + tabla + filtros
│       │   │   ├── stepper/stepper.component.ts        # Flujo 3 pasos
│       │   │   ├── curso-form/curso-form.component.ts  # Paso 1 (Reactive Forms)
│       │   │   ├── participante-form/…                 # Paso 2 (Reactive Forms + DNI)
│       │   │   └── sustento-modal/…                    # Carga de PDF + envío
│       │   ├── seguimiento/
│       │   │   ├── seguimiento-panel.component.ts      # Panel compartido DZ/UE
│       │   │   ├── revision.component.ts               # ADMIN_DZ → Validar
│       │   │   └── aprobacion.component.ts             # ADMIN_UE → Aprobar
│       │   ├── configuracion/
│       │   │   ├── campos/campos.component.ts          # Constructor de formularios
│       │   │   ├── campos/campo-modal.component.ts     # Alta/edición de campo
│       │   │   ├── campos/opciones-modal.component.ts  # Edición de valores (UE)
│       │   │   ├── campos/campo-preview.component.ts   # Vista previa de campo
│       │   │   └── reglas/reglas.component.ts          # Configurador de reglas
│       │   ├── reportes/reportes.component.ts
│       │   ├── perfil/perfil.component.ts
│       │   └── errores/not-found.component.ts          # 404
│       │
│       └── layout/
│           ├── shell/shell.component.ts    # Sidebar + Header + <router-outlet>
│           ├── sidebar/sidebar.component.ts# Menú por rol, colapsable, tooltips
│           └── header/header.component.ts  # Área activa, menú usuario, cambiar clave
└── src/assets/{images,icons,styles}        # Reservado para recursos estáticos
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
                     ProductoresService · ToastService
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
   │ ADMINISTRADOR → todas las rutas                                                  │
   │ ADMIN_DZ      → /dashboard /perfil /seguimiento/revision /capacitaciones-n1/:id  │
   │ ADMIN_UE      → /dashboard /perfil /seguimiento/aprobacion /configuracion/campos │
   │ TECNICO1      → /dashboard /perfil /capacitaciones-n1/**                         │
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
- **NgRx:** no se incorpora. La complejidad actual (8 servicios, estado plano)
  no lo justifica; si el sistema crece (undo/redo, sincronización offline,
  colaboración), los servicios actuales se migran a `@ngrx/signals` sin tocar
  los componentes, porque ya consumen signals de solo lectura.

## 5. Estrategia de escalabilidad

1. **Nuevas features:** crear carpeta en `features/`, registrar ruta lazy en
   `app.routes.ts`; cero cambios en el resto del árbol.
2. **Backend:** los servicios documentan su contrato REST en cada método;
   sustituir el cuerpo por `this.http.…` y (opcional) borrar `mock-data.const.ts`.
   El flag `environment.useMocks` permite convivencia temporal mock/real.
3. **Design system:** todos los colores/tipografías son tokens CSS en
   `styles.css` (light + dark ya definidos). Prohibido hardcodear colores.
4. **Lazy loading verificado:** el build produce un chunk por pantalla
   (stepper 72 kB, campos 40 kB, bandeja 32 kB…), initial bundle ~363 kB raw / ~89 kB transfer.
5. **Rendimiento:** OnPush + signals + `track` en todos los `@for`.
