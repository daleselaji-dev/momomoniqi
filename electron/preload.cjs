/** 预览版 preload：只向页面暴露最小只读信息，不开放任何 Node 能力 */
const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('momoDesktop', {
  electron: process.versions.electron,
  platform: process.platform,
})
