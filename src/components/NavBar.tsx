export type View = 'workshop' | 'community'

interface Props {
  view: View
  onView: (view: View) => void
  muted: boolean
  onToggleMute: () => void
}

/** 顶部粘性导航：品牌 + 工坊/社区切换 + 静音开关（移动端大触控区） */
export function NavBar({ view, onView, muted, onToggleMute }: Props) {
  return (
    <nav className="navbar">
      <button className="navbar-brand" onClick={() => onView('workshop')}>
        ▚ momomoniqi
      </button>
      <div className="navbar-tabs" role="tablist" aria-label="主导航">
        <button
          role="tab"
          aria-selected={view === 'workshop'}
          className={`navbar-tab${view === 'workshop' ? ' active' : ''}`}
          onClick={() => onView('workshop')}
        >
          🕹 工坊
        </button>
        <button
          role="tab"
          aria-selected={view === 'community'}
          className={`navbar-tab${view === 'community' ? ' active' : ''}`}
          onClick={() => onView('community')}
        >
          🏟 社区
        </button>
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
