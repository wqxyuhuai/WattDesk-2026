// One finite page crossfade includes SVGs, gradients and both glass layers.
// Theme changes are synchronous; snapshots provide the gradual visual change.
export function createThemeController({apply,initialTheme='dark'}){
 const html=document.documentElement,reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let transition=null,requested=initialTheme,revision=0,timer;
 function commit(mode){
  html.dataset.theme=mode;html.style.colorScheme=mode;apply(mode);
  try{localStorage.setItem('wattdesk-home-theme',mode)}catch{/* Persistence is optional. */}
 }
 function clear(){clearTimeout(timer);html.classList.remove('wd-theme-fallback');delete html.dataset.themeTransition;}
 function set(mode,{animate=true}={}){
  if(!['light','dark'].includes(mode))return;
  requested=mode;const current=++revision;
  transition?.skipTransition();transition=null;clear();
  if(!animate||reduced.matches||html.dataset.theme===mode){commit(mode);return;}
  if(document.startViewTransition){
   // Old callbacks can still run after skipTransition: always commit latest intent.
   html.dataset.themeTransition='crossfade';
   transition=document.startViewTransition(()=>commit(requested));
   transition.ready.catch(()=>{});
   transition.finished.catch(()=>{}).finally(()=>{if(revision===current){transition=null;delete html.dataset.themeTransition;}});
  }else{
   html.dataset.themeTransition='colors';html.classList.add('wd-theme-fallback');void html.offsetWidth;commit(mode);
   const value=getComputedStyle(html).getPropertyValue('--wd-motion-theme').trim();
   const duration=parseFloat(value)*(value.endsWith('ms')?1:1000);
   timer=setTimeout(clear,duration+80);
  }
 }
 reduced.addEventListener('change',()=>{if(reduced.matches){revision++;transition?.skipTransition();transition=null;clear();commit(requested);}});
 commit(initialTheme);
 return {set,toggle:()=>set(requested==='dark'?'light':'dark')};
}
