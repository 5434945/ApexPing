import { expect, it } from 'vitest';
import { isVoicePath, voiceCandidates, type VoiceDetail } from '../../src/shared/voiceSelection';
import { normalizeSettings } from '../../src/shared/settings';
import voiceIndex from '../../assets/voice-index.json';
import voiceDetails from '../../assets/voice-details.json';
const preferences = {voiceMode:'selected' as const,voiceFavorites:[],voiceBlocked:[]};
it('applies blocks before favorite selection and never substitutes an excluded line',()=>{
  expect(voiceCandidates(['a','b','c'],{...preferences,voiceFavorites:['a','b'],voiceBlocked:['a']})).toEqual(['b']);
  expect(voiceCandidates(['a'],{...preferences,voiceBlocked:['a']})).toEqual([]);
});
it('uses a calm shortlist only when no available favorite exists',()=>{
  const detail = (tone:string,duration:number):VoiceDetail=>({tone,duration,gain:1,name:'',peak:.5});
  const details={a:detail('combat',1),b:detail('calmFar',2),c:detail('calmNear',6)};
  expect(voiceCandidates(['a','b','c'],preferences,details)).toEqual(['b']);
  expect(voiceCandidates(['a','b','c'],{...preferences,voiceFavorites:['a']},details)).toEqual(['a']);
  expect(voiceCandidates(['a','b','c'],{...preferences,voiceMode:'all'},details)).toEqual(['a','b','c']);
});
it('normalizes preferences from old or untrusted settings',()=>{
  const path='voices/en/wraith/variants/spotEnemy_calm_01.ogg';
  expect(isVoicePath(path)).toBe(true);
  const s=normalizeSettings({favoriteLegends:['wraith','wraith','x'],recentLegends:['ash','x'],voiceFavorites:[path,'../bad',path],voiceMode:'wrong',wheelScale:999});
  expect(s.favoriteLegends).toEqual(['wraith']);expect(s.recentLegends).toEqual(['ash']);expect(s.voiceFavorites).toEqual([path]);
  expect(s.voiceMode).toBe('all');expect(s.wheelScale).toBe(135);expect(s.voiceNormalize).toBe(true);
});
it('has bounded, measured gain and duration for every shipped recording',()=>{
  const details:Readonly<Record<string,VoiceDetail>>=voiceDetails;
  const files=new Set(Object.values(voiceIndex).flat());
  expect(files.size).toBe(13637);
  for(const path of files){
    const d=details[path];expect(d,path).toBeDefined();expect(d.duration,path).toBeGreaterThan(0);
    expect(d.gain,path).toBeGreaterThan(0);expect(d.gain,path).toBeLessThanOrEqual(2);
    expect(d.gain*d.peak,path).toBeLessThan(.921);
  }
});
