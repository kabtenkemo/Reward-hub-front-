import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn, formatNumber } from '../lib/format'

const BAR_COLORS = ['#e11d2a', '#f5364a', '#fb7185', '#f97316', '#a21caf', '#0ea5e9', '#14b8a6', '#eab308']

export function HorizontalBars({ data = [], valueKey = 'value', labelKey = 'label', formatValue = formatNumber, emptyText = 'No data yet', className }) {
  const max = Math.max(1, ...data.map((d) => Math.abs(Number(d[valueKey]) || 0)))

  if (!data.length) {
    return <p className="py-8 text-center text-sm text-zinc-400">{emptyText}</p>
  }

  return (
    <div className={cn('flex flex-col gap-3.5', className)}>
      {data.map((item, i) => {
        const value = Math.abs(Number(item[valueKey]) || 0)
        const pct = Math.max(2, (value / max) * 100)
        return (
          <div key={`${item[labelKey]}-${i}`} className="group">
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-semibold text-zinc-700 dark:text-zinc-200" title={item[labelKey]}>
                {item[labelKey]}
              </span>
              <span className="shrink-0 font-bold text-zinc-500 dark:text-zinc-400">{formatValue(value)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1], delay: i * 0.04 }}
                className="h-full rounded-full"
                style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function Donut({ segments = [], size = 180, thickness = 22, centerLabel, centerValue }) {
  const total = segments.reduce((sum, s) => sum + Math.abs(Number(s.value) || 0), 0)
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          className="stroke-zinc-100 dark:stroke-zinc-800"
        />
        {total > 0 &&
          segments.map((seg, i) => {
            const value = Math.abs(Number(seg.value) || 0)
            const length = (value / total) * circumference
            const el = (
              <motion.circle
                key={seg.label || i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color || BAR_COLORS[i % BAR_COLORS.length]}
                strokeWidth={thickness}
                strokeLinecap="round"
                strokeDasharray={`${length} ${circumference - length}`}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: -offset }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            )
            offset += length
            return el
          })}
      </svg>
      <div className="absolute grid place-items-center text-center">
        <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">{centerValue}</span>
        <span className="text-xs font-semibold text-zinc-400">{centerLabel}</span>
      </div>
    </div>
  )
}

export function Legend({ items = [], className }) {
  return (
    <div className={cn('flex flex-wrap gap-x-4 gap-y-2', className)}>
      {items.map((item, i) => (
        <div key={item.label || i} className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: item.color || BAR_COLORS[i % BAR_COLORS.length] }}
          />
          {item.label}
        </div>
      ))}
    </div>
  )
}

// Two-series area chart. `series` = [{ key, label, color }], `data` = [{ label, [key]: number }]
export function AreaChart({ data = [], series = [], height = 220, className }) {
  const W = 600
  const H = height
  const padY = 16
  const max = useMemo(
    () => Math.max(1, ...data.flatMap((d) => series.map((s) => Math.abs(Number(d[s.key]) || 0)))),
    [data, series],
  )

  if (!data.length) {
    return <p className="py-10 text-center text-sm text-zinc-400">No activity in this period</p>
  }

  const stepX = data.length > 1 ? W / (data.length - 1) : W
  const y = (v) => H - padY - (Math.abs(Number(v) || 0) / max) * (H - padY * 2)

  const buildPath = (key) => {
    const pts = data.map((d, i) => [i * stepX, y(d[key])])
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  }
  const buildArea = (key) => `${buildPath(key)} L${W},${H} L0,${H} Z`

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full" style={{ height }}>
        {[0.25, 0.5, 0.75].map((g) => (
          <line
            key={g}
            x1="0"
            x2={W}
            y1={H * g}
            y2={H * g}
            vectorEffect="non-scaling-stroke"
            className="stroke-zinc-100 dark:stroke-zinc-800"
            strokeWidth="1"
          />
        ))}
        {series.map((s, i) => (
          <path
            key={`area-${s.key}`}
            d={buildArea(s.key)}
            fill={s.color || BAR_COLORS[i]}
            opacity="0.12"
          />
        ))}
        {series.map((s, i) => (
          <motion.path
            key={`line-${s.key}`}
            d={buildPath(s.key)}
            fill="none"
            stroke={s.color || BAR_COLORS[i]}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-[11px] font-semibold text-zinc-400">
        {data
          .filter((_, i) => i % Math.ceil(data.length / 7 || 1) === 0)
          .map((d) => (
            <span key={d.label}>{d.label}</span>
          ))}
      </div>
    </div>
  )
}

export function Sparkline({ data = [], color = '#e11d2a', width = 120, height = 36, className }) {
  const values = data.length ? data : [0, 0]
  const max = Math.max(1, ...values)
  const min = Math.min(0, ...values)
  const range = max - min || 1
  const stepX = values.length > 1 ? width / (values.length - 1) : width
  const path = values
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * stepX).toFixed(1)},${(height - ((v - min) / range) * height).toFixed(1)}`)
    .join(' ')

  return (
    <svg width={width} height={height} className={className} viewBox={`0 0 ${width} ${height}`}>
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ProgressRing({ value = 0, max = 100, size = 120, thickness = 12, color = '#e11d2a', label, sublabel }) {
  const pct = max > 0 ? Math.min(1, value / max) : 0
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={thickness} className="stroke-zinc-100 dark:stroke-zinc-800" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - pct) }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute grid place-items-center text-center">
        <span className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50">{label}</span>
        {sublabel && <span className="text-[11px] font-semibold text-zinc-400">{sublabel}</span>}
      </div>
    </div>
  )
}

export function MiniBars({ data = [], color = '#e11d2a', height = 40, className }) {
  const values = data.length ? data : [0]
  const max = Math.max(1, ...values)
  return (
    <div className={cn('flex items-end gap-1', className)} style={{ height }}>
      {values.map((v, i) => (
        <motion.span
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${Math.max(6, (Math.abs(v) / max) * 100)}%` }}
          transition={{ duration: 0.5, delay: i * 0.03 }}
          className="w-full rounded-t"
          style={{ backgroundColor: color, opacity: 0.35 + (Math.abs(v) / max) * 0.65 }}
        />
      ))}
    </div>
  )
}
