// 启发式检测器（heuristic）
// 双重身份：
//  1. 本地开发/无供应商 Key 时的默认 provider，保证链路可跑
//  2. 产品的"instant estimate"能力 —— 正式供应商接入前的免费快速扫描
// 定位是"估计"而非"判决"，UI 必须如实标注（PRD 风险表：概率参考，非定论）。
import type { DetectorProvider, DetectResult, SentenceFlag } from './types';

export const AI_MARKERS = [
  'delve', 'moreover', 'furthermore', 'however,', 'additionally', 'therefore',
  'utilize', 'utilizes', 'leverag', 'foster', 'robust', 'seamless', 'tapestry',
  'landscape', 'crucial', 'pivotal', 'testament', 'multifaceted', 'in today',
  'it is important to note', 'in conclusion', 'plays a crucial role',
  'a wide range', 'significant', 'comprehensive', 'notably', 'overall',
];

const CONNECTIVE_STARTS = [
  'however', 'moreover', 'furthermore', 'additionally', 'therefore',
  'consequently', 'nevertheless', 'in addition', 'furthermore',
];

function splitSentences(text: string): { start: number; text: string }[] {
  const out: { start: number; text: string }[] = [];
  const re = /[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g;
  for (const m of text.matchAll(re)) {
    const raw = m[0];
    if (raw.trim().length > 0) out.push({ start: m.index ?? 0, text: raw.trim() });
  }
  return out;
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

function stdev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length);
}

export const heuristicDetector: DetectorProvider = {
  name: 'heuristic',

  async detect(text: string): Promise<DetectResult> {
    const sents = splitSentences(text);
    const lower = text.toLowerCase();

    // 全局信号
    const lens = sents.map((s) => s.text.split(/\s+/).length);
    const meanLen = lens.reduce((a, b) => a + b, 0) / Math.max(1, lens.length);
    const burstiness = meanLen > 0 ? stdev(lens) / meanLen : 0; // 低 → 句长均匀 → AI 味
    const words = lower.match(/[a-z']+/g) ?? [];
    const avgWordLen = words.reduce((a, w) => a + w.length, 0) / Math.max(1, words.length);
    const contractions = (lower.match(/\b\w+'(s|t|re|ve|ll|d|m)\b/g) ?? []).length;
    const markerHits = AI_MARKERS.reduce((a, m) => a + (lower.split(m).length - 1), 0);
    const connectiveStarts = sents.filter((s) =>
      CONNECTIVE_STARTS.some((c) => s.text.toLowerCase().startsWith(c)),
    ).length;

    let score = 0.18; // 中性基线
    score += clamp(markerHits / Math.max(6, sents.length) * 0.9, 0, 0.34);
    score += burstiness < 0.22 ? 0.2 : burstiness < 0.35 ? 0.1 : 0;
    score += avgWordLen > 5.3 ? 0.1 : avgWordLen > 4.9 ? 0.04 : 0;
    score += contractions === 0 ? 0.08 : contractions < 2 ? 0.03 : -0.06;
    score += clamp(connectiveStarts / Math.max(4, sents.length) * 0.7, 0, 0.16);
    score = clamp(score, 0.02, 0.97);

    // 逐句打分：AI 词命中 + 句长甜区 + 连接词开头
    const sentences: SentenceFlag[] = sents.map((s) => {
      const sl = s.text.toLowerCase();
      const wLen = s.text.split(/\s+/).length;
      const hits = AI_MARKERS.reduce((a, m) => a + (sl.includes(m) ? 1 : 0), 0);
      const startsConnective = CONNECTIVE_STARTS.some((c) => sl.startsWith(c));
      const hasContraction = /\b\w+'(s|t|re|ve|ll|d|m)\b/.test(sl);

      let local = score * 0.5;
      local += clamp(hits * 0.22, 0, 0.44);
      local += startsConnective ? 0.16 : 0;
      local += wLen >= 18 && wLen <= 34 ? 0.1 : 0;
      local -= hasContraction ? 0.14 : 0;
      local = clamp(local, 0, 1);

      return {
        offset: s.start,
        len: s.text.length,
        flag: local > 0.62 ? 'high' : local > 0.38 ? 'mid' : 'low',
      };
    });

    return { score, sentences };
  },
};
