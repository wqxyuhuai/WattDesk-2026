# 共享组件手册

更新：2026-10-19。本文对应实际模块；完整视觉要求见 [DESIGN-SYSTEM.md](../DESIGN-SYSTEM.md)。路径均相对 `design-preview/`。

所有页面加载 `/src/shared.css`，包含 SF Pro、语义颜色、完整 Figma 字体 styles、材质、状态、动效、头像和连续曲线。页面局部 CSS 在共享入口之前加载，不自行拼出另一套基础。

## 实现入口

| 内容 | 模块 | 实际 API |
|---|---|---|
| 颜色 / 节奏 | `src/foundations/tokens.css`、`colors.css` | `--wd-label-*` / `--wd-bg-*` / `--wd-accent-*` 等语义入口 |
| 共享动效 | `src/foundations/motion.css` | `shared.css` 自动加载；组件不写局部 transition |
| 字体 | `foundations/typography.js`、`type.css` | `applyTypeStyle(el,name)` 或 `data-type-style` |
| 图标 | `components/icons.js` | `createIcon(name,tone?)`，注册表 `ICONS` 保留原文件与 tone |
| 按钮 | `components/controls.js`、`button.css` | `button(label,className="wd-button",trustedHTML="")`；标准胶囊按钮组合 `.wd-button--pill` + `.wd-button--neutral` / `.wd-button--primary` |
| 现有节点控件化 | `components/controls.js` | `enhanceControl(el,{label,onActivate})`，返回事件清理函数 |
| 搜索 | `components/search.js` | `createSearchTrigger(label,className)` / `createSearchInput({label,placeholder,className})` |
| 导航 | `components/navigation.js` | `makeNavRow(label,key,file,extraClass,tone)`，不自行导航 |
| 折叠 | `components/disclosure.js` | `bindDisclosure(heading,content)` |
| 头像 | `components/avatar.js`、`avatar.css` | `createAvatar(initials,{size=36,className})` |
| 日期选择 | `components/date-picker.js` / `.css` | `createDatePicker({trigger,glass,registerPanel,close,onApply,range})` → `{panel,close,getRange}`；另有 `presetRange / describeRange / parseDateInput / formatDateInput` |
| 卡片 | `components/cards.js`、`cards.css` | `prepareCard(el,variant)` / `createCard({variant,radius,content})` |
| 空状态 | `components/empty-state.js` / `.css` | `createEmptyState({iconFile,label})` → `{element,update,play}` |
| 玻璃 | `components/glass-material.js` / `.css` | `createGlassMaterial({surfaces:[{host,radius,chrome,interactive}]})`，返回 `destroy()`；`interactive:false` 用于纯展示表面 |
| 控件状态 | `components/control-states.js` / `.css` | 内容挂载后 `await prepareControlStates(container)` |
| 历史浮窗 | `components/history-popover.js` / `.css` | `createHistoryPopover({anchor,entries,onSelect,registerPanel,close,motion})`；复用共享玻璃与 30px 浮层圆角，最多 8 行 |
| 浮层 / 提示 | `components/popover.js` / `.css` | `createPopoverController({overlays,toastElement,motion,glass})`；菜单、tooltip、toast 自动使用 Glass Surface |
| 标准浮层菜单 | `components/menu-popover.js`、`popover.css` 的 `.wd-menu` | `menuHeading / menuList / menuRow / menuNote / mountMenu`；顶栏紧凑菜单 200px，历史 280px 例外 |
| 有限动效 | `foundations/motion.js` | `createHomeMotion({duration,easing,reducedMotion})`；名称保留，行为共享 |
| JS 动效节奏 | `foundations/motion.js` | `motionDuration(token)` / `motionEasing(token)`，禁止硬编码毫秒或曲线 |
| 主题 | `foundations/theme-controller.js` | `createThemeController({initialTheme,apply})`，每页一个 |
| 圆角 | `foundations/geometry.js` / `.css` | `preserveCornerProfile(el,{radius,width,height,ellipse})` |
| 工作区标签 | `components/workspace-tabs.js` / `.css` | `createWorkspaceTabs({container,addButton,createIcon,...})`；`add/find/update/activate/closeActive`、`captureCurrent` 与状态快照 |
| 外壳 | `layouts/app-shell.js` / `.css` | `createAppShell({sidebar,header})`；调用方提供位置与业务事件 |

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
import {button} from "/src/components/controls.js";

const cancel=button("Cancel","wd-button wd-button--pill wd-button--neutral");
const apply=button("Apply","wd-button wd-button--pill wd-button--primary");
material.addSurface({host:cancel,radius:18});
material.addSurface({host:apply,radius:18});
```

- 两者固定 `36px` 高、左右内距 `16px`、胶囊圆角、`13px / 510 / 18px`；不按文案长度改尺寸。
- `.wd-button--neutral` 使用共享普通玻璃，默认 `Labels/Secondary`，hover / 键盘 focus 为 `Labels/Primary`，用于 `Cancel`、关闭和次要操作。
- `.wd-button--primary` 是实心 `Accents/Blue`：关闭模糊、白色反射场和上下内阴影，只保留细深色外轮廓、极细亮边与指针高光；hover 仅轻微提亮，不能洗成浅蓝。一个视图只保留一个主按钮，用于 `Apply`、保存、确认。
- 缩放、边缘光弧、指针跟随和禁用态由共享材质与 `.wd-control-state` 提供；调用方不写局部 `transform`、`box-shadow`、transition，也不新增第三套玻璃。日期选择器的 `.wd-date-action` 只是兼容别名，新组件直接用标准类名。

`.wd-control-state` 为容器，`.wd-control-label` 为文字。hover / 键盘 `:focus-visible` 时中性文字和图标一起变主文字色，深色纯白、浅色主墨色；鼠标点击留下的普通 DOM 焦点不应持续呈现 hover，离开指针后恢复默认色。原始彩色图标保留原色。材质微光只影响光学层，控件和文字不位移。

交互组件不要写组件内 `transition` 或 `transition-duration`：只要页面加载 `shared.css`，原生 `button` / `a` / `input`、常见 ARIA role、`.wd-control-state`、共享玻璃层、tab、快捷入口和折叠箭头就自动继承 `foundations/motion.css` 的属性和节奏。组件只声明默认、hover、focus、选中、禁用等视觉值。需要 JS 几何动画时读取 `motionDuration()` / `motionEasing()`；`prefers-reduced-motion` 由共享层统一处理。

### Hover 节奏

hover 进入 `240ms`、离开 `360ms`，由 `motion.css` 的宿主变量统一切换：交互宿主在 `:hover` / `:focus-visible` / `:has(:focus-visible)` 时把 `--wd-hover-duration` / `--wd-hover-ease` 切到进入值，文字与图标叶节点继承同一对值，背景、文字和图标不会各自计时。新增组件不要自带时长；玻璃缩放固定走 `300ms` / `110ms` / `420ms`，不受该变量影响。Workspace 标签关闭使用 `--wd-motion-tab-close`（`260ms`）加离开缓动；浮层、搜索和日期错误行退出使用 `--wd-ease-hover-out`。

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
- 内容独立放在同级容器（如 `.wd-date-picker-content`、`.wd-search-panel-body`），不要塞进 `.wd-glass-material`。
- 深色 `18px` 模糊 / `30%` 中性底；浅色 `9px` 模糊 / `44%` 浅灰底 + `saturate 1.45`，模糊太高会把背后卡片抹成均匀白膜。深浅主题都保留背后页面可辨；不要再写 `backdrop-filter`、`background` 或局部 `--wd-glass-surface-tint` 覆盖。
- hover 时指针附近出现光斑和一段边缘弧，由共享材质自动处理；深色是白弧，浅色是深色弧配白色内光斑。不要给浮层另外写 `:hover` 阴影或渐变。
- 嵌套玻璃以最内层为准：弹窗里的输入框、按钮、月份圆钮各自响应 hover，外层浮层不接管 `data-glass-pointer`。共享材质已按 `event.target.closest('.wd-glass')` 判定，新组件无需额外处理。

### 标准浮层菜单

文本型菜单只复用一套内胆，外壳宽度由具体入口决定。顶栏 `Language` / `Appearance` / `WattDesk` 使用 `.popover.popover--menu`（200px），历史浮窗 `.wd-history-popover` 保留 280px；两者的标题、行、勾选和尾距都来自 `.wd-menu`。

```js
import {menuHeading,menuList,menuRow,mountMenu} from "/src/components/menu-popover.js";

const panel=document.createElement("div");
panel.className="popover popover--menu";
const list=menuList();
list.append(menuRow("English",{checked:true}),menuRow("简体中文"));
mountMenu(panel,{label:"Language",children:[menuHeading("Language"),list]});
registerPanel(panel,trigger,{label:"Language",radius:30});
```

- `.wd-menu`：顶部 20px，左右/底部 10px，标题与列表间距 10px；标题 `Footnote/Emphasized` 次级色、14px 缩进；行 36px 高、14/14 medium（14px / 510）、胶囊 hover，中性图标与文字同步转主文字色。
- 勾选槽固定 `20px`，使用 `currentColor` + `/home-assets/tickle.svg` 遮罩；未选中时保留槽位并隐藏，避免切换语言导致文字位移。列表末尾到底缘固定 10px。
- `menuRow(label,{iconFile,iconTone,checked,onSelect})` 输出语义按钮和 `aria-checked`；`menuNote(text)` 用于无操作说明。不要在页面内再拼 `.wd-menu-heading` / `.wd-menu-row` 的独立样式。
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

## 工作区标签

```js
import {createWorkspaceTabs} from "/src/components/workspace-tabs.js";
const tabs=createWorkspaceTabs({container,addButton,createIcon});
tabs.captureState=()=>({route,home:homeSnapshot()});
tabs.restoreState=snapshot=>{showRoute(snapshot.route);restoreHome(snapshot.home)};
tabs.mountTab=tab=>glass.addSurface({host:tab,radius:18});
tabs.onUnmount=tab=>glass.removeSurface(tab);
tabs.add({id:"home-2",title:"Home",kind:"home",route:"home",snapshot:{route:"home",home}});
tabs.update(tab,{route:"plants",title:"Plants",kind:"route",iconFile:"asset-6.svg"});
tabs.activate(tab);tabs.closeActive();
```

每个 tab 持有自己的 `snapshot`；激活新 tab 前会先 `captureCurrent()`。多 Home tab 统一标题与无障碍名称为 Home，内部 ID 仅用于区分和测试。顶部标签图标由 `createRouteIcon()` 同时建立原色层与单色遮罩层；`icons.js` 的 `isNeutralIconFile()` 标记灰色中性素材，这些图标在选中/hover 时隐藏灰色原图并显示 `currentColor` 遮罩（深色纯白），彩色素材仍显示原色层。中性素材的遮罩引用 `home-assets/masks/` 不透明副本（`npm run sync:masks` 生成），避免原稿 0.7 透明度让白色高亮变灰。`layout()` 在 58–180px 内计算宽度，空间不足进入横向滚动；初始只有一个 Home 标签，不预置 Plants 占位。新增/关闭、路由文字图标淡变、关闭 X 的颜色过渡读取共享 motion token，调用方不重复写时长。关闭中的 tab 临时解除 58px 最小宽度，确保槽位与间距一起收至零。压缩或溢出时，鼠标位于标签条内关闭任意标签，会冻结剩余标签的布局宽度与 `scrollLeft`；溢出时用尾部占位维持可滚动范围，使后一个 X 落在指针下，可原位连续关闭。指针离开标签条后移除占位并恢复布局；宽标签未压缩时保留标准关闭动画。新页面的侧栏导航应调用 `update/activate`，而不是 `add` 新 tab。
## 卡片、搜索、头像与折叠

```js
import {createCard} from "/src/components/cards.js";
import {createAvatar} from "/src/components/avatar.js";
const card=createCard({variant:"chart",radius:30,content:chartContent});
const avatar=createAvatar("CW",{size:36});
```

卡片 variant 为 `panel` / `chart` / `status`，表示表面/状态契约，不强制大小卡片共用尺寸。`chart` 用 Vibrant 描边，`panel` 复用浅色面板投影，`status` 可配共享玻璃；背景、布局、内边距与业务内容按各自设计提供。`prepareCard` 增强已有节点，不改原尺寸半径。

搜索输入放入已定位、有明确宽高的容器；工厂提供输入和命名字体，查询/结果由页面提供。侧栏搜索入口复用 `createSearchTrigger`。

全屏搜索由 `components/search-surface.js` / `.css` 提供，入场和退场使用同一组共享 token，页面不另写时长。退场与入场方向相反：结果面板先向下离开，搜索框晚一个 `--wd-motion-search-stagger` 向下离开，背景遮罩最后才退。遮罩必须保留完整模糊直到内容走完，再用 `--wd-motion-search-veil-delay` + `--wd-motion-search-veil-out` 的长尾化开；不要让它和内容共用 `--wd-motion-search-out`。遮罩退场只能动画底色与 `backdrop-filter`，不能降低元素自身 `opacity`，否则 `backdrop-filter` 会提前丢失。调用方要等遮罩退场结束再卸载全屏搜索节点，避免背景突然变清晰。

折叠 heading 先设置 `aria-expanded="true"`、`aria-controls` 指向 content.id，再调用 `bindDisclosure`；原始实心图标挂 `.wd-disclosure-icon`。共享逻辑维护 hidden/inert、高度/透明度动画及中途反向，不换图模拟旋转。

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
- Popover controller 返回 `popover(anchor,trustedHTML,width)`、`close(immediate)`、`toast(message)`、`destroy()`；提供 overlays 与 role=status 的 toast 宿主。支持 Esc、外部点击及焦点恢复；这是轻量浮层，不是完整模态焦点陷阱。
- Motion controller 提供 `openPanel`、`closePanel`、`observeCharts(cards,scrollRoot)`。曲线挂 `.chart-mark`，柱形另挂 `.chart-bar`，观察点挂 `.chart-observation`；首次可见播放一次，减少动态效果时直接可见。
- 圆角使用共享 `superellipse(1.2)`，保留组件自己的半径。该值由用户在实际 30px 卡片上确认，并非 Figma Corner Smoothing 60% 的数值换算；Figma 会延长切线，CSS 指数始终限制在半径盒内，两者不能逐点精确匹配。原稿正圆/胶囊保持 round，玻璃各层继承宿主，不加 clip-path 裁掉投影。

新增组件核对默认、hover、focus、选中、禁用/加载（适用时）、双主题和减少动态效果。共享参数调整必须检查全部使用处。
