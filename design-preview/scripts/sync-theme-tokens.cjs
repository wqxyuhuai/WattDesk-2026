// Rebuild theme adapters only from archived Figma variable bindings, never RGB guesses.
const fs=require('node:fs');
const path=require('node:path');
const dir=path.join(__dirname,'../design/figma');
const dataDir=path.join(__dirname,'../src/pages/home/data');
const read=file=>JSON.parse(fs.readFileSync(path.join(dir,file),'utf8'));
const source=read('figma-color-source.json'),snapshot=read('home-light-source.json').data;
const shortcutPairs=read('shortcut-light-source.json'),offset=snapshot.paints.length;
snapshot.paints.push(...shortcutPairs.paints);
snapshot.map.push(...shortcutPairs.map.map(row=>({...row,...(row.f!==undefined?{f:row.f+offset}:{}),...(row.s!==undefined?{s:row.s+offset}:{})})));
const scene=JSON.parse(fs.readFileSync(path.join(dataDir,'scene.json'),'utf8')),records=new Map(scene.map(n=>[n.id,n]));
const colors=source.variables.filter(v=>v.collection==='VariableCollectionId:507:29161');
const tokens=new Map(colors.map(v=>[v.id,'--wd-figma-'+v.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')]));
const num=v=>Number(v.toFixed(5));
const rgba=c=>`rgba(${[c.r,c.g,c.b].map(v=>Math.round(v*255)).join(',')},${num(c.a??1)})`;
const cssValue=v=>v.type==='VARIABLE_ALIAS'?`var(${tokens.get(v.id)})`:rgba(v);
const output=['/* Generated from figma-color-source.json. Run node sync-theme-tokens.cjs. */'];
for(const [mode,selector] of [['404:1',':root'],['404:0',':root[data-theme="light"]']]){
 output.push(selector+'{',...colors.map(v=>`  ${tokens.get(v.id)}:${cssValue(v.values[mode])};`),'}');
}
fs.writeFileSync(path.join(__dirname,'../src/foundations/colors.css'),output.join('\n')+'\n');
function color(p){const id=p.boundVariables?.color?.id;return tokens.has(id)?`var(${tokens.get(id)})`:rgba({...p.color,a:(p.color?.a??1)*(p.opacity??1)})}
function paint(p,n){
 if(p.type==='SOLID')return color(p);
 if(p.type==='GRADIENT_LINEAR'){
  const [[a,b,tx],[c,d,ty]]=p.gradientTransform,det=a*d-b*c;
  const start={x:(-d*tx-b*(.5-ty))/det*n.w,y:(c*tx+a*(.5-ty))/det*n.h};
  const delta={x:d/det*n.w,y:-c/det*n.h},len=Math.hypot(delta.x,delta.y);
  const ux=delta.x/len,uy=delta.y/len,full=Math.abs(ux*n.w)+Math.abs(uy*n.h);
  const base=((start.x-n.w/2)*ux+(start.y-n.h/2)*uy+full/2)/full*100;
  return `linear-gradient(${Math.atan2(ux,-uy)*180/Math.PI}deg,${p.gradientStops.map(s=>color(s)+' '+(base+s.position*len/full*100)+'%').join(',')})`;
 }
 return 'none';
}
const styles=[];
for(const row of snapshot.map){
 const n=records.get(row.id);if(!n||n.asset||/Fill \+ Shadow|Glass Effect/.test(n.name))continue;
 const properties={},fills=snapshot.paints[row.f]?.filter(p=>p.visible!==false);
 if(row.f!==undefined){
  if(n.t==='TEXT'){if(fills[0])styles.push({id:n.id,segmentColors:[color(fills[0])]});continue;}
  properties.background=fills.length?fills.map(p=>paint(p,n)).reverse().join(','):'none';
 }
 const shadows=[];
 for(const e of snapshot.paints[row.e]||[])if(e.type==='DROP_SHADOW'&&e.visible!==false&&e.blendMode==='NORMAL')shadows.push(`${e.offset.x}px ${e.offset.y}px ${e.radius}px ${e.spread}px ${color(e)}`);
 const stroke=snapshot.paints[row.s]?.find(p=>p.visible!==false);
 if(stroke){
  if(n.sides&&new Set(n.sides).size>1){['Top','Right','Bottom','Left'].forEach((side,i)=>{if(n.sides[i])properties['border'+side]=n.sides[i]+'px solid '+color(stroke)})}
  else shadows.unshift(`inset 0 0 0 ${n.sw??1}px ${color(stroke)}`);
 }
 if(row.s!==undefined||row.e!==undefined)properties.boxShadow=shadows.length?shadows.join(','):'none';
 if(Object.keys(properties).length)styles.push({id:n.id,properties});
}
// The shortcut master changed structure; pair its text leaves in documented order.
const shortcuts=read('shortcut-theme-source.json');
const dark=shortcuts.filter(n=>!n.id.startsWith('I14704:')),light=shortcuts.filter(n=>n.id.startsWith('I14704:'));
if(dark.length!==light.length)throw Error('Shortcut theme leaf count changed; inspect Figma before syncing.');
dark.forEach((n,i)=>{if(records.has(n.id))styles.push({id:n.id,segmentColors:light[i].segments.map(s=>color(s.fills[0]))})});
const byName={
 'Bold / Search / Rounded Magnifer':'imgBoldSearchRoundedMagnifer',
 'Bold / Essentional, UI / Bolt Circle':'imgBoldEssentionalUiBoltCircle',
 'Bold / Money / Ticket':'imgBoldMoneyTicket',
 'Bold / Essentional, UI / Bolt':'imgBoldEssentionalUiBolt',
 'Linear / Time / Clock Circle':'imgLinearTimeClockCircle',
 'Linear / Arrows / Alt Arrow Right':'imgLinearArrowsAltArrowRight',
 'Bold / Astronomy / Planet 4':'imgBoldAstronomyPlanet4',
 'Bold / Essentional, UI / Danger':'imgBoldEssentionalUiDanger',
 'Bold / Electronic, Devices / Devices':'imgBoldElectronicDevicesDevices',
 'Bold / Electronic, Devices / Lightning':'imgBoldElectronicDevicesLightning',
 'Bold / Time / Calendar':'imgBoldTimeCalendar',
 'Linear / Arrows / Refresh':'imgLinearArrowsRefresh',
 'Hourly Energy generated / Area':'imgHourlyEnergyGeneratedArea',
 'Hourly Energy generated / Line':'imgHourlyEnergyGeneratedLine',
 'Hover / Vertical guide':'imgHoverVerticalGuide',
 'Hourly Energy consumed / Area':'imgHourlyEnergyConsumedArea',
 'Hourly Energy consumed / Line':'imgHourlyEnergyConsumedLine',
 'Hourly Sites affected by issues / Area':'imgHourlySitesAffectedByIssuesArea',
 'Hourly Sites affected by issues / Line':'imgHourlySitesAffectedByIssuesLine',
 'Hourly New service tickets / Area':'imgHourlyNewServiceTicketsArea',
 'Hourly New service tickets / Line':'imgHourlyNewServiceTicketsLine'
};
const assetOverrides=scene.filter(n=>n.asset&&byName[n.name]&&n.id!=='14445:3636').map(n=>({id:n.id,file:`light/${n.id==='I14537:4416;14536:3828'?'imgBoldEssentionalUiBoltCircle1':byName[n.name]}.svg`}));
fs.writeFileSync(path.join(dataDir,'theme-map.json'),JSON.stringify({frameId:'14704:3871',styles,assets:assetOverrides},null,2)+'\n');
console.log(`Synced ${colors.length} paired colors, ${styles.length} scene styles and ${assetOverrides.length} SVG references.`);
