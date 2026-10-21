const fs=require('fs');
const f='design-preview/src/pages/home/scene-theme.js';
let s=fs.readFileSync(f,'utf8');
s=s.replace(`export async function createSceneTheme(root,elements){
 const source=await fetch(new URL('./data/theme-map.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Theme map unavailable');return r.json()});`,`export function installSceneTheme(root,elements,source){
`);
s=s.replace(` // Decode once before a theme snapshot, so SVG replacement never flashes empty.
 await Promise.all([...new Set(images.map(row=>row.light))].map(src=>new Promise((resolve,reject)=>{
  const image=new Image();image.onload=()=>resolve();image.onerror=()=>reject(Error('Theme asset unavailable: '+src));image.src=src;
 })));
 return {apply(mode){`,` // Light assets are decoded in the background. If someone switches theme
 // before that finishes, apply() waits for the same real decode once; it never
 // invents a delay and never swaps to an undecoded SVG.
 const decoded=new Map();
 for(const src of new Set(images.map(row=>row.light))){
  const promise=new Promise((resolve,reject)=>{
   const image=new Image();image.onload=()=>resolve(src);image.onerror=()=>reject(Error('Theme asset unavailable: '+src));image.src=src;
  });
  decoded.set(src,promise.catch(()=>{}));
 }
 let ready=null;
 function decode(){ready??=Promise.all(decoded.values());return ready;}
 return {decode,apply(mode){`);
fs.writeFileSync(f,s);
console.log(s);
