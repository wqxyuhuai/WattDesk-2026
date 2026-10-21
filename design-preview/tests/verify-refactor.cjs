const {spawnSync}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
process.chdir(path.resolve(__dirname,'..'));
const result=spawnSync(process.execPath,['tests/capture-refactor.cjs','tests/output/refactor-after'],{stdio:'inherit'});
if(result.status!==0)process.exit(result.status||1);
const python=process.env.WATTDESK_PYTHON||'python';
const script=`from PIL import Image,ImageChops
import json
results=[]
for theme in ['dark','light']:
 for width in [1545,1920]:
  name=f'{theme}-{width}.png'
  a=Image.open('tests/fixtures/refactor-before/'+name).convert('RGB')
  b=Image.open('tests/output/refactor-after/'+name).convert('RGB')
  diff=ImageChops.difference(a,b)
  values=list(diff.get_flattened_data())
  changed=sum(p!=(0,0,0) for p in values)
  delta=max(max(p) for p in values)
  results.append({'name':name,'changedPixels':changed,'maxChannelDelta':delta})
  assert delta<=4 and changed<1000,results[-1]
print(json.dumps(results))`;
const diff=spawnSync(python,['-c',script],{encoding:'utf8'});process.stdout.write(diff.stdout);if(diff.status!==0){process.stderr.write(diff.stderr);process.exit(diff.status||1)}
const before=JSON.parse(fs.readFileSync('tests/fixtures/refactor-before/audit.json'));
const after=JSON.parse(fs.readFileSync('tests/output/refactor-after/audit.json'));
for(let i=0;i<before.length;i++){
 const original=new Map(before[i].dom.map(n=>[n.id,n]));
 for(const node of after[i].dom){assert.deepEqual(node,original.get(node.id),`Existing visible geometry and type changed: ${node.id}`)}
}
console.log('\nRetained scene geometry and text styles match the pre-refactor baseline.');
