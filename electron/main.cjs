/**
 * 嬷嬷模拟器 · 桌面预览版主进程。
 *
 * 生产模式用自定义 app:// 协议（standard scheme）伺服 dist/ 静态产物：
 * 相比 file:// 直开，同源 iframe（设备预览台）与相对资源路径都能正常工作。
 * 开发模式设置 VITE_DEV_SERVER_URL 直连 Vite dev server。
 */
const { app, BrowserWindow, protocol, net, shell } = require('electron')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

const DIST = path.join(__dirname, '..', 'dist')
const DEV_URL = process.env.VITE_DEV_SERVER_URL

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: { standard: true, secure: true, supportsFetchAPI: true, corsEnabled: true },
  },
])

/** 把 app://momomoniqi/<path> 映射到 dist/ 内的文件（防目录穿越，缺省回落 index.html） */
function resolveAsset(pathname) {
  const rel = decodeURIComponent(pathname).replace(/^\/+/, '') || 'index.html'
  const file = path.normalize(path.join(DIST, rel))
  if (!file.startsWith(DIST)) return path.join(DIST, 'index.html')
  return file
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 360,
    minHeight: 640,
    backgroundColor: '#0e0c16',
    autoHideMenuBar: true,
    title: '嬷嬷模拟器 momomoniqi · 桌面预览版',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  /* 外链一律交给系统浏览器，预览窗口不开新窗 */
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url)
    return { action: 'deny' }
  })

  if (DEV_URL) {
    await win.loadURL(DEV_URL)
  } else {
    await win.loadURL('app://momomoniqi/index.html')
  }
}

app.whenReady().then(() => {
  if (!DEV_URL) {
    protocol.handle('app', (request) => {
      const { pathname } = new URL(request.url)
      return net.fetch(pathToFileURL(resolveAsset(pathname)).toString())
    })
  }
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
