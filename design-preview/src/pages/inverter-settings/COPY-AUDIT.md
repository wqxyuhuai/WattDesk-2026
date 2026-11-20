# Inverter settings copy audit

Updated: 2026-11-20

This file is the review and change record for user-facing copy in Inverter
settings. It separates approved changes from items that still need a product
decision so copy can be reviewed or reverted without relying on chat history.
The effective page contract lives in
[`docs/INVERTER-SETTINGS.md`](../../../../docs/INVERTER-SETTINGS.md); this file
is intentionally limited to copy history and open wording decisions.

## Approved and completed changes

| Area | Before | After | Reason |
|---|---|---|---|
| Limit terminology | `Feed-in cap`, `Feed-in & Import Limits`, `Feed-in limit` | `Export limit`, `Import & Export Limits`, `Export limit` | Align with live WattDesk and keep export/import naming consistent |
| Limit explanations | Description text referred to a `feed-in limit` | Description text now refers to the `export limit` | Avoid mixing the old and new term |
| Device unlock | Six-digit `safety code`; preview value `583411` | Four-digit `Check code` read from the same device record used by Devices | User confirmed both surfaces describe the same production field |
| Effective heading | Documentation contained `Current effective` | `Currently effective` is the documented and runtime term | Remove a documentation-only mismatch |
| Economic schedule option | `Charge by PV only` | `Charge by PV Only` | Match live WattDesk capitalization |
| Running Mode options | `General`, `Peak Load Shifting`, `Economic`, `UPS`, `Time-of-Use`, `Off-Grid` | `General Mode`, `Peak Load Shifting Mode`, `Economic Mode`, `UPS Mode`, `ToU mode`, `Off-Grid Mode` | Align selectable option names with live WattDesk |
| MPPT labels | `String input`, `PV1–PV4`, `MPPT parallel` | `MPPT Input`, `MPPT #1–#4`, `Parallel MPPT Operation` | Align parameter labels with live WattDesk |
| MPPT audit copy | `PV1 input`, `PV2 input`, `PV3 input` | `MPPT #1 input`, `MPPT #2 input`, `MPPT #3 input` | Keep the operation log consistent with the renamed fields |
| Export date | `17.11.2026` | `2026/11/17` | Use the site-wide absolute date format |
| Running mode persistence | Concatenated `" mode"` after labels | Leaves existing `Mode`/`mode` suffixes untouched | Prevent labels such as `General Mode mode` |
| Initial running mode | Settings always opened on `General` while the device row said `ToU mode` | Settings starts from the device record's current mode; saving another page no longer rewrites the device mode | Keep the settings window and device summary in sync |
| Command timeout | Minimum `1 s` | Minimum `0 s` | `0` means no timeout in the source integration contract |
| Power-factor validation | Fixed PF and curve PF accepted only `0.1–1` | Fixed PF and curve PF accept `-1–1` | Source profiles contain valid negative, under-excited values |
| Check code mask | Six dots for every code | Mask length follows the actual code length | The field is a four-digit production value |
| Operation Log on Save | Normal setting changes were not logged | One Save creates one audit entry with every changed field and its before/after value; unchanged fields are omitted | Make the existing "every change" claim materially true in the local preview |

The shared time utility now exposes `formatAbsoluteDate()` for visible
date-only values. Relative and absolute timestamps continue to use the existing
seven-day rule and `YYYY/MM/DD HH:mm` format.

## Still open

These items were reviewed but were not approved for this change set.

| Item | Current state | Decision still needed |
|---|---|---|
| Power-control feature name | `EMS dispatch` and `Active Power Dispatch` remain in use | Choose a single canonical product term and whether the page should match live `Professional Settings` |
| Grid connection point term | `Grid-tied point now` remains in the local status window | Confirm, rename or remove the local-only status strip |
| Operation log claim | Export copy still says every change includes an operator and timestamp | Decide whether demo identities must be labelled as sample data |
| Illustrative telemetry | `Grid support (F-P) inactive`, `PV curtailed 4.8 kW` and battery values remain fixed demo states | Decide whether these need a Preview marker |
| Navigation inventory | Runtime has 15 primary pages and 8 grid subpages | Reconcile documentation and product scope with live 10 primary pages and 7 grid subpages |
| Demo-only pages | `Parameter Export`, `CT Detection` and `Operation Log` have no direct live menu entry | Confirm product scope and truthful preview boundaries |
| Battery limit wording | `Battery power capability` and `Limited by battery charging` coexist | Decide whether charge/discharge-specific labels should replace the generic chain label |
| Grid subpage names | `Grid Connection`, `Reactive Power`, `Frequency-Watt (F-P)` do not match live `Grid Connection Manager`, `Reactive Power Management`, `Frequency-Watt Control(F-P)` | Confirm whether live product naming should be adopted |
| Grid profile inventory | Local and live both contain 18 entries but different regional variants and order | Confirm the authoritative profile catalog before renaming or replacing data |
| Live page structure | Live separates `Economic Mode`, `Economic Time Settings`, `Battery Management`, `Professional Settings`, `Shadow Scan` and `Other Settings` | Confirm whether the current grouped prototype should retain its different information architecture |
| Check code and operator identity | Save and Grid profile/reload entries currently use the fixed local preview operator `Lena Tong` | Production must associate every save with the authenticated account that used the device Check code; the Check code alone identifies the unit, not the person |
| Backend point metadata | `settings-validation.js` still contains local preview ranges, units and enum interpretations | Replace these with backend point metadata for `label / unit / min / max / step / enumList`; do not treat preview ranges as firmware truth |

## Deliberately unchanged

- Live WattDesk profile inventory and order were not changed.
- Live WattDesk page-grouping and menu architecture were not changed.
- Live-only fields such as Battery Brand, maximum charge/discharge current,
  WiFi hotspot settings, and dedicated Shadow Scan controls were not added.
- The local upper status window was not removed.
- Authentication, server persistence and the production point-metadata endpoint were not fabricated; the current operator remains a preview identity and local ranges remain a preview fallback.
- Explanatory copy was not replaced wholesale with live copy; several live
  sentences contain grammar and capitalization issues that require editorial
  review before adoption.

