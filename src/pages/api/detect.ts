// POST /api/detect —— 检测主端点（02 文档 §5.1）
// 流程：Turnstile → 限流 → 长度校验 → provider 检测 → 返回结果（不落库，见隐私设计）
import type { APIRoute } from 'astro';
import { getDetector } from '../../lib/detect';
import { getRuntimeEnv, bumpRateLimit } from '../../lib/store';
import { verifyTurnstile } from '../../lib/turnstile';

export const prerender = false;

const MIN_WORDS = 50; // PRD：低于下限不出分
const MAX_WORDS_ANON = 500;

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

export const POST: APIRoute = async ({ request, locals, clientIp }) => {
  const env = getRuntimeEnv(locals);

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
  if (words > MAX_WORDS_ANON) {
    return err('TEXT_TOO_LONG', `Free checks are limited to ${MAX_WORDS_ANON} words.`, 400);
  }

  // 人机验证（开发模式未配密钥自动放行）
  if (!(await verifyTurnstile(env as never, payload.turnstileToken, clientIp))) {
    return err('TURNSTILE_FAILED', 'Human verification failed. Please retry.', 403);
  }

  // 匿名限流：5 次/天/IP
  const ip = clientIp ?? 'unknown';
  const rl = await bumpRateLimit(env, ip, 5);
  if (!rl.allowed) {
    return err('RATE_LIMITED', 'You have used all 5 free checks for today. Come back tomorrow.', 429);
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
      remaining: rl.remaining,
    });
  } catch (e) {
    console.error('[detect] provider error:', e);
    return err('DETECTOR_BUSY', 'The detector is temporarily unavailable. Please try again shortly.', 503);
  }
};
