import apex from '../../assets/apex-provenance.json';

export type PingId =
  | 'danger' | 'push' | 'omw' | 'allin' | 'assist' | 'needvision' | 'missing' | 'enemyvision' | 'generic'
  | 'bait' | 'visioncleared';

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

/** Every ping, in the order the settings window lists them: the default wheel, then the extras. */
const LEGACY_PINGS: readonly PingDef[] = [
  { id: 'danger', name: 'Danger', icon: 'pingwheel_retreatrender', art: ['pingwheel_retreatrender'], sound: 'SRP_12', color: '#ff3b55' },
  { id: 'push', name: 'Push', icon: 'push', art: ['pingwheel_pushrender'], sound: 'SRP_9', color: '#35d27a' },
  { id: 'omw', name: 'On My Way', icon: 'omw', art: ['omw'], sound: 'OnMyWay', color: '#2e8bff' },
  { id: 'allin', name: 'All In', icon: 'all_in', art: ['pingwheel_allin_render_01', 'pingwheel_allin_render_02'], sound: 'SRP_4', color: '#f2b320' },
  { id: 'assist', name: 'Assist Me', icon: 'assist_me', art: ['assist_me'], sound: 'ComeHere', color: '#56d43c' },
  { id: 'needvision', name: 'Need Vision', icon: 'need_vision', art: ['need_vision'], sound: 'SRP_7', color: '#56d43c' },
  { id: 'missing', name: 'Enemy Missing', icon: 'enemy_missing', art: ['enemy_missing'], sound: 'MIA', color: '#f2c518' },
  { id: 'enemyvision', name: 'Enemy Vision', icon: 'enemy_vision', art: ['pingwheel_enemyvisionrender'], sound: 'AreaIsWarded', color: '#ff3b55' },
  { id: 'generic', name: 'Generic', icon: 'icon_ping_go_outer', art: ['pingwheel_basicpingrender'], sound: 'Base', color: '#2e8bff' },
  { id: 'bait', name: 'Bait', icon: 'pingwheel_baitrender', art: ['pingwheel_baitrender'], sound: 'SRP_11', color: '#efbc12' },
  { id: 'visioncleared', name: 'Vision Cleared', icon: 'vision_cleared', art: ['pingwheel_visionclearedrender'], sound: 'SRP_6', color: '#2b80ff' },
];

const names: Record<PingId, string> = {
  danger: '发现敌人', push: '进攻这里', omw: '我要去这里', allin: '一起进攻', assist: '在这里集合',
  needvision: '观察这里', missing: '有人来过', enemyvision: '避开这里', generic: '前往这里',
  bait: '搜索物资', visioncleared: '防守这里',
};
const basename = (path: string): string => path.split('/').pop()!;
export const ALL_PINGS: readonly PingDef[] = LEGACY_PINGS.map(({ id }) => ({
  id, name: names[id], icon: basename(apex[id].outerIcon), art: [basename(apex[id].outerIcon)],
  inner: basename(apex[id].innerIcon), pulse: basename(apex[id].animIcon),
  sound: id === 'danger' ? 'apex_enemy' : 'apex_location',
  color: id === 'danger' ? '#ff4747' : id === 'enemyvision' ? '#ffc450' : '#f3ae4b',
}));
export const DEFAULT_WHEEL: readonly PingId[] = ['generic', 'danger', 'bait', 'omw', 'push', 'visioncleared', 'needvision', 'missing'];
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
