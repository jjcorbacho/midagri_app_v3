# Documento de Análisis — Migración a Angular

**Sistema:** MIDAGRI · Sistema de Capacitaciones y Asistencias Técnicas (SODEGA_YRT_V3)
**Fecha de auditoría:** 05/07/2026
**Origen:** Prototipo generado con Lovable (React) · **Destino:** Angular 22 Enterprise

> **Documento histórico.** Registra la auditoría del sistema original y las
> decisiones tomadas en julio de 2026. La capa visual descrita aquí (Tailwind
> y lucide, migrados 1:1 desde React) fue **sustituida por Angular Material 3**
> en agosto de 2026; las filas afectadas están marcadas. Para el estado actual,
> ver `02-arquitectura.md` §6. Las secciones 1–4 describen el sistema **origen**
> y siguen siendo válidas como tal.

---

## 1. Tecnologías encontradas en el sistema original

| Capa | Tecnología | Versión | Rol |
|---|---|---|---|
| UI | React | 19.2 | Librería de componentes |
| Meta-framework | TanStack Start / Router (file-based routing) | 1.16x | Ruteo + SSR ligero |
| Datos remotos | TanStack Query | 5.x | Instalado, sin uso real (todo mock) |
| Estilos | Tailwind CSS | 4.2 | Utilidades + tokens de diseño (`@theme inline`, `@utility`) |
| Componentes base | shadcn/ui sobre Radix UI | — | ~40 primitivas (solo se usan ~6) |
| Iconos | lucide-react | 0.575 | Iconografía completa |
| Notificaciones | sonner | 2.x | Toasts |
| Formularios | react-hook-form + zod | 7.x / 3.x | Instalados, **no usados** (formularios con useState manual) |
| Runtime/build | Bun + Vite 8 + Nitro | — | Dev server y build |
| Otros | recharts, embla-carousel, date-fns, vaul… | — | Instalados por plantilla, sin uso |

**Hallazgo clave:** no existe backend. Toda la data vive en memoria
(`src/lib/mock-data.ts` + `app-context.tsx` con React Context), la sesión en
`sessionStorage` y los archivos "subidos" solo guardan el nombre.

## 2. Inventario de archivos relevantes (original)

| Archivo | Líneas | Contenido |
|---|---|---|
| `src/lib/mock-data.ts` | 648 | Modelos, seeds (36 + 210 cursos generados), reglas de ciclo de vida |
| `src/lib/app-context.tsx` | 252 | Estado global: sesión, área activa, CRUD en memoria |
| `src/lib/areas.ts` | 143 | 26 áreas usuarias oficiales + definición de formularios |
| `src/lib/catalogos.ts` | 220 | Temáticas (31), tipos de evento (35), ubigeo simplificado |
| `src/lib/utm.ts` | 63 | Conversión WGS84 → UTM |
| `src/lib/peru-regions.ts` | 109 | Contorno SVG del Perú + bboxes por región |
| `src/styles.css` | 341 | Design system completo (tokens oklch, light/dark, tipografía) |
| `src/routes/*` (14 rutas) | ~1.500 | Pantallas del sistema |
| `src/components/*` (11 + 40 ui) | ~3.300 | Componentes de negocio y primitivas shadcn |

## 3. Mapa de pantallas y flujos de navegación

```
/                      → redirige a /dashboard o /auth según sesión
/auth                  → Login (clave demo Midagri2026*, rol derivado del usuario)
/dashboard             → Tarjetas de módulos filtradas por rol
/capacitaciones-n1     → Bandeja N1: KPIs (2 vistas), filtros, tabla expandible, paginación
/capacitaciones-n1/nuevo?tipo=…   → Stepper 3 pasos (nuevo registro)
/capacitaciones-n1/:id?paso=…     → Stepper 3 pasos (edición / solo lectura)
/seguimiento/revision  → Bandeja ADMIN_DZ: validar / observar en lote
/seguimiento/aprobacion→ Bandeja ADMIN_UE: aprobar / observar en lote
/configuracion         → redirige a /configuracion/reglas
/configuracion/campos  → Constructor de formularios (campos base + personalizados + vista previa móvil/desktop)
/configuracion/reglas  → Configurador de reglas por área (actividades, aforos, criterios de éxito, periodo)
/reportes              → Placeholder "en construcción"
/perfil                → Ficha del usuario
404                    → Página no encontrada
```

## 4. Funcionalidades detectadas

1. **Autenticación simulada** con 4 roles: `ADMINISTRADOR`, `ADMIN_DZ`, `ADMIN_UE`, `TECNICO1`;
   matriz de acceso por ruta y menú lateral filtrado por rol.
2. **Área usuaria activa** (26 áreas) seleccionable en el header; todos los listados filtran por área.
3. **Ciclo de vida del evento:** `Registrado → Enviado / Enviado-Subsanado → Validado → Aprobado`,
   con desvío a `Observado` (+ historial de observaciones) y reglas de edición/eliminación por estado.
4. **Registro N1 en 3 pasos:** datos del evento (con catálogos SODEGA, cascada de ubigeo,
   coordenadas geográficas/UTM y **mapa SVG del Perú** con zoom por región y clic-para-fijar-pin),
   participantes (búsqueda por DNI en padrón de productores con autocompletado y bloqueo de campos)
   y sustento (PDF ≤ 15 MB con declaración jurada).
5. **Bandeja N1:** KPIs con dos vistas, búsqueda que incluye participantes (con resaltado),
   filas expandibles, paginación 5/10/30/50, acciones contextuales por estado, modal de sustento.
6. **Seguimiento (DZ/UE):** selección múltiple de accionables, validación/aprobación en lote,
   observación en lote con fecha, historial de observaciones.
7. **Campos dinámicos por área/formulario:** 4 formularios configurables, campos base
   activables, campos personalizados (7 tipos de dato), visibilidad por área (rol UE),
   bloqueo de eliminación si "tiene data", vista previa móvil/escritorio.
8. **Reglas por área:** actividades activas, subtipos de AT, aforos y horas mín/máx,
   criterio de éxito (paralela/cruzada/solo cap/solo AT) con ajuste automático,
   periodo de medición, detección de borrador (dirty) y validaciones.
9. **Utilidades:** conversión WGS84→UTM, cálculo de edad, botones "Autocompletar" de prueba.

## 5. Riesgos de migración identificados

| Riesgo | Impacto | Mitigación aplicada |
|---|---|---|
| Tailwind 4 con `@theme/@utility` no es el setup Angular por defecto | Estilos rotos | Se integró `@tailwindcss/postcss` (`.postcssrc.json`); tokens migrados 1:1. **Superado (ago-2026):** Tailwind se retiró al adoptar Angular Material 3; el design system vive en `styles/theme.scss` |
| 40 primitivas shadcn/Radix sin equivalente Angular | Reescritura masiva | Solo ~6 se usaban; se reimplementaron como componentes propios (badge, modal, kpi, toast). **Revisado (ago-2026):** esas primitivas propias se sustituyeron por las de Angular Material (`MatDialog`, `MatSnackBar`, `mat-chip`…) |
| Bug latente del original: al crear un curso, el id `createdId` asumido con `Date.now()` podía no coincidir con el id real | Paso 2 sin curso | En Angular `CursosService.create()` **devuelve** el registro creado y el stepper usa su id real |
| Código muerto en `_shell.tsx` (bloque duplicado tras `return`) | Ninguno | No se migró (era inalcanzable) |
| Eventos globales `window.dispatchEvent('sodega:simular-*')` | Antipatrón | Reemplazados por métodos públicos + `viewChild` |
| lucide-angular declara peers hasta Angular 21 | Instalación | `.npmrc` con `legacy-peer-deps`; verificado en build y runtime. **Obsoleto (ago-2026):** lucide se retiró (iconos = Material Symbols). La bandera sigue puesta, pero por otro conflicto: `@angular/animations@22.1` exige `@angular/core@22.1.0` exacto |
| Tooltips Radix con animación | Detalle visual | Sustituidos por `title` nativo (misma información, menor complejidad) |
| Calendario shadcn en vista previa de campo tipo fecha | Detalle visual | Sustituido por `<input type="date">` nativo |
| Datos seed con generadores IIFE deterministas | Paridad de demo | Portados literalmente (mismos 246 cursos / ~1.900 participantes) |

## 6. Componentes reutilizables identificados (y migrados a `shared/`)

- `EstadoBadge` → `shared/components/estado-badge` *(hoy sobre `mat-chip`)*
- Tarjeta KPI → `shared/components/kpi-card`
- Modal genérico (3 implementaciones duplicadas en el original) → unificado en
  `shared/components/modal` *(hoy `feedback-dialog` sobre `MatDialog`, vía `ModalService`)*
- Toaster → `ToastService` *(hoy sobre `MatSnackBar`; el contenedor propio desapareció)*
- Mapa del Perú → `shared/components/peru-map`
- Utilidades UTM / regiones / fechas → `shared/utils`

## 7. Recomendaciones de arquitectura (aplicadas)

1. Feature-Based Architecture con `core / shared / features / layout`.
2. Standalone Components + Signals + `ChangeDetectionStrategy.OnPush` en todo el árbol.
3. Lazy Loading por pantalla (verificado: 15+ chunks independientes en el build).
4. Estado global en servicios `providedIn: 'root'` con Signals de solo lectura
   (`asReadonly()`), en lugar de Context/prop-drilling.
5. Guards funcionales (`authGuard`, `roleGuard`) e interceptors (`auth`, `error`)
   registrados y listos para el JWT real.
6. Servicios con contratos REST documentados (GET/POST/PUT/PATCH/DELETE) y cuerpo
   simulado, para que backend solo sustituya el interior por `HttpClient`.
