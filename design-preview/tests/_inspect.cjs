const fs=require('fs');
const s=fs.readFileSync('design-preview/src/components/date-picker.js','utf8').replace(/\r\n/g,'\n');
const marks=['function parseDateField','function rangeIntent','const nowDate','function syncDraft','function commitInputs','function renderCalendar','function enterMonth','panel._onClose','queueMicrotask(openFocus)'];
for(const m of marks)console.log(m, s.indexOf(m));
console.log('tail',JSON.stringify(s.slice(-700)));
