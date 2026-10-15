import { beforeEach, expect, it, vi } from 'vitest';
import { VoicePlayer } from '../../src/renderer/overlay/voicePlayer';
const instances: FakeAudio[]=[];
const catalogue = Object.fromEntries(['en/mirage/audio','en/wraith/danger','zh-CN/lifeline/generic','en/ash/danger'].map(key=>[key,[`voices/${key}.wav`]]));
class FakeAudio {
  volume=1; onerror: (()=>void)|null=null;
  pause=vi.fn(); load=vi.fn(); removeAttribute=vi.fn();
  play=vi.fn(()=>Promise.resolve());
  constructor(public src:string){instances.push(this);}
}
beforeEach(()=>{instances.length=0;vi.stubGlobal('Audio',FakeAudio);});
it('uses an exact language, hero and ping path',()=>{
  const player=new VoicePlayer(catalogue);
  player.play('mirage','en','audio',.85,vi.fn());
  expect(instances[0].src).toBe('../voices/en/mirage/audio.wav');
  expect(instances[0].volume).toBe(.85);
});
it('cancels the old voice and ignores stale errors after switching',()=>{
  const player=new VoicePlayer(catalogue),missing=vi.fn();
  player.play('wraith','en','danger',1,missing);
  player.play('lifeline','zh-CN','generic',1,missing);
  expect(instances[0].pause).toHaveBeenCalled();
  instances[0].onerror?.();expect(missing).not.toHaveBeenCalled();
  instances[1].onerror?.();expect(missing).toHaveBeenCalledWith('voices/zh-CN/lifeline/generic.wav');
});
it('mute stops speech without starting another audio element',()=>{
  const player=new VoicePlayer(catalogue);
  player.play('ash','en','danger',1,vi.fn());
  player.play('ash','en','danger',0,vi.fn());
  expect(instances).toHaveLength(1);expect(instances[0].pause).toHaveBeenCalled();
});
it('plays every variant before recycling and does not repeat at cycle boundaries',()=>{
  const player=new VoicePlayer({'en/ash/danger':['a.ogg','b.ogg','c.ogg']},()=>.5);
  for(let i=0;i<9;i++)player.play('ash','en','danger',1,vi.fn());
  const paths=instances.map(a=>a.src);
  for(let i=0;i<9;i+=3)expect(new Set(paths.slice(i,i+3)).size).toBe(3);
  for(let i=1;i<paths.length;i++)expect(paths[i]).not.toBe(paths[i-1]);
});
it('never substitutes another hero or language when the selected group is missing',()=>{
  const missing=vi.fn(),player=new VoicePlayer({});
  player.play('ash','en','danger',1,missing);
  expect(instances).toHaveLength(0);expect(missing).toHaveBeenCalledWith('voices/en/ash/danger');
});
it('ignores nonfinite volume without starting playback',()=>{
  new VoicePlayer(catalogue).play('ash','en','danger',NaN,vi.fn());
  expect(instances).toHaveLength(0);
});
