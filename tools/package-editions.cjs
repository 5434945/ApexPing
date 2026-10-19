const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {getPath7za}=require('app-builder-lib/out/toolsets/7zip');
const root=path.resolve(__dirname,'..'),source=path.join(root,'release/win-unpacked');
const version=require('../package.json').version;
const output=path.join(root,'release/editions-'+version);
if(!fs.existsSync(path.join(source,'ApexPing.exe')))throw Error('Build win-unpacked first');
if(fs.existsSync(output))throw Error('Edition directory exists; refusing to overwrite it');
fs.mkdirSync(output,{recursive:true});
const base=path.join(output,'ApexPing-'+version+'-Windows-x64-base');
fs.cpSync(source,base,{recursive:true,filter:file=>!path.relative(source,file).replaceAll('\\','/').startsWith('resources/app.asar.unpacked/out/renderer/voices')});
for(const language of ['zh-CN','en']) {
  const pack=path.join(output,'ApexPing-'+version+'-voices-'+language);
  fs.mkdirSync(path.join(pack,'voices'),{recursive:true});
  fs.cpSync(path.join(root,'assets/voices',language),path.join(pack,'voices',language),{recursive:true});
  fs.writeFileSync(path.join(pack,'apexping-voice-pack.json'),JSON.stringify({version:1,language,appVersion:version},null,2)+'\n');
}
console.log(output);
async function archive() {
  const sevenZip=await getPath7za();
  const items=[[source,`ApexPing-${version}-Windows-x64`],[base,path.basename(base)],
    ...['zh-CN','en'].map(language=>{const name=`ApexPing-${version}-voices-${language}`;return [path.join(output,name),name];})];
  for(const [directory,name] of items) {
    const zip=path.join(root,'release',name+'.zip');
    if(fs.existsSync(zip))throw Error('Refusing to overwrite '+zip);
    execFileSync(sevenZip,['a','-tzip','-mx=3','-mmt=on',zip,'.'],{cwd:directory,stdio:'pipe'});
    execFileSync(sevenZip,['t',zip],{stdio:'pipe'});
    console.log(JSON.stringify({name:path.basename(zip),bytes:fs.statSync(zip).size,verified:true}));
  }
}
archive().catch(error=>{console.error(error.message);process.exitCode=1;});
