import { describe, expect, it } from 'vitest';
import { WHEEL, pickSlice, pickStableSlice, wheelPlacement } from '../../src/shared/geometry';

const at = (deg: number, r = 150) => {
  // deg measured clockwise from straight up (N), screen y points down
  const rad = ((deg - 90) * Math.PI) / 180;
  return pickSlice(r * Math.cos(rad), r * Math.sin(rad));
};

describe('pickSlice', () => {
  it('maps the 8 compass directions to slices 0..7 clockwise from N', () => {
    expect([0, 45, 90, 135, 180, 225, 270, 315].map((d) => at(d))).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('returns -1 inside the dead zone and a slice at its edge', () => {
    expect(pickSlice(0, -(WHEEL.innerR - 1))).toBe(-1);
    expect(pickSlice(0, 0)).toBe(-1);
    expect(pickSlice(0, -WHEEL.innerR)).toBe(0);
  });

  it('splits slices exactly at ±22.5° and wraps around N', () => {
    expect(at(22.4)).toBe(0);
    expect(at(22.6)).toBe(1);
    expect(at(-1)).toBe(0);
    expect(at(-22.6)).toBe(7);
    expect(at(359.9)).toBe(0);
  });

  it('honours a custom dead zone', () => {
    expect(pickSlice(0, -50, 40)).toBe(0);
    expect(pickSlice(0, -30, 40)).toBe(-1);
  });
});

it('keeps a selection through boundary jitter and cancels immediately in the center',()=>{
  const at=(angle:number,previous:number)=>{const rad=(angle-90)*Math.PI/180;return pickStableSlice(150*Math.cos(rad),150*Math.sin(rad),previous,86,4);};
  expect(at(24,0)).toBe(0);expect(at(27,0)).toBe(1);expect(at(21,1)).toBe(1);expect(at(18,1)).toBe(0);
  expect(at(337,0)).toBe(0);expect(at(333,0)).toBe(7);expect(pickStableSlice(2,3,4,86,4)).toBe(-1);
});
it('fits all corners across scaled display viewports',()=>{
  for(const dpi of [1,1.25,1.5])for(const scale of [.65,1,1.35]){
    const width=1920/dpi,height=1080/dpi;
    for(const [x,y] of [[0,0],[width,0],[0,height],[width,height]]){
      const p=wheelPlacement(x,y,width,height,scale),r=WHEEL.outerR*p.scale;
      expect(p.x-r).toBeGreaterThanOrEqual(0);expect(p.x+r).toBeLessThanOrEqual(width);
      expect(p.y-r).toBeGreaterThanOrEqual(0);expect(p.y+r).toBeLessThanOrEqual(height);
    }
  }
});
