import { useState, type CSSProperties } from 'react'
import { playCheer, playLike } from '../utils/sound'
import { Disclaimer } from './Disclaimer'
import type { CommunityPost } from '../types'

interface Props {
  posts: CommunityPost[]
  onLike: (id: string) => void
  onCheer: (id: string) => void
  onGoWorkshop: () => void
  /** 二创同款：把该作品的风格 + 语气 + 推荐脚本装进工坊 */
  onRemix: (post: CommunityPost) => void
}

type Filter = 'all' | 'mine'

/** 社区展台：DIY 作品 feed + 点赞 / 点彩 / 二创同款 + 全部/我的过滤 */
export function CommunityFeed({ posts, onLike, onCheer, onGoWorkshop, onRemix }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const visible = filter === 'mine' ? posts.filter((p) => p.mine) : posts

  return (
    <section className="community">
      <div className="workshop-head">
        <h2 className="workshop-title">社区展台</h2>
        <p className="workshop-sub">攻的嬷的都有 —— 点赞收藏，点彩打 call，看中哪只直接「二创同款」</p>
      </div>

      <Disclaimer />

      <div className="feed-toolbar">
        <div className="feed-filters" role="tablist" aria-label="作品过滤">
          <button
            role="tab"
            aria-selected={filter === 'all'}
            className={`feed-filter${filter === 'all' ? ' active' : ''}`}
            onClick={() => setFilter('all')}
          >
            全部作品
          </button>
          <button
            role="tab"
            aria-selected={filter === 'mine'}
            className={`feed-filter${filter === 'mine' ? ' active' : ''}`}
            onClick={() => setFilter('mine')}
          >
            我的作品
          </button>
        </div>
        <button className="btn-ghost btn-small" onClick={onGoWorkshop}>
          🕹 去工坊做一只 ▸
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="feed-empty">
          <p className="feed-empty-face">(・ω・)ノ</p>
          <p>你还没有发布过作品。去工坊开一只嬷，过审后就能上架展台。</p>
          <button className="btn-primary" onClick={onGoWorkshop}>
            立刻开嬷 ▸
          </button>
        </div>
      ) : (
        <div className="feed-grid">
          {visible.map((post) => (
            <FeedCard key={post.id} post={post} onLike={onLike} onCheer={onCheer} onRemix={onRemix} />
          ))}
        </div>
      )}
    </section>
  )
}

/* ---------- 单张作品卡 ---------- */

const CONFETTI_COLORS = ['#ff4d8d', '#b8f04a', '#ff9edb', '#7df6ff', '#ffd166', '#f5eee0']

interface ConfettiBit {
  key: string
  style: CSSProperties
}

let confettiSeq = 0

function FeedCard({
  post,
  onLike,
  onCheer,
  onRemix,
}: {
  post: CommunityPost
  onLike: (id: string) => void
  onCheer: (id: string) => void
  onRemix: (post: CommunityPost) => void
}) {
  const [confetti, setConfetti] = useState<ConfettiBit[]>([])

  function handleLike() {
    playLike(!post.likedByMe)
    onLike(post.id)
  }

  function handleCheer() {
    playCheer()
    onCheer(post.id)
    const burst: ConfettiBit[] = Array.from({ length: 12 }, () => ({
      key: `c${confettiSeq++}`,
      style: {
        background: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        ['--cx' as string]: `${(Math.random() - 0.5) * 180}px`,
        ['--cy' as string]: `${-40 - Math.random() * 130}px`,
        ['--cr' as string]: `${(Math.random() - 0.5) * 540}deg`,
        animationDelay: `${Math.random() * 0.08}s`,
      },
    }))
    setConfetti((prev) => [...prev.slice(-24), ...burst])
    window.setTimeout(() => {
      setConfetti((prev) => prev.filter((c) => !burst.includes(c)))
    }, 1000)
  }

  return (
    <article className="feed-card">
      <div className="feed-thumb-wrap">
        <img src={post.thumb} alt={post.title} className="feed-thumb" loading="lazy" />
        <div className="feed-tags">
          {post.seed && <span className="feed-tag seed">种子示例</span>}
          {post.mine && <span className="feed-tag mine">我的</span>}
          {post.tone && (
            <span className={`feed-tag tone-${post.tone}`}>{post.tone === 'gong' ? '攻向' : '嬷向'}</span>
          )}
        </div>
      </div>

      <div className="feed-body">
        <h4 className="feed-title">{post.title}</h4>
        <p className="feed-author">@{post.author}</p>
        {post.blurb && <p className="feed-blurb">{post.blurb}</p>}
        <div className="feed-stats">
          <span className="feed-stat">风格 {post.styleName}</span>
          <span className="feed-stat pink">嬷力 {post.power}</span>
          <span className="feed-stat">「{post.level}」</span>
        </div>
      </div>

      <div className="feed-actions three">
        <button
          className={`feed-btn like${post.likedByMe ? ' on' : ''}`}
          onClick={handleLike}
          aria-pressed={post.likedByMe}
        >
          {post.likedByMe ? '♥' : '♡'} {post.likes}
        </button>
        <button className="feed-btn cheer" onClick={handleCheer}>
          🎉 {post.cheers}
        </button>
        <button className="feed-btn remix" onClick={() => onRemix(post)} title="把同款风格与语气装进工坊">
          ⚡ 二创同款
        </button>
      </div>

      <div className="confetti-layer" aria-hidden="true">
        {confetti.map((c) => (
          <span key={c.key} className="confetti-bit" style={c.style} />
        ))}
      </div>
    </article>
  )
}
