# 首页运行与检查

当前唯一业务页面为首页。需要 Node.js 22 或更新版本，运行网页没有第三方依赖，不需要 npm install。

```powershell
npm run dev
```

打开 [Home](http://127.0.0.1:4173/home.html?glass=figma)，根路径 / 也打开首页。监听 127.0.0.1:4173，可用 WATTDESK_PREVIEW_PORT 改端口。正式材质只保留 figma，原首页 URL 不变。

## 页面批注

需要指出具体哪个元素要改时，用本地批注模式：

1. 打开 <http://127.0.0.1:4173/home.html?glass=figma&annotate=1>（`npm run dev` 保持运行）。
2. 点右下角「批注」，鼠标移到元素上出现高亮框，单击即可写意见；`Alt+↑/↓` 或面板里的「上一级 / 下一级」切换要批注的层级。
3. `Ctrl/⌘+Enter` 保存，页面上留下编号图钉；再点图钉可以修改或删除。
4. 批注按页面写入本目录 `annotations.json`，同时存在浏览器 `localStorage`；「复制」可导出纯文本清单。

批注层只在 URL 带 `?annotate=1` 时由 `server.js` 注入：普通页面、`npm run test:visual` 截图和 `npm run build:site` 产物都不包含它。`annotations.json` 是本地反馈记录，已加入 `.gitignore`，不代表业务数据。

## 常用命令

```powershell
npm run check         # 当前 JS 语法
npm run sync          # 生成精简场景、双主题颜色和文字 styles
npm run audit:assets  # 缺失/闲置运行资产
npm test              # 首页、玻璃、主题、字体/圆角和组件行为
npm run test:visual   # 与整理前双主题 × 双尺寸截图比较
```

浏览器检查前保持预览服务运行。检查需要 Playwright 与 Chrome/Chromium，不会自动下载浏览器。tests/runtime.cjs 优先读取 WATTDESK_PLAYWRIGHT 指定模块，再尝试可解析的 playwright，最后使用当前 Codex 桌面依赖；WATTDESK_BROWSER 指定浏览器，否则查找 Windows 系统 Chrome 或使用 Playwright 的既有浏览器。WATTDESK_PREVIEW_URL 可指定完整首页 URL。

像素比对还需 Python + Pillow，WATTDESK_PYTHON 可指定 Python。环境缺失应如实报告，不能将跳过检查记为通过。运行产物在 tests/output/，固定基线在 tests/fixtures/；不要为消除失败直接覆盖基线。

## 发布

线上 <https://wattdesk-preview.carlwang.cn/> 由 Cloudflare 从仓库 `master` 构建：构建命令 `npm run build:site:public`，部署命令 `npx wrangler deploy --assets=./dist`，根目录 `/design-preview`。

```powershell
npm run build:site:public   # 本地构建到 dist/，仅用于自检，不入库
```

提交并 Push 后 Cloudflare 自动重建；完整流程、产物边界与发布后验证见 [发布与部署](../docs/DEPLOYMENT.md)。不要手改 `dist/`，也不要把 `dist/` 或 `dist-public/` 提交进仓库。

## 来源和入口

- design/figma/：原始变量、文字 style、玻璃分层与完整场景，不是第二套运行配置。
- src/foundations/colors.css、type.css：生成文件，不手改。
- src/foundations/tokens.css：语义别名、共享节奏及已确认的控件值。
- src/pages/home/data/：生成的精简场景、素材绑定和主题适配。
- home-assets/：实际使用的本地 Figma SVG / 字体，保留文件名溯源。

更新来源后运行 npm run sync，再检查引用与真实浏览器。Figma 修改不会自动同步到网页。

先读根目录 [开发规则](../AGENTS.md)、[设计规范](../DESIGN-SYSTEM.md)、[当前状态](../docs/PROJECT-STATUS.md)。架构与实际 API 见 [架构](../docs/ARCHITECTURE.md)、[组件手册](../docs/COMPONENTS.md)。
