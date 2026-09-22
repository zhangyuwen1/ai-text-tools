// POST /api/share —— 生成只读分享页 /r/<id>
// 隐私设计：检测本身不落库；只有用户显式点击"Create share link"时才存储文本（opt-in），
// 记录 7 天过期。02 文档 §4 的"不存原文"指检测流程，此处为用户主动授权的例外。
import type { APIRoute } from 'astro';
import { getRuntimeEnv, saveShare } from '../../lib/store';

export const prerender = false;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function err(code: string, message: string, status: number): Response {
  return json({ error: { code, message } }, status);
}

function id(): string {
  // 6 字符随机 ID，足够防遍历（36^6 ≈ 21 亿）
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export const POST: APIRoute = async ({ request, locals }) => {
  const env = getRuntimeEnv(locals);

  let payload: { text?: string; score?: number; sentences?: { text: string; flag: string }[] };
  try {
    payload = await request.json();
  } catch {
    return err('BAD_REQUEST', 'Invalid JSON body.', 400);
  }

  const text = (payload.text ?? '').trim();
  const score = Number(payload.score);
  const sentences = payload.sentences;

  if (!text || text.split(/\s+/).length < 10) return err('BAD_REQUEST', 'Text required.', 400);
  if (!Number.isFinite(score) || score < 0 || score > 1) return err('BAD_REQUEST', 'score must be 0..1.', 400);
  if (!Array.isArray(sentences) || sentences.length === 0) return err('BAD_REQUEST', 'sentences required.', 400);

  const shareId = id();
  const label = score > 0.7 ? 'ai' : score >= 0.4 ? 'mixed' : 'human';
  await saveShare(env, shareId, {
    score,
    label,
    words: text.split(/\s+/).length,
    sentences: sentences.slice(0, 500), // 上限保护
    created: Date.now(),
  });

  return json({ id: shareId, url: `/r/${shareId}` });
};
