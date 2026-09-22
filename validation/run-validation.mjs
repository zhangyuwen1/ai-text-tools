#!/usr/bin/env node
/**
 * 检查点① 验证脚本：批量人性化处理样本
 *
 * 用法：
 *   1. 设置环境变量 DEEPSEEK_API_KEY（https://platform.deepseek.com 充值 $1-2 即可）
 *      Git Bash:  export DEEPSEEK_API_KEY=sk-xxxx
 *      CMD:       set DEEPSEEK_API_KEY=sk-xxxx
 *      PowerShell: $env:DEEPSEEK_API_KEY="sk-xxxx"
 *   2. node run-validation.mjs            # 全量运行（已处理的自动跳过）
 *      node run-validation.mjs --fresh    # 清空结果重跑
 *      node run-validation.mjs --only 01  # 只跑指定编号的样本
 *
 * 输出：results/humanized/<同名>.txt —— 之后按 README 手动评分
 */

import { readdir, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAMPLES_DIR = path.join(__dirname, "samples");
const OUT_DIR = path.join(__dirname, "results", "humanized");
const PROMPT_FILE = path.join(__dirname, "prompts", "humanizer-system.txt");
const API_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-chat";
const DELAY_MS = 1500; // 温和限速，避免触发频控

const args = process.argv.slice(2);
const fresh = args.includes("--fresh");
const onlyIdx = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;

const apiKey = process.env.DEEPSEEK_API_KEY;
if (!apiKey) {
  console.error("\n[缺配置] 未检测到 DEEPSEEK_API_KEY 环境变量。");
  console.error("  1. 到 https://platform.deepseek.com 注册并充值（$1-2 足够跑完全部样本）");
  console.error("  2. 创建 API Key，然后按 README 中的命令设置环境变量后重试。\n");
  process.exit(1);
}

const systemPrompt = await readFile(PROMPT_FILE, "utf8");
const files = (await readdir(SAMPLES_DIR)).filter((f) => f.endsWith(".txt")).sort();

if (!files.length) {
  console.error(`[错误] ${SAMPLES_DIR} 下没有找到 .txt 样本`);
  process.exit(1);
}

if (fresh && existsSync(OUT_DIR)) await rm(OUT_DIR, { recursive: true });
await mkdir(OUT_DIR, { recursive: true });

const wanted = onlyIdx ? onlyIdx.split(",").map((s) => s.trim()).filter(Boolean) : null;
const targets = wanted ? files.filter((f) => wanted.some((w) => f.startsWith(w))) : files;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function humanize(name, text) {
  const words = text.trim().split(/\s+/).length;
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.9,
      max_tokens: Math.ceil(words * 2.5),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const out = data.choices?.[0]?.message?.content?.trim();
  if (!out) throw new Error("模型返回为空");
  return out;
}

const summary = { ok: 0, skipped: 0, failed: [] };

for (const file of targets) {
  const outPath = path.join(OUT_DIR, file);

  if (existsSync(outPath) && !fresh) {
    console.log(`= 跳过（已有结果）: ${file}`);
    summary.skipped++;
    continue;
  }

  const text = await readFile(path.join(SAMPLES_DIR, file), "utf8");
  process.stdout.write(`> 处理: ${file} ... `);

  try {
    const result = await humanize(file, text);
    await writeFile(outPath, result, "utf8");
    console.log(`完成（${result.split(/\s+/).length} 词）`);
    summary.ok++;
  } catch (err) {
    console.log(`失败 —— ${err.message}`);
    summary.failed.push(file);
  }

  await sleep(DELAY_MS);
}

console.log("\n========== 运行摘要 ==========");
console.log(`成功: ${summary.ok} | 跳过: ${summary.skipped} | 失败: ${summary.failed.length}`);
if (summary.failed.length) {
  console.log("失败清单（可直接重跑，已成功的不会重复计费）:");
  summary.failed.forEach((f) => console.log(`  - ${f}`));
}
console.log(`\n下一步：打开 ${OUT_DIR}，按 README.md 的评分流程记录 before/after 分数到 scores.csv`);
