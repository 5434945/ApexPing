import { useEffect, useRef } from 'react';
import { ArrowMove24Regular, ResizeLarge24Regular, Eye24Regular } from '@fluentui/react-icons';
import { ApexWheel } from '../../overlay/apexWheel';
import { pingsFor, textureUrl } from '../../../shared/pings';
import { overlaySettings, type Settings } from '../../../shared/settings';
import type { Update } from '../useAppState';
import { useText } from '../text';
import { SliderRow } from './rows';

export function WheelTuning({settings:s,update}:{settings:Settings;update:Update}) {
  const zh=useText().lang.startsWith('zh'), svg=useRef<SVGSVGElement>(null), host=useRef<HTMLDivElement>(null);
  const wheel=useRef<ApexWheel|null>(null);
  useEffect(()=>{
    const element=svg.current!, container=host.current!;
    const instance=new ApexWheel(element,()=>undefined);wheel.current=instance;
    const fit=()=>instance.open(container.clientWidth/2,container.clientHeight/2);
    const observer=new ResizeObserver(fit);observer.observe(container);
    return ()=>{observer.disconnect();instance.cancel();element.replaceChildren();};
  },[]);
  useEffect(()=>{
    const instance=wheel.current!, container=host.current!;
    instance.configure(overlaySettings(s));
    instance.setItems(pingsFor(s.wheel).map(p=>({key:p.id,icon:textureUrl(p.icon)})));
    instance.open(container.clientWidth/2,container.clientHeight/2);
  },[s]);
  return <>
    <SliderRow limit="wheelScale" icon={<ResizeLarge24Regular/>} title={zh?'轮盘大小':'Wheel size'} value={s.wheelScale} format={v=>`${v}%`} onChange={wheelScale=>void update({wheelScale})}/>
    <SliderRow limit="wheelOpacity" icon={<Eye24Regular/>} title={zh?'轮盘不透明度':'Wheel opacity'} value={s.wheelOpacity} format={v=>`${v}%`} onChange={wheelOpacity=>void update({wheelOpacity})}/>
    <SliderRow limit="wheelDeadZone" icon={<ArrowMove24Regular/>} title={zh?'中心取消范围':'Center cancel radius'} value={s.wheelDeadZone} format={v=>`${v}px`} onChange={wheelDeadZone=>void update({wheelDeadZone})}/>
    <SliderRow limit="wheelHysteresis" icon={<ArrowMove24Regular/>} title={zh?'边界容错':'Boundary tolerance'} value={s.wheelHysteresis} format={v=>`${v}°`} onChange={wheelHysteresis=>void update({wheelHysteresis})}/>
    <div className="wheel-preview" ref={host} aria-label={zh?'轮盘实时预览':'Live wheel preview'}
      onPointerMove={event=>{const r=event.currentTarget.getBoundingClientRect();wheel.current?.move(event.clientX-r.left,event.clientY-r.top);}}
      onPointerLeave={()=>wheel.current?.open(host.current!.clientWidth/2,host.current!.clientHeight/2)}>
      <svg ref={svg} viewBox="-300 -300 600 600"/>
    </div>
  </>;
}
