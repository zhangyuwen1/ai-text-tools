# AI 文本工具站 — SEO / GEO 执行手册

- **文档版本**：v1.0
- **日期**：2026-09-22
- **配套**：01-PRD（页面清单）、03-开发计划（第 5-6 周执行本手册）

本手册回答一个问题：**一个零预算的人，如何让 80 个页面在 6 个月内拿到每月 3 万自然访问，并让 ChatGPT 们推荐我们。**

---

## 1. 关键词研究方法（全程免费工具）

| 工具 | 用途 |
|---|---|
| Google Keyword Planner | 基础量级与竞价参考（免登录可看区间）|
| Google 自动补全 + People Also Ask | 长尾词挖掘：搜 `ai detector` 逐字母延伸（ai detector f... / for...）|
| Keyword Surfer（免费插件）| 搜索结果页直接看词量 |
| Google Trends | 验证词的走势（必须选上升趋势词）|
| Ahrefs 免费 Webmaster Tools | 上线后查自己站的反链与排名（只需验证自己域名）|
| 竞品扫描 | 打开竞品的 sitemap.xml，看他们在铺什么词——抄作业对象而非照抄 |

**选词三问**（每个词入表前必答）：
1. 搜这个词的人，**用我们的工具能立刻完成任务吗**？（不能 → 不做）
2. 前 10 名里有没有**专门为这个词做的页面**？（全是泛页面 → 机会）
3. 量级 ≥ 100/月 或 组合裂变潜力大？（长尾组合词优先）

## 2. 词库分层（先布防哪一层）

| 层 | 例 | 策略 |
|---|---|---|
| 大词（不碰）| ai detector, ai humanizer | 竞品重兵区，12 个月内不指望排名，但页面要存在（用核心工具页承接）|
| 中词（第二梯队）| ai detector for teachers, humanize chatgpt text | 上线 3 个月后靠内容质量自然爬 |
| 长尾（主攻）| ai detector for scholarship essays, humanize ai text for instagram captions | 每周新增 5-10 页，这是全部希望所在 |

## 3. 长尾页模板规范（生成器依据此规范）

每页七个要件，**缺一不可**：

```
URL:    /ai-detector-for-teachers          ← 就是关键词本身，连字符分词
H1:     AI Detector for Teachers — Check Essays Free
首60词:  直接回答式导语（见下）
工具区:  真实可用的检测器（文案示例预填教师场景）
FAQ:    3-5 条（来自 People Also Ask 的真实问题）
内链:    2-3 条（→ /ai-humanizer、→ 相关长尾页、→ /pricing）
Schema:  SoftwareApplication + FAQPage JSON-LD
```

**首 60 词模板**（GEO 的命门——AI 引擎抓直给答案）：

> Paste any student essay below to instantly check how likely it was written by AI. Free, no signup, with sentence-by-sentence highlighting. Built for teachers grading essays.

规则：第一句 = 动作指令（Paste...）；第二句 = 免费免注册；第三句 = 人群锚定。**不写营销形容词**。

**每页的"独特性"要求**（防 Google 批量页惩罚）：工具示例文本、FAQ、导语的第三句必须按人群改写——生成器用变量表驱动，不允许三处共用默认文案。

## 4. 变量表与生成器

`data/longtail-seeds.csv` 格式：

```csv
slug,h1,audience,answer_third_sentence,sample_text,faq_csv,internal_links
ai-detector-for-teachers,AI Detector for Teachers,teachers,"Built for teachers grading essays.",<示例文本>, "How accurate is AI detection?|Can teachers rely on it alone?|...", "/ai-humanizer,/ai-detector-for-resumes"
ai-detector-for-essays,AI Detector for Essays,students,...,...,...,...
humanize-chatgpt-text,Humanize ChatGPT Text,chatgpt users,...,...,...,...
```

- 首批 60 行按三个维度填：人群 × 12、平台 × 8、语言 × 6 + 工具组合 × 34
- `scripts/generate-longtail.ts` 在构建时读表渲染为静态页并计入 sitemap
- **每周运营动作**：从 §1 的挖掘方法补 5-10 行新词进 CSV → push → 自动生成上线（这就是"每周加页"的机械动作，成本 1 小时）

## 5. GEO 清单（让 AI 引擎推荐我们）

- [ ] `robots.txt` **放行**：GPTBot、OAI-SearchBot、PerplexityBot、ClaudeBot、Google-Extended
- [ ] `public/llms.txt`：站点地图式清单——每个工具一段"URL + 一句话能力描述"（AI 引擎解析友好）
- [ ] 每页 JSON-LD：SoftwareApplication（含 offers: $0）+ FAQPage
- [ ] 页面语义化：一个 H1、H2 按 FAQ 排布、`<table>` 用真表格标签
- [ ] 分享结果页 `/r/*` 设 og:title 为结论句（"This text is 87% AI-generated — see the full report"）——被转发时即答案本身
- [ ] 在 Wikipedia 类公共信息源 **不需要** 也**不要**乱塞链接；GEO 的核心是把站内做成"可引用的答案"，配合 §8 的社区露出

## 6. 博客首批 10 篇（第 6 周写完，每篇 800-1500 词）

选题原则：**每篇都为某个中词服务，且文内必须内链到对应工具页**。

1. How to Tell if an Essay Was Written by AI（→ detector）
2. Why AI Detectors Flag Human Writing (and What to Do About It)
3. How to Humanize AI Text Without Losing Meaning（→ humanizer）
4. AI Detection for Teachers: A Practical Guide（→ 长尾页）
5. Will Google Penalize AI Content? What Actually Matters（SEO 流量）
6. ChatGPT vs Gemini vs DeepSeek: Which Sounds Most Human?（对比词引流）
7. 15 AI Words That Make Your Writing Sound Like a Robot（易传播，配工具）
8. How to Check Your Resume for AI Red Flags（→ detector for resumes）
9. The Fair Way to Use AI Detectors in Classrooms（教师群体信任建设）
10. Free Online Text Tools for Students（站内矩阵总览，内链枢纽）

## 7. 内链架构（每周加页时顺手做）

```
首页 ── 全部工具入口（权重分配核心）
  ├── 核心工具页 ── 双向链到全部同维度长尾页
  ├── 矩阵工具页 ── 底部"相关工具"三连
  └── 长尾页 ── 必须链回核心工具页 + 1-2 个同级长尾页
博客 ── 每篇至少 2 条链到工具/长尾页
```

规则：**任何新页面 24 小时内必须从至少 2 个已有页面链到它**（否则是孤岛，Google 不收）。面包屑导航全站统一。

## 8. 发布与外链（全免费渠道，第 8 周启动）

| 渠道 | 动作 | 节奏 |
|---|---|---|
| Product Hunt | 以免费工具站身份发布（强调"no signup"）| 上线当天一次 |
| Hacker News（Show HN）| 英文自述：一个人做的免费 AI 工具站 | 上线当周一次 |
| Reddit | r/InternetIsBeautiful、r/SideProject、r/artificial；**只发工具价值，绝不发广告腔**（账号先养两周，有 karma）| 每新工具可发一次 |
| X / Threads | build in public：发开发数据、截图、里程碑 | 每周 2-3 条 |
| Indie Hackers | 发 build 记录 + 收入公开帖（这个社区最吃这套）| 每月一篇 |
| 相关博客评论区/论坛 | **只在真实相关时**留有价值的回答附链接 | 机会型 |

红线：**绝不买外链、绝不互链农场、绝不群发**——Google 对新站的垃圾外链惩罚是致命的。

## 9. AdSense 接入时机

- **不要上线就申请**（拒绝率高且留记录）
- 触发条件：月访问 > 10,000 且有 20+ 篇内容页（约第 3-4 个月）
- 通过后广告位：仅工具页结果区下方 + 博客文中，**核心工具页交互区方圆 500px 内无广告**（防误点违规 + 保转化）
- 广告收入定位：订阅的补充，永远不为了广告密度牺牲速度（LCP 每慢 1s 排名掉一截）

## 10. 周度 SEO 例行（30 分钟/周，长期坚持）

1. Google Search Console 看：新页收录数、点击 TOP10 页、新增查询词
2. 新查询词 → 有潜力的补进 seeds.csv（§4 的每周动作）
3. 排名 5-15 名的页面 → 加强内链 + 扩充 FAQ（推进前 5 的性价比最高）
4. 404/抓取错误清零

## 11. 禁止事项（一次就出局）

- ❌ 批量生成"仅换词"的空壳页（Google Helpful Content 的定向打击对象）
- ❌ 隐藏文字、关键词堆砌、门页（doorway pages）
- ❌ 伪造用户评价/ testimonials
- ❌ 在标题写 "Free" 但实际强制付费
- ❌ 声称 "100% accurate detection"（既违规也是招投诉的旗子——PRD 风险表已列免责措辞）
