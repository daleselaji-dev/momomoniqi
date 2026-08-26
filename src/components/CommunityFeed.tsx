import { useState, type CSSProperties } from 'react'
import { recipeSummary } from './WorkflowPanel'
import { playCheer, playLike } from '../utils/sound'
import { Disclaimer } from './Disclaimer'
import type { CommunityPost, WorkflowRecipe } from '../types'

interface Props {
  posts: CommunityPost[]
  onLike: (id: string) => void
  onCheer: (id: string) => void
  onGoWorkshop: () => void
  /** 玩法配方帖「一键套用」：把配方带回工坊重跑 */
  onApplyRecipe: (recipe: WorkflowRecipe) => void
}

type Filter = 'all' | 'art' | 'flow' | 'mine'

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'art', label: '作品' },
  { id: 'flow', label: '玩法配方' },
  { id: 'mine', label: '我的' },
]

/** 社区展台：作品 + 玩法配方双内容 feed，点赞 / 点彩 / 一键套用配方 */
export function CommunityFeed({ posts, onLike, onCheer, onGoWorkshop, onApplyRecipe }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const visible =
    filter === 'mine'
      ? posts.filter((p) => p.mine)
      : filter === 'all'
        ? posts
        : posts.filter((p) => p.kind === filter)

  return (
    <section className="community">
      <div className="workshop-head">
        <h2 className="workshop-title">社区展台</h2>
        <p className="workshop-sub">全站嬷嬷同人二创集散地 —— 晒作品、抄配方、点彩打 call</p>
      </div>

      <Disclaimer />

      <div className="feed-toolbar">
        <div className="feed-filters" role="tablist" aria-label="内容过滤">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              className={`feed-filter${filter === f.id ? ' active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button className="btn-ghost btn-small" onClick={onGoWorkshop}>
          🕹 去工坊做一只 ▸
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="feed-empty">
          <p className="feed-empty-face">(・ω・)ノ</p>
          <p>这里还空着。去工坊开一只嬷，过审后就能上架展台。</p>
          <button className="btn-primary" onClick={onGoWorkshop}>
            立刻开嬷 ▸
          </button>
        </div>
      ) : (
        <div className="feed-grid">
          {visible.map((post) => (
            <FeedCard key={post.id} post={post} onLike={onLike} onCheer={onCheer} onApplyRecipe={onApplyRecipe} />
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
  onApplyRecipe,
}: {
  post: CommunityPost
  onLike: (id: string) => void
  onCheer: (id: string) => void
  onApplyRecipe: (recipe: WorkflowRecipe) => void
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

  const isFlow = post.kind === 'flow' && post.recipe

  return (
    <article className={`feed-card${isFlow ? ' flow' : ''}`}>
      <div className="feed-thumb-wrap">
        <img src={post.thumb} alt={post.title} className="feed-thumb" loading="lazy" />
        <div className="feed-tags">
          {post.kind === 'flow' && <span className="feed-tag flow">玩法配方</span>}
          {post.seed && <span className="feed-tag seed">种子示例</span>}
          {post.mine && <span className="feed-tag mine">我的</span>}
        </div>
      </div>

      <div className="feed-body">
        <h4 className="feed-title">{post.title}</h4>
        <p className="feed-author">@{post.author}</p>
        {post.blurb && <p className="feed-blurb">{post.blurb}</p>}
        {isFlow && post.recipe ? (
          <div className="feed-recipe">
            <span className="feed-recipe-line">⛓ {recipeSummary(post.recipe)}</span>
            <button className="btn-accent btn-small" onClick={() => onApplyRecipe(post.recipe as WorkflowRecipe)}>
              🧪 一键套用配方
            </button>
          </div>
        ) : (
          <div className="feed-stats">
            <span className="feed-stat">风格 {post.styleName}</span>
            <span className="feed-stat pink">嬷力 {post.power}</span>
            <span className="feed-stat">「{post.level}」</span>
          </div>
        )}
      </div>

      <div className="feed-actions">
        <button
          className={`feed-btn like${post.likedByMe ? ' on' : ''}`}
          onClick={handleLike}
          aria-pressed={post.likedByMe}
        >
          {post.likedByMe ? '♥' : '♡'} {post.likes}
        </button>
        <button className="feed-btn cheer" onClick={handleCheer}>
          🎉 点彩 {post.cheers}
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
