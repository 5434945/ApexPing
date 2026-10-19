import { createHash, randomUUID } from 'node:crypto';
import { existsSync, lstatSync } from 'node:fs';
import { isFile } from './fileState';
import { mkdir, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { isAbsolute, join, relative } from 'node:path';
import manifest from '../../assets/voice-manifest.json';
import type { VoiceLanguage } from '../shared/legends';
import type { VoicePackStatus } from '../shared/ipc';

const languages: VoiceLanguage[] = ['zh-CN', 'en'];
const records = Object.fromEntries(languages.map(language => [language, [...new Map(
  Object.entries(manifest.voices).filter(([key]) => key.startsWith(language+'/'))
    .flatMap(([,group]) => Object.values(group).flatMap(action => action.variants.map(v => [v.file,v.sha256] as const)))
).entries()]])) as Record<VoiceLanguage, [string,string][]>;

export class VoicePacks {
  private busy = false;
  constructor(readonly root: string, private bundled: string, private catalogue = records) {}
  status(): VoicePackStatus[] {
    return languages.map(language => ({ language, total:this.catalogue[language].length,
      installed:this.catalogue[language].filter(([file]) => isFile(join(this.root,file.slice(7)),false) || isFile(join(this.bundled,file.slice(7)),false)).length }));
  }
  async import(source: string): Promise<void> {
    if (this.busy) throw Error('An import is already running');
    this.busy = true;
    const staging = join(this.root, '.import-'+randomUUID());
    const backup = join(this.root, '.backup-'+randomUUID());
    let movedOld = false;
    let target = '';
    try {
      const sourceRoot = await realpath(source);
      const description = JSON.parse(await readFile(join(sourceRoot,'apexping-voice-pack.json'),'utf8'));
      const language = description.language as VoiceLanguage;
      if (description.version !== 1 || !languages.includes(language)) throw Error('Invalid ApexPing voice pack');
      target = join(this.root,language);
      await mkdir(staging,{recursive:true});
      // Only files in the shipped catalogue are imported; their hashes must match the original export.
      for (const [file,hash] of this.catalogue[language]) {
        const input = join(sourceRoot,file);
        const canonical = await realpath(input);
        const rel = relative(sourceRoot,canonical);
        if (rel.startsWith('..') || isAbsolute(rel) || !lstatSync(input).isFile() || lstatSync(input).isSymbolicLink()) throw Error('Invalid voice pack path');
        const data = await readFile(input);
        if (createHash('sha256').update(data).digest('hex') !== hash) throw Error('Voice pack checksum mismatch: '+file);
        const output = join(staging, file.split('/').slice(2).join('/'));
        await mkdir(join(output,'..'),{recursive:true});
        await writeFile(output,data);
      }
      if (existsSync(target)) {await rename(target,backup);movedOld=true;}
      try {await rename(staging,target);} catch (error) {if(movedOld) await rename(backup,target);throw error;}
      if (movedOld) await rm(backup,{recursive:true,force:true});
    } finally {
      try {await rm(staging,{recursive:true,force:true});} finally {this.busy = false;}
    }
  }
}
