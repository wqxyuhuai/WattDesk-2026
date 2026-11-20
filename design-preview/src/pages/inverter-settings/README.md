# Inverter settings

完整、有效的页面契约已集中到
[`docs/INVERTER-SETTINGS.md`](../../../../docs/INVERTER-SETTINGS.md)。

本目录只保留与该契约对应的实现、测试和审计资料：

- [`COPY-AUDIT.md`](./COPY-AUDIT.md)：文案改前/改后及待决项。
- [`FUNCTIONAL-AUDIT.md`](./FUNCTIONAL-AUDIT.md)：功能差异、修复和未接边界。
- [`SOURCE-MANIFEST.md`](./SOURCE-MANIFEST.md)：本地来源包与图标哈希。
- [`settings-options.js`](./settings-options.js)：预览枚举的唯一来源。

修改页面行为、视觉规则或回归断言时，只更新 `docs/INVERTER-SETTINGS.md`，并在
相应审计文件中追加可追溯记录；不要让本 README 再形成第二套规则。
