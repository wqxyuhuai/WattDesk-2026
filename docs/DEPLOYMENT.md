# 发布与部署

更新：2026-10-29。适用于当前设计预览。构建行为以本文件、`design-preview/wrangler.jsonc` 与 `design-preview/scripts/build-site.cjs` 为准。

## 线上入口

- 预览地址：<https://wattdesk-preview.carlwang.cn/>
- 仓库：<https://github.com/wqxyuhuai/WattDesk-2026>（默认分支 `master`）
- 发布方式：本地提交并推送 → Cloudflare 自动构建部署。**不做自动发布**，由维护者手动 push 触发。

## Cloudflare 配置

| 项目 | 值 |
|---|---|
| 平台 | Cloudflare Workers（仅静态资源） |
| 项目名 | `wattdesk-2026` |
| Git 仓库 | `wqxyuhuai/WattDesk-2026` |
| 生产分支 | `master` |
| 根目录 | `/design-preview` |
| 构建命令 | `npm run build:site:public` |
| 部署命令 | `npx wrangler deploy --assets=./dist --compatibility-date=<date>` |
| 自定义域名 | `wattdesk-preview.carlwang.cn` |

构建产物写入 `design-preview/dist/`，**不入库**。

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

- 现象：`npm run build:site:public` 在 Cloudflare 内成功，但随后创建 Worker 版本失败；GitHub check 最终显示失败。
- 根因：`_redirects` 将 `/plants` 等 SPA 路径以 `200` 重写到 `/index.html`。新版 Workers 识别到 HTML 后缀归一化可能再次触发该规则，返回错误 `100324: Infinite loop detected`。
- 修复：深链接改用 `wrangler.jsonc` 中 `assets.not_found_handling: "single-page-application"`；`_redirects` 只保留 `/`、`/home.html`、`/index.html` 到 `/home` 的规范跳转。
- 防回归：`tests/verify-build-config.cjs` 检查 Worker 名称、SPA 回退配置和生成后的 `_redirects`，禁止重新加入 `/index.html 200` 代理。以后遇到“Build completed 但 Deploy failed”，先查看 Deploy 日志中的错误码，不把它误判为前端构建失败。

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

- 线上是设计预览：URL 路由与深链接已接入，但没有后端、登录权限或实时数据；统计数字为设计稿快照，Plant 详情为占位。
- Git 历史仍保留 2026-10-21 之前提交的测试截图与构建产物，取消跟踪不会让仓库体积立刻下降；如需瘦身须改写历史，风险高，暂不做。
- 构建产物和 `_headers` / `_redirects` 由脚本生成，不手改 `dist/`。
