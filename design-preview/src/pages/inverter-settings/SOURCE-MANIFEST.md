# Inverter settings source manifests

Source path:

`E:\OneDrive\Design files sync\AI\Proj. WattDesk\资料\逆变器设置更新 261119`

The effective runtime contract is
[`docs/INVERTER-SETTINGS.md`](../../../../docs/INVERTER-SETTINGS.md). This file
only records source provenance and hashes.

| File | Bytes | SHA-256 |
|---|---:|---|
| `00-项目说明.md` | 7470 | `f3f8184c4fb829712fe69fd7c029707ed73cce18e7f931f1af256dd12f4afb87` |
| `固件国别档案问题_20261118.md` | 4431 | `e5de85a10794b3d3d2b377946597d8bd99d2e2ea682b2d018ad650dd2ee227f1` |
| `接入改动.md` | 3032 | `e670d2014c154d815c105b28dc17ede6739f9dc0178276b3b0112b5240705b1b` |
| `逆变器设置-交互原型.html` | 122030 | `be916f97b5846610d6fe9769b032bfa5033b0a4ca543cae4c4b3f5cb49406f3d` |
| `逆变器设置重构方案_20261117.md` | 12303 | `1484990ad0d18054f949808e5ed22d7725e2f3bc340079af8da3d1dfd649bc4e` |
| `ActivePowerControl.vue` | 7828 | `1e7913c75a8d74ed3faaf37ebaa36f5f5a35309d197eb8262b63f02d85998820` |
| `DESIGN.md` | 18553 | `19d9927053066259143d2207f377584670ead0cd0cff6fd8e164fdd5fc42d5a7` |
| `GRID-AUDIT-20261118.md` | 13510 | `e6d666d12a2f640030883c8f3b00a39af92c8b3d969697d9e5d8bac02d22e0f4` |
| `GRID-PROFILES.md` | 15360 | `b11180e4644f150f646be3eed91c321fbeac1b726bdda6cec19c9d9116af3653` |

## 2026-11-20 incremental package

Source path:

`E:\OneDrive\Design files sync\AI\Proj. WattDesk\资料\逆变器设置更新 261120`

| File | Bytes | SHA-256 |
|---|---:|---|
| `更新说明.txt` | 1423 | `9ad09e4da70f35ad712568827892b7df7eefa5cb73dd2b1c6aae2a05ff58f3d4` |
| `逆变器设置-交互原型_v1120.html` | 122548 | `d533f307123bdab3f99dc42cf74ca057fba350f301ebaf795f6c45e990665267` |

This package is incremental: it adds `limits.basis` and the `Limit basis`
export row only. The other 1119 source files remain the base reference and are
not superseded by this package.

The runtime `grid-profiles.js` data was checked against the complete embedded
`GRID_PROFILES` block of the prototype. The source and runtime objects contain
the same 18 profiles and compare deeply equal.

## Settings icon package

Source path:

`C:\Users\Administrator\Desktop\ICON`

The 20 supplied SVGs are retained as shape-only masks in the shared runtime
library at `home-assets/icons/settings/`. File mapping, byte counts and SHA-256
hashes are recorded in `design/inverter-settings/settings-icons-source.json`.
Runtime colour is never taken from the source SVG; navigation and mode controls
apply the current WattDesk semantic colour.

The separately supplied `check.svg` is normalized to
`home-assets/icons/settings/check-circle.svg`: the filled circle remains mask
alpha and the check is a transparent negative cutout, so light mode renders
primary black and dark mode primary white without source-file colour leakage.

