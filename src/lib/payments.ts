// 支付抽象层（04 文档 §5）：MoR 模式
// 已实现：mock（开发全流程）+ creem（生产，字段按 docs.creem.io 2026-09 版实现）
// 切换：环境变量 PAY_PROVIDER=creem（默认 mock）
// Creem 依赖的环境变量：
//   CREEM_API_KEY            API 密钥（Secret）
//   CREEM_WEBHOOK_SECRET     webhook 签名密钥（Secret）
//   CREEM_PRODUCT_MONTHLY    月付产品 ID prod_xxx
//   CREEM_PRODUCT_YEARLY     年付产品 ID prod_xxx
//   CREEM_API_BASE           可选，默认 https://api.creem.io/v1（测试环境用 https://test-api.creem.io/v1）

export type Plan = 'monthly' | 'yearly';

export const PLANS: Record<Plan, { price: string; per: string }> = {
  monthly: { price: '$4.99', per: '/month' },
  yearly: { price: '$39', per: '/year' },
};

export interface CheckoutParams {
  plan: Plan;
  email: string;
  userId: string;
}

export interface WebhookEvent {
  type: 'subscription.active' | 'subscription.canceled' | 'subscription.past_due';
  userId: string;
  plan: Plan;
  subId: string;
  currentPeriodEnd: number;
}

export interface WebhookParseResult {
  ok: boolean; // 验签/格式是否合法（决定 200 或 400）
  event?: WebhookEvent; // undefined = 合法但无需处理的事件类型
}

interface ProviderEnv {
  CREEM_API_KEY?: string;
  CREEM_WEBHOOK_SECRET?: string;
  CREEM_PRODUCT_MONTHLY?: string;
  CREEM_PRODUCT_YEARLY?: string;
  CREEM_API_BASE?: string;
}

export interface PaymentProvider {
  name: string;
  createCheckout(params: CheckoutParams): Promise<{ url: string }>;
  parseWebhook(request: Request, rawBody: string): Promise<WebhookParseResult>;
}

// ---- 工具：Web Crypto HMAC-SHA256（Workers 原生支持） ----

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ============ mock：本地开发模拟（生产绝不启用） ============

function mockProvider(): PaymentProvider {
  return {
    name: 'mock',
    async createCheckout({ plan, userId }) {
      const params = new URLSearchParams({ plan, userId });
      return { url: `/dev/mock-checkout?${params.toString()}` };
    },
    async parseWebhook(_request, rawBody) {
      try {
        const event = JSON.parse(rawBody) as WebhookEvent;
        if (!event.userId || !event.type) return { ok: false };
        return { ok: true, event };
      } catch {
        return { ok: false };
      }
    },
  };
}

// ============ creem：生产 MoR（docs.creem.io） ============

function creemProvider(env: ProviderEnv): PaymentProvider {
  const base = env.CREEM_API_BASE ?? 'https://api.creem.io/v1';

  return {
    name: 'creem',

    async createCheckout({ plan, email, userId }) {
      const apiKey = env.CREEM_API_KEY;
      const productId = plan === 'yearly' ? env.CREEM_PRODUCT_YEARLY : env.CREEM_PRODUCT_MONTHLY;
      if (!apiKey || !productId) {
        throw new Error('creem not configured: need CREEM_API_KEY and CREEM_PRODUCT_*');
      }

      const res = await fetch(`${base}/checkouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({
          request_id: `tk_${userId}_${Date.now()}`,
          product_id: productId,
          success_url: 'https://textkitai.com/account?paid=1',
          customer: { email },
          metadata: { userId },
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`creem checkout HTTP ${res.status}: ${body.slice(0, 200)}`);
      }
      const data = (await res.json()) as { checkout_url?: string };
      if (!data.checkout_url) throw new Error('creem returned no checkout_url');
      return { url: data.checkout_url };
    },

    async parseWebhook(request, rawBody): Promise<WebhookParseResult> {
      const secret = env.CREEM_WEBHOOK_SECRET;
      if (!secret) return { ok: false };

      const signature = request.headers.get('creem-signature');
      if (!signature) return { ok: false };

      const expected = await hmacSha256Hex(secret, rawBody);
      if (!safeEqual(expected, signature)) return { ok: false };

      try {
        const evt = JSON.parse(rawBody) as {
          eventType?: string;
          object?: {
            metadata?: Record<string, string>;
            order?: { id?: string; product?: string; status?: string };
            product?: { id?: string; billing_period?: string };
            subscription?: { id?: string; current_period_end?: number };
            customer?: { email?: string };
          };
        };

        const obj = evt.object ?? {};
        const userId = obj.metadata?.userId;
        if (!userId) return { ok: false }; // 非本站发起的事件

        const productKey = obj.product?.id ?? obj.order?.product;
        const plan: Plan = productKey === env.CREEM_PRODUCT_YEARLY ? 'yearly' : 'monthly';

        switch (evt.eventType) {
          case 'checkout.completed':
          case 'subscription.paid':
          case 'subscription.active': {
            const periodDays = plan === 'yearly' ? 366 : 31;
            return {
              ok: true,
              event: {
                type: 'subscription.active',
                userId,
                plan,
                subId: obj.subscription?.id ?? obj.order?.id ?? evt.object?.order?.id ?? 'creem_sub',
                currentPeriodEnd: obj.subscription?.current_period_end ?? Math.floor(Date.now() / 1000) + periodDays * 86400,
              },
            };
          }
          case 'subscription.canceled':
          case 'subscription.expired':
            return {
              ok: true,
              event: {
                type: 'subscription.canceled',
                userId,
                plan,
                subId: obj.subscription?.id ?? obj.order?.id ?? 'creem_sub',
                currentPeriodEnd: 0,
              },
            };
          default:
            return { ok: true }; // 合法但暂不处理的事件（退款等后续再接）
        }
      } catch {
        return { ok: false };
      }
    },
  };
}

const providers: Record<string, (env: ProviderEnv) => PaymentProvider> = {
  mock: () => mockProvider(),
  creem: (env) => creemProvider(env),
};

export function getPayments(name: string | undefined, env?: ProviderEnv): PaymentProvider {
  const factory = providers[name ?? 'mock'];
  if (!factory) return mockProvider();
  return factory(env ?? {});
}
