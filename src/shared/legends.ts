export const LEGENDS = [
  ['bloodhound', 'Bloodhound', '寻血猎犬'], ['gibraltar', 'Gibraltar', '直布罗陀'],
  ['lifeline', 'Lifeline', '命脉'], ['pathfinder', 'Pathfinder', '探路者'],
  ['wraith', 'Wraith', '恶灵'], ['bangalore', 'Bangalore', '班加罗尔'],
  ['caustic', 'Caustic', '侵蚀'], ['mirage', 'Mirage', '幻象'],
  ['octane', 'Octane', '动力小子'], ['wattson', 'Wattson', '沃特森'],
  ['crypto', 'Crypto', '密客'], ['revenant', 'Revenant', '亡灵'],
  ['loba', 'Loba', '罗芭'], ['rampart', 'Rampart', '兰伯特'],
  ['horizon', 'Horizon', '地平线'], ['fuse', 'Fuse', '暴雷'],
  ['valkyrie', 'Valkyrie', '瓦尔基里'], ['seer', 'Seer', '希尔'],
  ['ash', 'Ash', '艾许'], ['madmaggie', 'Mad Maggie', '疯玛吉'],
  ['newcastle', 'Newcastle', '纽卡斯尔'], ['vantage', 'Vantage', '万蒂奇'],
  ['catalyst', 'Catalyst', '卡特莉丝'], ['ballistic', 'Ballistic', '弹道'],
  ['conduit', 'Conduit', '导管'], ['alter', 'Alter', 'Alter'],
  ['sparrow', 'Sparrow', 'Sparrow'], ['overdrive', 'Axle', 'Axle'],
] as const;

export type LegendId = typeof LEGENDS[number][0];
export type VoiceLanguage = 'zh-CN' | 'en';
export const isLegendId = (v: unknown): v is LegendId => LEGENDS.some(([id]) => id === v);
export const isVoiceLanguage = (v: unknown): v is VoiceLanguage => v === 'zh-CN' || v === 'en';
export const legendName = (id: LegendId, chinese: boolean): string => {
  const row = LEGENDS.find(([key]) => key === id)!;
  return row[chinese ? 2 : 1];
};
