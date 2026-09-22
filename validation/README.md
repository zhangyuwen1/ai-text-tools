# 检查点① 验证手册：AI 人性化效果实测

- **目的**：在写任何网站代码之前，验证本项目最后一个未验证的核心假设——
  **"DeepSeek + 提示词工程" 做的人性化，能否把主流检测器的 AI 分数压到 40% 以下。**
- **预算**：DeepSeek 充值 $1-2（20 条样本的全部调用成本不到 $0.05）；检测用免费额度。
- **耗时**：脚本运行 2 分钟 + 手动评分 1-2 小时 + 判定，合计半天到一天。

---

## 判定标准（先记住再看数据）

| 结果 | 标准 | 动作 |
|---|---|---|
| ✅ **通过** | ≥ 14/20（70%）条样本 after 分数 < 40% **且** 事实/意思无损坏 | 开工建站（03 文档第 1 周）|
| ⚠️ 边缘 | 10-13 条达标 | 迭代提示词再跑一轮（改 `prompts/humanizer-system.txt`，重跑失败样本）；最多迭代 3 轮，仍边缘则按 ❌ 处理但可降低产品承诺（低价+轻定位）继续 |
| ❌ 不通过 | < 10 条达标 | 停止本项目，转通用工具站+导航站方向（损失：1 天）|

**两个附加观察项**（不影响判定，但要看）：
1. `before_score` 平均值应 ≥ 70%——如果原文本身测不出 AI 味，说明样本太"人味"，需要换样本重测（样本刻意写成典型 AI 文风，正常应很高）
2. `meaning_intact` 列：任何一条出现事实错误/捏造内容，提示词第 3 条规则要加重，属于可修问题

---

## 操作步骤

### 第 1 步：准备 DeepSeek API Key（5 分钟）

1. 注册 https://platform.deepseek.com
2. 充值 $1-2（左上角 Billing）
3. API Keys → 创建 → 复制 `sk-` 开头的密钥

### 第 2 步：运行人性化脚本（2 分钟）

在本目录（`validation/`）执行：

```bash
# Git Bash
export DEEPSEEK_API_KEY=sk-你的密钥
node run-validation.mjs

# Windows CMD
set DEEPSEEK_API_KEY=sk-你的密钥 && node run-validation.mjs

# PowerShell
$env:DEEPSEEK_API_KEY="sk-你的密钥"; node run-validation.mjs
```

产物：`results/humanized/` 下 20 个同名文件（人性化后版本）。
中断可重跑，已完成的自动跳过，不重复计费。

### 第 3 步：评分（1-2 小时，免费）

用 **至少 2 个** 检测器交叉测（免费额度够用）：

| 检测器 | 地址 | 免费额度 |
|---|---|---|
| GPTZero | gptzero.me | 免费，无需注册 |
| ZeroGPT | zerogpt.com | 免费 |
| Originality | originality.ai | 注册送少量免费扫描 |
| Copyleaks | copyleaks.com | 免费试用 |

每条样本测两次，把分数记进 `scores.csv`：

1. **before**：把 `samples/01-academic-history.txt` 的原文粘进检测器 → 记 AI 分
2. **after**：把 `results/humanized/01-academic-history.txt` 粘进同一检测器 → 记 AI 分
3. 顺手核对 after 版本：数字、人名、事实是否与原文一致 → 填 `meaning_intact`（Y/N）

> 检测器分数以百分比记录（GPTZero 显示的 AI probability；ZeroGPT 显示的 AI content %）。
> 建议主用 GPTZero 记分，另一个检测器抽测 5 条做交叉验证——不同检测器分差很大是常态，这正是市场现实。

### 第 4 步：判定

数一下 after_score < 40 的条数，对照上面的判定表做决定。

把最终结果追加记录到这里（供后续复盘）：

```
日期：
使用的检测器：
通过条数（after < 40）：
before 平均分：
结论：通过 / 边缘（第__轮迭代）/ 放弃
```

---

## 提示词迭代方法（边缘时用）

改 `prompts/humanizer-system.txt` 后只重跑未达标样本：

```bash
# 先删除 results/humanized/ 里没过的那几个文件，然后：
node run-validation.mjs
```

迭代方向（按优先级）：
1. 提高句长方差要求（检测器对均匀句长极敏感）
2. 加入"每段允许一次不完整句/插入语"指令
3. 针对检测器敏感词清单加禁用词（跑完一轮看哪些 AI 词残留）
4. temperature 在 0.7-1.2 之间扫一遍找最优

## 文件清单

```
validation/
├── README.md                 ← 本手册
├── prompts/
│   └── humanizer-system.txt  ← 人性化系统提示词（迭代对象）
├── samples/                  ← 20 条 AI 风格原文（before 侧）
├── results/humanized/        ← 脚本产物（after 侧）
├── run-validation.mjs        ← 批量人性化脚本
└── scores.csv                ← 评分记录表（判定依据）
```
