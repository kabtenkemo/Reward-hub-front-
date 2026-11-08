import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn, initials } from '../lib/format'

export { cn }

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06)]',
        'dark:border-zinc-800 dark:bg-zinc-900',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function SectionCard({ title, subtitle, action, icon: Icon, className, bodyClassName, children }) {
  return (
    <Card className={cn('flex flex-col overflow-hidden', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            {Icon && (
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
                <Icon size={18} />
              </span>
            )}
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
              {subtitle && <p className="text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      <div className={cn('flex-1 p-5', bodyClassName)}>{children}</div>
    </Card>
  )
}

export function Button({ variant = 'primary', size = 'md', className, loading, disabled, children, ...props }) {
  const variants = {
    primary:
      'bg-brand-600 text-white hover:bg-brand-700 shadow-[0_10px_24px_-12px_rgba(225,29,42,0.7)] disabled:bg-brand-400',
    outline:
      'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-transparent dark:text-zinc-200 dark:hover:bg-zinc-800',
    ghost: 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  }
  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-5 text-sm',
  }
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-70',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}

export function Badge({ tone = 'neutral', className, children }) {
  const tones = {
    neutral: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
    warning: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
    success: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
    danger: 'bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400',
    brand: 'bg-brand-600 text-white',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Field({ label, hint, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">{label}</span>}
      {children}
      {hint && <span className="text-xs text-zinc-400">{hint}</span>}
    </label>
  )
}

const controlClass =
  'h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100'

export function Input({ className, ...props }) {
  return <input className={cn(controlClass, className)} {...props} />
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cn(controlClass, 'appearance-none pr-8', className)} {...props}>
      {children}
    </select>
  )
}

export function Spinner({ className }) {
  return <Loader2 className={cn('animate-spin text-brand-600', className)} size={20} />
}

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-sm text-zinc-500">
      <Spinner />
      {label}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      {Icon && (
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
          <Icon size={22} />
        </span>
      )}
      <div>
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{title}</p>
        {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Avatar({ name, size = 36, className }) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-bold text-white',
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name) || '?'}
    </span>
  )
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300"
    >
      <span
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors',
          checked ? 'bg-brand-600' : 'bg-zinc-300 dark:bg-zinc-700',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
            checked ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </span>
      {label}
    </button>
  )
}

export function StatTile({ label, value, tone = 'brand', className }) {
  return (
    <div className={cn('rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-950/50', className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
      <p
        className={cn(
          'mt-1 text-xl font-extrabold',
          tone === 'success' && 'text-emerald-600 dark:text-emerald-400',
          tone === 'danger' && 'text-brand-600 dark:text-brand-400',
          tone === 'neutral' && 'text-zinc-800 dark:text-zinc-100',
        )}
      >
        {value}
      </p>
    </div>
  )
}

export function MotionList({ children, className }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export const listItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
}
