{
  const app = document.getElementById('app');
  let pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    Promise.resolve().then(render);
  }
  class DCLogic {
    constructor(props) { this.props = props || {}; this.state = undefined; }
    setState(p) {
      const patch = typeof p === 'function' ? p(this.state, this.props) : p;
      this.state = Object.assign({}, this.state || {}, patch);
      schedule();
    }
    forceUpdate() { schedule(); }
  }

  /*__COMPONENTS__*/

  const COMPONENTS = { accueil: AccueilComponent, planning: PlanningComponent, serviteur: ServiteurComponent };
  const TEMPLATES = {
    accueil: document.getElementById('tpl-accueil').content,
    planning: document.getElementById('tpl-planning').content,
    serviteur: document.getElementById('tpl-serviteur').content
  };
  const ROUTES = {
    'Accueil.dc.html': ['accueil', {}],
    'Planning.dc.html': ['planning', {}],
    'Coordinateur.dc.html': ['planning', { profil: 'coordinateur' }],
    'Serviteur.dc.html': ['serviteur', {}]
  };
  const WHOLE = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;
  let current = null, inst = null, lastSig = '';

  function resolve(path, scope) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    const parts = path.split('.');
    let cur = scope[parts[0]];
    for (let i = 1; i < parts.length; i++) {
      if (cur == null) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }
  function interp(str, scope) {
    return str.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (m, p) => {
      const v = resolve(p, scope);
      return v == null ? '' : String(v);
    });
  }
  function build(src, scope, out) {
    src.childNodes.forEach(n => {
      if (n.nodeType === 3) {
        out.appendChild(document.createTextNode(n.nodeValue.indexOf('{{') >= 0 ? interp(n.nodeValue, scope) : n.nodeValue));
        return;
      }
      if (n.nodeType !== 1) return;
      const tag = n.localName;
      if (tag === 'sc-for') {
        const m = (n.getAttribute('list') || '').match(WHOLE);
        const list = m ? resolve(m[1], scope) : null;
        const as = n.getAttribute('as') || 'item';
        if (Array.isArray(list)) list.forEach((it, i) => build(n, Object.assign({}, scope, { [as]: it, $index: i }), out));
        return;
      }
      if (tag === 'sc-if') {
        const m = (n.getAttribute('value') || '').match(WHOLE);
        if (m && resolve(m[1], scope)) build(n, scope, out);
        return;
      }
      const el = document.importNode(n, false);
      Array.from(n.attributes).forEach(a => {
        const name = a.name, v = a.value;
        if (name.indexOf('hint-') === 0) { el.removeAttribute(name); return; }
        if (/^on[a-z]+$/.test(name)) {
          el.removeAttribute(name);
          const m = v.match(WHOLE);
          const fn = m ? resolve(m[1], scope) : null;
          if (typeof fn === 'function') {
            const ev = name.slice(2);
            el.addEventListener(ev === 'change' ? 'input' : ev, fn);
          }
          return;
        }
        if (v.indexOf('{{') < 0) return;
        const m = v.match(WHOLE);
        if (!m) { el.setAttribute(name, interp(v, scope)); return; }
        const val = resolve(m[1], scope);
        if (name === 'value') { el.removeAttribute('value'); el.value = val == null ? '' : String(val); return; }
        if (name === 'disabled' || name === 'checked' || name === 'hidden') { el.removeAttribute(name); if (val) el.setAttribute(name, ''); return; }
        if (val == null) { el.removeAttribute(name); return; }
        el.setAttribute(name, String(val));
      });
      build(n, scope, el);
      out.appendChild(el);
    });
  }
  function signature(v) {
    return current + '|' + Object.keys(v).filter(k => /^(show|mode)/.test(k)).map(k => k + '=' + !!v[k]).join(',');
  }
  const KEEP = ['main', 'nav', '[role=dialog]'];
  function render() {
    pending = false;
    if (!inst) return;
    const vals = inst.renderVals();
    const sig = signature(vals);
    const same = sig === lastSig;
    lastSig = sig;
    const kept = {};
    KEEP.forEach(sel => app.querySelectorAll(sel).forEach((el, i) => { kept[sel + i] = [el.scrollTop, el.scrollLeft]; }));
    const act = document.activeElement;
    const focusId = act && app.contains(act) && act.id ? act.id : null;
    let s0 = null, s1 = null;
    if (focusId) { try { s0 = act.selectionStart; s1 = act.selectionEnd; } catch (e) { s0 = null; } }
    const frag = document.createDocumentFragment();
    build(TEMPLATES[current], vals, frag);
    app.replaceChildren(frag);
    KEEP.forEach(sel => app.querySelectorAll(sel).forEach((el, i) => {
      const k = kept[sel + i];
      if (!k || (!same && sel !== 'nav')) return;
      el.scrollTop = k[0];
      el.scrollLeft = k[1];
    }));
    if (focusId) {
      const f = document.getElementById(focusId);
      if (f) {
        f.focus({ preventScroll: true });
        try { if (s0 != null) f.setSelectionRange(s0, s1); } catch (e) { s0 = null; }
      }
    }
  }
  function mount(name, props) {
    if (inst && inst.componentWillUnmount) inst.componentWillUnmount();
    current = name;
    inst = new COMPONENTS[name](props || {});
    lastSig = '';
    render();
    if (inst.componentDidMount) inst.componentDidMount();
  }
  app.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const h = a.getAttribute('href');
    if (ROUTES[h]) { e.preventDefault(); mount(ROUTES[h][0], ROUTES[h][1]); app.scrollTop = 0; return; }
    if (h.charAt(0) === '#') {
      e.preventDefault();
      const t = app.querySelector(h);
      if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
  document.addEventListener('gesturestart', e => e.preventDefault(), { passive: false });
  document.addEventListener('touchmove', e => { if (e.touches && e.touches.length > 1) e.preventDefault(); }, { passive: false });
  window.__kerygma = { mount: mount };
  const DEPART = '__DEPART__';
  if (ROUTES[DEPART]) mount(ROUTES[DEPART][0], ROUTES[DEPART][1]); else mount('accueil');
}
