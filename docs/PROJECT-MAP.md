# WattDesk 项目地图与交接索引

更新：2026-10-30。

本文是新对话的项目总索引，只汇总稳定边界、共享标准和维护入口，不复制
`DESIGN-SYSTEM.md` 的完整视觉参数。需要执行具体改动时，仍以根目录
`AGENTS.md` 和相关页面 README 为准。

## 阅读顺序

1. 用户当前明确要求。
2. `AGENTS.md`：目录边界、当前有效交互与禁止恢复项。
3. `DESIGN-SYSTEM.md`：颜色、字体、玻璃、按钮、动效和验收参数。
4. `docs/PROJECT-STATUS.md`：当前实现、最近验证和待办边界。
5. 新增页面时读 `docs/ARCHITECTURE.md`、`docs/COMPONENTS.md`。
6. 修改既有交互时读 `docs/LESSONS-LEARNED.md`、`docs/USER-REQUIREMENTS.md`；
   涉及顶栏标签再读 `docs/TOP-BAR-TABS.md`。
7. Plants 与 Service Ticket 的具体行为分别读对应页面 README。

历史计划放在 `docs/history/`，只用于理解背景，不能覆盖当前规范。`CHANGELOG.md`
保留逐日过程记录；当前有效规则以本索引指向的规范文件为准。

## 当前产品边界

| 路径 | 状态 | 数据与行为 |
|---|---|---|
| `/home` | 已完成设计预览 | Home Figma 场景、搜索、周期、刷新、快捷入口、标签与历史 |
| `/plants` | 已完成本地交互预览 | 46 条样例、筛选并集、列显隐、排序、收藏、滚动反馈 |
| `/plants/:id` | 有真实可刷新 URL | 详情内容为明确占位，不虚构设备控制 |
| `/service` | 已完成本地交互预览 | 工单卡片、状态与范围筛选、搜索 |
| `/service/new` | 已完成本地交互预览 | 新标签双栏编辑、Plant 搜索选择、本地发布 |
| `/service/:ticketId` | 已完成本地交互预览 | 详情、Properties、回复、原位编辑、本地附件预览 |
| Statistics 等其余侧栏路由 | Coming soon | 共享页头与原始空状态图标 |

所有业务写入仍是页面会话样例。没有接入登录、权限、上传、持久化、通知或真实
设备控制。除最近访问与书签的明确本地存储外，不能把预览行为描述成后端能力。

## 技术分层

```text
pages  →  layouts / components  →  foundations
```

- `src/foundations/`：颜色生成、语义 token、文字 style、主题、时间、动效、连续圆角、通用 DOM 工厂。
- `src/components/`：按钮、搜索、玻璃、头像、页头、菜单、浮层、滚动、时间标签和交互卡适配层。
- `src/layouts/`：侧栏、顶栏与共享工作区外壳。
- `src/pages/`：页面装配、业务状态和局部布局，不复制共享材质。
- `design/figma/`：不可手改的上游来源；`home-assets/`：运行时本地资产。
- `src/foundations/colors.css`、`type.css` 与 `src/pages/home/data/`：生成文件，不手改。

共享层不得反向依赖 Home 节点 ID。Home 的绝对坐标 scene 只服务首页，不能被新
页面复制为通用布局系统。

## 设计标准应用

| 类别 | 唯一入口 | 使用规则 |
|---|---|---|
| Figma 颜色 | `foundations/colors.css` + `tokens.css` | 优先使用 `--wd-label-*`、`--wd-bg-*`、`--wd-fill-*`、`--wd-accent-*`；未暴露语义时用 `--wd-figma-*` |
| 深浅主题 | `theme-controller.js` + 根节点 `data-theme` | 两套值独立维护；浅色中性色保持等 RGB，不用反色或猜色 |
| 字体 | `type.css` + `applyTypeStyle()` / `data-type-style` | 使用完整命名 style；不得按字号猜字重。原稿确有写死的未绑定值可以保留 |
| 玻璃 | `glass-material.js` / `.css` | 组件只声明尺寸、圆角和是否交互；材质参数与分层不进页面 |
| 普通按钮 | `createStandardButton()` + `button.css` | 标准 36px 胶囊或圆钮；页面只注册玻璃实例与生命周期 |
| 页头动作 | `createPageHeaderAction()` + `page-header.css` | 28px 轻量透明动作，不套 36px 玻璃按钮 |
| 搜索 | `createSearchField()` + `search-surface.css` | 默认 46px，数据页紧凑 36px；不另写图标、清除或玻璃 |
| 页头/面包屑 | `createPageHeader()` + `page-header.css` | Home 以外页面共用 40px 固定页头 |
| 卡片 | `cards.js` / `cards.css` | `panel`、`chart`、`status` 表示表面契约；讨论内容用 `.wd-discussion-card` |
| 浮层 | `popover.js` + `menu-popover.js` | 统一 Glass Surface、实时锚定、无标题菜单对称内距 |
| 滚动 | `createScrollFeedback()` | 列表默认弹性；固定编辑器显式 `elastic:false`；页面不写原生滚动条 |
| 时间 | `time.js` + `createTimeLabel()` | 格式化与 `<time datetime>` / `title` 共用；排序继续用原值 |
| 动效 | `motion.css` / `motion.js` | 组件不写局部时长；JS 动画读取 token；减少动态效果统一处理 |
| 圆角 | `geometry.js` / `.css` | 保留原半径，普通矩形用 `superellipse(1.2)`，圆形和胶囊保留 round |
| 头像 | `createAvatar()` + `avatar.css` | 尺寸由调用方提供；描边、阴影和缩写光学居中由共享层负责 |
| 图标 | `createIcon()` / `createMaskedIcon()` | 使用原始素材；中性遮罩统一生成不透明副本 |

强制顺序是：先找完全匹配的共享组件；没有时给现有组件增加可验证变体；只有
尺寸、数据契约或业务状态确有页面差异时，才允许页面局部实现。视觉相同但结构
不同的代码不应继续复制。

“统一”不等于把所有值改成 token。Figma 已绑定的颜色和文字必须走共享语义；
原始稿件确实写死的光学、尺寸和几何值可以保留。改动共享值前检查全部消费方。

## 设计来源与生成链

- Home 深色画板：`7hGGOqflIMGWTYQMm9tce0` / `14434:3261`。
- Home 浅色画板：同一文件 / `14704:3871`。
- 完整颜色和文字来源在 `design/figma/`。
- `npm run sync` 依次生成 Home 精简数据、双主题颜色、文字 styles 和不透明图标遮罩。
- 生成文件不手改；来源更新后重新生成并检查引用、主题和真实浏览器。

## 记录职责

| 文件 | 负责内容 |
|---|---|
| `AGENTS.md` | 新对话入口、有效项目规则、结构边界、关键交互 |
| `DESIGN-SYSTEM.md` | 全站视觉与交互参数、组件级验收标准 |
| `docs/PROJECT-MAP.md` | 项目总索引、标准选择、交接与清理快照 |
| `docs/PROJECT-STATUS.md` | 当前实现、最近验证、已知边界与待办 |
| `docs/ARCHITECTURE.md` | 分层、模块职责、扩展流程 |
| `docs/COMPONENTS.md` | 共享组件 API 与组合方式 |
| `docs/USER-REQUIREMENTS.md` | 用户明确要求与已推翻方案 |
| `docs/LESSONS-LEARNED.md` | 已发生问题、根因和防回归检查 |
| `docs/ROUTING.md` | 路径、深链接、刷新与回退 |
| `docs/DEPLOYMENT.md` | 构建、Cloudflare 发布与发布后检查 |
| `CHANGELOG.md` | 按日期保留的实现与验证历史 |

具体页面 README 是该页行为契约的一部分，修改页面行为、视觉规则或断言时必须
同步更新。

## 标准工作流

### 新增页面

1. 读本索引、`AGENTS.md`、`DESIGN-SYSTEM.md`、`PROJECT-STATUS.md`。
2. 核对 Figma 节点、浅深主题和原始素材。
3. 从 `templates/page.html` 建立语义外壳，复用 Plants 数据页布局。
4. 登记 `routes.js`、本地/生产 SPA 回退和路由回归。
5. 页面只写布局与业务装配；共享能力缺失时先扩展组件 API。
6. 验证默认、hover、focus、选中、禁用/加载、双主题、减少动态效果和响应式。

### 修改视觉

1. 先读 `design-preview/annotations.json`，排除旧批注。
2. 定位唯一共享入口，列出所有消费方。
3. 记录原半径、尺寸和主题值，避免用半径或滤镜补偿结构问题。
4. 更新共享规范；只有用户明确表达长期偏好时才升级为全局规则。

### 清理资产或代码

1. 检查静态引用和动态拼出的文件名。
2. 排除生成源、恢复快照和仍需追溯的设计数据。
3. 先建立可恢复快照，再移除；保留原因和结果记录。
4. 运行语法、资产、构建和受影响页面回归。

## 验收命令

在 `design-preview/` 下运行：

```powershell
npm run check
npm test
npm run build:site:public
npm run audit:assets
git diff --check
```

`npm run check` 同时验证 JavaScript 语法、必读文档是否存在，以及页面是否重新
引入本地 `text()` / 时间格式化、旧 `.wd-date-action` 兼容类或局部 transition。
视觉共享改动还需真实 Chrome 截图和计算样式检查；有固定基线时运行
`npm run test:visual`，不能为了消除失败直接覆盖基线。

## 2026-10-30 整理快照

- 整理前完整工作树快照：
  `E:\OneDrive\Design files sync\AI\Proj. WattDesk\Backups\WattDesk-current-working-tree-20261030-151240.zip`
- SHA-256：
  `70C230037CF608AAF0963BB2D01BE6AF8BA5741A9A703A47F5C812C7DA5DCFC0`
- 快照包含当时所有未提交源码、文档、测试、设计源和运行资产；只排除日志、
  `node_modules`、`dist` 等可再生产物。
- 整理后另清理 1393 个可再生产物文件（约 161.97 MB）：根探针截图、测试输出、
  旧 `output/` 和本地 `dist/`。固定基线、正式测试脚本、设计来源与运行源码保留。
- 本轮整理保持页面布局、视觉参数、路由和用户交互不变，重点合并重复实现，
  删除过期兼容类与停用 token，并建立本文作为单一切换入口。

最新验证结果由 `docs/PROJECT-STATUS.md` 维护；本文不重复堆积每次测试数字。
