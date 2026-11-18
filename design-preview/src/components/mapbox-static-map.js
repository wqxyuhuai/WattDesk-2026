import {createTextElement as text} from "../foundations/dom.js";

const TOKEN_META="mapbox-access-token";
const TOKEN_STORAGE_KEY="wattdesk.mapbox.token";
const TOKEN_QUERY_KEY="mapboxToken";
let mapIntroPlayed=false;

const LOCATION_COORDINATES=Object.freeze({
 "Kassel, Germany":{longitude:9.4797,latitude:51.3127,zoom:11.6},
 "Berlin, Germany":{longitude:13.405,latitude:52.52,zoom:11.4},
 "Hamburg, Germany":{longitude:9.9937,latitude:53.5511,zoom:11.3},
 "Ulm, Germany":{longitude:9.9876,latitude:48.4011,zoom:11.7},
 "Åmål, Sweden":{longitude:12.7048,latitude:59.0511,zoom:10.8}
});

function readToken(){
 const metaToken=document.querySelector(`meta[name="${TOKEN_META}"]`)?.getAttribute("content")?.trim()||"";
 try{
  const url=new URL(window.location.href);
  const localHost=url.hostname==="127.0.0.1"||url.hostname==="localhost";
  const bootstrapToken=localHost?url.searchParams.get(TOKEN_QUERY_KEY)?.trim():"";
  if(bootstrapToken){
   window.WATTDESK_MAPBOX_TOKEN=bootstrapToken;
   try{window.localStorage.setItem(TOKEN_STORAGE_KEY,bootstrapToken);}catch{}
   url.searchParams.delete(TOKEN_QUERY_KEY);
   window.history.replaceState(window.history.state,"",`${url.pathname}${url.search}${url.hash}`);
   return bootstrapToken;
  }
  const globalToken=typeof window.WATTDESK_MAPBOX_TOKEN==="string"?window.WATTDESK_MAPBOX_TOKEN.trim():"";
  if(globalToken)return globalToken;
  if(metaToken)return metaToken;
  const stored=window.localStorage.getItem(TOKEN_STORAGE_KEY)?.trim();
  if(stored)return stored;
 }catch{
  // Storage can be unavailable in privacy-restricted contexts.
 }
 return metaToken;
}

export function coordinatesForLocation(location){
 return LOCATION_COORDINATES[location]??{longitude:10.4515,latitude:51.1657,zoom:5.8};
}

export function buildMapboxStaticURL({
 token,
 longitude,
 latitude,
 zoom=13.2,
 theme="dark",
 width=720,
 height=440
}={}){
 if(!token)return "";
 const style=theme==="light"?"light-v11":"dark-v11";
 const focusX=.75;
 const focusY=.5;
 const worldPixels=256*2**zoom;
 const longitudePerPixel=360/worldPixels;
 const latitudePerPixel=longitudePerPixel*Math.cos(latitude*Math.PI/180);
 const bounds=[
  longitude-longitudePerPixel*width*focusX,
  latitude-latitudePerPixel*height*focusY,
  longitude+longitudePerPixel*width*(1-focusX),
  latitude+latitudePerPixel*height*(1-focusY)
 ];
 const query=new URLSearchParams({
  access_token:token,
  logo:"true",
  attribution:"true",
  setfilter:JSON.stringify(["boolean",false]),
  layer_id:"road-label-simple"
 });
 return `https://api.mapbox.com/styles/v1/mapbox/${style}/static/[${bounds.map(value=>value.toFixed(6)).join(",")}]/${width}x${height}@2x?${query}`;
}

function splitLocation(location){
 const value=String(location||"").trim();
 const index=value.lastIndexOf(",");
 if(index<0)return{address:value,country:""};
 return{
  address:value.slice(0,index).trim(),
  country:value.slice(index+1).trim()
 };
}

export function createMapboxStaticMap({location,address,country,longitude,latitude,zoom=13.2,showLocation=true,locationControl=null}={}){
 const coordinates=coordinatesForLocation(location);
 const parts=splitLocation(location);
 const center={
  longitude:Number.isFinite(longitude)?longitude:coordinates.longitude,
  latitude:Number.isFinite(latitude)?latitude:coordinates.latitude,
  zoom:Number.isFinite(zoom)?zoom:coordinates.zoom
 };
 const card=text("aside","site-v2-map");
 card.setAttribute("aria-label",`Location map for ${location||"this plant"}`);
 const media=text("div","site-v2-map-media");
 media.setAttribute("role","group");
 media.setAttribute("aria-label",`Map preview for ${location||"this plant"}`);
 function createBank(theme){
  const element=text("div","site-v2-map-bank");
  element.dataset.mapTheme=theme;
  element.setAttribute("aria-hidden","true");
  const sharpImage=document.createElement("img");
  sharpImage.className="site-v2-map-image site-v2-map-image--sharp";
  sharpImage.setAttribute("role","img");
  sharpImage.setAttribute("aria-label",`Map preview for ${location||"this plant"}`);
  sharpImage.alt="";
  sharpImage.loading="eager";
  sharpImage.decoding="async";
  const blurLayer=text("div","site-v2-map-blur-layer");
  const blurredImage=document.createElement("img");
  blurredImage.className="site-v2-map-image site-v2-map-image--blurred";
  blurredImage.alt="";
  blurredImage.setAttribute("aria-hidden","true");
  blurredImage.loading="eager";
  blurredImage.decoding="async";
  blurLayer.append(blurredImage);
  element.append(sharpImage,blurLayer);
  return{theme,element,sharpImage,blurLayer,blurredImage,url:"",loaded:false,loadPromise:null};
 }
 const banks={dark:createBank("dark"),light:createBank("light")};
 media.append(banks.dark.element,banks.light.element);
 if(locationControl)media.append(locationControl);
 if(showLocation){
  const copy=text("div","site-v2-map-copy");
  copy.append(
   text("span","site-v2-map-country",country||parts.country||"Country not set","Caption1/Regular"),
   text("strong","site-v2-map-address",address||parts.address||"Location not set","Footnote/Emphasized")
  );
  media.append(copy);
 }
 card.append(media);

 let disposed=false,tokenCache="",syncRevision=0,activeBank=null,activationCleanup=null,preloadTimer=0;
 const mapUrl=theme=>buildMapboxStaticURL({
  token:tokenCache,
  longitude:center.longitude,
  latitude:center.latitude,
  zoom:center.zoom,
  theme,
  width:720,
  height:440
 });
 function loadBank(bank,url){
  if(bank.url===url&&bank.loaded)return Promise.resolve(bank);
  if(bank.url===url&&bank.loadPromise)return bank.loadPromise;
  bank.url=url;
  bank.loaded=false;
  bank.element.dataset.mapReady="false";
  bank.loadPromise=new Promise((resolve,reject)=>{
   const loader=new Image();
   loader.decoding="async";
   loader.onload=()=>{
    bank.sharpImage.src=url;
    bank.blurredImage.src=url;
    Promise.allSettled([
     bank.sharpImage.decode?.(),
     bank.blurredImage.decode?.()
    ]).then(()=>{
     bank.loaded=true;
     bank.element.dataset.mapReady="true";
     resolve(bank);
    },reject);
   };
   loader.onerror=()=>{
    bank.loadPromise=null;
    reject(new Error("Mapbox image failed to load"));
   };
   loader.src=url;
  });
  return bank.loadPromise;
 }
 function afterThemeSnapshot(callback){
  const html=document.documentElement;
  let frame=0,observer=null;
  const run=()=>{frame=requestAnimationFrame(()=>callback());};
  if(!html.hasAttribute("data-theme-snapshot")){
   run();
  }else{
   observer=new MutationObserver(()=>{
    if(html.hasAttribute("data-theme-snapshot"))return;
    observer.disconnect();
    run();
   });
   observer.observe(html,{attributes:true,attributeFilter:["data-theme-snapshot"]});
  }
  return()=>{
   observer?.disconnect();
   cancelAnimationFrame(frame);
  };
 }
 function activateBank(next,{animate=true}={}){
  if(disposed||activeBank===next)return;
  const previous=activeBank;
  activeBank=next;
  card.dataset.mapTheme=next.theme;
  card.dataset.mapReveal=animate?"animated":"immediate";
  for(const bank of Object.values(banks))bank.element.setAttribute("aria-hidden",String(bank!==next));
  if(!animate){
   next.element.classList.add("is-instant");
   previous?.element.classList.add("is-instant");
  }
  next.element.classList.add("is-active");
  previous?.element.classList.remove("is-active");
  if(!animate){
   requestAnimationFrame(()=>{
    next.element.classList.remove("is-instant");
    previous?.element.classList.remove("is-instant");
   });
  }
 }
 function queueThemePreload(theme){
  clearTimeout(preloadTimer);
  const preload=()=>{
   const other=theme==="dark"?banks.light:banks.dark;
   const url=mapUrl(other.theme);
   if(other.url===url)return;
   loadBank(other,url).catch(()=>{});
  };
  if("requestIdleCallback" in window)window.requestIdleCallback(preload,{timeout:1200});
  else preloadTimer=setTimeout(preload,180);
 }
 const sync=()=>{
  if(disposed)return;
  const revision=++syncRevision;
  tokenCache=readToken();
  if(!tokenCache){
   card.dataset.mapState="preview";
   return;
  }
  const theme=document.documentElement.dataset.theme==="light"?"light":"dark";
  const next=banks[theme];
  card.dataset.mapState="loading";
  loadBank(next,mapUrl(theme)).then(()=>{
   if(disposed||revision!==syncRevision)return;
   card.dataset.mapState="ready";
   activationCleanup?.();
   activationCleanup=afterThemeSnapshot(()=>{
    if(disposed||revision!==syncRevision)return;
    activateBank(next,{animate:Boolean(activeBank)||!mapIntroPlayed});
    mapIntroPlayed=true;
    queueThemePreload(theme);
   });
  }).catch(()=>{
   if(disposed||revision!==syncRevision)return;
   card.dataset.mapState="error";
  });
 };
 const themeObserver=new MutationObserver(mutations=>{
  if(mutations.some(mutation=>mutation.attributeName==="data-theme"))sync();
 });
 themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
 sync();
 return {
  element:card,
  destroy(){
   disposed=true;
   syncRevision++;
   activationCleanup?.();
   clearTimeout(preloadTimer);
   themeObserver.disconnect();
   for(const bank of Object.values(banks)){
    bank.sharpImage.removeAttribute("src");
    bank.blurredImage.removeAttribute("src");
   }
  }
 };
}
