import { useState } from 'react'
import { buildShareText } from '../utils/shareCard'

interface Props {
  power: number
  level: string
  quipText: string
  onPublish: () => void
  onOpenStudio: () => void
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

/** 分享栏：发布到社区（先过审）/ 出卡工作室（3 模板）/ 复制传播文案 */
export function ShareBar({ power, level, quipText, onPublish, onOpenStudio }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const ok = await copyText(buildShareText(power, level, quipText))
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    }
  }

  return (
    <div className="share-bar">
      <button className="btn-accent" onClick={onPublish}>
        ⚑ 发布到社区（先过审）
      </button>
      <button className="btn-primary" onClick={onOpenStudio}>
        🎴 出卡工作室（3 种模板）
      </button>
      <button className="btn-ghost" onClick={handleCopy}>
        {copied ? '✓ 已复制，快去发' : '⧉ 复制传播文案'}
      </button>
    </div>
  )
}
