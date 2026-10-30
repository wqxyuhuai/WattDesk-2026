# 更新记录

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
