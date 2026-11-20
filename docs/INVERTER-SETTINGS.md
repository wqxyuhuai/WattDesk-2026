# Inverter settings 唯一页面契约

更新：2026-11-20

本文是 Inverter settings 的有效规则入口。页面视觉、交互、状态、组件选择和
防回归要求只在这里维护；其他文档如出现更旧的实现细节，以本文、当前运行代码
和专项测试为准。文案改前/改后见
[COPY-AUDIT.md](../design-preview/src/pages/inverter-settings/COPY-AUDIT.md)，
功能对照与未决事项见
[FUNCTIONAL-AUDIT.md](../design-preview/src/pages/inverter-settings/FUNCTIONAL-AUDIT.md)，
来源哈希见
[SOURCE-MANIFEST.md](../design-preview/src/pages/inverter-settings/SOURCE-MANIFEST.md)。

## 目标与优先级

- 功能基线：
  `E:\OneDrive\Design files sync\AI\Proj. WattDesk\资料\逆变器设置更新 261119`。
- 最终交互原型和用户明确修订优先于早期规划；不得迁就不完整或滞后的在线页面。
- 当前任务是渐进式标准化，不重做页面。没有用户要求的页面结构、文案、数据或
  硬件能力不得擅自增加。
- 改动必须保持现有视觉和交互。Figma 原稿明确写死的尺寸、光学值和几何可以
  保留，不为“统一”强行改写。
- 真实后端、账户、权限、持久化、设备写入和文件导出尚未接入时，必须继续显示
  为本地预览能力，不能伪造成功结果。

## 入口与范围

- 入口：Devices 逆变器行中的 `Open <device> settings`。
- 路由：
  `/plants/:plantId/devices/inverter-settings?device=inverter&serial=<SN>`。
- 独立预览：
  `/plants/:plantId/devices/inverter-settings?device=inverter&standalone=1`。
  它只隐藏 WattDesk 外壳、其他页面入口和关闭 X，仍复用同一页面模块、数据和
  交互；设置页更新后无需维护第二份预览页面。
- 页面以 route-backed 设置窗口呈现，刷新、复制链接、浏览器前进/后退有效。
- 主页面共 15 个：Running Mode、Economic Schedule、Battery、
  Active Power Dispatch、Import & Export Limits、Output Capability、DI Port、
  Grid & Protection、Networking、Device Features、MPPT & Strings、
  CT Detection、Operation Control、Parameter Export、Operation Log。
- Grid & Protection 共 8 个二级页：Grid Code、Protection Limits、
  Grid Connection、Reactive Power、P(U) Characteristics、
  Frequency-Watt (F-P)、LVRT、HVRT。
- Grid 参数缺失表示该 profile 不提供该功能，不得渲染成 0 或禁用字段。
- 18 个国别档案的 key、顺序和值以原型内嵌数据为准；有参数档案可选择，路线图
  档案只显示 Grid Code 且不可选择。

## 组件唯一入口

先找完全匹配的共享组件；没有时给共享组件增加受测变体；只有数据契约或交互
确有页面差异时才允许页面局部实现。样式相同、职责相同的代码不得复制。

| 类别 | 唯一入口 | 页面职责 |
|---|---|---|
| 颜色与主题 | `foundations/colors.css`、`tokens.css` | 使用 `--wd-label-*`、`--wd-bg-*`、`--wd-fill-*`、`--wd-accent-*`；同时检查深浅主题 |
| 字体 | `foundations/type.css`、`typography.js` 与 `.inverter-settings-window` 的 `--isw-type-*` | 通过语义角色选字号、字重、行高，不按字号猜 style |
| 玻璃 | `components/glass-material.js/.css` | 通过 `createGlassMaterial()` / `addSurface()` 挂载；页面不写材质参数 |
| 普通按钮 | `createStandardButton()`、`button.css` | 只传 label、variant、icon 和业务回调；异步文案只改 `.wd-control-label` 与 `aria-label` |
| 开关 | `createToggleSwitch()` | 二值设置专用；重绘保留同一 DOM，业务值和依赖内容立即更新 |
| 分段选择 | `createSegmentedControl()` | 少量互斥选项；键盘、移动胶囊、ResizeObserver 和中断续接由组件负责 |
| 下拉选择 | `createSelectControl()` | 优先 `variant:"adaptive"`；页面只传选项、菜单宽度和回调 |
| 浮层菜单 | `popover.js`、`menu-popover.js`、`menuEndAlign()` | 统一锚定、开合、玻璃、右侧偏移和关闭逻辑 |
| 编辑字段 | `.wd-edit-field`、`.isw-number`、`.isw-mini-number` | 字段尺寸和业务范围由页面声明，表面与状态层级由共享规则控制 |
| 滚动 | `createScrollFeedback()`、`createBottomScrollGuard()` | 使用真实 content 节点；不添加原生滚动条或页面私有滑块 |
| 时间 | `foundations/time.js`、`createTimeLabel()` | 相对时间、绝对时间、`<time datetime>` 和 `title` 共用 |
| 图标 | `components/icons.js`、`SETTINGS_ICON_FILES` | 使用共享注册表和原始形状；运行色必须走语义色 |
| 弹窗/确认 | `createModalDialog()`、`createConfirmDialog()` | 复用 Depth Reveal 和 modal stack；禁止原生 confirm/alert/prompt |
| 卡片 | `cards.css` 与页面表面变量 | 静态卡片不玻璃化；输入框、按钮、普通行不升级成卡片 |
| 选项数据 | `settings-options.js` | 预览枚举集中维护；渲染和日志格式化共用同一份数据 |

### 颜色、字体与效果的标准化边界

- Figma 已绑定的颜色走双主题语义 token，不按十六进制猜另一主题。
- 页面字体只使用现有完整 typography style 或 `--isw-type-*` 语义角色。
- Glass Surface、阴影、hover、按压和连续圆角使用共享实现。
- 原稿写死的光学微调、特殊几何、图表坐标和局部布局不强行抽象成 token。
- 页面不得新增第二套色板、字体族、玻璃、卡片、按钮、下拉或滚动条。

### 是否升级为全站标准

| 判断 | 内容 |
|---|---|
| 全站标准 | 语义颜色与双主题、完整 typography style、Glass Surface、标准按钮、搜索、编辑字段、toggle、segmented、select、popover、时间、滚动反馈、Depth Reveal、连续圆角、实心图标和不使用原生对话框 |
| 页面契约 | 上下状态窗/设置窗几何、`288px` 导航、`640px / 560px` 内容列、Grid 门禁与二级栏、保存作用域、Operation Log、Economic Schedule、设备点位范围和文案 |
| 暂不抽象 | Figma 原稿写死的光学补偿、状态窗局部间距、图表坐标、特殊容器尺寸和只出现一次的页面布局 |
| 防回归 | 共享层变化验证全部消费方；页面改动验证 Inverter 专项；上述页面契约项逐条保留在 `verify-inverter-settings.cjs` |

Inverter 的业务枚举只属于该页面，放在 `settings-options.js`，不升级为全站枚举。
只有同一枚举被第二个真实页面消费时，才评估迁入共享业务字典。

## 页面布局

- 桌面堆叠宽至 `1220px`，高至 `860px`；使用共享 Depth Reveal 背景。
- 上方状态窗宽为 `calc(100% - 72px)`，只有顶部两角圆角；下方设置窗全宽、
  四角常规圆角。两者边对边贴紧，无重叠或可见缝隙。
- 两个窗口使用完全相同共享 Glass Surface，浅色模式也不得给上层加白色或近
  不透明 fill。
- 上方状态窗展示设备身份、实际并网点功率和一条限幅说明。不能重复数值，也不
  能把本地计算描述成实时遥测。
- 上方状态窗左右内容线等于顶部 `30px` 圆角；身份行上下 `10px`，结果和指标区
  上 `7px` / 下 `6px`，标签到值 `2px`，功率到蓝色说明 `8px`。
- 上方状态文字使用 `12 / 14 / 18px`；主文字使用 `70%` 主色混合；连接绿点
  `1800ms` 呼吸，减少动态效果时冻结。
- 下方窗口标题行右上 X 距顶部、右侧均为 `20px`。遮罩点击和 Escape 不关闭。
- 左侧导航宽 `288px`、透明、延伸到底部、独立滚动且无右侧分割线。分组标题与
  行复用共享 sidebar 组件；行 label `13/510/18`，trailing value `12/400`，
  两者至少留 `4px`。
- 右侧内容区使用 `.wd-main-panel`，距右侧和底部 `12px`，内圆角 `18px`，
  与外窗 `30px` 圆角同心。内容区在共享主面板上叠加 `2.5%` 黑色 tint。
- 主页面默认内容列 `640px`；Grid 子页 `560px`。Device Features 三张卡使用
  普通 full-width `.isw-panel`，不得带窄版类。
- 卡片圆角和左右内容线统一使用 `--isw-card-inset: 24px`；卡片间距使用
  `--isw-card-gap: 30px`；卡片到 `.isw-note` 使用 `--isw-note-gap: 10px`。
- 固定标题层 `.isw-title-layer` 位于滚动和回弹节点之外。滚动与上下回弹只移动
  正文，标题、blur 和 `1px` 规则保持屏幕坐标。
- 上下窗层叠阴影写在非玻璃 `.isw-main-shell`：接触线
  `0 -1px 0 rgba(0,0,0,.06)`，衰减 `0 -10px 28px -10px`；浅色 `22%` 黑、
  深色 `34%` 黑。

## 页面表面、字体和输入

- 字体语义角色：标题 `18/590/24`，行标题与值 `14/510/18`，导航项
  `13/510/18`，说明与单元格阅读文字 `12/400/18`，短标签与表头
  `12/400/16`，Point 标签 `13/400/18`，可编辑字段 `13/510/18`，按钮
  `13/510/18`。
- 深色面板与卡片保留共享 `1px` 中性内描边和 `0 0 4px` 外投影几何，外投影
  alpha 为 `.35`；浅色保持共享轻阴影。不得由单个卡片恢复更重深色阴影。
- `.isw-number` / `.isw-mini-number`：完整字段 `128px × 36px`、`18px` 圆角；
  mini 保持内容宽。默认描边 `10%`；深色 hover `15% / 26%`，浅色 hover
  `6% / 16%`；深色 focus `20% / 46%` + `18%` 外环，浅色 focus
  `12% / 32%` + `12%` 外环。
- 数字投影始终用黑色：深色 `.2 / .3 / .36`，浅色 `.08 / .14 / .16`；
  过渡使用共享 `380ms` disclosure 节奏，不出现蓝色焦点框或白色光晕。
- 数字字段和单位共用字体、字号、字重、行高和字距；单位只变次级色。数值弹性
  占宽，单位按内容宽，间距 `6px`，右侧安全内距 `12px`，不显示原生步进器。
- 所有数字输入必须有行列上下文和单位组成的可访问名称；有说明时关联
  `aria-describedby`。
- 数值范围由 `settings-validation.js` 集中提供 preview fallback。生产必须由
  后端 meta 提供 `label / unit / min / max / step / enumList`。
- 非法值保留原输入，数值、单位和描边转红并带淡红底；深浅主题的默认、hover、
  focus 和输入中状态都保持错误色。修正后立即清除，变化使用 `280ms`
  content-grow。
- 纯只读行使用 `.isw-row--readonly-data`，纯只读表使用
  `.isw-table--readonly-data`；标签用 Labels/Secondary，值用
  Labels/Primary。CT `Correct` 用 success，`Reversed` 用 warning。

## 页面级行为

### Running Mode 与 Battery

- Running Mode 首次从设备当前模式初始化；只有保存 Running Mode 页才更新
  `device.mode`，其他页面 Save 不得改写。
- 选项：`General Mode / Peak Load Shifting Mode / Economic Mode / UPS Mode /
  ToU mode / Off-Grid Mode`。
- 模式卡切换使用共享 `320ms` panel motion；高度可中断续接，说明只改变
  opacity，不叠加位移。
- Battery 保留 charge cut-off、grid-tied floor、off-grid floor 和范围可视化。

### Economic Schedule

- 使用 `640px` 内容列；`24h Overview` 和 `Schedule periods` 标题在卡外，
  标题到卡 `7px`；Overview 上内距 `28px`、下内距 `18px`。
- Charge 绿、Discharge 橙、未覆盖时段灰 General Mode；轨道 `6px`，只保留中部
  刻度点。
- 时间字段使用单一八位数字掩码：自动形成 `HH:MM – HH:MM`，空位 `_`，固定
  标点不参与编辑；支持光标定位到任意数字。
- 非法时间保留输入和红色错误状态，焦点离开字段才提交；重叠、格式和范围校验
  共用一条逻辑。
- Mode 使用 `createSelectControl({variant:"adaptive"})`，其菜单宽 `280px`，
  使用 `Charge by PV Only`，并完整显示 `Charge by PV and Grid`。
- 空草稿显示 `--`、`-- %`、`-- kW`；只有 `--` 用 Labels/Quaternary，单位
  保持正常文字色。未完成草稿阻止 Save。
- 行尾菜单使用共享 36px 玻璃圆钮、`menuEndAlign(button,30)`；删除确认使用
  共享确认弹窗，删除项保持红色语义和 `11%` 红色 hover 底。

### Power、limits 与 dispatch

- 保留 `%Pn` / kW 转换、setpoint、`Command timeout` 和 Currently effective
  链。
- `Command timeout = 0` 合法，表示不超时。
- Effective chain 与同页 Command timeout 使用
  `14/510/18`、`-0.14px`；五行 `36px`，列距 `14px`，标签列至少 `170px`。
- Export/Import 术语固定为 `Import & Export Limits`、`Export limit`、
  `Import limit`，不再使用 `Feed-in`。
- Output Capability 保留 Rated / Overload / Underload；DI Port 保留
  Off / DRM / RCR。

### Grid & Protection

- 首次访问由 Devices 同一设备的 4 位 `Check code` 解锁；解锁仅在当前设置
  窗口会话有效。预览显示 `Prototype Check code: <device code>`。
- 解锁前二级栏完全隐藏，门禁占满内容区；解锁后显示
  `208px + minmax(0,1fr)`。首次进入 Grid Code，之后恢复上次二级页。
- 二级栏顶部和左右内距 `18px`，行内水平内距 `12px`；最长标签
  `Frequency-Watt (F-P)` 不换行；hover / selected 为半圆胶囊。
- 所有 Grid 子页卡片使用 `560px` 列；标题层与卡片外框同宽、同左缘，标题文字
  内收 `24px`。
- 选择标记复用 Running Mode 的 `18px` check-circle / 空心圆。偏差状态只显示
  计数与说明，任何控件都不画橙色行首竖条。
- Protection Limits 使用安静 `12/400` 表头；行高至少 `48px`、上下 `6px`，
  mini 数值框最大 `112px` 并居中；前两列 `140px / 54px`。
- Reactive Power 控制模式七项固定为
  `Off / Fixed Q / Fixed cos φ / Q(U) / cos φ(P) / Q(P) / cos φ(U)`，
  使用 Adaptive Select，菜单 `220px`。
- Q(U)、cos φ(P)、Q(P)、cos φ(U) 点表统一使用 `.isw-point-table`：
  表头 `12/400`，行高至少 `48px`、上下 `6px`，Point 标签 `13/18`，
  数值字段 `112 × 36px` 且居中。
- LVRT/HVRT 的 ride-through 选项固定为
  `Zero current / Reactive priority / Active priority`，同样使用 Adaptive
  Select。
- 门禁卡片是静态共享 Glass Surface，外圆角 `30px`、码格 `12px`、Continue
  `18px`。Continue 使用共享 primary 按钮，保持整行宽和 `38px` 高。
- 解锁时二级栏展开会改变内容宽度；门禁卡在退场期间补偿到解锁前屏幕中心，
  动画结束立即清理临时 transform。

### System 与 maintenance

- Networking 四行统一 `46px`；标签和值使用 `14/510/18`，标签
  Labels/Secondary、值 Labels/Primary。网络值可复制，hover / focus 才显示
  下划线，通过页面级 toast 反馈。
- MPPT 标签固定为 `MPPT Input`、`MPPT #1–#4`、
  `Parallel MPPT Operation`。Scan interval 是共享 Adaptive Select，选项为
  `5 mins / 15 mins / 30 mins / 1 h`。
- Last scan 与 Last check 使用 `createTimeLabel()`，禁止硬编码相对时间。

### Maintenance actions 与 Operation Log

- 普通命令按钮全部使用 `createStandardButton()` 并挂共享 Glass Surface。
  `Run check`、`Export`、可执行的 `Power on` 为 primary；`Power off`、
  `Restart` 为 warning；`Reset all settings` 为 danger；`Clear faults`、
  `Reload …` 为 neutral。Operation Control 命令按钮统一 `144px` 宽。
- warning / danger 默认保留橙红 / 红色文字，hover / focus 渐入同 hue 叠加层
  并转白；分别用于中断性与破坏性操作。
- Operation Log 表头 `12/400`，行内统一 `12px`；列宽
  `112px / minmax(0,1fr) / 112px`。
- 普通页面 Save 生成一条日志，本次所有变化字段各占一行并显示 before/after；
  未变化字段不记录。Grid Code 切档和 Reload 已有即时日志，不重复。
- 操作人必须显示账户名并通过共享 Glass 浮窗暴露可复制邮箱。生产日志必须
  关联已认证账户和 Check code 验证记录；Check code 只标识设备。

## 保存、切换与关闭

- 底部操作层与右侧内容区同宽，只有 Gaussian blur，不是 Glass Surface；顶部
  `1px` 低对比线仅在当前页 dirty 时淡入。
- Cancel / Save 桌面均 `100px`、共享 36px 高、间距 `8px`、居中；`≤680px`
  等分可用宽度。
- Save 只提交当前主页面或当前 Grid 二级页，并更新该页基线；Cancel 只回滚
  当前页并保留页面和滚动位置。
- Grid Code 的作用域是 profile 标识与认证基线；其余 Grid 子页只负责自己的
  表格、曲线和开关字段。
- 当前页 dirty 时切换主页面或 Grid 二级页，先使用
  `createConfirmDialog()` 显示 `Keep Editing / Discard Changes`；Discard
  点击当下恢复基线并启动页面转场，确认层与转场并行退场。
- 只有 X 可关闭设置页。X 检查全局 dirty；有修改时复用共享确认层。关闭需等待
  共享 `420ms` Depth Reveal 完成后再切回 Devices。
- Save 成功与失败均使用页面级 toast；不要偏移到右侧设置区。

## 滚动、页面转场与动效

- 左右滚动都使用 `createScrollFeedback({visibility:"hover",elastic:true})`，
  传入真实内容节点。轨道上下各留 `12px`；导航轨道右距 `2px`，内容轨道右距
  `4px` 且止于操作层上方。
- 导航滚动后启用 `24px` 纯 alpha 顶部渐隐；回到顶部立即移除，窄屏横向导航
  关闭该遮罩。
- 本地设置刷新保留导航 DOM、页面滚动位置和等效控件焦点；不得重播页面入场。
- 页面切换保留导航 DOM，选中层 `260ms` 交叉淡变。旧/新正文和标题 label 同步
  `260ms` 互补交叉淡变；旧页作为固定 rect 的 `inert` 快照，标题层自身不改变
  opacity / filter。
- 快速二次切换从当前可见透明度续接；旧层在结束到移除之间保持零透明度。
- 开关切换：thumb `600ms` soft-spring，track 颜色 `480ms` WAAPI；同值同步
  不取消动画，依赖内容立即更新。
- 分段切换：胶囊 `600ms` soft-spring，连续点击必须先捕获当前视觉位置后取消
  旧动画；ResizeObserver 也从中点续接。
- 开关控制的同卡条件行立即进入布局，卡片使用 `280ms` content-grow 动画；
  结束后恢复 `height:auto`。
- 位于底部时内容缩短使用共享 bottom-scroll guard；内容增长不触发上移。
- `prefers-reduced-motion` 下由共享层直接切换到终态。

## 可访问性与响应式

- 所有交互使用真实 button、原生 input 或正确 ARIA 状态；键盘可完成选择、
  取消、关闭和确认。
- 小视觉目标可扩大透明命中区：Power limit info `28px`，时间箭头
  `32 × 36px`，复制值和日志账户至少 `28px` 高。
- `≤900px` 上方指标区使用三列；`≤680px` 导航和底部按钮收缩、导航顶部渐隐
  关闭。窄屏不得产生整页横向滚动。
- 所有 checkbox/switch/select 不在视觉上禁用但仍接收事件；禁用状态必须同步
  `disabled` 或 `aria-disabled`。

## 预览边界与未决事项

以下事项未获业务确认前保持现状：

- Economic Schedule 默认功率：原型为 10 kW Charge / 15 kW Discharge，当前
  预览为百分比默认值；需确认最终默认。
- 后端点位元数据尚未接入；`settings-validation.js` 范围只是 fallback。
- 认证账户、服务端保存、持久化审计、权限和跨会话状态未接入。
- Parameter Export 尚未生成真实文件；Power、Restart、Reset、CT check 等仍是
  本地演示命令。
- 受保护导出、DI、输出控制的生产权限范围待定。
- 在线产品名称、页面结构和 Grid 档案仍与本地原型有差异；未获确认前不得按线上
  页面覆盖功能基线。
- 来源包中 DE、SE、CZ、PL、BE 等 profile 的固件/认证冲突保持原样，等待产品
  或固件方结论。

## 修改与验证流程

1. 先读本文、[用户要求记录](./USER-REQUIREMENTS.md) 和
   [经验清单](./LESSONS-LEARNED.md)。
2. 先定位共享组件；检查所有消费方、深浅主题、减少动态效果和响应式。
3. 页面只实现业务数据和布局，不复制共享视觉或动画。
4. 文案改变先写 `COPY-AUDIT.md`；功能差异或待决项写
   `FUNCTIONAL-AUDIT.md`；可复用的失败模式写 `LESSONS-LEARNED.md`。
5. 局部改动至少运行：

```powershell
npm run check
npm run test:file -- tests/verify-inverter-settings.cjs
npm run audit:assets
git diff --check
```

涉及共享组件时，再运行该组件的使用方专项；准备合并或用户明确要求时才运行
全量 `npm test` 和公开构建。

## 防回归检查

- 15 个主页面和所有可用 Grid 子页均能渲染；18 个 profile 的 key、顺序和值
  不变。
- 首开模式来自设备；非 Running Mode 保存不反向改写设备模式。
- timeout `0`、功率因数 `-1–1`、Check code 四位和普通 Save 日志仍有效。
- dirty、Cancel、Save 和切页确认严格按页面作用域工作。
- Grid 门禁未解锁时不泄漏二级栏；解锁后位置、滚动记忆和 Check code 关联不变。
- switch、segmented、select 和条件卡在局部重绘后保留动画宿主。
- 页面切换无回弹、无横移、无中间空洞、无旧页重新可见、无标题 blur 丢失。
- 滚动、hover、focus、错误态和禁用态在深浅主题一致；没有原生滚动条。
- `settings-options.js` 与日志标签共用同一枚举源；新枚举不得重新散落页面。
- 不新增浏览器原生 confirm/alert/prompt，不伪造后端保存、设备动作或导出结果。
