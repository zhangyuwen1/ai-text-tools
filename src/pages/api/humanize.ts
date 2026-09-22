// POST /api/humanize —— 人性化主端点（02 文档 §5.2）
// 流程：Turnstile → 限流(3/天) → 长度校验 → LLM 改写 → 前后检测闭环 → 返回
import type { APIRoute } from 'astro';
import { getDetector } from '../../lib/detect';
import { callLLM, LLMNotConfiguredError } from '../../lib/llm';
import { buildHumanizeSystemPrompt, type Mode, type Strength } from '../../lib/prompts';
import { getRuntimeEnv, bumpRateLimit } from '../../lib/store';
import { verifyTurnstile } from '../../lib/turnstile';
import { getSessionUser } from '../../lib/auth';
import { quotaFor, type Tier } from '../../lib/quota';

export const prerender = false;

const MIN_WORDS = 50;

const MODES: Mode[] = ['standard', 'academic', 'casual', 'creative'];
const STRENGTHS: Strength[] = ['light', 'balanced', 'strong'];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function err(code: string, message: string, status: number): Response {
  return json({ error: { code, message } }, status);
}

export const POST: APIRoute = async ({ request, locals, clientIp, cookies }) => {
  const env = getRuntimeEnv(locals);

  // 用户层级：Pro → 登录免费 → 匿名
  const user = await getSessionUser(env, cookies.get('tk_session')?.value);
  const tier: Tier = user?.plan === 'pro' ? 'pro' : user ? 'free' : 'anon';
  const quota = quotaFor('humanize', tier);

  let payload: { text?: string; mode?: string; strength?: string; turnstileToken?: string };
  try {
    payload = await request.json();
  } catch {
    return err('BAD_REQUEST', 'Invalid JSON body.', 400);
  }

  const text = (payload.text ?? '').trim();
  const mode = MODES.includes(payload.mode as Mode) ? (payload.mode as Mode) : 'standard';
  const strength = STRENGTHS.includes(payload.strength as Strength) ? (payload.strength as Strength) : 'balanced';
  const words = text ? text.split(/\s+/).length : 0;

  if (words < MIN_WORDS) {
    return err('TEXT_TOO_SHORT', `Text is too short — at least ${MIN_WORDS} words required (got ${words}).`, 400);
  }
  if (words > quota.maxWords) {
    return err(
      'TEXT_TOO_LONG',
      tier === 'pro'
        ? `Rewrites are limited to ${quota.maxWords} words.`
        : `Free rewrites are limited to ${quota.maxWords} words — Pro raises this to 10,000.`,
      400,
    );
  }

  if (!(await verifyTurnstile(env as never, payload.turnstileToken, clientIp))) {
    return err('TURNSTILE_FAILED', 'Human verification failed. Please retry.', 403);
  }

  const ip = clientIp ?? 'unknown';
  let remaining: number;
  if (tier === 'pro') {
    remaining = -1; // -1 = 无限（JSON 无法序列化 Infinity）
  } else {
    const kind = tier === 'free' ? 'humanize-free' : 'humanize';
    const rl = await bumpRateLimit(env, `${kind}:${user?.userId ?? ip}`, quota.daily, kind);
    if (!rl.allowed) {
      return err(
        'RATE_LIMITED',
        `You've used all ${quota.daily} free rewrites for today. Upgrade to Pro for unlimited rewrites — or come back tomorrow.`,
        429,
      );
    }
    remaining = rl.remaining;
  }

  try {
    // 闭环：人性化前后各跑一次检测（当前启发式零成本；接正式供应商后此分数即真实对比）
    const provider = getDetector(env?.DETECT_PROVIDER);
    const before = await provider.detect(text);

    const result = await callLLM(
      env?.DEEPSEEK_API_KEY,
      buildHumanizeSystemPrompt(mode, strength),
      text,
      words,
    );

    const after = await provider.detect(result);

    return json({
      result,
      mode,
      strength,
      beforeScore: Math.round(before.score * 100) / 100,
      afterScore: Math.round(after.score * 100) / 100,
      words: result.split(/\s+/).length,
      remaining,
      tier,
    });
  } catch (e) {
    if (e instanceof LLMNotConfiguredError) {
      return err('HUMANIZER_BUSY', 'The humanizer is not configured yet (missing DEEPSEEK_API_KEY).', 503);
    }
    console.error('[humanize] error:', e);
    return err('HUMANIZER_BUSY', 'The humanizer is temporarily unavailable. Please try again shortly.', 503);
  }
};
