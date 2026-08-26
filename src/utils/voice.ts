import { getVoiceStyle, MOMO_SYLLABLES, MOMO_TRANSLATIONS } from '../data/persona'
import { beep, noiseBurst } from './sound'
import type { CharacterProfile } from '../types'

/**
 * 嬷语开麦：按角色档案声线现场合成一串「怪声嘟噜语」。
 * 自研音色——每个音节是一记带滑音的短振荡脉冲，音高做受限随机游走，
 * 辅音用一点白噪声开头，句尾按语气上挑 / 下沉。零采样、零素材。
 */

/** 合成一句嬷语（声音），返回音节数（与字幕对齐） */
export function speakMomo(profile: CharacterProfile): number {
  const style = getVoiceStyle(profile.voice)
  const count = 4 + Math.floor(Math.random() * 4)
  const gap = style.syllable + 0.035
  let ratio = 1

  for (let i = 0; i < count; i++) {
    /* 受限随机游走：音高在 0.72~1.55 倍基频之间晃 */
    ratio = Math.max(0.72, Math.min(1.55, ratio + (Math.random() - 0.5) * style.wander))
    let freq = style.base * ratio
    let slide = freq * (Math.random() < 0.5 ? 1.09 : 0.92)

    /* 句尾语气：一半上挑（撒娇质问），一半下沉（威严盖章） */
    if (i === count - 1) {
      slide = freq * (Math.random() < 0.5 ? 1.35 : 0.7)
    }

    const delay = i * gap
    /* 辅音开头：一小口白噪声 */
    if (Math.random() < 0.45) noiseBurst(0.018, delay, 0.02)
    beep({ freq, slide, dur: style.syllable, delay, type: style.wave, vol: 0.05 })
    /* 偶尔叠一个八度泛音，让怪声更「有人味」 */
    if (Math.random() < 0.3) {
      beep({ freq: freq * 2, slide: slide * 2, dur: style.syllable * 0.7, delay, type: 'sine', vol: 0.018 })
    }
  }
  return count
}

/** 生成与语音对齐的嬷语字幕：「嘟噜咕·嬷！（翻译：……）」 */
export function buildMomoSubtitle(syllableCount: number): string {
  const bits: string[] = []
  for (let i = 0; i < syllableCount; i++) {
    bits.push(MOMO_SYLLABLES[Math.floor(Math.random() * MOMO_SYLLABLES.length)])
  }
  const gibberish = bits.join('')
  const translation = MOMO_TRANSLATIONS[Math.floor(Math.random() * MOMO_TRANSLATIONS.length)]
  return `「${gibberish}·嬷！」（翻译：${translation}）`
}

/** 直戳角色时的短促怪声：音高随连击数走高，越戳越上头 */
export function pokeBlip(profile: CharacterProfile, combo: number): void {
  const style = getVoiceStyle(profile.voice)
  const freq = style.base * (1 + Math.min(combo, 24) * 0.05) * (0.95 + Math.random() * 0.1)
  beep({ freq, slide: freq * 1.12, dur: 0.05, type: style.wave, vol: 0.045 })
}

/** 长按捏住：一声被拉长的变调呜咽 */
export function holdWhine(profile: CharacterProfile): void {
  const style = getVoiceStyle(profile.voice)
  beep({ freq: style.base * 1.3, slide: style.base * 0.72, dur: 0.34, type: style.wave, vol: 0.05 })
  beep({ freq: style.base * 2.6, slide: style.base * 1.44, dur: 0.3, delay: 0.02, type: 'sine', vol: 0.015 })
}
