# WattDesk 全站设计与交互规范

更新：2026-10-29。当前首页、Plants 列表及后续页面沿用本规范。开发入口为根目录 `AGENTS.md`；本文件记录共享资源、状态、动效与验收。参数以对应共享 CSS / JS 为准，调整时同步本文。

## 1. 当前设计依据

- Figma：[WattDesk-UI / Home-主画板](https://www.figma.com/design/7hGGOqflIMGWTYQMm9tce0/WattDesk-UI?node-id=14434-3261)。以该画板、当前母版状态和最新用户标注为准。
- 浅色依据：[Home-主画板 - 浅色模式](https://www.figma.com/design/7hGGOqflIMGWTYQMm9tce0/WattDesk-UI?node-id=14704-3871)。深浅画板分别核对，不能用反色、黑色滤镜或深色 RGB 近似映射代替真实变量绑定。
- 网页入口：`/home?glass=figma`；`/`、`/home.html` 会规范到 `/home`。基准尺寸 1920×1080；实际评审尺寸还包括 1545×1252。
- 当前技术：原生 HTML / CSS / JavaScript。沿用已有结构，避免为单个页面引入另一套样式与组件体系。
- 历史 glass / linear / workspace 原型已移除并备份，2026-09 业务规划在 `docs/history/`。它们的旧菜单、材质、字体和动效值不覆盖本规范，历史功能不代表已迁移。
- 后续页面复用通用 token 与控件状态。首页的 Figma 绝对坐标提取用于当前还原，不应作为所有页面的布局模板；新页面采用语义结构与适合内容的布局。

## 2. 共享文件与调整入口

| 内容 | 维护入口 | 页面或组件职责 |
|---|---|---|
| 主题、语义色、字体、字号、间距、圆角、动效节奏 | `design-preview/src/foundations/tokens.css` | 引用 token，不重复定义同义值 |
| 组件级共享动效契约 | `design-preview/src/foundations/motion.css` | `shared.css` 自动加载；组件只声明默认与激活视觉值，不写局部 transition 时长 |
| Figma 文字样式源与生成 token | `design-preview/design/figma/figma-type-source.json` / `src/foundations/type.css` | `npm run sync:type` 生成；`typography.js` 将节点或语义组件绑定至命名 style |
| 全局连续圆角与分隔线宽度 | `design-preview/src/foundations/geometry.css` / `geometry.js` | 保留半径、尺寸；普通圆角矩形平滑，原稿圆形和胶囊形保持 round |
| 标准头像 | `design-preview/src/components/avatar.css` / `.wd-avatar` | 1px 同色内描边；深色中心扩散阴影，浅色无外投影。组件只负责尺寸与内容 |
| 玻璃填充、黑白轮廓、内阴影、反光、投影、hover 亮度 | `design-preview/src/components/glass-material.css` | 只决定尺寸、圆角与是否使用玻璃 |
| 材质挂载和鼠标微光 | `design-preview/src/components/glass-material.js` | 通过 `createGlassMaterial({surfaces})` 注册表面 |
| 浮层开合、图表首次可见载入 | `design-preview/src/foundations/motion.js` | 调用共享控制器，不复制动画 |
| 控件文字与图标的共享 hover / focus 状态 | `design-preview/src/components/control-states.css` / `control-states.js` | 保留原始字形，复用不透明状态遮罩 |
| 语义日期选择与周期范围 | `design-preview/src/components/date-picker.js` / `.css` | 预设、日历、起止日期与 Apply；面板 462px 宽、最低 433px 高，≤520px 视口切换纵向布局 |
| 标准按钮 | `design-preview/src/components/button.css`、`controls.js` | `.wd-button--pill` 胶囊基础；`.wd-button--neutral` 中性玻璃、`.wd-button--primary` 实心蓝；材质由共享层提供 |
| 首页布局与本地交互装配 | `design-preview/src/pages/home/home.css` / `src/pages/home/index.js` | 页面语义、局部布局与状态 |
| Figma 测量、图标、Logo、字体 | `design-preview/home-assets/` | 使用原始资源并保留来源 |
| 原始玻璃参数存档 | `design-preview/design/figma/glass-source.json` | 用于溯源，不是第二套运行时参数 |
| 原始浅色玻璃与场景绑定 | `design-preview/design/figma/glass-light-source.json` / `home-light-source.json` | 保存浅色节点、变量绑定及原始混合效果 |
| Figma 双主题颜色源与生成 token | `design-preview/design/figma/figma-color-source.json` / `src/foundations/colors.css` | 62 个 Colors 变量含双模式及别名；用 `npm run sync:themes` 生成 |
| 提取场景的主题适配 | `design-preview/src/pages/home/scene-theme.js` / `src/pages/home/data/theme-map.json` | 使用真实浅色绑定与本地 SVG；切回深色逐项恢复原样式 |
| 全站主题切换 | `design-preview/src/foundations/theme-controller.js` / `theme-transition.css` | 同时淡变页面、SVG 与玻璃；不复制到每个控件 |
| 首页实现与边界说明 | `docs/PROJECT-STATUS.md` | 记录本页历史、验证与局限 |

新增变量先查既有 token；确实缺失时在共享文件命名并定义深浅主题值。修改共享值要检查全部消费方，避免逐页补丁或用大量 `!important` 掩盖状态冲突。

## 3. 主题、文字与素材

- 使用 Labels/Primary、Secondary、Tertiary、Fills、Separators 等语义 token。普通 Labels 与 Labels/Vibrant 不混用，SVG 已有透明度时避免再次乘上相同透明度。
- 图表数据卡片轮廓使用 `--wd-separator-vibrant`，对应 Figma Separators/Vibrant：深色 `#1A1A1A`，浅色 `#E6E6E6`。
- 字体使用已提供的 SF Pro 本地 WOFF2 与系统回退。字号、字重、行高沿用 Figma 样式，数字、单位和更新时间保持稳定对齐。
- 页面级大标题（含首页 `14445:3352`）使用 **semibold 590**，保留 34px 字号、41px 行高与 0.4px 字距；Figma 通用 `Large Title/Emphasized` 仍为 700，不得为统一页面标题反向修改通用 style。首页当前由 `home.css` 覆盖，新页面在页面级采用同一规则；共享 `.wd-page-title` 入口尚未落地，未实现前不声称已提供。
- 2026-10-16 文字核对：归档 36 个命名 style（含外部库 ID）及当前画板 101 个可见文字节点的绑定。使用 `data-type-style="14/14 medium"` 等完整样式，不按字号推测样式。Medium 为 SF Pro 原始可变字重 **510**，Emphasized 按 style 使用 **590 / 700**，不能一律替换成 500 / 600。`14/14 medium` 为 14px、AUTO 行高、-1% 字距；用于侧栏菜单、侧栏搜索、tab、日期周期及头像缩写。分类标题用 Caption1/Emphasized（12/590），账户姓名 Footnote/Emphasized（13/590），角色 Caption2/Regular（11/400）。提取场景保留真实混合文字分段，统一样式的旧分段不得覆盖新绑定的字重。更新源数据后运行 `npm run sync:type`；生成文件不手工修改。旧 `--wd-type-*` / `--wd-leading-*` 已移除，字体只使用 `type.css` 的命名 style；组件 fallback 使用明确像素值，不再保留旧字号别名。
- 侧栏文字在深浅主题使用同一套 `14px / 510`、字体、字号、字距和行高，仅颜色不同；深色下浅色文字因对比与抗锯齿显得更亮、更粗，不代表字重不同。不得为消除这种观感差异而修改主题级字重。
- Logo 与图标使用原始导出 SVG，不能用近似图标、Unicode 字符或重画路径代替；中性与彩色状态基于同一个原始字形。
- 正式运行使用已保存的本地资源，不依赖会过期的 Figma MCP 临时 URL。新增资源记录来源节点，参考 `design/figma/source-icons.json`。
- 深浅主题保持一致语义、层次和操作反馈，不通过整页反色实现。
- 全量 Figma 颜色使用 `--wd-figma-*`，由保存的变量 ID 和 Light / Dark 值生成。已有 `--wd-label-*`、`--wd-bg-*` 等为组件语义入口；新增组件直接引用主题 token，不硬编码深色 SVG 的填充。旧提取场景通过 `home-theme-map.json` 读取对应浅色节点的真实填充、描边、文字分段与阴影，避免根据 RGB 猜测语义。
- 浅色主画布为 Backgrounds/Secondary `#F2F2F7`；主内容为 Backgrounds/Tertiary → Secondary 渐变；图表卡片为 Backgrounds/Secondary，轮廓为 Separators/Vibrant `#E6E6E6`；网格和主内容描边为 Separators/Opaque `#C6C6C8`。主文字黑色，次级文字 `rgba(60,60,67,.6)`。图表与彩色图标使用对应浅色 SVG 和 Accent 值，不能对彩色素材加黑色滤镜。
- 灰色中性图标的原 SVG 带 `fill-opacity="0.7"`；直接作为遮罩会把主文字色削成浅灰。运行遮罩改用 `home-assets/masks/` 下同路径几何的不透明副本，由 `npm run sync:masks` 生成，禁止手改颜色或按截图猜值。
- 顶部标签图标高亮时只接受两种状态：原始彩色图标继续显示彩色；灰色中性图标（Cell balance、Module balance、Device track 等）改用当前主文字色的遮罩，深色下必须是纯白，不能直接显示灰色导出图。实现通过 `isNeutralIconFile()` 分流，不改素材、尺寸或颜色 token。
- 工作区标签默认只有一个 Home，不预置 Plants 占位；最大宽度 180px，最小 58px，在可用空间内自适应，空间不足才进入横向滚动。
- 新增工作区标签时，先按插入后的标签数量算出最终平均槽位，再让既有标签在首帧直接采用该槽位；新标签只从 0 展开到该槽位。入场期间由 `is-entering` / `is-resizing` 隔离宽度过渡，禁止既有标签再播放第二条 `flex-basis` / `width` 动画，也禁止新标签先按旧平均宽度出现一帧。回归以 `getComputedStyle(...).width` 验证布局槽位，不能用包含玻璃按压缩放的 `getBoundingClientRect()` 代替。
- 工作区标签在压缩或横向溢出时，鼠标停留于标签条内关闭任意标签，剩余标签保持当前宽度、位置与 `scrollLeft`；后一个标签的关闭 X 移入空出的位置，支持在原位连续关闭。鼠标离开标签条后才按可用空间恢复自适应宽度。溢出期间用隐藏的尾部占位维持滚动范围，避免删除节点夹紧滚动位置；宽标签未压缩时保留标准关闭动画。
- 顶部标签总宽度已占满可用空间时，Add 按钮固定在标签条最右侧；新标签从 0 展开不得带动 Add 左移。占满时标签列表填满剩余宽度（`is-slot-filled`），未占满时仍按内容自然增长。验收用真实指针逐帧核对 Add 的位置，不允许只检查静态布局或 `flex` 值。
- hover / focus 的中性图标必须实际显示为主文字色，深色下为纯白。原始 SVG 的标签透明度只用于默认状态；共享状态遮罩去除该透明度，不能只设置 CSS 颜色却仍显示半透明灰。保留原始路径与原始素材，彩色图标继续显示原色。

## 4. 统一玻璃材质

### 分层

所有玻璃复用同一组件，保留两个独立物理层：

1. `.wd-glass-fill` 对应 **Fill + Shadow**：中性底色、背景模糊、暗色外轮廓与轻投影。
2. `.wd-glass-optics` 对应 **Glass Effect**：上缘暗带、下缘回光、窄白色内亮边，内部挂载共享状态层与微光层。

材质在文字与图标下面，内容保持锐利。黑色外轮廓与白色内亮边分开，厚度集中在边缘；避免大面积白渐变、整圈亮描边、强烈眩光和过重投影。Figma 原生 GLASS 由网页近似实现，必须对照真实浏览器画面校准，不能只比较参数。

当前首页的玻璃表面共用同一材质：历史/前进/后退、Workspace tab、工具栏整组、侧栏搜索和主搜索、四张状态卡、周期选择、刷新及通知。实际表面数量随打开的 tab 变化，验收按当前 DOM 核对，不把“15”当作静态数量。图表卡片仍为普通数据表面；不要将全站统一理解为所有容器玻璃化。

### 参数与状态

- 正式方向使用 `figma`；弃用 `liquid` 对比只在外部备份，运行代码不保留组件级材质分叉。光学参数统一位于 `glass-material.css` 的 `--wd-glass-*`。
- 深色设计稿底色为 17% 中性灰、背景模糊 6px、投影 4%；已确认的上缘暗带 `.215` 不变。2026-10-22 按实拍收敛白光：普通玻璃白内沿顶/底为 `.145/.118`、内阴影高光 `.085/.12`；**Glass Surface** 白内沿顶/底为 `.15/.118`。上下反光带的长度与外层黑轮廓不变，只降低白色强度，避免边缘读成白线。
- 浅色以黑 25%、白 25%、`#444` 60% Linear Dodge、`#F8F8F8` 20% Luminosity 为来源，运行时中性底为 `rgba(238,240,243,.74)`；独立高光层暗带 `.05`。浅色调整不能回写深色。
- 2026-10-16 浅色收敛：居中柔和反射和低对比上下渐变，移除对角冷蓝/灰紫色块与有色侧亮边；2026-10-21 进一步提升可见度：白内沿 `1 / .65px`、内高光 `.92/.62`，投影 `.04`、y=10px、blur=22px，叠加 `.004`、y=2px、blur=4px、spread=-1px 的短阴影。2026-10-22 底缘厚度保持 `14px`，但不再使用 `4px` 纯白台面，改为从 `.78` 起连续衰减，保留上下厚度同时降低纯白占比。
- 2026-10-22 浅色外轮廓最终定稿：保留上下细黑灰线与左右略深的纵向渐变，不再是均匀灰框。普通玻璃上下 `rgba(0,0,0,.09)` / 有效宽度约 `.85px`，左右 `rgba(0,0,0,.38)` / 有效宽度约 `1.1px`；hover 只小幅增至上下 `.11`、左右 `.42`，不能跳回浅色。深色外轮廓 `.95` 与面板 `.72` 均不变。该边界来自 `.wd-glass-fill` 的侧缘与上下单边阴影，不是边框或焦点环。

| 项目 | 深色 | 浅色 |
|---|---|---|
| 指针附近轮廓 | 白 `.72` | 普通表面近黑 `.42`；圆钮近黑 `.72` |
| 轮廓宽度 | `1px` | `0.5px` |
| 轮廓定位 | `inset:0` | `inset:-0.5px`，贴齐真实外轮廓、覆盖亮缝 |
| 内部跟随光斑 | `.07` | `.58` |
| 局部半径 | `44px` | `44px` |
| 投影 / 外轮廓 | 保持确认值 | 投影 `.075→.085`；上下 `.09`、左右 `.38`（纵向渐变），hover `.11/.42`，左右略深但不形成黑框 |
| 圆钮上下沿高光 | `.30/.38` | 同层级独立值，避免小尺寸白块 |

- hover 只提亮指针附近的一段边缘；内部不整片变白，整圈轮廓不一起增亮。浅色轮廓外扩半像素是为了贴边，不向内占用表面。选中 tab 使用同一反光场由 `.08` 淡变到 `1`，不瞬间换渐变。
- 正圆玻璃控件：宿主为正方形且半径达到短边一半时，共享材质自动加 `.wd-glass--disc`；调用方不手写、不改半径、不写独立光晕。键盘 focus 与 hover 共用边缘光。

### 浮层玻璃（Glass Surface）

- 名称：**Glass Surface**（浮层玻璃材质）。来源分支 `.wd-glass--surface`；宿主同时加 `.wd-glass-popup` 表示“整面板不缩放”，与 `.wd-glass-chrome` 不是同一语义。
- 默认范围：所有菜单、popover、tooltip、toast 和图表数据浮签等**浮层一律默认使用 Glass Surface**；已有浮层和将来新增浮层都按此执行。图表卡片、状态卡等常驻数据容器仍是普通表面，不因本条自动玻璃化。
- toast 是全局顶部短反馈：固定在工作区顶部，水平沿用内容区中心线，纵向中心与页面标题中心对齐；当前以 `top:78px` 为基准，不用底部 toast。页面不得覆盖该位置或另建同类通知层。
- toast 的入场/退场使用共享 motion：从 `translateY(-4px)` 下落入位并淡入，使用 `--wd-motion-panel` / `--wd-ease-panel`；退场继续上浮到 `-4px` 并淡出，使用 `--wd-motion-panel-exit` / `--wd-ease-hover-out`。连续提示不重复闪入，减少动态效果时立即显示和移除。
- 复用方式：直接用共享 `createPopoverController({overlays,toastElement,motion,glass})`。`popover()` / `registerPanel()` 会自动加 `.wd-glass--surface wd-glass-popup` 并以 `radius:18,interactive:false` 挂载，调用方不要再手写材质。自定义面板需自行加类并调用 `glass.addSurface()`；内容放在同级容器，禁止自己写 `blur`、底色或 `box-shadow`。
- 浮层圆角按尺度分三档，统一取 token：紧凑提示 / 数据浮签 / tooltip 用 `--wd-radius-compact`（12px），通用 popover / 图表菜单用 `--wd-radius-medium`（18px），标准浮层菜单与日期、搜索、历史等大面板用 `--wd-radius-large`（30px）。圆角只由宿主声明，玻璃各层继承；不按单个内容再发明半径，也不为“看起来更大”随意加值。图表数据浮签按此规则从原稿的 8px 提到 12px。
- 已自带 `.wd-glass` 的弹窗（日期、历史、搜索）由控制器自动跳过，不能重复挂载第二层材质或第二个 `ResizeObserver`。tooltip、toast 与图表数据浮签属于只读表面，必须传 `interactive:false`，保留材质和指针光晕但不响应 hover / 按下缩放；它们的文案要放在独立 span 中，不能用 `textContent` 覆盖宿主，否则会删掉材质子层。
- 结构仍是 **Fill + Shadow 底层 + Glass Effect 高光层**：`.wd-glass-fill` 负责底色、背景模糊、暗外轮廓与投影；`.wd-glass-optics` 负责内亮边、hover 状态层和指针微光。内容不穿过 filter。
- 深色：`blur 18px`、`saturate 1.20`、底色 `rgba(28,28,30,.30)`；浅色：`blur 9px`、`saturate 1.45`、底色 `rgba(232,237,244,.44)`。浮层必须能透出背后页面，不能读成实心卡片；浅色尤其不能靠加高不透明度换取“干净”。浅色模糊压到 `9px` 是为了保留背后卡片的边缘与色块，模糊越大越读成均匀白膜。
- 浅色浮层整圈外轮廓从 `.27/.33` 收到 `.16/.20`（外圈 / 侧缘）；普通玻璃以上下 `.09`、左右 `.38` 的纵向渐变独立表达卡片厚度，浮层不套用这组侧缘值。全屏搜索结果面板是唯一搜索专用例外：使用 `--wd-search-outline .08 / --wd-search-outline-side .10`，避免在整页霜化背景上读成黑框。指针深色弧与水洗参数不变。深色浮层 `.72` 外轮廓保持不变。
- 2026-10-22 深色浮层厚度：移除整面斜向反光，改为顶部约 `9px`、底部约 `14px` 的独立白色厚度带；白内沿 `.15/.118`、带宽 `.68px`。浅色浮层同样改为顶部约 `9px`、底部约 `15px` 的白色厚度带，白内沿 `.94/.80`、带宽 `.72px`；浅色外轮廓、投影和指针深色弧保持已确认值。
- 浮层指针白光：深色内部光斑 `.085`、指针边缘 `.62`、半径 `180px / 120px`；浅色内部 `.80`、指针边缘为**深色弧** `black .46`、半径 `140px / 120px`。只亮指针附近一段，不整圈发白。浅色面板本身接近白色，白色边缘在白底上不可见，因此浅色用深色弧 + 内部白光形成“光斑”，不是整圈白描边。
- 浅色弹窗不再另设 `tint/blur` 覆盖；所有浮层共用上面这一组 token，避免只有弹窗再次变实。浅色普通玻璃同步为 `tint rgba(238,240,243,.74)`、白内沿 `1 / .65px`、内亮边 `.92/.62`、指针边缘黑色 `.42`，与浮层形成“浅底 + 深弧 + 白内沿”的同一套语言。
- 嵌套玻璃只由最内层响应指针：弹窗内的输入框、Cancel/Apply、月份圆钮各自拥有 `data-glass-pointer` 与光斑，外层浮层不抢状态。该规则在共享 `glass-material.js` 中按 `event.target.closest('.wd-glass')` 判定，新组件自动继承，不写局部例外。
- 共享材质只提供零优先级的定位默认值 `:where(.wd-glass){position:relative}`，用于让材质层有包含块；不得用普通类选择器声明 `position` 覆盖页面节点的 `absolute` 或顶栏按钮的绝对定位。首页节点、侧栏圆钮和浮层各自拥有定位，材质层不得改变布局。
- 微光只跟随当前鼠标所在的一个表面，每帧最多更新一次；没有持续空转循环，不倾斜或移动控件。移出、滚动与窗口失焦后淡出；触屏和减少动态效果关闭跟随。嵌套时以最内层玻璃为准，避免外层浮层吞掉控件自己的光。
- 浮层退出统一由共享生命周期处理：点击外部、Apply / Cancel、按 Esc、切换侧栏路由、切换工作区标签或离开当前页面时，宿主内容、`.wd-glass-fill` 与 `.wd-glass-optics` 必须沿同一时间轴淡出后再整体移除，不能先隐藏内容、后收底板，也不能让浮层跨页残留。新浮层接入共享控制器即可继承，不逐组件补退出逻辑。
- 浮层定位属于触发元素，不属于视口：所有锚定浮层（日期选择、`Chart options`、语言 / 外观 / WattDesk 菜单、历史、工作区标签 tooltip、内联搜索结果及后续同类浮层）在页面内任意滚动容器滚动、窗口缩放或 `visualViewport` 变化时，必须按触发元素当下的视口坐标重新定位，不得缓存首次 `getBoundingClientRect()`。统一在文档捕获阶段监听 `scroll`（嵌套滚动区不会冒泡）并用 `requestAnimationFrame` 合并更新；触发元素大部分滚出视口后关闭浮层，不得把它夹在视口边缘。新增浮层一律接共享 `registerPanel()` 或同一套实时定位约定。

#### 标准浮层菜单（Standard Shell Menu）

- 适用：顶栏 `Language`、`Appearance`、`WattDesk`，历史浮窗及后续文本型菜单。统一使用 `components/menu-popover.js` 的 `menuHeading` / `menuList` / `menuRow` / `menuNote` / `mountMenu`，内容根节点为 `.wd-menu`；外壳仍由 `registerPanel()` 或历史面板自己挂载 Glass Surface。
- 外壳：紧凑菜单固定 **200px** 宽、**30px** 圆角、0 内距，由 `.popover--menu` 提供；历史浮窗因路由标题较长，是唯一保留 **280px** 宽度的例外。不能按文案临时加宽，也不能为单个菜单另写外壳。
- 内胆：`.wd-menu` 顶部内距 `20px`，左右与底部各 `10px`，标题/列表纵向间距 `10px`；标题使用 `Footnote/Emphasized`（13px / 590、`Labels/Secondary`），左右内缩 `14px`。列表行固定 `36px` 高、胶囊圆角，左右内距 `14px`、图标间距 `8px`，文字用 `14/14 medium`（14px / 510），默认 `Labels/Secondary`。
- 状态：行 hover / 键盘 focus 使用 `--wd-fill-secondary` 背景并让文字、中性图标同步转为 `Labels/Primary`；选中行文字为主文字色。勾选固定占尾部 `20px` 槽位，用 `currentColor` 加 `/home-assets/tickle.svg` 不透明遮罩，未选中仅隐藏不占位变化，切换语言时标签不能左右跳。
- 图标来源：菜单行不另建按文件名猜色的逻辑，直接复用侧栏路由图标。`Home` 为灰色 mono 遮罩；`Plants`、`Service ticket`、`Statistics` 保留原始彩色；`Cell balance`、`Module balance`、`Device track`、`WattDesk`、`Your teams`、`End users` 等中性素材走 `isNeutralIconFile()` 的共享灰色/主色状态。不得把全部行统一压成 mono，也不得在浅色下贴入白色 Home 原图。动态生成的菜单（历史浮窗等）必须在挂载前调用 `prepareIconMasks()`，得到与首屏侧栏相同的 `opaqueMaskURL` 不透明内联遮罩；否则原始导出的 `fill-opacity` 会让 hover 主色发灰。悬停反馈共用 `.wd-menu-row` 的图标与文字状态，不另写颜色或节奏。
- 尾距：列表最后一行到面板底缘固定 `10px`。历史列表与紧凑菜单共用同一内胆，不为历史另写行高、标题或勾选样式。
- 扩展：语言等预览菜单可以放占位语言并做本地勾选切换，但不得据此声称已接入本地化、持久化或真实后端。新增菜单先复用上述 API；只有确实需要图表自定义布局时才使用通用 18px popover。

- 禁用控件不响应；未选中 tab 保留默认材质，不能看起来像 disabled。新页面直接挂载共享组件，不复制材质 CSS 或恢复旧提取光学层。

### 标准按钮（Standard Button）

- 所有面板、菜单、表单与后续新增界面的操作按钮统一使用共享 `components/button.css` 的胶囊按钮，**不按页面另写颜色、圆角、内距或材质**。日期选择器的 `Cancel` / `Apply` 是当前基准实例。
- 结构固定为 `wd-button wd-button--pill` 加一个变体：中性按钮 `.wd-button--neutral`，主按钮 `.wd-button--primary`。两者高度 `36px`、左右内距 `16px`、胶囊圆角 `999px`、文字 `13px / 510 / 18px`、字距 `-.08px`，不按文案长度改字号或高度。
- 中性按钮：挂共享普通玻璃（默认 `18px` 半径），默认 `Labels/Secondary`，hover / 键盘 focus 变为 `Labels/Primary`；用于 `Cancel`、关闭、次要操作。
- 主按钮：实心 `Accents/Blue`，关闭模糊、白色反射场和上下内阴影，只保留细深色外轮廓、极细亮边和指针高光；hover 只轻微提亮，不能洗成浅蓝。每个视图只保留一个主按钮，用于 `Apply`、保存、确认等唯一主动作。
- 两个变体都属于可交互玻璃：hover / 按下缩放、指针边缘光弧、禁用 `opacity .55` 与 `cursor:default` 全部由共享材质和状态层提供，调用方不写局部 `transform`、`box-shadow` 或 transition。真实 `disabled` / `aria-disabled` 必须阻止点击和 Enter / Space。
- 圆形图标动作复用同一胶囊按钮，加 `.wd-button--disc`：`36×36`、零左右内距、`50%` 圆角，保留共享中性玻璃、缩放、指针光弧、焦点和禁用契约。用于工具栏的筛选、列显示、刷新等动作；不得另建页面局部圆钮材质。宿主为正方形且半径饱和时，共享材质自动加 `.wd-glass--disc`。
- 旧 `.wd-date-action` 仅作为日期选择器的兼容别名，不再承载任何材质；新增组件直接使用标准类名，不复制日期选择器样式。

## 5. 控件状态约定

| 对象 | 默认 | hover / 键盘 focus | 点击 / 选中 |
|---|---|---|---|
| 侧栏导航 | 次级文字与中性图标，彩色图标保留来源色 | 文字统一主文字色（深色纯白），禁止彩色文字；中性图标主色，彩色图标保留原色；背景轻亮 | 选中背景按设计，无额外描边和阴影 |
| 顶部 tab | 未选中图标、文字为 Labels/Tertiary | 原始彩色/白色图标、主文字色，玻璃正常响应 | 选中图标原色、文字主色；本页仅切换本地状态 |
| 账户入口 | 姓名为主文字色，双箭头为 Labels/Secondary 灰色 | 姓名、头像与双箭头一起变为主文字色，深色下为纯白 | 暂无动作；旧账户浮层已按用户要求移除，等待重做，不得恢复旧内容 |
| 通知按钮 | 中性铃铛图标与默认玻璃 | 图标实际变为主文字色，深色下为纯白 | 暂无动作；旧通知浮层已按用户要求移除，等待重做，不得恢复旧内容 |
| 玻璃控件与卡片内的中性图标 | 次级图标和默认玻璃 | 图标实际变为主色（深色纯白），玻璃面部与底缘明显但克制地提亮 | 有限反馈，不跳动 |
| 工具栏组内图标 | 保持组内分隔与共享玻璃 | 图标下方圆形高亮，不用整格矩形色块 | 轻量浮层开合 |
| 前进/后退等中性图标控件 | 可用时 Labels/Secondary，不可用时 Labels/Quaternary | 可用时图标主文字色；不可用时保持 Quaternary，不高亮玻璃或微光 | 不可用时阻止点击、Enter 和 Space；由实际业务状态控制 |
| 图表三点菜单 | 原始三点字形 | 三点下方圆形亮起，图标提亮 | 扩大命中区时保持原图标中心 |
| 前两张状态卡片 | 默认玻璃与右上箭头 | 卡片略亮，内部箭头向右上 2px 并平滑复位；卡片本体不动 | 在当前标签内跳转 `/plants`；筛选结果待真实接口接入，预览不伪造筛选结果 |
| 快捷入口 / View all | 原始文字与图标 | 下划线淡入，保持几何稳定 | 本页反馈，不假装完成未实现的跳转 |

真正 disabled 必须有业务或状态依据并阻止操作；未选中不是 disabled。每个交互控件同时检查默认、hover、focus、选中和禁用/加载（适用时）。

账户与通知入口当前只保留按钮、玻璃和 hover；Popover controller 仍可服务搜索、周期、语言、设置等预览菜单，但不得据此重新挂接账户或通知的旧浮层。

基础控件统一使用 `control-states.css` / `control-states.js`：容器挂 `.wd-control-state`，文字挂 `.wd-control-label`，中性图标使用原始 SVG 的不透明状态遮罩。hover / 键盘 `:focus-visible` 时文字与图标一起变为 Labels/Primary，深色下为纯白；鼠标点击留下的普通 DOM 焦点不持续呈现 hover，离开指针后恢复默认色。日期选择器（Last 7 days）、搜索、导航、图标按钮和主题切换按钮都遵循该规则；主题按钮点击后不得残留主色，普通焦点为 Labels/Secondary，键盘 `:focus-visible` 才保持 Labels/Primary。不要给统计数值或整张图表套用控件文字规则。沿用共享 hover 进入 `240ms` / 离开 `360ms` 的渐入渐出，不改变位置。

统计周期控件默认文字与日历图标同为 Labels/Secondary；hover / 键盘 focus 时二者一起变为 Labels/Primary。胶囊宽度由当前文字实测宽度决定，切换预设或自定义范围后自动调整，不能固定宽度或裁切。刷新按钮右缘固定并与下方图表卡片右缘对齐，周期胶囊向左增长，二者保留 10px 间距。

日期选择器使用共享 `components/date-picker.js` / `.css`：预设固定为 `Today`、`Yesterday`、`Last 24 hours`、`Last 7 days`、`Last 30 days`、`This month`、`Custom range`；输入为 `Start date` / `End date`，动作为 `Cancel` / `Apply`。选择预设只更新草稿，点击 `Apply` 才提交主周期标签；切换预设不能提前改标签或发起查询。面板宽 462px、最低高 433px；视口不超过 520px 时改为纵向排列，宽高限制在视口减 24px 内并允许滚动。旧 `Custom date range…` 入口已废弃，不得恢复。

日期输入是固定格式控件：`/`、`/`、空格、`:` 由控件绘制，位置固定且不可输入，分段只接受各自位数的数字，满位后自动跳到下一段。校验失败时整个玻璃框进入错误态——1px `Accents/Red` 内描边加一层淡红外环，分段、分隔符和日历图标同时变红；不能只让文字变红。说明文字位于两个时间框下方、收尾分割线上方，不能放在分割线下的 footer。错误态在定位到分段或用 Apply 提交时都必须保持，只在用户重新输入出合法范围后清除，不能因为分段获得焦点就被抹掉。

搜索使用共享 `components/search-surface.js` / `.css`。侧栏 Quick search、首页内联搜索框和结果面板的键盘提示必须由同一组 `Ctrl` + `K` 键帽生成，不能从 Figma 导出复制独立文本节点，也不能各写一套颜色或背景。键帽固定为两枚独立矩形，间距 `4px`，使用 `Footnote/Regular`、SF Pro 字体族和 `--wd-control-muted` 背景、`--wd-vibrant-label-secondary` 文字；深浅主题自动继承，不按主体文字色重新着色。底部操作提示使用同一键帽外观：方向导航是一枚合并的 `↑ ↓` 键帽，不能拆成两枚；其余为 `Enter Open`、`Esc Close`。动作名保持英文，不得退回浏览器等宽字体或中文动作名。底部提示是真实可操作控件，不是装饰文字：`Navigate` 推进当前结果选中并循环，`Open` 打开当前选中项，`Close` 关闭当前搜索面板；鼠标点击后焦点仍留在输入框，键盘方向键、输入和再次激活可立即继续。首页内联搜索的键帽组以搜索框右缘内缩 `20px` 为固定锚点向左生长；不能沿用导出稿的 `35px` 单字形列宽，也不能让共享键帽溢出或压到框边。两处搜索框的可见默认文字只能来自 `components/search.js` 的 `SEARCH_FIELD_PLACEHOLDER`，全屏不得另写 `Search WattDesk` 之类文案；`aria-label` 等无障碍名称不要求与占位文案相同。共享清除按钮固定在输入区尾部，保持 `18px × 18px`、零内距并与字段垂直同中心；嵌入浮层时不得被外层 `.popover > button` 的菜单按钮样式命中。

搜索结果每项保持 `40px` 行高。标题与分类属性显示在同一行，格式为 `Plants - Pages`：标题使用主文字色，`- Pages` 使用 Labels/Secondary；两者之间是 `4px` 视觉空格，不恢复上下两行。标题过长时省略，分类保持完整；右侧回车提示只在选中时显示。

全屏搜索（`Ctrl/Cmd+K` 与顶栏搜索按钮）复用首页内联搜索框的字段实现：同一 `46px / 23px` 胶囊、`20px` 左内边距、18px 放大镜和共享玻璃填充/模糊；只隐藏右侧快捷键，不另建字段材质或图标。放大镜统一使用 `asset-35.svg` 的不透明状态遮罩，避免全屏沿用 `asset-4.svg` 的 30% 导出透明度而显得发灰。首页内联结果浮窗复用日期选择器的玻璃材质，不另建材质；全屏搜索使用同一玻璃分层，并增加整页高斯模糊底层，不把模糊从玻璃中拆掉。结果浮窗不得用投影或连续背景与搜索框视觉连成一体。

`createSearchField({...,size:"compact"})` 提供侧栏 Quick search 的紧凑字段：`36px` 高、`18px` 圆角、`0 14px` 内距、`9px` 图标间距、`14/14 medium`；结构与玻璃、放大镜、清空按钮仍共用同一工厂。用于内容页工具栏等与侧栏搜索同级的控件，例如 Plants 列表；宽度由宿主页面决定，不把紧凑尺寸扩散到首页内联或全屏搜索的 `46px` 胶囊。

首页内联搜索框与全屏搜索框始终是高度固定的胶囊：边框半径等于高度一半，结果面板以独立间距出现在下方。这两处搜索框挂 `.wd-glass--no-scale`，hover、点击和键盘 focus 只改变材质高光，不放大、不拉伸、不向下延伸；不能因为结果区域高度或 stage 高度改变搜索框轮廓。内容页工具栏的紧凑搜索（例如 Plants）是独立宿主，刻意启用 `scalable:true`，按共享玻璃材质响应 hover / 按下缩放，与筛选、列等玻璃按钮的动效一致；不得因首页的固定胶囊规则把工具栏搜索一起禁用。Esc 或点击全屏空白区域关闭全屏搜索。内联结果中的空态和操作提示使用 `Footnote/Regular`，不能放大为主标题或正文尺寸。

全屏搜索的入场与退场是同一组动作的正反方向，不各自另编时序。入场时结果面晚搜索框一步进入；退场时结果面先向下离开、搜索框随后向下离开，二者共用 `--wd-motion-search-out`，错落使用独立的 `--wd-motion-search-out-stagger`，不得复用较长的进场 stagger。退场必须明显快于入场，当前为结果面 `0ms`、搜索框 `40ms` 开始，玻璃各 `180ms`；背景遮罩使用 `--wd-motion-search-veil-delay: 70ms` + `--wd-motion-search-veil-out: 490ms`，在 `36%` 前完整保留模糊，等两块玻璃都离开后按 `75% / 46% / 18%` 的模糊与底色比例分段化开，总退场约 `560ms`。遮罩尾段必须保留可感知的中间段，不能用一个两段插值让模糊在前三分之一就掉光；也要避免过长导致关闭显得拖沓。遮罩只动画模糊半径与底色，且两者同步收拢；不对遮罩或弹窗根节点做 `opacity` 动画——任何祖先的不透明度动画都会把 `backdrop-filter` 放进独立合成层，模糊在第一帧就失效。因此模糊与底色必须落在同一层（`background-color`，不用伪层或 `background` 简写），尾帧两者同时归零，卸载时不会出现清晰帧跳变。组件必须保持挂载到遮罩退场结束，不能提前卸载。减少动态效果时所有搜索入场/退场直接结束。浅色全屏搜索使用独立搜索遮罩与投影 token，不沿用 `Overlays/Activity View Controller` 的密集活动遮罩：底色 `rgba(0,0,0,.10)`、模糊 `16px`，保留页面轮廓与色块；结果卡片使用 `--wd-search-outline: .08`、`--wd-search-outline-side: .10`、`--wd-search-drop: .055 / 16px / 34px` 与 `--wd-search-contact: .02`，不得直接沿用普通卡片的 `.16` 外轮廓和 `.16` 深投影，否则浅色下会形成明显黑边与黑底。参数只作用于 `.wd-search-panel--fullscreen` 的浅色分支；深色遮罩仍用 `29% + 28px`，深色投影、普通玻璃和其他浮层不得改变。

报错出现和清除都使用生长动画：卡片从 433px 增长到 460px，报错行从 0 到 30px 展开并让文字淡入；改正后按同一节奏收回 433px，不能一帧跳高或先清空文字再收高。测量顺序必须先在显示前记录起始高度，显示后再量目标高度；同一文案、同一字段的重复报错不重播入场，避免连续输入与 Apply 相互取消动画。面板位于触发按钮上方时，向上生长并以底缘保持 8px 间距，位移并入同一条高度动画，不能在结束时二次改 `top`。

月份标题使用 `14/14 medium`（14px / 510），并按第一个星期标题 “M” 的字形左边界对齐，不能对齐 30px 单元格边缘。左右月份按钮与星期行固定不动；切换月份只让日期网格同方向滑动、月份标题交叉淡入淡出，选中区域不能在切换过程中消失。

弹窗退出时内容、玻璃 fill 与光学层必须同时淡出（约 `--wd-motion-panel-exit` 的 94%），宿主自身保持不透明以继续合成 `backdrop-filter`，最后整体移除。不能让内容先淡完而底板仍在，否则会出现“只有底、没有内容”的空壳中间态。

`Cancel` 使用共享中性玻璃；`Apply` 是面板中唯一的实心强调色，按 Figma `14736:5234` 用 `Accents/Blue` 实心填充，只保留细深色外轮廓、极细亮边与指针高光，关闭模糊、白色反射场和上下内阴影，避免蓝色被洗成偏白的浅蓝。深浅主题分别微调外轮廓与投影，hover 只轻微提亮，不改变饱和度。

### 无内容页面占位

- 非 Home 路由暂无真实内容时，统一使用共享 `components/empty-state.js` / `.css`，在页面面板水平居中，显示 64×64 图标与 18px / 510 灰色 `Coming soon`，间距 10px；图标与文字整体相对面板垂直中心上移 119px，落到主干内容区上部，整体保持轻量，不加卡片、玻璃或额外按钮。
- 图标取当前路由的原始素材：Plants、Service ticket、Statistics 等彩色图标保留原色；Cell balance、Module balance、Device track、Organisation、Teams、User 等中性图标使用 `home-assets/masks/` 不透明副本和 Labels/Tertiary 遮罩，避免导出稿透明度让灰色变淡。
- 进入无内容页面时播放一次短距离 4px 上移淡入，时长/缓动取 `--wd-motion-panel` / `--wd-ease-panel`；减少动态效果时直接显示。不循环、不缩放、不移动宿主面板。
- 占位是页面内容层的保底展示，不能覆盖未来真实页面内容；有内容后由路由替换该层，而不是叠加在上面。
## 6. 动效规范

动效解释输入反馈、对象关系和状态变化：少量、有限、可中断，不增加操作等待，不改变信息含义。

### 组件级共享动效契约

- 所有页面通过 `src/shared.css` 自动加载 `foundations/motion.css`。新页面、新组件和后续动态挂载的 DOM 无需逐个补 transition；原生控件、常见 ARIA role（button / tab / menuitem / switch / checkbox / radio / option / treeitem 等）、`.wd-control-state` / `.wd-control-label`、共享玻璃层、Workspace tab、快捷入口和折叠箭头都继承统一节奏。
- 共享默认只过渡 `color`、`background-color`、`border-color`、`box-shadow`、`opacity`、`text-decoration-color`、`filter`。hover 进入使用 `--wd-motion-hover:240ms` / `--wd-ease-hover:cubic-bezier(.16,1,.3,1)`，离开使用 `--wd-motion-hover-out:360ms` / `--wd-ease-hover-out:cubic-bezier(.3,0,.2,1)`；宿主在 hover / 键盘 focus 时切换共享变量，文字与图标叶节点继承同一节奏。这是 2026-10-21 用户确认的“弹性灵动”方向，进入快、离开柔。组件与页面 CSS 只声明视觉状态，不再写 `transition`、`transition-property`、`transition-duration` 或缓动；禁止 `transition: all`。
- `2026-10-26` 表格行与表头并入同一契约：`tr` / `td` / `th` 与 `[role=row]` / `[role=cell]` / `[role=columnheader]` / `[role=rowheader]` 同时获得过渡属性与 hover 变量切换，密集列表的行底色、焦点环因此不需要页面局部 `transition`。电站列表（`src/pages/plants/`）是首个使用方。
- JS 动画必须调用 `motionDuration(token)` / `motionEasing(token)`，不得硬编码毫秒或 `cubic-bezier`。CSS 与 WAAPI 共用同一组 token；减少动态效果时由共享层压到 `1ms`，并关闭位移、旋转、缩放和鼠标跟随。
- 文字与图标联动时，最深层可见文字叶节点承担一次淡变；嵌套 `.wd-control-label` 不重复计时。中性图标走共享状态遮罩，原始彩色图标不改色。
- 图标状态遮罩（`::before` / `::after`）是独立图层，不能继承宿主的 `transition`，必须在共享层单独声明同一 hover 节奏；它们与文字、`<img>` 必须同步渐入渐出，不能瞬间切换或出现黑灰中间态。伪元素选择器不能写进 `:is()` / `:where()` 的参数列表，否则整条规则会被解析器丢弃、退回浏览器默认 `0s`。
- 折叠只让 `.wd-disclosure-icon` 内的原始实心箭头和精确路径遮罩旋转，宿主不旋转；展开朝下、收起转向 `-90°`，变换原点 `50% 54%`，时长 `--wd-motion-disclosure:380ms`。支持中途反向，不通过替换 SVG 瞬间切换。
- 图标按钮不得用 `filter: brightness()` 等局部提亮伪造 hover；颜色状态通过共享遮罩与 token 表达，避免与遮罩交叉淡化叠加出闪烁。`Add tab` 是当前已修正的实例。
- Workspace tab 的颜色反馈使用 hover 节奏；宽度、`flex-basis` 与内边距进入 `280ms`、退出 `220ms`，文字/图标切换 `110ms`，关闭标签自身的收起动画 `260ms`（离开缓动）。调用方不复制时长。

| 场景 | 当前时长 | 共享 Token / 缓动 |
|---|---:|---|
| hover 进入，颜色/下划线/微光淡变 | 240ms | `--wd-motion-hover` / `--wd-ease-hover` |
| hover 离开，回到默认色 | 360ms | `--wd-motion-hover-out` / `--wd-ease-hover-out` |
| 分类收起/展开 | 380ms | `--wd-motion-disclosure` / `--wd-ease-disclosure` |
| 浮层展开 | 320ms | `--wd-motion-panel` / `--wd-ease-panel` |
| 浮层收起 | 200ms | `--wd-motion-panel-exit` / `--wd-ease-hover-out` |
| toast 淡入 | 320ms | `--wd-motion-panel` / `--wd-ease-panel` |
| toast 淡出 | 200ms | `--wd-motion-panel-exit` / `--wd-ease-hover-out` |
| Workspace 标签关闭 | 260ms | `--wd-motion-tab-close` / `--wd-ease-hover-out` |
| 图表首次进入可视区 | 740ms | `--wd-motion-chart` / `--wd-ease-chart` |
| 柱形逐项延迟 | 每项 35ms | `--wd-motion-stagger` |
| 点击刷新图标转一圈 | 640ms | `--wd-motion-refresh` |
| 深浅主题整体淡变 | 620ms | `--wd-motion-theme` / `--wd-ease-theme` |
| 顶部 overscroll 回弹 | 640ms | `--wd-motion-pull-rebound` / `--wd-ease-spring` |

- Plants 长列表保留原生滚动行为，视觉滚动滑块是 DOM 层：默认 `6px`、hover `8px`；颜色与宽度按共享 `240 / 360ms` 进入/离开节奏，轨道宽度保持 `10px`，不引发表格重排。滑块位置由表体滚动同步并支持拖动。表体顶部和底部 overscroll 都先经过约 `4px` 粘滞区，再逐步显示最高 `16px` 的主题背景空白，不使用白色底；松手回位使用上表共享 spring 缓动；减少动态效果时不显示位移回弹。

### 玻璃按压反馈

| 宿主 | hover | 按下 | 按下相对 hover |
|---|---:|---:|---:|
| 普通玻璃 | `1.025` | `1.065` | 至少 `4%` |
| 正圆玻璃（`.wd-glass--disc`） | `1.07` | `1.18` | 至少 `10%` |

- 按下 `--wd-motion-glass-press`（当前 `110ms`）快速起步，松开 `--wd-motion-glass-release`（当前 `420ms`）缓慢回落；hover 进入使用 `--wd-motion-glass-hover`（当前 `300ms`）。离开 hover 回到原尺寸。带极小的非等比液态拉伸，但不能夸张变形。玻璃缩放沿用自身节奏，不随 hover 颜色的 240/360ms 变量改变。
- 36px 圆钮按下外径约 `42.5px`；快速点击（约 20ms）也必须明显可见，不能只看慢速长按或代码断言。验收同时覆盖真实指针快速点击。
- 缩放锚点是宿主自身物理中心，由 `.wd-glass.wd-glass { transform-origin:center }` 统一保证；页面级 `.node` 等规则不能覆盖。缩放只改变视觉矩阵，`offsetWidth` / `offsetHeight`、布局槽位和命中区不变。
- 缩放只属于可交互玻璃。纯展示、点击没有跳转的玻璃表面在注册时传 `interactive:false`，共享材质加上 `.wd-glass--static`，保留材质、hover 光晕与指针跟随，但 hover / 按下均保持 `scale(1)`、布局盒不动；页面和组件不得用局部 `transform:none` 规避。首页 `Connected devices` / `Self-consumption` 是当前实例；`Sites online` / `Needs attention` 等可点击卡仍按普通玻璃缩放。默认 `interactive:true`，既有控件不需要声明。
- 复合容器固定为 `1`：顶部 `.wd-glass-chrome` 整组、`.wd-glass--surface` 弹窗/浮层。内部独立的玻璃日期框、月份圆钮、Apply 等仍按自身状态缩放；点击面板空白或内部任意位置都不能带动大卡片。规则在共享材质中实现，新增浮层自动继承。
- 减少动态效果与粗指针设备直接复位。


### 载入状态

- 载入占位只覆盖真正等待远端或派生数据的区域；静态外壳（侧栏、顶栏、工作区标签、已装配的搜索与快捷入口）立即显示，不等待字体或卡片数据。没有真实等待时不制造 Loading，不伪造进度或延迟。
- 区域通过 `data-skeleton="chart|status|text"` 标记，由共享 `components/skeleton.js` 的 `mountSkeletons()` 统一挂载；页面不另写骨架条、扫光或逐卡计时。多区域在同一帧进入 pending，使用一个共享 stagger，避免各自错峰显得嘈杂。
- 内容在 `--wd-motion-skeleton-delay`（当前 `140ms`）内就绪时绝不绘制骨架；超过阈值才让骨架与原内容在同一重算中切换。快速加载不得闪骨架，也不因为字体晚到而延长骨架。
- 骨架层绝对覆盖宿主，继承真实圆角、描边、玻璃与尺寸，只替换内容可见性；不改变卡片边界、布局槽位或滚动高度，淡出后内容不跳动。骨架内的条形只描述结构，不逐条动画。
- 扫光为每区域一次、直线单次通过（`--wd-motion-skeleton-sheen:1400ms`、延迟 `200ms`），不循环、不逐条闪动。退出与内容淡入用 `--wd-motion-skeleton-out` / `-in` 与共享缓动；时长集中在 `foundations/motion.css` / `tokens.css`，组件和页面不写局部 transition。
- `prefers-reduced-motion: reduce` 时仍显示真实等待的静态骨架（防闪阈值保留），但关闭扫光、淡入淡出与 stagger；骨架移除后内容立即可交互。
- 骨架存在期间宿主标记 `aria-busy` 并暂时 `inert`；结束、无骨架或组件销毁时在同一流程释放，不留下不可聚焦或不可点击的卡片。

### 其他动效边界

- 普通 hover 不移动、缩放、旋转控件和文字，不改变布局。唯一位移例外是前两张可点击状态卡内部箭头向右上移动 `2px`，卡片本体不动。
- 点击展开允许高度、透明度和轻微浮层缩放，可中断、可反向；不等待动画结束才响应输入。图表标题、数值、单位和坐标轴稳定显示，曲线从左至右揭示、柱形从底部展开，首次可见播放一次，不循环、不伪造网络进度。
- 刷新只转图标一圈，容器不动，期间防重复触发。
- 主题使用一次有限的整页交叉淡入：`620ms`，包含外部 SVG、渐变和玻璃；首次载入不播放，连续切换以最后一次意图为准，减少动态效果立即到最终态。新主题快照生成期间（`data-theme-snapshot`）元素过渡统一压到 `0s`，避免把旧主题的中间色冻结进快照；`transition.ready` 后立即恢复 `240 / 360ms`。禁止全页反色、`transition: all` 或残留的临时过渡。
- `tests/verify-motion.cjs` 检查共享入口与模板加载、动态控件继承、页面无局部 transition、折叠宿主不动、唯一位移例外及深浅主题/减少动态效果。
- `tests/verify-responsive.cjs` 在 1920–420px 的 12 个宽度上检查内容居中、无横向滚动、画布/列无缩放、状态卡与业务卡 `4/2/1`、能源卡 `2/1`、快捷入口 `3/2/1`、图表与菜单不越界、刷新与周期右缘对齐、窄屏图标轨及账户/通知不重叠；同时覆盖状态卡悬停后箭头仍在边界内。

## 7. 布局、语义与交互

- 全站圆角曲线由 `geometry.css` 的 `--wd-corner-shape:superellipse(1.2)` 统一管理，当前及未来页面加载该文件。普通圆角矩形使用共享的原生连续曲线，组件保留原来的 `border-radius`；玻璃物理层、描边、状态层及伪元素继承宿主曲线，不另外裁切。**`1.2` 是用户在实际 30px 卡片上确认的视觉值，不是 Figma Corner Smoothing 60% 的参数换算。** Figma 会延长切线，而原生 `superellipse()` 始终限制在半径盒内，两种曲线不能逐点精确匹配；不得把 60% 当成指数 0.6 使用。完整 `squircle` 等于 `superellipse(2)`，在相同半径下明显压小圆角，因此不能直接作为全局值。旧浏览器忽略增强规则并保留原有普通圆角，无额外遮罩，也不牺牲投影与焦点。**原稿正圆与胶囊形必须保持原形**：顶栏圆按钮、通知、刷新为圆形，tab、工具栏、搜索、侧栏菜单和周期为胶囊；头像、圆形 hover 底和图表圆点保持正圆。`geometry.js` 的 `preserveCornerProfile` 按原始尺寸与半径识别（半径达到短边一半即饱和），只设置 `data-corner-profile`，不改实际半径；圆/椭圆也可挂 `.wd-shape-round`。新组件明确其原稿形状，不让圆形容器的规则污染内部键帽等独立矩形。严禁为平滑圆角修改半径、组件尺寸、布局或交互。
- 标准头像 `.wd-avatar` 使用共享 **1px** 内描边，描边颜色与内部填充相同；深色以中心扩散的短距离阴影表现厚度，阴影不向下偏移，浅色不显示外投影。两种主题都不扩大布局。参数在 `avatar.css`。浅色主内容面板使用 `--wd-main-panel-shadow` 的短距离投影，保留普通表面和 1px 原描边，不套用玻璃或扩大为光晕；深色面板保持原材质。
- 首页全部状态卡片和图表卡片保留原稿 **30px**，右侧整体内容底板保留 **10px**，同样使用共享连续曲线，不能为恢复视觉大小退回 `round` 或添加 `.wd-corners-original` 例外。浏览器轮廓验收：当前 `superellipse(1.2)` 在 30px 对角边界处比原普通圆角内收约 **0.97px**，肩部更紧但视觉半径仍读作 30px；直接套完整 Squircle 则向内收缩约 **4px**。38 个主要组件的半径保持不变。`verify-foundations.cjs` 检查审计表面的原始半径、实际命中轮廓、连续曲线确实生效、玻璃各层贴合，以及不支持增强时的回退；响应式后的尺寸与位置由 `verify-responsive.cjs` 单独验收。Figma 归档读数：深色首两张图表 smoothing 为 6%，浅色首两张、其余图表和主底板为 60%；`1.2` 只作为当前确认的视觉曲线，不回写或等同于任一 Figma smoothing 数值，也不改变各元素各自的半径。
- 快捷入口行间分割线为 `--wd-divider-width:1px`，Workspace 的 Statistics (coming soon) 下方隐藏分隔线；其他分组原本没有末尾分隔线的继续隐藏。不用加粗描边表示分组结束。
- 快捷入口三列的所有行都是可操作目标：Workspace 的 Plants、Service ticket、Statistics 打开各自路由，Following 的电站行进入 Plants（示例名称尚未对应真实电站 ID）。复用共享 `enhanceControl()` / `openRoute()`，支持 Enter、Space 并在当前标签内打开，不新增标签。回归见 `tests/verify-shortcuts.cjs`。
- 浅色主题前两张状态卡右上箭头使用降透明度的墨色（`brightness(0) opacity(.55)`），不得使用纯黑；深色主题保持原稿状态。
- 首页内容画布最大 `1000px`，由内容列按视口收窄，不使用区域级 `transform: scale()`；画布在右侧工作区内水平居中，左右各保留共享 `48px` 阴影空间。内容列最小 `240px`，窄屏继续纵向重排，不引入横向滚动。
- 首页重排节奏固定：状态卡与业务图表卡 `4 → 2 → 1` 列（内容宽 `≥860px` / `≥520px` / 更窄），两张能源卡 `2 → 1`，快捷入口 `3 → 2 → 1` 列（内容宽 `≥680px` / `≥440px` / 更窄）。不得出现 `3+1` 的残行组合；卡片换列时高度真实撑开，由页面纵向滚动承接。
- 侧栏随视口收窄：默认 `248px`、主区偏移 `278px`；`≤1100px` 为 `216px` / `246px`；`≤760px` 切为 `76px` 图标轨，主区偏移 `106px`，导航文字视觉隐藏但保留可访问名称。窄屏账户与通知改为不重叠的横向布局；`≤520px` 顶栏操作区收至 `132px`。
- 侧栏顶部历史控件固定为三个 `36px` 正圆，彼此间距 `8px`；最右侧前进按钮的右缘与 Quick search 的右缘严格对齐。定位用侧栏右缘反算（共享 `--wd-history-step`），不能写死 `left` 像素；侧栏宽度变化时按钮组整体跟随，不允许出现挤压间距或越过搜索右缘。

- 侧栏玻璃、卡片本体与文字字号不随响应式缩放；重排只改变列宽、列数和可见标签。正文与控件文字保持原设计字号，不通过缩小字体换列。
- 首页内容画布保留最大 1000px 时，搜索下方快捷入口左右各内收 20px，等分列间距 20px；收窄后沿用 `3 → 2 → 1` 列节奏，仍不通过缩小字体实现内收。
- 滚动区域左右各保留共享 48px 阴影空间；底部留白以最后一张图表卡片为基准，具体数值由单独的布局文档负责，本规范不另设固定 32px。Period statistics 的时区与 As-of 文案节点已永久删除，不做隐藏或恢复。调整 `overflow` 与层叠后重新检查阴影。
- 优先使用真实 button / input；提取节点需提供等效角色、Enter/Space 和可见焦点。鼠标 hover 有对应 focus 状态。
- 分类使用设计稿实心箭头，维护 `aria-expanded` / `aria-controls`；隐藏内容不可聚焦。浮层支持 Esc 和外部点击关闭，退出后不残留透明遮挡层。
- 三点菜单的圆形 hover 背景与命中区为 30px，保持原始三点中心。标题容器允许控件溢出，不能用 18px 标题行裁切圆底；文字省略仍由文字节点自身控制，不全局取消图表或滚动区域裁切。
- 不用全局 `transform:none` 修复 hover，它会破坏布局定位和响应式缩放。图标对齐需看真实路径的视觉中心。
- 当前 Home 与 Plants 列表是真实页面；`/plants/:id` 已有可刷新 URL，但详情内容仍是明确的预览占位。Plants 列表行会新建并激活详情标签，原列表标签保留。名称为 `?` 的电站表示设备上线时已自动建站、资料未补全，仍属于正常电站；行可进入详情，标签与详情主标题都显示 `?`，不得显示 `Unassigned device`。其余路由、真实账号、设备控制及后端统计未接入。样例数据、CSV 和提示应如实说明预览范围。

### 路由与 URL

- 规范 URL 与完整表见 [站点路由](./docs/ROUTING.md)：Home `/home`、Plants `/plants`、电站详情 `/plants/:id`，其余侧栏页面使用对应短路径。`/`、`/home.html`、`/index.html` 以 `308` 规范到 `/home`。
- 地址栏镜像当前激活工作区标签的 `{route, params}`；切换标签、侧栏导航、页面内跳转都更新 URL，刷新和复制链接恢复同一页面，不得回到 Home。
- Plants 列表行和自动建站 `?` 提示中的 `setup` 是明确的新标签入口，调用 `openRouteInNewTab()` 并激活详情标签；自动建站电站的标签标题为 `?`。`Back to Plants` 优先激活来源列表标签并关闭当前详情标签，无来源标签时在当前标签内返回 Plants。侧栏与首页快捷入口仍在当前标签内导航。
- 深链接由服务端/静态资源层返回 SPA 外壳：本地 `server.js` 与线上 `_redirects` 必须同步路径；HTML 使用 `<base href="/">`，多级路径下的脚本、样式和素材仍从站点根解析。
- 路由层是唯一可以写浏览器历史的位置：页面调用 `openRoute(route,{params})`，不直接在组件里拼 URL 或调用 `pushState`。未知路径和未知电站 ID 显示 not-found，不静默回首页。
- 路由变化先关闭活动浮层；页面标题随路由更新。详情类 URL 使用稳定业务 ID，不按名称或数组下标生成。
- 新增路由同时更新 `ROUTE_CATALOG`、`server.js` 的 `canonicalRoutes`、构建脚本的 `appRoutes` 与 `tests/verify-routing.cjs`。

### Plants 筛选与列可视性

- Plants 筛选入口使用共享锚定浮层。主面板只列 4 个类目：Company、Device、Connection、Running status，宽度 `260px`、高度贴合类目内容，不在内部预留条件区；工具栏入口的右缘与列可视性浮层右缘对齐，筛选条加号的入口则在加号下方展开并与加号左缘对齐。加号面板打开后固定初始视口位置，新增 chip 导致加号重新排版时不得带着面板移动。鼠标悬停或键盘聚焦类目后，以独立 Glass Surface 次级浮窗展示条件；Company 保持 `260px`，Device、Connection、Running status 统一使用 `208px`，保证选项单行且三项同宽。次级浮窗锚定当前类目行，优先出现在空间更充足的一侧并与主面板内缘重叠 `12px`。类目 hover 采用 `380ms` 意图延迟，鼠标斜穿其他类目前往二级浮窗时不得误切换。
- 二级浮窗的垂直基准是**第一个可选项**：第一个选项的文字/行盒与对应一级类目行对齐，而不是让二级标题对齐类目。Company 带搜索框时使用 `100px` 顶部内容偏移，其余条件组使用 `54px`；顶部空间不足时由共享浮窗定位夹紧到 12px 视口边距。
- Company 固定在第一项，条件区顶部提供共享玻璃搜索框；默认展示 15 个节点的多级公司树，使用 `22px` 方形命中区的连续箭头表示展开，支持父级 `checked / mixed / unchecked` 三态。公司名称使用 `Footnote/Medium`（13 / 510 / 18px），可换行，禁止出现横向滚动条；复选框中线对齐公司名第一行。条件列表向左右释放内距，滚动条贴卡片右缘并留约 `4px`；面板限制为 `70vh / 520px` 内的最大高度，超出时使用共享 `.wd-scrollbar` 滚动。选中顶层公司时，筛选条只显示顶层公司汇总 chip，不展开所有子公司。
- Connection 与 Running status 是两个独立筛选组。Connection 使用在线、部分在线、离线、未绑定四态信号图标；Running status 使用 `Normal / Attention / Unbound device` 三种运行健康状态及其原始语义图标。筛选条件与表格 Status 图标都使用不透明掩码，不能因导出透明度或从详情页返回而发灰；生成脚本必须把所有 `fill-opacity` / `stroke-opacity` 归一到 `1`，不是只处理原稿常见的 `.7`。图标为 14–18px，与所在行文字垂直居中。筛选条件与表格 Status 的图标和文字间距均为 `4px`；Company、Device 的普通条件不加装饰图标。
- 每条条件行由独立复选区和条件名称按钮组成。点击复选框立即筛选且两个浮层都保持打开；点击条件名称/选项主体会应用该条件并关闭筛选。复选框使用 `Accents/Blue` 选中态和更大的白色勾选遮罩。row 本体不画 hover 底，只有文字按钮区域出现一层高亮；复选框与条件之间的间距为 `4px`。条件旁不再显示数量数字。
- 一级筛选与二级条件共用 `.wd-filter-menu` 内胆，四边 `20px`；标题、搜索框、条件区和滚动区沿同一内容线。列可视性继续沿用 `.wd-menu` 的 `20px` 顶部标准。长列表统一使用共享 `.wd-scrollbar`，页面不另写滚动条。
- 有筛选时在工具栏下显示条件条。每个具体条件是独立小 tab，只显示条件文字，例如 `Hybrid Inverter`；tab 后面是复用完整筛选内容与交互的加号，点击后在加号下方左对齐打开主筛选面板，`Clear` 固定在条件区最右侧并始终垂直居中。条件区使用设计稿已有的 `Backgrounds/Tertiary Elevated` 实底区分表格，chip 使用 `Fills/Secondary`；不使用页面私有淡紫色或玻璃叠加。
- Plants 的刷新是一次本地列表重置：点击后仍只让刷新图标转一圈并防重复触发，同时清空全部筛选、恢复默认列显隐和默认 `Last update` 降序排序，三者在同一轮渲染中完成。搜索词和收藏状态不被刷新清除。刷新完成提示需说明视图已重置。
- 列可视性菜单继续使用共享 `.wd-menu` 外壳和 36px 行，但每行状态图标改为用户提供的 `Eye` / `Eye Closed`，固定在文字前；不得再放尾部对勾。显示时 Eye 为 Labels/Secondary，隐藏时 Eye Closed 与文字为 Labels/Tertiary，hover / focus 恢复主文字色。`Plant type` 不再列为可切换列。
- 筛选与眼睛图标原稿存放在 `design-preview/design/figma/plants/icons/`，运行副本在 `design-preview/home-assets/plants/icons/`，来源索引为 `design-preview/design/figma/plants/icons-source.json`。筛选数据仍是本地样本，不宣称后端查询、权限或持久化。

## 8. 开发与验收

1. 阅读根目录 `AGENTS.md` 和本文；确认最新要求及正确 Figma 节点。
2. 查已有 token、素材、材质和交互，明确共享修改的影响范围。
3. 先修改共享层，再装配页面。关键设计或业务缺失时补充信息；常规实现选择自行判断。
4. 检查深浅主题、各控件状态、动画反向、连续点击、快速点击与键盘；日期/时间控件同时验证“预设写草稿、Apply 才提交”。减少动态效果单独验证。
5. 运行相关检查。视觉修改需真实浏览器截图，不能只通过语法检查；共享参数需扫过全部使用表面。
6. 同步规范和页面说明，交付时如实说明完成内容、验证及已有边界。

在 `design-preview` 目录运行：

```powershell
npm run dev
npm run check
npm test
node tests/verify-home.cjs
node tests/verify-shortcuts.cjs
node tests/verify-routing.cjs
node tests/verify-plants-filters.cjs
node tests/verify-glass.cjs
node tests/verify-theme.cjs
node tests/verify-foundations.cjs
node tests/verify-components.cjs
node tests/verify-motion.cjs
node tests/verify-search.cjs
npm run sync:themes
npm run sync:type
```

`npm test` 检查当前首页交互、快捷入口行导航、URL/刷新、Plants 筛选与可视性、响应式重排、正式玻璃、主题、字体/圆角、共享组件、共享动效与搜索控件；若旧视觉基线失败会停在对应专项。浏览器运行配置见 `design-preview/tests/runtime.cjs` 和运行 README，可通过环境变量指定 Playwright、Chrome、Python；截图输出到 `tests/output/`，固定基线在 `tests/fixtures/`。`npm run test:visual` 对比整理前四张主题/尺寸基线，`npm run audit:assets` 检查引用。更新归档来源后用 `npm run sync` 生成运行数据与样式；生成文件不手改。

## 9. 维护约定

- 新增通用内容先补共享实现和本文，再供页面复用；对话不能成为唯一规则来源。
- 最新明确反馈与旧条目冲突时修改旧条目，记录日期，不并列保留矛盾规则。
- `AGENTS.md` 保存开发约束和阅读入口；本文保存详细设计表；`docs/PROJECT-STATUS.md` 保存当前实现与边界；`docs/USER-REQUIREMENTS.md` 保存用户明确修正；架构和组件手册记录实际用法。
- 本文描述可复用基础，不宣称全部历史原型已迁移，也不构成擅自改变所有旧页面的授权。
- 规则归档只记录用户最终确认的方案与仍有效的实现约束；一次性调整、已推翻方案和未确认推测不得写成全局规范。
