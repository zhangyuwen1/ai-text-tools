// POST /api/audit —— SEO 内容审计端点
// 抓取 URL → 提取内容 → 多维分析 → 返回审计报告
import type { APIRoute } from 'astro';
import { getRuntimeEnv, bumpRateLimit } from '../../lib/store';
import { getSessionUser } from '../../lib/auth';
import { quotaFor, type Tier } from '../../lib/quota';
import { auditContent } from '../../lib/audit';

export const prerender = false;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
function err(code: string, message: string, status: number): Response {
  return json({ error: { code, message } }, status);
}

export const POST: APIRoute = async ({ request, locals, clientIp, cookies }) => {
  const env = getRuntimeEnv(locals);

  // 审计是高级功能：匿名 1 次/天，免费 2 次/天，Pro 20 次/天
  const user = await getSessionUser(env, cookies.get('tk_session')?.value);
  const tier: Tier = user?.plan === 'pro' ? 'pro' : user ? 'free' : 'anon';
  const dailyLimit = tier === 'pro' ? 20 : tier === 'free' ? 2 : 1;

  let payload: { url?: string };
  try {
    payload = await request.json();
  } catch {
    return err('BAD_REQUEST', 'Invalid JSON.', 400);
  }

  const rawUrl = (payload.url ?? '').trim();
  let targetUrl: URL;
  try {
    targetUrl = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
  } catch {
    return err('BAD_URL', 'Enter a valid URL (e.g., example.com/post)', 400);
  }
  if (!['http:', 'https:'].includes(targetUrl.protocol)) {
    return err('BAD_URL', 'Only http/https URLs are supported.', 400);
  }

  // 限流
  const rl = await bumpRateLimit(env, `audit:${user?.userId ?? clientIp ?? 'unknown'}`, dailyLimit, 'audit');
  if (!rl.allowed) {
    return err('RATE_LIMITED', `You've used your ${dailyLimit} free audit${dailyLimit > 1 ? 's' : ''} for today. Pro gets 20 per day.`, 429);
  }

  // 抓取页面
  let html: string;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(targetUrl.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TextKitAI-Audit/1.0; +https://textkitai.com)',
        Accept: 'text/html',
      },
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return err('FETCH_FAILED', `The URL returned HTTP ${res.status}. Check the URL and try again.`, 400);
    }
    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html')) {
      return err('NOT_HTML', 'That URL does not return an HTML page. Enter a blog post or article URL.', 400);
    }
    html = await res.text();
  } catch (e) {
    const msg = e instanceof Error && e.name === 'AbortError' ? 'Timed out after 10 seconds' : 'Could not reach that URL';
    return err('FETCH_FAILED', `${msg}. Check the URL and try again.`, 400);
  }

  // 提取页面标题
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const pageTitle = titleMatch ? titleMatch[1].trim() : targetUrl.hostname;

  // 最少字数检查
  const textOnly = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (textOnly.split(/\s+/).length < 100) {
    return err('TOO_SHORT', 'That page has less than 100 words of content — not enough to audit.', 400);
  }

  // 运行审计
  try {
    const report = await auditContent(targetUrl.toString(), html, pageTitle);
    return json({ report, remaining: rl.remaining, tier });
  } catch (e) {
    console.error('[audit] error:', e);
    return err('AUDIT_FAILED', 'Something went wrong while analyzing the content. Try a different URL.', 500);
  }
};
