// POST /api/payments/checkout —— 需登录；创建 MoR 托管结账并返回跳转 URL
import type { APIRoute } from 'astro';
import { getRuntimeEnv } from '../../../lib/store';
import { getSessionUser } from '../../../lib/auth';
import { getPayments, type Plan } from '../../../lib/payments';

export const prerender = false;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  const env = getRuntimeEnv(locals);

  let payload: { plan?: string };
  try {
    payload = await request.json();
  } catch {
    return json({ error: { code: 'BAD_REQUEST', message: 'Invalid JSON.' } }, 400);
  }

  const plan: Plan = payload.plan === 'yearly' ? 'yearly' : 'monthly';

  const user = await getSessionUser(env, cookies.get('tk_session')?.value);
  if (!user) {
    return json({ error: { code: 'LOGIN_REQUIRED', message: 'Enter your email first — we sent you a sign-in link.' } }, 401);
  }

  const provider = getPayments(env?.PAY_PROVIDER);
  try {
    const { url } = await provider.createCheckout({ plan, email: user.email, userId: user.userId });
    return json({ url });
  } catch (e) {
    console.error('[checkout] error:', e);
    return json({ error: { code: 'CHECKOUT_FAILED', message: 'Could not start checkout. Please try again.' } }, 503);
  }
};
