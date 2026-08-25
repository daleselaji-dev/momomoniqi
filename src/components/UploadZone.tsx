import { useCallback, useRef, useState } from 'react'
import type { RecentTemplate } from '../types'

interface Props {
  onImage: (img: HTMLImageElement) => void
  onReset: () => void
  hasCustomImage: boolean
  templates: RecentTemplate[]
}

function fileToImage(file: File, cb: (img: HTMLImageElement) => void) {
  const reader = new FileReader()
  reader.onload = () => {
    const img = new Image()
    img.onload = () => cb(img)
    img.src = String(reader.result)
  }
  reader.readAsDataURL(file)
}

function dataUrlToImage(dataUrl: string, cb: (img: HTMLImageElement) => void) {
  const img = new Image()
  img.onload = () => cb(img)
  img.src = dataUrl
}

/** 上传区：拖拽 / 点击选图 + 最近模板 + 恢复默认嬷嬷 */
export function UploadZone({ onImage, onReset, hasCustomImage, templates }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = useCallback(
    (file: File | undefined | null) => {
      if (file && file.type.startsWith('image/')) fileToImage(file, onImage)
    },
    [onImage],
  )

  return (
    <div className="panel">
      <h3 className="panel-title">01 · 导入角色</h3>
      <div
        className={`dropzone${dragging ? ' dragging' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFile(e.dataTransfer.files?.[0])
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
      >
        <span className="dropzone-icon">⇪</span>
        <p className="dropzone-main">拖一张角色图进来，或点击选择</p>
        <p className="dropzone-sub">支持 jpg / png / webp · 全程本地处理</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            handleFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>

      {(templates.length > 0 || hasCustomImage) && (
        <div className="recent-row">
          {templates.map((t) => (
            <button
              key={t.id}
              className="recent-thumb"
              title="载入最近角色"
              onClick={() => dataUrlToImage(t.dataUrl, onImage)}
            >
              <img src={t.dataUrl} alt="最近角色" />
            </button>
          ))}
          {hasCustomImage && (
            <button className="btn-ghost btn-small" onClick={onReset}>
              ↺ 换回默认嬷嬷
            </button>
          )}
        </div>
      )}
    </div>
  )
}
