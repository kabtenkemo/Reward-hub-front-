import { cn } from '../lib/format'

const LOGO_SRC = '/logo.png'

export default function Logo({ collapsed = false, className }) {
  if (collapsed) {
    return (
      <span
        className={cn(
          'grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white shadow-[0_10px_20px_-10px_rgba(225,29,42,0.8)]',
          className,
        )}
      >
        <img src={LOGO_SRC} alt="Reward Hub" className="h-full w-full object-contain p-0.5" />
      </span>
    )
  }

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white shadow-[0_10px_20px_-10px_rgba(225,29,42,0.8)]">
        <img src={LOGO_SRC} alt="Reward Hub" className="h-full w-full object-contain p-0.5" />
      </span>
      <div className="leading-tight">
        <p className="bg-gradient-to-r from-brand-600 to-rose-500 bg-clip-text text-base font-extrabold tracking-tight text-transparent">
          Reward Hub
        </p>
        <p className="text-[11px] font-semibold text-zinc-400">Student rewards platform</p>
      </div>
    </div>
  )
}
