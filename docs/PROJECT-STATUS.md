# 当前状态与新对话交接

 更新：2026-10-22。

先读 `AGENTS.md` → `DESIGN-SYSTEM.md` → 本文件。新增页面再读 `ARCHITECTURE.md`、`COMPONENTS.md`；核对既往反馈见 `USER-REQUIREMENTS.md`。用户最新明确要求优先。

## 当前实现

- 唯一业务页面是首页。运行目录 `design-preview`，`npm run dev`，默认 4173；入口 `home.html?glass=figma`。
- `2026-10-21` 首页模块拆分：`pages/home/index.js` 从 842 行降到 203 行，只做装配；新增 `routes.js`（路由与搜索索引唯一清单）、`layout.js`（响应式重排）、`period.js`（周期胶囊与刷新）、`search.js`（内联/全屏搜索）、`workspace.js`（标签、标签内路由与历史）、`recent-visits.js`（本地最近访问）。行为未变，9 个回归套件通过。
- 线上预览 <https://wattdesk-preview.carlwang.cn/>：Cloudflare Workers 从 GitHub `master` 构建，根目录 `/design-preview`，构建命令 `npm run build:site:public`，部署命令 `npx wrangler deploy --assets=./dist`；构建产物不入库。发布由维护者手动 push 触发，完整流程见 [发布与部署](./DEPLOYMENT.md)。
- `2026-10-21` 仓库收敛：354 个本地一次性文件（根 `tests/`、根 `output/`、补丁、177 个调试探针、部署日志）取消跟踪并写入 `.gitignore`；移除从未被部署且已过期的 `dist-public/`；`/home` 与 `/home.html` 的自指重定向死循环已删除；`/*.html`、`/src/*`、`/home-assets/*` 统一改为 `max-age=0, must-revalidate`，避免无 hash 资源在部署后与 HTML 版本错配。
- Figma 文件 `7hGGOqflIMGWTYQMm9tce0`；深色 **Home-主画板** `14434:3261`，浅色 **Home-主画板 - 浅色模式** `14704:3871`，所在 page `14405:17661`。
- 原生 HTML/CSS/ESM。双主题颜色变量、命名字体 style、原始图标和本地 SF Pro 已保存；语义 token 引用生成色表，已确认固定几何保持原稿。
- 侧栏与顶栏使用语义组件；内容仍使用首页专有场景适配。原始 509 节点用于溯源，生成场景保留 328 个，运行场景再排除已删除的 Period metadata 整枝后渲染 326 个。
- 顶部工作区标签默认只有一个 Home（不预置 Plants 占位），宽度在 58–180px 内自适应；可新增、关闭、横向滚动，并可用键盘切换；多 Home 标签统一显示 Home，各自保留路由、搜索、周期与滚动状态。侧栏导航在当前标签内切换内容，不新建标签；非 Home 页面统一显示共享的“图标 + Coming soon”占位，图标沿用该路由原始彩色/中性素材。
- 顶栏后退 / 前进已接入**当前标签内**的本地页面历史：切换路由时写入该标签，端点处使用真实 `disabled` 并阻止鼠标与键盘，新路由会截断前进分支；切换标签恢复该标签自己的历史位置，关闭标签时删除对应记录。它不等于浏览器 URL 历史，刷新页面、复制链接和跨会话恢复均未实现。
- 新增标签的最终槽位在节点插入前按“插入后”的标签数量算好；既有标签首帧直接采用新槽位，新标签只从 0 连续展开，Add 按钮随槽位移动。压缩状态下不再出现旧平均宽度的一帧闪跳。
- 非 Home 路由使用共享空状态 `components/empty-state.js` / `.css`：图标 64px、文字 18px / 510 灰色 Coming soon，水平居中，整组相对面板垂直中心上移 119px；彩色素材保留原色，中性素材使用不透明遮罩，进入时 4px 淡入。
- 首页玻璃表面统一使用 Figma 材质，深浅参数独立；表面数量随打开的 tab 变化，当前默认只有一个 Workspace tab。弃用的 Liquid 对比不再参与运行。新增标签动态挂载同一玻璃材质，关闭时移除。
- `2026-10-22` 浅色玻璃材质按 Figma 双层结构校准：中性底压到 `rgba(238,240,243,.74)`，内亮边 `.92/.62`；底部厚度保持 `14px`，由 `4px` 纯白台面改为从 `.78` 连续衰减的短缓坡，纯白占比降低且保留上下厚度。外轮廓按纵向渐变拆成上下 `.09`、左右 `.38`、`0.75px`，hover 小幅增强到 `.11/.42`。深色参数未改。`npm run check`、`verify-glass`、`verify-theme` 通过；浅色卡片、搜索框、圆钮实拍见 `design-preview/output/figma-light/probe/soft-78-card-bottom.png` / `soft-78-search.png`。
- `2026-10-22` 发布前收尾：浅色与深色玻璃厚度、纵向渐变描边及浮窗跟随滚动一并收口，文档同步 `AGENTS.md`、`DESIGN-SYSTEM.md`、`COMPONENTS.md`、`LESSONS-LEARNED.md`、`USER-REQUIREMENTS.md`、`TOP-BAR-TABS.md`。最终 `npm run check`（60 个 JS）、完整 `npm test`（10 个套件）与 `npm run build:site:public`（`dist`、181 files、1.27 MB）全部通过。
- `2026-10-22` 深色玻璃白光收敛：深色普通玻璃白内沿顶/底由 `.17/.14` 降为 `.145/.118`，内阴影高光由 `.10/.14` 降为 `.085/.12`；Glass Surface 白内沿顶/底由 `.18/.14` 降为 `.15/.118`。上下反光带长度、形态、深色外轮廓 `.95`（普通）与 `.72`（浮层）以及浅色全部参数未改，厚度仍可辨。发布前将 `verify-search` 的浅色断言改为最终纵向渐变描边（上下 `.08`、左右 `.10`），并明确全屏搜索是浮层外轮廓的搜索专用例外；`npm run check`、`npm test`（10 个套件）、`npm run build:site:public` 通过。深色卡片、菜单、日期浮层与圆钮实拍见 `design-preview/output/dark-lightglow/card.png`、`menu.png`、`date.png`、`disc-top.png`。
- 本地实现搜索、语义日期选择器、分类折叠、状态卡导航、预览 CSV、主题切换和刷新反馈；侧栏 `Teams` 默认收起（`Device tool` 默认展开），首次点击展开后可正常收起；搜索、语言、设置等预览菜单仍使用共享 Popover。日期选择器预设为 Today、Yesterday、Last 24 hours、Last 7 days、Last 30 days、This month、Custom range，使用 Start date / End date 与 Apply，旧 `Custom date range…` 入口已不存在。Sites online 与 Needs attention 点击后在当前标签跳转 Plants，不弹摘要浮窗。图表使用原始导出，首次可见有轻量载入。标签增删、内容淡变和关闭按钮颜色均有平滑过渡。
- `2026-10-22` 首页三列快捷入口行恢复实际跳转：Workspace 的 Plants、Service ticket、Statistics 分别进入各自路由；Following 的五个电站行暂时统一进入 Plants，等待电站详情路由，不新增虚假的站点页面。全部行复用共享 `enhanceControl()` / `openRoute()`，鼠标、Enter 和 Space 均可在当前标签内打开，不新增标签，下划线与 hover / focus 不变。单行聚焦回归见 `tests/verify-shortcuts.cjs`。
- 首页 `Recently visited` 使用浏览器 `localStorage`（`wattdesk.recent-visits.v1`）保存最近 8 条路由，刷新后仍在；连续重复路由不追加，首次进入至少保留当前 Home。它只是本地预览归档，不能称为云端同步或跨设备历史。列表行左侧固定使用原始中性时钟图标，路由彩色图标只出现在历史浮窗中。两条 `View all` 均是真实按钮，共享下划线与 hover / 键盘 focus 的主文字色（深色纯白、浅色主墨色），但点击目标不同：Following 在当前标签跳转 Plants，Recently visited 打开锚定侧栏历史图标的历史浮窗；都不切换或新增标签。
- 搜索使用共享 `search-surface.js`：侧栏快捷入口、首页内联搜索框和结果面板共用 `Ctrl/Cmd` + `K` 双键帽，统一 `Footnote/Regular`、SF Pro、`4px` 间距与主题次要文字色；首页内联键帽组右缘固定内缩 `20px`。全屏搜索框由 `createSearchField()` 生成，直接复用首页字段的 `46px / 23px` 胶囊、18px 放大镜、共享玻璃填充与模糊，只省略快捷键；放大镜使用 `masks/asset-35.svg` 不透明遮罩。两处可见默认文字同读 `search.js` 的 `SEARCH_FIELD_PLACEHOLDER`，不得再单独写全屏占位文案。首页内联结果浮窗复用日期选择器的玻璃表面，全屏搜索使用整页高斯模糊、同一字段和独立结果面板；空白点击与 Esc 均可关闭。两处搜索框均通过 `.wd-glass--no-scale` 禁止点击放大。底部 `↑ ↓ Navigate`、`Enter Open`、`Esc Close` 是可操作按钮：分别推进选中项、打开选中项、关闭当前搜索面板；鼠标点击后焦点保持在输入框。结果项固定 40px 高，标题与分类同行为 `Plants - Pages`，标题主色、分类次级色，中间 4px。清除按钮通过真实 `input` 事件让结果区回到 Quick links / Recent searches。查询为空时显示本地 `wattdesk.searchHistory.v1` 保存的 Recent searches（最多 8 条、可删除），它是历史搜索而非最近访问页面；输入后替换为本地索引结果。当前仍未接入后端搜索、真实路由或云端历史。
- 账户入口与通知按钮的旧上下文/通知浮层已按用户要求删除，等待重做；按钮、玻璃和 hover 状态保留。重做前点击不展开旧浮层，也不得从旧组件、历史文档或备份恢复。
- `2026-10-22` 浮层菜单统一：新增共享 `components/menu-popover.js` 与 `.wd-menu` 内胆，`History`、`Language`、`Appearance`、`WattDesk` 共用 20px 顶距、10px 侧/底距、36px 行高、14/14 medium、固定 20px 勾选槽和 10px 尾距。顶栏三个紧凑菜单统一 `200px / 30px`，历史浮窗保留 `280px / 30px`；Glass Surface 材质与深浅参数未改。语言列表加入 `简体中文`、`Deutsch`、`Čeština` 占位，只做本地勾选视觉，不接本地化或持久化。`npm run check`、`verify-floating-surfaces` 与最终完整 `npm test`（10 个套件）通过。
- `2026-10-22` 连续圆角定稿：共享曲线由 `superellipse(1.05)` 调整为用户在实际 30px `Energy generated` 卡片上确认的 `superellipse(1.2)`。卡片仍为 30px、右侧大底 10px，正圆/胶囊保持原形，尺寸、间距、描边、玻璃和投影均未改；30px 对角轮廓比普通圆角内收约 0.97px，肩部更紧但仍读作原半径。该值是视觉选择，不是 Figma 60% 的数值换算。`verify-foundations` 通过（`contour.shared=superellipse(1.2)`、动态节点同步、圆/胶囊不变），并已生成深浅主题卡片与首页截图。共享入口继续自动分类现有及未来节点，包括新增 DOM 和尺寸变化。
- `2026-10-22` 浮层跟随滚动：共享 `components/popover.js` 由“打开时测一次坐标”改为实时定位，`scroll` 采用 document 捕获阶段监听嵌套滚动区，`resize` / `visualViewport` 变化用 `requestAnimationFrame` 合并重算；以 `offsetWidth` / `offsetHeight` 避开开合缩放的翻转漂移。触发元素一半以上滚出视口时关闭，不再夹在视口边缘。日期选择、`Chart options`、顶栏菜单、历史浮窗自动继承；内联搜索结果由滚动关闭改为跟随定位，工作区标签 tooltip 补齐同一套捕获滚动 / `visualViewport` 重算并在标签离开视口时收起；全屏搜索是模态、不跟随。`verify-floating-surfaces` 新增两类真实滚动断言并清除调试输出，`npm run check` 通过。规则已同步 `DESIGN-SYSTEM.md`、`COMPONENTS.md`、`USER-REQUIREMENTS.md`。 同一规则也已写入根 `AGENTS.md`，后续新浮窗默认复用，避免只在组件文档中可见。
- 统计周期胶囊的宽度由文字决定，预设与自定义范围切换后自动调整，不裁切；刷新按钮右缘与图表卡片右缘对齐，胶囊向左增长并保持 10px 间距。浅色状态卡箭头使用 `.55` 黑色透明度，首页大标题为 semibold 590；`Newly commissioned sites` 与 `New devices added` 的七根柱使用原稿 `15.24px` 宽，深浅主题及目标视口均不越出图区。滚动到底的底部留白以最后一张图表卡片为基准，具体数值由单独的布局文档负责，本项目状态与规范不再另设固定值。
- 组件级共享动效契约已落在 `src/foundations/motion.css`，由 `shared.css` 自动加载。原生控件、常见 ARIA role、共享控件/玻璃/tab/快捷入口/折叠箭头以及后续挂载的 DOM 自动继承 hover 进入 `240ms` / 离开 `360ms` 与共享缓动；组件只声明视觉状态。WAAPI 统一读取 `motionDuration()` / `motionEasing()`。
- `2026-10-21` hover 颜色节奏调整为“弹性灵动”并整体拉长：进入 `240ms`（`cubic-bezier(.16,1,.3,1)`，快起缓收），离开 `360ms`（`cubic-bezier(.3,0,.2,1)`，柔和退场）。宿主在 hover / 键盘 focus 时切换共享变量，背景、文字与图标叶节点继承同一节奏；玻璃缩放仍为 hover `300ms`、按下 `110ms`、回落 `420ms`。Workspace 标签关闭沿用 `260ms`（`--wd-motion-tab-close`），浮层与搜索退出改用离开缓动，避免复用进入曲线导致退出前段过快。
- `2026-10-21` 浮层圆角规则：新增 `--wd-radius-compact`（12px），tooltip 与图表数据浮签由 10px / 8px 统一为 12px；通用 popover / 图表菜单保持 18px，标准浮层菜单与大面板使用 30px（2026-10-22 将顶栏紧凑菜单一并归入 30px）；`addSurface()` 半径同步，浮层材质层继承宿主轮廓。相关测试更新并通过。
- `2026-10-21` 规则归档审计：日期输入固定格式与整框错误态、错误行位置与生长动画、月份标题对齐与切月固定、Apply 实心蓝、浮层退出同步淡出、Glass Surface 默认材质与三档圆角均已写入 `USER-REQUIREMENTS.md`、`DESIGN-SYSTEM.md` 和 `COMPONENTS.md`。另行补记“侧栏导航 / 标签切换离开当前页面必须关闭活动浮层”的共享生命周期要求；该项目前是规范约束，尚不等同于已完成真实路由联动验收。
- `2026-10-21` 标准按钮收编：`Cancel` / `Apply` 的胶囊样式从日期选择器移入共享 `button.css`，新增 `.wd-button--pill` + `.wd-button--neutral` / `.wd-button--primary`。中性按钮复用普通玻璃与 `Labels/Secondary → Primary` 状态；主按钮保留实心 `Accents/Blue`，关闭模糊和白色反射场，hover 仅轻微提亮。日期选择器保留 `.wd-date-action` 作为兼容别名，不再承载材质。深浅主题实拍验证 36px 胶囊、13px / 510 文字、中性玻璃 6px 模糊与主按钮实心蓝，`Cancel` / `Apply` 指针光弧均可见；`npm run check` 与 `verify-glass` 通过。`verify-home` 的侧栏导航 hover 时长断言仍为既存 160ms / 240ms 基线差异，与本次按钮改动无关。

- `2026-10-21` 浮窗材质默认化收尾：共享 `popover.js` 现在接收页面同一份 `glass`，自动为普通 `.popover` 加 `.wd-glass--surface wd-glass-popup` 并在关闭时卸载；工具站标签 tooltip、toast、图表 `Chart options`、顶栏 `Language` / `WattDesk` / `Appearance` 及图表数据浮签已统一覆盖。日期、历史、搜索自带材质，控制器检测到后跳过，保持单层。tooltip / toast / 数据浮签为 `interactive:false`；动态文案改写入内部 `span`，修复 `textContent` 把材质子层删除的问题。新增 `tests/verify-floating-surfaces.cjs` 并纳入回归，`npm run check` 与完整 `npm test`（含新增 `verify-floating-surfaces`）全部通过，基础几何基线同步为 38 个表面。本站仍仅为本地设计预览，浮层未接真实业务菜单或后端。
- 玻璃 hover/press 反馈由共享材质自动继承：普通可交互玻璃 `1.025 / 1.065`，正圆 `1.07 / 1.18`，按下 `110ms` 起步、`420ms` 回落，锚点为物理中心；`.wd-glass-chrome` 与 `.wd-glass--surface` 复合容器保持静止，内部独立控件正常响应。纯展示表面通过 `interactive:false` 获得 `.wd-glass--static`，保留材质和指针光晕但不缩放；首页 `Connected devices` / `Self-consumption` 已按此标记，`Sites online` / `Needs attention` 仍可点击缩放。
- 日期选择器选择预设只更新草稿，点击 `Apply` 后才提交主周期标签；旧 `Custom date range…` 入口不再存在。

- 2026-10-21：全屏搜索字段改为复用首页字段结构与材质，只隐藏 `Ctrl K`；消除两处玻璃参数和图标素材分叉。放大镜改用 `asset-35.svg` 的不透明状态遮罩，清除按钮补发 `input` 事件以刷新结果。`verify-search` 已覆盖 `816×46 / 23px`、共享填充与模糊、无快捷键、清除后回到 Quick links；深浅主题实拍一致。
- 2026-10-21：修复共享玻璃定位覆盖页面布局。`.wd-glass{position:relative}` 曾压过 `.node{position:absolute}` 与顶栏绝对定位，导致状态卡逐行下坠、历史按钮跑到搜索左侧。现改为 `:where(.wd-glass)` 零优先级默认值；`verify-glass` 增加首页节点与侧栏按钮定位、状态卡同行检查，1452×1252 实拍已恢复。
- 2026-10-21：共享 hover 节奏整体拉长到进入 `240ms` / 离开 `360ms`，侧栏 `Cell balance`、`Module balance`、`Device track`、`Add tab` 与各类 tab、按钮统一变慢。修复 `motion.css` 中把伪元素写进 `:where()` 导致整条规则被丢弃的问题，图标 `::before` / `::after` 遮罩现在与文字、`<img>` 同步渐入渐出，不再瞬间跳变或出现黑灰中间态；移除 `Add tab` 遗留的 `filter: brightness(1.3)` 局部提亮。减少动态效果的伪元素规则同样修正。`verify-motion` 覆盖图标遮罩节奏并通过；`verify-components` 通过；`verify-home` 的浅色 `rgba(64,64,71,.6)` 断言仍为既存历史值差异，未改业务或断言。
- 2026-10-21：搜索提示按钮与结果行完成真实交互。`optionRows()` 从空的结果容器改为查询实际承载行的 `body`，恢复方向键、hover、Navigate 和 Open 的选中链路；提示按钮改用真实 `<button>`，点击后仍保持输入框焦点。结果标题与分类改为单行 `Plants - Pages`，保留 40px 行高、主/次级文字色和 4px 间隔；Quick links 仍不重复分类。`verify-search` 覆盖按钮可操作性、首位选中、Navigate 推进、Open 收面板、全屏 Close、行高与单行布局；`npm run check` 通过，深浅主题实拍一致。
- 2026-10-20：侧栏前进/后退/历史按钮按设计稿固定 `36px` 圆钮与 `8px` 间距，改用右缘反算定位，前进按钮右缘与 Quick search 对齐；此前固定 `left` 在 `248px` 侧栏下超出 `12px`。`verify-responsive` 在 `>760px` 同时检查右缘、`36px` 尺寸和两段 `8px` 间距。
- 2026-10-20：首页右侧内容改为真实响应式重排，不再对区域整体 `scale()`。内容画布最大 `1000px`、最小 `240px`，在右侧工作区内依据实际面板宽度居中；状态卡和业务图表卡按 `4 → 2 → 1` 列重排，两张能源卡 `2 → 1`，快捷入口 `3 → 2 → 1`，换列后由页面纵向增高承接，不产生横向滚动。侧栏默认收至 `248px`，`≤1100px` 为 `216px`，`≤760px` 变为 `76px` 图标轨；内容区与图表内部控件随可用宽度重新锚定。第二张状态卡旧 `250.7px` 玻璃底板会同步到卡片 `100% × 100%`，修复右上箭头和底板越界。新增 `tests/verify-responsive.cjs` 覆盖 1920–420px 共 12 个宽度、居中、列数、无横向滚动、箭头/菜单边界、刷新与周期右缘对齐、图标轨及悬停态箭头，已接入 `npm test`。
- 2026-10-20：首页右侧内容接入共享局部骨架。前两张状态卡与六张图表卡在真实等待超过 `140ms` 后显示结构占位，区域单次扫光并淡出到内容；侧栏、顶栏和工作区标签不等待字体，快速加载不闪骨架。骨架不改变宿主尺寸/圆角/玻璃，结束或销毁时释放 `aria-busy`/`inert`；减少动态效果保留静态骨架但不扫光。1920×1080、1545×1252、快速与慢速延迟及减少动效路径已用真实浏览器验证，卡片边界一致。本次 `npm run check`、`verify-components`、`verify-home`、`verify-theme` 通过；`verify-foundations` 与 `verify-motion` 仍受既存基线/局部 tab transition 影响，未作为本次通过项。
- 2026-10-20：玻璃缩放补充“可交互 / 纯展示”语义。`createGlassMaterial()` 的表面新增 `interactive`（默认 `true`），传 `false` 时共享层加 `.wd-glass--static`，动效只对非静态宿主应用 hover / 按下矩阵。`Connected devices`、`Self-consumption` 保留材质与指针光晕，但 hover / 按下 `scale` 恒为 `1`、布局盒不变；`Sites online`、`Needs attention` 仍为 `1.031 / 1.079`（深浅主题）。`verify-motion` 新增展示卡不缩放断言并通过；`check`、`verify-glass`、`verify-components`、`verify-theme` 通过。`verify-home` 的历史列表断言仍按旧的 3 条记录，当前测试流程会先产生 5 条，属既存测试不一致，未改业务或断言。

- 2026-10-21：本地预览新增**页面批注模式**，只对 `?annotate=1` 生效（`design-preview/dev/annotate.js` / `.css`，由 `server.js` 按参数注入，普通页面、`test:visual` 基线截图与 `build:site` 产物都不含它）。点击元素可写意见，`Alt+↑/↓` 切换层级，保存后留编号图钉；批注写入 `design-preview/annotations.json`（按页面分组，已 gitignore）并同步 `localStorage`，也可复制成纯文本。它是给设计反馈用的本地工具，不接后端、不属于业务页面能力；深浅主题均已实拍检查。

## 尚未实现

没有其他页面的真实内容、登录/权限后端、账户服务、设备命令、实时统计或生产数据导出。Plant、Service ticket、Statistics 与 Device tool 等标签是 Coming soon 占位，不包含业务页面；状态卡虽跳转 Plants，但 Plants 筛选尚未实现；日期选择不会向服务端查询数据。不得把演示行为写成已完成的业务能力。

绝对坐标 scene 是首页过渡适配，不能作为后续页面的通用布局。未来页面采用语义布局，复用相同基础与组件。

## 验证记录口径

- 本文所有带日期的检查结果均为当时快照，不代表当前状态；最新一次真实运行单独记录，不能用旧通过或旧失败互相覆盖。
- 未实际运行时明确标注“未运行”，不得把静态代码或文档核对写成测试、截图验证通过。

## 最近一次实际运行（2026-10-21）

- `npm run check` 通过：58 个 JavaScript 文件语法有效。
- `npm test` 通过；`verify-home` 的 Add 连续位移断言前两次间歇失败，重跑及整套通过，未改该断言，后续继续观察帧时序敏感性。
- `npm run test:visual` 未通过：`refactor-before` 是整理前旧界面（含旧 Plants 标签等），当前差异 380912 px / max 245，说明基线已过期；未更新基线，避免用旧图掩盖当前变化。
- `type.css` 已由 `npm run sync:type` 重新生成，强调斜体权重归一化为 590，旧 `590.7999877929688` 不再出现。

## 已知待校准

- 已解决：浅色玻璃外圈黑线已按最终纵向渐变收敛为普通上下 `.09`、左右 `.38`（hover `.11/.42`），浮层 `.16/.20`，全屏搜索结果面板使用搜索专用 `.08/.10`；hover 不再弱于默认，深色保持不变。`.12/.16`、`.14/.18` 与更早的 `.23/.29` 均为历史中间值，不再作为当前规则。
- 页面框待确认：现行首页为响应式最大 `1000px`、左右 `48px` 阴影 gutter、底部 `32px`；这是现状，不是已否决项。被否决的是旧“固定 1000px 画布 + 区域整体缩放”，不是响应式最大宽度本身。新页面是否沿用、滚动容器归属、内容宽度与 section 间距仍需确认，`docs/PAGE-LAYOUT.md` 尚未创建。

## 待确认 / 待实现

- 页面大标题：规则已定为页面级 590，通用 `Large Title/Emphasized` 保持 700；共享 `.wd-page-title` 尚未实现，待新页面接入时落地。
- 菜单字体：`Chart options` / `Language` / `Appearance` / `WattDesk` 是手写预览 DOM，没有对应 Figma 菜单节点；当前保留 13px，待节点或产品规则。
- `Subheadline/Emphaized Italic` 是 Figma 源数据拼写问题；当前无代码绑定该拼写，待改源后同步或明确记为命名债务。

## 维护入口

- 基础 `design-preview/src/foundations/`；组件 `src/components/`；外壳 `src/layouts/`；首页 `src/pages/home/`。
- 原始来源 `design-preview/design/figma/`；实际本地资产 `home-assets/`。
- 检查 `npm run check`、`npm test`、`npm run test:visual`、`npm run audit:assets`。
- 发布 `npm run build:site:public`（产物 `dist/`，仅自检，不入库）；线上由 Cloudflare 从 `master` 构建，配置与验证见 [发布与部署](./DEPLOYMENT.md)。`dist/`、`dist-public/` 都不入库。
- 2026-10-19 归档时的验证记录（属于当时状态，不替代后续验收）：`npm run check` 通过；`npm test` 及 `verify-glass` / `verify-home` / `verify-components` / `verify-motion` / `verify-theme` / `verify-foundations` 专项通过。具体文件数与断言细节只作为历史快照，不作为永久规则。
- 2026-10-19 复验：`verify-theme` 的深色往返截图差异为 `maxChannelDelta 1 / 86 pixels`，主题、持久化、快速切换与减少动态效果检查通过；`verify-foundations` 的真实轮廓、36 个固定几何、动态挂载及回退检查通过。
- 2026-10-19 样式复验（历史）：`verify-glass` 按当前 tab 数量核对玻璃表面，材质分层、贴合、统一填充/阴影和双主题 hover 通过；`verify-home` 覆盖周期文字不裁切、刷新右缘与下方图表卡片对齐及 10px 间距，预设与自定义周期均通过。底部留白数值不在本轮规则归档中重述。
- 2026-10-19 光学与按压反馈最终定稿：局部 hover 光学、普通/圆钮缩放、物理中心锚点、复合容器静止和快速点击可辨均通过；早期中间参数不再作为规范，最终值见 `DESIGN-SYSTEM.md`。
- 2026-10-19 既有回归（历史）：顶部工作区标签、日期选择器预设/起止日期/`Apply`、空状态、主题往返、固定几何与动态挂载检查通过；当时统计的文件数与断言细节不作为永久规则。
- 2026-10-19：Period statistics 底部 `As of` 文案节点已从运行场景永久移除，标签快照不再保存该文本；页面底部留白由单独的布局文档负责，本文件不设固定值。
- 2026-10-19：共享头像内描边为 `1px` 且与内部填充同色；深色保留中心扩散投影，浅色隐藏头像投影；头像尺寸与圆形轮廓不变。
- 2026-10-19：账户双箭头默认 Labels/Secondary，账户 hover / focus 时与头像、姓名一起切到 Labels/Primary；账户名称默认 Labels/Primary。
- 2026-10-19：主题切换按钮在鼠标点击后不保留悬停主色；普通 DOM 焦点回 Labels/Secondary，键盘 `:focus-visible` 保持 Labels/Primary。
- 2026-10-20：修复压缩状态下 Add 新标签的宽度闪跳。根因是节点先插入、槽位后更新，既有标签随后又播放 CSS 宽度过渡；现改为先算插入后的槽位、首次采样前固定零宽起点，并用 `is-entering` / `is-resizing` 隔离宽度动画。入场动画结束后按 kebab-case 清除零宽内联样式，避免标签被钉在 58px；减少动态效果时同步清除 `is-resizing`。1116px、1497px、1545px 与 2560px @1.5 DPR 逐帧验证既有标签首帧即为最终槽位、新标签从 0 展开、结束后无宽度内联残留。`npm run check`、`verify-home` 与标签专项探针通过；刷新页面时曾因 `skeletons` 初始化顺序报 TDZ 错，已提前声明并在函数声明后调用挂载。
- 2026-10-20：压缩状态顶部标签列表已占满可用宽度时，Add 按钮固定贴着列表右端；标签未占满时仍随内容增长自然右移。实现为占满时让标签列表填满剩余宽度（`is-slot-filled`），不再随新标签从 0 展开而收缩。1421px、1920px、2560px @1.5 DPR 及 1116px 滚动压缩逐帧验证加号首帧到结束位置不变；深浅主题通过。`npm run check` 与 `verify-home` 通过。
- 顶栏标签完整功能、接入步骤与回归用例见 [TOP-BAR-TABS.md](./TOP-BAR-TABS.md)；开工前经验见 [LESSONS-LEARNED.md](./LESSONS-LEARNED.md)。
- 2026-10-20 最近访问与搜索修正：`Recently visited` 汇总行的图标恢复为原始中性时钟（`asset-52.svg`）遮罩，不再随访问页面更换彩色图标；历史浮窗内的行仍按路由显示对应图标。两条 `View all` 统一使用共享 `.shortcut-link` 下划线。最近访问改为 `localStorage` 持久归档（键 `wattdesk.recent-visits.v1`），最多 8 条、连续重复路由不追加。全量搜索浮层原先引用不存在的 `search.svg` 导致 404，已按图标注册表改为原始 `asset-4.svg`。顶栏标签的 `is-entering` / `is-resizing` 过渡迁入 `motion.css`，组件 CSS 不再声明局部时长；`npm run check` 与完整 `npm test`（含 `verify-home`、`verify-motion`）通过。以上历史仅为本地预览，不是云端记录。
- 2026-10-22 历史浮窗图标复用：`history-popover.js` 在打开时直接克隆侧栏同路由的 `.target-icon-art`，不再维护第二份色调表，`Plants` 橙色、`Service ticket` 蓝色与 `Cell balance` 等中性灰因此天然一致；`menu-popover.js` 支持传入现成图标节点，并去掉按文件名强行转 mono 的分支，保留彩色素材原色；`popover.css` 让菜单行的 `target-icon-neutral` 在 hover / focus 时与文字同步亮起。`prepareIconMasks()` 由 `control-states.js` 抽为共享导出且跳过已是内联 data 的 mask，历史浮窗在挂载前执行，得到与首屏侧栏相同的不透明遮罩。`verify-home` 新增历史行与侧栏逐路由对比（色调类、图片来源、mask、默认次级色与 hover 主色）。浅色与深色真实浏览器均无错误；`npm run check`、`verify-home`、`build:site:public` 通过，最终完整 `npm test`（10 个套件）通过。
- 2026-10-20 日期选择器第四轮修正：报错行移到输入区与第二条分割线之间，面板以 433→460→433 的高度动画生长/收回，报错文字同步渐入渐出，连续同文案报错不再打断动画；错误文字的纵向位置由两条分割线夹住。月份标题改为 14px/510 并与星期 “M” 字形左对齐，切月保持按钮与星期行固定、日期网格同向滑动。关闭浮层时内容、玻璃 fill 与光学层同步淡出，玻璃宿主保持不透明以避免无模糊中间态。`verify-home` 增加了报错位置、面板/报错行高度、标题对齐与字号、退出同步淡出断言。
- 2026-10-21 浮层玻璃浅色增强：嵌套在弹窗里的输入框、Cancel/Apply、月份圆钮此前光斑全部为 0，原因是内层 `pointerenter/pointermove` 冒泡到外层浮层后，外层把 `data-glass-pointer` 抢走。共享 `glass-material.js` 现在按 `event.target.closest('.wd-glass')` 只让最内层响应，四个控件均恢复可见光斑且外层不被标记。浅色 surface 从 `18px/30%` 调整为 `9px/44% + saturate 1.45`，边线 `.27/.33`，指针弧改为黑色 `.46`、内部白光 `.80`；浅色普通玻璃同步 `tint .70`、白内沿 `1`、内亮边 `.86/.54`、指针弧黑 `.42`。深色参数保持不变。`verify-glass` 新增嵌套归属和浅色参数断言，`npm run check` 与玻璃测试通过。
- 2026-10-21 浮层玻璃收尾：共享 **Glass Surface**（`.wd-glass--surface` + `.wd-glass-popup`）此前 22/24px 模糊叠加 44%/70% 底色，深浅主题都读成实心卡片；现统一 `18px`、`30%` 底色（深色中性、浅色浅灰），并移除浅色弹窗单独覆盖的 `52%/30px`，背后页面重新可辨。surface 的指针白光原为 `.045/.15`、半径 `210/170px`，实测等同不可见；调为深色 `.085/.62`、浅色 `.42/.88`，边缘半径收到 `120px`，只亮指针附近一段。`verify-glass` 新增浮层指针光斑、边缘亮度、局部半径与跟随断言；深浅主题实拍确认不会整圈发白，正文保持可读。
- 2026-10-21 浅色玻璃整圈黑线收敛：用户在搜索框 `Ctrl K` 与日期浮层上指出浅色玻璃周围有一圈显眼黑细线。来源是 `.wd-glass-fill` 的两侧 `±1.25px 0 0 -.75px` 与整圈 `0 0 0 .5px/.6px` 外轮廓，不是 border 或 focus ring。普通玻璃由 `.23/.29` 降为 `.12/.16`、hover `.14/.18`；**Glass Surface** 由 `.27/.33` 降为 `.16/.20`。深色普通 `.95`、浮层 `.72` 与全部材质、投影、光斑未改。浏览器断言覆盖普通、hover、日期浮层与深色双分支。
- 2026-10-22 浅色全屏搜索可读性与投影收敛：浅色遮罩不再沿用密集活动遮罩，改用搜索专用 `--wd-search-veil: rgba(0,0,0,.10)` 与 `--wd-search-veil-blur-base: 16px`，让背后页面保留轮廓；结果卡片改用 `.08/.10` 外沿、`.055 / 16px / 34px` 主投影与 `.02 / 2px / 4px -1px` 接触阴影，移除重黑底。深色遮罩仍 `29% + 28px`、投影与普通玻璃不变。`verify-search` 新增浅色断言并在其后恢复深色用例；`verify-search`、`verify-motion`、`verify-components`、`npm run check` 通过，深浅实拍见 `tests/output/search-light-refine.png` / `search-dark-refine.png`。
- 2026-10-22 全屏搜索退场提速与背景缓释：保留已确认的 `980ms` 入场，只调整退出。新增 `--wd-motion-search-out-stagger: 40ms`，避免复用进场 `90ms`；结果面 `0ms`、搜索框 `40ms` 错落，玻璃各 `180ms` 退出。背景遮罩延后 `70ms`、在 `490ms` 内化开，总退场约 `560ms`；`36%` 前保持满模糊，之后按 `75% / 46% / 18%` 的模糊与底色比例分段缓释，解决两段插值导致后段“一下没了”的问题。弹窗根节点继续保持无动画，模糊与底色同层同帧归零。`verify-search` 断言为 `180 / 40 / 70 / 490ms`，并检查内容退完后仍有模糊、尾段继续下降且末帧前未提前卸载；进场时序另行锁定为 `90 / 980ms`。
- 2026-10-21 全屏搜索退场：搜索框与结果卡片按入场反向向下位移，结果面板 `0ms`、搜索框 `90ms` 错落离开；背景遮罩延后 `110ms`、以 `--wd-motion-search-veil-out: 640ms` 在前 `42%` 保持满模糊，等两块玻璃完全离开后再收。遮罩用 `@property` 注册的 blur 长度与 `background-color` 在同一 keyframe 同步降到 0，尾帧已透明才卸载，不再出现“模糊保持到最后、然后整层瞬间消失”的硬切；弹窗根节点不做任何 `opacity` 动画，否则 `backdrop-filter` 会在第一帧失效。全屏搜索节点改为监听遮罩退场动画结束后卸载。`verify-search` 更新为核验 `0 / 90 / 110ms` 起始顺序、`640ms` 长尾、根节点无动画、内容退完后模糊仍大于 0 且随后 blur 与底色单调下降；深浅主题与减少动态效果实拍确认。`verify-search`、`verify-motion`、`verify-components`、`npm run check` 通过。
- 2026-10-20 日期选择器输入与 `Apply` 修正：输入框改为固定格式分段编辑，`/`、空格、`:` 由控件绘制且不可输入；新增整框错误态（红描边 + 红图标 + 输入区下方说明），并修掉“错误态被分段 `focus` 立刻清除”的旧缺陷，使 Apply 提交非法日期时红框能真正留在界面上。`Apply` 从被玻璃反射洗白的浅蓝改为设计稿的实心 `Accents/Blue`。`verify-home` 新增分隔符位置、整框红环、错误保持/改正清除与 Apply 饱和度断言，与本轮 `check`、`verify-glass`、`verify-theme`、`verify-foundations`、`verify-components`、`verify-responsive` 一并通过；`verify-motion` 仍因并行的顶栏标签工作区在 `workspace-tabs.css` 写本地 `transition-duration` 而失败，不属本轮范围。
- 2026-10-20 搜索控件收尾：侧栏、首页内联和结果区共用 `createShortcutKeycaps()`；实测三处键帽均为 SF Pro `13px / 400`、主题次要色及 `--wd-control-muted` 背景，两枚键帽间距 `4px`，内联组右缘固定距搜索框右缘 `20px`。底部操作提示为英文 `Navigate / Open / Close`，方向导航使用一枚合并的 `↑ ↓` 键帽；空结果与提示保持 `Footnote/Regular`。全屏搜索框为固定 `680×56`、`28px` 圆角胶囊，不显示快捷键；内联与全屏搜索框按下时矩阵恒为 `1`，不放大。全屏结果面板独立位于框下，Esc 与空白点击均关闭。新增 `tests/verify-search.cjs` 并纳入 `npm test`，其中内联与全屏搜索框都有按下不缩放断言；`npm run check`、`verify-search`、`verify-components`、`verify-theme` 通过。`verify-home`、`verify-glass`、`verify-motion` 仍会因既存的指针命中/遮挡断言失败，与搜索样式无关，未修改这些断言。
- 来源更新后运行 `npm run sync`，不会自动访问或改写 Figma。

整理详情及验证见 [CLEANUP.md](./CLEANUP.md)。每次完成新需求后同步本文件，不能只依赖聊天记录。
