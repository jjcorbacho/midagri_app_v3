/**
 * Catálogo de descripciones funcionales para el documento de evidencia.
 *
 * Se escribe a mano a partir de la lectura del código de cada componente: el
 * análisis estático da la estructura, pero no explica para qué sirve una
 * pantalla ni qué la condiciona. Cada entrada alimenta las secciones
 * «Descripción funcional», «Rol que puede acceder», «Componentes presentes» y
 * «Notas relevantes» del PDF.
 *
 * La clave es la ruta Angular (sin query string).
 */

export const TODOS_LOS_PERFILES = [
  'Administrador General',
  'Jefe de Área',
  'Administrador Unidad Ejecutora(UE)',
  'Administrador DZ_Cap_Asit.',
  'Técnico Capacitación y Asistencia Técnica',
];

export const DESCRIPCIONES = {
  '/auth': {
    modulo: 'Autenticación',
    descripcion:
      'Punto de entrada de la plataforma. Valida en vivo el usuario institucional unificado y, cuando la cuenta tiene varios registros o privilegios activos, abre el modal de acceso selectivo para elegir el perfil o la Unidad Responsable con la que se opera la sesión. Incluye el flujo de recuperación de contraseña.',
    roles: ['Público (sin sesión)'],
    componentes: ['LoginComponent', 'ReactiveFormsModule', 'lucide-angular'],
    notas:
      'La autenticación está simulada en memoria (AuthService.resolverIngreso): cualquier clave es válida y los usuarios provienen de UsuariosService. El equipo de backend debe sustituirla por POST /auth/login y emitir el JWT en confirmarIngreso().',
  },
  '/dashboard': {
    modulo: 'Inicio',
    descripcion:
      'Portada de la sesión. Saluda al usuario autenticado, muestra el área activa y presenta como tarjetas los módulos a los que el perfil tiene acceso, cada una con enlace directo. El conjunto de tarjetas se recorta según los permisos de menú del usuario.',
    roles: TODOS_LOS_PERFILES,
    componentes: ['DashboardComponent', 'ShellComponent', 'SidebarComponent', 'HeaderComponent', 'RouterLink'],
    notas: 'Es la ruta de aterrizaje tras el login y el destino del redirect de la ruta raíz.',
  },
  '/capacitaciones-n1': {
    modulo: 'Capacitaciones / Asistencia Técnica N1',
    descripcion:
      'Bandeja de control del registro N1. Lista los eventos de capacitación y asistencia técnica con KPIs de cabecera, buscador, filtros por estado y por región/provincia/distrito, selector de rango de fechas, exportación a Excel, paginación configurable y acciones por fila (participantes, sustento, edición).',
    roles: ['Administrador General', 'Técnico Capacitación y Asistencia Técnica'],
    componentes: ['BandejaComponent', 'DateRangePickerComponent', 'EstadoBadgeComponent', 'KpiCardComponent', 'ModalComponent'],
    notas:
      'Requiere el permiso de menú «Capacitación» o «Asistencia técnica». La columna Ubicación concatena Región / Provincia / Distrito y es la que provoca el desborde horizontal por debajo de 1366 px.',
  },
  '/capacitaciones-n1/nuevo': {
    modulo: 'Capacitaciones / Asistencia Técnica N1',
    descripcion:
      'Alta de un registro N1 mediante un asistente de tres pasos. El Paso 1 recoge los datos del evento (temática, tipo, fecha, horas, nombre, extensionista, observaciones), la ubicación jerárquica y las coordenadas, con conversión UTM y un mapa del Perú para situar el punto.',
    roles: ['Administrador General', 'Técnico Capacitación y Asistencia Técnica'],
    componentes: ['StepperComponent', 'CursoFormComponent', 'PeruMapComponent', 'AutocompleteComponent'],
    notas:
      'Los pasos 2 y 3 sólo se habilitan después de guardar el paso 1 (clickable() exige createdId). Los campos visibles y obligatorios los define Configuración de campos por área.',
  },
  '/capacitaciones-n1/:id': {
    modulo: 'Capacitaciones / Asistencia Técnica N1',
    descripcion:
      'Edición de un registro N1 existente. La query string ?paso=N abre directamente el Paso 1 (datos del evento), el Paso 2 (registro de participantes, con importación y validación por DNI) o el Paso 3 (documento sustentatorio, declaración jurada y envío a revisión).',
    roles: ['Administrador General', 'Técnico Capacitación y Asistencia Técnica'],
    componentes: ['StepperComponent', 'CursoFormComponent', 'ParticipanteFormComponent', 'SustentoModalComponent'],
    notas:
      'Sin ?paso el asistente abre en el Paso 2. El estado del registro condiciona qué se puede editar: una vez enviado pasa a sólo lectura hasta que se observe.',
  },
  '/seguimiento/revision': {
    modulo: 'Seguimiento',
    descripcion:
      'Bandeja de revisión de los registros enviados por las áreas. Permite consultar el detalle, descargar el sustento, ver observaciones y validar u observar cada registro para devolverlo al técnico.',
    roles: ['Administrador General', 'Administrador DZ_Cap_Asit.'],
    componentes: ['SeguimientoComponent', 'SeguimientoPanelComponent', 'EstadoBadgeComponent', 'ModalComponent'],
    notas:
      'Vista unificada: /seguimiento/revision y /seguimiento/aprobacion cargan el mismo componente y la ruta sólo fija la pestaña inicial. El Administrador General alterna ambos modos sin navegar.',
  },
  '/seguimiento/aprobacion': {
    modulo: 'Seguimiento',
    descripcion:
      'Bandeja de aprobación de los registros ya validados en revisión. Cierra el circuito aprobando u observando de forma definitiva, con la misma tabla, filtros y acciones que la pestaña de revisión.',
    roles: ['Administrador General', 'Jefe de Área', 'Administrador Unidad Ejecutora(UE)'],
    componentes: ['SeguimientoComponent', 'SeguimientoPanelComponent', 'EstadoBadgeComponent', 'ModalComponent'],
    notas: 'Requiere el permiso «Seguimiento y aprobación» o «Aprobación de Evaluación UO» según el perfil.',
  },
  '/reportes': {
    modulo: 'Reportes',
    descripcion:
      'Módulo de reportes institucionales de capacitaciones y asistencia técnica. En esta versión del prototipo la pantalla está en construcción y actúa como marcador del módulo previsto.',
    roles: ['Administrador General', 'Jefe de Área', 'Administrador Unidad Ejecutora(UE)', 'Administrador DZ_Cap_Asit.'],
    componentes: ['ReportesComponent'],
    notas:
      'Los permisos «Reporte de capacitaciones» y «Reporte de asistencia técnica» ya existen en la matriz, a la espera de la implementación.',
  },
  '/usuarios': {
    modulo: 'Administración',
    descripcion:
      'Gestión integral de usuarios SODEGA. Tabla maestra con buscador, filtros, selector de columnas visibles y paginación; por fila permite editar, cambiar el estado (habilitado/inhabilitado) y reasignar los registros de un usuario a otro.',
    roles: TODOS_LOS_PERFILES.filter((p) => p !== 'Técnico Capacitación y Asistencia Técnica'),
    componentes: ['GestionUsuariosComponent', 'ColumnSelectorComponent', 'ReasignarRegistroModalComponent', 'ModalComponent'],
    notas:
      'Todos los perfiles administrativos tienen el permiso «Gestión de usuarios» activo por defecto, pero cada uno ve el subconjunto de registros de su ámbito.',
  },
  '/usuarios/nuevo': {
    modulo: 'Administración',
    descripcion:
      'Alta de usuario en dos pestañas. «Datos del usuario» recupera la identidad desde el servicio simulado de RENIEC a partir del DNI y completa datos personales, presupuestales, ámbito territorial y metas; «Permisos» define qué opciones de menú verá el perfil.',
    roles: TODOS_LOS_PERFILES.filter((p) => p !== 'Técnico Capacitación y Asistencia Técnica'),
    componentes: ['UsuarioFormComponent', 'PermisosMenuFormComponent', 'AutocompleteComponent', 'ModalComponent'],
    notas:
      'La consulta a RENIEC está simulada con un retardo de 1 s (UsuariosService.consultarReniec), lo que permite evidenciar el estado de carga. El usuario unificado se genera automáticamente a partir de nombres, apellidos y DNI.',
  },
  '/usuarios/:id': {
    modulo: 'Administración',
    descripcion:
      'Edición de un usuario existente. Mismo formulario de dos pestañas que el alta, con el DNI y la sección RENIEC bloqueados, y con los periodos de gestión y las vigencias ya asignados al registro.',
    roles: TODOS_LOS_PERFILES.filter((p) => p !== 'Técnico Capacitación y Asistencia Técnica'),
    componentes: ['UsuarioFormComponent', 'PermisosMenuFormComponent', 'ModalComponent'],
    notas:
      'Un mismo usuario unificado puede tener varios registros, uno por servicio o unidad; la edición actúa sobre el registro identificado por :id.',
  },
  '/administracion/listas': {
    modulo: 'Administración',
    descripcion:
      'Catálogo maestro de listas del sistema (estado civil, sexo, fuente de financiamiento, unidad responsable, perfil autorizado, programas y categorías presupuestales, unidad funcional). Permite crear, editar e inhabilitar opciones de cada lista sin tocar el código.',
    roles: ['Administrador General'],
    componentes: ['ListasComponent', 'ModalComponent'],
    notas:
      'Requiere el permiso «Listas», activo sólo para el Administrador General. Las opciones alimentan los desplegables de toda la aplicación.',
  },
  '/configuracion/campos': {
    modulo: 'Configuración',
    descripcion:
      'Configurador de formularios por oficina responsable. Permite activar o desactivar los campos base de cada sección, reordenarlos por arrastre y añadir campos personalizados con su tipo y opciones, con una vista previa en vivo del formulario resultante en móvil y escritorio.',
    roles: ['Administrador General', 'Administrador Unidad Ejecutora(UE)'],
    componentes: ['CamposComponent', 'CampoModalComponent', 'OpcionesModalComponent', 'CampoPreviewComponent'],
    notas:
      'Los cambios se guardan como catálogo y se reflejan en el formulario de registro N1 del área correspondiente. Es la pantalla con más controles de formulario y la que concentra más avisos de etiquetado accesible.',
  },
  '/configuracion/reglas': {
    modulo: 'Configuración',
    descripcion:
      'Configurador de reglas de negocio por área: actividades habilitadas, aforos mínimos y máximos, rangos de horas y criterios de éxito que después validan el registro N1.',
    roles: ['Administrador General', 'Administrador Unidad Ejecutora(UE)'],
    componentes: ['ReglasComponent', 'ReactiveFormsModule'],
    notas: 'Las reglas se aplican por área activa; cambiar de área carga otro juego de valores.',
  },
  '/perfil': {
    modulo: 'Cuenta',
    descripcion:
      'Ficha de la sesión activa: nombre, correo institucional, perfil con el que se opera, unidad responsable y área asignada. Es de sólo lectura.',
    roles: TODOS_LOS_PERFILES,
    componentes: ['PerfilComponent', 'AuthService', 'AreaService'],
    notas: 'Accesible desde el menú del usuario en la cabecera; no está en el sidebar.',
  },
  '/ruta-que-no-existe': {
    modulo: 'Errores',
    descripcion:
      'Pantalla 404 servida por la ruta comodín (**). Se muestra ante cualquier URL no declarada en el router e incluye el enlace de retorno al inicio.',
    roles: TODOS_LOS_PERFILES.concat('Público (sin sesión)'),
    componentes: ['NotFoundComponent'],
    notas: 'Se documenta navegando a una URL inexistente a propósito; no es alcanzable desde la interfaz.',
  },
};

/** Descripción de los estados y componentes transversales (no ligados a una ruta). */
export const DESCRIPCIONES_TRANSVERSALES = {
  modal: {
    modulo: 'Componentes transversales',
    descripcion:
      'Modal unificado del sistema (ModalComponent + FeedbackModalComponent). Cuatro variantes visuales — información, advertencia, éxito y error — con estructura fija: icono de la variante, texto descriptivo, contenido proyectado y botonera. Las confirmaciones reutilizan la variante de advertencia.',
    roles: ['Transversal a todos los perfiles'],
    componentes: ['ModalComponent', 'FeedbackModalComponent', 'ModalService'],
    notas: 'Se monta una sola vez en AppComponent y renderiza la solicitud activa del ModalService.',
  },
  toast: {
    modulo: 'Componentes transversales',
    descripcion:
      'Sistema de notificaciones efímeras (ToastService + ToastContainerComponent) con cuatro tipos: éxito, información, advertencia y error. Se apilan en una esquina y se descartan solas o a mano.',
    roles: ['Transversal a todos los perfiles'],
    componentes: ['ToastContainerComponent', 'ToastService'],
    notas: 'Se usa para confirmaciones no bloqueantes; las bloqueantes van por el ModalService.',
  },
  layout: {
    modulo: 'Layout',
    descripcion:
      'Estructura común de la aplicación autenticada: sidebar con el menú filtrado por permisos (expandido o contraído, con grupos desplegables), cabecera con identidad del usuario y periodo de gestión, y panel flotante de apariencia para cambiar de tema.',
    roles: ['Transversal a todos los perfiles'],
    componentes: ['ShellComponent', 'SidebarComponent', 'HeaderComponent', 'ThemeSwitcherComponent'],
    notas:
      'El estado contraído del sidebar se guarda en sessionStorage y el tema elegido en localStorage. El sidebar no define breakpoints, por lo que mantiene su ancho fijo también en móvil.',
  },
  estado: {
    modulo: 'Estados de la interfaz',
    descripcion:
      'Evidencia del comportamiento dinámico: formularios vacíos y completos, validaciones bloqueantes, mensajes de éxito y error, filtros aplicados, paginación, estados vacíos, calendario desplegado y estados de carga.',
    roles: ['Transversal a todos los perfiles'],
    componentes: ['ModalService', 'ToastService', 'DateRangePickerComponent', 'ColumnSelectorComponent'],
    notas: 'Cada estado se reproduce con una secuencia declarativa de pasos definida en e2e/lib/plan.mjs.',
  },
};

/** Resuelve la ficha de una captura a partir de su ruta y su tipo. */
export function fichaDe(ruta, tipo, nombre = '') {
  const base = ruta ? DESCRIPCIONES[ruta.split('?')[0]] : null;
  if (base) return base;
  if (/^modal-|modal/.test(nombre) || tipo === 'modal') return DESCRIPCIONES_TRANSVERSALES.modal;
  if (/^toast/.test(nombre)) return DESCRIPCIONES_TRANSVERSALES.toast;
  if (/^layout/.test(nombre)) return DESCRIPCIONES_TRANSVERSALES.layout;
  return DESCRIPCIONES_TRANSVERSALES.estado;
}
