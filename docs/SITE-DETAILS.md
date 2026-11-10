# Plants Site details 页面规格

更新：2026-11-10
状态：查看态与整页编辑态已进入本地交互预览。
参考：线上 WattDesk `Plant Info` 页面及其编辑态；本页沿用当前 WattDesk 设计系统，不复制参考站点的视觉。

## 1. 页面边界

- 规范路由：`/plants/:id/site`，可继续携带 `?device=inverter|bms|heater`。
- 入口：Plants Overview 的 `Site details` 页签。
- 导航发生在当前工作区标签内，不新建标签。
- 返回 Overview 时保留当前设备，避免用户丢失原有设备作用域。
- 面包屑保持 `Plants / 电站名`，不把页签增加成第三层面包屑。
- 页面只维护电站级资料。设备序列号、固件、运行状态等设备级信息属于 Overview 或 Devices 页面。
- 当前没有后端、权限、文件上传、访客邀请或真实删除能力。页面只保存当前浏览器标签页内的编辑结果。

## 2. 信息架构

桌面端为两条资料列：

- 页面使用共享 `.wd-page-content`，宽屏下最大内容宽度为 `--wd-page-content-max`（当前 `1000px`）并在工作区中居中；标题、两列卡片和错误提示共同撑满该内容列。
- 视口宽度小于内容列上限时，内容列占满实际可用宽度；不要继续保留固定宽度或产生横向滚动。

```text
Plants / 电站名 ★

Overview    Devices    Site details
Wärmeverbund Nord                    [Edit]

┌──────────────────────────────────┐  ┌──────────────────────────────────┐
│ Basic information                │  │ Installer contact                │
├──────────────────────────────────┤  ├──────────────────────────────────┤
│ Electricity price                │  │ Plant picture                    │
├──────────────────────────────────┤  ├──────────────────────────────────┤
│ Owner information                │  │ Visitor management               │
└──────────────────────────────────┘  └──────────────────────────────────┘
                                [编辑态] Danger zone
```

- 左列承载初始化电站所需的主资料：基础信息、电价、属主。
- 右列承载外部联系与扩展资料：安装商、图片、访客。
- 编辑态的删除入口只出现在左列底部 Danger zone，不与保存操作并排。

## 3. 页头与页签

- 复用共享 40px `createPageHeader()`。
- 面包屑父级 `Plants` 执行现有 Plants 返回逻辑。
- 电站名后紧跟收藏按钮，沿用 Plants 列表和 Overview 的同一存储。
- 共享页头只承载面包屑与收藏，不承载 Site details 的业务按钮。
- 正文顶部标题直接显示电站名，右侧玻璃操作区保持同一行；查看态为 `Edit`，不再显示页面说明文案。
- 编辑态在同一位置替换为共享 `36px` 玻璃按钮 `Cancel / Save changes`，不得移动到共享页头；`Save changes` 与 Home 日期选择器的 `Apply` 共用同一文本按钮结构，不使用额外图标。
- 编辑态直接点击电站标题原位修改名称；标题编辑器默认高 `44px`，横向最多使用约 `760px` 的标题列，超长名称自然换行并通过共享 `animateContentHeight()` 向下增高。短标题进入编辑时标题行高度稳定；Basic information 不再重复渲染 Plant name。
- `Site details` 使用共享 `.wd-scope-button`，选中时使用共享内描边。
- `Overview`、`Devices`、`Site details` 均可在当前标签内切换；存在未保存修改时拦截页签和返回列表操作并提示先保存或取消。
- 离开页签后，已保存修改在当前 Plants 页面会话内保留；刷新页面恢复本地样例。

## 4. 资料区块

### Basic information

| 字段 | 查看态 | 编辑态 |
|---|---|---|
| Plant type | Heating / Battery / Hybrid system | 下拉选择 |
| PV capacity | 数值 + `kWp` | 数字输入，必须非负 |
| Battery installation capacity | 数值 + `kWh`；无电池显示 `Not installed` | 数字输入，允许留空 |
| Creation time | 固定本地站点时间，等宽字 | 只读 |
| Timezone | 站点时区 | 下拉选择 |
| Country | 国家 | 下拉选择 |
| Price area | 电价区域 | 下拉选择 |
| Address | 完整地址，可换行 | 文本输入，必填 |

### Electricity price

| 字段 | 查看态 | 编辑态 |
|---|---|---|
| Currency | `EUR` / `SEK` | 下拉选择 |
| Grid price/kWh | 显示数值和币种 | 数字输入，必须非负 |

### Owner information

- 使用共享头像组件显示属主缩写。
- 每个属主行包含姓名、邮箱和电话号码。
- 行尾三点按钮使用共享 36px 中性玻璃圆钮和标准文本菜单。
- `New owner` 使用共享中性玻璃按钮和加号图标，并放在 Owner information 模块标题行右侧。
- 本轮不提供真实属主新增、编辑或权限变更；操作显示明确的预览提示。

### Installer contact

| 字段 | 查看态 | 编辑态 |
|---|---|---|
| Installer company | 安装商名称 | 文本输入，必填 |
| Contact person | 联系人 | 文本输入，必填 |
| Contact email | 邮箱，允许换行 | 邮箱输入并校验 |
| Contact phone | 电话号码 | `tel` 输入并必填 |
| Alarm email notification | 真实 switch，查看态禁用但保留正确开/关状态 | 共享 `createToggleSwitch()`，编辑态可切换 |
| Alarm email recipient | 邮箱胶囊 | 邮箱输入；通知开启时必填并校验 |

### Plant picture

- 无图片时显示 `No plant picture` 和 `Add picture`。
- 有图片时显示预览，操作变为 `Replace picture`。
- 当前没有上传服务，点击只显示预览边界提示，不产生伪造图片。

### Visitor management

- 空态显示 `No visitors`。
- 附注明确访客邀请尚未连接。
- 没有权限和邀请 API 前不显示可提交的邀请表单。

### Danger zone

- 只在整页编辑态出现。
- 使用淡红色危险区背景、红色语义标题和说明；`Delete plant` 复用 `Save changes` 的标准玻璃胶囊结构，但底色替换为纯红色，文字固定白色。
- 点击后使用确认对话框；本轮确认只显示未连接提示，不删除样例电站。

## 5. 状态与校验

- 查看态和编辑态由同一个页面控制器维护。
- 进入编辑态时复制已保存数据；`Cancel` 恢复原值。
- `Save changes` 与 Home 日期选择器 `Apply` 使用同一按钮类路径并始终可用；没有修改时点击直接退出编辑，不做数据写入，避免出现与 Apply 不一致的禁用空胶囊。
- 查看态与编辑态的资料卡位置、宽度和每行右侧控件边界必须一致；编辑行默认高度保持 `52px`，输入或下拉控件不得让卡片整体移位。
- 查看值、编辑输入和下拉文本统一为 `14px / 400`；进入编辑态不能让右侧文字变大。
- 正文资料字段统一使用 `.wd-edit-field`：深色默认 / hover / focus 为主文字色 `8% / 11% / 13%`；浅色默认 `Fills/Quaternary`，hover / focus `Fills/Tertiary`。focus 只使用低对比中性轮廓，不使用蓝色描边，浅色 focus 也不切回纯白。顶部页面标题是 `Title3/Emphasized` 专用编辑表面，不套普通字段高度。
- 编辑值、单位、文本输入和自定义下拉的当前值全部使用 `14px`，不得出现同一填充框内 13 / 14px 混排。
- 原生滚动条必须隐藏，详情视口只显示共享 `createScrollFeedback()` 轨道；内容随编辑态增高时滚动反馈要立即同步，不能因浏览器滚动条出现或消失改变卡片宽度。
- 数字输入隐藏浏览器上下步进按钮，保留键盘方向键和直接数字输入。
- 保存时校验以下内容：
  - Plant name、type、PV capacity、timezone、country、area、address、currency、grid price 必填；
  - PV、电池容量和电价必须为有限非负数；
  - Contact email、Alarm email recipient 使用邮箱格式；
  - Alarm notification 为 `On` 时，recipient 必填。
- 校验失败时：
  - 对应字段显示红色轮廓和行内错误文字；
  - 页面显示 `role="alert"` 汇总提示；
  - 焦点移动到第一个错误字段；
  - 错误所在行保持可见。
- 保存成功显示 `Site details saved in this local preview`。
- 编辑中存在未保存修改时，页签切换、父级面包屑和返回列表操作不直接丢弃草稿。

## 6. 组件与视觉

### 页面组件

- `createPlantSiteDetails()`：页面装配、查看/编辑状态和保存边界。
- `site-details-section`：统一标题和资料卡结构。
- `site-details-row`：统一标签、值、编辑字段和分隔线。
- `site-details-owner-row`：共享头像、属主联系信息和标准操作。
- `site-details-danger`：危险操作分区。

### 共享依赖

- `createPageHeader()`：页头与面包屑；业务动作放在页面内。
- `createStandardButton()`：Edit、Cancel、New owner、图片动作。
- `Save changes` 与 Date Picker `Apply` 共用同一文本主按钮类路径；`Delete plant` 再复用该路径并以红色玻璃覆盖，二者不使用额外图标。
- `createToggleSwitch()`：告警邮件开关。
- `.wd-edit-field`：所有文本、数字和自定义选择字段的可编辑表面。
- `createAvatar()`：属主头像。
- `createMaskedIcon()`：原始图标、关闭、保存、更多操作和加号。
- 共享语义色、字体 style、focus ring、玻璃材质和 motion token。

### 材质

- 资料区块继续使用 `.wd-discussion-card` 作为共享组合宿主，但 Site details 最终表面覆盖为设置页材质：深色使用主文字色约 `4%` 的低对比填充，浅色使用纯白；两者都无描边、无阴影。
- 每个模块一张卡；卡片无描边、无阴影，桌面两列等宽。
- 静态资料卡不挂玻璃；只有页面动作、模块动作、浮层和 switch 使用玻璃。
- 卡片圆角为 16px；行间分隔线使用低对比前景色。
- 区块标题位于卡片外，使用 `15px / 590`；字段标签 `14px / 510`，值与输入 `14px / 400`。
- 技术数值不使用缩小等宽字体，只保留 tabular numerals。
- 查看/编辑行默认高度 `52px`，左右内距 `16px`。
- 编辑输入高度 `36px`，不另造一套表单控件尺寸。

## 7. 响应式

- `≥1001px`：两列等宽，列距 `24px`。
- `≤1000px`：单列主资料，安装商与图片并排，访客管理通栏。
- `≤640px`：
  - 所有区块单列；
  - 资料行改为标签在上、值或字段在下；
  - 编辑动作允许换行但保持常驻；
  - 长邮箱、地址使用换行，不产生整页横向滚动；
  - Danger zone 改为纵向排列。

## 8. 可访问性

- 每个编辑字段都有真实 `<label>` 和 `for/id` 关联。
- 告警开关使用 `role="switch"`、`aria-checked` 和原生按钮键盘行为；查看态由真实 `disabled` 防止未进入编辑就修改。
- Plant type、Timezone、Country、Price area 和 Currency 使用页面自定义选择按钮与共享 Glass Surface 选项浮层，不使用浏览器原生 select 弹层。
- 自定义下拉箭头复用顶栏通用 `asset-14.svg`，以 90° 指向下方；不得使用三角形 disclosure 图。
- `Delete plant` 与 `Save changes` 使用同一条文本按钮类路径和相同尺寸，仅把玻璃填充与描边替换为共享红色；文字在深浅主题中始终为白色。hover / focus 必须在红色族内提亮，不能回落成共享 primary 的蓝色。
- 三点按钮拥有包括属主姓名的 `aria-label`。
- 字段错误使用 `aria-invalid` 和行内文本，不只依赖颜色。
- 所有图标按钮有可读名称，不把图标本身作为唯一操作说明。
- 减少动态效果时沿用共享组件行为。

## 9. API 就绪后的扩展

接入真实后端时需要补齐以下接口契约：

- 读取和更新电站基础资料；
- 读取和更新电价配置；
- 读取、邀请、移除属主与访客；
- 读取和更新安装商联系人；
- 读取、更新告警通知设置；
- 上传、替换和删除电站图片；
- 删除电站及其影响确认。

页面层只负责把真实权限映射为可操作、只读或不可见状态；不能用禁用样式替代服务端授权。

## 10. 验收

- 直接打开 `/plants/p25/site?device=inverter` 与刷新后仍停留在 Site details。
- 切换 Overview、Devices、Site details 时 URL 和当前设备保持正确。
- 查看态显示全部资料区块，静态区块不使用玻璃。
- Edit、Cancel、Save changes 状态正确；Save changes 的视觉与 Apply 一致，无修改时点击安全退出编辑。
- 无效数值、邮箱和告警收件人显示行内错误并阻止保存。
- 保存后当前页面会话保留修改，切换到其他页签再返回仍显示新值。
- 存在未保存修改时不能静默切走。
- 深色、浅色、`1000px` 以下单列和 `420px` 宽屏均无整页横向滚动。
- `npm run check`、Site details 专项测试、路由和 Plants Overview 回归通过。
