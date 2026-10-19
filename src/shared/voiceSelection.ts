import type { Settings } from './settings';

export interface VoiceDetail { duration: number; gain: number; tone: string; name: string; peak: number }
export type VoicePreferences = Pick<Settings, 'voiceMode' | 'voiceFavorites' | 'voiceBlocked'>;
export const isVoicePath = (value: unknown): value is string => typeof value === 'string'
  && /^voices\/(en|zh-CN)\/[a-z]+\/variants\/[a-zA-Z0-9_-]+\.ogg$/.test(value);

export function voiceCandidates(paths: readonly string[], preferences?: VoicePreferences,
  details: Readonly<Record<string, VoiceDetail>> = {}): string[] {
  const available = [...new Set(paths)].filter(path => !preferences?.voiceBlocked.includes(path));
  if (preferences?.voiceMode !== 'selected') return available;
  const favorites = available.filter(path => preferences.voiceFavorites.includes(path));
  if (favorites.length) return favorites;
  // A reproducible shortlist, not a claim that these lines have been manually reviewed.
  const calm = available.filter(path => /calm/i.test(details[path]?.tone ?? '') && (details[path]?.duration ?? 0) <= 4);
  return (calm.length ? calm : available).slice(0, 5);
}
