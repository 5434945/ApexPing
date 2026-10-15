import type { LegendId, VoiceLanguage } from '../../shared/legends';
import type { PingId } from '../../shared/pings';
import voiceIndex from '../../../assets/voice-index.json';

/** One voice channel; new pings and settings changes cancel the previous line. */
export class VoicePlayer {
  private audio: HTMLAudioElement | null = null;
  private generation = 0;
  private bags = new Map<string, string[]>();
  private previous = new Map<string, string>();
  constructor(private catalogue: Readonly<Record<string, readonly string[]>> = voiceIndex,
    private random: () => number = Math.random) {}

  private choose(key: string): string | undefined {
    const candidates = this.catalogue[key];
    if (!candidates?.length) return undefined;
    let bag = this.bags.get(key);
    if (!bag?.length) {
      bag = [...new Set(candidates)];
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      // Prevent a repeated line even across shuffle-cycle boundaries.
      if (bag.length > 1 && bag[bag.length - 1] === this.previous.get(key)) {
        [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
      }
      this.bags.set(key, bag);
    }
    const selected = bag.pop()!;
    this.previous.set(key, selected);
    return selected;
  }
  stop(): void {
    this.generation++;
    if (this.audio) { this.audio.pause(); this.audio.removeAttribute('src'); this.audio.load(); }
    this.audio = null;
  }
  play(legend: LegendId, language: VoiceLanguage, ping: PingId, volume: number, missing: (path: string) => void): void {
    this.stop();
    if (!Number.isFinite(volume) || volume <= 0) return;
    const token = this.generation;
    const key = `${language}/${legend}/${ping}`;
    const path = this.choose(key);
    if (!path) { missing(`voices/${key}`); return; }
    const audio = this.audio = new Audio(`../${path}`);
    audio.volume = Math.min(1, Math.max(0, volume));
    audio.onerror = () => { if (token === this.generation) missing(path); };
    void audio.play().catch(() => { if (token === this.generation) missing(path); });
  }
}
