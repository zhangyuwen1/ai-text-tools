// 存储层：生产用 Cloudflare KV/D1 绑定；本地开发（无绑定）回退到进程内存。
// 生产部署后绑定自动生效（wrangler.toml），业务代码不感知差异。
// 内存回退仅限 dev —— 重启即清空，用于本地联调完全够用。

interface Env {
  RATE_LIMIT?: { get(key: string): Promise<string | null>; put(key: string, v: string, opts?: { expirationTtl?: number }): Promise<void> };
  SHARE?: { get(key: string): Promise<string | null>; put(key: string, v: string, opts?: { expirationTtl?: number }): Promise<void> };
  DETECT_PROVIDER?: string;
  DEEPSEEK_API_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
}

const memory = new Map<string, string>();

function kv(env: Env | undefined, binding: 'RATE_LIMIT' | 'SHARE') {
  return env?.[binding] ?? null;
}

export function getRuntimeEnv(locals: unknown): Env | undefined {
  // Cloudflare adapter 在 dev/prod 都会把绑定挂到 locals.runtime.env（防御式访问）
  const runtime = (locals as { runtime?: { env?: Env } })?.runtime;
  return runtime?.env;
}

export async function kvGet(env: Env | undefined, binding: 'RATE_LIMIT' | 'SHARE', key: string): Promise<string | null> {
  const real = kv(env, binding);
  if (real) return real.get(key);
  return memory.get(`${binding}:${key}`) ?? null;
}

export async function kvPut(
  env: Env | undefined,
  binding: 'RATE_LIMIT' | 'SHARE',
  key: string,
  value: string,
  ttlSeconds?: number,
): Promise<void> {
  const real = kv(env, binding);
  if (real) {
    await real.put(key, value, ttlSeconds ? { expirationTtl: ttlSeconds } : undefined);
    return;
  }
  memory.set(`${binding}:${key}`, value);
}

// ---- 限流（匿名 5 次/天，按 IP；PRD §4.5）----

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function bumpRateLimit(
  env: Env | undefined,
  ip: string,
  limit: number,
  kind = 'detect',
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `rl:${kind}:${ip}:${todayKey()}`;
  const current = parseInt((await kvGet(env, 'RATE_LIMIT', key)) ?? '0', 10);
  if (current >= limit) return { allowed: false, remaining: 0 };
  await kvPut(env, 'RATE_LIMIT', key, String(current + 1), 86400);
  return { allowed: true, remaining: limit - current - 1 };
}

// ---- 分享记录（opt-in：用户点"Create share link"才存文本）----

export interface ShareRecord {
  score: number;
  label: string;
  words: number;
  sentences: { text: string; flag: string }[];
  created: number;
}

export async function saveShare(env: Env | undefined, id: string, rec: ShareRecord): Promise<void> {
  await kvPut(env, 'SHARE', `share:${id}`, JSON.stringify(rec), 7 * 86400); // 7 天过期
}

export async function getShare(env: Env | undefined, id: string): Promise<ShareRecord | null> {
  const raw = await kvGet(env, 'SHARE', `share:${id}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ShareRecord;
  } catch {
    return null;
  }
}
