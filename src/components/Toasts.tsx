import { useEffect } from 'react'

export interface ToastItem {
  id: number
  title: string
  desc: string
}

function Toast({ item, onDone }: { item: ToastItem; onDone: (id: number) => void }) {
  useEffect(() => {
    const t = window.setTimeout(() => onDone(item.id), 3400)
    return () => window.clearTimeout(t)
  }, [item.id, onDone])

  return (
    <div className="toast">
      <span className="toast-badge">成就解锁</span>
      <strong>{item.title}</strong>
      <span className="toast-desc">{item.desc}</span>
    </div>
  )
}

/** 成就 toast 堆栈（右上角，自动消失） */
export function Toasts({ items, onDone }: { items: ToastItem[]; onDone: (id: number) => void }) {
  return (
    <div className="toast-stack" role="status">
      {items.map((t) => (
        <Toast key={t.id} item={t} onDone={onDone} />
      ))}
    </div>
  )
}
