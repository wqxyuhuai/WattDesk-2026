# 顶栏工作区标签：功能、交互与接入

更新：2026-10-20。适用入口 `design-preview/home.html?glass=figma`。本文记录当前**设计预览**的真实能力与后续接入约束；交互与视觉规范以 [DESIGN-SYSTEM.md](../DESIGN-SYSTEM.md) 为准，组件 API 摘要见 [COMPONENTS.md](./COMPONENTS.md)。

## 1. 边界

- 已实现标签条本身：新增、关闭、切换、标题截断、横向滚动、连续关闭、键盘操作、状态快照、深浅主题与减少动态效果；顶栏后退 / 前进可在各标签内恢复已访问的路由。
- 当前只有 Home 有真实内容；Plants、Service ticket、Statistics、Device tool 下的页面使用共享 Coming soon 占位，不当作已完成业务页面。
- 侧栏导航是在**当前激活标签内**切换内容，不创建新标签；“Add tab”才创建新标签。
- 尚无真实 URL 路由、后端、登录权限、跨刷新持久化。接入时不得把演示数据写成生产能力。

## 2. 代码入口

| 文件 | 职责 |
|---|---|
| `design-preview/src/components/workspace-tabs.js` | 标签状态、DOM、布局、增删切换、动画、键盘与焦点 |
| `design-preview/src/components/workspace-tabs.css` | 标签、关闭按钮、横向滚动、tooltip 的视觉结构 |
| `design-preview/src/foundations/motion.css` | 标签颜色、图标、X 显隐和布局槽位的共享动效 |
| `design-preview/src/components/icons.js` | 彩色图标与中性图标识别、原始素材和透明遮罩 |
| `design-preview/src/layouts/app-shell.js` | 组合顶栏容器、Add 按钮和标签组件 |
| `design-preview/src/pages/home/index.js` | 页面级业务装配：路由切换、快照保存/恢复、玻璃表面挂载 |
| `design-preview/tests/verify-home.cjs` | 默认状态、宽度、图标、连续关闭、主题等回归检查 |

依赖方向仍是页面 → 外壳/组件 → 基础，组件不引用首页节点 ID。

## 3. 公共 API

```js
const tabs = createWorkspaceTabs({
  container,       // 标签条外部容器，需位于顶栏
  addButton,       // 已存在的 Add 按钮
  createIcon,      // 图标工厂，外壳传入共享 createIcon
  onSelect,        // 切换完成后同步页面
  onBeforeSelect,  // 切换前处理
  onClose,         // 标签关闭后清理业务状态
  onMount,         // 标签节点挂载后
  onUnmount,       // 标签移除前/后清理资源
  captureState,    // 为当前激活标签生成快照
  restoreState,    // 用快照恢复页面
  onEmpty,         // 最后一个标签关闭后的兜底
  mountTab         // 每个标签节点的挂载钩子，用于玻璃等
});
```

回调也可在建后赋值，页面当前采用这种方式：

```js
tabs.captureState = () => ({route, home: homeSnapshot()});
tabs.restoreState = snapshot => restore(snapshot);
tabs.mountTab = tab => glass.addSurface({host: tab, radius: 18});
tabs.onUnmount = tab => glass.removeSurface(tab);
```

实例方法：

| 方法 / 属性 | 作用 |
|---|---|
| `add(state)` | 新建标签、插入 DOM、完成布局与入场动画，并激活 |
| `find(route)` | 按 route 找标签，找不到返回 `null` |
| `update(tab, changes)` | 合并状态并更新 route、标题、图标；文字/图标做淡出淡入 |
| `updateTitle(tab, title)` | 只更新文本标题，仍受 28 字符上限 |
| `activate(tab)` | 激活标签；切换前保存当前快照，再恢复目标快照 |
| `remove(tab)` / `closeActive()` | 关闭指定标签或当前标签 |
| `captureCurrent()` | 保存当前激活标签的页面快照 |
| `layout()` | 按容器可用宽度重新计算标签槽位 |
| `active()` / `activeId` | 当前标签节点 / 当前标签 ID |
| `tabs` | 只读数组副本，顺序即界面顺序 |
| `destroy()` | 移除监听、tooltip 和标签列表 |

标签状态字段：

```js
{
  id: "home-2",       // 唯一、稳定；仅用于区分和测试
  title: "Home",      // 展示标题；多 Home 不显示编号
  kind: "home",       // "home" | "route"
  route: "home",      // 当前内容路由标识
  iconFile: null,     // 原始图标文件名；null 使用 Home 图标
  snapshot: {...}     // 页面自行定义并负责恢复的内容快照
}
```

## 4. 当前交互规则

### 新增

- 初始只有一个 `home-1`，不预置 Plants、示例标签或其他占位。
- 点击 Add 创建新的 Home 标签；新标签标题仍为 `Home`，内部 ID 递增；不显示 `Home 2`。
- 新标签继承首页默认快照，不会复用前一个标签的编辑状态。
- 新增标签前先按“插入后”的标签数量算出最终平均槽位，再创建并插入节点；既有标签在首帧直接采用该槽位，不得先按旧平均宽度绘制、再补一次宽度过渡。新标签只做从 `0` 到最终槽位的展开动画，Add 按钮随槽位连续移动，不是整格瞬跳。
- 入场动画是本次操作中唯一的宽度动画。`is-entering` 只保留文字/背景反馈，`is-resizing` 让既有标签禁用 `flex-basis`、`width` 与内边距过渡；不能同时让新标签 WAAPI 与既有标签 CSS 宽度过渡各跑一条曲线。
- 入场开始前读取一次布局并固定零宽起点，避免某些视口先绘制一次完整槽位。验收读取 `getComputedStyle(tab).width` 判断布局，不用含玻璃按压缩放的 `getBoundingClientRect()` 冒充宽度回归。
- `--wd-motion-tab-in: 280ms`，曲线 `--wd-ease-tab-in`；减少动态效果时立即完成。

### 关闭

- 关闭 X 默认随标签 hover / focus 淡入；触控或键盘聚焦时同样可操作。
- X 的 18px 圆形底和 8px 图标共享 260ms 颜色过渡；hover 时底色使用主文字色、字形使用画布色（深色白底深字，浅色黑底白字），背景与字形同时渐变，不能先换底色再换字色。
- X 是真实 `button`，不使用描边模拟；键盘 focus 只显示设计规定的 focus 样式，不应出现异常 outline。
- 关闭激活标签：优先激活右侧标签，没有右侧则选左侧；最后一个关闭后通过 `onEmpty` 恢复一个 Home。
- 关闭非激活标签不改变当前内容。
- 每个标签独立保存快照：路由、首页滚动位置、搜索文本和周期；切换后恢复。
- 宽标签且未压缩时，关闭节点做宽度、内边距、透明度和 5px 退场动画；关闭中的标签临时解除 58px 最小宽度，避免卡顿后瞬移。
- 压缩或溢出时，指针仍在标签条内关闭任意标签：冻结剩余标签的布局宽度与 `scrollLeft`，使下一个标签及其 X 移到原指针位置，支持同一位置连续关闭。移出标签条后才解除冻结并恢复自适应宽度。
- 溢出时为被关闭槽位保留尾部占位，防止滚动范围缩小时 `scrollLeft` 被浏览器夹紧导致整排跳动。
- 冻结布局宽度读取 `offsetWidth`，不是受页面缩放影响的 `getBoundingClientRect().width`。

### 切换与导航

- 点击标签、Enter 或 Space 激活标签。
- 左 / 右方向键在当前标签间循环切换；Home / End 跳到首 / 尾；Delete / Backspace 关闭当前标签。
- 侧栏点击只调用 `update/activate` 更新**当前标签内容**，不调用 `add`；因此不会无端多出标签。
- 切换前先 `captureCurrent()`，目标标签有快照时先恢复，再触发 `onSelect` 同步外壳与面板。
- 标签内容切路由时，旧文字和图标先渐出（110ms），提交新内容后再渐入（220ms）；快速连续点击用 token 取消过期切换，避免旧路由覆盖新路由。
- 日期周期选择属于页面状态而不是标签切换：点击预设只更新日期面板草稿，必须点击 `Apply` 才提交主周期标签；测试和文档不能把“点预设即提交”当成最终交互。
- 侧栏顶部的后退 / 前进只作用于**当前激活标签**的页面历史，不新建或切换标签，也不改 URL。每个标签独立维护路由历史：新标签从 Home 开始；进入新路由会截断该标签的前进分支；后退 / 前进按当前位置恢复该标签的 Home 内容、当前标签标题与侧栏选中态。
- 后退 / 前进没有可去记录时使用真实 `disabled`：按钮为 Labels/Quaternary、不响应鼠标和键盘、也不产生 hover 放大；离开端点和切换标签后必须即时重算。关闭标签时同时清理它的历史，不能把旧标签的记录带给剩余标签。

## 5. 标题、宽度与滚动

- 标签外层高度 36px，文字使用 `14/14 medium`；标签内容左右内边距 14px。
- 单标签宽度按可用空间计算，范围为 **58–180px**；能放下时优先到 180px，而不是固定 120px。
- 标签之间及标签与 Add 之间的间距为 5px。
- 标题最多保留 28 个字符；超出容器时用省略号，hover 或键盘 focus 320ms 后显示完整标题 tooltip。
- 完整标题通过独立 `role="tooltip"` 浮层显示，超出视口时左右夹紧；标签同时关联 `aria-describedby`。
- 可用宽度不足以让每个标签保持 58px 时，标签条进入 `is-overflowing`，保持 58px 可读宽度并允许横向滚动，不继续压缩字号或内容。
- 横向滚动区隐藏滚动条但保留滚轮/触控板/键盘可访问性；滚动到激活标签时保证其可见。
- 标签宽度变化使用共享布局槽位过渡（当前 `--wd-motion-tab-out`，约 220ms），不是 `transition: all`；时长以 `motion.css` token 为准，不在组件层另写。

### 宽度接入原则

- 新页面若沿用本组件，保持 `58–180px` 和 5px gap；不要在页面层另写一套标签宽度。
- 若业务确需更大上限，先核对设计稿和全部状态，再改共享常量与测试，不能只改一个截图。
- 无论标签多少，Add 按钮始终在标签列表后方；容器剩余空间不足时可横向滚动。
- 标签总宽度已占满可用空间时，Add 按钮固定在标签条最右侧，不随新标签从 0 展开而左移回弹。实现为占满状态下让标签列表填满剩余宽度（`is-slot-filled`）；未占满时仍按内容自然增长，Add 随标签右移。
- 验收占满状态时逐帧记录 Add 的 `getBoundingClientRect().x`：点击前、入场首帧、动画结束必须一致；未占满状态则确认 Add 只单调右移，没有反向跳动。

## 6. 图标规则

- 彩色素材（Plants、Service ticket、Statistics 等）在默认、hover、选中时保留原色。
- 灰色中性素材（Cell balance、Module balance、Device track、Organisation、Teams、User 等）在选中 / hover 时改为当前主文字色遮罩；深色为纯白，浅色为主墨色。
- 原 SVG 可能带 `fill-opacity="0.7"`，直接当遮罩会把白色削成灰色。因此中性图标使用 `home-assets/masks/` 下的不透明同形副本，由 `npm run sync:masks` 生成，不能手改颜色或按截图猜值。
- 中性图标列表集中在 `icons.js` 的 `neutralIconFiles`；新增素材必须先判断是彩色还是中性，再入表。
- 图标尺寸 18×18px，不因状态改变大小、位置或旋转。

## 7. 玻璃、圆角与主题

- 每个标签挂载同一套 Figma 玻璃表面；新增时 `mountTab` 注册，移除时 `onUnmount` 注销，不能复制一套局部材质。
- 标签圆角沿用共享 `--wd-radius-medium`（18px），关闭圆钮是 50%。不因 Squircle 实现修改半径。
- 连续曲线由共享 `geometry.css` 处理，标签默认走原稿轮廓；不得为视觉补偿新增例外或改变尺寸。玻璃 hover、按压缩放、圆钮识别和复合容器静止均由共享材质继承，标签层不另写。
- 深色和浅色分别使用主题 token；图标、文字、X、玻璃和 tooltip 都需在两种主题下检查。
- 所有颜色与透明度过渡使用共享 260ms / 统一缓动；减少动态效果时立即切换，不留下不可见内容。

## 8. 可访问性

- 列表 `role="tablist"`，标签 `role="tab"`，选中态 `aria-selected="true"`。
- 标签通过 `aria-controls` 关联工作区面板；面板为 `role="tabpanel"`，并以标签 ID 关联。
- 仅激活标签可由 Tab 键进入（`tabIndex=0`），其余为 `-1`；方向键切换并把焦点移到新标签。
- 关闭按钮有 `aria-label="Close <title> tab"`，非激活标签的关闭按钮从 Tab 顺序移除。
- 标签有稳定可访问名称：Home 标签为 `Home tab`，不随重复标题或内部 ID 改变。
- tooltip 通过 `role="tooltip"` 和 `aria-describedby` 暴露，不替代可操作按钮的文本。

## 9. 真实项目接入清单

1. **先定语义**：侧栏是同一标签内的页面导航，还是新标签入口。默认按前者；只有 Add 创建 Home。
2. **路由与内容绑定**：真实路由接入时，把 `route` 映射到页面组件与 URL；标签切换不能只换标题而内容未同步。
3. **每标签独立状态**：搜索、滚动、筛选、表单草稿、图表周期等都要进 `snapshot`；不能共享一个全局页面实例。
4. **唯一 ID**：由业务层生成稳定 ID，禁止重复；展示标题与内部 ID 分离，多 Home 仍显示 `Home`。
5. **生命周期**：新增时注册玻璃/图表/事件；关闭或路由销毁时在 `onUnmount`、`onClose` 清理，防止监听器和 WebGL/图表实例泄漏。
6. **关闭策略**：接入路由后，关闭标签要同步清理 URL、缓存和异步请求；激活标签切换用 `beforeSelect` 拦截未保存变更（如需要）。
7. **空状态**：最后一个标签关闭时由 `onEmpty` 创建 Home 或进入明确空态，不能留下无内容、无标签的白屏。
8. **持久化**：刷新恢复标签顺序、激活项和快照尚未实现；需要真实存储方案后再加，并区分隐私数据。
9. **权限与后端**：设备命令、统计查询、账户权限等必须有真实 API 契约；标签层只负责导航和状态，不伪造业务结果。
10. **回归**：保留现有 `node tests/verify-home.cjs`，并新增真实鼠标坐标的连续关闭、路由恢复、主题和键盘用例。

## 10. 推荐回归用例

- 初始只有 `home-1`，没有 Plants 占位。
- 连续点击 Add 创建多个 Home，标题都为 `Home`，宽度不超过 180px。
- 达到溢出阈值后标签条可横向滚动，Add 仍在最后。
- 标签已占满可用宽度时点击 Add，加号位置从首帧到动画结束不变；未占满时只向右连续移动，不得左移回弹。
- 侧栏点击不新增标签，只更新当前标签内容。
- 关闭激活标签后优先选中右侧；关闭最后一个后恢复 Home。
- 压缩状态下，指针不动连续关闭两个标签，第二个 X 位于原指针位置。
- 指针移出后宽度恢复自适应，Add 位置连续。
- 长标题出现省略号，hover 320ms 后显示完整 tooltip。
- 中性图标选中时为纯白（深色）/主墨色（浅色），彩色图标不变灰。
- X hover 使用共享 hover 时长渐入渐出，无异常描边；focus 状态可见且符合主题。
- 浅色、深色、减少动态效果下均可用，阴影未被裁切。
