// POST /api/humanize —— 人性化主端点（02 文档 §5.2）
// 流程：Turnstile → 限流(3/天) → 长度校验 → LLM 改写 → 前后检测闭环 → 返回
import type { APIRoute } from 'astro';
import { getDetector } from '../../lib/detect';
import { callLLM, LLMNotConfiguredError } from '../../lib/llm';
import { buildHumanizeSystemPrompt, type Mode, type Strength } from '../../lib/prompts';
import { getRuntimeEnv, bumpRateLimit } from '../../lib/store';
import { verifyTurnstile } from '../../lib/turnstile';

export const prerender = false;

const MIN_WORDS = 50;
const MAX_WORDS_ANON = 300;
const DAILY_LIMIT = 3; // PRD §4.2 匿名档

const MODES: Mode[] = ['standard', 'academic', 'casual', 'creative'];
const STRENGTHS: Strength[] = ['light', 'balanced', 'strong'];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function err(code: string, message: string, status: number): Response {
  return json({ error: { code, message } }, status);
}

export const POST: APIRoute = async ({ request, locals, clientIp }) => {
  const env = getRuntimeEnv(locals);

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
  if (words > MAX_WORDS_ANON) {
    return err('TEXT_TOO_LONG', `Free rewrites are limited to ${MAX_WORDS_ANON} words.`, 400);
  }

  if (!(await verifyTurnstile(env as never, payload.turnstileToken, clientIp))) {
    return err('TURNSTILE_FAILED', 'Human verification failed. Please retry.', 403);
  }

  const ip = clientIp ?? 'unknown';
  const rl = await bumpRateLimit(env, ip, DAILY_LIMIT, 'humanize');
  if (!rl.allowed) {
    return err('RATE_LIMITED', 'You have used all 3 free rewrites for today. Come back tomorrow.', 429);
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
      remaining: rl.remaining,
    });
  } catch (e) {
    if (e instanceof LLMNotConfiguredError) {
      return err('HUMANIZER_BUSY', 'The humanizer is not configured yet (missing DEEPSEEK_API_KEY).', 503);
    }
    console.error('[humanize] error:', e);
    return err('HUMANIZER_BUSY', 'The humanizer is temporarily unavailable. Please try again shortly.', 503);
  }
};
