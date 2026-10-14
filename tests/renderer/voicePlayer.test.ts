import { beforeEach, expect, it, vi } from 'vitest';
import { VoicePlayer } from '../../src/renderer/overlay/voicePlayer';
const instances: FakeAudio[]=[];
class FakeAudio {
  volume=1; onerror: (()=>void)|null=null;
  pause=vi.fn(); load=vi.fn(); removeAttribute=vi.fn();
  play=vi.fn(()=>Promise.resolve());
  constructor(public src:string){instances.push(this);}
}
beforeEach(()=>{instances.length=0;vi.stubGlobal('Audio',FakeAudio);});
it('uses an exact language, hero and ping path',()=>{
  const player=new VoicePlayer();
  player.play('mirage','en','audio',.85,vi.fn());
  expect(instances[0].src).toBe('../voices/en/mirage/audio.wav');
  expect(instances[0].volume).toBe(.85);
});
it('cancels the old voice and ignores stale errors after switching',()=>{
  const player=new VoicePlayer(),missing=vi.fn();
  player.play('wraith','en','danger',1,missing);
  player.play('lifeline','zh-CN','generic',1,missing);
  expect(instances[0].pause).toHaveBeenCalled();
  instances[0].onerror?.();expect(missing).not.toHaveBeenCalled();
  instances[1].onerror?.();expect(missing).toHaveBeenCalledWith('voices/zh-CN/lifeline/generic.wav');
});
it('mute stops speech without starting another audio element',()=>{
  const player=new VoicePlayer();
  player.play('ash','en','danger',1,vi.fn());
  player.play('ash','en','danger',0,vi.fn());
  expect(instances).toHaveLength(1);expect(instances[0].pause).toHaveBeenCalled();
});
