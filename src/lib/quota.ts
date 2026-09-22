// 额度矩阵（PRD §4.1 / §4.2）：匿名 / 登录免费 / Pro
export type Tier = 'anon' | 'free' | 'pro';

export interface QuotaConfig {
  daily: number; // 每日次数；Infinity = 无限
  maxWords: number; // 单次词数上限
}

const MATRIX: Record<'detect' | 'humanize', Record<Tier, QuotaConfig>> = {
  detect: {
    anon: { daily: 5, maxWords: 500 },
    free: { daily: 10, maxWords: 1500 },
    pro: { daily: Infinity, maxWords: 30000 },
  },
  humanize: {
    anon: { daily: 3, maxWords: 300 },
    free: { daily: 5, maxWords: 800 },
    pro: { daily: Infinity, maxWords: 10000 },
  },
};

export function quotaFor(tool: 'detect' | 'humanize', tier: Tier): QuotaConfig {
  return MATRIX[tool][tier];
}

// 剩余次数展示文案（Pro 显示 ∞）
export function remainingText(remaining: number, tier: Tier): string {
  if (tier === 'pro') return 'Pro — unlimited';
  return `${remaining} left today`;
}
