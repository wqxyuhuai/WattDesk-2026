# Inverter settings copy audit

Updated: 2026-11-25

This file is the review and change record for user-facing copy in Inverter
settings. It separates approved changes from items that still need a product
decision so copy can be reviewed or reverted without relying on chat history.
The effective page contract lives in
[`docs/INVERTER-SETTINGS.md`](../../../../docs/INVERTER-SETTINGS.md); this file
is intentionally limited to copy history and open wording decisions.

## Approved and completed changes

| Area | Before | After | Reason |
|---|---|---|---|
| Battery topology fields | No protocol row | `Battery Protocol`, with the hint `Communication protocol used by this battery input` when enabled and `BMS communication is disabled for this input` when disabled | Preserve the documented BMS protocol contract without inventing disabled values |
| Import permission | No conditional permission row | `Import Permissions`, options `Charge From Grid Allowed / Forbidden Grid Charge` | Map `Grid_Charge_Enable_Set` as a direct binary permission while keeping readable copy |
| Export permission | No conditional battery-export row | `Export Permissions`, options `Solar and Battery / Solar Only / Permanent Non Export` | Map `Eco_Batto_Grid_Set` / export-permission behavior without exposing enum keys |
| Battery export confirmation | Permission changed silently | `Disable battery export?` / `Economic Mode currently contains a Discharge period. Battery energy will no longer be exported to the grid after this change.` / `Cancel` / `Continue` | Explain the consequence before removing battery export while Economic Discharge remains configured |
| Limit terminology | `Feed-in cap`, `Feed-in & Import Limits`, `Feed-in limit` | `Export limit`, `Import & Export Limits`, `Export limit` | Align with live WattDesk and keep export/import naming consistent |
| Limit explanations | Description text referred to a `feed-in limit` | Description text now refers to the `export limit` | Avoid mixing the old and new term |
| Device unlock | Six-digit `safety code`; preview value `583411` | Four-digit `Check code` read from the same device record used by Devices | User confirmed both surfaces describe the same production field |
| Effective heading | Documentation contained `Current effective` | `Currently effective` is the documented and runtime term | Remove a documentation-only mismatch |
| Economic schedule option | `Charge by PV only` | `Charge by PV Only` | Match live WattDesk capitalization |
| Running Mode options | `General`, `Peak Load Shifting`, `Economic`, `UPS`, `Time-of-Use`, `Off-Grid` | `General Mode`, `Peak Load Shifting Mode`, `Economic Mode`, `UPS Mode`, `ToU mode`, `Off-Grid Mode` | Align selectable option names with live WattDesk |
| MPPT labels | `String input`, `PV1–PV4`, `MPPT parallel` | `MPPT Input`, `MPPT #1–#4`, `Parallel MPPT Operation` | Align parameter labels with live WattDesk |
| MPPT audit copy | `PV1 input`, `PV2 input`, `PV3 input` | `MPPT #1 input`, `MPPT #2 input`, `MPPT #3 input` | Keep the operation log consistent with the renamed fields |
| Export date | `17.11.2026` | `2026/11/17` | Use the site-wide absolute date format |
| Effective headline | `Grid-tied point now` | `Effective active-power limit` | The value is a device-reported limit, not a measured instantaneous power |
| Effective source | Locally inferred label such as `Battery power capability` | Device-reported `Limit source` value | Keep the copy aligned with `ActivePower_Limit_Source` |
| Effective footer | Local calculation explanation | `Values are reported by the inverter.` | Make the telemetry boundary explicit |
| Running mode persistence | Concatenated `" mode"` after labels | Leaves existing `Mode`/`mode` suffixes untouched | Prevent labels such as `General Mode mode` |
| Initial running mode | Settings always opened on `General` while the device row said `ToU mode` | Settings starts from the device record's current mode; saving another page no longer rewrites the device mode | Keep the settings window and device summary in sync |
| Command timeout | Minimum `1 s` | Minimum `0 s` | `0` means no timeout in the source integration contract |
| Power-factor validation | Fixed PF and curve PF accepted only `0.1–1` | Fixed PF and curve PF accept `-1–1` | Source profiles contain valid negative, under-excited values |
| Check code mask | Six dots for every code | Mask length follows the actual code length | The field is a four-digit production value |
| Operation Log on Save | Normal setting changes were not logged | One Save creates one audit entry with every changed field and its before/after value; unchanged fields are omitted | Make the existing "every change" claim materially true in the local preview |
| ToU navigation | No dedicated ToU pages | Two `ToU Mode` entries between `Economic Schedule` and `Battery`, with trailing `Manual / Dynamic` | The user requested two visible styling entries before sidebar eligibility logic |

The shared time utility now exposes `formatAbsoluteDate()` for visible
date-only values. Relative and absolute timestamps continue to use the existing
seven-day rule and `YYYY/MM/DD HH:mm` format.

## 2026-11-25 IPS Check copy

| Surface | Final copy | Reason |
|---|---|---|
| Sidebar entry | `IPS Check` | Matches the requirement and the Grid secondary-page pattern |
| Unsaved-card tooltip | `Save the grid code to enable the IPS Check.` | Makes the save gate explicit without allowing navigation |
| Open-window reminder | `The inverter must pass IPS Check before connecting to the grid.` | Carries the required Italy grid-connection warning |
| Ready card | `Ready for IPS Check` | Uses one status title for connected and disconnected idle states |
| Connected help | `The self-test takes about 10 minutes and may affect normal grid operation. Do not power off the inverter during the check.` | Preserves both duration and grid-impact warnings |
| Disconnected help | `The self-test takes about 10 minutes. Do not power off the inverter during the check. The inverter must pass this check before it can connect to the grid.` | Preserves the pre-connection constraint |
| Running card | `IPS Check in progress` / `Keep the inverter powered on and do not change settings until all checks complete.` | Prevents interruption and duplicate starts |
| Pass card | `IPS Check passed` / `The interface protection settings passed the self-test. Normal grid conditions still apply.` | Does not imply that passing removes normal grid conditions |
| Fail card | `IPS Check failed` / `Grid connection is prohibited. Review the failed items, correct the issue, then run the check again.` | States the grid-connection prohibition and required next action |
| Interrupted card | `IPS Check interrupted` / `The check ended before a final result was available. Run the check again when the inverter is ready.` | Distinguishes an incomplete run from a failure |
| Offline card | `Device connection lost` / `Reconnect the inverter before starting or reviewing an IPS check.` | Device connectivity overrides every self-check state |
| History entry | `IPS Check Record` | The action sits in the fixed page-title row; the standalone `Last self-check` helper copy is removed |
| Missing values | `--` | Missing telemetry must not be rendered as zero |

The eight item names remain technical protection identifiers and are not
translated: `81>.S1`, `81<.S1`, `59.S1`, `27.S1`, `81>.S2`, `81<.S2`,
`59.S2` and `27.S2`.

## 2026-11-23 Limit basis copy

| Surface | Final copy | Reason |
|---|---|---|
| Row | `Limit basis` | Matches the 1120 source field name |
| Options | `Total`, `Per phase` | Keeps the short source labels while using the project's English UI style |
| Total hint | `Sum of the three phases at the meter` | Preserves the meter-side aggregate meaning |
| Per-phase hint | `No single phase may exceed the limit` | Preserves the source constraint exactly |
| Unsupported hint | `Current firmware does not support per-phase limiting` | Makes the disabled capability explicit without hiding the option |
| Conditional note | `Per-phase limiting requires firmware with per-phase closed-loop control. On models with balanced three-phase output, the lightest-loaded phase caps total output, which can increase PV curtailment. Use it only when required by the grid operator or meter.` | Keeps all source warnings: firmware dependency, balanced-output consequence, curtailed PV and restricted use |

The existing project term `Import & Export Limits` is retained; the 1120
prototype still uses the older `Feed-in & Import Limits` wording.

## 2026-11-23 Battery configuration copy

| Surface | Final copy | Reason |
|---|---|---|
| Topology | `Parallel Battery Operation` | Matches the supplied battery setting reference |
| Topology hint | `Operate both connected batteries as one bank. Turn it off to configure each battery separately` | Explains both the combined state and how to reach independent settings |
| Brand row | `Battery Brand` | Matches the supplied reference and remains shared by both bank cards |
| Protocol row | `Battery Protocol` | Matches the initialization requirement; disabled BMS keeps the current protocol visible but non-editable |
| BMS row | `BMS Communication` | Makes `BMS1_Enable_Set / BMS2_Enable_Set` explicit and controls the Protocol lock |
| Current rows | `Max. Charge Current`, `Max. Discharge Current` | Preserve the source labels and distinguish the two electrical limits |
| SOC cards | `Grid-tied SOC`, `Off-grid SOC` | Replace the older charge-cut-off/discharge-floor model with explicit upper/lower ranges |
| SOC hints | `Operating range while connected to the grid.`, `Operating range during an outage.` | Keep each range's operating context visible without switching to modal help |
| Heating | `Keep Battery Warm`, `Keep Battery #1 Warm`, `Keep Battery #2 Warm` | Use one common label in single/parallel mode and explicit bank labels when split |
| Split headings | `Battery #1`, `Battery #2` | Make the target of every bank-specific control unambiguous |
| Parallel master warning | `Battery Parallel Mode is enabled. The system cannot detect which battery string is active. Please verify the battery power and communication cable connections to ensure proper configuration.` | Explain the unresolved master-communication battery and the required hardware check without changing the normal single-panel configuration |

The SOC model is one global range pair for the device:
`battery.soc.gridMin/gridMax/offMin/offMax`. It intentionally does **not**
split with Battery #1 / #2, even when parallel operation is off. Only battery
brand, maximum currents and heating follow the input topology. The old labels
`Charge cut-off SOC`, `Grid-tied discharge floor` and `Off-grid discharge
floor` are removed from both runtime controls and sample Operation Log data.

The 2026-11-23 follow-up also standardizes `Battery Brand` to the `128px`
numeric-field width and changes the two SOC endpoints to shared Glass Surface
handles whose centres align with the blue range fill. The endpoint dots are
removed, the line is `4px` at rest and `8px` on hover/focus, and the resting
endpoints are `16px`. Drag renders continuously and reports the nearest whole
percentage with no integer or ten-point magnetic snap. Keyboard movement
remains one point. The empty track is neutral grey. Only the 16px endpoint and
a 24px transparent band around
the line activate hover thickening; the full card does not. The endpoints use a
spring glass scale and stronger local glass edge/highlight variables so the
small disks read as material rather than flat fills. Hovering anywhere on the
track enlarges both disks, and release settles through the shared 420ms spring.
Hovering or keyboard-focusing a disk shows a following `SOC <n>%` Glass Surface chip above it.
The chip is an absolute content-layer overlay, does not add card height, stays
2–4px from the handle, and uses the shared `wd-glass--surface wd-glass-popup`
material rather than a page-local plate. It opens on endpoint hover and closes
on leave; drag keeps it visible. Material and blur are ready immediately and
text follows after 70ms, with the order reversed on exit. The glass
host must stay `isolation:auto` so the backdrop blur is actually sampled.
Track clicks move the nearest endpoint. Endpoints may cross; after commit the
smaller value becomes Start. Equal endpoints show `Start and end SOC limits
must be different.`. Tick copy uses `12px` secondary ink at true percentage
positions, with a compact card tail.
Consecutive cards in one settings group now use half the standard card gap.

The parallel-master warning is conditional: it appears only while parallel mode
is enabled and the master communication battery cannot be resolved. In that
state, Battery Brand, Max. Charge Current and Max. Discharge Current are hidden;
the switch, warning, SOC and heating remain. The normal known-master and
parallel-off states keep the standard configuration without the warning.

## 2026-11-23 Backup Output safety copy

| Surface | Final copy | Reason |
|---|---|---|
| Device Features row | `Backup Output` | Matches the supplied setting name and capitalization |
| Row hint | `Controls energy output from the backup port. Stop the inverter before changing this setting` | States the controlled output and the prerequisite directly in the page |
| Disable notice title | `Cannot Disable Backup Output` | Matches the supplied safety state |
| Disable notice body | `The inverter is currently running. To ensure system safety, the inverter must be stopped before turning off the Backup Output.` | Preserves the supplied shutdown requirement |
| Enable notice title | `Cannot Enable Backup Output` | Matches the supplied safety state |
| Enable notice body | `To safely activate Backup Output, the inverter must be stopped and the backup load must be confirmed to be within the nameplate's rated power range with secure connections.` | Preserves the shutdown, rated-load and secure-connection checks |
| Notice action | `OK` | Acknowledgement-only safety notice; it does not offer a bypass action |

## 2026-11-23 Parallel MPPT copy

| Surface | Final copy | Reason |
|---|---|---|
| Row hint | `Shares input current across MPPT channels for more energy from parallel PV strings.` | Keeps the explanation under the title and shortens it to the standard row-hint format |
| Group label | `MPPT Group N` | Uses the supplied group naming |
| Group select | `Select MPPT` / `MPPT #1 & #2` | Uses the Scan interval Adaptive Select trigger with a compact placeholder and reopens for editing |
| Add action | `Add MPPT group` | Accessible name for the supplied round plus action |
| Group menu | `Delete group` | Describes the direct removal action with the shared danger menu state |
| Empty-group error | `At least one MPPT Group must be created` | Preserves the supplied validation wording |

## 2026-11-23 ToU copy

- Dynamic ToU uses the live `24h Overview` title; its `Buy Price / Sell Price`
  line keys are separate from the plan-mode dots.
- Both sidebar entries are `ToU Mode`; the small right-side values are `Manual`
  and `Dynamic`.
- Manual and Dynamic share `24h Overview`, `Advanced Settings`,
  `Schedule periods`, `Time range`, `Mode`, `Battery power limit`,
  `PV forbidden`, `Cancel` and `Save`.
- Manual submodes: `General Mode / Grid Injection / PV Charging /
  Battery Charge / Battery Discharge / Peak Shifting`.
- Dynamic controls follow the online labels: `Manual Mode / Duration Control /
  Percentage Control / Fixed Price Control / Intelligent Mode`.
- Control Mode menu descriptions use the short forms `Set modes and time ranges
  manually`, `Schedule by high and low price duration`, `Trigger by daily
  price-range percentages`, `Trigger at fixed price thresholds` and
  `Cloud-optimized from usage habits`.
- `Intelligent Mode` copy states that the cloud evaluates each period, chooses
  its mode and power settings, and sends the complete schedule to the device.
- Dynamic rows keep the online `Delete` action.
- `High Price Hours / Low Price Hours` and the `%` unit are retained for
  Percentage Control because the online UI is the confirmed conflict source.
| Shadow scan modes | `All MPPTs Control` / `Individual Control` | Matches the supplied mode names |
| Shadow scan mode hint | `All MPPTs Control applies the same scan setting to every MPPT. Individual Control configures each present MPPT separately.` | Keeps the control-mode purpose under the title |
| Individual toggle | `Enable Shadow Scan` | Matches the supplied per-MPPT control |

## Still open

These items were reviewed but were not approved for this change set.

| Item | Current state | Decision still needed |
|---|---|---|
| Power-control feature name | `EMS dispatch` and `Active Power Dispatch` remain in use | Choose a single canonical product term and whether the page should match live `Professional Settings` |
| Operation log claim | Export copy still says every change includes an operator and timestamp | Decide whether demo identities must be labelled as sample data |
| Navigation inventory | Runtime has 17 primary pages and 8 grid subpages, including Manual and Dynamic ToU | Reconcile documentation and product scope with live 10 primary pages and 7 grid subpages |
| Demo-only pages | `Parameter Export`, `CT Detection` and `Operation Log` have no direct live menu entry | Confirm product scope and truthful preview boundaries |
| Grid subpage names | `Grid Connection`, `Reactive Power`, `Frequency-Watt (F-P)` do not match live `Grid Connection Manager`, `Reactive Power Management`, `Frequency-Watt Control(F-P)` | Confirm whether live product naming should be adopted |
| Grid profile inventory | Local and live both contain 18 entries but different regional variants and order | Confirm the authoritative profile catalog before renaming or replacing data |
| Live page structure | Live separates `Economic Mode`, `Economic Time Settings`, `Battery Management`, `Professional Settings`, `Shadow Scan` and `Other Settings` | Confirm whether the current grouped prototype should retain its different information architecture |
| Check code and operator identity | Save and Grid profile/reload entries currently use the fixed local preview operator `Lena Tong` | Production must associate every save with the authenticated account that used the device Check code; the Check code alone identifies the unit, not the person |
| Backend point metadata | `settings-validation.js` still contains local preview ranges, units and enum interpretations | Replace these with backend point metadata for `label / unit / min / max / step / enumList`; do not treat preview ranges as firmware truth |
| Limit basis production points | 1120 proposes two points: measurement-basis enable (`0=total`, `1=per phase`) and a firmware capability flag | Product/firmware owners must confirm names, addresses and release timing before production wiring |

## Deliberately unchanged

- Live WattDesk profile inventory and order were not changed.
- Live WattDesk page-grouping and menu architecture were not changed.
- Battery Brand, Battery Protocol, maximum charge/discharge current, Wi-Fi
  hotspot settings and dedicated Shadow Scan controls remain local preview
  settings; their production point metadata is still pending.
- The local upper status window was not removed.
- Authentication, server persistence and the production point-metadata endpoint were not fabricated; the current operator remains a preview identity and local ranges remain a preview fallback.
- Explanatory copy was not replaced wholesale with live copy; several live
  sentences contain grammar and capitalization issues that require editorial
  review before adoption.

