// Banc de test pour les fichiers .dc.html : logique (renderVals + handlers), trous {{}} et balises.
const fs = require('fs');

const timers = [];
global.setTimeout = (fn, ms) => { timers.push({ fn, ms }); return timers.length; };
global.clearTimeout = () => {};

class DCLogic {
  constructor(props) { this.props = props || {}; this.state = undefined; }
  setState(p) { const patch = typeof p === 'function' ? p(this.state) : p; this.state = Object.assign({}, this.state || {}, patch); }
  forceUpdate() {}
}
global.DCLogic = DCLogic;

function load(file, props) {
  const src = fs.readFileSync(file, 'utf8');
  const m = src.match(/<script type="text\/x-dc" data-dc-script[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('script x-dc introuvable dans ' + file);
  const Component = new Function('DCLogic', m[1] + '\nreturn Component;')(DCLogic);
  const tpl = src.match(/<x-dc>([\s\S]*?)<\/x-dc>/)[1];
  const c = new Component(props || {});
  return { c, tpl, src };
}

function resolve(path, env, vals) {
  const parts = path.split('.');
  let cur = Object.prototype.hasOwnProperty.call(env, parts[0]) ? env[parts[0]] : vals[parts[0]];
  for (let i = 1; i < parts.length; i++) { if (cur == null) return undefined; cur = cur[parts[i]]; }
  return cur;
}

function checkHoles(tpl, vals) {
  const errors = [];
  const re = /<sc-for\b([^>]*)>|<\/sc-for>|\{\{\s*([^}]+?)\s*\}\}/g;
  let envs = [{}];
  const stack = [];
  let m;
  while ((m = re.exec(tpl))) {
    if (m[0].startsWith('<sc-for')) {
      const list = (m[1].match(/list="\{\{\s*([^}]+?)\s*\}\}"/) || [])[1];
      const as = (m[1].match(/as="([^"]+)"/) || [])[1];
      stack.push(envs);
      const next = [];
      envs.forEach(env => {
        const arr = resolve(list, env, vals);
        if (!Array.isArray(arr)) errors.push('liste non tableau : ' + list);
        else arr.forEach(it => next.push(Object.assign({}, env, { [as]: it })));
      });
      envs = next;
    } else if (m[0] === '</sc-for>') {
      envs = stack.pop();
    } else {
      const p = m[2];
      if (/^(true|false|\d+|\$index)$/.test(p)) continue;
      // la liste d'un sc-for est vérifiée à l'ouverture
      envs.forEach(env => { if (resolve(p, env, vals) === undefined) errors.push('trou indéfini : ' + p); });
    }
  }
  return [...new Set(errors)];
}

function checkTags(src) {
  const body = src.replace(/<script[\s\S]*?<\/script>/g, '');
  const VOID = new Set(['meta', 'link', 'br', 'img', 'input', 'hr', 'source']);
  const re = /<(\/?)([a-zA-Z][\w-]*)\b[^>]*?(\/?)>/g;
  const stack = [];
  const errors = [];
  let m;
  while ((m = re.exec(body))) {
    const [, close, name, self] = m;
    const n = name.toLowerCase();
    if (VOID.has(n) || self) continue;
    if (!close) stack.push(n);
    else {
      const top = stack.pop();
      if (top !== n) { errors.push('balise mal fermée : </' + n + '> attendu </' + top + '>'); break; }
    }
  }
  if (stack.length) errors.push('balises non fermées : ' + stack.join(', '));
  return errors;
}

let nbOk = 0, nbKo = 0;
function assert(cond, msg) {
  if (cond) { nbOk++; } else { nbKo++; console.log('  ÉCHEC : ' + msg); }
}
function report(name) { console.log(`${name} : ${nbOk} vérifications OK, ${nbKo} échec(s)`); return nbKo; }

module.exports = { load, checkHoles, checkTags, assert, report, timers };
