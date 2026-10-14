import type { PingTag } from '../../shared/ipc';
import { FALLBACK_TEXTURE, textureUrl, type PingDef } from '../../shared/pings';
import { TAG_COLORS } from '../../shared/roomColors';

/** Safety ceiling: past this many pings on screen the oldest go early, so a ping flood can't bog the overlay down. */
export const MAX_PINGS = 60;

export interface PingFxOptions {
  sizePx: number;
  durationS: number;
  /** A room member's name under the ping. */
  tag?: PingTag;
}

function img(name: string, cls = ''): HTMLImageElement {
  const el = document.createElement('img');
  if (cls) el.className = cls;
  el.src = textureUrl(name);
  el.onerror = () => {
    el.onerror = null;
    el.src = textureUrl(FALLBACK_TEXTURE);
  };
  return el;
}

const div = (cls: string): HTMLDivElement => {
  const d = document.createElement('div');
  d.className = cls;
  return d;
};

/** Adds one animated ping at (x, y) and removes it when its animation ends. */
export function spawnPing(layer: HTMLElement, def: PingDef, x: number, y: number, opts: PingFxOptions): void {
  const root = div('ping apex-ping');
  root.style.left = `${x}px`;
  root.style.top = `${y}px`;
  root.style.setProperty('--c', def.color);
  root.style.setProperty('--size', `${opts.sizePx}px`);
  root.style.setProperty('--dur', `${opts.durationS}s`);
  root.append(div('apex-stem'), div('apex-anchor'));
  if (def.pulse) {
    const pulse = div('apex-pulse');
    pulse.style.maskImage = `url("${textureUrl(def.pulse)}")`;
    root.append(pulse);
  }

  const art = div('art');
  if (def.art.length === 2) {
    const clash = div('clash');
    clash.append(img(def.art[0], 'a1'), img(def.art[1], 'a2'));
    art.append(clash, div('flash'));
  } else {
    const pop = div('pop');
    if (def.inner) {
      const inner = div('apex-inner');
      inner.style.maskImage = `url("${textureUrl(def.inner)}")`;
      pop.append(inner);
    }
    pop.append(img(def.art[0]));
    art.append(pop);
  }
  root.append(art);
  while (layer.childElementCount >= MAX_PINGS) layer.firstElementChild?.remove();
  layer.append(root);
  setTimeout(() => root.remove(), opts.durationS * 1000 + 150);
}
