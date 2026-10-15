import { afterEach, expect, it, vi } from 'vitest';
import { ApexWheel } from '../../src/renderer/overlay/apexWheel';
import { DEFAULT_WHEEL, pingById } from '../../src/shared/pings';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

class Node {
  attrs = new Map<string,string>(); children: Node[] = []; style: Record<string,string> = {}; textContent='';
  classes = new Set<string>();
  classList = {add:(v:string)=>this.classes.add(v),remove:(v:string)=>this.classes.delete(v),
    toggle:(v:string,on:boolean)=>on?this.classes.add(v):this.classes.delete(v)};
  constructor(public tag:string) {}
  setAttribute(k:string,v:string) {this.attrs.set(k,v);}
  append(n:Node) {this.children.push(n);}
}
function setup() {
  vi.stubGlobal('document',{createElementNS:(_:string,t:string)=>new Node(t)});
  const svg=new Node('svg'),hover=vi.fn(),wheel=new ApexWheel(svg as unknown as SVGSVGElement,hover);
  wheel.setItems(DEFAULT_WHEEL.map(key=>({key,icon:`${key}.png`})));
  return {svg,wheel,hover};
}
afterEach(()=>vi.unstubAllGlobals());
it('matches all eight reference positions and closes after release',()=>{
  const {wheel,svg}=setup();
  const icons=svg.children.filter(n=>n.tag==='image');
  DEFAULT_WHEEL.forEach((key,i)=>{
    expect(icons[i].attrs.get('href')).toBe(`../wheel/${key}.svg`);
    expect(existsSync(resolve(__dirname,`../../assets/wheel/${key}.svg`))).toBe(true);
    const a=(i*45-90)*Math.PI/180,x=300+150*Math.cos(a),y=300+150*Math.sin(a);
    wheel.open(300,300);wheel.move(x,y);
    expect(wheel.release(x,y)).toEqual({key,x:300,y:300});expect(wheel.isOpen).toBe(false);
  });
});
it('uses translucent sectors with an orange inner arc and the selected label',()=>{
  const {svg,wheel,hover}=setup();wheel.open(300,300);wheel.move(150,150);
  const arc=svg.children.find(n=>n.attrs.get('class')==='apex-selection-arc')!;
  expect(arc.attrs.get('opacity')).toBe('1');expect(arc.attrs.get('stroke')).toBe('#ff962b');
  expect(svg.children.find(n=>n.attrs.get('class')==='apex-center')?.textContent).toBe(pingById('missing')!.name);
  for(const sector of svg.children.filter(n=>n.attrs.get('class')==='apex-sector'))expect(Number(sector.attrs.get('fill-opacity'))).toBeLessThan(.5);
  wheel.move(140,140);expect(hover).toHaveBeenCalledTimes(1);
  wheel.move(300,300);expect(arc.attrs.get('opacity')).toBe('0');expect(wheel.release(300,300)).toBeNull();
});
