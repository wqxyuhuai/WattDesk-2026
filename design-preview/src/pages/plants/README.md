# Plants 页面功能说明

更新：2026-11-10

适用页面：`/plants?glass=figma`、`/plants/:id`、`/plants/:id/devices`、`/plants/:id/site` 与 `/plants/:id/faults|logs|tickets`

实现入口：`index.js`、`plants.css`、`detail.js`、`detail.css`、`devices.js`、`device-identity.js`、`devices.css`、`data.js`

本文记录 Plants 页面当前**已实现**的功能、按钮行为、筛选规则、列表列、数据语义、路由与键盘交互。后续修改功能时，应同步更新本文和相关回归测试。

## 1. 页面边界

- Plants 是当前设计预览中的真实列表页，搜索、筛选、排序、列显隐和书签均在前端对本地样例数据实际执行。
- 数据来自 `data.js` 的 46 条示例电站，不代表真实账号、权限、后端查询或生产数据。
- `/plants/:id` 是真实、可刷新、可进入浏览器历史的 URL；Overview、Devices 与 Site details 均已完成本地交互预览。Devices 提供设备列表、命名、新增、替换、解绑和设置预览；Site details 提供电站资料查看、编辑、校验和会话内保存。真实后端、权限、文件上传、访客邀请、设备固件更新与硬件控制尚未接入。
- 侧栏、顶部工作区标签、主题按钮属于共享 App Shell；本文只记录它们与 Plants 页面的衔接行为。
- `New plant` 当前只显示预览提示，不会创建电站，也不会打开创建表单。

## 2. 页面结构

从上到下分为：

1. 页头：标题 `Plants` 和 `New plant`。
2. 工具栏：搜索、筛选、列显隐、刷新。
3. 已应用筛选条：仅有筛选时显示，包含条件 chip、加号与 `Clear`；条带使用 `Backgrounds/Tertiary Elevated`，深色为 `#3A3A3C`、浅色为纯白，用于突出已应用条件。
4. 列表：固定表头、可滚动数据行；表头位于数据滚动区外并与表体共享列宽/横向位置，深色透明显示父面板背景，浅色使用与工作区面板相同的底色，不使用 `backdrop-filter`。
5. 空态：没有匹配结果或没有数据时显示。
6. 详情 Overview：进入 `/plants/:id` 时替代列表区域；顶部固定复用共享 40px 页头，面包屑为 `Plants / 电站名`，下方是胶囊页签和连续能量画布。

## 3. 按钮与可交互元素

### 3.1 页头

| 元素 | 触发 | 当前行为 |
|---|---|---|
| `New plant` | 点击、Enter、Space | 使用共享 28px `wd-page-action` 轻量文字动作，默认透明，hover / focus 显示浅灰胶囊。点击只显示全局 toast：`Plant creation is a preview in this build — no plant was created`，不会新增行或进入新页面。 |

### 3.2 工具栏

| 元素 | 触发 | 当前行为 |
|---|---|---|
| 搜索框 | 输入文字 | 立即按关键词过滤列表，不打开搜索结果浮层，不需要 Apply。 |
| 搜索清除按钮 | 输入框内有内容时点击 | 清空关键词并恢复受搜索影响的列表结果；这是共享搜索字段的清除按钮。 |
| `Filters` | 点击 | 打开筛选主浮窗；再次点击同一按钮关闭。有筛选时按钮右上显示 `7px` 蓝点。 |
| `Columns` | 点击 | 打开列显隐菜单；再次点击同一按钮关闭。当前列配置与默认配置不同时显示 `7px` 蓝点。 |
| `Refresh plants` | 点击 | 刷新当前本地列表配置；动画期间阻止重复触发。完整重置规则见第 7 节。 |

工具栏中的筛选、列显隐和刷新均使用共享 `36px` 圆形中性玻璃按钮。

### 3.3 已应用筛选条

| 元素 | 触发 | 当前行为 |
|---|---|---|
| 条件 chip | 点击主体 | 当前没有额外动作；具体操作入口是 chip 尾部的关闭按钮。 |
| chip 关闭按钮 `×` | 点击 | 移除该条件并立即重新计算结果。公司父级 chip 会一次移除该父级及其所有后代条件。 |
| `Add filter` 加号 | 点击 | 在加号下方左对齐打开完整筛选面板，内容与交互复用工具栏筛选面板。面板打开后固定在初始视口位置；新增条件导致 chip 换行或加号移动时，面板不跟着漂移。 |
| `Clear` | 点击 | 清除全部筛选条件，但不清除搜索词、排序、列显隐或书签。筛选条在最后一个条件移除后隐藏。 |

筛选 chip 只显示条件文字，不显示“类别：值”的长前缀。公司父级已选中时，只生成一个父级汇总 chip，不列出全部子公司。

### 3.4 表格

| 元素 | 触发 | 当前行为 |
|---|---|---|
| 可排序表头 | 点击、键盘激活 | 切换当前列的升降序；其他列沿用该列的默认方向。 |
| 数据行 | 点击非按钮区域 | 新建并激活 `/plants/:id` 详情标签，原 Plants 列表标签保留；默认选中设备顺序第一项。 |
| 数据行 | 行获得焦点后按 Enter | 与点击数据行相同。书签等行内按钮保留自己的键盘行为。 |
| 数据行 | `↑`、`↓`、`Home`、`End` | 在行之间移动 roving focus，不打开详情。 |
| 收藏按钮 | 点击 | 切换收藏状态，不触发行跳转；已收藏行移动到列表顶部，并用共享 FLIP 动效调整位置。 |
| `?` 电站名 | 点击 | 进入该电站详情；测试和当前实现将资料未全的电站也视为可进入的电站。 |
| `?` 电站名 | hover、键盘 focus | 打开说明浮层。浮层支持移入，移入时不会自动关闭；离开后延迟关闭。 |
| 提示中的 `setup.` | 点击 | 打开对应电站详情，并关闭说明浮层。文案保持在同一段落内、带下划线；hover/focus 只变文字颜色，不加按钮底色。 |

Status 列中 `Normal / Attention` 的图标是 14px 不透明 CSS 遮罩，必须同时具有 `.plants-icon` 基础绘制类和对应状态色；`Unbound` 使用内联 SVG。三类状态都保持“图标 + 同色文字”，图标与文字间距 4px。

### 3.5 筛选浮窗

| 元素 | 触发 | 当前行为 |
|---|---|---|
| 类目 `Company`、`Device`、`Connection`、`Running status` | hover | 经过 `380ms` 意图延迟后打开对应二级浮窗。斜穿其他类目时不会立即误切换。 |
| 类目 | 键盘 focus 或点击 | 立即打开对应二级浮窗。 |
| 条件复选框 | 点击 | 立即应用或取消该条件，主浮窗和二级浮窗保持打开；重渲染后焦点回到同一复选框。 |
| 条件文字/图标按钮 | 点击 | 应用该条件并关闭筛选浮窗；不会通过这个入口取消已选条件。 |
| Company 展开箭头 | 点击 | 展开或收起该公司的子级；维护 `aria-expanded`。 |
| Company 复选框 | 点击 | 对当前节点及其所有后代执行三态切换：未全选时全选，已全选时清空，部分选中时补全。浮窗保持打开。 |
| Company 名称按钮 | 点击 | 若当前节点未被完整选中，选择其完整子树；随后应用并关闭筛选浮窗。 |
| Company 搜索框 | 输入文字 | 按公司名称即时过滤，只显示匹配节点；搜索状态临时拉平层级，不显示不匹配的父级。 |
| Company 搜索清除按钮 | 点击 | 清空公司搜索并恢复公司树。 |
| `Esc` | 在浮窗内按下 | 关闭当前浮窗。 |
| 浮窗外部 | 点击 | 由共享浮层控制器关闭。 |

## 4. 搜索

搜索使用共享紧凑玻璃搜索框 `createSearchField({size:"compact"})`，占位文案为：

`Search plants, installers or SN`

放大镜、清除按钮、玻璃材质和状态颜色全部来自共享字段；默认使用 `Labels/Secondary`，hover / focus 才转 `Labels/Primary`，Plants 不单独覆盖搜索图标。

搜索为大小写不敏感的包含匹配，搜索范围包括：

- 电站名称；
- 公司名称；
- 分销商名称；
- 安装商名称；
- SN。

搜索词会与全部筛选组同时生效：搜索条件与筛选组之间是 AND 关系。

## 5. 筛选

### 5.1 类目和选项

主筛选浮窗固定只有 4 个类目：

| 类目 | 选项 | 选项图标 |
|---|---|---|
| Company | 15 节点多级公司树 | 无选项图标 |
| Device | `Inverter`、`BMS`、`Heater` | 无选项图标 |
| Connection | `Online`、`Partially online`、`Offline`、`Unbound` | 使用对应连接信号图标 |
| Running status | `Attention`、`Unbound`、`Normal` | 使用对应运行状态图标 |

`Plant type`、`Power`、`SN`、`Software version`、`Last update` 不再作为筛选项。

### 5.2 公司层级

当前公司树为：

```text
Wattsonic Energy Technology
├─ FE Energiesysteme GmbH (AC)
│  └─ FE Energiesysteme Nord GmbH
├─ Bischoff Energiesysteme GmbH
│  └─ Bischoff Service & Wartung GmbH
├─ Rheinland Energie Technik GmbH
├─ Alpenstrom Handels GmbH
│  └─ Alpenstrom Süd Service GmbH
├─ Energiekonzepte Deutschland GmbH
│  ├─ Elektro-Service Winkler
│  ├─ KSW Handwerks GmbH
│  ├─ Sonnenwerk Vertrieb GmbH
│  │  └─ Sonnenwerk Service Nord GmbH
│  └─ Nordlicht Solar GmbH
└─ Nordsee Wärmesysteme GmbH
```

公司树默认展开全部层级。每级缩进 `12px`，展开按钮和复选框均为 `16px` 方形命中区，箭头为 `12px`。

### 5.3 组合规则

- 同一筛选组内的多个选项为 OR：例如选择 `Inverter` 和 `BMS`，会显示包含 Inverter 或 BMS 的电站，不要求两者同时存在。Connection 和 Running status 同样采用“任一选中状态命中即可”的并集逻辑。
- 不同筛选组之间为 AND：例如 `Company = Wattsonic`、`Connection = Online` 必须同时满足。
- 搜索与筛选之间为 AND。
- 选择公司父级等价于选择该父级及所有后代公司。
- 复选框只改变条件，不关闭浮窗；条件名称按钮应用后关闭。
- 筛选即时生效，没有 Apply 步骤。

### 5.4 筛选浮窗布局和状态

- 主筛选浮窗宽度 `260px`，高度贴合内容。
- 工具栏筛选入口与 Columns 菜单右对齐。
- 筛选条加号入口在自身下方左对齐打开。
- 已应用筛选条使用 `Backgrounds/Tertiary Elevated` 实底形成层级；深色条带为 `#3A3A3C`，整条在斜向渐变面板上都必须可见；chip、加号和 `Clear` 继续使用各自控件表面。
- 表头使用独立表格并固定在数据滚动区外，列宽和横向滚动位置与表体同步；深色直接透出父面板背景，浅色继续使用主面板底色。滚动内容不会进入表头，也不得使用背景模糊。
- 工具栏搜索字段提高绘制层级，使玻璃投影覆盖后续筛选条 / 固定表头，而不是在两者交界处被裁成浅边。
- Company 二级浮窗宽 `288px`；Device、Connection、Running status 二级浮窗统一宽 `208px`。
- 二级浮窗是独立 Glass Surface，覆盖主浮窗内缘约 `12px`。
- 二级浮窗首项与一级类目行对齐；顶部空间不足时由共享定位限制在视口边距内。
- Company 列表最大高度为 `70vh / 520px` 中较小者；标题和搜索框固定，列表内容可滚动。
- 所有长列表使用共享滚动反馈，不显示原生滚动条。
- Company 列表启用共享上下弹性：顶部下拉和底部上拉使用完全相同的透明回弹面，空隙透出母玻璃；滑块随回弹缩短，标题和搜索框保持固定。
- Device、Connection、Running status 的选项内容距浮窗左缘约 `20px`，选项按钮内部文字再保留 `8px` 左内距；复选框、文字和 hover 背景不能贴边，浮窗宽度和底部位置不因该内缩变化。
- 一级类目右侧数量表示该类目当前选中的底层条件数；二级标题右侧显示 `N selected`。具体选项旁不显示数量。

## 6. 列表列与数据

### 6.1 列定义

| 顺序 | 列 | 默认状态 | 可排序 | 可隐藏 | 显示内容 |
|---:|---|---|---|---|---|
| 1 | 收藏 | 始终显示 | 否 | 否 | 书签按钮；默认只在行 hover/focus 或已收藏时可见 |
| 2 | Connection | 始终显示 | 否 | 否 | 仅图标，无表头文字；覆盖 Online、Partially online、Offline、Unbound |
| 3 | Plant name | 始终显示 | 是 | 否 | 电站名称；空名显示 `?` |
| 4 | Device | 显示 | 否 | 是 | 一个电站可含多个设备，按 `Inverter/BMS/Heater` 顺序以斜杠组合显示 |
| 5 | Power | 显示 | 是 | 是 | kW 数值，按规则显示正负号或无数据 |
| 6 | Status | 显示 | 是 | 是 | 运行状态图标和文字 |
| 7 | SN | 显示 | 否 | 是 | 设备序列号；完整值保留在 title |
| 8 | Firmware | 显示 | 是 | 是 | 表头显示 `Firmware`，菜单和无障碍名称使用 `Software version`；完整值保留在 title |
| 9 | Last update | 显示 | 是 | 是 | 相对时间；title 提供绝对时间 |
| 10 | Company | 默认隐藏 | 否 | 是 | 公司名称 |

默认被隐藏的列只有 Company。`Plant type` 已不在列定义和 Columns 菜单中。

### 6.2 Columns 菜单

Columns 菜单显示 7 个可操作列：

`Device`、`Power`、`Status`、`SN`、`Software version`、`Last update`、`Company`

- 显示状态在文字前使用 Eye 图标。
- 隐藏状态使用 Eye Closed 图标，文字和图标进入较弱层级。
- 点击行立即显示或隐藏该列，菜单保持打开。
- 收藏、Connection 和 Plant name 是锁定列，不进入菜单。
- 列显隐只在当前页面会话有效，不写入 localStorage。

### 6.3 排序

可排序列及首次点击方向：

| 列 | 首次方向 | 规则 |
|---|---|---|
| Plant name | 升序 | `Intl.Collator`，支持数字自然排序 |
| Power | 降序 | 数值比较；空值始终排在最后，不受升降序影响 |
| Status | 升序 | Attention → Unbound → Normal；同级按名称排序 |
| Firmware | 降序 | 按版本号数字分段比较，不做普通字符串比较 |
| Last update | 降序 | 最新在前；相同时按名称排序 |

再次点击当前列会在升序和降序间切换。当前排序列显示方向箭头，并同步 `aria-sort`。

已收藏电站始终形成一个置顶组。置顶组和普通组内部都继续使用当前列排序；取消收藏后，该行立即回到普通组中的正确位置。

### 6.4 表格滚动

- 表头固定，只有数据区域内部纵向滚动。
- 纵向滚动使用共享圆角滑块；默认 `6px`，hover 变为 `8px`，支持拖动。
- 列表到达顶部或底部后继续拉动会显示弹性空白，松手后回弹，不产生真实额外数据；顶部与底部必须使用同一个主题表面颜色，不能出现一端更深或更亮。
- 桌面宽度下不出现表格横向滚动；可用宽度不足时表体自身允许横向滚动，页面整体不横向滚动。
- 行高为 `44px`；hover 或键盘 focus 使用整行圆角填充反馈。首末单元格的 `10px` 外角必须常驻，焦点离开后背景沿共享 `360ms` 淡出期间四个外角仍保持圆角。
- Device 列使用最短可读宽度，保留 `20px` 左内距，不在列尾留下大块空白；剩余空间优先分配给电站名和右侧指标列。

### 6.5 数据显示规则

#### 电站名称

- 有名称为 `Subheadline/Regular`，过长时省略，title 保留完整名称。
- 空名称显示为圆形 `?` 按钮，并用浮层解释当前资料状态。
- `?` 提示固定为 `This device is not currently associated with any plant. Please proceed with the setup.`，其中 `setup.` 是同一段落内的可点击下划线按钮。

#### Connection

| 数据状态 | 图标语义 |
|---|---|
| `online` | Online |
| `partial` | Partially online |
| `offline` | Offline |
| `unbound` | Unbound |

Connection 列不显示文字，图标的 `aria-label` 和 title 提供可读名称。

#### Status

| 原始数据状态 | 表格显示 |
|---|---|
| `normal` | Normal |
| `attention` | Attention |
| `offline` | Attention |
| `partially_offline` | Attention |
| `unbound` | Unbound |

Connection 与 Running status 是两个独立维度。Offline 和 Partially offline 在 Connection 图标上保留差异，在 Status 列统一归入 Attention。

#### Power

- `null` 或 `undefined` 显示 `--`。
- `powerSigned: true` 且值为正：显示 `+{数值}`。
- `powerSigned: true` 且值为负：显示 `−{数值}`。
- `powerSigned: false`：只显示绝对值，不带正负号。样例中的 Heater 使用此规则。
- 数值统一保留一位小数。

#### Last update

- 使用共享 `foundations/time.js`：`0–9` 秒为 `Just now`，`10–59` 秒为秒前，`1–59` 分钟为分钟前，`1–23` 小时为小时前，`1–6` 天为天前。
- 达到 `7` 天后显示本地 `YYYY/MM/DD HH:mm`。
- 排序继续使用原始 `updatedMinutes`，不受显示格式影响。
- 所有行在 title 中提供 `YYYY/MM/DD HH:mm` 绝对时间，并使用 `<time datetime>`。

#### SN 和 Firmware

- 内容缺失时显示 `--`。
- 有内容时 title 保存完整值。
- 列内容单行省略，不撑破列宽。

## 7. 刷新和重置

`Refresh plants` 是“刷新并恢复默认列表视图”，不是重新请求后端。点击后：

1. 关闭当前浮层。
2. 清空全部筛选。
3. 恢复默认可视列，即只隐藏 Company。
4. 恢复默认排序：`Last update` 降序。
5. 刷新筛选和列按钮蓝点。
6. 让刷新图标转一圈，期间阻止重复点击。
7. 完成后显示顶部 toast：`Plants refreshed — filters and view reset`。

不会被刷新清除的状态：

- 当前搜索词；
- 收藏及其持久化数据；
- `prefers-reduced-motion` 设置。

## 8. 收藏

- 存储键：`wattdesk.plants.bookmarks.v1`。
- 存储内容：电站 ID 字符串数组。
- 收藏状态跨刷新保留。
- 默认未收藏的书签在行 hover/focus 时显示，已收藏书签始终显示。
- 点击书签使用 `aria-pressed` 表示状态，并阻止事件冒泡到整行。
- 已成组排行为使用共享 FLIP 动效，不改变列表滚动位置；`prefers-reduced-motion` 时直接换位。
- 切换后保留键盘焦点在原电站的书签按钮。
- 显示顶部 toast：`Following {name}` 或 `Removed {name} from Following`。

## 9. 空态

### 搜索或筛选无结果

- 标题：`No plants match your search`
- 说明：`Try another name, installer or SN, or clear the active filters.`
- 按钮：`Clear filters`
- 点击按钮会同时清空搜索词和全部筛选条件。

### 完全没有数据

- 标题：`No plants yet`
- 说明：`Plants appear here once a device on the site is linked to a plant.`
- 不显示清除按钮。

当前样例数据不会产生“完全没有数据”状态，除非数据源改为空数组。

## 10. 详情路由与工作区标签

### 打开详情

- 点击任一列表行或资料未全电站的 `?`，打开 `/plants/:id`。
- 详情通过 `openRouteInNewTab()` 在新工作区标签中打开并立即激活。
- 原 Plants 列表标签保留。
- 新标签标题使用电站名称；空名称电站使用 `?`。
- 详情顶部复用 `createPageHeader()`，面包屑为 `Plants / 电站名`；父级 `Plants` 同时承担返回逻辑，未知 ID 的末级为 `Plant not found`。电站名旁的书签与列表共用 `wattdesk.plants.bookmarks.v1`。
- 收藏按钮紧跟电站标题，视觉间距约 `4px`，图标与标题垂直居中；按钮不挂玻璃材质。外层按钮保持静止，只让内部图标以中心放大：hover / focus `1.28`、按压 `1.38`，使用共享动效节奏且不能横向位移。
- 页头固定，下一行使用复用共享 `.wd-scope-control` / `.wd-scope-button` 的 `Overview / Devices / Site details` 页签；36px 胶囊、13px / 510 标签、4px 间距，未选中为无描边实体填充，选中使用共享内描边；标签行复用 Service 工具栏的上 `16px` / `14px` 留白且无底部分隔线。三个页签 hover `1.045`、按压 `1.09`；Devices 使用 `/plants/:id/devices`，Overview 与 Site details 各自回到对应页面状态。
- Overview 使用一张连续画布，水平内距 `32px` 并填满可用高度。只有一台设备时隐藏设备轨；多台设备按 `data.js` 当前设备顺序显示，默认选中第一项。切换后统计、日志、趋势和 `?device=` URL 同步更新。玻璃只用于可操作控件；状态条使用普通实体表面，Operations 三卡直接复用共享 `wd-discussion-card`。Statistics 和 Energy trend 不再使用卡片底或四周边框，只在各自顶部保留一条 `2px` 横向分隔，不画底部线。
- 运行状态、通信、天气、地点与本地时间组成横向上下文条；四项使用图标 + 值显示，完整字段名写入 `aria-label`。容器背景透明且无圆角面板。该条只占中间主列并停在 Operations rail 左侧。Operations rail 从状态条顶边开始，跨越上下文与 Energy flow 两行。下半区行间距 `16px`；Energy trend 位于 Statistics 上方，桌面、`901–1450px` 的 2×2 与 `≤900px` 单列顺序一致。Statistics 行高 `224px`、标题行高 `32px`，标题行与内容区之间为 `20px`。内容网格填满剩余高度，图表容器与组底对齐。Energy trend 顶部内距 `20px`、底部 `0`。模块顶部分隔线为 `2px`，图表网格为 `0.6px` 非缩放描边，全部数据折线由 `.is-line-hidden` 默认隐藏。`901–1450px` 使用两行两列，`≤900px` 改为单列 Flex 流，不能截断或重叠信息。
- `Energy flow` 删除标题和 `LIVE` 整行，只保留从容器顶边铺满的透明空舞台；内部设备、PV / Battery / Grid / Home 节点、连接线、读数和圆环均已移除，画布与舞台的渐变、背景、边框、圆角和阴影也全部删除，后续新设计确认后再接入。
- 逆变器默认显示 `Statistics / Today` 天视图：顶部横向分隔线下方排列 Energy、Savings、Self-powered、Current state 四组。通过 `statistics-charts.js` 按 lieflat-charts 的真实骨架生成：Energy 为 F6 Paired Rungs，Savings 为 L3 Barcode Lollipop 横置版，Self-powered 为 L10 Radial Patchwork；Current state 不绘制图表，改为四行状态条。宽屏四组严格等宽，`901–1450px` 改为 2×2 等宽组网格；组标题统一 `14px / 510` 并使用 `Labels/Secondary`，比 `Statistics` 总标题淡一档，正文同基线。所有图表只使用黑白灰 Mono ladder，梯档、lollipop 和刻度保持可辨认的实体重量。Savings 不画整块纵向网格，每行都有独立浅色底轨；底轨与白色值线同为 `2.2px`，透明度使用 `.45` 以保持更轻的层级。最长值端点实心，其余端点空心且统一放大。Savings 左侧来源文字使用句首大写、12px 字号，与组标题左缘对齐，并通过 `1px` 光学下移与相应线条垂直居中；灰色底轨、白色值线和端点共用同一 Y 中心，四行使用 `28` 个 viewBox 单位行距。右侧总额右缘与四条轨道的共同右端点对齐。Energy、Savings、Self-powered 的数值默认隐藏，通过 hover / 键盘 focus 显示局部读数；Current state 直接显示 Battery、Grid、Home、Solar 四行状态与 kW。Self-powered 使用 L10 等角花瓣、全长底扇区和三节点外置引线，数据半径按来源百分比绝对变化，圆心不显示文字。来源 kWh 当前由 `homeToday × source percentage` 派生，只用于本地样例和 hover / focus 读数的第二值。图表长度、扇区半径或刻度数量与数值成正比，不断轴。图表入场使用共享 chart motion token，并在减少动态效果时关闭。BMS / Heater 的单行指标使用 `136px` 高并垂直居中，不能沿用日常统计高度。`From battery` 必须使用放电量、`To battery` 必须使用充电量。
- Current state 使用四行 `label + pill` 状态条：左侧标题使用次级文字色，右侧胶囊内左侧状态、右侧功率。胶囊采用四档黑白灰，最亮的一档在顶部 Battery，向下逐级变深；胶囊内使用 `12px / 400` 白字，不能再加粗或引入品牌彩色。列表顶部保留 `8px` 光学留白，使首行中心与左侧统计首行对齐；四行在剩余高度内等比排布，窄屏也不截断。
- Energy 的 F6 Paired Rungs 采用四个点阵分组：`Grid` 和 `Storage` 各保留 Supply / Demand 双列；`Solar` 只显示 Supply 单列，`Site` 只显示 Demand 单列。每个圆点代表 `1 kWh`，顶部数值直接舍去小数，不做四舍五入。Supply 在深色主题使用前景白、浅色主题使用中性深灰 `#73726d`，Demand 使用共享 `Accents/Orange`；顶部点按安全步距放大到约 `3.35`，浅色 Supply 辉光必须低透明且中性。分类与数值使用 `12px / 600`，图例使用 sentence case，hover / focus 仍显示未截断的精确 kWh。画布使用与内容区同高的 `270×116` 比例，顶部不留 letterbox；数值区、图例和分类共同撑满高度，圆点按至少相切的安全间距排布。
- Statistics 最新列宽规则覆盖上文：宽屏使用七列 `窄 / 弹性间隙 / 宽 / 弹性间隙 / 窄 / 弹性间隙 / 宽`。窄内容为 `clamp(176px,11.8vw,205px)`，宽内容为 `clamp(289px,calc(27.2vw - 119px),720px)`，三条间隙使用同一个 `minmax(32px,1fr)`。Energy 必须从内容区左缘开始，Current state 在内容区右缘结束；三个可见模块间隙始终相等。`901–1450px` 的 2×2 和更窄断点继续使用等宽组网格。
- Energy SVG viewBox 使用 `0 0 228 116`，Self-powered 使用 `34 0 206 116`，裁去无效左右留白并让标题与图形实际内容左缘对齐。Energy 第一组双列点左侧保留约 `8px` 内缩；图例圆复用柱顶数据圆半径，文字 `12px / 600`，两组图例间至少保留 `6px`。配对方向浮窗回到当前柱组正上方，以最高柱顶数值为纵向锚点，底部至少留 `5px`，并在模块边界内夹取。
- Statistics 材质增强只改图表本体：颗粒分别裁切在 Self-powered 底扇区、Savings 轨道和 Current state 胶囊上，不使用覆盖整块图表的矩形噪点层。Self-powered 增加收缩后的中性白光、中性径向底盘渐变，以及底环/数据环共享的左上亮、右下暗中性渐变描边；Savings 轨道使用颗粒和透明渐变，Energy 顶点使用双层短距离辉光，Current state 胶囊使用颗粒与大范围从左到右水平高光且不得有描边或任何内/外阴影。圆环光不得带色相或被裁切，玻璃浮窗保持原材质并位于图表材质上方。外层 Statistics 仍是透明直接展开布局，`background-image:none`、无边框、无圆角、无投影，也不在页面底部复制存档面板。
- 已废弃方案，不得恢复：Self-powered F4 外圈图标 / 刻度环。当前最终实现是下一段的 L10 Radial Patchwork 扇区。
- Self-powered 最终按参考图改用 `lupi-gallery.html` 的 L10 Radial Patchwork 扇区语法，替换此前的 Tick Donut / 外圈图标：三项等角分槽，每项先绘制一条浅色、固定全长的底扇区，再叠加数据扇区；数据半径按 `14 + 42 × 百分比 / 100` 计算，不把最大值归一化为满长。底扇区和数据扇区使用同一套低强度中性细描边与短距离辉光，底环更弱、数据环略清晰，扇区之间保持内外同宽的 `5` 单位空隙。名称与百分比全部放在底盘外侧并与扇区保持距离，中心保持留空；每根引导线使用三节点折线：先从数据扇区外缘斜向引出，到标签高度后转为足够长的水平尾段指向文字，不能退化成单根直线。数据扇区使用三级浅灰。hover / focus 时对应扇区外扩 `2.5` 单位并显示侧边共享玻璃浮窗，浮窗写来源、百分比和 kWh，不覆盖扇区。
- Self-powered 最新规则覆盖上文：深色底扇区降为前景色 16%，浅色降为 8%；浅色数据扇区改为 `#BEBDB7 / #91908A / #666560` 三级灰阶以保证可辨。外置百分比使用 `14px / 600`、来源名使用 `11px / 600`，均使用模块次级灰而不是纯白，两行基线间距保持 `15` 个 viewBox 单位。完整底扇区都是 hover / focus 热区，不再只响应实际数据半径。浮窗仅显示 `7.8 kWh` 这类数值与单位，并跟随鼠标定位在指针上方约 `13px`；键盘 focus 回到对应扇区中心锚点。
- 图表读数浮签复用静态共享 Glass Surface（`.wd-glass--surface` + `.wd-glass--static`），由 `detail.js` 随图表明细一起挂载，不使用页面私有背景。浮签根据当前 hover / focus 行线条的真实屏幕位置动态上移，左缘与线条起点对齐，Savings 使用标签与金额同一行的布局并与线条保留 `6px`；同时避开标题、总额。若上方浮签会与总额碰撞，Savings 浮签自动翻到线条下方，并继续保持 `6px` 净空。文字内容单独放在 `.plant-overview-chart-readout-copy`，切换数值时不能替换 `<output>` 的全部子节点，否则会删除玻璃材质；回归覆盖共享材质、无局部底色、线条间距、左缘对齐以及 1440 / 1519 / 1640 三个宽度的文本覆盖关系。
- Savings 最新设计覆盖上方旧版 L3 呈现：四行改为铺满内容宽度的响应式胶囊轨道，不再使用固定比例 SVG。每行包含 `2px` 半透明描边、`999px` 胶囊圆角、左侧 `12px / 400` 来源标签、`16px` 灰色数据轨道、轨道内整数定位的 `12px` 起始点和 `16px` 末端圆点；两个端点都用内联 SVG circle 绘制以保持平滑边缘。轨道使用低透明颗粒和可见水平渐变。右端空心圆使用圆内描边，外缘严格落在 16px 画布内，不使用阴影、投影或外扩描边。最大值使用实心端点，其余保持空心，深色轨道与空心内部统一为 `#4d4d4d`，消除线帽接缝；浅色按主题派生。轨道右端使用平切并藏在端点圆下方，避免线帽外露；最小轨道宽度为 `24px`，使最短数据的两个端点接近但不重叠。轨道有效长度另预留 `6px` 尾部净空，使最长值端点与行框右侧的留白约等于轨道上下留白。标题右侧改为与标题同级的 `total: kr 12.48`，并与行容器右缘精确对齐。来源文案按 Figma 固定为 `iStorage > home / iStorage > Grid / Solar > home / Solar > grid`；轨道长度仍按各自 kr 相对最大值的真实比例计算，不能用设计稿示意位置覆盖数据。hover / focus 继续显示共享玻璃读数。
- Statistics 周期控件使用 `components/segmented-control.js` 的玻璃单选模式：`Day / Month / Year / Total`。Day 显示日历月网格，Month 显示 12 个月，Year 显示 9 年网格；选择粒度本身不提交，日期/月份/年份被确认后才更新视图。月视图使用 F2 Hairline Line 小多图，年视图使用 F1 Rung Bars 的月度聚合小多图，二者固定 `Home use / Solar energy / From iStorage / Grid exchange` 四项；Total 显示八项累计指标、可见金额的 L3 Savings 和独立 defs 的 L10 Self-powered。月视图比较 F2 / L3 / F3 后选择 F2：28–31 天仍需逐日读数，F3 更适合先看 30–60 天形态，L3 的 90 天 barcode 语义会把密度夸大成主观肌理。年视图比较 F1 / F2 / F5 后选择 F1：12 个真实月度聚合适合可数梯档，F2 会把聚合值伪装成逐日序列，F5 的横向排名会破坏连续时间轴。所有视图一次性挂载并按模式显示，避免反复重建玻璃浮窗；切换入场使用共享 panel/chart motion token，减少动态效果时不播放。示例数据按日期键确定性派生，不代表后端聚合。
- 月、年视图在时间控件左侧增加 `Separate / Combined` 36px 共享玻璃分段开关，Day 与 Total 不显示。Combined 使用一张共享时间轴叠加 Home use、Solar energy、From iStorage、Grid exchange 四条 F2 发丝线；月模式为当月逐日，年模式为完整年份逐日（平年 365 点、闰年 366 点），不是 12 个聚合成月点。绘图区必须从内容列最左缘铺到最右缘：SVG 使用 `preserveAspectRatio="none"` 拉伸几何，Jan/Jul/Dec 轴标签放在独立的 HTML 覆盖层，避免文字被横向拉扁。所有历史折线使用平滑三次贝塞尔路径，不得保留硬折角；超过 120 点的全年密集序列对可见路径使用 7 天加权平滑，但 hover / focus 和 `aria-label` 必须返回当天原始值。Home 用主墨色，Solar 与 iStorage 用两级中性灰并辅以实线 / 点线，Grid exchange 用橙色，鼠标或键盘聚焦单日时在共享玻璃浮窗中一次列出四组 kWh。选择器内的年月切换箭头均为共享中性玻璃圆钮。统计图表统一按图分组入场：`--wd-motion-chart` 使用 `900ms`，图内标记从左到右通过 `clip-path` 揭示，每个标记仅递增约 `3ms`，四个并列小图之间约 `28ms` 起始差，整体首尾启动差不超过约 `110ms`。不得再按整个视图的 DOM 顺序串行播放；点击图表重播与 `prefers-reduced-motion` 降级沿用共享逻辑。
- Statistics 图表字体不应继续使用 8–10px 的展示级字号。共享 readout 标签为 `12px / 16px`、数值为 `13px / 17px`；History 轴、Combined 图例和日期标签统一 `12px`；Self-powered 来源名 `11px / 600`、百分比 `14px / 600`；Savings 可见金额 `12px`。年图不再绘制柱顶常驻峰值数字，数值只在浮窗中出现。History 浮窗整体上移；Combined 的四项读数使用两列摘要，浮窗底部停在绘图区上缘之上。空间不足时增加浮窗内距、提高行高或让图例换行，不缩小文字。
- Savings 行框默认与 hover 都使用前景色 12% 透明度的淡描边，hover 不再切换到更亮的 `--chart-muted`；键盘 focus 使用 `--chart-muted` 的 1px 外轮廓。hover / focus 的玻璃浮窗只显示两位小数金额，不重复来源名称或 `kr` 前缀；完整来源和金额继续保留在行级 `aria-label`。
- Savings 浮窗最终显示金额和单位（例如 `kr 5.99`），不再显示来源名称。
- 深色 Savings 左端点使用 `#a6a6a6`，比 `#4d4d4d` 轨道清楚更亮但低于主文字和右端主体；浅色仍由主题前景墨色派生。
- `Energy trend` 位于 Statistics 上方，使用相同顶部 `2px` 横向分隔，顶部内距 `20px`、底部 `0`。Trend 不显示图例、纵轴刻度或底部时间范围文字；标题、模式切换、Today 控件和 `0.6px` 网格保留，但全部数据折线默认隐藏，不能移除整个图表区。右上模式开关占位标签固定为 `All / Default / Battery / Frequency`，直接使用共享 `createSegmentedControl()`。`Today` 独立复用 Home 日期周期按钮和同一天选择浮窗，Apply 后才更新标签。
- 右侧 Operations rail 使用 `repeat(3,minmax(0,1fr))` 将 `Fault & warning / System log / Service tickets` 三卡从状态条顶边开始等高铺满，间距 `8px`。三卡复用 `wd-discussion-card`，`18px` 圆角、上下 `12px` / 左右 `16px` 内距；统一为 `36px` 标题行加可伸缩正文区，行距 `12px`，标题 `13px / 510`、正文/日志/元信息至少 `12px`。Fault code 使用中性小胶囊，Ticket 行有整行透明 hover 背景并支持键盘 focus，System Log 的 LIVE 前显示状态点。整卡可 hover 放大并进入三层面包屑占位页；子页隐藏 section tabs，空白占位内容在完整正文视口内居中。Fault 不显示 `Clear`；无工单时不显示 `None`；no-fault 组保持图标+文案原布局并整体居中上移 `6px`，Ticket 空态也上移 `6px`。System Log 使用连续行内代码排版，无固定列宽，消息换行回到最左侧并保留三级颜色；额外占位行通过共享非弹性滚动轨道查看。Service Tickets 的正圆 `36px` 玻璃加号位于右上角，上下/右侧各内缩 `6px`。子页面包屑的电站名保持同 X 起点，父级链接左右内距各 `8px`，hover 胶囊不覆盖箭头；收藏按钮以 `-8px` 左外边距紧贴电站名且不右移。
- 未知 ID 显示 `Plant not found`，不静默回到 Home。

### 返回列表

`Back to Plants` 的优先级：

1. 激活打开详情时记录的来源 Plants 列表标签；
2. 关闭当前详情标签；
3. 如果没有来源标签，激活另一个现有 Plants 列表标签；
4. 如果不存在可用列表标签，则在当前标签内返回 `/plants`。

### URL

- 列表：`/plants`
- 详情：`/plants/:id`；选中设备后可带 `?device=inverter|bms|heater`
- Devices：`/plants/:id/devices`，可继续带 `?device=`；直接打开和刷新仍显示 Devices
- Site details：`/plants/:id/site`，可继续带 `?device=`；直接打开和刷新仍显示 Site details
- Operations 子页：`/plants/:id/faults`、`/plants/:id/logs`、`/plants/:id/tickets`；可继续带 `?device=`，当前均为明确占位页
- 刷新详情 URL 后仍停留在对应详情。
- 缺少 `device` 时读取该电站设备顺序并选中第一项；刷新、复制链接和标签恢复保留当前设备。
- 浏览器前进/后退与工作区标签 URL 保持同步。
- 页面标题使用 `WattDesk · {电站名}` 或 `WattDesk · Plant not found`。

### Devices

参考页研究结论：典型设备页按设备类型展示身份、连接状态、技术字段和专属操作。设备设置、固件检查、重命名、替换、系统测试与解绑都属于设备级操作，不应提升为页面级全局按钮。WattDesk 本地实现参考 Linear 的紧凑产品工作流，不照搬参考页的悬浮卡片，也不继续使用大圆角色块，而使用连续、无边框的扁平设备行。

- Devices 页沿用 Plants 详情外壳：固定页头、共享胶囊页签和独立滚动正文；设备内容列最大宽度 `1130px` 并在可用工作区中水平居中，不再横向铺满，也不套用 Home 的 `1000px` 居中画布。
- 页面顶部不再显示设备数量与在线/离线分布摘要，只保留右对齐的 `Add device`；不增加页面级预览说明行。本地会话与未接后端的事实继续通过对话框文案和操作后的 toast 表达。
- 设备行不再复用 `.wd-discussion-card`：常态 `background:transparent`、四边 `border:0`、`box-shadow:none`；操作按钮或行内控件 hover / focus 只改变控件自身，不再给整行或整组绘制背景高亮。桌面左侧产品图区域使用 `120px` 宽、`96px` 高，产品图通过 `object-fit:contain` 完整显示且不得裁切，再以 `16px` 间距接连续内容列，默认不形成独立卡片表面；平板和移动端继续按现有断点收窄。相邻设备之间由行顶部 `1px` `Separators/Non-opaque` 分隔线隔开，设备间分隔线左右延伸到工作区两侧，并在两端各用 `64px` 透明渐变融入背景，不是卡片描边。
- 设备身份区统一由 `device-identity.js` 的 `createDeviceIdentity()` 生成，Inverter / Battery / Heater 共用。固定两行：第一行只放设备名，第二行以在线状态开头，随后是类型、产品名和运行摘要；两行间距 `10px`。设备名使用 `16px / 590`，第二行使用 `13px`。技术字段统一使用六列网格，Battery 的 Installation capacity 必须与 Inverter 的 Hardware version 同列；字段标签为 `12px`，深色使用 `Labels/Tertiary`，浅色提升到可读的 `Labels/Secondary`。技术值保持 `Footnote/Medium` 类型绑定并使用标准界面字体，SN 复制按钮继承该字段样式。
- Inverter / Heater 行操作固定为固件检查、设置和更多菜单；Battery 不提供设置入口，仅保留固件检查与更多菜单。所有行操作使用 `36px` 共享中性玻璃圆钮，按钮组使用共享 `8px` 间距。顶部 `Add device` 同样使用共享中性玻璃胶囊。固件检查改用 Figma `ICON/update` 原始升级图标，并通过遮罩缩放收在按钮内芯。更多菜单提供 `Run system test / Replace device / Rename / Unbind device`，四项均使用 Figma 导出图标，统一视觉高度并放在文字左侧。操作菜单复用标准 `30px` 浮层圆角，右缘与更多按钮对齐，不得被视口边距夹到最右侧。`Unbind device` 的默认、hover 与 `focus-visible` 图标和文字都保持纯红，hover 背景使用红色 `11%` 淡透明层，不能被普通菜单的中性 hover 覆盖。Rename 与 Settings 的 Primary 保存按钮统一采用“无真实修改即禁用”逻辑：回到初始值时重新禁用；Add / Replace 继续按必填字段有效性控制。
- Inverter 行展示运行模式、运行状态与系统系列，字段顺序为 Model、Hardware version、Firmware version、Boot version、SN、Check code。相关 Inverter Settings 分类为 Running mode、Battery management、Professional settings、Safety-locked parameters、Networking、Shadow scan、Operation control、Other settings；Running mode 可在本地选择并保存。
- Inverter 与 Heater 的设置弹窗共用同一 `openSettingsDialog()` 和保存状态逻辑：打开时 `Save changes` 原生禁用；任一字段产生真实修改且草稿不同于初始值后启用；修改后又恢复为初始值时重新禁用。Primary 按钮沿用共享蓝色玻璃与白字，禁用态只降低透明度。Battery 不提供设置弹窗。
- Battery 行展示 Firmware version 与 Installation capacity，并列出可展开的 Cluster 行；所有 Cluster 进入页面时默认收起，包括 `Cluster #1`。Cluster 区域顶部和每个 Cluster 之间使用 `1px` `Separators/Non-opaque` 分隔线，设备技术字段底缘到首个 Cluster 分隔线保持 `16px`；Cluster 横线保持内容列原始宽度，不得向工作区外延伸。Cluster 行高 `40px`，文字 `14px / 590`，箭头 `18px`；箭头默认使用 `Labels/Tertiary`，整块 Cluster hover / focus 时提升为 `Labels/Primary`，Cluster 标签自身保持主文字色。文字与设备内容列左对齐。展开后的整块 Cluster 都是折叠热区，hover / focus 使用左右各外扩 `10px`、圆角 `12px` 的整块低对比高亮；点击任意非 SN 内容收起，标题按钮继续负责键盘开合。展开区顶部保留 `8px` 留白，Sub-master BMS 与 Batteries 两组间距为 `18px`；两个小节标题使用 `14px / 590`，比下方 `13px` 字段与型号值更大。三种内容共用设备顶部六列网格：Sub-master BMS 的 ID / Model / Hardware / Firmware / SN 依次落到第 1–5 列，Batteries 的 ID / Hardware / Firmware / SN 依次落到第 1–4 列。展开容器不再保留右侧内距，表头文字与上方字段标签统一为 `13px`。展开区只显示参考页中的两类数据：Sub-master BMS 五项字段，以及 Batteries 表中至少 6 个电池模块的 ID、Hardware version、Firmware version、SN；Batteries 记录使用全站标准字体，不使用代码字体。设备行顶部与 Cluster 内的所有 SN 都是独立复制按钮：hover / focus 显示下划线，点击复制序列号；Cluster 内复制不得折叠。Batteries 表头下第一行额外增加 `5px` 上内距，其余行保持统一紧凑行距；电池行本身不增加单独 hover 背景。
- Heater 行字段顺序为 Model、Hardware version、Firmware version、SN、Check code；Settings 提供 Operating mode、Temperature、Operation control、Networking 与 Safety。
- `Add device` 使用 `Device SN` 与 `Device name` 两个必填字段；空值或当前电站内重复 SN 不得提交。成功后在当前页面会话追加卡片并更新摘要。由于后端绑定尚未接入，本地预览按 SN 前缀推断样例类型：`WMT` 为 Heater，`R11 / STORAGE / BAT` 为 Battery，其余默认 Inverter；该规则只属于预览，不是生产识别协议。
- Rename 使用单字段对话框；Replace 保留当前设备位置并展示旧 SN/检查码只读信息，新设备需要 SN、检查码与 Remarks；Unbind 使用明确确认层，文案为 `Unbind {name}?`，说明只从电站移除、不删除历史。所有修改仅存在于当前页面会话，刷新恢复样例。
- Unbind 使用独立的居中确认布局：宽度 `480px`，无顶部关闭按钮，顶部为 `64px` 底托与 `28px` 红色删除图标，下方居中显示标题和说明，底部并排 `Cancel / Unbind device`；内容水平居中，整体沿用窄弹窗的“垂直居中后上移 `80px`”规则。
- 所有设备对话框直接复用首页全屏搜索的 `.wd-search-fullscreen`、`.wd-search-backdrop`、`.wd-search-panel-frame` 与 Glass Surface：同一深浅主题遮罩模糊、同一材质和反射、同一 `30px` 圆角，以及同一入场/退场动画与时长。设备弹窗只提供内容宽度、位置和业务结构，不复制遮罩或动画 CSS。表单弹窗宽度固定为 Add / Rename `640px`、Settings / Replace `1160px` 双栏；`Unbind` 使用独立 `480px` 居中确认层，不能被误写回 `640px`。所有弹窗先按视口垂直居中，再按尺寸档位上移：窄版 `80px`，宽版 `24px`。标准标题栏左侧使用 `40px` 图标底托，图标、标题和右侧关闭按钮共用垂直中心，关闭图标收为 `14px`；标题下不显示解释副标题。确认层无标题栏与 X，使用 `64px` 图标底托、`28px` 图标、居中标题/说明和并排按钮。表单字段统一使用共享 `.wd-edit-field`，默认无描边；浅色默认与 focus 均保持 `Fills/Quaternary` / `Fills/Tertiary` 的中性灰，hover 提亮、focus 只使用中性轮廓，不出现纯白底或蓝色输入框描边。主按钮禁用时仍保持白字与蓝色材质，仅降低不透明度。
- Responsive：宽桌面保持紧凑双列行；`≤1100px` 技术字段改为三列，Cluster 改为两列；`≤900px` 产品缩略图收到 `56px`；`≤720px` 设备行改为单列，图片和操作与身份分行；`≤520px` 字段及 Cluster 明细改为单列。页面不得产生整页横向滚动。
- 键盘：所有卡片操作、菜单项、Cluster 展开按钮和设置字段均使用真实可聚焦控件；模态层支持 Esc 关闭、Tab 焦点循环和关闭后焦点归还；减少动态效果时关闭对话框位移动画。
- 产品图来源记录在 `design/figma/plants/devices-source.json`，运行资产位于 `home-assets/plants/devices/`；运行时 PNG 只移除边缘连续白色底，不重画产品。

### Site details

完整字段、状态、响应式和验收契约见 [Site details 页面规格](../../../../docs/SITE-DETAILS.md)。本页只维护电站级资料，不重复设备页的 SN、固件或控制能力。

- 页面使用共享页头、收藏按钮和 `Overview / Devices / Site details` 范围页签。正文顶部直接以电站名作为标题，右侧是玻璃操作区，不显示额外页面说明，也不在共享页头放页面业务按钮。
- 宽屏正文使用共享 `.wd-page-content`，最大宽度 `--wd-page-content-max`（当前 `1000px`）并居中；页面标题、两列卡片和提示共同撑满该内容列，避免超宽屏把设置项无限拉长。
- 桌面左列为 Basic information、Electricity price 与 Owner information，右列为 Installer contact、Plant picture 与 Visitor management；两列等宽。
- 每个模块一张卡，卡片无描边、无阴影，行间只保留低对比 1px 分隔；模块标题使用 `15px / 590`，其余标签和值使用 14px 设置页字阶。
- 详情滚动隐藏浏览器原生滚动条，只使用共享 `createScrollFeedback()`；内容增高时由共享滚动组件同步可见轨道，避免编辑态出现第二条样式不一致的滚动条或挤压卡片。
- 查看态直接显示标签和值；整页编辑态在原位置替换为表单，顶部玻璃操作区切换为 Cancel 与 Save changes。标题电站名在原位改为自动增高文本区，默认高 `44px`、宽至约 `760px`，超长自然换行并向下生长；短标题进入编辑时标题行高度不变。Basic information 不再重复 Plant name。Save changes 与 Home 日期选择器 Apply 共用文本按钮结构，无额外图标且始终可用；无变更时点击直接退出编辑，校验失败时移动到第一个错误字段。
- 切换编辑态不得改变任何卡片的位置或尺寸，行右侧控件的左右边界必须与查看态一致；编辑行默认保持 `52px` 高。查看值、输入和下拉文本统一 `14px`。
- 文本、数字和自定义选择字段统一复用 `.wd-edit-field`：focus 只使用低对比中性轮廓，不使用蓝色描边；浅色默认与 focus 保持共享中性灰填充，不使用白底。编辑值、单位、文本输入和下拉当前值统一为 14px。
- Basic information 包含 Plant type、PV capacity、Battery installation capacity、Creation time、Timezone、Country、Price area 和 Address；Plant name 只在页面标题行编辑，稳定内部 Plant ID 不向用户展示。
- Electricity price 包含 Currency 与 Grid price/kWh。Owner information 复用共享头像和 36px 中性玻璃三点按钮。
- Installer contact 包含安装商、联系人、邮箱、电话、Alarm email notification 和 recipient；通知使用共享 `createToggleSwitch()` 的真实 switch，状态由 `aria-checked` 表达。轨道复用标准玻璃按钮材质，关闭态保持可见中性填充，开启态为蓝色玻璃，内部高光克制。
- Plant picture 与 Visitor management 当前保留明确空态；没有上传或邀请服务时不伪造成功状态。
- Danger zone 只在编辑态出现，`Delete plant` 必须二次确认；当前确认只说明后端未连接，不删除本地电站。
- Danger zone 使用淡红色背景隔离危险操作；`Delete plant` 复用 Save changes 的标准玻璃胶囊结构，但使用纯红玻璃底和始终为白色的文字，hover / focus 也只改变红色亮度，不能变蓝。
- 数字输入不显示浏览器上下步进器；Plant type、Timezone、Country、Price area 和 Currency 使用自定义选择按钮 + 共享 Glass Surface 选项浮层，不使用原生 select 弹层。下拉箭头复用通用 `asset-14.svg` 并旋转 90° 指向下方。
- 已保存资料只保留在当前 Plants 页面会话中，切换详情页签后仍存在，刷新恢复样例。
- `≤1000px` 改为单列并让安装商与图片并排，`≤640px` 全部单列、字段标签在上；长邮箱和地址换行，页面不得横向滚动。
- 专项回归为 `tests/verify-site-details.cjs`。

## 11. 键盘与无障碍

- 表头排序使用真实 button，并通过 `aria-sort` 公布当前状态。
- 数据行使用 roving tabindex：首行可 Tab 进入，其他行通过方向键移动。
- `↑`、`↓`、`Home`、`End` 移动行焦点；`Enter` 打开详情。
- 收藏按钮使用 `aria-pressed`，不触发行点击。
- `?` 按钮具有说明性的 `aria-label`，打开提示时写入 `aria-describedby`，关闭时移除。
- 筛选类目维护 `aria-expanded`、`aria-controls` 和 `aria-current`。
- Company 展开按钮维护 `aria-expanded`。
- 筛选复选框使用原生 checkbox，并为父级设置 `indeterminate` 三态。
- 二级筛选中的已选数量使用 `role="status"`。
- Columns 行使用 `role="menuitemcheckbox"` 和 `aria-checked`。
- 浮窗支持 Esc、外部点击关闭和焦点可见状态。
- 所有动画遵循 `prefers-reduced-motion`。

## 12. 数据契约

每条样例电站当前包含以下字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | URL 使用的稳定电站 ID，例如 `p01` |
| `name` | string | 电站名称；空字符串表示资料未全 |
| `companyId` | string | 公司 ID，对应 `COMPANIES` 和 `COMPANY_TREE` |
| `installer` | string | 安装商，仅参与搜索 |
| `sn` | string | 设备序列号 |
| `type` | enum | `heating`、`battery`、`hybrid`；当前不显示为列或筛选 |
| `devices` | enum[] | 电站包含的设备集合；可为 `inverter`、`bms`、`heater` 的任意组合 |
| `powerKw` | number/null | 功率；`null` 显示 `--` |
| `powerSigned` | boolean | 是否显示正负号 |
| `status` | enum | `attention`、`offline`、`partially_offline`、`unbound`、`normal` |
| `firmware` | string/null | 软件版本 |
| `updatedMinutes` | number | 相对加载时间的分钟数 |

派生数据：

- `companyLabel(companyId)`：公司显示名。
- `distributorLabel(companyId)`：样例数据的派生分销商名，只供搜索。
- `deviceLabel(device)`：设备显示名。
- `plantById(id)`：稳定 ID 查找。

### 样例数据概览

- 总数：46。
- 公司：Wattsonic 7、FE 9、Bischoff 8、Winkler 8、EKD 8、KSW 6。
- Plant type：Heating 26、Battery 10、Hybrid 10。
- Device：46 个电站中有 11 个同时包含三类设备；按设备出现次数统计为 Inverter 25、BMS 34、Heater 27。
- Connection：Online 38、Partially online 2、Offline 2、Unbound 4。
- Running status：Normal 29、Attention 13、Unbound 4。
- 空名称/资料未全：`p21`、`p22`、`p23`、`p41`。
- Firmware 缺失：`p21`、`p22`、`p23`、`p41`。
- Power 缺失：`p07`、`p15`、`p23`、`p41`。

## 13. 状态持久化范围

| 状态 | 当前生命周期 |
|---|---|
| 搜索词 | 当前页面实例 |
| 筛选条件 | 当前页面实例 |
| 排序 | 当前页面实例 |
| 列显隐 | 当前页面实例 |
| 公司树展开状态 | 当前筛选浮窗实例 |
| 收藏 | `localStorage`，刷新后保留 |
| 工作区标签及 URL | 工作区标签/路由状态 |

当前没有保存视图、筛选 URL 参数、账号同步、服务端筛选或分页。

## 14. 共享组件依赖

Plants 页面不新增第二套基础样式或交互，主要复用：

- `components/search-surface.js`：搜索框、放大镜、清除按钮；
- `components/popover.js`：浮窗锚定、跟随、开合与 Esc；
- `components/scroll-feedback.js` / `.css`：表格与 Company 列表滚动反馈；
- `components/glass-material.js`：玻璃按钮、搜索框和浮层材质；
- `components/menu-popover.js`：Columns 菜单结构；
- `components/control-states.js`：按钮、图标与文字的 hover/focus 状态；
- `foundations/motion.js` / `motion.css`：刷新、FLIP 和浮层动效；
- `home-assets/plants/` 与 `design/figma/plants/`：Plants 图标及其来源记录。

## 15. 回归测试

主要测试文件：

- `design-preview/tests/verify-plants-filters.cjs`
- `design-preview/tests/verify-routing.cjs`
- `design-preview/tests/verify-components.cjs`

覆盖范围包括：

- 4 个筛选类目与三类二级浮窗；
- 15 节点公司树、三态复选、搜索和滚动反馈；
- 复选框保持浮窗打开、条件名称点击后关闭；
- chip 添加、移除、单个 Clear、短标签与多行布局；
- 筛选与 Columns 面板对齐；
- 列显隐、Eye / Eye Closed、Plant type 移除；
- 刷新重置筛选、列和排序；
- 默认排序、收藏置顶与跨刷新持久化；
- 行打开详情、Back to Plants、未知 ID 和空名称电站；
- 详情共享页头、`Plants / 电站名` 面包屑、直接深链和未知 ID 末级；
- `?` 提示的 hover/focus、setup 跳转与不透明状态图标；
- 深色、浅色主题；
- 宽屏列宽、表格滚动、页面无整页横向溢出。

文档或实现发生变更时，至少重新运行：

```powershell
cd design-preview
npm run check
$env:WATTDESK_PREVIEW_URL='http://127.0.0.1:4173/plants?glass=figma'
node tests/verify-plants-filters.cjs
node tests/verify-routing.cjs
```
