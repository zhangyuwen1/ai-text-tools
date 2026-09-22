// POST /api/detect —— 检测主端点（02 文档 §5.1）
// 流程：层级判定 → 长度校验 → Turnstile → 限流 → provider 检测 → 返回
import type { APIRoute } from 'astro';
import { getDetector } from '../../lib/detect';
import { getRuntimeEnv, bumpRateLimit } from '../../lib/store';
import { verifyTurnstile } from '../../lib/turnstile';
import { getSessionUser } from '../../lib/auth';
import { quotaFor, type Tier } from '../../lib/quota';

export const prerender = false;

const MIN_WORDS = 50; // PRD：低于下限不出分

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function err(code: string, message: string, status: number): Response {
  return json({ error: { code, message } }, status);
}

function label(score: number): 'human' | 'mixed' | 'ai' {
  if (score > 0.7) return 'ai';
  if (score >= 0.4) return 'mixed';
  return 'human';
}

export const POST: APIRoute = async ({ request, locals, clientIp, cookies }) => {
  const env = getRuntimeEnv(locals);

  // 用户层级：Pro → 登录免费 → 匿名
  const user = await getSessionUser(env, cookies.get('tk_session')?.value);
  const tier: Tier = user?.plan === 'pro' ? 'pro' : user ? 'free' : 'anon';
  const quota = quotaFor('detect', tier);

  let payload: { text?: string; turnstileToken?: string };
  try {
    payload = await request.json();
  } catch {
    return err('BAD_REQUEST', 'Invalid JSON body.', 400);
  }

  const text = (payload.text ?? '').trim();
  const words = text ? text.split(/\s+/).length : 0;

  if (words < MIN_WORDS) {
    return err('TEXT_TOO_SHORT', `Text is too short — at least ${MIN_WORDS} words required (got ${words}).`, 400);
  }
  if (words > quota.maxWords) {
    return err(
      'TEXT_TOO_LONG',
      tier === 'pro'
        ? `Checks are limited to ${quota.maxWords} words.`
        : `Free checks are limited to ${quota.maxWords} words — Pro raises this to 30,000.`,
      400,
    );
  }

  // 人机验证（开发模式未配密钥自动放行）
  if (!(await verifyTurnstile(env as never, payload.turnstileToken, clientIp))) {
    return err('TURNSTILE_FAILED', 'Human verification failed. Please retry.', 403);
  }

  // 限流：Pro 无限；免费/匿名按层级计数（登录用户按 userId 计，不随 IP 变化）
  const ip = clientIp ?? 'unknown';
  let remaining: number;
  if (tier === 'pro') {
    remaining = -1; // -1 = 无限（JSON 无法序列化 Infinity）
  } else {
    const kind = tier === 'free' ? 'detect-free' : 'detect';
    const rl = await bumpRateLimit(env, `${kind}:${user?.userId ?? ip}`, quota.daily, kind);
    if (!rl.allowed) {
      return err(
        'RATE_LIMITED',
        `You've used all ${quota.daily} free checks for today. Upgrade to Pro for unlimited checks — or come back tomorrow.`,
        429,
      );
    }
    remaining = rl.remaining;
  }

  try {
    const provider = getDetector(env?.DETECT_PROVIDER);
    const result = await provider.detect(text);
    return json({
      provider: provider.name,
      score: Math.round(result.score * 100) / 100,
      label: label(result.score),
      words,
      sentences: result.sentences,
      remaining,
      tier,
    });
  } catch (e) {
    console.error('[detect] provider error:', e);
    return err('DETECTOR_BUSY', 'The detector is temporarily unavailable. Please try again shortly.', 503);
  }
};
