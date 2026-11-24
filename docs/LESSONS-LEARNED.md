# 经验与防回归清单

更新：2026-11-24。本文只记录已经发生、已纠正且容易再次踩到的问题。开工前先读本页，再读 [用户要求记录](./USER-REQUIREMENTS.md) 和与任务相关的组件文档；Inverter settings 的有效页面规则见 [页面契约](./INVERTER-SETTINGS.md)，本页只保留可复用的根因和验收方法。用户当前明确要求仍优先于历史经验。

## 2026-11-24 ToU shared controls and destructive states

### Price series and planned operating modes need different visual channels

- **Symptom**: Dynamic ToU drew 96 pairs of bars and colored each pair by the
  current operating mode. The chart therefore mixed price magnitude with ToU
  state, and it no longer matched the live page's two stepped price lines.
- **Source check**: The live `24h Overview` DOM uses blue Buy and orange Sell
  step lines. Planned runs are separate full-height background rectangles:
  uncovered time is General, plan-covered time uses that period's mode tint,
  and both layers remain visible together.
- **Final rule**: Keep the 96 fifteen-minute price points on two 2px stepped
  lines. Render plan coverage as a separate background layer, with General Mode
  filling uncovered gaps. Do not encode mode by recoloring individual price
  bars or points.
- **Prevention**: Before changing chart semantics, inspect the live DOM/SVG and
  source bundle when available. Regression must assert both line series and the
  independent mode-band layer.

### ToU time picking must not grow a second wheel implementation

- **Symptom**: ToU initially used a text-based popover while Economic Schedule
  used the established four-wheel time control; interval restrictions were
  validated only after entry.
- **Fix**: `components/time-range-control.js` now owns the eight-digit mask,
  wheel DOM, caret navigation, validation-on-close and cleanup for both pages.
  Callers pass `stepMinutes`; `1 h` exposes only `00` minutes, `30 mins`
  exposes `00 / 30`, and `15 mins` exposes four values.
- **Prevention**: Time range changes must be verified through both Economic
  Schedule and ToU, including editing a middle digit and Backspace at the caret.

### A custom red class does not make a confirmation destructive

- **Symptom**: ToU delete confirmation turned its red label into the theme
  primary ink on hover because the shared control hover rule uses `!important`.
- **Fix**: Dangerous confirmations without an explicit variant resolve to the
  shared `danger-solid` button. Its red fill and white label remain unchanged
  through hover and keyboard focus. Menu rows use shared `.is-danger`.
- **Prevention**: Do not create page-local danger colours through class names.
  Use the shared danger menu and solid button variants, then assert computed
  hover/focus colours.

### Inline error identity must not come from the current value

- **Symptom**: Repeated ToU time edits stacked multiple copies of the same error
  under one row and made the table tall enough to look broken.
- **Root cause**: field identity fell back to `input.value`; each wheel position
  produced a different error key, so the shared error component appended a new
  message instead of replacing the current one.
- **Final rule**: ToU inputs use their stable `data-isw-tou-time-input` identity.
  One field owns at most one current error. ToU errors span the Time range / Mode
  columns on one left-aligned line and use short copy.
- **Prevention**: Any repeated inline-validation surface must derive identity from
  a stable model key, never display text, timestamps or transient input values.

### Sparse wheels must not fake continuity with hidden duplicate cycles

- **Symptom**: At 15 / 30 minute intervals the wheel visibly jumped while
  scrolling because four or two values were repeated into five hidden cycles and
  recentered through a distant copy.
- **Final rule**: `1 h` renders one static `00`; 15 / 30 minutes render their
  allowed values once with proximity snapping. Click-driven smooth centering
  temporarily suppresses scroll-to-draft synchronization so Playwright’s
  pre-click scroll or a browser intermediate frame cannot overwrite the chosen
  value.
- **Prevention**: Verify wheel count, cycle count, stable scroll position, center
  alignment and draft value together. Do not use “identical repeated content” as
  proof that a loop jump is invisible.

### “No truncation” is a measured layout contract

- **Symptom**: Reducing the main ToU table to 640px fixed several earlier layout
  issues but clipped `Battery Discharge` and made kW values crowd the PV switch.
- **Final rule**: Resolve column widths against the actual content box, keep
  `Mode` wide enough for the longest live label, keep time input scrollWidth within
  clientWidth, keep the PV header nowrap, and preserve a measured gap before the
  PV switch.
- **Prevention**: Test the rendered text/input fit and target-to-neighbour distance;
  do not infer fit from a container screenshot or only from grid-template values.

### Informational tooltips share a centered anchor

- **Symptom**: Battery power-limit and Economic power-limit help panels opened to
  the right of their info icons and could escape the card’s visual reading line.
- **Final rule**: Both use shared `bindHoverPanel(...,{align:"center"})`; panel
  center and trigger-icon center differ by at most 1px.
- **Prevention**: Position assertions belong beside tooltip text/material checks.

### `color-mix()` cannot consume a gradient background token

- **Symptom**: The scrolled ToU Advanced title lost its background tint.
- **Root cause**: `--wd-main-panel-background` is a gradient in dark mode, so using
  it inside `color-mix()` made the declaration invalid.
- **Final rule**: Tint overlays must mix a solid semantic colour token such as
  `--wd-bg-secondary`, then layer blur separately.
- **Prevention**: Check the token’s value type before using it in colour math.

### Schedule color must not compete with the price curve

- **Symptom**: Full-height mode tints made the Dynamic ToU plot read as six large
  pastel blocks. Muting and blurring those blocks made them dirty without fixing
  the hierarchy; even after restoring theme colors, mode fill still competed with
  Buy and Sell.
- **Final rule**: Keep the six semantic modes in the plot background at 8 percent,
  with crisp internal boundaries and a mask only at the outer edges. Do not add a
  separate mode rail. Buy is the 2px primary line with a restrained area fill;
  Sell is a 1.5px secondary line. Emphasize only the active 15-minute column
  during hover. Keep the user-approved legend structure unchanged.
- **Prevention**: Assert the background colors and 8-percent opacity, crisp
  `filter:none`, plot edge mask, Buy area, line hierarchy, price summary and
  hover-column mode. Also assert that the legend's text and DOM order have not
  changed and that no mode rail is rendered.

### A changed source file does not prove the user’s tab has changed

- **Symptom**: The latest ToU title class existed in the working tree and rendered
  correctly in an isolated verification tab, but the user’s actual preview tab
  still showed the older DOM and reported that the change had not landed.
- **Root cause**: The long-lived preview tab had stale CSS/JS/DOM. Testing a fresh
  tab or running the page suite proves the implementation, not that the user is
  looking at it.
- **Final rule**: Visual completion requires checking the user’s actual preview
  tab. Confirm that the new semantic class, token, computed layout or behavior is
  present there; if absent, reload that tab and re-enter the target page before
  reporting completion.
- **Prevention**: Record evidence from the actual tab, including the new class or
  computed style and a fresh screenshot. Do not use “source changed” or “test tab
  passed” as a substitute.

## 2026-11-24 编辑字段状态与动效契约

### 共享字段动效不能依赖页面类名清单

- **现象**：数字字段和 Wi-Fi 字段样式一致，但新增 Wi-Fi 字段的 hover 背景瞬时变化；在 `motion.css` 补上 `.isw-wifi-field` 后症状消失，下一次新增字段仍可能再次遗漏。
- **根因**：字段表面状态由 `edit-field.css` 和页面 CSS 维护，过渡规则却由 `foundations/motion.css` 手工枚举 `.isw-number / .isw-mini-number / .isw-wifi-field` 等页面类名。新增变体需要跨文件人工登记，测试又只验证 hover 的最终颜色，不能发现“有样式、无中间帧”。
- **最终规则**：所有 `.wd-edit-field` 直接继承同一 `380ms` disclosure 契约；`motion.css` 不得再维护页面字段白名单。字段颜色通过共享自定义属性提供，基础、hover、focus、invalid、disabled、深浅主题和 Select 触发器共用同一状态矩阵。字段内输入、Select 当前值、占位文字、箭头和单位也继承同一节奏。默认 outline 固定为 `1px solid transparent`，focus 只动画颜色，避免轮廓样式从无到有造成突变。
- **验收**：用真实 Chromium 同时挂载直接输入、复合输入和 Select 字段；断言 computed transition 包含背景、边框、阴影和 outline，hover / leave / focus 在中间时刻的颜色既不同于起点也不同于终点，Select 箭头透明度也经过中间值；浅深主题、placeholder、invalid、disabled 与 reduced-motion 均走同一基线。专项命令为 `npm run audit:motion`。

### 固定 toast top 不能跟随变化的页面标题高度

- **现象**：toast 的水平位置正确，但数据页标题行高度调整后，toast 中心比当前面包屑中心低约 `3px`，路由回归失败。
- **根因**：CSS 仍以固定 `top:70px` 和 toast 自身高度推算中心，页面标题却由实际 28px 行盒与 header 内距决定；两者一旦变化就不再同轴。
- **最终规则**：toast 显示后先排除隐藏的旧页面标题，再读取当前可见 `.wd-page-breadcrumb-current` 的真实 rect，以 `titleCenter - toastHeight / 2` 写入 `top`；没有页面标题时移除内联 `top` 并回落到共享默认值。toast 重开、滚动和视口变化都重新定位。
- **验收**：toast 与当前可见标题中心误差小于 `1.5px`，书签重排、键盘焦点和历史页面隐藏标题均不影响结果。

### toast 入场不能淡 Glass 宿主，退场不能让文字先走

- **现象**：toast 第一次出现时文字和圆角轮廓已经可见，但背景先透明，下一帧才有高斯模糊；Inverter settings 中因叠层背景已经模糊，看起来反而不明显。
- **根因**：首版入场对整个 `.wd-glass` 宿主做 `0 → 1` opacity，且首次显示同帧才挂载材质，导致开头一帧没有有效 backdrop 采样。只修入场后，又把退场拆成“文字单独淡出、玻璃保持不透明到隐藏”，于是出现文字先消失、空玻璃随后消失。
- **最终规则**：`createPopoverController()` 创建时预挂载静态 Glass Surface。入场时宿主始终 `opacity:1`，只淡 `.wd-toast-text` 并做 `4px` 下落；退场时宿主和文字必须作为完整 toast 同步 `opacity:1 → 0` 并上浮 `4px`，禁止文字单独先退或只改 fill。所有页面与 Inverter settings 共用同一个 `#toast`，上下内距固定 `8px`，不得页面覆盖。
- **验收**：toast 仍隐藏时材质与 blur 已存在；入场宿主无 opacity 关键帧、文字独立 `0 → 1`；退场只有一个宿主动画，同时含 opacity `1 → 0` 和上浮 `4px`，且没有额外文字退场动画。

### 可写设置不能推导设备生效值

- **现象**：顶部状态和 Currently effective 能显示看似合理的限功率、限制来源和弃光量，但这些值来自 Setpoint、Export limit 和电池能力的本地计算，设备实际上报值可能不同。
- **根因**：把“配置期望值”当成“设备最终生效值”，并用前端公式补全缺失 telemetry，导致云端展示无法证明来源。
- **最终规则**：`ActivePower_Effective_Limit`、`ActivePower_Limit_Source`、`ActivePower_PV_Curtailed` 三个 RO 点只展示设备上报值；Setpoint、Export limit、电池能力或 PV 可用量变化不得触发本地重算。点位缺失显示 unavailable，不提供计算 fallback。
- **验收**：模型级测试修改 Setpoint 后，三个 RO 值保持不变；telemetry 不可用时三个值均为 null / unavailable；DOM 的顶部状态和 Effective chain 都带对应 `data-isw-point`。

### Firmware-pending 候选值不能升级成生产枚举

- **现象**：`Output_Capability_Mode` 在 preview 已有 `Rated / Overload / Underload` 控件，容易被后续实现误认为数值枚举、点位地址和发布条件已经确认。
- **最终规则**：这些只是候选文案；契约必须保留 `availability:"pending-firmware"`，在固件给出确认前不得固化数值映射或宣称已接入。
- **验收**：点位契约测试显式断言候选值和 pending 状态；文档与 COPY audit 同时保留未决边界。

### 分类值不能套用数值进度条，也不能换行成两条

- **现象**：Effective chain 的 `Limit source` 被放在数值行第三列，右侧 `Battery charging` 被 `108px` 列宽挤成两行；若为了“填满”中间区域而加一条空横线，又会像值为零或数据缺失。
- **根因**：分类状态与数值幅度共用了同一行几何，但二者语义不同。
- **最终规则**：Currently effective 只显示三个 RO 值并按“结果 → 原因 → 弃光”排序；Limit source 使用独立的两列文本行，不绘制空进度轨，右侧使用状态点 + 单行源标签并与其他数值保持同一条右缘。
- **验收**：Source 行无 `.isw-chain-track`，computed `white-space:nowrap`，单行高度不超过行高加 `1px`，右缘与数值列误差不超过 `1px`。

## 2026-11-23 SOC 双端、刻度与玻璃浮窗

### 双端范围不应被实现成不可交叉的 min/max

- **现象**：拖动起点超过终点时手柄被挡回，无法自然交换 Start / End；用户还要求两端在同一位置时给出错误。
- **最终规则**：轨道点击选择距离最近的端点；拖动允许两端重合和交叉。提交时按数值排序，较小值自动成为 Start、较大值成为 End。只有两者相等才是错误，不能继续返回旧 `lower ≤ upper` 校验错误。数值输入反向也按同一规则排序。
- **验收**：点击轨道后最近端点到达点击值；拖到另一端时显示相等错误；继续越过另一端后错误清除、字段和手柄角色自动交换，Save 只在相等时被阻止。

### 六等分网格不能给百分比刻度定位

- **现象**：`20%` 刻度落在约 `25%` 的视觉位置，和值为 20 的手柄对不上。
- **根因**：`repeat(6, 1fr)` 的每个文字盒中心分别落在约 `8.3% / 25% / 41.7%...`，不是 `0 / 20 / 40...`。
- **最终规则**：刻度文字绝对定位到真实百分比坐标；首尾标签分别以左、右缘贴齐轨道，中间标签以中心对齐。文字使用 `12px` Labels/Secondary，卡片底部留白保持紧凑。
- **验收**：逐项比较 label 锚点与 `track.left + track.width * index / 5`；中间项中心误差不超过 `1px`，首尾分别对齐轨道左右缘。

### Glass tooltip 有 blur 计算值却没有真实模糊

- **现象**：小浮窗入场时先看到文字和轮廓，背后文字仍未模糊；只调整 opacity 或延后正文仍会复现。
- **根因**：浮窗继承了共享 `.wd-glass` 的 `isolation:isolate`，浏览器不会采样浮窗外部的 backdrop；同时过渡 `backdrop-filter` 会让模糊层在合成阶段滞后。
- **最终规则**：需要真实透明模糊的 Glass Surface 显式用匹配特异性覆盖为 `isolation:auto`。模糊层直接到终态，不对 `backdrop-filter` 做 transition；正文可延后 `70ms` 进入，退出时正文先退、材质与模糊延后 `70ms` 退场。浮窗由端点 hover / leave 控制，拖拽期间保持，绝对覆盖且不占卡片高度。
- **验收**：确认 computed isolation 为 `auto`；冻结动画第 50ms 时只能看到玻璃和真实背景模糊、正文透明，约 100ms 后正文出现；退出时正文先消失、材质随后退场。不能只断言 CSS 文本里存在 `blur()`。

## 2026-11-20 设置页与共享交互回归

### 同域名 standalone 链接不等于隔离

- **现象**：设置页虽然隐藏了 WattDesk 外壳，但拿到同一域名链接的人仍可手动访问 `/home`、`/plants` 等页面。
- **最终规则**：独立预览必须使用专用域名和只允许设置页、静态资源的 Worker 白名单；根路径只能跳转到 `/settings`，其他 WattDesk route 返回 `404`。不得把同域名 `standalone=1` 当作访问隔离，也不得复制设置页源码。
- **验收**：独立域名 `/settings` 为 200，`/home` 与 `/plants` 为 404；主站设置更新后独立链接自动读取新版本。

### 独立预览主题不能继承主站偏好

- **现象**：主题 bootstrap 默认读取共享 `localStorage`，用户在主站选择深色后，第一次打开独立设置页仍是深色；同时没有可见入口切回浅色。
- **最终规则**：standalone 新标签首次打开必须默认浅色，使用独立的 `wattdesk-standalone-theme` `sessionStorage` 记录当前标签页选择；不可改变主站主题默认值。底部主题按钮必须使用共享 `createStandardButton()` 与 Glass Surface，距视口底边 `32px`，并为窗口高度预留空间。
- **验收**：先写入主站深色偏好，再打开新独立预览仍为浅色；按钮默认显示 `Dark mode`，双向切换正常，按钮与设置窗口不重叠。

### 反向代理静态资源不能沿用源请求绝对 URL

- **现象**：独立 Worker 在代理 `/src/*` 时用原请求的绝对 URL 构造上游地址，实际再次请求自身，导致页面资源超时或连接关闭。
- **最终规则**：代理到主站时必须显式使用 `pathname + search` 拼接 `MAIN_ORIGIN`，并在部署后通过真实浏览器验证 HTML、CSS、JS、字体和图标都能加载；不能只验证 HTML 状态码。
- **验收**：设置窗口真正渲染、控制台无资源错误；HTML、核心 JS、CSS 和首页字体均来自代理域名并成功返回。

### 新子域名传播与用户链接

- **现象**：新绑定的自定义域名在部分公共 DNS 上短暂返回 NXDOMAIN，本机/其他解析器表现不一致。
- **最终规则**：发布后至少用两个公共解析器、HTTP 最终跳转和真实浏览器验证。不得因为一次解析异常就长期引入用户未批准的备用公开路由；用户明确删除的 fallback 必须同时删除代码、Cloudflare route 和文档，并验证返回 404。
- **验收**：目标域名根路径最终 200、`/settings` 200、其他 WattDesk 页面 404；被废弃的 fallback URL 也必须返回 404。

### 淡出动画先结束，旧页透明度回弹

- **现象**：Inverter settings 左栏切页时，右侧已经淡出的旧内容在尾段突然重新出现一瞬，看起来像卡片卡顿或上下跳。
- **根因**：旧页只播放 `80ms` 淡出，但旧页需要保持到约 `180ms` 新页接力结束才移除；动画没有保持终态，80ms 后透明度先回到基础值 `1`，随后才被移除。
- **最终规则**：旧正文、旧标题和新正文、新标题的接力动画都必须保持终态；旧层在结束到移除之间保持 `opacity:0`。最终使用同步 `260ms` 互补交叉淡变，两页从第一帧同时变化，新页位于旧页上方；不能用“先退后进”的接力制造可见空白。快速二次切换必须先记录当前实际透明度，再从该值继续，不得先恢复正常可见度。
- **验收**：中间帧旧页与新页透明度都必须位于 `0–1` 之间且两者之和接近 `1`，旧页尾帧归零；第二页淡入到中间值时立即切到第三页，第三页的 out 动画起点必须接近第二页切换前的真实透明度。

### 标题层透明度动画破坏 backdrop blur

- **现象**：切页后正文过渡看似不明显，顶部标题出现新旧文字叠影，滚动到正文下方时标题高斯模糊也不见了。
- **根因**：`.isw-title-layer` 整体参与 opacity 动画并挂 `will-change:opacity`，形成新的合成组；其内部 `.isw-page-title` 的 `backdrop-filter` 改变了背景采样根。旧标题又作为完整 layer clone 叠加，导致叠字。
- **最终规则**：固定标题层始终 `opacity:1`，不得动画 `opacity` / `filter`；只动画内部 `.isw-title-label`。旧标题 ghost 只克隆文字标签并放入新标题元素内，不复制标题层、背景或 blur。
- **验收**：切页过程中 `.isw-title-layer` 自身无动画，标题 label 与正文共用同步 `260ms` 交叉淡变且前后 label 的 X/Y 误差不超过 `1px`；滚动产生重叠时计算后的 `backdrop-filter` 仍为 `blur(18px) saturate(1.2)`。

### 切页必须恢复目标页自己的滚动位置

- **现象**：从已向下滚动的设置页切换标签时，新内容可能继承旧页滚动距离；旧实现又强制所有新页回到顶部，用户再次进入时丢失原位置。
- **根因**：单一共用内容 viewport 没有页面级位置记录；只依赖 `preserveScroll:false` 既无法区分旧页位置，也无法恢复目标页位置。
- **最终规则**：在设置窗口会话内按页面 key 记录 `scrollTop`。普通主页面各保存一份，Grid 使用 `grid:${gridSub}` 为每个二级页分别保存；替换 DOM 后应用目标页记录，首次进入才为 `0`。左侧导航轨也保存并恢复自身滚动位置。退场旧页仍使用固定 rect 快照，避免目标页恢复滚动时推动旧页。
- **验收**：从保护页滚到 `140`、切到 Dispatch 滚到 `96`，再切入 Grid 必须恢复 Protection 页和 `140`；再切回 Dispatch 必须恢复 `96`。新页不得继承旧页的滚动值，旧页切换前后的屏幕坐标误差不超过 `1px`。

### 分段胶囊先取消动画再读位置导致回跳

- **现象**：连续点击分段选项时，移动胶囊会先跳回上一次选项，再向右移动，看起来卡顿、乱跳。
- **根因**：`positionIndicator()` 先调用 `animation.cancel()`，之后才读取 `getBoundingClientRect()`。cancel 后内联样式回落到上一段终点，读到的不是当前中间位置；页面重绘触发的 ResizeObserver 也可能用 `animate:false` 直接重置。
- **最终规则**：连续点击必须先读取正在运动胶囊的实际边界，再把该位置写回内联样式并取消旧动画，最后从该中间位置创建下一段 `600ms` soft-spring 动画。ResizeObserver 在动画进行中按当前位置 animate 续接，不能无动画跳到语义终点。
- **验收**：把第一段动画暂停在 `250ms`，立即点击另一选项；点击前后胶囊左边界的误差应仅为一个正常帧的进展，不能出现接近选项距离的回跳。共享组件和 Inverter settings 的 DI Port 都要覆盖。

### Grid 二级列展开先推动旧页再切换

- **现象**：从其他设置页进入 Grid & Protection 时，旧页先向右移动一截，随后才完成淡变；根因是 Grid 子导航的 `208px` 列在页面替换前已改变父级网格。
- **最终规则**：退场页面节点必须直接移出内容列，作为 `inert` 快照挂到 `.isw-body`，以切换前 `getBoundingClientRect()` 的 left/top/width 做绝对定位；不要深拷贝整页。Grid 二级栏自身还需要继续复用，因此离开时使用独立快照。新页直接使用目标布局；父级 `208px + 1fr` 布局变化只能影响新页，不得推动或缩窄旧页。旧标题 ghost 同时按旧 X 坐标补正。
- **验收**：解锁 Grid 后先回到 Dispatch，再重新进入 Grid；退场快照的 left/top/width 与点击前误差均不超过 `1px`，新页 left 必须使用带子导航的目标位置。

### Grid 二级栏提前完整入场

- **现象**：进入 Grid 时，右侧二级导航先完整出现，之后正文才开始切换，和页面渐入渐出不是同一节奏。
- **最终规则**：进入时二级栏从 `opacity:0` 与正文、标题使用同一 `260ms` 交叉曲线渐入；离开时立即恢复目标父布局，并用切换前固定 rect 的 `inert` 二级栏快照同步渐出。快照不得参与布局。
- **验收**：进入首帧二级栏 opacity 为 `0` 且存在相同 timing 的动画；离开首帧快照 opacity 为 `1`、几何不变，并在 `260ms` 同步结束。

### 开关轨道使用 color-mix CSS transition 仍会跳色

- **现象**：开关滑块已经在缓动，但轨道背景从灰到蓝、蓝到灰仍瞬间跳变。
- **根因**：轨道颜色由不同 `color-mix()` 表达式切换；虽然声明了 `transition: background-color`，Chromium 实际将颜色变化离散应用。页面重绘中的同值 `setValue(...,{notify:false})` 还会取消刚刚创建的动画。
- **最终规则**：轨道颜色必须用 WAAPI 从点击前计算色插值到目标色，时长 `480ms`；CSS transition 只保留轮廓 / 阴影。同值同步必须直接返回，不得取消 thumb/track 动画。
- **验收**：动画中点颜色必须同时不同于起点和终点；快速连点从当前颜色反向。共享组件与 Inverter settings 重绘后都应继续。

### Device Features 误继承窄面板宽度

- **现象**：Device Features 三个卡片明显比其他设置页窄，而页面内容列本身仍为 `640px`。
- **根因**：三个面板都带 `isw-panel--narrow`，该类的 `max-width:560px` 属于 Grid & Protection 子页专项约束，不应出现在常规设置页。
- **最终规则**：除明确使用 `560px` 的 Grid 子页外，Inverter settings 常规卡片必须撑满 `640px` 内容列，不得用窄版类控制内容密度。
- **验收**：逐个比较卡片和 `.isw-page` 宽度，误差不超过 `1px`。

### 状态窗上浮动画在刷新首帧前已经播放完

- **现象**：代码里存在入场动画，刷新或直接打开设置 URL 时却只能看到终态。
- **根因**：动画绑定在整个 modal 的 `data-entering` 生命周期，而设置页模块、字体、首帧布局和 `data-ready` 准备时间已经超过动画时长；元素真正可见时动画已结束。
- **最终规则**：状态窗只做 transform 上浮，从 `translate3d(0,20px,0)` 使用 `--wd-motion-modal-content-in` / `--wd-ease-spring` 归位。必须在应用 `data-ready` 后再经过两个 `requestAnimationFrame` 才添加启动类；不得给玻璃宿主叠加局部 opacity / filter，不得带动下层设置窗，也不得在页面切换或局部更新时重播。减少动态效果时不添加启动类。
- **验收**：直接刷新设置 URL 时必须能捕获到动画 `currentTime < duration`，起点 transform Y 为 `20px`，终态回到 `0`；不能只在打开后几百毫秒看到一个已完成的动画对象。

### 把已有层叠阴影误做成新的渐变层

- **现象**：用户要求调整上下窗之间已有的黑色倒影，实现却新增了一个独立伪层，视觉和代码都变成第二套投影。
- **最终规则**：继续修改既有非玻璃 `.isw-main-shell` 的向上 `box-shadow`，不得新增伪元素、额外渐变层或第二套投影。接触线 `0 -1px 0 rgba(0,0,0,.06)`，衰减 `0 -10px 28px -10px`；浅色 `22%` 黑、深色 `34%` 黑，两种主题都保持黑色，不能变成白色或浅色反光。
- **验收**：计算样式只包含既有 shell 上的接触线与 `0 -10px 28px -10px` 阴影；深层主题都没有白色阴影；`.isw-main-shell::before` 不参与该视觉。

### 弹性回弹吞掉反向滚轮并冻结滑块

- **现象**：快速上下滚动时内容偶尔停住，右侧滚动条不能追上当前 `scrollTop`，在边界反向滚动时尤其明显。
- **根因**：回弹 settling 阶段直接跳过滑块同步；反向输入仍被 `preventDefault()` 消费；轨道滚轮又把 `deltaMode` 为非像素的事件按原始 `deltaY` 当作像素，导致迟缓。
- **最终规则**：共享滚动组件使用单个 rAF 合并更新，滑块在普通滚动和回弹期间都读取最新位置；弹性状态下反向滚动立即清除 pull，并把当前 wheel 交还 viewport。轨道滚轮按 `deltaMode` 归一为像素，行模式使用真实行高尺度。不得在页面层复制修正。
- **验收**：边界回弹后立即反向滚动时事件未被阻止、pull 已清除；新的滚动位置与滑块计算位置误差不超过 `1px`；行模式 `deltaY=3` 至少推进约 `48px`。该规则需同时通过共享组件、设置页、Plants 筛选/设备和 Service Ticket 专项。

### Running Mode 生长动画过度提速并被打断时跳回终点

- **现象**：首版 `380ms` 生长动画偏慢；改为 `240ms` 强 ease-out 后又在前几十毫秒完成大部分位移，看起来突然弹开。展开与收起还容易被感知成一快一慢。
- **根因**：只优化了 duration，没有统一中间打断的起点；每次重启动画先取消旧高度并回到上一语义终点，再从终点重播；说明文字还叠加了 `translateY`。
- **最终规则**：展开和收起统一使用 `320ms` 的 `--wd-motion-panel` / `--wd-ease-panel`，共享完全相同的时间轴。说明只淡变 opacity，不加第二段位移。动画中再次选择时，从当前可见卡片高度和说明透明度续接，禁止先跳到上一目标。结束后恢复 `height:auto` 并清理临时动画类。
- **验收**：展开、Cancel 回滚和快速打断的高度动画 duration/easing 一致；同步点击前后卡片高度差接近 `0`；展开和收起在同一 `currentTime` 的中间高度应对称。

### Save / Cancel 使用全局基线导致跨页提交或丢失

- **现象**：某一设置页修改后直接切换页面会绕过确认，底部 Save 还可能把其他页面的草稿一起提交；Grid 多个二级页共用整份 `g` 时也会互相污染 dirty 状态。
- **根因**：单一全局 fingerprint 同时承担“是否存在修改”和“要提交哪些字段”；Grid 子页没有按参数路径拆分作用域。
- **最终规则**：Save / Cancel 均按当前主页面或当前 Grid 二级页作用域工作。Grid Code 负责 profile 标识和载入的认证基线，其他 Grid 页按各自表格、曲线和开关字段建立路径集合。当前页 dirty 时，主页面和 Grid 二级页切换都先走共享确认层；Keep Editing 留在原页，Discard 在点击当下回滚当前页并立即启动目标页转场，确认层退场与切页并行。只有右上 X 的退出确认检查全局未保存状态。
- **验收**：保存 Protection Limits 后进入 Grid Connection 不出现 dirty；Grid 二级页切页显示带当前页名称的共享确认层；Discard 后旧页操作栏清除且目标页已经同步开始进入；X 仍能识别任意未保存页。

### 门禁解锁时内容列变窄导致卡片横移

- **现象**：输入正确安全码后，Grid 二级栏展开使内容列变窄，门禁卡在淡出过程中先向右跳一下。
- **根因**：卡片仍按新内容列居中，而退场动画只处理 opacity，没有锁定解锁前的屏幕几何。
- **最终规则**：解锁前记录卡片屏幕中心；布局变化后仅在退场期间用 X/Y transform 补偿中心差值，动画结束立即清理。补偿只服务门禁退场，不能进入常态布局或影响后续 Grid 页面。
- **验收**：解锁首帧卡片中心与解锁前误差不超过 `1px`；门禁退场结束后临时 offset 已清空。

## 2026-11-19 集中回归

### setting title 被 elastic transform 一起搬走

- **现象**：设置页在顶部或底部越界回弹时，标题文字、吸顶背景模糊和底部规则跟着正文移动，出现挖空和错位。
- **根因**：标题虽然是 sticky，但仍在 `createScrollFeedback()` 会执行 `translate3d` 的 `.isw-page-host` 内；sticky 只能响应滚动，不能抵消祖先 transform。
- **最终规则**：标题移到与滚动内容同级的 `.isw-title-layer`，正文保留等高占位；elastic 位移只作用于 `.isw-page-host`。禁止再用 sticky + 反向 transform 修补。
- **验收**：分别触发顶部下拉和底部上拉，比较标题层、标题文字、规则 rect 与 title backdrop，回弹前后必须一致。

### 共享玻璃宿主的 box-shadow 被 `!important` 清空

- **现象**：给设置下层窗口直接写 `box-shadow` 后计算值仍是 `none`，层叠关系没有阴影。
- **根因**：`glass-material.css` 对 `.wd-glass` 使用 `box-shadow:none!important`，材质阴影位于内部 `.wd-glass-fill`。
- **最终规则**：组合层级阴影写到非玻璃外壳 `.isw-main-shell`；不要提高 `.wd-glass` 局部优先级，也不要另造材质。

### toast 把页面级与局部内容级混为一谈

- **现象**：先按视口中心定位，页面级提示仍被要求按右侧内容区；再按 `.isw-body` 定位，用户又指出整体未居中。
- **最终规则**：区分作用域：页面级 `toast(message)` 使用视口中心；只有真正限定在局部容器的提示使用 `toast(message,{centerWithin:element})`，并按实时 rect 居中。Inverter settings 的保存/恢复/校验属于页面级。
- **禁止**：`calc(50% + 140px)`、写死内容区中心、只按页面名猜测 scope。

### 页面重绘把共享控件的动画宿主替换掉

- **现象**：switch 滑块和 segmented 胶囊有时直接跳到终点；旧 DOM 在动画首帧前被移除。
- **最终规则**：依赖内容立即更新，但消费页面必须在重绘前保留同一控件节点，并把它重新挂回新 DOM；不能延迟业务内容等待动画结束。switch 滑块用 `600ms` soft-spring、轨道 `480ms`；segmented 复用 `600ms`，标签垂直偏移固定 `0px`。同卡条件行随内容即时更新，卡片用 `280ms` content-grow 从旧高度过渡；页面切换使用同步 `260ms` 互补交叉淡变。
- **禁止**：替换正在运动的控件 DOM、条件卡固定高度后硬跳、页面 `±3px` 方向位移、缩放/模糊、长距离滑动、两页同时清晰或旧页仍可交互。

### 模式局部内容切换不能重建整页

- **现象**：Shadow scan 从 Individual 切回 All 时，旧长内容先停顿，随后整页换成短内容并跳到底部；分段胶囊动画和底部回落无法连续观察。
- **根因**：模式点击虽然只改变一个局部区域，却触发整页 `renderPage()`，销毁并重新 hydrate 所有开关、分段、选择器和时间标签；主线程被重绘占满，首帧被推后。
- **最终规则**：允许的两种模式在同一页面预渲染，切换只原位显示目标区域、把旧区域设为 `hidden` / `inert`，再交给共享 bottom-scroll guard 从旧底边平滑跟随。页面、无关卡片和分段控件必须保持同一 DOM；滚动跟随使用 `--wd-ease-content-settle`，不与快速起步的 content-grow 共用。
- **预防**：局部模式、筛选或显隐切换不得为了改变一段子内容而整页重建；专项同时断言内容切换、首帧不夹底、滚动单调和周围节点身份不变。

### Grid 门禁与二级导航泄漏

- **现象**：未输入安全码时二级导航仍可见；Continue 使用页面私有蓝色按钮；锁图标因替换后丢失 `.isw-icon` 基础类而空白。
- **最终规则**：门禁期间 `.isw-sub` 完全隐藏，gate 占满 `.isw-body`；解锁后才显示 `208px + 1fr` 和贯穿分割线。首次进入 Grid 使用 `Grid Code`，后续恢复上次二级页和滚动位置；普通主页面也分别恢复自己的滚动位置。二级列表顶部/左右 `18px`、行内 `12px`，最长标签单行，hover / selected 为半圆胶囊。Grid 子页卡片居中 `560px`，标题层与卡片外框同宽、文字内收 `24px`。档案行 hover 必须铺到卡片边缘但保持内容线，选择标记与 Running Mode 共用 `18px` 对号 / 空心圆。Protection 表头复用 Economic 样式，Setting / Trip time 与字段中心对齐；行高至少 `48px`、上下 `6px`，输入框最宽 `112px`，阶段符号列收紧、居中并左移 `6px`。开关变化不得绘制橙色偏差起始条。密码上方使用 19px 锁遮罩；Continue 使用共享蓝色主按钮并保持 `38px`。该行尾部箭头始终朝右，不旋转。
- **2026-11-20 补充**：Grid Connection 两个窗口卡必须统一 `48px / 6px` 行节奏、普通卡片标题主色字体和右对齐 `128px × 36px` 标准字段。偏差状态只保留计数与说明；任何开关、分段、数字或其他控件都不得绘制橙色行首竖条，不能只为 `.wd-switch` 写局部分支。
- **2026-11-20 共享选择器视觉分叉**：根因是 Economic 外观此前由页面 `.isw-eco-field.isw-eco-select` 双重类提供，组件 API 只有 `default / form / compact / table`，其他调用方只能复制类名或固定宽度，最终产生两套视觉。现在正式增加 `variant:"adaptive"`：组件负责自适应宽度、36px 高、18px 圆角、编辑表面、字体、18px 单选标记、关闭和焦点归还；页面只传业务选项、菜单宽度和回调，不得继续叠用旧 `.isw-eco-field.isw-eco-select`，也不得使用横向 chip / 分段控件。
- **2026-11-20 菜单右对齐重复公式**：Economic `•••` 菜单只传 `align:"end"` 时，右缘会与按钮齐平，与共享 Select 的“右缘外扩一个圆角”不一致。定位公式已抽成 `menuEndAlign(anchor,radius)`，Select 与普通菜单共同调用；以后遇到右对齐浮层不要复制布局宽高换算。
- **2026-11-20 输入命名与命中区**：只靠视觉行标题不能让辅助技术识别 `num()` / `mini()` 输入。所有数字字段必须在 hydrate 时生成“行 / 列 / 单位”上下文；共享 Select 的 `aria-label` 不能只写当前值。复制值、info、时间箭头和日志账户名可以用负 margin 扩大按钮命中盒而不改变视觉布局，不能为了视觉紧凑保留 16–18px 的实际点击区域。

### route-backed 弹窗退场被路由立即卸载

- **现象**：设置页点 X 后没有退场，因为路由先切换并移除了 modal。
- **最终规则**：X 先校验 dirty，未保存时开共享确认层；真正关闭后先播 `420ms` Depth Reveal，`onClose` 再切回 Devices。空白遮罩和 Escape 不关闭设置页。

### 输入错误态被浅色主题的 focus 规则覆盖

- **现象**：输入框正在输入并报错时，数值已经变红，但字段背景仍是中性灰、描边仍是灰色；浅色主题尤其明显。
- **根因**：数字字段的通用错误选择器优先级低于 `:root[data-theme="light"] .isw-number.wd-edit-field:focus-within`，主题焦点规则重新覆盖了 `border-color` 与 `background`。
- **最终规则**：错误态必须同时限定设置窗口和字段基础类，并在默认、hover、focus-within、正在输入四种状态保持红色描边与淡红底；浅色主题焦点规则不能覆盖错误主题。错误文字、数值和单位也共用同一 red token。
- **验收**：在浅色主题聚焦输入超范围值，断言 `border-color` 等于共享 danger token、背景等于错误填充、`aria-invalid=true`，且输入中与失焦后都保持红色。

### 错误提示占用既有留白，卡片看起来没有生长

- **现象**：Economic Schedule 百分比出错后提示已经出现，但行高和卡片高度几乎不变，提示贴住分隔线或挤到下一行。
- **根因**：结构化表格行本身有默认上下留白，错误提示加入后被自动放进原有高度，`getBoundingClientRect()` 前后没有足够变化，`280ms` content-grow 即使执行也表现为“不长”。
- **最终规则**：错误出现在基础行节奏之外必须产生额外高度。Economic 行使用独立上下缓冲，普通 `.isw-table-row` 错误态增加 `6px` 上下内距；提示使用 `2px` 紧凑间距并按实际输入框右缘对齐，而不是贴整行右缘。
- **验收**：Economic 百分比和 Point Table 各触发一次错误，断言错误前后行高、卡片高度均增长，提示与输入框的横向右缘误差不超过 `1px`，并同时检查 `280ms` 高度动画。

## 一、先确认语义，再动实现

### 1. 侧栏导航被误做成“新建标签”

- **现象**：点击侧栏 Plants / Service ticket，顶部多出一个标签，而不是当前标签切换内容。
- **根因**：把“页面导航”和“工作区标签管理”混成同一动作；只看到“可点击”就接了 `add`。
- **修复**：侧栏只更新当前标签的 `route`、标题、图标和内容；`Add` 创建 Home 标签。后续已确认 Plants 列表行与自动建站 `?` 提示中的 `setup` 是详情新标签入口，不能反过来让侧栏创建标签。
- **预防**：先写清“点击后应该发生什么”，再选 API。侧栏默认是当前标签内导航，除非用户明确要求打开新标签。

### 2. 把用户的“连续关闭”误解成“固定滚动容器宽度”

- **现象**：用户要求在同一个 X 位置连续关闭多个标签，执行时却改了滚动容器宽度，没有解决指针落点。
- **根因**：没有按用户实际操作复现；用替代性的 UI 改动冒充交互修复。
- **修复**：压缩/溢出时冻结剩余标签的布局宽度与 `scrollLeft`，让后一个 X 移到原指针位置；移出标签条后恢复自适应。
- **预防**：先用真实鼠标坐标复现“关一个后，指针下是不是下一个 X”。验收看命中位置，不看“看起来稳定”。

### 3. 多 Home 标签显示 Home 1 / Home 2

- **现象**：新增 Home 后标签出现编号，和设计稿及用户预期不一致。
- **根因**：把内部唯一 ID 直接当展示标题。
- **修复**：内部 ID 仅用于状态区分和测试，展示标题统一为 `Home`；其他页面同理使用语义名称。
- **预防**：展示名与稳定标识分离。新增标签前检查标题是否来自 ID 拼接。

### 4. 默认 Plants 占位残留

- **现象**：用户要求只保留 Home，但首次打开仍出现 Plants 标签。
- **根因**：初始化代码仍主动 `add` 了示例标签；文档写了“默认 Home”，实现却没删初始化。
- **修复**：初始只创建 `home-1`。
- **预防**：默认数据改动后断言初始标签 ID 数组，而不是只检查界面上“有标签”。

### 4A. 简单修复被扩成过度设计

- **现象**：用户只要求修一个明确问题，执行时却扩展了无关视觉或功能；或没有按真实操作复现，用替代性改动冒充结果，最终返工。
- **根因**：开工前没有把操作路径、直接目标与验收点说清；把“顺手优化”当成需求，或只检查代码/静态截图。
- **修复**：收回未要求的扩展，只改导致问题的共享路径；按用户实际操作复现并验收。
- **预防**：先复述“点击哪里、期望发生什么、如何判定完成”；改动只覆盖该路径；完成后检查是否新增了未要求的功能、视觉或全局规则。

## 一 A、共享样式与页面定位

### 4B. 共享玻璃类覆盖了首页与顶栏的定位

- **现象**：1452px 下侧栏历史/后退/前进按钮跑到搜索左侧，四张状态卡逐行阶梯下坠；图表区被顶到错位。没有脚本报错。
- **根因**：共享材质用普通类选择器写 `.wd-glass{position:relative}`，优先级高于首页的 `.node{position:absolute}` 和按钮的绝对定位；玻璃挂载后把整组节点改成相对定位，内联 `left/top` 变成相对位移。
- **修复**：共享材质只保留零优先级默认值 `:where(.wd-glass){position:relative}`；页面节点、侧栏按钮和浮层继续拥有自己的定位。
- **预防**：共享组件新增 `position`、`display`、尺寸或 `transform` 默认值时，先用 `:where()` 降级，或在应用后量测宿主定位；回归检查 `getComputedStyle(...).position` 与同一行卡片 `y` 是否一致，不能只看截图是否“像恢复”。

### 4C. 同材质搜索框因图标素材分叉而显得颜色不对

- **现象**：全屏搜索框与首页内联框的玻璃数值相同，但全屏放大镜明显偏灰，看起来像材质或主题不一致。
- **根因**：两个字段各自拼 DOM，全屏沿用 `asset-4.svg` 的 `fill-opacity="0.3"`，首页则通过共享状态遮罩使用不透明路径；只比较 `border-radius` 和玻璃样式无法发现图标墨色差异。
- **修复**：全屏字段复用 `createSearchField()`，放大镜使用 `masks/asset-35.svg` 的不透明遮罩，只隐藏快捷键。
- **预防**：声称“复用同一材质”时同时比较字段结构、实际图标源与计算样式；图标先检查 SVG 是否带导出 alpha，再决定是否使用不透明状态遮罩，不通过改玻璃 tint 补偿。

### 4D. 浮层通用按钮样式穿透到嵌套共享控件

- **现象**：Company 条件浮窗的共享搜索框出现后，清除按钮被压成 `24 × 18px` 且向下偏移；共享搜索组件本身没有缺定位。
- **根因**：`.popover button` 为了 Chart options 等普通菜单按钮设置了块级宽度和 `9px 12px` 内距，同时命中浮层内嵌套的 `.wd-input-clear`，覆盖了共享清除按钮的 `18px` 方形与零内距。
- **修复**：通用菜单按钮样式限制为 `.popover > button`，只作用于浮层直接子按钮；共享搜索、日期、菜单等组件内部的真实按钮继续使用各自契约。
- **预防**：浮层容器不得用后代 `button` 选择器统一样式；新增嵌入控件时同时量控件中心线与字段中心线、实际宽高和 computed padding，不能只看组件源码。

### 4E. 不透明掩码生成只替换了 `.7`

- **现象**：筛选中的 Attention 计算色已经是 `#FF4245`，视觉上仍比文字暗，像叠了透明度。
- **根因**：图标生成器只把 `fill-opacity="0.7"` 改成 `1`，而 `asset-64.svg` 原稿使用 `.3`；CSS mask 继续按 30% alpha 取形，红色因此被削淡。
- **修复**：掩码生成器统一把任意 `fill-opacity` / `stroke-opacity` 改为 `1`，重新生成全部共享掩码。
- **预防**：不要只断言 `color`；同时读取掩码源中的 opacity，或直接检查最终图标像素。新增状态资源必须先确认原始透明度。

### 4F. 条件变化触发锚点移动，浮窗跟着漂移

- **现象**：从筛选条加号打开面板后，勾选一个条件会新增 chip，加号重排，主筛选面板也跟着移动。
- **根因**：共享浮窗默认实时跟随 anchor；筛选重绘后显式 `reposition()`，把新的加号位置重新应用到主面板。
- **修复**：共享 `registerPanel()` 新增可选 `pinPosition`；加号入口首次定位后固定视口位置，二级条件浮窗仍按类目行定位。
- **预防**：内容更新会改变锚点几何时，必须先判断“跟随锚点”还是“固定打开位置”；不能默认对所有重新布局都执行实时重测。

## 二、动画与布局

### 5. 新增/关闭标签生硬，关闭时瞬移

- **现象**：加号直接跳到新位置；关闭时标签先卡在最小宽度，再突然消失。
- **根因**：只动画视觉宽度，没有同时动画 flex 槽位；58px 最小宽度阻止关闭槽位收拢；间距没有一起退场。
- **修复**：同时动画 `flex-basis` 与 `width`，关闭时临时解除最小宽度，并让内边距、间距、透明度和位移一起过渡。
- **预防**：涉及布局槽位的动画要检查“节点宽度、flex 基准、间距、Add 位置”四者是否连续；不要只盯元素自身。

### 5A. 局部设置修改触发整页重绘与二次入场

- **现象**：切换 Inverter settings 的 `%Pn / kW` 后，右侧内容区整体淡入并跳动；后续还发现侧栏被整套重建。
- **根因**：所有控件回调都调用完整 navigation + page 重建，`.isw-page` 每次重新挂载时重播当时的 `160ms` 入场动画；虽然常驻 `scrollTop` 多数情况下未被浏览器夹回，但视觉上仍是一次全页刷新。该参数是历史中间态，当前页面切换以 2026-11-20 的同步 `260ms` 交叉淡变和局部刷新 no-op 为准。
- **修复**：普通状态修改只重绘当前页面并原地同步侧栏值，给新页面加 `.isw-page--instant` 禁止入场动画，重绘前后保存/恢复 `scrollTop` 和等效焦点；页面导航才播放入场。Grid profile 因会改变二级页集合，只额外刷新二级导航。
- **预防**：状态控件更新必须用真实操作断言“滚动位置、页面顶部、动画数量、侧栏节点身份、焦点”五项；不能只断言最终值正确。

### 6. 关闭标签时 Add 与邻居仍然瞬跳

- **现象**：新增动画正常，关闭仍有一次跳变。
- **根因**：关闭分支和新增分支使用的动画属性不对称；冻结布局或滚动夹紧在节点移除后触发重排。
- **修复**：关闭使用与新增一致的槽位属性；溢出时保留尾部占位，移除后恢复 `scrollLeft`；冻结宽度用 `offsetWidth`。
- **预防**：新增和关闭必须成对验收，逐帧或相邻帧记录 Add、邻居和指针位置；不能只看关闭瞬间的截图。

### 7. 压缩状态下连续关闭需要不断移动鼠标

- **现象**：关掉一个标签后，剩余标签立刻变宽，原本的 X 移走。
- **根因**：关闭后立即重新计算自适应宽度；溢出时滚动范围缩小又夹紧 `scrollLeft`。
- **修复**：指针在标签条内时冻结宽度和滚动位置，并在溢出时保留被关槽位；移出后一次性恢复。
- **预防**：把“同一坐标连续关闭”写成真实指针测试，至少连关两个；不要只用 DOM 点击模拟。

### 8. 页面缩放后“宽度冻结”反而让标签条抖动

- **现象**：浏览器缩放时，冻结的标签宽度和屏幕显示不一致。
- **根因**：用 `getBoundingClientRect().width`（受缩放影响）写 CSS 布局宽度。
- **修复**：布局宽度使用 `offsetWidth`；屏幕坐标与命中使用 `getBoundingClientRect()`。
- **预防**：区分“CSS 布局尺寸”和“屏幕渲染尺寸”，不要混用。

### 9. 关闭 X 的颜色变化没有过渡，hover 出现异常描边

- **现象**：X 背景/字形瞬间切换；hover 时出现非设计描边。
- **根因**：局部颜色直接赋值，没有走共享动效；按钮的默认 outline / focus 状态没有和设计状态分开。
- **修复**：X 的背景与字形都使用共享 hover 过渡（进入 `240ms` / 离开 `360ms`）；hover 只换底色与字形色，focus 使用明确的主题 focus 样式，不叠加异常 outline。
- **预防**：检查默认、hover、focus、选中四种状态；关闭按钮必须分别验证颜色过渡和描边。

### 10. 导航栏四周阴影被裁切

- **现象**：玻璃或导航外部阴影在容器边缘被切掉。
- **根因**：外层 `overflow:hidden` / `clip-path` 裁掉了绘制区域，或阴影被父容器尺寸限制。
- **修复**：放开外层裁切，仅对需要滚动的内容使用局部裁切，并保留绘制余量。
- **预防**：任何涉及玻璃、阴影、浮层的改动都要看边缘像素；不要用 `overflow:hidden` 做圆角或布局捷径。

### 10A. 从其他页面切回 Home 后使用隐藏时的测量结果

- **现象**：直接打开 Plants 再进入 Home，快捷入口、状态卡与统计区偶发重叠；刷新后恢复。
- **根因**：Home 以 `hidden` 状态完成首次绝对坐标测量，隐藏节点高度为 `0`；路由切回时只取消隐藏，没有重新运行首页布局，页面一直沿用启动时的零高度结果。
- **修复**：路由层在 Home 重新可见后、下一次绘制前统一调用首页布局重新测量；连续快速切换时由最后一帧取消并重跑，不在各页面入口各写一份。
- **预防**：任何带缓存几何或绝对坐标的页面，从 `hidden` 恢复后都要按真实可见尺寸重算。回归必须覆盖“直接深链进入其他页面 → 返回目标页面”，并与目标页面直接刷新的坐标一致；不能只测先打开 Home 再切出的常见路径。

### 10B. 原生滚动条无法满足可动画的视觉滑块

- **现象**：本机 Chrome 显示宽、方角、常驻的系统滚动条，并额外出现底部横向条；Playwright 截图却看不到，或只显示 overlay 样式。
- **根因**：Chromium 对 `::-webkit-scrollbar` 伪元素支持基础尺寸和颜色，却不稳定支持 hover 宽度与颜色 transition；不同系统的原生轨道宽度还会制造首帧横向溢出。
- **修复**：隐藏原生滚动条视觉但保留表体滚动，使用独立 DOM 滑块同步滚动位置并支持拖动；track 固定宽度、thumb `6 → 8px` 在内部展开，因此过渡不触发表格重排。双向回弹由 DOM 空白面和 WAAPI 控制，使用主题背景、`4px` 粘滞区、`16px` 最大可见范围、目标值缓动跟随和共享 `640ms` spring 时长，避免白闪、瞬跳与大位移。
- **预防**：需要动画、可拖动或跨系统一致的滚动条不能只写原生伪元素；验收必须有头 Chrome/Edge，检查 hover 中间宽度与颜色、拖动、宽屏无横向条、顶部回弹，以及减少动态效果路径。

### 11. 标签切换内容时文字/图标硬切

- **现象**：侧栏切换 route，标题和图标瞬间替换。
- **根因**：只更新 DOM 文本，没有旧内容退场与新内容入场。
- **修复**：旧内容 110ms 渐出，提交新内容后 220ms 渐入；快速连续切换用 token 丢弃过期动画。
- **预防**：内容替换要考虑竞态；动画未完成时的新操作必须能覆盖旧操作，不能等旧动画结束才响应。

### 12. 动效参数散落在组件里

- **现象**：同类 hover、标签、关闭按钮时长不一致；改一处后另一处仍旧生硬。
- **根因**：在局部 CSS / JS 写死毫秒和曲线，没有走共享 motion 入口。
- **修复**：CSS 继承 `motion.css`；JS 使用 `motionDuration()` / `motionEasing()`。
- **预防**：禁止 `transition: all` 和局部硬编码节奏；新增动效先找共享 token。

## 三、图标与视觉状态

### 13. 灰色中性图标高亮后仍不是白色

- **现象**：CSS 计算色已经是白色，但截图仍是浅灰。
- **根因**：原始 SVG 自带 `fill-opacity="0.7"`，作为遮罩时把白色削成半透明灰。
- **修复**：中性素材使用 `home-assets/masks/` 下同几何的不透明副本；彩色素材继续保留原色层。
- **预防**：同时检查 computed color、SVG 原始属性、遮罩源和截图像素；不能只改颜色变量就判定完成。

### 14. Device tool 箭头与文字视觉中心不齐

- **现象**：箭头先下沉，调整后又偏上。
- **根因**：用局部 padding 反复猜，没有按图标盒和文字实际视觉中心对齐；缺少改后截图比较。
- **修复**：统一图标盒尺寸，按实际视觉中心校正，并检查展开/收起状态。
- **预防**：对齐问题先量图标盒与文字盒，再改位移；每次改完立即截图对比上下留白。

### 15. 连续圆角被误认为“统一圆角数值”

- **现象**：为做 Squircle 差点改 `border-radius` 或加大半径补视觉。
- **根因**：把“曲率平滑”与“半径大小”混为一谈。
- **修复**：保留所有原始半径，只通过共享连续曲线改变曲率；圆形和胶囊保持原形。
- **预防**：任何圆角任务先记录原半径；验收同时看 `border-radius` 与真实轮廓，禁止用半径补偿曲线。

## 三A、共享反馈与复合交互

### 21. 按钮“看得见放大”被参数细节掩盖

- **现象**：代码里已经有 hover/按下缩放，但用户快速点击正圆小图标时觉得没有变化。
- **根因**：按下差值太小，且起步曲线过长；验收只看了慢速长按或只断言了矩阵数值，没有模拟快速点击。
- **修复**：普通玻璃 `1.025 / 1.065`，正圆 `1.07 / 1.18`；按下 `110ms` 起步、松开 `420ms` 回落，并确认 36px 圆钮快速点击也能看见。
- **预防**：每次调按压反馈同时检查“差值、起步时长、物理中心锚点、布局盒不变”，并用真实指针快速点击验收；不要用代码通过代替肉眼可辨。

### 22. 复合卡片整体放大，内部控件反而被淹没

- **现象**：日期弹窗里点日期框、Apply 或空白处，整张大卡片也放大，看起来吵闹。
- **根因**：只按“玻璃宿主”统一加缩放，没有区分复合容器和可独立交互的子控件；事件冒泡让外层也被激活。
- **修复**：`.wd-glass-chrome` 整组与 `.wd-glass--surface` 弹窗固定为 `1`，内部日期框、月份钮、Apply 继续按自身状态响应；语义写在共享材质，不逐页禁用。
- **预防**：新浮层先判断“它本身是不是一个可点击单位”。复杂内容容器不整体缩放，验收时点击内部多个位置，确认只有对应控件反馈。

### 23. 交互流程改版后测试仍按旧假设断言

- **现象**：日期选择迁移为语义面板后，预设一点击就断言主周期标签，测试失败或迫使实现错误地提前提交。
- **根因**：测试沿用了旧入口/旧流程，没有同步“草稿”和“Apply 提交”的边界。
- **修复**：点击预设只更新草稿，点击 `Apply` 后再断言主周期标签；旧 `Custom date range…` 入口不再作为测试锚点。
- **预防**：组件迁移时同时更新运行代码、测试和文档中的交互语义；先确认提交点，再写断言。

### 24. 结果行可见，但选择逻辑查询了空容器

- **现象**：搜索底部有 `Navigate` / `Open` 提示，结果行也能正常显示，但按钮和方向键没有可见反应。
- **根因**：结果行实际挂在滚动 `body` 的分组里，选中逻辑却从只含 live region 的 `list` 查询 `[role="option"]`；查询结果恒为空，`setActive()` 每次提前返回。旧测试只断言提示文案存在，没有点按钮验证状态变化。
- **修复**：改为从承载结果行的 `body` 查询，恢复首位选中、方向键、hover、Navigate 与 Open；提示改用真实 `<button>`，用 `pointerdown` 阻止指针抢焦点，保留键盘可访问性。
- **预防**：列表类交互先确认 DOM 实际父容器，再写查询；验收必须断言 `aria-selected` 或 `is-active` 真的发生移动，并实际点击 Open / Close，不能只检查标签和布局存在。

## 四、测试与文档

### 16. 宽度从 120px 放宽到 180px 后，旧溢出测试不再触发

- **现象**：测试仍固定新增 8 个标签，结果没有进入溢出状态，连续关闭断言失真。
- **根因**：测试依赖固定数量假设，而不是实际可用宽度。
- **修复**：持续增加标签直到 `is-overflowing`，再做溢出用例。
- **预防**：响应式/容量测试用状态条件收敛，不写死“几个标签一定溢出”。

### 17A. 新标签入场把占满状态的 Add 按钮带走

- **现象**：标签条已占满时点击 Add，加号先向左跳一段再回到右侧，新标签同时展开。
- **根因**：标签列表按内容宽度收缩；新标签从 0 开始时列表变短，Add 被一起推向左，随后列表增长又把加号带回。
- **修复**：占满时让标签列表填满剩余宽度（`is-slot-filled`），Add 固定在右端；未占满时保持内容增长。
- **预防**：凡是“固定按钮 + 可展开邻居”的布局，验收要逐帧读按钮横坐标，不能只看结束状态或静态 flex 值；同时检查未占满、占满、溢出滚动和减少动态效果四种状态。

### 17. 文档被错误写入方式截断成 “utf8”

- **现象**：归档时多个 Markdown 只剩占位文本。
- **根因**：调用 `writeFileSync(path, 'utf8')`，把编码字符串当成了文件内容。
- **修复**：显式写入完整内容并恢复文档；存档前检查文件大小和关键标题。
- **预防**：所有文档写入必须传入真实内容；写后验证大小、首尾标题和链接，不能只看命令成功。

### 18. 共享改动只验一个主题或一个状态

- **现象**：深色通过，浅色或 focus 状态出问题；或者默认正常，hover 出现描边。
- **根因**：验收范围按“当前截图”而不是“全部状态”。
- **修复**：按默认、hover、focus、选中、禁用/加载（适用时）及深浅主题逐项检查。
- **预防**：共享组件改动固定跑状态矩阵；减少动态效果单独验证。

### 19. 语义组件迁移后测试仍点击旧文案

- **现象**：周期选择器已迁移为日期面板，测试仍查找旧的 `Custom date range…`，导致专项失败。
- **根因**：只更新了运行组件，没有同步测试中的语义入口和断言。
- **修复**：测试改为点击当前 `Custom range` 预设，并直接断言 `Custom range` 与面板内的起止日期。
- **预防**：组件迁移、重命名或删除旧入口时，同时搜索测试和文档中的旧文案；完成标准按当前可见语义核对。

### 20. 主题切换后立即取色，读到过渡中的颜色

- **现象**：点击主题按钮后马上断言文字或图标颜色，偶发读到上一主题或过渡中间值。
- **根因**：620ms 整页交叉淡变尚未结束；把动画过程中的 computed style 当成最终状态。
- **修复**：等待共享主题过渡稳定后再断言，并区分普通 DOM 焦点与 `:focus-visible`。
- **预防**：主题、玻璃和 hover 的颜色验收先等共享时长结束；同时检查深色、浅色、鼠标焦点和键盘焦点。

### 21. 绝对定位玻璃材质以错误的祖先为包含块

- **现象**：全屏搜索框视觉上只有 56px 高，但玻璃底板向下延伸，并在点击时出现整块方形/连体轮廓。
- **根因**：`.wd-glass-material` 绝对定位并依赖 `inset:0` 贴合宿主；宿主未建立定位包含块时，浏览器按最近的定位祖先 `.wd-search-stage` 计算，高度从 56px 变成整列高度。
- **修复**：把 `.wd-glass` 自身的 `position` 设为 `relative`，让材质层始终锚定宿主；结果面板保持独立间距和自身阴影。
- **预防**：任何绝对定位的材质、遮罩、描边或高光层都必须确认宿主建立了定位包含块。验收同时量宿主与各玻璃层的 `getBoundingClientRect()`，不能只看视觉截图的搜索框轮廓。

### 22. 共享快捷键键帽沿用导出的单字形列宽

- **现象**：首页内联搜索的 `Ctrl K` 右侧几乎贴住搜索框，侧栏与结果区看起来又偏白或偏暗。
- **根因**：Figma 导出的 `right content` 只有 35px，原本是单个 mac 字形的槽位；替换为共享键帽后实际宽度约 52px，旧列宽与绝对子节点的收缩计算彼此叠加，键帽向右溢出。字体和颜色也残留了组件级旁路样式。
- **修复**：三处统一由 `createShortcutKeycaps()` 生成，颜色、背景和 `Footnote/Regular` 由共享 CSS 决定；内联宿主以搜索框右缘内缩 20px 为锚点、`width:max-content` 向左生长，内层导出组改为参与测量的相对定位。
- **预防**：替换导出图形组时先测真实组件宽度，再确认锚点是左缘还是右缘；绝对定位容器不能用 `width:auto` 或被子项的 35px 旧列宽反向限制。快捷键类元素不得从 Figma 文本节点复制，也不得各页面单独补样式。

### 23. 图标 hover 瞬间跳变，时长改了也没用

- **现象**：共享 token 已经写成较长时长，侧栏图标与 `Add tab` 仍是硬切，并短暂出现黑灰中间态。
- **根因**：`.target-icon-neutral::before` / `::after` 被写进了 `:where(...)` 的参数列表。CSS 规范不允许伪元素出现在 `:is()` / `:where()` 中，整条声明被解析器丢弃，伪元素退回浏览器默认 `transition: 0s`。同时 `Add tab` 还叠加了 `filter: brightness(1.3)` 的局部 hover，与遮罩交叉淡化叠加。
- **修复**：改成 `:where(.target-icon-neutral)::after` 这种宿主在 `where` 内、伪元素在外的合法写法；移除局部 `brightness` 提亮，颜色状态统一由共享遮罩与 token 表达。减少动态效果的 `:where(*, *::before, *::after)` 同样被丢弃，一并修正。
- **预防**：写伪元素过渡时先看 computed `transitionDuration`，不要只看源码；全站扫描 `:where()` / `:is()` 参数里是否含 `::`；图标遮罩过渡用真实 hover 中间帧验证，不只看最终色。

### 24. 搜索退场时背景模糊比内容先消失

- **现象**：全屏搜索关闭时，结果卡和搜索框还在往下走，背景已经变清晰，页面像先弹了一下再收尾。
- **根因**：遮罩和内容共用同一个短退场长度，模糊还没退完内容已经走光；更隐蔽的一层是弹窗根节点上的占位 `opacity` 动画，它让整个弹窗进入独立合成层，层内 `backdrop-filter` 采样不到页面，遮罩在第一帧就失效。即使只给遮罩动画底色、不降 `opacity`，底色保持 29% 到最后再整体卸载，也会在末帧突然清晰。
- **修复**：遮罩使用独立的 `--wd-motion-search-veil-delay` + `--wd-motion-search-veil-out`，前 `36%` 保持满模糊，等结果面与搜索框都离开后再收；用 `@property` 注册模糊长度并和 `background-color` 在同一 keyframe 里按 `75% / 46% / 18%` 的比例分段降到 0，尾帧已透明再卸载。两段插值即使总时长够长，模糊也会在前三分之一掉光，因此必须保留可感知的中间关键帧。全屏搜索节点监听遮罩退场动画结束（不再只靠固定 `setTimeout`）后移除。当前退场参数为玻璃 `180ms`、退场错落 `40ms`、遮罩 `70ms + 490ms`，不得与进场 `980ms / 90ms` 共用 stagger；测试必须先完成退场采样，再单独打开搜索断言进场，避免测试自身提前卸载遮罩。
- **预防**：涉及全屏模糊层时，先画真实时间轴，确认内容退完那一刻模糊仍是满值、末帧模糊与底色已归零；退场验收要采样 computed `backdropFilter` 和 `backgroundColor`，不能只看截图观感。禁止对遮罩或任何祖先节点动画 `opacity`/`filter`，也不要把底色拆到伪层——这些都会破坏 `backdrop-filter` 采样。

### 25. 搜索专用变量在同一选择器里自引用

- **现象**：给全屏搜索卡片设置 `--wd-glass-drop: var(--wd-search-drop)` 后，投影完全消失或退回旧值。
- **根因**：基础规则与覆盖规则写在同一元素，变量解析成 `--wd-glass-drop: var(--wd-search-drop)` 后又间接引用自身，形成循环；另外浅色玻璃的表面分支优先级高于普通搜索规则，只把值写在共享基础层会被覆盖。
- **修复**：只在 `.wd-search-panel--fullscreen > .wd-glass-material` 的基础规则映射 `drop-y/blur`；浅色投影、外沿和接触阴影放到 `:root[data-theme="light"] .wd-search-panel--fullscreen > .wd-glass-material` 这一更高优先级分支，并分字段覆盖，避免同名变量自引用。
- **预防**：CSS 自定义属性覆盖前检查变量链是否回到自身；浅色特例先比较选择器优先级与层叠顺序，再看 computed `boxShadow`。验收同时检查浅色与深色实际计算值，不能只看源码里有声明。

### 26. 缩短搜索退场时误改了已经认可的进场

- **现象**：用户只要求退场快一点，删减搜索时长时把 `--wd-motion-search-stagger` 一起改小，导致原本已认可的 980ms 进场错落也被改变。
- **根因**：进场与退场共用了同一个 stagger token，代码看起来只改一个值，实际跨越了两条时间轴；测试也只断言退出顺序，没有锁定进场时长。
- **修复**：新增 `--wd-motion-search-out-stagger: 40ms`，退场只读取这一项；进场继续使用 `90ms`。玻璃退出与遮罩退尾分别独立缩短，并用 computed animation timing 同时断言进场和退场。
- **预防**：调整进场或退场的节奏前先列出所有读取该 token 的规则；只要两种方向存在不同的设计意图，就拆成方向专用 token。验收必须覆盖未要求改变的另一条时间轴，不能只测被改的方向。

### 27. 历史浮窗图标被“统一成中性灰”，覆盖了侧栏原色

- **现象**：用户指出浅色主题历史浮窗里 Home 变白、Plants 不再是黄色。修改后虽然 Home 恢复正常，但实现里仍靠 `route === "home" ? "mono" : "color"` 这类特判拼色调，属于把同一份图标规则复制了第二遍。
- **根因**：`menu-row` 原始实现会按文件名把中性图标强制转成 `mono`，历史浮窗又统一传 `mono`，两层归一化叠加后把彩色路由图标压平；修复时只针对单条路由打补丁，没有回到“复用侧栏同路由图标”这一语义。
- **修复**：`history-popover.js` 打开时直接 `cloneNode` 侧栏同路由的 `.target-icon-art`，`menu-popover.js` 接受现成图标节点并停止按文件名改 tone；`prepareIconMasks()` 从 `control-states.js` 导出，供晚创建的浮窗在挂载前执行，且跳过已是 `data:` 的 mask。
- **预防**：历史浮窗、搜索结果、最近访问这类“同路由同图标”的位置，一律从 `app-shell` 的导航节点复用，禁止另写文件→tone 映射表或按路由名判断颜色。改动后必须逐路由对比 tone class、图片 `src`、`--icon-mask` 与侧栏完全一致，并在浅色和深色下各看一次默认与 hover，而不是只确认“有个灰色图标”。

### 28. 浮窗只在打开时量一次锚点，滚动后留在原地

- **现象**：日期选择器和 `Chart options` 打开后滚动工作区，浮窗不跟随触发按钮，仍停在原来的视口坐标；页面缩放下也可能错位。
- **根因**：打开时把 `getBoundingClientRect()` 的结果用于一次性 `left/top`，后续没有任何重算。只在窗口 `scroll` 上监听也接不住嵌套工作区的滚动，因为滚动事件不会从内部滚动容器冒泡到文档。
- **修复**：共享 `popover.js` 维护已打开面板集合，`placePanel()` 每次都用实时包围盒与 `offsetWidth/offsetHeight` 重算，统一处理 8px 间距、12px 视口边距和上下翻转；在 document 捕获阶段监听 `scroll`，并监听 `resize`、`visualViewport` 变化，用 `requestAnimationFrame` 合并更新。内联搜索结果与工作区标签 tooltip 走同一契约，触发元素一半以上离开视口即关闭，避免浮窗贴边“悬空”。
- **预防**：禁止缓存锚点坐标，也不能只在打开时算一次；所有锚定浮层必须复用共享实时定位，滚动监听写在 document 捕获阶段。新增浮层只接入 `registerPanel()` 或同一 `position()` 契约，不另写滚动关闭或固定坐标。验收必须在真实滚动容器里滚动后量浮窗与触发的相邻关系和边对齐，再检查滚出视口会关闭。

### 29. 主题切换把元素级颜色过渡冻结进新快照

- **现象**：当前活动页不是 Home 时，切换深浅主题，侧栏 Home 的 mono 图标先闪一下旧主题的亮色，再慢慢变成目标灰。选中状态下几乎看不出来。
- **根因**：`theme-controller.js` 用 `startViewTransition()` 生成新主题快照，但元素上仍有 `240ms / 360ms` 的 `color`、`background-color` 过渡（mono 图标是 `background: currentColor` + mask）。快照拍到的是过渡中途的颜色，于是旧墨色被冻结进整段 `620ms` 交叉淡入里。
- **修复**：新快照生成期间给 `<html>` 挂临时 `data-theme-snapshot`，`theme-transition.css` 在该窗口内把过渡时长和延迟压到 `0s`（不限颜色属性，覆盖 mask 背景、伪元素和 SVG 滤镜）；`transition.ready` 之后立即移除，恢复原有 `240 / 360ms`。
- **预防**：涉及 View Transition 的整页主题切换时，先确认参与快照的元素在快照帧里是终态；颜色、背景、遮罩和伪元素都不能带残余过渡。验收时让目标元素处于未选中、未 hover 状态，再逐个方向切换并暂停在中间帧读取 computed 颜色，不能只看切换结束后的最终值。

### 30. 只在内存里切换页面，刷新就回首页

- **现象**：侧栏切到 Plants 或详情后看起来正常，但地址栏仍是 `/home`；刷新、复制链接或浏览器后退全部回到首页。
- **根因**：路由只更新了标签和 DOM，没有把 `{route, params}` 写入浏览器地址栏；服务端也没有为 `/plants/:id` 返回 SPA 外壳。只补 `pushState` 还不够，直接打开多级路径时相对脚本和素材会按 `/plants/` 解析而 404。
- **修复**：`routes.js` 统一路径与参数互转，`workspace.js` 同步地址栏；`server.js` 与构建后的 `_redirects` 为页面路径返回 SPA 外壳；HTML 加 `<base href="/">`；`verify-routing` 覆盖刷新、复制链接、标签切换和前进/后退。
- **预防**：新增路由时同时验证“直接打开该 URL”和“在该 URL 刷新”，不能只点导航看视图。不要在页面里直接拼 URL 或写 `pushState`；深链接回退不能用会吞掉 `/src/*` 的全站代理。`/home.html` 与 `/home` 的自动重定向不得互相指回。

### 31. 标签拖拽换位一次后停止

- **现象**：首轮拖拽只能把标签移动一位，继续拖动时指针已离开被拖节点，邻居不再换位。
- **根因**：实时重排使用 `insertBefore` 移动了正在 `setPointerCapture` 的源节点；节点从一个兄弟位置移到另一个位置时，Chromium 会隐式释放 pointer capture，随后 `lostpointercapture` 被当成拖拽结束。
- **修复**：每次 DOM 换位后重新捕获同一个 pointerId；`lostpointercapture` 若仍在拖拽中则优先重绑，只有无法恢复时才走取消流程。回归用真实指针连续跨过两个邻居拖到末尾，再反向拖回首位。
- **预防**：拖动中的节点如果会被移动、重挂载或替换，必须验证 pointer capture 生命周期。不能只测单次换位；至少覆盖向前、向后、跨多个标签、释放后不误触 click。

### 32. 最近访问只保存路由，详情层级和跨标签记录丢失

- **现象**：进入某个电站后，`Recently visited` 和左侧历史浮窗仍只显示 `Plants`；`Plants` 列表与不同电站详情被当成同一条记录，其他标签打开的页面也无法区分。
- **根因**：访问归档只保存 `route`，没有保存 `params`；去重和显示都按父级路由处理。视觉层又把标题当成单一字符串，无法分别设置父级、分隔符和末级名称。
- **修复**：条目升级为 `{route, params}`，`/plants/:id` 通过稳定电站 ID 生成独立记录；所有标签共用一个访问归档，页面导航统一在位置渲染时写入。首页和浮窗共用 `history-path.js`，父级与分隔符使用 Labels/Secondary，末级使用 Labels/Primary。
- **预防**：最近访问、搜索结果和标签快照只要包含参数，就必须比较完整 location，不能只比较 route。两处以上展示同一历史时必须复用同一描述器和面包屑组件；回归至少覆盖多标签切换、列表→详情→另一标签→返回首页后的完整路径与跳转参数。

### 33. 浮层另造原生滚动条，视觉与列表不一致

- **现象**：Plants 表格使用 6px / hover 8px 的共享滑块，Company 筛选浮窗却出现系统宽度的原生滚动条，圆角、颜色和拖动行为都不一致。
- **根因**：筛选实现单独引入 `.wd-scrollbar` 和 `::-webkit-scrollbar`，把“可滚动”误当成“可使用另一套滚动条视觉”。
- **修复**：删除独立样式，浮层改调用共享滚动反馈；Company 传入列表内容节点启用默认弹性，标题和搜索框保持固定，几何内距由页面提供。
- **预防**：可见滚动条只能使用共享组件。需要回弹的滚动区同时提供 `host`、`viewport` 与 `content`；无需回弹的固定区域才显式传 `elastic:false`。玻璃浮层中的回弹空隙必须透明并透出母材质，不能沿用普通数据表的 `--wd-bg-tertiary` 实底。树控件优先用同尺寸的展开按钮与复选框压缩无意义槽位；长名称仍换行时，再按实际文本宽度调整浮层宽度，不靠继续压缩控件间距。共享列表容器上的 Company 专用几何必须用状态类限定，并回归其他二级浮窗，避免一次局部调宽把 Device 等选项整体带到边缘。选中内容与轨道之间必须实测留白，不能只比较 CSS 类名；也不能新建原生伪元素、页面私有滑块或按页面复制 6/8px 参数。

### 34. 背景淡出过程中圆角先消失

- **现象**：Plants 行失焦后，原本的圆角高亮在颜色尚未完全消失时短暂变成直角块。
- **根因**：背景色参与共享离场过渡，但首末单元格的 `10px` 圆角只写在 hover / focus 状态里；状态撤销后背景仍在淡出，圆角却已消失。
- **修复**：把首末圆角移到 `.plants-cell:first-child` / `:last-child` 的默认样式，激活状态只改变背景色。
- **预防**：任何在背景离场时会短暂保留的圆角表面，轮廓必须常驻；回归应在过渡中间帧同时检查背景尚未透明、四角半径仍然存在。

### 35. SPA 路由重写到 index.html 触发部署循环

- **现象**：Cloudflare 构建命令成功，但创建 Worker 版本时返回 `_redirects` 无限循环。
- **根因**：新版 Workers 会识别 `/index.html` 的 HTML 后缀归一化；业务路径以 `200` 重写到该目标后，可能再次进入同一规则。
- **修复**：使用 `wrangler.jsonc` 的 `assets.not_found_handling: "single-page-application"` 处理深链接；`_redirects` 只保留首页规范跳转。
- **预防**：SPA 深链接由静态资源平台的 fallback 能力负责，不能自造 catch-all 重写到 HTML 文件；`verify-build-config` 检查配置与生成产物。

### 36. 历史路径按固定字符数截断，留下大段空白

- **现象**：历史浮窗和首页最近访问明明还有横向空间，长工单标题仍被提前省略成 `…/Request: export m…ault histor…`。
- **根因**：共享路径组件先按 `leafLimit` / `totalLimit` 字符数压缩，再交给 CSS 排版；字符数与实际字体宽度无关，容器变宽也不会继续显示。
- **修复**：移除固定字符预算，按实际字体和容器宽度测量；完整路径优先，必须截断时先保留紧邻末级的父路径并缩短单页标题，父级加最小可读末级仍放不下才丢弃更早层级。分隔符改为独立 span 的左右 `4px` 内距，避免 flex 吞掉 `/` 两侧空白。通过 `ResizeObserver` 在容器或字体尺寸变化后重算。
- **预防**：路径、标签、面包屑等单行自适内容不能用字符数代替像素宽度；不能依赖文本节点首尾空白制造间距。回归必须用长标题同时检查首页摘要与浮窗不溢出、父级可见、完整叶子在能放下时不被省略、`/` 两侧有稳定间距，并确认没有可利用的大段尾部空白。

### 37. 滚动回弹沿用默认实底，出现白色横条

- **现象**：Service Ticket 和 Plants 等列表在浅色模式下拉动时，内容与工具栏之间出现通栏白色区域，和右侧母面板不连续。
- **根因**：共享滚动反馈默认用 `Backgrounds/Tertiary` 填充上下回弹面；多数列表本身透明并依赖外层 `wd-main-panel`，因此这个不合适的默认值被显性暴露，逐页补透明又容易漏改。
- **修复**：把共享 `wd-scroll-feedback__pull` 的默认背景改为 `transparent`，所有列表和浮层直接继承透明；需要实底的特殊场景再通过 `--wd-scroll-pull-surface` 显式覆盖。
- **预防**：通用滚动组件先选适合多数宿主的安全默认值，不能把某个独立表面的视觉前提设成全局默认。回归至少检查 Plants、Service Ticket 与浮层滚动列表的顶部和底部，不能只修用户当页或只看静态初始位置。

### 38. 浅色卡片的白色光效被主题分支反转成黑点

- **现象**：Service Ticket 小卡片在浅色主题 hover 时出现深灰点阵和黑色跟随光影，与要求的白色光效相反。
- **根因**：PixelCard 为了让浅色背景上的点“可见”，在浅色主题硬编码了深灰 palette 和灰色 glow；FlipCard glare 又直接使用浅色主题的黑色主文字色。两层都把光效语义错误地当成普通文字对比度处理。
- **修复**：PixelCard 改为按主题接收独立 palette：深色点阵保持白色，浅色点阵使用共享深色 ink；FlipCard 在浅色主题仍使用白色径向渐变与 `screen` 混合，编号胶囊扫光也保持白色。
- **预防**：光效、辉光和扫光使用独立的亮度语义，不能复用正文主色或按主题反转。回归读取 canvas 非透明像素的平均 RGB，并检查 glare 的渐变颜色与混合模式；默认和离开后仍需完全清理。

### 39. 状态徽标只按品牌色选底，忽略白字对比度

- **现象**：Service Ticket 的 `POSTER` 使用亮黄色 Accent 配白字，浅色尤其是深色主题下辨识度不足。
- **根因**：把装饰性 Accent 直接当成文字徽标背景，只验证颜色来源，没有计算前景与背景的实际对比度。
- **修复**：`POSTER` 改为共享 Brown 64% + Black 36% 的深琥珀底，继续使用白字；`YOU` 保持蓝色实底白字。徽标尺寸和排版不变。
- **预防**：小字号实底徽标必须按 WCAG 正文阈值验证对比度，至少 `4.5:1`；品牌色亮度不足时用已定义中性色加深，不能靠描边或阴影补救。

### 40. 页面级文字可读性覆盖污染共享搜索控件

- **现象**：Service Ticket 搜索框明明直接使用 `createSearchField()`，图标和占位文字却比 Plants / Quick search 更重。
- **根因**：浅色可读性 token 被设在 `.service-view` 根节点，工具栏内的共享搜索也继承了加深后的 `Labels/Secondary`。
- **修复**：把可读性覆盖收窄到 `.service-board`、`.service-empty`、`.service-detail-content` 等内容容器；页头、工具栏和共享搜索控件继续使用全局 label token。
- **预防**：页面级 token 覆盖必须放在最小内容宿主上，不得放在包住共享控件的页面根节点；搜索框回归同时比较图标、占位文字和侧栏 Quick search。

### 41. 搜索阴影“被裁切”其实是后续表面覆盖

- **现象**：工具栏搜索框底部出现一条浅边，看起来像玻璃阴影被 `overflow` 截断。
- **根因**：搜索玻璃本身没有裁剪，后续固定表头 / 条件条先绘制背景，覆盖了向外延伸的投影。
- **修复**：Plants 搜索字段建立高于表头的局部绘制层，让真实投影覆盖下方表面。
- **预防**：阴影接缝先检查元素、祖先 `overflow` 与后续兄弟层叠，不能直接继续减淡投影；验收截图需同时覆盖有筛选条和无筛选条两种状态。

### 42. 页头文字动作被错误套成标准玻璃按钮

- **现象**：`New plant` / `New ticket` 过高、玻璃感过强，与参考中的轻量页头动作不一致。
- **根因**：页头文字动作直接复用了 36px 标准玻璃按钮，没有区分页头动作与表单 / 工具栏动作。
- **修复**：新增共享 `createPageHeaderAction()` / `.wd-page-action`，28px 高、默认透明，hover / focus 才出现浅灰胶囊；标准 36px 玻璃按钮保持原用途。
- **预防**：先判断动作所属层级，再用现有变体；同类页头动作只扩展现有共享 API，不逐页另写尺寸与材质。

### 43. 相对时间规则散落在页面内

- **现象**：Plants 与 Service Ticket 对分钟、小时、天和绝对时间的截断规则不同，Properties 的 Created 又始终显示绝对时间。
- **根因**：每页各自维护 `relativeTime` / `absoluteTime`，阈值与舍入方式逐步漂移。
- **修复**：新增共享 `foundations/time.js`，固定 7 天相对窗口与统一绝对时间格式；页面只传时间值。
- **预防**：新增时间展示先调用共享格式化函数，并用固定 `now` 覆盖秒、分、时、天和 7 天边界；不得复制阈值或单复数逻辑。

### 44. 浅色卡片的白色点阵始终不够清楚

- **现象**：Service Ticket 卡片在浅色主题 hover 时，顶部仍能隐约看到白色像素，但远离指针的卡片底部几乎完全消失；深色主题正常。
- **根因**：白色点阵在 `#EDEDED` 表面上的最大亮度差很小，当前远端 alpha 只有约 `73/255`，同时画布按到卡片边缘的距离继续淡出，底部再乘以 `0.65`，视觉上等于没有效果。只看是否存在白色的断言无法发现这个对比度问题。
- **修复**：PixelCard 增加按主题选择的 palette。Service Ticket 深色继续使用白色点阵，浅色改为共享 `Labels/Secondary` 的 `rgb(60,60,60)` 深色 ink；最终用户明确允许浅色使用深色点。点间距、尺寸、边缘衰减、展开与清理保持原值。回归同时读取画布颜色及下半区覆盖。
- **预防**：光效颜色必须按实际表面对比验证；白色在浅色表面上即使提高 alpha 也很容易只剩极低亮度差。不能只断言“存在非透明像素”，也不能让主题切换后的颜色读取缓存失效。

### 45. 深色 Plants 筛选条左侧融入渐变面板

- **现象**：深色模式有筛选条件时，筛选条右侧能看出边界，左侧却与工作区背景融为一体；固定表头还形成一块独立的实色矩形。
- **根因**：两者都使用普通 `Backgrounds/Tertiary` 的 `#2C2C2E`，恰好等于工作区斜向渐变的左端；表头再用同一实色覆盖滚动区，就会在任何位置形成固定矩形。
- **修复**：筛选条改用 `Backgrounds/Tertiary Elevated` 的 `#3A3A3C`。表头与数据滚动区拆成两个同步列宽的表，深色表头位于滚动区外并透明显示父面板，停止使用背景模糊；浅色仍保持纯白条带和主面板同色表头。
- **预防**：叠在渐变母面板上的固定表面不能假设单一顶部色值能代表整条背景；用 elevated 语义或透明隔离方案保证整宽可见。修改表头时必须同时滚动验证：既不能出现额外色带，也不能让数据行文字透到表头。

### 46. 共享遮罩图标工厂替换后丢失基础绘制类

- **现象**：Plants 的 Status 列只剩 `Normal / Attention` 文字，没有绿色勾选和红色警示；Unbound 的内联 SVG 仍正常。
- **根因**：页面改用共享 `createMaskedIcon()` 后，Status 调用传入尺寸、颜色和状态类，却漏掉了提供 `background-color` 与 `mask` 规则的 `.plants-icon` 基础类。DOM 中存在掩码变量和 14px 盒子，因此只看尺寸或 `--icon-mask` 会误判为正常。
- **修复**：为 Status 遮罩节点补回 `.plants-icon`，回归同时检查实际 mask、语义背景色、14×14 尺寸和基础类。
- **预防**：共享图标工厂迁移时，调用方仍必须提供该页面负责实际绘制的宿主类；验收以最终可见像素或 computed mask/background 为准，不能只检查 URL、颜色或盒子尺寸。

### 47. 全屏弹窗按固定顶部定位，换高度后再次上移/下沉

- **现象**：设置弹窗位置刚调好，窄版 Rename / Unbind 又偏下；用户连续要求上移，固定 `top` 或单档 translate 反复失效。
- **根因**：把不同内容高度的弹窗当成同一几何，或只修某一类弹窗的局部例外。
- **修复**：统一先视口居中，再按宽度档位应用固定偏移：普通窄版 `80px`、宽版 `24px`、确认版 `80px`。业务弹窗只声明宽度、高度和内容，不写第二套背景或关键帧。
- **预防**：新增或改动弹窗时至少实测 Add / Rename、Settings / Replace、Unbind 三类高度，并断言视口中心偏移；不得只检查其中一个弹窗的截图。

### 48. “复用首页材质”被实现成复制参数

- **现象**：首页搜索的遮罩、反射、圆角与进出场看似一致，但设备弹窗另写一份 CSS，后续任何参数修正都会漂移。
- **根因**：只复制视觉值，没有复用相同 DOM 类、Glass Surface 和共享时长函数。
- **修复**：直接复用 `.wd-search-fullscreen`、`.wd-search-backdrop`、`.wd-search-panel--fullscreen`、`.wd-search-panel-frame`、Glass Surface 与 `fullscreenOverlayEnterDuration()` / `fullscreenOverlayExitDuration()`。
- **预防**：用户要求“统一/标准化”时，验收共享类名、共享组件 API 和计算参数，不能只比较截图看起来接近。

### 49. 浅色输入框用白底混合，focus 又切纯白

- **现象**：深色主题正常，浅色输入框看起来像白色浮层，与 Site details 的灰色填充不一致。
- **根因**：用主文字色与白色混合生成浅色底，并在 hover / focus 直接把背景设为白色。
- **修复**：浅色默认使用透明中性 `Fills/Quaternary`，hover / focus 使用 `Fills/Tertiary`；focus 只增加中性轮廓，不改变成白底，也不使用浏览器蓝框。
- **预防**：共享字段必须同时读取默认、hover、focus 的 computed background，并与 Site details 对照；不能用“更亮”概括为白色。

### 50. 危险菜单状态被共享中性 hover 覆盖

- **现象**：Unbind 默认文字是红色，但 hover 后图标变白、背景仍是普通中性色。
- **根因**：共享 `.wd-menu-row` 的 hover 选择器优先级更高，页面只覆盖了默认颜色。
- **修复**：页面为危险项同时覆盖默认、hover、`focus-visible` 的文字、图标和背景；图标与文字均使用纯红，背景使用红色 `11%` 淡透明层。
- **预防**：所有语义状态都按默认 / hover / focus-visible / disabled 全矩阵验收，并同时比较图标与文字 computed color；不能只检查静态截图。

### 51. 一次视觉反馈允许后续迭代，但旧参数必须从规则中删除

- **现象**：Cluster 曾要求首项默认展开、图片曾要求 `72px / 96px`、Heater 字段顺序与弹窗宽度也经过多轮调整，文档仍同时保留多个旧值。
- **根因**：只追加新条目，没有回收被覆盖的旧规则，新对话可能读到相反要求。
- **修复**：以最新明确要求重写同一规则，旧值只在确有必要说明“已废弃”时保留；当前最终值为全 Cluster 收起、产品图 `120px × 96px contain`、Heater `Model / Hardware / Firmware / SN / Check code`、Unbind 独立 `480px`。
- **预防**：每次更新用户要求时运行关键字反查，确认旧尺寸、旧顺序、旧默认状态和旧实现方式没有残留在 AGENTS、设计规范、组件手册或页面 README 中。

### 52. 原生滚动条出现后把整页卡片挤移

- **现象**：Site details 从查看切到编辑后内容变高，浏览器原生滚动条出现，两列卡片和右侧控件横向跳动；共享滚动条也没有及时出现。
- **根因**：详情视口仍绘制原生滚动条，而共享 `createScrollFeedback()` 只观察宿主和视口尺寸，不观察内容替换/增高。
- **修复**：详情视口隐藏原生滚动条；滚动反馈同时监听内容 `ResizeObserver` 和视口子树变更。内容可滚动时只显示共享轨道，页面放得下时轨道保持隐藏。
- **预防**：任何“查看/编辑”或“折叠/展开”会改变内容高度的页面，都要比较切换前后卡片 left/width 与视口 `scrollbarWidth`。不能只在首次渲染后调用 `sync()` 或只看静态截图。

### 53. 编辑态控件变大导致行高和后续卡片位移

- **现象**：Site details 查看行 52px，编辑输入把同一行撑高，下一张卡向下移动；右侧字段文字也变大。
- **根因**：输入框自身高度、上下 padding 和字号没有与展示态共同约束。
- **修复**：行默认保持 `52px`；值、输入、单位和自定义选择当前值统一 `14px`；标题输入是唯一允许因真实换行增高的例外。
- **预防**：切换状态前读取卡片 rect、行高和右侧控制盒，切换后逐项比较。不能只检查内容是否存在或视觉上“差不多”。

### 54. “复用按钮”只复制默认色，没有覆盖交互态

- **现象**：Delete plant 静态是红色，hover 后却变回共享 Primary 的蓝色。
- **根因**：页面只覆盖了默认玻璃 tint，没有覆盖共享 `.wd-button--primary:hover` 的更高优先级规则。
- **修复**：危险按钮复用 Save / Apply 的文本按钮类路径和尺寸，再对默认、hover、focus 分别写红色 tint；文字始终白色。
- **预防**：所谓复用样式必须核对默认、hover、focus-visible、disabled 的类路径与 computed 颜色。不能只截图默认态。

### 55. 原生 select 与平台步进器破坏统一界面

- **现象**：Site details 的下拉由系统弹层绘制，箭头和选项行与全站菜单不同；数字输入出现难看的浏览器上下箭头。
- **根因**：页面直接使用 `<select>`、`number` 默认控件和 disclosure 三角形。
- **修复**：下拉改为自定义选择按钮 + 共享 Glass Surface 浮层，箭头复用 `asset-14.svg` 并旋转指向下方；数字输入隐藏原生 spin button。
- **预防**：涉及选项和数值设置时先检查共享 Field / Popover，不能把浏览器原生 UI 当作最终视觉；禁用箭头后仍要验证键盘输入。

### 56. 开关为了去光而关闭态不可见

- **现象**：Alarm notification 关闭后轨道太透明，几乎看不出是开关；开启状态内部又出现强白光。
- **根因**：组件自定义了一整套玻璃光学变量，既削弱了关闭态中性填充，也让状态和高光失衡。
- **修复**：轨道外部直接复用标准玻璃按钮材质；OFF 使用可见的中性控制填充，ON 只覆盖填充/轮廓为蓝色，白色滑块固定，内部反射克制。
- **预防**：开关必须同时检查 ON、OFF、hover、focus、disabled 和深浅主题。材质复用要比较实际 `wd-glass-fill`，不能只看 host 上有 `.wd-glass`。

### 57. 设置页在宽屏被拉成整屏

- **现象**：Site details 在超宽显示器上两列被无限拉长，标签与值相距过远，阅读效率下降。
- **根因**：沿用“详情页满宽”的旧外壳规则，没有区分数据密集页与设置型页面。
- **修复**：新增 `.wd-page-content` 和 `--wd-page-content-max:1000px`；设置/详情/资料页居中，内部网格撑满内容列；表格和设备清单继续满宽。
- **预防**：新增页面先判断是“浏览大量数据”还是“编辑有限资料”，不要默认复制满宽布局，也不要复制 Home 的 shadow gutter。

### 58. 页面标题与表单标题重复，长名称又被单行输入裁切

- **现象**：顶部已有 Site details/Plant name，Basic information 又显示 Plant name；编辑长名称只能横向滚动。
- **根因**：把页面身份标题和资料字段当成两个独立事实，并使用单行 input。
- **修复**：顶部直接显示电站名，编辑时原位使用默认 `44px`、最宽 `760px` 的自动增高 textarea；Basic information 删除重复 Plant name，Enter 不产生段落，换行归一为空格。
- **预防**：同一事实只保留一个编辑位置；标题、描述等用户可输入的长文本使用共享 `animateContentHeight()`，并覆盖短标题、长标题、连续输入与减少动态效果。

### 59. 模板变化后规范仍在描述旧实现

- **现象**：Site details 已使用共享 Glass Surface 下拉、52px 行高和无阴影卡片，文档仍写原生 select、54px 和讨论卡投影；组件 API 文档还残留 `actionsHost`。
- **根因**：只追加新需求，没有同步清理被覆盖的旧句。
- **修复**：以当前实现和测试为证据逐项反查页面规格、README、组件手册和 AGENTS；无法统一的实现债另列到规则总表，不写成“已经统一”。
- **预防**：视觉/交互收口后执行关键字反查：`原生 select`、旧高度、旧半径、`actionsHost`、旧按钮 state、已删除字段和废弃文案。文档不得同时存在互相冲突的最终规则。

### 60. 小多图按整个 DOM 顺序串行入场

- **现象**：月 / 年 Separate 的四张图不是同时开始，第一张图所有记录点播完后，第二张才开始，整体显得拖沓。
- **根因**：把整屏 `.plant-overview-chart-mark` 当成一个数组递增 delay，没有按图表分组。
- **修复**：以图表容器分组，图内标记使用左到右 `clip-path` 和约 `3ms` 微错峰，四张图之间约 `28ms` 起始差；共享 chart duration 当前 `900ms`。
- **预防**：新增小多图时先测“各图首标记的 delay 差”和总启动窗口。不得仅用整屏 DOM 顺序做 `index * stagger`。

### 61. SVG 等比缩放让横向铺满失效

- **现象**：Combined 图表面板已是满宽，内部绘图仍左右各空出一大块，看起来像居中缩略图。
- **根因**：容器宽度增加后仍使用 `preserveAspectRatio="xMidYMid meet"`，SVG 按高度等比缩放并自动留下左右 letterbox。
- **修复**：Combined 几何使用 `preserveAspectRatio="none"` 铺满；日期轴标签移到独立 HTML 覆盖层，避免字形被横向拉伸。
- **预防**：图表“铺满”必须检查实际 SVG 内容包围盒，不只看外层宽度；含文字的坐标轴不能直接接受非等比拉伸。

### 62. 年视图 Combined 把每日序列错误聚合为 12 个月

- **现象**：年视图 Combined 只有 12 个点，与参考图的全年趋势密度不符。
- **根因**：月 / 年共用了一套按月份聚合的数据生成逻辑。
- **修复**：Separate 年视图保留月度 Rungs；Combined 单独生成完整年份逐日序列，平年 365 点、闰年 366 点，`data-point-count` 与每日 focus 热区一并生成。
- **预防**：同一周期下不同布局可以有不同的聚合粒度；验收必须断言数据点数和首末日期，不能只看图形轮廓。

### 63. 放大浮窗后覆盖图表或重复峰值标签

- **现象**：History 浮窗放大后压住绘图区；年图柱顶又常驻一个峰值 kWh，和 hover 内容重复。
- **根因**：只放大了字号，没有重新安排浮窗位置；峰值标签是早期模板残留。
- **修复**：年图删除静态峰值标签；History 浮窗整体上移，Combined 使用两列四项摘要并保证工具卡底部位于绘图区上缘以上；Self-powered 浮窗同步增加上移与横向夹取。
- **预防**：字号调整后必须重新截图检查浮窗、标题、图例、扇区和绘图区的关系，不能只断言字号变大；同类信息不得同时常驻和 hover 重复展示。

### 64. 平滑折线改变读数语义

- **现象**：为了视觉平滑使用了 7 天加权路径，若继续用平滑后位置生成 tooltip，会把平均趋势误当成当天值。
- **根因**：把“显示路径”与“原始数据索引”混成一个数据序列。
- **修复**：仅对超过 120 点的密集路径做可见折线平滑；点标记、hover / focus、`aria-label` 和日期仍取原始逐日值。
- **预防**：任何 smoothing / interpolation 都必须明确区分 display series 与 source series，并在测试中抽查原始日期和数值。

### 65. 折叠高度动画被 padding 地板卡住

- **现象**：Battery Cluster 收起时，内容已经几乎透明，却会短暂停在约 `22px` 的中间高度，最后再突然消失，看起来像动画卡顿。
- **根因**：详情容器的上下 padding 合计为 `22px`，旧动画只把 border-box 的 `height` 收到 `0`。浏览器仍必须为 padding 保留空间，所以实际高度最低停在 `22px`；透明度继续下降期间就会暴露截图中的残影。另有设备布局观察器把纵向高度变化也当成重新计算列宽的信号，造成额外的逐帧尺寸读取和样式写回。
- **修复**：共享 `bindDisclosure()` 同时动画高度、margin、padding 与透明度；设备布局观察器按 `contentRect.width` 过滤，只在横向尺寸变化时更新六列和分隔线。
- **预防**：不得只在带固定 padding / border 的容器上动画 `height:0`。要么使用无内距 wrapper，要么同步收起盒模型占位；对高负载容器同时检查 ResizeObserver 回调是否按真实需要的轴过滤。回归至少取样动画尾段，确认高度连续下降后再进入 `hidden`。

### 66. 同一浮层触发器无法二次收起

- **现象**：Recent activity 和历史菜单第二次点击仍保持打开；随后审计又发现顶栏 Language / Appearance / WattDesk、Home 图表、设备更多操作、Site details 下拉 / Owner actions、Statistics 周期等同类入口也各自缺少统一收起逻辑。
- **根因**：每个打开函数先由 `registerPanel()` 清掉已有面板，再无条件创建新面板；第二次点击实际完成了“关闭后立即重开”。逐个页面手写 `aria-expanded` 判断还会继续遗漏新的锚定浮层。
- **修复**：Popover controller 提供共享 `toggle(anchor, open)`，通过 `openPanels` 中找到当前 anchor 的面板决定收起；所有可点击锚定浮层统一接入。`aria-expanded` 继续由 `registerPanel()` / `close()` 统一维护。
- **预防**：新增可点击锚定浮层时先接 `toggle()`，不要在页面里复制“如果 expanded 就 close，否则 open”。回归至少真实点击同一触发器三次，断言“打开 → 关闭且 `aria-expanded=false` → 再打开”；hover tooltip、`@` 自动选择器和面板内操作不属于这条点击 toggle 契约。

### 67. 背景模糊被多个关键帧切成两段或三段

- **现象**：Add device 弹窗入场时，页面背景先模糊一段，随后像重新开始一样再模糊一次；整体没有合成闪暗，但节奏不连贯。
- **根因**：`wd-modal-backdrop-in` 在 25% / 50% / 75% 分别设置 blur 与 tint 中间值。即使动画总时长相同，每个关键帧边界仍会改变插值速度，三个边界把单次入场切成多个视觉阶段。
- **修复**：删除中间关键帧，只保留 `from / to`，blur 与 tint 共用一条从 0 到终值的时间轴，并使用 `cubic-bezier(.32,.08,.2,1)` 平滑缓出；总时长仍为 `520ms`，窗口与内容时序不变。
- **预防**：需要连续感知的单一属性动画优先使用一条曲线，不要用多个百分比关键帧模拟曲线。回归检查动画 `getKeyframes()` 的 offset 只有 `0 / 1`，并真实采样开场、中段和尾段，确认数值单调且没有重复加速或速度归零。

### 68. 对比页完成后仍把旧版入口留在产品里

- **现象**：为比较新版 Plant Info 曾并列显示 `Site details / Site details 2`。新版最终确认后，旧页签仍占据导航，用户要求隐藏旧页，并把新版名称恢复为 `Site details`。
- **修复**：详情导航收口为 `Overview / Devices / Site details` 三项；可见 Site details 继续使用稳定 `site-v2` 路由，旧 `/site` 仅保留隐藏兼容路由和回归测试，不再显示入口。
- **预防**：临时对比入口必须在最终验收时收口。隐藏页面不删除可恢复实现和数据契约，但所有可见标签、页面标题、路线索引与测试都必须以最终产品名称更新。

### 69. 地图密钥缺失被当成设计失败

- **现象**：Mapbox Static Images API 需要公共 Token；直接把空 Token 拼进 URL 会返回 401，页面看似布局坏了。
- **修复**：地图组件先检查全局变量、本地存储与 meta 配置，缺失时不发请求；加载前地图区域保持空白，加载成功后才显示真实底图，失败时不渲染道路/水域占位图。
- **预防**：第三方地图、分析和鉴权 API 都要区分“未配置、加载中、成功、失败”四种状态；缺失 Token 或失败时不得用自绘假地图冒充真实结果。密钥通过部署配置或 meta 注入，不把示例值、个人 Token 或伪造成功写进仓库和后端声明。

### 71. 地图滤镜存在但被上层清晰图覆盖

- **现象**：给地图图片声明了 `filter:blur()`，用户仍反馈地图是清晰的；计算样式正常，但视觉没有模糊。
- **根因**：模糊层与清晰层同时存在时，清晰层仍在上方或模糊层透明度不足，实际混合结果主要由清晰图决定。
- **修复**：若产品要求模糊地图，必须确保模糊层真正位于清晰层上方，或让清晰层通过对应弧形遮罩工作；不能用仅存在于 CSS 计算值的滤镜代表视觉结果。当前 Site details 2 只请求一个 Mapbox 图片 URL，将同一响应渲染为清晰底层与 `blur(10px)` 上层，并通过 `28deg` 蒙版在 `42%–78%` 做渐进过渡。
- **预防**：地图模糊必须通过截图确认边缘细节确实被模糊；同时检查 DOM 顺序、`z-index`、opacity 和 mask，而不是只断言 `filter` 字符串。

### 72. Mapbox bbox 缺少方括号导致缩放突变

- **现象**：改用“让站点位于右侧焦点中心”的 bbox 后，Mapbox 显示成大区域地图，`13–15` 级街区细节看起来消失。
- **根因**：Static Images 路径中的 bbox 必须使用 `[minLon,minLat,maxLon,maxLat]` 方括号语法；省略方括号后请求按另一套路径语义解析，缩放与预期不一致。
- **修复**：使用方括号 bbox，并固定当前站点 zoom `13`；电站位置仍保持在右侧定位点对应的焦点中心。
- **预防**：生成第三方地图 URL 时同时断言完整路径、bbox 和视觉缩放；不能只验证 HTTP 200。

### 70. 把完整回归当成每次改动的默认验收入口

- **现象**：连续视觉批注期间多次启动 23 个 Playwright 套件的全量 `npm test`，确认耗时过长并打断迭代。
- **根因**：旧规则把共享基础、组件和跨页面改动默认导向完整回归，没有优先使用受影响页面的证据链。
- **修复**：默认验证改为 `npm run check`、相关页面专项、必要的共享消费方专项、构建、截图和 `audit:assets`；`npm test` 仅在用户明确要求时运行。
- **预防**：先判断变更的真实消费方，只验证受影响的页面和共享能力；代码已变化时立即停止旧全量进程，不能用过期结果完成验收。

### 73. `clip-path` 把自身 1px 描边的圆角裁掉

- **现象**：Hero 左右边线可见，但四个圆角没有描边，看起来像描边断开。
- **根因**：元素同时使用 `border`、`overflow:hidden` 和 `clip-path: inset(... round 26px)`；`clip-path` 在绘制边缘再次裁切，正好削掉位于边界上的边框。
- **修复**：移除 Hero 的 `clip-path`，只由 `border-radius + overflow:hidden` 裁切地图与内容。描边保持在圆角内侧，地图仍不会溢出。
- **预防**：已有 `overflow:hidden + border-radius` 时，不要为了“锁圆角”再叠加同尺寸 `clip-path`。验收同时看四条边和四个圆角，并断言 Hero `clipPath:none`。

### 74. Mapbox 主题切换直接改 `src` 会滞后并突然变色

- **现象**：切换深浅主题后页面先完成淡变，地图稍后才突然从深色变成浅色。
- **根因**：主题 MutationObserver 直接覆盖当前图片 `src`，视觉切换取决于新网络请求完成时间，且没有旧图到新图的独立交叉淡变。
- **修复**：深色和浅色各使用独立 map bank；首图完成后空闲预加载另一主题。主题变化时旧图继续显示，新图就绪后用共享 `--wd-motion-theme` 620ms 与 `--wd-ease-theme` 交叉淡变。
- **预防**：网络资源参与主题切换时，必须分离“请求完成”和“视觉提交”；不能把新 URL 直接赋给唯一可见节点。测试需覆盖预加载、旧图保留、双 bank opacity 和最终主题。

### 75. 每次进入页面都重复地图入场

- **现象**：首次进入时地图淡入合理，但切换到 Overview 再返回 Site details 时仍重复播放，造成多余闪烁。
- **修复**：模块级记录当前文档是否已经真正显示过地图。首次显示淡入；同文档返回立即显示；整页刷新重新建立模块状态后才再次淡入。
- **预防**：区分“首次文档入场”和“主题交叉淡变”两种动画。不要用 `sessionStorage` 保存入场状态，否则刷新也不会重播；页面级一次性入场应只存活于当前 JS 文档。

### 76. inline textarea 让标题上浮并多出 4px 灰条

- **现象**：点击 Edit 后标题向上跳约 2px，输入框灰色承托层下方多出一条 4px 灰带。
- **根因**：44px textarea 仍以 inline 元素参与排版，line box 额外产生 4px 基线空间；承托层变为 48px，标题区域重新居中后使文字上移。
- **修复**：textarea 设置 `display:block`，承托层恢复为与输入框相同的 44px。查看态与编辑态使用同一顶部基线，长标题仍自动增高。
- **预防**：标题编辑、单行编辑器和原位替换必须比较查看/编辑的顶部坐标与承托层/输入高度，不能只验证左边对齐；检查截图时同时看文字和输入表面的下缘。

### 77. 单活动 modal 让设置窗内无法使用共享确认弹窗

- **现象**：经济模式删除确认如果直接调用 `createConfirmDialog()`，会把上层设置窗口一起关闭；页面自绘确认层又失去共享的 Depth Reveal、焦点循环和焦点归还。
- **根因**：共享 modal 控制器只保存一个活动弹窗；新弹窗创建时先强制关闭旧弹窗。
- **修复**：`createModalDialog()` 改为活动弹窗栈，子确认层打开时父弹窗临时 inert，关闭后恢复父层并把焦点还给原触发点；页面继续直接使用 `createConfirmDialog()`。
- **预防**：不能在页面复制确认弹窗动效或遮罩。出现“设置窗上再确认”时必须扩展共享 modal 栈，而不是绕过共享组件。

### 78. 共享开关还没开始动画就被页面重绘替换

- **现象**：共享 switch 已声明滑块位移和轨道变色，但设置页点击时仍像瞬切；逐帧采样看不到中间位置或中间颜色。
- **根因**：Inverter settings 在 `onChange` 中立即调用整页局部重绘，旧 switch 及其动画宿主在下一帧前就被移除；组件动画本身没有机会进入时间轴。
- **修复**：立即重建依赖内容，但重绘前缓存当前 switch，随后把同一 DOM 节点重新挂回新行；滑块动画不中断，下方设置区域也不等待动画结束。连续点击会从当前中间位置反向。
- **预防**：共享控件由消费页面重绘时，不能靠延迟业务内容来保住动画；应保留控件节点并在新 DOM 中复用。组件专项看中间帧，消费页面专项同时断言“依赖内容立即变化”和“switch 节点保持同一个”。

### 79. 分段胶囊同样被重绘截断，文字补偿方向又与用户感知相反

- **现象**：Setpoint unit 切换时选中胶囊直接跳到新选项；文字看起来略微上浮。
- **根因**：分段控件的 `onChange` 在动画首帧前触发页面重绘，移动指示层被新建实例替换；同时组件继承了旧的 `-0.5px` 上移光学校正。
- **修复**：Inverter settings 保留并复用同一 segmented-control DOM，让 `600ms` soft-spring 胶囊动画继续；标签偏移改为 `0px`，实测文字盒中心与选项几何中心一致。
- **预防**：任何带移动指示层、滑块或进度层的共享控件都必须检查消费页面是否在首帧替换宿主。字体墨迹校正必须由实际可见结果验证，不能沿用过期的固定像素补偿。

### 80. 条件行直接消失让卡片高度硬跳

- **现象**：Export limit 等开关关闭后，卡片内下一行立即消失，虽然内容更新及时，但卡片高度瞬间收缩，缺少对象关系反馈。
- **根因**：局部重绘直接替换卡片 DOM，没有保留旧高度，也没有为新的高度建立过渡。
- **修复**：以页面、分组标题和首行文本生成稳定卡片 key，重绘前记录高度，重绘后从旧高度动画到新高度，动画期间裁切绘制并在结束后恢复 `height:auto`；版本守卫保证快速反向时旧动画不能清理新动画样式。
- **预防**：同一表面的条件内容增删应动画真实高度或等价布局属性，不能用整卡 opacity 或延迟内容冒充生长。高度动画必须允许中途反向，并最终释放固定高度。

### 81. 为了切换页面重建整栏导航，选中反馈只能硬切

- **现象**：左侧页面已经高亮，但其他选项的选中背景与图标直接跳变；右侧页面也缺少完整的退出与进入反馈。
- **根因**：每次 `go()` 都重建整栏导航，任何背景过渡都从首帧开始；正文与固定标题又被直接替换。
- **修复**：页面切换保留导航 DOM，只同步选中类；选中背景由伪层做 `260ms` 交叉淡变。该条经历过 `80ms` 过早消失、`180ms` 重叠、顺序接力的中间空档，最终改为旧、新同步 `260ms` 互补交叉淡变；旧层保持 `inert`，新页首帧透明并位于旧页上方。
- **预防**：频繁切换的导航不要为了更新 selected 状态重建整组节点。页面切换优先验证纯透明度；位移、缩放或模糊只有在确有必要时才加入。

### 82. 时间浮层只退场玻璃，滚轮内容留在最后一帧

- **现象**：关闭时间选择器时，玻璃背景先淡出，数字滚轮仍保持清晰，直到节点被移除时突然消失。
- **根因**：浮层宿主已经使用共享 Glass Surface 退场，但没有把滚轮内容节点赋给 `panel._wdFade`；共享 motion 只淡出了玻璃 fill / optics。
- **修复**：时间滚轮内容赋给 `_wdFade`，与玻璃面共用同一退出时长、缓动和进度。
- **预防**：自定义 Glass Surface 浮层必须显式声明需要随表面一起退场的内容根节点；不能因为宿主带 `.wd-glass--surface` 就假定所有子内容自动同步。专项要读取两层动画的 currentTime、duration 和中间 opacity。

### 83. 掩码输入强制全选或固定删末位，无法修改中间数字

- **现象**：八位时间掩码虽然能连续输入，但点击后总是全选，退格也只删除最后一位，用户无法直接修正中间小时或分钟。
- **根因**：首次实现把“方便输入”误解为“每次从头输入”，在 focus 时 `select()`，并在 keydown 中写死删除尾部数字。
- **修复**：允许光标定位任意数字；Backspace / Delete 根据光标所在数字索引编辑邻位，遇到固定冒号或横线时映射到相邻数字；输入事件按数字索引恢复光标。
- **预防**：掩码输入必须验证中间插入、选区内替换、中间 Backspace / Delete、分隔符附近操作和错误态恢复。固定标点不能用禁止编辑光标的方式实现。

### 84. 当前规则摘要保留着已推翻的中间态

- **现象**：最终代码已改为 `--` 占位、八位掩码和 `22px` 删除图标，但部分“当前有效”摘要仍残留 `—`、组合按钮、居中时间框和 `18px` 图标。
- **根因**：连续迭代只在文件末尾追加新条目，没有回写最早的总规则行；历史记录与当前规则同时被新对话当作有效约束。
- **修复**：直接更新当前总规则行，合并重复条目；PROJECT-STATUS 中必须保留的旧实现显式标记为“历史中间态，已由上方规则覆盖”。
- **预防**：每次规则归档先搜索旧值、旧组件描述和相反行为；当前有效区只能保留一个最终答案，历史区不得与当前总表并列成同等优先级。

### 85. 同一页面里“看起来相似”的字体实际不是同一 style

- **现象**：`Command timeout` 行和 Currently effective 行都使用 SF Pro 与主文字色，但前者视觉更清晰；后者实际是 `13px / 400`，前者是 `14px / 510`。
- **根因**：只比较了字体家族和颜色，没有比较字号、字重、行高、字距；放大到一致字重后又暴露出旧的 `160px` 标签列无法容纳 `Battery power capability`。
- **修复**：两处统一为同一 computed type style；行高调至 `36px`、列距 `14px`，标签列扩到 `170px`，卡片上下内距调到 `12px`，再检查最长标签不截断。
- **预防**：视觉“统一字体”必须比较 family、size、weight、line-height、letter-spacing 和颜色六项，并在独立页面上用最长文案做 overflow 断言；不能通过缩小字号掩盖列宽不足。

### 86. 设置页命令动作继续复制私有按钮，异步文案还会删除玻璃层

- **现象**：CT Detection 的 `Run check` 与维护页动作仍使用页面私有胶囊；Parameter Export 点击后按钮外观可能突然失去玻璃，只剩普通文字。
- **根因**：页面绕开 `createStandardButton()` 自行维护按钮样式；繁忙态又直接重写整个 `button.textContent`，把共享 `.wd-glass-material` 子节点一并删除。
- **修复**：所有普通命令动作先生成标准按钮槽，再在 `hydratePage()` 中替换为共享按钮并挂载 Glass Surface；主/中断/破坏/次操作分别传 `primary / warning / danger / neutral`。`Power off`、`Restart` 使用 warning，只有 `Reset all settings` 使用 danger。异步文案仅更新 `.wd-control-label` 和 `aria-label`。
- **预防**：共享按钮的尺寸、颜色和禁用态只能由组件层决定；页面不得恢复 `.isw-inline-button`。任何按钮状态文案都要验证更新后 `.wd-glass-material` 仍为 1 个，且按钮高度与右缘不漂移。

### 87. 多参数日志被压成单行，时间和操作人各用一套页面私有格式

- **现象**：Operation Log 的时间、变更和操作人分别使用 11px / 12px 与手写日期字符串；一次提交多个参数只能挤在一行，账户邮箱没有承载入口。
- **根因**：日志数据把每次操作建模为单一 `p/a/b/w` 字符串，表格直接拼文本；时间没有经过共享格式化组件，操作人也只是不可交互文本。
- **修复**：日志记录改为 `minutesAgo + operator + changes[]`。时间由 `createTimeLabel()` 生成语义 `<time>`，操作人通过共享 Glass hover/focus 浮层显示邮箱；浮层使用内容宽度、以账户名为中心，邮箱按钮可复制；浮层内部 burn 阴影清为透明，并以更高特异性覆盖通用 `.popover > button:hover` 的背景和圆角；每个 change 独立成行并允许 `overflow-wrap:anywhere`。
- **预防**：审计/操作日志不得页面内自写相对时间；多参数记录必须用数组而不是拼接字符串。专项需断言所有行文字字号一致、至少一条多行记录、长行无横向溢出，以及 7 天内 / 后的时间分支。

### 88. 同一组曲线点表仍使用旧表头和自动宽度字段

- **现象**：Reactive Power 的 Q(U) / cos φ(P) / Q(P) / cos φ(U) 点表仍使用较重表头，输入胶囊宽度随单位和内容变化，表头与字段中心没有稳定对齐。
- **根因**：四个模式各自渲染 `.isw-table--narrow`，没有共享的点表变体；表格行沿用基础 `36px` 节奏，数字继续使用 mini 字段的自动宽度。
- **修复**：四表统一 `.isw-point-table` 与 `.isw-quiet-table-head`，采用 `12/400` 表头、`48px + 6px` 行节奏、`13/18` Point 标签、`112 × 36px` 居中字段，并将右侧表头居中到字段列。
- **预防**：同构曲线参数表必须先抽共享表体样式，再逐个填充业务字段；专项同时比较表头类型、行高/内距、字段尺寸和字段/表头中心线。

### 89. 组件字体各自声明，视觉看似一致但角色和回退规则持续漂移

- **现象**：标题、元信息、表头、说明和字段散落大量直接字号/行高；同一语义在不同页面使用 `font-size:12px`、`line-height:16/18px` 或不同 token 组合，容易在后续修改中分叉。普通表头还残留 `11 / 590` 的旧分支。
- **根因**：只有基础 type token，没有 Inverter settings 自己的语义角色层；页面直接引用底层 size/weight/leading，导致“同义不同写”。
- **修复**：在 `.inverter-settings-window` 集中定义 `--isw-type-title-* / row-* / caption-* / reading-leading / field-*`，组件按角色取字体；普通设置表头统一 `12/400/16`。可编辑 Select 与数字/百分比/时间字段最终统一 `13/510/18`，不再误用行标题的 `14/510/20`。新增运行时审计，扫描主页面、Grid 子页、门禁和浮层，约束 SF Pro、允许字号与 `400/510/590` 字重。
- **预防**：新增设置组件先选择语义角色，不得直接新增 font-family 或随手写字号。审计要覆盖折叠项、弹层、下拉菜单和确认框，不能只检查当前可见页面的标题。

### 90. 卡片标题放在玻璃卡面内部，无法复用页面分组层级

- **现象**：Economic Schedule 的 `24h Overview` 留在第一张卡里，第二张排程卡没有对应外部标题，与其他设置页“分组标题在卡外、卡片承载内容”的结构不一致。
- **根因**：卡片按一次性视觉稿实现，标题被视为卡片装饰而不是页面信息层级。
- **修复**：`24h Overview` 与 `Schedule periods` 都改为卡外 `.isw-group-title`；标题距卡 `7px`，两组之间 `20px`，卡内只保留时间轴、图例、列头、行和新增操作。
- **预防**：所有设置卡先区分 group title 与 card content；标题不得依赖卡片 padding、圆角或内部居中规则。

### 91. 门禁位于页面交叉淡变之外，切换锁页时仍然瞬切

- **现象**：普通页面切换有 `260ms` 渐入渐出，但进入 Grid & Protection 时锁卡片直接出现；离开锁页或解锁时也会突然消失。
- **根因**：门禁是 `.isw-content-pane` 下独立于 `.isw-page` 的覆盖层，`renderPage()` 只动画正文和标题，`syncGate()` 随后直接修改 `hidden`，没有进入共享时间线。
- **修复**：门禁增加独立但同参数的 opacity 动画；进入从透明渐入，离开/解锁渐出，退场立即 `inert`，动画结束后才隐藏。快速切回会从当前 opacity 续接。
- **预防**：页面中所有覆盖正文的门禁、空态或二级层都必须检查是否绕过了 `renderPage()` 的共享转场；测试必须比较它与 incoming/outgoing page 的实际 duration/easing，而不是只断言元素最终可见。

## 五、开工前检查清单

- 先读 `AGENTS.md` → `DESIGN-SYSTEM.md` → `docs/PROJECT-STATUS.md`。
- 涉及顶栏标签，再读 `docs/TOP-BAR-TABS.md`；涉及既往纠正，再读 `docs/USER-REQUIREMENTS.md`。
- 先用一句话复述用户的操作路径和期望结果，特别是“同一位置连续操作”“当前标签内切换”这类语义。
- 在真实浏览器复现，不用只读 CSS 或只看静态截图代替。
- 检查初始状态、默认、hover、focus、选中、禁用/加载（适用时）、深色、浅色、减少动态效果。
- 检查阴影/浮层是否被裁切；检查关闭按钮是否有异常描边。
- 检查 SVG 原始透明度与遮罩源，不只检查 `color`。
- 涉及历史浮窗、最近访问或搜索结果图标时，直接复用侧栏同路由节点，并逐路由比对 tone / `src` / mask，不新增色调映射表。
- 涉及圆角时记录所有原半径，只改曲率，不改数值、尺寸或布局。
- 检查周期按钮的实测宽度、是否裁切文字，以及刷新右缘是否仍与图表卡片对齐。
- 检查账户名称、头像和双箭头的默认色，以及 hover / 键盘 focus 是否同时切换。
- 主题切换必须让未选中、未 hover 的图标也保持自然过渡，不能只验选中态；暂停中间帧读 computed 颜色。
- 涉及玻璃浮层时，同时量宿主与材质层的包围盒；两者尺寸不一致时先查定位包含块。
- 涉及锚定浮层时，先滚动真实工作区再量浮窗与触发元素的间距、边对齐和滚出视口行为；不能只看打开瞬间的位置。
- 涉及快捷键或导出组替换时，量实际键帽宽度与右缘间距，并检查字体族与背景是否来自共享样式。
- 涉及搜索、列表或提示按钮时，实际点击并断言选中项移动、打开与关闭；不能只确认元素和文案存在。
- 涉及统计小多图时，断言各图首标记的 delay 差、图表 duration、数据点数和 Reduced Motion；不得只看截图是否出现。
- 涉及 Combined / 图表铺满时，检查 SVG `preserveAspectRatio`、轴标签覆盖层和左右内容边界；非等比拉伸不能作用于文字。
- 涉及图表浮窗时，检查放大字号后的标题、图例、绘图区、扇区与外置标签覆盖关系，并移除重复的静态峰值标签。
- 涉及新增/关闭，逐项验证 Add、邻居、指针落点和滚动位置连续。
- 涉及折叠高度动画，检查容器 padding、border、margin、min-height 是否在结尾仍有占位；采样尾段高度必须连续到 `0`，相关 ResizeObserver 不得因纵向变化重复写布局。
- 页面根节点新增 token 覆盖时，检查工具栏、搜索框、按钮等共享控件是否被意外继承；可读性覆盖必须收窄到内容容器。
- 阴影被裁切时先检查真实祖先 `overflow` 和后续兄弟绘制顺序；不要用继续减淡阴影掩盖层叠问题。
- 页头图标+文字动作使用 `createPageHeaderAction()`；除页头轻量动作外的常规按钮仍使用 36px 标准按钮。
- Inverter settings 的命令按钮必须检查共享 `primary / warning / danger / neutral` 分类、`.wd-glass-material`、36px 高度与右缘；Operation Control 同时检查统一宽度，切换 busy 文案后再次确认玻璃子节点未丢失。
- 操作日志需检查共享时间节点、统一字号、账户邮箱浮窗的内容宽度/居中/复制行为、多参数逐行和长文本换行；不得手写 `today` 或页面私有相对时间。
- 所有相对 / 绝对时间展示使用 `foundations/time.js`，并运行 `node tests/verify-time.cjs`。
- 共享改动跑 `npm run check` 与受影响的页面专项；视觉共享改动提供截图。完整 `npm test` 仅在用户明确要求时运行。
- 完成后更新 `docs/PROJECT-STATUS.md`、相关规范和用户要求记录，再生成追加存档。
