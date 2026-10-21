// Adapter for the archived Figma scene. Semantic components use tokens directly.
// Light values come from actual node/variable bindings; dark inline paints are
// restored verbatim, including the reviewed material and existing SVG geometry.
export function installSceneTheme(root,elements,source){

 const work=[];
 function property(element,key,light){
  if(!element)return;
  work.push({element,key,dark:element.style[key],light});
 }
 for(const row of source.styles){
  const element=elements.get(row.id);if(!element)continue;
  for(const [key,value]of Object.entries(row.properties||{}))property(element,key,value);
  if(row.segmentColors){
   const spans=Array.from(element.children).filter(n=>n.tagName==='SPAN');
   spans.forEach((span,i)=>property(span,'color',row.segmentColors[i]||row.segmentColors[0]));
  }
 }
 const images=[];
 for(const row of source.assets){
  const image=elements.get(row.id)?.querySelector('img');if(!image)continue;
  image.classList.add('wd-themed-asset');images.push({image,dark:image.getAttribute('src'),light:'./home-assets/'+row.file});
 }
 // Chrome reuses the same original icons but is assembled outside the scene.
 const chromeFiles={'asset-6.svg':'light/imgBoldEssentionalUiBoltCircle.svg','asset-7.svg':'light/imgBoldMoneyTicket.svg','statistics.svg':'light/imgBoldBusinessStatisticPieChart.svg'};
 for(const image of root.querySelectorAll('.target-sidebar img,.target-header img')){
  const name=image.getAttribute('src')?.split('/').pop(),file=chromeFiles[name];
  if(file)images.push({image,dark:image.getAttribute('src'),light:'./home-assets/'+file});
 }
 // Light assets are decoded in the background. If someone switches theme
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
 return {decode,apply(mode){
  const theme=mode==='light'?'light':'dark';
  for(const item of work)item.element.style[item.key]=item[theme];
  for(const item of images)item.image.setAttribute('src',item[theme]);
 }};
}

// Compatibility entry for the page, which passes the already-loaded scene
// data as the third argument and awaits the adapter before marking ready.
export function createSceneTheme(root,elements,source){
 return installSceneTheme(root,elements,source);
}
