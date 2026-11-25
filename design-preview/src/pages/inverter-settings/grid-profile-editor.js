const STATUS_VIEW=Object.freeze({
 done:["Certified","success"],
 cert:["In certification","warning"],
 plan:["Planned","idle"],
 generic:["Generic","idle"]
});

export function gridProfileEntries(model){
 return Object.entries(model.GRID_PROFILES).map(([key,profile])=>{
  const previewable=profile.country==="IT"&&model.capabilities.ipsPreview;
  const interactive=Boolean(profile.p||previewable);
  const [status,tone]=profile.p
   ?(STATUS_VIEW[profile.status]||["No parameter set","idle"])
   :previewable
    ?["Preview only","signal"]
    :["No parameter set","idle"];
  return {
   key,
   profile,
   previewable,
   selectable:interactive,
   status,
   tone,
   label:`${profile.country} · ${profile.label}`,
   description:profile.full
  };
 });
}

export function filterGridProfiles(entries,query){
 const normalized=String(query||"").trim().toLocaleLowerCase();
 if(!normalized)return entries;
 return entries.filter(entry=>
  `${entry.label} ${entry.description} ${entry.profile.country||""}`
   .toLocaleLowerCase()
   .includes(normalized)
 );
}
