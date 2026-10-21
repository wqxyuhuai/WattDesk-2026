# WattDesk

当前交付是首页设计预览，使用原生 HTML、CSS 和 JavaScript。深浅主题、玻璃、字体、圆角及控件反馈共用一套基础；尚未接入其他页面路由或业务后端。

```powershell
cd design-preview
npm run dev
```

打开 [本地首页](http://127.0.0.1:4173/home.html?glass=figma)。运行网页无需安装第三方依赖。检查环境见 [运行说明](./design-preview/README.md)。

## 开发与新对话阅读入口

先读 [AGENTS.md](./AGENTS.md) → [全站设计与交互规范](./DESIGN-SYSTEM.md) → [项目当前状态](./docs/PROJECT-STATUS.md)。这些文件包含继续开发所需的规则与边界，不依赖聊天记录。

| 文档 | 用途 |
|---|---|
| [架构与扩展约定](./docs/ARCHITECTURE.md) | 目录职责、数据边界、增加页面的方法 |
| [组件手册](./docs/COMPONENTS.md) | 实际 API、颜色、文字、玻璃、卡片等的用法 |
| [用户要求记录](./docs/USER-REQUIREMENTS.md) | 明确要求、最新修正与不能回退的事项 |
| [顶栏标签规范](./docs/TOP-BAR-TABS.md) | 功能、API、交互、可访问性与真实接入清单 |
| [经验与防回归](./docs/LESSONS-LEARNED.md) | 已发生问题、根因、修复与开工检查 |
| [整理记录](./docs/CLEANUP.md) | 清理范围、备份与验证结果 |

历史业务规划在 `docs/history/`，不作为当前视觉值或已实现功能的依据。
