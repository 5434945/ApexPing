import { Button, Dropdown, Input, Option, Tab, TabList, Tooltip } from '@fluentui/react-components';
import { ArrowLeft20Regular, ArrowRight20Regular, Dismiss20Regular, Play20Regular, Search20Regular,
  Star20Filled, Star20Regular, Stop20Regular, Prohibited20Regular } from '@fluentui/react-icons';
import { useEffect, useRef, useState } from 'react';
import { LEGENDS, legendName, type LegendId } from '../../../shared/legends';
import { ALL_PINGS, type PingId } from '../../../shared/pings';
import type { Settings } from '../../../shared/settings';
import { voiceCandidates, type VoiceDetail } from '../../../shared/voiceSelection';
import voiceIndex from '../../../../assets/voice-index.json';
import voiceDetails from '../../../../assets/voice-details.json';
import { VoicePlayer } from '../../overlay/voicePlayer';
import { useText } from '../text';
import type { Update } from '../useAppState';

type Props = {settings: Settings; update: Update};
const toggle = <T,>(items: T[], value: T) => items.includes(value) ? items.filter(x=>x!==value) : [...items,value];
const english = ['Enemy spotted','Attack here','Going here','Attack together','Regroup here','Watching here',
  'Someone was here','Avoid here','Go here','Looting here','Defend here','Enemy heard'];

export function LegendPicker({settings:s,update}: Props) {
  const zh = useText().lang.startsWith('zh');
  const [query,setQuery] = useState(''), [filter,setFilter] = useState('all');
  const ids = filter==='recent' ? s.recentLegends : LEGENDS.map(([id])=>id);
  const heroes = ids.filter(id => (filter!=='favorites'||s.favoriteLegends.includes(id))
    && LEGENDS.find(([key])=>key===id)!.join(' ').toLowerCase().includes(query.trim().toLowerCase()));
  const favorite = (id: LegendId) => void update({favoriteLegends:toggle(s.favoriteLegends,id)});
  return <div className="legend-picker">
    <div className="legend-current"><img src={`../legends/${s.legend}.webp`} alt="" width="72" height="72" />
      <div><strong>{legendName(s.legend,zh)}</strong><span className="desc">{legendName(s.legend,!zh)}</span></div>
      <Tooltip content={zh?'收藏英雄':'Favorite legend'} relationship="label"><Button appearance="subtle"
        icon={s.favoriteLegends.includes(s.legend)?<Star20Filled/>:<Star20Regular/>} aria-pressed={s.favoriteLegends.includes(s.legend)} onClick={()=>favorite(s.legend)} /></Tooltip>
    </div>
    <div className="legend-toolbar"><TabList selectedValue={filter} onTabSelect={(_,d)=>setFilter(String(d.value))}>
      <Tab value="all">{zh?'全部':'All'}</Tab><Tab value="favorites">{zh?'收藏':'Favorites'}</Tab><Tab value="recent">{zh?'最近':'Recent'}</Tab></TabList>
      <Input aria-label={zh?'搜索英雄':'Search legends'} placeholder={zh?'搜索英雄':'Search legends'} value={query} contentBefore={<Search20Regular/>}
        onChange={(_,d)=>setQuery(d.value)} contentAfter={query?<Button appearance="transparent" size="small" icon={<Dismiss20Regular/>} aria-label={zh?'清空搜索':'Clear search'} onClick={()=>setQuery('')}/>:null}/>
    </div>
    <div className="legend-grid" aria-label={zh?'英雄选择':'Choose legend'}>{heroes.map(id=><div key={id} className={`legend-cell${s.legend===id?' selected':''}`}>
      <button className="legend-tile" aria-label={legendName(id,zh)} aria-pressed={s.legend===id}
        onClick={()=>void update({legend:id,recentLegends:[id,...s.recentLegends.filter(x=>x!==id)].slice(0,6)})}>
        <img src={`../legends/${id}.webp`} alt="" width="92" height="76" loading="lazy"/><span>{legendName(id,zh)}</span></button>
      <Tooltip content={`${zh?'收藏':'Favorite'} ${legendName(id,zh)}`} relationship="label"><Button className="legend-star" appearance="transparent" size="small"
        icon={s.favoriteLegends.includes(id)?<Star20Filled/>:<Star20Regular/>} aria-pressed={s.favoriteLegends.includes(id)} onClick={()=>favorite(id)}/></Tooltip>
    </div>)}</div>
    {!heroes.length&&<p className="empty-state">{query?(zh?'未找到匹配的英雄':'No matching legends'):filter==='favorites'?(zh?'暂无收藏英雄':'No favorites'):(zh?'暂无最近使用英雄':'No recent legends')}</p>}
  </div>;
}

export function VoiceLibrary({settings:s,update}: Props) {
  const zh = useText().lang.startsWith('zh');
  const [action,setAction] = useState<PingId>('danger'), [filter,setFilter] = useState('all'), [page,setPage] = useState(0);
  const [playing,setPlaying] = useState<string|null>(null), [error,setError] = useState('');
  const player = useRef<VoicePlayer|null>(null);
  const stop = () => {player.current?.stop();setPlaying(null);};
  const key = `${s.voiceLanguage}/${s.legend}/${action}`;
  useEffect(()=>{stop();setError('');return ()=>player.current?.stop();},[key,s.voiceVolume,s.voiceEnabled,s.voiceNormalize,s.muted]);
  useEffect(()=>{setPage(0);stop();},[key,filter]);
  const paths = (voiceIndex as Record<string,string[]>)[key]??[];
  const details: Readonly<Record<string,VoiceDetail>> = voiceDetails;
  const eligible = voiceCandidates(paths,s,details);
  const lines = paths.filter(path=>filter==='favorites'?s.voiceFavorites.includes(path):filter==='blocked'?s.voiceBlocked.includes(path):true);
  const pages = Math.max(1,Math.ceil(lines.length/8)), current = Math.min(page,pages-1);
  const disabled = s.muted||!s.voiceEnabled;
  function play(path:string) {
    stop();setError('');setPlaying(path);player.current??=new VoicePlayer();
    player.current.playPath(path,s.voiceVolume/100,s.voiceNormalize,()=>{setPlaying(null);setError(zh?'语音无法播放，请检查语音包是否完整。':'Cannot play this line. Check the voice pack.');},()=>setPlaying(null));
  }
  return <div className="voice-library">
    <div className="voice-toolbar"><span>{zh?'播放范围':'Playback selection'}</span>
      <TabList selectedValue={s.voiceMode} size="small" onTabSelect={(_,d)=>void update({voiceMode:d.value as Settings['voiceMode']})}>
        <Tab value="selected">{zh?'精选':'Selected'}</Tab><Tab value="all">{zh?'完整':'All'}</Tab></TabList></div>
    {s.voiceMode==='selected'&&<p className="desc">{zh?'优先播放收藏；未收藏时使用最多 5 条平静、简短语音。':'Favorites first; otherwise up to 5 short, calm lines.'}</p>}
    <div className="voice-toolbar"><Dropdown aria-label={zh?'标记类型':'Ping type'} selectedOptions={[action]}
      value={zh?ALL_PINGS.find(p=>p.id===action)!.name:english[ALL_PINGS.findIndex(p=>p.id===action)]} onOptionSelect={(_,d)=>d.optionValue&&setAction(d.optionValue as PingId)}>
      {ALL_PINGS.map((p,i)=><Option key={p.id} value={p.id}>{zh?p.name:english[i]}</Option>)}</Dropdown>
      <Button icon={<Play20Regular/>} disabled={disabled||!eligible.length} onClick={()=>play(eligible[Math.floor(Math.random()*eligible.length)])}>{zh?'试听标记':'Preview ping'}</Button>
      <Tooltip content={zh?'停止试听':'Stop preview'} relationship="label"><Button icon={<Stop20Regular/>} disabled={!playing} onClick={stop}/></Tooltip></div>
    <TabList size="small" selectedValue={filter} onTabSelect={(_,d)=>setFilter(String(d.value))}>
      <Tab value="all">{zh?'全部语音':'All lines'} ({paths.length})</Tab><Tab value="favorites">{zh?'收藏':'Favorites'}</Tab><Tab value="blocked">{zh?'已屏蔽':'Blocked'}</Tab></TabList>
    {!eligible.length&&paths.length>0&&<p role="status">{zh?'此类语音已全部屏蔽，标记仍会播放提示音。':'All lines blocked; ping sounds remain enabled.'}</p>}
    {lines.slice(current*8,current*8+8).map(path=><div key={path} className={`voice-line${s.voiceBlocked.includes(path)?' blocked':''}`}>
      <Tooltip content={zh?'试听语音':'Play line'} relationship="label"><Button size="small" icon={playing===path?<Stop20Regular/>:<Play20Regular/>} disabled={disabled} onClick={()=>playing===path?stop():play(path)}/></Tooltip>
      <span className="voice-line-name" title={details[path]?.name}>{details[path]?.tone==='urgent'?(zh?'紧急':'Urgent')
        :details[path]?.tone==='calmFar'?(zh?'平静（远处）':'Calm (distant)'):(zh?'平静':'Calm')} {String(paths.indexOf(path)+1).padStart(2,'0')}</span>
      <span className="voice-duration">{details[path]?.duration.toFixed(1)}s</span>
      <Tooltip content={zh?'收藏语音':'Favorite line'} relationship="label"><Button size="small" appearance="subtle" icon={s.voiceFavorites.includes(path)?<Star20Filled/>:<Star20Regular/>}
        aria-pressed={s.voiceFavorites.includes(path)} onClick={()=>void update({voiceFavorites:toggle(s.voiceFavorites,path)})}/></Tooltip>
      <Tooltip content={zh?'屏蔽语音':'Block line'} relationship="label"><Button size="small" appearance="subtle" icon={<Prohibited20Regular/>}
        aria-pressed={s.voiceBlocked.includes(path)} onClick={()=>{stop();void update({voiceBlocked:toggle(s.voiceBlocked,path)});}}/></Tooltip>
    </div>)}
    {!lines.length&&<p className="empty-state">{zh?'暂无语音':'No lines'}</p>}
    <div className="voice-pagination"><Button icon={<ArrowLeft20Regular/>} aria-label={zh?'上一页语音':'Previous lines'} disabled={current===0} onClick={()=>setPage(current-1)}/>
      <span>{current+1} / {pages}</span><Button icon={<ArrowRight20Regular/>} aria-label={zh?'下一页语音':'Next lines'} disabled={current+1>=pages} onClick={()=>setPage(current+1)}/></div>
    {error&&<p role="alert" className="warnText">{error}</p>}
  </div>;
}
