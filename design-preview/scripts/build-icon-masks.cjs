const fs=require("fs");
const path=require("path");
// Neutral icons ship with label alpha. Generate opaque copies used only by state masks.
const files=["cell-balance.svg","module-balance.svg","device-track.svg","organisation.svg","teams.svg","user.svg","asset-27.svg","asset-35.svg","disclosure.svg"];
const root=path.join(__dirname,"..","home-assets");
const out=path.join(root,"masks");
fs.mkdirSync(out,{recursive:true});
for(const file of files){
 const source=fs.readFileSync(path.join(root,file),"utf8");
 const opaque=source.replace(/(fill-opacity|stroke-opacity)="0\.7"/g,'$1="1"');
 fs.writeFileSync(path.join(out,file),opaque);
}
console.log("Generated "+files.length+" opaque icon masks.");
