import apex from '../../assets/apex-provenance.json';

export type PingId =
  | 'danger' | 'push' | 'omw' | 'allin' | 'assist' | 'needvision' | 'missing' | 'enemyvision' | 'generic'
  | 'bait' | 'visioncleared' | 'audio';

export interface PingDef {
  id: PingId;
  name: string;
  /** Texture on the wheel slice: file in assets/textures without ".png". */
  icon: string;
  /** Textures drawn at the ping location. Two entries = All In's clashing halves. */
  art: string[];
  /** File in assets/sounds without ".wav". */
  sound: string;
  /** Ring and glow colour. */
  color: string;
  inner?: string;
  pulse?: string;
}

const names: Record<PingId, string> = {
  danger: '发现敌人', push: '进攻这里', omw: '我要去这里', allin: '一起进攻', assist: '在这里集合',
  needvision: '观察这里', missing: '有人来过', enemyvision: '避开这里', generic: '前往这里',
  bait: '搜索物资', visioncleared: '防守这里',
  audio: '听到敌人',
};
const basename = (path: string): string => path.split('/').pop()!;
export const ALL_PINGS: readonly PingDef[] = (Object.keys(names) as PingId[]).map((id) => ({
  id, name: names[id], icon: basename(apex[id].outerIcon), art: [basename(apex[id].outerIcon)],
  inner: basename(apex[id].innerIcon), pulse: basename(apex[id].animIcon),
  sound: id === 'danger' ? 'apex_enemy' : 'apex_location',
  color: ['danger', 'audio', 'push', 'allin', 'missing'].includes(id) ? '#ff4747' : '#f3ae4b',
}));
// EA's Arsenal wheel, top then clockwise. Direct location/enemy pings remain available in the editor.
export const DEFAULT_WHEEL: readonly PingId[] = ['enemyvision', 'audio', 'bait', 'push', 'assist', 'visioncleared', 'needvision', 'missing'];
export const DEFAULT_CLICK_PING: PingId = 'generic';
export const WHEEL_SLOTS = 8;

export const TICK_SOUND = 'apex_tick';
export const FALLBACK_TEXTURE = 'icon_ping_go_outer';

export function pingById(id: string): PingDef | undefined {
  return ALL_PINGS.find((p) => p.id === id);
}

export const isPingId = (v: unknown): v is PingId => typeof v === 'string' && pingById(v) !== undefined;

/** Looks up ids already known to be valid (from normalized settings). */
export const pingsFor = (ids: readonly PingId[]): PingDef[] => ids.map((id) => pingById(id) as PingDef);

export const DEFAULT_WHEEL_PINGS: readonly PingDef[] = pingsFor(DEFAULT_WHEEL);

/** Relative to a renderer page at <root>/<page>/index.html; assets/ is served at <root>/. */
export const textureUrl = (name: string): string => `../textures/${name}.png`;
export const soundUrl = (name: string): string => `../sounds/${name}.wav`;

export function allSoundNames(): string[] {
  return [...new Set([...ALL_PINGS.map((p) => p.sound), TICK_SOUND, 'apex_open'])];
}

export function allTextureNames(): string[] {
  return [...new Set([...ALL_PINGS.flatMap((p) => [p.icon, ...p.art, p.inner!, p.pulse!]), FALLBACK_TEXTURE])];
}
