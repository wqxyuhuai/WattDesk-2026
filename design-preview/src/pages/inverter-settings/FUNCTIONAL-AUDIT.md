# Inverter settings functional audit

Updated: 2026-11-20

Baseline:

`E:\OneDrive\Design files sync\AI\Proj. WattDesk\资料\逆变器设置更新 261119`

The final 2026-11-19 interaction prototype is the functional reference. Later,
explicit user decisions still override it, including the editable percentage
based Economic Schedule, bounded MPPT interval choices, four-digit device
Check code, live-aligned labels, relative-time rendering and page-scoped save.
The effective page contract lives in
[`docs/INVERTER-SETTINGS.md`](../../../../docs/INVERTER-SETTINGS.md); this file
records functional evidence, fixed issues and remaining integration boundaries.

## Verified consistent

| Area | Result |
|---|---|
| Main-page inventory | 15 renderers match the prototype |
| Grid subpage inventory | 8 renderers match the prototype |
| Grid profile data | All 18 profiles match source by key, order and value |
| Profile visibility | P(U), F-P, LVRT and HVRT are present only when profile keys exist |
| No-profile handling | Roadmap profiles expose Grid Code only and cannot be selected |
| Core defaults | Dispatch, limits, SOC, features, networking, MPPT, CT, operation state and export settings match |
| Dispatch derivation | Unit conversion and export/import/battery arbitration follow the prototype |
| Save scope | Main pages and Grid secondary pages retain independent baselines |
| Gate lifetime | Unlock state expires with the settings-window session |
| Profile rendering | Every profile/subpage combination renders without an exception |

## Fixed during this audit

| Issue | Before | After |
|---|---|---|
| Device/settings mode mismatch | Device showed `ToU mode`, settings opened on `General` | Settings initializes from the device mode and shows `ToU` |
| Save cross-page side effect | Saving any page rewrote the device mode from the local default run mode | Only a saved Running Mode page updates the device summary |
| Command timeout range | Minimum was `1 s` | `0 s` is accepted and means no timeout |
| Power-factor range | `0.1–1` rejected under-excited values | `-1–1` accepts valid negative fixed and curve power factors |
| Save audit trail | Normal changes were not logged | Normal Save appends one multi-field log entry with before/after values |
| Check code mask | Devices always showed six dots | Mask length follows the actual four-digit value |

## 2026-11-20 integration cleanup

| Area | Before | After | Rollback evidence |
|---|---|---|---|
| Option catalogs | Capability, DI, networking, export, MPPT, ramp, P(U), F-P, reactive and ride-through arrays were repeated in page rendering and log formatting | `settings-options.js` is the single preview source used by both `settings-content.js` and `index.js` | Remove only this consolidation commit and restore the literals from the pre-integration archive |
| Unused page CSS | `.isw-nav-title`, `.isw-readonly-value--dim`, `.isw-gantt-segment*` and `.isw-gantt-hours` had no runtime consumer | Removed; `.isw-status--*` remains because it is built dynamically | Pre-integration archive above |
| Page documentation | A 46KB page README repeated the contract also present in project docs | README is a pointer; the effective contract lives in `docs/INVERTER-SETTINGS.md` | Pre-integration archive above |
| Visual/interaction scope | N/A | No intentional visual or interaction change | Compare screenshots or restore the archive if regression is found |

The integration cleanup does not alter model values, ranges, copy, page inventory,
profile data, save behavior or local hardware-demo boundaries.

## Still open

| Priority | Item | Status / decision needed |
|---|---|---|
| High | Economic Schedule defaults | Prototype uses 10 kW Charge and 15 kW Discharge; runtime uses 100% and 90% (20 kW / 18 kW on the current 20 kW device). Confirm the intended default before changing. |
| High | Backend point metadata | The source integration contract requires `label / unit / min / max / step / enumList` from backend metadata. Local ranges remain preview fallbacks until the endpoint exists. |
| High | Operator attribution | Production must associate each save and Check code verification with the authenticated account. The current log uses the fixed preview identity `Lena Tong`. |
| Medium | Persistent audit storage | Newly generated Save logs exist only in the local settings session; no backend persistence or audit identity is connected. |
| Medium | Protected export | Parameter Export can describe Grid & Protection data without entering the gate. No real file is generated in the preview, but production permission scope must be decided. |
| Medium | Hardware actions | Power, restart, reset, CT check and export remain local demonstrations rather than firmware commands. |
| Medium | Hard-coded preview ranges | Some values are broad placeholders and are not evidence of firmware limits. They must not block legitimate production values. |
| Medium | Grid code data conflicts | The source package itself lists unresolved firmware/certification issues for DE, SE, CZ, PL, BE and others. Current rendering faithfully preserves those supplied values. |
| Low | Source-plan drift | The planning document mentions IPS Check, separate ToU Schedule and screen language, while the final prototype and runtime do not expose them. |

## Intentional deviations from the prototype

- Economic Schedule is editable, percentage-based and treats unassigned time as
  General Mode.
- MPPT scan interval uses a bounded Select with `5 / 15 / 30 / 60` minutes.
- Grid & Protection uses the device's four-digit Check code.
- Running Mode, limit and MPPT labels follow the later live-product decisions.
- Timestamps use the shared relative/absolute formatter.
- Save and Cancel operate per page rather than reloading the prototype.

## Latest verification

- `npm run check`
- `node tests/verify-time.cjs`
- `npm run test:file -- tests/verify-inverter-settings.cjs`
- `npm run build:site:public`
- `git diff --check`
- Deep comparison of all 18 profile objects
- Render audit of all 15 main pages and every available Grid subpage across all
  18 profiles
