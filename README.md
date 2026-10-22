# messages-pro · Onlyfans CRM Lab

围绕 Onlyfans CRM 的产品研究仓库，包含一份产品价值分析报告和两个可交互的 CRM 原型：

| 页面 | 入口 | 说明 |
| --- | --- | --- |
| 产品价值分析报告（首页） | `/` | 基于 Infloww、Supercreator、OnlyMonster、CreatorHero 四家平台官方资料，梳理五类核心产品价值、15 个落地点与 48 项已核查实现，并给出 Infloww 建设建议 |
| Messages Pro Demo | `/app/` | React 版 CRM 交互原型，用本地模拟的关系、履约与交接任务验证 CRM 交互设计（租户分级、工作区编排、工作流等） |
| Infloww Demo | `/infloww/` | 复刻 Infloww 消息工作台的交互演示，全部状态为本地 mock，用于对照验证消息、媒体、脚本库等交互 |

三份页面共用一个 Vite 多页应用（MPA），站点 base 为 `/messages-pro/`，本地访问地址为 `http://localhost:5173/messages-pro/`。

## 技术栈

- Vite 8（MPA，三个 HTML 入口）+ React + Zustand + TypeScript + lucide-react
- 单元测试：Node.js 内置 test runner（`node:test`）
- 浏览器验收：Playwright CLI 脚本
- 包管理：pnpm

## 快速开始

```bash
pnpm install
```

```bash
pnpm dev
```

启动后访问 `http://localhost:5173/messages-pro/`。

## 常用脚本

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 启动 Vite 开发服务器 |
| `pnpm build` | 类型检查（`tsc -b`）后构建到 `dist/` |
| `pnpm preview` | 本地预览构建产物 |
| `pnpm test` | 运行 `tests/*.test.mjs` 单元测试 |
| `pnpm acceptance` | 单元测试 + 构建 + 浏览器验收 |

浏览器验收（`tests/run-browser-acceptance.sh`）会在 5187 端口启动 `vite preview`，并通过 Playwright CLI 驱动真实浏览器执行验收场景，报告写入 `output/playwright/acceptance-report.json`。Playwright CLI 默认取 `~/.codex/skills/playwright/scripts/playwright_cli.sh`，可用环境变量 `PLAYWRIGHT_CLI` 覆盖。

## 目录结构

```
├── index.html              # 报告首页（入口）
├── app/index.html          # Messages Pro Demo（入口）
├── infloww/index.html      # Infloww Demo（入口）
├── public/
│   ├── analysis.md         # 报告完整分析文档（可下载）
│   └── infloww-media/      # 演示用媒体资源
├── src/
│   ├── value-playbook.ts   # 报告页渲染逻辑
│   ├── value-playbook-data.ts   # 报告数据：五类核心价值、落地点、实现
│   ├── value-playbook-sources.ts # 官方来源清单
│   ├── main.tsx            # Messages Pro Demo 应用
│   ├── infloww-demo/       # Infloww Demo 应用（含实现约定文档）
│   └── …                   # 工作流、工作区引擎、租户规则等共享模块
├── tests/                  # 单元测试与浏览器验收脚本
└── output/playwright/      # 验收报告与截图产物
```

## 内容与数据

- 报告的正文由数据驱动：修改 `src/value-playbook-data.ts` 中的价值框架与落地点、`src/value-playbook-sources.ts` 中的官方来源后，页面（含目录、总览表与来源编号）会自动更新。
- 页面上的「下载完整分析」由数据中的 `buildMarkdown` 生成，与 `public/analysis.md` 内容对应。
- 报告口径：每条「当前实现」都附官方文章与章节；问题、作用与场景属于本仓库的分析判断，与事实来源分开标注。

## 原型实现约定

Infloww Demo 的实现约束与对照记录见 `src/infloww-demo/` 下的文档：

- `CONTRACT.md` — 共享模块的使用约定（store、UI 组件、类型导入）
- `POPUP_PARITY.md` — 弹层行为的本地证据与未实现项
- `INTERACTION_COVERAGE.md` — 首层工作区与覆盖层的交互清单
- `SCREENSHOT_ALIGNMENT.md` — 与参考截图的差异修正记录
