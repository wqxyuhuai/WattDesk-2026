# 发布与部署

更新：2026-10-21。适用于当前首页设计预览。构建行为以本文件与 `design-preview/scripts/build-site.cjs` 为准。

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

## 产物与仓库边界

- **入库**：`src/`、`home.html`、`home-assets/`、`design/figma/`（生成源数据）、`scripts/`、`tests/verify-*`、`tests/runtime.cjs`、`tests/run.cjs`、`tests/fixtures/`、`templates/`、文档。
- **不入库**：`dist/`、`design-preview/tests/output/`、`design-preview/output/`、根目录 `tests/`、根目录 `output/`、`_*.cjs` / `_*.py` 一次性探针、`*.patch`、部署日志（`deploy-result.json`、`deploy-lines.txt`）、`dist-server.cjs`、`annotations.json`、`.env*`。
- 完整规则见根目录 `.gitignore`。已跟踪文件需要 `git rm --cached` 才会停止同步，改 `.gitignore` 本身不删除历史文件。

## 运行时行为

- `wrangler deploy --assets` 默认按 `html_handling: auto-trailing-slash` 处理 HTML：`/home.html` 会 307 到 `/home`，`/home` 直接返回 `home.html`。
- 因此 `_redirects` **不能**再写 `/home /home.html`，否则与上面的 307 形成死循环。当前 `_redirects` 只有一行注释，没有规则。
- `_headers` 对 `/*.html`、`/src/*`、`/home-assets/*` 统一使用 `max-age=0, must-revalidate`。运行资源文件名没有 hash，长缓存会在部署后造成 HTML 与 JS/CSS 版本错配。
- `robots.txt` 由构建模式决定：`--public` 输出 `Allow: /`；不带 public 时输出 `Disallow: /` 并在 HTML 加 `noindex`。当前线上允许索引；如需隐藏预览站，改用预览构建或加 Cloudflare Access。

## 发布后验证

```powershell
curl.exe -sS -o NUL -w "%{http_code} %{redirect_url}`n" --max-redirs 0 https://wattdesk-preview.carlwang.cn/
curl.exe -sS -o NUL -w "%{http_code} %{redirect_url}`n" --max-redirs 0 https://wattdesk-preview.carlwang.cn/home
curl.exe -sS -o NUL -w "%{http_code} %{redirect_url}`n" --max-redirs 0 https://wattdesk-preview.carlwang.cn/home.html
curl.exe -sSI https://wattdesk-preview.carlwang.cn/src/foundations/tokens.css | Select-String 'cache-control'
```

期望：`/` 与 `/home` 返回 200；`/home.html` 一次 307 到 `/home` 后 200，不循环；缓存头为 `max-age=0`。

## 已知限制

- 线上是设计预览：没有后端、真实路由、登录权限或实时数据，统计数字为设计稿快照。
- Git 历史仍保留 2026-10-21 之前提交的测试截图与构建产物，取消跟踪不会让仓库体积立刻下降；如需瘦身须改写历史，风险高，暂不做。
- 构建产物和 `_headers` / `_redirects` 由脚本生成，不手改 `dist/`。
