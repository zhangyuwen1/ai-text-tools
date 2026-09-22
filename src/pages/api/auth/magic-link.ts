// POST /api/auth/magic-link —— 发送登录邮件（无 Resend 时开发模式打日志）
import type { APIRoute } from 'astro';
import { getRuntimeEnv, bumpRateLimit } from '../../../lib/store';
import { issueMagicLink } from '../../../lib/auth';

export const prerender = false;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export const POST: APIRoute = async ({ request, locals, clientIp }) => {
  const env = getRuntimeEnv(locals);

  let payload: { email?: string };
  try {
    payload = await request.json();
  } catch {
    return json({ error: { code: 'BAD_REQUEST', message: 'Invalid JSON.' } }, 400);
  }

  const email = (payload.email ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: { code: 'BAD_EMAIL', message: 'Enter a valid email address.' } }, 400);
  }

  // 限频：同 IP 每天最多 3 封
  const rl = await bumpRateLimit(env, clientIp ?? 'unknown', 3, 'magic');
  if (!rl.allowed) {
    return json({ error: { code: 'RATE_LIMITED', message: 'Too many sign-in emails today. Try again tomorrow.' } }, 429);
  }

  const { devMode } = await issueMagicLink(env, email);
  return json({ ok: true, devMode });
};
