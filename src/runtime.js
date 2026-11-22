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
            // Fond gris d'une feuille : seul un toucher sur le fond la ferme, et elle descend d'un coup
            if (ev === 'click' && n.hasAttribute('data-fond')) el.addEventListener('click', e => { if (e.target === el) fermerFeuille(el, () => fn(e)); });
            else if (ev === 'click' && n.hasAttribute('data-poignee')) el.addEventListener('click', e => fermerFeuille(el.closest('[data-fond]'), () => fn(e)));
            else el.addEventListener(ev === 'change' ? 'input' : ev, fn);
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
  function sansMouvement() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  // La feuille descend et le fond s'efface, puis on ferme pour de bon
  function fermerFeuille(fond, fin) {
    const d = fond && fond.querySelector('[role=dialog]');
    if (!d || sansMouvement() || typeof d.animate !== 'function') { fin(); return; }
    d.animate([{ transform: 'none' }, { transform: 'translateY(100%)' }], { duration: 220, easing: 'cubic-bezier(.4, 0, 1, 1)', fill: 'forwards' });
    fond.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' });
    setTimeout(fin, 200);
  }
  function render() {
    pending = false;
    if (!inst) return;
    const vals = inst.renderVals();
    const sig = signature(vals);
    const same = sig === lastSig;
    lastSig = sig;
    const kept = {};
    KEEP.forEach(sel => app.querySelectorAll(sel).forEach((el, i) => { kept[sel + i] = [el.scrollTop, el.scrollLeft]; }));
    // Feuilles déjà ouvertes (pour ne faire monter que les nouvelles)
    const feuilles = new Set(Array.from(app.querySelectorAll('[role=dialog]')).map(d => d.getAttribute('aria-label')));
    // Éléments qui glissent d'une place à l'autre (bulle de la barre du bas)
    const avant = {};
    app.querySelectorAll('[data-glisse]').forEach(el => { avant[el.getAttribute('data-glisse')] = el.getBoundingClientRect(); });
    const act = document.activeElement;
    const focusId = act && app.contains(act) && act.id ? act.id : null;
    let s0 = null, s1 = null;
    if (focusId) { try { s0 = act.selectionStart; s1 = act.selectionEnd; } catch (e) { s0 = null; } }
    const avaitFocus = !!app.querySelector('[data-focus="true"]');
    const fenetresAvant = Array.from(app.querySelectorAll('[data-fenetre]')).map(el => el.getAttribute('data-fenetre'));
    const frag = document.createDocumentFragment();
    build(TEMPLATES[current], vals, frag);
    app.replaceChildren(frag);
    KEEP.forEach(sel => app.querySelectorAll(sel).forEach((el, i) => {
      const k = kept[sel + i];
      if (!k || (!same && sel !== 'nav')) return;
      el.scrollTop = k[0];
      el.scrollLeft = k[1];
    }));
    const calme = sansMouvement();
    if (!calme) app.querySelectorAll('[role=dialog]').forEach(d => {
      if (feuilles.has(d.getAttribute('aria-label')) || typeof d.animate !== 'function') return;
      d.animate([{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.2, .8, .2, 1)' });
      const fond = d.closest('[data-fond]');
      if (fond) fond.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
    });
    app.querySelectorAll('[data-glisse]').forEach(el => {
      const a = avant[el.getAttribute('data-glisse')];
      if (!a || calme || typeof el.animate !== 'function') return;
      const dx = a.left - el.getBoundingClientRect().left;
      if (Math.abs(dx) > 1) el.animate([{ transform: 'translateX(' + dx + 'px)' }, { transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2, .8, .2, 1)' });
    });
    // Bande des dates : à l'ouverture ou quand on change de 2 mois, la date choisie se place au début
    // (si c'est la première date des 2 mois, on revient tout au début) ; sinon elle reste simplement visible.
    app.querySelectorAll('[data-visible="true"]').forEach(el => {
      const p = el.parentElement;
      if (!p || !p.getBoundingClientRect) return;
      const pr = p.getBoundingClientRect(), er = el.getBoundingClientRect();
      if (!pr.width) return;
      const nouvelle = p.hasAttribute('data-fenetre') && fenetresAvant.indexOf(p.getAttribute('data-fenetre')) < 0;
      if (nouvelle) {
        const dates = Array.from(p.querySelectorAll('[data-visible]'));
        const debut = er.left - pr.left + p.scrollLeft;
        p.scrollLeft = dates[0] === el ? 0 : Math.max(0, debut - 36);
      } else if (er.left < pr.left) p.scrollLeft -= (pr.left - er.left) + 24;
      else if (er.right > pr.right) p.scrollLeft += (er.right - pr.right) + 24;
    });
    app.querySelectorAll('[data-fenetre]').forEach(p => {
      if (fenetresAvant.indexOf(p.getAttribute('data-fenetre')) < 0 && !p.querySelector('[data-visible="true"]')) p.scrollLeft = 0;
    });
    // Champ à ouvrir directement (par exemple « Ajouter un commentaire ») : focus et défilement, une seule fois
    const aFocus = app.querySelector('[data-focus="true"]');
    if (aFocus && !avaitFocus && !focusId) {
      aFocus.focus({ preventScroll: true });
      if (aFocus.scrollIntoView) aFocus.scrollIntoView({ block: 'center', behavior: calme ? 'auto' : 'smooth' });
      return;
    }
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
  // Échap ferme la feuille ouverte (clavier d'ordinateur)
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const fonds = app.querySelectorAll('[data-fond]');
    if (fonds.length) fonds[fonds.length - 1].click();
  });
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
