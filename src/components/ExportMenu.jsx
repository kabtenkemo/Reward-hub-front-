import { useEffect, useRef, useState } from 'react'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { Button } from './ui'

export default function ExportMenu({
  onExport,
  disabled = false,
  loading = false,
  label = 'Export',
  size = 'md',
  variant = 'outline',
  align = 'right',
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false)
    }
    const handleKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const pick = (format) => {
    setOpen(false)
    onExport?.(format)
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={disabled}
        loading={loading}
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {!loading && <Download size={15} />} {label}
      </Button>

      {open && (
        <div
          role="menu"
          className={`absolute z-20 mt-2 w-48 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-[0_18px_40px_-20px_rgba(16,24,40,0.45)] dark:border-zinc-700 dark:bg-zinc-900 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => pick('csv')}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <FileSpreadsheet size={15} className="text-emerald-600" />
            Download CSV
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => pick('pdf')}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <FileText size={15} className="text-brand-600" />
            Download PDF
          </button>
        </div>
      )}
    </div>
  )
}
