# Inverter settings functional audit

Updated: 2026-11-25

Baseline:

`E:\OneDrive\Design files sync\AI\Proj. WattDesk\资料\逆变器设置更新 261119`

The final 2026-11-19 interaction prototype is the functional reference. Later,
explicit user decisions still override it, including the editable percentage
based Economic Schedule, bounded MPPT interval choices, four-digit device
Check code, live-aligned labels, relative-time rendering and page-scoped save.
The effective page contract lives in
[`docs/INVERTER-SETTINGS.md`](../../../../docs/INVERTER-SETTINGS.md); this file
records functional evidence, fixed issues and remaining integration boundaries.

## 2026-11-25 Initialization / settings parity hardening

The setup wizard and normal Inverter settings now consume the same page-level
business contracts where they previously risked drifting:

| Contract | Shared module | Result |
|---|---|---|
| Schedule sorting, validation and timeline segments | `schedule-editor.js` | Economic / ToU setup and settings share start-time ordering, range checks, overlap handling, 24h segments and the Economic Discharge confirmation predicate |
| Battery topology and field definitions | `battery-editor.js` | Single, parallel and split banks share Brand / BMS / Protocol / current fields and validation; protocol is disabled when BMS is disabled |
| Grid profile state and filtering | `grid-profile-editor.js` | Setup and settings share selectable / roadmap / preview status and search filtering |
| Time entry interaction | `components/time-range-control.js` | Both surfaces keep the same masked time wheel and validation-on-close interaction |

Functional gaps closed:

- MPPT parallel enabled with no valid group blocks `Next` in setup and displays
  `At least one MPPT Group must be created` from the shared group editor.
- An empty Economic / ToU schedule keeps `Add at least one schedule period.` in
  the schedule table instead of promoting it to a page-header banner.
- Import / Export Permissions appear only for their enabled limits. Switching
  export from `Solar and Battery` to a battery-blocking option while Economic
  Discharge exists opens the shared confirmation; Cancel, Escape and backdrop
  dismissal roll back, while Continue commits.
- BMS Communication and Battery Protocol are present in setup and settings. Both
  the protocol and Battery Brand use `128px`; disabling BMS keeps the protocol
  value visible but non-interactive.
- Running Mode carries explicit wire values `[0, 1, 2, 3, 4, 6]`. Forecast Mode
  is not implemented, so Off-Grid remains `6` rather than inheriting `5`.
- The completed setup state keeps the `3s` automatic close and also allows the
  shared `Close (3s)` button to close immediately.

The page-specific string / imperative DOM assembly remains separate because the
settings table is generated from an HTML renderer while setup hydrates a wizard
step. Business rules, option catalogs, validation, ordering and confirmation
conditions are shared; neither page owns a second copy of those decisions.

## 2026-11-24 Active-power point contracts and reported effective values

The editable power controls expose their production point names in the
rendered rows:

| UI field | Point | Contract |
|---|---|---|
| EMS dispatch | `ActivePower_Dispatch_Enable` | RW |
| Setpoint unit | `ActivePower_Dispatch_Mode` | RW, `%Pn / kW` |
| Setpoint | `ActivePower_Dispatch_Setpoint` | RW, positive export and negative import |
| Command timeout | `ActivePower_Dispatch_Timeout` | RW, `0` means no timeout |
| AC power limit mode | `Output_Capability_Mode` | RW candidate, firmware confirmation pending |
| DI port configuration | `DRM_SET` | RW, `0=Off / 1=DRM / 2=RCR` |

The status window and Active Power Dispatch page no longer calculate effective
power, limit source or curtailed PV from writable settings. They consume an
explicit preview telemetry object that maps to three RO points:

- `ActivePower_Effective_Limit`
- `ActivePower_Limit_Source`
- `ActivePower_PV_Curtailed`

The settings page renders those values in the same result-first order and does
not duplicate the writable Dispatch setpoint in the Currently effective card.
Limit source is a single-line status row without a numeric progress track.

Changing Setpoint, export limit or battery capability leaves the displayed
reported values unchanged until the telemetry source changes. If telemetry is
unavailable, the UI reports unavailable state instead of deriving a fallback.

## 2026-11-25 IPS Check

`IPS Check` is a conditional Grid secondary page for `IT CEI 0-21`.

| Area | Implemented result |
|---|---|
| Entry | Hidden for every other grid code; visible but disabled while Italy is still an unsaved draft. Italy preview keeps all common Grid pages and places IPS Check last |
| Save gate | Hover / focus on the disabled entry explains `Save the grid code to enable the IPS Check.` |
| Required check | `IPS_Selfcheck_Require=1` uses danger emphasis until the check passes and toasts the grid-connection requirement whenever Settings opens |
| Overall state | Offline overrides all item state; otherwise checking → failed → passed → not checked → interrupted |
| Item results | Eight cards expose the supplied voltage/frequency trip limits, measured values and protection times; unavailable telemetry stays `--` |
| Run action | Local preview simulates `Italy_SelfTest_Enable=1`, locks the action while checking, and records completion time plus all item results |
| History | The 640px `IPS Check Record` modal is launched from the fixed page-title row, reuses the shared modal stack, summary card, settings-card grid and shared scroll viewport, and lists all eight results |
| Persistence | `ips` is transient RO/result state and never enters normal page dirty, Save or Operation Log |
| Preview data | `p25` exposes `IT CEI 0-21` as `Preview only`; no certified Italian protection values are copied from another country |

Point mapping is centralized in `settings-options.js`. The requirement uses
`Certification_Standard=21`, `IPS_Selfcheck_Require`, the eight item status
points and `Italy_SelfTest_Enable`. The source document also contains the
leading-character variant `ltaly_SelfTest_Enable`; it is retained only as an
alias note until firmware metadata confirms which spelling is authoritative.

## 2026-11-23 1120 incremental update

The 1120 package adds one field only: `Limit basis` on the export-limit section.
The prototype adds `limits.basis: 0`, a shared-style two-option control and a
conditional warning note; the remaining 1119 files are unchanged and remain the
base reference.

| Area | Implemented result |
|---|---|
| Data | `limits.basis` stores `0=Total`, `1=Per phase`; old settings normalize to Total |
| Visibility | Shown only for three-phase devices with Export limit enabled; hidden for single-phase |
| Capability | `Per phase` requires a separate firmware capability; unsupported firmware keeps it visible but disabled |
| Preview fixture | `p25` is three-phase and supports per-phase selection |
| Save/log | Save/Cancel uses the existing page scope; Operation Log formats values as Total / Per phase |
| Computation boundary | Effective limit, limit source and curtailed PV are device-reported aggregate RO values; no per-phase telemetry is fabricated |

## 2026-11-23 ToU Manual and Dynamic

`Operating strategy` now exposes two entries both named `ToU Mode`, with the
small trailing values `Manual` and `Dynamic`. Both reuse
`icons/settings/time-of-use-mode.svg`; Manual is the default. The sidebar
eligibility decision is intentionally deferred, so both entries remain visible.

The shared ToU model supports up to 24 periods, 15/30/60-minute intervals, six
live-aligned submodes, per-period battery power and PV-forbidden settings, and
page-scoped Save/Cancel. Manual opens with one starter period for each of the six
modes and uses the same Economic Schedule overview shell. Time range editing is
provided by the shared `createTimeRangeControl()`; the wheel only exposes values
allowed by the current interval. Period deletion uses the shared dangerous menu
state and `danger-solid` confirmation button.

Dynamic provides Today/Tomorrow, two 96-point stepped price lines for Buy and
Sell, percentage/fixed thresholds, Refresh, generated schedule and Advanced
Settings. The plot background follows the current ToU plan's operating modes
and uses General Mode for uncovered time; it does not color price columns by
mode. The reviewed `24h Overview` chart keeps the plot neutral. Buy is a 2px
theme-blue step line with a 14-to-0 area fade; Sell is a 1.5px, 84-percent
secondary orange line. The six plan modes remain in the plot background at 8
percent, map directly to `Labels/Secondary`, Purple, Yellow, Green, Red and Teal,
and keep crisp internal boundaries without a separate rail. Only the plot's
outer 0-8 percent and 92-100 percent fade into the settings surface. Axis and
legend labels use the reviewed 11px chart scale, with the user-approved
single-flow legend unchanged. A compact summary exposes the lowest and peak Buy
price ranges, aligns to the `24h Overview` text edge and sits 16-18px below the
13px heading. Hovering adds a 16-percent semantic tint for the active
fifteen-minute column and the Glass tooltip, without a vertical dashed guide. Buy
uses a compact stepped tariff shape while Sell uses stable half-hour steps so the
two series do not read as scaled copies. The
`24h Overview` title receives a 2px right and 3px down optical correction
against the plan-table content edge while its layout box remains fixed. The
Today/Tomorrow segment fills the Refresh-adjacent toolbar space with
a 12px gap, and the 48px Advanced Settings card tints as one shared settings
surface with an 18px mask chevron and the shared 240/360ms hover-fill rhythm.
The Advanced view replaces its fixed title with an 18px shared Back chevron;
Time Settings reuses the schedule-table grid, all price-source selects are
220px wide, and the Extra Charge information affordance opens a complete
shared modal with the export/import formulas and notes. Back aligns to the
Advanced content edge with a 15px label and one primary-ink hover state for both
label and chevron; Extra Charge keeps the info glyph at a small 4–8px gap;
Control Mode uses the shared 288px descriptive Select with compact 10px menu
padding, 1px row gaps and concise 11px option explanations;
Intelligent Mode uses the standard panel surface and group spacing; Time Settings
tightens the label column while keeping the full Battery Discharge name and
reserving extra space before PV forbidden. The scrolled Advanced header retains
both Gaussian blur and a 72% panel-background underlay. Locked Time Interval
values remain in secondary ink at full opacity, and Time Settings uses the
standard 24px settings-card content line. The Advanced blur underlay spans the
full content pane while Back remains on the 640px content line and stays above
the blur layer; its chevron has a 4px optical right shift.
Hovering or focusing the chart snaps to a 15-minute period, shows a restrained
active-mode column tint and a shared Glass tooltip for mode, Buy, Sell and time;
it does not draw a vertical dashed guide. The price-axis labels are left-aligned to the content edge, and
the 640px schedule uses a 12px column gap while preserving full time ranges.
Control Mode includes Manual, Duration, Percentage, Fixed and
Intelligent. Intelligent Mode has no local high/normal/low fields: the cloud
determines each period and sends the complete plan to the device, as specified
by the user. Country, Area, Timezone, Currency and Extra Charge are edited from
the shared site data and synchronized back when saved.

The complete confirmed contract is in
[`docs/TOU-MODE-SETTINGS.md`](../../../../docs/TOU-MODE-SETTINGS.md).

## 2026-11-23 battery topology and SOC update

The Battery page now models the hardware topology before presenting dependent
settings:

| Hardware / state | Runtime data | Visible result |
|---|---|---|
| One battery path | `battery.common`, shared `battery.soc` | One configuration card, one shared grid/off SOC pair, one Keep Battery Warm row |
| Two paths, parallel supported and on | `battery.common`, shared `battery.soc` | One configuration card containing the parallel switch, one shared SOC pair, one heating row |
| Two paths, parallel on, master battery unresolved | `battery.common`, shared `battery.soc`, `batteryMasterBattery:null` | Parallel switch plus hardware-check warning; Battery Brand / current fields hidden, shared SOC and heating remain |
| Two paths, parallel supported and off | `battery.bank1`, `battery.bank2`, shared `battery.soc` | Separate Battery #1 / #2 configuration and heating, but still only one shared SOC pair |
| Two paths, parallel unsupported | `battery.bank1`, `battery.bank2`, shared `battery.soc` | No parallel switch; both independent battery groups remain visible with one shared SOC pair |

Implemented details:

- The default `p25` preview fixture resolves the master communication battery to
  `bank1`, so the default Battery page shows the complete shared configuration
  without the warning. The unresolved-master state remains available through the
  model-level regression and must not be treated as the normal preview default.
- `battery.parallel` is normalized against `batteryPathCount` and
  `supportsBatteryParallel`; unsupported hardware cannot persist parallel on.
- `batteryMasterBattery` accepts `bank1 / bank2` when the master communication
  point resolves successfully. In production, subsequent reads/writes route to
  that physical battery while the UI remains one shared configuration. A null
  or invalid value while parallel is on shows the approved hardware warning and
  suppresses the brand/current write fields in that card; parallel-off and
  known-master states show the normal fields and no warning.
- `battery.soc` stores `gridMin / gridMax / offMin / offMax` once for the
  device. Each configuration scope stores only `brand`,
  `chargeMax / dischargeMax` and `warm`.
- The default SOC ranges are `10–80%` on-grid and `20–90%` off-grid, with
  `Wattsonic`, `100 A` charge/discharge and heating on.
- SOC values support numeric editing, track clicks and two keyboard-operable
  range handles. Track clicks select the nearest endpoint; endpoints may cross
  and are sorted after commit so the smaller value becomes Start. Equal Start
  and End values show the inline error and block Save. Both handles use shared Glass Surface
  hover/press motion and their centres align exactly with the blue fill. Drag
  renders its visual position continuously and never jumps through ordinary
  integers or ten-point marks; the value, ARIA value and model receive the
  nearest whole percentage. No magnetic snap remains. Keyboard movement stays
  at one-point precision and direct numeric entry keeps its exact integer. The
  unstretched track is neutral grey,
  the resting endpoint is 16px, and hover/press use the shared spring
  enlargement. Only the 24px transparent hit band around the line activates
  the thicker line state; hovering elsewhere in the card does not. Small-disc
  glass variables strengthen the blur, rim and inner highlights at 16px.
  Hovering anywhere in the track scales both endpoints; release uses the
  shared 420ms spring tail. Hovering or keyboard-focusing a thumb opens a following `SOC <n>%`
  Glass Surface chip above it, updated during drag and keyboard movement. The
  chip is absolutely overlaid, adds no card height, keeps a 2–4px gap, and uses
  the shared `wd-glass--surface wd-glass-popup` material without page-local
  surface colours. Endpoint hover controls visibility; leaving the endpoint
  hides it, while dragging keeps it open. Entry makes the background material
  and backdrop blur reach their final state immediately, then reveals text
  after 70ms; `backdrop-filter` itself is never transitioned. Exit reverses
  that order. The tooltip overrides the shared glass host to `isolation:auto`;
  without it Chromium keeps the computed backdrop filter but does not sample
  the page behind the small tooltip.
- The unresolved parallel-master warning uses `13 / 400 / 18px` footnote text
  with `12px / 4px` vertical padding. It keeps only the separator below the
  parallel switch, has no bottom divider, and leaves approximately `5px` at the
  card tail instead of restoring the standard full card spacing. Its semantic
  warning symbol uses a generated opaque mask with the full accent orange;
  the source asset's `fill-opacity="0.3"` is not used at runtime.
- Turning parallel mode off from that unresolved-master warning immediately
  removes the warning and restores two fully editable `Battery #1` and
  `Battery #2` cards. Both cards expose Battery Brand, Max. Charge Current and
  Max. Discharge Current, followed by their separate heating controls; the
  unresolved master capability never blocks the normal split-configuration
  fallback.
- The old global `features.heating` field was removed because heating is now part
  of each battery scope.
- Battery page Save remains page-scoped. Log labels preserve Battery #1 / #2 and
  lower/upper SOC context instead of emitting duplicate generic labels.

Verification covers the three topology modes, shared-SOC behavior across split
configurations, model capability normalization, default values, handle/fill
alignment, shared glass endpoints, continuous drag rendering with ordinary
integer readback and no magnetic snap, crossable endpoint sorting, equality
validation, correctly positioned small secondary tick labels, compact card tail,
idle and hover line thickness,
consecutive-card half gaps, following SOC tooltip, spring release,
entry/exit material sequencing, equal-range rejection with no lower/upper clamp,
parallel-master warning visibility and hidden write fields, the default resolved
master battery state, warning-state fallback to two fully editable battery cards,
dependent card order and return-to-baseline dirty behavior in
`design-preview/tests/verify-inverter-settings.cjs`.

## 2026-11-23 Backup Output safety guard

`Device Features → Operating envelope` now presents
`Allow grid / off-grid switching → Backup Output → Unbalanced output`.
`features.backupOutput` defaults on and participates in the normal page-scoped
Save / Cancel, dirty and Operation Log flow.

The shared switch owns the ordinary binary interaction. When the local
Operation Control state says the inverter is running, a capture-phase guard on
the row stops the click before the switch receives it. The rendered value,
switch node, dirty state and action bar therefore remain unchanged. The page
opens the shared 480px acknowledgement dialog instead:

- turning off is blocked with `Cannot Disable Backup Output`;
- turning on is blocked with `Cannot Enable Backup Output`, including the
  backup-load rating and secure-connection checks;
- acknowledgement uses the notification bell, one full-width blue `OK` primary
  button, Depth Reveal and focus return to the switch;
- acknowledgement is not a bypass: while the inverter remains running, another
  switch attempt opens the same notice again.

After the inverter is stopped through Operation Control, the same switch turns
off and on normally. The regression restores the stopped/running state and
switch value at the end, so the probe does not leave Device Features dirty.

## 2026-11-23 Parallel MPPT groups

The MPPT inventory and grouping data are separate:

- `mppt.inventoryPoints` contains five hardware-status slots. Values `1–4`
  describe present MPPT interfaces; `5` means the interface is absent. The
  runtime count is every slot whose value is not `5`.
- `mppt.groupPoints` contains four independent group assignments with default
  `[1, 2, 3, 4]`. A parallel pair receives the same value, for example
  `[1, 1, 3, 4]`. Group edits never change inventory points.
- MPPT Input rows and picker options are generated from the calculated inventory
  count. Four local fixture interfaces render four source selectors.

Parallel behavior:

- two actual MPPTs form the implicit `[1, 1, 3, 4]` group without a picker;
- more than two actual MPPTs show an `MPPT Group 1` placeholder when parallel is
  enabled, then open the two-selection picker below that group Select trigger;
- group values reuse the shared Select trigger and reopen for editing; each
  group accepts exactly two channels;
- channels assigned to another group stay disabled and use tertiary text in
  both create and edit modes, without additional explanatory copy; the source
  group must be removed before reuse;
- picker rows are compact horizontal menu rows with the label on the left and
  the Running Mode 18px check-circle marker on the right;
- selecting a third or fourth available channel drops the earliest selection,
  so the popup always retains the final two;
- with four actual MPPTs, adding the second group fills the remaining
  `[3, 4]` directly;
- deleting every group leaves `At least one MPPT Group must be created`, keeps
  the Group 1 placeholder, removes the detached Add row and blocks Save;
- the Add control is right-aligned with the option menu button; group select and
  option button use the shared 8px action gap;
- `Delete group` uses the shared danger menu item colors and faint-red hover;
- Cancel restores the page baseline, including parallel off.

The preview has no per-MPPT telemetry table to change; the stored rule is
documented that production read data displays each group's primary unit only
and does not duplicate secondary members.

## 2026-11-23 CT current mode correction

`Grid_Current_Mode_Set` is a real writable source selector, not a CT-rating
selector:

- `0` = `Meter Current`;
- `1` = `CT Current`;
- the control belongs in `CT Self-check → Current Mode`;
- `100 A CT / 50 A CT` are static hardware/render descriptions and are not
  enum choices for this point.

`CT_SCAN_ENABLE` remains the separate self-check trigger (`0` disabled, `1`
enabled, `2` reset). The preview's `Run check` action simulates that trigger
and must not change Current Mode. `ctCurrentMode` is persistent page config,
while running/result timestamps remain transient.

## 2026-11-24 Reset & Recovery

Operation Control opens a nested Reset & Recovery dialog instead of exposing a
direct factory-reset command. The dialog has two landing paths:

- `Reset by category` opens three independent recovery points:
  - `Reset_operation`;
  - `Reset_gridparameters`;
  - `Reset_network`.
- `Clear all settings & reset setup` uses `Reset_allcustomersettings` only.
  Its product effect includes all three category recovery operations and returns
  the inverter to initial setup. The frontend must not emulate it by sending the
  three category commands sequentially.

Every detail view states what will and will not be affected, then uses the
shared confirmation layer before a local preview simulation. Full reset uses the
source-design copy "reset all settings and clear all data" with the five listed
reset items; firmware remains authoritative for any historical-data side
effects. Product has not defined an inverter-off precondition or extra Check
code requirement for these actions, so this preview adds neither.

Continue and final Reset use the shared `danger-solid` button variant, which
reuses the primary solid-glass geometry with the red accent and keeps white text
in both themes. No page-local button material or size override is allowed.

## 2026-11-24 Networking Wi-Fi

The Networking page includes a Wi-Fi section between Connection and Address.
It maps:

- `WIFI_Mode_AP_Switch` to the shared hotspot toggle;
- `Wifi_Mode_Open_AP_SSID` to a text edit field;
- `Wifi_Mode_Open_AP_Password` to a masked password field with an eye toggle.

The hotspot explanation uses the standard title-to-hint layout without an info
button. Turning the hotspot off keeps the SSID and password values.
SSID and password participate in Save / Cancel, dirty state and Operation Log;
password values are always masked in the log. Both text fields reuse the normal
settings edit-field surface, limited to a 220px layout width. The password eye
uses a 16px glyph; only the closed state receives a 0.5px downward optical
correction.

## 2026-11-23 Shadow scan modes

- `mppt.scanMode` defaults to All MPPTs Control.
- All mode uses the existing `mppt.scan` and `mppt.interval` fields, with one
  switch and one Adaptive Select.
- Individual mode normalizes `mppt.individual` to the inventory-derived MPPT
  count. Each channel stores its own `scan` and `interval`.
- Disabling one individual channel only removes that channel's interval row.
- Mode and per-channel settings participate in the existing page-scoped Save /
  Cancel, dirty and Operation Log paths.

## Verified consistent

| Area | Result |
|---|---|
| Main-page inventory | 15 prototype renderers are preserved; Manual and Dynamic ToU replace the former placeholder and bring the runtime inventory to 17 |
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
| Medium | Battery Protocol catalog | The preview currently exposes only `Wattsonic`; production protocol values and disabled-BMS behavior must come from backend / BMS metadata. |
| Medium | Running Mode enum | Current wire values preserve the Off-Grid gap at `6`; Forecast Mode remains unimplemented until its product behavior and point value are confirmed. |
| Low | Source-plan drift | Separate ToU Manual and Dynamic pages and IPS Check are now implemented. Screen language still remains unexposed. |

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
- `node tests/verify-select-states.cjs`
- `node tests/verify-ips-check.cjs`
- `node tests/verify-inverter-settings.cjs`
- ToU Manual / Dynamic：two shared-icon entries with `Manual / Dynamic` trailing
  values; 24-period Manual editor; 640px five-column desktop tables; segmented
  Today/Tomorrow; 96 price points; Tomorrow empty state; dynamic threshold
  lines; Manual / Duration / Percentage / Fixed / Intelligent control modes;
  site/fee controls; page-scoped Save/Cancel and persisted mode state.
- `node tests/verify-time.cjs`
- `npm run test:file -- tests/verify-inverter-settings.cjs`
- `npm run build:site:public`
- `git diff --check`
- Deep comparison of all 18 profile objects
- Render audit of all 17 main pages and every available Grid subpage across all
  18 profiles
