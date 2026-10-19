import { TICK_SOUND, allSoundNames, allTextureNames, pingById, pingsFor, soundUrl, textureUrl, type PingDef } from '../../shared/pings';
import { isLegendId, type LegendId } from '../../shared/legends';
import type { PingTag } from '../../shared/ipc';
import { DEFAULT_SETTINGS, overlaySettings, type OverlaySettings } from '../../shared/settings';
import { spawnPing } from './pingFx';
import { SoundBank } from './soundBank';
import { VoicePlayer } from './voicePlayer';
import { showToast } from './toast';
import { ApexWheel } from './apexWheel';

const pingLayer = document.getElementById('pings') as HTMLElement;
const toastLayer = document.getElementById('toasts') as HTMLElement;
const svg = document.getElementById('wheel') as unknown as SVGSVGElement;
const sounds = new SoundBank();
const voice = new VoicePlayer();
let settings = overlaySettings(DEFAULT_SETTINGS);
const volume = (): number => settings.muted ? 0 : settings.volume / 100;
const wheel = new ApexWheel(svg, () => {
  if (settings.tickSound) sounds.play(TICK_SOUND, volume() * 0.5);
});
function applySettings(s: OverlaySettings): void {
  voice.stop();
  settings = s;
  wheel.configure(s);
  wheel.setItems(pingsFor(s.wheel).map((p) => ({ key: p.id, icon: textureUrl(p.icon) })));
}
applySettings(settings);
function ping(def: PingDef, x: number, y: number, tag?: PingTag, legend?: LegendId): void {
  spawnPing(pingLayer, def, x, y, { sizePx: settings.pingSizePx, durationS: settings.pingDurationS, tag });
  sounds.play(def.sound, volume());
  // Old room clients have no hero identity: do not invent another hero's voice.
  if (!tag || isLegendId(legend)) {
    voice.play(legend ?? settings.legend, settings.voiceLanguage, def.id,
      settings.muted || !settings.voiceEnabled ? 0 : settings.voiceVolume / 100,
      (path) => window.overlay.reportMissingAssets([path]), settings);
  }
}
window.overlay.on('overlay:settings', applySettings);
window.overlay.on('wheel:open', (p) => {
  if (p.wheel && p.wheel !== 'ping') return;
  wheel.open(p.x, p.y);
  sounds.play('apex_open', volume() * 0.45);
});
window.overlay.on('wheel:move', (p) => wheel.move(p.x, p.y));
window.overlay.on('wheel:release', (p) => {
  const chosen = wheel.release(p.x, p.y);
  if (!chosen) return;
  const def = pingById(chosen.key);
  if (!def) return;
  ping(def, chosen.x, chosen.y);
  window.overlay.reportPing(def.id, chosen.x, chosen.y);
});
window.overlay.on('wheel:cancel', () => wheel.cancel());
window.overlay.on('ping:spawn', (p) => {
  const def = pingById(p.id);
  if (def) ping(def, p.x, p.y, p.tag, p.legend);
});
window.overlay.on('toast:show', (t) => showToast(toastLayer, t.title, t.body));
window.addEventListener('pagehide', () => voice.stop());
const probe = (name: string): Promise<string | null> => new Promise((resolve) => {
  const img = new Image();
  img.onload = () => resolve(null);
  img.onerror = () => resolve(`textures/${name}.png`);
  img.src = textureUrl(name);
});
void Promise.all([
  sounds.load(allSoundNames().map((name) => ({ key: name, url: soundUrl(name) }))),
  Promise.all(allTextureNames().map(probe)),
]).then(([audio, images]) => {
  const missing = [...audio.map((url) => url.replace('../', '')), ...images.filter((s): s is string => s !== null)];
  if (missing.length) window.overlay.reportMissingAssets(missing);
});
