import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ALL_PINGS, DEFAULT_WHEEL, DEFAULT_WHEEL_PINGS, allSoundNames, allTextureNames, pingById, soundUrl, textureUrl,
} from '../../src/shared/pings';

const assets = resolve(__dirname, '../../assets');

describe('ping table', () => {
  it('lays out the default wheel top then clockwise', () => {
    expect(DEFAULT_WHEEL).toEqual(['generic', 'danger', 'bait', 'omw', 'push', 'visioncleared', 'needvision', 'missing']);
    expect(DEFAULT_WHEEL_PINGS.map((p) => p.id)).toEqual(DEFAULT_WHEEL);
  });

  it('offers regroup, avoid and team attack beyond the default wheel', () => {
    expect(ALL_PINGS.filter(p => !DEFAULT_WHEEL.includes(p.id)).map(p => p.id).sort()).toEqual(['allin', 'assist', 'enemyvision']);
  });

  it('uses different original sources for enemy and location pings', () => {
    expect(pingById('danger')?.sound).toBe('apex_enemy');
    expect(pingById('visioncleared')?.sound).toBe('apex_location');
  });

  it('uses the original loot marker on the wheel and on screen', () => {
    expect(pingById('bait')).toMatchObject({ icon: 'icon_ping_loot', art: ['icon_ping_loot'] });
  });

  it('has unique ids', () => {
    expect(new Set(ALL_PINGS.map((p) => p.id)).size).toBe(ALL_PINGS.length);
  });

  it('references only textures that exist', () => {
    for (const name of allTextureNames()) {
      expect(existsSync(resolve(assets, 'textures', `${name}.png`)), name).toBe(true);
    }
  });

  it('references only sounds that exist', () => {
    for (const name of allSoundNames()) {
      expect(existsSync(resolve(assets, 'sounds', `${name}.wav`)), name).toBe(true);
    }
  });

  it('never uses colourblind textures', () => {
    for (const name of allTextureNames()) expect(name).not.toMatch(/_cb/);
  });

  it('gives each marker its original inner and pulse layers', () => {
    for (const p of ALL_PINGS) {
      expect(p.art.length).toBe(1);
      expect(p.inner).toMatch(/^icon_ping_/);
      expect(p.pulse).toMatch(/^icon_ping_/);
    }
  });

  it('looks pings up by id', () => {
    expect(pingById('omw')?.sound).toBe('apex_location');
    expect(pingById('nope')).toBeUndefined();
  });

  it('builds page-relative asset URLs', () => {
    expect(textureUrl('omw')).toBe('../textures/omw.png');
    expect(soundUrl('MIA')).toBe('../sounds/MIA.wav');
  });
});
