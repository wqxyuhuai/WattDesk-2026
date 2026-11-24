# ToU Mode Settings 功能需求

更新：2026-11-24

状态：**已确认并完成本地预览实现**。2026-11-24 的最新批注确认了导航命名、
线上冲突处理、Intelligent Mode 和其余建议方案。本文记录当前有效契约；
真实后端、生产点位和设备写入仍受页面预览边界约束。

## 0. 最终确认决议

| 项目 | 最终决定 |
|---|---|
| 侧栏入口 | 两个入口都显示 `ToU Mode`，右侧小字分别为 `Manual` / `Dynamic` |
| 默认模式 | Manual |
| 原型资格策略 | 两个入口始终显示，不实现侧栏资格隐藏或自动切换 |
| 资料冲突 | 以线上 WattDesk 行为为准 |
| Intelligent Mode | 纳入实现；云端判断每个时间段应使用的模式和参数，再把完整计划下发给设备 |
| 其余产品建议 | 按本文建议执行 |
| 视觉与交互 | 复用 Inverter settings、Economic Schedule、共享 Select、Switch、时间范围、表格、危险确认和滚动规则 |

## 1. 需求目标

Inverter settings 中的 ToU 需要支持两种业务形态：

1. **Manual Mode**：用户手动维护一天内的时间段与运行模式。此页始终可用，
   也是 ToU 的默认形态。
2. **Dynamic Price Mode**：云端根据电站所在国家/地区、时区和货币，读取动态
   电价并将一天自动划分为高价、平价和低价时段，再写入 ToU 时间段。该形态
   仅对支持动态电价的国家/地区开放。

两种形态共享同一套 ToU 计划、六种运行子模式、电池功率限制和 PV 禁止能力，
但页面信息层级不同：

- 手动页以可见时间段的直接编辑为主。
- 动态电价页以今日/明日电价、自动生成计划、阈值线和高级控制模式为主。

## 2. 本轮范围与开发阶段

### 2.1 原型阶段

- 左侧 `Operating strategy` 分组同时显示两个独立入口，暂不按国家/资格自动
  隐藏或切换。
- 默认进入手动页。
- 动态电价页必须可以单独打开并检查全部样式与交互状态。
- 两页共享 ToU 数据模型和组件，不复制两套实现。

最终导航：

```text
ToU Mode                         Manual
ToU Mode                         Dynamic
```

页面标题统一为 `ToU Mode`，当前模式通过侧栏右侧值和页面内模式胶囊区分。

### 2.2 生产阶段

生产环境仍保留两个入口，但需要增加资格展示策略。具体是隐藏、禁用还是自动
进入 Manual Mode，待本原型确认后再定义。本轮不实现该判断。

## 3. 信息来源与冲突处理

### 3.1 已阅读资料

- [ToU Mode 说明 01 手动模式.pdf](../../资料/tou模式/ToU%20Mode%20说明%2001%20手动模式.pdf)
- [ToU Mode 说明 02 动态电价.pdf](../../资料/tou模式/ToU%20Mode%20说明%2002%20动态电价.pdf)
- [手动模式设计图](../../资料/tou模式/ToU%20Mode%20说明%2001%20手动模式.png)
- [动态电价设计图](../../资料/tou模式/ToU%20Mode%20说明%2002%20动态电价.png)
- 线上页面：`https://www.wattdesk.com/#/plantList/1947190280421425153/device`
  中的 `Inverter Settings → ToU Mode Settings`

### 3.2 文案和实现冲突

资料内部存在以下冲突，最终按 2026-11-23 决策处理：

| 项目 | 当前冲突 |
|---|---|
| 卖电模式名称 | 手动资料同时出现 `Feed-in Mode` 和 `Grid Injection`；动态资料与线上使用 `Grid Injection` |
| 动态控制模式 | 本地文档列出 Manual / Duration / Percentage / Fixed；线上额外存在 `Intelligent Mode` |
| Percentage 控件文案 | 文档字段是 High/Low Price Range，但线上显示 `High Price Hours / Low Price Hours`，单位却是 `%` |
| 动态删除动作 | 动态资料最新要求改为 `Reset`；线上菜单仍显示 `Delete` |
| 高价/低价/平价点位映射 | 文档字段命名与第 6 页描述的高低/平价对应顺序存在矛盾 |
| 地区与费用归属 | 文档称属于电站属性；设计稿放在 ToU Advanced Settings 内展示 |
| 24h 图表颜色 | 手动与动态设计稿对 Battery Discharge、Peak Shifting 等颜色使用不一致 |

最终处理：

- 卖电模式显示为 `Grid Injection`。
- 动态时间段行操作使用线上的 `Delete`。
- Percentage Control 跟随线上显示 `High Price Hours / Low Price Hours`，单位 `%`。
- 地区与费用是电站数据，ToU Advanced Settings 只提供同源编辑入口或只读摘要，
  不建立第二套数据源；Save 后同步回 Site details 的页面会话数据。
- Intelligent Mode 纳入本轮。
- 图表颜色和字段顺序按线上可见状态实现。

## 4. 页面入口与信息架构

### 4.1 手动模式页

最终导航：

```text
Running Mode
ToU Mode                         Manual
ToU Mode                         Dynamic
Battery
```

页面顺序：

1. 24h Overview
2. Advanced Settings
3. Schedule periods
4. Cancel / Save

### 4.2 动态电价页

页面顺序：

1. Today / Tomorrow 切换
2. 24h 电价图
3. Advanced Settings 入口
4. 自动生成后仍可编辑的 Schedule periods
5. Cancel / Save

`Advanced Settings` 打开独立子视图，包含：

1. Control Mode
2. 当前控制模式参数
3. Country/Region、Area、Timezone、Currency 摘要或入口
4. Extra Charge
5. Automatic Export Limit
6. 模式专属计划设置
7. Back

## 5. 共享 ToU 调度模型

### 5.1 时间段上限

- 一个计划最多 24 个时间段。
- 时间段使用 `start / end` 描述，显示为 `HH:mm - HH:mm`。
- 24:00 是合法结束时间，表示当天结束。
- 时间段按开始时间排序。
- 达到 24 个时间段后，新增按钮禁用并给出原因。

### 5.2 时间间隔

- 可选值为 `15 mins / 30 mins / 60 mins`。
- 界面统一显示为 `15 mins / 30 mins / 1 h`。
- 时间范围输入与滚轮直接复用 Economic Schedule 的共享
  `createTimeRangeControl()`；ToU 只传入当前 `stepMinutes`。
- 时间选择器只能产生所选步长的时间点，不允许非整步长分钟。
- `1 h` 时分钟轮只显示一个居中的静态 `00`，不创建滚动列表、不接收滚轮位移，
  也不播放吸附动画；`30 mins / 15 mins` 使用可滚动分钟轮，但每个允许值只渲染
  一次，不再复制五组周期或通过隐藏重复组做回中跳转。
- 时间字段右侧箭头与共享 Select 箭头使用同一视觉契约：`14px`、右侧内距约
  `12px`、垂直居中、默认 `currentColor @ .72`，hover / focus / 展开变为
  `1`；不得使用更小、更淡或位置偏移的页面专属箭头。
- 时间段的持续时间必须至少等于一个时间间隔。
- 手动模式下，只有尚未设置任何子模式时才允许修改 Time Interval。
- 一旦存在已配置的子模式，Time Interval 变为不可编辑；把所有计划重置为
  General Mode 后恢复编辑。
- 动态模式 Manual Control 使用同一锁定规则；云端自动控制模式不显示本地
  Time Interval 编辑。

### 5.3 六种运行子模式

| 值 | 显示名 | 资料中的其他名称 | 电池功率限制 | PV 禁止 |
|---|---|---:|---:|
| 0 | General Mode | General Mode | 否 | 否 |
| 1 | Grid Injection | Feed-in Mode | 否 | 否 |
| 2 | PV Charging | PV Charging | 是 | 否 |
| 3 | Battery Charge | Battery Charge | 是 | 是 |
| 4 | Battery Discharge | Battery Discharge | 是 | 否 |
| 5 | Peak Shifting | Peak Shifting | 否 | 否 |

规则：

- 每个子模式使用固定语义色，并同时提供文字标签，不能只靠颜色识别。
- 24h Overview 的图例只显示当前计划实际出现的模式。
- 具体色值必须复用项目主题 token；资料中的两组颜色不作为最终实现值。
- 初始预览固定显示六个连续时间段，每个时间段对应一种模式，但时间段不采用
  等分占位：`00–05 General / 05–08 Grid Injection / 08–14 PV Charging /
  14–17 Battery Charge / 17–21 Battery Discharge / 21–24 Peak Shifting`。

### 5.4 电池功率限制

- 每个适用时间段有独立点位。
- 可输入整数 `0–100%`，默认 `100%`。
- 同时显示百分比和换算后的功率，例如 `100% / 20.0 kW`。
- 换算后的 kW 使用次级文字色和 `12px` 字号，视觉权重低于可编辑百分比。
- 实际限制值 = 输入百分比 × 逆变器额定功率。
- 额定功率来自当前设备，不能使用固定演示值。
- 输入非法、为空或越界时，保留用户输入并显示行内错误，阻止 Save。

### 5.5 PV 禁止

- 仅列入支持该参数的子模式，当前设计为 Battery Charge。
- 使用二值开关，默认 Off。
- `Off` 表示允许 PV；`On` 表示该时段禁止 PV。
- 开关变化必须是同一时间段的点位变化，不能影响其他时间段。
- 是否需要说明文案或信息浮窗待视觉设计确认。

### 5.6 时间段编辑、删除与重置

- 点击 `+` 新增时间段，默认 `00:00–00:00 / General Mode / 100% / PV allowed`，
  作为未完成草稿。
- 点击时间范围打开时间选择器，以 Time Interval 为步长。
- 加号固定在表格右侧，与行尾更多按钮右缘对齐。
- `Add time range` 行上方使用与计划行同一条 `Separators/Non-opaque` 分隔线，
  分隔线右侧延伸到卡片内容边界。
- 行尾菜单承载删除动作。
- Manual 和 Dynamic 都使用线上的 `Delete`；菜单使用共享 `.is-danger` 红色
  主题，确认按钮使用红底白字 `danger-solid`，hover / focus 不回退成黑色。
- `danger-solid` 默认态必须保留独立于 hover 的白色 rim、内高光和光学高光，
  保持与其他玻璃按钮一致的表面层次。
- 删除确认后立即且永久减少当前计划行，不再自动插入 General Mode 填补空档；
  24h Overview 对未覆盖时间使用 General Mode 背景。全部行删除后计划保持为空，
  只有用户新增或页面 Cancel 回滚才会改变。
- 计划最多 24 个时间段；达到上限后 Add 按钮禁用。时间段按开始时间升序排列，
  未完成草稿排在有效时间段之后，完成编辑后自动回到正确位置。

### 5.7 计划完整性与校验

必须在 Save 前验证：

- 时间段不得重叠。
- 结束时间必须大于开始时间。
- 开始时间与结束时间不能相同；输入反序时间时阻止提交。
- 时间点必须符合 Time Interval。
- 时间段数量不超过 24。
- 电池功率限制为 `0–100%`。
- 模式所需参数必须完整。
- 所有非法字段显示行内错误；Save 不可用或点击后定位首个错误。
- 行内和 Save 共用同一校验结果：同一时间、反序、起点/终点不在步长网格上、
  与其他时间段重叠、超过 24 段都会阻止保存，并把错误显示在对应 ToU 行下方。
- 同一 ToU 时间字段始终只保留一条当前错误，连续滚动或重复提交必须替换旧文案，
  不能按输入值累积多条错误。错误行横跨 Time range 与 Mode 两列、左对齐、单行，
  避免在窄时间列内重复换行并撑高整张表。

最终规则：

- 空档自动显示为 General Mode。
- 不允许两个时间段部分重叠。
- 新增时间段若与已有段冲突，优先提示冲突，不自动覆盖用户数据。


### 5.8 24h Overview

- 横向展示完整一天。
- 时间段按运行子模式着色。
- 图例只显示已使用模式。
- 图表和表格必须同步更新。
- 无计划或数据加载失败时显示明确空状态，不显示伪造曲线。

## 6. 手动模式页面

### 6.1 页面职责

用户直接设置完整一天的 ToU 时间段。动态电价资格不影响该页面是否可用。

### 6.2 24h Overview

- 直接复用 Economic Schedule 的 `.isw-gantt / .isw-eco-overview` 卡片、
  6px 轨道、`00:00 / 12:00 / 24:00` 轴线和图例结构。
- 每个时间段只替换颜色语义，轨道几何、轴线、间距与字号不再另写一套。
- 修改表格中的时间、模式或参数后立即重绘。

### 6.3 Advanced Settings

手动页 Advanced Settings 只包含共享 Time Interval；动态电价地区、费用和控制
策略放在 Dynamic 页的 Advanced Settings，避免 Manual 页混入动态业务。

要求：

- Time Interval 可查看。
- 在允许修改的阶段提供 15/30/60 分钟选择。
- 锁定原因可被用户理解。

### 6.4 Schedule periods

列：

- Time Range
- Mode
- Battery Power Limit
- PV Forbidden
- Row actions

行级行为：

- Mode 使用共享 Select。
- 根据 Mode 立即显示或隐藏 Battery Power Limit / PV Forbidden。
- Battery Power Limit 使用数值输入，同时显示换算 kW。
- PV Forbidden 使用共享二值设置控件。
- 行尾菜单打开删除确认。
- 新行插入后保持键盘焦点可继续编辑。
- Manual / Dynamic 均使用 Inverter settings 的标准 `640px` 内容列。桌面五列
  使用 `136 / 160 / 154 / 90 / minmax(...)` 节奏和 `4px` 列间距；表格内部
  左右内距统一为 `24px`。时间控件保持 `136px` 且输入值不得截断；Mode 列必须
  完整显示 `Battery Discharge` 等全部模式名称；
  Battery power limit 与 PV forbidden 开关之间至少保留 `18px` 净距。
  `PV forbidden` 表头固定单行，换算 kW 文字固定 `12px`。
- Battery power limit 的 info hover / focus 浮窗必须通过共享 `bindHoverPanel()`
  定位并采用共享居中对齐，浮窗中心与 info 图标中心误差不超过 `1px`。

### 6.5 保存与刷新

- Save 只提交当前 ToU 页面。
- Cancel 回滚当前页面基线。
- 未保存切页时使用现有 Inverter settings 的 Keep Editing / Discard Changes。
- Refresh 保留当前页面滚动位置和尚未提交的本地表单状态，只重新读取价格并
  重算预览中的动态计划。

## 7. 动态电价模式页面

### 7.1 资格与默认值

- 动态模式默认值采用 Manual Mode 作为业务默认。
- `toumode = 0` 表示 Manual Mode。
- 文档定义：
  - `1 = Duration Control`
  - `2 = Percentage Control`
  - `3 = Fixed Price Control`
- 线上额外存在 `Intelligent Mode`，本轮已纳入范围：
  - `toumode = 4`。
  - 由云端根据每个时间段自动判断模式和相关参数。
  - 前端不提供本地 High/Normal/Low 策略字段。
  - 云端生成完整计划后通过现有 ToU 时间段下发设备。
- 动态模式仅在电站国家/地区支持下可用。
- 动态模式不可用时，Manual Mode 仍可选择。

原型阶段两个侧边栏入口均显示，不根据资格隐藏入口。

### 7.2 Today / Tomorrow

- 默认显示 Today。
- Tomorrow 用于查看明日电价和自动计划。
- 切换日期不得提前提交设置。
- 若明日数据尚未更新，显示：
  `Dynamic electricity price data has not been updated yet. The system will update automatically once new data is received.`
- 无数据时保留计划和 Advanced Settings，但不得显示伪造价格柱。
- 线上 `24h Overview` 不在价格图内绘制当前时刻标记；Today 与 Tomorrow 使用
  相同的价格线、模式背景和坐标层级。

### 7.3 24h 电价图

基础要求：

- 横轴为 `00:00–24:00`。
- 每个价格点为 15 分钟。
- 纵轴为电站货币单位对应的电价。
- Buy Price 与 Sell Price 分别使用主题 `Accents/Blue`、`Accents/Orange`
  阶梯折线，各由 96 个 15 分钟价格点连接；不得再画成按模式逐柱着色的成对柱。
  价格线不能使用另外派生的一套低饱和色。Buy 是 2px 主曲线，并在下方使用
  `14% → 0` 的轻面积渐变；Sell 使用 1.5px、`84%` 不透明度的次级曲线。
- 预览曲线需保持两条序列的视觉差异：Buy Price 使用较少的电价档位形成清晰
  阶梯，Sell Price 使用半小时价格档位形成更稳定的自然走势；不得再用同一
  形状按比例缩放成两条相似折线。转折使用圆角连接，避免逐点量化形成粗糙锯齿。
- 绘图区底色按当前 ToU 计划显示运行模式；未覆盖空档显示 General Mode，
  图例只列出当前计划实际出现的模式。六种模式直接映射现有主题色：
  General `Labels/Secondary`、
  Grid Injection `Accents/Purple`、PV Charging `Accents/Yellow`、
  Battery Charge `Accents/Green`、Battery Discharge `Accents/Red`、
  Peak Shifting `Accents/Teal`。背景统一使用 `8%` 不透明度，不得新增发灰、
  发脏的模式私有混色，也不得再增加独立模式轨道。
- 模式内部保持利落分割，不使用模糊、降低饱和度或跨色渐变；只有绘图区最外侧
  左右边缘可以从透明过渡到实色：左侧 `0–8%`、右侧 `92–100%`。价格线、
  水平网格线和底部基线保持清晰边界。
- 横轴上方提供紧凑的价格摘要，用一行显示当日最低和最高 Buy Price 及其连续
  时间范围；使用绿色 / 橙色语义点，不新增卡片或另一组大字号指标。摘要内容
  左缘必须与 `24h Overview` 的文字左缘对齐，标题到摘要的净距控制在约
  `16–18px`。
- 图表绘图区高度保持 `250px`，水平网格线不透明度约 `58%`、保持次级。当前
  图例继续沿用原有单行流式结构，不拆组、不重排；Buy / Sell 使用 12×2px
  线型，模式使用与日程带同源的 6px 主题色圆点。
- Dynamic 页的 `24h Overview` 标题使用 `13px / 18px`，在与计划表左侧内容线
  对齐的基础上整体向右 `2px`、向下 `3px` 做字形光学校正；该位移不改变标题
  布局盒、图表或计划表的位置。
- 线上 24h Overview 不绘制当前时刻分隔线，本地预览保持同样信息层级。
- hover / focus 时，当前 15 分钟列使用对应模式主题色 `16%` 轻高亮，并继续
  显示吸附后的共享 Glass tooltip；不得绘制竖向虚线。离开后整列高亮和提示
  同时消失。

阈值线：

- 仅 Percentage Control 和 Fixed Price Control 显示阈值线。
- 红色虚线：高价阈值。
- 绿色虚线：低价阈值。
- Duration Control、Manual Mode、Intelligent Mode 不显示可计算阈值线。

数据与辅助信息：

- 需要显示 Buy Price / Sell Price 图例。
- 买卖电图例使用 `12 × 2px` 对应线段；模式图例使用 `6px` 实色圆点，
  两类图例语义分开。
- 价格轴至少提供 6 个可读刻度，每个刻度带电站货币前缀。
- 价格纵轴及刻度文字左对齐到内容区边缘，不在左侧保留额外空白。
- 纵轴、横轴与图例文字统一为 `11px / 14px`；模式圆点必须直接使用对应模式
  语义色，不能统一显示为灰色。
- 价格区 hover / 键盘 focus 时按 15 分钟档位吸附，只显示当前模式列轻高亮和
  共享 Glass Surface 浮窗；不得再绘制从顶部到底部的竖向虚线。浮窗展示 `Mode / Buy Price /
  Sell Price / Time`，随横向位置避让边界；离开或 Escape 立即关闭。键盘可用
  左右方向键逐档检查，Home / End 跳到首尾。
- 图表加载失败必须显示错误和重试入口。
- 不在前端伪造“实时”价格。

### 7.4 Advanced Settings 子视图

- Dynamic 主视图的 Today/Tomorrow 使用共享分段控件并撑满 Refresh 左侧可用
  宽度，与 Refresh 保持 `12px` 间距。
- `Advanced Settings` 入口使用共享 `.isw-panel` 表面与正常设置卡片层级，
  但页面总内容列仍为标准 `640px`。卡片收敛为 `48px` 单行高度，入口文字使用
  `13 / 510 / 18px`，右侧使用 18px 共享实心箭头；hover / focus 让整张卡出现
  中性灰填充，不对整行做缩放，内部按钮也不另画局部灰块。该背景反馈使用共享
  `.wd-hover-fill` 的 `240ms` 进入 / `360ms` 离开节奏。
- Tomorrow 无价格数据时使用同一 `.isw-panel` 卡片，高度约 `96px`，标题
  `13 / 510 / 18px`、说明 `12 / 400 / 18px`；不得再预留整张 250px 图表高度。
- 进入 Advanced 子视图后，固定标题层不再显示 `ToU Mode`，由 `Back` 按钮占用
  原标题位置；返回箭头使用共享 chevron 资源，翻转为向左并显示 `18px`。滚动
  正文内不得重复放置 Back。Back 按钮左缘与下方内容区左缘对齐，箭头在文字
  左侧，标签使用 `15 / 510 / 20px`；hover / focus 时文字与箭头一起变为完整
  Labels/Primary，不使用半透明或仅文字变色。
- Advanced 标题层滚动时保留高斯模糊，并叠加主面板背景 `72%` 的背景承接层；
  模糊层覆盖整个内容窗宽，不得只覆盖 640px 文本列，也不得让下方图表底色
  直接透成透明彩色条带。模糊承托层必须位于 Back 标题下方，标题保持
  `opacity: 1`，滚动时不得遮住 Back 文字。18px 左箭头累计做 `4px` 光学右移，
  不改变按钮和文字的布局盒。

#### Control Mode

最终选项：

- Manual Mode
- Duration Control
- Percentage Control
- Fixed Price Control
- Intelligent Mode

行为：

- Control Mode 浮窗使用共享 Select 的紧凑菜单：`288px` 宽、`10px` 内胆
  内距、`1px` 行距。每项使用 14px 标签和 11px/14px 简短说明，行高按内容
  自动增长；不得恢复页面私有的 330px 宽度或固定 48px 行。
- 当前模式展开对应字段。
- 不支持的动态模式置灰，不响应选择。
- 用户尝试选择不支持模式时显示提示，不产生 dirty。
- 从 Manual 切换到动态模式时，校验当前国家/地区、时区、货币和价格区。
- 校验失败时提示用户更新电站位置参数，不静默切换。

#### Manual Mode 参数

- Time Interval。
- Extra Charge。
- Automatic Export Limit。

#### Duration Control 参数

- High Price Hours：
  - 整数。
  - `0–24 h`。
- Low Price Hours：
  - 整数。
  - `0–24 h`。
- High + Low 必须 `≤ 24`。
- 剩余时长作为 Normal Price Time。
- 两个值均不能为负。
- 云端按价格排序，并列价格按时间先后稳定排序。

#### Percentage Control 参数

- High Price Hours。
- Low Price Hours。
- UI 显示 `0–100%`，保留一位小数；底层 `0–1` 由接口层换算。
- 两个值相加必须 `≤ 100%`。
- 文档给出的阈值公式：
  `Threshold = (Pmax - Pmin) × percentage + Pmin`
- High 从价格区间上端向下计算，Low 从下端向上计算。
- 文案和单位按线上保持 `High Price Hours / Low Price Hours` 与 `%`。

#### Time Settings

- High / Normal / Low 三行复用 `Schedule periods` 的外层 `.isw-table` 卡片、
  表头、行分隔和 `12px` 列间距，不再使用独立四列卡片布局。四列为
  `104 / 164 / 144 / minmax(144px,1fr)`；Mode 列必须完整显示
  `Battery Discharge`，不得省略。PV forbidden 前额外保留 `24px` 内侧距，
  避免换算 kW 与开关靠在一起。卡片内部左内距与常规设置卡统一为 `24px`，
  High / Normal / Low 标签与 Control、Dynamic Price Source 的文字保持同一
  内容线。

#### Dynamic Price Source

- Country/Region、Area、Timezone 和 Currency 四个选择器统一使用默认 `220px`
  宽度，不随当前值文字长度变化。

#### Fixed Price Control 参数

- High Price。
- Low Price。
- 单位为电站货币单位。
- 保留一位小数。
- High Price 必须高于 Low Price。
- 阈值线分别显示红色高价和绿色低价。

#### Intelligent Mode

线上说明：
`Predicts consumption habits and intelligently provides optimized energy plans.`

- 页面说明卡使用标准 `.isw-panel` 表面、`14px / 24px` 内距和共享 `30px`
  卡后间距；标题 `13 / 510 / 18px`、正文 `12 / 400 / 18px`，不再绘制独立的
  大圆角蓝色说明块。

最终产品行为：

- 云端判断每个时间段应使用的运行子模式、电池功率限制和 PV 禁止状态，并把
  完整计划下发给设备。
- 页面只显示控制模式说明和生成后的计划，不显示本地 High/Normal/Low 细分字段。
- 本地预览使用确定性样例模拟云端生成结果；生产计算和失败回退由云端接口提供。

#### Price calculation

- `Extra Charge` 的 info 图标与标题垂直居中，并保持约 `4–8px` 的小间距。
  点击后使用共享 Modal 展示完整
  说明，不在标题旁弹出 hover 浮层。
- 弹窗依次说明 Actual Export Price、Actual Import Price 与 Notes，包含公式、
  费用定义和估算边界，底部只有一个整行共享中性 `OK` 按钮；关闭后焦点回到
  触发图标。

### 7.5 高价 / 平价 / 低价时间段设置

动态控制模式生成三类时间段。每类都包含：

- Mode
- Battery Power Limit
- PV Forbidden

三类字段分别为：

- High Price Time
- Normal Price Time
- Low Price Time

每类的 Mode 再复用第 5 节的 Battery Power Limit / PV Forbidden 可见性矩阵。

最终映射按线上 UI 顺序执行：

- High Price Time → 高价组
- Normal Time → 平价组
- Low Price Time → 低价组

### 7.6 Country / Area / Timezone / Currency

- Country/Region 决定是否支持动态电价。
- Area 是国家级枚举，用于选择动态电价数据源。
- Area 枚举必须由 API 提供；前端不得硬编码所有国家地区。
- Timezone 和 Currency 需要与 Country/Area 组合校验。
- 这些字段属于电站数据，不能成为 ToU 页面私有状态。
- ToU Advanced Settings 中的编辑入口必须更新同一电站数据源。
- 单位变化后电价、阈值和费用显示必须同步换算或刷新。

### 7.7 Extra Charge

| 字段 | 含义 | 默认 | 单位 |
|---|---|---:|---|
| Handling Fee | 向电网卖电时扣除的手续费 | 0 | 电站货币/kWh |
| Distribution Fee | 电网公司固定输电/配电费用 | 0 | 电站货币/kWh |
| Tax Rate | 买电税率 | 0 | % |

计算：

- 实际买电价格 = `(Standard Price + Distribution Fee) × (1 + Tax Rate)`
- 实际卖电价格 = `Standard Price - Handling Fee`
- Standard Price 来自当前地区动态电价接口。
- 汇率或单位不一致时先换算为电站货币。

信息说明：

- Handling Fee、Distribution Fee、Tax Rate 都是可选项。
- 不确定时允许保留 0。
- 费用用于成本和收益估算，不代表最终账单。

### 7.8 Automatic Export Limit

- 二值开关。
- 默认状态为 Off，与线上一致。
- On 时，在电价为负时自动禁止向电网输出，避免反向收益。
- 说明文案：
  `Automatically prevents exporting power to the grid when electricity prices are negative, avoiding unnecessary losses.`
- 生产对应点位和失败回退由后端接口提供；本地预览只保留配置和说明。

### 7.9 自动生成计划

动态模式下云端按当前控制模式与价格数据：

1. 将一天拆成 15 分钟价格点。
2. 识别高价、平价和低价时段。
3. 将三类时段及控制参数写入 ToU 的 24 个时间段。
4. 保持时间段连续、无重叠、不超过 24 段。
5. 下载到设备。

计划自动生成的边界：

- 并列价格如何排序。
- 高价/平价/低价时长为 0 时的处理。
- 当天已完成时间和未来时间的拆分。
- 跨时区和夏令时。
- 次日价格未就绪时是否推迟下发。
- 生成失败时是否保留上一版计划。

生产环境由云端实现；本地预览使用确定性结果，并明确保持演示边界。

### 7.10 自动计划后的用户编辑

- 自动生成后仍允许用户修改或删除任意时间段，行操作使用线上 `Delete`。
- 修改控制参数时重新计算今明计划；用户单独修改某个时间段后，在下一次高级
  参数变化或 Refresh 时以云端新计划为准。
- 最多仍为 24 个时间段。
- 当前正在执行的时间段被修改时：
  - 修改瞬间成为旧计划终点和新计划起点。
  - 已过去的时间段不受影响。
  - 今日与明日计划可立即重算。

### 7.11 国家或电站资料变化

若电站已经启用动态模式，而用户修改 Country/Region、Area、Timezone 或
Currency：

- 新配置仍支持动态电价：
  - 重新计算全部未来计划。
  - 重新下发设备计划。
  - 修改前显示确认提示，提交后计算并下发。
- 新配置不再支持动态电价：
  - 显示风险提示。
  - 受影响设备的 ToU 控制模式切换为 Manual Mode。
  - 阻止继续下发不支持的动态计划。
  - 保存后可再次进入支持地区并重新启用。
- 若电站原本未启用动态模式：
  - 正常保存，不触发额外提示。

设计稿中的关键提示：

- `Update Required for ToU`
- `Changing your location, timezone, or currency will disable ToU intelligent mode with dynamic pricing.`
- `Affected devices will switch to Manual Mode for safety. ToU can be re-enabled after saving if the configuration is supported.`
- 不支持动态电价地区：`This mode is not supported in your location. Please check your plant region. More regions will be supported soon.`

## 8. 数据模型与点位需求

### 8.1 ToU 模式

建议统一字段：

| 字段 | 说明 |
|---|---|
| `toumode` | 0 Manual；1 Duration；2 Percentage；3 Fixed；4 Intelligent |

### 8.2 时间段

每个时间段需要：

| 字段 | 说明 |
|---|---|
| start | `HH:mm` |
| end | `HH:mm`，允许 `24:00` |
| mode | 第 5 节六种子模式 |
| batteryPowerLimit | `0–100%` 整数 |
| pvForbidden | 0/1 |

文档提到的现有设备点位：

- `TOU_Start1-24_Set`
- `TOU_End1-24_Set`
- `TOU_Mode_Select1-24_Set`
- `BatteryPowerLimit1-24`
- `PV forbidden_1-24`

实施前需要从后端获取最终点位表、单位、最小/最大值和步长；当前文档不能视为
生产点位定义。

### 8.3 动态分组参数

文档建议字段：

- `Duration_highHours`
- `Duration_lowHours`
- `Percentage_highRange`
- `Percentage_lowRange`
- `Fixed_highPrice`
- `Fixed_lowPrice`
- `highHours_mode`
- `highHours_batteryPowerLimit`
- `highHours_pvForbidden`
- `normalHours_mode`
- `normalHours_batteryPowerLimit`
- `normalHours_pvForbidden`
- `lowHours_mode`
- `lowHours_batteryPowerLimit`
- `lowHours_pvForbidden`

需要修正文档中的拼写与大小写，但生产字段名必须以后端最终契约为准。

### 8.4 电站属性

- Country/Region
- Area
- Timezone
- Currency
- Handling Fee
- Distribution Fee
- Tax Rate
- Dynamic-price support capability

动态电价数据源和 Area 枚举必须由后端提供，前端不得虚构。

## 9. 通用交互和状态

### 9.1 草稿与保存

- Manual 页和 Dynamic 页分别维护自己的页面作用域 dirty 状态。
- Save 只提交当前页面。
- Cancel 回滚当前页面。
- 切换页面时若当前页有修改，显示 Keep Editing / Discard Changes。
- 自动生成、重算和 Save 的先后关系必须明确，避免用户修改被静默覆盖。

### 9.2 Refresh

- Refresh 读取最新电价、资格、地区配置和设备计划。
- 加载期间图标只做一次旋转反馈，防止重复点击。
- 刷新失败必须显示错误，不得把旧数据冒充最新数据。
- Refresh 保留当前页面和未保存草稿，只重算动态计划并刷新价格。

### 9.3 加载与错误

- 电价图加载使用真实 loading 状态。
- 不允许用随机数或演示曲线伪装实时电价。
- 无数据、接口失败、地区不支持、自动生成失败、设备写入失败必须是不同状态。
- 错误提示需说明是否影响已下发计划。

### 9.4 键盘与无障碍

- 时间选择器、Select、二值开关和行菜单均可键盘操作。
- 行操作有明确可访问名称，例如 `Delete 05:00 to 17:00`。
- 颜色图例必须伴随文字。
- 阈值线不能只依赖颜色，需在图例/摘要中注明 High/Low threshold。
- 错误提示使用 `role="alert"` 或等效语义，并与对应字段关联。

### 9.5 主题与响应式

- 深浅主题复用 Inverter settings 共享材质与控件。
- 电价图、阈值线、当前时刻标记在双主题保持可辨。
- 窄屏下表格允许重排或横向滚动，不能压缩到字段不可用。
- 减少动态效果时关闭图表入场与数值滚动动画，直接显示结果。

## 10. 明确不在本轮实现

- 侧边栏根据国家资格自动隐藏 Dynamic Price 入口。
- 真实设备写入、生产点位和权限。
- Intelligent Mode 的生产算法、设备点位和失败回退。
- 动态电价统计与收益计算规则的最终实现；资料明确注明“有不同意见，先待定”。
- 生产费率结算、账单和税务申报。
- 新后端接口的伪造或本地伪造成功结果。

## 11. 验收标准

### 11.1 共享 ToU

- 最多 24 个时间段。
- 15/30/60 分钟时间粒度正确。
- 时间段不可重叠，非法输入阻止 Save。
- 同一时间、反序时间、非步长时间、超过 24 段均被阻止；错误显示在对应行，
  有效时间段按开始时间升序排列。
- 六种模式的字段可见性正确。
- Battery Power Limit 的范围、默认值、百分比与 kW 换算正确。
- PV Forbidden 只影响当前时间段。
- 24h Overview、图例和表格同步。
- Cancel 完整回滚；Save 只提交当前页面。

### 11.2 Manual

- 两个侧边栏入口同时可见时，Manual 默认可进入。
- 手动新增、编辑、删除时间段完整可用。
- Time Interval 在已配置计划后正确锁定并解释原因。
- 不依赖动态电价接口也能完成保存流程。

### 11.3 Dynamic

- Today / Tomorrow 可切换。
- 明日无数据时显示正确说明，不绘制伪造曲线。
- Percentage / Fixed 显示阈值线；其他模式不显示。
- Manual / Duration / Percentage / Fixed / Intelligent 字段正确切换。
- 高价、平价、低价参数校验和点位映射正确。
- Extra Charge 的买卖电公式与单位正确。
- 自动生成计划连续、无重叠、不超过 24 段。
- 修改高级参数会重算今明计划，不改已过去时间段。
- 当前时间段修改时正确切分旧计划和新计划。
- 国家/地区不支持时只能使用 Manual Mode，且不会产生虚假 dirty。
- 电站位置变化时提示和 Manual 回退符合第 7.11 节。

## 12. 已落地范围

1. 共享 ToU 模型、时间粒度、时间段编辑器和 24h Overview。
2. Manual 页及新增、编辑、删除、Confirm / Cancel / Save。
3. 两个同标题侧栏入口，右侧分别显示 `Manual / Dynamic`。
4. Dynamic 页基础电价图、Today / Tomorrow、刷新和无数据状态。
5. Advanced Settings 与 Manual / Duration / Percentage / Fixed / Intelligent
   五种控制模式。
6. High / Normal / Low 时间设置和对应字段。
7. 自动生成、配置变化重算和当前时间段展示。
8. Extra Charge、Automatic Export Limit、地区、时区、货币和 Save 同步。
9. Intelligent Mode 的云端决策说明，不显示本地策略字段。

## 13. 剩余生产边界

- 动态电价 API、Area 枚举、实时价格和地区能力位仍需后端提供。
- ToU 现有设备点位、参数元数据和真实写入仍需后端契约。
- Intelligent Mode 的云端算法、下发失败回退和权限仍未接入。
- 动态收益/统计仍按资料保持待定，不进入本轮页面实现。
