// 端到端冒烟测试：检测（AI 文 vs 人性化文）→ 限流 → 分享页
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = 'http://localhost:4321';
const dir = path.dirname(fileURLToPath(import.meta.url));

const aiText = await readFile(path.join(dir, 'samples/03-blog-productivity.txt'), 'utf8');
const humanText = await readFile(path.join(dir, 'results/humanized/03-blog-productivity.txt'), 'utf8');

async function detect(text) {
  const res = await fetch(`${base}/api/detect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return { status: res.status, data: await res.json() };
}

// 1. AI 风格文本 → 应该高分
const r1 = await detect(aiText);
console.log(`[1] AI 原文   → HTTP ${r1.status} | score=${r1.data.score} label=${r1.data.label} sentences=${r1.data.sentences?.length} remaining=${r1.data.remaining}`);

// 2. 人性化文本 → 应该低分
const r2 = await detect(humanText);
console.log(`[2] 人性化版  → HTTP ${r2.status} | score=${r2.data.score} label=${r2.data.label} remaining=${r2.data.remaining}`);

// 3. 太短的文本 → 400
const r3 = await detect('too short text');
console.log(`[3] 过短文本  → HTTP ${r3.status} | ${r3.data.error?.code}`);

// 4. 限流：连续打到 5 次上限，第 6 次应 429
let last;
for (let i = 0; i < 4; i++) last = await detect(aiText);
console.log(`[4] 第5次     → HTTP ${last.status} | remaining=${last.data.remaining}`);
const r6 = await detect(aiText);
console.log(`[5] 第6次     → HTTP ${r6.status} | ${r6.data.error?.code}`);

// 5. 分享链路（限流已耗尽不影响 share 端点——它不检查额度，生产版要补；先验证存储）
const sentences = r1.data.sentences.map((s) => ({
  text: aiText.slice(s.offset, s.offset + s.len).trim(),
  flag: s.flag,
}));
const shareRes = await fetch(`${base}/api/share`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: aiText, score: r1.data.score, sentences }),
});
const shareData = await shareRes.json();
console.log(`[6] 分享链接  → HTTP ${shareRes.status} | ${shareData.url}`);

if (shareData.url) {
  const page = await fetch(`${base}${shareData.url}`);
  const html = await page.text();
  const hasScore = html.includes('AI Detection Report') && html.includes('Sentence breakdown');
  console.log(`[7] 分享页    → HTTP ${page.status} | 渲染${hasScore ? '正常' : '异常'}`);
}
