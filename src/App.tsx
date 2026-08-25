import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Hero } from './components/Hero'
import { UploadZone } from './components/UploadZone'
import { StylePanel } from './components/StylePanel'
import { Stage } from './components/Stage'
import { MomoMeter } from './components/MomoMeter'
import { CarePanel } from './components/CarePanel'
import { ShareBar } from './components/ShareBar'
import { NavBar, type View } from './components/NavBar'
import { CommunityFeed } from './components/CommunityFeed'
import { PublishModal } from './components/PublishModal'
import { Disclaimer } from './components/Disclaimer'
import { Toasts, type ToastItem } from './components/Toasts'
import { useRecentTemplates } from './hooks/useRecentTemplates'
import { useCommunityFeed } from './hooks/useCommunityFeed'
import { getPreset } from './data/presets'
import { ACHIEVEMENTS, CRIT_QUIPS, levelName, randomOf } from './data/quips'
import { applyCare, CARE_EFFECTS, INITIAL_CARE } from './data/care'
import { getDefaultSource } from './utils/defaultMomo'
import { pixelate, toThumbnail } from './utils/pixelate'
import { isMuted, playAction, playCrit, playPublish, setMuted } from './utils/sound'
import type { ActionDef, CareStats, PublishInput, Quip, StyleId } from './types'

const CRIT_RATE = 0.12
const CRIT_GAIN = 66

let seq = 0

export default function App() {
  const [view, setView] = useState<View>('workshop')
  const [muted, setMutedState] = useState(isMuted)
  const [source, setSource] = useState<HTMLImageElement | null>(null)
  const [styleId, setStyleId] = useState<StyleId>('pixel')
  const [resolution, setResolution] = useState(48)
  const [power, setPower] = useState(0)
  const [care, setCare] = useState<CareStats>(INITIAL_CARE)
  const [quip, setQuip] = useState<Quip | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [publishOpen, setPublishOpen] = useState(false)
  const unlockedRef = useRef<Set<string>>(new Set())
  const workshopRef = useRef<HTMLElement>(null)
  const { templates, addTemplate } = useRecentTemplates()
  const feed = useCommunityFeed()

  const preset = getPreset(styleId)

  /** 像素化后的角色精灵：源图 / 颗粒度 / 风格任一变化即重算 */
  const sprite = useMemo(
    () => pixelate(source ?? getDefaultSource(), resolution, preset),
    [source, resolution, preset],
  )

  const scrollToWorkshop = useCallback(() => {
    workshopRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const goWorkshop = useCallback(() => {
    setView('workshop')
    window.scrollTo({ top: 0 })
  }, [])

  const goCommunity = useCallback(() => {
    setView('community')
    window.scrollTo({ top: 0 })
  }, [])

  const toggleMute = useCallback(() => {
    setMutedState((prev) => {
      setMuted(!prev)
      return !prev
    })
  }, [])

  const handleImage = useCallback(
    (img: HTMLImageElement) => {
      setSource(img)
      addTemplate(toThumbnail(img))
      scrollToWorkshop()
    },
    [addTemplate, scrollToWorkshop],
  )

  const handleAction = useCallback((action: ActionDef) => {
    const crit = Math.random() < CRIT_RATE
    const gain = crit ? CRIT_GAIN : 3 + Math.floor(Math.random() * 13)
    setQuip({ id: ++seq, text: crit ? randomOf(CRIT_QUIPS) : randomOf(action.quips), crit })
    setPower((prev) => prev + gain)
    setCare((prev) => applyCare(prev, CARE_EFFECTS[action.id]))
    playAction(action.id)
    if (crit) playCrit()
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

  /** 发布：PublishModal 内已强制过审，这里写入本地 feed 并跳转社区 */
  const handlePublish = useCallback(
    (input: PublishInput) => {
      feed.publish({
        ...input,
        thumb: sprite.toDataURL(),
        styleName: preset.name,
        power,
        level: levelName(power),
      })
      setPublishOpen(false)
      playPublish()
      setToasts((ts) => [
        ...ts,
        { id: ++seq, badge: '社区', title: '发布成功', desc: '作品已过审上架社区展台' },
      ])
      goCommunity()
    },
    [feed, sprite, preset.name, power, goCommunity],
  )

  return (
    <div className="app">
      <NavBar view={view} onView={(v) => (v === 'workshop' ? goWorkshop() : goCommunity())} muted={muted} onToggleMute={toggleMute} />

      {view === 'workshop' ? (
        <>
          <Hero onStart={scrollToWorkshop} onCommunity={goCommunity} />

          <main className="workshop" id="workshop" ref={workshopRef}>
            <div className="workshop-head">
              <h2 className="workshop-title">嬷嬷工坊</h2>
              <p className="workshop-sub">上传 → 调风格 → 开嬷养成 → 过审上架社区，一条龙宠嬷流水线</p>
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
                <div className="status-row">
                  <MomoMeter power={power} />
                  <CarePanel care={care} />
                </div>
                <ShareBar
                  sprite={sprite}
                  power={power}
                  level={levelName(power)}
                  quipText={quip?.text ?? '本嬷嬷今日营业，欢迎来宠。'}
                  styleName={preset.name}
                  onPublish={() => setPublishOpen(true)}
                />
              </div>
            </div>
          </main>
        </>
      ) : (
        <CommunityFeed
          posts={feed.posts}
          onLike={feed.toggleLike}
          onCheer={feed.cheer}
          onGoWorkshop={goWorkshop}
        />
      )}

      <footer className="footer">
        <div className="footer-row">
          <span>momomoniqi · 嬷嬷模拟器</span>
          <span>图片仅在你的浏览器内处理 · 请只上传你有权使用的图</span>
        </div>
        <Disclaimer variant="compact" />
      </footer>

      {publishOpen && (
        <PublishModal
          thumb={sprite.toDataURL()}
          power={power}
          level={levelName(power)}
          styleName={preset.name}
          onPublish={handlePublish}
          onClose={() => setPublishOpen(false)}
        />
      )}

      <Toasts items={toasts} onDone={dismissToast} />
    </div>
  )
}
