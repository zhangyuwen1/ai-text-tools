// Turnstile 人机验证：生产环境必须开启；本地开发未配置密钥时放行并打日志。
// 部署时设置 TURNSTILE_SECRET_KEY + 页面侧 TURNSTILE_SITE_KEY（04 文档 §2.3）。

interface TurnstileEnv {
  TURNSTILE_SECRET_KEY?: string;
}

export async function verifyTurnstile(env: TurnstileEnv | undefined, token: string | undefined, ip?: string): Promise<boolean> {
  const secret = env?.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn('[turnstile] TURNSTILE_SECRET_KEY 未配置，开发模式放行');
    return true;
  }
  if (!token) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set('remoteip', ip);

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
