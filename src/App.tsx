import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Hero } from './components/Hero'
import { UploadZone } from './components/UploadZone'
import { CharacterPicker } from './components/CharacterPicker'
import { StylePanel } from './components/StylePanel'
import { Stage } from './components/Stage'
import { MomoMeter } from './components/MomoMeter'
import { CarePanel } from './components/CarePanel'
import { ShareBar } from './components/ShareBar'
import { WorkflowPanel } from './components/WorkflowPanel'
import { NavBar, type View } from './components/NavBar'
import { CommunityFeed } from './components/CommunityFeed'
import { PreviewStage } from './components/PreviewStage'
import { PublishModal } from './components/PublishModal'
import { Disclaimer } from './components/Disclaimer'
import { Toasts, type ToastItem } from './components/Toasts'
import { useRecentTemplates } from './hooks/useRecentTemplates'
import { useCommunityFeed } from './hooks/useCommunityFeed'
import { useWorkflows } from './hooks/useWorkflows'
import { getPreset, STYLE_PRESETS } from './data/presets'
import { ACHIEVEMENTS, ACTIONS, critQuipsFor, getTone, levelName, quipsFor, randomOf } from './data/quips'
import { applyCare, CARE_EFFECTS, INITIAL_CARE } from './data/care'
import { drawCharacter, getCharacter } from './data/characters'
import { templateForTone } from './data/workflows'
import { getDefaultSource } from './utils/defaultMomo'
import { pixelate, toThumbnail } from './utils/pixelate'
import { isMuted, playAction, playCrit, playPublish, playSpawn, setMuted } from './utils/sound'
import type {
  ActionDef,
  ActionId,
  CareStats,
  CharacterDef,
  CommunityPost,
  PublishInput,
  Quip,
  StyleId,
  ToneId,
  WorkflowSnapshot,
} from './types'

const CRIT_RATE = 0.12
const CRIT_GAIN = 66
/** 一键演出的连打节奏（毫秒/步） */
const SCRIPT_BEAT = 820

let seq = 0

export default function App() {
  /** 预览台 iframe 内嵌模式：隐藏预览入口，避免套娃 */
  const isEmbed = useMemo(() => new URLSearchParams(window.location.search).has('embed'), [])

  const [view, setView] = useState<View>('workshop')
  const [muted, setMutedState] = useState(isMuted)
  const [source, setSource] = useState<HTMLImageElement | HTMLCanvasElement | null>(null)
  const [characterId, setCharacterId] = useState<string | null>(null)
  const [styleId, setStyleId] = useState<StyleId>('pixel')
  const [resolution, setResolution] = useState(48)
  const [tone, setTone] = useState<ToneId>('momo')
  const [script, setScript] = useState<ActionId[]>([])
  const [performing, setPerforming] = useState<number | null>(null)
  const [autoFire, setAutoFire] = useState<{ action: ActionDef; seq: number } | null>(null)
  const [spawnTick, setSpawnTick] = useState(0)
  const [styleTouched, setStyleTouched] = useState(false)
  const [produced, setProduced] = useState(false)
  const [power, setPower] = useState(0)
  const [care, setCare] = useState<CareStats>(INITIAL_CARE)
  const [quip, setQuip] = useState<Quip | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [publishOpen, setPublishOpen] = useState(false)
  const unlockedRef = useRef<Set<string>>(new Set())
  const workshopRef = useRef<HTMLElement>(null)
  const scriptTimerRef = useRef<number | null>(null)
  const { templates, addTemplate } = useRecentTemplates()
  const feed = useCommunityFeed()
  const { workflows, saveWorkflow, removeWorkflow } = useWorkflows()

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

  const goView = useCallback(
    (v: View) => {
      if (v === 'workshop') return goWorkshop()
      setView(v)
      window.scrollTo({ top: 0 })
    },
    [goWorkshop],
  )

  const toggleMute = useCallback(() => {
    setMutedState((prev) => {
      setMuted(!prev)
      return !prev
    })
  }, [])

  const pushToast = useCallback((item: Omit<ToastItem, 'id'>) => {
    setToasts((ts) => [...ts, { ...item, id: ++seq }])
  }, [])

  const handleImage = useCallback(
    (img: HTMLImageElement) => {
      setSource(img)
      setCharacterId(null)
      setSpawnTick((t) => t + 1)
      playSpawn()
      addTemplate(toThumbnail(img))
      scrollToWorkshop()
    },
    [addTemplate, scrollToWorkshop],
  )

  /** 载入原创角色：换源图 + 自动切到推荐语气 + spawn 传送动效 */
  const handleCharacter = useCallback(
    (def: CharacterDef) => {
      setSource(drawCharacter(def, 16))
      setCharacterId(def.id)
      setTone(def.tone)
      setSpawnTick((t) => t + 1)
      playSpawn()
      pushToast({
        badge: '角色库',
        title: `${def.name} 已就位`,
        desc: `已切到「${getTone(def.tone).name}」语气 —— ${def.intro}`,
      })
      scrollToWorkshop()
    },
    [pushToast, scrollToWorkshop],
  )

  const handleReset = useCallback(() => {
    setSource(null)
    setCharacterId(null)
  }, [])

  const handleStyle = useCallback((id: StyleId) => {
    setStyleId(id)
    setStyleTouched(true)
  }, [])

  const handleAction = useCallback(
    (action: ActionDef) => {
      const crit = Math.random() < CRIT_RATE
      const gain = crit ? CRIT_GAIN : 3 + Math.floor(Math.random() * 13)
      setQuip({
        id: ++seq,
        text: crit ? randomOf(critQuipsFor(tone)) : randomOf(quipsFor(action.id, tone)),
        crit,
      })
      setPower((prev) => prev + gain)
      setCare((prev) => applyCare(prev, CARE_EFFECTS[action.id]))
      playAction(action.id)
      if (crit) playCrit()
    },
    [tone],
  )

  /** 一键演出：按脚本节拍连打动作，Stage 走完整 fire 管线（动画/粒子/音效/数值） */
  const runScript = useCallback(() => {
    if (performing !== null || script.length === 0) return
    const steps = [...script]
    let i = 0
    const step = () => {
      const def = ACTIONS.find((a) => a.id === steps[i])
      if (def) setAutoFire({ action: def, seq: ++seq })
      setPerforming(i)
      i += 1
      if (i < steps.length) {
        scriptTimerRef.current = window.setTimeout(step, SCRIPT_BEAT)
      } else {
        scriptTimerRef.current = window.setTimeout(() => setPerforming(null), SCRIPT_BEAT + 200)
      }
    }
    scrollToWorkshop()
    step()
  }, [performing, script, scrollToWorkshop])

  useEffect(() => {
    return () => {
      if (scriptTimerRef.current !== null) window.clearTimeout(scriptTimerRef.current)
    }
  }, [])

  /** 套用爆款模板：语气 + 脚本一起装载 */
  const applyTemplate = useCallback((t: ToneId, s: ActionId[]) => {
    setTone(t)
    setScript(s)
  }, [])

  const handleSaveWorkflow = useCallback(
    (name: string) => {
      saveWorkflow({ name, characterId, styleId, resolution, tone, script })
      pushToast({ badge: '工作流', title: '工作流已保存', desc: '下次进来一键复演这套连招' })
    },
    [saveWorkflow, characterId, styleId, resolution, tone, script, pushToast],
  )

  const handleLoadWorkflow = useCallback(
    (w: WorkflowSnapshot) => {
      setStyleId(w.styleId)
      setResolution(w.resolution)
      setTone(w.tone)
      setScript(w.script)
      setStyleTouched(true)
      if (w.characterId) {
        const def = getCharacter(w.characterId)
        if (def) {
          setSource(drawCharacter(def, 16))
          setCharacterId(def.id)
          setSpawnTick((t) => t + 1)
          playSpawn()
        }
      }
      pushToast({ badge: '工作流', title: `「${w.name}」已载入`, desc: '点「一键演出」直接开演' })
    },
    [pushToast],
  )

  /** 二创同款：把作品的风格 + 语气 + 推荐脚本装进工坊 */
  const handleRemix = useCallback(
    (post: CommunityPost) => {
      const target =
        STYLE_PRESETS.find((p) => p.id === post.styleId) ??
        STYLE_PRESETS.find((p) => p.name === post.styleName)
      if (target) {
        setStyleId(target.id)
        setStyleTouched(true)
      }
      const t: ToneId = post.tone ?? 'momo'
      setTone(t)
      setScript(templateForTone(t).script)
      pushToast({
        badge: '二创',
        title: '同款配方已装进工坊',
        desc: '选一只原创角色或上传图，点「一键演出」开演',
      })
      goWorkshop()
    },
    [pushToast, goWorkshop],
  )

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
        styleId: preset.id,
        tone,
        power,
        level: levelName(power),
      })
      setPublishOpen(false)
      setProduced(true)
      playPublish()
      pushToast({ badge: '社区', title: '发布成功', desc: '作品已过审上架社区展台' })
      goCommunity()
    },
    [feed, sprite, preset, tone, power, pushToast, goCommunity],
  )

  const characterName = characterId
    ? getCharacter(characterId)?.name ?? '原创角色'
    : source
      ? '自定义角色'
      : '默认嬷嬷'

  const stepFlags = {
    character: source !== null,
    style: styleTouched,
    script: script.length > 0,
    output: produced,
  }

  return (
    <div className="app">
      <NavBar view={view} onView={goView} muted={muted} onToggleMute={toggleMute} showPreview={!isEmbed} />

      {view === 'workshop' ? (
        <>
          <Hero onStart={scrollToWorkshop} onCommunity={goCommunity} />

          <main className="workshop" id="workshop" ref={workshopRef}>
            <div className="workshop-head">
              <h2 className="workshop-title">嬷嬷工坊 · 创意工作台</h2>
              <p className="workshop-sub">
                选角色 → 定风格 → 编动作脚本 → 一键演出出片，工作流可保存复用，攻向嬷向随时切
              </p>
            </div>

            <div className="workshop-grid">
              <div className="workshop-side">
                <UploadZone
                  onImage={handleImage}
                  onReset={handleReset}
                  hasCustomImage={source !== null}
                  templates={templates}
                />
                <CharacterPicker activeId={characterId} onPick={handleCharacter} />
                <StylePanel
                  styleId={styleId}
                  onStyle={handleStyle}
                  resolution={resolution}
                  onResolution={setResolution}
                />
              </div>

              <div className="workshop-main">
                <Stage
                  sprite={sprite}
                  quip={quip}
                  onAction={handleAction}
                  autoFire={autoFire}
                  spawnTick={spawnTick}
                />
                <div className="status-row">
                  <MomoMeter power={power} />
                  <CarePanel care={care} />
                </div>
                <WorkflowPanel
                  characterName={characterName}
                  styleName={preset.name}
                  stepFlags={stepFlags}
                  tone={tone}
                  onTone={setTone}
                  script={script}
                  onScript={setScript}
                  performing={performing}
                  onRun={runScript}
                  onApplyTemplate={applyTemplate}
                  saved={workflows}
                  onSave={handleSaveWorkflow}
                  onLoad={handleLoadWorkflow}
                  onRemove={removeWorkflow}
                />
                <ShareBar
                  sprite={sprite}
                  power={power}
                  level={levelName(power)}
                  quipText={quip?.text ?? '本嬷嬷今日营业，欢迎来宠。'}
                  styleName={preset.name}
                  toneTag={`${getTone(tone).name}二创`}
                  onPublish={() => setPublishOpen(true)}
                  onProduced={() => setProduced(true)}
                />
              </div>
            </div>
          </main>
        </>
      ) : view === 'community' ? (
        <CommunityFeed
          posts={feed.posts}
          onLike={feed.toggleLike}
          onCheer={feed.cheer}
          onGoWorkshop={goWorkshop}
          onRemix={handleRemix}
        />
      ) : (
        <PreviewStage />
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
          toneName={getTone(tone).name}
          onPublish={handlePublish}
          onClose={() => setPublishOpen(false)}
        />
      )}

      <Toasts items={toasts} onDone={dismissToast} />
    </div>
  )
}
