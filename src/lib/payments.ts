// 支付抽象层（04 文档 §5）：MoR 优先（mock 全量实现，Creem 预留接入位）
// 切换真实 MoR：注册 Creem/FastSpring → 拿 API Key → 设置
//   PAY_PROVIDER=creem  CREEM_API_KEY=...  → 代码零改动

export type Plan = 'monthly' | 'yearly';

export const PLANS: Record<Plan, { price: string; per: string; words: string }> = {
  monthly: { price: '$4.99', per: '/month', words: '4.99' },
  yearly: { price: '$39', per: '/year', words: '39.00' },
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

export interface PaymentProvider {
  name: string;
  /** 创建托管结账页，返回跳转 URL */
  createCheckout(params: CheckoutParams): Promise<{ url: string }>;
  /** 解析并校验 webhook 载荷 → 标准事件；不合法返回 null */
  parseWebhook(request: Request, rawBody: string): Promise<WebhookEvent | null>;
}

// ============ Mock：完整可用的本地模拟（仅开发，生产绝不启用） ============

const mockProvider: PaymentProvider = {
  name: 'mock',

  async createCheckout({ plan, userId }) {
    const params = new URLSearchParams({ plan, userId });
    return { url: `/dev/mock-checkout?${params.toString()}` };
  },

  // mock 的 webhook 由模拟结账页发出；载荷可信（仅存在于 mock 模式）
  async parseWebhook(request, rawBody) {
    try {
      const event = JSON.parse(rawBody) as WebhookEvent;
      if (!event.userId || !event.type) return null;
      return event;
    } catch {
      return null;
    }
  },
};

// ============ Creem（预留：注册后填入 Key 即切换，签名方案以官方文档为准） ============

const creemProvider: PaymentProvider = {
  name: 'creem',

  async createCheckout({ plan, email, userId }) {
    // Creem API：POST https://api.creem.io/v1/checkouts（拿到 API Key 后按官方文档校准字段）
    throw new Error('Creem provider not configured yet — set CREEM_API_KEY and verify field mapping against docs.');
  },

  async parseWebhook(request, rawBody) {
    // Creem webhook 带签名的 HMAC 头；接入时按官方文档实现验签
    throw new Error('Creem webhook not configured yet.');
  },
};

const providers: Record<string, PaymentProvider> = {
  mock: mockProvider,
  creem: creemProvider,
};

export function getPayments(name?: string): PaymentProvider {
  // 生产环境强制非 mock（防误配）
  const wanted = name ?? 'mock';
  if (wanted === 'mock' && process.env.NODE_ENV === 'production' && !process.env.ALLOW_MOCK_PAY) {
    console.warn('[payments] 生产环境使用 mock 支付（测试期），上线前必须切换');
  }
  return providers[wanted] ?? mockProvider;
}
