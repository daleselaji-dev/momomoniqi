import { useEffect, useRef } from 'react'
import { drawMomoSprite } from '../utils/defaultMomo'

/** 首屏：品牌强信号 + 一句 headline + 支撑句 + 双 CTA（工坊 / 社区）+ 像素嬷嬷主视觉 */
export function Hero({ onStart, onCommunity }: { onStart: () => void; onCommunity: () => void }) {
  const screenRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = screenRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(drawMomoSprite(1), 0, 0, canvas.width, canvas.height)
  }, [])

  return (
    <header className="hero">
      <div className="hero-copy">
        <p className="hero-eyebrow">▚ momomoniqi · 赛博宠嬷装置 ▞</p>
        <h1 className="hero-brand">
          嬷嬷
          <br />
          模拟器
        </h1>
        <p className="hero-headline">把你最严肃的角色，宠成全网嬷嬷。</p>
        <p className="hero-support">
          上传一张图，自动抠图入嬷登记、生成角色档案 —— 摸头 rua 脸嬷语开麦，宠出离谱嬷力值；
          贴纸装扮出三种嬷卡，配方还能发布成玩法帖给全站抄作业。
        </p>
        <div className="hero-cta-row">
          <button className="btn-primary" onClick={onStart}>
            立刻开嬷 ▸
          </button>
          <button className="btn-ghost" onClick={onCommunity}>
            🏟 先逛社区展台
          </button>
          <span className="hero-note">无需注册 · 纯前端 · 图片不出浏览器</span>
        </div>
      </div>

      <div className="hero-visual" aria-hidden="true">
        <div className="crt-frame">
          <div className="crt-screen">
            <span className="crt-hand">🫳</span>
            <canvas ref={screenRef} width={200} height={200} className="crt-momo" />
            <span className="crt-heart h1">💗</span>
            <span className="crt-heart h2">✨</span>
            <span className="crt-heart h3">💗</span>
          </div>
          <div className="crt-label">
            <span>MOMO-01</span>
            <span className="crt-led" />
          </div>
        </div>
      </div>
    </header>
  )
}
