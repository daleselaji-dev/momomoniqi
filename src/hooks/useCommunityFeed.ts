import { useCallback, useState } from 'react'
import { buildSeedPosts } from '../data/seedPosts'
import type { CommunityPost, PostKind, PublishInput, WorkflowRecipe } from '../types'

const KEY = 'momo.feed.v1'
const MAX_POSTS = 60

/**
 * 本地模拟社区 feed（MVP：纯前端持久化到 localStorage）。
 * 首次访问播种内置示例作品；发布 / 点赞 / 点彩全部本地计数。
 * 正式上线需替换为服务端 feed + 审核链路。
 */

function save(posts: CommunityPost[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(posts))
  } catch {
    /* 配额满：仅保留内存态 */
  }
}

function load(): CommunityPost[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const list = JSON.parse(raw) as CommunityPost[]
      if (Array.isArray(list) && list.length > 0) {
        /* 兼容旧版本地数据：缺 kind 字段的一律视为作品帖 */
        const normalized = list.map((p) => ({ ...p, kind: p.kind ?? 'art' }))
        /* 老用户 feed 里没有玩法配方种子：补播一次，让「玩法」标签页有内容 */
        if (!normalized.some((p) => p.kind === 'flow')) {
          const flowSeeds = buildSeedPosts().filter(
            (s) => s.kind === 'flow' && !normalized.some((p) => p.id === s.id),
          )
          const merged = [...normalized, ...flowSeeds]
          save(merged)
          return merged
        }
        return normalized
      }
    }
  } catch {
    /* 解析失败则重新播种 */
  }
  const seeds = buildSeedPosts()
  save(seeds)
  return seeds
}

export interface PublishPayload extends PublishInput {
  kind: PostKind
  thumb: string
  styleName: string
  power: number
  level: string
  recipe?: WorkflowRecipe
}

export function useCommunityFeed() {
  const [posts, setPosts] = useState<CommunityPost[]>(load)

  const mutate = useCallback((fn: (prev: CommunityPost[]) => CommunityPost[]) => {
    setPosts((prev) => {
      const next = fn(prev)
      save(next)
      return next
    })
  }, [])

  /** 前提：调用方已通过审核（moderateFields）后才允许调用 */
  const publish = useCallback(
    (payload: PublishPayload): CommunityPost => {
      const post: CommunityPost = {
        id: `p${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
        kind: payload.kind,
        title: payload.title,
        author: payload.author,
        blurb: payload.blurb,
        thumb: payload.thumb,
        styleName: payload.styleName,
        power: payload.power,
        level: payload.level,
        likes: 0,
        cheers: 0,
        likedByMe: false,
        mine: true,
        seed: false,
        ts: Date.now(),
        recipe: payload.recipe,
      }
      mutate((prev) => [post, ...prev].slice(0, MAX_POSTS))
      return post
    },
    [mutate],
  )

  const toggleLike = useCallback(
    (id: string) => {
      mutate((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, likedByMe: !p.likedByMe, likes: Math.max(0, p.likes + (p.likedByMe ? -1 : 1)) }
            : p,
        ),
      )
    },
    [mutate],
  )

  const cheer = useCallback(
    (id: string) => {
      mutate((prev) => prev.map((p) => (p.id === id ? { ...p, cheers: p.cheers + 1 } : p)))
    },
    [mutate],
  )

  return { posts, publish, toggleLike, cheer }
}
