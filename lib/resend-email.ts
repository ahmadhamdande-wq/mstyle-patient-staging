import { env } from 'cloudflare:workers';

export async function sendClinicEmail(to: string, subject: string, text: string) {
  const key = (env as unknown as { RESEND_API_KEY?: string }).RESEND_API_KEY;
  if (!key) throw new Error('Resend is not configured');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'MStyle Clinic <no-reply@dr-ahmadhamdan.com>', to: [to], subject, text }),
  });
  if (!response.ok) throw new Error(`Email delivery failed: HTTP ${response.status}`);
}
