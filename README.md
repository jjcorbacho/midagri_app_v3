# MIDAGRI — Sistema de Capacitaciones (Angular)

Reconstrucción **Angular 22 Enterprise** del Sistema de Capacitaciones y Asistencias
Técnicas de MIDAGRI (originalmente un prototipo React/Lovable). Registra eventos de
capacitación y asistencia técnica de las 26 áreas usuarias, gestiona participantes
(productores agrarios), y controla el flujo de revisión/aprobación institucional.

> 📄 Documentación complementaria:
> - [docs/01-analisis.md](docs/01-analisis.md) — Auditoría del sistema original (inventario, funcionalidades, riesgos).
> - [docs/02-arquitectura.md](docs/02-arquitectura.md) — Arquitectura, relación entre módulos, flujo de navegación y escalabilidad.

## Ramas: dos versiones en paralelo

El repositorio mantiene **a propósito** dos versiones del producto, con la misma
funcionalidad y distinta capa visual. **No se mergean entre sí.**

| Rama | Capa visual |
|---|---|
| `main` · `tailwind` | Design system propio: Tailwind CSS 4, tokens `oklch`, clases `btn-*`/`th-ds`, iconos lucide |
| `angular-material` | Angular Material 3: tokens `--mat-sys-*` emitidos por `mat.theme()`, Material Symbols |

`tailwind` es una copia estable de `main` para que esa línea siga viva aunque
`main` evolucione. La migración a Material se propuso en el PR #15, que se
**cerró sin mergear** por esta decisión; queda como registro del diff completo.

Al abrir una incidencia o un cambio, indica sobre qué línea aplica.

---

## 1. Descripción funcional

La **base de autenticación y permisos** proviene del prototipo oficial de la Plataforma
SODEGA v3.1 ([docs/referencia/sodega-login-permisos.html](docs/referencia/sodega-login-permisos.html)):
login unificado con selección de perfil/OPA y **5 perfiles jerárquicos**.

| Módulo | Descripción | Perfiles |
|---|---|---|
| Autenticación SODEGA | Login unificado con validación en vivo y modal de selección de perfil (Admin General) o de Unidad Responsable/OPA (multi-registro) | Todos |
| Dashboard | Accesos a módulos según perfil | Todos |
| **Gestión de Usuarios** | Grilla con 6 KPIs (vigencias, vencidos…), acciones por fila (editar, nueva partida presupuestal, restablecer clave, reasignar OPA, cambiar estado) y formulario de 2 pestañas: RENIEC simulado, datos presupuestales en cascada (categoría → PP → unidad funcional OPAS), régimen laboral con vigencia de contrato (auto-inhabilita cuentas vencidas) y ámbitos territoriales | Todos los perfiles administrativos |
| Capacitaciones N1 | Bandeja con KPIs, filtros y stepper de registro en 3 pasos (evento → participantes → sustento PDF) | Admin General, Técnico |
| Evaluación de Técnicos (revisión) | Validar u observar registros enviados (en lote) | Administrador DZ_Cap_Asit. |
| Evaluación / Aprobación (aprobación) | Aprobar u observar registros validados (en lote) | Admin Unidad Organizacional, Jefe de Área |
| Configuración › Campos | Constructor de formularios por área con vista previa | Admin General (edición), Admin UO (visibilidad) |
| Configuración › Reglas | Actividades, aforos, criterio de éxito y periodo por área | Admin General |
| Reportes / Perfil | Placeholder institucional / ficha del usuario | Según perfil |

**Perfiles** (jerarquía descendente): Administrador General → Jefe de Área →
Administrador Unidad Organizacional → Administrador DZ_Cap_Asit. → Técnico Capacitación y AT.

**Acceso de prueba:** usuario `ccandelaria` (o alias `candelab`) con cualquier clave —
es el Administrador General master y elige su perfil de ingreso en el modal.
Los demás usuarios se crean desde **Gestión de Usuarios** (el "Usuario generado" del
formulario es su credencial de acceso; registro único entra directo, multi-registro
elige su Unidad Responsable al ingresar).

## 2. Arquitectura implementada

- **Feature-Based Architecture**: `core / shared / features / layout`.
- **Standalone Components** en el 100% del árbol (sin NgModules).
- **Signals** para el estado global (servicios `providedIn: 'root'`) + `computed()` para derivados.
- **Reactive Forms** con validaciones en login, formulario de evento, participante y campos personalizados.
- **Lazy Loading** por pantalla (`loadComponent`) — verificado en el build (un chunk por vista).
- **Guards**: `authGuard` (sesión) y `roleGuard` (matriz de acceso por rol con fallback).
- **Interceptors**: `authInterceptor` (Bearer token, placeholder) y `errorInterceptor` (401 → logout, resto → toast).
- **Design system MIDAGRI** sobre Angular Material 3: `mat.theme()` emite los tokens `--mat-sys-*` en `src/styles/theme.scss`, con dos temas conmutables y tipografía DM Sans / IBM Plex Mono.
- `ChangeDetectionStrategy.OnPush` en todos los componentes.

### Estructura de carpetas

```
src/app/
├── core/        guards · interceptors · services (mock CRUD) · models · constants
├── shared/      components (badge, kpi, modal, toast, mapa Perú) · utils (UTM, fechas)
├── features/    autenticacion · dashboard · capacitaciones · seguimiento · configuracion · reportes · perfil · errores
├── layout/      shell · sidebar · header
├── app.routes.ts · app.config.ts · app.component.ts
src/environments/  environment.ts · environment.prod.ts
docs/              01-analisis.md · 02-arquitectura.md
```

## 3. Dependencias

| Paquete | Uso |
|---|---|
| `@angular/*` ^22 | Framework (router, forms, http) |
| `@angular/material` + `@angular/cdk` ^22 | Componentes y sistema de diseño (tokens `--mat-sys-*`) |
| `rxjs` ~7.8 | Observables (forms, interceptors, contratos de servicios) |

La iconografía son **Material Symbols**, cargados por hoja de estilo en `index.html`.
`src/styles.css` ya no trae utilidades: solo normaliza la base sobre la que Material
pinta (Material no incluye un reset propio).

## 4. Instalación y ejecución

```bash
# Requisitos: Node.js ≥ 20 y npm
cd midagri-angular
npm install          # instala dependencias

npm start            # servidor de desarrollo → http://localhost:4200
npm run build        # build de producción → dist/midagri-angular
npm run watch        # build incremental en modo desarrollo
```

## 5. Guía para el equipo backend

La aplicación funciona 100% con datos simulados en memoria. Todo lo que hay que
tocar está marcado con `TODO(backend)` o vive en archivos concretos:

### 5.1 Configurar la URL del API
`src/environments/environment.ts` → `apiBaseUrl` (y `environment.prod.ts`).
Cuando el API esté disponible, poner `useMocks: false` y retirar los seeds.

### 5.2 Autenticación y autorización
1. `core/services/auth.service.ts` → reemplazar `login()` por
   `POST {apiBaseUrl}/auth/login`, almacenar el JWT y devolverlo en `getToken()`.
2. `core/interceptors/auth.interceptor.ts` → ya adjunta `Authorization: Bearer …`
   cuando `getToken()` devuelve valor; no requiere cambios.
3. `core/guards/auth.guard.ts` → añadir validación de vigencia del token.
4. La clave demo vive solo en `features/autenticacion/login.component.ts`
   (constante `DEFAULT_PASSWORD`): eliminarla al delegar la validación al API.

### 5.3 Servicios de dominio (contratos REST sugeridos)

Cada servicio documenta el endpoint en el JSDoc de cada método; basta con
sustituir el cuerpo por `HttpClient` conservando la firma:

| Servicio | Endpoints sugeridos |
|---|---|
| `cursos.service.ts` | `GET /cursos?area=…` · `GET /cursos/{id}` · `POST /cursos` · `PUT /cursos/{id}` · `PATCH /cursos/{id}/estado` · `DELETE /cursos/{id}` |
| `participantes.service.ts` | `GET/POST /cursos/{id}/participantes` · `PUT/DELETE /participantes/{id}` |
| `campos.service.ts` | `GET /areas/{area}/formularios/{form}/campos` · `POST/PUT/DELETE /campos/{id}` · `PATCH /campos/{id}/visibilidad` |
| `reglas.service.ts` | `GET/PUT /areas/{area}/config` |
| `productores.service.ts` | `GET /productores/{dni}` (padrón: 200 / 404) |

### 5.4 Carga de archivos de sustento
`features/capacitaciones/sustento-modal/` y `stepper/` seleccionan y validan el
PDF (tipo + 15 MB) pero solo guardan el nombre. Implementar subida
`multipart/form-data` antes del `PATCH` de estado.

### 5.5 Datos simulados a retirar
- `core/constants/mock-data.const.ts` (cursos, participantes, padrón, campos seed).
- Botones "Autocompletar" del stepper (métodos `simular()` de los formularios),
  pensados solo para demos.

### 5.6 Reglas de negocio ya modeladas (referencia para el API)
`core/models/curso.model.ts` concentra la máquina de estados y sus invariantes
(`canEditCurso`, `canDeleteCurso`, `canSendForReview`, `isLocked`,
`nextEstadoOnSend`). El backend debe replicarlas como fuente de verdad.

## 6. Decisiones y desviaciones justificadas

| Cambio respecto al original | Justificación |
|---|---|
| Tooltips Radix → atributo `title` nativo | Misma información sin dependencia extra; sin impacto funcional |
| Calendario shadcn en vista previa de campo fecha → `<input type="date">` | Vista previa decorativa; evita portar un datepicker completo |
| Eventos globales `window.dispatchEvent('sodega:simular-*')` → métodos públicos + `viewChild` | Antipatrón en Angular; mismo comportamiento |
| Corrección de bug: id del curso recién creado | El original asumía un id (`Date.now()`) que podía no coincidir; ahora `create()` devuelve el registro real |
| Código muerto de `_shell.tsx` (bloque inalcanzable) no migrado | Era inalcanzable tras un `return` |
