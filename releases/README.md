# 桌面预览包（Electron）产出说明

嬷嬷模拟器提供 Electron 桌面预览版：把 Vite 前端产物装进桌面窗口，内置与浏览器版完全相同的「电脑 / 手机」设备预览台。**二进制产物不提交进 git 仓库**（单文件 90MB+ 会永久膨胀仓库历史），按下面的一键命令在本机 / CI 生成，产物统一落在 `dist-preview/`。

## 一键出包

要求 Node.js ≥ 20，先 `npm install`。

| 命令 | 产物 | 说明 |
| --- | --- | --- |
| `npm run preview:electron` | —— | 构建后直接拉起桌面预览窗口（开发自测最快路径） |
| `npm run build:preview` | `dist-preview/linux-unpacked/momomoniqi` | Linux 目录包，可直接运行 |
| `npm run build:preview:appimage` | `dist-preview/momomoniqi-preview-<版本>-linux.AppImage` | Linux 单文件包 |
| `npm run build:preview:win` | `dist-preview/momomoniqi-preview-<版本>-win-portable.exe` | **Windows 免安装单文件 exe**（Linux/macOS 上可直接交叉编译，无需 wine） |

> Windows 目标配置了 `signAndEditExecutable: false`，跳过 rcedit / 签名步骤，因此在 Linux CI 上也能稳定产出 exe；代价是 exe 使用 Electron 默认图标。需要自定义图标 / 版本信息时改回 `signExecutable: false` 并补 `win.icon`。

## 已验证记录（本仓库 CI 环境，Linux x64）

- `build:preview`（linux dir）：产出成功，Xvfb 下启动、通过 CDP 确认窗口加载 `app://momomoniqi/index.html`、React 挂载、设备预览台 iframe（`?embed=1`）同源可用。
- `build:preview:win`：产出 `momomoniqi-preview-0.2.0-win-portable.exe`（约 91 MB，PE32 GUI / NSIS portable 自解压）。
- `build:preview:appimage`：产出 `momomoniqi-preview-0.2.0-linux.AppImage`（约 123 MB）。

## 架构要点

- 主进程 `electron/main.cjs`：生产模式注册自定义 **`app://` standard scheme** 伺服 `dist/` 静态产物。相比 `file://` 直开，同源 iframe（设备预览台）、相对资源路径、fetch 都正常工作；含目录穿越防护。
- `electron/preload.cjs`：`contextIsolation + sandbox`，只暴露只读版本信息，不开放任何 Node 能力；外链一律交系统浏览器。
- 开发模式：`VITE_DEV_SERVER_URL=http://localhost:5173 npx electron .` 可直连 Vite dev server 热更新调试。

## 想在 GitHub Releases 分发？

在 Linux runner 上跑 `npm ci && npm run build:preview:win && npm run build:preview:appimage`，把 `dist-preview/*.exe` / `*.AppImage` 作为 Release 资产上传即可（产物文件名已含版本号）。
