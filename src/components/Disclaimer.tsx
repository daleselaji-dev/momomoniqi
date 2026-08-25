interface Props {
  /** compact：页脚单行；boxed：带边框警示块（发布弹窗 / 社区页） */
  variant?: 'compact' | 'boxed'
}

const FULL_TEXT =
  '用户 DIY 创作内容由用户自行发布并承担全部责任，与本产品无关，本产品不承担任何责任。' +
  '请勿上传未经授权的肖像或版权内容；禁止发布违法及侵害他人权益的内容。'

/** 统一免责声明：页脚 / 发布弹窗 / 社区页固定可见 */
export function Disclaimer({ variant = 'boxed' }: Props) {
  if (variant === 'compact') {
    return <p className="disclaimer-compact">免责声明：{FULL_TEXT}</p>
  }
  return (
    <div className="disclaimer-box" role="note">
      <span className="disclaimer-badge">⚠ 免责声明</span>
      <p>{FULL_TEXT}</p>
    </div>
  )
}
