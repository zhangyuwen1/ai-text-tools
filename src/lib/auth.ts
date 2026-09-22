// 认证：魔法链接 + 会话（02 文档 §5.3）
// 存储：生产 KV（AUTH 存储）/ 开发内存回退（复用 store.ts 模式）
// 邮件：配置 RESEND_API_KEY 则真实发信，否则开发模式打印链接到服务端日志
import { kvGet, kvPut } from './store';

const SESSION_TTL = 30 * 86400;
const MAGIC_TTL = 15 * 60;

export interface SessionUser {
  userId: string;
  email: string;
  plan: 'free' | 'pro';
}

function id(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 24; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

// ---- 魔法链接 ----

export async function issueMagicLink(env: unknown, email: string): Promise<{ token: string; devMode: boolean }> {
  const token = id();
  await kvPut(env as never, 'SHARE', `magic:${token}`, email.toLowerCase(), MAGIC_TTL);
  const resendKey = (env as { RESEND_API_KEY?: string })?.RESEND_API_KEY;
  const from = (env as { EMAIL_FROM?: string })?.EMAIL_FROM ?? 'onboarding@resend.dev';
  const link = `https://textkitai.com/api/auth/verify?token=${token}`;

  if (resendKey) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from,
        to: email,
        subject: 'Your TextKit AI sign-in link',
        html: `<p>Click to sign in (valid 15 minutes):</p><p><a href="${link}">${link}</a></p>`,
      }),
    }).catch((e) => console.error('[auth] resend failed:', e));
    return { token, devMode: false };
  }

  console.warn(`[auth][dev] 未配置 RESEND_API_KEY，登录链接仅打印：${link}`);
  return { token, devMode: true };
}

export async function consumeMagicLink(env: unknown, token: string): Promise<string | null> {
  const email = await kvGet(env as never, 'SHARE', `magic:${token}`);
  if (!email) return null;
  await kvPut(env as never, 'SHARE', `magic:${token}`, '', 1); // 一次性
  return email;
}

// ---- 会话 ----

export async function createSession(env: unknown, email: string): Promise<{ token: string; userId: string }> {
  const userId = id();
  const token = id();
  await kvPut(env as never, 'SHARE', `sess:${token}`, JSON.stringify({ userId, email }), SESSION_TTL);
  return { token, userId };
}

export async function getSessionUser(env: unknown, token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  const raw = await kvGet(env as never, 'SHARE', `sess:${token}`);
  if (!raw) return null;
  try {
    const { userId, email } = JSON.parse(raw) as { userId: string; email: string };
    const sub = await getSubscription(env, userId);
    return { userId, email, plan: sub?.status === 'active' ? 'pro' : 'free' };
  } catch {
    return null;
  }
}

// ---- 订阅 ----

export interface Subscription {
  plan: 'monthly' | 'yearly';
  status: 'active' | 'canceled' | 'past_due';
  provider: string;
  subId: string;
  currentPeriodEnd: number;
}

export async function saveSubscription(env: unknown, userId: string, sub: Subscription): Promise<void> {
  await kvPut(env as never, 'SHARE', `sub:${userId}`, JSON.stringify(sub), 400 * 86400);
}

export async function getSubscription(env: unknown, userId: string): Promise<Subscription | null> {
  const raw = await kvGet(env as never, 'SHARE', `sub:${userId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Subscription;
  } catch {
    return null;
  }
}

// 反查：订阅回调里只有 email 时定位用户（简单实现：回调携带 userId，此函数备用）
export async function findUserIdByEmail(env: unknown, email: string): Promise<string | null> {
  const raw = await kvGet(env as never, 'SHARE', `uid:${email.toLowerCase()}`);
  return raw || null;
}

export async function rememberUserId(env: unknown, email: string, userId: string): Promise<void> {
  await kvPut(env as never, 'SHARE', `uid:${email.toLowerCase()}`, userId, 400 * 86400);
}
