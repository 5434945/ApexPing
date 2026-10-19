import { afterEach, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { VoicePacks } from '../../src/main/voicePacks';
const dirs:string[]=[];
afterEach(()=>{for(const d of dirs.splice(0))rmSync(d,{recursive:true,force:true});});
function fixture(){
  const root=mkdtempSync(join(tmpdir(),'apexping-packs-'));dirs.push(root);
  const path='voices/en/ash/variants/test.ogg',data=Buffer.from('original-test-recording');
  const source=join(root,'source');mkdirSync(join(source,'voices/en/ash/variants'),{recursive:true});
  writeFileSync(join(source,path),data);writeFileSync(join(source,'apexping-voice-pack.json'),JSON.stringify({version:1,language:'en'}));
  const packs=new VoicePacks(join(root,'installed'),join(root,'bundled'),{en:[[path,createHash('sha256').update(data).digest('hex')]],'zh-CN':[]});
  return {root,source,path,data,packs};
}
it('imports a complete verified pack and leaves its source unchanged',async()=>{
  const f=fixture();await f.packs.import(f.source);
  expect(f.packs.status().find(p=>p.language==='en')?.installed).toBe(1);
  expect(readFileSync(join(f.source,f.path))).toEqual(f.data);
  expect(readFileSync(join(f.root,'installed/en/ash/variants/test.ogg'))).toEqual(f.data);
});
it('rejects corruption without replacing the working installed pack',async()=>{
  const f=fixture();await f.packs.import(f.source);writeFileSync(join(f.source,f.path),'corrupted');
  await expect(f.packs.import(f.source)).rejects.toThrow('checksum');
  expect(readFileSync(join(f.root,'installed/en/ash/variants/test.ogg'))).toEqual(f.data);
});
it('rejects an unsupported language and an incomplete pack',async()=>{
  const f=fixture();writeFileSync(join(f.source,'apexping-voice-pack.json'),JSON.stringify({version:1,language:'../en'}));
  await expect(f.packs.import(f.source)).rejects.toThrow('Invalid');
  writeFileSync(join(f.source,'apexping-voice-pack.json'),JSON.stringify({version:1,language:'en'}));rmSync(join(f.source,f.path));
  await expect(f.packs.import(f.source)).rejects.toThrow();
  expect(f.packs.status().find(p=>p.language==='en')?.installed).toBe(0);
});
