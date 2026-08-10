/**
 * Auditoría visual — se ejecuta dentro del navegador sobre la vista ya
 * renderizada y devuelve una lista de hallazgos. No modifica el DOM.
 */

/** Función serializada que corre en el contexto de la página. */
export const AUDIT_FN = /* js */ `(() => {
  const hallazgos = [];
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const add = (regla, severidad, mensaje, sel) =>
    hallazgos.push({ regla, severidad, mensaje, selector: sel || '' });

  /* ---------- utilidades ---------- */
  const ruta = (el) => {
    if (!el || !el.tagName) return '';
    const partes = [];
    let n = el, saltos = 0;
    while (n && n.tagName && saltos < 4) {
      let s = n.tagName.toLowerCase();
      if (n.id) { partes.unshift(s + '#' + n.id); break; }
      const cls = (n.getAttribute('class') || '').trim().split(/\\s+/).filter(Boolean).slice(0, 2);
      if (cls.length) s += '.' + cls.join('.');
      partes.unshift(s);
      n = n.parentElement; saltos++;
    }
    return partes.join(' > ');
  };

  const texto = (el) => (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 60);

  /* El design system declara los colores en oklch(): se resuelven a sRGB
     pintando un píxel en un canvas, que acepta cualquier sintaxis CSS. */
  const _cv = document.createElement('canvas');
  _cv.width = _cv.height = 1;
  const _cx = _cv.getContext('2d', { willReadFrequently: true });
  const _cacheColor = new Map();

  const parseColor = (c) => {
    if (!c) return null;
    if (_cacheColor.has(c)) return _cacheColor.get(c);
    let res = null;
    try {
      _cx.clearRect(0, 0, 1, 1);
      _cx.fillStyle = '#000000';
      const previo = _cx.fillStyle;
      _cx.fillStyle = c;
      if (_cx.fillStyle === previo && !/^#0{3,8}$|black/i.test(c.trim())) {
        // El navegador no reconoció el valor: se descarta.
        _cacheColor.set(c, null);
        return null;
      }
      _cx.fillRect(0, 0, 1, 1);
      const d = _cx.getImageData(0, 0, 1, 1).data;
      res = { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
    } catch { res = null; }
    _cacheColor.set(c, res);
    return res;
  };

  const lum = ({ r, g, b }) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };

  const mezclar = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });

  const fondoEfectivo = (el) => {
    let n = el;
    let acumulado = null;
    while (n && n !== document.documentElement) {
      const c = parseColor(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0) {
        acumulado = acumulado ? mezclar(acumulado, c) : c;
        if (acumulado.a >= 0.99) return acumulado;
      }
      n = n.parentElement;
    }
    return acumulado && acumulado.a >= 0.99 ? acumulado : { r: 255, g: 255, b: 255, a: 1 };
  };

  const contraste = (fg, bg) => {
    const l1 = lum(fg), l2 = lum(bg);
    const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1];
    return (a + 0.05) / (b + 0.05);
  };

  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  /* ---------- 1. Scroll horizontal del documento ---------- */
  const de = document.documentElement;
  if (de.scrollWidth > de.clientWidth + 2) {
    add('scroll-horizontal', 'alta',
      'La página desborda horizontalmente: scrollWidth=' + de.scrollWidth + 'px frente a un viewport de ' + de.clientWidth + 'px.',
      'html');
  }

  /* Ámbito de análisis: con un modal abierto se audita el modal, porque el
     contenido de fondo está tapado a propósito y ya se auditó en su propia
     captura. Sin modal, se audita la página completa. */
  const modalActivo = Array.from(document.querySelectorAll('[role=dialog]')).find(visible) || null;
  const raiz = modalActivo || document.body;

  /* ---------- 2. Elementos que se salen del viewport ---------- */
  const todos = Array.from(raiz.querySelectorAll('*')).filter(visible);
  const desbordan = [];
  for (const el of todos) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (cs.position === 'fixed') continue;
    if (r.width === 0 || r.width > vw * 3) continue;
    if (r.right > vw + 2 && r.left < vw) desbordan.push({ el, exceso: Math.round(r.right - vw) });
    else if (r.left < -2 && r.right > 0) desbordan.push({ el, exceso: Math.round(-r.left) });
  }
  // Sólo se reportan los desbordes "hoja" (sin hijos que también desborden), para no duplicar.
  const setDesb = new Set(desbordan.map((d) => d.el));
  desbordan
    .filter((d) => !Array.from(d.el.children).some((c) => setDesb.has(c)))
    .slice(0, 12)
    .forEach((d) => add('fuera-de-viewport', d.exceso > 40 ? 'alta' : 'media',
      'Elemento fuera del área visible (' + d.exceso + 'px). Texto: "' + texto(d.el) + '".', ruta(d.el)));

  /* ---------- 3. Texto cortado / truncado ---------- */
  const cortados = [];
  for (const el of todos) {
    if (el.children.length > 0) continue;
    const t = (el.textContent || '').trim();
    if (t.length < 3) continue;
    const cs = getComputedStyle(el);
    const hayOverflow = el.scrollWidth > el.clientWidth + 1;
    if (!hayOverflow) continue;
    const declarado = cs.textOverflow === 'ellipsis' || cs.overflow === 'hidden' || cs.whiteSpace === 'nowrap';
    cortados.push({ el, declarado, t });
  }
  cortados.slice(0, 15).forEach((c) => add('texto-cortado', c.declarado ? 'baja' : 'media',
    (c.declarado ? 'Texto truncado con ellipsis' : 'Texto recortado sin ellipsis (overflow no declarado)') +
    ': "' + c.t.slice(0, 60) + '".', ruta(c.el)));

  /* ---------- 4. Contraste de texto ---------- */
  const vistosContraste = new Set();
  for (const el of todos) {
    if (el.children.length > 0) continue;
    const t = (el.textContent || '').trim();
    if (t.length < 2) continue;
    const cs = getComputedStyle(el);
    const fg = parseColor(cs.color);
    if (!fg) continue;
    const bg = fondoEfectivo(el);
    const c = contraste(fg.a < 1 ? mezclar(fg, bg) : fg, bg);
    const px = parseFloat(cs.fontSize);
    const grande = px >= 24 || (px >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
    const minimo = grande ? 3 : 4.5;
    if (c < minimo) {
      const clave = Math.round(c * 10) + '|' + cs.color + '|' + Math.round(px);
      if (vistosContraste.has(clave)) continue;
      vistosContraste.add(clave);
      add('contraste', c < minimo - 1.5 ? 'alta' : 'media',
        'Contraste ' + c.toFixed(2) + ':1 (mínimo WCAG AA ' + minimo + ':1) para "' + t.slice(0, 40) + '" — color ' + cs.color + ' sobre rgb(' + Math.round(bg.r) + ',' + Math.round(bg.g) + ',' + Math.round(bg.b) + ').',
        ruta(el));
    }
  }

  /* ---------- 5. Iconos sin color heredable / SVG sin dimensiones ---------- */
  let svgRotos = 0;
  document.querySelectorAll('svg').forEach((s) => {
    const r = s.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) svgRotos++;
  });
  if (svgRotos > 0) add('icono-sin-dimension', 'media', svgRotos + ' icono(s) SVG renderizados con ancho o alto 0.', 'svg');

  /* ---------- 6. Tablas ---------- */
  document.querySelectorAll('table').forEach((tb) => {
    const cols = tb.querySelectorAll('thead th').length;
    const filas = tb.querySelectorAll('tbody tr').length;
    if (cols > 0 && filas === 0) add('tabla-vacia', 'baja', 'Tabla con ' + cols + ' columnas y ningún registro visible.', ruta(tb));
    if (tb.scrollWidth > tb.clientWidth + 2 && !tb.closest('[class*=overflow]')) {
      add('tabla-desbordada', 'alta', 'La tabla desborda su contenedor y no tiene scroll horizontal declarado.', ruta(tb));
    }
    const primeraFila = tb.querySelector('tbody tr');
    if (primeraFila && cols > 0 && primeraFila.children.length !== cols) {
      add('tabla-inconsistente', 'media',
        'Desalineación: ' + cols + ' encabezados frente a ' + primeraFila.children.length + ' celdas en la primera fila.', ruta(tb));
    }
  });

  /* ---------- 7. Botones sin nombre accesible ---------- */
  const sinNombre = [];
  raiz.querySelectorAll('button, a[href], [role=button]').forEach((b) => {
    if (!visible(b)) return;
    const n = (b.getAttribute('aria-label') || b.getAttribute('title') || b.textContent || '').trim();
    if (!n) sinNombre.push(b);
  });
  sinNombre.slice(0, 8).forEach((b) => add('sin-nombre-accesible', 'media',
    'Control interactivo sin texto, aria-label ni title.', ruta(b)));

  /* ---------- 8. Área táctil mínima (sólo viewports táctiles) ---------- */
  if (vw <= 820) {
    const chicos = [];
    raiz.querySelectorAll('button, a[href], input[type=checkbox], input[type=radio], [role=button]').forEach((b) => {
      if (!visible(b)) return;
      const r = b.getBoundingClientRect();
      if (r.width < 32 || r.height < 32) chicos.push({ b, r });
    });
    if (chicos.length) {
      add('area-tactil', 'media',
        chicos.length + ' control(es) con área táctil menor a 32x32 px (recomendado 44x44). Ej.: "' + texto(chicos[0].b) + '".',
        ruta(chicos[0].b));
    }
  }

  /* ---------- 9. Superposición de controles ---------- */
  /* Con un modal abierto, el contenido de fondo queda tapado a propósito:
     sólo se analizan los controles del overlay para no generar falsos positivos. */
  const controles = Array.from(raiz.querySelectorAll('button, a[href], input, select'))
    .filter(visible)
    .filter((el) => getComputedStyle(el).position !== 'fixed')
    .slice(0, 220);
  let solapes = 0; let ejemplo = '';
  for (let i = 0; i < controles.length; i++) {
    for (let j = i + 1; j < controles.length; j++) {
      const a = controles[i], b = controles[j];
      if (a.contains(b) || b.contains(a)) continue;
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      const ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
      const oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
      if (ox > 4 && oy > 4) {
        solapes++;
        if (!ejemplo) ejemplo = '"' + texto(a) + '" ⟷ "' + texto(b) + '"';
      }
    }
  }
  if (solapes > 0) add('superposicion', solapes > 4 ? 'alta' : 'media',
    solapes + ' par(es) de controles interactivos superpuestos. Ej.: ' + ejemplo, 'body');

  /* ---------- 10. Scroll vertical innecesario ---------- */
  const excesoVertical = de.scrollHeight - vh;
  if (excesoVertical > 0 && excesoVertical < 40) {
    add('scroll-innecesario', 'baja',
      'La página genera scroll vertical por sólo ' + excesoVertical + 'px; probablemente sea un margen o alto residual.', 'html');
  }

  /* ---------- 11. Imágenes sin alt ---------- */
  const sinAlt = Array.from(document.querySelectorAll('img')).filter((i) => visible(i) && !i.getAttribute('alt'));
  if (sinAlt.length) add('img-sin-alt', 'baja', sinAlt.length + ' imagen(es) sin atributo alt.', ruta(sinAlt[0]));

  /* ---------- 12. Campos de formulario sin etiqueta ---------- */
  const sinLabel = Array.from(raiz.querySelectorAll('input:not([type=hidden]), select, textarea')).filter((el) => {
    if (!visible(el)) return false;
    if (el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.getAttribute('title')) return false;
    if (el.id && document.querySelector('label[for="' + CSS.escape(el.id) + '"]')) return false;
    return !el.closest('label');
  });
  if (sinLabel.length) add('campo-sin-etiqueta', 'media',
    sinLabel.length + ' campo(s) de formulario sin etiqueta asociada, aria-label ni placeholder.', ruta(sinLabel[0]));

  return hallazgos;
})()`;

/** Métricas de la vista (dimensiones, conteos) usadas por el reporte. */
export const METRICAS_FN = /* js */ `(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  scrollHeight: document.documentElement.scrollHeight,
  clientWidth: document.documentElement.clientWidth,
  tablas: document.querySelectorAll('table').length,
  filas: document.querySelectorAll('tbody tr').length,
  formularios: document.querySelectorAll('form').length,
  campos: document.querySelectorAll('input:not([type=hidden]), select, textarea').length,
  botones: document.querySelectorAll('button').length,
  modalAbierto: !!document.querySelector('[role=dialog], .fixed.inset-0'),
}))()`;
