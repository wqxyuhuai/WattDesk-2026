const fs=require('fs');const p='src/pages/home/index.js';let s=fs.readFileSync(p,'utf8');s=s.replace('panel.clientWidth','workspacePanel.clientWidth');fs.writeFileSync(p,s);console.log('fixed');
