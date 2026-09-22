// POST /api/paraphrase —— 改写器（矩阵工具，PRD §3.2）
import type { APIRoute } from 'astro';
import { callLLM, LLMNotConfiguredError } from '../../lib/llm';
import { PARAPHRASE_SYSTEM, PARAPHRASE_STYLES } from '../../lib/prompts';
import { getRuntimeEnv, bumpRateLimit } from '../../lib/store';
import { verifyTurnstile } from '../../lib/turnstile';

export const prerender = false;

const MIN_WORDS = 20;
const MAX_WORDS = 500;
const DAILY_LIMIT = 5;

type Style = keyof typeof PARAPHRASE_STYLES;
const STYLES = Object.keys(PARAPHRASE_STYLES) as Style[];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
function err(code: string, message: string, status: number): Response {
  return json({ error: { code, message } }, status);
}

export const POST: APIRoute = async ({ request, locals, clientIp }) => {
  const env = getRuntimeEnv(locals);

  let payload: { text?: string; style?: string; turnstileToken?: string };
  try {
    payload = await request.json();
  } catch {
    return err('BAD_REQUEST', 'Invalid JSON body.', 400);
  }

  const text = (payload.text ?? '').trim();
  const style: Style = STYLES.includes(payload.style as Style) ? (payload.style as Style) : 'fluent';
  const words = text ? text.split(/\s+/).length : 0;

  if (words < MIN_WORDS) return err('TEXT_TOO_SHORT', `At least ${MIN_WORDS} words required (got ${words}).`, 400);
  if (words > MAX_WORDS) return err('TEXT_TOO_LONG', `Paraphrasing is limited to ${MAX_WORDS} words.`, 400);

  if (!(await verifyTurnstile(env as never, payload.turnstileToken, clientIp))) {
    return err('TURNSTILE_FAILED', 'Human verification failed. Please retry.', 403);
  }

  const rl = await bumpRateLimit(env, clientIp ?? 'unknown', DAILY_LIMIT, 'paraphrase');
  if (!rl.allowed) return err('RATE_LIMITED', 'Daily limit reached. Come back tomorrow.', 429);

  try {
    const system = PARAPHRASE_SYSTEM.replace('{style}', PARAPHRASE_STYLES[style]);
    const result = await callLLM(env?.DEEPSEEK_API_KEY, system, text, words);
    return json({ result, style, remaining: rl.remaining });
  } catch (e) {
    if (e instanceof LLMNotConfiguredError) return err('TOOL_BUSY', 'Tool not configured (missing DEEPSEEK_API_KEY).', 503);
    console.error('[paraphrase] error:', e);
    return err('TOOL_BUSY', 'Temporarily unavailable. Please try again shortly.', 503);
  }
};
