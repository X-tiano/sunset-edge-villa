// Vercel serverless function: receives the viewing-request form and emails it through Resend.
// Needs RESEND_API_KEY set in the Vercel project (Settings > Environment Variables).
// Optional: ENQUIRY_TO (default info@christianopropertymanagement.com), ENQUIRY_FROM.

const TO = process.env.ENQUIRY_TO || 'info@christianopropertymanagement.com';
const FROM = process.env.ENQUIRY_FROM || 'Sunset Edge Villa <enquiries@christianopropertymanagement.com>';
const ALLOWED_TYPES = [
  'Leadership offsite', 'Wellness or detox retreat', 'Celebration or micro-wedding',
  'Brand launch or shoot', 'Private chef dinner', "Writers' or creative retreat", 'Something else'
];
const LIMITS = { name: 120, email: 200, phone: 40, type: 60, dates: 160, guests: 6, message: 4000, page: 120 };

function clean(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
}
function esc(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false }); }
  if (!process.env.RESEND_API_KEY) return res.status(503).json({ ok: false, error: 'not_configured' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = null; } }
  if (!body || typeof body !== 'object') return res.status(400).json({ ok: false, error: 'bad_request' });

  const d = {};
  for (const k of Object.keys(LIMITS)) d[k] = clean(body[k], LIMITS[k]);
  if (!ALLOWED_TYPES.includes(d.type)) d.type = 'Something else';

  // Bots tend to submit instantly; a person needs a few seconds to fill the form.
  if (Number(body.elapsed) > 0 && Number(body.elapsed) < 3000) return res.status(200).json({ ok: true });

  if (!d.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) {
    return res.status(422).json({ ok: false, error: 'invalid' });
  }

  const rows = [
    ['Name', d.name], ['Email', d.email], ['Phone', d.phone], ['Event type', d.type],
    ['Dates', d.dates], ['Guests', d.guests], ['Message', d.message], ['Sent from', d.page || '/']
  ];
  const html =
    '<div style="font-family:Arial,sans-serif;font-size:15px;color:#23211e">' +
    '<p style="margin:0 0 16px">New viewing request from the Sunset Edge Villa website.</p>' +
    '<table cellpadding="8" style="border-collapse:collapse">' +
    rows.map(([k, v]) =>
      '<tr><td style="border-bottom:1px solid #e5ddd1;color:#7d5f3a;vertical-align:top;white-space:nowrap">' + k +
      '</td><td style="border-bottom:1px solid #e5ddd1;white-space:pre-wrap">' + (v ? esc(v) : '<span style="color:#9a9187">Not given</span>') + '</td></tr>'
    ).join('') +
    '</table><p style="margin:16px 0 0;color:#6b645b;font-size:13px">Reply to this email to answer ' + esc(d.name) + ' directly.</p></div>';
  const text = rows.map(([k, v]) => k + ': ' + (v || 'Not given')).join('\n');

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: d.email,
        subject: 'Viewing request: ' + d.type + ' (' + d.name + ')',
        html,
        text,
        tags: [{ name: 'source', value: 'sunset-edge-villa' }]
      })
    });
    if (!r.ok) {
      console.error('Resend error', r.status, await r.text());
      return res.status(502).json({ ok: false, error: 'send_failed' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Resend request failed', e);
    return res.status(502).json({ ok: false, error: 'send_failed' });
  }
};
