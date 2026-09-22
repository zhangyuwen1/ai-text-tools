// DeepSeek 统一封装（02 文档 §1：主力 DeepSeek，抽象可切 Gemini）。
// 密钥来自环境变量 DEEPSEEK_API_KEY（.dev.vars 本地 / Pages 控制台生产）。

const API_URL = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-chat';

export class LLMNotConfiguredError extends Error {
  constructor() {
    super('DEEPSEEK_API_KEY is not configured.');
  }
}

export async function callLLM(
  apiKey: string | undefined,
  system: string,
  user: string,
  inputWords: number,
): Promise<string> {
  if (!apiKey) throw new LLMNotConfiguredError();

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.9,
      max_tokens: Math.ceil(inputWords * 2.5),
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`DeepSeek HTTP ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const out = data.choices?.[0]?.message?.content?.trim();
  if (!out) throw new Error('DeepSeek returned empty content');
  return out;
}
