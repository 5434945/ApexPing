# ApexPing 素材核对记录

## 0.3.0 截图校对与完整变体

本次默认布局以用户提供的游戏截图为准：位置、敌人、搜刮、进攻、我要去这里、防守、观察、有人来过。此前 Arsenal 布局的额外动作仍可从设置选择。半透明扇区、橙白内圈弧线和中央名称按截图重做；没有伪造尚未实现的 SPACE 台词子菜单。

轮盘中的八枚 `assets/wheel/*.svg` 是依据截图重绘的图标，不冒充提取的原始贴图；桌面落点仍使用游戏资源中的原始贴图。两套图标分开，避免将落点箭头、底座等结构误用到轮盘上。

本机资源索引中，与现有 12 个标记项对应的中英文第一人称 calm/calmFar/urgent 录音共有 13,638 个源。剔除 1 条静音占位后，13,637 个有效源组成 14,663 条动作绑定（进攻/一起进攻复用同一语义），覆盖 672 个英雄/语言/动作组合。播放器按组打乱，遍历一轮后再循环，并避免相邻重复。没有混入其他英雄、其他语言、第三人称录音或无关战斗台词。

音频转换为 OGG Vorbis，约 252 MiB；这是压缩后的原声，不是声线合成。原始台词与来源信息保留在 manifest，播放索引为 `assets/voice-index.json`。自动检测不代替逐条人工听审，也不表示覆盖游戏内所有物品标记、回应、特殊情境与台词菜单。

只读提取 `general.mbnk`、`general_english.mstr`、`general_mandarin.mstr`，所有输出均位于项目目录。三份源文件在提取前后逐字节 SHA-256 一致，校验报告保存在交付目录 `ApexPing-voice-integrity.json`。不修改游戏配置、不写入游戏目录、不注入进程、不启动或修改反作弊程序。未代替用户登录游戏测试。

## 公开依据

- [EA 英雄指南](https://help.ea.com/en/articles/apex-legends/abilities/)：查询时列出 28 位英雄，最新为 Axle。
- [EA Arsenal 更新说明](https://forums.ea.com/blog/apex-legends-game-info-hub-en/apex-legends%E2%84%A2-arsenal-patch-notes/9466273)：新增 Avoid Area、Enemy Audio、Regroup；不同游戏状态有不同轮盘。
- [官方轮盘参考图](https://media.contentapi.ea.com/content/dam/apex-legends/common/articles/arsenal-patch-notes/apex-legends-arsenal-patch-notes-asset-05.png)：顶端起顺时针为避开、敌人声音、搜刮、进攻、集合、防守、观察、敌人活动。本项目使用这一可公开核实的布局，不声称覆盖所有游戏情境。
- [Apex Wiki：Axle](https://apexlegends.wiki.gg/wiki/Axle)：公开索引说明开发代号为 Overdrive，与本机语音资产前缀对应。
- [Apex Wiki：Ping](https://apexlegends.wiki.gg/wiki/Ping) 与英雄 Voice lines 页面可用于语义对照；部分页面限制直接访问，本次没有绕过限制下载素材。
- [EA 内容政策](https://help.ea.com/en/articles/security-and-rules/ea-content-policy/)：公开可见不等于素材适用 MIT。原始配音、图标及第三方内容的发布许可须单独确认。

## 语音对应

每个英雄使用自身 `diag_mp_<hero>_ping_<action>_*_1p` 源；不混用第三人称录音，不用合成语音补齐。中文来自 `general_mandarin.mstr`，英文来自 `general_english.mstr`。0.2.0 每项取一条，0.3.0 扩充同一语义的全部有效 calm/calmFar/urgent 变体。

| 软件标记 | 原版语音 action | 图标定义 |
| --- | --- | --- |
| 发现敌人 | spotEnemy | ping_enemy |
| 前往这里 | spotDefault | ping_go |
| 我要去这里 | exploreGoPlayer | ping_i_go |
| 进攻这里 | attackHere | ping_attacking |
| 一起进攻 | attackHere | ping_we_attack |
| 在这里集合 | regroupHere | ping_regrouphere |
| 观察这里 | watchingHere | ping_watching |
| 有人来过 | cluePresence | ping_area_visited |
| 避开这里 | avoidHere | ping_avoid |
| 搜索物资 | lootingHere | ping_looting |
| 防守这里 | defendHere | ping_defending |
| 听到敌人 | hearEnemy | ping_enemy_audio |

“进攻这里”和“一起进攻”保留旧版可配置项，使用同一 attackHere 录音组。名称保持旧内部 ID 是为兼容已保存的轮盘配置，不表示仍使用 LoL 语义。

## 实际来源与边界

没有找到覆盖全部 28 位英雄的完整双语公开录音库。因此音频和图标最终从用户本机安装的 Apex 原始游戏包只读提取，未移动、修改或删除游戏文件。工具使用公开项目 [RSX](https://github.com/r-ex/rsx) 和 [er-apex](https://github.com/umiiii/er-apex) 的格式资料；为避免同名中英文互相覆盖，按语言容器分目录导出。

`assets/voice-manifest.json` 为每个“语言 / 英雄 / 标记”记录原始源名、流文件名、GUID 和输出 SHA-256；`assets/apex-provenance.json` 保存原版图标定义。Overdrive 在界面展示为 Axle。尚未核实的中文英雄译名保留英文，避免编造。

通用提示音仍采用原版音源片段：敌人提示 `radarpulse_1p_ping_2ch_v2_01`，普通标记 `ui_mapping_1p_2ch_v1_01`，轮盘打开与划过使用原版 UI 音源。它们不是完整游戏音频事件的分层混音。动画按桌面覆盖层重新实现，并非逐帧移植。

自动验证检查文件完整、语言不同、角色前缀对应、可解码及非静音；这些检查不等于 672 条台词都已经逐条人工听审。最终仍需真人核听语义、音量和桌面实际体验。

This project is not endorsed by or affiliated with EA or its licensors.
