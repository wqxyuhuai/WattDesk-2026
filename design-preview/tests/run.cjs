const {spawnSync}=require('node:child_process');
const path=require('node:path');
process.chdir(path.resolve(__dirname,'..'));
for(const name of ['verify-home.cjs','verify-shortcuts.cjs','verify-routing.cjs','verify-plants-filters.cjs','verify-workspace-tabs.cjs','verify-responsive.cjs','verify-glass.cjs','verify-floating-surfaces.cjs','verify-theme.cjs','verify-foundations.cjs','verify-components.cjs','verify-motion.cjs','verify-search.cjs']){
 console.log(`\nChecking ${name}`);
 const result=spawnSync(process.execPath,[path.join(__dirname,name)],{stdio:'inherit'});
 if(result.status!==0)process.exit(result.status||1);
}
