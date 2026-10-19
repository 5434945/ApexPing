import type { LegendId, VoiceLanguage } from '../../shared/legends';
import type { PingId } from '../../shared/pings';
import voiceIndex from '../../../assets/voice-index.json';
import voiceDetails from '../../../assets/voice-details.json';
import { voiceCandidates, type VoicePreferences, type VoiceDetail } from '../../shared/voiceSelection';

/** One voice channel; new pings and settings changes cancel the previous line. */
export class VoicePlayer {
  private audio: HTMLAudioElement | null = null;
  private generation = 0;
  private bags = new Map<string, string[]>();
  private previous = new Map<string, string>();
  private signatures = new Map<string, string>();
  private context: AudioContext | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private gain: GainNode | null = null;
  constructor(private catalogue: Readonly<Record<string, readonly string[]>> = voiceIndex,
    private random: () => number = Math.random) {}

  private choose(key: string, preferences?: VoicePreferences): string | undefined {
    const candidates = voiceCandidates(this.catalogue[key] ?? [], preferences, voiceDetails);
    if (!candidates?.length) return undefined;
    const signature = candidates.join('|');
    if (signature !== this.signatures.get(key)) { this.bags.delete(key); this.signatures.set(key, signature); }
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
    this.source?.disconnect(); this.source = null;
    this.gain?.disconnect(); this.gain = null;
  }
  play(legend: LegendId, language: VoiceLanguage, ping: PingId, volume: number, missing: (path: string) => void,
    preferences?: VoicePreferences & { voiceNormalize: boolean }): void {
    const key = `${language}/${legend}/${ping}`;
    const path = this.choose(key, preferences);
    if (!path) { this.stop(); if (volume > 0 && !this.catalogue[key]?.length) missing(`voices/${key}`); return; }
    this.playPath(path, volume, preferences?.voiceNormalize ?? false, missing);
  }
  playPath(path: string, volume: number, normalize: boolean, missing: (path: string) => void, ended?: () => void): void {
    this.stop();
    if (!Number.isFinite(volume) || volume <= 0) return;
    const token = this.generation;
    const audio = this.audio = new Audio(`../${path}`);
    audio.volume = Math.min(1, Math.max(0, volume));
    if (normalize && typeof AudioContext !== 'undefined') {
      this.context ??= new AudioContext();
      this.source = this.context.createMediaElementSource(audio);
      this.gain = this.context.createGain();
      this.gain.gain.value = (voiceDetails as Record<string, VoiceDetail>)[path]?.gain ?? 1;
      this.source.connect(this.gain).connect(this.context.destination);
      void this.context.resume();
    }
    audio.onerror = () => { if (token === this.generation) missing(path); };
    audio.onended = () => { if (token === this.generation) { this.stop(); ended?.(); } };
    void audio.play().catch(() => { if (token === this.generation) missing(path); });
  }
}
