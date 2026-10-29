# WattDesk 项目开发入口规则

适用于本目录及全部子目录。每次新增页面、修改组件或调整视觉前，先读本文件，再读 [全站设计与交互规范](./DESIGN-SYSTEM.md) 和 [项目当前状态](./docs/PROJECT-STATUS.md)。新增页面再读 [架构](./docs/ARCHITECTURE.md) 与 [组件手册](./docs/COMPONENTS.md)；既往反馈见 [用户要求记录](./docs/USER-REQUIREMENTS.md)。

## 结构与记录

- 当前运行代码按 `design-preview/src/foundations`、`components`、`layouts`、`pages` 分层，所有页面加载 `src/shared.css`；不复制一套新的基础。页面依赖组件，组件依赖基础，共享层不得反向依赖首页节点 ID。
- 原始 Figma 来源在 `design-preview/design/figma/`，运行资产在 `home-assets/`，生成场景在 `src/pages/home/data/`。完整同步用 `npm run sync`。生成文件不手改；原稿写死的几何值可保留。
- 新页面使用语义布局，参考 `templates/page.html`，不复制首页绝对坐标 scene。URL、深链接与刷新规则见 [站点路由](./docs/ROUTING.md)；新页面必须同时登记规范路径、服务端回退和回归断言。后端与权限仍未接入，不能虚构。
- 完成需求后同步当前状态；共享规则更新设计规范；用户明确纠正更新要求记录。对话不能成为唯一记录。清理资产先检查引用与来源，保留可恢复路径。
- 开始改动前阅读 [经验与防回归清单](./docs/LESSONS-LEARNED.md)；涉及顶部工作区标签时同时阅读 [顶栏标签规范](./docs/TOP-BAR-TABS.md)。
- 构建与发布配置见 [发布与部署](./docs/DEPLOYMENT.md)：线上由 Cloudflare 从 `master` 构建，构建产物不入库，发布由维护者手动 push 触发。

## 设计依据与优先顺序

- 用户当前明确要求优先；同一事项按最新反馈执行，并同步规范。
- 当前首页设计来源是同一 Figma 文件 `7hGGOqflIMGWTYQMm9tce0` 中的深色 **Home-主画板**（`14434:3261`）和浅色 **Home-主画板 - 浅色模式**（`14704:3871`）。修改前核对对应主题画板、组件状态与分层，不使用同名旧稿代替。
- 当前首页入口：`/home?glass=figma`；`/`、`/home.html` 会规范到 `/home`。Plants 为 `/plants`，电站详情为 `/plants/:id`。完整 URL 表见 [站点路由](./docs/ROUTING.md)。历史 glass / linear / workspace 原型已在整理时移除，恢复快照在 Source 外的 Backups；业务规划在 `docs/history/`，不能用其旧视觉值覆盖当前规范。
- 能从设计和现有实现确定的事项直接执行；缺少关键设计或业务信息时询问，不能编造素材、数据或后端能力。

## 工作方式与边界

- 简单或明确的需求按最小改动执行：先确认用户的操作路径、直接目标与验收点，只改导致问题的共享实现；不借机重做页面、增加未要求功能，或用替代指标冒充真实结果。
- 一次性视觉微调默认只影响当前范围；只有用户明确表达长期偏好或同类问题复现时，才升级为全局规则。规则只保留最终确认方案，已推翻的旧要求不再作为有效规则。
- 账户入口与通知按钮的旧上下文/通知浮层已按用户要求移除，等待重做；不得从旧组件、历史文档或备份恢复。按钮、玻璃和共享 hover 保留，重做后另行记录新的内容与交互。
- 只修改需求范围内文件；规则归档或文档整理任务不得夹带功能、视觉、资源和测试变更。
- 用户可用本地批注模式（`/home?glass=figma&annotate=1`）在具体元素上留言；最近一次批注保存在 `design-preview/annotations.json`（按页面分组，已 gitignore）。开始视觉修改前先读该文件，完成后按需清理，避免把旧批注当成新需求。
- 当前真实页面为 Home 与 Plants 列表；`/plants/:id` 已有可刷新 URL，但详情内容仍是明确的预览占位，不虚构设备数据或控制能力。Plants 列表行在新标签打开并激活对应详情，原列表标签保留；名称为 `?` 的行表示设备上线时已自动建站、只是资料未补全，仍然可点击进入详情，标签和详情主标题都显示 `?`，不得写成 Unassigned device。`?` 提示解释自动建站和资料未全，提示中的 `setup` 也可打开详情。`Back to Plants` 关闭当前详情标签并返回来源列表标签，直接刷新进入且没有来源标签时才在当前标签内返回。侧栏与首页快捷入口仍在当前标签内导航。Service ticket、Statistics、Device tool 等其余路由继续使用 Coming soon。搜索、菜单、示例数据、状态卡跳转和筛选均按现有实现如实描述，不虚构权限、持久化、筛选结果或后端能力；接入真实业务时另立规则并验收。

## 共享优先

- 新页面先复用 token、图标、材质和交互模式；不在页面局部另建颜色、玻璃或动效体系。
- 通用颜色、主题、字体、字号、间距、圆角和动效：`design-preview/src/foundations/tokens.css`。
- 动效由 `design-preview/src/foundations/motion.css` 统一提供，`src/shared.css` 自动加载；新页面、新组件和动态 DOM 不逐个补 transition。组件只声明默认与激活视觉值，禁止在页面/组件另写时长或缓动；JS 动画使用 `motion.js` 的 `motionDuration()` / `motionEasing()`。
- Figma 文字 styles 和节点绑定存于 `design-preview/design/figma/figma-type-source.json`，运行 `npm run sync:type` 生成 `src/foundations/type.css`。用 `data-type-style` / `typography.js` 绑定完整样式；禁止按字号猜字重。侧栏、tab、周期选择等的 `14/14 medium` 是 14px / 510，保留原稿行高和字距。
- 全局连续圆角统一在 `design-preview/src/foundations/geometry.css`：普通圆角矩形使用共享的原生 `corner-shape:superellipse(1.2)` 连续曲线，不改已有 `border-radius`、尺寸或布局。完整 `squircle`（指数参数 2）会明显收小视觉圆角，不能直接套用。该值是在真实 30px 卡片上并经用户确认的视觉选择，不是 Figma 参数的数值换算；Figma 的平滑度会延长切线，原生 `superellipse()` 始终限制在半径盒内，二者不能逐点精确匹配。不支持原生连续曲线时自然退回普通圆角。必须保留原稿圆形和胶囊形（含顶栏圆按钮、tab、搜索、侧栏菜单）。`geometry.js` 的 `preserveCornerProfile` 按原始半径和短边分类，半径达到短边一半时保留 `round`；玻璃各层继承宿主轮廓。正圆/椭圆也可用 `.wd-shape-round`；新页面必须加载共享文件。
- 标准头像使用 `.wd-avatar` / `design-preview/src/components/avatar.css`：1px 内描边与内部填充同色；深色使用以中心向四周扩散的 4px 径向阴影、不向下偏移，浅色完全隐藏外投影。禁止各页面单独重做头像材质。快捷入口的行间分隔为 1px，分组末尾不追加分隔线。
- 首页全部状态/图表卡片（30px）及右侧整体底板（10px）同样使用共享连续曲线，禁止为修正视觉大小退回 `round` 或添加 `.wd-corners-original` 例外。验收同时检查真实轮廓与半径数值，不能只检查 `border-radius`。禁止靠加大半径补偿；默认、hover、描边、投影共用曲线。
- Figma 颜色的原始双主题绑定保存在 `design-preview/design/figma/figma-color-source.json`，生成文件为 `src/foundations/colors.css`。颜色按变量 ID 与语义引用，不能根据深色十六进制值猜浅色。更新源数据后运行 `npm run sync:themes`；首页提取场景由 `scene-theme.js` 适配，新增语义组件直接用 token。
- 玻璃参数与分层：`design-preview/src/components/glass-material.css`；挂载和微光：`design-preview/src/components/glass-material.js`。
- 操作按钮统一使用共享标准按钮：`design-preview/src/components/button.css` 的 `.wd-button--pill` 配 `.wd-button--neutral`（中性玻璃）或 `.wd-button--primary`（实心 Accents/Blue）；固定 36px 高、左右 16px 内距、13px / 510。面板、菜单、表单与页面不得另写按钮颜色、圆角、材质或光晕，每个视图只保留一个主按钮。
- 文本型浮层菜单统一使用 `design-preview/src/components/menu-popover.js` 与 `popover.css` 的 `.wd-menu` 内胆：面板顶部内距 20px、左右/底部 10px，标题 Footnote/Emphasized（13px / 590、次级色、左右 14px），行高 36px、14/14 medium（14px / 510）、胶囊 hover 与固定 20px 尾随勾选槽。顶栏 `Language` / `Appearance` / `WattDesk` 等紧凑菜单统一 200px 宽、30px 圆角；历史浮窗因完整层级路径保留最多 380px 外壳，但内部结构相同。不得为单个菜单另写宽度、行样式、勾选样式或材质变体；选中、hover、图标和文字均走共享状态。
- Plants 筛选主浮窗只保留 Company / Device / Connection / Running status 四类。工具栏入口打开时右缘与列菜单对齐；筛选条加号打开同一内容和交互的面板，但锚定在加号下方并以加号左缘对齐。主浮窗与 Company 条件浮窗为 `260px`；Device / Connection / Running status 的独立条件浮窗统一为更紧凑的 `208px`，保证选项单行且三项同宽。主浮窗高度随内容自适应且 hover 不位移；条件浮窗覆盖主浮窗内缘。一级、二级共用 `.wd-filter-menu` 的 20px 内距，长列表共用 `.wd-scrollbar`；Company 支持玻璃搜索框和 15 节点三态公司树，名称使用 `Footnote/Medium`、可换行、无横向滚动，滚动条贴卡片右缘；hover 有意图延迟。只有 Connection / Running status 条件显示 18px 不透明状态图标，表格 Status 同样使用不透明掩码，表格内 Status 图标与文字间距为 `4px`；Company / Device 不显示选项图标或数量。顶层公司选中后只显示一个汇总 chip。复选框只即时筛选、不关闭浮层；点击条件名称才应用并关闭。筛选条使用 `Backgrounds/Tertiary Elevated` 实底、chip 使用 `Fills/Secondary`，不得出现偏粉或偏紫的透明叠色；`Clear` 固定在右侧并跨多行垂直居中。工具栏筛选项 / 列修改蓝点为 `7px`。刷新按钮在转圈反馈的同时清除全部筛选、恢复默认列显隐与默认 `Last update` 降序排序；搜索词与收藏状态不随刷新清除。列可视性使用 Eye / Eye Closed 图标，`Plant type` 不再列出。共享搜索框嵌入浮层时清除按钮必须保持 18px 并垂直居中，外层 `.popover` 的通用按钮样式只能作用于直接子按钮。实现与回归见 `src/pages/plants/index.js` / `plants.css`、`src/components/popover.css`、`tests/verify-plants-filters.cjs`。
- Plants 筛选条加号打开的面板会固定初始视口位置；新增条件导致加号重新排版时，主面板不得跟着移动，二级条件浮窗仍按当前类目行定位。
- Plants 二级筛选浮窗的垂直位置以第一个可选项对齐一级类目行，而不是让二级标题与类目对齐；Company 的搜索区高度也计入偏移，顶部空间不足时按共享 12px 视口边距夹紧。
- 状态图标掩码必须把所有导出 `fill-opacity` / `stroke-opacity` 归一为 `1`；不能只替换常见的 `.7`，`asset-64.svg` 的 `.3` 也要处理，否则 Attention 红色会被削淡。
- 浮层开合与图表载入：`design-preview/src/foundations/motion.js`；首页装配：`design-preview/src/pages/home/home.css` / `src/pages/home/index.js`。
- 所有浮窗默认锚定触发元素（Glass Surface + 实时跟随）：菜单、popover、日期/时间、历史、图表菜单、tooltip 等统一走 `design-preview/src/components/popover.js` 的 `registerPanel()`，打开、滚动（document 捕获阶段，覆盖嵌套滚动区）、缩放和视口变化都重新测量；调用方不得缓存坐标或另写滚动监听。触发元素一半以上离开视口时关闭。全屏搜索等真正的模态层除外。
- 全局 toast（收藏、刷新、周期、预览操作等短反馈）统一放在工作区顶部，纵向中心与页面标题中心对齐；当前基准为 `top:78px`，不得在页面局部改回底部或另造通知浮层。toast 仍是共享只读 Glass Surface，不响应缩放；出现使用 `--wd-motion-panel` / `--wd-ease-panel` 从上方 `4px` 下落入位并淡入，消失使用 `--wd-motion-panel-exit` / `--wd-ease-hover-out` 上浮 `4px` 并淡出，减少动态效果时立即切换。
- 工作区标签支持按住拖拽排序，统一由 `design-preview/src/components/workspace-tabs.js` 管理；拖动跨过邻居时即时重排并做 FLIP 过渡，释放后吸附到最终槽位，拖拽本身不得误触标签切换。键盘用 `Ctrl/Cmd + Shift + ←/→` 等价重排；键位、焦点、活动标签及路由在拖动中保持不变。多标签顺序仍不跨刷新持久化。
- `Recently visited` 与左上角历史浮窗共用同一份全局访问归档，各工作区标签的访问都写入这里；顶栏后退 / 前进仍是标签内独立历史，二者不能混为一体。条目必须保存 `{route, params}`，电站详情展示为 `Plants / <电站名>`，父级与分隔符用 Labels/Secondary，最后一级用 Labels/Primary；首页行和浮窗共用 `components/history-path.js`，整条路径必须可读，不能只显示父级或依赖 tooltip。首页历史行的 hover / 键盘 focus 必须为所有面包屑片段显示与各自文字色一致的下划线。
- 长列表自定义滚动反馈统一使用 `design-preview/src/components/scroll-feedback.js` / `.css`：页面只提供滚动容器、内容节点和上下内距；悬停、拖动、上下越界弹性、回弹时滑块缩短均由组件负责。视觉轨道顶部从固定表头下方的数据区开始，底部至少保留与滚动条横向安全区一致的 `10px` 留白；调用方不得复制 DOM、监听器或局部时长。当前只有 Plants 长列表接入，其他滚动区域按是否属于“数据列表”再复用，不因存在 overflow 就自动替换。
- 全屏搜索的入场与退场互为反向：结果面先走、搜索框随后、背景遮罩最后；退场一律向下位移并淡出。遮罩的模糊必须比内容更晚收完，使用 `--wd-motion-search-veil-out` / `--wd-motion-search-veil-delay`，不能与内容共用短时长；遮罩只淡出颜色和模糊，不对元素自身做 `opacity` 退场。
- 控件文字与图标联动使用 `design-preview/src/components/control-states.css` / `control-states.js` 的共享状态；周期选择等控件 hover / focus 时图标和文字同时变主文字色，不能只改其中一个。
- 统计周期胶囊使用共享日期选择组件：文字与日历图标默认 Labels/Secondary，hover / 键盘 focus 同步变为 Labels/Primary；宽度随实际文字和预设/自定义范围自动调整，不能固定宽度或裁切。刷新按钮右缘与下方图表卡片右缘固定对齐，胶囊只向左增长，间距 10px。日期选择器的预设为 Today、Yesterday、Last 24 hours、Last 7 days、Last 30 days、This month、Custom range，输入 Start date / End date 并以 Apply 提交；不得恢复旧 `Custom date range…` 入口。
- 图标、Logo 和字体使用 Figma 原始导出素材，保留来源信息；禁止近似替换、Unicode 图标和重画字形。临时远程素材链接不得作为正式运行依赖。
- 修改共享参数前检查全部使用处、深浅主题和状态；同步 `DESIGN-SYSTEM.md`，不能只修一个截图。

## 玻璃与控件状态

- 正式玻璃方向用 `figma`：保留 **Fill + Shadow 底层 + Glass Effect 高光层**。暗色外轮廓与窄白色内亮边分开绘制，不能合并成整圈亮描边或大片白渐变。
- 光学参数共享，局部只决定形状与尺寸；禁止每个组件各写一套玻璃。弃用的 `liquid` 对比已从运行代码移除；正式统一为 `figma`，不得恢复组件级材质分叉。
- 浅色玻璃与深色共用分层，但有独立主题参数。浅色以原稿四层中性底色为基础，按最新反馈压灰底色、保留细白亮边，使用柔和悬浮投影与短距离接触阴影表现厚度；全部统一由材质 token 控制。修改浅色参数不能改变已确认的深色材质。
- 图表和普通数据卡片按设计使用普通表面，不自动玻璃化。原始材质参数见 `design-preview/design/figma/glass-source.json`。
- hover / focus 同时反馈文字与图标：侧栏文字统一用主题主文字色（深色下纯白），禁止变彩色；中性图标也变为主文字色，原始彩色图标保留彩色。通知及其他玻璃控件中的中性图标必须实际变白，不能因 SVG 内置透明度仍显灰；浅色主题使用对应主文字色。
- 未选中 tab 默认 Labels/Tertiary，仍可点击；hover 恢复原始图标与主文字色，不按 disabled 处理。选中侧栏导航无额外描边和阴影。
- 账户名称默认使用 Labels/Primary；双箭头默认 Labels/Secondary，账户 hover / 键盘 focus 时必须与姓名、头像一起切到 Labels/Primary。工具栏及图表三点菜单用圆形高亮。
- 主题切换按钮：鼠标点击后不得残留 hover / 主色；普通 DOM 焦点恢复 Labels/Secondary，只有键盘 `:focus-visible` 保持 Labels/Primary。
- 前进/后退等中性图标控件：可用默认 Labels/Secondary，hover / focus 为 Labels/Primary；不可用为 Labels/Quaternary，不响应高亮或激活。用真实 disabled 或 aria-disabled 表示，后者还须阻止点击及键盘激活。

## 动效边界

- hover 进入使用 `240ms`（快起缓收），离开使用 `360ms`（柔和退场），两者共用共享变量与缓动；一般只改变颜色、背景、下划线和光晕，不移动、缩放、旋转或改变控件及文字尺寸。禁止 `transition: all`。
- 图标状态遮罩的 `::before` / `::after` 和宿主文字、图标必须共用同一节奏，渐入渐出，不能瞬间切换、闪一下或出现黑灰中间态；伪元素选择器不能写进 `:is()` / `:where()` 的参数列表，否则整条规则会被丢弃。`Add tab` 等图标按钮不得再叠加 `filter: brightness()` 之类的局部提亮 hover。
- 明确例外：前两张可点击状态卡的内部箭头可在 hover 时向右上移动 2px 并平滑复位；卡片本体保持原位。不得扩展为全站 hover 位移。
- 玻璃 hover / focus 增强表面与底缘亮度，只让指针附近的一段边缘和内部跟随光斑变化，不能整圈发白；浅色与深色分别使用材质 token，圆钮由共享材质自动识别。黑色/白色 hover 边缘参数、贴边和圆钮细节以 `DESIGN-SYSTEM.md` 为准。
- 玻璃深层反馈只属于可交互宿主，由共享材质自动继承：普通玻璃宿主 hover `1.025` / 按下 `1.065`，正圆宿主 hover `1.07` / 按下 `1.18`，按下起点快速、松开缓慢回落；缩放锚定宿主物理中心。纯展示、无跳转的玻璃表面通过 `createGlassMaterial({surfaces:[{interactive:false}]})` 标记为 `.wd-glass--static`，保留材质与指针光晕但 hover / 按下都不缩放；不得在页面局部写 `transform:none`。按钮、tab、日期控件和可点击卡片默认继续缩放，不逐个声明。复合容器（`.wd-glass-chrome` 整组、`.wd-glass--surface` 弹窗/浮层）不整体缩放，只有内部独立玻璃控件响应，避免点击面板任意位置带动整块卡片。新组件不手写缩放值或延迟。
- 分类折叠使用高度与透明度，支持中途反向；原稿实心箭头随点击平滑旋转 90°，与折叠共用时长/缓动，不瞬间换图。维护 `aria-expanded`、`aria-controls`、隐藏和不可聚焦状态。
- 点击浮层可轻微缩放和淡入淡出，采用非线性缓动；不等待动画结束才响应输入。
- 刷新仅在点击后让图标转一圈，期间防重复触发，容器不旋转。图表首次进入可视区轻量载入，坐标轴、标题、数值不跳动，不循环或伪装成实时数据。
- CSS 和 JavaScript 动画均遵循 `prefers-reduced-motion`；不得留下不可见数据或阻塞操作。
- 载入占位是共享组件能力：只给真实等待的区域挂 `data-skeleton`，由 `components/skeleton.js` 统一挂载；侧栏、顶栏、标签与已可用内容直接显示。`140ms` 内就绪不得绘制骨架，超时后单次扫光并平滑换回内容；骨架不得改变圆角、描边、玻璃或布局，减少动态效果保留静态骨架但不扫光。禁止页面逐卡写骨架、循环 Loading 或伪造进度。
- 深浅主题统一通过 `theme-controller.js` 切换：620ms 非线性整页交叉淡入，包括 SVG、渐变和材质；首次载入不播放，连续切换以最后一次操作为准。减少动态效果时立即切换，旧引擎使用有限的颜色过渡；禁止全页反色或 `transition: all`。

## 交付检查

- 核对默认、hover、focus、选中、禁用/加载（适用时）及深浅主题。
- 快捷入口和 View all 在 hover / focus 显示下划线；快捷入口区左右各内收 20px；图表卡片用 Separators/Vibrant。
- 阴影不被裁切；滚动到底的底部留白以单独布局文档为准，不在本文件或组件规范里另定 32px；仍检查 1545×1252 与基准 1920×1080。
- 使用与改动匹配的检查和真实浏览器验证；共享视觉修改需截图。脚本和运行方法见 `DESIGN-SYSTEM.md`。
- 当前是设计预览：URL 路由、深链接和刷新已接入，Home/Plants 为本地示例，Plant 详情仍是占位；未接入后端统计、权限和真实设备操作，反馈必须如实说明。
