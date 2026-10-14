import type { LegendId, VoiceLanguage } from '../../shared/legends';
import type { PingId } from '../../shared/pings';

/** One voice channel; new pings and settings changes cancel the previous line. */
export class VoicePlayer {
  private audio: HTMLAudioElement | null = null;
  private generation = 0;
  stop(): void {
    this.generation++;
    if (this.audio) { this.audio.pause(); this.audio.removeAttribute('src'); this.audio.load(); }
    this.audio = null;
  }
  play(legend: LegendId, language: VoiceLanguage, ping: PingId, volume: number, missing: (path: string) => void): void {
    this.stop();
    if (volume <= 0) return;
    const token = this.generation;
    const path = `voices/${language}/${legend}/${ping}.wav`;
    const audio = this.audio = new Audio(`../${path}`);
    audio.volume = Math.min(1, Math.max(0, volume));
    audio.onerror = () => { if (token === this.generation) missing(path); };
    void audio.play().catch(() => { if (token === this.generation) missing(path); });
  }
}
