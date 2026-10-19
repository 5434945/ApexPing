import { Dropdown, Option } from '@fluentui/react-components';
import { LegendPicker, VoiceLibrary } from './VoiceLibrary';
import { VoicePackSection } from './VoicePackSection';
import { LocalLanguage24Regular, Speaker224Regular } from '@fluentui/react-icons';
import { type VoiceLanguage } from '../../../shared/legends';
import type { Settings } from '../../../shared/settings';
import { useText } from '../text';
import type { Update } from '../useAppState';
import { SettingRow, SliderRow, SwitchRow } from './rows';

export function LegendSection({ settings: s, update }: { settings: Settings; update: Update }) {
  const zh = useText().lang.startsWith('zh');
  return <>
    <LegendPicker settings={s} update={update} />
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
    <SwitchRow icon={<Speaker224Regular />} title={zh ? '均衡语音响度' : 'Balance voice loudness'} checked={s.voiceNormalize}
      onChange={(voiceNormalize) => void update({voiceNormalize})} />
    <VoiceLibrary settings={s} update={update} />
    <VoicePackSection />
  </>;
}
