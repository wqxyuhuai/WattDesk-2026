# WattDesk 项目开发入口规则

适用于本目录及全部子目录。新对话先读本文件；需要快速恢复项目全貌、标准选择、归档和交接入口时再读 [项目地图](./docs/PROJECT-MAP.md)。每次新增页面、修改组件或调整视觉前，还必须读 [全站设计与交互规范](./DESIGN-SYSTEM.md) 和 [项目当前状态](./docs/PROJECT-STATUS.md)。新增页面再读 [架构](./docs/ARCHITECTURE.md) 与 [组件手册](./docs/COMPONENTS.md)；既往反馈见 [用户要求记录](./docs/USER-REQUIREMENTS.md)。

## 结构与记录

- 当前运行代码按 `design-preview/src/foundations`、`components`、`layouts`、`pages` 分层，所有页面加载 `src/shared.css`；不复制一套新的基础。页面依赖组件，组件依赖基础，共享层不得反向依赖首页节点 ID。
- 项目总索引、唯一标准入口、记录职责、清理架构和交接流程见 [项目地图](./docs/PROJECT-MAP.md)；具体视觉参数仍以设计规范为准，不能把总索引当成第二套规范。
- 原始 Figma 来源在 `design-preview/design/figma/`，运行资产在 `home-assets/`，生成场景在 `src/pages/home/data/`。完整同步用 `npm run sync`。生成文件不手改；原稿写死的几何值可保留。
- 新页面使用语义布局，参考 `templates/page.html`，不复制首页绝对坐标 scene。除 Home 外，新页面统一沿用 Plants 数据页外壳：页面根视图透明并占满右侧工作区，共享 40px 页头固定在正文上方且只承载面包屑与同一行页面动作；正文在页头下方独立滚动。页面主体、卡片、列表与网格默认横向铺满可用内容区，页面级内距使用 `--wd-page-inset`（当前基准 `24px`），不得套用 Home 的 `1000px` 居中画布或 `48px` 阴影留白；只有长正文阅读列、对话框或组件自身有明确可读性上限时才允许限宽。URL、深链接与刷新规则见 [站点路由](./docs/ROUTING.md)；新页面必须同时登记规范路径、服务端回退和回归断言。后端与权限仍未接入，不能虚构。
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
- 当前真实页面为 Home、Plants 列表与 Service Ticket 本地预览；`/plants/:id` 已有可刷新 URL，但详情内容仍是明确的预览占位，不虚构设备数据或控制能力。Plants 列表行在新标签打开并激活对应详情，原列表标签保留；名称为 `?` 的行表示设备上线时已自动建站、只是资料未补全，仍然可点击进入详情，标签和详情主标题都显示 `?`，不得写成 Unassigned device。`?` 提示解释自动建站和资料未全，提示中的 `setup` 也可打开详情。`Back to Plants` 关闭当前详情标签并返回来源列表标签，直接刷新进入且没有来源标签时才在当前标签内返回。侧栏与首页快捷入口仍在当前标签内导航。Statistics、Device tool 等其余路由继续使用 Coming soon。搜索、菜单、示例数据、状态卡跳转和筛选均按现有实现如实描述，不虚构权限、持久化、筛选结果或后端能力；接入真实业务时另立规则并验收。
- Plants 页面的按钮行为、筛选并集、列结构、数据契约、键盘交互和组件依赖以 `design-preview/src/pages/plants/README.md` 为准；修改该页功能、视觉规则或验收断言时同步更新该文件。
- Service Ticket 使用 `/service` 卡片列表、`/service/new` 新建编辑页与 `/service/:ticketId` 详情；Ongoing / Closed 混排为桌面 3–4 列等高窄卡，页头必须调用共享 `createPageHeader()` 与 Plants 完全一致，`New ticket` 使用共享 `createPageHeaderAction()` 轻量文字动作。共享页头只渲染面包屑，不再保留单独页面标题分支；固定 40px 高，面包屑与右侧动作同轴垂直居中。所有层级统一使用 14px / 510，路径分隔复用顶栏 `asset-14.svg` 前进箭头，父级 hover / focus 为两端半圆的胶囊浅灰底而不是文字下划线。工具栏最左为状态筛选、短竖线后为 All / Mentioned me / Created by me。卡片左上为等宽编号胶囊、右上为状态，只保留标题、两行摘要及分隔线下的作者/时间；卡片默认无描边、无投影，PixelCard 像素和 FlipCard 倾斜/反光只用于指针交互，hover 背景高亮与阴影暂时都关闭；每次指针进入时编号胶囊播放一次左上至右下的 `680ms` 扫光，使用共享 token 且不循环，`--wd-card-hover-shadow` 仅保留作后续显式启用。减少动态效果时关闭像素、倾斜、反光和扫光。点击始终打开工单，拖动不得误触跳转。`New ticket` 必须在新工作区标签打开 `/service/new`，直接显示与详情一致的双栏编辑页并聚焦标题；左列承载标题、正文、附件和右对齐操作，右列 Properties 与标题顶部对齐并显示 Status / Plant / Author / Created / Last activity / Replies。电站选择必须放在 Properties 的 Plant 行，点击后打开与 Plants 公司筛选二级浮窗一致的 288px 搜索浮窗，复用共享搜索、行样式、玻璃与滚动反馈。原列表标签保留，发布后当前新标签原地切换为 `/service/:ticketId`，取消则关闭当前新标签回到来源列表。编辑已有工单和新建/编辑回复仍在最终展示位置原位输入，不弹窗。当前搜索、提及、附件预览、回复和状态切换只作用于本地样例会话，刷新恢复样例；未接登录权限、上传、持久化或通知。行为、数据契约和验收以 `design-preview/src/pages/service-ticket/README.md` 为准。
- Service Ticket 响应式固定为：列表桌面 `3–4 → 2 → 1` 列，详情桌面“正文 + Properties”双栏，窄屏收为单列且 Properties 不得与正文重叠；回复与附件操作不能只依赖 hover。至少核对 `1545×1252`、`1920×1080` 和 420px 单列，页面不得出现整页横向滚动。
- Service Ticket 详情的 Properties 必须与一级讨论卡同背景、顶部与工单标题对齐，并从滚动第一帧固定；桌面操作入口位于工单标题行，使用 36px 中性玻璃圆钮与 18px `asset-70.svg` 三点图标，图标必须水平、垂直居中，右缘与主内容列一致。点击后的 Ticket actions 菜单不显示可见标题，仅以 `aria-label="Ticket actions"` 保留无障碍名称，并自动使用共享 `.wd-menu--no-heading` 的上下各 `10px` 内距。范围筛选按钮复用共享 `.wd-press-scale`，不能另写局部缩放时长。
- 已发布工单详情的 Properties 必须把票号作为列表第一项：`Ticket ID` 标签在上，票号胶囊在下，其他属性随后排列，不再放在标题行右侧。票号复用列表卡片 `.service-card-number` 的字体、填充、圆角和等宽数字；属性栏只允许用修饰类收紧到 `20px` 高、`7px` 水平内距。新建草稿尚未产生稳定票号，不显示伪造占位。
- Service Ticket 作者徽标固定为实底白字：`POSTER` 使用共享 `Accents/Brown` 64% 与 `Grays/Black` 36% 混合出的深琥珀底，不能恢复亮黄底；`YOU` 使用共享 `Accents/Blue`。文字在深浅主题下都必须保持 `#fff`，POSTER 与白字的对比度至少为 `4.5:1`，不能继承 Labels 语义色。保留 15px 胶囊高度与现有 10px / 12px 文字行盒。
- 共享头像缩写按直径使用统一档位：`22–24px` 使用 `9px / 10px`，`25–32px` 使用 `11px / 13px`，`33px+` 使用 `14px`；`.wd-avatar-label` 继续做 `0.5px` 光学下移。Service Ticket 列表卡片的 24px 作者头像与 Properties 的 22px 作者头像都属于 compact 档，不得在页面单独覆盖；不得改变头像本体尺寸、描边和阴影。
- Service Ticket 评论区顺序固定为：正文下方分割线 → 常驻回复框 → Activity 标题与排序按钮 → 回复卡列表。分割线上方保留 84px、下方到回复框保留 40px。排序按钮必须显示向下箭头，复用 `asset-14.svg` 并旋转 90°，箭头与文字同步继承共享 hover / focus 状态；排序文字底部与 Activity 标题底部对齐，文字、箭头和 hover 背景必须共用同一垂直中心线，文字和箭头之间保留 6px。
- Service Ticket 回复楼层不再显示独立 `Reply` 操作，楼层底部常驻回复入口就是回复动作。自己的回复只在卡片 hover / 键盘 focus 时渐显一个 36px 中性玻璃三点圆钮，复用 `asset-70.svg`；点击后的共享菜单浮层仅包含 `Edit / Delete`。编辑原位进入编辑器，删除使用确认弹窗；鼠标离开且菜单关闭后圆钮渐隐。操作容器必须使用共享 `.wd-hover-reveal-host` / `.wd-hover-reveal` 透明度节奏，进入 `240ms`、离开 `360ms`，不得在页面局部另写动画。其他用户的回复不渲染空操作区。
- Service Ticket 一级讨论卡内的内联回复编辑器，hover / focus 只将 `Leave a reply…` 占位文字提升到主文字色；左侧当前用户头像保持不变，不参与文字高亮、缩放、描边或阴影反馈。
- Service Ticket 回复编辑器分两种同构状态：Activity 顶部独立区是约 100px 高的轻量输入卡，四边内距为 14px / 16px，无姓名标题行，右下仅保留 36px 玻璃回形针与发送圆钮；空内容时发送禁用，有正文或附件后转共享蓝色主按钮，占位文字在 hover / focus-within 时转 Labels/Primary，并继承共享进入 `240ms` / 离开 `360ms` 的颜色节奏。所有回复发送圆钮共用 16px 向上箭头 `home-assets/service-ticket/send-up.svg`，不再旋转导航箭头。一级讨论卡内部回复区直接使用 28px 当前用户头像、7px 间距与透明输入列；展示态和编辑态统一使用 `0px` 头像行到正文间距，楼中楼组间距为 `12px`、内部上下内距为 `10px`。回复入口与内联编辑器行高 `49px`、外距 `8px`、上下内距 `10px`，头像实际上下留白为 `11px / 10px`；操作按钮相对整行绝对居中并通过透明度渐变出现，只有内容换行后才增高。本人回复的原位编辑必须固定作者行 `36px` 高，并让正文与单行编辑器共用同一个 `20px` 行盒起点和高度；进入编辑时卡片顶边、作者行、正文位置、分隔线和回复入口均不能跳动，只有实际换行后才增高。编辑态在附件与发送之间增加 36px 中性玻璃 X 圆钮，图标盒为 10px、`aria-label="Cancel"`；点击后丢弃当前编辑草稿并恢复原评论。新建回复仍只显示附件与发送。顶部评论框在 Ongoing 工单中始终展示，使用独立 `commentDraft`，打开或编辑其他回复时不得隐藏或丢失草稿；它与讨论列表之间保持至少 16px 间距。顶部评论框、一级回复卡和 Properties 统一使用共享 `wd-discussion-card` 表面；深色主题保留 1px `Separators/Non-opaque` 内描边和零位移双层阴影，浅色主题下三者统一为纯白 `Backgrounds/Primary` 底、无内描边、无投影的平面表面。`18px` 圆角必须继续命中共享 `geometry.js` 的 `superellipse(1.2)` 连续曲率。输入框随多行内容增高至 180px 上限；Esc 取消，`Ctrl/Cmd + Enter` 提交。POSTER / YOU 标签保留 `Caption2/Regular` 的字族与字重绑定，但文字覆盖为 `10px / 12px` 行盒，外层胶囊高度仍为 15px，避免比正文更抢眼。
- Service Ticket 回复输入使用 `contenteditable` 语义文本盒而不是原生 textarea，以便区分段间距和行距：基字体与回复正文一致为 SF Pro / `Subheadline/Regular`（15px / 400 / 20px / -0.23px），Enter 新建段落，Shift + Enter 保留段内换行；段落之间额外 `6px` 上距，视觉间距大于 20px 行距。输入态和发送后的展示态都按 `\n\n` 分段并共用该 6px 段落规则；空态占位仍使用共享 `240 / 360ms` 颜色过渡。
- Service Ticket 标题在新建和编辑态必须使用自动增高的多行文本输入，不得使用单行 `input` 横向隐藏超长内容。输入宽度上限与展示标题同为 `760px`，超长时按词和长串自然换行并向下生长；Enter 不产生段落，粘贴中的换行归一为空格。展示态继续使用同一宽度、字体、行高和 `overflow-wrap:anywhere`，保证发布或保存前后换行一致。
- 多行输入和其他需要随内容自动增高的布局统一调用 `design-preview/src/foundations/motion.js` 的 `animateContentHeight()`，使用 `--wd-motion-content-grow` / `--wd-ease-content-grow`（当前 `280ms`）。连续输入时从当前可见高度重新开始，初次测量和减少动态效果时立即落位；不得在页面内另写高度动画时长或缓动。
- Service Ticket 回复输入达到 `180px` 上限并溢出后，必须通过共享 `createScrollFeedback({elastic:false})` 显示 `10px` 滚动轨道，隐藏原生滚动条；滚轮位于输入框内时先滚动文本，只有编辑器已到对应边界后才允许外层页面继续滚动。独立回复框和楼内编辑器使用同一规则，外层固定编辑器不得因输入内容滚动而移动。
- Service Ticket 的 `contenteditable` 回复输入必须拦截 paste，只读取并清洗 `text/plain`；禁止把剪贴板 HTML 的颜色、字体、字号、粗体、链接或外层布局带入。纯文本无法提供时才从 HTML 降级提取文字。粘贴后仍按 `\n\n` 创建普通段落、单换行创建 `<br>`，并沿用 6px 段间距与系统文本样式。
- Service Ticket 浅色主题只能在 `.service-board`、`.service-empty`、`.service-detail-content` 内容范围内重设可读性语义色，不修改全局 token：Secondary 混入约 70% 主文字黑，Tertiary 混入约 55% 主文字黑。正文、属性标签、时间、回复上下文和底部中性按钮的文字对比度不得低于 4.5:1；楼内 `Reply to this thread…` 的默认提示单独使用约 45% 主文字黑以降低视觉权重，hover / focus 回到主文字黑。页头、工具栏和共享搜索框必须继续使用全局 label token；禁用态仍使用 Quaternary。
- Breadcrumb 分隔箭头必须与父级文字同为 Labels/Secondary，并首帧使用 `masks/asset-14.svg` 不透明面具；箭头左右视觉间距各 8px，不能先显示原稿低透明度中间态。
- Service Ticket 范围按钮默认使用 Fills/Tertiary、选中使用更强的 Fills/Primary；卡片固定 184px，高优先级保留标题/正文阅读区，通过收紧 Footer 区上下间距腾出空间。
- Service Ticket 范围按钮固定 36px 高，与 `All status` 控制一致。

## 共享优先

- 新页面先复用 token、图标、材质和交互模式；不在页面局部另建颜色、玻璃或动效体系。
- 通用颜色、主题、字体、字号、间距、圆角和动效：`design-preview/src/foundations/tokens.css`。
- 全站时间显示统一使用 `design-preview/src/foundations/time.js`：`0–9s` 为 `Just now`，`10–59s`、`1–59m`、`1–23h`、`1–6d` 使用单复数正确的相对时间，达到 `7d` 后显示本地 `YYYY/MM/DD HH:mm`。页面不得另写时间格式；排序继续读取原始时间值，所有时间节点保留绝对 `title` 与 `<time datetime>`。
- 浅色主题使用等 RGB 中性灰：页面画布 `#EDEDED`、共享工作区面板 `#F7F7F7`；中性变量、玻璃 tint、控件填充、分隔线和次级文字不得带冷蓝偏。Home 的统计 / 业务数据卡仅在浅色使用纯白底。主面板不绘制内外描边，阴影固定为 `0 2px 3px rgba(0,0,0,.035) + 0 4px 9px -3px rgba(0,0,0,.05)`；深色面板材质与 1px 内描边保持不变。
- 动效由 `design-preview/src/foundations/motion.css` 统一提供，`src/shared.css` 自动加载；新页面、新组件和动态 DOM 不逐个补 transition。组件只声明默认与激活视觉值，禁止在页面/组件另写时长或缓动；JS 动画使用 `motion.js` 的 `motionDuration()` / `motionEasing()`。
- Figma 文字 styles 和节点绑定存于 `design-preview/design/figma/figma-type-source.json`，运行 `npm run sync:type` 生成 `src/foundations/type.css`。用 `data-type-style` / `typography.js` 绑定完整样式；禁止按字号猜字重。侧栏、tab、周期选择等的 `14/14 medium` 是 14px / 510，保留原稿行高和字距。
- 全局连续圆角统一在 `design-preview/src/foundations/geometry.css`：普通圆角矩形使用共享的原生 `corner-shape:superellipse(1.2)` 连续曲线，不改已有 `border-radius`、尺寸或布局。完整 `squircle`（指数参数 2）会明显收小视觉圆角，不能直接套用。该值是在真实 30px 卡片上并经用户确认的视觉选择，不是 Figma 参数的数值换算；Figma 的平滑度会延长切线，原生 `superellipse()` 始终限制在半径盒内，二者不能逐点精确匹配。不支持原生连续曲线时自然退回普通圆角。必须保留原稿圆形和胶囊形（含顶栏圆按钮、tab、搜索、侧栏菜单）。`geometry.js` 的 `preserveCornerProfile` 按原始半径和短边分类，半径达到短边一半时保留 `round`；玻璃各层继承宿主轮廓。正圆/椭圆也可用 `.wd-shape-round`；新页面必须加载共享文件。
- 标准头像使用 `.wd-avatar` / `design-preview/src/components/avatar.css`：1px 内描边与内部填充同色；深色使用以中心向四周扩散的 4px 径向阴影、不向下偏移，浅色完全隐藏外投影。缩写必须由 `.wd-avatar-label` 包裹并做 `0.5px` 光学下移；`createAvatar()` 根据尺寸写 `data-avatar-size` 档位，22–24px 为 9/10、25–32px 为 11/13、33px+ 为 14px。头像尺寸、描边、阴影与布局不变，页面不得重复字号补丁。
- 首页全部状态/图表卡片（30px）及右侧整体底板（10px）同样使用共享连续曲线，禁止为修正视觉大小退回 `round` 或添加 `.wd-corners-original` 例外。验收同时检查真实轮廓与半径数值，不能只检查 `border-radius`。禁止靠加大半径补偿；默认、hover、描边、投影共用曲线。
- Figma 颜色的原始双主题绑定保存在 `design-preview/design/figma/figma-color-source.json`，生成文件为 `src/foundations/colors.css`。颜色按变量 ID 与语义引用，不能根据深色十六进制值猜浅色。更新源数据后运行 `npm run sync:themes`；首页提取场景由 `scene-theme.js` 适配，新增语义组件直接用 token。
- 玻璃参数与分层：`design-preview/src/components/glass-material.css`；挂载和微光：`design-preview/src/components/glass-material.js`。
- 操作按钮统一使用共享标准按钮：`design-preview/src/components/button.css` 的 `.wd-button--pill` 配 `.wd-button--neutral`（中性玻璃）或 `.wd-button--primary`（实心 Accents/Blue）；固定 36px 高、左右 16px 内距、13px / 510。面板、菜单、表单与页面不得另写按钮颜色、圆角、材质或光晕，每个视图只保留一个主按钮。
- 页面头部右侧的图标+文字动作例外使用共享 `createPageHeaderAction()` / `.wd-page-action`：28px 高、左右 10px 内距、6px 图文间距、14px 图标、13px / 510；默认透明且无玻璃 / 描边 / 投影，hover / focus 才显示 `Fills/Tertiary` 浅灰胶囊并转主文字色。Plants `New plant` 与 Service Ticket `New ticket` 共用该变体，不得回到 36px 玻璃按钮或逐页另写。
- 所有搜索框直接复用 `createSearchField()`；放大镜默认 `Labels/Secondary`，hover / focus-within 才转 `Labels/Primary`。页面不得单独覆盖搜索图标颜色；页面级文字可读性 token 不得覆盖工具栏和共享搜索控件。
- 实心 Accents/Blue 主按钮的文字与图标在深浅主题的默认、hover 和键盘 focus 状态都保持白色。浅色主题的共享 hover 控件文字变主文字色规则必须显式排除 `.wd-button--primary`，不能把蓝底白字覆盖成黑字。
- 共享 36px 圆钮 hover / focus 时，宿主按玻璃圆钮 `1.07` 缩放，内部 `.wd-control-icon` 或直接 `.target-icon-art` 同步额外放大到 `1.06`，按下到 `1.12`；图标只做视觉 transform，布局盒和按钮命中区不变，释放及减少动态效果沿用共享玻璃节奏。
- 文本型浮层菜单统一使用 `design-preview/src/components/menu-popover.js` 与 `popover.css` 的 `.wd-menu` 内胆：有标题时面板顶部内距 20px、左右/底部 10px；无标题时自动加 `.wd-menu--no-heading`，顶部与底部均为 10px。标题 Footnote/Emphasized（13px / 590、次级色、左右 14px），行高 36px、14/14 medium（14px / 510）、胶囊 hover 与固定 20px 尾随勾选槽。顶栏 `Language` / `Appearance` / `WattDesk` 等紧凑菜单统一 200px 宽、30px 圆角；历史浮窗因完整层级路径保留最多 380px 外壳，但内部结构相同。不得为单个菜单另写宽度、行样式、勾选样式或材质变体；选中、hover、图标和文字均走共享状态。
- Plants 筛选主浮窗只保留 Company / Device / Connection / Running status 四类。Device 的最终名称与筛选顺序固定为 `Inverter / BMS / Heater`；电站可包含多个设备，表格按同一顺序以 `Inverter/BMS/Heater` 组合展示。Running status 固定为 `Attention / Unbound / Normal`，表格和筛选不能使用旧长名称。所有筛选组内的多选均采用并集：电站只要包含任一选中 Device，或命中任一选中 Connection / Running status，就应展示。工具栏入口打开时右缘与列菜单对齐；筛选条加号打开同一内容和交互的面板，但锚定在加号下方并以加号左缘对齐。主筛选浮窗为 `260px`，Company 条件浮窗为 `288px`；Device / Connection / Running status 的独立条件浮窗统一为更紧凑的 `208px`，保证选项单行且三项同宽。主浮窗高度随内容自适应且 hover 不位移；条件浮窗覆盖主浮窗内缘。一级、二级共用 `.wd-filter-menu` 的 20px 内距；Company 长列表必须复用 `.wd-scroll-feedback`，通过默认弹性模式传入 `content: secondaryBody`，获得与表格列表相同的 6/8px 圆角滑块、hover、拖动、上下越界回弹和回弹缩短，标题与搜索框保持固定。浮层内回弹空白必须透明，直接透出母玻璃，不能复用普通数据表的 `Backgrounds/Tertiary` 实底色块。Company 专用的左侧回收、加宽和行内间距必须限制在 `.plants-filter-options.is-company` 与公司行范围内，不能改变 Device / Connection / Running status 的共享内容线；这些普通条件组继续保留标准内缩。Company 列表左侧只保留约 `4px` 容器内距，层级每级 `12px`；展开按钮与复选框同为 `16px` 方形，箭头为 `12px` 且两者垂直中心对齐，名称与默认滑块至少保留约 `8px` 间距。Company 支持玻璃搜索框和 15 节点三态公司树，名称使用 `Footnote/Medium`、可换行、无横向滚动，滚动条距卡片右缘约 `4px`；hover 有意图延迟。只有 Connection / Running status 条件显示 18px 不透明状态图标，表格 Status 同样使用不透明掩码，表格内 Status 图标与文字间距为 `4px`；Company / Device 不显示选项图标或数量。顶层公司选中后只显示一个汇总 chip。复选框只即时筛选、不关闭浮层；点击条件名称才应用并关闭。已应用筛选条使用 `Backgrounds/Tertiary Elevated` 实底，深色为 `#3A3A3C`，浅色为纯白，保证整条在斜向渐变面板上都有边界；chip 使用 `Fills/Secondary`，不得出现偏粉或偏紫的透明叠色；`Clear` 固定在右侧并跨多行垂直居中。表头与表体使用两个同步列宽的表；表头位于数据滚动区外并透明显示父面板背景，表体独立滚动，不得用实色底或 `backdrop-filter` 掩盖滚动内容。浅色表头继续使用与主面板相同的底色。工具栏本身保持透明。搜索字段的绘制层级必须高于筛选条与表头，让玻璃投影完整覆盖下方表面，不能在交界处形成浅边。工具栏筛选项 / 列修改蓝点为 `7px`。刷新按钮在转圈反馈的同时清除全部筛选、恢复默认列显隐与默认 `Last update` 降序排序；搜索词与收藏状态不随刷新清除。列可视性使用 Eye / Eye Closed 图标，`Plant type` 不再列出。共享搜索框嵌入浮层时清除按钮必须保持 18px 并垂直居中，外层 `.popover` 的通用按钮样式只能作用于直接子按钮。实现与回归见 `src/pages/plants/index.js` / `plants.css`、`src/components/popover.css`、`tests/verify-plants-filters.cjs`。
- Plants 筛选条加号打开的面板会固定初始视口位置；新增条件导致加号重新排版时，主面板不得跟着移动，二级条件浮窗仍按当前类目行定位。
- Device / Connection / Running status 小浮窗的选项内容使用约 `20px` 标准左内缩；选项按钮内部再保留 `8px` 文字左内距，复选框、文字和 hover 背景均不得贴住左边缘。调整只改变水平内缩，保持浮窗原宽度和底部位置。
- Plants 二级筛选浮窗的垂直位置以第一个可选项对齐一级类目行，而不是让二级标题与类目对齐；Company 的搜索区高度也计入偏移，顶部空间不足时按共享 12px 视口边距夹紧。
- 状态图标掩码必须把所有导出 `fill-opacity` / `stroke-opacity` 归一为 `1`；不能只替换常见的 `.7`，`asset-64.svg` 的 `.3` 也要处理，否则 Attention 红色会被削淡。
- 浮层开合与图表载入：`design-preview/src/foundations/motion.js`；首页装配：`design-preview/src/pages/home/home.css` / `src/pages/home/index.js`。
- 所有浮窗默认锚定触发元素（Glass Surface + 实时跟随）：菜单、popover、日期/时间、历史、图表菜单、tooltip 等统一走 `design-preview/src/components/popover.js` 的 `registerPanel()`，打开、滚动（document 捕获阶段，覆盖嵌套滚动区）、缩放和视口变化都重新测量；调用方不得缓存坐标或另写滚动监听。触发元素一半以上离开视口时关闭。全屏搜索等真正的模态层除外。
- 全局 toast（收藏、刷新、周期、预览操作等短反馈）统一放在工作区顶部，纵向中心与数据页共享面包屑中心对齐；当前基准为 `top:70px`，不得在页面局部改回底部或另造通知浮层。toast 仍是共享只读 Glass Surface，不响应缩放；出现使用 `--wd-motion-panel` / `--wd-ease-panel` 从上方 `4px` 下落入位并淡入，消失使用 `--wd-motion-panel-exit` / `--wd-ease-hover-out` 上浮 `4px` 并淡出，减少动态效果时立即切换。
- 工作区标签支持按住拖拽排序，统一由 `design-preview/src/components/workspace-tabs.js` 管理；拖动跨过邻居时即时重排并做 FLIP 过渡，释放后吸附到最终槽位，拖拽本身不得误触标签切换。键盘用 `Ctrl/Cmd + Shift + ←/→` 等价重排；键位、焦点、活动标签及路由在拖动中保持不变。标签集合、顺序、活动标签、路由参数和页面快照使用 `sessionStorage` 的 `wattdesk.workspace.v1` 恢复；URL 优先，关闭浏览器标签页后清空。标签内前进/后退栈、来源标签关系和业务草稿不持久化。
- `Recently visited` 与左上角历史浮窗共用同一份全局访问归档，各工作区标签的访问都写入这里；顶栏后退 / 前进仍是标签内独立历史，二者不能混为一体。条目必须保存 `{route, params}`，电站详情展示为 `Plants / <电站名>`，父级与分隔符用 Labels/Secondary，最后一级用 Labels/Primary；首页行和浮窗共用 `components/history-path.js`，整条路径必须可读，不能只显示父级或依赖 tooltip。`/` 左右必须通过共享内距保留可见空格，不能依赖会被 flex 吞掉的原始空白。空间不足时优先保留紧邻末级的父路径，先缩短单页标题；只有父级加最小可读末级仍放不下时才丢弃更早层级。首页历史行的 hover / 键盘 focus 必须在整条路径上绘制一条连续下划线，不能让各片段或分隔符形成断口。
- 可见滚动反馈统一使用 `design-preview/src/components/scroll-feedback.js` / `.css`：需要上下越界回弹的数据列表和浮层列表使用默认弹性模式，并传入实际滚动内容节点；无需回弹的固定滚动区显式传 `elastic:false`。页面只提供滚动宿主、视口、内容节点和内外距，不得复制 DOM、监听器、局部时长，也不得再新建 `.wd-scrollbar` 或原生 `::-webkit-scrollbar` 样式。列表轨道底部保留 `10px` 安全留白；浮层轨道按内容区留约 `4px`。回弹面默认透明，直接透出母面板或 Glass Surface，不能出现与宿主不连续的独立白色或 `Backgrounds/Tertiary` 实底条；只有确实需要独立表面的场景才通过 `--wd-scroll-pull-surface` 显式覆盖。当前使用方为 Plants 表格、Company 筛选树、Service Ticket 列表与两类 Service Ticket 回复输入。
- 共享滚动滑块颜色使用 `--wd-scroll-feedback-thumb-color` / `--wd-scroll-feedback-thumb-hover-color`，默认分别映射 Labels/Tertiary 与 Secondary。嵌套在内容可读性覆盖中的滚动区若不应继承加深后的文字色，必须在宿主显式映射全局 `--wd-figma-labels-tertiary` / `--wd-figma-labels-secondary`；Service Ticket 回复输入按此处理，确保与详情主滚动条一致。
- Service Ticket 小卡片的像素点阵按主题取色：深色使用白色，浅色使用共享 `Labels/Secondary` 深色 ink，确保在 `#EDEDED` 表面和卡片底部都清晰可辨；FlipCard glare 与编号胶囊扫光继续使用白色光效。默认与离开后仍不得保留静态点阵、倾斜或反光，点间距、展开和清理逻辑不变。
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
- 带圆角背景的列表行如果使用颜色淡出，首末单元格的圆角必须从默认状态起持续存在；hover / focus 只切换背景，不能让圆角随状态提前撤销并在淡出期间露出直角。
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
