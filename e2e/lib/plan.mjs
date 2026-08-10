/**
 * Plan de captura — inventario declarativo de todo lo que se fotografía.
 *
 * Este archivo NO contiene lógica de negocio: sólo describe qué vistas, estados
 * y variantes debe recorrer el runner (`e2e/screenshots.mjs`). Para agregar una
 * pantalla nueva basta con añadir una entrada a VISTAS.
 */

/* ===================== Temas ===================== */
/* Deben coincidir con TEMAS_VISUALES de src/app/core/services/theme.service.ts */
export const TEMAS = [
  { id: 'naturaleza-viva', slug: 'tema-naturaleza-viva', nombre: 'Naturaleza Viva' },
  { id: 'innovacion-rural', slug: 'tema-innovacion-rural', nombre: 'Innovación Rural' },
];

/* ===================== Resoluciones ===================== */
export const VIEWPORTS = [
  { slug: 'desktop', nombre: 'Desktop', width: 1920, height: 1080, dsf: 1 },
  { slug: 'laptop', nombre: 'Laptop', width: 1366, height: 768, dsf: 1 },
  { slug: 'tablet', nombre: 'Tablet', width: 768, height: 1024, dsf: 2, touch: true },
  { slug: 'mobile', nombre: 'Móvil', width: 390, height: 844, dsf: 3, touch: true },
];

/* ===================== Perfiles ===================== */
/* Deben coincidir con PERFILES de src/app/core/models/usuario-sodega.model.ts */
export const PERFILES = [
  { nombre: 'Administrador General', slug: 'administrador-general', principal: true },
  { nombre: 'Jefe de Área', slug: 'jefe-de-area' },
  { nombre: 'Administrador Unidad Ejecutora(UE)', slug: 'administrador-ue' },
  { nombre: 'Administrador DZ_Cap_Asit.', slug: 'administrador-dz' },
  { nombre: 'Técnico Capacitación y Asistencia Técnica', slug: 'tecnico-cap-asist' },
];

export const USUARIO_QA = 'ccandelaria';
export const CLAVE_QA = 'demo1234';

/**
 * Vistas del sistema.
 *
 *  ruta        · path Angular a visitar (sin baseUrl)
 *  nombre      · slug del archivo PNG
 *  titulo      · etiqueta legible para el reporte
 *  tipo        · vista | formulario | tabla | error  (alimenta los totales)
 *  principal   · true = se captura también en laptop/tablet/mobile
 *  publica     · true = no requiere sesión
 *  espera      · selector opcional a esperar antes de disparar la captura
 *  acciones    · pasos extra para capturar estados internos (ver runner)
 */
export const VISTAS = [
  {
    ruta: '/auth',
    nombre: 'login',
    titulo: 'Inicio de sesión',
    tipo: 'formulario',
    publica: true,
    principal: true,
    espera: 'input[formcontrolname="usuario"]',
    acciones: [
      {
        nombre: 'login-modal-recuperar-clave',
        titulo: 'Modal · Recuperar contraseña',
        tipo: 'modal',
        click: 'a:has-text("Recuperar Contraseña")',
      },
      {
        nombre: 'login-modal-recuperar-enviado',
        titulo: 'Modal · Recuperar contraseña (éxito)',
        tipo: 'modal',
        click: 'a:has-text("Recuperar Contraseña")',
        luego: [
          { fill: 'input[type="email"], input[placeholder*="@midagri"]', valor: 'qa@midagri.gob.pe' },
          { click: 'button:has-text("Enviar nueva clave")' },
        ],
      },
      {
        nombre: 'login-modal-seleccion-perfil',
        titulo: 'Modal · Selección de perfil de ingreso',
        tipo: 'modal',
        luego: [
          { fill: 'input[formcontrolname="usuario"]', valor: USUARIO_QA },
          { fill: 'input[type="password"]', valor: CLAVE_QA },
          { click: 'button:has-text("Ingresar al sistema")' },
        ],
      },
    ],
  },
  {
    ruta: '/dashboard',
    nombre: 'dashboard',
    titulo: 'Inicio / Dashboard',
    tipo: 'vista',
    principal: true,
  },
  {
    ruta: '/capacitaciones-n1',
    nombre: 'capacitaciones-bandeja',
    titulo: 'Capacitaciones N1 · Bandeja',
    tipo: 'tabla',
    principal: true,
    acciones: [
      { nombre: 'capacitaciones-bandeja-fechas', titulo: 'Bandeja · Rango de fechas', tipo: 'componente', click: 'button[aria-label*="fecha" i], button:has-text("Periodo"), button:has-text("Fecha")' },
    ],
  },
  {
    ruta: '/capacitaciones-n1/nuevo',
    nombre: 'capacitaciones-nuevo-paso1',
    titulo: 'Capacitaciones N1 · Nuevo (Paso 1)',
    tipo: 'formulario',
    principal: true,
  },
  { ruta: '/capacitaciones-n1/1?paso=1', nombre: 'capacitaciones-editar-paso1', titulo: 'Capacitaciones N1 · Edición (Paso 1 · Datos del curso)', tipo: 'formulario' },
  { ruta: '/capacitaciones-n1/1?paso=2', nombre: 'capacitaciones-editar-paso2', titulo: 'Capacitaciones N1 · Edición (Paso 2 · Participantes)', tipo: 'formulario' },
  { ruta: '/capacitaciones-n1/1?paso=3', nombre: 'capacitaciones-editar-paso3', titulo: 'Capacitaciones N1 · Edición (Paso 3 · Sustento y cierre)', tipo: 'formulario' },
  {
    ruta: '/seguimiento/revision',
    nombre: 'seguimiento-revision',
    titulo: 'Seguimiento · Revisión',
    tipo: 'tabla',
    principal: true,
  },
  {
    ruta: '/seguimiento/aprobacion',
    nombre: 'seguimiento-aprobacion',
    titulo: 'Seguimiento · Aprobación',
    tipo: 'tabla',
    principal: true,
  },
  { ruta: '/reportes', nombre: 'reportes', titulo: 'Reportes', tipo: 'vista', principal: true },
  {
    ruta: '/usuarios',
    nombre: 'usuarios-gestion',
    titulo: 'Administración · Gestión de Usuarios',
    tipo: 'tabla',
    principal: true,
  },
  {
    ruta: '/usuarios/nuevo',
    nombre: 'usuarios-nuevo',
    titulo: 'Administración · Nuevo usuario',
    tipo: 'formulario',
    principal: true,
    acciones: [
      { nombre: 'usuarios-nuevo-tab-permisos', titulo: 'Nuevo usuario · Pestaña Permisos', tipo: 'componente', click: '[role="tab"]:has-text("Permisos")' },
      { nombre: 'usuarios-nuevo-tab-periodos', titulo: 'Nuevo usuario · Pestaña Periodos', tipo: 'componente', click: 'button:has-text("Agregar Periodo"), [role="tab"]:has-text("Permisos")' },
    ],
  },
  {
    ruta: '/usuarios/demo-qa-1',
    nombre: 'usuarios-editar',
    titulo: 'Administración · Edición de usuario',
    tipo: 'formulario',
    acciones: [
      { nombre: 'usuarios-editar-tab-permisos', titulo: 'Edición de usuario · Pestaña Permisos', tipo: 'componente', click: '[role="tab"]:has-text("Permisos")' },
    ],
  },
  { ruta: '/administracion/listas', nombre: 'administracion-listas', titulo: 'Administración · Listas', tipo: 'tabla', principal: true },
  { ruta: '/configuracion/campos', nombre: 'configuracion-campos', titulo: 'Configuración · Campos', tipo: 'tabla', principal: true },
  { ruta: '/configuracion/reglas', nombre: 'configuracion-reglas', titulo: 'Configuración · Reglas', tipo: 'formulario', principal: true },
  { ruta: '/perfil', nombre: 'perfil', titulo: 'Mi perfil', tipo: 'vista', principal: true },
  { ruta: '/ruta-que-no-existe', nombre: 'error-404', titulo: 'Error 404 · Página no encontrada', tipo: 'error', principal: true },
];

/** Estados de chrome de la aplicación (sidebar, header, panel de temas). */
export const ESTADOS_LAYOUT = [
  { nombre: 'layout-sidebar-expandido', titulo: 'Sidebar expandido', ruta: '/dashboard', sidebarColapsado: false },
  { nombre: 'layout-sidebar-colapsado', titulo: 'Sidebar contraído', ruta: '/dashboard', sidebarColapsado: true },
  {
    nombre: 'layout-sidebar-grupos-abiertos',
    titulo: 'Sidebar · grupos desplegados',
    ruta: '/dashboard',
    sidebarColapsado: false,
    clicks: ['aside button:has-text("Administración")', 'aside button:has-text("Configuración")'],
  },
  {
    nombre: 'layout-panel-apariencia',
    titulo: 'Panel de apariencia (selector de temas)',
    ruta: '/dashboard',
    clicks: ['button[aria-label="Personalizar apariencia"]'],
  },
];

/** Variantes del modal unificado de feedback (ModalService). */
export const MODALES_FEEDBACK = [
  { tipo: 'info', nombre: 'modal-info', titulo: 'Modal · Información', args: ['Información del registro', 'El registro se encuentra en estado PENDIENTE de revisión por la Unidad Responsable.'] },
  { tipo: 'warning', nombre: 'modal-advertencia', titulo: 'Modal · Advertencia', args: ['Advertencia', 'Existen campos obligatorios sin completar en el Paso 2. Revise la información antes de continuar.'] },
  { tipo: 'confirm', nombre: 'modal-confirmacion', titulo: 'Modal · Confirmación', args: ['Confirmar eliminación', '¿Está seguro de eliminar el registro seleccionado? Esta acción no se puede deshacer.'] },
  { tipo: 'success', nombre: 'modal-exito', titulo: 'Modal · Éxito', args: ['Registro guardado', 'El registro de capacitación fue guardado correctamente y enviado a revisión.'] },
  { tipo: 'error', nombre: 'modal-error', titulo: 'Modal · Error', args: ['Error de validación', 'No fue posible guardar el registro: el DNI ingresado ya se encuentra registrado en este curso.'] },
  { tipo: 'vacio', nombre: 'modal-vacio', titulo: 'Modal · Vacío (sin contenido)', args: ['', ''] },
];

/** Variantes del sistema de toasts (ToastService). */
export const TOASTS = [
  { tipo: 'success', nombre: 'toast-exito', titulo: 'Toast · Éxito', args: ['Registro guardado', 'Los cambios se aplicaron correctamente.'] },
  { tipo: 'info', nombre: 'toast-info', titulo: 'Toast · Información', args: ['Sincronización en curso', 'Se están actualizando los catálogos.'] },
  { tipo: 'warning', nombre: 'toast-advertencia', titulo: 'Toast · Advertencia', args: ['Sesión por expirar', 'Su sesión finalizará en 5 minutos.'] },
  { tipo: 'error', nombre: 'toast-error', titulo: 'Toast · Error', args: ['No se pudo guardar', 'Verifique su conexión e intente nuevamente.'] },
];

/**
 * Escenarios de estado — evidencian el comportamiento de la interfaz, no sólo
 * su apariencia estática: formularios llenos, validaciones, mensajes de éxito
 * y error, paginación, filtros, estados vacíos, calendario y carga.
 *
 * Cada escenario navega en limpio a `ruta`, ejecuta `pasos` y captura.
 * Pasos disponibles: click · fill · select · check · press · esperar ·
 * esperarSelector. Con `sinEsperar: true` se dispara la captura de inmediato
 * (necesario para atrapar un estado de carga antes de que termine).
 */
export const ESCENARIOS = [
  /* ---------- Bandeja de capacitaciones: tabla, filtros, paginación ---------- */
  {
    ruta: '/capacitaciones-n1',
    nombre: 'bandeja-estado-con-datos',
    titulo: 'Bandeja · Tabla con datos (estado inicial)',
    tipo: 'tabla',
    pasos: [],
  },
  {
    ruta: '/capacitaciones-n1',
    nombre: 'bandeja-estado-sin-datos',
    titulo: 'Bandeja · Estado vacío (sin resultados para el filtro)',
    tipo: 'tabla',
    pasos: [{ fill: 'input[placeholder^="Buscar por"]', valor: 'zzzz-sin-coincidencias' }, { esperar: 500 }],
  },
  {
    ruta: '/capacitaciones-n1',
    nombre: 'bandeja-filtro-estado-aplicado',
    titulo: 'Bandeja · Filtro por estado aplicado',
    tipo: 'tabla',
    pasos: [
      { click: '#filtro-estado' },
      { esperar: 250 },
      { click: 'mat-option:has-text("Registrado")' },
      { esperar: 400 },
    ],
  },
  {
    ruta: '/capacitaciones-n1',
    nombre: 'bandeja-paginacion-pagina-2',
    titulo: 'Bandeja · Paginación (página 2)',
    tipo: 'tabla',
    pasos: [{ click: 'mat-paginator button[aria-label="Página siguiente"]' }, { esperar: 400 }],
  },
  {
    ruta: '/capacitaciones-n1',
    nombre: 'bandeja-paginacion-50-registros',
    titulo: 'Bandeja · Paginación a 50 registros por página',
    tipo: 'tabla',
    pasos: [
      { click: 'mat-paginator mat-select' },
      { esperar: 250 },
      { click: 'mat-option:has-text("50")' },
      { esperar: 500 },
    ],
  },
  {
    ruta: '/capacitaciones-n1',
    nombre: 'bandeja-calendario-rango-fechas',
    titulo: 'Bandeja · Calendario de rango de fechas abierto',
    tipo: 'componente',
    pasos: [{ click: 'app-date-range-picker button' }, { esperar: 500 }],
  },
  {
    ruta: '/usuarios',
    nombre: 'usuarios-selector-columnas',
    titulo: 'Gestión de Usuarios · Selector de columnas desplegado',
    tipo: 'componente',
    pasos: [{ click: 'button:has-text("Columnas")' }, { esperar: 500 }],
  },
  {
    ruta: '/usuarios',
    nombre: 'usuarios-estado-sin-datos',
    titulo: 'Gestión de Usuarios · Estado vacío (sin coincidencias)',
    tipo: 'tabla',
    pasos: [{ fill: 'input[placeholder*="Buscar" i]', valor: 'zzzz-sin-coincidencias' }, { esperar: 500 }],
  },

  /* ---------- Alta de usuario: formulario, validación, éxito, carga ---------- */
  {
    ruta: '/usuarios/nuevo',
    nombre: 'usuario-formulario-vacio',
    titulo: 'Nuevo usuario · Formulario vacío',
    tipo: 'formulario',
    pasos: [],
  },
  {
    ruta: '/usuarios/nuevo',
    nombre: 'usuario-validacion-dni-invalido',
    titulo: 'Nuevo usuario · Validación de DNI inválido (modal de error)',
    tipo: 'modal',
    pasos: [
      { fill: 'input[formcontrolname="dni"]', valor: '123' },
      { click: 'button:has-text("Buscar")' },
      { esperar: 600 },
    ],
  },
  {
    ruta: '/usuarios/nuevo',
    nombre: 'usuario-estado-carga-reniec',
    titulo: 'Nuevo usuario · Estado de carga (consulta RENIEC en curso)',
    tipo: 'componente',
    sinEsperar: true,
    pasos: [
      { fill: 'input[formcontrolname="dni"]', valor: '45678912' },
      { click: 'button:has-text("Buscar")' },
      { esperar: 300 },
    ],
  },
  {
    ruta: '/usuarios/nuevo',
    nombre: 'usuario-mensaje-exito-reniec',
    titulo: 'Nuevo usuario · Mensaje de éxito (datos recuperados de RENIEC)',
    tipo: 'modal',
    pasos: [
      { fill: 'input[formcontrolname="dni"]', valor: '45678912' },
      { click: 'button:has-text("Buscar")' },
      { esperar: 1600 },
    ],
  },
  {
    ruta: '/usuarios/nuevo',
    nombre: 'usuario-formulario-con-datos',
    titulo: 'Nuevo usuario · Formulario con datos cargados',
    tipo: 'formulario',
    pasos: [
      { fill: 'input[formcontrolname="dni"]', valor: '45678912' },
      { click: 'button:has-text("Buscar")' },
      { esperar: 1600 },
      { click: 'button:has-text("Aceptar")' },
      { esperar: 500 },
    ],
  },
  {
    ruta: '/usuarios/nuevo',
    nombre: 'usuario-validacion-guardar-incompleto',
    titulo: 'Nuevo usuario · Validación al guardar con datos incompletos',
    tipo: 'modal',
    pasos: [{ click: 'button:has-text("Siguiente")' }, { esperar: 800 }],
  },

  /* ---------- Alta de capacitación: formulario y validación ---------- */
  {
    ruta: '/capacitaciones-n1/nuevo',
    nombre: 'capacitacion-formulario-vacio',
    titulo: 'Nueva capacitación · Formulario vacío (Paso 1)',
    tipo: 'formulario',
    pasos: [],
  },
  {
    ruta: '/capacitaciones-n1/nuevo',
    nombre: 'capacitacion-validacion-guardar-vacio',
    titulo: 'Nueva capacitación · Validación al guardar sin completar',
    tipo: 'modal',
    pasos: [{ click: 'button:has-text("Guardar y continuar")' }, { esperar: 900 }],
  },
  {
    ruta: '/capacitaciones-n1/nuevo',
    nombre: 'capacitacion-formulario-con-datos',
    titulo: 'Nueva capacitación · Formulario con datos',
    tipo: 'formulario',
    pasos: [
      { select: 'select[formcontrolname="tematica"]', valor: { index: 1 } },
      { select: 'select[formcontrolname="tipoEvento"]', valor: { index: 1 } },
      { fill: 'input[formcontrolname="fecha"]', valor: '2026-08-14' },
      { fill: 'input[formcontrolname="horas"]', valor: '8' },
      { fill: 'input[formcontrolname="nombre"]', valor: 'Manejo integrado de plagas en cultivo de café' },
      { fill: 'input[formcontrolname="extensionista"]', valor: 'Carlos Candelaria Burgos' },
      { fill: 'textarea[formcontrolname="observaciones"]', valor: 'Evento de prueba generado por el recorrido automatizado de evidencia.' },
      { select: 'select[formcontrolname="region"]', valor: { index: 1 } },
      { esperar: 400 },
      { select: 'select[formcontrolname="provincia"]', valor: { index: 1 } },
      { esperar: 400 },
      { select: 'select[formcontrolname="distrito"]', valor: { index: 1 } },
      { esperar: 500 },
    ],
  },

  /* ---------- Seguimiento y listas ---------- */
  {
    ruta: '/seguimiento/revision',
    nombre: 'seguimiento-estado-sin-datos',
    titulo: 'Seguimiento · Estado vacío (sin coincidencias)',
    tipo: 'tabla',
    pasos: [{ fill: 'input[type="text"][placeholder*="Buscar" i]', valor: 'zzzz-sin-coincidencias' }, { esperar: 500 }],
  },
  {
    ruta: '/administracion/listas',
    nombre: 'listas-modal-nueva-opcion-con-datos',
    titulo: 'Listas · Modal de nueva opción con datos',
    tipo: 'modal',
    pasos: [
      { click: 'button:has-text("Estado Civil")' },
      { esperar: 600 },
      { click: 'button[title*="Nueva" i], button[aria-label*="Nueva" i], button:has-text("Nueva opción")' },
      { esperar: 600 },
      { fill: '.fixed input[type="text"]:not([readonly]):not([disabled])', valor: 'Conviviente — evidencia automatizada' },
      { esperar: 300 },
    ],
  },
  {
    ruta: '/configuracion/campos',
    nombre: 'campos-modal-nuevo-con-datos',
    titulo: 'Configuración de campos · Modal de campo personalizado con datos',
    tipo: 'modal',
    pasos: [
      { click: 'button:has-text("Nuevo campo personalizado")' },
      { esperar: 600 },
      { fill: 'input[placeholder*="Tipo de cultivo" i], .fixed input[type="text"]:not([readonly]):not([disabled])', valor: 'Superficie sembrada (ha)' },
      { esperar: 300 },
    ],
  },
  {
    ruta: '/capacitaciones-n1/nuevo',
    nombre: 'capacitacion-mensaje-exito-guardado',
    titulo: 'Nueva capacitación · Mensaje de éxito al guardar',
    tipo: 'modal',
    pasos: [
      { select: 'select[formcontrolname="tematica"]', valor: { index: 1 } },
      { select: 'select[formcontrolname="tipoEvento"]', valor: { index: 1 } },
      { fill: 'input[formcontrolname="fecha"]', valor: '2026-08-14' },
      { fill: 'input[formcontrolname="horas"]', valor: '8' },
      { fill: 'input[formcontrolname="nombre"]', valor: 'Manejo integrado de plagas en cultivo de café' },
      { fill: 'input[formcontrolname="extensionista"]', valor: 'Carlos Candelaria Burgos' },
      { select: 'select[formcontrolname="region"]', valor: { index: 1 } },
      { esperar: 400 },
      { select: 'select[formcontrolname="provincia"]', valor: { index: 1 } },
      { esperar: 400 },
      { select: 'select[formcontrolname="distrito"]', valor: { index: 1 } },
      { esperar: 400 },
      { click: 'button:has-text("Guardar y continuar")' },
      { esperar: 1000 },
    ],
  },
];

/** Vistas que se recorren para cada perfil no principal. */
export const RUTAS_POR_PERFIL = [
  '/dashboard',
  '/capacitaciones-n1',
  '/seguimiento/revision',
  '/seguimiento/aprobacion',
  '/reportes',
  '/usuarios',
  '/administracion/listas',
  '/configuracion/campos',
  '/configuracion/reglas',
  '/perfil',
];
