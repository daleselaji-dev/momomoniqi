export type View = 'workshop' | 'community' | 'preview'

interface Props {
  view: View
  onView: (view: View) => void
  muted: boolean
  onToggleMute: () => void
  /** 预览台 iframe 内嵌模式下隐藏预览入口，避免套娃递归 */
  showPreview?: boolean
}

const TABS: { id: View; label: string }[] = [
  { id: 'workshop', label: '🕹 工坊' },
  { id: 'community', label: '🏟 社区' },
  { id: 'preview', label: '🖥 预览台' },
]

/** 顶部粘性导航：品牌 + 工坊/社区/预览台切换 + 静音开关（移动端大触控区） */
export function NavBar({ view, onView, muted, onToggleMute, showPreview = true }: Props) {
  const tabs = showPreview ? TABS : TABS.filter((t) => t.id !== 'preview')
  return (
    <nav className="navbar">
      <button className="navbar-brand" onClick={() => onView('workshop')}>
        ▚ momomoniqi
      </button>
      <div className="navbar-tabs" role="tablist" aria-label="主导航">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={view === t.id}
            className={`navbar-tab${view === t.id ? ' active' : ''}`}
            onClick={() => onView(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <button
        className="navbar-mute"
        onClick={onToggleMute}
        aria-label={muted ? '取消静音' : '静音'}
        title={muted ? '取消静音' : '静音'}
      >
        {muted ? '🔇' : '🔊'}
      </button>
    </nav>
  )
}
