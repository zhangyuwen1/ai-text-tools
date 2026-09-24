// SEO 内容审计引擎：多维评分（AI + 节奏 + 词汇 + 结构 + 可读性）
// 复用启发式检测器，叠加 SEO 维度分析

import { heuristicDetector, AI_MARKERS } from './detect/heuristic';

export interface AuditIssue {
  severity: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  fix: string;
}

export interface AuditReport {
  url: string;
  title: string;
  wordCount: number;
  scores: {
    aiProbability: number;     // 0-100
    sentenceRhythm: number;    // 0-100 (higher = more varied = better)
    vocabularyHealth: number;  // 0-100 (higher = fewer AI markers)
    structureQuality: number;  // 0-100 (heading/paragraph diversity)
    readability: number;       // 0-100 Flesch
    overallRisk: number;       // 0-100 (higher = more AI-like + worse SEO)
  };
  riskLabel: 'low' | 'medium' | 'high' | 'critical';
  issues: AuditIssue[];
  highlights: {
    aiMarkers: string[];
    sentenceLengthVariance: number;
    avgSentenceLength: number;
    fleschScore: number;
    paragraphCount: number;
    headingCount: number;
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function stdev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length);
}

// Flesch Reading Ease（简化版，足够做评分用）
function fleschScore(words: number, sentences: number, syllables: number): number {
  if (words === 0 || sentences === 0) return 0;
  const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  return clamp(Math.round(score), 0, 100);
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  const matches = w.match(/[aeiouy]+/g);
  return matches ? Math.max(1, matches.length) : 1;
}

export async function auditContent(url: string, rawHtml: string, pageTitle: string): Promise<AuditReport> {
  // 提取纯文本（去 script/style/nav/footer）
  let text = rawHtml
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

  const words = text.split(/\s+/).filter((w) => w.length > 0 && /[a-zA-Z]/.test(w));
  const wordCount = words.length;

  // 句子分析
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  const sentenceLengths = sentences.map((s) => s.trim().split(/\s+/).length);
  const avgSentenceLength = sentenceLengths.reduce((a, b) => a + b, 0) / Math.max(1, sentenceLengths.length);
  const variance = stdev(sentenceLengths);
  const burstiness = avgSentenceLength > 0 ? variance / avgSentenceLength : 0;

  // 段落分析（按换行拆）
  const paragraphs = text.split(/\n+/).filter((p) => p.trim().length > 20);
  const headingMatches = rawHtml.match(/<h[1-6][^>]*>/gi) ?? [];

  // AI 词汇
  const lower = text.toLowerCase();
  const aiMarkerHits: { word: string; count: number }[] = [];
  let totalMarkers = 0;
  for (const m of AI_MARKERS) {
    const c = lower.split(m).length - 1;
    if (c > 0) {
      aiMarkerHits.push({ word: m, count: c });
      totalMarkers += c;
    }
  }
  aiMarkerHits.sort((a, b) => b.count - a.count);
  const markerDensity = wordCount > 0 ? (totalMarkers / wordCount) * 1000 : 0; // per 1000 words

  // 启发式 AI 检测（异步）
  const detection = await heuristicDetector.detect(text);

  // 音节（用于 Flesch）
  const syllables = words.slice(0, 500).reduce((a, w) => a + countSyllables(w), 0);
  const scaledSyllables = wordCount > 500 ? (syllables / 500) * wordCount : syllables;
  const flesch = fleschScore(wordCount, sentences.length, scaledSyllables);

  // ===== 维度评分 =====

  // 1. AI 概率（直接用启发式）
  const aiProbability = Math.round(detection.score * 100);

  // 2. 句子节奏（burstiness 越高越好；0.4+ = 优秀，0.15 = 差）
  const sentenceRhythm = Math.round(clamp((burstiness / 0.5) * 100, 0, 100));

  // 3. 词汇健康度（AI 标记密度越低越好；0/1000 词 = 100 分，5/1000 = 60 分，10+ = 20 分）
  const vocabularyHealth = Math.round(clamp(100 - (markerDensity / 12) * 100, 0, 100));

  // 4. 结构质量（段落多样性 + 标题层级）
  const paragraphLengths = paragraphs.map((p) => p.split(/\s+/).length);
  const paragraphVariance = stdev(paragraphLengths) / Math.max(1, paragraphLengths.reduce((a, b) => a + b, 0) / paragraphLengths.length);
  const hasHeadings = headingMatches.length >= 3;
  const hasVariedParagraphs = paragraphVariance > 0.3;
  let structureQuality = 50;
  if (hasHeadings) structureQuality += 20;
  if (hasVariedParagraphs) structureQuality += 20;
  if (paragraphs.length >= 5) structureQuality += 10;
  structureQuality = clamp(structureQuality, 0, 100);

  // 5. 可读性（Flesch 60-80 最佳，30 以下太差，90+ 太简单）
  const readability = flesch >= 60 && flesch <= 80 ? 100 : flesch >= 40 && flesch < 60 ? 80 : flesch > 80 ? 70 : flesch >= 20 ? 50 : 30;

  // 6. 综合风险（加权：AI 40% + 节奏 25% + 词汇 20% + 结构 15%）
  const overallRisk = Math.round(
    aiProbability * 0.40 +
      (100 - sentenceRhythm) * 0.25 +
      (100 - vocabularyHealth) * 0.20 +
      (100 - structureQuality) * 0.15
  );

  const riskLabel = overallRisk >= 75 ? 'critical' : overallRisk >= 55 ? 'high' : overallRisk >= 35 ? 'medium' : 'low';

  // ===== 生成问题列表 =====
  const issues: AuditIssue[] = [];

  if (aiProbability >= 70) {
    issues.push({
      severity: 'high',
      title: 'High AI probability',
      detail: `${aiProbability}% of this content matches AI writing patterns. Search engines and AI detection tools will flag it.`,
      fix: 'Rewrite flagged paragraphs with varied sentence rhythm. Use the AI Humanizer to automate this.',
    });
  } else if (aiProbability >= 45) {
    issues.push({
      severity: 'medium',
      title: 'Moderate AI probability',
      detail: `${aiProbability}% AI probability. Some sections may trigger detection in strict environments.`,
      fix: 'Review the sentence breakdown and rewrite the most-flagged paragraphs.',
    });
  }

  if (burstiness < 0.25) {
    issues.push({
      severity: sentenceRhythm < 30 ? 'high' : 'medium',
      title: 'Uniform sentence rhythm',
      detail: `Average sentence length is ${Math.round(avgSentenceLength)} words with low variation (burstiness: ${burstiness.toFixed(2)}). This is a strong AI signal.`,
      fix: 'Mix short punchy sentences (3-5 words) with longer ones (25+ words). Target burstiness > 0.4.',
    });
  }

  if (markerDensity > 5) {
    issues.push({
      severity: markerDensity > 10 ? 'high' : 'medium',
      title: 'AI vocabulary detected',
      detail: `${totalMarkers} AI-typical words found (${markerDensity.toFixed(1)} per 1,000 words). Top: ${aiMarkerHits.slice(0, 3).map((h) => h.word).join(', ')}.`,
      fix: 'Replace AI words (delve, moreover, tapestry, leverage, robust...) with plain alternatives.',
    });
  }

  if (wordCount < 300) {
    issues.push({
      severity: 'medium',
      title: 'Thin content',
      detail: `Only ${wordCount} words. Thin content ranks poorly regardless of AI/human origin.`,
      fix: 'Expand to at least 600 words with original insights, examples, or data.',
    });
  }

  if (flesch < 30) {
    issues.push({
      severity: 'low',
      title: 'Difficult to read',
      detail: `Flesch score: ${flesch}. Content is very dense and complex.`,
      fix: 'Shorten sentences. Aim for Flesch 60-80.',
    });
  }

  if (!hasHeadings && wordCount > 500) {
    issues.push({
      severity: 'low',
      title: 'No heading structure',
      detail: 'Long content without H2/H3 headings. Poor structure signals low quality.',
      fix: 'Break content into sections with descriptive H2 headings.',
    });
  }

  if (issues.length === 0) {
    issues.push({
      severity: 'low',
      title: 'Content looks healthy',
      detail: `AI probability ${aiProbability}%, good sentence rhythm, clean vocabulary, ${wordCount} words.`,
      fix: 'No immediate action needed. Monitor periodically.',
    });
  }

  return {
    url,
    title: pageTitle,
    wordCount,
    scores: {
      aiProbability,
      sentenceRhythm,
      vocabularyHealth,
      structureQuality,
      readability,
      overallRisk,
    },
    riskLabel,
    issues,
    highlights: {
      aiMarkers: aiMarkerHits.slice(0, 5).map((h) => (h.count > 1 ? `${h.word} ×${h.count}` : h.word)),
      sentenceLengthVariance: Math.round(variance * 100) / 100,
      avgSentenceLength: Math.round(avgSentenceLength),
      fleschScore: flesch,
      paragraphCount: paragraphs.length,
      headingCount: headingMatches.length,
    },
  };
}
