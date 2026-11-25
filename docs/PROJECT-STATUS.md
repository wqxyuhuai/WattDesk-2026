# 当前状态与新对话交接

更新：2026-11-25。

## 2026-11-25 初始化页面独立域名发布

- 独立域名新增两个初始化入口：`https://inverter.carlwang.cn/setup/20kw` 与
  `https://inverter.carlwang.cn/setup/50kw`；Inverter settings 继续使用
  `https://inverter.carlwang.cn/settings`，根 `/` 仍 `302` 到设置页。
- `wattdesk-inverter-preview` Worker 使用精确白名单：只放行 `/settings`、
  `/setup/20kw`、`/setup/50kw`、`/src/*`、`/home-assets/*` 与独立
  `robots.txt`。`/setup`、`/setup/30kw`、`/home`、`/plants` 和旧
  `/inverter` 备用入口继续返回 404。
- 本次通过 Cloudflare API 部署，Worker tag 为
  `b29e6d67633143ac9b231f0180d20758`。真实浏览器验证两个初始化页均为五步流程；
  20 kW 显示 1 个电池输入与 `battery-20kw-lcd.png`，50 kW 显示 2 个电池输入与
  `battery-50kw-no-screen.png`；两页首次打开均为浅色，主题按钮可用，关闭后进入
  `/settings`。
- 静态检查 `npm run check`、构建配置断言、Worker dry-run、初始化专项和
  `git diff --check` 均通过；线上入口与 404 隔离已实际验证。

## 2026-11-25 Fixed-title separator parity

- 初始化与 Inverter settings 的固定标题线改用 `border-top:1px solid var(--wd-separator-nonopaque)`，与卡片行之间 `.isw-row + .isw-row::after` 的绘制方式一致。
- 不再使用 `height:1px + background` 画这条线；两者在 125% 等非整数 DPR 下会落到不同的设备像素栅格，标题线看起来会更粗。
- 初始化专项同时断言标题线与行分隔线的 computed width、color 完全一致。

## 2026-11-25 日终规则归档

- **归档依据**：当前可访问的对话、工作树 `git status` / `git diff`、运行代码、专项测试和现有规则文档。未访问到的并行对话不补写、不推断；工作树中已有的并行实现按代码、diff、测试和已落盘文档作为证据。
- **全局新增 / 修改**：共享滚动改为 native-first 的 passive viewport wheel + `overscroll-behavior:contain`；圆角面板内的视口、轨道安全区和内容尾距分别管理，避免双倍底部空带；Adaptive Select 深色 hover / active 状态统一；圆形对勾使用单一 negative-space 路径；确认弹窗未明确结束时通过 `onCancel` 回滚；蓝 / 红实底按钮高光按深浅主题分流。
- **IPS 滚动最终规则**：记录弹窗视口铺到 Dialog 底边，轨道与内容各自消费一次 `22px` inset；初始态无卡片下空带，滚到底最后两张卡完整可见，轨道不越出圆角，窄屏标题不制造横向滚动。
- **共享滚动最终规则**：主滚动视口的 wheel 永远 passive，普通滚动和边界都不得 `preventDefault()`；视觉轨道自身可消费 wheel。全局默认仍为 `wheelDeadZone:4 / wheelPullRatio:.035`，但 Inverter settings 正文和导航固定为 `1.5 / .08`，第一格滚轮即有约 `3–4px` 反馈。
- **共享按钮最终规则**：深色 primary / `danger-solid` 默认使用 rim `0.38 / 0.24`、inner `0.21 / 0.11`、optical `0.15 / 0.075`，hover / focus 再增强光场和内侧边缘；浅色参数保持原值，不允许页面级覆盖。
- **组件级新增**：`settings-page-transition.js`、`settings-mode-motion.js`、`mppt-group-editor.js`、`hover-panel.js`、`schedule-editor.js`、`battery-editor.js`、`grid-profile-editor.js` 成为设置与初始化共用的唯一业务 / 交互入口；`ips-check.js` 承载意大利 CEI 0-21 条件页与八项结果记录。
- **Initialization 最终规则**：两个机型的 MPPT 都是 4 路，仅电池路径不同；无 Review 页；最后设置页直接 Apply；完成页自动或手动关闭；BMS Communication / Protocol、Permissions、模式 wire value、计划与 MPPT 阻断规则由设置页同一契约约束；接线图使用透明 PNG 并复用 `.isw-panel`。
- **明确废弃**：不再把 initialization 写成有 Review；不再使用白色私有插画卡面；不再把初始化计划排序、校验、电池字段或 Grid profile 解释留在页面私有分支；不再把 14px 完整圆形 check 当 CSS mask；不再为非 passive 主滚动做兼容；不再使用深色按钮 rim `.20 / .15` + 透明 inner / optical 的“完全无发光”中间态，也不再使用未限主题的高亮白团；不得把全局 `*.035` 回弹阻尼重新应用到 Inverter settings。
- **一次性范围**：具体截图中的局部像素位移、单次刷新验证记录和中间色值不回填为全站规则；只保留最终确认的稳定尺寸、状态、组件入口与禁止项。
- **仍待确认**：Battery Protocol 生产候选值仍只有预览 `Wattsonic`；Forecast Mode 未实现；真实后端保存、认证、权限、设备写入、`Device_Init_Flag`、IPS 固件命令和 `Output_Capability_Mode` 枚举仍待生产契约。
- **归档检查**：最终归档后重新运行 `npm run check` 与 `git diff --check`；本轮仅整理规则文件，不修改运行代码、页面 UI、资源或测试。未运行全量 `npm test`，因为项目规则要求只在用户明确要求完整回归时执行。

## 2026-11-25 原生优先滚动

- 共享 `createScrollFeedback()` 已改为 native-first：实际 viewport 的 wheel 监听为 passive，普通滚动和边界回弹均不调用 `preventDefault()`；视口由 `.wd-scroll-feedback-viewport { overscroll-behavior:contain }` 阻止滚动链。
- Inverter settings 正文与左侧导航显式使用 `wheelDeadZone:1.5`、`wheelPullRatio:.08`，第一格滚轮产生约 `3–4px` 可见回弹反馈；其他消费方保留默认 `4 / .035` 粘滞手感。轨道自身仍可按 `deltaMode` 驱动对应 viewport。
- 真实 Chrome 实测设置页普通 `deltaY=100` 滚轮使 `scrollTop` 前进 `100px`，事件 `defaultPrevented=false`；顶部第一格边界滚轮同样不阻止事件并产生可见位移。

## 2026-11-25 IPS Check Record scroll bounds

- `IPS Check Record` 的滚动视口铺到弹窗底边，不再在宿主上保留固定底部 padding；共享滚动轨道单独使用 `22px` 安全区，因此初始态没有卡片下方空带，轨道也不会越过弹窗下缘。
- 记录内容保留 `22px` 尾部余量，滚到最底时最后两张保护卡完整露出，卡片到弹窗底边保持约 `22px`。窄屏 `Protection checks` 标题改为 `border-box + padding-inline`，移除额外的横向滚动。
- `tests/verify-ips-check.cjs` 现覆盖桌面与窄屏的轨道边界、最后卡片可见性、底部尾距、滑块位置和原生滚动条隐藏。

## 2026-11-25 Initialization completion mark rendering

- 初始化步骤导航的完成标记不再把 16px `check-circle.svg` 作为 CSS mask 栅格化。页面现在使用同一路径的内联 SVG、`fill="currentColor"` 和 `shape-rendering="geometricPrecision"`；16px CSS 盒在当前 125% 显示缩放下对应整数设备像素，避免 14px 落在半像素边界。
- 初始化专项锁定完成标记为内联 SVG、`currentColor` 填充、16×16 尺寸，并断言不存在旧的 `--icon-mask` 导航节点。

## 2026-11-25 Initialization dark navigation and transparent wiring assets

- 初始化流程中尚未到达的步骤继续保持不可点击，但图标不再继承共享 disabled 的 Quaternary 色；图标与同项文字统一使用 `72%` 主文字 ink，深色下可直接辨认。
- Battery / MPPT 接线卡不再使用页面私有白色底或 `--wd-bg-primary` 覆盖，直接继承 `.isw-panel` 的表面、描边和阴影，与同页设置卡完全一致。
- 四张接线源图为白底 JPG；现新增 `scripts/make-initialization-illustrations-transparent.py`，仅删除与画布边缘连通的近白背景，保留产品轮廓内部的白色面。运行资产改为透明 PNG，图片下直接显示共享卡片底色。
- `setup-illustrations-source.json` 同时记录外部源 JPG 与运行 PNG 的字节和 SHA-256；`SOURCE-MANIFEST.md` 同步说明生成方式。初始化专项锁定未到达步骤图标颜色、卡片 surface/shadow 一致性、PNG 引用和像素角点 alpha=0。

## 2026-11-25 Initialization / settings shared-editor hardening

- 初始化完成页继续在 `3s` 后自动关闭；共享中性玻璃 `Close (3s)` 按钮可随时提前关闭，不再把倒计时当作唯一退出路径。
- `schedule-editor.js` 现统一计划校验、重叠判断、按开始时间排序、24h 时间轴分段和 Economic Discharge 对电池上网权限变更的确认条件；设置页 Economic / ToU 与初始化计划消费同一规则。
- `battery-editor.js` 统一电池拓扑条目、Battery Brand / BMS Communication / Protocol / 最大充放电字段契约和协议校验；`grid-profile-editor.js` 统一 Grid profile 可选状态、状态文案和搜索过滤。初始化与设置不再各自维护这些定义。
- 初始化与设置均补齐 `BMS Communication`、`Battery Protocol`、`Import Permissions`、`Export Permissions`。关闭 BMS 时协议保持可见但锁定；Export 从 `Solar and Battery` 切到禁止电池上网且 Economic Mode 含 Discharge 时，Cancel、Escape、遮罩关闭都恢复旧值，Continue 才提交；Operation Log 使用人类可读选项标签，不外泄原始路径或枚举值。
- Running Mode 使用显式 wire value `[0, 1, 2, 3, 4, 6]`；当前未实现 Forecast Mode，因此 Off-Grid 保持点位值 `6`，不会因缺少枚举槽位被错写成 `5`。
- MPPT 并联开启但没有任何分组时，初始化 `Next` 由共享分组校验阻止；空 Economic / ToU 计划错误显示在计划表内部。共享 `createConfirmDialog()` 在未明确确认时由 Escape / 遮罩关闭也会触发 `onCancel`，供调用方回滚控件。
- `tests/verify-initialization.cjs` 与 `tests/verify-inverter-settings.cjs` 新增/更新对应回归，覆盖完成页自动关闭、权限确认三条退出路径、Battery Protocol 宽度、模式 wire value、MPPT 与空计划阻断。当前仅本地预览，不写入设备或后端。

## 2026-11-25 共享实底按钮深色光学收口

- 共享 `primary` 与 `danger-solid` 继续使用同一套实底玻璃结构，但高亮白 rim / inner / optical 按主题分流；深色默认统一为 rim `0.38 / 0.24`、inner `0.21 / 0.11`、optical `0.15 / 0.075`，hover / 键盘 focus 通过共享 hover 光场和内侧边缘进一步增强内发光。
- 两类 `Discard Changes` 都使用共享 `danger-solid`，不能只把 neutral 按钮染红；`tests/verify-components.cjs` 锁定 blue / red 光学层一致、深色克制和浅色原值，Inverter settings 专项同时锁定关闭设置窗的变体。

先读 `AGENTS.md` → `PROJECT-MAP.md` → `DESIGN-SYSTEM.md` → 本文件。新增页面再读 `ARCHITECTURE.md`、`COMPONENTS.md`；核对既往反馈见 `USER-REQUIREMENTS.md`。用户最新明确要求优先。

## 2026-11-25 Grid Connection 数字字段右对齐

- `Reconnection delay`、`Start-up delay` 及同页三个 Power gradient 的 mini 数字字段统一 `128px × 36px`，字段盒贴所在行右缘。
- 字段内部使用 `justify-content:flex-end`，输入值 `text-align:right`，数值与单位作为整体贴右；不能只移动字段盒而让内部内容从左侧排列。
- 用户当前实际打开标签已刷新核验，两个 `60 s` 字段均为 `flow-end / right`，单位距字段右内距约 `12.7px`；Inverter settings 全量专项通过。

## 2026-11-25 Initialization previews

- Added standalone initialization routes `/setup/20kw` and `/setup/50kw`.
- `20kw` is a `4 MPPT / 1 battery path` fixture; `50kw` is a
  `4 MPPT / 2 battery paths` fixture.
- Both routes share one wizard: Grid code, Battery, MPPT input, Power limits,
  Running mode, conditional Economic / ToU schedule and success. The final
  settings step owns the Apply action; there is no separate Review page.
- Battery / MPPT wiring artwork is selected strictly by series. The supplied
  LCD 20 kW and no-screen 50 kW JPGs remain the source artwork; runtime assets
  are edge-connected transparent PNGs generated by
  `scripts/make-initialization-illustrations-transparent.py`, with source and
  runtime hashes recorded in
  `design/inverter-settings/setup-illustrations-source.json`.
- Submission is explicitly a local preview. No device point,
  `Device_Init_Flag`, backend state or hardware action is changed.
- The final annotation pass removed the redundant header copy and progress count,
  restored the exact `Parameter Setup Wizard` title, and moved both the step rail
  and right pane onto the existing Inverter settings shell classes. Step changes
  now keep the dialog rectangle stable and the specialized test asserts that
  behavior.
- Follow-up review restored the top-right close control, retained readable
  non-interactive future steps, switched Grid search to the shared search field,
  removed the duplicated Grid explanation block, enabled the settings-style
  scrolled-title divider, changed selected markers to check-circle and clipped
  the lower content/action corners.
- The corrected hardware rule keeps four MPPT inputs and parallel MPPT grouping
  on both 20 kW and 50 kW. Battery path count remains the series difference.
- Search uses the shared field with hover/focus icon contrast and shared
  hover/press scaling. Setup pages now use the settings `.isw-page`,
  `.isw-group-title`, `.isw-panel`, `.isw-row`, segmented, Economic table and
  ToU row contracts; duplicate intros, nested cards and per-step numeric
  trailing values were removed.
- Parallel MPPT groups now use the shared `components/mppt-group-editor.js`.
  Both setup variants and Inverter settings therefore share the same
  two-channel picker, claimed-input disabling, add action and danger
  `Delete group` menu instead of maintaining separate group editors.
- Economic / ToU setup restored the settings schedule contract: `24h Overview`,
  power information, circular add action, danger row deletion, automatic
  start-time ordering, mode-dependent power/PV visibility and row-level errors.
  `Next` commits a pending edited range first, so an overlapping or malformed
  draft cannot leave the current step or trigger the final Apply action.
- Row errors now begin directly under the corresponding time field, left-aligned
  with its content, instead of spanning the row and floating at the far right.
- Scrolled setup screens now retain real Gaussian blur above and below the
  content without clipping the dialog radius. Selecting a Grid profile replaces
  the one profile list instead of appending a second list, and the MPPT source
  segmented control remains content-sized.
- Step changes now force the new page to `scrollTop = 0`; same-page field and
  local rerenders keep the current position. The setup rail is `276px` wide with
  a `4px` row gap, and future steps use a `72%` primary ink instead of the
  lighter secondary token.
- MPPT Tracker now uses one shared settings card containing the parallel switch,
  its full hint and all group rows. The switch aligns to the title line. Setup
  title-to-content spacing is halved to `9px`.
- Battery / MPPT illustrations are full-width shared `.isw-panel` cards and
  inherit the same theme surface, inset border and shadow as adjacent setting
  cards. Transparent PNG artwork replaces the former white rectangle; browser
  `<figure>` margin no longer shifts the cards, and the action bar carries
  matching rounded bottom corners.
- Battery parallel, Import / Export limits and MPPT parallel switches now use the
  shared `animateContentHeight()` content-growth rhythm instead of instantaneous
  `hidden` toggles.
- The completion state now follows the supplied reference: no left title, rail,
  model-specific copy, review list, white inner rectangle or custom circular
  success mark. It uses the shared black check-circle icon without ring/reflection,
  a compact `52px` glyph, slightly larger raised copy, no action divider/blur
  band, no dark-mode inner top outline, and the default glass `Close (3s)` button
  moved upward. The finished content is then nudged slightly downward for the
  final reference position.
- Step changes use the shared `settings-page-transition.js` crossfade for the
  outgoing snapshot, incoming page and fixed title. The ToU PV switch is also
  left-aligned with its column heading.
- `tests/verify-initialization.cjs` covers both direct routes, MPPT/battery
  counts, the shared MPPT group picker, Running Mode motion, series images,
  Grid-list replacement, schedule info/add/delete/sort/error behavior, title and
  action blur, step scroll reset, nav ink/spacing, switch growth, conditional
  schedule, final-step Apply, completion/countdown, light theme and narrow
  layout. The Inverter settings full suite continues to cover the shared MPPT
  consumer.
- Final verification for this annotation pass passed `npm run check`, the
  initialization suite, the full Inverter settings suite, `audit:assets`,
  `audit:motion`, public build and `git diff --check`. Both user-open setup tabs
  were refreshed; the latest 20 kW tab shows the five-step rail without Review,
  and the latest 50 kW tab was reset to Grid code.

## 2026-11-25 Adaptive Select states

- Economic Schedule 与 ToU Mode 行内 Adaptive Select 的深色交互统一由 `select-control.css` 管理：默认 / hover / active 填充为 `8% / 15% / 20%`，描边为 `10% / 26% / 46%`，阴影为黑色 `20% / 30% / 36%`；按下和展开态不再停留在 hover 外观。
- 深色阴影从发白的混合灰改为中性黑色。浅色模式保持原方案：默认透明，hover / focus / 展开为 `Fills/Quaternary`，描边和阴影不增强。
- 新增 `tests/verify-select-states.cjs`，覆盖 Economic 与 ToU 两处 Select 的深色 hover、按下、展开外观及浅色原值回归。
- 验证通过：`npm run check`、`tests/verify-select-states.cjs`、`tests/verify-components.cjs`、`npm run audit:motion`、Inverter settings 专项、`npm run build:site:public`（310 文件 / 5.91 MB）、`npm run audit:assets`（171 个资产，0 unused / 0 missing）和 `git diff --check`。真实预览标签已刷新并确认深色 ToU Mode Select 的展开态。

## 2026-11-25 IPS Check

- Inverter settings 的 `Grid & Protection` 新增意大利 `IT CEI 0-21` 条件页 `IPS Check`。其他 Grid Code 完全隐藏入口；选择意大利草稿但未 Save 时入口禁用，hover / focus 提示先保存。
- 保存意大利档案后入口启用；`IPS_Selfcheck_Require=1` 在未通过时使用危险红，打开设置窗提示必须先通过 IPS Check 才能并网。设备离线覆盖所有自检状态。
- IPS 页面包含操作/状态卡和八张保护项卡，覆盖 Ready / Checking / Passed / Failed / Interrupted / Offline。开始检查在本地预览中模拟 `Italy_SelfTest_Enable=1`，不会伪造真实固件写入。
- `IPS Check Record` 按钮位于页面标题行；独立 `Last self-check` 说明行已删除。意大利预览继续显示全部 Grid 二级页并将 IPS Check 放在最后。
- 历史弹窗改为与设置页一致的结果卡、分组标题和八项卡片，并使用共享滚动反馈；弹窗卡片继承页面级 `24px` 圆角、`10px` 网格间距、深色描边/投影和字体变量。记录结束时间、整体结果和八项数值；检查结果与运行态作为瞬态 RO 数据，不进入普通 Save、dirty 或 Operation Log。
- IPS 操作卡和记录摘要左侧的标记统一使用中性灰面，不再使用主题蓝。
- `p25` 本地夹具把 `IT CEI 0-21` 标为 `Preview only` 以便评审 IPS 样式，但没有复制任何德国或其他国家的保护参数。生产接入仍需真实意大利认证档案和固件确认 `Italy_SelfTest_Enable` 拼写。
- 新增 `tests/verify-ips-check.cjs`，覆盖入口显隐与保存门禁、必检提示、八项卡片、历史弹窗、开始/检查中/通过、离线/失败/中断聚合、窄屏单列、深浅主题和打开设置提示。
- 本轮验证通过：`npm run check`、Inverter settings 专项、IPS 专项、`npm run build:site:public`（303 文件 / 5.88 MB）、`npm run audit:assets`（171 个运行资产，0 unused / 0 missing）和 `git diff --check`。真实本地预览标签已刷新，确认全部 Grid 子页可见、IPS 位于最后、记录按钮在标题行；并检查了改版后的记录弹窗。

## 2026-11-25 Circular check rendering

- 圆形对勾边缘发毛的根因是三层抗锯齿叠加：SVG 自身的 `<mask>`、元素 `border-radius:50%` 裁切，以及基础 radio 的内阴影。
- `check-circle.svg`（settings 与 selection 两份）改为单一 `fill-rule="evenodd"` 路径，使用 `shape-rendering="geometricPrecision"`；选中态同步移除圆角、边框和内阴影，只保留一层 CSS mask。
- 覆盖 Running Mode、Grid Profile、MPPT picker、Economic / ToU / Battery Select option；新增专项断言检查 SVG 单路径结构、18px 经计算尺寸、零圆角、零边框和无内阴影。

## 2026-11-24 当前规则归档（最高优先级）

- **本次日终归档口径**：仅依据当前可访问的对话、当前工作树 `git status` / `git diff`、运行代码、专项测试和现有文档；无法直接访问的并行对话未补写或推断。长期规则分别落在 `AGENTS.md`、`DESIGN-SYSTEM.md`、`docs/COMPONENTS.md`、`docs/INVERTER-SETTINGS.md` 与 `docs/TOU-MODE-SETTINGS.md`，本文件只保留当前状态、验证证据和未决边界。
- **本次规则修正**：共享底部回落统一使用 `--wd-motion-content-grow` 时长和独立 `--wd-ease-content-settle` 缓动，废弃旧 `--wd-ease-content-grow` 回落描述；共享 Select 的 `description` 双行说明结构纳入顶层组件规则；ToU 图表采用 Buy 主曲线与轻面积、Sell 次级曲线、8% 模式底色、最低 / 最高价格摘要和 hover 当前模式列；用户标注的图例结构保持不变；Dynamic `24h Overview` 保留右 `2px` / 下 `3px` 光学校正。
- **ToU 标题与摘要微调**：`24h Overview` 提升为 `13px / 18px`；价格摘要左缘与标题文字左缘对齐，标题到摘要净距收紧到约 `16–18px`。
- **ToU 图表回退快照**：改版前 `Backups/WattDesk-before-tou-chart-redesign-20261124-171242.zip`，478 项，`6,748,372` bytes，SHA-256 `4E35A36B6D171F3A47558DC87CFCC6351844EA880308F7A7A4385EFBC99862A8`；模式轨道方案调整前 `Backups/WattDesk-before-tou-mode-background-20261124-172410.zip`，478 项，`6,750,834` bytes，SHA-256 `3DA40182A8764816DDDECA213703E5269F02DE539705DABEACEC22FB422B7841`。
- **实际预览落地复核**：用户当前打开的 Cent Browser 标签曾保留旧 DOM；刷新并重新进入 Dynamic ToU 后确认新标题类、`2px 3px` 计算位移和最终计划样例已加载。后续视觉验收必须区分代码已修改、测试标签通过和用户当前窗口已更新。
- 共享 `.wd-edit-field` 已收口为单一状态与动效契约：直接输入、复合输入和 Select 触发器统一使用 `380ms` / `--wd-ease-disclosure`，`motion.css` 不再按 `.isw-number / .isw-wifi-field` 等页面类名手工登记。字段通过共享自定义属性管理默认、hover、focus 和深浅主题；默认 outline 为 `1px transparent`，focus 只动画颜色并保持 `1px`，placeholder 同时覆盖字段宿主和内部输入。
- 新增 `npm run audit:motion` 与 `tests/verify-edit-field-motion.cjs`。专项在真实 Chromium 中同时验证直接输入、复合输入和 Select 字段，采样 hover、leave、focus 的中间帧，并覆盖 reduced-motion；不再只断言最终颜色或 transition 声明。
- 数据页 toast 改为读取当前可见面包屑标题的真实 rect，再按 toast 自身渲染高度垂直居中；固定 `top:70px` 只作为无标题页面的回落，避免标题行高变化后中心偏移。
- 全站 toast 统一为共享单实例：Glass Surface 在 controller 创建时预挂载；入场时宿主保持 `opacity:1`，只淡文字并做 `4px` 下落；退场时宿主与文字作为一个整体同步 `1 → 0` 淡出并上浮 `4px`，不能文字先消失、空玻璃后消失。不得单独对 fill 的 opacity / backdrop-filter 做动画。上下内距从 `11px` 收紧为 `8px`，Inverter settings 与数据页、Home、Service Ticket 完全共用。
- Active Power Dispatch 的四个 RW 点、`Output_Capability_Mode`、`DRM_SET` 已形成统一点位契约；`DRM_SET` 固定 `0=Off / 1=DRM / 2=RCR`，Output Capability 候选枚举继续标记为 firmware-pending。
- 顶部状态卡和 Active Power Dispatch 的 Currently effective 改为设备上报 RO 值：`ActivePower_Effective_Limit`、`ActivePower_Limit_Source`、`ActivePower_PV_Curtailed`。Setpoint、Export limit 或电池能力变化不再触发生效值推导；缺失时显示 unavailable。
- 顶部主标题由 `Grid-tied point now` 改为 `Effective active-power limit`；Effective chain 改为三行：Effective power limit、Limit source、PV curtailed。首行结果使用主题蓝强调，并与支持值用分隔线分组；Limit source 不画空进度轨，使用状态点 + 单行源标签跨轨道区右对齐，不能换行。卡片说明与卡片净距统一使用 `--isw-note-gap` 的 `10px`。
- 本轮点位与回显验证：`npm run check`、`npm run test:file -- tests/verify-inverter-settings.cjs`、`npm run build:site:public`（296 文件 / 3.06 MB）、`npm run audit:assets`（167 个资产，0 unused / 0 missing）和 `git diff --check` 通过；深色与浅色 overview、dispatch 页面已实拍复查。
- toast 专项验证：`tests/verify-floating-surfaces.cjs` 覆盖隐藏态预挂载材质、入场首帧 `opacity:1`、blur 就绪、文字独立淡入、无入场宿主 opacity 关键帧、退场宿主 opacity `1 → 0` 与文字同一时间线、`8px` 纵向内距和退出收尾；`tests/verify-routing.cjs` 覆盖数据页标题几何对齐；`npm run audit:motion` 覆盖共享编辑字段中间帧。
- 验证边界：`npm test` 25 套回归曾在共享层收口阶段全部通过；后续点位/回显改动已重新通过 `npm run check`、Inverter settings 全量专项、公开构建、资产审计和 `git diff --check`。未把这些页面专项结果表述为修改后的再次全站回归。
- ToU 已按确认稿实现：[TOU-MODE-SETTINGS.md](./TOU-MODE-SETTINGS.md) 记录双入口、Manual / Dynamic、24 段共享调度、线上五种控制模式、Intelligent 云端决策、地区/费用、自动生成与生产边界。
- Inverter settings 的 `Operating strategy` 分组现显示两个 `ToU Mode` 入口，右侧小字分别为 `Manual / Dynamic`，共用 ToU 模式图标；Manual 为默认业务形态，两个入口始终显示，暂不做侧栏资格判断。
- ToU 最终验证通过：`npm run check`、`npm run test:file -- tests/verify-inverter-settings.cjs`、`npm run build:site:public`（296 文件 / 3.05 MB）、`npm run audit:assets`（167 个运行资产，0 unused / 0 missing）和 `git diff --check`。专项覆盖双入口、计划表完整文案、稀疏分钟轮、错误去重、96 点电价图、Tomorrow 空态、五种控制模式、Percentage 阈值、Intelligent 无本地策略字段及保存后的模式保持。
- 2026-11-24 ToU 最终状态：两个 `ToU Mode` 入口始终显示 `Manual / Dynamic`，Manual 默认；Manual / Dynamic 使用标准 `640px` 内容列和同一份 ToU 模型。完整业务、数据、图表和设备点位边界见 [TOU-MODE-SETTINGS.md](./TOU-MODE-SETTINGS.md)。
- Manual 最终状态：24h Overview 复用 Economic Schedule；计划表五列为 `136 / 160 / 154 / 90 / minmax(...)`、列间距 `4px`、左右内距 `24px`。时间输入完整、Mode 名称完整、PV 表头单行，电量到开关净距约 `20px`。时间范围共用 `createTimeRangeControl()`：`1 h` 分钟列静态 `00`，`15 / 30 mins` 每值只渲染一次；打开箭头与共享 Select 同为 14px、约 12px 右距、`.72 → 1` 状态。
- ToU 校验与编辑最终状态：同一时间、反序、非步长、重叠和超过 24 段均阻止保存；有效计划按开始时间升序。同一字段只保留一条当前错误，错误横跨时间与模式两列并单行显示。删除后计划真实减少且不自动补 General Mode；全空计划只有新增或 Cancel 才改变。
- Dynamic 最终状态：Today/Tomorrow、96 点 Buy/Sell 价格线、8% 模式底色、最低 / 最高价格摘要、15 分钟吸附与模式列高亮浮窗，以及 Manual / Duration / Percentage / Fixed / Intelligent 五种控制模式均已落地。原图例结构按用户标注保持不变。Advanced 子页 Back、滚动模糊标题、Time Settings、说明型 Control Mode、220px 地点选择器、Extra Charge Modal 和 Intelligent 标准卡采用批注后的最终样式；不再保留中间轮次的列宽或图表方案。
- 共享按钮与信息浮窗最终状态：`primary` 与 `danger-solid` 共用按主题分流的 rim / inner / optical 结构并始终保持白字；浅色使用已确认的高亮白层，深色使用减淡但仍可见的同级高光。Economic 与 ToU 的 info tooltip 均使用 `bindHoverPanel()` 居中定位。Economic kW 辅助值使用 `Labels/Secondary`，与 ToU 计划表一致。
- 当前发布策略改为 local-only：后续修改可本地编辑、提交、测试和构建，但不得自动 `git push` 或部署 Cloudflare。只有用户明确要求发布时才更新远端；在此之前独立预览和主站继续使用上一次线上版本。
- 1120 源包是 1119 的增量：只新增 `Limit basis` 与更新说明；其余页面、字段、18 个档案和校验说明继续沿用 1119。
- `Import & Export Limits → Export limit` 增加 `Limit basis`：`Total` 默认、`Per phase` 可选；仅三相机型、Export limit 开启时显示，单相隐藏。
- 当前 `p25` 本地预览设为三相机型且固件支持按相，两个选项可实际切换。固件不支持时 `Per phase` 仍可见但禁用；该分支有模型级回归，测试覆盖单相隐藏和 unsupported 规范化。
- `limits.basis` 纳入现有 limits 页面保存域；Save/Cancel、dirty、Operation Log 复用现有机制，日志显示 `Total / Per phase`。当前 preview 不伪造三相实时限值；顶部状态和 Effective chain 使用设备上报 RO telemetry，不在本地推导。
- Battery 页面已补齐 2026-11-23 新设置，固定顺序为 `Battery configuration → State of charge → Battery heating`。单路和并联使用 `battery.common`；双路关闭并联后，品牌、最大充/放电电流和加热拆分到 `battery.bank1 / battery.bank2`。SOC 明确不跟随输入拆分，三种状态都只使用一套 `battery.soc`。
- 并联运行时由 `batteryMasterBattery` 表示主通讯电池；正常值为 `bank1 / bank2`，后续点位实际读写路由到该电池，但界面仍是一套配置。值为空或无效且并联开启时，原并联卡内显示硬件通讯检查警告，并隐藏 Battery Brand、最大充/放电电流；SOC 与加热仍保留。关闭并联或识别成功时不显示警告并恢复配置字段。当前 p25 预览默认将主通讯电池识别为 `bank1`，首开显示完整的一套 Battery 配置；未知主通讯电池只保留独立模型回归，不再作为默认演示状态。异常警告使用 `13 / 400 / 18px` 与 `12px / 4px` 上下内距，只在开关下方保留顶部线，无底部分隔线，卡片尾部约 `5px`；图标改用不透明主题橙 mask，不再继承原素材 `30%` 填充透明度。从该异常状态关闭并联时，必须立即恢复两张完整且可编辑的 `Battery #1 / Battery #2` 配置卡，不能继续隐藏或禁用分路设置。
- SOC 改为 `Grid-tied SOC` 与 `Off-grid SOC` 双端范围，默认 `10–80% / 20–90%`；数值和玻璃手柄都可编辑。未填充轨道使用中性灰，已填充区间使用主题蓝；默认线宽为 `4px`，只有 24px 透明线区或端点 hover / focus 才增至 `8px`，整卡 hover 不触发。轨道 hover 时两个端点一起 spring 放大，释放通过共享 `420ms` spring 回落；hover 端点显示跟随的 Glass `SOC <value>%` 浮窗，离开即消失，点击本身不控制显隐，拖拽期间持续显示。该浮窗绝对覆盖在内容层上方，不占卡片高度，与手柄净距 `2–4px`，直接复用 `wd-glass--surface wd-glass-popup` 材质；进入时材质与 backdrop blur 立即达到终态、正文延后 `70ms`，不得对 backdrop-filter 做过渡；退出时正文先退、材质与模糊延后 `70ms`。浮窗宿主必须使用 `isolation:auto`，否则模糊虽有计算值却无法采样背后内容。端点无内部小点，默认 `16px`，并增强小圆盘的模糊、边缘和内外高光；拖动时手柄/填充/浮窗始终连续移动、数据只回传最近整数，不保留整十磁性吸附，键盘方向键保持逐点。
- SOC 轨道支持点击定位最近端点；两端允许相互越过，结束后按数值排序，较小值自动成为 Start。Start 与 End 相等时显示 `Start and end SOC limits must be different.` 并阻止 Save；数值输入反向也会自动排序。刻度使用 `12px` Labels/Secondary，按真实 `0 / 20 / 40 / 60 / 80 / 100%` 坐标定位，卡片底部留白收紧。
- 设置页新增统一分组节奏：同一分组标题下连续相邻的卡片间距从 `30px` 减半为 `15px`，当前同时覆盖 Battery 的 SOC 双卡与 Parameter Export 的 Contents 双卡。
- Device Features 的 `Operating envelope` 增加 `Backup Output`，固定位于 `Allow grid / off-grid switching` 与 `Unbalanced output` 之间，默认开启并参与当前页 Save / Cancel、dirty 与 Operation Log。逆变器运行时，开关点击在进入共享 toggle 前被拦截，分别显示 `Cannot Enable Backup Output` / `Cannot Disable Backup Output` 单按钮 `OK` 通知；开关值、DOM、dirty 和日志均不变化。`OK` 使用共享蓝色 primary 整行按钮，点击只确认提示，不解除门禁；未关机时再次尝试仍会继续弹窗，通过 Operation Control 关机后才允许正常切换。
- 共享 `createConfirmDialog()` 新增 `showCancel:false` 与 `confirmVariant`，用于单操作确认 / 安全通知：保留 `480px`、Depth Reveal、Glass Surface、焦点归还和 modal stack，只显示一个整行宽的 `OK`，可按调用方选择共享按钮变体。通知铃铛复用 `asset-32.svg`，并由 `npm run sync:masks` 生成不透明运行遮罩。
- Backup Output 专项覆盖行顺序、默认状态、运行中关闭拦截、通知标题/正文/单按钮/铃铛/焦点归还、拦截后不 dirty、关机后双向切换和返回基线；深色 1545×1252 与浅色 1545×1252 截图均检查通过。
- MPPT & Strings 新增完全分离的两组点位：5 个 `inventoryPoints` 只表示 MPPT 存在状态（`5` 为无接口），4 个 `groupPoints` 只保存并联关系；实际 MPPT 数量由非 `5` 的 inventory 点位计算。
- Parallel MPPT Operation 的说明放在标题下；超过 2 路开启后先显示 `MPPT Group 1` 占位，并从共享 Select 触发器下方打开紧凑双选浮层。组值可再次点击编辑；其他组已占用 MPPT 始终置灰不可选，只显示灰色 `MPPT #N`，不再附加 `Already assigned`，必须先删除占用它的组。
- MPPT 选择列表使用 36px 横向菜单行，左侧文字、右侧 Running Mode 18px 选择标记；组 Select 复用 Scan interval 的 Adaptive Select 内容宽度和 14px 下箭头，与 option 按钮间距 8px；占位组显示 disabled option。双选浮窗宽 220px，右缘按共享 Select 规则在触发器布局右缘外扩 30px。选择超过两项时自动取消最早选择，始终保留最后两个。
- 加号与 option 右缘对齐；`Delete group` 使用共享危险菜单泛红状态；空组错误上下留白相等并保留 Group 1 占位。
- MPPT 专项覆盖 2/3/4 路 inventory 推导、两组点位隔离、组占位与 disabled option、浮窗锚定、Adaptive Select 几何、横向选择行、最后两项自动淘汰、跨组禁用置灰、第二组自动补全、加号右对齐、危险删除、空组错误间距、Save 阻止与 Cancel 回基线；页面截图进入 `tests/output/`。
- MPPT 空组错误插入 / 移除统一走共享 `280ms` content-grow；取消首次选择、错误出现、创建首组后错误消失均从旧卡片高度续接，不得即时 `hidden` 或硬换 DOM。
- Shadow scan 新增 `All MPPTs Control / Individual Control` 共享分段。全部模式保留一个总开关与 Adaptive Select； Individual 模式根据 inventory 非 `5` 点位数量动态生成每一路独立开关和间隔。
- 单路关闭只收起该路 interval；`mppt.scanMode`、`mppt.scan`、`mppt.interval` 和 `mppt.individual.<index>.*` 全部进入当前页 Save/Cancel、dirty 与 Operation Log。专项覆盖 4 路夹具、独立更新和 Cancel 回基线。
- Shadow scan 的 All / Individual 扫描区在同一 MPPT 页面预渲染；模式切换只原位显隐目标区域，不再整页重绘，页面、Tracker 卡和分段控件节点保持不变。位于底部切回 All 时使用共享 bottom-scroll guard 平滑回落到新底边。
- 共享 bottom-scroll guard 的滚动跟随改用独立 `--wd-ease-content-settle`，并在 Shadow scan 专项中覆盖同步点击不夹底、spacer 存在、单调回落、无停顿重绘、最终到达新底部和节点不重建。
- MPPT 本轮验证：`npm run check`、`npm run test:file -- tests/verify-inverter-settings.cjs`、`npm run audit:assets`、`npm run build:site:public`（291 文件 / 2.91 MB）和 `git diff --check` 通过；深浅主题选择器、单组、双组和空组错误均已实拍检查。
- CT Detection 新增 `CT Self-check → Current Mode`，使用共享分段提供 `Meter Current / CT Current`，映射 `Grid_Current_Mode_Set` 的 `0 / 1`；`Run check` 继续独立对应 `CT_SCAN_ENABLE`，不改变电流来源。页面明确不把 `100 A CT / 50 A CT` 作为枚举。
- `ctCurrentMode` 独立于瞬态 `ct` 运行结果，已进入当前页 Save / Cancel、dirty 与 Operation Log；回归覆盖默认 Meter Current、仅两个选项、运行检查不改变 Current Mode、评级文案不存在和保存后的可读前后值。
- Operation Control 的 Factory reset 已替换为 `Reset & Recovery` 嵌套弹窗入口。弹窗提供按分类恢复和 Full reset 两条路径；分类下分别映射 `Reset_operation`、`Reset_gridparameters`、`Reset_network`，Full reset 单独映射 `Reset_allcustomersettings` 并覆盖前三类效果。
- Reset & Recovery 使用共享 modal stack、标准按钮、Glass Surface 和最终确认；本地命令只显示 preview 模拟结果。主弹窗、分类、四类详情、取消返回、危险确认、提交锁和断线提示均纳入专项回归。
- Reset & Recovery 样式收口：详情和确认按钮保持共享默认 `36px` 尺寸，只调整操作组居中并压缩底部留白；Cancel 使用共享 neutral 玻璃，Continue / Reset 使用新增的共享 `danger-solid` 实心红玻璃和白色文字，不再增加页面私有按钮材质；分类行 hover、18px 箭头、Warning 对齐和 `16px` 内容节奏均已覆盖。
- Reset & Recovery 留白与箭头最终值：Landing 左右和底部统一 `22px`，带操作栏页面底部保持 `14px`；分类行箭头默认通过 `.24` 透明度保留原始浅色层级，hover / focus 提升到完全不透明的实心当前语义色。
- Full reset 恢复交互稿文案和五项重置清单，最终确认使用 “Are you sure to reset all data?”；分类页补回恢复风险提示，危险行 hover 不再把红色文字切成黑色。
- Networking 新增 Wi-Fi 热点卡片，提供 `Inverter Wi-Fi Hotspot / SSID / Password`，接入共享 switch、标准设置编辑字段和密码眼睛显隐；说明使用标题下标准 hint，SSID / Password 宽度收紧为 `220px`，密码眼睛为 `16px` 且闭合态下移 `0.5px`，三个点位进入 Save / Cancel、dirty 与脱敏 Operation Log。
- Wi-Fi 编辑字段与其他直接输入、复合输入、Select 触发器一样只依赖 `.wd-edit-field` 语义类，自动继承 `380ms` disclosure；最终实现已在 `motion.css` 移除页面类名白名单。
- Battery 专项已覆盖单路、双路并联、双路分置共享 SOC、主通讯电池未知警告、能力 normalization、手柄/填充对齐、小圆盘玻璃材质、轨道 hover 双端放大、spring 释放、SOC hover 浮窗的显示/离开/拖拽保持、材质与正文 `70ms` 顺序、浮窗绝对覆盖与 `2–4px` 净距、仅线区 hover、连续拖拽位置与整数回传、无磁性吸附、键盘逐点移动、轨道点击最近端点、交叉后排序、相等错误、默认/悬停线宽、端点尺寸、连续卡片半间距、依赖卡顺序与 dirty 回基线；`npm run check` 和 `npm run test:file -- tests/verify-inverter-settings.cjs` 通过。
- 归档依据：本次可访问的对话记录、当前工作树 `git status` / `git diff`、运行代码、页面专项测试和现有规则文档。未访问或不在当前记录中的并行对话不做推断。
- **2026-11-23 归档新增**：1120 `Limit basis`、单/双电池拓扑与并联能力、设备级共享 SOC、Battery Brand / 电流 / 加热、SOC 双端点击与交叉排序、跟随浮窗、真实百分比刻度和设置页连续卡片半间距。
- **2026-11-23 归档修改**：把 SOC 的绿色改为主题蓝；裸线从 `8px` 改为默认 `4px` / hover `8px`；把“先文字后模糊”的浮窗改为材质与 blur 立即、正文延后 `70ms`；把提示从点击持久改为端点 hover 打开 / 离开关闭；把切换流程统一为共享 spring 与 `isolation:auto` 的真实 blur。
- **2026-11-23 归档废弃**：不得恢复 SOC 按电池分拆、绿色填充、整十或整数磁性吸附、`lower ≤ upper` 禁止交叉的校验、整卡 hover 加粗、六等分网格刻度、13px 浅灰刻度、占布局高度的 tooltip、点击控制 tooltip、过渡 `backdrop-filter`、未覆盖 `isolation:isolate` 的毛玻璃 tooltip，以及 Device Features 里的全局 Battery heating。
- 本次“完整规则归档”只更新规则文档，不追加运行代码、UI、样式、资源或测试改动；工作树中的功能代码属于此前已完成的实现，保持原样。
- 实施前存档：`Backups/WattDesk-before-1120-limit-basis-20261123-110928.zip`，445 项、4,670,860 bytes，SHA-256 `044FFF7AA5A2EF1AF781103FC3FBF74C37227F91C40B232452EF514A09C432CA`。
- 生产仍需确认按相闭环排期、计量方式点位和固件能力位；在收到 11 月 26 日前的硬件/固件回复前，不把 preview 数据视为生产元数据。

### 2026-11-24 归档增量（相对上一轮完整归档）

**规则层级**

- 全局规范：`.wd-edit-field` 动效状态、toast 几何与材质生命周期、共享 motion token、`prefers-reduced-motion`、用户实际预览标签验收和本地预览 / 发布边界。
- 组件级规范：`createConfirmDialog()` 单操作与 `danger-solid`、`createTimeRangeControl()`、共享 Select（含 `description` 双行说明）/ segmented / toggle / bottom-scroll guard、`npm run audit:motion`。
- Inverter settings 功能规则：Active Power 点位与 RO telemetry、Output Capability 固件边界、DI Port `DRM_SET`、ToU、Battery、MPPT、Shadow scan、CT、Reset、Networking。
- 开发约定：同类问题先收敛共享语义，再做全消费方审计；页面不得复制共享样式或局部 timing；视觉状态必须同时检查计算样式、真实中间帧和双主题。

**新增**

- 共享 `.wd-edit-field` 的完整状态矩阵与 `npm run audit:motion` 中间帧审计。
- ToU Manual / Dynamic 双入口、共享 `createTimeRangeControl()`、Manual 六模式计划、Dynamic 96 点电价与五种控制模式；15/30 分钟稀疏轮、1 小时静态分钟轮、稳定错误身份、24 段校验和按开始时间排序。
- Dynamic ToU 图表最终视觉层：Buy 2px 主曲线与 `14% → 0` 轻面积、Sell 1.5px / `84%` 次级曲线、8% 六色模式底色、最低 / 最高价格摘要、15 分钟吸附与当前模式列高亮；`24h Overview` 为 `13px / 18px`、右 `2px` / 下 `3px` 光学校正，摘要与标题文字左缘对齐且净距约 `16–18px`。图例保持用户标注的原结构。
- `Output_Capability_Mode`、`DRM_SET` 和三个 Active Power 生效 RO 点契约。
- Backup Output 运行时关机门禁、Reset & Recovery 分类恢复 / Full reset、CT Current Mode、Wi-Fi 热点配置。
- Battery 单/双路、并联、共享 SOC、品牌/电流/加热；MPPT inventory/group 双点位体系与 Shadow scan All / Individual。

**修改**

- 编辑字段动效从页面类名白名单改为语义类自动继承；hover / leave / focus 以及字段内箭头都验证真实中间帧。
- toast 垂直位置由固定 `top` 改为当前可见面包屑真实几何；入场预挂载玻璃，退场宿主与文字整体同步消失。
- 顶部承载值改为 `Effective active-power limit`；生效值只取设备上报，缺失显示 unavailable，不再本地推导。
- Effective chain 从五行计算链改为三个 RO 回显值并删除重复的 Dispatch setpoint；顺序为结果 → 原因 → 弃光，Limit source 改为无轨道的单行状态行。
- `DRM_SET` 明确为 `0=Off / 1=DRM / 2=RCR`；四个调度点与 Output Capability 候选值集中到单一契约对象。
- `primary` 与 `danger-solid` 统一为更明显的默认实底玻璃高光；Economic kW 降为 `Labels/Secondary`，Economic / ToU 信息 tooltip 均改为共享居中锚定。
- ToU 计划表最终收敛为 `136 / 160 / 154 / 90 / minmax(...)`、列距 `4px`、左右内距 `24px`，以实际文本和输入 `scrollWidth` 验证无截断。
- 共享 Select 的 `Option.description` 正式纳入组件契约；bottom-scroll guard 的回落缓动统一为 `--wd-ease-content-settle`，不再使用快速起步的 content-grow 缓动。
- 视觉完成标准补充“用户当前实际预览标签已加载新实现”；测试标签通过和源码存在不再单独视为已落地。
- ToU 模式色降为 `8%` 绘图区底色，价格线成为主视觉；图例按用户标注保持不变。

**废弃**

- 废弃在 `motion.css` 手工追加 `.isw-number / .isw-wifi-field` 等页面类名来启用共享动效。
- 废弃用固定 `top:70px` 假定所有数据页标题高度一致；该值只保留为无标题页面的 CSS fallback。
- 废弃从 Setpoint、Export limit、电池能力或 PV 可用量在云端推导 `Effective limit / Limit source / PV curtailed`。
- 废弃旧 `Grid-tied point now`、`Battery power capability` 等把设备限值或限制来源描述成实时功率、或重新引入本地推算链的实现。
- Output Capability 候选值未获固件确认前，不得把 `Rated / Overload / Underload` 的数值枚举或发布条件写成既定生产契约。
- 废弃 ToU 图表中经过二次混色、发灰的模式 wash，`7px` 模糊、价格 / 网格 / 基线两端渐隐、`228px` 高度和分组图例方案；它们会被误认成最终改版，均不得恢复。模式必须直接使用主题 Accent，并在中间保持清晰分段。
- 废弃独立模式轨道方案；用户明确选择绘图区背景表达模式，模式色固定在 `8%`。
- 废弃用固定 `--wd-ease-content-grow` 承接页面底部内容收缩后的滚动跟随。
- 废弃 15/30 分钟轮复制多组后隐藏回中、1 小时分钟轮继续滚动、按输入值累积错误、Page-local danger 色、旧 ToU 中间表格列宽以及向右偏移的信息 tooltip。
- 废弃“主按钮关闭全部高光/内阴影”的旧描述；实底按钮只关闭背景模糊和整面反射场，仍保留可辨认的白色 rim、inner 与 optical 高光。

**未决**

- 动态电价 API、地区能力位、真实价格数据和刷新失败状态仍待后端契约。
- Intelligent Mode 的生产算法、下发失败回退和设备点位仍未确认。
- ToU 时间段、费用和高级参数的正式设备写入、权限与生产元数据仍未接入。

**证据边界**

- 本次只使用当前可访问的对话、当前工作树 `git status` / `git diff`、运行代码、专项测试与项目文档；无法访问的并行对话不补写。
- 当前页面仍为本地 preview，不能把样例 telemetry、点位地址、权限、保存或硬件控制描述为已接入生产能力。
- 这次“完整归档”只更新规则与交接文档，不新增或修改页面功能、UI、样式、资源或测试代码；工作树中的运行代码属于此前已完成的实现。

## 2026-11-20 规则基线

- Inverter settings 已发布到 `https://wattdesk-preview.carlwang.cn/home`；独立设置预览为 `https://inverter.carlwang.cn/`。独立 Worker 只代理设置页与静态资源，其他 WattDesk 页面返回 404；页面实现、数据和后续更新仍共用同一模块。独立预览底部主题按钮离底边 `32px`，每个新标签默认浅色。
- Inverter settings 的页面专属规则已从本状态文件、`AGENTS.md`、`DESIGN-SYSTEM.md` 和组件手册收敛到 [唯一页面契约](./INVERTER-SETTINGS.md)。本文件下方同日更早的 Inverter 条目只保留实现与验证历史，不再作为第二套有效规格。
- 本轮整理已建立可恢复快照 `Backups/WattDesk-inverter-settings-before-integration-20261120-155852.zip`（463 项，6,635,126 bytes，SHA-256 `9AAE8B6151AAEEA78B76B242C81CBDA0705B01FB63F05631F98D88EC3E8FDD4C`），未改变页面视觉或交互。
- 枚举已集中到 `src/pages/inverter-settings/settings-options.js`，页面渲染和 Operation Log 的 before/after 显示共用同一来源；资产审计为 164 个运行资产、0 unused、0 missing。已删除无引用 CSS 类和重复选项字面量。

### 2026-11-20 日终规则归档（本次）

- **发布结果**：主站为 `https://wattdesk-preview.carlwang.cn/home`；Inverter settings 唯一公开独立入口为 `https://inverter.carlwang.cn/`，根路径 302 到 `/settings`。旧 `wattdesk-preview` 长分享链接、`/inverter` 应用别名和 `www.carlwang.cn/inverter` 备用入口均已删除，不得恢复。
- **独立隔离**：`wattdesk-inverter-preview` Worker 只允许 `/settings`、`/src/*`、`/home-assets/*` 和独立 `robots.txt`，其他 WattDesk 路径返回 404。它只代理主站同一设置模块，不复制页面代码；主站内容更新后独立预览自动同步，只有代理策略或域名变化时需重新部署 Worker。
- **独立主题**：standalone 每个新标签首次打开默认浅色，使用 `wattdesk-standalone-theme` 标签页 `sessionStorage`，不继承主站深色偏好。底部主题按钮使用共享 `createStandardButton()` 与 Glass Surface，距视口底边 `32px`，只属于独立预览；不得把主站默认主题改为浅色。
- **页面功能最终态**：设备模式同步、非模式页不回写设备模式、timeout 0、功率因数 `-1–1`、4 位 Check code、普通 Save 单条多字段 Operation Log 和按页 Save/Cancel/dirty 均保持有效。
- **组件最终态**：`settings-options.js` 是页面枚举唯一预览源；页面通用按钮、开关、分段、Select、滚动、时间、模态、玻璃、浮层和图标继续走共享入口。Figma 明确写死的局部几何不强行 token 化。
- **文档最终态**：Inverter settings 详细契约只在 [INVERTER-SETTINGS.md](./INVERTER-SETTINGS.md)；文案改前/后、功能差异、来源哈希分别由页面目录三个审计文件负责；经验文档只保留可复用根因和验收。
- **验证结果**：`npm run check` 通过（107 个 JS 文件）；Inverter settings 专项通过；公开构建通过（289 文件，约 2.84 MB）；`git diff --check` 通过。线上根路径与 `/settings` 可访问，独立域名 `/home`、`/plants` 和旧 fallback 均返回 404。
- **一次性事项**：备份快照、本轮提交和具体线上检查结果只属于 2026-11-20 的交付记录，不升级为全站长期规则；长期规则已提炼到 `AGENTS.md`、设计/组件规范、页面契约、发布/路由规范和防回归清单。

### 归档口径与证据边界

- 本次归档基于当前可访问的对话记录、当前工作树 `git status` / `git diff`、运行代码、专项测试与现有文档。其他并行对话无法直接访问，未出现在当前记录、代码或文档中的要求不作推断。
- 本文件顶部的 2026-11-20 条目、`AGENTS.md`、`DESIGN-SYSTEM.md`、`docs/COMPONENTS.md` 与 [INVERTER-SETTINGS.md](./INVERTER-SETTINGS.md) 共同构成当前交接入口；页面 README 只作指针，同日更早条目只用于追溯。
- 当前有效参数以运行代码和专项断言为准，例如 switch `600ms / 480ms`、分段 `600ms`、条件卡 `280ms`、Running Mode `320ms`、页面交叉淡变 `260ms`。被覆盖的中间时长和方向位移不得恢复。

### 今日最终规则分类索引

- **全局与动效**：共享 switch、分段控件、条件卡高度、页面转场、Depth Reveal、toast、滚动反馈和 Reduced Motion 均使用共享组件/token；禁止页面复制时长、缓动或浮层行为。
- **共享组件**：`createToggleSwitch()`、`createSegmentedControl()`、`createSelectControl()`、`createScrollFeedback()`、`createBottomScrollGuard()` 和 `createModalDialog()` 是唯一入口；页面只传业务语义、选项和回调。
- **设置页视觉**：字体由语义角色约束，数字字段、Operation Log、表格、卡片间距、开关/分段、状态色和图层阴影统一走共享规则；主页面、Grid 子页和响应式断点不得继续写页面私有替代样式。
- **输入与校验**：数值范围集中到 `settings-validation.js`；非法值保留，输入、单位、描边转红并带淡红底；提示行内显示、贴近输入框、按真实输入框右缘对齐并增加真实行高；深浅主题的 hover/focus/输入中状态均保持红色；修正在 `280ms` 卡片生长中清除。
- **Inverter settings 页面行为**：导航 DOM 保留，页面切换同步 `260ms` 互补交叉淡变；首次访问顶部、回访恢复该页位置；旧页固定快照、不可交互；标题层不整体淡变；Grid 二级栏、保存/取消/切页确认、Check code 门禁和关闭弹窗按页面作用域工作。
- **响应式与布局**：主页面常规内容列 `640px`，Grid 子页 `560px`；状态窗 `≤900px` 三项网格、设置导航/操作按钮 `≤680px` 收缩、Economic 表格在窄屏重排；所有布局变化保留原视觉边界，不产生横向溢出或中间空帧。
- **开发约定**：局部视觉任务使用 `npm run check`、对应页面专项和必要的共享消费方专项；全量 `npm test` 只在用户明确要求时运行。规则归档只更新文档，不修改运行代码、UI、资源或测试。

### 明确废弃的最终方案

- 废弃单一全局 dirty 基线、跨页 Save/Cancel、等待确认弹窗完全退场后才切页；废弃把 Grid 全部 `g` 当作一个保存域。
- 废弃页面切换的方向位移、缩放、模糊、先退后进、中间空洞、旧页可交互、两页文字同时清晰；废弃通过整层透明度动画破坏标题 Gaussian blur。
- 废弃 switch 旧 `420ms / 380ms`、分段旧 `320ms` 与 `-0.5px` 文字补偿、条件行整卡淡入/硬跳；废弃重绘时替换运动控件 DOM，或延迟依赖内容等待动画。
- 废弃页面私有分段几何、选择器结构、按钮材质、时间格式和滚动条；统一使用共享组件与 token。
- 废弃只靠顶部 toast 表达输入错误、错误态被主题 hover/focus 覆盖、提示只占用原有行内留白、Economic 错误提示贴整行右缘、非法输入自动归零；废弃把本地 preview 范围视为固件规格。

### 尚未明确或未接入

- 生产点位 `label / unit / min / max / step / enumList` 仍待后端提供；当前 `settings-validation.js` 只是 preview fallback。
- `Output_Capability_Mode` 是否正式新增、`Rated / Overload / Underload` 的数值枚举和发布条件仍待固件确认；`ActivePower_Limit_Source` 的枚举标签与 tone 由后端点位元数据提供。
- 认证操作者、服务端 Save/Cancel/权限、真实设备写入、历史聚合和跨会话持久化尚未接入。
- Inverter settings 的产品命名、页面结构与档案和演示数据边界仍以 [COPY-AUDIT.md](../design-preview/src/pages/inverter-settings/COPY-AUDIT.md) 的 `Still open` 为准，未获确认前不据本地原型推断生产规则。
- Site details 超长标题最大高度/折叠方式、SettingsCard 是否抽共享、菜单字体未定项等历史待确认项继续有效，不能用本次归档擅自定稿。

- `2026-11-20` **Inverter settings 文案校订落地**：限制页统一为 `Import & Export Limits`、`Export limit`、`Import limit`；Running Mode 六个选项统一为 `General Mode / Peak Load Shifting Mode / Economic Mode / UPS Mode / ToU mode / Off-Grid Mode`；Economic Schedule 使用 `Charge by PV Only`；MPPT 字段统一为 `MPPT Input`、`MPPT #1–#4`、`Parallel MPPT Operation`，相关日志同步为 `MPPT #N input`。
- `2026-11-20` **Grid & Protection 使用设备 Check code**：门禁不再使用独立六位 safety code。它读取 Devices 同一设备的 4 位 `Check code`，输入四个数字格，本地预览显示 `Prototype Check code: <device code>`；成功条件、错误反馈、门禁退场和布局补偿保持不变。
- `2026-11-20` **纯日期统一走共享格式**：`foundations/time.js` 新增 `formatAbsoluteDate()`，输出 `YYYY/MM/DD`；Parameter Export 的 `17.11.2026` 已改为 `2026/11/17`。相对时间和带时分的时间继续使用现有 7 天规则与 `YYYY/MM/DD HH:mm`。
- `2026-11-20` **文案改动与待决项归档**：`src/pages/inverter-settings/COPY-AUDIT.md` 现在同时记录已完成项的改前/改后和尚未批准的页面结构、术语、档案清单及演示数据问题，供直接回退与后续选择。
- `2026-11-20` **设置初始模式与设备状态同步**：设置窗口创建模型时从设备当前模式初始化 Running Mode；当前 p25 设备显示 `ToU mode`，设置窗与顶部状态同步显示 `ToU`。Save 仅在当前页面为 Running Mode 时更新 `device.mode`，保存 Battery、Networking 等其他页面不再意外把设备模式改成 General。
- `2026-11-20` **设置合法值修正**：`Command timeout` 最小值改为 `0`，表示不超时；固定功率因数与 cos φ 曲线范围改为 `-1–1`，允许原国别档案中合法的负 under-excited 值。Devices 的 Check code 掩码长度跟随实际值，不再固定为六个圆点。
- `2026-11-20` **普通设置 Save 写入 Operation Log**：当前页面保存时比较保存基线，将本次所有变更字段合并成一条新日志，每个参数独立一行并显示保存前/后值；Grid Code 切档与 Reload 继续保留自身即时记录，Save 不重复生成。当前仍使用本地预览操作者，生产需要与登录账户及 Check code 验证记录关联。
- `2026-11-20` **点位元数据接入边界**：当前 `settings-validation.js` 的 label/unit/range 仅作为后端未接入时的 preview fallback。生产必须由后端点位 meta 提供 `label / unit / min / max / step / enumList`，不能把这些本地值固化为固件规格。
- `2026-11-20` **本轮设置校订验证**：`npm run check` 通过（105 个 JavaScript 文件），`node tests/verify-time.cjs` 通过，`npm run test:file -- tests/verify-inverter-settings.cjs` 通过，`npm run build:site:public` 通过（287 个文件 / 2.87 MB），`git diff --check` 通过。专项覆盖设备模式初始化、非模式页保存不反向改写设备模式、timeout `0`、负功率因数、4 位 Check code 掩码与普通 Save 操作日志。
- `2026-11-20` **Inverter settings 上方状态窗入场**：每次设置窗通过共享 Depth Reveal 进入时，上层状态窗从 `translate3d(0,20px,0)` 使用 `--wd-motion-modal-content-in` / `--wd-ease-spring` 上浮归位。只能在应用 `data-ready` 后再经过两个 `requestAnimationFrame` 加启动类，避免直接刷新时动画在首帧可见前结束。该动画只作用于状态窗 transform，不得给玻璃宿主加局部 opacity / filter、不得带动下层设置窗、不得在页面切换或局部更新时重播；减少动态效果时不启动。
- `2026-11-20` **Inverter settings 上下窗倒影**：继续修改既有 `.isw-main-shell` 的向上 `box-shadow`，不新增伪元素或第二套投影。接触线为 `0 -1px 0 rgba(0,0,0,.06)`，渐变衰减为 `0 -10px 28px -10px`；浅色 `22%` 黑、深色 `34%` 黑，两种主题都必须保持黑色，不能改成白色或浅色反光。阴影不得写到共享 `.wd-glass` 宿主。
- `2026-11-20` **共享滚动反馈跟手性**：滑块在每个 rAF 读取最新 `scrollTop`，回弹期间也不得暂停；弹性状态下反向滚动立即清除 pull 并把当前滚轮事件交还 viewport，不能继续 `preventDefault` 导致页面停住。轨道滚轮按 `deltaMode` 归一为像素距离。该规则同时覆盖 Inverter settings 左右栏、Plants 筛选树与表格、Service Ticket 列表和回复输入等所有共享滚动调用方。
- `2026-11-20` **Running Mode 生长动画最终节奏**：旧卡收起与新卡展开统一使用 `320ms` 的 `--wd-motion-panel` / `--wd-ease-panel`，两个方向共享同一时间轴，不得让展开和收起一快一慢。说明文字只淡变透明度，不叠加 `translateY`；动画中再次选择时从当前可见高度和说明透明度续接，不能跳到上一目标。动画结束恢复 `height:auto` 并清理临时动画类，减少动态效果时直接切换。
- `2026-11-20` **设置页可访问名称与命中区**：所有 `.isw-number` / `.isw-mini-number` 在 hydrate 时自动补齐上下文名称，行字段使用标题和单位，表格字段使用行标题、列标题和单位，提示通过 `aria-describedby` 关联。共享 Select 改为“字段名: 当前值”并初始化 `aria-expanded=false`。Power limit info 扩为 `28px` 命中区，时间箭头 `32 × 36px`，网络复制值和日志账户名至少 `28px` 高，视觉尺寸不变。专项遍历全部主页面与 Grid 子页，断言无未命名输入。
- `2026-11-20` **设置表面深色阴影调淡**：Inverter settings 右侧内容母面板、panel、table、effective chain、SOC、gantt、plot、profile list 与 mode card 在深色模式保留共享 `1px` 中性内描边和 `0 0 4px` 外投影几何，但外投影统一调淡为 `rgba(0,0,0,.35)`，不再使用 `.wd-main-panel` 的纯黑投影；浅色模式继续使用共享轻阴影。专项比较母面板与全部卡片阴影，并断言深色外投影几何仍存在且 alpha 为 `0.35`。
- `2026-11-20` **底部操作按钮等宽加宽**：Inverter settings 的 `Cancel / Save` 在桌面统一为 `100px` 宽，继续使用共享 36px 标准按钮、8px 间距、居中和现有 Glass 材质；`680px` 以下两按钮等分可用宽度。专项断言两按钮实际宽度一致且不小于 `100px`。
- `2026-11-20` **设置页保存、取消与切页提示按页隔离**：`Save` 只把当前主页面或当前 Grid 二级页字段合入本地已保存聚合状态并更新该页基线；`Cancel` 只回滚当前页。Grid 二级页继续按字段路径拆分：Grid Code 负责 profile 标识和载入基线，其余子页只负责自己的表格、曲线和开关字段。当前页 dirty 时点击其他主页面或 Grid 二级页会用共享 `createConfirmDialog()` 显示带当前页名称的 `Keep Editing / Discard Changes`。Discard 必须在点击当下恢复该页基线并立即启动目标页交叉淡变，确认层退场与页面切换并行，不能等弹窗关闭后再导航。右上 X 退出仍检查全局未保存状态。专项覆盖主页面与 Grid 二级页提示、Keep Editing 留在原页、Discard 当下切页、旧页操作栏清除、跨 Grid 子页保存隔离，以及逐 profile 保存。
- `2026-11-20` **门禁解锁卡片位置冻结**：Grid & Protection 验证成功后二级栏从隐藏切换为 `208px` 列，原实现会把门禁卡向新内容列中心右移。现在解锁前记录卡片屏幕中心，布局变化后在退场动画期间用临时 X/Y transform 补偿，卡片保持原位置淡出；动画结束清理补偿。专项断言解锁瞬间卡片中心与解锁前误差不超过 `1px`，并验证临时 offset 在动画结束后清空。
- `2026-11-20` **Shared Menu 右对齐 helper**：`components/popover.js` 新增 `menuEndAlign(anchor,radius)`，统一按锚点布局右缘再外扩圆角值。共享 Select 与 Economic Schedule 行尾 `•••` 菜单均使用该 helper；后者的菜单宽 `180px`、圆角 `30px`，因此右缘比按钮布局右缘多出 `30px`。专项断言实际面板右缘与 helper 目标误差不超过 `1px`。
- `2026-11-20` **共享 Select 新增 Adaptive 变体**：`createSelectControl()` 正式支持 `variant:"adaptive"`，对应 `wd-select--adaptive`，统一承载 Economic 风格的自适应宽度、`36px` 高、`18px` 圆角、编辑表面、字体和箭头；共享菜单单选标记为 `18px`。Economic Schedule Mode、MPPT、Reactive Power、LVRT/HVRT 全部迁移到该变体，页面不再叠用 `.isw-eco-field.isw-eco-select` 或覆盖内部状态。
- `2026-11-20` **特殊色命令按钮统一**：Operation Control 中 `Power off`、`Restart` 使用新增共享 `warning` 橙红玻璃，`Reset all settings` 保留 `danger` 红色。warning / danger 共用 `.5px` 低透明描边、`1px / 2px` 轻阴影；默认文字保持对应色，hover / focus 使用同 hue 饱和叠加层，warning 为橙红组合、danger 为纯红，不混黑，按共享 `240 / 360ms` 渐入渐出，并切换为白色文字。
- `2026-11-20` **Inverter settings 字体角色统一**：`.inverter-settings-window` 新增 `--isw-type-*` 语义角色，集中管理标题、元信息、行标题、说明、表头、字段和数字。页面/窗口/导航标题统一 `18/590/24`，普通设置表头统一为 `12/400/16`、`32px` 高；移除被完全覆盖的旧分组标题声明。运行时审计遍历全部主页面、Grid 子页、门禁、选择菜单、邮箱浮层与设置弹窗，确认所有可见文本继承 SF Pro，字号限定在既定档位，字重仅 `400 / 510 / 590`。
- `2026-11-20` **可编辑字段字体修正**：Adaptive Select 与数字、百分比、时间字段统一为 `13 / 510 / 18`，不再沿用行标题的 `14 / 510 / 20`。Economic Schedule 的 Mode、百分比输入；Battery 数字字段；Reactive/Mini/Point 字段与其他设置页可编辑控件共用同一字段角色，几何尺寸和状态视觉不变。
- `2026-11-20` **数字编辑框状态层级增强**：`.isw-number`、`.isw-mini-number` 与 Economic 可编辑字段统一为默认描边 `10%`、hover 填充 `15%` / 描边 `26%`、focus-within 填充 `20%` / 描边 `46%` / 中性外环 `18%`。深色由白色主文字混合，浅色由黑色主文字混合；hover 与 focus 不再维持同一描边，二者均逐级增强并继续使用共享 `380ms` disclosure 节奏。专项覆盖深浅主题 rest / hover / focus 三态及外环强度。
- `2026-11-20` **数字编辑框阴影去白光**：数字控件的接触阴影与主题 Ink 解耦，深浅主题统一使用黑色；默认 `rgba(0,0,0,.2)`、hover `.3`、focus `.36`。修复深色 hover / focus 因使用白色主文字混合而出现白色光晕的问题，填充与描边状态层级保持不变。
- `2026-11-20` **浅色数字编辑框 hover / focus 与阴影减重**：浅色 hover 最终为 `6%` 填充 / `16%` 描边；focus 为 `12%` 填充 / `32%` 描边 / `12%` 外环；阴影在浅色主题单独降为默认 `.08`、hover `.14`、focus `.16`，解决表面与下沿同时过黑的问题。深色状态保持不变。
- `2026-11-20` **共享分段控件深色选中底增强**：分段控件新增独立 `--wd-segmented-control-indicator-fill`。浅色继续使用共享 `20%` 主填充，深色从原 `36%` 灰填充提升到 `rgba(120,120,128,.56)`，保证选中胶囊与玻璃轨道清楚分离；几何、`600ms` soft-spring 位移动画和快速连点续接不变。
- `2026-11-20` **通用底部滚动守卫**：新增 `components/bottom-scroll-guard.js`，由 `createScrollFeedback({preserveBottomOnShrink:true})` 统一托管。Inverter settings、Plants 列表 / 详情、Plants Devices 设置区和 Service Ticket 列表 / 详情均已接入。视口在底部且最终内容变短时，以 `.wd-scroll-shrink-spacer` 保留旧滚动范围并按 `280ms` `--wd-ease-content-settle` 回落；内容增长只更新基线，不触发缓冲或上移。共享组件专项与 5 个消费页面专项通过。
- `2026-11-20` **底部收缩误判修正**：共享守卫只响应最终内容变短；Grid Connection 从 Ramp 切到 Step 会新增说明，因此保持原滚动位置，不创建缓冲，也不再向上跳。Inverter settings 与共享组件夹具均加入逐帧回归。
- `2026-11-20` **Frequency-Watt 首内容留白统一**：页面正文首个元素为 `.isw-note` 时清除通用负上边距（`margin-top:0`），实际标题到首个说明恢复为 `18px`，与其他 Grid 子页首内容一致；后续说明到卡片仍保持共享 `10px`。
- `2026-11-20` **Frequency-Watt 输入框与内容对齐统一**：两组保护的数字输入均固定为标准 `128 × 36px` 并与卡片内容右缘对齐，字段内部数值与单位通过 `flex-end` 整体贴右；输入不再按内容自动收窄，分段选择与开关几何不变。
- `2026-11-20` **Inverter settings 输入范围与行内错误**：新增集中式 `settings-validation.js` 原型范围。所有数字字段 hydrate 时写入有限 `min/max`，越界/非数字保留输入，数值、单位与描边转红并增加低透明度淡红底；浅色和深色主题的 hover、focus-within 与正在输入状态均保持红色体系。普通与结构化错误行使用 `2px` 紧凑间距，Economic 多列表格提示右缘对齐实际出错字段，修正后立即清除。错误提示在原行节奏之外增加真实高度：Economic 行使用独立上下缓冲，普通表格行增加 `6px` 上下内距，卡片和相邻行不再被挤压。提示节点增删以共享 `280ms` content-grow 动画推动卡片高度。Economic Schedule 百分比与时间范围复用同一行内错误通道，不再只依赖顶部 toast。专项验证 Economic 与 Point Table 的错误行高、卡片高度均实际增长，并覆盖非法值、持久显示、红边淡红底、浅色聚焦错误态、提示位置与对齐和修正清除。
- `2026-11-20` **设置页左导航顶部渐隐**：`.isw-nav-scroll` 的 alpha mask 调整为 `24px` 平滑多段曲线，并且只在 `scrollTop > 1px` 时启用；回到顶部立即移除，消除静止时的渐变线。遮罩附着于滚动视口，不增加实体色条、分割线或阴影，`≤680px` 横向导航自动关闭。
- `2026-11-20` **Inverter settings 卡片与说明间距共享化**：`.isw-page` 使用 `--isw-card-gap:30px` 控制 panel、table、effective chain、SOC、gantt、plot、profile list、mode list 等卡片之间间距；新增 `--isw-note-gap:10px` 控制所有 `.isw-note` 到上方卡片的距离，并移除 Grid 与 Economic Schedule 的局部正负 margin 覆盖。Economic Schedule `24h Overview` 与 `Schedule periods` 保持卡外标题，标题距卡 `7px`。逐页回归检查两个共享 token、每页卡片 `margin-bottom` 和信息说明实际距离。
- `2026-11-20` **Economic Schedule Overview 上下留白最终值**：`24h Overview` 卡片改为上内距 `28px`、下内距 `18px`，左右继续使用 `--isw-card-inset`；时间轴、图例、卡片宽度和分组间距不变。专项断言上/下 padding 分别为 `28px / 18px`。
- `2026-11-20` **Grid & Protection 门禁接入共享页面转场**：门禁不再在 `renderPage()` 后直接切换 `hidden`。进入、离开和解锁统一使用页面切换的 `260ms` duration/easing 与当前 opacity 起点；退场立即 `inert`，结束后才隐藏，快速反向从中间透明度续接。专项覆盖进入、退出、解锁三条动画及与 incoming/outgoing page 的时长/曲线一致性。
- `2026-11-20` **Operation Log 时间、账户、列宽与多参数记录**：表头复用 Economic Schedule 的 `12px / 400` 表头几何，行内时间、参数、原值、新值、箭头、操作人统一 `12px`。三列最终为 `112px / minmax(0,1fr) / 112px`，压缩两侧列，把剩余宽度交给 Change，表头与正文同列移动。时间改用共享 `createTimeLabel()`：7 天内相对时间，7 天后本地绝对时间，并保留 `datetime` / `title`。操作人显示账户名，hover / focus 出现按内容自适应并与账户名居中的共享 Glass 邮箱浮窗；邮箱可点击复制、只显示下划线反馈和 toast。浮窗内部灰色 burn 暗影、邮箱 hover 背景、圆角与内阴影均已移除。演示数据扩充为 9 组、含多个多参数提交，每条参数独占一行并允许自然换行。专项覆盖列宽、标题对齐、语义时间、统一字号、多行记录、无横向溢出、浮窗尺寸/居中、透明 hover 和复制行为。
- `2026-11-20` **Grid Connection 卡片与全局偏差条清理**：Grid Connection 首尾两个窗口卡统一使用 `48px` 行高、上下 `6px` 内距，左侧标签改用普通卡片标题的 `14px / 510 / 18px` 主文字色，右侧改用标准 `128px × 36px` 字段并右对齐。设置页所有偏差状态只保留计数和说明；开关、分段、数字及其他控件都不得再绘制橙色行首偏离条。专项回归覆盖两张窗口卡的行高、字体、字段尺寸/右缘，以及开关、分段和普通偏差行 `::before` 均为 `none`，并输出 `inverter-grid-connection-final.png`。
- `2026-11-20` **共享 Select 视觉与字段选择迁移**：Reactive Power 与 LVRT/HVRT 的行为选择统一使用共享 `createSelectControl({variant:"adaptive"})`，并与 Economic Schedule Mode、MPPT Scan interval 共用同一 Adaptive 变体，不再出现固定宽度、分段控件或页面自拼选择器。旧的 `.isw-eco-field.isw-eco-select` 双类组合不再作为有效变体。共享菜单单选标记为 `18px`，选择后关闭、回调并归还焦点；页面只传业务选项、菜单宽度与业务更新。Reactive 条件区独立数字字段保持 `128 × 36px`。专项回归覆盖 Reactive 七项、LVRT/HVRT 三项、共享 Glass listbox、最长文案、焦点与三张截图。
- `2026-11-20` **Reactive Power 曲线点表统一**：Q(U)、cos φ(P)、Q(P)、cos φ(U) 四类点表新增 `.isw-point-table` 规范。表头复用 `.isw-quiet-table-head` 的 `12px / 400`；行高至少 `48px`、上下 `6px`；Point 标签最终统一为 `13px / 18px` 主文字色；数值字段统一 `112 × 36px` 并在列内居中；Voltage、Active power、Reactive power、cos φ 表头与字段中心对齐。专项覆盖表格宽度、表头字体、行节奏、标签字体、字段尺寸与表头中心线，并输出 `inverter-reactive-point-table.png`。
- `2026-11-20` **Grid & Protection 导航记忆、输入框与开关状态收口**：首次进入 Grid & Protection 使用 `Grid Code`，之后在设置窗口会话内恢复上次二级页；主页面按页、Grid 按二级页分别记忆内容滚动位置，左侧导航轨也保持原滚动位置。二级导航桌面宽 `208px`，顶部和左右内距统一为 `18px`，行内水平内距 `12px`，最长标签保持单行；hover / selected 为半圆胶囊。所有 Grid 子页卡片保持居中 `560px`，标题层与卡片外框同宽同左缘，标题文字内收 `24px`。Grid Code 档案行 hover 铺到卡片边缘且内容线不变；选择标记复用 Running Mode 的 `18px` 对号 / 空心圆。Protection Limits 表头复用 Economic Schedule 样式，Setting / Trip time 与字段中心对齐；行高至少 `48px`、上下各 `6px`，输入框最宽 `112px` 并在列内居中；前两列固定 `140px / 54px`，阶段符号居中并左移 `6px`。开关驱动的偏差状态不再显示左侧橙色竖条。专项回归覆盖导航/滚动记忆、开关状态、输入宽度、表头中心线和符号位移。
- `2026-11-20` **Inverter settings Effective chain 字体与间距统一（历史记录；行结构已由 2026-11-24 四行 RO telemetry 覆盖）**：`Command timeout` 的实际字体为 SF Pro 字体栈、`14px / 510 / 18px`、`-0.14px` 字距、主文字色；当时 Effective chain 仍是 `13px / 400`。现将文字统一到同一 computed type style，行高从 `34px` 调为 `36px`，列间距从 `12px` 调为 `14px`，标签列从 `160px` 调为 `170px`。当前行结构、Limit source 处理和数值列宽以顶部 2026-11-24 规则为准。
- `2026-11-20` **Grid & Protection Continue 使用共享主按钮**：门禁 Continue 从共享中性按钮改为 `createStandardButton({variant:"primary"})`，直接复用全站蓝色玻璃主按钮、白色文字和交互状态；同时保留门禁现有整行宽度与 `38px` 高度。
- `2026-11-20` **Grid & Protection Check code 焦点态**：首次按 Running Mode 的浅色 60% 选中混合实现后，小输入格中与空闲态的 alpha 仅差约 `1.6%`，肉眼难辨。现在焦点格使用完整 `--wd-control-selected` 填充和 `1px` 中性描边，去掉蓝色 outline；与空闲格的填充 alpha 差约 `8%`，尺寸和间距不变，错误态红色描边仍由 `.isw-code.is-error` 覆盖。
- `2026-11-20` **修复 Inverter settings 切页尾段闪回**：此前旧正文和标题只使用 `80ms` 淡出，而新页接力约 `180ms` 才结束；旧动画没有保持终态，80ms 后透明度回到基础值 `1`，旧页在随后约 100ms 内重新以全亮状态覆盖新页，形成“卡顿跳一下”。现在新旧接力动画都保持终态，旧层在结束到移除之间保持透明。
- `2026-11-20` **恢复可感知的渐出渐入并消除中间空档**：最终使用同步互补交叉淡变，旧、新正文和标题都在第一帧开始，共用 `260ms` 与同一条平滑曲线。新页在交叉期间位于旧页上方，标题与正文共用同一时间逻辑，旧、新标题 label 保持同一 X/Y 坐标；专项断言中间帧两页透明度之和接近 `1`，不能出现内容密度明显塌陷的空档。
- `2026-11-20` **恢复切页后的标题高斯模糊并消除叠字**：此前将整个 `.isw-title-layer` 放入透明度动画，透明合成使标题内部 `backdrop-filter` 无法正确采样背景，同时整层旧标题 ghost 与新标题叠加。现在固定标题层始终 `opacity:1`，只对内部 `.isw-title-label` 做接力；旧标题 ghost 也仅作为文字节点存在，页面结束后与正文一起移除。滚动时标题继续显示 `blur(18px) saturate(1.2)`。
- `2026-11-20` **切页首帧直接使用目标页位置**：此前从已滚动页面切到另一页时，新页先继承来源页 `scrollTop`，随后才跳走。现在每个主页面与 Grid 二级页各自记录位置：首次进入或没有记录时，替换 DOM 的同一任务内设为 `0`；返回已访问页面时，同一任务内直接恢复该页记录，绝不继承来源页。旧页在退场时以 `top:-previousScrollTop` 冻结原视口位置，再保持透明接力。专项覆盖首帧无记录回顶、回访恢复、旧页视觉坐标和局部刷新保留滚动。
- `2026-11-20` **修复分段胶囊连续点击跳动**：原实现先取消旧动画，再读取指示层位置；cancel 后元素立即回到上一次端点，导致连续点击时胶囊先跳回再起飞。现在先捕获当前实际边界，把该位置写回后取消旧动画，并以该中间位置作为下一段 `600ms` 动画起点；ResizeObserver 在动画中也保持当前位置续接。共享组件与 DI Port 专项均覆盖连续切换位置连续性。
- `2026-11-20` **修复进入 Grid 时旧页横向跳动并减少 DOM 成本**：Grid & Protection 的 `208px` 二级列会在页面替换前改变 `.isw-body` 网格宽度，旧页继续留在内容列时会先向右移动。现在退场旧页节点直接从内容列移出，作为独立 `inert` 快照固定在切换前 viewport rect 的 left/top/width；不深拷贝整页，新页直接使用目标布局并交叉淡入。专项覆盖子导航展开后旧页 X/Y/宽度不变、新页使用目标宽度；该探针首次进入且目标页无记录，因此滚动位置为顶部，不能据此改成每次强制回顶。
- `2026-11-20` **Grid 二级栏接入统一交叉淡变**：进入 Grid 时二级导航不再提前完整显示，而是从 `opacity:0` 与正文、标题一起在 `260ms` 内渐入；离开时即时移除真实网格列，并用固定位置快照同步渐出。回归覆盖进入起点为透明、离开起点为全显、快照 left/top/width/height 不变，以及进出动画与页面共用同一 duration/delay/easing。
- `2026-11-20` **修复开关轨道颜色直接跳变**：`color-mix()` 轨道色只靠 CSS `transition: background-color` 时，Chromium 实测会离散替换到终点。现在 `createToggleSwitch()` 先读取当前计算色，再通过 `480ms` WAAPI 插值到目标色；同值 `setValue(...,{notify:false})` 不再取消动画，页面局部重绘后滑块与轨道都继续。专项断言第 `130ms` 颜色既不是起点也不是终点，并锁定 WAAPI duration/easing。
- `2026-11-20` **修复 Device Features 卡片宽度**：该页三个面板误带 `isw-panel--narrow`，实际宽 `560px`，与标准设置页 `640px` 内容列不一致。现已恢复普通 `.isw-panel` 并撑满页面列；专项断言三张卡宽度均等于所在页面内容宽度。
- `2026-11-20` **快速连续切页不再瞬回全亮**：新一次切换开始时，先捕获当前页面与标题的真实可见透明度，取消上一轮动画时保留该中间值，再从该值开始淡出。专项覆盖旧页中间帧、尾帧保持透明、快速切到第三页时透明度连续，以及最终页面与标题正常落位。验证：`verify-inverter-settings.cjs`、`verify-motion.cjs`、`npm run check`、`git diff --check`。

## 2026-10-30 本对话规则归档

- **全局视觉**：浅色主题使用中性灰 `#EDEDED` 画布、`#F7F7F7` 工作区面板，去除冷蓝偏；浅色 Home 统计 / 业务数据卡使用纯白底。深色主题保持原值。主面板浅色不绘制内外描边，阴影最终为 `0 2px 3px rgba(0,0,0,.035) + 0 4px 9px -3px rgba(0,0,0,.05)`。
- **页面外壳**：Home 以外的新页面统一沿用 Plants：右侧工作区根视图透明满宽，共享 40px 面包屑页头固定，正文在下方独立滚动。密集表格与设备清单继续铺满；设置、详情和资料页使用共享 `.wd-page-content`，最大宽度 `--wd-page-content-max`（当前 `1000px`）并在工作区内居中，内部卡片和网格撑满该列。页面内距以 `--wd-page-inset` 的 `24px` 当前基准为准，不叠加 Home 的 `48px` 阴影 gutter。
- **共享组件**：页头图标+文字动作使用 `createPageHeaderAction()`；所有搜索字段使用 `createSearchField()`，放大镜默认 Secondary；全站时间使用 `foundations/time.js`，7 天内相对显示，7 天后显示本地绝对时间。
- **Plants Status**：`Normal / Attention` 图标必须同时使用 `.plants-icon` 基础遮罩绘制类和状态色；`Unbound` 使用内联 SVG。三类状态都显示图标 + 同色文字，图标 14px、图文间距 4px。
- **Plants**：筛选条使用 `Backgrounds/Tertiary Elevated`，深色为 `#3A3A3C`、浅色为纯白；表头与数据滚动区分成两个同步表格层，深色表头透明显示父面板背景，浅色表头使用主面板同色，工具栏和表格主体透明。搜索字段位于筛选条与表头上方，避免投影被后续表面覆盖。
- **Service Ticket**：可读性 token 只覆盖内容容器，不污染页头 / 工具栏 / 搜索框；票号作为 Properties 列表第一项，`Ticket ID` 标签在上、复用列表样式的小胶囊在下；内联回复 hover / focus 只高亮占位文字，不改变左侧头像。
- **已废弃方案**：浅色纯白主面板与白到灰渐变、1px 白描边和更重阴影、带冷蓝偏的中性色、36px 玻璃页头文字按钮、透明 Plants 筛选条、票号放在 Properties 标题右侧或胶囊在标签上方、整个 `.service-view` 的可读性 token 覆盖、各页面私有相对时间格式化。旧记录仅作历史，不得恢复。
- **Service Ticket hover 点阵**：PixelCard 支持独立 `colors / lightColors / glowColor / lightGlowColor`。Service Ticket 深色继续使用白色点阵，浅色改用共享 `Labels/Secondary` 深色 ink，保证整卡及底部清晰；glare 与编号扫光仍为白色。默认态仍完全透明，点间距、展开时长和清理逻辑不变。
- **共享头像尺寸档位**：`createAvatar()` 根据直径设置 `compact / small / regular`。22–24px 头像缩写为 `9px / 10px`，25–32px 为 `11px / 13px`，33px+ 为 14px；Service Ticket 列表卡片使用 compact 档，Properties 不再单独覆盖字号，评论区和账户头像保持原尺寸档位。

## Inverter settings 综合基线（2026-11-19 起；2026-11-24 更新）

本节保留 Inverter settings 的完整功能与视觉基线，并吸收 2026-11-20、2026-11-23 与 2026-11-24 已确认的最终修正；
与顶部 `2026-11-24 当前规则归档` 冲突时，以顶部最新条目、`AGENTS.md`、
`DESIGN-SYSTEM.md`、`docs/COMPONENTS.md` 和页面 README 为准。下方“当前实现”
只保留逐轮过程。

- **功能基线**：逆变器设置仍以 `资料\逆变器设置更新 261119` 为唯一功能来源，页面、字段、文案、条件、18 个国别档案、安全门禁、维护页和本地会话状态不得因视觉整理丢失。
- **页面外壳**：稳定路由 `/plants/:id/devices/inverter-settings?device=inverter&serial=<SN>`；同一工作区标签内 route-backed modal。上层状态窗较矮、较窄，仅顶部两角圆角；下层设置窗常规圆角，两者贴合并由下层 `.isw-main-shell` 向上投影。
- **材质**：上下窗共用同一 Glass Surface tint、blur、optics；浅色禁止上层本地 `98%` 或近实心白填充。层叠倒影沿用既有 `.isw-main-shell` 向上 `box-shadow`，不新增伪层：`0 -1px 0 rgba(0,0,0,.06)` + `0 -10px 28px -10px`，浅色 `22%` 黑、深色 `34%` 黑，两种主题都保持黑色。
- **标题与回弹**：标题、标题 blur 和 1px 规则位于滚动与 elastic transform 之外的 `.isw-title-layer`；顶部/底部回弹只移动正文。禁止重新使用 sticky 标题或反向 transform 抵消。
- **右侧内容**：右侧 `.isw-body` 使用共享主面板材质，右/下各内缩 `12px`；卡片使用 `--isw-card-inset:24px`，标题、正文、info、说明通道复用同一内容线。页面内容列固定 `640px`，卡片之间使用 `--isw-card-gap:30px`，info 到上方卡片使用 `--isw-note-gap:10px`。
- **文字与卡片**：标题使用主文字色；说明使用次级色，重点词使用 `70% secondary + 30% primary` 且不放大字号。分组标题 `12/590/16`，行标题和值 `14/14 medium` 主色，说明 `12/400/16` 次级色。Effective chain 三行统一 `14/510/18`，行高 `36px`、列距 `14px`，数值行网格为 `170px / 1fr / 108px`；首行 Effective power limit 使用蓝色条，并通过 `16px` 间隔和全宽分隔线与 Limit source / PV curtailed 分组；Limit source 行不绘制空进度轨。卡片到说明文字使用共享 note gap `10px`。
- **数字字段**：完整字段 `128×36`、18px 圆角，与上方 segmented 同宽同右缘。默认 `10%` 中性描边；深色 hover 为 `15% / 26%`、focus 为 `20% / 46% / 18%` 外环；浅色 hover 为 `6% / 16%`、focus 为 `12% / 32% / 12%` 外环。阴影在深浅主题均为黑色，禁止深色白色光晕；单层 1px 描边、1px 固定虚化轻阴影、禁止上下步进按钮。单位与数字同字体同字号，仅颜色更浅，固定 `6px` 间距和右侧安全距。
- **控件动效**：共享 switch 使用 `600ms` soft-spring、`480ms` 轨道颜色；分段胶囊复用同一 `600ms` 节奏，标签偏移为 `0px`。页面重绘必须保留并重新挂回同一控件 DOM，依赖内容立即更新；条件行用 `280ms` 卡片高度生长/收起。
- **页面切换**：左侧导航保留 DOM，选中层和正文、标题文字采用同步 `260ms` 交叉淡变，旧、新透明度互补，新页位于旧页上方，中间不出现内容密度塌陷的空白。新页首帧应用自己的目标位置：首次访问为 `scrollTop:0`，回访恢复该页记录且不继承来源页；退场旧页节点直接从内容列移出，作为独立 `inert` 快照按切换前 viewport rect 固定 left/top/width 后淡出，不深拷贝整页。Grid 二级栏进入时与正文同步渐入，离开时用固定位置快照同步渐出，父布局变化不能推动旧页。固定标题层本身保持不透明且不挂 opacity 动画，旧标题 ghost 按旧 X 补正，以保留滚动时的高斯模糊。旧页结束后立即移除；全程不出现新页中部闪现、标题跳动、旧页横向位移、缩放、模糊或两页同时清晰。局部设置更新不重播页面入场并保留原滚动位置。分段控件连续点击和页面重绘均从当前胶囊位置续接，不重置到端点；开关轨道颜色由 `480ms` WAAPI 从当前颜色续接。
- **Economic Schedule**：时间输入为单一 8 位数字掩码，显示 `HH:MM – HH:MM`，分隔符固定、光标可替换中间数字、错误持续显示直到再次编辑；焦点离开字段才提交。右侧箭头独立开窗并在 hover / focus / 展开时转主文字色；滚轮循环 `00–23` 并居中吸附，浮层与内容共用退场。空草稿使用 `-- / -- % / -- kW`，仅 `--` 使用 Quaternary，单位保持正常色。百分比框适配完整 `100%`，表头 `32px / 12px / 400`，行尾更多操作 `36px` Glass，新增按钮右对齐，删除图标 `22px` 且危险态全程红色。
- **保存、切页与关闭语义**：当前主页面和当前 Grid 二级页分别维护自己的保存基线；`Save` 只提交当前页，`Cancel` 只回滚当前页。当前页 dirty 时切换页面先用共享 `createConfirmDialog()` 显示 `Keep Editing / Discard Changes`；Discard 在点击瞬间回滚当前页并启动目标页转场，确认层退场与其并行。只有 X 关闭，遮罩和 Escape 不退出；X 检查全局 dirty，未保存时使用同一确认组件，确认丢弃后才播放共享 `420ms` Depth Reveal，并在 `onClose` 后回路由。
- **Grid & Protection**：未解锁时二级列完全隐藏，门禁占满右侧内容区；输入同一设备的 4 位 `Check code` 后才显示 `208px + 1fr` 二级列及贯穿 1px 线。首次进入 `Grid Code`；后续切入恢复上次二级页，并恢复该页、其他主页面及导航轨的滚动位置。二级列表顶部与左右内距均为 `18px`，行内水平内距 `12px`，最长标签保持单行，hover / selected 背景为半圆胶囊。Grid 子页卡片统一居中 `560px`，桌面标题层与卡片外框同宽同左缘，标题文字内收 `24px`。档案行 hover 铺到卡片边缘且内容线不变；选择器复用 Running Mode 的 `18px` 对号 / 空心圆。Protection 表头复用 Economic 样式并让 Setting / Trip time 与字段中心对齐，行高至少 `48px`、上下 `6px`，输入框最宽 `112px` 并在列内居中，阶段符号列前两列 `140px / 54px`、居中并左移 `6px`。开关驱动的偏差状态不绘制橙色起始条。该行尾部箭头始终朝右。门禁说明用 Secondary、重点词 Primary，单行 `Prototype Check code: <device code>`，删除底部关闭/日志说明，锁为 19px；当前 Check code 输入格使用完整共享选中填充与 `1px` 中性描边，Continue 为共享蓝色主按钮并保持 `38px` 高度。
- **Toast**：页面级短反馈默认视口水平中心；数据页垂直中心读取当前可见面包屑标题的真实 rect，CSS `top:70px` 只作为无标题页面的回落。只有局部内容提示传 `{centerWithin}` 按容器实时中心。设置页保存/恢复/校验 toast 属于页面级，禁止旧 `calc(50% + 140px)` 或固定内容区偏移。
- **数据边界**：所有变更仍是本地预览；没有后端持久化、权限、真实固件、文件导出或硬件控制。

## 当前实现

说明：本节按时间倒序保留实现快照；同一主题存在多条记录时，较新的最终状态覆盖较早中间态。长期开发规则以 `AGENTS.md`、`DESIGN-SYSTEM.md`、`docs/COMPONENTS.md` 和页面 README 为准。

- `2026-11-20` **MPPT Scan interval 完全使用共享 Select 几何**：移除页面私有 `.isw-interval-trigger` 固定 `124px` 宽度，触发器现在由共享组件按内容自适应，并完整继承 `12px` 左右内距、`6px` 图文间距和 `14px` 箭头。浮层、选中态和业务更新路径不变。

- `2026-11-20` **MPPT 与 Economic Mode 共用 Select 变体**：Scan interval 与 Economic Schedule Mode 现在都使用 `createSelectControl({variant:"adaptive"})` 生成的 `.wd-select--adaptive`；旧 `.isw-eco-field.isw-eco-select` / `.isw-eco-select-value` 页面覆盖已废弃。组件统一提供编辑框材质、自适应宽度、内距、字体和箭头。

- `2026-11-20` **共享单选组件落地**：新增 `components/select-control.js` / `.css` 与通用 `selection/check-circle.svg`。`createSelectControl()` 统一生成选择触发器、箭头、`listbox` 菜单、选项选中态、关闭与焦点归还；Inverter settings 的 MPPT Scan interval 与 Site details 2 的选择字段已迁移到该入口。页面只保留尺寸、对齐、菜单宽度和业务回调，不再复制选择器内部结构。

- `2026-11-20` **Economic Schedule Mode 接入共享 Select**：Mode 触发器与浮层改由 `createSelectControl()` 生成，页面不再手写 `.isw-eco-mode-trigger` 菜单。触发器使用 `max-content / max-width:100%` 随当前模式自适应，浮层宽 `280px` 并完整显示 `Charge by PV and Grid`；空草稿仍通过共享组件的 placeholder 能力显示 `--`。

- `2026-11-20` **共享 Select 选中标记收紧**：右侧空心圆与实心 check-circle 从 `22px` 统一缩至 `18px`，与项目其他单选圆环一致；触发器、菜单宽度和选中逻辑不变。

- `2026-11-20` **共享 Select 浮层统一右对齐**：`createSelectControl()` 在 `align:"end"` 时使用触发器布局右缘加当前浮层圆角作为 `alignRight`。MPPT / Reactive Power 右移 `30px`，Economic Mode 同步改为右对齐，Site details 按自身 `24px` 圆角右移；视口夹紧继续由共享 popover controller 负责。

- `2026-11-20` **共享 Select 推广能力补齐**：新增完整键盘路径（ArrowUp / ArrowDown 循环、Home / End、typeahead、Escape / Tab 关闭回焦、打开聚焦当前项）、动态选项 API（`getOptions()` / `setOptions()` / `updateOption()`）和有限变体 `default / form / compact / table / adaptive`。独立组件回归覆盖键盘、禁用项跳过、选择后回焦、选项替换、重命名、值更新和清理。

- `2026-11-20` **CT 行距与状态色 + 门禁玻璃收口**：CT 结果行统一为 `50px` 高、上下 `9px`；左右使用标题字体，左侧次级色、时间主文字色，`Correct` 使用 success 绿色且圆点同步，`Reversed` 保持橙色。Grid & Protection Check code 卡改用静态共享 Glass Surface，移除本地实底、描边和投影，外圆角 `30px`，Check code 输入格 `12px`、Continue `18px`。

- `2026-11-20` **设备回传时间统一**：MPPT Last scan 与 CT Last check 不再保存或显示硬编码的 `11:02 today` / `10:47 today`，改存 `lastScanMinutesAgo` / `lastMinutesAgo` 并通过 `createTimeLabel()` 生成相对时间与 `<time datetime>`。CT 检查完成后 lastMinutesAgo 归零，显示 `Just now`，完整绝对时间保留在 `title`。

- `2026-11-20` **Inverter settings MPPT 扫描间隔改为单选**：`Shadow scan → Scan interval` 不再使用数字输入，改为共享 Glass Surface 菜单，固定提供 `5 mins / 15 mins / 30 mins / 1 h`。当前值显示在触发器并自动选中，选中项使用主题主文字色实心 check-circle，未选项使用中性空心圆；切换会更新设置、进入 dirty 并恢复触发器焦点。专项回归断言不存在数字输入、四个单选值、选中状态、图标形态和切换结果。

- `2026-11-20` **Inverter settings 纯展示数据行统一**：`.isw-row--readonly-data` 用于 Last scan、Active profile、认证标准寄存器和 profile 变更数。左右文字统一为标题的 `14/510/18` 字体几何；左侧纯展示标签使用 Labels/Secondary 浅色，右侧展示值使用 Labels/Primary。专项回归覆盖 Last scan 两侧字体签名与颜色层级。

- `2026-11-20` **Inverter settings Networking 地址表统一**：Address 表标签与右侧值复用上方卡标题的 `14/510/18` 字体几何，四行高度 `46px`；左侧标签使用 Labels/Secondary，右侧值使用 Labels/Primary。IP、Subnet、Gateway、MAC 改为真实复制按钮，默认无装饰，hover / focus-visible 显示 1px 下划线，点击复制原值并通过页面级 toast 反馈。复制监听已移入通用 `hydratePage()`，避免 Networking 等非 Economic Schedule 页面漏绑。专项覆盖字级、颜色层级、行高、复制值、hover 下划线与 toast。

- `2026-11-19` **Toast 分区居中**：移除共享 `#toast` 的旧固定偏移。页面级 `toast()` 以视口中心显示；只有限定在局部内容区的调用才传 `{centerWithin}`，由控制器在显示和视口变化时读取目标容器几何中心。Inverter settings 的保存、恢复和校验提示归为页面级顶部反馈，使用视口中心；专项断言 toast 不声明内容 scope、中心误差不超过 1px，且不会偏移到右侧设置面板。共享 floating-surface 专项继续锁定默认 toast 的视口中心。
- `2026-11-19` **Grid & Protection 二级列与门禁收口（历史中间态；Continue 材质由 2026-11-20 覆盖）**：把 `.isw-sub` 从主侧栏之外的独立网格列移入右侧 `.isw-body` 主面板，桌面为 `208px + minmax(0,1fr)` 两列，二级列使用贯穿整个内容面板高度的 1px 右边线。最终门禁规则要求解锁前隐藏该二级列，解锁后才显示。修复锁图标遮罩缺少 `.isw-icon` 基础类的问题；当时 Continue 改为共享中性 Glass 按钮，后续已升级为共享蓝色主按钮。
- `2026-11-19` **Grid & Protection 箭头方向固定**：左侧导航行的尾部箭头取消 `is-open` 时的 `rotate(90deg)`，始终保持右侧朝向；进入 Grid & Protection 页面不再通过旋转表达展开状态。专项断言进入后 computed transform 为 `none`。
- `2026-11-19` **Grid & Protection 门禁与文案收口（历史，已由 2026-11-20 Check code 规则覆盖）**：未输入正确安全码时二级列隐藏，门禁占满右侧内容区；通过后二级列才出现并恢复 `208px + minmax(0,1fr)` 两列与贯穿分隔线。门禁说明由 Tertiary 提升到 Secondary，重点词提升到 Primary；测试安全码改为单行 `Prototype safety code: 583411`，删除底部关闭/日志说明。专项覆盖锁定状态、解锁后二级列归属、文字颜色、单行测试码与移除底部说明。
- `2026-11-19` **Inverter settings 回弹固定标题层**：将页面标题从 `.isw-scroll` 内的 sticky 节点提取到 `.isw-title-layer`，该层是 `.isw-page-host` 的兄弟节点，不在共享 elastic 位移节点内。正文保留等高占位，普通滚动与顶部/底部回弹只移动内容；标题文字、背景模糊和 `1px` 规则在回弹前后坐标完全一致。专项回归同时触发顶部与底部 pull，断言标题层、文字、规则和 blur 固定，并继续断言正文仍产生共享弹性位移。
- `2026-11-19` **Inverter settings 上下窗物理层叠（历史建立；参数已由 2026-11-20 覆盖）**：为下层设置窗增加非玻璃 `.isw-main-shell` 外壳。2026-11-20 最终继续使用既有 shadow，而不是新增伪元素：接触线 `0 -1px 0 rgba(0,0,0,.06)`，渐变衰减 `0 -10px 28px -10px`，浅色 `22%` / 深色 `34%` 黑，两种主题都保持黑色。旧 `0 -5px 20px -6px`、`18% / 42%` 参数不得恢复。
- `2026-11-19` **共享开关切换动效**：`createToggleSwitch()` 的白色滑块改为从当前渲染位置启动的可中断 WAAPI 飞行，使用专用 `600ms` soft-spring 时长与曲线，前段缓起、中段约 `1.05 / .95` 轻微拉伸并越过目标约 `1.4px`，随后做 `0.55px / 0.18px` 的两级收摆；轨道 `background-color` 使用 `480ms` 缓入缓出先完成蓝色到中性色过渡，轮廓继续跟随滑块。Inverter settings 原先在 `onChange` 中立即重建页面，导致 switch DOM 在动画开始前被替换；初版修复把依赖内容延迟到动画结束，又造成明显滞后。现在由页面保留并复用同一 switch DOM，在立即重建依赖内容后把它重新挂回新行，因此开关动画连续、语义值/侧栏/Save 状态和下方设置区域都同步即时更新。快速连点会从当前中间位置反向；减少动态效果时不创建滑块位移。共享组件与 Inverter settings 专项均已覆盖实际中间帧、轨道颜色插值、布局盒稳定、同一 DOM 节点保留、依赖内容即时显隐、反向续接和 Reduced Motion。
- `2026-11-19` **共享分段控件胶囊动效与文字居中**：`createSegmentedControl()` 的选中胶囊改用共享 switch 的 `600ms` soft-spring 时长与曲线，并在 Inverter settings 重绘时与开关一样保留、重新挂回同一个分段控件 DOM，因此 Setpoint unit 等页面切换会看到真实滑动而不是瞬间跳到新选项。标签取消旧的 `-0.5px` 上移校正，`--wd-segmented-control-label-offset-y` 和最终 transform 均为 `0px`，浏览器实测文字盒中心与 36px 选项中心一致。快速切换继续从当前胶囊几何续接，依赖数字字段仍即时更新。
- `2026-11-19` **Inverter settings 条件行生长动画**：开关改变同一张设置卡内的条件行时，页面立即重建内容，但会按页面、分组标题和首行标识匹配同一张卡，记录旧高度并以共享 `280ms` content-grow 时长/缓动过渡到新高度。动画期间卡片只裁切绘制，保持宽度、圆角和内容几何，结束后恢复自动高度；快速反向点击从当前可见高度续接，并用版本守卫避免已取消动画清除新一轮样式。Export limit 的 Limit value、Device Features 的 Watchdog timeout、MPPT 的扫描设置等共享这一机制，开关节点自身动画不中断。
- `2026-11-19` **Inverter settings 页面切换动效（历史中间态，时长与标题合成已由 2026-11-20 覆盖）**：该版建立导航 DOM 复用与透明度接力；后续经历 `80ms` 空档、`180ms` 重叠和顺序接力仍偏空等中间态，当前已收口到旧、新同步 `260ms` 的互补交叉淡变。当前最终参数以本节顶部 2026-11-20 规则为准。
- `2026-11-19` **Inverter settings Economic Schedule 输入与密度收口**：时间字段左对齐并改为单一八位数字掩码输入，连续输入 8 位数字后自动生成 `HH:MM – HH:MM`，未填位显示 `_`，冒号与横线始终固定。光标支持定位并替换任意中间数字，Backspace / Delete 作用于光标邻位数字，落在分隔符时映射到相邻数字，不再固定裁剪末尾。格式、范围或重叠错误时保留输入并持续红显，不自动归零；再次编辑清除错误。只有焦点离开整个字段时才提交，箭头仍独立打开滚轮。浮层四边保持 `12px` 内距，开始/结束之间显示 `–`，每个滚轮使用固定中心灰底，内容与玻璃面继续通过共享 `_wdFade` 同步退场。百分比框收紧到能完整显示 `100%` 且不裁切，新增草稿使用 `--`（`-- %` / `-- kW`），仅 `--` 使用 Labels/Quaternary，单位保持正常文字色。Power limit 提示内部左右各 `16px`；Economic 表头高 `32px`、文字与 `Charge` 图例同为 `12px / 400`。列宽避免额定功率换行，行尾更多按钮左侧保留呼吸空间，新增按钮与其右缘对齐；删除菜单图标为 `22px` 并保持红色图标、文字和 `11%` hover 底。专项回归覆盖八位掩码、中间数字替换、光标退格、固定分隔符、持久错误态、迟到提交、箭头独立开窗、对称浮层内距、固定中心底色、同步退场、`100%` 完整显示、草稿单位占位、提示内距、表头样式、功率不换行、新增/更多右对齐及危险菜单状态。
- `2026-11-19` **Inverter settings 时间箭头与空值占位**：时间范围右侧下拉箭头默认保持中性灰；父按钮 hover、键盘 focus-visible 或浮层展开时，子图形改用 `currentColor` 跟随主文字色。Economic Schedule 空草稿的 Mode、Power 与计算 kW 统一显示 `--`，单位仍保留为 `-- %` / `-- kW`；只有 `--` 使用 Labels/Quaternary 浅色，单位继续使用正常文字色。
- `2026-11-19` **Inverter settings Economic Schedule 交互收口（历史中间态，已由上方规则覆盖）**：该记录保留了时间浮层循环与去除滚动轨道的实现过程；时间字段最终形态、箭头独立开窗、占位、居中对齐与删除图标尺寸以上方最新记录和当前运行代码为准。
- `2026-11-19` **Inverter settings 关闭校验与共享退场**：设置页复用共享 route-backed modal 的 `420ms` Depth Reveal 退场；点击 X 后先等待退出动画完成，再切回 Devices 路由，不再因路由立即卸载导致退场消失。设置页显式关闭 `closeOnBackdrop` 与 `closeOnEscape`，点击空白遮罩或按 Escape 都保持窗口。X 会按现有 dirty 基线检查未保存修改，并以共享 `createConfirmDialog()` 显示 `Keep Editing` / `Discard Changes`；前者回到设置页，后者才播放退场并返回。确认层叠在设置窗上时父窗暂时 inert，关闭确认后恢复。专项回归覆盖遮罩 / Escape 不关闭、确认文案与按钮、Keep Editing 返回、保存后 `data-closing` 期间窗口仍挂载、浅色模式 Discard Changes 后退出；同时更新 Economic Schedule 滚轮初始选中与测试等待，避免点击后立即关闭时的滚动吸附竞态。验证结果：`verify-inverter-settings.cjs`、`verify-plant-devices.cjs`、`npm run check`、`npm run build:site:public`（282 个文件 / 2.75 MB）和 `git diff --check` 均通过。
- `2026-11-19` **Inverter settings 上层状态窗材质统一**：移除浅色主题上层状态窗的 `98%` 主面板背景 fill 覆盖。现在上下两个窗口直接消费同一套共享 Glass Surface，实测均使用 `rgba(234,234,234,.44)` tint、`blur(9px) saturate(1.45)` 和相同 optics，不再出现上方窄窗接近纯白、下方窗口仍是半透明玻璃的割裂。专项回归改为逐项比较两层 fill background、backdrop、tint 与 optics。
- `2026-11-19` **Inverter settings 上方状态窗间距与状态收口**：左右内容线使用与顶部 `30px` 圆角相同的内距；身份行上下各 `10px`，结果区和指标区使用上 `7px` / 下 `6px` 并保持视觉居中，标签到数值的间距为 `2px`，功率到蓝色限幅说明的间距为 `8px`。左侧实际功率与蓝色限幅说明改用文字 baseline 对齐，并根据当前字体向上校正 `0.75px`，状态点和说明仍共享垂直中心。已连接绿点以 `1800ms` 低频呼吸闪烁，减少动态效果时冻结。顶部主文字统一为 `70%` 主色混合，进一步弱于常规纯黑/纯白。桌面六项状态保持单行右对齐，`≤900px` 改为三列；整卡字号为 `12 / 14 / 18px`。专项回归锁定内距、居中、baseline、间距、柔和文字色与状态动画。
- `2026-11-19` **Inverter settings 行提示宽度**：设置行左侧文案列改为弹性占满右侧固定控件之外的剩余空间，提示文字移除旧的 `330px` 上限并可占满文案列。右侧控件保持固定宽度和右缘，行间距仍为 `18px`；长说明优先自然利用空白，不再无谓提前换行。专项回归锁定提示实际宽于 `330px` 且与可用列宽一致。
- `2026-11-19` **Inverter settings 滚动跟手修正（已被 2026-11-20 共享层修复扩展）**：当前保留左侧导航与右侧内容的共享 elastic 回弹及轨道非边界直接滚动。2026-11-20 进一步要求：滑块在普通滚动和回弹中都按最新 `scrollTop` 同步；反向滚动立即清除 pull 并把当前事件交还原生 viewport；轨道滚轮按 `deltaMode` 转成像素距离。`Ctrl/Cmd + 滚轮` 继续保留系统缩放。
- `2026-11-19` **Inverter settings 数字输入统一（历史中间态；状态色与浅色阴影已由 2026-11-20 数字字段条目覆盖）**：完整 `.isw-number` 收口为 `128px × 36px`、`18px` 圆角，和同一行上方分段按钮同宽、同高、同右缘；`.isw-mini-number` 保持内容宽。浅色主题默认透明并直接透出卡片材质，只在 hover / focus-within 时显示反馈。字段使用单层 `1px` 低对比中性描边，不再叠加内描边环；阴影使用较短下移与固定 `1px` 虚化：默认 `0 1px 1px`、hover `0 2px 1px`。底色、描边和阴影过渡统一使用 `380ms` disclosure 节奏。数字弹性占宽，单位按内容自适应，两者固定 `6px` 间距，右侧保留 `12px` 安全内距，避免 `kW` 等较长单位贴边。数字与单位共用同一 SF Pro 字号、字重、行高和字距，单位只使用次级色；中间竖分隔线删除。组件内不再渲染上下调整按钮，点击步进逻辑移除；键盘方向键继续从 input 的 `data-isw-step-size` 读取原步长。专项新增宽度、右缘、单位自适应、安全内距、固定间距、浅色透明底、字体一致性、无分隔线、按钮不存在、键盘步长保持与阴影位移断言。
- `2026-11-19` **Inverter settings 固定标题描边**：标题底部 `1px` 描边横跨固定标题层，标题文字继续保持原左右内距。后续最终实现已把标题移出滚动内容；滚动判断继续测量首段正文是否实际压到标题底边，出现时用共享 `320ms` motion token 渐入，离开后用 `200ms` 退场 token 渐出，减少动态效果时直接切换。专项回归覆盖宽度、阈值、渐入、渐出与 Reduced Motion。
- `2026-11-19` **Inverter settings 保存操作闭环（历史中间态；保存/取消/切页作用域已由 2026-11-20 按页规则覆盖）**：底部 `Cancel / Save` 改为 dirty-driven，无真实设置变化时隐藏，修改后淡入；恢复基线或保存后淡出，滚动反馈的底部避让同步在 `34px / 104px` 间切换。操作层顶部增加 `1px` 低对比分割线。当时 `Cancel` 会回滚全部可保存状态；当前最终规则已改为只回滚当前主页面或当前 Grid 二级页。Running Mode 等已有动画的控件复用原动画返回，不重建页面闪现初始态。只有 X 可以关闭，遮罩和 Escape 不退出，未保存时先显示共享确认层。`Save` 成功后更新基线、隐藏操作层并显示本地保存 toast，异常路径显示失败 toast。dirty 比较排除页面导航、展开、解锁、日志、CT 与一次性操作状态。
- `2026-11-19` **Inverter settings Economic Schedule 可编辑化（历史首次落地，最终交互已由上方规则覆盖）**：该记录保留经济排程首次可编辑化的实现背景；当前以八位掩码、固定分隔符、四列循环滚轮、共享确认层和上方最终状态为准。
- `2026-11-19` **Inverter settings 内容框材质统一（历史中间态；Effective chain、常规表头与字体角色已由 2026-11-20 覆盖）**：右侧母内容区在共享主面板材质上叠加 `2.5%` 黑色透明层，因此比内部卡片略深；设置面板、表格、生效链、SOC、甘特、曲线、配置列表与模式卡全部复用未加深的 `--wd-main-panel-background` 和 `--wd-main-panel-shadow`。深色保留共享内描边与零位移投影，浅色移除内描边并只保留轻阴影；选中模式卡改用共享 `--wd-control-selected` 填充且不绘制描边，输入框、按钮和普通行不升级为卡片表面。卡片统一使用 `--isw-card-inset: 24px` 作为圆角，并以同一个变量控制内容、分组标题、info 和外部说明通道的左右内距。分组标题使用 `12px / 590 / 16px` 主文字色句首大写样式，行标题与数值使用 `14/14 medium` 主文字色，说明使用 `Caption1/Regular` 次级色。常规表头与 Economic Schedule 排程表统一以 2026-11-20 最终字体角色为准。info 图标到文字为 `4px` 且两者同色。重点词使用 `70% 次级色 + 30% 主文字色` 的中性强调，保持整句字号，不接近纯黑或纯白。页面标题可见文字与卡片内容共用 `24px` 左右线；Effective chain 的当前字体与间距以 2026-11-20 条目为准。
- `2026-11-19` **Inverter settings 局部更新稳定性（导航滚动语义由 2026-11-20 覆盖）**：开关、分段、数字、模式和行内操作修改不再重建侧栏或重播页面入场；内容重绘会保留 `scrollTop`、页面顶部位置和等效控件焦点，侧栏状态值原地同步。内容滚动容器关闭浏览器滚动锚定，并在新内容 hydrate 完成后恢复原滚动值，避免局部更新被自动补正。Grid profile 仅额外刷新二级导航。页面导航当前语义为：首次访问或无记录从顶部开始，回访恢复该页自己的记录。专项回归覆盖局部更新不位移、不淡入、不重建侧栏和焦点保持，以及页面级位置记忆。
- `2026-11-19` **Running Mode 卡片选中态与生长动效（尺寸/字体仍有效；动效已由 2026-11-20 覆盖）**：选中卡使用轻量选中填充和 `1px` 中性描边，浅色保持黑字、深色保持白字；hover / focus、`18px` 标记、`3px` 内容节奏和 `13/400/18` 次级文字仍有效。旧 `380ms` disclosure 已废弃；当前展开和收起统一使用 `320ms` 的 `--wd-motion-panel` / `--wd-ease-panel`，说明只淡变透明度，中断从当前可见高度与透明度续接。侧栏模式值列完整显示 `Peak Load Shifting`。
- `2026-11-19` **Inverter settings 独立页面与功能基线接入**：逆变器设置移入 `src/pages/inverter-settings/`，通过 `/plants/:id/devices/inverter-settings?device=inverter&serial=<SN>` 以 route-backed modal 打开。视觉使用上下两层窗口：上方为较短、较窄的设备状态窗，只有顶部两角圆角；下方为完整设置弹窗，常规四角圆角，两个窗口边对边贴紧，并以 `.isw-main-shell` 的轻阴影表现叠层。两层复用完全相同的共享 Glass Surface 材质和共享圆角 token。下方窗顶部是 `iHybrid settings` 标题和关闭 X（上、右内距同为 `20px`），左侧为 `288px` 透明、延伸到底部且支持分组折叠的侧栏式导航，导航与内容间不画竖分隔线。右侧设置区是共享 `.wd-main-panel`，向右、向下各留 `12px`，内层 `18px` 圆角与 `30px` 外窗圆角同心。页面标题、blur 与 1px 规则最终位于滚动和回弹节点之外的 `.isw-title-layer`；左右滚动轨使用共享 `createScrollFeedback({visibility:"hover",elastic:true,content})`。`Cancel` 只回滚，只有 X 关闭；Grid 门禁和展开细节以本节之后的最终条目为准。
- `2026-11-18` **浅色地图定位最终简化为纯色单点**：浅色模式保留 36px 透明按钮命中区，但视觉上只显示 8px 纯色 `--wd-accent-blue` 圆点；共享玻璃面、两圈波纹、`::after`、中央呼吸光晕、hover 指针高光、渐变、外描边、阴影和动画全部隐藏。深色模式仍保留原有玻璃与波纹。专项回归锁定浅色纯色背景、`box-shadow:none`、`animation:none`、玻璃/波纹/aura/glint 均为 `display:none`。
- `2026-11-18` **Hero 描边与地图宽度冲突已解决**：Hero 外层保留 `1px var(--wd-separator-nonopaque)` 浅描边，地图覆盖 Hero 的 padding-box 内容区，因此在 Hero 外宽 `1000px` 时地图宽为 `998px` 属于正确结果。核心规范、页面规格和专项断言均已统一为“地图铺满 Hero 内容区”，不再要求等于含边框外宽。
- `2026-11-18` **当日规则归档收口**：`AGENTS.md`、`DESIGN-SYSTEM.md`、`docs/COMPONENTS.md`、`docs/SITE-DETAILS.md`、`docs/USER-REQUIREMENTS.md`、`docs/PROJECT-STATUS.md` 与 Plants README 均以同一份最终快照记录当日结论；旧地图、旧定位坐标、旧图标和已废弃交互保留在明确标注的历史段中，不再作为可执行规则。当前地图以工作树为准，只请求一个 Mapbox Static Images URL，再将同一响应渲染为清晰底层与 `blur(10px)` 渐进蒙版层。
- `2026-11-18` **当日最终规则归档**：验证采用页面快速路径；新增/返工图标默认实心面状；共享 `.wd-edit-field` 为浅灰半透明底 + blur（深 14px / 浅 16px），不挂完整 Glass Material；可见 Site details 当前地图只请求一张 `dark-v11 / light-v11`、方括号 bbox、zoom `13` 图片，并用同一响应做 0 → 10px 的分区渐进模糊，通过 `setfilter` 隐藏道路文字；定位点位于 Hero `75% / 39%`，地址右侧 `24px`、底部 `28px`，两者交互保留；Owner 联系方式点击复制、账户分隔线全宽；范围页签滚动层保留 8px 垂直缓冲。下方同日较旧记录均视为迭代历史，冲突时以本节和核心规范最终段为准。
- `2026-11-18` **Site details 2 地图分区渐进模糊**：仍只请求一张 Mapbox Static Images 图片，但用同一响应渲染清晰底图与 `blur(10px)` 上层。模糊层以 `28deg` 渐变蒙版在 `42%–78%` 范围实现标注红线内 0 模糊、红绿线之间连续增强、绿线外固定 `10px`，并向外 overscan `10px` 防止透明软边。定位点、地址层和 Hero 文案保持独立图层与原有交互。`npm run check`、`tests/verify-site-details-v2.cjs` 通过，并生成 `tests/output/site-details-v2-progressive-blur.png`。
- `2026-11-18` **Site details 2 地图淡变与 Hero 浅描边**：深色和浅色地图改为独立 map bank，首图完成后空闲预加载另一主题；主题切换继续显示旧图，并在新图就绪后用共享 `620ms` 主题时长与缓动交叉淡变。首个文档中只在第一次真正显示地图时播放一次入场淡入，切换页签后返回立即显示，整页刷新后重新播放。Hero 外框增加 `1px var(--wd-separator-nonopaque)` 浅描边以与背景区分，未增加投影；同时移除 Hero 的 `clip-path`，仅由 `border-radius + overflow:hidden` 裁切，修复四个圆角描边被裁掉。专项覆盖首次淡入、同文档返回不重播、刷新后重播、主题双向交叉淡变、减少动态效果、浅描边 token、圆角无裁剪与响应式覆盖。
- `2026-11-18` **Site details 页签收口**：详情导航收口为 `Overview / Devices / Site details` 三项，旧 `Site details` 页签隐藏；现有 `/plants/:id/site-v2` 页面更名为 `Site details`，标签与页面隐藏标题均删除数字 `2`。旧 `/site` 仅作为隐藏兼容路由保留。Overview、Devices、Site details 2、旧 Site details 与路由专项均已更新并通过。
- `2026-11-18` **Site details 标题编辑态对齐**：标题 textarea 由默认 inline 排布改为 `display:block`，消除 44px 输入框下方额外 4px 行盒；标题承托层从 48px 恢复为与输入框等高的 44px。查看态与编辑态标题顶部误差小于 1px，进入编辑不再上浮，灰底不再从框下露出一条。专项新增 X/Y 基线、承托层与输入框等高等断言。
- `2026-11-18` **验证流程分层**：页面局部修改默认运行 `npm run check`、对应专项与浏览器截图，通用入口为 `npm run test:file -- tests/<file>.cjs`。用户明确完整回归太耗时，因此 `npm test` 的串行套件检查不再自动执行（当前 24 个）；共享基础 / 组件 / 玻璃 / 动效 / 主题改动也改用受影响页面的多个专项、构建和截图验证，只有用户明确要求时才运行全量。连续批注期间不重复测试旧状态，代码变化后旧进程结果直接作废。
- `2026-11-18` **图标默认实心规则与账户菜单修正**：将“新做或返工图标默认使用实心面状、内部细节用负形、非明确要求不用线性描边”写入项目长期规则。`Edit account` 改为填充铅笔与实心底线，`Manage access` 改为填充锁体与锁梁、锁孔负形；两者继续使用 16px 菜单色图标。专项回归新增 stroke=none、fill=currentColor、solid 标记与多路径负形断言。
- `2026-11-18` **Site details 2 地图定位玻璃与浅色高光**：定位按钮继续使用共享 `createStandardButton` + `glass.addSurface`，通过共享玻璃变量把底图模糊提升到深色 12px、浅色 14px，并把浅色 tint 降至 `rgba(238,238,238,.46)`，使地图纹理透出。浅色中心纯白大高光改为 `.44` 径向高光、1px 半透明光点与弱短晕。专项回归覆盖 blur、tint、渐变、光点尺寸与阴影强度，并输出深浅定位点截图。
- `2026-11-18` **Site details 2 定位玻璃真实模糊修正**：上一版虽有 `backdrop-filter` 计算值，但定位按钮自身 `isolation:isolate` 形成 backdrop root，实际取不到地图内容。最终使用 `.site-v2-map-pin.wd-glass { isolation:auto }` 恢复真实背景模糊，保留共享 material、深色 12px / 浅色 14px blur 与浅色 `.46` tint。浅色 `::after` 白点设为 `display:none`，核心改为 `#56c4f2 → #0b7fbe → #075c8d` 纯蓝渐变；上下文截图验证圆内地图线条已模糊。
- `2026-11-18` **Site details 2 定位毛玻璃增强**：在 `isolation:auto` 修复真实 backdrop 取景后，继续提高小尺寸定位点的玻璃可读性：深色 blur `14px`、tint `rgba(153,153,153,.24)`，浅色 blur `18px`、tint `rgba(238,238,238,.64)`。浅色 `::after` 白点保持隐藏，中心纯蓝渐变不变；上下文截图与专项断言覆盖实际合成参数。
- `2026-11-18` **Site details 2 编辑字段模糊表面**：共享 `.wd-edit-field` 改为浅灰半透明填充 + 直接 `backdrop-filter`，深色 blur 14px、浅色 blur 16px，移除完整 Glass Material 的 rim、高光和发光。Site details 2 标题新增透明文本区与左右各 14px 的玻璃承托层，使编辑文字保持查看态 X 坐标并自动换行增高；所有共享选择触发器同步获得模糊背景。v1 / v2 两套页面专项均通过。
- `2026-11-18` **Site details 2 Owner 行分隔线全宽**：账户行使用左右 `-20px` 外边距与等量内距，将 `1px` 分隔线扩展到卡片左右边缘，同时保持头像、文字和操作按钮原坐标；首行不画线。专项回归验证行盒与面板左右边缘误差小于 `1px`，内容左缘仍为卡片内距 `20px`。
- `2026-11-18` **Plants 范围页签 hover 裁剪修复**：横向滚动容器原先只有 2px 垂直缓冲，页签 hover 放大后上下各越界约 0.8px，导致上、下描边被 `overflow-y:hidden` 裁切。现改为总高 `calc(100% + 16px)`、`padding:8px`，并用 `top:-8px`、左右 `margin:0 -8px` 抵消；页签坐标与 66px 行高保持不变，横向滚动继续可用。专项回归实际 hover 后测得上下各约 7px 缓冲。
- `2026-11-18` **Site details 2 空态卡片与账户菜单图标**：Plant picture 标题图标改为 16px 单一连续实心面状图片符号，内部太阳和山形通过负形挖空；无图片占位从 76px 高区域压缩为 20px 行盒，空态卡高与 Visitor access 完全一致。账户三点浮窗的 `Edit account`、`Manage access` 均增加 16px 前置语义图标，继承菜单次级色并在 hover / focus 时同步提亮。专项回归覆盖实心图标几何、两卡等高、命令菜单图标存在性、前置顺序和主题色继承；页面专项、`npm run check` 与 diff 检查通过。
- `2026-11-18` **Site details 2 Owner 联系方式统一**：Owner information 的邮箱和电话改用与 Installer 相同的复制按钮，不再生成 `mailto:` / `tel:` 链接。字段统一为 `13px / 18px / 400` 次级色、`cursor:copy`、hover / focus 主色下划线，并在邮箱与电话之间显示 `1px` 竖线；点击复制后分别提示 `Email copied` / `Phone number copied`。专项回归覆盖格式、颜色、分隔线、按钮语义、复制值和实际点击 toast。
- `2026-11-18` **Site details 2 信息组图标光学校正**：Hero 四项指标与 Installer company / Contact 继续使用 Labels/Secondary，但实心图标统一增加 `0.78` 不透明度，使视觉重量与相邻小标签一致，不改变标签颜色。专项回归同时锁定语义色、光学透明度与中心对齐。
- `2026-11-18` **Site details 2 玻璃定位、地址浮窗与标题编辑收口**：Mapbox 静态图移除自带 `pin-s`；页面改为在约 `62% / 44%` 放置 `createStandardButton({iconOnly:true})` 的 `36px` 共享玻璃圆钮，并通过 `glass.addSurface({radius:18})` 挂载正式材质，外层叠加两圈 `2600ms` 循环扩散波纹，第二圈延迟 `1300ms`。按钮内部使用 `6px` 中性发光芯和克制冷光；波纹基础直径 `24px`、最终约 `72px`、描边 `1px`。`prefers-reduced-motion` 时停止扩散和呼吸动画。地图左下地址区改用 `20px` 实心面性 `plants/detail/location-solid.svg`，相对国家/完整地址文本栈垂直居中且无阴影；国家与地址行距 `3px`。地址在卡片内单行省略，hover / focus 打开可移入的共享 Glass Surface：只显示完整地址，不重复国家、不显示辅助提示，左右内距统一 `16px`；地址 hover / focus 只用文字下划线，不使用高亮底，点击复制完整文本并提示 `Address copied`。演示地址改为长地址。电站标题复用共享标题输入，编辑框铺满标题区域、与区域左缘对齐，左右内距 `14px`，长标题自动换行增高且不贴边。专项回归已通过，并生成 `site-details-v2-address-popover.png`、`site-details-v2-hero-map.png`、`site-details-v2-edit.png` 与浅色 / 窄屏截图。
- `2026-11-18` **Site details 2 图标清理与信息提示优化**：删除 Energy & tariff 信息组左侧多余 Calendar 前缀图标，卡头 Calendar 标题图标保留，信息行恢复完整内容宽度。Alarm email 的 info 控件改用用户提供的 `plants/detail/info2.svg`，以 14px 单色遮罩呈现，不附加圆底、描边或阴影；默认颜色直接继承同一行 `Alarm email` 标签的 Labels/Secondary，hover / focus 才提升到 Labels/Primary。专项回归覆盖无多余图标、14px 几何、`info2` 图形来源、透明背板、默认与标签同色、共享提示浮窗和页面级快速验证。
- `2026-11-18` **Site details 2 Hero 指标图标语义修正**：四个指标固定为 Plant type `organisation.svg`、PV capacity `solar-panel.svg`、Commissioned `imgBoldTimeCalendar.svg`、Battery storage `battery-storage.svg`。太阳板与电池最终使用实心面状遮罩，内部网格与电量符号通过负形表达，移除线性图标和 Module balance / Cell balance 的旧映射；图标继续共用 Labels/Secondary 与 16px 遮罩几何。
- `2026-11-18` **浅色共享开关内发光收敛**：针对 24px 轨道单独降低浅色玻璃的白色 reflection field、rim 和 inner highlight，顶部/底部反射上限降为约 `.18 / .08`，避免大尺寸 Glass Surface 的白色 shelf 在小控件上形成突兀光圈。开启态蓝色轨道和白色滑块保持不变，深色主题参数未改；专项回归读取浅色开关玻璃变量并输出开关截图。
- `2026-11-18` **Site details 2 Mapbox 配置与浅色定位对比**：本地服务和正式构建新增 `WATTDESK_MAPBOX_TOKEN` 注入，将公开 Token 写入页面 meta，再由地图组件按 `dark-v11 / light-v11` 请求 Mapbox Static Images API；无 Token 时保留主题化 fallback。浅色地图定位中心增至 8px，增加深青蓝外环和白色内芯，避免白色点融入浅色底图。构建回归覆盖有/无 Token 两种产物。
- `2026-11-18` **本地 Mapbox Token 引导**：增加仅限 localhost 的一次性 `?mapboxToken=pk...` 引导，读取后立即用 `history.replaceState` 从地址栏清除并尝试保存到本地调试存储；正式域名不读取该参数。使用公开 Token 实测 dark-v11 / light-v11 均返回 `200 image/png` 并在真实浏览器成功渲染。
- `2026-11-18` **Mapbox 地图可读性调整**：地图样式从偏浅的 `dark-v11 / light-v11` 切换为成对的 `navigation-night-v1 / navigation-day-v1`，中心 zoom 从城市级 `11.5` 拉近到街区级 `13.2`。浅色地图定位中心同步保留 8px 深青蓝外环和白色内芯；真实 Mapbox 两主题均在 Chrome 中加载成功。
- `2026-11-18` **Mapbox 背景权重收敛**：恢复 `navigation-night-v1 / navigation-day-v1` 矢量地图，不使用卫星底图；图片通过灰度、低对比、约 `72–82%` 不透明度与 Hero 同色蒙层统一降噪。道路、地名退为背景，定位玻璃点仍作为唯一视觉焦点，真实日夜地图均在 Chrome 中验证。
- `2026-11-18` **Site details 2 地图与指标最终调整**：Hero 移除径向蓝光和白色装饰层，地图左缘以同色暗化渐变衔接并向左延伸约 `52px`。四张指标卡使用两行网格并整体垂直居中，Commissioned 日期时间保持一行。地图信息改为国家在上、地址在下，编辑态国家下拉、地址输入框使用共享字段样式；Edit / Cancel / Save changes 移动到 Hero 地图侧右上角。
- `2026-11-18` **Site details 2 Energy & tariff 参考样式与编辑态**：该卡沿用旧版 `Electricity price` 的主文字色 `4%` 透明卡面与 `16px` 圆角，同时保留新版卡内标题。固定行序为 `Timezone / Price area / Currency / Grid price`，查看态与 Edit 态完全一致。卡体上下各保留 `16px` 内距；四项设置行从 `52px` 压缩为 `44px`，行左右内距与常规资料卡共享 `20px`，标签 `14px / 510`，值使用常规字重标准界面字体。卡片按自身内容高度顶对齐，不再被同行 Installer 拉伸，实测查看态与编辑态同为 `248px`，标题和四行标签 top 坐标完全一致。Edit 态下 Grid price 切换为数字输入，Timezone / Price area / Currency 切换为共享 Glass 选择器；Currency 变化同步单位，数字输入隐藏原生步进器。专项回归覆盖固定行序、参考卡材质、行高、卡底留白、编辑控件、卡高与固定文字位置、单位联动与保存回显。
- `2026-11-18` **Site details 2 Installer & support 最终信息层级**：标题与卡高对齐要求保持不变；Installer company 与 Contact 使用同一套 `12px` 标签在上、`14px / 510` 信息值在下的上下排版，公司、联系人组最左侧分别使用 organisation / user 图标，联系人不显示头像。邮箱/电话在联系人下方直接拼接为 `邮箱 | 电话`，不显示标题，统一为 `13px / 18px / 400` 次级色；两者改为点击复制按钮，不再使用 mail/tel 跳转。Alarm email 为底部设置行，分隔线贯穿卡片左右边缘；文案右侧增加 14px 圆形 info 按钮，hover / focus 打开共享 Glass Surface 说明参考图内容，按钮使用普通 pointer 光标而非 help 问号。该卡与左侧 `Energy & tariff` 保持等高，Company / Contact 编辑选择、联系人联动、复制反馈以及 Alarm email 开关行为保持。
- `2026-11-18` **Site details 2 Hero 指标信息组统一**：四张 Hero 指标卡与 Company / Contact 共享左侧 16px 图标 + 右侧信息组结构；顺序改为 `Plant type / PV capacity`、`Commissioned / Battery storage`，分别使用 organisation、module-balance、calendar、cell-balance 图标。原有 1px 外框、圆角与卡片底色全部移除，网格列随内容自适应并以 `40px` 作为中心列距。图标相对完整标签/值组垂直居中，与 Company / Contact 对齐规则一致。指标图标、小标签与 Grid price 行标签统一为 Labels/Secondary。Company / Contact 编辑选择框改为左对齐、按内容自适应；Energy 保持原卡面与行结构。
- `2026-11-18` **Site details 2 地图与表单交互补充**：地图编辑态隐藏定位图标；Country、Installer company、Contact 统一使用共享选择触发器与 Glass 浮窗。默认地址改为完整街道地址并支持较长输入。浅色地图信息层改为白色渐隐与深色文字；Hero 文案层压在地图渐隐区上方，避免右侧指标卡被遮住。
- `2026-11-18` **Site details 2 地图信息位置**：地图向左再扩 `84px`，信息层与左侧指标卡底边基本对齐并上提约 `6px`；定位图标迁移到地图约 `64% / 41%` 的上右视觉空区。
- `2026-11-18` **Site details 2 卡片表面统一**：Hero 与下方资料卡统一使用 `--site-v2-card-surface`，地图桥接引用同一 token，修复 Hero 底色偏深、接近页面背景的问题。
- `2026-11-18` **Site details 2 地图底边遮罩**：地图信息文字改用底部内距上提，保持与左侧指标卡对齐；信息层盒子继续贴齐 Hero 底边，修复地图下方漏出一截的问题。
- `2026-11-18` **Site details 2 Hero 精简与表面对比**：删除 Plant type / Normal 两个状态胶囊；统一 surface 提升到 `10%` 主文字色混合，修复 Hero 和下方卡片融入背景的问题。
- `2026-11-18` **Site details 2 Hero 比例优化**：Hero 最小高约 `264px`，标题区上下留白增加并支持共享标题编辑；四个指标改为 2×2 紧凑透明、无描边图标信息组，右侧地图列扩大并继续向左延伸过渡区。
- `2026-11-18` **Site details 2 横向留白统一**：所有资料卡及 Energy 标题/数据行统一使用 `20px` 左右内距，旧版 Energy 的 `16px` 内距取消。
- `2026-11-18` **Site details 2 卡片颜色对齐 Service Ticket**：深色主题统一 surface 改为 Service Ticket 同色 `Backgrounds/Secondary`，取消过重黑混合和 Energy 私有 4% 填充。
- `2026-11-18` **Site details 2 分隔系统统一**：指标卡描边、Energy 行线、账户行与 Alarm 分隔全部改为全局 `1px var(--wd-separator-nonopaque)`，移除 V2 私有分隔色。
- `2026-11-18` **Site details 下拉箭头组件优化**：共享 `.site-details-select-chevron` 最终放大到 `14px`，两个 Site details 页面同时更新。
- `2026-11-17` **Site details 2 新版对比页**：新增 `/plants/:id/site-v2` 与第四个页签，原 Site details 保留。Hero 与下方卡片均无描边、无阴影；Hero 使用更高一级实色表面而不是投影建立边界。Hero 左侧只保留类型、状态、名称、PV、储能和投运日期，地址移入右侧地图并拆成地址、国家两行。Mapbox 定位图贴齐 Hero 上、右、下边，地图及地址层左缘渐变融入 Hero；定位改为单个面性图标，移除圆形底盘、浮动徽标、经纬度和 token 占位文案。下方卡片标题、图标与加号放回卡内；所有卡统一 `16px` 标题到正文间距，并移除标题下横线。第一行 Energy & tariff + Installer & support 紧凑等宽等高；Installer 使用整行公司/联系人摘要与底部邮箱/电话双列信息块，编辑态 Company / Contact 可选择，Email / Phone 自动带入且只读，Alarm email 使用共享开关。第二行 Owner information + Plant picture；Owner 展示三个完整示例账户，均有头像、联系方式与三点菜单，标题恢复为 `Owner information`。Visitor 位于 Owner 下方左列，空态文字与 Plant picture 同色并收紧底部留白。Plant picture 使用面性标题图标、紧凑空态和小圆形加号。专项回归覆盖标题回卡内、统一间距、无标题下横线、地图拆地址、面性标记、Hero 实色边界且无阴影、紧凑卡高、三账户完整性、字级/间距、同色空态和原有编辑交互。完整 `npm test` 通过；`npm run check` 通过（96 个 JavaScript 文件、99 个运行 JS/CSS 文件）；`npm run build:site:public` 通过（248 个文件 / 2.45 MB）；`git diff --check` 通过。
- `2026-11-17` **Devices / Site details 内容结构优化**：Battery Cluster 收起行在箭头左侧增加淡色 `6 modules` 摘要。Site details 调整为左列 Basic information、Electricity price、Installer contact，右列 Owner information、Visitor management、Plant picture；Installer company、Contact email、Alarm email recipient 与 Address 改用加宽值列，Visitor 空态高度从 `132px` 压缩到 `88px`，开发预览说明只在本地 hostname 显示。Danger zone 仅在编辑态出现，并改为横跨内容网格两列、位于全部资料模块底部。专项回归覆盖新列顺序、宽度、空态高度、开发说明和危险区全宽。
- `2026-11-17` **Depth Reveal 背景模糊连续化**：Add device 入场时背景 blur 出现两段式推进。逐帧采样确认遮罩 opacity 恒为 `1`，没有合成断帧；根因是 `wd-modal-backdrop-in` 在 25% / 50% / 75% 设有三个中间关键帧，每到一个边界速度变化都会重新开始，形成阶梯式节奏。现已移除中间关键帧，blur 与 tint 只从 `0` 插值到终值，并使用单段 `cubic-bezier(.32,.08,.2,1)` 平滑缓出；`520ms` 总时长和窗口/内容同步结束保持不变。专项回归锁定遮罩只有 `0 / 1` 两个关键帧和同一缓动曲线。
- `2026-11-13` **全站锚定浮层同触发器开合**：Popover controller 新增共享 `toggle(anchor, open)`，按 anchor 是否拥有已打开 panel 分流；同一触发器第二次点击只收起，第三次再打开。覆盖顶栏 Language / Appearance / WattDesk、Recent activity、Home 图表菜单与日期选择、Plants 筛选 / 列 / 追加筛选、设备更多操作、Site details 自定义下拉与 Owner actions、Statistics 周期，以及 Service Ticket 状态 / 电站 / 工单 / 回复菜单。回归覆盖各入口打开、二次关闭、`aria-expanded=false` 和再次打开；hover tooltip 与 `@` 自动选择器保持原生命周期。
- `2026-11-12` **Battery Cluster 自然开合动画**：Devices 的 Cluster 改用共享 `bindDisclosure()`，展开与收起以 `380ms` 共享 disclosure 时长和缓动完成高度、透明度过渡；详情上下 padding 与高度同步收起，避免实际高度卡在 `22px` 形成残影停顿，动画期间临时裁切内容并在结束后解除，标题箭头同步旋转。整块 Cluster 仍可点击收起，SN 复制继续独立且不会触发折叠；`prefers-reduced-motion` 下直接切换。设备布局观察器只在宽度变化时重算列对齐，避免高度动画逐帧触发卡片样式读取/写入。专项回归覆盖展开、整块收起、动画参数、padding 收敛、裁切清理、布局样式稳定与 Reduced Motion。
- `2026-11-12` **Devices 连接图标与 Plants 列表统一**：设备身份行删除自定义 6px 圆点，并把设备状态收敛为单一设备的 `Online / Offline` 两态。两者复用 Plants 列表 Connection 列的内联 SVG 信号图，在设备行收至 `16px` 并上移 `1px` 与文字对齐：Online 为四根主墨色信号柱，Offline 为 55% 不透明信号柱加红色 X；图文间距 `4px`，不再使用 Status 列勾选或设备 `Attention`。`p25` 的 BMS 示例固定为 Offline，Inverter 与 Heater 保持 Online。Connection 图形抽到共享 `connection-icon.js`，列表与设备页不再复制路径。
- `2026-11-12` **Devices 连接图标循环动效**：设备页连接图标改为持续循环，共享 `3200ms` 周期与 `180ms` 柱间错峰。Online 四根信号柱从左到右弹性生长、渐入、停留并柔和渐出；Offline 的静音信号柱淡入后，红色 X 从 `-55°` 旋转归位，并在本轮末尾淡出。Plants 列表图标保持静态，避免整页大量图标同时运动；`prefers-reduced-motion` 下取消 WAAPI 循环并直接显示静态终态。专项回归覆盖周期、stagger、无限循环、X 延迟、Reduced Motion 和列表静态行为。
- `2026-11-12` **Devices 图标可读性与 Cluster 指针焦点修正**：Offline 静音柱从 30% 提升到 55%，且循环动画只控制整体 opacity，不再与静音填充透明度相乘压暗；深浅主题下均保持可辨。Cluster 整块高亮由普通 `:focus-within` 改为 `:has(:focus-visible)`，鼠标点击后保留的按钮焦点不再锁住高亮，指针移开即消失，键盘导航仍保留 focus-visible 反馈。
- `2026-11-12` **Battery 产品图替换为 R13 原稿**：iStorage-G3 从旧 R11 产品图切换到用户提供的 `R13_list_dark.png`。该图是 `600×600` 已透明 PNG，因此按原像素复制到 `r13-list-dark-source.png` 和运行的 `istorage-r13.png`；旧 R11 来源继续保留在 `istorage-source.png` 作回退，未引用的旧运行副本已移除。专项回归锁定运行文件、自然尺寸和本地加载，设备卡仍使用 `120×96`、`object-fit:contain`。
- `2026-11-12` **Replace device 改为窄版弹窗**：Replace 不再复用 Settings 的 `1160px` 宽版，改为 Add / Rename 同档的 `640px` 窄版并沿用窄版 `80px` 上移。旧设备信息与替换表单由左右两栏改为单列纵向，替换字段维持 2×2；Settings 继续使用 `1160px` 双栏。专项回归锁定实际宽度、单列内容、字段网格和垂直位置。
- `2026-11-12` **设置 / 确认弹窗独立共享动效**：新增 `components/modal-surface.css`，设备 Add / Rename / Replace / Unbind / Settings 不再套用搜索 `.wd-search-*` 的纵向入场。背景遮罩、窗口与内容统一在 `520ms` 内完成入场；遮罩继续复用搜索同等级 tint 与 `28px / 16px` blur并采用 `52% / 78% / 93%` 的分段比例。内容 frame 在同一 `520ms` 内按 `16 / 10.5 / 6.5 / 3.8 / 2 / .8 / .15 / 0px` 清晰化，前段快速去除主体模糊，后段单次变化量递减，最后平滑归零，避免动画尾端突然消失并保持整体利落。退场时弹窗、内容 frame 与背景共用 `420ms`、均从 `0ms` 开始；背景没有满模糊保持段，tint 与 blur 从第一帧同步下降，并采用前快后慢的 `64% / 27% / 8%` 分段比例，让主要模糊在前半段消退、尾部平滑收尾，避免最后突然归零。弹窗本体在 `1400px` perspective 中从屏幕近端 `translateZ(64px)` 的轻微放大状态单调收拢到实际尺寸 `0`，不会穿过目标平面或产生生硬回弹。退场向 `translateZ(42px)` 轻微放大、淡出并模糊 `8px`。新增 modal motion token 与 enter/exit duration helper；搜索原动效不变，Reduced Motion 直接切换。
- `2026-11-12` **弹窗入场末帧闪暗修正**：根因是入场完成后移除 `data-entering` 会同时撤销动画填充和遮罩合成提示，使 `backdrop-filter` 在最后一帧重新合成。现在开放状态保留入场终态与 `will-change`，只写入 `data-entered`；直到关闭的同一帧才移除 `data-entering` 并进入 `data-closing`。遮罩动画终帧和静态背景统一使用同一 color-mix 表达式，避免颜色空间切换造成亮度跳变。
- `2026-11-12` **Depth Reveal（景深浮现）命名与共享范围归档**：将共享设置 / 确认弹窗动效正式命名为 **Depth Reveal（景深浮现）**。当前 Add、Rename、Replace、Settings、Unbind 全部经 `createDialog()` 使用 `.wd-modal-*` 与同一套 motion token；后续同类弹窗也必须复用，不得复制动画或回退搜索样式。
- `2026-11-12` **Site details 删除确认统一**：移除 `Delete plant` 的浏览器原生 `confirm()`，改用共享 `createConfirmDialog()`。弹窗与设备 `Unbind device` 同构：`480px` 居中、危险图标底托、Cancel / Delete plant 两按钮，并使用 Glass Surface 与 Depth Reveal。确认后仍只提示本地预览未连接后端，不删除样例电站。
- `2026-11-12` **全站原生确认框清零**：Site details 的丢弃未保存资料、Service Ticket 的删除工单、删除回复、关闭 / 重开工单全部改为共享 `createConfirmDialog()`。`components/modal-dialog.js` 统一弹窗外壳、焦点循环、Esc、外点关闭和 Depth Reveal；`confirm-dialog.js` 提供 480px 居中确认内容。`npm run check` 新增静态检查，运行代码出现 `confirm / alert / prompt` 即失败。
- `2026-11-10` **Statistics 最终规则归档（仅文档）**：完成第二轮规则收口，将 `Day / Month / Year / Total` 周期、年月选择浮层玻璃箭头、Month / Year `Separate / Combined`、年 Combined 完整逐日数据、Combined 全宽与平滑路径、图表并行入场 `900ms`、History 浮窗上移、Combined 两列读数、产品字号、移除年图峰值标签等最终要求写入 `AGENTS.md`、`DESIGN-SYSTEM.md`、`USER-REQUIREMENTS.md`、`COMPONENTS.md`、Plants README 与 `LESSONS-LEARNED.md`。清理了规范中仍把 Self-powered 写成 F4、把分隔线写成 1px、把 Energy 浮窗写成 10/11px、把分段选项写成 20px 内距的冲突表述。本次未修改运行代码、UI、交互或测试。
- `2026-11-10` **规则归档完成（仅文档）**：汇总当前任务历史、`codex/plantinfo` Git Diff、项目状态和页面规格，在 [USER-REQUIREMENTS.md](./USER-REQUIREMENTS.md) 新增今日最终规则总表，覆盖 `.wd-page-content`、标准按钮、`.wd-edit-field`、玻璃 switch、共享滚动、Site details 完整契约，以及当前工作树中的 Devices / Statistics 最终状态。修正 [SITE-DETAILS.md](./SITE-DETAILS.md) 与 [COMPONENTS.md](./COMPONENTS.md) 中旧的原生 select、54px 行高、卡片投影、Save/CreateStandardButton 和 `actionsHost` 冲突；[LESSONS-LEARNED.md](./LESSONS-LEARNED.md) 新增滚动条挤压、状态切换几何、按钮交互态、自定义下拉、开关材质、居中内容列和长标题等防回归项。明确无法访问的其他对话不做推断，并记录 Site details 超长标题上限、SettingsCard 抽离和真实后端接口等待明确项。本次不修改运行代码、视觉、交互或测试。
- `2026-11-09` **Statistics 多周期视图与时间切换完成**：逆变器统计新增 `Day / Month / Year / Total` 共享玻璃周期控件，支持日前后移动、月/年选择器、日历月网格、12 个月和 9 年网格，以及 Total 禁用相邻导航。四种视图常驻 DOM 后按模式显隐；月视图使用 F2 Hairline Line 展示 Home use / Solar energy / From iStorage / Grid exchange 的每日序列，年视图使用同一四项的月度 Rungs，Total 展示八项累计指标、带金额的 Savings 与独立 SVG defs 的 Self-powered。切换粒度不会提前提交数据，选项确认后才更新；视图入场复用共享 motion token，减少动态效果时关闭。新增 `verify-statistics-periods.cjs`，覆盖模式提交、前后导航、Escape/外部点击、玻璃读数、Total 语义、reduced motion 和 900 / 520px 响应式。
- `2026-11-09` **Statistics Separate / Combined 与并进入场**：月、年视图时间控件左侧新增 36px 共享玻璃布局开关，Day 与 Total 隐藏。Separate 保留四项小多图；Combined 将 Home use / Solar energy / From iStorage / Grid exchange 叠加到同一时间轴，月模式逐日、年模式展开完整年份每日数据（2026 年为 365 点）。绘图区铺满内容列，SVG 使用 `preserveAspectRatio="none"`，轴标签放入独立 HTML 层；历史和合并折线均改为平滑三次贝塞尔路径，全年密集路径对可见线使用 7 天加权平滑而 tooltip 保持原始值。主墨色、两级中性灰、橙线及实线 / 点线区分系列，悬浮读数一次显示四组 kWh。选择器内年月切换箭头改为共享中性玻璃圆钮。统计入场改为按图表分组：同一张图内部标记用 `clip-path` 从左到右、约 `3ms` 微错峰；四张小图只保留约 `28ms` 起始差，总计启动窗口不超过约 `110ms`，共享 chart duration 提高到 `900ms`。该 helper 同时用于初次滚动揭示、周期切换、布局切换和点击重播，`prefers-reduced-motion` 下关闭。
- `2026-11-09` **Statistics 图表文字与浮窗位置**：共享图表 readout 标签提升到 `12px / 16px`、数值提升到 `13px / 17px`；history 轴标签、Combined 图例和 HTML 日期轴统一到 `12px`；Self-powered 来源名提升到 `11px`，Savings 可见金额提升到 `12px`。年图删除柱顶常驻峰值数字，避免与悬浮信息重复。History 浮窗整体上移；Combined 四项读数改为两列摘要，工具卡底部停在绘图区上缘之上。Self-powered 放大浮窗通过更紧凑横向内距和更大上移距离继续保持不覆盖扇区与外置标签。专项回归同步锁定字号、History 浮窗位置、Combined 两列、Self-powered 无覆盖和已移除峰值标签。
- `2026-11-09` **Site details 页面（本地交互预览）**：新增 `/plants/:id/site`，可保留 `device` 查询参数；`Overview / Devices / Site details` 三个页签均可操作。宽屏使用共享 `.wd-page-content` 最大 `1000px` 居中内容列，内部两列卡片撑满该列。正文顶部直接以电站名作为标题，右侧为玻璃 Edit / Cancel / 蓝色 Save changes，不显示额外页面说明；编辑时电站名在同一标题位置改为默认高 `44px`、最宽约 `760px` 的自动增高文本区，超长名称自然换行向下生长，短标题进入编辑时标题行高度稳定；Basic information 删除重复 Plant name。Save 与 Home 日期选择器 Apply 使用完全相同的文本按钮类路径且无额外图标，无修改时点击安全退出。桌面两列等宽：左列 Basic information、Electricity price、Owner information，右列 Installer contact、Plant picture、Visitor management；一个模块一张卡，卡片无描边无阴影，行分隔低对比，模块标题 15px。查看值、编辑值、单位和下拉当前值统一 14px。Plant ID 不展示；数字输入隐藏步进器；下拉信息使用自定义选择按钮和共享 Glass Surface，箭头复用 `asset-14.svg`。编辑态保持卡片位置、宽度、行高和右侧控件边界不变；focus 使用更亮中性填充和浅中性轮廓。详情隐藏原生滚动条，仅显示共享 `createScrollFeedback()`，编辑器增高时自动同步。Alarm email notification 使用共享真实 switch 并收弱内部光晕，New owner 位于 Owner 模块标题行，Danger zone 使用淡红背景；Delete plant 复用 Save changes 的标准玻璃胶囊结构，仅将玻璃底和描边替换为纯红色，文字始终白色。非法数值或邮箱显示行内错误与汇总 alert，并聚焦首个错误。保存只保留在当前 Plants 页面会话，页签返回和父级返回会阻止未保存草稿静默丢失；刷新恢复样例。图片、属主、访客、删除和后端写入仅显示明确预览边界。`≤1000px` 改为单列，`≤640px` 再收为字段纵向；深浅主题和 420px 无页面横向滚动。完整规格见 [Site details](./SITE-DETAILS.md)，专项回归 `tests/verify-site-details.cjs`。`npm run check` 通过（90 个 JavaScript 文件、92 个运行 JS/CSS 文件）；完整 `npm test` 通过 22 个套件；`npm run build:site:public` 通过（241 个文件 / 2.41 MB）；`npm run audit:assets` 通过（137 个运行资产，0 unused / 0 missing）；`git diff --check` 通过。
- `2026-11-10` **Devices 操作图标（Figma 原始资源）**：行内固件检查/升级按钮从通用箭头替换为 Figma `ICON/update`（`20922:26808`），并通过遮罩缩放收在按钮内芯，不再显得过大。更多菜单的 System test、Replace、Rename、Unbind 分别使用 Figma `ICON/test`、`ICON/refresh`、Edit、`ICON/delete/1` 导出；图标统一视觉高度并放在文字左侧，Unbind 的图标和文字同为红色语义色。来源节点与本地资产记录在 `design/figma/plants/device-actions-source.json`；深浅主题均实拍核对，专项测试覆盖升级图标尺寸、四项菜单图标、左对齐与危险项颜色。
- `2026-11-10` **Devices 操作菜单外形与位置**：更多操作菜单统一到与 Appearance 相同的 `30px` 浮层圆角，并改为右对齐触发的更多按钮，不再被视口右侧边距夹取。专项测试检查圆角、触发按钮右缘对齐、图标左对齐和菜单内容。
- `2026-11-10` **设备设置保存状态标准化（Inverter 部分已被 2026-11-19 独立设置页取代）**：Heater 继续使用 `openSettingsDialog()` 的 dirty-state 逻辑；Inverter 现由 `pages/inverter-settings/` 和本地 2026-11-19 原型接管，不再以旧八分类弹窗或 `Save changes` 禁用规则作为当前契约。
- `2026-11-10` **Rename 保存状态统一**：`Save name` 同样使用初始名称比较，打开时禁用，名称为空或与当前名称一致时禁用，产生真实变化后启用，改回原名后重新禁用。Add / Replace 继续使用必填字段有效性校验；三类表单的 Primary 视觉保持统一。
- `2026-11-10` **设备弹窗输入、Glass Surface 光晕与危险菜单状态收口**：共享 `.wd-edit-field` 的浅色默认、hover 与 focus 改为中性灰填充，不再切回纯白；设备弹窗与 Site details 同步生效。Glass Surface 指针光晕收敛为深色内部 `.035` / 边缘 `.38` / 半径 `140px + 90px`，浅色内部 `.42` / 黑色边缘弧 `.25` / 半径 `120px + 90px`，hover 覆盖渐变同步降亮，继续使用共享进入 `240ms` / 离开 `360ms`。设备更多菜单的 `Unbind device` hover 与 focus-visible 使用 `Accents/Red 11%` 淡红底，图标和文字同为纯红。专项回归和真实浏览器截图覆盖浅色输入框、深浅主题光晕参数、危险项 hover / 键盘 focus 及普通菜单状态。
- `2026-11-10` **Devices 弹窗宽度、标题与字段标准化**：Add / Rename 使用 `640px` 窄版，Settings / Replace 使用 `1160px` 宽版并在内容区左右分栏；Unbind 是单独的 `480px` 居中确认弹窗，不计入普通窄版。所有标准标题栏左侧使用 `40px` 图标底托，图标、标题和关闭按钮垂直居中，关闭 glyph 收至 `14px`，标题下说明文字删除。设备弹窗继续复用首页全屏搜索的遮罩、材质和 motion；位置改为高度自适应居中并上移，窄版 `80px`、宽版 `24px`。新增共享 `.wd-edit-field` 并复用于 Site details 与设备弹窗：默认无描边、hover 提亮、focus 仅中性轮廓且禁止蓝色输入框；Primary 按钮禁用态保持白字和蓝色材质。专项测试覆盖宽度档位、双栏、标题几何、遮罩/材质/motion、输入态、主按钮色值及两类弹窗的不同上移量。
- `2026-11-10` **Devices 解绑确认弹窗**：Unbind 不再使用标准标题栏，改为 `480px` 居中确认布局：无关闭 X，顶部 `64px` 红色底托内放 `28px` 删除图标，标题与说明居中，底部仅保留两个并排操作按钮。内容水平居中，整体与其余窄弹窗共用“视口居中后上移 `80px`”规则；已移除误覆盖为 `translate: 0 0` 的例外。测试覆盖宽度、上移位置、无关闭按钮、大图标、两按钮结构和确认流程。
- `2026-11-10` **Devices 按设备类型收敛操作**：Battery（iStorage）不再显示设置按钮，只保留固件检查/升级与更多操作；Inverter 和 Heater 继续保留设置入口。对应回归检查 Battery 设置入口数量为 0、行操作按钮为 2，同时确认全页玻璃操作按钮总数为 8。
- `2026-11-10` **全屏弹窗统一复用首页搜索表面与 motion**：设备 Add / Rename / Replace / Unbind / Settings 共用 `.wd-search-fullscreen`、`.wd-search-backdrop`、`.wd-search-panel--fullscreen`、`.wd-search-panel-frame` 和共享 Glass Surface。深色遮罩为 `28px` blur，浅色为 `16px`，圆角统一 `30px`；入场沿用 `980ms` 搜索序列，退场沿用 `560ms` 遮罩长尾，并新增共享 `fullscreenOverlayEnterDuration()` / `fullscreenOverlayExitDuration()` 供首页搜索和设备弹窗共同调用。最终定位统一为视口居中后按档位上移：普通窄版 `80px`、宽版 `24px`、确认版 `80px`；不得使用固定顶部偏移。专项测试覆盖共享类、玻璃分支、遮罩参数、圆角、尺寸档位、纵向位置和打开/关闭状态。
- `2026-11-09` **Statistics 图表材质精修**：外层 Statistics 保持透明、无底色、无边框、无圆角和无投影；颗粒分别裁切在 Self-powered 底扇区、Savings `16px` 轨道和 Current state 胶囊上，不使用覆盖整块图表的矩形噪点层。Self-powered 另含收缩后的中性白光、径向底盘渐变及底环/数据环共享的左上亮、右下暗中性渐变描边；Energy 为双层顶点辉光；Current state 为横向大范围高光且无描边、无内外阴影。原玻璃浮窗保持原材质并位于图表材质上方。材质作用域为 `.is-statistics-optimized`，页面下方不增加存档副本。改动前三个相关文件的备份位于 Source 外 `Backups/plants-statistics-pre-material-2026-11-09/`。
- `2026-11-09` **Energy 顶部点与浅色辉光**：顶部数据点半径放大到约 `3.35`，仍保持与下一点的安全间距；浅色主题 Supply 点改为 `#73726d`，Supply 辉光使用低透明中性灰，避免黑点与脏边。
- `2026-11-09` **Energy trend / Statistics 顺序交换**：Energy trend 移至 Statistics 上方，DOM、桌面网格、`901–1450px` 的 2×2 和 `≤900px` 单列顺序同步调整；趋势保留标题、模式切换、Today 和 `0.6px` 网格，三条数据折线通过 `.plant-overview-chart.is-line-hidden .plant-overview-chart-line{display:none}` 全部隐藏。
- `2026-11-06` **Statistics 宽屏七列与可见间距均分**：宽屏使用 `窄 / 弹性间隙 / 宽 / 弹性间隙 / 窄 / 弹性间隙 / 宽` 七列，窄内容 `clamp(176px,11.8vw,205px)`、宽内容 `clamp(289px,calc(27.2vw - 119px),720px)`、三条间隙均为 `minmax(32px,1fr)`。Energy 从内容区左缘开始，Current state 在右缘结束。Self-powered viewBox 为 `34 0 206 116`，Energy 为 `0 0 228 116`。`1499px` 三个可见间隙均约 `68.41px`，`1793px` 均约 `94.54px`，`2551px` 均约 `209.76px`。
- `2026-11-06` **Energy 图例与读数精修**：图例圆改为复用动态柱顶圆半径，Supply / Demand 文字提高到 `12px / 600`；圆点按字体视觉基线做少量上移并与文字共用垂直中线，实测中心误差小于 `1px`。两组图例之间增加净空，`1499px` 视口实测约 `7.3px` 且断点下不低于 `6px`。柱顶整数改为直接舍去小数，精确值继续保留在浮窗与 `aria-label`。浮窗纵向锚点从柱顶圆改为整组最高柱顶数值，并再上移保留至少 `5px`；横向中心回到当前柱组并在模块边界内夹取，不再为了避让图例漂到其他柱组。
- `2026-11-06` **Savings 轨道细节精修**：行框描边提高到 `2px` 并提高对比；框内文字增大到 `12px / 400`。灰轨与右端空心圆同步放大到 `15px`；左侧状态点改为整数位置的 `11px` 并完整包在轨道内部。两个端点均由 HTML 圆改为内联 SVG circle，左点消除小尺寸 CSS 圆的锯齿，右端空心圆的描边也在 SVG 内完成，不使用阴影或投影。深色轨道与空心内部统一为 `#4d4d4d`，右端改为平切并藏入端点下方；最短轨道保留 `24px` 宽度，使两个端点保持接近但不重叠。轨道尾部另预留 `6px`，最长值实心端点与行框的右侧留空因此与轨道上下留空一致。轨道长度仍按真实 kr 相对最大值计算。
- `2026-11-06` **Savings 描边与浮窗收敛**：行框默认和 hover 统一为前景墨色 12% 透明度，hover 不再切亮；键盘 focus 使用次级灰色 1px 外轮廓。Savings 浮窗只渲染两位小数金额，来源名称和 `kr` 前缀从可见浮窗移除，完整语义继续保留在行级 `aria-label`。
- `2026-11-06` **Savings 单位与 Energy 布局修正**：Savings 浮窗恢复 `kr` 单位但仍不显示来源名称。Energy 宽屏首列调整为 `0.9fr`，图例和第一组数据整体左移并在左侧保留约 `8px`，删除所有柱下横线；配对方向的浮窗固定在柱组顶部并在模块边界内夹取，分类名 `10px`，Supply / Demand 数值以 `11px` 分两行。
- `2026-11-06` **Self-powered 标签与交互修正**：百分比提升到 `14px / 600`、来源名使用 `10px / 600`，两者均改为次级灰并拉开基线；深色底扇区降到 16%、浅色降到 8%，浅色花瓣使用三级深灰。整个底扇区成为 hover / focus 热区；浮窗仅显示 kWh 数值与单位，跟随鼠标并悬于指针上方。
- `2026-11-06` **Savings 左端点提亮**：深色主题起始点最终为 `#a6a6a6`，与 `#4d4d4d` 轨道保持清楚层级，同时弱于主文字和右端主体；尺寸、内联 SVG 圆形和中心定位不变。
- `2026-11-05` **Energy trend 网格线收敛**：三条横向网格线从 `1px` 改为 `0.6px`，保持原颜色与 `.55` 透明度，并使用 `vector-effect:non-scaling-stroke` 避免 SVG 纵向拉伸放大线宽；数据曲线与 `2px` 模块分隔线未改。
- `2026-11-05` **Statistics 标题与内容结构**：逆变器统计模块改为标题行和内容带两行网格。标题行固定 `32px`，标题到内容区 `20px`；顶部分隔线到标题、内容底部到 Energy trend 顶部分隔线均为 `22px`。内容网格填满剩余高度，四组与图表容器同顶、同底；`901–1450px` 的 2×2 使用伸缩行替代固定组高，窄屏两列和单列保持 `20px` 标题间距及内容到趋势区间距。专项回归新增上下留白对称、内容填满和图表底部齐平断言。
- `2026-11-05` **Statistics 组标题字色**：`Energy / Savings / Self-powered / Current state` 从主文字色降为共享 `Labels/Secondary`，比 `Statistics` 总标题淡一档；字号、字重、图表布局、Savings 总额和交互均保持不变。回归新增四组标题同色、且与模块总标题不同的断言。
- `2026-11-05` **Savings 行标签与线条对齐**：来源标签字号从 `11px` 提高到 `12px`；该组原先白色 stem 位于 `y+3`、灰色 track 位于 `y+7` 的错位已取消，底轨、值线和端点现在共用 `y+3`。四行 pitch 从 `26` 增至 `28`，首行略上移、末行略下移以扩大呼吸区；回归锁定字号、实际 Y、轨线中心与标签光学对齐。
- `2026-11-05` **Savings 总额右缘**：总额右缘从组标题行最右缘内收到实际轨道终点，补偿 viewBox 右侧 `10/300` 的留白；回归直接比较总额与轨道右边界，误差小于 `1px`。窄桌面 2×2 下总额左移后可能与上方读数碰撞，读数会自动翻到线条下方并保持 `6px` 净空。
- `2026-11-05` **Savings 底轨权重**：灰色底轨由 `1.4px / .7` 调整为与白色值线相同的 `2.2px` 粗细、`.45` 透明度，并通过更低不透明度而非更细线宽维持轻层级。
- `2026-11-05` **Self-powered F4 重绘**：按用户参考图和 `lieflat-charts` 模板锁定 Lupi Basics F4 Tick Donut，使用 `templates/basics-gallery.html` 的 B4 环形骨架。100 个刻度各代表 1%，每 10% 一个内圈点，来源标签与百分比直接排在外圈并由虚线引导。原先环上太阳、电池、电网图标移除，来源按占比降序分段并使用 Mono 灰阶；hover / focus 读数继续提供百分比与派生 kWh。最终版使用 `270×116` 画布和半径 `44`，桌面与 2×2 布局下外缘距内容区上下约 `1px`；圆心文字删除，来源标签改为句首大写并与 Savings 行标签统一为 `12px / 600`。
- `2026-11-05` **Current state 状态条重绘**：移除 F1 Rung Bars，改为四行 `label + status pill`。行标题为 Battery / Grid / Home / Solar；胶囊左侧显示状态、右侧常驻显示 kW。状态胶囊只使用黑白灰，顶部最亮并向下逐级变深，四档背景均和白色 `12px / 400` 文本保持至少 `4.5:1` 对比度。列表顶部保留 `8px` 光学留白，首行中心与左侧统计首行误差小于 `1px`；Current state 不再依赖 chart hotspot、hover 浮签或 SVG。
- `2026-11-05` **Energy F6 点阵重绘**：沿用 `templates/basics-gallery.html` 的 F6 Paired Rungs 骨架，把原始数据映射为 `Grid` / `Storage` 双列和 `Solar` Supply 单列、`Site` Demand 单列，共四组，每个点代表 1 kWh。Supply 使用前景墨色（深色主题为白），Demand 使用共享橙色；列顶显示四舍五入整数，底部分类和图例使用句首大写。hover / focus 精确值浮签继续显示对应方向的原始一位小数 kWh。
- `2026-11-05` **Energy 点阵可读性**：分类和顶部数值提升到 `12px / 600`，图例使用 10px；SVG 改为与内容区同高的 `270×116` 比例，取消上下 letterbox 并让双列点阵撑满高度。点阵步距上限为 5.2 viewBox 单位、普通点半径 1.8、顶点半径 3，实测所有竖向圆点保持至少相切间距。回归新增字号、顶部无留白和圆点不重叠断言。
- `2026-11-05` **Self-powered 交互细节**：外圈来源文字与百分比替换为放大到约 `1.5×`、无底圈无外描边的太阳、电池、电网图标，图标与刻度环分离；三级灰阶进一步拉开，刻度长度改为 `8–15` 单位的确定性噪声。hover / focus 对应来源以共享 240ms / 360ms 缓动显示 `2px`、延长 `2` 单位的高亮刻度；中心共享静态玻璃浮窗显示来源名称、百分比与 kWh，且实测不覆盖任何刻度。
- `2026-11-05` **Self-powered 径向花瓣重绘**：按最终参考图将 Tick Donut 改为 L10 Radial Patchwork 扇区语法。三个来源按占比降序占据等角分槽，每项包含浅色全长底扇区和按绝对百分比 `share / 100` 改变半径的数据扇区，最大值也不占满底扇区；两层都使用无描边的圆角路径，内外圈扇区间距统一为 `5` 单位。名称与百分比全部位于底盘外侧并与扇区保持距离，中心留空；引导线为三节点折线，先斜向引出，再以水平尾段指向标签，不能退化为单根直线。hover / focus 时对应花瓣外扩 `2.5` 单位，并在左右空区显示包含来源、百分比与 kWh 的共享静态玻璃浮窗，不覆盖花瓣。
- `2026-11-05` **Self-powered 底盘提亮**：底扇区改为独立主题变量，深色主题使用前景色 28% 的浅灰，浅色主题使用 12% 的浅灰；数据花瓣、圆角路径、均匀间隙和文字反差逻辑不变。
- `2026-11-05` **主视觉区彻底透明**：删除 `.plant-overview-canvas::before` 和 `.plant-overview-flow::before` 两层渐变，并把空舞台的背景、边框、圆角、阴影全部归零。Energy flow 仍保留原网格行与完整高度作为后续内容占位，Operations 对齐关系和 Statistics 起始位置未改变；回归新增伪元素无渐变、舞台透明、无边框/圆角/阴影断言。
- `2026-11-05` **Statistics 读数玻璃浮签**：Energy、Savings、Self-powered、Current state 四个图表读数统一挂载共享静态 Glass Surface（`.wd-glass--surface` + `.wd-glass--static`），不再使用图表局部半透明底。读数按当前 hover / focus 行线条的真实屏幕位置动态上移，左缘与线条起点对齐并保留 `6px`；Savings 采用标签与金额同行布局，在 1440×900、1519×1252 和 1640×1252 下均不覆盖线条、组标题或总额。玻璃材质与文字内容分层，切换读数时不会删除材质。Savings 来源文字提高到 `11px`，增加 `1px` 光学下移后与线条中心误差不超过 `1px`；四行 pitch 增至 `26` 个 viewBox 单位，在 1519px 视口实测约 `23px`。
- `2026-11-05` **Plants Operations 三卡与子页**：右侧 rail 改为 `repeat(3,minmax(0,1fr))` 三卡等高、8px 间距；三卡直接复用全局 `.wd-discussion-card`，浅色统一纯白无投影、深色保留共享描边和双层阴影。整卡支持 hover 放大、鼠标与键盘进入当前标签内的 `/plants/:id/faults|logs|tickets` 占位子页，面包屑增加到 `Plants / 电站 / 子页` 三层。Fault 移除 `Clear`；System Log 删除内部终端矩形并直接排版在外层卡上；Service Tickets 在标题行右侧使用 36px 中性玻璃加号，底部 New ticket 已删除。新增共享 `plants/sections.js` 作为 slug/标题来源，路由支持刷新、历史、device 查询参数与未知子页拒绝。
- `2026-11-05` **Operations 卡与子页页头精修**：Operations rail 改为从上下文条顶边开始，与 Energy flow 同高结束；三卡继续等高。卡片标题提升到 `14/14 medium`，正文和票号至少 `12px`，日志从 `10px` 提升到 `12px` 等宽字。Ticket 玻璃加号的材质注册半径由 `14px` 修正为 `18px`，最终 `36×36 / border-radius:50%` 为正圆。子页面包屑中分隔箭头后的电站父级取消负左边距，电站名文字与 Overview 同 X 起点且 hover 胶囊不再覆盖箭头；电站收藏按钮改为挂在电站面包屑项内，子页继续显示。回归新增圆按钮、状态条同顶、字号、面包屑起点/hover 边界和收藏保留断言。
- `2026-11-05` **Operations 卡内距与标题节奏**：三卡保持 `18px` 圆角，四边内容内距统一 `12px`；标题从卡片顶部和左侧各内缩 `12px`，标题行固定 `36px`，标题到下方内容增加到 `20px`。Ticket 的 36px 正圆玻璃加号改为卡片右上角绝对定位，上下/右侧各距边缘 `6px`，与标题中心仅差 `4px`；玻璃材质注册半径保持 `18px`。
- `2026-11-05` **Operations 卡左右留白**：三卡上下内距保持 `12px`，左右从 `12px` 增至 `16px`；标题行、正文间距、18px 卡片圆角和 36px 右上玻璃加号几何保持不变。回归断言同步为标题左侧 `16px`、顶部 `12px`。
- `2026-11-05` **Plants 子页页头与占位收敛**：子页隐藏 `Overview / Devices / Site details` 标签行，详情视口从页头下直接开始；空白占位区改为填满正文内容区后水平、垂直居中。多级面包屑中电站父级链接保留左右各 `8px` 内距，hover 胶囊与 Plants 一致且不覆盖箭头；收藏按钮以 `-8px` 左外边距抵消链接内距并紧贴电站名。回归增加 tabs 隐藏、占位居中、父级左右内距、收藏间距与 hover 边界断言。
- `2026-11-05` **Operations 标题字阶回调**：三卡标题从 `14px` 调整回共享 `Footnote/Emphasized` 的 `13px / 590`，正文、日志和元信息保持 `12–13px`，避免标题压过内容层级。
- `2026-11-05` **Overview 空白流动区与透明上下文**：删除 Energy flow 的标题和 LIVE 整行，空舞台从 flow 容器顶边铺满；Plant context 的四项状态信息保留，但移除背景、圆角和面板表面，只让图标与文字直接落在画布上。
- `2026-11-05` **Operations 文案与空态**：三卡标题改为 sentence case：`Fault & warning`、`System log`、`Service tickets`。无关联工单时删除 `None`，Ticket 空态与无故障内容分别在卡片剩余正文区域内水平、垂直居中。System Log 继续使用等宽字体，消息改为 `white-space:normal`、`overflow-wrap:anywhere`，取消 ellipsis。
- `2026-11-05` **Operations 空态光学居中**：no-fault 内容恢复图标在左、标题与说明在右的原始排版，以整组形式在剩余正文区域居中并上移 `6px`；无工单文案同样居中上移 `6px`。Ticket 数量为空时不渲染 `None`。
- `2026-11-05` **System Log 行内代码流**：日志取消固定三列，时间、设备、消息按行内顺序连续排布；换行回到最左侧，时间/设备/消息三级颜色保留，消息无省略号。新增 5 行样例内容和共享非弹性内部滚动，便于验证长消息换行。
- `2026-11-05` **下半区纵向节奏与分隔线层级**：画布行间距增至 `16px`，Statistics 行高 `210px`、上下内距 `20px`；Energy trend 顶部内距 `20px`、底部归零。两个模块顶部分隔线改为 `2px`，图表网格保持 `1px`。趋势折线上下各只保留约 8 个 viewBox 单位并占满约 94% 的图表高度，回收底部大块留白。
- `2026-11-05` **Plants Overview 全页信息层级精修**：主视觉继续保留空舞台，不提前填充内容。站点上下文拆为 System status 与 Site environment 两组；宽屏左右分布，`901–1450px` 两行两列，窄屏顺序展开。设备轨、主列和运维栏在宽屏调整为 `152px / flex / 284px`、列距 `20px`；`≤1180px` 使用 `144px / 246px`、列距 `16px`。Statistics 统一 12px 标签与 15px 数值，Savings 改为总额加 8px 比例条和语义来源列表，Self-powered 环图增加中心百分比；BMS / Heater 单行摘要压缩到 136px 并居中，消除原来的大块空区。Trend 主系列 2.4px、比较系列 1.5px 并降低透明度，使用非缩放描边。Operations 三卡统一标题行与正文区，Fault code 使用中性小胶囊，Ticket 行增加整行 hover，System Log 的 LIVE 增加状态点。浅色内容辅助文字只在 Overview 内提高可读性。专项回归新增上下文分组、比例条、环图中心值、趋势层级结构与设备摘要高度断言。
- `2026-11-05` **Statistics 四组对齐收口**：Statistics 行高增至 `224px`，四组改为严格等宽并以 `32px` 列距分隔。每组使用相同的 `20px` 标题行、`10px` 标题到正文间距和 109px 正文区；组标题统一 `14px / 510`，同顶对齐，第一行属性同基线。Energy 改为每行左右标签与读数对齐的双列规则；Savings 改为单列四行来源列表并在底部显示总占比条，避免等宽后文字省略；Self-powered 与 Current state 同步使用一致的行高。专项回归新增组宽、组高、标题 y、正文 y、首行 y、标题字号以及 Savings 无截断断言。
- `2026-11-05` **Statistics 语义重排**：根据原始设计重新映射四组含义。Energy 使用 `3×2` 方向化指标，标签在上、数值在下，分别表达购售电、电池充放、光伏与家庭用电；Savings 保留总额、四行来源收益和比例条；Self-powered 的来源行增加对应 kWh，与百分比并列；Current state 把状态和瞬时功率合并进同一实底语义胶囊。宽屏保持四等宽，`901–1450px` 改为 2×2 等宽组网格并将 Statistics 行高设为 `370px`，保证 Energy 标签完整、Self-powered 双值可读。Self-powered kWh 暂由本地样例家庭用电量乘以来源占比派生，不是后端分项读数；专项回归新增 Self-powered kWh/百分比组合、Current state 语义胶囊、三列 Energy 和无截断断言。
- `2026-11-05` **Statistics 接入 lieflat-charts**：新增 `pages/plants/statistics-charts.js`。按 skill 要求先比较 Lupi 与 Basics：选定 F6 Paired Rungs 表达 Grid / Storage / Site 两组能源方向，L3 Barcode Lollipop 的横置版表达四项节省收益，F4 Tick Donut 表达 100% 来源构成，F1 Rung Bars 表达四项实时功率。L2 Dot Cascade、L14 Hundred Field、F12 Dumbbell Queue 分别因排名语义、区域过密和前后对比语义不适配而淘汰；未使用 Glance。四张图使用统一黑白灰 ladder，梯档、lollipop 和刻度加粗到可辨认的实体重量；Energy / Savings / Self-powered 的精确值默认隐藏，hover / focus 显示，Current state 默认显示文字状态与 kW 数值。图表组沿用共享 chart 动效 token。回归覆盖模板身份、100 个百分比刻度、3 个来源图标、4 个 Savings/Current 行、无彩色描边、默认读数隐藏、focus 读数出现、Current state 常驻文字和线条最小重量。
- `2026-11-05` **Savings 横置 Lollipop 精修**：移除 Savings 区域的纵向 barcode 网格，改为每行各自一条浅色底轨、水平 stem 和放大端点。最长收益使用实心端点，其他收益使用空心端点；默认不显示金额，hover / focus 局部读数保留。专项回归新增底轨数量、无纵向网格、四个放大端点、唯一最长实心端点断言。
- `2026-11-05` **共享分段组件收束**：移除 Plants 专属 `plant-overview-trend-switch` 类和页面级 `max-width` 覆盖，默认高度、外框内缩、选项内距、圆角、字形光学校正与响应式最大宽度全部收回 `components/segmented-control.css` 的组件级 CSS 变量。页面只传入选项、标签与业务回调。组件继续提供移动指示层、键盘、ResizeObserver、快速连续切换和销毁能力；专项测试改从页面上下文定位共享 `.wd-segmented-control`，验证页面不再依赖专属类。
- `2026-11-05` **Statistics / Energy trend 双横线分隔**：按最终反馈移除两区圆角外框和四周描边，只在 Statistics、Energy trend 各自顶部保留一条 `1px` `--plant-overview-line`，不画左右与底部线；两区仍保持透明背景、四边 `16px` 内距和 `12px` 区块间距。同步移除 `Energy flow` 标题、趋势图例、纵轴刻度与底部时间范围文字；`Energy flow` 仅保留右上角 `LIVE` 与空容器，趋势内部保持 `40px` 标题和自适应图表行。统计行高为 `200px`，窄屏分段控件在共享组件内自动将选项内距降为 `8px`。
- `2026-11-04` **Plants Overview 页头收藏微调**：收藏按钮与电站标题间距收紧到 `4px`，图标下移 `0.5px` 做光学居中；按钮不挂玻璃材质，避免出现玻璃底缘。外层按钮命中区和布局盒固定不动，只让内部图标以自身中心放大：hover / focus `1.28`、按下 `1.38`。专项回归增加标题间距、图标中线、hover 中心不横移和按压缩放断言。
- `2026-11-04` **Energy trend 分段切换与周期按钮（历史中间态，动效与标签已由 2026-11-19 规则覆盖）**：本条记录早期选项与 `320ms` panel ease。当前最终实现使用 `All / Default / Battery / Frequency`、`600ms` soft-spring 胶囊和 `0px` 标签偏移；`Today` 继续是独立 36px 玻璃周期按钮，复用 Home 的日历图标、14/14 标签、`createDatePicker()` 与 Apply。
- `2026-11-04` **Plants Overview 范围页签统一**：`Overview / Devices / Site details` 共同使用 `.wd-scope-button` 的 36px 胶囊、13px / 510 标签与 4px 间距，标签行复用 Service Ticket 工具栏的上 `16px` / 下 `14px` 留白；未选中无外描边并使用 `Fills/Quaternary`，选中使用 `Fills/Primary` 与共享内描边。三个页签 hover 均提亮并放大到 `1.045`，按压到 `1.09`；`Devices / Site details` 仍保持 disabled 且不触发跳转。
- `2026-11-04` **Plants Overview 详情首版（本地交互预览）**：`/plants/:id` 从占位页升级为 Living Field 连续画布。默认选中设备顺序第一台，多设备通过左轨切换并同步 `?device=`；只有一台设备时整轨隐藏并回收画布。`Overview / Devices / Site details` 复用共享 `.wd-scope-button` 和 Service Ticket 范围控件样式：36px 胶囊，未选中为无描边的实体 `Fills/Quaternary`，选中为 `Fills/Primary` 与共享内描边，标签行复用服务工具栏的上 `16px` / 下 `14px` 留白且无底部分隔线；详情页左右内距 32px，统计与趋势横跨整行，画布填满工作区高度。玻璃材质只用于可操作控件，静态上下文条和统计面板使用普通实体表面；`Energy trend` 的四段切换与独立 `Today` 周期按钮使用共享玻璃，统计整卡不得玻璃化。顶部上下文条恢复运行状态、通信、天气、地点与本地时间四项，以图标 + 值呈现且不再显示重复字段名；`901–1450px` 使用两行两列，`≤900px` 使用单列 Flex 流并按顺序展开，不重叠。`Energy flow` 当前按用户要求只保留标题与空容器，内部设备、节点、连线、读数和圆环全部移除，后续重新设计后再接入。逆变器默认显示 `Statistics / Today` 天视图，以普通实体面板承载 Energy、Savings、Self-powered、Current state 四组；电池放电计入 From battery、电池充电计入 To battery；电池、加热器保留对应设备统计，Day / Month / Year / Total 后续接入。设备切换继续同步统计、趋势和系列显隐。右侧 Operations rail 拆成 Fault & Warning、System Log、Service Tickets 三张独立普通卡片，使用 8px 间距；Fault 卡直接展示两条告警、设备上下文与 4300 / 8093 错误码，System Log 使用深色等宽终端与共享 `HH:mm:ss` 时钟，Service Tickets 的票号和状态位于首行、标题最多两行并可直接打开。收藏复用列表存档；Devices 与 Site details 仍禁用。`tests/verify-plant-detail-overview.cjs` 覆盖设备默认与 URL、单设备隐藏、空 Energy flow、仅交互控件玻璃、实体范围控件、四张独立控件/卡片校验、四项站点上下文、无重复分割线、告警/日志密度、逆变器默认天视图、趋势切换与日期浮窗、状态条与右栏列边界、统计/趋势全宽、深浅主题、移动端无重叠与 420px 无横向溢出。
- `2026-10-30` **项目整合与标准入口统一**：新增 [项目地图](./PROJECT-MAP.md)，集中说明当前路由、数据边界、标准应用顺序、记录职责、清理与交接流程。运行时抽出 `foundations/dom.js`、`components/time-label.js`、`createStandardButton()` 和 `createMaskedIcon()`，Plants / Service Ticket 不再各自复制文本节点、时间节点、标准按钮和遮罩 DOM 工厂；移除日期选择器过期的 `.wd-date-action` 兼容类、停用的 popover/toast token、无引用的 `addMentionAction()` 与状态字段。当前页面布局、视觉、路由和交互按原样保留；另清理 1393 个可再生产物文件（约 161.97 MB），整理前快照覆盖全部被清理内容。
- `2026-10-30` **Plants 深色筛选条与表头表面（已用真实 Chrome 验证）**：已应用筛选条从普通 `Backgrounds/Tertiary` 的 `#2C2C2E` 改为 `Backgrounds/Tertiary Elevated` 的 `#3A3A3C`，解决左侧与斜向渐变面板重合的问题；表头改为滚动区外的独立同步表格，深色透明显示父面板背景，彻底移除实色矩形和 `backdrop-filter` 模糊带。浅色纯白筛选条和主面板同色表头保持不变。
- **规则优先级**：本文件按开发阶段追加，越靠上的同日条目和 `AGENTS.md` / `DESIGN-SYSTEM.md` 的最终规则优先于旧快照。下方 `2026-10-29` Service Ticket 条目中的“列表内草稿 New ticket”“textarea 回复输入”“58px 楼内行高”“深色/浅色均带描边阴影”等描述仅代表当时阶段，已被 10-30 的新工作区 New ticket、contenteditable、49px 行高和浅色纯白讨论表面取代。
- `2026-10-30` **Service Ticket 内联回复 hover 收敛（已用真实 Chrome 验证）**：一级讨论卡内的 `Leave a reply…` 编辑器在 hover / focus 时只将占位文字变为 `Labels/Primary`；左侧 28px 当前用户头像的填充、缩写色、描边和阴影保持默认。共享 `240 / 360ms` 颜色过渡继续生效，编辑器高度与按钮渐显不变。
- `2026-10-30` **全站统一时间显示（已用真实 Chrome 验证）**：新增共享 `foundations/time.js`，统一规则为 `0–9s Just now`、`10–59s` 秒前、`1–59m` 分钟前、`1–23h` 小时前、`1–6d` 天前，达到 7 天后显示本地 `YYYY/MM/DD HH:mm`。Plants 的 Last update、Service Ticket 卡片、评论、Created 与 Last activity 全部改用同一函数，保留绝对时间 `title` / `<time datetime>`；排序继续使用原始分钟值。边界和单复数由 `verify-time.cjs` 覆盖。
- `2026-10-30` **工作区标签会话级持久化（已用真实 Chrome 验证）**：`workspace.js` 使用 `sessionStorage` 的 `wattdesk.workspace.v1` 保存标签顺序、活动 ID、路由参数和页面快照。刷新后恢复 6 个测试标签、活动路由以及 Plants / Service 滚动位置；当前 URL 与旧活动标签冲突时 URL 优先，新增标签 ID 继续递增。关闭浏览器标签页会清空会话；前进/后退栈、来源标签关系和未提交业务草稿不持久化，失效资源会被剔除。
- `2026-10-30` **Service Ticket 超长输入滚动与生长（已用真实 Chrome 验证）**：独立回复框和楼内编辑器在内容超过 `180px` 后隐藏原生滚动条，通过共享 `createScrollFeedback({elastic:false})` 显示 `10px` 轨道与 `6px` 滑块；滚轮先滚动编辑器文本，文本仍可滚动时外层详情位置不变。两类回复框和工单正文的自动增高统一调用共享 `animateContentHeight()`，使用 `--wd-motion-content-grow` / `--wd-ease-content-grow` 的 `280ms`；连续输入中断上一轮并从当前可见高度继续，首次测量和减少动态效果立即落位。
- `2026-10-30` **Service Ticket 长标题换行（已用真实 Chrome 验证）**：新建与编辑态标题从单行 `input` 改为自动增高 `textarea`，短标题保持 `25px` 行盒，超过 `760px` 内容宽后自然换行并向下生长，无横向裁切和内部滚动；Enter 不插入换行，粘贴换行归一为空格。发布后的展示标题使用相同宽度、字体、行高和 `overflow-wrap:anywhere`，实测输入与展示均形成三行，文本一致且无横向溢出。
- `2026-10-30` **Service Ticket 作者徽标对比度修正（已用真实 Chrome 验证）**：`POSTER` 不再使用亮黄 `Accents/Yellow`，改为共享 Brown 64% + Black 36% 的深琥珀底白字，深浅主题对比度均达到 `4.5:1` 以上；`YOU` 保持共享 `Accents/Blue` 实底白字。两种主题文字均固定 `rgb(255,255,255)`，15px 胶囊高度与 `10px / 12px` 字盒保持不变。
- `2026-10-30` **Service Ticket Properties 作者头像字号（已用真实 Chrome 验证）**：22px 作者头像内缩写从 11px 收紧为 `9px / 10px`，实测 22px 直径、共享 0.5px 内描边与 `.wd-avatar-label` 的 0.5px 光学下移均保持不变；浅色和深色主题一致，评论区 28px 头像不受影响。
- `2026-10-30` **Service Ticket 回复输入滚动条颜色统一（已用真实 Chrome 验证）**：共享滚动反馈新增默认与 hover 颜色变量；回复输入显式映射全局 `--wd-figma-labels-*`，不再继承内容可读性覆盖后的深色 Labels。浅色主题的页面与输入滑块均为 `rgba(60,60,60,.3)`，深色均为 `rgba(235,235,245,.3)`；hover 分别统一为 `.6 / .7`。
- `2026-10-30` **Service Ticket Properties 票号（已用真实 Chrome 验证）**：详情右侧 Properties 将票号作为属性列表第一项，`Ticket ID` 标签在上、票号胶囊在下，其他属性随后排列。抽出 `ticketNumberPill()` 使列表卡片与属性栏共用 `.service-card-number` 的字体、填充、圆角和等宽数字；属性栏修饰类只将高度设为 `20px`、左右内距设为 `7px`。新建草稿发布前不显示编号。
- `2026-10-30` **Service Ticket 内容文字可读性（已用真实 Chrome 验证）**：浅色可读性覆盖只作用于 `.service-board`、`.service-empty`、`.service-detail-content`，将其中 `Labels/Secondary` 调整为约 70% 主文字黑、`Labels/Tertiary` 调整为约 55% 主文字黑；正文、属性标签、时间、回复上下文和底部中性按钮对比度均不低于 4.5:1。`Reply to this thread…` 默认提示单独使用约 45% 主文字黑，hover / focus 转为主文字黑。页头、工具栏和共享搜索框保持全局 token，不再继承内容区的加深值；禁用态和深色主题未改动。
- `2026-10-30` **共享页头轻量文字动作（已用真实 Chrome 验证）**：新增 `createPageHeaderAction()` / `.wd-page-action`，Plants `New plant` 与 Service Ticket `New ticket` 改为同一共享实现。按钮为 28px 高、左右 10px 内距、6px 图文间距、14px 图标、13px / 510 文字；默认透明且无玻璃、描边和阴影，hover / focus 才出现 `Fills/Tertiary` 浅灰胶囊并转主文字色。工具栏圆钮、Cancel / Apply 等 36px 标准玻璃按钮保持不变。
- `2026-10-30` **Service Ticket 回复输入纯文本粘贴（已用真实 Chrome 验证）**：`contenteditable` 回复框拦截 paste，只读取 `text/plain` 并重建普通段落与 `<br>`；复制内容携带的 HTML 样式、标签和布局不会进入编辑器。回归使用带红色、30px 粗体 HTML 的混合剪贴板验证，结果无 `strong`、`span` 或内联 `style`，仍为 SF Pro 15px 和 6px 段间距。
- `2026-10-30` **Service Ticket 回复字体与段间距（已用真实 Chrome 验证）**：回复输入改为 `contenteditable` 段落文本盒，明确使用 SF Pro / `Subheadline/Regular`（15px / 400 / 20px / -0.23px）。Enter 创建段落，Shift + Enter 创建段内换行，相邻段落额外 `6px` 上距；输入态与发送后的回复正文共用同一段落规则。空态、占位、提及、自动增高和 Ctrl/Cmd + Enter 提交回归通过。
- `2026-10-30` **Plants 筛选层级与搜索投影（已用真实 Chrome 验证）**：已应用筛选条恢复为 `Backgrounds/Tertiary` 实底，浅色为纯白，用于突出当前条件。搜索框下方浅边的根因不是玻璃阴影被直接 `overflow` 裁切，而是后续筛选条 / 固定表头先绘制背景并覆盖了向外延伸的投影；Plants 搜索字段现提高到高于表头的局部绘制层，阴影自然覆盖下方表面。芯片、工具栏布局和阴影参数均未改变。
- `2026-10-30` **共享搜索放大镜默认层级（已用真实 Chrome 验证）**：Plants 搜索框原本已经直接调用共享 `createSearchField()`，纯黑放大镜来自共享字段把默认色写成了 `Labels/Primary`，不是页面特判。现统一改为 `Labels/Secondary`，与侧栏 Quick search 一致；hover / focus-within 时才转 `Labels/Primary`。首页内联、全屏、Plants 工具栏和筛选内搜索同步生效。
- `2026-10-30` **Plants 顶部表面最终状态（已用真实 Chrome 验证）**：已应用筛选条使用 `Backgrounds/Tertiary` 实底，浅色为纯白，用于强调当前条件；浅色固定表头改用与 `.wd-main-panel` 相同的纯中性底色，继续遮住滚动内容但不形成第二条白带。工具栏、表格主体和页面根容器保持透明。搜索字段位于筛选条与表头上方，玻璃投影完整绘制，不能在相交处被覆盖成浅边。
- `2026-10-30` **Service Ticket 点阵主题取色（已用真实 Chrome 验证）**：深色点阵保持白色；浅色点阵改用共享 `Labels/Secondary` 深色 ink。FlipCard glare 在浅色主题继续使用白色径向渐变与 `screen`，编号胶囊扫光继续保持白色。默认与离开后仍无静态纹理。
- `2026-10-30` **共享圆钮图标随 hover 缩放（已用真实 Chrome 验证）**：`.wd-button--disc` 不再只放大玻璃外壳，内部 `.wd-control-icon` / 直接 `.target-icon-art` 在 hover / focus 时额外放大到 `1.06`，按下到 `1.12`，复用共享玻璃进入与释放 token。发布箭头视觉宽度实测 `16px → 18.42px`，布局盒仍为 16px；附件、取消、发送和三点圆钮同步生效。
- `2026-10-30` **共享蓝色主按钮 hover 文字（已用真实 Chrome 验证）**：浅色主题中 `.wd-button--primary` 不再继承普通控件的黑色 hover 主文字色，按钮宿主与 `.wd-control-label` 均保持 `rgb(255, 255, 255)`。修复位于共享 `control-states.css`，覆盖 Publish / Apply / Save 等全部实心蓝主按钮；组件回归同时检查深浅主题。
- `2026-10-30` **共享滚动回弹透明（已用真实 Chrome 验证）**：`scroll-feedback` 的顶部与底部越界面默认背景由 `Backgrounds/Tertiary` 改为 `transparent`，Plants 表格、Service Ticket 列表和 Company 筛选树统一透出各自母表面，不再需要逐页覆盖或出现通栏白色条。内容位移、滑块缩短、回弹距离和 `10px` 底部安全留白保持不变；浅色 Service Ticket 已实拍检查。
- `2026-10-30` **Service Ticket 回复内部间距统一收紧（已用真实 Chrome 验证）**：头像行到正文最终为 `8px → 0px`，楼中楼组间 `16px → 12px`，楼中楼内部上下 `14px → 10px`；楼内回复入口与内联编辑器行高 `58px → 49px`、外距 `12px → 8px`、上下内距最终 `10px`。实测头像上下留白为 `11px / 10px`，展示态与编辑态正文起点一致，三枚操作按钮仍共用行中心。
- `2026-10-30` **浅色中性灰层级（已用真实 Chrome 验证）**：浅色运行主题去除源中性变量中的冷蓝色偏，画布为 `#EDEDED`、右侧共享 `wd-main-panel` 为 `#F7F7F7` 平面灰，比参考工具约 `#F9F9FA` 的右区略深；普通玻璃与浮层 tint、次级文字、控件填充和分隔线都使用等 RGB 中性灰。Home 的统计 / 业务数据卡仅在浅色主题使用纯白底，上方四张玻璃状态卡仍保持中性玻璃。浅色主面板隐藏内外描边，双层阴影收紧到 `2px / 4px` 并略加深为 `.035 / .05`；深色背景、玻璃、内描边和阴影保持原样。
- `2026-10-30` **Plants 详情共享页头（已用真实 Chrome 验证）**：`/plants/:id` 顶部新增共享 40px `createPageHeader()`，面包屑为 `Plants / 电站名`，未知 ID 为 `Plants / Plant not found`；父级与 `Back to Plants` 共用来源标签返回逻辑。页头固定，原有电站名、公司、SN、说明和返回按钮保留在下方独立滚动区，详情占位内容未删除。
- `2026-10-30` **Service Ticket 回复操作图标配平（已用真实 Chrome 验证）**：回复保存 / 发送统一改为 16px 独立向上箭头 `send-up.svg`，不再旋转 `asset-14.svg`；原位编辑的取消 X 从 14px 收紧到 10px。三枚操作按钮仍为 36px 玻璃圆钮并共享同一中心线，X 与箭头的实际笔画厚度接近；顶部回复框、楼内新建与编辑回复同步生效。
- `2026-10-30` **Service Ticket 浅色讨论表面统一（已用真实 Chrome 验证）**：浅色主题下顶部独立回复编辑器、全部一级回复卡与右侧 Properties 统一为纯白背景，移除 `wd-discussion-card` 的 1px 内描边和零位移双层外侧投影，三者计算样式均为 `background: rgb(255, 255, 255)`、`box-shadow: none`；18px `superellipse(1.2)` 连续曲率保持不变。深色主题继续保留原共享表面，回归同时断言三种浅色讨论表面完全一致。
- `2026-10-30` **Service Ticket 编辑工单保留 Activity（已用真实 Chrome 验证）**：工单编辑态不再隐藏讨论区。Activity、一级回复卡与 `Reply to this thread…` 在 `Edit ticket` 期间保持可见和可操作，工单编辑器可与楼内回复编辑器同时存在；`Esc` 或回复 Cancel 只关闭回复编辑器，工单编辑继续保留。真实浏览器回归覆盖入口可见性、双编辑器和关闭回复后的工单编辑状态。
- `2026-10-30` **New ticket 双栏与 Properties 电站选择（已用真实 Chrome 验证）**：`New ticket` 不再在列表插入草稿卡，而是通过工作区 API 新建并激活 `/service/new` 标签，原列表标签保留。新页改为与详情相同的双栏：左侧标题、正文、附件和右对齐 Cancel / Publish 共用正文列右缘，右侧 Properties 与标题顶部对齐并正常显示 Status / Plant / Author / Created / Last activity / Replies。Plant 改为 Properties 内的搜索选择，288px 浮窗复用 Plants 公司筛选二级浮窗的 `wd-filter-menu` 内胆、玻璃搜索框、32px 行、选中标记和共享滚动反馈；支持按电站名称或 SN 搜索，单选后回显。发布后当前标签原地切换到 `/service/:ticketId` 详情，不额外新建标签，取消则关闭新标签并返回来源列表。路由支持直接打开与刷新 `/service/new`，浏览器标题为 `WattDesk · New ticket`。
- `2026-10-30` **最近访问路径宽度与父级优先（已用真实 Chrome 验证）**：首页 `Recently visited` 与左上角历史浮窗共用 `history-path.js` 的宽度测量规则，不再使用固定字符预算。`/` 左右各保留 `4px` 内距，不再因 flex 项吞空白而显示成 `Service ticket/888`。完整路径能容纳时完整显示；必须截断时优先保留紧邻末级的父路径，再缩短单页标题并保留头尾中间 `…`；只有父级加最小可读末级仍放不下时才丢弃更早层级。容器宽度或字体变化后由共享 `ResizeObserver` 重算，完整标题仍保留在 `aria-label` / `title`。
- `2026-10-30` **侧栏导航记忆（已用真实 Chrome 验证）**：每个顶层工作区标签独立保存侧栏分组最近的路由参数和页面滚动位置。Plants 列表与电站详情共用 `plants` 记忆，Service Ticket 列表与工单详情共用 `service` 记忆；从其他分组首次进入会恢复原详情，已经在该分组内再次点击同一入口则回到规范列表，且保留记忆供下次恢复。切回源 Plants 标签也会恢复列表滚动；工作区标签切换通过页面快照恢复，关闭标签时清理记忆。`verify-navigation-memory` 覆盖两段式点击、Plants 列表滚动、Service 详情和 URL。
- `2026-10-30` **全部非 Home 路由接入共享页头（已用真实 Chrome 验证）**：Coming soon 占位层改为共享 `createPageHeader()` 加原有空状态内容，Statistics、Cell balance、Module balance、Device track、Wattsonic Technology、Your teams、End users 都会显示随路由变化的 40px 页头和全宽分隔线；原有图标、`Coming soon` 文案与居中位置保持。Plants 与 Service Ticket 继续使用同一组件。`verify-routing` 覆盖全部 Coming soon 路由的页头可见性、标题和 40px 高度。
- `2026-10-30` **Service Ticket hover 点阵可读性（已用真实 Chrome 验证）**：PixelCard 点径、间距和展开时长不变，只把 `opacity / spotlight / glow` 从 `.35 / .6 / .5` 调整为 `.48 / .72 / .58`，提高卡片中部亮色点阵和指针聚光的可见度；默认与键盘 focus 仍无静态点阵、无阴影，离开后 canvas 继续清空。
- `2026-10-30` **右侧工作区单一表面修复（已用真实 Chrome 验证）**：上轮误把 `panel` 表面加到 Plants 与 Service Ticket 的页面根节点，造成 Home 外层投影与页面内层投影叠加。现在背景、圆角和投影只由 `#home-workspace-panel` 持有；深色保留 1px 内描边，浅色不绘制内外描边。Plants、Service Ticket 根节点为透明且无投影，与 Statistics 使用完全相同的右侧内容区表面。`verify-routing` 断言全页只有一个 `.wd-main-panel`，并检查两个内容视图的计算背景为透明、`box-shadow:none`。
- `2026-10-29` **Home 状态卡联动的 Plants 筛选（已用真实 Chrome 验证）**：`Sites online` 与 `Needs attention` 分别导航到 `/plants?connection=online`、`/plants?status=attention`，目标页自动显示对应筛选 Chip 和过滤结果；46 条样例中分别匹配 38 条在线电站与 13 条 Attention 电站。URL 保留 `glass` 等全局查询参数，直接刷新可恢复筛选；清除 Chip 或改成其他筛选组合时以 `replaceState` 移除预设参数。`verify-home` 覆盖点击、URL、Chip、结果数量、刷新恢复和清除后的全量恢复。
- `2026-10-29` **Service Ticket 本地交互预览（已用真实 Chrome 验证）**：新增 `design-preview/src/pages/service-ticket/` 的卡片列表、详情、会话数据和局部样式，并将 `/service` 与可直接刷新的 `/service/:ticketId` 接入工作区。列表把 `Ongoing / Closed` 混排为留白充足的等高窄卡，桌面 3–4 列；卡片左上为等宽编号胶囊、右上为状态，中部只保留标题与两行摘要，摘要后 `Separators/Non-opaque` 分隔线横向贯通，线下左侧作者、右侧时间。已发布卡片默认无描边、无投影和静态点阵；鼠标 hover 时由 `components/pixel-card.js` 在内容下方绘制低透明度像素与光标微光，并由 `components/flip-card.js` 叠加 12° 以内的指针倾斜、1.03 抬升、跟随反光和拖动回弹。编号胶囊在每次指针进入时播放一次 `680ms` 左上至右下扫光，不循环；hover 背景高亮与阴影当前暂时关闭，`--wd-card-hover-shadow` 仅保留供后续显式启用。点击仍打开工单，拖动超过 4px 会抑制 click；减少动态效果时关闭倾斜、放大、反光、扫光和像素运动。页头通过共享 `createPageHeader({breadcrumb})` 与 Plants 完全一致，只渲染面包屑，不再保留单独页面标题；固定 40px 高，面包屑与右侧 `New ticket` 同轴垂直居中，页面顶部空档收到 8px。列表为单级 `Service ticket`，详情为 `Service ticket > ticket id`，两者均使用 14px / 510、顶栏 `asset-14.svg` 前进箭头分隔和 6px 圆角 hover 底，不使用下划线。工具栏最左为状态筛选，短竖线后为默认浅灰底的 `All / Mentioned me / Created by me`，搜索靠右。卡片网格右缘对齐新工单按钮，滚动轨道位于右侧空隙。新建工单在列表内插入同构草稿卡，编辑工单、创建/编辑回复都在最终展示位置原位切换；支持一层楼中楼、Oldest/Newest、楼主/本人标签、提及选择、附件本地预览、关闭/重开及返回来源列表。详情正文使用 15px 常规字重，Activity 标题下和一级讨论卡内部使用分隔线，二级回复收在同一卡内，每卡底部提供回复框，附件只显示短文件名。工单卡片在新标签打开，原列表保留；最近访问显示 `Service ticket / 工单标题`。当前所有写入只在页面会话内，刷新恢复样例；未接登录权限、上传、持久化、服务端筛选或通知，旧顶栏通知浮层仍未恢复。
- `2026-10-29` **Service Ticket 详情对齐与范围按钮反馈**：Properties 改为与一级讨论卡相同的主题表面，顶部与工单标题对齐；吸附偏移按标题初始位置动态计算，滚动时保持同一屏幕位置。桌面操作入口从页面级页头移入工单标题行，文本 `More` 改为 `asset-70.svg` 三点图标和共享 36px 中性玻璃圆钮，图标水平/垂直中心实测重合，按钮右缘与主内容列一致。Breadcrumb 移除额外列表间距，分隔箭头左右实测各 8px；箭头颜色与父级同为 Labels/Secondary，并首帧引用 `masks/asset-14.svg`，不再先暗后亮。共享页头顶部空档同步收紧到 `4px`，范围按钮使用 `.wd-press-scale` 获得玻璃按钮同级的 hover / press / release 缩放。
- `2026-10-30` **Service Ticket 范围选中态（已用真实 Chrome 验证）**：范围按钮未选中底色减淡为 `Fills/Quaternary`；选中态提升为稍亮的 `Fills/Primary`、主文字色和 1px `Labels/Quaternary` 内描边，深浅主题都能明确区分。卡片仍为 `184px` 高，标题、正文与 Footer 几何不变。
- `2026-10-30` **Service Ticket 工单编辑态收口（已用真实 Chrome 验证）**：编辑标题与正文沿用展示态的字体、字重、颜色和无外框视觉；正文为 `rows=1` 自动增高 textarea，`resize:none`、无内部滚动。移除文字型附件入口、Mention 工具条和上传说明，改为评论区同款 36px 回形针圆钮，与 Cancel / Save 同行；`@` 提及保留。回归断言覆盖展示/编辑字体一致、零边框零 outline、无工具条、自动增高和附件按钮。
- `2026-10-30` **Service Ticket 编辑态过渡（已用真实 Chrome 验证）**：标题输入使用与展示标题一致的 `25px` 行盒，并用 `11px` 底部间距保留原 `36px` 标题行高度；正文顶部保持 `236px`，附件 chip 在展示、编辑和保存后均为 `292px`。编辑根节点改为纵向 flex，正文使用 block 显示，消除 textarea 基线空隙和 margin 合并。标题聚焦使用 `preventScroll` 并主动把 caret 放到末尾。附件、Cancel、Save 按 `0 / 35 / 70ms` 左到右错峰且仅改变 opacity；Activity 内容用 FLIP 向下移动约 `31px`。保存时标题、正文和附件保持不透明，只有按钮按右到左原位渐隐、Activity 同步回到原坐标后再重绘。减少动态效果时直接切换。
- `2026-10-29` Service Ticket 的 `All / Mentioned me / Created by me` 统一为 `36px` 高，与左侧 `All status` 控制等高。
- `2026-10-29` **Service Ticket 回复编辑器收口（已用真实 Chrome 验证）**：Activity 顶部新回复编辑器移除姓名标题行，桌面空态高约 `100px`，textarea 单行起步并最多增长到 `180px`；右下只保留 36px 中性玻璃回形针和发送圆钮，空内容时发送禁用，有正文或附件后切换为共享主按钮。一级讨论卡内回复区使用 28px 头像、7px 间距和透明内容列，与评论正文共用 `35px` 内容左缘，不额外铺高亮背景；楼内细线使用 `Separators/Non-opaque` 的 62% 透明度，Status 行去掉额外底部空白。回归新增空态、禁用/启用、多行增长、头像/正文对齐、回形针来源与分隔线强度断言。
- `2026-10-29` **Service Ticket 详情顶部留白**：详情内容区顶部内距由 `24px` 增至 `72px`，只影响工单详情标题上方的呼吸空间；列表页、共享页头与 Properties 的动态顶部对齐保持不变，回归断言锁定计算值为 `72px`。
- `2026-10-29` **Service Ticket Properties 状态分隔**：移除 Status 行下方的 `Separators/Non-opaque` 分割线，保留 3px 标签间距和紧凑高度；属性栏其他字段与讨论区细线不受影响，回归断言底部边框宽度为 `0px`。
- `2026-10-30` **Service Ticket 顶部评论框常驻与质感（已用真实 Chrome 验证）**：顶部评论框改用独立 `commentDraft`，在 Ongoing 工单中始终展示；打开楼内回复或编辑回复时，顶部草稿不会消失或丢失。顶部评论框、全部一级回复卡和 Properties 现在共用 `wd-discussion-card`：18px 连续曲率圆角、1px 内描边，以及贴边高浓度、外侧快速衰减的零位移双层阴影。占位文字在 hover / focus 时转主文字色。楼内回复占位与编辑态都绑定 `Subheadline/Regular` 并保持 58px 高度，文字与头像上下各约 15px 且点击后不跳动；操作按钮相对整行绝对居中并渐显，不参与行高，只有正文换行后才增高；POSTER / YOU 改为 `Caption2/Regular` 的 15px 胶囊。回归覆盖共享类、背景/阴影一致、连续曲率、占位 hover 色、草稿保留、双编辑器同时存在、字体一致、行高稳定、徽标尺寸与 1405px 实拍。
- `2026-10-30` **Service Ticket 评论占位动效与头像轴线**：`motion.css` 为原生 input / textarea placeholder 增加共享颜色过渡，占位色进入 `240ms`、离开 `360ms`；顶部评论框被标记为控件状态宿主，因此卡片 hover / focus 时占位文字按同一节奏变为主文字色。楼内收起态和编辑态均为 58px 高，占位和 textarea 行盒中心与 28px 头像中心完全重合，点击切换不再向上跳动。
- `2026-10-30` **Service Ticket 评论区层级重排（已用真实 Chrome 验证）**：正文与评论区之间使用通栏分割线，随后依次为常驻新回复编辑器、Activity 标题与排序按钮、一级回复卡列表。Activity 标题不再带底部分割线，避免出现第二条结构线；排序按钮增加向下箭头，复用 `asset-14.svg` 旋转 90°，并与文字同步继承共享 hover / focus 状态。1405×1270 实拍与 DOM 顺序断言通过。
- `2026-10-30` **Service Ticket 楼内回复入口垂直居中**：带 `Reply to this thread…` 或展开编辑态的一级卡片移除多余的 18px 底部内距；入口行调整为 58px，文字与头像上下各约 15px 并精确居中，两个 36px 操作按钮相对整行绝对居中且 hover 缩放不越界。展开为编辑器后保持同一中心和高度，不再出现额外底部留白。
- `2026-10-30` **Service Ticket Activity 标题与排序对齐**：标题行改为底部对齐，`Oldest first` 文字底部、箭头底部与 Activity 标题底部实测同为 `y=610px`；文字与向下箭头保留 `6px` 间距。
- `2026-10-30` **共享面包屑 hover 胶囊**：`.wd-page-breadcrumb-link` 的 hover / focus 背景半径由 `6px` 改为 `999px`，保持原有 8px 左右内距、14px / 510 文字与路径间距；Plants 和 Service Ticket 共用这一变化。
- `2026-10-30` **Service Ticket 回复楼层操作收口（已用真实 Chrome 验证）**：移除楼层内独立 `Reply` 按钮，非本人回复不生成空操作区。自己的回复仅在卡片 hover / focus 时渐显 36px 中性玻璃三点圆钮，点击后的共享菜单只含 `Edit / Delete`；编辑原位进入，删除保留确认弹窗，菜单关闭且指针离开后按钮渐隐。楼内编辑文字整体上移 1px 做字体光学校正，58px 行高和按钮垂直居中保持不变。
- `2026-10-30` **Service Ticket 回复操作共享渐隐渐显（已用真实 Chrome 验证）**：三点操作容器接入共享 `.wd-hover-reveal-host` / `.wd-hover-reveal`，卡片 hover / focus 时透明度以 `240ms` 进入，指针离开且菜单关闭后以 `360ms` 退出；修复父容器透明度瞬间切换、内部按钮动效无法覆盖父层的问题。回归同时核对进入与离开的中间帧。
- `2026-10-30` **Service Ticket 原位编辑零位移（已用真实 Chrome 验证）**：本人回复的作者行在展示态与编辑态都固定 `36px`，展示正文与单行 textarea 共用 `20px` 行盒；卡片顶边、作者行、正文位置、底部分隔线和回复入口在切换前后完全一致，只有输入换行后才增高。根因是三点按钮退出时作者行从 `36px` 缩到 `28px`，以及模板 textarea 默认最小高度 `28px` 比展示正文多 `8px`。
- `2026-10-30` **Ticket actions 菜单无标题（已用真实 Chrome 验证）**：工单标题行三点按钮打开的菜单移除可见 `Ticket actions` 标题，仅保留 `aria-label="Ticket actions"`；共享 `mountMenu()` 自动添加 `.wd-menu--no-heading`，顶部与底部内距均为 `10px`。
- `2026-10-30` **评论区排序按钮中心线校正（已用真实 Chrome 验证）**：`Oldest first / Newest first` 的文字位置保持与 Activity 标题底部对齐，按钮视觉盒下移后与文字中心重合，向下箭头改为与文字同中心；hover 灰色背景、文字和箭头的中心线均为同一 `y` 值。
- `2026-10-30` **共享头像缩写光学居中（已用真实 Chrome 验证）**：`createAvatar()` 将缩写包入 `.wd-avatar-label` 并下移 `0.5px`，修正 SF Pro 基线造成的视觉上浮；28px 回复头像的宿主尺寸、1px 内描边、深浅主题阴影和页面布局均不变，组件与 Service Ticket 回归同时覆盖文字层和变换值。
- `2026-10-30` **回复编辑 Cancel（已用真实 Chrome 验证）**：本人回复原位编辑态在附件与发送之间增加 36px 中性玻璃 X 圆钮，名称 `Cancel`；点击后丢弃当前编辑草稿并恢复原回复。三按钮同中心线，卡片编辑前后高度与顶边不变，Cancel 不参与行高。
- `2026-10-30` **POSTER / YOU 徽标文字收敛（已用真实 Chrome 验证）**：保留 `Caption2/Regular` 字族与字重，将徽标内文字调整为 `10px / 12px` 行盒；徽标高度继续固定 `15px`，作者行、头像、时间与间距不变。
- `2026-10-30` **Service Ticket 发送箭头光学校正**：发送圆钮与 14px 图标盒仍保持 36px 同心，仅对 `asset-14.svg` 旋转后的可见字形增加上移 `0.5px`，修正源路径在 16px 画布中的轻微垂直偏移。
- `2026-10-30` **Service Ticket 评论分割线留白**：正文与评论区之间的分割线上方间距由 42px 增至 84px，下方到常驻回复框的间距由 20px 增至 40px；其余 Activity 标题与回复卡间距保持不变。
- `2026-10-30` **共享无标题菜单留白**：`mountMenu()` 在没有 `.wd-menu-heading` 时自动添加 `.wd-menu--no-heading`，菜单顶部、左右和底部内距统一为 10px；Comment actions 的 `Edit / Delete` 菜单已按该规则渲染。
- `2026-10-30` **Service Ticket 原位编辑保真（已用真实 Chrome 验证）**：编辑自己的回复时保留作者、角色徽标、时间、卡片表面和底部回复入口，只将正文位置替换为编辑输入与操作按钮；卡片不会收缩或隐藏回复信息。排序文字与箭头作为同一视觉组同步下移 1px。
- `2026-10-29` **Cloudflare SPA 深链接发布修复（已上线验证）**：新版 Workers 拒绝把业务路径以 `200` 重写到 `/index.html`，会判定 HTML 后缀归一化循环。线上改为 `wrangler.jsonc` 的 Workers Assets `single-page-application` 回退，`_redirects` 只保留 `/`、`/home.html`、`/index.html` 到 `/home` 的规范跳转；新增 `verify-build-config` 防止回归。发布后 `/plants` 与 `/plants/p02` 均返回 200，缓存资源保持 `max-age=0, must-revalidate`。
- `2026-10-29` **Plants 行高亮圆角离场修复（已用真实 Chrome 验证）**：行 hover / 键盘焦点的背景沿共享 `360ms` 离场，但此前首末单元格的 `10px` 圆角只在激活选择器内声明，背景尚在淡出时圆角先被撤销，形成直角残影。现在圆角常驻在首末 `.plants-cell`，状态规则只切换背景；`verify-routing` 在离开焦点后的过渡中间帧同时断言左右圆角仍为 `10px`，且背景尚未完全透明。
- `2026-10-29` **小筛选浮窗内容内缩（已用真实 Chrome 验证）**：Device、Connection、Running status 的选项内容左移量回收为约 `20px`，复选框距浮窗左缘实测分别为 `19.89 / 20 / 20px`；选项按钮内部再保留 `8px` 文字左内距，hover 背景同步内收。浮窗宽度和底部坐标保持不变。Company 的紧凑树规则继续由 `.is-company` 独立控制，`verify-plants-filters` 同时断言两层水平内距。
- `2026-10-29` **Plants 多设备组合与筛选并集**：电站数据由单个 `device` 改为 `devices` 集合；Device 筛选顺序固定为 `Inverter / BMS / Heater`，表格按同一顺序组合显示，例如 `Inverter/BMS/Heater`。46 条样例数据中 11 条包含三类设备，Inverter 出现 25 次、BMS 34 次、Heater 27 次。Device、Connection、Running status 的多选均采用并集：任一选中设备包含在电站中，或电站命中任一选中连接 / 运行状态，即可展示。Running status 的未绑定态统一为 `Unbound`；底层枚举值保持不变。
- `2026-10-29` **Plants Device 列尾留白收紧**：短名称统一后，原 `112px` 最小列宽在 1421px 视口产生约 `50px` 的行尾空白。Device 最小宽度收到 `84px`，保留 `20px` 左内距与现有伸缩权重；1421px 实测列宽约 `88px`、文字尾到列边界约 `22px`，避免空列感并继续把余量分配给名称和右侧指标。
- `2026-10-29` **Company 筛选滚动条与弹性回馈（已用真实 Chrome 验证）**：Company 条件浮窗复用共享滚动反馈，默认 `6px`、hover `8px`、圆角、颜色与拖动同 Plants 表格一致。公司列表传入实际内容节点并启用默认弹性模式，顶部下拉、底部上拉都会移动列表并同步缩短滑块，标题与搜索框保持固定。回弹空白使用透明背景，直接透出母玻璃，不再出现普通表格实底色造成的上下接缝。公司树左侧容器内距约 `4px`、层级缩进 `12px`，名称与默认滑块间实测约 `12px`，不再贴边；轨道在选项视口上下各留约 `4px`、距浮窗右缘约 `4px`。独立 `.wd-scrollbar` 文件和 import 已移除，页面不再写原生滚动条。`verify-plants-filters` 覆盖透明回弹层、间距、左右几何、窄/宽轨道、hover、双向回弹、边缘距离和无原生滚动条。
- `2026-10-29` **最近访问层级与跨标签共享（已用真实 Chrome 验证）**：`Recently visited` 与左上角历史浮窗读取同一份全局访问归档，不再按标签复制；存储单位升级为 `{route, params}`，因此电站列表和 `/plants/:id` 是独立条目。详情路径以共享 `history-path.js` 渲染为 `Plants / 电站名`，父级与分隔符使用 Labels/Secondary，末级电站名使用 Labels/Primary。首页行扩展到右侧箭头前的可用宽度，历史浮窗扩为最多 380px 并允许长路径换行，避免截断；首页行的 hover / 键盘 focus 由整个路径容器绘制一根连续 Labels/Primary 下划线，带空格的 `/` 不再形成断口。顶栏后退 / 前进仍保持标签内独立，不混入全局访问归档。`verify-workspace-tabs` 覆盖三标签跨页共享、详情层级、两处列表一致、颜色、完整宽度及点击详情恢复 URL；`verify-home` 覆盖连续下划线的进入与退出。
- `2026-10-29` **工作区标签拖拽排序（已用真实 Chrome 验证）**：标签主体水平拖动超过 `4px` 后进入排序，跨过其他标签中心即时换位，邻居使用共享 `--wd-motion-tab-out` / `--wd-ease-tab-in` 做 FLIP，释放后源标签吸附到最终槽位。拖动不会激活被拖标签、不改变页面内容或 URL，并抑制手势尾随的 click；当前活动标签与快照保持。溢出时标签条左右 `28px` 边缘自动滚动；键盘 `Ctrl/Cmd + Shift + ←/→` 提供等价换位和位置播报。最终标签顺序按 `wattdesk.workspace.v1` 会话快照持久化。新增 `verify-workspace-tabs` 覆盖正反向跨多个标签拖动、活动标签与 URL 保持、快捷键和深浅主题截图。
- `2026-10-28` **Home 路由返回布局修复（已用真实 Chrome 验证）**：此前直接打开 `/plants` 再切回 Home 时，Home 在隐藏状态下已完成首次绝对坐标测量，`hidden` 解锁后没有重新布局，快捷入口、状态卡和统计区会沿用零高度结果并重叠，刷新才恢复。现在 `renderLocation()` 在 Home 重新可见后、下一次绘制前统一重跑首页布局；快速连续切页只执行最后一帧。新增 `verify-routing` 回归：从 `/plants` 返回 Home 后，状态卡与快捷入口、统计区之间各保留 40px 间距，坐标与直接打开 `/home` 一致。`npm run check` 与完整 `npm test` 通过。
- `2026-10-28` **Plants 长列表滚动与回弹（已用真实 Chrome 验证）**：示例数据由 26 条增至 46 条，滚动滑块因此明显变短。表体继续使用原生滚动，滑块样式、拖动、上下越界弹性与回弹缩短已抽为共享 `components/scroll-feedback.js` / `.css`；Plants 只提供内容外壳、滚动视口、表格节点与内距。默认 `6px`、`Labels/Tertiary`，hover 在固定 `10px` 轨道内增至 `8px` 并切到 `Labels/Secondary`，进入/离开使用共享 `240 / 360ms` 节奏，拖动滑块可直接改变表体滚动位置；轨道宽固定，避免 hover 改变表格列宽。轨道顶部位于固定表头下方的数据内容起始线，底部与内容区底边保留 `10px` 安全留白，每帧按布局矩形重算；轨道自身裁切，拖动和亚像素舍入都不会越界。表体到顶或到底后继续向外滚动，先经过 `4px` 粘滞区，再逐步显露最高 `16px` 的主题背景空白区；越界时滑块同步收缩，松手用 `--wd-motion-pull-rebound` / `--wd-ease-spring` 在 `640ms` 内平缓回位并恢复长度，减少动态效果时直接复位。Home 主画布、搜索面板与菜单的滚动区经审计暂不自动接入，保持各自现有语义；后续新增长列表复用共享组件。`verify-routing` 覆盖 46 行、上下边界、底部留白、双向滑块缩短、hover 宽度/节奏、拖动、双向粘滞区与回弹；`verify-components` 覆盖独立挂载和销毁。
- `2026-10-28` **Plants 宽屏列间距（已用真实 Chrome 验证）**：列宽余量在内容宽度 `1100–1500px` 间从紧凑权重平滑过渡到宽屏权重 `Plant name 0.7 / Device 0.1 / Power 0.04 / Status 0.16 / SN 0.2 / Firmware 0.08 / Last update 0.12`，避免电站名列独吞几乎全部横向余量、右侧指标挤在末端。1920px 下各列实测为 `32 / 28 / 497 / 158 / 78 / 205 / 288 / 121 / 167px`，1545px 下仍为紧凑布局。滚动条位置与列间距分开维护，跨断点不移动；深浅主题、1545×1080 与 1920×1080 实拍通过；`npm run check`、`verify-routing` 与完整 `npm test` 通过。
- `2026-10-29` **筛选二级浮窗首项对齐**：二级浮窗上移，使第一个可选项与一级类目行同一水平线；Company 考虑搜索区使用 `100px` 偏移，Device / Connection / Running status 使用 `54px`，顶部空间不足时仍夹紧在视口边距内。实测 Connection 首项与类目行误差约 `0.4px`。
- `2026-10-29` **共享动效与筛选细节修正**：toast 增加统一轻微下落淡入、上浮淡出，位移各 `4px`，分别复用浮层进入 `320ms` 与退出 `200ms` token；筛选条件文字按钮验证为 hover 进入 `240ms` / 离开 `360ms`，无局部时长。筛选条件状态图标与文字间距收紧为 `4px`。筛选条加号打开的主面板新增 `pinPosition`，新增 chip 导致触发点重排时保持打开瞬间的视口位置。Attention 图标不再被原稿 `fill-opacity=".3"` 削淡：掩码生成器改为归一化任意 opacity，实测图标以完整 `#FF4245` 显示。
- `2026-10-29` **全局 toast 移至页面顶部**：共享页头改为面包屑并将顶部空档收到 `4px` 后，toast 基准同步为 `top:70px`，与 Plants 当前面包屑中心保持同轴。收藏、刷新、周期和预览提示继续共用同一 Glass Surface；页面局部没有新增第二套通知层。
- `2026-10-29` **Plants 刷新重置列表配置**：刷新按钮在原有图标旋转和防重复触发基础上，一次清空全部筛选、恢复默认列显隐（仅隐藏 Company）并恢复 `Last update` 降序排序；筛选 / 列状态蓝点同步归零。搜索词与收藏状态保留不变。回归覆盖三种非默认配置同时存在时的刷新结果。
- `2026-10-29` **Plants Status 行内间距**：表格 Status 的状态图标与文字间距由 `6px` 收紧为 `4px`，图标与文字仍同色、垂直居中；筛选条件浮窗中的选项间距保持不变。回归断言已加入 `verify-plants-filters`。
- `2026-10-29` **Plants 详情新标签与未关联设备提示（已用真实 Chrome 验证）**：点击任一 Plants 列表行会创建并激活详情标签，原 Plants 标签保留。名称为 `?` 的电站整行可进入详情；标签和详情主标题统一显示 `?`，不再使用 `Unassigned device`。`?` 提示固定为 `This device is not currently associated with any plant. Please proceed with the setup.`，可保持打开并在鼠标移入时取消关闭意图；提示中的 `setup.` 使用真实按钮与下划线，但不显示按钮底色/外框、留在原说明段落同一行，hover 只把文字提为主色；点击后新建并激活 `?` 详情标签。`Back to Plants` 激活来源列表标签并关闭当前详情标签；直接刷新进入且没有来源标签时在当前标签内返回 Plants。回归覆盖命名电站、未关联设备行点击、`?` 标签/详情标题、提示悬停保持/离开关闭/描述清理、内联下划线、详情返回时标签关闭与标签数量。
- `2026-10-29` **Plants 筛选与列可视性重构（已用真实 Chrome 验证）**：主筛选只保留 Company / Device / Connection / Running status 四类，主筛选浮窗为 `260px`，Company 条件浮窗为 `288px`，Device / Connection / Running status 条件浮窗统一收窄为 `208px` 且选项单行；工具栏入口右缘与列可视性浮窗右对齐，筛选条加号则在自身下方左对齐打开同一内容和交互，高度贴合内容且 hover 不位移，二级是独立 Glass Surface、以 `12px` 覆盖一级内缘。一级、二级共用 `.wd-filter-menu` 四边 20px 内胆；Company 专用的宽度和紧凑左侧几何通过 `.is-company` 限制，Device / Connection / Running status 保留标准内缩。Company 长列表使用共享滚动反馈的默认弹性模式并传入列表内容节点。Company 置顶并支持玻璃搜索框、15 节点多级公司与三态复选；展开按钮与复选框同为 16px 方形，箭头为 12px 且两者垂直中心对齐，较宽的 Company 面板使多数长名称单行显示。共享搜索清除按钮修正为 18px 垂直居中，根因是 `.popover button` 泛化样式误伤嵌套控件，现已限制为 `.popover > button`。名称使用 `Footnote/Medium`，仅超长时换行、无横向滚动，超高时在 70vh/520px 上限内滚动。选中顶层公司时只生成一个顶层公司 chip。Connection / Running status 使用 18px 不透明图标，表格 Status 的 Attention 也改用不透明遮罩并在详情返回后保持红色；Company / Device 不显示图标，所有条件不显示数量。类目 hover 使用 380ms 意图延迟，斜穿其他行不会误切浮窗。每个条件都有独立复选框，勾选即时筛选且保持浮层打开，点击条件名称则应用并关闭。条件条改用设计稿的 `Backgrounds/Tertiary Elevated` 实底、chip 使用 `Fills/Secondary`，消除透明叠色造成的偏粉观感；唯一 `Clear` 固定在右侧并垂直居中。`Plant type` 已从列菜单移除；工具栏筛选 / 列按钮使用用户最终提供的 Filter / Tuning 图标，修改状态蓝点放大为 `7px`。`verify-plants-filters` 与合并后的完整 `npm test` 13 个套件通过。
- `2026-10-28` **Plants 宽屏列间距与右侧滚动条（已用真实 Chrome 验证）**：列宽余量在内容宽度 `1100–1500px` 间从紧凑权重平滑过渡到宽屏权重 `Plant name 0.7 / Device 0.1 / Power 0.04 / Status 0.16 / SN 0.2 / Firmware 0.08 / Last update 0.12`，避免电站名列独吞几乎全部横向余量、右侧指标挤在末端。1920px 下各列实测为 `32 / 28 / 497 / 158 / 78 / 205 / 288 / 121 / 167px`，1545px 下仍为紧凑布局。视口不小于 1600px 时滚动容器向右延伸到面板边缘，同时保留 24px 的表格内容内距；纵向滚动条可贴面板右缘，表头、行值与 `New plant` 仍处于同一条内容右边线，且无横向滚动。深浅主题、1545×1080 与 1920×1080 实拍通过；`npm run check`、`verify-routing` 与完整 `npm test` 通过。
- `2026-10-27` **Plants 收藏置顶（已用真实 Chrome 验证）**：已收藏的电站组成列表最前面的置顶组，未收藏的电站保持原顺序在后；组内仍按当前列排序（名称 / 功率 / 状态 / 固件 / 更新时间）排序，取消收藏后立即回到原来的普通位置。收藏状态仍只保存在浏览器 `localStorage`（`wattdesk.plants.bookmarks.v1`），刷新后保持，不涉及后端或账号同步。置顶 / 取消时用共享 `--wd-motion-panel` / `--wd-ease-panel` 做 FLIP 行位移，只动画位置变化的行，不滚动列表；`prefers-reduced-motion` 下直接换位。重渲染后键盘焦点跟随同一电站的收藏按钮。回归断言在 `design-preview/tests/verify-routing.cjs`。
- `2026-10-27` **Plants 列表改为 Linear 式信息列（已用真实 Chrome 验证；以本条为列表结构的最终值）**：列顺序为 `收藏 / 在线状态图标 / 电站名 / Device / Power / Status / SN / Software version / Last update`。收藏列在最左，与页面标题 `Plants` 同一条 x 轴线；未收藏时只保留 28px 按钮位，行 hover / focus 或已收藏时才显示图标，表头收藏格留空。在线状态紧贴电站名左侧、只显示图标不显示文字（在线 / 离线 / 部分在线 / 未绑定）；四份原稿归档在 `design-preview/design/figma/plants/`，以行内 SVG 渲染，"ink" 跟随主文字色（深色白、浅色黑），"muted" 保持 30% 透明，警示红保留 `#FF4245`。Status 只保留 `Normal / Attention / Unbound device` 的图标 + 同色文字，离线与部分在线都归为 Attention，连接细节由左侧图标区分。电站名 `Subheadline/Regular`（15 / 400、主文字色），其余内容统一 `Footnote/Regular`（13 / 400、次级或语义色），表头 `Caption1/Regular`（12 / 400）。Power 左对齐、最小列宽 60px（表头 `Power` 加排序箭头在最窄布局下也不截断）。表格最小宽度 916px（`32 + 28 + 176 + 112 + 60 + 132 + 196 + 84 + 96`）；超出最小宽度的部分按权重分给电站名 1.2 / Device 0.02 / Power 0.01 / Status 0.03 / SN 0.03 / 更新时间 0.45，软件版本固定 84px、与两个控制列一起不参与拉伸，`ResizeObserver` 在面板宽度变化时重算。软件版本列头显示 `Firmware`（完整 `Software version` 保留在 Columns 菜单与无障碍名称），最小列宽 84px，可完整显示 `V26.16.15.15`。行高 44px，hover / 键盘焦点为整行 10px 圆角的淡填充，由首末 `.plants-cell` 各自圆角拼成，不使用 `<tr>` 伪元素。实测 1368×1252 / 1545×1252 / 1920×1080、深浅主题：标题、收藏图标与信号图标同处一条身份线，收藏图标左内缩 8px，收藏 / 信号 / 名称的文字级可见间隔均为 10px，`scrollWidth === clientWidth`，无整页横滚，无表头或单元格截断，宽屏下右侧列随之展开。收藏点击不触发行跳转，整行仍进入 `/plants/:id`。
- `2026-10-27` **Plants 第二轮微调（已用真实 Chrome 验证；覆盖上一条中的收藏与列宽细节）**：收藏按钮去掉灰色 hover / focus 底，只保留图标转主文字色与焦点描边；收藏列 32px，图标左内缩 8px、不贴表格左缘，收藏图标、信号图标与电站名三者的可见间隔统一为 10px。列宽与拉伸权重最终为 `32 / 28 / 176×1.2 / 112×0.02 / 60×0.01 / 132×0.03 / 196×0.03 / 84 固定 / 96×0.45`，表格最小宽度 916px；Device 列左内缩 20px，Power 至 Status 的间距收至约 24px，SN 与软件版本、软件版本与更新时间之间分别保持 8px / 6px。列表正文 Device / Power / SN / 软件版本改用 `Vibrant Labels/Secondary`（深色 `#8A8A8A`、浅色 `#727272`），更新时间仍为 `Labels/Tertiary`。Status 的 `Unbound device` 复用在线状态列的未绑定信号图（14px、`currentColor` 中性灰），不再使用原来的提示图标。表体去掉滚动区内的顶部 2px padding，改为滚动区外 `margin-top:2px`，滚动到任意位置表头以上都不再漏出上一行文字。`npm run check`、`npm test`（含 `verify-routing`）全部通过。
- `2026-10-26` **Plants 页左右留白（已用真实 Chrome 验证；以本条为最新值）**：`.plants-inner` 新增页面级 `--plants-page-inset:24px`，内距由 `12px 12px 0` 改为 `12px 24px 0`；页头分隔线 `::after` 按该变量外扩，仍通到面板两侧，并删除已失效的 `max-width:900px` 内距覆写。用户先反馈一次“左右留白与上下一致”（16px），随后要求“再大一点”，最终定为 24px。实测 1368×1252 / 1401×1004 / 1545×1252 / 1920×1080、深浅主题：标题、搜索与表格左缘同为 x=302，`New plant` 与表格右缘同为 x=1324（1368 宽），左右各 24px；无整页横向滚动、无控制台错误。1368 与 1401 宽下表体仍有内部横向溢出（52px / 19px，由 1074px 列宽下限造成，不出现整页滚动，也不出现可见滚动条轨道），不属本次间距改动。`npm run check`、`verify-routing`、`verify-shortcuts` 通过。
- `2026-10-26` **Plants 页头 / 工具栏 / 表格线按参考图收口（已用真实 Chrome 验证；按钮与搜索以本条及下方控制条为准）**：`.plants-header` 加 `::after` 让分隔线通到面板两侧，标题改 `Subheadline/Emphasized`（15 / 590），删除 `26 plants` 计数节点与样式。工具栏搜索改用共享 `createSearchField({size:"compact"})`：36px 高、18px 圆角、`0 14px` 内距、9px 图标间距、`14/14 medium`，与侧栏 Quick search 一致，仅内容宽度 360px 为页面参数；保留共享清空按钮，`role` 为 `searchbox`，不保留 `aria-autocomplete`。右侧筛选 / 列 / 刷新改用共享 `.wd-button--pill.wd-button--disc.wd-button--neutral`（36×36、间距 8）。删除表体 `border-top` 与表头 `border-bottom`，全表只保留页头那一条线。同步修正列宽避免表头截断（`Power (kW)`、`Firmware version` 不再出现省略号），超过 24h 的时间改用 `MM/DD HH:mm` 紧凑格式（完整时间保留在 title）。实测 1545×1252 与 1401×1004：无横向滚动（`scrollWidth === clientWidth === 1079`）、无控制台错误、26 行数据、深浅主题截图通过；表头/标题/搜索左缘同为 x=290。
- `2026-10-26` **全站 URL 与深链接**：新增 [ROUTING.md](./ROUTING.md)。Home `/home`、Plants `/plants`、电站详情 `/plants/:id`，Service ticket、Statistics、Device tool、Teams 等使用各自短路径；`/`、`/home.html`、`/index.html` 以 `308` 规范到 `/home`。`routes.js` 新增 `routeFromPath()` / `pathForRoute()` / `documentTitle()`；`workspace.js` 把当前激活标签的 `{route, params}` 镜像到地址栏，支持刷新还原、复制链接、浏览器后退/前进和标签切换同步。本地 `server.js` 与线上 Workers Assets 为页面路径返回 SPA 外壳，`home.html` 增加 `<base href="/">` 保证多级路径资源不丢。电站列表整行进入 `/plants/:id`，详情视觉未立项，当前使用明确的占位页。`verify-routing` 覆盖根路径、列表刷新、详情刷新、标签切换、前进后退、Coming soon 路由与未知 ID。真实 Chrome 验证通过；完整套件以本轮最终运行结果为准。
- `2026-10-26` **Plants 视觉修订（按 Linear 参考图；共享控件与留白已验证，尺寸以本文最新一条为准）**：`New plant` 改为共享中性玻璃胶囊按钮（36px 高、`0 16px`、13px / 510，含 `home-assets/plants/plus.svg`），不再使用页面局部幽灵按钮材质；工具栏第二行只保留左侧紧凑搜索，筛选 / 列展示 / 刷新使用共享 36px 圆形玻璃按钮（新增 `plants/filter.svg`、`plants/columns.svg`；间距 8，筛选项存在或列集合非默认时右上显示蓝点，蓝点为页面状态，不复制按钮材质）。工具栏顶部 `12px` 内距，避免控件贴住页头分割线。`Plant type` 与 `Company` 默认隐藏；书签列移到最后并 sticky 右缘，名称列改为 sticky 左缘且左内距归零，与页面标题 `Plants` 同一左缘；功率与状态文字补绑 `Footnote/Regular`，不再继承浏览器默认字号。
- `2026-10-26` **Plants 电站列表（P0 已实现）**：新增 `design-preview/src/pages/plants/`（`index.js` 装配、`plants.css` 布局、`data.js` 26 条示例数据）（书签素材随后于 2026-10-27 改为内联 SVG，上述两个运行资产已移除）；`home.html` 追加页面样式，`workspace.js` 新增 `registerRouteView()`，侧栏 / 首页快捷入口 / 状态卡跳转 Plants 时显示真实列表，其余路由仍是 Coming soon。实现：搜索（名称 / 公司 / 分销商 / 安装商 / SN）、四组统一筛选（公司 / 类型 / 设备 / 状态）+ chips + `Clear all`、表头排序（名称 / 功率 / 状态 / 固件 / 最后更新，含版本号与空值规则）、列显隐菜单（`.wd-menu` 尾部勾选）、书签 `aria-pressed` + `localStorage`、五态状态圆点 + 文字、未命名电站 `?` 的 hover / focus 玻璃浮层、两种空状态、`New plant` 预览气泡、刷新图标转一圈并防重复。表格为原生 `<table>`、48px 行、sticky 表头与名称列、满宽自适应、窄视口表体横向滚动。**验证状态（2026-10-26 控制条轮）**：控制条共享按钮、紧凑搜索、菜单开合、`aria-expanded`、深浅主题、1368×1252 / 1401×1004 / 1545×1252 / 1920×1080 均已用真实 Chrome 验证；页头分割线到底部控件为 12px。列表可见、整行进入 `/plants/:id`、URL 刷新、标签切换与浏览器前进/后退已用真实 Chrome 验证；详情页使用明确占位，不虚构设备数据；筛选与查询都在本地示例数据上执行。
- `2026-10-26` **电站列表改版方案（仅文档，未实现）**：新增 [PLANTS-LIST-PLAN.md](./PLANTS-LIST-PLAN.md)，整理白色画板（现网 UI + 功能批注）的 5 张截图中可见的全部功能（顶部筛选四态、列筛选浮层、SN / 固件版本列、公司层级三态多选、书签三态、未分配设备自动新建电站、返回顶部），以 Linear Projects 为结构参考，映射到现有共享基础（token、玻璃、按钮、浮层、骨架、外壳）。方案同时列出需要新增的共享件（`data-table`、三态 `checkbox`、`filter-control`、`status-icon`）与 token（行 hover / 焦点 / 状态色）。**用户当天确认**：列表页占满右侧面板并随面板自适应；不做行多选、不做行内操作与行尾菜单，整行点击直接进电站详情。仍待确认：默认排序、Attention 颜色、未分配设备自动创建的命名与权限、详情页是否同期立项、Figma 其余画板。**Plants P0 已按上条实现；详情页视觉仍未立项。** 本机本次没有 Figma MCP 工具，`33510-87519`「电站列表」section 是依据截图读取。
- `2026-10-26` 主题切换图标闪色修复：View Transition 生成新主题快照时，元素级 `240 / 360ms` 颜色过渡会被拍进快照，未选中的 Home mono 图标因此先闪旧主题亮色。现在快照期间挂临时 `data-theme-snapshot` 把过渡压到 `0s`，`transition.ready` 后恢复；`verify-theme` 增加未选中 Home 图标的中间帧墨色断言，深浅双向实测无闪色，hover 时长恢复 `0.24s / 0.36s`。
- 真实页面为 Home 与 Plants 列表，Plant 详情只有 URL 和占位内容。运行目录 `design-preview`，`npm run dev`，默认 4173；入口 `http://127.0.0.1:4173/home?glass=figma`，`/` 会规范到 `/home`。
- `2026-10-23` 架构收口：排版运行期数据从完整 Figma 归档中投影为 `src/pages/home/data/type-runtime.json`，发布产物不再包含 `design/figma/`；`createAppShell` / `createWorkspaceTabs` 改为由页面传入 `workspacePanelId` / `panelId`，组件不再写死首页节点 ID，省略时也不输出无效 `aria-controls`；删除无引用的 `geometry-entry.css` / `.js` 空壳入口，页面显式导入 `geometry.js`；移除已应用的过期搜索补丁、一次性探针和日志。首页视觉、交互与业务表现未变，完整 10 个回归套件与发布构建通过。
- `2026-10-21` 首页模块拆分：`pages/home/index.js` 从 842 行降到 203 行，只做装配；新增 `routes.js`（路由与搜索索引唯一清单）、`layout.js`（响应式重排）、`period.js`（周期胶囊与刷新）、`search.js`（内联/全屏搜索）、`workspace.js`（标签、标签内路由与历史）、`recent-visits.js`（本地最近访问）。行为未变，9 个回归套件通过。
- 线上预览 <https://wattdesk-preview.carlwang.cn/>：Cloudflare Workers 从 GitHub `master` 构建，根目录 `/design-preview`，构建命令 `npm run build:site:public`，部署命令 `npx wrangler deploy --assets=./dist`；构建产物不入库。发布由维护者手动 push 触发，完整流程见 [发布与部署](./DEPLOYMENT.md)。
- `2026-10-21` 仓库收敛：354 个本地一次性文件（根 `tests/`、根 `output/`、补丁、177 个调试探针、部署日志）取消跟踪并写入 `.gitignore`；移除从未被部署且已过期的 `dist-public/`；`/home` 与 `/home.html` 的自指重定向死循环已删除；`/*.html`、`/src/*`、`/home-assets/*` 统一改为 `max-age=0, must-revalidate`，避免无 hash 资源在部署后与 HTML 版本错配。
- Figma 文件 `7hGGOqflIMGWTYQMm9tce0`；深色 **Home-主画板** `14434:3261`，浅色 **Home-主画板 - 浅色模式** `14704:3871`，所在 page `14405:17661`。
- 原生 HTML/CSS/ESM。双主题颜色变量、命名字体 style、原始图标和本地 SF Pro 已保存；语义 token 引用生成色表，已确认固定几何保持原稿。
- 侧栏与顶栏使用语义组件；内容仍使用首页专有场景适配。原始 509 节点用于溯源，生成场景保留 328 个，运行场景再排除已删除的 Period metadata 整枝后渲染 326 个。
- 顶部工作区标签默认只有一个 Home（不预置 Plants 占位），宽度在 58–180px 内自适应；可新增、关闭、横向滚动，并可用键盘切换；多 Home 标签统一显示 Home，各自保留路由、搜索、周期与滚动状态。侧栏导航在当前标签内切换内容，不新建标签；地址栏跟随当前标签。Plants 与 Service Ticket 显示真实本地页面，其余未建页面显示共享的“图标 + Coming soon”占位，图标沿用该路由原始彩色/中性素材。
- 顶栏后退 / 前进已接入**当前标签内**的本地页面历史：切换路由时写入该标签，端点处使用真实 `disabled` 并阻止鼠标与键盘，新路由会截断前进分支；切换标签恢复该标签自己的历史位置，关闭标签时删除对应记录。页面 URL 也已接入：刷新、复制链接、浏览器后退/前进和标签切换都会还原对应路由；标签内前进/后退使用 `replaceState` 收回规范地址。多标签集合、顺序、活动标签和滚动快照在刷新后恢复；标签内前进/后退栈仍每次刷新从当前页重新开始。
- 新增标签的最终槽位在节点插入前按“插入后”的标签数量算好；既有标签首帧直接采用新槽位，新标签只从 0 连续展开，Add 按钮随槽位移动。压缩状态下不再出现旧平均宽度的一帧闪跳。
- 无真实内容的路由使用共享空状态 `components/empty-state.js` / `.css`：图标 64px、文字 18px / 510 灰色 Coming soon，水平居中，整组相对面板垂直中心上移 119px；彩色素材保留原色，中性素材使用不透明遮罩，进入时 4px 淡入。Plants 列表、`/plants/:id` 占位、Service Ticket 列表与详情不使用该空状态作为主内容。
- 首页玻璃表面统一使用 Figma 材质，深浅参数独立；表面数量随打开的 tab 变化，当前默认只有一个 Workspace tab。弃用的 Liquid 对比不再参与运行。新增标签动态挂载同一玻璃材质，关闭时移除。
- `2026-10-22` 浅色玻璃材质按 Figma 双层结构校准：中性底压到 `rgba(238,240,243,.74)`，内亮边 `.92/.62`；底部厚度保持 `14px`，由 `4px` 纯白台面改为从 `.78` 连续衰减的短缓坡，纯白占比降低且保留上下厚度。外轮廓按纵向渐变拆成上下 `.09`、左右 `.38`、`0.75px`，hover 小幅增强到 `.11/.42`。深色参数未改。`npm run check`、`verify-glass`、`verify-theme` 通过；浅色卡片、搜索框、圆钮实拍见 `design-preview/output/figma-light/probe/soft-78-card-bottom.png` / `soft-78-search.png`。
- `2026-10-22` 发布前收尾：浅色与深色玻璃厚度、纵向渐变描边及浮窗跟随滚动一并收口，文档同步 `AGENTS.md`、`DESIGN-SYSTEM.md`、`COMPONENTS.md`、`LESSONS-LEARNED.md`、`USER-REQUIREMENTS.md`、`TOP-BAR-TABS.md`。最终 `npm run check`（60 个 JS）、完整 `npm test`（10 个套件）与 `npm run build:site:public`（`dist`、181 files、1.27 MB）全部通过。
- `2026-10-22` 深色玻璃白光收敛：深色普通玻璃白内沿顶/底由 `.17/.14` 降为 `.145/.118`，内阴影高光由 `.10/.14` 降为 `.085/.12`；Glass Surface 白内沿顶/底由 `.18/.14` 降为 `.15/.118`。上下反光带长度、形态、深色外轮廓 `.95`（普通）与 `.72`（浮层）以及浅色全部参数未改，厚度仍可辨。发布前将 `verify-search` 的浅色断言改为最终纵向渐变描边（上下 `.08`、左右 `.10`），并明确全屏搜索是浮层外轮廓的搜索专用例外；`npm run check`、`npm test`（10 个套件）、`npm run build:site:public` 通过。深色卡片、菜单、日期浮层与圆钮实拍见 `design-preview/output/dark-lightglow/card.png`、`menu.png`、`date.png`、`disc-top.png`。
- 本地实现搜索、语义日期选择器、分类折叠、状态卡导航、预览 CSV、主题切换和刷新反馈；侧栏 `Teams` 默认收起（`Device tool` 默认展开），首次点击展开后可正常收起；搜索、语言、设置等预览菜单仍使用共享 Popover。日期选择器预设为 Today、Yesterday、Last 24 hours、Last 7 days、Last 30 days、This month、Custom range，使用 Start date / End date 与 Apply，旧 `Custom date range…` 入口已不存在。Sites online 与 Needs attention 点击后在当前标签跳转 Plants，不弹摘要浮窗。图表使用原始导出，首次可见有轻量载入。标签增删、内容淡变和关闭按钮颜色均有平滑过渡。
- `2026-10-22` 首页三列快捷入口行恢复实际跳转：Workspace 的 Plants、Service ticket、Statistics 分别进入各自路由；Following 的五个示例电站行暂时统一进入 Plants，因为名称尚未对应真实电站 ID；不新增虚假的站点页面。全部行复用共享 `enhanceControl()` / `openRoute()`，鼠标、Enter 和 Space 均可在当前标签内打开，不新增标签，下划线与 hover / focus 不变。单行聚焦回归见 `tests/verify-shortcuts.cjs`。
- 首页 `Recently visited` 使用浏览器 `localStorage`（`wattdesk.recent-visits.v1`）保存最近 8 条 `{route, params}` 访问记录，刷新后仍在；连续重复位置不追加，首次进入至少保留当前 Home。所有工作区标签共用这一归档，左上角历史浮窗读取同一数据；顶栏后退 / 前进仍按标签独立。它只是本地预览归档，不能称为云端同步或跨设备历史。列表行左侧固定使用原始中性时钟图标，路由彩色图标只出现在历史浮窗中。电站详情按 `Plants / 电站名` 展示层级并保留完整名称。两条 `View all` 均是真实按钮，共享下划线与 hover / 键盘 focus 的主文字色（深色纯白、浅色主墨色），但点击目标不同：Following 在当前标签跳转 Plants，Recently visited 打开锚定侧栏历史图标的历史浮窗；都不切换或新增标签。
- 搜索使用共享 `search-surface.js`：侧栏快捷入口、首页内联搜索框和结果面板共用 `Ctrl/Cmd` + `K` 双键帽，统一 `Footnote/Regular`、SF Pro、`4px` 间距与主题次要文字色；首页内联键帽组右缘固定内缩 `20px`。全屏搜索框由 `createSearchField()` 生成，直接复用首页字段的 `46px / 23px` 胶囊、18px 放大镜、共享玻璃填充与模糊，只省略快捷键；放大镜使用 `masks/asset-35.svg` 不透明遮罩。两处可见默认文字同读 `search.js` 的 `SEARCH_FIELD_PLACEHOLDER`，不得再单独写全屏占位文案。首页内联结果浮窗复用日期选择器的玻璃表面，全屏搜索使用整页高斯模糊、同一字段和独立结果面板；空白点击与 Esc 均可关闭。两处搜索框均通过 `.wd-glass--no-scale` 禁止点击放大。底部 `↑ ↓ Navigate`、`Enter Open`、`Esc Close` 是可操作按钮：分别推进选中项、打开选中项、关闭当前搜索面板；鼠标点击后焦点保持在输入框。结果项固定 40px 高，标题与分类同行为 `Plants - Pages`，标题主色、分类次级色，中间 4px。清除按钮通过真实 `input` 事件让结果区回到 Quick links / Recent searches。查询为空时显示本地 `wattdesk.searchHistory.v1` 保存的 Recent searches（最多 8 条、可删除），它是历史搜索而非最近访问页面；输入后替换为本地索引结果。当前仍未接入后端搜索或云端历史；页面路由已接入，见本轮 URL 与深链接条目。
- 账户入口与通知按钮的旧上下文/通知浮层已按用户要求删除，等待重做；按钮、玻璃和 hover 状态保留。重做前点击不展开旧浮层，也不得从旧组件、历史文档或备份恢复。
- `2026-10-22` 浮层菜单统一：新增共享 `components/menu-popover.js` 与 `.wd-menu` 内胆，`History`、`Language`、`Appearance`、`WattDesk` 共用 20px 顶距、10px 侧/底距、36px 行高、14/14 medium、固定 20px 勾选槽和 10px 尾距。顶栏三个紧凑菜单统一 `200px / 30px`；历史浮窗于 `2026-10-29` 为完整路径调整为最多 `380px / 30px`；Glass Surface 材质与深浅参数未改。语言列表加入 `简体中文`、`Deutsch`、`Čeština` 占位，只做本地勾选视觉，不接本地化或持久化。`npm run check`、`verify-floating-surfaces` 与最终完整 `npm test`（10 个套件）通过。
- `2026-10-22` 连续圆角定稿：共享曲线由 `superellipse(1.05)` 调整为用户在实际 30px `Energy generated` 卡片上确认的 `superellipse(1.2)`。卡片仍为 30px、右侧大底 10px，正圆/胶囊保持原形，尺寸、间距、描边、玻璃和投影均未改；30px 对角轮廓比普通圆角内收约 0.97px，肩部更紧但仍读作原半径。该值是视觉选择，不是 Figma 60% 的数值换算。`verify-foundations` 通过（`contour.shared=superellipse(1.2)`、动态节点同步、圆/胶囊不变），并已生成深浅主题卡片与首页截图。共享入口继续自动分类现有及未来节点，包括新增 DOM 和尺寸变化。
- `2026-10-22` 浮层跟随滚动：共享 `components/popover.js` 由“打开时测一次坐标”改为实时定位，`scroll` 采用 document 捕获阶段监听嵌套滚动区，`resize` / `visualViewport` 变化用 `requestAnimationFrame` 合并重算；以 `offsetWidth` / `offsetHeight` 避开开合缩放的翻转漂移。触发元素一半以上滚出视口时关闭，不再夹在视口边缘。日期选择、`Chart options`、顶栏菜单、历史浮窗自动继承；内联搜索结果由滚动关闭改为跟随定位，工作区标签 tooltip 补齐同一套捕获滚动 / `visualViewport` 重算并在标签离开视口时收起；全屏搜索是模态、不跟随。`verify-floating-surfaces` 新增两类真实滚动断言并清除调试输出，`npm run check` 通过。规则已同步 `DESIGN-SYSTEM.md`、`COMPONENTS.md`、`USER-REQUIREMENTS.md`。 同一规则也已写入根 `AGENTS.md`，后续新浮窗默认复用，避免只在组件文档中可见。
- 统计周期胶囊的宽度由文字决定，预设与自定义范围切换后自动调整，不裁切；刷新按钮右缘与图表卡片右缘对齐，胶囊向左增长并保持 10px 间距。浅色状态卡箭头使用 `.55` 黑色透明度，首页大标题为 semibold 590；`Newly commissioned sites` 与 `New devices added` 的七根柱使用原稿 `15.24px` 宽，深浅主题及目标视口均不越出图区。滚动到底的底部留白以最后一张图表卡片为基准，具体数值由单独的布局文档负责，本项目状态与规范不再另设固定值。
- 组件级共享动效契约已落在 `src/foundations/motion.css`，由 `shared.css` 自动加载。原生控件、常见 ARIA role、共享控件/玻璃/tab/快捷入口/折叠箭头以及后续挂载的 DOM 自动继承 hover 进入 `240ms` / 离开 `360ms` 与共享缓动；组件只声明视觉状态。WAAPI 统一读取 `motionDuration()` / `motionEasing()`。
- `2026-10-21` hover 颜色节奏调整为“弹性灵动”并整体拉长：进入 `240ms`（`cubic-bezier(.16,1,.3,1)`，快起缓收），离开 `360ms`（`cubic-bezier(.3,0,.2,1)`，柔和退场）。宿主在 hover / 键盘 focus 时切换共享变量，背景、文字与图标叶节点继承同一节奏；玻璃缩放仍为 hover `300ms`、按下 `110ms`、回落 `420ms`。Workspace 标签关闭沿用 `260ms`（`--wd-motion-tab-close`），浮层与搜索退出改用离开缓动，避免复用进入曲线导致退出前段过快。
- `2026-10-21` 浮层圆角规则：新增 `--wd-radius-compact`（12px），tooltip 与图表数据浮签由 10px / 8px 统一为 12px；通用 popover / 图表菜单保持 18px，标准浮层菜单与大面板使用 30px（2026-10-22 将顶栏紧凑菜单一并归入 30px）；`addSurface()` 半径同步，浮层材质层继承宿主轮廓。相关测试更新并通过。
- `2026-10-21` 规则归档审计：日期输入固定格式与整框错误态、错误行位置与生长动画、月份标题对齐与切月固定、Apply 实心蓝、浮层退出同步淡出、Glass Surface 默认材质与三档圆角均已写入 `USER-REQUIREMENTS.md`、`DESIGN-SYSTEM.md` 和 `COMPONENTS.md`。另行补记“侧栏导航 / 标签切换离开当前页面必须关闭活动浮层”的共享生命周期要求；该条已在 2026-10-26 的 URL 路由实现中落地。
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

没有其他页面的真实内容、登录/权限后端、账户服务、设备命令、实时统计或生产数据导出。Statistics 与 Device tool 等标签仍是 Coming soon 占位。Plants 和 Service Ticket 有可操作的本地界面；Plants 拥有可刷新的 `/plants/:id` Overview 详情和可分享的 `?device=` 选择，Service Ticket 拥有可刷新的 `/service/:ticketId` 地址。Plants 的设备值、告警、日志、趋势与工单关联仍由本地样例派生；Service Ticket 的原位新建/编辑、回复、提及、附件预览与状态切换均在本地会话执行，刷新恢复样例；未接后端、权限、上传、持久化或通知。不得把演示行为写成已完成的业务能力。

绝对坐标 scene 是首页过渡适配，不能作为后续页面的通用布局。未来页面采用语义布局，复用相同基础与组件。

## 验证记录口径

- 本文所有带日期的检查结果均为当时快照，不代表当前状态；最新一次真实运行单独记录，不能用旧通过或旧失败互相覆盖。
- 未实际运行时明确标注“未运行”，不得把静态代码或文档核对写成测试、截图验证通过。

## 最近一次实际运行（2026-11-25）

- **设置页 native-first 滚动优化**：`verify-components`、`verify-plants-filters`、`verify-routing` 与 `verify-inverter-settings` 全部通过；共享组件确认 wheel 事件不被阻止、视口 `overscroll-behavior:contain`，设置页普通滚轮 `100px → 100px`，顶部第一格边界反馈约 `4px`。`npm run check` 与 `git diff --check` 通过。
- **共享实底按钮深色高光最终验收（已用真实 Chrome 验证并由用户确认）**：深色默认使用 rim `0.38 / 0.24`、inner `0.21 / 0.11`、optical `0.15 / 0.075`；hover / 键盘 focus 额外增强共享 hover 光场与内侧边缘。`Save` 和 `Discard Changes` 均通过共享 `primary / danger-solid` 实现，浅色参数未改。`node tests/verify-components.cjs`、`npm run check` 与 `git diff --check` 通过。
- **初始化 / 设置专项边界已解决**：早先 `verify-inverter-settings.cjs` 曾被尚未同步的 Battery Protocol 断言拦截；后续已更新断言并完成整页专项。初始化专项同时覆盖双机型路由、共享 MPPT、BMS / Protocol、Permissions、计划错误、完成页自动 / 手动关闭、透明插画和图标锐度。

## 历史实际运行（截至 2026-10-30）

- **Plants 深色筛选条 / 表头修复（已用真实 Chrome 验证）**：筛选条计算色为 `rgb(58,58,60)`；表头位于数据滚动区外、背景透明且 `backdrop-filter` 为 `none`，表体滚动内容不会再进入表头区域。浅色筛选条仍为纯白、表头仍与主面板同色。`node tests/verify-plants-filters.cjs` 通过。
- **共享头像 24px 字号修复（已用真实 Chrome 验证）**：卡片作者头像实测保持 `24×24px`，缩写文字由 11px 收紧为 `9px / 10px`，`.wd-avatar-label` 仍为 `0.5px` 光学下移；Properties 22px 头像同样走共享 compact 档。组件测试同时锁定 28px 为 `11px / 13px`、36px 为 14px。`node tests/verify-components.cjs` 与 `node tests/verify-service-ticket.cjs` 通过。
- **Service Ticket 浅色 hover 点阵修复（已用真实 Chrome 验证）**：浅色画布改用 `rgb(60,60,60)` 深色点阵，底部峰值 alpha 约 `73`，深色点阵在 `#EDEDED` 表面上可直接辨认；深色主题继续使用白色点阵，点间距、展开时长与清理不变。`node tests/verify-service-ticket.cjs` 通过，`npm run check` 通过（77 个 JavaScript 文件、76 个运行 JS/CSS 文件），`npm run build:site:public` 通过（213 个文件 / 1.65 MB），`git diff --check` 通过。
- **项目整合最终结果**：`npm run check` 通过（77 个 JavaScript 文件；76 个运行 JS/CSS 文件通过标准检查，必读文档存在且本地 Markdown 链接有效）；完整 `npm test` 通过（18 个套件）；`npm run audit:assets` 通过（125 个运行资产，0 unused / 0 missing）；`npm run build:site:public` 通过（`dist` 213 个文件 / 1.65 MB）；连续两次 `npm run sync` 的六个生成文件 SHA-256 不变；`git diff --check` 通过。视觉、主题、路由、响应式、Plants 筛选、Service Ticket、工作区标签和工作区持久化均无回归。
- **同日先前规则收口结果**：共享检查覆盖浅色中性灰层级、Plants 筛选条 / 表头 / 搜索投影、共享搜索图标、共享页头动作、Service Ticket 搜索 token 隔离、Properties 票号顺序、全站时间边界与内联回复 hover；相关截图和计算样式均符合最终规则。此前 `verify-service-ticket.cjs` 的单项滚动回弹失败已由后续完整回归确认不再复现。
- **Service Ticket 收尾结果**：`npm run check` 通过（72 个 JavaScript 文件）；`npm test` 通过（16 个套件，含 `verify-service-ticket.cjs`）；`npm run build:site:public` 通过（`dist` 209 个文件 / 1.6 MB）；`npm run audit:assets` 通过（124 个运行资产，0 unused / 0 missing）；`git diff --check` 通过。真实 Chrome 以 1421×1252 与 1569×1252 检查列表和详情：列表与详情页头均为 40px 高，单级和多级面包屑统一为 14px / 510，面包屑与 `New ticket` 中心线同一；分隔箭头左右实测各 8px，颜色与父级一致并使用首帧不透明 mask。默认与 hover 的卡片背景、`box-shadow` 均相同且分别为固定底色与 `none`，canvas 默认透明度为 `0`；指针 hover 后 canvas 透明度为 `1` 并出现 PixelCard 纹理，FlipCard 倾斜、抬升、反光和编号单次扫光启动，离开后全部状态清除。编号扫光只运行一轮并在结束后透明；滚动视口左、上预留空间断言通过，网格右缘与 `New ticket` 对齐且滚动轨道位于右侧 10px 空隙。编号使用中性 `Fills/Secondary`，分隔线为深色可见的 `Separators/Non-opaque`；头像缩写实测 11px / 400、作者间距 6px。范围按钮 hover / press 缩放和释放断言通过。Properties 与一级讨论卡同背景、顶部与工单标题对齐并保持吸顶；标题行操作入口为 36px 中性玻璃圆钮、18px `asset-70.svg` 三点图标，图标水平/垂直中心与圆钮重合且右缘与主内容列对齐。详情回复编辑器空态实测约 100px；回形针与发送按钮均为 36px 玻璃圆钮，空内容发送禁用，填写后转主按钮；多行正文在 180px 内自动增高，楼内 28px 头像与评论正文左缘对齐。详情还覆盖正文无卡片底、Author 头像、Activity 顶部回复器、一级讨论卡/楼内轻分隔线/每卡回复框、关闭状态和返回来源列表；另有 420px 单列布局与深浅主题验证。
- **发布前最终结果**：`npm run check` 通过（65 个 JavaScript 文件）；`npm test` 通过（14 个套件）；`npm run build:site:public` 通过（`dist` 198 个文件 / 1.45 MB）；`npm run audit:assets` 通过（121 个运行资产，0 unused / 0 missing）。
- `git diff --check` 通过，仓库内无冲突标记；合并后筛选、工作区标签、路由、响应式、玻璃、主题、基础组件、动效与搜索套件全部通过。
- 本地 Git 收口：确认 `codex/plants-filter-visibility` 的核心改动已由 `master` 包含且旧副本缺少后续修复，因此删除该分支与本地 `test` 分支；合并前备份 stash 与当前 `master` 内容核对后已移除。当前仅保留 `master`，worktree 注册仅剩主工作区。
- 筛选与可视性回归覆盖 4 个类目、15 节点多级公司三态、复选不关闭、名称点击关闭、短 chips / 加号 / 唯一 `Clear`、Eye 列显隐、键盘展开、刷新重置和浅色主题；路由回归覆盖详情新标签、返回来源列表、URL 刷新和从 Plants 返回 Home 的布局重算。
- 真实 Chrome 验证 `/home`、`/plants`、`/plants/p02` 刷新保持当前页面，且 `/plants/p02` 资源无 404；未知路径显示 not-found，不回到 Home。
- `npm run audit:assets` 已修正绝对站点路径、跨级相对路径和 `opaqueMaskURL()` 掩码路径的解析；121 个运行资产全部可达，不再有历史三项误报。
- 真实 Chrome 在暗色与浅色下检查历史面包屑：父级与 `/` 读取 Labels/Secondary，末级电站名读取 Labels/Primary；首页行与 380px 历史浮窗均可完整显示，控制台无错误。
- 真实 ChatGPT 内置浏览器在 `/home` 建立三个不同路由标签，用鼠标将首个标签拖到末尾、再拖回首位；顺序正确，活动 `Statistics` 标签及 `/statistics` URL 保持不变，控制台无错误。
- 真实 Chrome 以 1508×1252、DPR 1.5 验证 Plants 滚动轨道顶部 `216px`（固定表头下沿）、底部 `1222px`（较内容底边保留 `10px`）；深色和浅色滚动到底时滑块圆头均清晰可见，顶部、底部与回弹过程均未越界，控制台无错误。
- 未运行 `npm run test:visual`：旧基线对应整理前界面，仍不应以旧截图覆盖当前变化。

## 已知待校准

- 已解决：浅色玻璃外圈黑线已按最终纵向渐变收敛为普通上下 `.09`、左右 `.38`（hover `.11/.42`），浮层 `.16/.20`，全屏搜索结果面板使用搜索专用 `.08/.10`；hover 不再弱于默认，深色保持不变。`.12/.16`、`.14/.18` 与更早的 `.23/.29` 均为历史中间值，不再作为当前规则。
- 待代码收口：规则已确认 Devices 顶部普通技术值使用标准界面字体、不使用特殊代码字体，但当前 `devices.css` 的 `.plants-device-field-value` 仍声明 `ui-monospace` 字体栈。本次仅做规则归档，未修改运行代码；后续视觉修复时应单独立项并补充 computed `font-family` 回归。
- 待产品确认：用户口述年 Combined 为“365 天”，当前实现按日历在平年生成 365 点、闰年生成 366 点（例如 2028 为 366）。如果要求所有年份固定 365 点，必须先定义闰日处理，不能静默丢弃 12 月 31 日。
- 待后端定义：Statistics 的真实历史数据源、聚合时区、未来日期是否允许选择、跨月缓存和失败重试尚未确定；当前 `Day / Month / Year / Total` 与 Combined 数据均为确定性本地预览。
- 已解决：Home 继续使用响应式最大 `1000px` 与独立阴影 gutter；Home 以外的数据表 / 设备页使用满宽内容区，不占满屏的设置、详情和资料页使用共享 `.wd-page-content` 最大 `1000px` 居中。被否决的是旧“固定画布 + 区域整体缩放”和把所有页面都套成 Home 内容列，不是共享最大宽度本身。

## 待确认 / 待实现

- Site details 标题输入目前只向下生长，尚未确认超长标题的最大高度或超出后的折叠方式；不要自行增加滚动或截断。
- Site details 当前通过 `.wd-discussion-card` 宿主加页面材质覆盖实现无边框无阴影；是否抽成共享 SettingsCard 尚未确认。调整共享讨论卡前必须复核本页覆盖。
- 数据页不再使用单独的大标题节点；Plants 与 Service Ticket 均通过共享 `.wd-page-breadcrumb` 渲染当前页，单级和详情路径统一为 14px / 510。首页的页面级大标题仍保留各自设计稿的 590 规则。
- 菜单字体：`Chart options` / `Language` / `Appearance` / `WattDesk` 是手写预览 DOM，没有对应 Figma 菜单节点；当前保留 13px，待节点或产品规则。
- `Subheadline/Emphaized Italic` 是 Figma 源数据拼写问题；当前无代码绑定该拼写，待改源后同步或明确记为命名债务。
- 时间展示当前使用浏览器本地时区，并在页面渲染时计算；尚未定义站点 / 账号时区字段或相对时间的自动周期刷新频率。

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
