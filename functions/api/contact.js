// Cloudflare Pages Function: POST /api/contact
// Sends the contact form by email through Resend (https://resend.com).
//
// Environment variables (Cloudflare dashboard > the Pages project > Settings > Variables and Secrets):
//   RESEND_API_KEY  (secret)  Resend API key
//   CONTACT_TO                Where messages go, e.g. the practice inbox
//   CONTACT_FROM   (optional) Sender on a domain verified in Resend.
//                             Default: "Alli Pfaff Website <website@allipfaff.ca>"

const LIMITS = { name: 120, email: 200, phone: 40, for: 60, message: 5000 };

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function reply(request, status, message) {
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');
  if (wantsJson) {
    return new Response(JSON.stringify({ ok: status < 400, message }), {
      status,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }
  // Browser without JavaScript: go back to the contact page.
  const url = new URL('/contact/', request.url);
  url.searchParams.set(status < 400 ? 'sent' : 'error', '1');
  return Response.redirect(url.toString(), 303);
}

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.formData();
  } catch {
    return reply(request, 400, 'Something went wrong. Please try again.');
  }
  const field = (k) => String(data.get(k) || '').trim().slice(0, LIMITS[k] || 200);

  // Honeypot: real visitors never fill this hidden field. Pretend it worked.
  if (String(data.get('website') || '').trim()) return reply(request, 200, 'Thank you!');

  const name = field('name');
  const email = field('email');
  const phone = field('phone');
  const who = field('for');
  const message = field('message');

  if (!name || !email || !who) {
    return reply(request, 400, 'Please fill in your name, email and who you are seeking support for.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return reply(request, 400, 'Please check your email address.');
  }
  if (!env.RESEND_API_KEY || !env.CONTACT_TO) {
    console.error('contact: RESEND_API_KEY or CONTACT_TO is not set');
    return reply(request, 500, 'The form is temporarily unavailable. Please try again later.');
  }

  const rows = [
    ['Name', name],
    ['Email', email],
    ['Phone', phone || '—'],
    ['Seeking support for', who],
    ['Message', message || '—'],
  ];
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n\n');
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#33282A">
<p>New message from the contact form on allipfaff.ca:</p>
<table cellpadding="6" style="border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="vertical-align:top;color:#7A7064;white-space:nowrap"><strong>${k}</strong></td><td>${escapeHtml(v).replace(/\n/g, '<br>')}</td></tr>`)
    .join('')}</table>
<p style="color:#7A7064;font-size:13px">Reply to this email to answer ${escapeHtml(name)} directly.</p></div>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM || 'Alli Pfaff Website <website@allipfaff.ca>',
      to: env.CONTACT_TO.split(',').map((s) => s.trim()).filter(Boolean),
      reply_to: email,
      subject: `New inquiry from ${name} (${who})`,
      text,
      html,
    }),
  });

  if (!res.ok) {
    console.error('contact: Resend error', res.status, await res.text());
    return reply(request, 502, 'Your message could not be sent. Please try again later.');
  }
  return reply(request, 200, 'Thank you! Your message has been sent. I will be in touch within 2 business days.');
}

// Anything other than POST
export const onRequest = () => new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
