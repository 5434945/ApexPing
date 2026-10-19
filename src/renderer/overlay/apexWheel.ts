import { pickStableSlice, wheelPlacement, WHEEL } from '../../shared/geometry';
import { DEFAULT_SETTINGS, type OverlaySettings } from '../../shared/settings';
import { pingById } from '../../shared/pings';
import type { WheelItem } from './wheel';

const NS = 'http://www.w3.org/2000/svg';
const point = (r: number, a: number): [number, number] => [r * Math.cos(a), r * Math.sin(a)];
function sector(i: number): string {
  const a = (i * 45 - 112.5) * Math.PI / 180;
  const b = a + Math.PI / 4;
  const p = [point(WHEEL.innerR, a), point(WHEEL.outerR, a), point(WHEEL.outerR, b), point(WHEEL.innerR, b)];
  return `M${p[0]}L${p[1]}A${WHEEL.outerR},${WHEEL.outerR} 0 0 1 ${p[2]}L${p[3]}A${WHEEL.innerR},${WHEEL.innerR} 0 0 0 ${p[0]}Z`;
}
function arc(i: number, radius: number): string {
  const a = (i * 45 - 112.5) * Math.PI / 180;
  return `M${point(radius, a)}A${radius},${radius} 0 0 1 ${point(radius, a + Math.PI / 4)}`;
}

export class ApexWheel {
  private items: readonly WheelItem[] = [];
  private wedges: SVGPathElement[] = [];
  private icons: SVGImageElement[] = [];
  private accent: SVGPathElement;
  private highlight: SVGPathElement;
  private label: SVGTextElement;
  private hot = -1;
  private x = 0;
  private y = 0;
  private opened = false;
  private settings = DEFAULT_SETTINGS;
  private scale = 1;
  private cancelRing: SVGCircleElement;

  constructor(private svg: SVGSVGElement, private onHover: (slice: number) => void) {
    const add = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] => {
      const el = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, String(value)));
      svg.append(el);
      return el;
    };
    add('circle', { r: WHEEL.innerR, fill: '#555550', 'fill-opacity': '.2', stroke: '#ffffff70', 'stroke-width': 1.4 });
    this.cancelRing=add('circle',{r:WHEEL.innerR,fill:'none',stroke:'#ffffff80','stroke-width':1,'stroke-dasharray':'3 4',opacity:0});
    for (let i = 0; i < 8; i++) {
      this.wedges.push(add('path', { d: sector(i), fill: '#66665f', 'fill-opacity': '.28', class: 'apex-sector' }));
      const a = (i * 45 - 112.5) * Math.PI / 180;
      add('path', { d: `M${point(WHEEL.innerR, a)}L${point(WHEEL.outerR, a)}`, stroke: '#ffffff30', 'stroke-width': 1, fill: 'none' });
      const [x, y] = point(WHEEL.outerR * .8, (i * 45 - 90) * Math.PI / 180);
      this.icons.push(add('image', { x: x - 22, y: y - 22, width: 44, height: 44, class: 'apex-wheel-icon' }));
    }
    this.accent = add('path', { fill: 'none', stroke: '#ff962b', 'stroke-width': 6, class: 'apex-selection-arc', opacity: 0 });
    this.highlight = add('path', { fill: 'none', stroke: '#fff', 'stroke-width': 2, opacity: 0 });
    this.label = add('text', { x: 0, y: -WHEEL.innerR * .48, 'text-anchor': 'middle', class: 'apex-center' });
    this.label.textContent = '标记';
    add('text', { x: 0, y: WHEEL.innerR * .72, 'text-anchor': 'middle', class: 'apex-back' }).textContent = '返回';
  }

  get isOpen(): boolean { return this.opened; }
  configure(settings: Pick<OverlaySettings, 'wheelScale' | 'wheelOpacity' | 'wheelDeadZone' | 'wheelHysteresis'>): void {
    this.settings = { ...this.settings, ...settings };
    this.cancelRing.setAttribute('r',String(settings.wheelDeadZone));
    this.cancelRing.setAttribute('opacity',settings.wheelDeadZone===WHEEL.innerR?'0':'.7');
    this.svg.style.setProperty('--wheel-opacity', String(settings.wheelOpacity / 100));
  }
  setItems(items: readonly WheelItem[]): void {
    this.items = items;
    this.icons.forEach((icon, i) => {
      const key = items[i]?.key;
      const referenceIcon = ['generic','danger','bait','push','omw','visioncleared','needvision','missing'].includes(key);
      icon.setAttribute('href', referenceIcon ? `../wheel/${key}.svg` : items[i]?.icon ?? '');
      icon.classList.toggle('hostile', ['danger','audio','missing'].includes(items[i]?.key));
    });
  }
  open(x: number, y: number): void {
    this.x = x; this.y = y;
    const parent = this.svg.parentElement;
    const placed = wheelPlacement(x, y, parent?.clientWidth || window.innerWidth, parent?.clientHeight || window.innerHeight, this.settings.wheelScale / 100);
    this.scale = placed.scale;
    this.svg.style.left = `${placed.x}px`; this.svg.style.top = `${placed.y}px`;
    this.svg.style.setProperty('--wheel-scale', String(this.scale));
    this.select(-1);
    this.opened = true;
    this.svg.classList.add('open');
  }
  move(x: number, y: number): void { if (this.opened) this.select(this.pick(x, y)); }
  private pick(x: number, y: number): number {
    return pickStableSlice((x - this.x) / this.scale, (y - this.y) / this.scale, this.hot,
      this.settings.wheelDeadZone, this.settings.wheelHysteresis);
  }
  release(x: number, y: number): { key: string; x: number; y: number } | null {
    if (!this.opened) return null;
    const item = this.items[this.pick(x, y)];
    this.cancel();
    return item ? { key: item.key, x: this.x, y: this.y } : null;
  }
  cancel(): void { this.opened = false; this.svg.classList.remove('open'); this.select(-1); }
  private select(index: number): void {
    const changed = index !== this.hot;
    this.hot = index;
    this.wedges.forEach((w, i) => {
      w.setAttribute('fill', i === index ? '#373733' : '#66665f');
      w.setAttribute('fill-opacity', i === index ? '.43' : '.28');
      this.icons[i].classList.toggle('selected', i === index);
    });
    this.accent.setAttribute('opacity', index >= 0 ? '1' : '0');
    this.highlight.setAttribute('opacity', index >= 0 ? '1' : '0');
    if (index >= 0) {
      this.accent.setAttribute('d', arc(index, WHEEL.innerR + 5));
      this.highlight.setAttribute('d', arc(index, WHEEL.innerR));
    }
    this.label.textContent = index >= 0 ? pingById(this.items[index]?.key)?.name ?? '标记' : '标记';
    if (changed && index >= 0 && this.opened) this.onHover(index);
  }
}
