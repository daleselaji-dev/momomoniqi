import { buildMomoSubtitle, speakMomo } from '../utils/voice'
import type { CharacterProfile } from '../types'

interface Props {
  profile: CharacterProfile
  /** 换一卦：种子偏移，重推整套人设 */
  onReroll: () => void
  /** 试听声线后把字幕丢回舞台气泡 */
  onSpeakPreview: (subtitle: string) => void
}

/** 角色档案面板：自动解析产出的名号 / 体质 / 标签 / 反差 / 口头禅 / 声线 / 指数 */
export function ProfilePanel({ profile, onReroll, onSpeakPreview }: Props) {
  function handleVoicePreview() {
    const syllables = speakMomo(profile)
    onSpeakPreview(buildMomoSubtitle(syllables))
  }

  return (
    <div className="panel profile-panel">
      <h3 className="panel-title">02 · 入嬷登记 / 角色档案</h3>

      <div className="profile-head">
        <div className="profile-name-wrap">
          <span className="profile-no">档案 {profile.dossierNo}</span>
          <strong className="profile-name">{profile.name}</strong>
        </div>
        <button className="btn-ghost btn-small" onClick={onReroll} title="不像？种子偏移重推一套">
          🎲 换一卦
        </button>
      </div>

      <div className="profile-chips">
        <span className="profile-chip lineage">体质 · {profile.lineage}</span>
        <button className="profile-chip voice" onClick={handleVoicePreview} title="点击试听嬷语声线">
          🎙 {profile.voiceLabel} ▸试听
        </button>
      </div>

      <div className="profile-tags">
        {profile.tags.map((tag) => (
          <span key={tag} className="profile-tag">
            # {tag}
          </span>
        ))}
      </div>

      <p className="profile-contrast">
        <em>反差设定</em>
        {profile.contrast}
      </p>
      <p className="profile-catch">
        <em>口头禅</em>“{profile.catchphrase}”
      </p>

      <div className="profile-stats">
        <ProfileBar label="高冷" value={profile.aloof} color="#7df6ff" />
        <ProfileBar label="活泼" value={profile.lively} color="#ffd166" />
      </div>

      <div className="profile-palette" aria-label="主色谱">
        <span className="profile-palette-label">主色谱</span>
        {profile.palette.map((hex) => (
          <span key={hex} className="profile-swatch" style={{ background: hex }} title={hex} />
        ))}
      </div>

      <p className="profile-note">本地启发式推断，仅供整活 · 已预留真 AI 解析接口</p>
    </div>
  )
}

function ProfileBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="profile-stat">
      <span className="profile-stat-label">{label}</span>
      <div className="profile-stat-bar">
        <div className="profile-stat-fill" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="profile-stat-val">{value}</span>
    </div>
  )
}
