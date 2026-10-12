/* Site behaviour for Sunset Edge Villa: viewing-request form and WhatsApp button.
   Lives outside the page renderer so re-renders never reset it. */
(function () {
  var EMAIL = 'info@christianopropertymanagement.com';
  var WHATSAPP = '35679790202';
  var ENDPOINT = 'https://formsubmit.co/ajax/' + EMAIL;
  var WA_TEXT = 'Hello, I would like to arrange a viewing at Sunset Edge Villa.';

  var css = document.createElement('style');
  css.textContent =
    '.sev-wa{position:fixed;right:20px;bottom:20px;z-index:60;display:flex;align-items:center;gap:10px;' +
    'padding:0 18px 0 14px;height:52px;border-radius:26px;background:#23211e;color:#f6f2ec;text-decoration:none;' +
    "font:500 14px/1 'DM Sans',system-ui,sans-serif;letter-spacing:.04em;box-shadow:0 8px 24px rgba(0,0,0,.18);" +
    'transition:opacity .3s,transform .3s}' +
    '.sev-wa svg{width:22px;height:22px;flex:none}' +
    '.sev-wa.is-hidden{opacity:0;transform:translateY(12px);pointer-events:none}' +
    '@media (max-width:640px){.sev-wa{right:16px;bottom:16px}}' +
    '.sev-toast{position:fixed;left:50%;bottom:88px;z-index:70;width:min(520px,calc(100vw - 32px));box-sizing:border-box;' +
    'transform:translate(-50%,12px);opacity:0;padding:18px 22px;background:#f6f2ec;color:#23211e;' +
    "border:1px solid #cbbfae;box-shadow:0 12px 32px rgba(0,0,0,.16);font:400 15px/1.5 'DM Sans',system-ui,sans-serif;" +
    'transition:opacity .3s,transform .3s}' +
    '.sev-toast.is-on{opacity:1;transform:translate(-50%,0)}' +
    '.sev-toast a{color:#7d5f3a}' +
    '#viewing-form [aria-invalid="true"]{border-color:#a4503a !important}' +
    '#viewing-form button[aria-busy="true"]{opacity:.6;cursor:progress}';
  document.head.appendChild(css);

  /* WhatsApp button */
  var wa = document.createElement('a');
  wa.className = 'sev-wa';
  wa.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(WA_TEXT);
  wa.target = '_blank';
  wa.rel = 'noopener';
  wa.setAttribute('aria-label', 'Message us on WhatsApp');
  wa.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3Z"/></svg>' +
    '<span>WhatsApp</span>';
  document.body.appendChild(wa);

  /* Hide the button while the enquiry form is on screen, so it never covers the fields */
  function watchEnquire() {
    var sec = document.getElementById('enquire');
    if (!sec || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (es) {
      wa.classList.toggle('is-hidden', es[0].isIntersecting && es[0].intersectionRatio > 0.25);
    }, { threshold: [0, 0.25, 0.5] }).observe(sec);
  }

  /* Toast */
  var toast = document.createElement('div');
  toast.className = 'sev-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.appendChild(toast);
  var tTimer;
  function say(html, ms) {
    toast.innerHTML = html;
    toast.classList.add('is-on');
    clearTimeout(tTimer);
    tTimer = setTimeout(function () { toast.classList.remove('is-on'); }, ms || 9000);
  }

  /* Form */
  var busy = false;
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || form.id !== 'viewing-form') return;
    e.preventDefault();
    if (busy) return;

    var bad = null;
    ['name', 'email'].forEach(function (n) {
      var f = form.elements[n];
      var ok = f && f.value.trim() && (n !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value.trim()));
      if (f) f.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (!ok && !bad) bad = f;
    });
    if (bad) { bad.focus(); say('Please add your name and a valid email so we can reply.', 5000); return; }

    var data = {};
    ['name', 'email', 'phone', 'type', 'dates', 'guests', 'message'].forEach(function (n) {
      if (form.elements[n]) data[n] = form.elements[n].value.trim();
    });
    data._subject = 'Viewing request: Sunset Edge Villa (' + (data.type || 'enquiry') + ')';
    data._replyto = data.email;
    data._template = 'table';

    var btn = form.querySelector('button[type="submit"]');
    busy = true;
    if (btn) btn.setAttribute('aria-busy', 'true');
    say('Sending your request…', 20000);

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok || String(res.j.success) === 'false') throw new Error('send failed');
        form.reset();
        say('Thank you, ' + (data.name.split(' ')[0] || '') + '. Your request has reached us and we will be in touch shortly to arrange a viewing.', 10000);
      })
      .catch(function () {
        say('Your request could not be sent just now. Please <a href="https://wa.me/' + WHATSAPP + '?text=' +
          encodeURIComponent(WA_TEXT) + '" target="_blank" rel="noopener">message us on WhatsApp</a> or email <a href="mailto:' +
          EMAIL + '">' + EMAIL + '</a>.', 15000);
      })
      .then(function () { busy = false; if (btn) btn.removeAttribute('aria-busy'); });
  });

  function ready() { watchEnquire(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
})();
