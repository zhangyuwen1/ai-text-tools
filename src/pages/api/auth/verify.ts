// GET /api/auth/verify?token=... —— 校验魔法链接 → 写会话 Cookie → 跳转账户页
import type { APIRoute } from 'astro';
import { getRuntimeEnv } from '../../../lib/store';
import { consumeMagicLink, createSession, rememberUserId } from '../../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ url, locals, cookies, redirect }) => {
  const token = url.searchParams.get('token');
  if (!token) return redirect('/account?login=failed', 302);

  const env = getRuntimeEnv(locals);
  const email = await consumeMagicLink(env, token);
  if (!email) return redirect('/account?login=expired', 302);

  const { userId, token: sessionToken } = await createSession(env, email);
  await rememberUserId(env, email, userId);

  cookies.set('tk_session', sessionToken, {
    path: '/',
    httpOnly: true,
    secure: url.protocol === 'https:', // 本地 http 开发时不加 Secure，否则 cookie 无法回传
    sameSite: 'lax',
    maxAge: 30 * 86400,
  });

  return redirect('/account?login=ok', 302);
};
