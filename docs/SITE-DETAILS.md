# Plants Site details 页面规格

更新：2026-11-19
状态：查看态与整页编辑态已进入本地交互预览。
参考：线上 WattDesk `Plant Info` 页面及其编辑态；本页沿用当前 WattDesk 设计系统，不复制参考站点的视觉。

## 1. 页面边界

- 当前可见路由：`/plants/:id/site-v2`，可继续携带 `?device=inverter|bms|heater`；旧 `/plants/:id/site` 只保留为隐藏兼容路由。
- 入口：Plants Overview 的 `Overview / Devices / Site details` 三个页签中的 `Site details`。
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
│ Basic information                │  │ Owner information                │
├──────────────────────────────────┤  ├──────────────────────────────────┤
│ Electricity price                │  │ Visitor management               │
├──────────────────────────────────┤  ├──────────────────────────────────┤
│ Installer contact                │  │ Plant picture                    │
└──────────────────────────────────┘  └──────────────────────────────────┘
                [编辑态] Danger zone（横跨两列）
```

- 左列承载基础配置与安装商资料：基础信息、电价、安装商联系。
- 右列承载人员访问与媒体资料：属主、访客、电站图片。
- Installer company、Contact email、Alarm email recipient 与 Address 使用更宽的值列，查看和编辑态都不得截断。
- 编辑态的 Danger zone 横跨内容网格两列，位于所有资料模块下方，不与保存操作并排。

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
- 空态保持紧凑高度，不保留大面积空白。
- 附注明确访客邀请尚未连接，但只在本地开发预览显示；正式环境不显示开发说明。
- 没有权限和邀请 API 前不显示可提交的邀请表单。

### Danger zone

- 只在整页编辑态出现。
- 横跨两列，位于所有资料模块下方。
- 使用淡红色危险区背景、红色语义标题和说明；`Delete plant` 复用 `Save changes` 的标准玻璃胶囊结构，但底色替换为纯红色，文字固定白色。
- 点击后使用共享 `createConfirmDialog()` 的 `480px` 居中确认层，与设备 `Unbind device` 的结构、危险图标底托和 Depth Reveal 动效一致；禁止使用浏览器原生 `confirm()`。确认后只显示未连接提示，不删除样例电站。

## 5. 状态与校验

- 查看态和编辑态由同一个页面控制器维护。
- 进入编辑态时复制已保存数据；`Cancel` 恢复原值。
- `Save changes` 与 Home 日期选择器 `Apply` 使用同一按钮类路径并始终可用；没有修改时点击直接退出编辑，不做数据写入，避免出现与 Apply 不一致的禁用空胶囊。
- 查看态与编辑态的资料卡位置、宽度和每行右侧控件边界必须一致；编辑行默认高度保持 `52px`，输入或下拉控件不得让卡片整体移位。
- 查看值、编辑输入和下拉文本统一为 `14px / 400`；进入编辑态不能让右侧文字变大。
- 正文资料字段统一使用 `.wd-edit-field`：深色默认 / hover / focus 为主文字色 `8% / 11% / 13%`；浅色默认 `Fills/Quaternary`，hover / focus `Fills/Tertiary`。focus 只使用低对比中性轮廓，不使用蓝色描边，浅色 focus 也不切回纯白。顶部页面标题是 `Title3/Emphasized` 专用编辑表面，不套普通字段高度。
- Site details 最终覆盖：所有 `.wd-edit-field` 编辑表面使用浅灰半透明填充 + 背景模糊，不使用完整 Glass Material；深色 `blur(14px)`、浅色 `blur(16px)`，无玻璃 rim、高光、内阴影或投影。标题 textarea 必须为块级元素，单行承托层与输入框等高，不得留下 inline 基线造成的灰色底条；承托层左右各扩 `14px`、输入内距 `14px`，文本内容与查看态标题保持同一 X 坐标和同一顶部基线，进入编辑不得上浮。Country、Currency、Timezone、Price area、Installer company、Contact 等共享选择触发器全部复用该规则。
- Owner information 的账户间分隔线改为全宽：每个账户行左右外扩 `-20px` 到卡片边缘，再以 `20px` 内距保持头像、信息和操作按钮的原坐标；首行不画线，后续行使用全局 `1px` 分隔色。
- 页面上的 `Overview / Devices / Site details` 三个范围页签允许横向滚动，但滚动容器必须为 hover / focus 放大预留上下各 `8px`。列表使用 `height:calc(100% + 16px)`、`padding:8px`，通过 `top:-8px` 与左右 `margin:0 -8px` 保持页签原位置，不能裁掉上下描边。
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
  - Danger zone 改为纵向排列，并继续保持内容列全宽。

## 8. 可访问性

- 每个编辑字段都有真实 `<label>` 和 `for/id` 关联。
- 告警开关使用 `role="switch"`、`aria-checked` 和原生按钮键盘行为；查看态由真实 `disabled` 防止未进入编辑就修改。
- Plant type、Timezone、Country、Price area 和 Currency 使用页面自定义选择按钮与共享 Glass Surface 选项浮层，不使用浏览器原生 select 弹层。

## 9. Site details

### 当前最终规则（2026-11-18）

- 可见的 `Site details` 使用稳定路由 `/plants/:id/site-v2`，保留可选 `device`；旧 `/site` 只作为隐藏兼容路由保留，不再显示页签。详情导航固定为 `Overview / Devices / Site details`，标签和页面隐藏标题均不得出现 `Site details 2`。桌面内容列最大 `1000px`，Hero 与资料卡共享 surface；Hero 使用 `1px var(--wd-separator-nonopaque)` 浅描边防止融入背景且不加投影，下方资料卡保持无描边、无阴影。Hero 的四角裁切只用 `border-radius + overflow:hidden`，不能叠加 `clip-path`，否则 1px 描边会在四个圆角被裁掉。Hero 最小高约 `264px`，地图铺满内容区并继承 `26px` 圆角，不显示 Plant type / Normal 胶囊。
- 当前地图只请求一张 Mapbox Static Images `dark-v11 / light-v11` 图片，方括号 bbox、`720x440@2x`、站点 zoom `13`，并通过 `setfilter=["boolean",false]` 与 `layer_id=road-label-simple` 隐藏道路文字。同一响应渲染为清晰底图与 `blur(10px)` 上层：清晰底图覆盖右上焦点区，模糊层通过 `28deg` 渐变蒙版在 `42%–78%` 范围从 0 连续过渡到固定 `10px`，再覆盖绿线外侧；模糊层向外 overscan `10px`，避免四边透明软边。深浅主题各用一个预加载 map bank，主题切换使用共享 `--wd-motion-theme` / `--wd-ease-theme` 做 620ms 交叉淡变，未就绪时保留旧图。同一文档只在首次显示地图时淡入，后续返回页面立即显示，刷新后重新播放。地址直接落图，显示国家与完整地址，自然换行并支持复制和完整地址浮窗。
- 定位点位于全 Hero 约 `75% / 39%`，保留 `createStandardButton({iconOnly:true})` 的 36px 命中区。深色模式继续使用玻璃圆钮与两圈波纹，blur `14px` / tint `.24`；浅色模式视觉上只保留 8px 纯色 `--wd-accent-blue` 圆点，玻璃面、波纹、`::after`、呼吸光晕、hover 指针高光、渐变、外描边、阴影和动画全部隐藏。地址右侧内距 `24px`、底部 `28px`；底图简化不得删除定位、地址浮窗或复制交互。
- Hero 四指标与 Company/Contact 使用统一 `createInfoGroup()`：16px 左图标、右侧标签/值，无外框、圆角和底色；图标使用语义实心素材、Labels/Secondary 加 `opacity:.78`。Plant picture 和账户命令菜单也使用实心图标，禁止线性描边。
- 所有 `.wd-edit-field` 使用浅灰半透明填充 + 背景模糊：深色 `14px`、浅色 `16px`，不挂完整 Glass Material，不显示 rim、高光、内阴影或投影。标题承托层左右各扩 `14px`、文本内距 `14px`，编辑文字与查看标题同 X；选择触发器复用该字段表面，选项浮窗仍使用共享 Glass Surface。
- `Energy & tariff` 固定 `Timezone / Price area / Currency / Grid price`，44px 行高、20px 内距、卡内 Calendar 标题、无行前图标。Installer 与 Owner 联系方式统一 `13px/18px/400`、1px 竖线、点击复制和 toast，不使用 mailto/tel。
- Owner 账户行分隔线全宽贯穿卡片，内容仍保持 `20px` 内距，首行无线；Plant picture 空态行高 `20px` 且与 Visitor 卡等高。
- 范围页签横向滚动容器为 hover/focus 预留上下各 `8px`：高度 `calc(100% + 16px)`、`padding:8px`，以 `top:-8px` 和左右 `margin:0 -8px` 抵消，页签原位置不变。
- Mapbox Token 只通过 `WATTDESK_MAPBOX_TOKEN` 注入 meta；本地临时查询参数读取后立即移除，正式域名不接受。Token 缺失或失败时只保留空白地图，不显示占位底图。

### 历史迭代记录

- 规范路由 `/plants/:id/site-v2`，保留可选 `device`；入口为第四个页签 `Site details 2`，不替换或删除原 `/site`。
- 页面读取当前 Site details 会话数据，并支持本地编辑保存；顶部 Hero 显示电站类型、状态、名称、PV、储能与投运日期。
- Hero 左侧不重复公司/SN 副标题。地图铺满 Hero 四周并继承 `26px` 外圆角，`clip-path` 同时锁定四角。清晰地图和 `24px` 不透明模糊地图使用同一全幅几何；清晰层在上方通过椭圆径向遮罩弧形渐入，约 `0%–42%` 保留真实模糊、`42%–84%` 渐变、之后完全清晰。Mapbox 静态图使用带方括号的偏移 bbox 和街区级 `15.2` zoom，将真实电站放在清晰区中心 `75% / 50%`；页面定位按钮位于全 Hero 约 `75% / 34%`。
- 不显示 Site location / Preview 浮动徽标、经纬度或 token 占位文案；合法地图归属由 Static Images API 的 attribution 参数随图输出。Mapbox Token 优先由 `window.WATTDESK_MAPBOX_TOKEN` 提供，其次读取 `home.html` 的 `mapbox-access-token` meta，最后才使用 `localStorage["wattdesk.mapbox.token"]` 作为本地调试覆盖。Token 缺失、失效或网络失败时保留无文案地图预览，不把占位图称为真实地图。
- Hero 不叠加径向蓝光或白色装饰渐变；地图左缘通过同色 Hero 表面的暗化渐变过渡，不能形成泛白竖带。四个指标卡使用两行网格（标签 / 主值），整组垂直居中；标签和主值分别共享基线，Commissioned 的日期时间保持在同一行。编辑态国家使用下拉、地址使用共享编辑字段样式的输入框；Edit / Cancel / Save changes 位于 Hero 地图侧右上角。
- 编辑态隐藏地图定位图标。Country、Installer company 与 Contact 都复用共享选择触发器与 Glass 选项浮窗，不使用原生 select。地址默认值使用完整街道地址，输入框可容纳较长内容。
- 地址区不使用任何独立底色、玻璃面、圆角卡片或底部渐变遮罩；文字与 `20px` 实心面性 `plants/detail/location-solid.svg` 直接落在地图的轻微模糊区域上。国家与地址分行展示，地址自然换行、不得截断。hover / focus 打开共享 Glass Surface 浮窗，浮窗仅显示完整地址；地址本身只用文字下划线，点击复制并 toast `Address copied`。
- Energy & tariff 的信息组不再带左侧 Calendar 图标，只保留卡头标题图标。Alarm email 的 info 控件使用用户提供的 `info2.svg` 作为 `14px` 单色遮罩，不附加圆底、边框或阴影；默认颜色与同一行 `Alarm email` 标签完全一致，直接继承 Labels/Secondary，hover / focus 才使用 Labels/Primary，不得沿用源文件里的固定灰度。
- Hero 四个指标的图标顺序固定为 Plant type `organisation.svg`、PV capacity `solar-panel.svg`、Commissioned `imgBoldTimeCalendar.svg`、Battery storage `battery-storage.svg`；全部使用指标组统一的次级文字色。PV 与电池必须是实心面状图标，内部网格和电量符号使用负形，不得改成线性描边，也不得复用 Module balance / Cell balance。
- 地图在注入 Mapbox 公开 Token 后使用真实 `dark-v11 / light-v11` Public Styles，并以街区级 `15.2` zoom 展示道路；静态图 bbox 必须使用方括号语法，`WATTDESK_MAPBOX_TOKEN` 由本地服务或构建阶段写入 meta，不在源码和仓库中保存真实 Token。
- 组件同时渲染同一全幅几何的 `14px` 模糊地图和清晰地图。清晰层通过椭圆径向遮罩形成弧形边界；左侧真实模糊、中部渐变、右侧清晰，不得用 `backdrop-filter` 或直线遮罩替代。
- 定位按钮最终覆盖上述浅色中心描述：圆点必须复用共享玻璃按钮材质并显示明确毛玻璃，深色 blur `14px`、tint `rgba(153,153,153,.24)`，浅色 blur `18px`、tint `rgba(238,238,238,.64)`。宿主 `.site-v2-map-pin.wd-glass` 必须设置 `isolation:auto`，否则 `backdrop-filter` 只存在计算值而不模糊地图。浅色蓝点隐藏 `::after` 白点，内部不含白色高光，仅用 `#56c4f2 → #0b7fbe → #075c8d` 的蓝色渐变保持层次。
- 本地页面可通过 `?mapboxToken=pk...` 完成一次性引导，仅限 localhost；读取后地址栏立即移除该参数。正式环境继续使用构建环境注入的 meta Token。
- Alarm email 的共享开关在浅色主题不能显示明显白色内发光；24px 轨道使用降低后的顶部/底部反射、rim 和内部亮边，开启态仍为共享蓝色玻璃和白色滑块，深色模式不变。
- Hero 与除 `Energy & tariff` 外的资料卡统一使用 `--site-v2-card-surface`，Hero 不得更暗；地图左缘桥接使用同一个 surface token。
- 地图信息文字通过底部内距上提并与左侧指标卡底边对齐，但信息层遮罩盒仍贴齐 Hero 底边，避免地图底部漏出。
- Hero 不显示 Plant type 与 Normal 状态胶囊。Hero 与常规资料卡统一使用 `10%` 主文字色混合的 surface，保持无描边同时让边界可辨。
- Hero 桌面最小高约 `264px`，标题区增加上下留白并在编辑态复用共享标题输入；编辑框宽度铺满标题区域、与区域左缘对齐，左右内距至少 `14px`，长标题自动换行增高且文字不得贴边。四个指标用 2×2 紧凑透明、无描边图标信息组排列，右侧地图列比例提高并继续向左扩展。
- 所有资料卡内容统一 `20px` 左右内距，Energy 的标题行和数据行也使用同一数值。
- 深色主题 Hero 和全部资料卡使用与 Service Ticket 相同的 `Backgrounds/Secondary`，不使用更深黑混合或 Energy 私有填充。
- 所有内部横线与卡片描边统一采用全局 `1px var(--wd-separator-nonopaque)`，不得保留 Energy 自有的 6% 分隔色或 16% 描边色。
- 自定义下拉箭头复用 `asset-14.svg`，统一使用 `14px × 14px` 字形盒并旋转向下。
- `Energy & tariff` 按旧版 `Electricity price` 参考卡使用主文字色 `4%` 透明卡面、`16px` 圆角，标题保持卡内，卡体上下各保留 `16px` 内距。固定行序为 `Timezone / Price area / Currency / Grid price`，使用 `44px` 行高、共享左右 `20px` 内距、`14px / 510` 标签与常规字重标准字体值；卡片按自身内容高度顶对齐，不能被同行 Installer 拉伸，查看态与编辑态卡高、行序一致且标题、行标签位置不动。编辑态四项全部可用，Grid price 为数字输入，其余为共享 Glass 选择器，Currency 变化同步单位，原生步进器隐藏。
- Site details 2 最终视觉覆盖：Hero 四张指标卡与 Company / Contact 共用图标信息组，左侧 16px 图标、右侧小标签和值，移除 1px 外框、圆角和卡片底色；图标相对完整信息组垂直居中。排布为 `Plant type / PV capacity` 与 `Commissioned / Battery storage` 两行，分别复用 organisation、module-balance、calendar、cell-balance 图标；网格按内容宽度排列并保留 `40px` 中心列距。图标与小标签统一使用 Grid price 的 Labels/Secondary 色。Company / Contact 编辑态选择框左对齐，宽度按当前内容自适应。`Energy & tariff` 保持原有卡面与行结构。
- 下方卡片全部无描边、无阴影；标题、标题图标与右上角加号放回卡片内部。所有卡统一 `16px` 的标题到正文间距，首行不绘制独立横线。第一行 `Energy & tariff`、`Installer & support` 同列宽、顶对齐并最终等高。第二行 `Owner information`、`Plant picture` 等宽，第三行 `Visitor access` 位于 Owner 下方左列并保持相同列宽。`Installer & support` 标题不动；公司和联系人共用同一套上下排版：`12px` 次级标签在上，`14px / 510` 信息值在下；每组最左侧使用 organisation / user 原始图标，联系人不显示头像。邮箱和电话位于联系人下方并直接拼接为 `邮箱 | 电话`，不再重复标题；两者统一为 `13px / 18px / 400` 次级色，分别是可键盘操作的点击复制按钮，不使用 `mailto:`、`tel:` 或跳转。Alarm email 作为底部设置行，其分隔线左右贯穿卡片；Alarm email 标签右侧有 14px info 按钮，hover / 键盘 focus 时显示共享 Glass Surface 说明：“Alarm emails will be sent to the installer contact email when selected critical device alarms occur.”，按钮使用普通 pointer 而非系统 help 问号光标。编辑态 Company / Contact 为选择器，Email / Phone 由联系人自动带入但仍可点击复制，Alarm email 使用共享开关且仅编辑态可切换。Owner 固定展示三个信息完整的示例账户，每个都含头像、姓名、邮箱、电话与三点操作菜单，上下间距更紧凑且邮箱/电话字号相同；标题右侧玻璃加号用于新增账户。Visitor 独立成卡，空态文字与 Plant picture 使用同一三级文字色，并移除多余底部留白。Plant picture 使用面性图片标题图标，空态矮卡居中，有图时高度跟随图片自然增长。
- Site details 2 最终覆盖 Plant picture 与账户操作菜单：Plant picture 标题图标改为 16px 单一连续实心面状图片符号，内部太阳和山形用负形表达；无图占位行固定 20px，卡片与 Visitor access 等高，有图时再随图片自然增高。`Edit account`、`Manage access` 等命令型菜单项都必须在文字左侧显示 16px 语义图标，图标继承菜单次级色、在 hover / focus 时与文字同步提亮。
- 账户操作菜单的 `Edit account` 和 `Manage access` 图标必须为实心面状：Edit 使用填充铅笔与实心底线，Manage access 使用填充锁体与锁梁，锁孔通过负形表达；不得再使用 stroke-only 线性图标。
- Owner information 的每个账户都把邮箱与电话按 Installer 联系方式同一套规则展示：字号 `13px / 18px / 400`、次级色、中间 `1px` 竖线、hover / focus 主色与下划线、`cursor:copy`；两项都是可键盘操作的点击复制按钮，点击后显示 `Email copied` 或 `Phone number copied`，不得使用 `mailto:` / `tel:` 跳转。
- Hero 四项指标以及 Installer company / Contact 的左侧图标仍引用 `Labels/Secondary`，但增加 `opacity: .78` 的光学权重校正，使其视觉颜色与相邻小标签一致；不得改成 Tertiary 或另一个硬编码灰色。
- `≤1000px` 保持全幅 Hero 和右半清晰地图；`≤760px` 指标两列、资料卡单列；`≤520px` 指标与信息行均改为单列，Hero 最小高 `520px` 并隐藏定位点。四个页面页签在窄屏横向滚动，页面本身不能出现横向溢出。
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
