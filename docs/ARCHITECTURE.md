# 架构与扩展约定

更新：2026-10-23。当前阶段采用原生网页，不引入新的 UI 框架、状态库或构建链。

```text
Source/
  AGENTS.md / DESIGN-SYSTEM.md / README.md
  docs/                         架构、组件、要求、状态、整理记录
    history/                    历史业务规划，非当前视觉标准
  design-preview/
    home.html                   首页 HTML 外壳（/home 与深链接入口）
    server.js                   本地静态预览服务
    src/
      shared.css                全站共享样式入口
      foundations/              tokens、生成色/字、主题、动效、几何、基础字体
      components/               控件、搜索、头像、玻璃、卡片、折叠、浮层
      layouts/                  app-shell：侧栏与顶栏的组合
      pages/home/               首页装配、专用场景适配、局部 CSS
        data/                   生成的精简节点、素材绑定、主题映射、运行期排版投影
    home-assets/                实际使用的本地 SVG / 字体
    design/figma/               完整 Figma 来源归档
    scripts/                    生成和静态检查
    templates/                  新页面起始模板，非业务页面
    tests/fixtures/             固定回归基线
    tests/output/               检查产物，可清理
```

## 职责边界

依赖方向为页面 → layout / component → foundation。共享组件不能反向导入 `pages/home` 或依赖具体 Figma 节点 ID。`home-assets` 名称保留以稳定原素材 URL，实际是全站共用资产。

- 基础：`tokens.css` 的语义颜色引用按 Figma 变量 ID 生成的 `colors.css`；文字绑定完整命名 style。`design/figma/figma-type-source.json` 是带来源元数据的完整归档，`src/pages/home/data/type-runtime.json` 只保留运行所需的 `styles` 与 `rows`，由 `npm run sync:type` 同时生成，页面不直接读取设计归档。`geometry.js` 是连续圆角适配器的唯一启动入口，页面模块显式导入；不再需要 CSS 或独立空壳入口转发。材质和共享投影由各自组件入口控制。
- 组件：共享外观、状态和行为契约；内容、尺寸、半径与业务操作由调用方提供，不能为了“统一”改变原稿几何。
- 外壳：`layouts/app-shell.js` 组合组件，`createAppShell({sidebar,header,workspacePanelId})` 接收页面提供的标签面板 ID，标签通过 `aria-controls` 指向该面板；组件不写死首页节点 ID。尚未提供 `workspacePanelId` 时组件不输出无效的 `aria-controls`。当前菜单以首页确认稿为准；后续按真实需求扩展配置，不提前制造不存在的路由。
- 首页：`scene.js` 只适配当前 Figma 绝对坐标提取，不是全站布局引擎。新页面使用语义 DOM 和适合内容的布局，不复制 scene JSON。
- 交互：`pages/home/index.js` 只做装配；`layout.js` 负责响应式重排，`period.js` 周期与刷新，`search.js` 内联/全屏搜索，`workspace.js` 标签、标签内历史与地址栏同步，`recent-visits.js` 本地最近访问，`routes.js` 是路由路径、`params` 与搜索索引的唯一清单。新增页面照此拆模块，不把业务逻辑堆回 `index.js`。
- URL：`routes.js` 的 `routeFromPath()` / `pathForRoute()` 负责路径与 `{route, params}` 互转；`workspace.js` 只在这里调用 `pushState` / `replaceState`，页面通过 `openRoute()` 导航。深层链接由 `server.js`（本地）与 `scripts/build-site.cjs` 生成的 `_redirects`（线上）返回 SPA 外壳；规则见 [ROUTING.md](./ROUTING.md)。

## 增加页面

1. 阅读规则、当前状态及本次需求，确认正确 Figma 节点和主题。
2. 从 `templates/page.html` 复制入口，在 `src/pages/<名称>/` 写局部 CSS / JS。共享样式通过 `src/shared.css` 加载。
3. 复用外壳和组件 API，只在页面写内容布局及业务装配，不复制材质、字体、图标和状态体系。
4. 已有 Figma style 必须绑定；原本写死的设计值可保留。新增共享参数需有实际复用依据。
5. 页面状态先局部维护；多个页面确有共享数据后再建立服务/状态模块，以真实 API 契约为依据。不预建假接口、假权限和演示业务能力。
6. 在 `routes.js` 登记规范路径，并同步 `server.js` 的 SPA 回退与构建脚本的 `_redirects`；URL、深链接与刷新规则见 [ROUTING.md](./ROUTING.md)。组件卸载应调用其清理函数；应用是原生 SPA，页面模块自行负责挂载/显隐生命周期。
7. 验证深浅主题、控件状态、键盘及减少动态效果，更新当前状态和共享规范。

## 来源与资产

完整 `scene-source.json` 保留 509 个节点用于溯源，生成运行数据仅保留 328 个；`selectHomeScene()` 还会排除旧外壳、重复光学层、已删除入口及已永久删除的 Period metadata 整枝，当前实际渲染 326 个。原始快照不能反向覆盖当前语义组件。

新增素材登记 Figma 来源并保存本地文件。图标优先注册在 `components/icons.js`，主题差异明确绑定各主题资产，不按 RGB 猜测语义。删除前运行引用检查并核对动态引用。

`.target-*` / `.node` 是当前还原的内部 CSS 类；新页面调用组件 API，不复制内部 DOM。URL 路由与深链接已经接入；接口、权限和图表库仍未接入，这些在需求明确时逐步引入。
