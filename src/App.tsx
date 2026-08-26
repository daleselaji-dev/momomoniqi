import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Hero } from './components/Hero'
import { UploadZone } from './components/UploadZone'
import { ProfilePanel } from './components/ProfilePanel'
import { StylePanel } from './components/StylePanel'
import { WorkflowPanel } from './components/WorkflowPanel'
import { Stage } from './components/Stage'
import { MomoMeter } from './components/MomoMeter'
import { CarePanel } from './components/CarePanel'
import { StickerPanel } from './components/StickerPanel'
import { ShareBar } from './components/ShareBar'
import { CardStudio } from './components/CardStudio'
import { NavBar, type View } from './components/NavBar'
import { CommunityFeed } from './components/CommunityFeed'
import { PublishModal } from './components/PublishModal'
import { Disclaimer } from './components/Disclaimer'
import { Toasts, type ToastItem } from './components/Toasts'
import { PIPELINE_STEPS } from './components/PipelineOverlay'
import { recipeSummary } from './components/WorkflowPanel'
import { useRecentTemplates } from './hooks/useRecentTemplates'
import { useCommunityFeed } from './hooks/useCommunityFeed'
import { useWorkflows } from './hooks/useWorkflows'
import { getPreset } from './data/presets'
import { ACHIEVEMENTS, CRIT_QUIPS, levelName, randomOf } from './data/quips'
import { applyCare, CARE_EFFECTS, INITIAL_CARE, POKE_EFFECT } from './data/care'
import { COMBO_MILESTONES, HOLD_QUIPS, POKE_QUIPS, type PokeZone } from './data/persona'
import { getSticker } from './data/stickers'
import { getDefaultSource } from './utils/defaultMomo'
import { pixelate, toThumbnail } from './utils/pixelate'
import { cutoutSubject } from './utils/cutout'
import { analyzeCharacter } from './utils/analyze'
import { buildMomoSubtitle, holdWhine, pokeBlip, speakMomo } from './utils/voice'
import type { CardInput } from './utils/shareCard'
import {
  isMuted,
  playAction,
  playComboMilestone,
  playCrit,
  playPublish,
  playSave,
  playStamp,
  setMuted,
} from './utils/sound'
import type {
  ActionDef,
  CardTemplateId,
  CareStats,
  CutoutOptions,
  PlacedSticker,
  PostKind,
  PublishInput,
  Quip,
  StickerDef,
  StyleId,
  WorkflowRecipe,
} from './types'

const CRIT_RATE = 0.12
const CRIT_GAIN = 66
const MAX_STICKERS = 12
/** 套用配方时贴纸的预置落点（舞台归一化坐标） */
const STICKER_SCATTER: Array<[number, number]> = [
  [0.3, 0.22],
  [0.72, 0.26],
  [0.24, 0.62],
  [0.76, 0.66],
  [0.5, 0.16],
  [0.5, 0.8],
]

let seq = 0

export default function App() {
  const [view, setView] = useState<View>('workshop')
  const [muted, setMutedState] = useState(isMuted)
  const [source, setSource] = useState<HTMLImageElement | null>(null)
  const [fileName, setFileName] = useState('默认嬷嬷.png')
  const [cutout, setCutout] = useState<CutoutOptions>({ enabled: true, tolerance: 45 })
  const [reroll, setReroll] = useState(0)
  const [styleId, setStyleId] = useState<StyleId>('pixel')
  const [resolution, setResolution] = useState(48)
  const [power, setPower] = useState(0)
  const [care, setCare] = useState<CareStats>(INITIAL_CARE)
  const [quip, setQuip] = useState<Quip | null>(null)
  const [stickers, setStickers] = useState<PlacedSticker[]>([])
  const [placing, setPlacing] = useState<StickerDef | null>(null)
  const [cardTemplate, setCardTemplate] = useState<CardTemplateId>('badge')
  const [studioOpen, setStudioOpen] = useState(false)
  const [pipelineStep, setPipelineStep] = useState<number | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  /** 发布弹窗：null 关闭；art / flow 决定发布内容类型 */
  const [publishKind, setPublishKind] = useState<PostKind | null>(null)
  const unlockedRef = useRef<Set<string>>(new Set())
  const workshopRef = useRef<HTMLElement>(null)
  const { templates, addTemplate } = useRecentTemplates()
  const feed = useCommunityFeed()
  const { flows, saveFlow, removeFlow } = useWorkflows()

  const preset = getPreset(styleId)
  const rawSource = source ?? getDefaultSource()

  /** 流水线第 1 步：幕后抠图（开启时输出透明底立绘，失败自动回退原图） */
  const cutoutResult = useMemo(
    () => (cutout.enabled ? cutoutSubject(rawSource, cutout.tolerance) : null),
    [rawSource, cutout],
  )
  const subject = cutoutResult?.removed ? cutoutResult.canvas : rawSource

  /** 流水线第 2 步：像素化 / 风格化精灵 */
  const sprite = useMemo(() => pixelate(subject, resolution, preset), [subject, resolution, preset])

  /** 流水线第 3 步：自动解析角色档案（本地启发式，reroll = 换一卦） */
  const profile = useMemo(() => analyzeCharacter(subject, fileName, reroll), [subject, fileName, reroll])

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

  const pushToast = useCallback((item: Omit<ToastItem, 'id'>) => {
    setToasts((ts) => [...ts, { ...item, id: ++seq }])
  }, [])

  /** 上传新角色 → 重置装扮 → 启动入嬷登记流水线动画 */
  const handleImage = useCallback(
    (img: HTMLImageElement, name: string) => {
      setSource(img)
      setFileName(name)
      setReroll(0)
      setStickers([])
      setPlacing(null)
      addTemplate(toThumbnail(img))
      setPipelineStep(0)
      scrollToWorkshop()
    },
    [addTemplate, scrollToWorkshop],
  )

  /** 流水线动画步进：走完盖章 + 建档 toast（实际计算是同步的，这里是仪式感） */
  useEffect(() => {
    if (pipelineStep === null) return
    if (pipelineStep >= PIPELINE_STEPS.length) {
      setPipelineStep(null)
      playStamp()
      pushToast({ badge: '档案', title: '入嬷登记完成', desc: `「${profile.name}」已建档，可以开宠了` })
      return
    }
    const t = window.setTimeout(() => setPipelineStep((s) => (s === null ? null : s + 1)), 520)
    return () => window.clearTimeout(t)
  }, [pipelineStep, profile.name, pushToast])

  const handleAction = useCallback(
    (action: ActionDef) => {
      const isSpeak = action.id === 'speak'
      const crit = !isSpeak && Math.random() < CRIT_RATE
      const gain = crit ? CRIT_GAIN : 3 + Math.floor(Math.random() * 13)
      let text: string
      if (isSpeak) {
        /* 嬷语开麦：按档案声线合成怪声，字幕与音节数对齐 */
        text = buildMomoSubtitle(speakMomo(profile))
      } else {
        text = crit ? randomOf(CRIT_QUIPS) : randomOf(action.quips)
      }
      setQuip({ id: ++seq, text, crit })
      setPower((prev) => prev + gain)
      setCare((prev) => applyCare(prev, CARE_EFFECTS[action.id]))
      playAction(action.id)
      if (crit) playCrit()
    },
    [profile],
  )

  /** 直戳角色：分区文案 + 连击里程碑 + 音高渐升的怪声 */
  const handlePoke = useCallback(
    (zone: PokeZone, combo: number) => {
      pokeBlip(profile, combo)
      const milestone = COMBO_MILESTONES.find((m) => m.count === combo)
      if (milestone) {
        const tier = COMBO_MILESTONES.indexOf(milestone)
        setQuip({ id: ++seq, text: milestone.text, crit: tier >= 1 })
        playComboMilestone(tier)
        setPower((prev) => prev + 12)
      } else {
        if (combo === 1 || combo % 4 === 0) {
          setQuip({ id: ++seq, text: randomOf(POKE_QUIPS[zone]), crit: false })
        }
        setPower((prev) => prev + 1)
      }
      setCare((prev) => applyCare(prev, POKE_EFFECT))
    },
    [profile],
  )

  /** 长按捏住：专属文案 + 变调呜咽 */
  const handleHold = useCallback(() => {
    holdWhine(profile)
    setQuip({ id: ++seq, text: randomOf(HOLD_QUIPS), crit: false })
    setPower((prev) => prev + 4)
    setCare((prev) => applyCare(prev, { bond: 2 }))
  }, [profile])

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

  /* ---------- 贴纸装扮 ---------- */

  const handlePlaceSticker = useCallback(
    (x: number, y: number) => {
      if (!placing) return
      if (stickers.length >= MAX_STICKERS) {
        pushToast({ badge: '装扮', title: '贴不下了', desc: `最多 ${MAX_STICKERS} 张贴纸，先摘几张吧` })
        setPlacing(null)
        return
      }
      setStickers((prev) => [
        ...prev,
        {
          key: `s${++seq}`,
          stickerId: placing.id,
          glyph: placing.glyph,
          x,
          y,
          scale: 0.85 + Math.random() * 0.5,
          rot: (Math.random() - 0.5) * 36,
        },
      ])
      setPlacing(null)
      playSave()
    },
    [placing, stickers.length, pushToast],
  )

  const handleRemoveSticker = useCallback((key: string) => {
    setStickers((prev) => prev.filter((s) => s.key !== key))
  }, [])

  /* ---------- 配方工作流 ---------- */

  const currentRecipe: WorkflowRecipe = useMemo(
    () => ({
      cutout: cutout.enabled,
      tolerance: cutout.tolerance,
      styleId,
      resolution,
      stickerIds: [...new Set(stickers.map((s) => s.stickerId))],
      cardTemplate,
    }),
    [cutout, styleId, resolution, stickers, cardTemplate],
  )

  const handleSaveFlow = useCallback(
    (name: string) => {
      saveFlow(name, currentRecipe)
      playSave()
      pushToast({ badge: '配方', title: '配方已保存', desc: `「${name}」随时一键再跑` })
    },
    [saveFlow, currentRecipe, pushToast],
  )

  /** 一键套用配方：重跑抠图/风格/贴纸/出卡模板整条流水线 */
  const handleApplyRecipe = useCallback(
    (recipe: WorkflowRecipe) => {
      setCutout({ enabled: recipe.cutout, tolerance: recipe.tolerance })
      setStyleId(recipe.styleId)
      setResolution(recipe.resolution)
      setCardTemplate(recipe.cardTemplate)
      setStickers(
        recipe.stickerIds.slice(0, STICKER_SCATTER.length).flatMap((sid, i) => {
          const def = getSticker(sid)
          if (!def) return []
          const [x, y] = STICKER_SCATTER[i]
          return [
            {
              key: `s${++seq}`,
              stickerId: sid,
              glyph: def.glyph,
              x,
              y,
              scale: 1,
              rot: (i % 2 === 0 ? -1 : 1) * 12,
            },
          ]
        }),
      )
      playSave()
      pushToast({ badge: '配方', title: '配方已套用', desc: '整条流水线已按配方重跑' })
      goWorkshop()
    },
    [pushToast, goWorkshop],
  )

  /* ---------- 出卡 / 发布 ---------- */

  const cardInput: CardInput = useMemo(
    () => ({
      sprite,
      source: rawSource,
      profile,
      care,
      power,
      level: levelName(power),
      quip: quip?.text ?? profile.catchphrase,
      styleName: preset.name,
      stickers,
    }),
    [sprite, rawSource, profile, care, power, quip, preset.name, stickers],
  )

  /** 发布：PublishModal 内已强制过审，这里写入本地 feed 并跳转社区 */
  const handlePublish = useCallback(
    (input: PublishInput) => {
      const kind = publishKind ?? 'art'
      feed.publish({
        ...input,
        kind,
        thumb: sprite.toDataURL(),
        styleName: preset.name,
        power,
        level: levelName(power),
        recipe: kind === 'flow' ? currentRecipe : undefined,
      })
      setPublishKind(null)
      playPublish()
      pushToast({
        badge: '社区',
        title: '发布成功',
        desc: kind === 'flow' ? '玩法配方已过审上架，等人来抄' : '作品已过审上架社区展台',
      })
      goCommunity()
    },
    [publishKind, feed, sprite, preset.name, power, currentRecipe, pushToast, goCommunity],
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
              <p className="workshop-sub">上传 → 入嬷登记 → 开嬷养成 → 贴纸装扮 → 出卡 / 发配方，一条龙宠嬷流水线</p>
            </div>

            <div className="workshop-grid">
              <div className="workshop-side">
                <UploadZone
                  onImage={handleImage}
                  onReset={() => {
                    setSource(null)
                    setFileName('默认嬷嬷.png')
                    setReroll(0)
                    setStickers([])
                  }}
                  hasCustomImage={source !== null}
                  templates={templates}
                  cutout={cutout}
                  onCutout={setCutout}
                  cutoutStatus={{ removed: cutoutResult?.removed ?? false, coverage: cutoutResult?.coverage ?? 1 }}
                />
                <ProfilePanel
                  profile={profile}
                  onReroll={() => setReroll((r) => r + 1)}
                  onSpeakPreview={(subtitle) => setQuip({ id: ++seq, text: subtitle, crit: false })}
                />
                <StylePanel
                  styleId={styleId}
                  onStyle={setStyleId}
                  resolution={resolution}
                  onResolution={setResolution}
                />
                <WorkflowPanel
                  flows={flows}
                  currentRecipe={currentRecipe}
                  onSave={handleSaveFlow}
                  onApply={handleApplyRecipe}
                  onRemove={removeFlow}
                  onShareCurrent={() => setPublishKind('flow')}
                />
              </div>

              <div className="workshop-main">
                <Stage
                  sprite={sprite}
                  quip={quip}
                  onAction={handleAction}
                  stickers={stickers}
                  placing={placing}
                  onPlaceSticker={handlePlaceSticker}
                  onRemoveSticker={handleRemoveSticker}
                  onPoke={handlePoke}
                  onHold={handleHold}
                  pipelineStep={pipelineStep}
                  onSkipPipeline={() => setPipelineStep(PIPELINE_STEPS.length)}
                />
                <div className="status-row">
                  <MomoMeter power={power} />
                  <CarePanel care={care} />
                </div>
                <StickerPanel
                  placed={stickers}
                  placing={placing}
                  onPick={setPlacing}
                  onUndo={() => setStickers((prev) => prev.slice(0, -1))}
                  onClear={() => setStickers([])}
                />
                <ShareBar
                  power={power}
                  level={levelName(power)}
                  quipText={quip?.text ?? '本嬷嬷今日营业，欢迎来宠。'}
                  onPublish={() => setPublishKind('art')}
                  onOpenStudio={() => setStudioOpen(true)}
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
          onApplyRecipe={handleApplyRecipe}
        />
      )}

      <footer className="footer">
        <div className="footer-row">
          <span>momomoniqi · 嬷嬷模拟器</span>
          <span>图片仅在你的浏览器内处理 · 请只上传你有权使用的图</span>
        </div>
        <Disclaimer variant="compact" />
      </footer>

      {publishKind !== null && (
        <PublishModal
          thumb={sprite.toDataURL()}
          power={power}
          level={levelName(power)}
          styleName={preset.name}
          kind={publishKind}
          recipeSummary={recipeSummary(currentRecipe)}
          onPublish={handlePublish}
          onClose={() => setPublishKind(null)}
        />
      )}

      {studioOpen && (
        <CardStudio
          input={cardInput}
          template={cardTemplate}
          onTemplate={setCardTemplate}
          onClose={() => setStudioOpen(false)}
        />
      )}

      <Toasts items={toasts} onDone={dismissToast} />
    </div>
  )
}
