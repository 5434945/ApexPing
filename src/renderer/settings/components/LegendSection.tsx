import { Button, Dropdown, Option } from '@fluentui/react-components';
import { Person24Regular, LocalLanguage24Regular, Play24Regular, Speaker224Regular } from '@fluentui/react-icons';
import { LEGENDS, legendName, type LegendId, type VoiceLanguage } from '../../../shared/legends';
import type { Settings } from '../../../shared/settings';
import { api } from '../api';
import { useText } from '../text';
import type { Update } from '../useAppState';
import { SettingRow, SliderRow, SwitchRow } from './rows';

export function LegendSection({ settings: s, update }: { settings: Settings; update: Update }) {
  const zh = useText().lang.startsWith('zh');
  return <>
    <SettingRow icon={<Person24Regular />} title={zh ? '英雄' : 'Legend'}>
      <Dropdown aria-label={zh ? '英雄' : 'Legend'} value={legendName(s.legend, zh)} selectedOptions={[s.legend]}
        onOptionSelect={(_, d) => { if (d.optionValue) void update({ legend: d.optionValue as LegendId }); }}>
        {LEGENDS.map(([id]) => <Option key={id} value={id}>{legendName(id, zh)}</Option>)}
      </Dropdown>
    </SettingRow>
    <SettingRow icon={<LocalLanguage24Regular />} title={zh ? '语音语言' : 'Voice language'}>
      <Dropdown aria-label={zh ? '语音语言' : 'Voice language'} value={s.voiceLanguage === 'zh-CN' ? '普通话' : 'English'} selectedOptions={[s.voiceLanguage]}
        onOptionSelect={(_, d) => { if (d.optionValue) void update({ voiceLanguage: d.optionValue as VoiceLanguage }); }}>
        <Option value="zh-CN">普通话</Option><Option value="en">English</Option>
      </Dropdown>
    </SettingRow>
    <SwitchRow icon={<Speaker224Regular />} title={zh ? '英雄语音' : 'Legend voice'} checked={s.voiceEnabled}
      onChange={(voiceEnabled) => void update({ voiceEnabled })} />
    <SliderRow limit="voiceVolume" icon={<Speaker224Regular />} title={zh ? '语音音量' : 'Voice volume'}
      value={s.voiceVolume} format={(v) => `${v}%`} dim={s.muted || !s.voiceEnabled}
      onChange={(voiceVolume) => void update({ voiceVolume })} />
    <SettingRow icon={<Play24Regular />} title={zh ? '试听标记' : 'Preview ping'}>
      <Button icon={<Play24Regular />} disabled={s.muted || !s.voiceEnabled}
        onClick={() => void api.previewPing('danger')}>{zh ? '发现敌人' : 'Enemy spotted'}</Button>
    </SettingRow>
  </>;
}
