// POST /api/payments/webhook —— MoR 订阅回调（供应商无关）
// mock：由模拟结账页调用；creem：由 Creem 服务端调用（接入时验签）
import type { APIRoute } from 'astro';
import { getRuntimeEnv } from '../../../lib/store';
import { saveSubscription } from '../../../lib/auth';
import { getPayments } from '../../../lib/payments';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const env = getRuntimeEnv(locals);
  const rawBody = await request.text();

  const provider = getPayments(env?.PAY_PROVIDER);
  let event;
  try {
    event = await provider.parseWebhook(request, rawBody);
  } catch (e) {
    console.error('[webhook] parse error:', e);
    return new Response('provider not ready', { status: 501 });
  }
  if (!event) return new Response('invalid payload', { status: 400 });

  const status =
    event.type === 'subscription.active' ? 'active' : event.type === 'subscription.canceled' ? 'canceled' : 'past_due';

  await saveSubscription(env, event.userId, {
    plan: event.plan,
    status,
    provider: provider.name,
    subId: event.subId,
    currentPeriodEnd: event.currentPeriodEnd,
  });

  console.log(`[webhook] ${provider.name} ${event.type} user=${event.userId} plan=${event.plan}`);
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
};
