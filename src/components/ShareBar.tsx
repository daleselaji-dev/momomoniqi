import { useState } from 'react'
import { buildShareText, downloadCard, renderShareCard } from '../utils/shareCard'

interface Props {
  sprite: HTMLCanvasElement
  power: number
  level: string
  quipText: string
  styleName: string
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // 非安全上下文回退方案
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  }
}

/** 分享栏：Canvas 生成认证卡下载 PNG / 复制传播文案 */
export function ShareBar({ sprite, power, level, quipText, styleName }: Props) {
  const [copied, setCopied] = useState(false)

  function handleDownload() {
    const card = renderShareCard({ sprite, power, level, quip: quipText, styleName })
    downloadCard(card, `momo-card-${power}.png`)
  }

  async function handleCopy() {
    const ok = await copyText(buildShareText(power, level, quipText))
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    }
  }

  return (
    <div className="share-bar">
      <button className="btn-primary" onClick={handleDownload}>
        ⬇ 生成嬷嬷认证卡 PNG
      </button>
      <button className="btn-ghost" onClick={handleCopy}>
        {copied ? '✓ 已复制，快去发' : '⧉ 复制传播文案'}
      </button>
    </div>
  )
}
