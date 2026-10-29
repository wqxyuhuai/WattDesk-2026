# 站点路由与 URL 规范

更新：2026-10-29。开发入口见 [AGENTS.md](../AGENTS.md)，视觉与组件规则分别见 [DESIGN-SYSTEM.md](../DESIGN-SYSTEM.md) 与 [COMPONENTS.md](./COMPONENTS.md)。

## 1. 当前 URL 表

| 页面 | 规范 URL | 当前内容 |
|---|---|---|
| Home | `/home` | 真实首页 |
| Plants | `/plants` | 本地示例数据列表 |
| 电站详情 | `/plants/:id` | 从列表行或自动建站 `?` 提示中的 `setup` 在新标签打开；详情视觉未立项，当前使用明确的预览占位 |
| Service ticket | `/service` | Coming soon |
| Statistics | `/statistics` | Coming soon |
| Cell balance | `/cell-balance` | Coming soon |
| Module balance | `/module-balance` | Coming soon |
| Device track | `/device-track` | Coming soon |
| Wattsonic Technology | `/organisation` | Coming soon |
| Your teams | `/teams` | Coming soon |
| End users | `/users` | Coming soon |

- `/`、`/home.html`、`/index.html` 统一以 `308` 跳到 `/home`；保留查询参数。
- 页面路径忽略末尾斜杠，客户端会以 `replaceState` 收回规范 URL。
- 未知路径和未知电站 ID 显示 `Page not found` / `Plant not found`，不得静默回到 Home。
- 查询参数原样保留，例如 `/plants?glass=figma`、`/home?annotate=1`。
- 电站详情使用本地数据中的稳定 `id`（如 `p02`），不按名称或数组下标生成 URL。详情页接入真实接口后沿用同一 URL 契约，接口 ID 变化必须视为 URL 变更。

## 2. 运行时规则

- `design-preview/src/pages/home/routes.js` 是路由、路径与搜索索引的唯一来源：`ROUTE_CATALOG[route].path` 定义可访问路径，`routeFromPath()` 负责路径到 `{route, params}`，`pathForRoute()` 负责反向生成。
- `workspace.js` 把**当前激活标签**的 `{route, params}` 镜像到地址栏：新导航用 `pushState`，初始规范化、标签内前进/后退用 `replaceState`，浏览器 `popstate` 时按 URL 恢复当前标签内容。
- Plants 列表行和自动建站 `?` 提示中的 `setup` 使用 `openRouteInNewTab()` 新建并激活详情标签，原列表标签及其历史保留；自动建站电站的标签标题为 `?`。`Back to Plants` 优先激活来源列表标签并关闭当前详情标签。无来源列表标签时回退到 `openRoute("plants")`，在唯一当前标签内返回。侧栏与首页快捷入口仍使用 `openRoute()` 在当前标签内导航。
- 切换工作区标签会更新地址栏到该标签自己的路由；每个标签仍保留自己的滚动态、搜索、周期和标签内历史。
- 页面标题随路由更新：`WattDesk · Home`、`WattDesk · Plants`、`WattDesk · Silvio Bräuer`。未知路由为 `WattDesk · Page not found`。
- 路由变化必须先关闭活动浮层（菜单、筛选、日期、搜索等），不把浮层带到新页面。
- 新增导航一律调用 `openRoute(route, {params})`，不要直接在页面里拼 URL 或调用 `history.pushState`；只有路由层可以写浏览器历史。
- 不使用 hash 路由；URL 必须是可直接分享、刷新和收藏的普通路径。

## 3. 深链接与部署

浏览器直接打开 `/plants/p02` 时，静态资源层必须返回 SPA 外壳，再由客户端读取路径：

- 本地预览：`design-preview/server.js` 对 `/home`、`/plants`、`/plants/:id` 及上表其余路径返回 `home.html`。
- 线上：`wrangler.jsonc` 使用 Workers Assets 的 `single-page-application` 未命中回退，把深链接返回给客户端路由；`scripts/build-site.cjs` 生成的 `_redirects` 只处理 `/`、`/home.html`、`/index.html` 到 `/home` 的规范跳转。不要恢复 `200` 代理到 `/index.html` 的规则，否则会被新版部署校验判定为循环。
- `/home` 由 Cloudflare 静态资源层从 `home.html` 提供；不得添加 `/home /home.html` 规则，否则会与自动重定向形成循环。
- 不使用 `/* /index.html 200` 这类全站兜底，避免把 `/src/*`、`/home-assets/*` 等真实资源也代理成 HTML。
- HTML 使用 `<base href="/">`，保证 `/plants/p02` 这类多级路径下的相对脚本、样式和素材仍从站点根解析。
- 深链接的 HTML 与页面资源都使用 `max-age=0, must-revalidate`，避免部署后 URL 已更新但 JS/CSS 仍是旧版。

## 4. 新增页面或详情路由

1. 在 `routes.js` 的 `ROUTE_CATALOG` 增加 `path`，并确认侧栏/搜索是否有入口。
2. 在 `server.js` 的 `canonicalRoutes` 与 `build-site.cjs` 的 `appRoutes` 同步路径。
3. 页面导航统一走 `openRoute`；详情类路由把稳定 ID 放在 `params`，不要把 ID 拼进页面内部状态。
4. 在 `tests/verify-routing.cjs` 增加直接打开、刷新、浏览器后退和标题断言。
5. 更新本文件、[PROJECT-STATUS.md](./PROJECT-STATUS.md) 和 [ARCHITECTURE.md](./ARCHITECTURE.md)。

## 5. 验证

```powershell
cd design-preview
npm run check
node tests/verify-routing.cjs
npm test
npm run build:site:public
```

必须实际验证：从 `/` 进入 `/home`；在 `/plants` 刷新仍在 Plants；打开 `/plants/p02` 后刷新仍是同一电站；浏览器后退回到列表；未知路径不回到 Home；构建产物 `_redirects` 包含对应代理规则。
