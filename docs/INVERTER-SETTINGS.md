# Inverter settings 唯一页面契约

更新：2026-11-24

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
  `E:\OneDrive\Design files sync\AI\Proj. WattDesk\资料\逆变器设置更新 261119`，
  加上 `...\逆变器设置更新 261120` 的增量原型和更新说明；1120 只新增
  `Limit basis`，没有替换其余 1119 页面、档案或说明。
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
- 对外简洁入口为 `https://inverter.carlwang.cn/`，内部规范路径为 `/settings`。
  该域名使用单独 Worker 代理，只允许 `/settings`、`/src/*` 和
  `/home-assets/*`；其他 WattDesk 路径返回 404。
- `/settings` 固定打开本地样例电站 `p25` 的第一台逆变器；它不读取登录账户、
  真实电站列表或生产设备数据，不是生产权限入口。
- `/` 只能 302 到 `/settings`。不得重新增加 `wattdesk-preview` 长链接分享入口、
  `/inverter` 别名或 `www.carlwang.cn/inverter` 备用路由；这些旧入口已由用户
  明确删除。
- 独立预览只隐藏 WattDesk 外壳、其他页面入口和关闭 X，仍复用同一页面模块、
  数据和交互；设置页更新后无需维护第二份预览页面。页面底部固定提供主题切换
  按钮并上移到离视口底边 `32px`；每个新标签首次打开都默认浅色，不再继承主站
  的深色偏好，切换后的选择只保留在当前标签页会话内。
- 独立 Worker 源码为 `design-preview/deploy/inverter-preview-worker.js`，
  Wrangler 配置为 `design-preview/wrangler.inverter-preview.jsonc`。主站内容
  更新后代理会自动读取最新页面；只有代理允许路径、域名或 Worker 逻辑变化时才
  需要重新部署独立 Worker。
- 页面以 route-backed 设置窗口呈现，刷新、复制链接、浏览器前进/后退有效。
- 主页面共 17 个：Running Mode、Economic Schedule、ToU Mode（Manual）、
  ToU Mode（Dynamic）、Battery、
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
  同一分组标题下如果直接连续出现多张卡片，卡片之间的间距减半为 `15px`；
  这是全设置页统一规则，不得只为 SOC 写页面私有例外。
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
- Battery 页面顺序固定为 `Battery configuration → State of charge →
  Battery heating`。并联能力决定后续所有电池设置的显示范围，因此拓扑和输入
  配置必须先于 SOC 与加热；不得把并联开关放在下方，导致用户先编辑两套值再
  切换成一体的数据。
- 单路硬件始终使用 `battery.common` 一套设置。双路硬件支持并联且开启时也使用
  `battery.common`；关闭并联后切换为独立的 `battery.bank1 / battery.bank2`，
  电池品牌、最大充/放电电流和两路加热必须同时拆分。SOC 是例外：不论单路、
  并联还是双路分置，都只使用一套共享 `battery.soc`，不得跟随电池输入拆分。
- 双路硬件不支持并联时不显示并联开关，直接显示 Battery #1 / #2 两套设置；
  不能仅按机型名称推断能力。当前 `p25` 本地预览使用双路且支持并联的夹具。
- `Parallel Battery Operation` 使用共享 `createToggleSwitch()`。切换后保留同一
  页面与所选值，立即重排依赖卡片；切回原拓扑且数值未变时不得残留 dirty。
- 并联运行时必须读取“主通讯电池”点位：值为有效电池路时，后续点位实际读写
  都路由到该主通讯电池，但页面仍显示当前的一套 Battery 配置。点位缺失、无效
  或无法判定时，在并行卡内、开关下方显示警告：
  `Battery Parallel Mode is enabled. The system cannot detect which battery string is active. Please verify the battery power and communication cable connections to ensure proper configuration.`
  该警告只在“双路 + 支持并联 + 并联已开启 + 主通讯电池未知”时出现；关闭并联
  或主通讯电池识别正常时不显示。异常时同时隐藏该卡内的 Battery Brand、
  Max. Charge Current、Max. Discharge Current，只保留并联开关和警告；
  State of charge 与 Battery heating 仍保留。当前 p25 本地夹具使用主通讯电池
  已识别状态 `bank1`，默认展示完整的一套 Battery 配置；异常提示只由独立
  未知主通讯电池模型验证，生产必须由后端能力/实时点位决定，不能把异常固化为
  默认。警告只在开关下方保留一条顶部分隔线，不得再画底部分隔线；
  文案使用 `13 / 400 / 18px`，上下内距为 `12px / 4px`，并紧接卡片仅约
  `5px` 的底部余量，不能恢复成与常规说明相同的 `14 / 510` 大段留白。
  警告图标使用主题橙色和归一为完全不透明的共享 mask；不得直接引用原稿中
  `fill-opacity="0.3"` 的浅色素材，否则即使 CSS 颜色正确仍会显得发灰。
  从该异常状态关闭并联时，警告必须立即消失，并在并联开关下方恢复
  `Battery #1 / Battery #2` 两张完整配置卡；两路的 Battery Brand、最大充/
  放电电流和后续加热设置都必须正常可编辑，不得因为主通讯电池点位异常继续
  隐藏或禁用分路设置。
- 每个电池输入提供 `Battery Brand / Max. Charge Current / Max. Discharge
  Current`。品牌使用共享 `createSelectControl({variant:"adaptive"})`，电流使用
  标准 `.isw-number`，两项范围当前为 preview fallback `0–1000 A`。品牌选择框
  固定为标准字段宽 `128px`，与下方电流字段同宽。
- SOC 固定为 `Grid-tied SOC` 与 `Off-grid SOC` 两张卡，每张显示上下限值、
  0–100% 双端滑块和 `0 / 20 / 40 / 60 / 80 / 100%` 刻度；默认值分别为
  `10–80%` 与 `20–90%`。点击或拖动轨道时移动到最近手柄；上下限可以相互
  越过，松手或键盘提交后按数值重新排序，较小值自动成为 Start。Start 与 End
  相等时在字段内显示错误并阻止 Save；数值输入反向时同样自动排序，不得报
  `lower > upper`。未填充轨道使用中性灰色，已填充区间使用 `--wd-accent-blue`。
  默认线高 `4px`，只有轨道自身的 `:hover` /
  `:has(.isw-soc-handle:focus-visible)` 才增至 `8px`；整张卡片或刻度区域 hover 不得加粗，轨道使用
  24px 透明命中区但不改变可见几何。两个无内部小点的玻璃手柄默认 `16px`，
  只要轨道区域 hover / 键盘 focus，两个手柄同时使用共享 Glass Surface 的
  spring 放大动效；释放使用共享 `420ms` spring 回落，不能硬切。通过局部材质
  变量保证 16px 圆盘仍有清晰边缘、模糊与内外高光；手柄中心与区间起止点必须
  像素对齐。hover / 键盘 focus 中的手柄上方显示跟随它的共享 Glass 浮窗 `SOC <value>%`，
  拖动和键盘调整实时更新并保持水平对齐。浮窗必须绝对定位在内容层上方，
  不参与卡片排版、不占用高度，与手柄净距保持约 `2–4px`，并直接复用共享
  `wd-glass--surface wd-glass-popup` 材质和字体层级。拖动位置必须始终连续，
  不得按整数或整十跳动，也不保留磁性吸附；手柄、填充和浮窗按指针的实际
  百分比移动，数值、ARIA 值和模型只回传最接近的整数。键盘方向键保持逐点
  调整，数值输入保留精确整数。刻度文字使用 `12px` Labels/Secondary，
  按真实 `0 / 20 / 40 / 60 / 80 / 100%` 坐标定位；卡片底部仅保留紧凑留白。
  浮窗由端点 hover 打开、离开端点关闭，点击不作为显隐开关；拖拽期间保持显示，
  键盘 focus 也可打开并在 blur 时关闭。进入时 Glass Material 与 backdrop blur
  必须立即达到终态，正文延后 `70ms`；不得对 `backdrop-filter` 做过渡。
  退出时正文先退，材质延后 `70ms`，不得出现正文先亮而背景随后补上的分层感。
  浮窗宿主必须覆盖共享 `.wd-glass` 的隔离设置，
  使用 `.isw-soc-value-tooltip.wd-glass { isolation:auto }`，否则计算样式虽有
  backdrop blur，实际无法采样背后内容。
- `Battery heating` 固定放在 SOC 之后；单路或并联时显示 `Keep Battery Warm`，
  双路分置时显示 `Keep Battery #1 Warm / Keep Battery #2 Warm`。原 Device
  Features 中的全局 `Battery heating` 行已移除，避免形成第二套控制入口。

### Economic Schedule

- 使用 `640px` 内容列；`24h Overview` 和 `Schedule periods` 标题在卡外，
  标题到卡 `7px`；Overview 上内距 `28px`、下内距 `18px`。
- Charge 绿、Discharge 橙、未覆盖时段灰 General Mode；轨道 `6px`，只保留中部
  刻度点。
- 时间字段使用单一八位数字掩码：自动形成 `HH:MM – HH:MM`，空位 `_`，固定
  标点不参与编辑；支持光标定位到任意数字。
- 非法时间保留输入和红色错误状态，焦点离开字段才提交；重叠、格式和范围校验
  共用一条逻辑。
- 时间字段独立打开箭头与共享 Select 箭头保持一致：14px、右缘约 12px、垂直
  居中、默认 `currentColor` / `.72`，hover / focus / 展开为 `1`；不得回退为
  12px 三级色箭头。
- Mode 使用 `createSelectControl({variant:"adaptive"})`，其菜单宽 `280px`，
  使用 `Charge by PV Only`，并完整显示 `Charge by PV and Grid`。
- 百分比输入值使用主文字色，换算后的 kW 辅助值使用 `Labels/Secondary`；两行
  同行展示，kW 不再使用更深的 status ink。
- 空草稿显示 `--`、`-- %`、`-- kW`；只有 `--` 用 Labels/Quaternary，单位
  保持正常文字色。未完成草稿阻止 Save。
- Power limit info 使用共享 `bindHoverPanel()` 的 `align:"center"` 定位，
  浮窗中心与 info 图标中心误差不超过 `1px`。
- 行尾菜单使用共享 36px 玻璃圆钮、`menuEndAlign(button,30)`；删除确认使用
  共享确认弹窗，删除项保持红色语义和 `11%` 红色 hover 底。

### ToU Mode（Manual / Dynamic）

- 左侧 `Operating strategy` 在 `Economic Schedule` 与 `Battery` 之间显示两个
  同名 `ToU Mode` 入口，右侧小字分别为 `Manual` / `Dynamic`，共用
  `icons/settings/time-of-use-mode.svg`。
- 原型阶段两个入口始终显示，默认使用 Manual，不增加侧栏资格隐藏或自动切换。
- Manual 页使用 `24h Overview → Advanced Settings → Schedule periods`：提供
  15/30/60 分钟粒度、最多 24 段、六种运行子模式、Battery Power Limit、
  PV Forbidden、新增/删除和页面级 Save/Cancel。初始预览以六个连续时间段
  分别对应六种模式。
- Manual 的 24h Overview 直接复用 Economic Schedule 的
  `.isw-gantt / .isw-eco-overview` DOM 与几何；时间范围复用
  `components/time-range-control.js`，滚轮只产生当前间隔允许的时间。`1 h`
  分钟列为单个静态 `00`；`15 / 30 mins` 的稀疏分钟列每个值只渲染一次，
  不做隐藏循环回中。
- Manual / Dynamic 计划表在 `640px` 内容列内使用五列
  `136 / 160 / 154 / 90 / minmax(...)`、列间距 `4px`、左右内距 `24px`；
  时间输入必须完整显示，Mode 必须完整显示 `Battery Discharge`，PV 表头单行，
  电量与 PV 开关净距不少于约 `18px`。
- ToU 时间校验统一覆盖同一时间、反序、步长、重叠和最多 24 段；有效计划按开始
  时间升序，错误显示在对应行内，Save 再次拦截。同一字段只保留一条当前错误，
  横向占用 Time range / Mode 两列并单行显示，不能按滚动值累积。
- Dynamic 页提供 Today/Tomorrow、96 个 15 分钟价格点、
  Percentage/Fixed 高低价阈值、Refresh、Advanced Settings 和生成后的计划。
  `24h Overview` 使用两条各含 96 个点的阶梯价格线；Buy / Sell 只取主题
  `Accents/Blue / Orange`。Buy 为 2px 主曲线并带 `14% → 0` 轻面积，Sell 为
  1.5px、`84%` 不透明度的次级曲线。当前计划的运行模式作为绘图区底色展示；
  六种模式固定映射 `Labels/Secondary` 与
  `Accents/Purple / Yellow / Green / Red / Teal`，统一使用 `8%` 不透明度，
  不增加独立模式轨道。模式内部边界必须清晰，禁止模糊或跨色渐变。只允许绘图区
  最外侧左右边缘 `0–8% / 92–100%` 渐隐，价格线、水平网格与底部基线保持清晰
  端点。不再使用模式染色的价格柱或图内当前时刻线。
- Dynamic 绘图区高 `250px`，纵轴、横轴和图例统一 `11px / 14px`；图例保持
  原有单行流式结构，不拆组或重排，并使用 6px 主题色模式圆点。横轴上方显示
  当日最低 / 最高 Buy Price 及连续时间范围；摘要内容左缘与
  `24h Overview` 的文字左缘对齐，标题到摘要净距约 `16–18px`。图表 hover / keyboard focus
  只显示对应模式 `16%` 的 15 分钟列高亮和共享 Glass Surface 浮窗，不显示
  竖向虚线。
  `24h Overview` 使用 `13px / 18px`，相对计划表左侧内容线向右 `2px`、
  向下 `3px` 做光学校正，只改变绘制位置，不移动标题布局盒、图表或计划表。
- 完整线型、字段边界和生产说明见
  [ToU Mode Settings 功能需求](./TOU-MODE-SETTINGS.md#73-24h-电价图)。
- Dynamic Advanced Settings 提供 Manual / Duration / Percentage / Fixed /
  Intelligent 五种控制模式、地区/Area/Timezone/Currency、Extra Charge 和
  Automatic Export Limit。线上冲突项以线上为准。
- Intelligent Mode 由云端判断每个时间段的模式和参数并将完整计划下发设备；
  页面不显示本地 High/Normal/Low 策略字段。
- 完整数据契约和待实现生产边界见 [ToU Mode Settings 功能需求](./TOU-MODE-SETTINGS.md)。

### Power、limits 与 dispatch

- Active Power Dispatch 固定绑定四个 RW 点：
  `ActivePower_Dispatch_Enable → dispatch.on`、
  `ActivePower_Dispatch_Mode → dispatch.unit`、
  `ActivePower_Dispatch_Setpoint → dispatch.sp`、
  `ActivePower_Dispatch_Timeout → dispatch.timeout`。`%Pn / kW` 只是 Mode
  的显示枚举，切换单位时必须保持同一实际 kW 值。
- `Command timeout = 0` 合法，表示不超时。
- Effective chain 与同页 Command timeout 使用
  `14/510/18`、`-0.14px`；四行 `36px`，列距 `14px`，标签列至少 `170px`。
- `Output Capability` 的 AC power limit mode 绑定
  `Output_Capability_Mode`，RW，候选 `Rated / Overload / Underload`。该点是否
  正式新增、数值枚举和发布条件仍为 firmware-pending；页面可保留 preview
  演示，但不得把候选值写成已确认生产契约。
- `DI Port` 绑定 `DRM_SET`，RW；`0=Off`、`1=DRM`、`2=RCR`。当前 preview
  默认 `2=RCR`。
- Currently effective 不再由云端公式推导。三个 RO 点固定为
  `ActivePower_Effective_Limit`、`ActivePower_Limit_Source`、
  `ActivePower_PV_Curtailed`；顶部状态和 dispatch 页都只展示设备上报值。
  Effective limit 与 PV curtailed 以 kW 展示，Limit source 的枚举标签和 tone
  由后端点位元数据提供；
  点位缺失时显示 unavailable，不能用 setpoint、export limit 或电池能力补算。
- Effective chain 固定三行，依次为 Effective power limit、Limit source、
  PV curtailed。Dispatch setpoint 已在上方 Dispatch 卡片显示，不在生效值卡重复。
  首行最终限值使用主题蓝强调并与支持值之间用 `16px` 间隔和 `1px` 分隔线分组，
  卡片底部标注 `Values are reported by the inverter.`。Limit source 是分类状态，
  不绘制空进度轨；该行以状态点 + 单行源标签跨越轨道区并右对齐，任何源文案
  不得换行破坏行高。顶部主标题使用
  `Effective active-power limit`，不得再写成容易被理解为实时功率的
  `Grid-tied point now`。
- Export/Import 术语固定为 `Import & Export Limits`、`Export limit`、
  `Import limit`，不再使用 `Feed-in`。
- `Limit basis` 只作用于 Export limit，不控制 Import limit。数据字段固定为
  `limits.basis`：`0=Total`，`1=Per phase`。
- 三相机型且 Export limit 开启时，在 Export limit 卡片内依次显示
  `Export limit → Limit value → Limit basis`。单相机型隐藏整行；Export limit
  关闭时隐藏但保留已选值，重新开启后恢复。
- `Limit basis` 使用共享 `createSegmentedControl()`，选项为
  `Total / Per phase`，默认 `Total`。控件沿用共享 36px 高度、胶囊移动、
  键盘和快速切换规则，不创建页面私有分段控件。
- 固件支持按相闭环时，`Per phase` 可选择，并显示说明：按相闭环需要固件支持；
  三相平衡输出机型会按最轻载相限制总功率，可能增加弃光；仅在电网公司或电表
  要求时使用。
- 三相机型但固件不支持按相时，`Per phase` 保持可见并置灰，说明
  `Current firmware does not support per-phase limiting`；不得隐藏这一能力
  边界，也不得让它产生 dirty。
- 当前 `p25` 本地预览固定为三相机型且支持按相；`Limit basis` 可实际切换。
  生产环境仍需读取设备相数和固件能力位，不能根据机型名称或现有
  `Unbalanced output` 开关推断。
- 当前 preview 没有三相功率数据，不得伪造某一相的实时限值。生产接入按相
  闭环、点位地址和实时数据后，由设备直接上报最终 effective limit；云端不得
  为按相模式另行推导。

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
- Device Features 的 `Operating envelope` 固定顺序为
  `Allow grid / off-grid switching → Backup Output → Unbalanced output`。
  `Backup Output` 是设备级二值设置，默认开启，控制 backup 侧能量输出；其
  值进入正常 Save / Cancel、dirty 和 Operation Log。逆变器处于运行状态时，
  开启和关闭都必须在共享 switch 接收点击前拦截，开关视觉、语义值、dirty
  和操作日志均不得变化；分别显示单按钮 `Cannot Enable Backup Output` /
  `Cannot Disable Backup Output` 通知。通知的唯一 `OK` 使用共享蓝色 primary
  整行按钮；点击只确认提示，不改变运行门禁，逆变器未关机时再次尝试切换仍会
  继续弹出对应通知。关停逆变器后才允许正常切换。
- MPPT 数量不读取单一 count 标量。设备提供 5 个独立 inventory 状态点位，
  取值 `1–5`；`5` 表示该硬件接口不存在，云端只统计非 `5` 的点位得到实际
  MPPT 数量。页面顶部 MPPT Input 行、并联可选列表和组数上限都来自该数量。
- 并联分组使用另外 4 个独立点位，默认 `[1, 2, 3, 4]`，取值只能是 `1–4`；
  成组的两路写入相同值，例如 `[1, 1, 3, 4]`。分组操作不得修改 5 个
  inventory 状态点位，read 数据展示只使用每组主机，不重复展示从机。
- Parallel MPPT Operation 关闭时只显示标题、标题下短说明和开关，不再使用 info
  浮窗；说明为
  `Shares input current across MPPT channels for more energy from parallel PV strings.`。
  实际只有 2 路 MPPT
  时开启并联直接形成隐式 `[1, 1, 3, 4]` 分组，不显示组编辑器。超过 2 路时，
  开启后立即显示 `MPPT Group 1` 占位，再从该组 Select 触发器下方自动打开
  双选浮层。每组只能两路；全新组中已进入其他组的接口禁用，编辑已有组时其他
  组成员同样保持禁用并置灰，必须先删除占用该接口的组；禁用项只显示灰色
  `MPPT #N`，不再附加 `Already assigned` 文案。占位组也显示右侧 disabled
  option 按钮。
- 组值使用与 Scan interval 相同的共享 Adaptive Select 触发器，宽度随内容、
  右侧 `14px` 下箭头，与右侧 option 按钮间距 `8px`。双选浮层使用
  `wd-select-popover`、36px 横向行、Running Mode 18px 右侧选择标记、紧凑内距
  和标准 Cancel / Save 按钮。已选满两项后再点第三 / 第四项时，自动取消最早
  选择，弹窗始终保留最后选择的两个。浮窗宽 `220px`，按共享 Select 规则右缘
  对齐组触发器布局右缘后再外扩 `30px` 圆角距离。
- 第一组保存后显示 `MPPT Group N` 和右对齐 `+`；剩余恰好两路时点击 `+`
  直接补全，不再弹选择器。已有组提供危险语义 `Delete group` 菜单，图标、文字
  和 hover 底均使用共享 danger 状态。所有组删除后显示
  `At least one MPPT Group must be created`，并阻止 Save；取消选择器后保留
  该错误，同时保留 `MPPT Group 1` 占位；红色错误上下留白相等，普通
  Save/Cancel 与 dirty 继续按页工作。错误插入或移除导致卡片高度变化时，
  必须使用共享 `280ms` content-grow 动画，不得直接设置 `hidden` 或替换 DOM
  造成尺寸突变。
- MPPT 标签固定为 `MPPT Input`、`MPPT #1–#4`、
  `Parallel MPPT Operation`。Shadow scan 使用共享分段
  `All MPPTs Control / Individual Control`：
  - `All MPPTs Control` 只有一个 `Shadow scan` 开关和一个 Scan interval；
  - `Individual Control` 按 inventory 非 `5` 点位计算出的实际 MPPT 数量，为
    每一路生成独立开关和 Scan interval；
  - 每路关闭后只收起该路 interval，其他 MPPT 不受影响；
  - 两种模式的扫描区必须在同一页面预渲染；切换只原位显示目标区域并同时把旧区域
    `hidden` / `inert`，不得重建整页或重新挂载该页其他共享控件。共享 segmented
    的胶囊动画从点击首帧连续运行，页面、Tracker 卡和分段控件节点保持不变。
  - 位于底部时从 Individual 切回 All，必须先锁定旧底部滚动范围，再以共享
    bottom-scroll guard 的 `--wd-ease-content-settle` 平滑回落；不得先被浏览器
    夹到新最大高度，也不得因整页重绘形成停顿后跳回。
- Scan interval 是共享 Adaptive Select，选项为
  `5 mins / 15 mins / 30 mins / 1 h`。Individual 模式每个 interval 写独立的
  `mppt.individual.<index>.interval`，开关写对应 `.scan`；模式本身写
  `mppt.scanMode`，全部进入当前页 Save / Cancel、dirty 与 Operation Log。
- Last scan 与 Last check 使用 `createTimeLabel()`，禁止硬编码相对时间。

### CT Self-check

- `Current Mode` 对应 `Grid_Current_Mode_Set`，固定使用共享分段控件：
  `0 = Meter Current`、`1 = CT Current`。不存在 `100 A CT / 50 A CT` 选项；
  这类评级文案如出现在硬件资料中只能作为独立只读信息。
- `Run check` 对应 `CT_SCAN_ENABLE` 自检触发点，与 Current Mode 相互独立。
  本地预览继续使用 `ctRun` 模拟检查，不伪造真实固件写入。
- `ctCurrentMode` 是当前页的持久化配置字段，进入 Save / Cancel、dirty 与
  Operation Log；`ct.running / l1 / l2 / l3 / lastMinutesAgo` 仍属于瞬态运行
  状态，不因检查完成而进入未保存变更。
- CT 页面顺序为 `CT Self-check`（Current Mode、Direction check）→
  `Result`（L1 / L2 / L3 / Last check）。

### Networking Wi-Fi

- Networking 固定为 `Connection → Wi-Fi → Address → Modbus TCP`。Wi-Fi 卡
  按 `Inverter Wi-Fi Hotspot → SSID → Password` 排列，分别映射
  `WIFI_Mode_AP_Switch`、`Wifi_Mode_Open_AP_SSID`、
  `Wifi_Mode_Open_AP_Password`。
- Hotspot 使用共享开关；说明不使用 info 浮窗，直接作为标题下标准 hint：
  `Disabling this switch stops the inverter hotspot without affecting cloud connection. Re-enabling must be done via cloud or Wi-Fi dongle for reconfiguration.`
- SSID、Password 都使用与设置页数字字段相同的共享 `.wd-edit-field` 表面：
  高 `36px`、最宽 `220px`，背景、描边、阴影、hover 与 focus 均不得另写一套。
  所有 `.wd-edit-field` 无论直接输入、数字复合字段还是 Wi-Fi 复合字段，都必须
  自动命中同一 `380ms` / `--wd-ease-disclosure` 状态过渡，不能在
  `motion.css` 维护页面类名白名单。默认保留不可见 `1px` outline，focus 只动画
  轮廓颜色并固定为 `1px`，不能触发浏览器默认 `2px` 蓝色 outline。字段内的
  Select 当前值、箭头、占位文字和数字单位也必须与该外壳使用同一节奏。
  Password
  默认 `type=password`，眼睛按钮在显隐间切换，并同步
  `aria-label=Show/Hide password` 与 `eye-closed/eye` 图标；显隐本身不进入 dirty。
  眼睛图标使用 `16px`；闭合图标视觉中心略偏上，因此只对闭合态做 `0.5px`
  向下光学校正，开启态不位移。
- Hotspot 关闭时仍保留 SSID / Password 配置；三个字段均进入当前页 Save /
  Cancel、dirty 与 Operation Log。密码日志只能显示 `••••••••` 或 `Not set`，
  不能记录明文。

### Maintenance actions 与 Operation Log

- Operation Control 的 Reset 分组不再直接暴露 Factory reset，而使用共享中性
  `Open` 按钮进入嵌套 `Reset & Recovery` 弹窗。弹窗约 `640px`，使用共享
  `createModalDialog()` 与 modal stack；设置窗在子层打开时保持挂载并暂时
  `inert`。
- Landing 只提供两条路径：`Reset by category` 与
  `Clear all settings & reset setup`。分类路径再选择 Operation Settings、
  Safety-Locked Parameters 或 Network Recovery；每次选择都进入详细影响说明，
  再由共享 `createConfirmDialog()` 做最终 `Cancel / Reset` 确认。
- 点位保持独立，不合并：`Reset_operation`、`Reset_gridparameters`、
  `Reset_network`、`Reset_allcustomersettings`。Full reset 只调用
  `Reset_allcustomersettings`，其业务效果覆盖前三类恢复并回到初始 Setup，
  不要求前端依次调用三个分类命令。
- Full reset 的说明、重置列表和最终确认严格采用交互稿；本地预览不额外推断
  历史统计数据或日志是否由固件一并清理，实际范围由该点位定义。
- 当前未确认产品必须关机后才能重置，因此不增加运行状态前置门禁；当前也按要求
  暂不增加 Check code 或额外权限门禁。
- Reset & Recovery 的底部操作按钮组水平居中并去除多余底部留白；按钮只使用
  共享标准 `36px` 尺寸和材质，不增加页面私有宽度、高度或材质。Cancel 使用
  共享 neutral 玻璃，Continue / Reset 使用新增的共享 `danger-solid` 实心红玻璃，
  复用 primary 的结构并保持始终白色文字。
  分类行右侧箭头为 `18px`，hover 使用明显高于常态的填充与描边；危险行 hover
  继续保留红色文字，右侧箭头同时提升为完全不透明的实心当前语义色。箭头默认使用
  不透明遮罩加 `.24` 透明度，以保留原始轻量层级；只有 hover / focus 才到 `1`。
- 无底部操作栏的 Landing 页面保持左右、底部均为 `22px` 的一致留白；带
  Cancel / Continue 操作栏的分类页和详情页使用更紧凑的 `14px` 底部留白。
- 分类选择页必须保留首页的恢复风险提示。详情页 Warning 图标与标题垂直居中，
  图文间距收紧；标题、重置列表和 Not affected 区块之间使用 `16px` 节奏。
- 本地预览在最终确认后显示短暂 `Resetting...` 状态，再以 toast 标明命令仅在
  preview 中模拟；不得伪造真实硬件成功、离线或云端重连结果。
- 普通命令按钮全部使用 `createStandardButton()` 并挂共享 Glass Surface。
  `Run check`、`Export`、可执行的 `Power on` 为 primary；`Power off`、
  `Restart` 为 warning；Reset 详情 Continue 与最终 Reset 为 danger；
  `Clear faults`、`Reload …` 和 Reset & Recovery 入口为 neutral。
  Operation Control 命令按钮统一 `144px` 宽。
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
- Save 成功与失败均使用全站共享 `#toast`；不要偏移到右侧设置区，也不得覆盖其 Glass 预挂载、入场宿主 opacity、退场整体同步淡出、`8px / 18px` 内距、文字淡变或 `4px` 位移规则。

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
- 位于底部时内容缩短使用共享 bottom-scroll guard，滚动跟随使用
  `--wd-ease-content-settle`；内容增长不触发上移。
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

- 17 个主页面和所有可用 Grid 子页均能渲染；18 个 profile 的 key、顺序和值
  不变。
- 两个 `ToU Mode` 入口位于 `Economic Schedule` 与 `Battery` 之间，使用 ToU
  模式图标，并分别显示 `Manual / Dynamic`；两页的 Save/Cancel 作用域独立。
- Dynamic `24h Overview` 保留两条 96 点价格线和独立的计划模式背景层；
  价格不得按模式染柱，未覆盖时间必须以 General Mode 底色呈现。
- 首开模式来自设备；非 Running Mode 保存不反向改写设备模式。
- timeout `0`、功率因数 `-1–1`、Check code 四位和普通 Save 日志仍有效。
- `Limit basis` 默认 Total；三相支持按相的预览可切换，单相隐藏，固件不支持时
  Per phase 可见但禁用；Save/Cancel 和 Operation Log 均显示
  `Total / Per phase`，不是原始 `0 / 1`。
- Battery 单路、双路并联、双路分置三种状态均保留同一页面作用域 Save/Cancel；
  `battery.soc` 在三种状态下都只有一套；日志标签能区分 Battery #1 / #2、
  SOC 上下限及各输入字段，不得退化为重复的 `Grid-tied SOC` 或原始路径。
- 并联主通讯电池异常警告只保留开关下方顶部线，无底部分隔线；字体为
  `13 / 400 / 18px`，上下内距 `12px / 4px`，且不能重新长出大段卡片尾部留白；
  图标必须使用不透明的主题橙色 mask，不能保留原 SVG 的 `30%` 填充透明度。
- 并联主通讯电池异常时关闭并联，必须恢复两张完整可编辑的
  `Battery #1 / Battery #2` 配置卡；异常能力不能阻塞正常的分路配置回退。
- dirty、Cancel、Save 和切页确认严格按页面作用域工作。
- Grid 门禁未解锁时不泄漏二级栏；解锁后位置、滚动记忆和 Check code 关联不变。
- switch、segmented、select 和条件卡在局部重绘后保留动画宿主。
- 页面切换无回弹、无横移、无中间空洞、无旧页重新可见、无标题 blur 丢失。
- 滚动、hover、focus、错误态和禁用态在深浅主题一致；没有原生滚动条。
- `settings-options.js` 与日志标签共用同一枚举源；新枚举不得重新散落页面。
- 不新增浏览器原生 confirm/alert/prompt，不伪造后端保存、设备动作或导出结果。
- 独立域名根路径 302 到 `/settings`，`/settings` 为 200，`/home` 与 `/plants`
  为 404；已删除的 `/inverter` 和 `www.carlwang.cn/inverter` 必须继续返回 404。
- standalone 首次打开为浅色，`Dark mode` / `Light mode` 可双向切换，按钮距底边
  `32px` 且与设置窗口不重叠；主站默认主题不受影响。
