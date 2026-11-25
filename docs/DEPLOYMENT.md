# 发布与部署

更新：2026-11-25。适用于当前设计预览。构建行为以本文件、`design-preview/wrangler.jsonc`、`design-preview/wrangler.inverter-preview.jsonc` 与 `design-preview/scripts/build-site.cjs` 为准。

## 默认发布策略

- 默认所有后续修改都是 **local-only**：允许本地编辑、本地提交、测试、构建和截图，但不得自动执行 `git push`、Cloudflare 部署或独立 Worker 更新。
- 只有用户明确说“发布”“上线”“推送到线上”等发布指令时，才允许推送 `master` 和更新线上。
- 用户未明确发布时，现有多端继续提供上一次已发布版本；本地新改动必须明确标记为未发布。

## 线上入口

- 预览地址：<https://wattdesk-preview.carlwang.cn/>
- Inverter settings 独立预览：<https://inverter.carlwang.cn/settings>。
- Initialization 20 kW：<https://inverter.carlwang.cn/setup/20kw>。
- Initialization 50 kW：<https://inverter.carlwang.cn/setup/50kw>。
- 独立 Worker `wattdesk-inverter-preview` 只代理 `/settings`、`/setup/20kw`、
  `/setup/50kw`、`/src/*` 和 `/home-assets/*` 到主预览；根 `/` 只为
  `/settings` 提供 `302`，其他页面路径返回 404。页面代码更新并重新部署主站后
  会同步更新。
- 仓库：<https://github.com/wqxyuhuai/WattDesk-2026>（默认分支 `master`）
- 主站发布方式：本地提交并推送 `master` → Cloudflare 自动构建部署。Push 是发布动作，只能在用户明确授权后执行。独立设置 Worker 不从主站构建产物复制页面；其源码随仓库版本化，代理策略变化时仍需在明确发布指令下单独部署。

## Cloudflare 配置

| 项目 | 值 |
|---|---|
| 平台 | Cloudflare Workers（主站静态资源 + 独立设置代理） |
| 项目名 | `wattdesk-2026` |
| Git 仓库 | `wqxyuhuai/WattDesk-2026` |
| 生产分支 | `master` |
| 根目录 | `/design-preview` |
| 构建命令 | `npm run build:site:public` |
| 部署命令 | `npx wrangler@4.152.0 deploy` |
| 自定义域名 | `wattdesk-preview.carlwang.cn` |
| Inverter 独立域名 | `inverter.carlwang.cn` |
| Inverter 独立 Worker | `wattdesk-inverter-preview` |

构建产物写入 `design-preview/dist/`，**不入库**。

独立设置 Worker 源码和本地 Wrangler 配置分别为
`design-preview/deploy/inverter-preview-worker.js` 与
`design-preview/wrangler.inverter-preview.jsonc`。它不复制设置或初始化页面代码，
只做域名门禁和反向代理；主站页面发布后无需再次部署独立 Worker。

### Inverter settings 独立预览发布规则

- 公开入口固定为 `https://inverter.carlwang.cn/settings`、
  `https://inverter.carlwang.cn/setup/20kw` 和
  `https://inverter.carlwang.cn/setup/50kw`；`https://inverter.carlwang.cn/`
  只可 `302` 到 `/settings`，不得让独立域名返回 WattDesk Home、Plants 或其他
  页面。
- Worker 只允许 `/settings`、`/setup/20kw`、`/setup/50kw`、`/src/*`、
  `/home-assets/*` 和独立 `robots.txt`；其他路径返回 `404`。禁止添加通用 `/`
  代理、`/setup/*` 通配、全站 SPA 回退或任何能访问主站页面的通配允许规则。
- 独立页面必须复用主站 `src/pages/inverter-settings/` 中的设置与初始化模块，
  禁止复制一份预览源码。Worker 只负责反向代理；主站发布后页面内容自动更新。
  Worker 的域名、路径白名单、目标路径或代理逻辑改变时，必须单独重新部署
  Worker。
- 不得重新加入 `wattdesk-preview` 长链接分享入口、`/inverter` 应用别名或
  `www.carlwang.cn/inverter` 备用路由；这些旧入口已经由用户明确删除，线上
  路由也必须保持为空。
- standalone 页面默认浅色，底部主题按钮距视口底边 `32px`，使用共享
  `createStandardButton()`；主题偏好只存 `wattdesk-standalone-theme` 的
  标签页 `sessionStorage`，不得改变主站默认主题或读取主站深色偏好作为默认。
- 发布后必须验证：`https://inverter.carlwang.cn/` 一次 302 到 `/settings` 且
  最终 200；`/settings`、`/setup/20kw`、`/setup/50kw` 返回 200；该域名
  `/setup`、`/setup/30kw`、`/home`、`/plants` 返回 404；
  `https://www.carlwang.cn/inverter` 返回 404；设置页可见、侧栏与关闭 X
  不显示；两个初始化页分别加载 20 kW / 50 kW 插画；首次打开为浅色，主题按钮
  可双向切换；桌面和窄屏无横向溢出。

### Mapbox 公开 Token

- Mapbox Static Images API 需要 Public Access Token。通过构建环境变量 `WATTDESK_MAPBOX_TOKEN` 注入，不在 `home.html`、源码或本文中写真实 Token。
- 本地开发可在启动 `npm run dev` 前设置该环境变量；正式环境在 Cloudflare 构建环境配置同名变量。构建脚本会把它写入 `mapbox-access-token` meta，页面再按当前 Site details 最终规范加载 `dark-v11 / light-v11` 对应主题底图。
- 本地也可用 `?mapboxToken=pk...` 做一次性引导；组件只接受 `localhost / 127.0.0.1`，读取后立即用 `history.replaceState` 从地址栏移除，并尝试写入本地调试存储。正式域名不读取该查询参数。
- 未配置 Token 时地图保持空白，不显示占位地图或伪造底图；Secret Token 不得用于客户端。

`design-preview/dist-public/` 是早期手动构建的残留，从未被 Cloudflare 部署，已于 2026-10-21 从仓库移除；不要再创建同名入库目录。

## 本地发布流程

1. 本地验证：`cd design-preview`，运行 `npm run check` 与 `npm test`（需要 Playwright + Chrome）。
2. 构建自检：`npm run build:site:public`，产物在 `dist/`，可本地起静态服务确认。
3. 在 GitHub Desktop 提交并 Push 到 `master`。
4. 等 Cloudflare 构建完成（通常 1 分钟内），按“发布后验证”检查。
5. 失败时在 Cloudflare 部署列表查看 Build 日志；回滚用 GitHub 上的 Revert，不要手改线上文件。

### GitHub Desktop 发布

可以，但这里的“发布”本质是提交并推送 `master`，不是 GitHub Desktop 自己执行部署：

1. 确认当前分支是 `master`，并已包含本地提交。
2. 在 GitHub Desktop 点击 `Push origin`；只有推送成功且 GitHub 远端 `master` 更新，Cloudflare 才会构建。
3. 推送完成后打开 GitHub 提交旁的 Cloudflare check。`Build command completed` 只代表代码构建成功，必须等到 check 变为成功才表示部署完成。
4. 按“发布后验证”检查首页、Plants、详情深链接和缓存头。

不要在功能分支上点击 `Publish branch` 代替发布；生产触发分支固定为 `master`。只在 Cloudflare 自身故障导致 Git 构建无法运行时，才使用 Dashboard 的临时手动部署，并在恢复后重新触发一次 `master` 构建。手动部署不替代版本库记录。

### 2026-10-29 发布故障复盘

- 现象：`npm run build:site:public` 在 Cloudflare 内成功，但 Deploy 阶段失败；GitHub check 最终显示失败。
- 第一处根因：`_redirects` 将 `/plants` 等 SPA 路径以 `200` 重写到 `/index.html`。新版 Workers 识别到 HTML 后缀归一化可能再次触发该规则，返回错误 `100324: Infinite loop detected`。
- 第二处根因：重定向修复后，自动构建仍在 Deploy 阶段失败。部署命令被临时加入了 Wrangler 4.152 不支持的 `--log-level=debug`，日志报 `Unknown arguments: log-level, logLevel`。
- 修复：深链接改用 `wrangler.jsonc` 中 `assets.not_found_handling: "single-page-application"`；`_redirects` 只保留 `/`、`/home.html`、`/index.html` 到 `/home` 的规范跳转。Deploy 命令只保留 `npx wrangler@4.152.0 deploy`，名称、兼容日期和资源目录全部从 `wrangler.jsonc` 读取。
- 防回归：`tests/verify-build-config.cjs` 检查 Worker 名称、SPA 回退配置和生成后的 `_redirects`，禁止重新加入 `/index.html 200` 代理。部署命令不得添加未写入项目配置的临时参数，尤其是调试参数；修改后必须先核对当前固定 Wrangler 版本的命令帮助。以后遇到“Build completed 但 Deploy failed”，先查看 Deploy 日志和错误码，不把它误判为前端构建失败，也不能把“构建完成”当成发布成功。

## 产物与仓库边界

- **入库**：`src/`、`home.html`、`home-assets/`、`design/figma/`（生成源数据）、`scripts/`、`tests/verify-*`、`tests/runtime.cjs`、`tests/run.cjs`、`tests/fixtures/`、`templates/`、文档。
- **不入库**：`dist/`、`design-preview/tests/output/`、`design-preview/output/`、根目录 `tests/`、根目录 `output/`、`_*.cjs` / `_*.py` 一次性探针、`*.patch`、部署日志（`deploy-result.json`、`deploy-lines.txt`）、`dist-server.cjs`、`annotations.json`、`.env*`。
- 完整规则见根目录 `.gitignore`。已跟踪文件需要 `git rm --cached` 才会停止同步，改 `.gitignore` 本身不删除历史文件。

## 运行时行为

- `wrangler deploy --assets` 默认按 `html_handling: auto-trailing-slash` 处理 HTML：`/home.html` 会 307 到 `/home`，`/home` 直接返回 `home.html`。
- 因此 `_redirects` **不能**写 `/home /home.html`，否则与上面的 307 形成死循环。构建脚本只生成 `/home.html /home`、`/index.html /home` 与 `/ /home` 三条规范规则。
- 客户端路由由 `wrangler.jsonc` 的 `assets.not_found_handling: "single-page-application"` 回退到 SPA 外壳；`_redirects` 只保留 `/`、`/home.html`、`/index.html` 到 `/home` 的规范规则。不得再把业务路径以 `200` 代理到 `/index.html`，新版 Workers 会判定该目标可能再次触发 HTML 后缀归一化并形成死循环。
- `home.html` / `index.html` 使用 `<base href="/">`，多级详情路径 `/plants/p02` 下的相对脚本与素材仍从站点根解析。
- `_headers` 对 `/*.html`、`/src/*`、`/home-assets/*` 以及深链接路由统一使用 `max-age=0, must-revalidate`。运行资源文件名没有 hash，长缓存会在部署后造成 HTML 与 JS/CSS 版本错配。
- `robots.txt` 由构建模式决定：`--public` 输出 `Allow: /`；不带 public 时输出 `Disallow: /` 并在 HTML 加 `noindex`。当前线上允许索引；如需隐藏预览站，改用预览构建或加 Cloudflare Access。

## 发布后验证

```powershell
curl.exe -sS -o NUL -w "%{http_code} %{redirect_url}`n" --max-redirs 0 https://wattdesk-preview.carlwang.cn/
curl.exe -sS -o NUL -w "%{http_code} %{redirect_url}`n" --max-redirs 0 https://wattdesk-preview.carlwang.cn/home
curl.exe -sS -o NUL -w "%{http_code} %{redirect_url}`n" --max-redirs 0 https://wattdesk-preview.carlwang.cn/home.html
curl.exe -sS -o NUL -w "%{http_code} %{redirect_url}`n" --max-redirs 0 https://wattdesk-preview.carlwang.cn/plants
curl.exe -sS -o NUL -w "%{http_code} %{redirect_url}`n" --max-redirs 0 https://wattdesk-preview.carlwang.cn/plants/p02
curl.exe -sSI https://wattdesk-preview.carlwang.cn/src/foundations/tokens.css | Select-String 'cache-control'
```

期望：`/` 与 `/home` 返回 200；`/home.html` 一次 307 到 `/home` 后 200，不循环；直接打开 `/plants`、`/plants/p02` 返回 200 的 SPA 外壳，刷新后页面不回到 Home；缓存头为 `max-age=0`。

## 已知限制

- 线上是设计预览：URL 路由、深链接和本地交互已接入，但没有后端、登录权限、真实持久化或硬件控制；统计与设备数据来自本地确定性样例，不能视为生产数据。
- Git 历史仍保留 2026-10-21 之前提交的测试截图与构建产物，取消跟踪不会让仓库体积立刻下降；如需瘦身须改写历史，风险高，暂不做。
- 构建产物和 `_headers` / `_redirects` 由脚本生成，不手改 `dist/`。
