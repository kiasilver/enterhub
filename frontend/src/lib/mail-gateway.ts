/** Shared mail-gateway helpers for Enterhub. */

export async function sendGatewayMail(opts: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  vars?: Record<string, string>;
}): Promise<void> {
  const gateway = process.env.MAIL_GATEWAY_URL?.replace(/\/$/, '');
  const gatewayKey = process.env.MAIL_GATEWAY_KEY;
  if (!gateway || !gatewayKey) {
    throw new Error('MAIL_GATEWAY_URL / MAIL_GATEWAY_KEY not configured');
  }
  const path = opts.template ? '/v1/send-template' : '/v1/send';
  const res = await fetch(`${gateway}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': gatewayKey,
    },
    body: JSON.stringify({
      brand: process.env.MAIL_BRAND || 'enterhub',
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      template: opts.template,
      vars: opts.vars,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`mail-gateway failed: ${res.status} ${body}`);
  }
}
