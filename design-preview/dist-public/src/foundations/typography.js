// Shared binding for semantic components and the archived Figma scene.
export function applyTypeStyle(element, name){
 element.dataset.typeStyle=name;
 for(const property of ['font-size','font-weight','line-height','letter-spacing','font-variation-settings','font-optical-sizing'])element.style.removeProperty(property);
}
export function createSceneTypography(source){
 const styles=new Map(source.styles.map(row=>[row[0],row]));
 const nodes=new Map(source.rows.map(row=>[row[0],row]));
 return (element,node)=>{
  const binding=nodes.get(node.id),style=binding&&styles.get(binding[1]);
  if(!style)return false;
  applyTypeStyle(element,style[1]);
  element.dataset.typeStyleId=style[0];
  return true;
 };
}
