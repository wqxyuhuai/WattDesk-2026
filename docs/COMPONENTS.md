# 共享组件手册

更新：2026-10-30。本文对应实际模块；完整视觉要求见 [DESIGN-SYSTEM.md](../DESIGN-SYSTEM.md)。路径均相对 `design-preview/`。

所有页面加载 `/src/shared.css`，包含 SF Pro、语义颜色、完整 Figma 字体 styles、材质、状态、动效、头像和连续曲线。页面局部 CSS 在共享入口之前加载，不自行拼出另一套基础。

## 实现入口

| 内容 | 模块 | 实际 API |
|---|---|---|
| 颜色 / 节奏 | `src/foundations/tokens.css`、`colors.css` | `--wd-label-*` / `--wd-bg-*` / `--wd-accent-*` 等语义入口 |
| 共享动效 | `src/foundations/motion.css` | `shared.css` 自动加载；组件不写局部 transition |
| 字体 | `foundations/typography.js`、`type.css` | `applyTypeStyle(el,name)` 或 `data-type-style` |
| 语义 DOM | `foundations/dom.js` | `createTextElement(tag,className,content,typeStyle)`；只负责元素、文本和可选完整 type style，不参与布局 |
| 时间 | `foundations/time.js`、`components/time-label.js` | `formatTimestamp()` / `formatAgeMinutes()` / `formatAbsoluteTime()` 负责格式化；`createTimeLabel(value,{ageMinutes,className,typeStyle,now})` 统一生成带 `title` 与 `<time datetime>` 的语义节点 |
| 图标 | `components/icons.js` | `createIcon(name,tone?)` 使用命名注册表；`createMaskedIcon(url,className)` 统一内联遮罩 span、无障碍隐藏和 `--icon-mask` 写入 |
| 按钮 | `components/controls.js`、`button.css` | 低层 `button()` 保留给现有节点；`createStandardButton({label,variant,className,icon,iconOnly,typeStyle})` 生成标准胶囊/圆钮的完整类名、标签与图标结构。玻璃实例仍由调用页面注册 |
| 现有节点控件化 | `components/controls.js` | `enhanceControl(el,{label,onActivate})`，返回事件清理函数 |
| 搜索 | `components/search.js`、`search-surface.js` | `createSearchTrigger(label,className)` / `createSearchInput({label,placeholder,className})`；内联与工具栏字段用 `createSearchField({glass,placeholder,label,size})` |
| 导航 | `components/navigation.js` | `makeNavRow(label,key,file,extraClass,tone)`，不自行导航 |
| 路由与 URL | `pages/home/routes.js`、`pages/home/workspace.js` | `routeFromPath(pathname)` → `{route,params}`；`pathForRoute(route,params)`；页面只调用 `openRoute(route,{params})`。`/`、`/home.html` 规范到 `/home`，深链接由 `server.js` / `_redirects` 回退，详见 [ROUTING.md](./ROUTING.md) |
| 折叠 | `components/disclosure.js` | `bindDisclosure(heading,content)` |
| 头像 | `components/avatar.js`、`avatar.css` | `createAvatar(initials,{size=36,className})`；缩写自动包入 `.wd-avatar-label`，共享实现负责文字光学居中，并按 22–24 / 25–32 / 33+ 写 compact / small / regular 字号档位 |
| 日期选择 | `components/date-picker.js` / `.css` | `createDatePicker({trigger,glass,registerPanel,close,onApply,range})` → `{panel,close,getRange}`；另有 `presetRange / describeRange / parseDateInput / formatDateInput` |
| 卡片 | `components/cards.js`、`cards.css` | `prepareCard(el,variant)` / `createCard({variant,radius,content})` |
| 讨论卡表面 | `components/cards.css` | `.wd-discussion-card`：Service Ticket 顶部评论框、一级回复卡与 Properties 共用的 18px 连续曲率和零位移双层阴影；浅色主题下三者统一为纯白无描边、无投影平面；内容内距由调用方负责 |
| 数据页头 | `components/page-header.js` / `.css` | `createPageBreadcrumb(items)`；`createPageHeader({breadcrumb})` → `{element,heading,breadcrumb,actions}`，页头文字动作由 `createPageHeaderAction({label,icon,className})` 生成。固定 40px 高，面包屑与动作垂直居中；Home 以外的所有页面（含 Plants 列表与详情、Coming soon）都复用同一页头，页面只设置 `--wd-page-inset`，不复制动作行与分隔线。新页面同时沿用 Plants 外壳：页头固定在正文上方，主体横向铺满右侧工作区，不套用 Home 的 `1000px` 居中画布 |
| 非玻璃按压缩放 | `foundations/motion.css` `.wd-press-scale` | 无玻璃材质的按钮复用 hover `1.025`、press `1.065`、release `420ms` 深度反馈；调用方不加局部时长 |
| 空状态 | `components/empty-state.js` / `.css` | `createEmptyState({iconFile,label})` → `{element,update,play}` |
| 滚动反馈 | `components/scroll-feedback.js` / `.css` | `createScrollFeedback({host,viewport,content,elastic,topInset,bottomInset,maxPull,deadZone})` → `{element,sync,destroy}`；需要弹性时传实际内容节点，固定滚动区显式传 `elastic:false` |
| 玻璃 | `components/glass-material.js` / `.css` | `createGlassMaterial({surfaces:[{host,radius,chrome,interactive}]})`，返回 `destroy()`；`interactive:false` 用于纯展示表面 |
| 控件状态 | `components/control-states.js` / `.css` | 内容挂载后 `await prepareControlStates(container)` |
| 悬停显隐 | `foundations/motion.css` `.wd-hover-reveal-host` / `.wd-hover-reveal` | 父级 hover / focus 控制显示透明度的容器接入共享 `240 / 360ms` 节奏；子按钮 transition 不能替代父层透明度过渡 |
| 历史浮窗 | `components/history-popover.js` / `.css` | `createHistoryPopover({anchor,entries,onSelect,registerPanel,close,motion})`；复用共享玻璃与 30px 浮层圆角，最多 8 行 |
| 浮层 / 提示 | `components/popover.js` / `.css` | `createPopoverController({overlays,toastElement,motion,glass})`；菜单、tooltip、toast 自动使用 Glass Surface |
| 标准浮层菜单 | `components/menu-popover.js`、`popover.css` 的 `.wd-menu` | `menuHeading / menuList / menuRow / menuNote / mountMenu`；顶栏紧凑菜单 200px，历史完整层级最多 380px |
| 历史层级路径 | `components/history-path.js` / `.css` | `renderHistoryPath(container,parts)`；按实际容器宽度和字体测量，父级/分隔符与末级分别使用语义色，末级中间省略、整体尾部优先，首页最近访问和历史浮窗共用 |
| 有限动效 | `foundations/motion.js` | `createHomeMotion({duration,easing,reducedMotion})`；名称保留，行为共享 |
| JS 动效节奏 | `foundations/motion.js` | `motionDuration(token)` / `motionEasing(token)`，禁止硬编码毫秒或曲线 |
| 内容自适应增高 | `foundations/motion.js` | `animateContentHeight(element,height,{from,animate})`；使用共享 `--wd-motion-content-grow` / `--wd-ease-content-grow`，可被下一次输入中断并从当前可见高度继续 |
| 主题 | `foundations/theme-controller.js` | `createThemeController({initialTheme,apply})`，每页一个 |
| 圆角 | `foundations/geometry.js` / `.css` | `preserveCornerProfile(el,{radius,width,height,ellipse})` |
| 工作区标签 | `components/workspace-tabs.js` / `.css` | `createWorkspaceTabs({container,addButton,createIcon,panelId,...})`；`add/hydrate/find/update/activate/closeActive`、`captureCurrent`、状态快照与 `onStateChange`；`panelId` 用于 `aria-controls`，省略时不写该属性 |
| 外壳 | `layouts/app-shell.js` / `.css` | `createAppShell({sidebar,header,workspacePanelId})`；调用方提供位置、标签面板 ID 与业务事件 |

## 文字与颜色

```js
import {applyTypeStyle} from "/src/foundations/typography.js";
applyTypeStyle(label,"14/14 medium"); // 14px / 510，原稿行高、字距
```

```css
.page-title { color:var(--wd-label-primary); }
.description { color:var(--wd-label-secondary); }
.surface { background:var(--wd-bg-secondary); }
```

62 个双主题 Figma 变量与 36 个文字 styles 由来源生成，不手改生成文件。Medium 为 510；强调按具体 style 为 590 / 700。不要根据字号猜测 style。未绑定 style 的原稿写死值保留；旧 `--wd-type-*` / `--wd-leading-*` 已移除，字体只使用 `type.css` 的命名 style；组件 fallback 使用明确像素值，不据旧名称新增字体样式。

颜色优先走语义入口；未暴露的 Figma 语义用 `--wd-figma-*`。已确认的玻璃、头像、浮层透明度是共享光学参数，保留显式值，不强行替换成近似色。旧提取用的 RGB/opacity 和 Fills/Quaternary 兼容值不扩展到新组件。

## 按钮、图标与玻璃

```js
import {button} from "/src/components/controls.js";
import {createIcon} from "/src/components/icons.js";
import {applyTypeStyle} from "/src/foundations/typography.js";
import {prepareControlStates} from "/src/components/control-states.js";
import {createGlassMaterial} from "/src/components/glass-material.js";

const control=button("Search");
const label=document.createElement("span");label.textContent="Search";
control.append(createIcon("search"),label);
applyTypeStyle(control,"14/14 medium");
container.append(control);
const material=createGlassMaterial({surfaces:[{host:control,radius:18}]});
await prepareControlStates(container);
// 卸载时：material.destroy()
```

玻璃表面默认 `interactive:true`，按共享参数响应 hover / 按下缩放。纯展示、没有点击目标的卡片必须传 `interactive:false`：材质、边缘微光和指针跟随保留，但共享层加上 `.wd-glass--static`，hover / 按下都不缩放。不要在页面写局部 `transform:none`，也不要为了取消缩放移除玻璃。复合容器继续用 `chrome:true` 或 `.wd-glass--surface` 表示“整组不缩放”，两者语义不同，不能混用。

按钮第 3 参数只允许项目可信静态 HTML，动态文本使用 `textContent` / DOM 节点。`iconAsset(file,tone)` 留给已有原始文件适配，业务代码优先 `createIcon`；禁止 Unicode / 近似字形替代。

### 标准按钮

面板、菜单、表单和后续新增界面的动作按钮统一使用共享胶囊按钮，不按页面复制材质或字号：

```js
import {createStandardButton} from "/src/components/controls.js";
import {createMaskedIcon} from "/src/components/icons.js";
import {assetURL} from "/src/components/icons.js";

const cancel=createStandardButton({label:"Cancel"});
const apply=createStandardButton({label:"Apply",variant:"primary"});
const refresh=createStandardButton({
  label:"Refresh",
  iconOnly:true,
  icon:createMaskedIcon(assetURL("light/imgLinearArrowsRefresh.svg"),"wd-control-icon")
});
material.addSurface({host:cancel,radius:18});
material.addSurface({host:apply,radius:18});
material.addSurface({host:refresh,radius:18});
```

- 两者固定 `36px` 高、左右内距 `16px`、胶囊圆角、`13px / 510 / 18px`；不按文案长度改尺寸。
- 圆形图标动作使用同一胶囊按钮并追加 `.wd-button--disc`：`36×36`、零左右内距、`50%` 圆角；图标保持视觉居中，并保留共享玻璃、缩放、焦点和禁用行为。不要为工具栏另写圆钮背景、描边或投影。
- `.wd-button--neutral` 使用共享普通玻璃，默认 `Labels/Secondary`，hover / 键盘 focus 为 `Labels/Primary`，用于 `Cancel`、关闭和次要操作。
- `.wd-button--primary` 是实心 `Accents/Blue`：关闭模糊、白色反射场和上下内阴影，只保留细深色外轮廓、极细亮边与指针高光；hover 仅轻微提亮，不能洗成浅蓝。一个视图只保留一个主按钮，用于 `Apply`、保存、确认。
- 主按钮在深浅主题的默认、hover 与键盘 focus 状态都保持白色文字和图标。共享控件 hover 规则在浅色主题会将普通文字切为主文字色，因此 `control-states.css` 必须为 `.wd-button--primary` 保留白色覆盖；页面不得另写按钮文字颜色。
- `.wd-button--disc` 内图标使用共享 `wd-control-icon` 类或直接的 `.target-icon-art`：hover / focus 时在按钮外壳缩放之外再放大到 `1.06`，按下到 `1.12`。仅改变视觉 transform，不改变图标的布局尺寸，因此 36px 圆钮和周围排版保持稳定。
- 缩放、边缘光弧、指针跟随和禁用态由共享材质与 `.wd-control-state` 提供；调用方不写局部 `transform`、`box-shadow`、transition，也不新增第三套玻璃。日期选择器已删除旧 `.wd-date-action` 兼容类，新组件直接使用 `createStandardButton()` 或同一标准类名。

`.wd-control-state` 为容器，`.wd-control-label` 为文字。hover / 键盘 `:focus-visible` 时中性文字和图标一起变主文字色，深色纯白、浅色主墨色；鼠标点击留下的普通 DOM 焦点不应持续呈现 hover，离开指针后恢复默认色。原始彩色图标保留原色。材质微光只影响光学层，控件和文字不位移。

交互组件不要写组件内 `transition` 或 `transition-duration`：只要页面加载 `shared.css`，原生 `button` / `a` / `input`、常见 ARIA role、`.wd-control-state`、共享玻璃层、tab、快捷入口和折叠箭头就自动继承 `foundations/motion.css` 的属性和节奏。组件只声明默认、hover、focus、选中、禁用等视觉值。需要 JS 几何动画时读取 `motionDuration()` / `motionEasing()`；`prefers-reduced-motion` 由共享层统一处理。

### Hover 节奏

hover 进入 `240ms`、离开 `360ms`，由 `motion.css` 的宿主变量统一切换：交互宿主在 `:hover` / `:focus-visible` / `:has(:focus-visible)` 时把 `--wd-hover-duration` / `--wd-hover-ease` 切到进入值，文字与图标叶节点继承同一对值，背景、文字和图标不会各自计时。父级 hover / focus 才出现的容器挂 `.wd-hover-reveal-host`，被显隐的绘制层挂 `.wd-hover-reveal`；透明度动画因此在父层执行并同样分 `240 / 360ms`。新增组件不要自带时长；玻璃缩放固定走 `300ms` / `110ms` / `420ms`，不受该变量影响。Workspace 标签关闭使用 `--wd-motion-tab-close`（`260ms`）加离开缓动；浮层、搜索和日期错误行退出使用 `--wd-ease-hover-out`。

真实 button 使用 `disabled`；等效角色节点使用 `aria-disabled="true"`，经 `enhanceControl` 阻止点击和 Enter/Space。未选中 tab 仍可操作。挂载后对所属容器调用一次 `prepareControlStates`，避免重复增强同一棵 DOM。

玻璃一次注册全部表面，只传几何信息，不复制光学参数；重复挂载会报错。普通图表卡片不挂玻璃。两主题均由 `glass-material.css` 控制，来源在 `design/figma/glass*-source.json`。正方形且半径达到短边一半的宿主由共享材质自动加 `.wd-glass--disc`，圆钮使用更窄的边缘高光与短半径光晕；新组件无需手写该类。

### 浮层玻璃 Glass Surface

所有菜单、popover、tooltip、toast 和图表数据浮签默认使用共享的 **Glass Surface** 分支，不要另调一套模糊。标准入口是共享控制器；它会自动为普通 `.popover` 挂载材质，并在关闭时卸载：

```js
const {popover,toast,registerPanel}=createPopoverController({
  overlays,toastElement,motion,glass
});
```

需要独立面板（例如带自有开合动画的组件）时，才自行声明材质：

```js
const panel=document.createElement('div');
panel.className='my-panel wd-glass--surface wd-glass-popup';
const material=createGlassMaterial({surfaces:[{host:panel,radius:30}]});
```

- `.wd-glass--surface` 选择更强的浮层雾面参数；`.wd-glass-popup` 表示整块面板不随点击缩放，只有内部独立玻璃控件响应。
- 浮层圆角按尺度取共享 token：紧凑 tooltip / 数据浮签用 `--wd-radius-compact`（12px），通用 popover / 图表菜单用 `--wd-radius-medium`（18px），标准浮层菜单与大面板用 `--wd-radius-large`（30px）。`addSurface()` 的 `radius` 必须与宿主实际 `border-radius` 一致；玻璃层继承宿主，不在内容或伪元素上另写半径。
- 已自带 `.wd-glass` 的面板（日期、历史、搜索）不能再调用 `addSurface()`；共享控制器检测到已有材质会自动跳过，避免双层模糊和重复观察。tooltip、toast 与图表数据浮签传 `interactive:false`：保留材质和指针光晕，但不缩放。动态文案写入内部 span，不得用 `textContent` 清空宿主。
- toast 由共享 `#toast` 宿主统一固定在页面顶部 `top:70px`，水平中心沿用工作区内容中心线，纵向中心与数据页共享面包屑当前项对齐；不得在页面组件中写底部定位、局部偏移或另一套短提示。收藏、刷新、周期和预览反馈都复用该入口。首次出现从上方 `4px` 下落并使用 `--wd-motion-panel` / `--wd-ease-panel` 淡入，自动消失上浮 `4px` 并使用 `--wd-motion-panel-exit` / `--wd-ease-hover-out` 淡出；退出结束才设置 `hidden`，重复提示取消旧退场并从当前不透明度和位移恢复，减少动态效果时立即切换。
- 内容独立放在同级容器（如 `.wd-date-picker-content`、`.wd-search-panel-body`），不要塞进 `.wd-glass-material`。
- 深色 `18px` 模糊 / `30%` 中性底；浅色 `9px` 模糊 / `44%` 浅灰底 + `saturate 1.45`，模糊太高会把背后卡片抹成均匀白膜。深浅主题都保留背后页面可辨；不要再写 `backdrop-filter`、`background` 或局部 `--wd-glass-surface-tint` 覆盖。
- hover 时指针附近出现光斑和一段边缘弧，由共享材质自动处理；深色是白弧，浅色是深色弧配白色内光斑。不要给浮层另外写 `:hover` 阴影或渐变。
- 嵌套玻璃以最内层为准：弹窗里的输入框、按钮、月份圆钮各自响应 hover，外层浮层不接管 `data-glass-pointer`。共享材质已按 `event.target.closest('.wd-glass')` 判定，新组件无需额外处理。

### 标准浮层菜单

文本型菜单只复用一套内胆，外壳宽度由具体入口决定。顶栏 `Language` / `Appearance` / `WattDesk` 使用 `.popover.popover--menu`（200px），历史浮窗 `.wd-history-popover` 最多 380px；两者的标题、行、勾选和尾距都来自 `.wd-menu`。历史行使用共享 `history-path.js`，单行显示且不能溢出：`/` 左右各使用 `4px` 内距，不能依赖会被 flex 吞掉的原空格；完整路径能放下时不得截断，必须截断时根据实际字体与当前行宽使用可用空间，优先保留紧邻末级的父路径并缩短单页标题，父级加最小可读末级仍放不下时才以 `… /` 丢弃更早层级。禁止恢复 `leafLimit` / `totalLimit` 一类固定字符预算；容器或字体改变后必须重算。

```js
import {menuHeading,menuList,menuRow,mountMenu} from "/src/components/menu-popover.js";

const panel=document.createElement("div");
panel.className="popover popover--menu";
const list=menuList();
list.append(menuRow("English",{checked:true}),menuRow("简体中文"));
mountMenu(panel,{label:"Language",children:[menuHeading("Language"),list]});
registerPanel(panel,trigger,{label:"Language",radius:30});
```

- `.wd-menu`：有标题时顶部 20px、左右/底部 10px；无标题时 `mountMenu()` 自动添加 `.wd-menu--no-heading`，顶部与底部都改为 10px。标题与列表间距 10px；标题 `Footnote/Emphasized` 次级色、14px 缩进；行 36px 高、14/14 medium（14px / 510）、胶囊 hover，中性图标与文字同步转主文字色。
- 勾选槽固定 `20px`，使用 `currentColor` + `/home-assets/tickle.svg` 遮罩；未选中时保留槽位并隐藏，避免切换语言导致文字位移。列表末尾到底缘固定 10px。
- `menuRow(label,{iconFile,iconTone,checked,onSelect})` 输出语义按钮和 `aria-checked`；`menuNote(text)` 用于无操作说明。不要在页面内再拼 `.wd-menu-heading` / `.wd-menu-row` 的独立样式。
- 需要和侧栏完全一致的路由图标时，传 `iconNode`（现成 `.target-icon-art`），例如历史浮窗克隆 `.target-nav[data-route]` 的同款节点；这条路径必须保留原 `tone`，不得按文件名再转 mono，也不要另建“文件名 → 颜色”表。`Plants` 保持橙色、`Service ticket` 蓝色、中性导出与侧栏同灰，hover 时统一转主文字色。
- 语言占位只改变本地勾选视觉，不切换页面语言、不持久化；真正接入本地化时另立需求并替换占位数据。

hover / 按下的视觉缩放由材质与 `motion.css` 自动继承，调用方不写缩放值：

| 宿主 | hover | 按下 | 按下节奏 |
|---|---:|---:|---|
| 普通玻璃 | `1.025` | `1.065` | `110ms` 起步，`420ms` 回落 |
| 正圆玻璃（自动 `.wd-glass--disc`） | `1.07` | `1.18` | 同上，快速点击须可辨 |

- 锚点必须是宿主自身物理中心；只改视觉矩阵，`offsetWidth` / `offsetHeight`、布局槽位和命中区不变。页面级 `.node` 不能覆盖该锚点。
- 复合容器固定静止：注册时传 `chrome:true` 的整组 chrome，以及带 `.wd-glass--surface` 的弹窗、浮层。内部日期框、月份按钮、Apply 等独立玻璃控件仍按自身状态响应；点击面板空白或内部任意位置不能带动大卡片。
- 新组件不手写缩放、延迟或禁用规则；减少动态效果与粗指针设备由共享层直接复位。
- hover 边缘高光同样只由材质决定。浅色近黑轮廓、深色白色轮廓、`.wd-glass--disc` 的贴边和线宽以 `DESIGN-SYSTEM.md` 的玻璃参数表为准，组件不复制 CSS。

### Plants 筛选与列可视性

Plants 的结构化筛选与列显隐位于 `src/pages/plants/index.js` / `plants.css`，属于该页面的业务装配，不是第二套浮层材质：

- 主筛选只调用一次 `registerPanel(panel,anchor,{radius:30,width:260,...})`，高度贴合 4 个类目。工具栏入口传 `align:"end",alignRight`，右缘与列可视性菜单一致；筛选条加号传 `align:"start"`，在加号下方左对齐，并传 `pinPosition:true` 固定打开瞬间的视口位置，新增 chip 导致锚点重排时面板不移动。类目 hover / focus 时通过 `registerPanel(...,{keepOpen:true,placement:"side"})` 注册独立条件 Glass Surface：Company 为 `288px`，Device / Connection / Running status 为 `208px`，保证选项单行且三项同宽。`keepOpen` 让主面板保留，`placement:"side"` 让次级浮窗以 12px 重叠贴住一级浮窗内缘。类目 hover 有 380ms 意图延迟。
- `placement:"side"` 的 `sideTopOffset` 负责把第一个选项而非二级标题对齐类目行：Company 使用 `100`，其余条件组使用 `54`。函数形式可随活动类目变化；共享定位继续负责视口顶部夹紧。
- 一级与二级内容共用 `components/filter-menu.css` 的 `.wd-filter-menu`（四边 20px）。Company 长列表以 `content: secondaryBody` 接入共享滚动反馈的默认弹性模式，视觉、hover、拖动与 Plants 表格一致，标题和搜索框保持固定，只有公司列表在上下边界越界并回弹；浮层通过 `--wd-scroll-pull-surface: transparent` 让回弹空隙透出母玻璃，不能复制表格的实底背景。页面不得再引用独立 `.wd-scrollbar` 或自写滚动条伪元素。Company 专用的宽度与左侧几何通过 `.is-company` 限定；切换到 Device / Connection / Running status 时必须移除该状态并恢复标准内容缩进。公司树左侧保持约 `4px` 容器内距、层级每级 `12px`；展开按钮与复选框同为 `16px` 方形，箭头为 `12px` 且两者垂直中心对齐；名称与默认滑块至少留约 `8px`，轨道距卡片右缘约 `4px`。条件面板内的公司树搜索、父级展开和复选框使用该页面的单一 `state.filters`；搜索字段直接复用 `createSearchField({size:"compact",scalable:true})`，其清除按钮保持共享的 18px 零内距并垂直居中。示例公司树有 15 个节点；名称使用 `Footnote/Medium`，仅在文本确实超长时换行、禁止横向滚动，复选框对齐第一行；所有条件不显示数量，Company / Device 不显示选项图标，Connection / Running status 使用 18px 不透明状态图标，图标与文字间距固定 `4px`。掩码生成必须把任意 `fill-opacity` / `stroke-opacity` 归一到 `1`，否则 `.3` 导出的 Attention 会被削淡。表格 Status 图标与文字间距固定 `4px`；顶层公司的所有后代被选中时，chips 只显示一个顶层公司项。复选框点击只应用筛选并重绘结果，不关闭任何一个浮层；条件名称按钮才调用 `close()`。
- 已应用条件由同一状态生成 chips，每个具体条件一个短 tab；条件条使用 `Backgrounds/Tertiary` 实底（浅色为纯白），chip 使用 `Fills/Secondary`，不得用透明叠加造成偏粉或偏紫。浅色固定表头使用与主面板相同的底色，搜索字段绘制层级高于筛选条与固定表头，保证玻璃投影不被截断。末尾只允许一个加号，它复用完整筛选内容和交互，并在自身下方左对齐打开；唯一 `Clear` 固定在最右侧并垂直居中。不得另存快捷筛状态或增加第二套清除入口。
- Plants 刷新按钮继续使用共享圆钮材质和 `--wd-motion-refresh` 图标旋转。点击后同步清空全部筛选、将 `state.hidden` 恢复为 `DEFAULT_HIDDEN`、将 `state.sort` 恢复为 `{key:"updated",dir:DEFAULT_DIR.updated}`，再统一执行列、表头和行的重新渲染；搜索词和 `localStorage` 收藏状态不清除。
- 列菜单沿用 `.wd-menu` 外壳和 36px 行高，但行结构为“Eye / Eye Closed 图标 + 文字”，不生成 `.wd-menu-check`。眼睛素材来自 `home-assets/plants/icons/`，原始副本与来源见 `design/figma/plants/`。
- 名称为 `?` 的电站属于正常可进入的电站。`?` 在 hover / 键盘 focus 时显示共享锚定 Glass Surface；浮窗可以接收指针和键盘焦点，离开触发按钮后有短暂关闭意图缓冲，便于指针跨过锚点间距进入浮窗。固定文案为 `This device is not currently associated with any plant. Please proceed with the setup.`；其中的 `setup.` 是真实按钮，加下划线但不使用按钮底色、外框或独立块级布局，始终留在原说明段落中；hover / focus 只把文字提为主文字色。点击 `?`、行内其他区域或提示中的 `setup.` 都可进入详情；标签与详情主标题显示 `?`。
- Plants 表体的整行高亮由首末 `.plants-cell` 拼成。左右外侧 `10px` 圆角定义在单元格默认状态，hover / focus 仅切换背景色；焦点离开后背景按共享节奏淡出，淡出全过程必须保持原圆角，不能出现直角残影。回归断言在 `tests/verify-routing.cjs`。
- Device、Connection、Running status 小浮窗的选项内容保持约 `20px` 左内缩，选项按钮内的文字再保留 `8px`；复选框、文字和 hover 背景不能贴边。该几何只影响水平位置，不改变浮窗尺寸或底部锚点。Company 的 `.is-company` 紧凑规则独立保留。
- 回归入口为 `tests/verify-plants-filters.cjs`，覆盖三态公司树、复选不关闭、名称点击关闭、筛选条、眼睛状态、键盘展开、小浮窗内容内缩及浅色主题。

### Service Ticket

- `.service-user-badge--poster` 使用 `color-mix(in srgb, var(--wd-accent-brown) 64%, var(--wd-gray-black) 36%)` 的深琥珀实底，禁止恢复亮黄底；`.service-user-badge--you` 使用 `--wd-accent-blue` 实底。两者文字固定 `#fff`，深浅主题都不继承 Labels 颜色，POSTER 白字对比度至少 `4.5:1`。`Caption2/Regular` 的 `10px / 12px` 行盒和 15px 胶囊高度保持不变。
- 共享头像缩写按直径统一：22–24px 为 `9px / 10px`，25–32px 为 `11px / 13px`，33px+ 为 14px。Service Ticket 列表卡片 24px 作者头像和 Properties 22px 作者头像都走 compact 档；不改变头像直径、共享描边、主题投影或 `0.5px` 光学下移，页面不再单独覆盖同一尺寸字号。
- 页面模块 `src/pages/service-ticket/index.js` / `service-ticket.css` / `data.js` 当前提供 `/service` 卡片列表、`/service/new` 新建编辑页与 `/service/:ticketId` 详情。Ongoing / Closed 混排为桌面 3–4 列轻量窄卡；工具栏最左是状态菜单，短竖线后是 All / Mentioned me / Created by me，搜索靠右。
- 标题行复用 `components/page-header.js` / `.css`；卡片、正文、评论和 Properties 使用普通 `Backgrounds` / `Labels` / `Separators` token，不挂玻璃。卡片左侧为等宽编号胶囊，右侧为状态；正文与元信息之间使用左右通开的 `Separators/Non-opaque` 细分隔线。已发布卡片默认无描边、无重投影且没有静态点阵，指针 hover 只通过 `components/pixel-card.js` 在内容下方绘制低透明度像素和光标微光，离开后淡出并清空 canvas；键盘 focus 只使用焦点环。搜索、标准按钮、状态菜单、更多菜单和提及菜单分别复用共享搜索、Button、Popover、`.wd-menu` 与 Glass Surface；`New ticket` 与 Plants `New plant` 共用 `createPageHeaderAction()` 的 28px 轻量文字动作，默认透明且无玻璃，hover / focus 才显示浅灰胶囊。网格右缘对齐该按钮，滚动轨道放在右侧空隙。
- `New ticket` 通过 `openRouteInNewTab("service",{params:{newTicket:true}})` 打开新工作区标签 `/service/new`，原列表标签保留；页面直接复用详情双栏与编辑骨架，标题自动聚焦。左列是标题、正文、附件与共享 Cancel / Publish 操作行，按钮右缘与正文列一致；右列显示与详情同构的 Properties 卡及 Status / Plant / Author / Created / Last activity / Replies。Plant 选择位于 Properties，点击后打开 288px 浮窗，复用 Plants 公司筛选二级浮窗的 `wd-filter-menu`、玻璃搜索、32px 行、选中标记和共享滚动反馈，支持按名称或 SN 搜索并在单选后回显。发布后向当前标签执行参数替换为稳定 `ticketId` 并渲染详情，取消则关闭新标签回到来源列表。已有工单编辑替换详情中的标题/正文位置，回复创建和编辑使用同一 `ReplyRow` 骨架。标题编辑器是单行语义的自动增高 `textarea`：短标题 `25px` 行盒，超过 `760px` 内容宽后自然换行并增高；Enter 不插入换行，粘贴换行归一为空格，展示标题复用同宽与同换行规则。Activity 顶部新回复编辑器不显示头像或姓名标题行，桌面空态高度约 100px，内距为 14px / 16px；它使用独立 `commentDraft` 并在 Ongoing 工单中始终展示，打开楼内回复或编辑回复时不得隐藏或丢失草稿，并与讨论列表保持至少 16px 间距。顶部评论框、一级回复卡和 Properties 统一使用 `wd-discussion-card`，并由 `geometry.js` 识别为 continuous、渲染为 `superellipse(1.2)` 的 `18px` 圆角；深色主题保留 1px `Separators/Non-opaque` 内描边和零位移双层阴影，浅色主题下三者统一为纯白背景并移除内描边和全部外侧投影。回复正文使用无四边框的 `contenteditable` 文本盒，随内容增高至 180px，SF Pro / `Subheadline/Regular` 固定为 15px / 400 / 20px / -0.23px；Enter 创建段落、Shift + Enter 创建段内换行，相邻段落额外 `6px` 上距。右下附件与发送均为共享 36px 玻璃圆钮，附件使用回形针，所有回复发送按钮统一使用 `home-assets/service-ticket/send-up.svg` 的 16px 向上箭头，发送在空内容时禁用、有正文或附件后切为主按钮，占位文字在 hover / focus-within 时转主文字色，并继承共享 `240 / 360ms` 颜色节奏。一级讨论卡内的回复编辑器改为 `28px` 当前用户头像加 `7px` 间距的透明内容列，与上方评论头像和正文共用同一条左缘；展示态与编辑态统一使用 `0px` 头像行到正文间距，楼中楼组间距为 `12px`、内部上下内距为 `10px`。回复入口与内联编辑器高度均为 `49px`，外距 `8px`、上下内距 `10px`，头像实际上下留白为 `11px / 10px`，右侧按钮相对整行绝对居中并渐显，只有内容换行才增高。本人回复原位编辑时，作者行固定 `36px`，正文与编辑器共用 `20px` 行盒的顶部和高度，卡片顶边、底缘与回复入口不得跳动；编辑态操作顺序为附件、Cancel、发送，Cancel 使用 36px 中性玻璃 X 圆钮、10px 图标盒，并立即恢复原回复。新建回复不显示 Cancel。POSTER / YOU 标签保留 `Caption2/Regular` 字族和字重，文字为 `10px / 12px` 行盒，胶囊高度保持 15px。真实 API 接入时仍保持 read / edit / create 的 DOM 与视觉位置不变。
- Service Ticket 回复输入改为 `contenteditable` 文本盒，保持无外框外观和自动增高；SF Pro / `Subheadline/Regular` 的 15px / 400 / 20px / -0.23px 为基础排版。按 Enter 创建独立段落，Shift + Enter 创建段内换行，段落额外 `6px` 上距并以 `\n\n` 序列化；发送后的回复正文同样渲染为段落，保证输入态与展示态段间距一致。
- `contenteditable` 的 paste 由输入组件拦截并只接受 `text/plain`；有 HTML 也不得插入其标签或样式。纯文本会重新分段为普通 `<div>` / `<br>` 节点并复用 6px 段间距，避免外部富文本污染回复样式。
- Service Ticket 在浅色主题内仅通过 `.service-board`、`.service-empty`、`.service-detail-content` 局部语义变量提升内容可读性：Secondary 为约 70% 主文字黑、Tertiary 为约 55% 主文字黑；正文、属性标签、时间、回复上下文和中性按钮达到 4.5:1 以上对比度。页头和工具栏的共享控件继续使用全局 token，尤其搜索框不得继承内容文字覆盖。楼内 `Reply to this thread…` 默认提示使用约 45% 主文字黑，hover / focus 回到主文字黑。
- 已发布详情 Properties 使用 `ticketNumberPill()` 作为列表第一项：`Ticket ID` 标签在上，票号胶囊在下；同时保留 `.service-card-number` 与修饰类 `.service-properties-number`。属性栏只覆盖 `20px` 高度和 `7px` 水平内距，编号字体、填充、圆角和扫光继续与列表卡片共用；新建草稿不显示占位编号。
- 列表和详情页头都由 `createPageHeader({breadcrumb})` 生成同一结构：列表为单级 `Service ticket`，详情为 `Service ticket > ticket id`，并共享 40px 页头高度。面包屑统一为 14px / 510，分隔使用顶栏 `asset-14.svg` 前进箭头，箭头颜色与父级一样使用 `Labels/Secondary`，并首帧引用 `masks/asset-14.svg` 不透明面具；列表 `gap:0`，父级右内距与当前项左内距均为 8px，箭头左右视觉间距必须对称。父级 hover / focus 显示 `Fills/Tertiary` 的两端半圆胶囊底，不显示下划线。工具栏范围按钮固定 36px 高，与 `All status` 一致；默认 `Fills/Tertiary`、选中 `Fills/Primary`，并使用 `.wd-press-scale`。正文不套卡片底，Properties 与一级回复卡背景一致且顶部与工单标题对齐，Author 行使用共享头像。桌面操作入口在标题行右端，使用 36px 中性玻璃圆钮和 18px `asset-70.svg` 三点图标，图标中心与圆钮中心重合，`aria-label` 保持 `Ticket actions`；右缘与主内容列一致。点击后的菜单不显示可见标题，由 `mountMenu({label:"Ticket actions"})` 保留语义名称并自动获得 `.wd-menu--no-heading` 的上下 `10px` 内距。评论区顺序固定为正文分割线、新回复编辑器、Activity 标题与排序、一级讨论卡列表；排序按钮显示向下箭头，复用 `asset-14.svg` 并旋转 90°，排序文字底部与 Activity 标题底部对齐，文字、箭头和 hover 背景的中心线必须一致，文字和箭头间距为 6px。回复只渲染一层楼中楼；一级回复各自形成更浅的讨论卡，二级回复收在同一卡内并用分隔线区分，每卡底部提供展开式回复入口。楼层不再显示专用 `Reply` 按钮；自己的回复仅在 hover / focus 时通过 `.wd-hover-reveal-host` / `.wd-hover-reveal` 渐显共享 36px 三点玻璃圆钮，透明度进入 `240ms`、离开 `360ms`，菜单只含 `Edit / Delete`，编辑原位执行，删除使用确认弹窗。默认 Oldest first，切换为 Newest first 时只改变一级讨论组顺序。
- 当前数据和操作仅保存在页面会话；附件没有上传、通知没有投递、状态与可见性没有后端权限校验。回归入口为 `tests/verify-service-ticket.cjs`，并纳入 `npm test`。

### PixelCard 适配层

- `src/components/pixel-card.js` 将 React Bits PixelCard 的 Canvas 视觉转成项目原生 DOM / JS 组件，不引入 React。调用方只提供宿主和设计参数，内容仍由宿主自身布局并位于 canvas 上层。
- 当前参数为 `gap 5`、`pixelSize 1`、`speed 35`、`revealDuration 600`、`spotlight .72`、`glow .58`、`opacity .48`、`fade .35`，从指针位置展开；只支持当前已确认的方形像素与 hover 触发。深色使用白色点阵，浅色使用 `lightColors:["var(--wd-label-secondary)"]` 的深色 ink；两主题都可选独立 `lightGlowColor`，Service Ticket 的点阵与 glare 保持各自已确认颜色。亮度只提高点阵和局部微光，不增加静态点阵或整卡高亮。
- 默认不绘制 intro，canvas 在无 hover 时不可见。指针离开后绘制层淡出、最终清空并移除状态属性；`prefers-reduced-motion` 下关闭波动和展开过程。调用方通过 `colors / lightColors` 与 `glowColor / lightGlowColor` 分别声明双主题 palette；Service Ticket 的深色点阵为白色、浅色点阵为共享深色 ink，白色仅继续用于 glare 与编号扫光。
- 组件负责 canvas 生命周期、ResizeObserver、主题观察、指针事件和清理函数。页面重绘时必须调用清理函数，不能只移除 DOM 而留下监听器。

### FlipCard 交互适配层

- `src/components/flip-card.js` 将 React Bits FlipCard 的指针交互转成项目原生 DOM / JS 实现，不引入 React 或 motion 依赖。Service Ticket 需要点击打开工单，因此不复用 flip-on-click，而是保留点击语义并采用 tilt、glare、hoverScale、perspective、stiffness 与 damping。
- 当前参数为 `tiltMax 12`、`glareOpacity .22`、`hoverScale 1.03`、`perspective 1100`、`stiffness 170`、`damping 20`。深色主题 Glare 使用共享主文字色与 soft-light；浅色主题必须使用白色径向渐变与 `screen`。卡片默认无描边、无投影，hover 背景高亮和投影暂时关闭。`--wd-card-hover-shadow` 仅作为后续显式启用入口保留，当前调用方不得引用。指针进入时，编号胶囊用共享 `--wd-motion-sheen` / `--wd-ease-sheen` 播放一次斜向扫光；浅色主题扫光也必须为白色，只能播放一次，不循环、不改变文本或底色。列表滚动视口仍需为左侧和顶部预留缩放绘制空间，不能以内容线裁掉卡片圆角。
- 指针进入后按位置计算 X/Y 倾斜；按住横向或纵向拖动超过 `4px` 会继续加大有限倾斜并在释放时回弹，同时抑制随后 click，避免拖动误开工单。普通点击不抑制。
- 组件维护 pointer capture、rAF spring、media-query 变化、减少动态效果与完整清理函数。页面重绘时必须调用清理函数；不能只移除 DOM 留下列表监听器或残留 transform。

## 工作区标签

```js
import {createWorkspaceTabs} from "/src/components/workspace-tabs.js";
const tabs=createWorkspaceTabs({container,addButton,createIcon});
tabs.captureState=()=>({route,home:homeSnapshot()});
tabs.restoreState=snapshot=>{showRoute(snapshot.route);restoreHome(snapshot.home)};
tabs.onStateChange=()=>scheduleWorkspacePersist();
tabs.mountTab=tab=>glass.addSurface({host:tab,radius:18});
tabs.onUnmount=tab=>glass.removeSurface(tab);
tabs.add({id:"home-2",title:"Home",kind:"home",route:"home",snapshot:{route:"home",home}});
tabs.hydrate(savedTabs,savedActiveId);
tabs.update(tab,{route:"plants",title:"Plants",kind:"route",iconFile:"asset-6.svg"});
tabs.activate(tab);tabs.closeActive();
```

每个 tab 持有自己的 `snapshot`；激活新 tab 前会先 `captureCurrent()`。`onStateChange` 在增删、切换、更新和排序后通知页面层做防抖持久化；`hydrate()` 只在启动时批量恢复，跳过入场动画和逐标签页面选择。多 Home tab 统一标题与无障碍名称为 Home，内部 ID 仅用于区分和测试。顶部标签图标由 `createRouteIcon()` 同时建立原色层与单色遮罩层；`icons.js` 的 `isNeutralIconFile()` 标记灰色中性素材，这些图标在选中/hover 时隐藏灰色原图并显示 `currentColor` 遮罩（深色纯白），彩色素材仍显示原色层。中性素材的遮罩引用 `home-assets/masks/` 不透明副本（`npm run sync:masks` 生成），避免原稿 0.7 透明度让白色高亮变灰。`layout()` 在 58–180px 内计算宽度，空间不足进入横向滚动；初始只有一个 Home 标签，不预置 Plants 占位。新增/关闭、路由文字图标淡变、关闭 X 的颜色过渡读取共享 motion token，调用方不重复写时长。关闭中的 tab 临时解除 58px 最小宽度，确保槽位与间距一起收至零。压缩或溢出时，鼠标位于标签条内关闭任意标签，会冻结剩余标签的布局宽度与 `scrollLeft`；溢出时用尾部占位维持可滚动范围，使后一个 X 落在指针下，可原位连续关闭。指针离开标签条后移除占位并恢复布局；宽标签未压缩时保留标准关闭动画。新页面的侧栏和普通页内导航应调用 `update/activate`；Plants 列表行与自动建站 `?` 提示中的 `setup` 是已确认的新标签入口，调用 `workspace.openRouteInNewTab()`；自动建站电站的 tab 标题为 `?`。`Back to Plants` 调用 `workspace.returnToPlantsList()`：激活来源列表标签后关闭详情标签；来源已不存在时在当前详情标签内返回 Plants。

标签支持指针拖拽重排，并暴露 `tabs.move(tab,index)` 供程序化排序。拖动超过 `4px` 才进入手势，跨过邻居中心实时换位，邻居用共享 FLIP 节奏移动；释放后源标签吸附，活动标签和 URL 不因拖动改变。溢出时左右 `28px` 边缘触发自动滚动。键盘使用 `Ctrl/Cmd + Shift + ←/→`，结果通过 polite live region 公布。不要把这段状态复制到页面层，也不要为拖拽另写时长。

工作区会话快照使用 `sessionStorage` 的 `wattdesk.workspace.v1`：保存版本、有序 tabs、activeId、ID 计数器、`{route, params}` 和页面 snapshot。刷新时当前 URL 优先；失效路由、不存在资源、内存中本地工单和 `/service/new` 未提交草稿不恢复。标签内 back/forward 栈与来源标签关系也不写存储；关闭浏览器标签页自动清空。
## 卡片、搜索、头像与折叠

```js
import {createCard} from "/src/components/cards.js";
import {createAvatar} from "/src/components/avatar.js";
const card=createCard({variant:"chart",radius:30,content:chartContent});
const avatar=createAvatar("CW",{size:36});
```

`createAvatar()` 始终将缩写放入 `.wd-avatar-label`，并用 `0.5px` 下移修正 SF Pro 字体基线的视觉上浮。宿主尺寸、圆形外观、1px 内描边、深浅主题阴影和调用方布局均不变化；页面不得另写头像文字位移。

卡片 variant 为 `panel` / `chart` / `status`，表示表面/状态契约，不强制大小卡片共用尺寸。`chart` 用 Vibrant 描边；`panel` 提供 `inset` 1px `Separators/Opaque` 内描边和主题轻投影；`status` 可配共享玻璃。右侧工作区只由 Home 外层 `#home-workspace-panel` 使用 `panel`，Plants、Service Ticket 和后续内容路由只负责内部布局，视图根节点必须透明且无 `box-shadow`，不能重复一层背景或投影。`prepareCard` 增强已有节点，不改原尺寸半径。

搜索输入放入已定位、有明确宽高的容器；工厂提供输入和命名字体，查询/结果由页面提供。侧栏搜索入口复用 `createSearchTrigger`。内联或全屏默认字段调用 `createSearchField({glass,placeholder,label})`，保持 `46px / 23px` 胶囊；内容页需要与侧栏 Quick search 同尺寸时传 `size:"compact"`，得到 `36px / 18px`、`0 14px` 与 `14/14 medium`，宽度仍由页面容器控制。两种尺寸共用结构、玻璃、图标与清空逻辑，不能自建另一套输入框。

全屏搜索由 `components/search-surface.js` / `.css` 提供，入场和退场使用同一组共享 token，页面不另写时长。退场与入场方向相反：结果面板先向下离开，搜索框晚一个 `--wd-motion-search-stagger` 向下离开，背景遮罩最后才退。遮罩必须保留完整模糊直到内容走完，再用 `--wd-motion-search-veil-delay` + `--wd-motion-search-veil-out` 的长尾化开；不要让它和内容共用 `--wd-motion-search-out`。遮罩退场只能动画底色与 `backdrop-filter`，不能降低元素自身 `opacity`，否则 `backdrop-filter` 会提前丢失。调用方要等遮罩退场结束再卸载全屏搜索节点，避免背景突然变清晰。

折叠 heading 先设置 `aria-expanded="true"`、`aria-controls` 指向 content.id，再调用 `bindDisclosure`；原始实心图标挂 `.wd-disclosure-icon`。共享逻辑维护 hidden/inert、高度/透明度动画及中途反向，不换图模拟旋转。

## 长列表滚动反馈

```js
import {createScrollFeedback} from "/src/components/scroll-feedback.js";

const feedback=createScrollFeedback({
  host,
  viewport,
  content,
  topInset:()=>viewport.offsetTop+header.offsetHeight,
  bottomInset:10
});
// 内容重排、列显隐或数据刷新后：feedback.sync()
// 页面销毁时：feedback.destroy()
```

`host` 是承载滚动视口的内容外壳，`viewport` 是实际 `overflow:auto/scroll` 的节点，`content` 是越界时参与平移的内容节点。组件自动创建轨道、滑块和上下回弹面，维护 `ResizeObserver`、滚动、滚轮、触摸与指针拖动；页面不再复制这些监听器或写局部动效时长。

顶部和底部内距由调用方给出：列表有固定表头时，`topInset` 应返回表头下沿相对宿主顶端的位置；底部默认应保留 `10px` 安全留白，避免轨道端点落在圆角裁切区。`--wd-scroll-feedback-right` 可覆盖右缘定位，`--wd-scroll-feedback-lane` / `--wd-scroll-feedback-thumb` 控制轨道与默认滑块宽度，回弹面的背景与圆角由 `--wd-scroll-pull-surface` / `--wd-scroll-pull-start-radius` / `--wd-scroll-pull-end-radius` 提供。回弹背景的共享默认值必须是 `transparent`：Plants 与 Service Ticket 列表露出 `wd-main-panel`，Company 筛选树露出 Glass Surface；只有确有独立表面的调用方才能显式覆盖，不能恢复 `Backgrounds/Tertiary` 默认实底。

滑块默认颜色取 `--wd-scroll-feedback-thumb-color`（Labels/Tertiary），hover / 拖动取 `--wd-scroll-feedback-thumb-hover-color`（Labels/Secondary）。位于内容可读性覆盖中的滚动区若需要与页面主滚动条一致，应显式把这两个变量映射到全局 `--wd-figma-labels-*`，不能另写背景色。

上下越界时，回弹面逐步展开，内容沿越界方向平移，滑块同步缩短并在松手后沿 `--wd-motion-pull-rebound` / `--wd-ease-spring` 恢复。`prefers-reduced-motion` 下直接复位，不保留位移动画。组件只替换滚动视觉与越界反馈，不负责列头、行 hover、排序、筛选或数据。

固定高度且无需回弹的多行输入传 `elastic:false`。Service Ticket 回复框由 `.service-reply-input-host` 包裹实际 `contenteditable` 视口，隐藏原生滚动条并显示共享 `10px` 轨道；滚轮在输入框内先滚动文本，到达上下边界后才把后续滚动交还页面，独立回复框和楼内编辑器共用这一实现。

## 空状态

```js
import {createEmptyState} from "/src/components/empty-state.js";
const empty=createEmptyState({iconFile:"asset-6.svg",label:"Coming soon"});
panel.append(empty.element);
empty.play();
```

所有暂未接入真实内容的页面复用该组件，不再各自写“空白页”或临时文案。图标保持当前路由的原始素材：彩色文件直接显示原图；`icons.js` 标记的中性文件使用 `home-assets/masks/` 不透明副本与 Labels/Tertiary 遮罩。组件在宿主内水平居中，图标与文字整体相对垂直中心上移 119px；图标为 64×64，文字为 18px / 510 / 24px 行高，间距 10px。进入时整组从下方 4px 淡入一次，减少动态效果直接显示。本身不创建圆角卡片，不拦截指针。路由变化时调用 `update()` 再 `play()`；有真实内容后移除占位节点，不能把它永远叠在内容上。

## 日期选择器

```js
import {createDatePicker,describeRange,presetRange} from "/src/components/date-picker.js";
const range=presetRange("Last 7 days",new Date());
const picker=createDatePicker({
  trigger,
  glass,
  registerPanel,
  close:()=>popover.close(),
  range,
  onApply:next=>setPeriodLabel(describeRange(next))
});
// 页面负责浮层开合与触发按钮文案；picker.getRange() 返回当前草稿
```

日期选择器持有草稿范围与日历状态，不发起数据查询；`onApply` 只把最终范围交给页面。选择预设只更新面板草稿，点击 `Apply` 后才更新主周期标签。预设固定为 `Today` / `Yesterday` / `Last 24 hours` / `Last 7 days` / `Last 30 days` / `This month` / `Custom range`；输入为 `Start date`、`End date`，动作为 `Cancel` / `Apply`。日期支持 `YYYY-MM-DD` 与 `YYYY/MM/DD HH:mm`，无效或结束早于开始时不提交。`describeRange()` 返回预设名称或 `Custom range`，用于同步周期胶囊；胶囊宽度必须按文字自动测量，不能写死。

输入区按固定格式渲染：`YYYY/MM/DD HH:mm` 的 `/`、空格、`:` 由控件绘制，不可输入也不随取值移动；五个分段各自只接受本段位数的数字，满位自动前进，退格回到上一段。粘贴整串时间会按分段长度拆分。`parseDateInput()` 仍兼容 `YYYY-MM-DD`，但界面只呈现固定格式。

校验失败时 `showInvalid()` 给对应 `.wd-date-field-control` 加 `wd-date-invalid`：`::after` 覆盖 1px `Accents/Red` 内描边与淡红外环（共享玻璃会清除原生 `box-shadow`，所以错误态必须走覆盖层），分段、分隔符与图标一并变红。原因行 `.wd-date-message > .wd-date-error` 位于输入区与第二条 `.wd-date-rule` 之间，不能放回 footer。分段 `focus` 不清除错误，只有重新输入产生合法范围时才 `clearInvalid()`；否则 Apply 或定位到分段都会把刚出现的红框立刻抹掉。

错误行存在生长期与回收期：`showInvalid()` 在显示 `status` 之前记录报错行与面板的起始高度，显示并量出 30px 行高和 460px 面板后，再写回起始高度交给 `growMessage({from,target,panelFrom,panelTarget})`。报错行高度/透明度与面板高度由同一条 `--wd-motion-panel` WAAPI 动画推进；`liftForGrowth()` 把避免压到触发按钮的位移并入同一条面板动画，结束后不再二次改 `top`。`collapseMessage()` 必须保留文案直到收起动画结束，再 `hidden=true` 并清空，避免先清空再收高。同一文案、同一字段已报错时不重播入场；`commitInputs()` 不再先 `clearInvalid()`。

`alignMonth()` 用 `Range` 量出第一个星期标题 “M” 的字形左边界并写入 `.wd-date-month` 的 `margin-left`，字体加载与 resize 后重算；标题绑定 `14/14 medium`。`enterMonth()` 只重建日期网格并做同方向滑动，月份标题交叉淡入淡出，左右按钮与星期行保持静止。

`closePanel()`（`foundations/motion.js`）对玻璃宿主不淡出自身 `opacity`，而是让 `_wdFade` 内容层、`.wd-glass-fill` 与 `.wd-glass-optics` 以同一时长（约 94% 的退出时长）一起淡出，随后整体移除。遮罩与内容不能分先后，否则会留下只有模糊底板的空壳。
浮层生命周期由共享控制器负责：外部点击、Esc、Apply / Cancel 以及页面路由变化都调用同一个 `close()`。侧栏导航、工作区标签切换和其他离开当前页面的入口必须在共享层关闭活动浮层，不能只依赖日期组件局部监听，也不能让弹窗跟随新路由留在页面上。


面板宽 462px、最低高 433px；视口不超过 520px 时改为纵向排列，宽度与高度分别限制在视口减 24px 内并允许滚动。面板、前后月按钮、日期输入和 `Cancel` 复用共享玻璃；`Apply` 用共享材质但覆写为实心 `Accents/Blue`（Figma `14736:5234`），关闭模糊与白色反射场，只保留深色外轮廓、细亮边和指针高光，不能做成偏白的浅蓝胶囊。日历左右键移动一天、上下键移动一周；前后月按钮使用真实 disabled。旧的 `Custom date range…` 单按钮入口已废弃，不得在页面另建替代弹层。


## 载入骨架

```js
import {mountSkeletons} from "/src/components/skeleton.js";
card.dataset.skeleton="chart"; // 或 "status" / "text"
const skeletons=mountSkeletons({root,delay:140});
// 真实内容就绪后统一结束；减少动态效果时传 instant=true
skeletons.settle();
await skeletons.allSettled();
```

只给真正等待数据的宿主加 `data-skeleton`，不要包住侧栏、顶栏、标签或已经可用的搜索/快捷入口。`mountSkeletons()` 自动生成 `wd-skeleton-layer`、维护 `waiting / pending / settled` 与 `aria-busy`/`inert`；`ResizeObserver` 按宿主当前像素尺寸重建条形，适配响应式宽度。组件不改变宿主的圆角、描边、玻璃与布局盒。

快速加载使用 `--wd-motion-skeleton-delay`（当前 `140ms`）防闪；区域在阈值内完成则不绘制。超时后单次扫光，扫光与淡出由 `foundations/motion.css` 统一控制，页面不写局部 transition。减少动态效果保留静态骨架但不扫光、不淡入；传入 `settle(true)` 或销毁时立即释放。图片/图表区域使用 `chart`，状态卡使用 `status`，普通文本块使用 `text`。

## 主题、浮层、图表与圆角

- 首帧加载 `theme-bootstrap.js` 读取偏好，后续只走共享 theme controller。键 `wattdesk-home-theme` 保留兼容旧偏好，后续页面共用。`apply(mode)` 只适配确有差异的图像/图表；CSS token 自动跟随。
- Popover controller 返回 `popover(anchor,trustedHTML,width)`、`close(immediate)`、`toast(message)`、`reposition()`、`destroy()`；提供 overlays 与 role=status 的 toast 宿主。支持 Esc、外部点击及焦点恢复；这是轻量浮层，不是完整模态焦点陷阱。
- 锚定面板由 `registerPanel()` 实时跟随触发元素：打开、`scroll`（document 捕获阶段，覆盖嵌套滚动区）、`resize` 与 `visualViewport` 变化都重新测量。位置以 `offsetWidth` / `offsetHeight` 计算，避免开合 `scale()` 让翻转点漂移；触发元素一半以上滚出视口时关闭，不能贴在视口边缘。调用方不得缓存坐标或另写滚动监听；内联搜索结果与工作区标签 tooltip 沿用同一约定（tooltip 由 workspace-tabs.js 自管坐标，但必须使用相同的捕获阶段监听与 rAF 合并）。
- Motion controller 提供 `openPanel`、`closePanel`、`observeCharts(cards,scrollRoot)`。曲线挂 `.chart-mark`，柱形另挂 `.chart-bar`，观察点挂 `.chart-observation`；首次可见播放一次，减少动态效果时直接可见。
- 圆角使用共享 `superellipse(1.2)`，保留组件自己的半径。该值由用户在实际 30px 卡片上确认，并非 Figma Corner Smoothing 60% 的数值换算；Figma 会延长切线，CSS 指数始终限制在半径盒内，两者不能逐点精确匹配。原稿正圆/胶囊保持 round，玻璃各层继承宿主，不加 clip-path 裁掉投影。

新增组件核对默认、hover、focus、选中、禁用/加载（适用时）、双主题和减少动态效果。共享参数调整必须检查全部使用处。
