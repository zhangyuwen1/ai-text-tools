# AI Text Tools (working title: TextKit)

面向英语市场的 AI 文本工具站：AI 检测器 + AI 人性化 + 文本工具矩阵。
商业模式与全部设计决策见 `docs/`（PRD / 架构 / 开发计划 / 部署 / SEO 手册）。

## 快速开始

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # 产出 dist/（纯静态）
```

## 仓库结构

```
docs/         五份项目文档（先读 01-PRD）
validation/   检查点① 验证工具包（已通过：16/20 样本降分至 <40%）
src/          站点源码（Astro + Tailwind）
public/       静态资源（robots.txt 等）
```

## 开发状态

- [x] 检查点①：人性化提示词 v2 实测通过（zerogpt 16/20 < 40%，事实零损坏）
- [x] 第 1 周：骨架 + 4 个纯客户端工具
- [x] 第 2 周核心：AI 检测器全链路（启发式 provider + 限流 + 分享页；正式供应商接入待账号）
- [x] 第 3 周核心：AI 人性化全链路（v2 提示词 + 四模式三档强度 + 闭环演示 0.92→0.16 实测）
- [ ] 第 3 周收尾：/paraphrasing-tool、/text-summarizer（复用 llm.ts）
- [ ] 第 4 周：账户 + 支付（MoR）
- [ ] 第 5 周：pSEO 长尾页生成器
