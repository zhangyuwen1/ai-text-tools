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
- [x] 第 3 周收尾：/paraphrasing-tool（三风格）、/text-summarizer —— 矩阵工具满 8 个
- [x] 第 5 周提前完成：pSEO 长尾页引擎（30 页：检测 15 + 人性化 15，`src/data/longtail.ts` 加条目即扩页）
- [x] 正式域名上线：**https://textkitai.com**（腾讯云注册 + Cloudflare DNS/Pages，自动 CI/CD）
- [ ] 环境变量配置：DEEPSEEK_API_KEY（Pages 控制台）→ 触发重新部署后 humanizer 生效
- [ ] KV 绑定（RATE_LIMIT/SHARE）→ 限流与分享持久化
- [x] Google Search Console：已验证所有权 + sitemap 已提交（2026-09-22，SEO 时钟启动）
- [ ] 第 4 周：账户 + 支付（MoR）
- [ ] 第 5 周：pSEO 长尾页生成器
