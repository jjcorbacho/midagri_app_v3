# Auditoría UX/UI y rediseño visual — Plataforma MIDAGRI/SODEGA

**Fecha:** 17 de julio de 2026 · **Alcance:** exclusivamente presentación (UI/UX); cero cambios en lógica de negocio, servicios, modelos, permisos o rutas.

---

## 1. Diagnóstico del estado actual

La aplicación ya cuenta con un **design system propio ("N1")** definido en `src/styles.css`, notablemente maduro:

- **Tokens de color** centralizados en variables CSS (`:root`) con OKLCH: superficies, marca, semánticos de feedback (success/warning/info) y 6 estados de negocio con variantes *soft*.
- **Tipografía única** (DM Sans + IBM Plex Mono para números/DNI) con escala documentada (`text-display` → `text-caption`).
- **Jerarquía de botones** completa (`btn-primary/secondary/ghost/danger/success/icon`) con altura uniforme de 36 px, estados hover/active/disabled y transiciones.
- **Patrones de tabla** (`th-ds`, `td-ds`, `tr-hover`, badges de estado vía `app-estado-badge`), cards (`card-ds`), estados vacíos, animaciones de entrada con `prefers-reduced-motion`, y foco visible global (`:focus-visible` con `--ring`).
- **Componentes compartidos** reutilizados de forma consistente: `app-modal`, `app-estado-badge`, `app-kpi-card`, `app-toast`, `app-autocomplete` (combobox WAI-ARIA), `app-peru-map`.
- **Iconografía única**: lucide-angular en toda la aplicación (tamaños `size-3.5`–`size-5` según contexto).
- **Formularios por bloques** (patrón ya presente en Gestión de Usuarios): tarjetas con título de sección iconado, descripción breve, separadores y scroll natural entre bloques (Datos Personales → Datos Presupuestales → Cuenta de acceso → Ámbito territorial → Permisos).

**Conclusión del diagnóstico:** la base es sólida y consistente; el mayor potencial de mejora no está en re-estilizar componentes sino en (a) la ausencia de **temas visuales** que conecten emocionalmente con el sector agrario, (b) afinar detalles de accesibilidad/densidad, y (c) sostener la consistencia al crecer.

## 2. Problemas detectados por prioridad

| Prioridad | Hallazgo | Evidencia |
|---|---|---|
| **Alta** | No existe sistema de temas; la identidad teal es tecnológica pero no evoca agricultura/naturaleza | Tokens fijos en `:root`, sin `data-theme` ni persistencia |
| **Alta** | El usuario no puede adaptar la apariencia (fatiga visual en jornadas largas de registro en campo/oficina) | Sin preferencia persistida |
| **Media** | `btn-icon` mide 32 px (objetivo táctil recomendado ≥ 44 px en móvil) | `styles.css @utility btn-icon` |
| **Media** | Algunas grillas usan clases de tabla inline en vez de `th-ds`/`td-ds` (duplicación menor de estilos) | p. ej. tablas del formulario de usuarios |
| **Media** | Labels de formulario a 11 px: legibles en desktop, mejorables para usuarios de campo con pantallas pequeñas | patrón `text-[11px]` en labels |
| **Baja** | El sidebar colapsado depende solo de iconos (sin tooltips en todos los ítems) | `layout/sidebar` |
| **Baja** | Falta un indicador de "avance" en formularios largos (el patrón de bloques ya guía el scroll, pero sin señal de progreso) | formulario de usuarios |

## 3. Sistema de diseño (reglas de uso)

- **Tipografía:** DM Sans única; jerarquía `text-display/h1/h2/h3/body/small/caption`. Números identitarios (DNI, montos, contadores) siempre `font-mono tabular-nums`.
- **Espaciado:** escala Tailwind con ritmo verticales `space-y-4/5` entre bloques, `gap-3` en grillas de campos, `p-5` en cards, `px-4 py-3` en celdas.
- **Componentes:** siempre reutilizar `app-modal`, `app-estado-badge`, `app-autocomplete`, `btn-*`, `card-ds`; prohibido introducir estilos ad-hoc que dupliquen tokens.
- **Iconografía:** solo lucide; 16 px (`size-4`) en encabezados de sección y botones, 14 px (`size-3.5`) en acciones de tabla.
- **Color:** los tokens semánticos (`--success`, `--warning`, `--state-*`) son **invariantes entre temas** — un badge "Aprobado" es verde en cualquier tema; el tema solo redefine identidad (primario/secundario/acento/sidebar/fondos).

## 4. Temas visuales — regla 60-30-10 y justificación

Arquitectura: cada tema es un bloque `:root[data-theme='…']` que redefine ~11 tokens; los componentes no cambian. 60 % = superficies neutras con matiz del tema; 30 % = secundario (sidebar, encabezados de sección, soft-surfaces); 10 % = acento (CTAs, resaltes, chips). Contraste AA verificado para texto blanco sobre `--primary`/`--sidebar` en los cinco temas.

Paletas de referencia (Coolors) y su narrativa:

| Tema | Paleta fuente | 60 % (fondos/superficies) | 30 % (sidebar/secciones) | 10 % (primario/acentos) | Narrativa |
|---|---|---|---|---|---|
| **Institucional MIDAGRI** *(por defecto)* | — | Neutro frío | Teal #4FA6B1 | Teal #327490 + oliva | Identidad original; cero regresión visual |
| **Agricultura Inteligente** | `CCD5AE · E9EDC9 · FEFAE0 · FAEDCD · D4A373` | Crema #FEFAE0 / trigo #FAEDCD | Salvia #CCD5AE / #E9EDC9, oliva derivado | Tostado #D4A373 (oscurecido para AA) | Trigo, campo y calidez tradicional |
| **Innovación Rural** | `BEE9E8 · 62B6CB · 1B4965 · CAE9FF · 5FA8D3` | Celeste pálido #CAE9FF | Azul cielo #62B6CB / #5FA8D3 | Azul profundo #1B4965 | Agua y digitalización del agro |
| **Tierra Productiva** | `582F0E → 333D29` (10 tonos tierra/bosque) | Pergamino #C2C5AA aclarado | Oliva #656D4A, bosque #333D29 | Marrón #7F4F24 con acento #A68A64 | Suelo fértil, producción, confianza |
| **AgroTech** | `D9ED92 → 184E77` (lima→teal→azul) | Neutro frío sutil | Teal #52B69A / #34A0A4, azul #184E77 | Azul #1A759F–#1E6091 + lima #B5E48C | Sensores, IA, agricultura de precisión |
| **Naturaleza Viva** | `22577A · 38A3A5 · 57CC99 · 80ED99 · C7F9CC` | Menta pálida #C7F9CC | Teal #38A3A5 | Azul #22577A + verdes #57CC99/#80ED99 | Biodiversidad, agua y vida |

**Mapeo paleta → tokens.** Cada tema redefine ~17 tokens de `:root`: fondos (`--background`, `--surface-2/3`, `--secondary`, `--muted`, `--accent`), bordes (`--border`, `--input`), acción (`--primary`, `--ring`), marca (`--brand`, `--brand-secondary`, `--brand-soft`, `--brand-accent`, `--brand-accent-soft`) y sidebar (`--sidebar`, `--sidebar-active`). Las variantes claras/oscuras se **derivan** de la paleta: los tonos claros de Coolors alimentan fondos y softs de forma casi literal, mientras que primario y sidebar se oscurecen en OKLCH hasta garantizar contraste AA con texto blanco (L ≤ 0.50 aprox.); los hovers oscuros de botones se generan automáticamente con `color-mix` en las utilidades `btn-*`, por lo que no se duplica CSS. Texto principal/secundario, sombras y tokens semánticos (éxito, advertencia, error, información, estados de negocio) permanecen globales e idénticos entre temas.

## 5. Plan de implementación por fases

| Fase | Contenido | Riesgo |
|---|---|---|
| **1 (implementada)** | Sistema de temas: tokens `[data-theme]`, `ThemeService` (aplicación en `<html>` + persistencia en localStorage), botón flotante "Personalizar apariencia" con panel lateral accesible, visible en todas las pantallas | Bajo: aditivo, el tema por defecto es la apariencia actual |
| **2** | Migrar tablas restantes a `th-ds`/`td-ds`; tooltips del sidebar colapsado | Bajo |
| **3** | Densidad táctil móvil (`btn-icon` ≥ 44 px en pantallas táctiles vía media query), labels a 12 px | Medio: revisar densidad de tablas |
| **4** | Indicador de progreso en formularios largos (bloques completados) y micro-ayudas contextuales | Medio |
| **5** | Auditoría WCAG AA instrumentada (axe) por vista y ajustes finos de contraste | Bajo |

Cada fase se verifica en el navegador contra los flujos críticos (login, registro de usuarios, reasignación, bandejas) antes de continuar.

## 5b. Estándar de acciones de tabla (julio 2026)

La columna **Acciones** de `/usuarios` es el patrón canónico del sistema: botones cuadrados `p-2 rounded-lg transition-all` (32 px, icono lucide `size-4`), un tono tokenizado por tipo de acción, agrupados con `flex items-center justify-center gap-1 flex-wrap` (responsive). Queda prohibido el fondo circular (`rounded-full`) y los menús kebab para ≤4 acciones: las acciones se muestran siempre visibles. Aplicado en `Administración → Listas` (kebab reemplazado por Editar + Cambiar Estado visibles; cabecera con Nuevo/Excel/PDF/Actualizar cuadrados; el icono de impresión pasó a documento-PDF con identidad roja suave `destructive`). Los desplegables de ámbito territorial (Región/Provincia y multi-selección de Distrito) muestran un máximo de 4 elementos visibles (`max-h-[150px]`) con scroll interno `thin-scroll`.

## 6. Erradicación de colores fijos (auditoría de julio 2026)

Se auditó todo `src/app` en busca de clases Tailwind de paleta fija (`bg-blue-50`, `text-slate-700`, …), hex directos y blancos/negros absolutos. Resultado: **0 colores fijos restantes** en componentes (los únicos hex del código son las muestras del selector de temas, que son datos del picker). Migraciones realizadas:

- **Overlays de modales** (`bg-black/40` ×5) → `bg-foreground/40`.
- **Sidebar y login** (`text-white`, `bg-white/10`, `ring-white/20`, gradiente hex `#327490/#4FA6B1`) → tokens `sidebar-foreground`, `brand`, `brand-secondary`.
- **KPIs y acciones** (`bg-blue-50 text-blue-600`, `bg-indigo-50 …`) → `info` / `state-validado`.
- **Chips de tipos de campo** (blue/cyan/indigo/purple/pink/fuchsia) → tokens semánticos y de marca.
- **Marco del preview móvil** (`slate-800/700`) → `foreground` / `muted-foreground`.
- **Icono de subir sustento** (negro fijo `bg-foreground`) → `bg-primary` (token del tema); **Descargar** diferenciado con `info` para no repetir color en la misma fila; **Buscar RENIEC** (negro) → `bg-primary`.
- **Blancos sobre sólidos** (`hover:text-white`, `bg-primary text-white`, …) → pares `*-foreground` del token correspondiente (contraste automático claro/oscuro por diseño de pares token).

**Feedback semántico por tema:** cada `[data-theme]` redefine ahora `--success`, `--warning` (+`-foreground`/`-soft`), `--info` y `--destructive` en armonía con su paleta — warning ocre suave (Agricultura Inteligente), naranja tecnológico (Innovación Rural), ocre tierra (Tierra Productiva), ámbar con matiz verde (AgroTech) y amarillo natural (Naturaleza Viva) — manteniendo AA y la familia cromática reconocible (verde=éxito, rojo=error, azul=info) en todos los temas.

## 7. Consolidación de julio 2026 (entrega multi-mejora)

- **Temas**: el selector queda reducido a **Naturaleza Viva** (por defecto) e **Innovación Rural**; los bloques CSS, entradas del servicio y referencias de los demás temas fueron eliminados. Una preferencia guardada de un tema retirado cae automáticamente al tema por defecto.
- **Sistema unificado de modales**: `ModalService` (`openInfo/openWarning/openConfirm/openSuccess/openError`, API de promesas) + `FeedbackModalComponent` montado en la raíz. Reemplazó `alert()`/`confirm()` nativos (bandeja, seguimiento), el modal de confirmación de Listas y los modales de aviso locales de Gestión de Usuarios y su formulario. El paso de confirmación del modal Reasignar registros se conserva por su contenido estructurado (origen/destino) y queda como candidato a una futura variante rica del sistema.
- **Seguimiento fusionado**: `SeguimientoComponent` única vista para revisión y aprobación (pestañas según rol; el Admin General alterna sin navegar). Ambas rutas cargan el mismo componente, por lo que guards, sidebar y permisos no cambiaron; los wrappers antiguos fueron eliminados.
- **Stepper N1**: declaración jurada obligatoria al final del Paso 1 (bloquea el avance con mensaje; prellenada al editar eventos ya guardados); sección DNI a ancho completo en una fila; geolocalización con botón "Obtener mi ubicación" y botón flotante en el mapa (`app-peru-map` ganó arrastre de marcador, centrado bajo demanda y botón de localización; los errores de permisos/GPS usan el sistema unificado de modales).
- **Bandeja N1**: buscador acotado por campo (Código/Tema/Ubicación/Extensionista/Nombres/Apellidos/DNI, en tiempo real) y exportación a Excel (`shared/utils/excel.util.ts`, sin dependencias) que exporta **todas** las filas filtradas —no solo la página visible— con encabezados formateados, anchos automáticos y nombre `Capacitaciones_N1_YYYY-MM-DD_HH-mm.xls`.
