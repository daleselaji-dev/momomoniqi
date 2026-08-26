import { useCallback, useRef, useState } from 'react'
import type { CutoutOptions, RecentTemplate } from '../types'

interface Props {
  onImage: (img: HTMLImageElement, fileName: string) => void
  onReset: () => void
  hasCustomImage: boolean
  templates: RecentTemplate[]
  /** 幕后抠图配置 + 当前抠图结果状态 */
  cutout: CutoutOptions
  onCutout: (opts: CutoutOptions) => void
  cutoutStatus: { removed: boolean; coverage: number }
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

/** 上传区：拖拽 / 点击选图 + 最近模板 + 幕后抠图开关（流水线第一步） */
export function UploadZone({ onImage, onReset, hasCustomImage, templates, cutout, onCutout, cutoutStatus }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = useCallback(
    (file: File | undefined | null) => {
      if (file && file.type.startsWith('image/')) {
        fileToImage(file, (img) => onImage(img, file.name))
      }
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
        <p className="dropzone-sub">支持 jpg / png / webp · 全程本地处理 · 上传即入嬷登记</p>
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

      {/* 幕后抠图：流水线第一步（边缘泛洪背景去除，纯本地） */}
      <div className="cutout-box">
        <div className="cutout-row">
          <button
            className={`cutout-toggle${cutout.enabled ? ' on' : ''}`}
            role="switch"
            aria-checked={cutout.enabled}
            onClick={() => onCutout({ ...cutout, enabled: !cutout.enabled })}
          >
            <span className="cutout-knob" />
            幕后抠图
          </button>
          <span className={`cutout-status${cutout.enabled && cutoutStatus.removed ? ' ok' : ''}`}>
            {!cutout.enabled
              ? '已关闭 · 使用原图'
              : cutoutStatus.removed
                ? `✂ 已出透明底立绘 · 主体 ${Math.round(cutoutStatus.coverage * 100)}%`
                : '背景太复杂，已自动回退原图'}
          </span>
        </div>
        {cutout.enabled && (
          <label className="slider-row cutout-slider">
            <span className="slider-label">
              背景容差 <em>{cutout.tolerance}</em>
            </span>
            <input
              type="range"
              min={10}
              max={90}
              step={5}
              value={cutout.tolerance}
              onChange={(e) => onCutout({ ...cutout, tolerance: Number(e.target.value) })}
            />
          </label>
        )}
      </div>

      {(templates.length > 0 || hasCustomImage) && (
        <div className="recent-row">
          {templates.map((t) => (
            <button
              key={t.id}
              className="recent-thumb"
              title="载入最近角色"
              onClick={() => dataUrlToImage(t.dataUrl, (img) => onImage(img, '最近角色.png'))}
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
