# 更新记录

## 2026-10-22

### 全屏搜索

- 浅色模式降低全屏搜索遮罩不透明度与背景模糊，保留页面轮廓，不再变成平整灰面。
- 收敛浅色结果卡片的黑色投影和外沿，避免读成厚重黑底；深色材质保持不变。
- 全屏搜索与首页内联搜索共用同一份默认提示文字，不再分别维护。

### 动效

- 缩短全屏搜索退场：结果面板与搜索框各 `180ms`，错落 `40ms`。
- 背景遮罩延后 `70ms`、以 `490ms` 分段化开，内容退完后才明显变清晰，尾段不再突然消失。
- 保留已确认的 `980ms` 进场节奏；退场使用独立错落 token，不反向影响进场。

### 范围

- 本次只调整首页全屏搜索的材质、文案共享与动效节奏。
- 未新增页面路由、后端能力或真实业务数据。

### 验证

- `npm run check` 通过。
- `npm run build:site:public` 通过，产物 `dist/`，共 179 个文件。
- `verify-search`、`verify-responsive`、`verify-glass`、`verify-floating-surfaces`、`verify-theme`、`verify-foundations`、`verify-components`、`verify-motion` 通过。
- 已知既有问题：`verify-home.cjs` 的账户箭头颜色断言只等待 `320ms`，而共享颜色过渡为 `360ms`，会读到中间色；与本轮搜索改动无关。