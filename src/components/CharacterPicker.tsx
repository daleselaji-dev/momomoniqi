import { useMemo } from 'react'
import { CHARACTERS, drawCharacter } from '../data/characters'
import { getTone } from '../data/quips'
import type { CharacterDef } from '../types'

interface Props {
  activeId: string | null
  onPick: (def: CharacterDef) => void
}

/** 原创角色库：内置免版权像素角色，一键载入工坊（自动切到推荐语气） */
export function CharacterPicker({ activeId, onPick }: Props) {
  /* 缩略图只渲染一次：6 张 20×20 网格 → dataURL */
  const thumbs = useMemo(
    () => CHARACTERS.map((c) => ({ def: c, url: drawCharacter(c, 6).toDataURL() })),
    [],
  )

  return (
    <div className="panel">
      <h3 className="panel-title">02 · 原创角色库</h3>
      <p className="char-note">全部为本作原创像素角色，零版权顾虑，点击直接开演</p>
      <div className="char-grid">
        {thumbs.map(({ def, url }) => (
          <button
            key={def.id}
            className={`char-card${def.id === activeId ? ' active' : ''}`}
            onClick={() => onPick(def)}
            title={def.intro}
          >
            <span className={`char-tone ${def.tone}`}>{getTone(def.tone).short}</span>
            <img src={url} alt={def.name} className="char-thumb" />
            <span className="char-name">{def.name}</span>
            <span className="char-vibe">{def.vibe}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
