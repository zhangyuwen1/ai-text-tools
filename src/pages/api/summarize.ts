// POST /api/summarize —— 摘要器（矩阵工具，PRD §3.2）
import type { APIRoute } from 'astro';
import { callLLM, LLMNotConfiguredError } from '../../lib/llm';
import { SUMMARIZE_SYSTEM } from '../../lib/prompts';
import { getRuntimeEnv, bumpRateLimit } from '../../lib/store';
import { verifyTurnstile } from '../../lib/turnstile';

export const prerender = false;

const MIN_WORDS = 50;
const MAX_WORDS = 2000;
const DAILY_LIMIT = 5;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
function err(code: string, message: string, status: number): Response {
  return json({ error: { code, message } }, status);
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

  if (words < MIN_WORDS) return err('TEXT_TOO_SHORT', `At least ${MIN_WORDS} words required (got ${words}).`, 400);
  if (words > MAX_WORDS) return err('TEXT_TOO_LONG', `Summarizing is limited to ${MAX_WORDS} words.`, 400);

  if (!(await verifyTurnstile(env as never, payload.turnstileToken, clientIp))) {
    return err('TURNSTILE_FAILED', 'Human verification failed. Please retry.', 403);
  }

  const rl = await bumpRateLimit(env, clientIp ?? 'unknown', DAILY_LIMIT, 'summarize');
  if (!rl.allowed) return err('RATE_LIMITED', 'Daily limit reached. Come back tomorrow.', 429);

  try {
    const result = await callLLM(env?.DEEPSEEK_API_KEY, SUMMARIZE_SYSTEM, text, words);
    return json({ result, remaining: rl.remaining });
  } catch (e) {
    if (e instanceof LLMNotConfiguredError) return err('TOOL_BUSY', 'Tool not configured (missing DEEPSEEK_API_KEY).', 503);
    console.error('[summarize] error:', e);
    return err('TOOL_BUSY', 'Temporarily unavailable. Please try again shortly.', 503);
  }
};
