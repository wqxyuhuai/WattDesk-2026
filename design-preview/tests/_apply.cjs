const {spawnSync}=require('child_process');
const patch=`*** Begin Patch
*** Update File: design-preview/src/components/search-surface.js
@@
-function historyRow(query, prefix, onDelete, onOpen) {
+function historyRow(query, index, prefix, onDelete, onOpen) {
   const row = document.createElement("div");
   row.className = "wd-search-history-row";
+  row.id = \`${'${prefix}'}-option-${'${index}'}\`;
   row.setAttribute("role", "option");
   row.setAttribute("aria-selected", "false");
   row.tabIndex = -1;
*** End Patch
`;
const r=spawnSync('C:/Users/Administrator/.codex/tmp/arg0-windows/codex-arg0zbhfqm/apply_patch.bat',[patch],{stdio:'inherit'});
console.log('status',r.status);
