// Prefer a project dependency or explicit environment; desktop runtime is a local fallback.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
let runtime;for(const candidate of [process.env.WATTDESK_PLAYWRIGHT,'playwright',path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')].filter(Boolean)){
 try{runtime=require(candidate);break}catch{}
}
if(!runtime)throw Error('Browser checks need Playwright. Set WATTDESK_PLAYWRIGHT or install playwright locally.');
const chrome=process.env.WATTDESK_BROWSER||path.join(process.env.PROGRAMFILES||'C:/Program Files','Google/Chrome/Application/chrome.exe');
module.exports={...runtime,launchOptions:fs.existsSync(chrome)?{executablePath:chrome}:{},previewURL:process.env.WATTDESK_PREVIEW_URL||'http://127.0.0.1:4173/home.html?glass=figma'};
fs.mkdirSync(path.join(__dirname,'output'),{recursive:true});
