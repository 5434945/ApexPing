import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { LEGENDS, isLegendId } from '../../src/shared/legends';
import { ALL_PINGS, DEFAULT_WHEEL } from '../../src/shared/pings';
import { normalizeSettings, rendererPatch } from '../../src/shared/settings';
import { configCommand } from '../../src/shared/protocol';

describe('legend settings and migration', () => {
  it('has 28 distinct heroes and rejects arbitrary asset paths', () => {
    expect(LEGENDS).toHaveLength(28);
    expect(new Set(LEGENDS.map(([id])=>id)).size).toBe(28);
    for (const bad of ['../wraith', null, 'unknown', 'Wraith']) expect(isLegendId(bad)).toBe(false);
  });
  it('validates voice settings and clamps volume', () => {
    expect(normalizeSettings({legend:'mirage', voiceLanguage:'en', voiceVolume:200})).toMatchObject({legend:'mirage',voiceLanguage:'en',voiceVolume:100});
    expect(normalizeSettings({legend:'../secret', voiceLanguage:'ja', voiceVolume:NaN})).toMatchObject({legend:'wraith',voiceLanguage:'zh-CN',voiceVolume:85});
  });
  it('drops emote fields from old configuration and renderer patches', () => {
    const old={emoteTrigger:'ctrl',emoteClick:true,emoteWheel:['okay'],customEmotes:[],emoteSound:true};
    const s=normalizeSettings(old);
    expect(Object.keys(s).some(k=>/emote/i.test(k))).toBe(false);
    expect(rendererPatch(old)).toEqual({});
    expect(configCommand(s,true)).toMatchObject({emoteTrigger:'off',emoteClick:false});
  });
  it('migrates only the old default wheel, preserving custom layouts', () => {
    expect(normalizeSettings({wheel:['generic','danger','bait','omw','push','visioncleared','needvision','missing']}).wheel).toEqual(DEFAULT_WHEEL);
    expect(normalizeSettings({wheel:['enemyvision','audio','bait','push','assist','visioncleared','needvision','missing']}).wheel).toEqual(DEFAULT_WHEEL);
    const custom=[...DEFAULT_WHEEL].reverse();
    expect(normalizeSettings({wheel:custom}).wheel).toEqual(custom);
  });
});

describe('bilingual original voice matrix', () => {
  const assets=resolve(__dirname,'../../assets');
  it('contains a nonempty, verified source for each hero, language and ping', () => {
    const manifest=JSON.parse(readFileSync(resolve(assets,'voice-manifest.json'),'utf8'));
    expect(manifest.missing).toEqual([]);
    for (const [hero] of LEGENDS) for (const ping of ALL_PINGS) {
      const hashes=[];
      for (const lang of ['en','zh-CN']) {
        const item=manifest.voices[`${lang}/${hero}`][ping.id];
        expect(item.sourceName).toContain(`diag_mp_${hero}_ping_`);
        expect(item.sourceStream).toContain(lang==='en'?'english':'mandarin');
        const file=resolve(assets,item.file);
        expect(existsSync(file),file).toBe(true);
        const bytes=readFileSync(file);
        expect(bytes.length).toBeGreaterThan(1000);
        expect(bytes.subarray(0,4).toString()).toBe('OggS');
        const hash=createHash('sha256').update(bytes).digest('hex');
        expect(hash).toBe(item.sha256);
        hashes.push(hash);
      }
      expect(hashes[0]).not.toBe(hashes[1]);
    }
  });
  it('indexes complete, correctly bound OGG variants without mixed heroes or languages', () => {
    const manifest=JSON.parse(readFileSync(resolve(assets,'voice-manifest.json'),'utf8'));
    const index=JSON.parse(readFileSync(resolve(assets,'voice-index.json'),'utf8'));
    const verified=new Set<string>();
    const actions: Record<string,string>={danger:'spotEnemy',generic:'spotDefault',omw:'exploreGoPlayer',push:'attackHere',allin:'attackHere',assist:'regroupHere',needvision:'watchingHere',missing:'cluePresence',enemyvision:'avoidHere',bait:'lootingHere',visioncleared:'defendHere',audio:'hearEnemy'};
    for(const [hero] of LEGENDS) for(const lang of ['en','zh-CN']) for(const ping of ALL_PINGS){
      const variants=manifest.voices[`${lang}/${hero}`][ping.id].variants;
      expect(variants.length).toBeGreaterThan(0);
      expect(index[`${lang}/${hero}/${ping.id}`]).toEqual(variants.map((v:{file:string})=>v.file));
      for(const v of variants){
        expect(v.sourceName).toMatch(new RegExp(`^diag_mp_${hero}_ping_${actions[ping.id]}_(calm|calmFar|urgent)_\\d+_\\d+_1p$`,'i'));
        expect(v.sourceStream).toBe(lang==='en'?'general_english.mstr':'general_mandarin.mstr');
        expect(v.file.startsWith(`voices/${lang}/${hero}/variants/`)).toBe(true);
        if(verified.has(v.file))continue;
        const bytes=readFileSync(resolve(assets,v.file));
        expect(bytes.subarray(0,4).toString()).toBe('OggS');
        expect(createHash('sha256').update(bytes).digest('hex')).toBe(v.sha256);
        verified.add(v.file);
      }
    }
    expect(verified.size).toBeGreaterThan(672);
  },60000);
});
