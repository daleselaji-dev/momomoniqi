import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Hero } from './components/Hero'
import { UploadZone } from './components/UploadZone'
import { StylePanel } from './components/StylePanel'
import { Stage } from './components/Stage'
import { MomoMeter } from './components/MomoMeter'
import { ShareBar } from './components/ShareBar'
import { Toasts, type ToastItem } from './components/Toasts'
import { useRecentTemplates } from './hooks/useRecentTemplates'
import { getPreset } from './data/presets'
import { ACHIEVEMENTS, CRIT_QUIPS, levelName, randomOf } from './data/quips'
import { getDefaultSource } from './utils/defaultMomo'
import { pixelate, toThumbnail } from './utils/pixelate'
import type { ActionDef, Quip, StyleId } from './types'

const CRIT_RATE = 0.12
const CRIT_GAIN = 66

let seq = 0

export default function App() {
  const [source, setSource] = useState<HTMLImageElement | null>(null)
  const [styleId, setStyleId] = useState<StyleId>('pixel')
  const [resolution, setResolution] = useState(48)
  const [power, setPower] = useState(0)
  const [quip, setQuip] = useState<Quip | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const unlockedRef = useRef<Set<string>>(new Set())
  const workshopRef = useRef<HTMLElement>(null)
  const { templates, addTemplate } = useRecentTemplates()

  const preset = getPreset(styleId)

  /** 像素化后的角色精灵：源图 / 颗粒度 / 风格任一变化即重算 */
  const sprite = useMemo(
    () => pixelate(source ?? getDefaultSource(), resolution, preset),
    [source, resolution, preset],
  )

  const handleImage = useCallback(
    (img: HTMLImageElement) => {
      setSource(img)
      addTemplate(toThumbnail(img))
      workshopRef.current?.scrollIntoView({ behavior: 'smooth' })
    },
    [addTemplate],
  )

  const handleAction = useCallback((action: ActionDef) => {
    const crit = Math.random() < CRIT_RATE
    const gain = crit ? CRIT_GAIN : 3 + Math.floor(Math.random() * 13)
    setQuip({ id: ++seq, text: crit ? randomOf(CRIT_QUIPS) : randomOf(action.quips), crit })
    setPower((prev) => prev + gain)
  }, [])

  /** 成就检查放在 effect 里，避免在 setPower 更新器内产生副作用（StrictMode 下会双调用） */
  useEffect(() => {
    const newly = ACHIEVEMENTS.filter((a) => power >= a.threshold && !unlockedRef.current.has(a.id))
    if (newly.length === 0) return
    newly.forEach((a) => unlockedRef.current.add(a.id))
    const items = newly.map((a) => ({ id: ++seq, title: a.title, desc: a.desc }))
    setToasts((ts) => [...ts, ...items])
  }, [power])

  const dismissToast = useCallback((id: number) => {
    setToasts((ts) => ts.filter((t) => t.id !== id))
  }, [])

  return (
    <div className="app">
      <Hero onStart={() => workshopRef.current?.scrollIntoView({ behavior: 'smooth' })} />

      <main className="workshop" id="workshop" ref={workshopRef}>
        <div className="workshop-head">
          <h2 className="workshop-title">嬷嬷工坊</h2>
          <p className="workshop-sub">上传 → 调风格 → 开嬷 → 晒卡，一条龙宠嬷流水线</p>
        </div>

        <div className="workshop-grid">
          <div className="workshop-side">
            <UploadZone
              onImage={handleImage}
              onReset={() => setSource(null)}
              hasCustomImage={source !== null}
              templates={templates}
            />
            <StylePanel
              styleId={styleId}
              onStyle={setStyleId}
              resolution={resolution}
              onResolution={setResolution}
            />
          </div>

          <div className="workshop-main">
            <Stage sprite={sprite} quip={quip} onAction={handleAction} />
            <MomoMeter power={power} />
            <ShareBar
              sprite={sprite}
              power={power}
              level={levelName(power)}
              quipText={quip?.text ?? '本嬷嬷今日营业，欢迎来宠。'}
              styleName={preset.name}
            />
          </div>
        </div>
      </main>

      <footer className="footer">
        <span>momomoniqi · 嬷嬷模拟器</span>
        <span>图片仅在你的浏览器内处理 · 请只上传你有权使用的图</span>
      </footer>

      <Toasts items={toasts} onDone={dismissToast} />
    </div>
  )
}
