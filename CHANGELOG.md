# 更新记录

## 2026-11-10

- 完成规则归档（仅文档）：在 `docs/USER-REQUIREMENTS.md` 建立今日最终规则总表，收口 `.wd-page-content`、`.wd-edit-field`、标准主按钮与危险按钮、真实玻璃 switch、共享滚动、Site details 完整契约，以及当前工作树中的 Devices / Statistics 最终状态；同步修正 Site details 页面规格与组件手册中的旧 select、行高、卡片材质和 API 冲突，并在 `LESSONS-LEARNED.md` 增加对应防回归项。
- 本次归档不修改运行代码、页面视觉、交互逻辑或测试。

## 2026-11-09

- Statistics 完成 `Day / Month / Year / Total` 多周期：新增共享玻璃周期控件、前后导航、日历月 / 12 月 / 9 年选择浮层和 `statistics-period.js`。月视图比较 F2 / L3 / F3 后使用 F2 Hairline Line 展示四项每日序列；年视图比较 F1 / F2 / F5 后使用 F1 Rung Bars 的月度聚合；Total 组合八项累计指标、带金额的 L3 Savings 和独立 defs 的 L10 Self-powered。四视图常驻并仅显示当前模式，切换时使用共享 panel/chart motion token 与减少动态效果降级；新增 `verify-statistics-periods.cjs` 覆盖提交、导航、浮层生命周期、玻璃读数、Total、reduced motion 与响应式。
- 月、年 Statistics 增加 `Separate / Combined` 玻璃分段开关：Separate 保持四张小多图，Combined 在共享时间轴叠加 Home use、Solar energy、From iStorage、Grid exchange，并用线型、灰阶和橙色区分；月 Combined 为当月逐日，年 Combined 为完整年份每日序列，2026 年共 365 点。Combined 绘图区横向铺满内容列，SVG 几何非等比拉伸，日期轴标签使用独立 HTML 覆盖层；历史折线改为平滑三次贝塞尔路径，全年密集路径额外使用 7 天加权平滑且 tooltip 保持原始值。选择器内年月导航改为共享中性玻璃圆钮。统计图表入场统一改为按图并行、图内从左到右；标记微错峰 `3ms`，四图起始差约 `28ms`、总启动窗口不超过约 `110ms`，共享 chart duration 提高到 `900ms`。滚动首次揭示、周期与布局切换、点击重播共用同一 helper。
- Statistics 图表字号统一提升：玻璃浮窗标签改为 `12px / 16px`、数值 `13px / 17px`；History 轴、Combined 图例与日期轴统一 `12px`；Self-powered 来源名提升到 `11px`，Savings 可见金额提升到 `12px`。年图移除柱顶常驻峰值数字，History 浮窗整体上移，Combined 四项读数改为两列摘要并停在绘图区上方。Self-powered 浮窗通过更紧凑的横向内距与更大的上移距离继续避开扇区和外置标签。
- 新增 Plants `Site details` 本地交互预览与 `/plants/:id/site` 深链接。页面提供基础信息、电价、属主、安装商、图片和访客资料；正文顶部放置玻璃 Edit / Cancel / Save changes，桌面使用两列等宽设置页卡片，卡片无描边无阴影、行分隔低对比，告警使用真实玻璃 switch。编辑态保持卡片和右侧控件几何不变，输入 focus 改为更亮中性填充与浅中性轮廓。保存只保留在当前 Plants 页面会话，未保存修改会阻止静默离开；图片、属主、访客、删除和后端写入保持明确预览边界。新增 `docs/SITE-DETAILS.md`、共享 `createToggleSwitch()` 与 `tests/verify-site-details.cjs`。
- Site details 模块标题提升至 `15px`，移除 Plant ID，数字输入隐藏原生步进器，五个下拉字段改用共享 Glass Surface 选项浮层；Save changes 恢复蓝色主按钮，Danger zone 使用淡红背景。详情视口隐藏原生滚动条，滚动反馈监听内容变化，编辑态不会因第二条滚动条出现而移动卡片。
- Site details 的 Save changes 进一步对齐 Home 日期选择器 Apply：使用相同文本按钮类路径、无额外图标且始终可用，无修改时安全退出编辑。下拉箭头改用通用 `asset-14.svg`，Delete plant 增加轻微红色玻璃底，编辑态所有输入值、单位和下拉当前值统一为 14px。
- 删除 Site details 底部 `Local preview · Changes stay in this browser tab and are not synced.` 提示及其无用样式。
- 新增共享 `.wd-page-content` 与 `--wd-page-content-max:1000px`；Site details 宽屏改为居中有限内容列，两列卡片仍撑满该列，后续非全屏设置/详情页面可直接复用。
- Site details 顶部标题改为电站名，编辑态在原位输入电站名；Basic information 删除重复 Plant name 行，标题行高度保持不变。
- 删除 Site details 标题下方的页面说明文案。
- Site details 标题编辑器改为默认高 `44px`、最宽约 `760px` 的自动增高文本区，超长电站名自然换行并向下生长；短标题进入编辑仍保持标题行整体高度稳定。
- 共享开关轨道直接复用标准玻璃按钮材质；关闭态使用可见的共享中性控制填充，开启态替换为蓝色玻璃，保留白色滑块并避免内部白光过强。
- Delete plant 改为复用 Save changes 的标准玻璃胶囊按钮路径，只把玻璃填充和描边替换为纯红色，文字固定白色。
- 补充 Delete plant 的 hover / focus 红色覆盖，避免共享 primary 按钮样式把危险操作在交互时变成蓝色。
- Plants Overview 将 Energy trend 与 Statistics 上下交换，DOM、桌面网格、2×2 和单列顺序一致。趋势模块保留标题、模式切换、Today 控件和网格线，三条数据折线通过 `is-line-hidden` 全部隐藏；回归新增模块顺序和折线不可见断言。
- Statistics 增加图表内部材质：Self-powered 中性径向底盘加上底环/数据环共享的左上亮、右下暗中性渐变描边，`16px` Savings 轨道渐变与颗粒，Energy 双层顶点辉光，Current state 胶囊颗粒与横向扫光。Current state 去除描边和全部阴影；Savings 左端点提高到 `#a6a6a6`。玻璃浮窗保持原样并位于图表材质层上方。Statistics 外层继续透明无底板，页面下方不增加存档副本；修改前实现备份到 Source 外 `Backups/plants-statistics-pre-material-2026-11-09/`。
- Energy 顶部点半径增大到约 `3.35` 并保持点列安全间距；浅色 Supply 点改为中性深灰 `#73726d`，其辉光降为低透明中性灰，消除发黑和脏边。

## 2026-11-06

- Energy 图例圆复用柱顶数据圆的动态半径，Supply / Demand 文字提高到 `12px / 600`；圆点按字体视觉基线做少量上移并与文字共用垂直中线，两组图例之间至少保留 `6px` 净空。柱顶整数改为直接舍去小数，精确值继续保留在浮窗和 `aria-label`。浮窗改为锚定整组最高柱顶数值并向上留出至少 `5px`，横向回到当前柱组并在模块边界内夹取，不能漂到其他柱组。回归覆盖实际中心误差、图例组间距、截断规则、柱组归属和顶部数值净空。
- Statistics 宽屏改为七列 `窄 / 弹性间隙 / 宽 / 弹性间隙 / 窄 / 弹性间隙 / 宽`：窄内容 `clamp(176px,11.8vw,205px)`、宽内容 `clamp(289px,calc(27.2vw - 119px),720px)`、三条 `minmax(32px,1fr)` 间隙等宽。Energy 从内容区左缘开始，Current state 在右缘结束，首列不再残留居中空白。
- Energy viewBox 裁为 `0 0 228 116`，Self-powered 裁为 `34 0 206 116`，标题与实际内容左缘对齐。回归新增首列贴左、两组成对等宽、三个可见间隙全相等以及超宽屏内容与间隙同步增宽断言。

## 2026-11-05

### Statistics 结构间距

- Savings 按 Figma“统计”画板重绘为响应式胶囊轨道：标题和总额改用 `total: kr 12.48` 的次级文字层，四行标签位于框内，6px 灰轨按真实金额比例伸展，起始圆点与空心/实心末端标记形成新状态语义。固定比例 SVG 改为铺满统计组宽度的 DOM 轨道，保证四列、2×2 与窄屏下右缘和总额对齐。
- Savings 行框描边加粗到 `2px`，标签提高到 `12px / 400`；数据轨道与右端圆点同步放大到 `15px`，左端 `11px` 状态点通过整数定位完整包在轨道内。两端改用内联 SVG circle 消除小圆锯齿，右端描边在 SVG 内部绘制且无阴影；深色轨道与空心内部统一为 `#4d4d4d`、浅色按主题派生，轨道右端平切并藏到端点下方。最短轨道保留 `24px` 宽度，端部净空和最大值右侧留空继续受控。
- Savings 行框描边降到前景色 12% 透明度，hover 不再提亮；Savings 浮窗精简为只显示金额数字，完整标签和金额仍保留在 `aria-label`。
- Savings 浮窗补充回 `kr` 单位，保留仅有金额的简洁表达。
- Energy 宽屏首列收至 `0.9fr`，图例和第一组数据左对齐并保留约 `8px` 内缩；柱下横线删除，双值浮窗固定在柱组上方、保持在模块边界内，并以 `10px` 分类名和两行 `11px` 数值呈现。
- Self-powered 底扇区在深浅主题中进一步减淡，浅色花瓣改用更清楚的三级灰阶；百分比与来源名分别回到 `14px / 10px` 两个层级，完整扇区可 hover，浮窗仅显示 kWh 并跟随鼠标。
- Savings 深色主题左端点从 `#6b6b6b` 提亮到 `#7d7d7d`，保持与轨道的层级差并提高背景辨识度。
- Statistics 标题行不再紧贴内容区，两者固定保留 `20px`；顶部标题行与下方内容带采用统一内部网格，取消原先按块级自然流排布造成的零间距。
- 统计模块顶部分隔线到标题、内容带底部到 Energy trend 顶部分隔线都保留 `22px` 净空；内容带四组统一填满可用高度，图表容器与各自组底对齐。
- `901–1450px` 的 2×2 内容改为伸缩行，不再使用固定 `139px` 组高；`≤900px` 继续回退为两列、`≤560px` 单列，并保持标题到内容 `20px`、内容底到趋势模块 `20px`。
- 四个统计组标题统一从主文字色降到 `Labels/Secondary`，比 `Statistics` 总标题淡一档；字号、字重、布局和 Savings 总额均不变。
- Savings 行标签提高到 `12px`；灰色底轨与白色值线、端点统一到同一 Y 中心，四行 visual pitch 增至 `28` 个 viewBox 单位，提升可读性和纵向呼吸感。
- Savings 总额不再按标题行最右缘排布，改为与图表轨道共同的右端点精确对齐；窄桌面 2×2 下若 hover 浮签会压住总额，浮签自动翻到对应线条下方。
- Savings 灰色底轨线宽从 `1.4px` 提升到与白色值线一致的 `2.2px`，透明度从 `.7` 降至 `.45`，保持同粗细但更轻的视觉层级。
- Self-powered 按用户提供的 Lupi F4 Tick Donut 参考重绘：沿用 `templates/basics-gallery.html` 的 B4 骨架，100 个刻度、每 10% 内圈点、外圈来源标签与虚线引导均保留；移除环上图标，来源按占比降序着色。最终表盘半径增至 `44`、使用 `270×116` 画布使外缘贴近内容区上下边缘；圆心文字全部删除，来源标签改为句首大写并与 Savings 行标签统一为 `12px / 600`。
- Current state 从 F1 Rung Bars 改为无图表的状态列表：四行分别显示 Battery / Grid / Home / Solar 和常驻 kW。胶囊使用黑白灰四档，最亮一档位于顶部并向下逐级变深；框内状态与功率使用 `12px / 400` 白字，列表顶部增加 `8px` 留白并与左侧统计首行中心对齐，移除图表 hover 读数。
- Energy 按 F6 Paired Rungs 重绘为四个点阵分组：Grid、Storage 各含 Supply / Demand 双列，Solar 仅 Supply，Site 仅 Demand。每个点代表 1 kWh，Supply 为前景白、Demand 为共享橙色；顶部显示四舍五入整数，底部标签和图例改为句首大写。
- Energy 分类、数值和顶部图例提升到清楚可读的小字档位；画布改为与内容区同高的 `270×116`，取消上下 letterbox，并把点阵纵向步距和点径重新配平，确保圆点不重叠、竖向数据条更高。
- Self-powered 将外圈文字和百分比替换为放大的太阳、电池、电网图标，移除图标外圈和描边；来源使用三级黑白灰，刻度长度采用确定性随机噪声。每个来源 hover / focus 时以共享缓动显示略微加粗、延长的高亮覆盖层，中心玻璃浮窗显示来源名称、百分比与 kWh，并与刻度保持不重叠。
- Self-powered 最终按参考图重作为径向花瓣扇区：每项先铺浅色全长底扇区，再叠加按绝对百分比改变半径的数据扇区，最大值也不会自动占满；两层均使用无描边的圆角路径，并通过内外同宽的 `5` 单位空隙分隔。来源名和百分比放在底盘靠外位置并使用反差文字，中心留空；hover / focus 只让对应花瓣小幅外扩，侧边玻璃浮窗显示来源、百分比和 kWh。结构采用 L10 Radial Patchwork 的扇区语法，替代此前的 Tick Donut / 外圈图标版本。
- Self-powered 底扇区降低深度：深色主题提高到前景色 28% 的浅灰，浅色主题使用 12% 的浅灰，避免底盘与页面背景混成过深的一整块。
- Self-powered 引导线改为清晰可见的三节点折线：先按扇区外缘斜向引出，再转到标签高度并使用水平尾段指向文字；标签继续全部外置并与扇区保持间距。

### Plants Overview 信息层级精修

- Energy trend 的三条横向网格线由 `1px` 收至 `0.6px`，使用非缩放描边，颜色与透明度保持不变；趋势曲线和 `2px` 模块分隔线不改。
- 主视觉预留区彻底清空可见表面：删除画布与 Energy flow 的两层径向 / 线性渐变，并移除空舞台自身的背景、边框、圆角与阴影；区域只保留透明布局占位，Operations 高度和 Statistics 起始位置不变。
- Statistics 的 hover / focus 读数统一挂载共享静态 Glass Surface（`.wd-glass--surface`），不再使用图表局部半透明底；读数根据当前行真实线条位置动态上移，Savings 采用单行标签 + 金额，左缘与线条起点对齐并保持 `6px` 间距，不覆盖线条、标题或右侧总额。文字放进独立内容层，避免切换读数时误删玻璃材质。
- Savings 行标签改为句首大写、11px 字号，增加 `1px` 光学下移后与 lollipop 水平线中心对齐；四行 pitch 从 `23` 增至 `26` 个 viewBox 单位，在 1519px 视口实测约 `23px`，行底轨提高到 1.4px、70% 可见度。
- Savings 的 L3 Barcode Lollipop 改为每条收益独立浅色底轨，移除整块纵向网格；最长条目使用实心端点，其他条目使用空心端点，四个端点统一放大。
- Statistics 接入 `lieflat-charts`：完成 Lupi Editorial 与 Basics 候选审计后，分别采用 F6 Paired Rungs、L3 Barcode Lollipop 横置版、F4 Tick Donut、F1 Rung Bars；淘汰 L2、L14 与 F12，未使用 Glance。新增 `statistics-charts.js`，全组改为黑白灰 Mono；梯档、lollipop 与刻度加粗，Energy/Savings/Self-powered 数值默认隐藏并在 hover / focus 时显示，Current state 默认保留文字状态与 kW。
- Statistics 四组改为严格等宽，使用统一 `20px` 标题行和正文起点；宽屏四列，`901–1450px` 改为 2×2 组网格。Energy 用 `3×2` 方向化指标表达购售电与充放关系，Savings 使用总额、四行来源收益和比例条，Self-powered 同时显示 kWh 与来源百分比，Current state 将状态与功率合并为语义胶囊。Self-powered 分项电量暂由本地家庭用电量与来源占比派生。
- 保留 Energy flow 空舞台，作为后续内容预留区，不提前填充设备节点或示意数据。
- 站点上下文拆为 System status 与 Site environment 两组；宽屏左右分布，`901–1450px` 两行两列，窄屏顺序展开。
- Statistics 统一 12px 标签和 15px 数值；Savings 改为总额加 8px 比例条和来源列表，Self-powered 环图增加中心百分比，BMS / Heater 单行摘要压缩到 136px 并居中。
- 宽屏设备轨与运维栏调整为 `152px / 284px`，列距 `20px`；Operations 三卡统一标题行与正文区，增加 Fault code 胶囊、Ticket 行 hover 和带状态点的 LIVE。
- Energy trend 建立 2.4px 主线与 1.5px 比较线层级，并使用非缩放描边；浅色 Overview 内容辅助文字在页面范围内提高可读性。

### Energy trend 切换精修

- 模式开关 hover 移除第二层圆角背景，只保留文字提亮与整体缩放。
- 分段选项改为 flex 水平、垂直居中，并对标签做 `translateY(-0.5px)` 字形光学校正，消除实际墨迹相对胶囊中心偏低的问题。选中胶囊移除内描边，上下各内缩 `4px`，左右铺满当前选项以消除相邻项之间的额外空隙；外框左右保留 `4px` 内距。占位标签改为 `All / Default / Battery / Frequency`，选项按文字内容自适应宽度，左右内距 `18px`、相邻项间距 `0px`，指示层按实际选项位置和完整宽度平滑移动。
- 移除 Plants 专属分段开关类及两处页面级宽度覆盖；默认尺寸、间距、圆角、字形校正和响应式最大宽度统一收回共享组件 CSS 变量。
- 趋势切换抽为共享 `createSegmentedControl()`，补齐键盘方向键、禁用项跳过、ResizeObserver、快速连续点击动画续接和销毁清理；页面只保留选项及业务回调。
- 保留两个占位项和独立 `Today` 周期按钮，日期浮窗继续复用 Home。
- Statistics 与 Energy trend 只在各自顶部保留一条 `1px` 横向分隔，移除四周描边、圆角外框、底部线和实底；四边内距统一为 `16px`，趋势内容改为 grid 正常流，窄屏分段控件在组件内自动收紧内距。
- 移除 `Energy flow` 标题，仅保留右上角 `LIVE` 与空容器；移除 Energy trend 图例、纵轴刻度和底部时间范围文字，曲线与模式切换继续保持联动。
- Operations rail 改为三卡等高均分并直接复用 `.wd-discussion-card`；Fault 移除 `Clear`，System Log 移除内部终端框，Service Tickets 的 36px 玻璃加号移动到标题行。
- 三卡可在当前工作区标签内进入 `/plants/:id/faults`、`/logs`、`/tickets` 占位页；面包屑增加第三层，URL 支持刷新、历史与 `device` 参数。
- Operations rail 上移并与上下文条同顶；三卡文字提升到 `12–14px`，Ticket 加号修正为正圆。
- 多级面包屑取消父级负左边距，电站名与 Overview 对齐、hover 胶囊不再覆盖箭头，收藏按钮在子页继续显示。
- Operations 三卡标题行统一 `36px`、标题上/左内距 `12px`、标题与内容间距 `20px`；Ticket 正圆加号固定在右上 `6px` 内距。
- Operations 三卡左右内距由 `12px` 增至 `16px`，上下 `12px` 与其余几何保持不变。
- 电站子页隐藏 section tabs，空白占位改为完整正文视口居中；父级面包屑保留左右对称 hover 内距，收藏以负外边距紧贴电站名且不覆盖箭头。
- Operations 三卡标题回调为 `13px / 590`，正文与日志字号保持不变。
- 删除 Energy flow 标题 / LIVE 行，让空舞台铺满；Plant context 移除背景与圆角，仅保留四项信息。
- Operations 标题改为 sentence case；移除空 Ticket 的 `None`；无故障与空工单状态居中；日志改为可换行、无省略号的等宽代码排版。
- no-fault 组保留原图标+文案排列并整体上移 `6px`，Ticket 空态同步上移 `6px`。
- System Log 改为无固定列宽的连续代码行，长消息从下一行最左侧续排并保留三级颜色；增加占位行与共享内部滚动。
- 下半区行间距增至 `16px`，Statistics 上下内距增至 `20px`，趋势图底部内距归零；模块分隔线改为 `2px`，折线扩展至约 94% 图表高度。

## 2026-11-04

### Plants Overview 详情首版

- `/plants/:id` 从占位升级为 Living Field 连续画布，默认显示设备第一项；多设备可切换并同步 `?device=`，单设备自动隐藏切换轨。
- 页签改为导航下方胶囊并复用 Service Ticket 的共享 `.wd-scope-button`：36px 高，未选中为无描边实体填充，选中使用共享内描边；标签行复用 Service 工具栏的上 `16px` / 下 `14px` 留白；移除标签组底线。详情左右内距 32px，统计、趋势图和图例横跨整行，画布填满可用高度。
- 三个范围页签统一 hover 状态；`Devices / Site details` 保持禁用、不可跳转，但同样提供共享颜色反馈。
- 范围页签补齐整体缩放：hover / focus `1.045`、按压 `1.09`；Plants 禁用页签也使用同样视觉，但移除通用禁用态的透明度覆盖，静止文字与 Ticket 未选中项一致。
- 新增横向站点状态、动态设备统计和 Power / Energy 趋势；逆变器默认显示 `Statistics / Today` 天视图，集中展示 Energy、Savings、Self-powered、Current state。站点状态恢复运行状态、通信、天气、地点与本地时间四项，并在窄桌面使用两行两列。`Energy flow` 当前按批注只保留标题与空容器，内部设备、节点、连线、读数和圆环全部移除，后续重新设计后再接入。右侧明确分为 Fault & Warning、System Log、Service Tickets，告警直接显示设备上下文和错误码，日志恢复精确时钟与可读事件列，工单标题最多两行。
- 详情材质按交互语义收口：玻璃只用于可操作控件，Power / Energy 与 New ticket 使用共享玻璃按钮；状态条、统计面板和 Operations 内容卡使用普通实体表面。右侧 Fault & Warning、System Log、Service Tickets 拆成三张独立卡片；移除 Energy flow、运维分组、统计列和趋势区之间不必要的边框，使用留白与分组标签建立层级。设备轨、主列和运维栏改为 `160px / flex / 272px`，统计与趋势横跨整行；移动端改为单列 Flex 流，修复内容重叠和裁切。
- `Energy trend` 改为 36px 玻璃分段开关，增加两个占位选项验证滑动效果；整体与选项均有 hover 放大和光效。`Today` 拆回独立周期按钮，复用 Home 的日期选择器、预设、Apply 和玻璃样式。
- 页头收藏按钮与标题间距收紧为 `4px`，图标下移 `0.5px` 做光学居中；收藏不使用玻璃底缘。外层按钮保持静止，只让内部图标围绕中心放大：hover / focus `1.28`、按压 `1.38`，修复缩放时向右漂移的观感。
- 收藏复用 Plants 列表存储；关联工单可打开已有 Service Ticket；Devices 与 Site details 保持禁用。新增 `verify-plant-detail-overview.cjs`。

### Plants 状态图标恢复

- 修复 Plants Status 列中 Normal / Attention 图标消失的问题；两者重新显示为绿色勾选和红色警示，Unbound 的灰色符号保持正常。
- 原因是共享 `createMaskedIcon()` 迁移后漏挂 `.plants-icon` 基础绘制类；已补齐并增加实际遮罩、语义背景色和 14×14 尺寸断言。

## 2026-10-30

### Plants 深色筛选条与表头

- 深色已应用筛选条改用 `Backgrounds/Tertiary Elevated` 的 `#3A3A3C`，解决左侧与斜向渐变面板融为一体、右侧才有边界的问题；浅色纯白条带不变。
- 表头拆为数据滚动区外的独立同步表格：表头列宽和横向位置实时匹配表体，深色背景透明、滚动行不会再进入表头，移除实色矩形与 `backdrop-filter` 模糊带；浅色表头继续使用主面板底色。
- 回归同时断言深色筛选条计算色、表头透明且无背景模糊，并保留浅色条带白底和表头同面板色的既有断言。

### 共享头像缩写尺寸分档

- 24px Service Ticket 卡片作者头像的缩写从 11px 收紧到 `9px / 10px`。
- `createAvatar()` 现在按直径统一选择 `compact / small / regular` 档位：22–24px 为 9/10，25–32px 为 11/13，33px+ 保持 14px。
- 移除 Properties 作者头像的页面级字号覆盖；28px 评论头像和 36px 账户头像尺寸、字号、描边、阴影及 0.5px 光学下移均保持不变。

### Service Ticket 浅色 hover 点阵恢复

- 修复浅色卡片白色点阵与 `#EDEDED` 表面对比不足、且边缘继续淡出后底部几乎不可见的问题。
- PixelCard 增加独立深色与浅色 palette；Service Ticket 深色继续使用白色点阵，浅色改用共享 `Labels/Secondary` 的 `rgb(60,60,60)` 深色 ink。
- 点间距、展开时长、默认透明、离开清理和 FlipCard/编号扫光逻辑均未改变；回归新增浅色 ink 颜色与卡片下半区 alpha 断言。

### 项目整合与标准入口

- 以当前未提交工作树为基线建立 Source 外部完整快照，并记录 SHA-256 与恢复路径。
- 新增项目总索引 `docs/PROJECT-MAP.md`，统一新对话阅读顺序、路由边界、标准选择、记录职责、工作流和验收入口；详细视觉参数继续只由 `DESIGN-SYSTEM.md` 维护。
- 新增共享语义文本与时间节点工厂，扩展标准按钮和遮罩图标工厂；Plants、Service Ticket 与日期选择器改用同一实现，删除页面内重复 DOM 逻辑。
- 移除日期按钮旧兼容类、停用的 popover/toast token、无引用提及工具与无用状态字段。
- 本轮不改变页面视觉、布局、路由与交互，验收结果见 `docs/PROJECT-STATUS.md`。
- 验证：77 个 JavaScript 文件与 76 个运行 JS/CSS 文件检查通过，完整 18 个浏览器套件通过；125 个运行资产 0 缺失 / 0 闲置；生产构建 213 个文件 / 1.65 MB；连续同步生成结果稳定。
- 清理 1393 个可再生的探针截图、测试输出、旧 `output/` 和本地 `dist/` 文件（约 161.97 MB）；正式源码、固定基线与设计来源保留，整理前快照覆盖全部被清理内容。

### 浅色主题中性灰层级

- Service Ticket 一级回复卡内的 `Leave a reply…` 编辑器只在 hover / focus 时点亮占位文字，左侧头像保持默认填充、缩写色、描边与阴影。
- 新增共享时间格式化模块：7 天内按秒、分钟、小时、天显示相对时间，达到 7 天后回落到本地 `YYYY/MM/DD HH:mm`；Plants、Service Ticket 卡片、评论和 Properties 全部改用该规则，原始时间仍用于排序并保留为 `title` / `<time datetime>`。
- Service Ticket 详情 Properties 将票号作为属性列表第一项，`Ticket ID` 标签在上、票号胶囊在下；列表卡片和属性栏共用 `ticketNumberPill()` / `.service-card-number`，属性栏只把高度与内距收紧到 `20px / 7px`，未发布草稿不显示占位编号。
- 新增共享 `createPageHeaderAction()` / `.wd-page-action`。Plants `New plant` 与 Service Ticket `New ticket` 改为 28px 轻量文字动作，默认透明无玻璃，hover / focus 仅显示浅灰胶囊；36px 标准按钮体系保持不变。
- 共享搜索字段的放大镜默认色由 `Labels/Primary` 改为 `Labels/Secondary`，hover / focus-within 再转 Primary；Plants 继续直接使用 `createSearchField()`，没有页面私有图标覆盖。
- Plants 顶部完成层级收口：已应用筛选条使用 `Backgrounds/Tertiary` 实底，浅色为纯白；固定表头与浅色主面板同色，工具栏和表格主体透明。搜索字段提高到表头之上绘制，避免后续表面覆盖玻璃投影而产生浅边。
- 浅色运行 token 去掉中性表面、文字、填充和分隔线中的冷蓝色偏；页面画布最终为 `#EDEDED`，右侧共享工作区面板为比参考工具右区略深的 `#F7F7F7` 平面灰，不再使用纯白到浅灰的渐变。
- Home 的 Period statistics 统计卡与下方业务卡仅在浅色主题使用纯白底；上方玻璃状态卡保持中性玻璃。深色主题全部保持原样。
- 浅色工作区面板隐藏内外描边；双层接触阴影最终收紧到 `2px / 4px` 并略加深为 `.035 / .05`，保留 10px 连续曲率。深色内描边与阴影不变；玻璃普通层与浮层 tint 分别改为中性 `rgba(238,238,238,.74)` / `rgba(234,234,234,.44)`。
- 新增共享 `animateContentHeight()` 与 `--wd-motion-content-grow` / `--wd-ease-content-grow`（`280ms`）。Service Ticket 回复框和工单正文随内容生长，连续输入从当前可见高度继续；首次渲染与减少动态效果立即落位。
- Service Ticket 超长回复输入接入共享非弹性滚动反馈，隐藏原生滚动条并显示 `10px` 轨道；独立回复框和楼内编辑器均由滚轮优先滚动文本，到边界后才交还外层页面。
- Service Ticket 标题编辑由单行 `input` 改为自动增高 `textarea`：超过 `760px` 内容宽后自然换行并向下生长，无横向裁切或内部滚动；Enter 不插入换行，粘贴换行归一为空格。展示标题复用相同宽度与换行规则。
- Service Ticket `POSTER` / `YOU` 徽标改为实底白字：`POSTER` 使用共享黄色 Accent，`YOU` 使用共享蓝色 Accent；深浅主题下文字均固定为白色，徽标尺寸和字体行盒不变。
- Service Ticket Properties 的 22px 作者头像缩写由 11px 收紧为 `9px / 10px`，头像尺寸与共享光学居中不变；评论回复的 28px 头像未调整。
- 共享滚动反馈新增 `--wd-scroll-feedback-thumb-color` / `--wd-scroll-feedback-thumb-hover-color`。Service Ticket 超长回复输入改用全局滚动条颜色，修复浅色主题下内部轨道明显深于页面主滚动条的问题。

## 2026-10-29

### Service Ticket 本地交互预览

- 修复浅色主题实心蓝主按钮 hover 时文字变黑的问题：共享 `control-states.css` 为主按钮保留蓝底白字覆盖，Publish / Apply / Save 等所有主按钮在默认、hover 和键盘 focus 下保持一致。
- Service Ticket 回复输入升级为 `contenteditable` 段落输入：继续使用 SF Pro / `Subheadline/Regular` 的 15px / 400 / 20px / -0.23px，Enter 创建段落、Shift + Enter 创建段内换行，段落额外 `6px` 上距；输入态和发送后的正文共用相同段落间距，不再把段间距等同于行距。
- 回复输入拦截富文本粘贴，只读取并清洗 `text/plain` 后重建普通段落与段内换行；来源 HTML 的颜色、字体、字重、字号、链接和布局不会进入编辑器。
- 浅色模式 Service Ticket 仅在列表卡片、空态和详情内容区提升次要文字可读性：Secondary / Tertiary 为约 70% / 55% 主文字黑；页头、工具栏和共享搜索框保持全局 token，不再继承内容区的加深值。`Reply to this thread…` 默认提示使用约 45% 主文字黑，全局 token 与深色主题不变。
- 共享 36px 圆钮 hover / focus 时让内部图标与玻璃外壳同时放大：图标 hover `1.06`、按下 `1.12`，发布箭头实测视觉宽度由 16px 增至约 18.42px，布局盒仍为 16px。Service Ticket 的附件、取消、发送和三点圆钮同步生效。
- 新增 `/service` 工单卡片列表与 `/service/:ticketId` 可刷新详情；Ongoing / Closed 混排为桌面 3–4 列轻量窄卡，列表通过共享 `createPageHeader()` 复用 Plants 页头与中性玻璃 New ticket。工具栏最左为状态筛选，短竖线后为 All / Mentioned me / Created by me，搜索靠右；卡片使用等宽编号胶囊、右上状态和纵向信息层级。
- `New ticket` 在新工作区标签打开 `/service/new`，直接进入详情同构编辑态并聚焦标题；发布后当前标签原地切换为稳定工单详情，取消则关闭新标签回到来源列表。已有工单的标题/正文编辑与回复创建/编辑仍在最终展示位置原位切换，不使用弹窗。
- `New ticket` 改为与详情一致的双栏：标题、正文、附件和右对齐操作保留在左列，右侧新增同构 Properties，展示 Status / Plant / Author / Created / Last activity / Replies；Plant 改为 Properties 内的搜索选择浮窗，复用 Plants 公司筛选二级浮窗的 288px 内胆、玻璃搜索、行样式、选中标记和共享滚动反馈。
- 详情采用正文与 Activity 在左、Properties 在右的布局；正文收紧为 15px 常规字重，Activity 改为留白更充足的细分隔线，附件缩为无大小信息的短标签；支持一层楼中楼、Oldest / Newest、POSTER / YOU、关闭与重开、返回来源列表和完整最近访问路径。
- 支持访问范围内的提及候选和本地附件预览；所有写入只保留在当前页面会话，未声明真实上传、权限、持久化或通知。
- 新增共享 `components/page-header.js` / `.css`，Plants 与 Service Ticket 通过同一个 `createPageHeader()` 生成标题行、动作区与全宽分隔线，位置和控件尺寸一致。
- 新增 `components/pixel-card.js` 原生 Canvas 适配层。Service Ticket 卡片默认保持平面、无描边、无重投影和无静态点阵；只有指针 hover 时按附件参数从指针位置展开低透明度像素与微光，离开后淡出并清理。卡片编号改为低对比中性胶囊，摘要分隔线改为双主题可见的 `Separators/Non-opaque`，头像缩写改为 11px / 400 并收紧与姓名的间距。
- 新增 `components/flip-card.js` 原生交互适配层。Service Ticket 卡片增加指针倾斜、1.03 hover 抬升、跟随反光和拖动回弹，采用 `tiltMax 12 / glareOpacity .22 / perspective 1100 / stiffness 170 / damping 20`；不增加描边或重投影，点击仍打开工单，拖动不会误触，减少动态效果时保持静态。
- `--wd-card-hover-shadow` 暂作为后续显式启用的共享 token 保留；Service Ticket 当前 hover 背景高亮和阴影均关闭，只保留像素纹理、倾斜与反光。列表滚动视口仍为左侧和顶部预留 hover 缩放空间，卡片内容线与右侧对位保持不变。
- 工单编号胶囊新增一次性的斜向扫光：每次指针进入只播放一轮，从左上向右下经过，使用共享 `680ms` 时长与 sheen 缓动，结束透明且不循环。
- Service Ticket Properties 改用与一级讨论卡相同的主题表面，顶部与工单标题对齐并从滚动第一帧保持固定；详情操作入口移入工单标题行，使用 36px 中性玻璃圆钮与居中的 18px `asset-70.svg` 三点图标，右缘与主内容列对齐。范围按钮接入共享 `.wd-press-scale` 的 hover / press / release 深度反馈。
- Breadcrumb 分隔箭头改为左右各 8px 视觉间距：列表 gap 归零，由父级右内距和当前项左内距对齐。
- Breadcrumb 箭头首帧改用 `masks/asset-14.svg` 不透明面具，并统一为父级同样的 Labels/Secondary 灰色，消除刷新时先暗后亮的中间态。
- Service Ticket 范围按钮选中态提升为中性 Fills/Primary；184px 卡片保持高度不变，标题上距增至 18px，Footer 与分隔线上下间距各收紧 2px，底部内距收到 16px。
- `All / Mentioned me / Created by me` 统一为 36px 高，与左侧 `All status` 对齐。
- 回复编辑器按 Linear 参考收口：Activity 顶部独立空态约 100px，移除姓名标题行，改用单行起步、最高 180px 的自动增长输入框；右下仅保留 36px 玻璃回形针与发送圆钮，空内容禁用、有正文或附件后切换为共享主按钮。一级讨论卡内回复区使用 28px 头像和透明内容列，不再额外铺高亮背景。
- 讨论卡内部分隔线基于 `Separators/Non-opaque` 再降低透明度；Status 属性行移除额外底部空白；楼内回复占位头像改为 28px，占位文字与评论正文共用同一条左缘。
- 工单详情内容区顶部留白由 24px 增至 72px，扩大标题与共享页头之间的呼吸空间；列表和共享页头保持不变。
- Properties 的 Status 行移除底部细分隔线，让状态与后续属性只通过间距分层。
- 顶部评论输入框改为持续展示的独立草稿，不再因打开楼内回复或编辑回复而消失；评论草稿与楼内草稿分离，切换编辑状态时不会丢失。新增共享 `wd-discussion-card` 表面，并在顶部评论框、全部一级回复卡和 Properties 中统一使用：18px 连续曲率圆角、1px 内描边和贴边高浓度、外侧快速衰减的零位移双层阴影。占位文字 / 编辑正文继续统一绑定 `Subheadline/Regular`。
- 浅色主题下 Service Ticket 顶部独立回复编辑器、全部一级回复卡与右侧 Properties 统一改为纯白 `Backgrounds/Primary` 平面，移除共享 `wd-discussion-card` 的 1px 内描边和全部外侧投影；18px 连续曲率保持不变。深色主题继续保留原共享表面，真实 Chrome 计算样式和截图已验证。
- Service Ticket 回复内部垂直间距连续收紧：头像行到正文 `8px → 6px → 4px → 0px`，楼中楼组间 `16px → 14px → 12px`，楼中楼内部上下 `14px → 12px → 10px`；回复入口与内联编辑器行高 `58px → 53px → 49px`、外距 `12px → 10px → 8px`、上下内距最终 `10px`，头像实际上下留白 `11px / 10px`。展示态和编辑态共用同一组值，操作按钮仍保持整行垂直居中。
- placeholder 的颜色过渡纳入共享 `motion.css`，进入 / 离开分别继承 `240 / 360ms`；楼内回复文字按实际行盒中心重新校准到 28px 头像中心。
- Service Ticket 评论区按“正文分割线 → 常驻回复框 → Activity 标题与排序 → 回复卡列表”重排；排序按钮新增向下箭头，复用 `asset-14.svg` 旋转 90°。
- 一级回复卡中的 `Reply to this thread…` 入口移除卡片底部额外内距，入口行 58px、上下各约 15px；展开楼内编辑器时保持同样比例。
- 评论区排序按钮改为与 Activity 标题底部对齐，并在排序文字与向下箭头之间增加 6px 间距。
- 面包屑父级链接的 hover / focus 背景由 6px 矩形圆角改为完整胶囊，文字、箭头和路径间距保持不变。
- 回复楼层移除独立 `Reply` 操作，自己的回复改为 hover 时渐显的 36px 三点玻璃圆钮；共享菜单只含 `Edit / Delete`，编辑原位执行，删除弹窗确认，指针离开后渐隐。楼内编辑文字同步上移 1px 做光学居中。
- 回复操作的发布图标改为独立 16px 向上箭头，不再旋转 14px 导航箭头；原位编辑的 X 取消图标由 14px 收紧到 10px，两个 36px 玻璃圆钮因此具有接近的笔画厚度与视觉体量。顶部回复框、楼内新建回复和原位编辑全部同步复用该发布图标。
- 共享 `wd-menu` 增加无标题规则：`mountMenu()` 自动添加 `.wd-menu--no-heading`，使菜单顶部与底部内距均为 10px。
- 正文与评论区之间的分割线上下留白翻倍：上方 84px、下方到回复框 40px。
- Service Ticket 原位编辑回复时保留作者、角色徽标、时间和卡片底部回复入口，只替换正文区域，卡片不再收缩；排序文字与箭头作为同一视觉组同步下移。
- Service Ticket 自己的回复三点操作容器接入共享 `.wd-hover-reveal-host` / `.wd-hover-reveal`：透明度进入 `240ms`、离开 `360ms`，修复按钮子节点已有共享动效但父容器仍瞬间显隐的问题。
- Service Ticket 本人回复原位编辑改为稳定几何：作者行固定 `36px`，正文与单行编辑器共用 `20px` 行盒，进入编辑时卡片高度、内容位置、底部分隔线和回复入口不再跳动。
- Ticket actions 菜单移除可见标题，仅保留 `aria-label="Ticket actions"` 语义，并自动采用共享无标题菜单的上下各 `10px` 内距。
- 评论区排序按钮保持文字位置不变，改为文字、向下箭头和 hover 背景共用同一垂直中心线。
- 共享头像将缩写放入 `.wd-avatar-label` 并下移 `0.5px`，修正字体基线造成的上浮；头像尺寸、描边、阴影和布局不变。
- 回复原位编辑在附件与发送之间增加 36px 中性玻璃 Cancel 圆钮；点击丢弃草稿并恢复原回复，三按钮共用同一中心线且不改变卡片几何。
- Service Ticket `POSTER / YOU` 徽标文字缩小为 `10px / 12px` 行盒，徽标高度及作者行布局保持不变。
- Service Ticket Properties 改用与一级讨论卡相同的主题表面；吸顶偏移按正文顶部初始位置动态计算，详情滚动时从第一帧即保持固定。
- 共享 `page-header` 改为面包屑单一路径，不再保留单独页面标题分支；Plants、Service Ticket 列表和详情都固定为 40px 高并使用同一垂直中心，页面顶部空档由 12px 收到 8px。单级和多级目录均使用 14px / 510，分隔由 `>` 文本改为复用顶栏 `asset-14.svg` 前进箭头，父级 hover / focus 改为 6px 圆角浅灰底，移除文字下划线。
- 新增 `verify-service-ticket.cjs` 并接入 `npm test`，覆盖卡片等高、筛选、原位新建、提及、附件、详情排序、回复/编辑、关闭状态、响应式截图与错误监控。
- 当前结果：72 个 JavaScript 文件通过静态检查；完整 `npm test` 16 个套件通过；`build:site:public` 输出 209 个文件 / 1.6 MB；124 个运行资产全部可达。

### Plants 筛选、可视性、详情与反馈

- 筛选重构为 Company / Device / Connection / Running status 四组，主面板为 `260px`，Company 条件浮窗为 `288px`，其余条件浮窗统一为 `208px` 且单行显示；二级浮窗首个选项与对应一级类目行对齐，加号入口从自身下方打开并在条件更新时保持位置。
- Company 支持玻璃搜索框、15 节点多级树和三态复选；筛选条使用设计稿语义色，唯一 `Clear` 固定右侧，最终条件短 chip、加号与 `7px` 状态点已统一。
- 列可视性改用 Eye / Eye Closed；刷新会清空筛选、恢复默认列显隐和 `Last update` 降序排序，同时保留搜索与收藏。
- 列表行在新标签打开详情，`Back to Plants` 关闭详情标签并恢复来源列表。未关联设备的电站以 `?` 作为列表名、标签名和详情主标题，整行仍可进入详情；`?` 提示说明设备尚未关联电站并引导继续 setup。
- 共享 toast 移至页面顶部并与标题中心对齐，增加轻微下落淡入 / 上浮淡出；筛选 hover 继续使用共享 `240ms / 360ms`，浮层开合使用 `320ms / 200ms`。
- 修复共享搜索清除按钮被浮层按钮样式污染、Attention 掩码受 30% 导出透明度削淡等共享问题。
- 修复 Plants 行高亮离开焦点时的直角残影：首末单元格圆角改为常驻，背景淡出过程中始终保持完整圆角。
- Plants 的 Device 数据改为可包含多个设备的集合，筛选顺序固定为 `Inverter / BMS / Heater`；表格按同一顺序组合显示为 `Inverter/BMS/Heater`。Running status 的未绑定态统一为 `Unbound`；Device、Connection、Running status 的多选都按并集匹配。

### 验证

- `npm run check` 通过，65 个 JavaScript 文件语法有效。
- 完整 `npm test` 通过（14 个套件），包含筛选/可视性、工作区标签、路由、构建配置、浮层、响应式、玻璃、主题、基础组件、动效与搜索。
- `npm run build:site:public` 通过，`dist` 198 个文件、约 1.45 MB。
- `npm run audit:assets` 通过，121 个运行资产全部可达，0 unused / 0 missing。
- 发布前完成本地 Git 收口：删除已被 `master` 取代的旧筛选分支和无新增提交的 `test` 分支，移除冗余合并前 stash；仅保留主工作区。
- Cloudflare 部署改由 `wrangler.jsonc` 启用 Workers Assets SPA 回退；`_redirects` 不再把业务路径重写到 `/index.html`，避免新版构建校验判定 HTML 后缀归一化循环。

### 工作区标签拖拽排序

- 标签支持按住后水平拖拽换位，跨过邻居时实时重排并保持指针下位置；释放后平滑吸附到最终槽位。
- 拖拽不激活被拖标签，不改变当前页面或 URL；同一次拖拽手势不会误触 click、关闭或切换。
- 溢出标签条支持边缘自动滚动；键盘可用 `Ctrl/Cmd + Shift + ←/→` 等价换位，并通过 live region 公布位置。
- 新增 `verify-workspace-tabs`，覆盖向前/向后跨多个邻居拖动、活动标签与 URL 保持、键盘换位和深浅主题截图。
- `npm run check` 通过（65 个 JavaScript 文件）；完整 `npm test` 14 个套件通过；`npm run build:site:public` 通过。

### 最近访问历史

- `Recently visited` 和左上角历史浮窗改为共享同一份跨标签访问归档；条目保存 `{route, params}`，不再把电站详情并入父级 `Plants`。
- 电站详情显示完整 `Plants / 电站名` 层级，父级和分隔符统一使用定义好的 Labels/Secondary，末级电站名使用 Labels/Primary。
- 首页行扩展到箭头前的可用宽度，历史浮窗扩为最多 `380px`，长路径可自然换行，不截断末级名称。
- 首页历史行在 hover / 键盘 focus 时使用一根覆盖完整路径的连续主色下划线，分隔符与各片段之间不再断线。

### 筛选滚动条统一

- Company 筛选浮窗改用 Plants 表格相同的共享滚动反馈，默认 `6px`、hover `8px`、圆角与拖动一致。
- Company 列表传入实际滚动内容节点并使用共享默认弹性模式；顶部下拉、底部上拉都会移动列表内容并同步缩短滑块，标题与搜索框保持固定。
- 浮层回弹空白改为透明，直接透出同一 Glass Surface，消除顶部与底部回弹时出现的明暗色块接缝。
- 公司树左侧容器内距收紧至约 `4px`、层级缩进改为 `12px`；展开按钮与复选框统一为 `16px` 方形，箭头调整为 `12px` 且两者垂直中心对齐，Company 面板扩大到 `288px`，名称与默认滑块之间仍保留约 `12px` 可见间距。
- Company 专用紧凑几何通过 `.is-company` 隔离；Device、Connection、Running status 恢复并保留标准内容内缩，不再被公司树的调宽规则带到浮窗边缘。
- Device、Connection、Running status 选项内容整体右移到约 `20px` 左内缩，选项按钮内文字再保留 `8px`，浮动选项背景同步内收；浮窗宽度和底部位置保持不变。
- 删除独立 `.wd-scrollbar` 及原生滚动条样式，并加入“需要回弹的滚动区传内容节点、无需回弹时显式关闭”的使用规则。

## 2026-10-28

### Home 路由返回

- 修复从 Plants 等页面返回 Home 时快捷入口、状态卡和统计区偶发重叠的问题。
- Home 重新可见后会在下一次绘制前重新测量绝对布局；直接深链进入其他页面再返回时也与刷新后的坐标一致。
- `verify-routing` 增加从 `/plants` 返回 Home 的分区间距回归断言。

### Plants 宽屏布局

- Plants 示例数据从 26 条增加到 46 条，使滚动条长度更接近长列表状态。
- 滚动条改为可动画的自定义滑块：默认 `6px`，hover 平滑增至 `8px` 并提亮，支持拖动；与面板右缘保持 `10px`，无实际横向溢出时不显示底部滚动条。
- 滚动条视觉轨道顶部从固定表头下方的数据内容起点开始，底部与内容底板保留安全间距；轨道自身裁切，避免拖动或亚像素舍入越界。
- 将滑块样式、拖动、上下越界弹性与回弹缩短抽为共享 `scroll-feedback` 组件；轨道底部保留 `10px` 安全留白，回弹过程中滑块同步收缩，松手后沿共享 spring 恢复。
- 列表在顶部和底部继续向外滚动时先呈现粘滞感，逐步显露最高 `16px` 的主题背景空白区，松手后以 `640ms` 共享 spring 节奏平缓回弹。
- 宽屏余量不再几乎全部分配给电站名列；`Plant name / Device / Power / Status / SN / Firmware / Last update` 的拉伸权重按面板宽度平滑过渡，右侧指标区获得更大的自适应间距。
- 1545px 紧凑布局与 1920px 宽屏布局均保持无横向滚动。

### 验证

- `npm run check` 通过，66 个 JavaScript 文件语法有效。
- 完整 `npm test` 通过（11 个套件）；`verify-routing` 覆盖 46 行、上下边界与底部留白、滑块长度与 hover/拖动、双向回弹缩短；`verify-components` 覆盖共享滚动反馈的独立挂载与销毁。

## 2026-10-26

### 路由与 URL

- Home、Plants 与各侧栏页面改用普通路径：`/home`、`/plants`、`/service`、`/statistics` 等；电站详情为 `/plants/:id`。
- 地址栏镜像当前激活工作区标签，刷新、复制链接、浏览器前进/后退不再回到首页；`/`、`/home.html`、`/index.html` 规范到 `/home`。
- 本地服务器与 Cloudflare `_redirects` 为深层路径返回 SPA 外壳，HTML 使用 `<base href="/">`；未使用会吞掉静态资源的全站代理。
- 新增 `tests/verify-routing.cjs`，覆盖根路径、列表/详情刷新、标签切换、前进后退、Coming soon 路由与未知 ID；文档新增 `docs/ROUTING.md`。

### 范围

- Plants 行点击进入 `/plants/:id`；详情视觉未立项，当前是明确的预览占位，不虚构设备数据或控制能力。
- 未接入后端、权限、实时数据或多标签跨刷新恢复。

## 2026-10-23

### 架构

- 排版运行期数据改为从 Figma 归档生成的 `src/pages/home/data/type-runtime.json`，只保留 `styles` 与 `rows`；发布产物不再携带完整设计归档。
- 工作区标签的面板关联改由页面传入：`createAppShell({workspacePanelId})` → `createWorkspaceTabs({panelId})`，共享组件不再写死首页节点 ID。
- 删除无引用的 `geometry-entry.css` / `.js`，连续圆角适配器统一由页面显式导入 `geometry.js` 启动。
- 清理已应用的过期搜索补丁、一次性调试探针和本地日志；同步架构、组件、顶栏标签和运行说明。

### 范围与验证

- 未改变首页视觉、交互、路由占位和业务数据；未引入框架、依赖、后端或新路由。
- `npm run check`、完整 `npm test`（10 个套件）与 `npm run build:site:public` 通过。
- 发布产物已检查：不再包含 `design/figma/`，首页、排版数据、字体与资产均从运行目录加载。

## 2026-10-22

### 全屏搜索

- 浅色模式降低全屏搜索遮罩不透明度与背景模糊，保留页面轮廓，不再变成平整灰面。
- 收敛浅色结果卡片的黑色投影和外沿，避免读成厚重黑底；深色材质保持不变。
- 全屏搜索与首页内联搜索共用同一份默认提示文字，不再分别维护。

### 动效

- 缩短全屏搜索退场：结果面板与搜索框各 `180ms`，错落 `40ms`。
- 背景遮罩延后 `70ms`、以 `490ms` 分段化开，内容退完后才明显变清晰，尾段不再突然消失。
- 保留已确认的 `980ms` 进场节奏；退场使用独立错落 token，不反向影响进场。

### 浮层菜单

- 新增共享菜单内胆 `.wd-menu` 与 `menu-popover.js`，`Language`、`Appearance`、`WattDesk`、`Recently visited` 统一标题、行高、悬停、勾选与尾距。
- 顶栏三个紧凑菜单统一为 `200px` 宽、`30px` 圆角；历史浮窗因路由名称较长保留 `280px`，内部结构与侧/底 `10px` 间距保持一致。
- 语言菜单补充 `简体中文`、`Deutsch`、`Čeština` 占位，仅提供本地视觉勾选；未接入本地化、持久化或新路由。
- 同步更新项目入口、设计规范、组件手册与需求记录，明确后续文本型浮窗必须复用同一套菜单结构。

### 范围

- 本次调整首页全屏搜索的材质、文案共享与动效节奏，以及顶栏/历史浮层菜单的共享内部结构。
- 语言占位只提供视觉勾选，未接入本地化、持久化或新路由。
- 未新增页面路由、后端能力或真实业务数据。

### 验证

- `npm run check` 通过，59 个 JavaScript 文件语法有效。
- `npm run build:site:public` 通过，产物 `dist/`，共 181 个文件。
- `verify-floating-surfaces` 通过。
- 已知既有问题：`verify-home.cjs` 的账户箭头颜色断言只等待 `320ms`，而共享颜色过渡为 `360ms`，会读到中间色；与本轮搜索及浮窗改动无关。
