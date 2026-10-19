/** Wheel geometry in CSS pixels (matches prototype/wheel-demo.html). */
export const WHEEL = { innerR: 86, outerR: 188, extR: 288, iconR: 137, iconSize: 48 } as const;

/**
 * Slice under an offset from the wheel centre. Screen coordinates (y down).
 * Returns -1 inside the dead zone, else 0..7 where 0 = N and indices go clockwise.
 * Slices are 45° wide and centred on the compass directions.
 */
export function pickSlice(dx: number, dy: number, deadZone: number = WHEEL.innerR): number {
  if (Math.hypot(dx, dy) < deadZone) return -1;
  const deg = ((Math.atan2(dy, dx) * 180) / Math.PI + 90 + 22.5 + 360) % 360;
  return Math.floor(deg / 45) % 8;
}

/** Keep the current sector until the pointer crosses its boundary by a few degrees. */
export function pickStableSlice(dx: number, dy: number, previous: number, deadZone = WHEEL.innerR as number, hysteresis = 4): number {
  const next = pickSlice(dx, dy, deadZone);
  if (next < 0 || previous < 0 || previous > 7 || next === previous) return next;
  const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360;
  const distance = Math.abs(((angle - previous * 45 + 540) % 360) - 180);
  return distance <= 22.5 + hysteresis ? previous : next;
}

/** Position a visual wheel inside its viewport while retaining the gesture's original anchor. */
export function wheelPlacement(x: number, y: number, width: number, height: number, scale: number): { x: number; y: number; scale: number } {
  const fitted = Math.min(scale, Math.max(0.1, (Math.min(width, height) - 16) / (WHEEL.outerR * 2)));
  const radius = WHEEL.outerR * fitted + 8;
  return { x: Math.max(radius, Math.min(width - radius, x)), y: Math.max(radius, Math.min(height - radius, y)), scale: fitted };
}
