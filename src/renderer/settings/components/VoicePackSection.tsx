import { Button } from '@fluentui/react-components';
import { FolderAdd20Regular } from '@fluentui/react-icons';
import { useEffect, useState } from 'react';
import type { VoicePackStatus } from '../../../shared/ipc';
import { api } from '../api';
import { useText } from '../text';

export function VoicePackSection() {
  const zh=useText().lang.startsWith('zh');
  const [packs,setPacks]=useState<VoicePackStatus[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState('');
  useEffect(()=>{void api.getVoicePacks().then(setPacks).catch(()=>setError(zh?'无法读取语音包状态':'Cannot read voice pack status'));},[]);
  async function install() {
    setBusy(true);setError('');
    try {const result=await api.importVoicePack();if(!result.ok&&!result.cancelled)setError(result.error??'Import failed');setPacks(await api.getVoicePacks());}
    catch {setError(zh?'语音包导入失败':'Voice pack import failed');}
    finally {setBusy(false);}
  }
  return <div className="voice-pack-section">
    <div className="voice-toolbar"><strong>{zh?'语音包':'Voice packs'}</strong>
      <Button icon={<FolderAdd20Regular/>} disabled={busy} onClick={()=>void install()}>{busy?(zh?'校验并导入中…':'Verifying…'):(zh?'导入语音包文件夹':'Import voice pack folder')}</Button></div>
    {packs.map(p=><div className="voice-pack-status" key={p.language}><span>{p.language==='en'?'English':'普通话'}</span>
      <span>{p.installed===p.total?(zh?'已安装':'Installed'):`${p.installed} / ${p.total}`}</span></div>)}
    {packs.some(p=>p.installed<p.total)&&<p className="desc">{zh?'解压对应语言包，选择包含 apexping-voice-pack.json 的文件夹。':'Extract a voice pack and select the folder containing apexping-voice-pack.json.'}</p>}
    {error&&<p role="alert" className="warnText">{error}</p>}
  </div>;
}
