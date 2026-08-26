import type { ActionId } from '../types'

/**
 * Web Audio 合成音效：全部用振荡器 / 白噪声现场合成，零音频文件。
 * 全局静音开关持久化到 localStorage；AudioContext 在首次用户手势时懒创建。
 */

const MUTE_KEY = 'momo.muted.v1'

let ctx: AudioContext | null = null
let muted = ((): boolean => {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
})()

export function isMuted(): boolean {
  return muted
}

export function setMuted(next: boolean): void {
  muted = next
  try {
    localStorage.setItem(MUTE_KEY, next ? '1' : '0')
  } catch {
    /* 忽略配额异常 */
  }
}

function ensureCtx(): AudioContext | null {
  if (muted) return null
  if (!ctx) {
    const AC = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

interface BeepOpts {
  /** 起始频率 Hz */
  freq: number
  /** 结束频率（滑音），缺省保持不变 */
  slide?: number
  /** 时长（秒） */
  dur?: number
  /** 相对当前时刻的延迟（秒） */
  delay?: number
  type?: OscillatorType
  vol?: number
}

export function beep({ freq, slide, dur = 0.09, delay = 0, type = 'square', vol = 0.05 }: BeepOpts): void {
  const ac = ensureCtx()
  if (!ac) return
  const t0 = ac.currentTime + delay
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slide !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t0 + dur)
  gain.gain.setValueAtTime(vol, t0)
  gain.gain.exponentialRampToValueAtTime(0.0008, t0 + dur)
  osc.connect(gain).connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

/** 白噪声脉冲（咀嚼 / 彩屑质感） */
export function noiseBurst(dur = 0.08, delay = 0, vol = 0.04): void {
  const ac = ensureCtx()
  if (!ac) return
  const t0 = ac.currentTime + delay
  const len = Math.max(1, Math.floor(ac.sampleRate * dur))
  const buffer = ac.createBuffer(1, len, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const src = ac.createBufferSource()
  src.buffer = buffer
  const gain = ac.createGain()
  gain.gain.setValueAtTime(vol, t0)
  gain.gain.exponentialRampToValueAtTime(0.0008, t0 + dur)
  src.connect(gain).connect(ac.destination)
  src.start(t0)
}

/** 每个动作一段 8-bit 小音效 */
export function playAction(id: ActionId): void {
  switch (id) {
    case 'pat':
      beep({ freq: 660, slide: 880, dur: 0.07, type: 'triangle', vol: 0.06 })
      beep({ freq: 880, slide: 990, dur: 0.08, delay: 0.09, type: 'triangle', vol: 0.05 })
      break
    case 'rua':
      beep({ freq: 300, slide: 520, dur: 0.14, type: 'sawtooth', vol: 0.04 })
      beep({ freq: 520, slide: 260, dur: 0.14, delay: 0.12, type: 'sawtooth', vol: 0.04 })
      break
    case 'boop':
      beep({ freq: 220, slide: 110, dur: 0.08, vol: 0.06 })
      noiseBurst(0.05, 0, 0.05)
      break
    case 'feed':
      noiseBurst(0.06, 0, 0.05)
      noiseBurst(0.06, 0.12, 0.05)
      beep({ freq: 523, slide: 784, dur: 0.1, delay: 0.24, type: 'triangle', vol: 0.05 })
      break
    case 'sleep':
      beep({ freq: 587, slide: 440, dur: 0.22, type: 'sine', vol: 0.05 })
      beep({ freq: 440, slide: 330, dur: 0.26, delay: 0.22, type: 'sine', vol: 0.04 })
      beep({ freq: 330, slide: 262, dur: 0.3, delay: 0.46, type: 'sine', vol: 0.03 })
      break
    case 'praise':
      beep({ freq: 523, dur: 0.07, type: 'square', vol: 0.045 })
      beep({ freq: 659, dur: 0.07, delay: 0.08, type: 'square', vol: 0.045 })
      beep({ freq: 784, dur: 0.1, delay: 0.16, type: 'square', vol: 0.05 })
      break
    case 'play':
      beep({ freq: 392, slide: 784, dur: 0.1, type: 'triangle', vol: 0.05 })
      beep({ freq: 784, slide: 392, dur: 0.12, delay: 0.14, type: 'triangle', vol: 0.05 })
      noiseBurst(0.04, 0.28, 0.04)
      break
    case 'speak':
      /* 开麦提示音；正片怪声由 utils/voice.ts 按档案声线合成 */
      beep({ freq: 740, slide: 988, dur: 0.06, type: 'square', vol: 0.04 })
      break
  }
}

/** 暴击小号角 */
export function playCrit(): void {
  beep({ freq: 523, dur: 0.08, vol: 0.05 })
  beep({ freq: 659, dur: 0.08, delay: 0.09, vol: 0.05 })
  beep({ freq: 784, dur: 0.08, delay: 0.18, vol: 0.05 })
  beep({ freq: 1047, dur: 0.2, delay: 0.27, vol: 0.06 })
}

export function playLike(on: boolean): void {
  if (on) beep({ freq: 880, slide: 1175, dur: 0.09, type: 'triangle', vol: 0.05 })
  else beep({ freq: 587, slide: 440, dur: 0.08, type: 'triangle', vol: 0.035 })
}

/** 点彩：一小串上行琶音 + 彩屑噪声 */
export function playCheer(): void {
  beep({ freq: 659, dur: 0.06, type: 'square', vol: 0.04 })
  beep({ freq: 831, dur: 0.06, delay: 0.06, type: 'square', vol: 0.04 })
  beep({ freq: 988, dur: 0.06, delay: 0.12, type: 'square', vol: 0.045 })
  beep({ freq: 1319, dur: 0.12, delay: 0.18, type: 'square', vol: 0.05 })
  noiseBurst(0.12, 0.18, 0.03)
}

/** 发布成功欢呼 */
export function playPublish(): void {
  beep({ freq: 523, dur: 0.09, type: 'triangle', vol: 0.05 })
  beep({ freq: 784, dur: 0.09, delay: 0.1, type: 'triangle', vol: 0.05 })
  beep({ freq: 1047, dur: 0.22, delay: 0.2, type: 'triangle', vol: 0.06 })
}

/** 审核未通过警示音 */
export function playReject(): void {
  beep({ freq: 220, dur: 0.14, type: 'sawtooth', vol: 0.045 })
  beep({ freq: 165, dur: 0.22, delay: 0.15, type: 'sawtooth', vol: 0.045 })
}

/** 档案盖章：两记闷响 + 一声清脆确认（入嬷登记完成） */
export function playStamp(): void {
  beep({ freq: 130, slide: 90, dur: 0.09, type: 'square', vol: 0.055 })
  noiseBurst(0.05, 0.01, 0.045)
  beep({ freq: 110, slide: 80, dur: 0.1, delay: 0.16, type: 'square', vol: 0.055 })
  beep({ freq: 988, dur: 0.12, delay: 0.34, type: 'triangle', vol: 0.05 })
}

/** 配方保存：短促上行确认 */
export function playSave(): void {
  beep({ freq: 587, dur: 0.06, type: 'triangle', vol: 0.045 })
  beep({ freq: 880, dur: 0.09, delay: 0.07, type: 'triangle', vol: 0.05 })
}

/** 出卡翻面：一阵短风 + 落定 */
export function playFlip(): void {
  noiseBurst(0.12, 0, 0.035)
  beep({ freq: 494, slide: 740, dur: 0.08, delay: 0.1, type: 'triangle', vol: 0.04 })
}

/** 连击里程碑：随档位升调的琶音 */
export function playComboMilestone(tier: number): void {
  const base = 523 * Math.pow(1.19, Math.min(3, tier))
  beep({ freq: base, dur: 0.06, vol: 0.05 })
  beep({ freq: base * 1.26, dur: 0.06, delay: 0.06, vol: 0.05 })
  beep({ freq: base * 1.5, dur: 0.12, delay: 0.12, vol: 0.055 })
  noiseBurst(0.08, 0.12, 0.03)
}
