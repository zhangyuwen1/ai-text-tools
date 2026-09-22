// 人性化提示词 —— 本文件是产品核心资产。
// v2 基础规则来自 validation/ 检查点①实测（16/20 样本降至 <40% AI 分，事实零损坏）。
// 任何修改必须跑 validation 样本回归（03 文档 §3.4）。

export const HUMANIZE_SYSTEM = `You rewrite AI-generated text so it reads as casual, natural human writing. You must defeat AI detectors, which measure sentence-length uniformity ("burstiness"), vocabulary predictability, and structural balance.

Hard requirements (check your output against every one before returning):

1. SENTENCE LENGTH: At least 30% of sentences must be under 6 words. At least two sentences must be under 4 words. At least one sentence must run 25+ words. Never allow three consecutive sentences within 3 words of the same length.
2. WORD CHOICE: Use plain, concrete, 8th-grade vocabulary. Replace every abstract nominalization with a verb ("make a decision" -> "decide"). Kill these words completely: delve, moreover, furthermore, however, additionally, therefore, utilize, leverage, foster, robust, seamless, tapestry, landscape, crucial, pivotal, testament, "It is important to note", "In conclusion", "plays a role", "In today's world".
3. STRUCTURE: Break the rigid outline. Allow a one-sentence paragraph. Merge two paragraphs. Put the conclusion-ish sentence in the middle, not at the end. Never mirror the source paragraph order sentence-by-sentence.
4. HUMAN QUIRKS: Use contractions everywhere natural. Include 2-3 of these per text: a dash aside, a short fragment ("Not great."), a casual connector ("And look," / "Thing is,"), one rhetorical question, or mild hedging ("basically", "honestly", "to be fair"). One sentence may start with "But" or "And".
5. PRESERVE MEANING: Every fact, number, name, and claim must survive exactly. Never add information. Never drop information. When in doubt, keep it simpler rather than changing meaning.
6. OUTPUT: Return ONLY the rewritten text. No preamble, no notes, no quotes.`;

export type Mode = 'standard' | 'academic' | 'casual' | 'creative';
export type Strength = 'light' | 'balanced' | 'strong';

export const MODE_REGISTER: Record<Mode, string> = {
  standard: 'Register: neutral, natural everyday writing.',
  academic:
    'Register: academic — precise terms allowed, contractions rare, but sentence rhythm must still vary like a real researcher writing quickly. No stiff filler.',
  casual: 'Register: casual and conversational, like a smart person writing a quick post or email.',
  creative:
    'Register: creative — take liberty with expression and imagery while keeping every fact intact.',
};

export const STRENGTH_DIRECTIVE: Record<Strength, string> = {
  light: 'Rewrite conservatively: keep most phrasing, only smooth the most obviously robotic parts.',
  balanced: 'Rewrite substantially but recognizably.',
  strong: 'Rewrite aggressively — new sentence structures throughout.',
};

export function buildHumanizeSystemPrompt(mode: Mode, strength: Strength): string {
  return [HUMANIZE_SYSTEM, MODE_REGISTER[mode], STRENGTH_DIRECTIVE[strength]].join('\n\n');
}

// ---- 改写器 / 摘要器（矩阵工具，复用同一 LLM 通道）----

export const PARAPHRASE_SYSTEM = `You paraphrase English text. Change wording and sentence structure while preserving the exact meaning and all facts. Output ONLY the paraphrased text.

Style: {style}`;

export const PARAPHRASE_STYLES = {
  fluent: 'natural and smooth',
  formal: 'formal and professional',
  simple: 'plain, simple words (8th grade)',
} as const;

export const SUMMARIZE_SYSTEM = `Summarize the text in roughly one third of its length. Keep every key fact, number, and name. Write plain direct sentences. Output ONLY the summary.`;
