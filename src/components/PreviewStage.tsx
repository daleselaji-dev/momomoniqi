import { useLayoutEffect, useMemo, useRef, useState } from 'react'

type Device = 'desktop' | 'mobile'

const VIEWPORTS: Record<Device, { w: number; h: number; label: string; name: string }> = {
  desktop: { w: 1280, h: 800, label: '1280 × 800', name: '电脑' },
  mobile: { w: 390, h: 844, label: '390 × 844', name: '手机' },
}

/**
 * 设备预览台：在桌面显示器 / 手机外框里以真实视口尺寸内嵌整个应用（iframe），
 * 响应式媒体查询按视口真实生效——切一下就能看到桌面与移动端的实际表现。
 * 预览实例与主窗口同源，localStorage（社区 feed / 工作流 / 模板）完全共用。
 */
export function PreviewStage() {
  const [device, setDevice] = useState<Device>('desktop')
  const areaRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null)

  /** 内嵌实例带 embed 标记：隐藏预览台入口，避免套娃递归 */
  const embedUrl = useMemo(() => {
    const u = new URL(window.location.href)
    u.searchParams.set('embed', '1')
    u.hash = ''
    return u.toString()
  }, [])

  const vp = VIEWPORTS[device]

  /* 外框按 1:1 布局渲染，再整体 scale 塞进可用区域（transform 不影响布局尺寸，可直接量原始大小） */
  useLayoutEffect(() => {
    function update() {
      const area = areaRef.current
      const frame = frameRef.current
      if (!area || !frame) return
      const natW = frame.offsetWidth
      const natH = frame.offsetHeight
      if (natW === 0 || natH === 0) return
      const availW = area.clientWidth
      const availH = Math.max(400, window.innerHeight - 250)
      setScale(Math.min(1, availW / natW, availH / natH))
      setNat({ w: natW, h: natH })
    }
    update()
    const ro = new ResizeObserver(update)
    if (areaRef.current) ro.observe(areaRef.current)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [device])

  return (
    <section className="preview-stage">
      <div className="workshop-head">
        <h2 className="workshop-title">设备预览台</h2>
        <p className="workshop-sub">同一个嬷嬷模拟器，装进显示器和手机壳里各看一眼 —— 视口真实生效，直接上手玩</p>
      </div>

      <div className="preview-toolbar">
        <div className="device-toggle" role="tablist" aria-label="预览设备">
          {(Object.keys(VIEWPORTS) as Device[]).map((d) => (
            <button
              key={d}
              role="tab"
              aria-selected={device === d}
              className={`device-tab${device === d ? ' active' : ''}`}
              onClick={() => setDevice(d)}
            >
              {d === 'desktop' ? '🖥' : '📱'} {VIEWPORTS[d].name}
            </button>
          ))}
        </div>
        <span className="device-meta">
          视口 {vp.label} · 缩放 {(scale * 100).toFixed(0)}% · 与主窗口共用本机数据
        </span>
      </div>

      <div className="device-area" ref={areaRef}>
        <div
          className="device-scale-box"
          style={nat ? { width: nat.w * scale, height: nat.h * scale } : undefined}
        >
          {/* key 换设备时重挂载：触发外框入场动效 + 以新视口重载应用 */}
          <div
            key={device}
            ref={frameRef}
            className={`device-frame ${device}`}
            style={{ transform: `scale(${scale})` }}
          >
            {device === 'desktop' ? (
              <>
                <div className="monitor-shell">
                  <div className="device-screen" style={{ width: vp.w, height: vp.h }}>
                    <iframe src={embedUrl} title="电脑端预览" className="device-iframe" />
                  </div>
                  <div className="monitor-chin">
                    <span>MOMO-DISPLAY-01</span>
                    <span className="crt-led" />
                  </div>
                </div>
                <div className="monitor-neck" />
                <div className="monitor-foot" />
              </>
            ) : (
              <div className="phone-shell">
                <div className="phone-notch" />
                <div className="device-screen" style={{ width: vp.w, height: vp.h }}>
                  <iframe src={embedUrl} title="手机端预览" className="device-iframe" />
                </div>
                <div className="phone-homebar" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
