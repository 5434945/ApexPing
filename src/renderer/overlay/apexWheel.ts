import { pickSlice, WHEEL } from '../../shared/geometry';
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

export class ApexWheel {
  private items: readonly WheelItem[] = [];
  private wedges: SVGPathElement[] = [];
  private icons: SVGImageElement[] = [];
  private label: SVGTextElement;
  private hot = -1;
  private x = 0;
  private y = 0;
  private opened = false;

  constructor(private svg: SVGSVGElement, private onHover: (slice: number) => void) {
    const add = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] => {
      const el = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, String(value)));
      svg.append(el);
      return el;
    };
    add('circle', { r: WHEEL.innerR - 4, fill: '#101214', 'fill-opacity': '.76', stroke: '#ffffff66', 'stroke-width': 1 });
    for (let i = 0; i < 8; i++) {
      this.wedges.push(add('path', { d: sector(i), fill: '#171a1d', 'fill-opacity': '.88', stroke: '#c9cccf66', 'stroke-width': 1.3 }));
      const [x, y] = point(WHEEL.iconR, (i * 45 - 90) * Math.PI / 180);
      this.icons.push(add('image', { x: x - 25, y: y - 25, width: 50, height: 50, class: 'apex-wheel-icon' }));
    }
    this.label = add('text', { x: 0, y: -3, 'text-anchor': 'middle', class: 'apex-center' });
    this.label.textContent = '标记';
    add('text', { x: 0, y: 27, 'text-anchor': 'middle', class: 'apex-back' }).textContent = '取消';
  }

  get isOpen(): boolean { return this.opened; }
  setItems(items: readonly WheelItem[]): void {
    this.items = items;
    this.icons.forEach((icon, i) => icon.setAttribute('href', items[i]?.icon ?? ''));
  }
  open(x: number, y: number): void {
    this.x = x; this.y = y;
    this.svg.style.left = `${x}px`; this.svg.style.top = `${y}px`;
    this.select(-1);
    this.opened = true;
    this.svg.classList.add('open');
  }
  move(x: number, y: number): void { if (this.opened) this.select(pickSlice(x - this.x, y - this.y)); }
  release(x: number, y: number): { key: string; x: number; y: number } | null {
    if (!this.opened) return null;
    const item = this.items[pickSlice(x - this.x, y - this.y)];
    this.cancel();
    return item ? { key: item.key, x: this.x, y: this.y } : null;
  }
  cancel(): void { this.opened = false; this.svg.classList.remove('open'); this.select(-1); }
  private select(index: number): void {
    const changed = index !== this.hot;
    this.hot = index;
    this.wedges.forEach((w, i) => {
      w.setAttribute('fill', i === index ? '#f2aa42' : '#171a1d');
      w.setAttribute('fill-opacity', i === index ? '.96' : '.88');
      this.icons[i].classList.toggle('selected', i === index);
    });
    this.label.textContent = index >= 0 ? pingById(this.items[index]?.key)?.name ?? '标记' : '标记';
    if (changed && index >= 0 && this.opened) this.onHover(index);
  }
}
