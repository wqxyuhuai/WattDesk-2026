const fs=require('fs');
const f='design-preview/src/components/skeleton.js';
let s=fs.readFileSync(f,'utf8');
const before=s;
s=s.replace(` * waiting; future cards inherit the same profiles and timing. */`,` * waiting; future cards inherit the same profiles and timing. A per-host
 * data-skeleton-order is optional and only used for a deliberate cascade. */`);
s=s.replace(`  root.querySelectorAll("[data-skeleton]").forEach((host,index)=>{
    const profile=host.dataset.skeleton;
    if(!PROFILES.has(profile))throw Error("Unknown skeleton profile: "+profile);
    instances.push(createSkeleton({host,profile,delay,order:Math.min(index,7)}));
  });`,`  root.querySelectorAll("[data-skeleton]").forEach(host=>{
    const profile=host.dataset.skeleton;
    if(!PROFILES.has(profile))throw Error("Unknown skeleton profile: "+profile);
    const order=Number(host.dataset.skeletonOrder||0);
    instances.push(createSkeleton({host,profile,delay,order:Number.isFinite(order)?order:0}));
  });`);
s=s.replace(`    settle(instant=false){instances.forEach(item=>item.settle(instant));},
    destroy(){instances.forEach(item=>item.destroy());}`,`    settle(instant=false){instances.forEach(item=>item.settle(instant));},
    allSettled(){return Promise.all(instances.map(item=>item.whenSettled))},
    destroy(){instances.forEach(item=>item.destroy());}`);
s=s.replace(`  let settled = false;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");`,`  let settled = false;
  let resolveSettled;
  const whenSettled = new Promise(resolve=>{resolveSettled=resolve});
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");`);
s=s.replace(`  let fadeTimer = 0;
  function settle(instant = false){`,`  let fadeTimer = 0;
  function tokenMs(name){
    const value=getComputedStyle(host).getPropertyValue(name).trim();
    return parseFloat(value)*(value.endsWith("ms")?1:1000)||0;
  }
  function finish(){
    layer.remove();
    delete host.dataset.skeletonState;
    delete host.dataset.skeletonProfile;
    host.classList.remove("wd-skeleton");
    resolveSettled();
  }
  function settle(instant = false){`);
s=s.replace(`      layer.remove();
      delete host.dataset.skeletonState;
      delete host.dataset.skeletonProfile;
      host.classList.remove("wd-skeleton");
      return;`,`      finish();
      return;`);
s=s.replace(`    host.dataset.skeletonState = "settled";
    fadeTimer = setTimeout(()=>{
      layer.remove();
      delete host.dataset.skeletonState;
      delete host.dataset.skeletonProfile;
      host.classList.remove("wd-skeleton");
    }, 440);`,`    host.dataset.skeletonState = "settled";
    // Hold the marker until the layer fade and the content reveal both finish.
    // Timing comes from the shared loading tokens, not a hard-coded hand-off.
    const reveal=tokenMs("--wd-motion-skeleton-in")+tokenMs("--wd-motion-stagger")*order;
    const out=tokenMs("--wd-motion-skeleton-out");
    fadeTimer = setTimeout(finish, Math.max(reveal,out)+48);`);
s=s.replace(`  return {settle, destroy, profile, host};`,`  return {settle, destroy, profile, host, whenSettled};`);
if(s===before) throw new Error('no matches');
fs.writeFileSync(f,s);
console.log('patched');
