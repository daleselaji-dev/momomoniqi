/** 入嬷登记流水线的舞台覆盖层：扫描线 + 步骤清单 + 盖章收尾（纯仪式感动画） */

export const PIPELINE_STEPS = [
  '主体扫描 · 幕后抠图',
  '轮廓提取 · 透明底立绘',
  '色谱统计 · 主色捕捉',
  '人设推断 · 反差建模',
  '风格装配 · 档案盖章',
]

interface Props {
  /** 当前进行到的步骤序号（0 起） */
  step: number
  onSkip: () => void
}

export function PipelineOverlay({ step, onSkip }: Props) {
  return (
    <div className="pipeline-overlay" role="status" aria-label="入嬷登记流水线">
      <div className="pipeline-beam" aria-hidden="true" />
      <div className="pipeline-box">
        <p className="pipeline-title">▚ 入嬷登记流水线 ▞</p>
        <ul className="pipeline-steps">
          {PIPELINE_STEPS.map((label, i) => (
            <li
              key={label}
              className={`pipeline-step${i < step ? ' done' : ''}${i === step ? ' active' : ''}`}
            >
              <span className="pipeline-mark">{i < step ? '■' : i === step ? '▶' : '□'}</span>
              {label}
              {i === step && <span className="pipeline-dots" />}
            </li>
          ))}
        </ul>
        <button className="btn-ghost btn-small" onClick={onSkip}>
          跳过仪式 ▸
        </button>
      </div>
    </div>
  )
}
