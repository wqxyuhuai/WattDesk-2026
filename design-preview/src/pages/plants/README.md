# Plants 页面功能说明

更新：2026-10-30

适用页面：`/plants?glass=figma`

实现入口：`index.js`、`plants.css`、`data.js`

本文记录 Plants 页面当前**已实现**的功能、按钮行为、筛选规则、列表列、数据语义、路由与键盘交互。后续修改功能时，应同步更新本文和相关回归测试。

## 1. 页面边界

- Plants 是当前设计预览中的真实列表页，搜索、筛选、排序、列显隐和书签均在前端对本地样例数据实际执行。
- 数据来自 `data.js` 的 46 条示例电站，不代表真实账号、权限、后端查询或生产数据。
- `/plants/:id` 是真实、可刷新、可进入浏览器历史的 URL，但详情内容目前是明确的预览占位，不包含真实设备数据或控制能力。
- 侧栏、顶部工作区标签、主题按钮属于共享 App Shell；本文只记录它们与 Plants 页面的衔接行为。
- `New plant` 当前只显示预览提示，不会创建电站，也不会打开创建表单。

## 2. 页面结构

从上到下分为：

1. 页头：标题 `Plants` 和 `New plant`。
2. 工具栏：搜索、筛选、列显隐、刷新。
3. 已应用筛选条：仅有筛选时显示，包含条件 chip、加号与 `Clear`；条带使用 `Backgrounds/Tertiary Elevated`，深色为 `#3A3A3C`、浅色为纯白，用于突出已应用条件。
4. 列表：固定表头、可滚动数据行；表头位于数据滚动区外并与表体共享列宽/横向位置，深色透明显示父面板背景，浅色使用与工作区面板相同的底色，不使用 `backdrop-filter`。
5. 空态：没有匹配结果或没有数据时显示。
6. 详情占位：进入 `/plants/:id` 时替代列表区域显示；顶部固定复用共享 40px 页头，面包屑为 `Plants / 电站名`。

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
| 数据行 | 点击非按钮区域 | 新建并激活 `/plants/:id` 详情标签，原 Plants 列表标签保留。 |
| 数据行 | 行获得焦点后按 Enter | 与点击数据行相同。书签等行内按钮保留自己的键盘行为。 |
| 数据行 | `↑`、`↓`、`Home`、`End` | 在行之间移动 roving focus，不打开详情。 |
| 收藏按钮 | 点击 | 切换收藏状态，不触发行跳转；已收藏行移动到列表顶部，并用共享 FLIP 动效调整位置。 |
| `?` 电站名 | 点击 | 进入该电站详情；测试和当前实现将资料未全的电站也视为可进入的电站。 |
| `?` 电站名 | hover、键盘 focus | 打开说明浮层。浮层支持移入，移入时不会自动关闭；离开后延迟关闭。 |
| 提示中的 `setup.` | 点击 | 打开对应电站详情，并关闭说明浮层。文案保持在同一段落内、带下划线；hover/focus 只变文字颜色，不加按钮底色。 |

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
- 详情顶部复用 `createPageHeader()`，面包屑为 `Plants / 电站名`；父级 `Plants` 与页内 `Back to Plants` 使用同一返回逻辑，未知 ID 的末级为 `Plant not found`。
- 页头固定，详情占位内容在下方独立滚动区显示；原有电站名或 `?`、公司、SN、`Back to Plants` 和说明文案继续保留。
- 未知 ID 显示 `Plant not found`，不静默回到 Home。

### 返回列表

`Back to Plants` 的优先级：

1. 激活打开详情时记录的来源 Plants 列表标签；
2. 关闭当前详情标签；
3. 如果没有来源标签，激活另一个现有 Plants 列表标签；
4. 如果不存在可用列表标签，则在当前标签内返回 `/plants`。

### URL

- 列表：`/plants`
- 详情：`/plants/:id`
- 刷新详情 URL 后仍停留在对应详情。
- 浏览器前进/后退与工作区标签 URL 保持同步。
- 页面标题使用 `WattDesk · {电站名}` 或 `WattDesk · Plant not found`。

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
