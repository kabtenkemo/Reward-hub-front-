import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GripVertical } from 'lucide-react'
import { cn } from '../lib/format'

/**
 * Responsive, dependency-free drag-and-drop grid. Widgets reorder on drag and the
 * arrangement is persisted to localStorage — matches the AB UI "interactive charts" feel.
 */
export default function DraggableGrid({ items, storageKey, className, renderItem }) {
  const ids = useMemo(() => items.map((i) => i.id), [items])
  const [order, setOrder] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null')
      if (Array.isArray(saved) && saved.length) {
        const known = saved.filter((id) => ids.includes(id))
        const missing = ids.filter((id) => !known.includes(id))
        return [...known, ...missing]
      }
    } catch {
      /* ignore */
    }
    return ids
  })
  const [dragId, setDragId] = useState(null)
  const [overId, setOverId] = useState(null)
  const [canDrag, setCanDrag] = useState(false)

  useEffect(() => {
    const known = order.filter((id) => ids.includes(id))
    const missing = ids.filter((id) => !known.includes(id))
    const next = [...known, ...missing]
    if (next.join(',') !== ids.join(',') || order.length !== ids.length) {
      setOrder(next)
    }
  }, [ids, order])

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(order))
    } catch {
      /* ignore */
    }
  }, [order, storageKey])

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items])
  const ordered = order.map((id) => byId.get(id)).filter(Boolean)

  const onDragEnter = (targetId) => {
    if (!dragId || dragId === targetId) return
    setOverId(targetId)
    setOrder((prev) => {
      const next = [...prev]
      const from = next.indexOf(dragId)
      const to = next.indexOf(targetId)
      if (from === -1 || to === -1) return prev
      next.splice(from, 1)
      next.splice(to, 0, dragId)
      return next
    })
  }

  return (
    <div className={cn('grid grid-cols-1 gap-5 lg:grid-cols-12', className)}>
      <AnimatePresence>
        {ordered.map((item) => (
          <motion.div
            key={item.id}
            layout
            draggable={canDrag}
            onDragStart={() => setDragId(item.id)}
            onDragEnd={() => {
              setDragId(null)
              setOverId(null)
              setCanDrag(false)
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => onDragEnter(item.id)}
            className={cn(
              'group relative',
              item.span || 'lg:col-span-6',
              dragId === item.id && 'drag-ghost',
              overId === item.id && dragId && dragId !== item.id && 'ring-2 ring-brand-400 rounded-2xl',
            )}
          >
            <button
              onMouseDown={() => setCanDrag(true)}
              onMouseUp={() => setCanDrag(false)}
              onTouchStart={() => setCanDrag(true)}
              className="absolute right-3 top-3 z-10 grid h-7 w-7 cursor-grab place-items-center rounded-lg text-zinc-300 opacity-0 transition-opacity hover:bg-zinc-100 hover:text-zinc-500 group-hover:opacity-100 dark:hover:bg-zinc-800"
              title="Drag to rearrange"
            >
              <GripVertical size={16} />
            </button>
            {renderItem(item)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
