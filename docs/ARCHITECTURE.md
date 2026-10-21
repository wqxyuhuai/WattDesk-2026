# 架构与扩展约定

更新：2026-10-16。当前阶段采用原生网页，不引入新的 UI 框架、状态库或构建链。

```text
Source/
  AGENTS.md / DESIGN-SYSTEM.md / README.md
  docs/                         架构、组件、要求、状态、整理记录
    history/                    历史业务规划，非当前视觉标准
  design-preview/
    home.html                   保留的首页 URL
    server.js                   本地静态预览服务
    src/
      shared.css                全站共享样式入口
      foundations/              tokens、生成色/字、主题、动效、几何、基础字体
      components/               控件、搜索、头像、玻璃、卡片、折叠、浮层
      layouts/                  app-shell：侧栏与顶栏的组合
      pages/home/               首页装配、专用场景适配、局部 CSS
        data/                   生成的精简节点、素材绑定、主题映射
    home-assets/                实际使用的本地 SVG / 字体
    design/figma/               完整 Figma 来源归档
    scripts/                    生成和静态检查
    templates/                  新页面起始模板，非业务页面
    tests/fixtures/             固定回归基线
    tests/output/               检查产物，可清理
```

## 职责边界

依赖方向为页面 → layout / component → foundation。共享组件不能反向导入 `pages/home` 或依赖具体 Figma 节点 ID。`home-assets` 名称保留以稳定原素材 URL，实际是全站共用资产。

- 基础：`tokens.css` 的语义颜色引用按 Figma 变量 ID 生成的 `colors.css`；文字绑定完整命名 style。材质和共享投影由各自组件入口控制。
- 组件：共享外观、状态和行为契约；内容、尺寸、半径与业务操作由调用方提供，不能为了“统一”改变原稿几何。
- 外壳：`layouts/app-shell.js` 组合组件。当前菜单以首页确认稿为准；后续按真实需求扩展配置，不提前制造不存在的路由。
- 首页：`scene.js` 只适配当前 Figma 绝对坐标提取，不是全站布局引擎。新页面使用语义 DOM 和适合内容的布局，不复制 scene JSON。
- 交互：`pages/home/index.js` 装配本页搜索、日期、图表与预览反馈，不承担全站组件实现。

## 增加页面

1. 阅读规则、当前状态及本次需求，确认正确 Figma 节点和主题。
2. 从 `templates/page.html` 复制入口，在 `src/pages/<名称>/` 写局部 CSS / JS。共享样式通过 `src/shared.css` 加载。
3. 复用外壳和组件 API，只在页面写内容布局及业务装配，不复制材质、字体、图标和状态体系。
4. 已有 Figma style 必须绑定；原本写死的设计值可保留。新增共享参数需有实际复用依据。
5. 页面状态先局部维护；多个页面确有共享数据后再建立服务/状态模块，以真实 API 契约为依据。不预建假接口、假权限和演示业务能力。
6. 第二个真实路由出现时再确定路由、URL、应用生命周期。组件卸载应调用其清理函数；当前不是 SPA。
7. 验证深浅主题、控件状态、键盘及减少动态效果，更新当前状态和共享规范。

## 来源与资产

完整 `scene-source.json` 保留 509 个节点用于溯源，生成运行数据仅保留 328 个；`selectHomeScene()` 还会排除旧外壳、重复光学层、已删除入口及已永久删除的 Period metadata 整枝，当前实际渲染 326 个。原始快照不能反向覆盖当前语义组件。

新增素材登记 Figma 来源并保存本地文件。图标优先注册在 `components/icons.js`，主题差异明确绑定各主题资产，不按 RGB 猜测语义。删除前运行引用检查并核对动态引用。

`.target-*` / `.node` 是当前还原的内部 CSS 类；新页面调用组件 API，不复制内部 DOM。当前没有真实路由、接口、权限或图表库，这些在需求明确时逐步引入。
