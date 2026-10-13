# ApexPing

Windows 桌面 Apex 风格标记轮盘，基于 [darrenprx/lolPing](https://github.com/darrenprx/lolPing) 改造。当前版本：0.1.0 测试版。

这是独立桌面覆盖层，不注入游戏进程，不向 Apex 游戏内发送标记。

## 操作

- 按住 Alt 并移动鼠标打开轮盘，指向选项后松开 Alt 发送标记。
- 回到中心后松开取消；Alt + 左键快速发送普通标记。
- Ctrl + Alt + P 开关标记功能；托盘菜单提供设置与退出。
- 可调整触发键、轮盘项目、音量、大小和持续时间。
- 默认在全屏应用中暂停触发，先在普通桌面上测试。

## 当前实现

- 八方向轮盘、中文标记、选中反馈、脉冲与淡出动画。
- 使用本机 Apex 游戏文件中的原版图标和提示音源；映射记录在 `assets/apex-provenance.json`。
- 动画为桌面端重现，不是游戏动画逐帧复制；音效尚未复刻完整游戏混音，未加入英雄语音。
- 保留上游房间和可选 LoL 表情功能，表情触发默认关闭。
- 房间密钥命名空间与 lolPing 隔离；双方需使用此版本。自动更新默认关闭。
- 配置使用 `%APPDATA%\ApexPing`，默认不开机启动。

## 开发与构建

Windows x64，Node.js 22 或更高版本，以及带 C++ 桌面开发工具的 Visual Studio Build Tools。

```powershell
npm ci
npm run build:helper
npm run typecheck
npm test
npm run dev
```

构建安装包：`npm run dist`。生产构建：`npm run build`。项目不提交 `node_modules`、`out`、`release` 或原生编译产物。

## 验证状态

本地 TypeScript 类型检查及生产构建通过，712 项自动化测试通过，原生钩子测试此前为 411 项通过。当前执行环境无法启动 Electron 窗口，因此尚未完成真实桌面热键、声音、多显示器、浮层和跨设备同步实测。构建成功不代表这些场景已验证。

## 许可证与素材

代码沿用上游 MIT 许可证，保留 [LICENSE](LICENSE) 和原作者 Danrui Meng 的版权声明。上游说明保存在 [docs/UPSTREAM_README.md](docs/UPSTREAM_README.md)。

Apex Legends 图标和音频归 EA / Respawn 所有；原项目保留的 LoL 素材归其各自权利人所有。MIT 许可证不授予这些游戏素材的权利。本仓库用于个人原型保存，不应将游戏素材误标为 MIT 或未经许可公开分发。
