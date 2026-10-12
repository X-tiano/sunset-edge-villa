/* Minimal renderer for the exported Sunset Edge Villa page.
   Renders the <template id="page"> markup with {{holes}}, <sc-for> and <sc-if>,
   and patches the live DOM in place so CSS transitions keep working. */
(function () {
  class DCLogic {
    constructor(props) { this.props = props || {}; this.state = {}; }
    setState(patch) {
      const next = typeof patch === 'function' ? patch(this.state) : patch;
      this.state = Object.assign({}, this.state, next);
      schedule();
    }
    forceUpdate() { schedule(); }
  }
  window.DCLogic = DCLogic;

  const HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  const WHOLE = /^\{\{\s*([^}]+?)\s*\}\}$/;

  function lookup(ctx, path) {
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), ctx);
  }
  function interp(str, ctx) {
    return str.replace(HOLE, (_, p) => { const v = lookup(ctx, p); return v == null ? '' : String(v); });
  }

  function build(node, ctx, out) {
    if (node.nodeType === 3) { out.push(document.createTextNode(interp(node.nodeValue, ctx))); return; }
    if (node.nodeType !== 1) return;
    const tag = node.localName;
    if (tag === 'sc-for') {
      const list = lookup(ctx, (node.getAttribute('list') || '').replace(/[{}\s]/g, '')) || [];
      const as = node.getAttribute('as') || 'item';
      list.forEach((item, i) => {
        const c = Object.create(ctx); c[as] = item; c.$index = i;
        node.childNodes.forEach((ch) => build(ch, c, out));
      });
      return;
    }
    if (tag === 'sc-if') {
      if (lookup(ctx, (node.getAttribute('value') || '').replace(/[{}\s]/g, ''))) node.childNodes.forEach((ch) => build(ch, ctx, out));
      return;
    }
    const el = node.cloneNode(false);
    el.__h = {};
    for (const a of Array.from(node.attributes)) {
      if (a.name.startsWith('hint-')) { el.removeAttribute(a.name); continue; }
      const m = a.value.match(WHOLE);
      if (/^on[a-z]/i.test(a.name) && m) {
        el.removeAttribute(a.name);
        const fn = lookup(ctx, m[1]);
        if (typeof fn === 'function') el.__h[a.name.slice(2).toLowerCase()] = fn;
      } else if (a.value.indexOf('{{') !== -1) {
        el.setAttribute(a.name, interp(a.value, ctx));
      }
    }
    const kids = [];
    node.childNodes.forEach((ch) => build(ch, ctx, kids));
    kids.forEach((k) => el.appendChild(k));
    out.push(el);
  }

  function bind(el, h) {
    el.__h = h;
    el.__b = el.__b || {};
    Object.keys(h).forEach((type) => {
      if (el.__b[type]) return;
      el.__b[type] = true;
      el.addEventListener(type, (e) => { const f = el.__h && el.__h[type]; if (f) f(e); });
    });
  }
  function bindTree(el) {
    if (el.nodeType !== 1) return;
    if (el.__h) bind(el, el.__h);
    el.childNodes.forEach(bindTree);
  }
  function patch(live, fresh) {
    if (live.nodeType === 3) { if (live.nodeValue !== fresh.nodeValue) live.nodeValue = fresh.nodeValue; return; }
    for (const a of Array.from(live.attributes)) if (!fresh.hasAttribute(a.name)) live.removeAttribute(a.name);
    for (const a of Array.from(fresh.attributes)) if (live.getAttribute(a.name) !== a.value) live.setAttribute(a.name, a.value);
    bind(live, fresh.__h || {});
    patchChildren(live, Array.from(fresh.childNodes));
  }
  function patchChildren(parent, fresh) {
    const live = Array.from(parent.childNodes);
    fresh.forEach((f, i) => {
      const l = live[i];
      if (!l) { parent.appendChild(f); bindTree(f); }
      else if (l.nodeType === f.nodeType && l.nodeName === f.nodeName) patch(l, f);
      else { parent.replaceChild(f, l); bindTree(f); }
    });
    for (let i = fresh.length; i < live.length; i++) parent.removeChild(live[i]);
  }

  let comp, tpl, root, queued = false;
  function render() {
    queued = false;
    const out = [];
    tpl.content.childNodes.forEach((n) => build(n, comp.renderVals(), out));
    patchChildren(root, out);
  }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(render); } }

  window.mountPage = function (Component, props) {
    tpl = document.getElementById('page');
    root = document.getElementById('root');
    comp = new Component(props);
    render();
    if (comp.componentDidMount) comp.componentDidMount();
  };
})();
