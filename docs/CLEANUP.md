# 2026-10-16 整理记录

整理以已确认首页为基准，拆分职责、清除闲置内容并建立共享入口。

## 备份

整理前源文件快照（不含可重装的 node_modules）位于 Source 外部：

`E:\OneDrive\Design files sync\AI\Proj. WattDesk\Backups\Source-before-consolidation-20261016-183026.zip`

恢复历史探索时解压到单独目录，不覆盖当前基础。详细迁移与删除清单在 `design-preview/design/consolidation-manifest.json`。

## 已整理

- 单体首页拆分为 foundation、component、layout、page。共享 CSS 统一入口；首页实际使用按钮、搜索、导航、头像、卡片、玻璃、折叠、浮层模块。
- 原始 Figma 来源与运行资产分开，生成场景从 509 精简为 328 节点，运行时再排除已删除入口、重复光学层及 Period metadata 整枝，当前渲染 326 节点；不再先构建旧外壳再丢弃。
- 删除旧外壳失效事件、弃用 CSS、Liquid 折射试验逻辑与设置。正式材质不再生成无用折射图/canvas。
- 颜色语义别名引用生成变量；保留已确认光学/控件值及固定几何。字体直接真实 style 绑定，不按字号猜样式。
- 清理 31 个无运行引用 SVG，保留 95 个引用资产（94 SVG + 本地字体）；原始来源与旧素材恢复路径保留。
- 删除历史 `glass.html` / `linear.html`、旧 app/workspace 代码和测试、旧参考页、生成器及过期截图。移除专用 `@phosphor-icons/web` / `jsdom` 和 node_modules，当前运行无第三方依赖。
- 历史规划移至 `docs/history/`，保留业务背景但不作为当前视觉标准。
- 检查移至 `tests/`，固定基线与运行产物分开，npm test 只检查当前首页及共享组件；静态服务默认打开首页。
- 开发阅读顺序、组件用法、真实边界和最新修正已落文档。

## 验证

重构前基线在 `tests/fixtures/refactor-before/`，覆盖深浅主题及 1545×1252 / 1920×1080；运行产物在 `tests/output/`。固定基线不自动覆盖。

本轮最终结果：

- `npm run check`：34 个 JavaScript 文件语法通过。
- `npm test`：首页交互、15 个共享玻璃、主题交叉淡变/连续切换/持久化、81 个场景文字、37 个组件半径与尺寸、圆角实际轮廓及兼容回退、独立组件双主题/键盘/禁用/清理均通过；无页面异常或素材加载失败。
- `npm run test:visual`：深浅两主题 × 1545×1252 / 1920×1080 四张静态截图与整理前逐像素一致（差异 0）。
- `npm run audit:assets`：95 个资产，缺失 0、闲置 0。
- 连续执行 `npm run sync` 后五个生成文件的 SHA-256 均未变化，生成结果稳定。

静态像素比对只约束本轮确认画面；后续设计改变时须审阅并有意更新相应基线，不能据此宣称新增业务逻辑已实现。

## 2026-10-21 仓库与发布整理

清理目标是把“本地调试产物”和“运行源码”分开，规则落在根目录 `.gitignore` 与 [发布与部署](./DEPLOYMENT.md)。

- 取消跟踪 354 个文件：根 `tests/`（含 `tests/output/` 截图）、根 `output/`、5 个 `.patch`、`design-preview/tests/_*.cjs` / `_*.py`（177 个一次性探针）、`deploy-result.json`、`deploy-lines.txt`、`dist-server.cjs`。本地文件保留，只从索引移除。
- 移除 `design-preview/dist-public/`（173 个文件）：它是早期手动构建的副本，已经落后于 `src`（缺少 Glass Surface 等改动），且从未被 Cloudflare 部署；线上由 `npm run build:site:public` 生成 `dist/`。
- 修复 `/home` ↔ `/home.html` 自指重定向死循环，`_redirects` 只保留说明性注释。
- `/*.html`、`/src/*`、`/home-assets/*` 缓存统一为 `max-age=0, must-revalidate`，避免无 hash 资源在部署后与 HTML 版本错配。
- 保留：`tests/verify-*.cjs`、`tests/runtime.cjs`、`tests/run.cjs`、`tests/fixtures/`、`verify-deploy.cjs`（发布自检）、`design/figma/` 全部源数据。
- Git 历史中的旧文件未改写；仓库体积不会立刻下降，如需瘦身须单独评估历史改写风险。

### 本地工作区清理（同日）

取消跟踪之后，本地仍留着约 950 个不再需要的文件；本次一并清掉，工作区从 **1182 个文件 / 约 94 MB** 降到 **235 个文件 / 3.67 MB**（不含 `.git`），`git status` 保持干净。

- 删除可再生产物：`design-preview/tests/output/`（398 张截图，41.7 MB）、根 `tests/`（124 个文件）、根 `output/`（46 个）、`design-preview/dist/`、`design-preview/output/`、`previews/`、空目录 `dist-public/`。
- 删除一次性文件：4 个 `.patch`、`patch.txt` / `patch.tmp` / `apply.cjs` / `.codex-patch.txt` / `_inspect-search.cjs`、`deploy-result.json`、`deploy-lines.txt`、`dist-server.cjs`。
- 177 个调试探针（`design-preview/tests/_*.cjs` / `_*.py`）移到 Source 外的 `Backups\local-debug-probes-20261021`，需要时可单独恢复；Git 历史中也仍可追溯。
- 保留：10 个 `verify-*.cjs`、`run.cjs`、`runtime.cjs`、`fixtures/`、`design/figma/`、`home-assets/`、`templates/`、`dev/`（批注模式）与本地 `annotations.json`。
- 清理后 `npm run check` 通过（52 个 JavaScript 文件）。
