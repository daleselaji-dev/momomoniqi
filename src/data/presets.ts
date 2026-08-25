import type { StylePreset } from '../types'

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'pixel',
    name: '像素原味',
    tagline: '原色打格，最像本嬷',
    ramp: null,
    dither: 0,
    swatch: 'linear-gradient(135deg, #ffd9b8 0 50%, #c4455f 50% 100%)',
  },
  {
    id: 'gameboy',
    name: '复古掌机',
    tagline: '四色绿屏，1989 年的嬷',
    ramp: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
    dither: 0.7,
    swatch: 'linear-gradient(135deg, #0f380f 0 25%, #306230 25% 50%, #8bac0f 50% 75%, #9bbc0f 75% 100%)',
  },
  {
    id: 'cyberpink',
    name: '赛博粉',
    tagline: '霓虹注入，嬷力过载',
    ramp: ['#1b1033', '#4d2178', '#a12a8e', '#ff4d8d', '#ff9edb', '#7df6ff'],
    dither: 0.45,
    swatch: 'linear-gradient(135deg, #1b1033 0 25%, #a12a8e 25% 55%, #ff4d8d 55% 80%, #7df6ff 80% 100%)',
  },
  {
    id: 'ink',
    name: '墨水印',
    tagline: '黑白盖章，官方认证嬷',
    ramp: ['#191413', '#4c403a', '#c8bba7', '#f3ead7'],
    dither: 0.9,
    swatch: 'linear-gradient(135deg, #191413 0 40%, #4c403a 40% 60%, #f3ead7 60% 100%)',
  },
]

export function getPreset(id: string): StylePreset {
  return STYLE_PRESETS.find((p) => p.id === id) ?? STYLE_PRESETS[0]
}
