import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Medal, TrendingUp } from 'lucide-react'
import { SectionCard, PageHeader, Avatar, Badge, EmptyState, LoadingState } from '../components/ui'
import ExportMenu from '../components/ExportMenu'
import { Sparkline } from '../components/charts'
import { studentsApi } from '../lib/api'
import { exportFilename, exportReport } from '../lib/export'
import { cn, formatNumber } from '../lib/format'

const EXPORT_COLUMNS = [
  { key: 'rank', header: 'Rank' },
  { key: 'fullNameEn', header: 'Student' },
  { key: 'className', header: 'Class' },
  { key: 'gradeName', header: 'Grade' },
  { key: 'totalPoints', header: 'Points' },
]

const PODIUM = [
  { ring: 'ring-amber-400', bg: 'from-amber-400 to-amber-600', order: 'order-2 sm:translate-y-0', h: 'h-32' },
  { ring: 'ring-zinc-300', bg: 'from-zinc-300 to-zinc-500', order: 'order-1 sm:translate-y-6', h: 'h-24' },
  { ring: 'ring-orange-400', bg: 'from-orange-400 to-orange-600', order: 'order-3 sm:translate-y-6', h: 'h-24' },
]

export default function LeaderboardPage() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    studentsApi
      .list({ pageSize: 200 })
      .then((data) => setStudents(data?.items || []))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false))
  }, [])

  const ranked = useMemo(
    () => [...students].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0)),
    [students],
  )
  const top = ranked.slice(0, 3)
  const max = ranked[0]?.totalPoints || 1

  const exportRows = ranked.map((student, index) => ({ ...student, rank: index + 1 }))
  const handleExport = (format) =>
    exportReport(format, {
      filename: exportFilename('leaderboard'),
      title: 'Leaderboard',
      subtitle: `${ranked.length} students`,
      columns: EXPORT_COLUMNS,
      rows: exportRows,
      summary: [{ label: 'Students', value: ranked.length }],
    })

  if (loading) return <LoadingState label="Building the leaderboard…" />

  if (!ranked.length) {
    return (
      <>
        <PageHeader title="Leaderboard" subtitle="Top point earners across the school." />
        <SectionCard>
          <EmptyState icon={Trophy} title="No students yet" description="Once students earn points they will rank here." />
        </SectionCard>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Leaderboard"
        subtitle="Top point earners across the school."
        action={<ExportMenu onExport={handleExport} disabled={!ranked.length} />}
      />

      <div className="mb-6 grid grid-cols-3 items-end gap-3 sm:gap-5">
        {top.map((student, i) => {
          const style = PODIUM[i]
          return (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn('flex flex-col items-center', style.order)}
            >
              <Avatar name={student.fullNameEn} size={i === 0 ? 68 : 56} className={cn('ring-4', style.ring)} />
              <div className="mt-2 flex items-center gap-1 text-xs font-bold">
                {i === 0 ? <Trophy size={14} className="text-amber-500" /> : <Medal size={14} className="text-zinc-400" />}
                <span className="text-zinc-500">#{i + 1}</span>
              </div>
              <p className="mt-0.5 max-w-full truncate text-center text-sm font-bold text-zinc-800 dark:text-zinc-100">
                {student.fullNameEn}
              </p>
              <p className="text-xs text-zinc-400">{student.className || '—'}</p>
              <div
                className={cn(
                  'mt-3 flex w-full flex-col items-center justify-center rounded-t-2xl bg-gradient-to-b text-white',
                  style.bg,
                  style.h,
                )}
              >
                <span className="text-2xl font-extrabold">{formatNumber(student.totalPoints)}</span>
                <span className="text-[11px] font-semibold uppercase tracking-wide opacity-80">points</span>
              </div>
            </motion.div>
          )
        })}
      </div>

      <SectionCard title="Full ranking" subtitle={`${formatNumber(ranked.length)} students`} icon={TrendingUp} bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-xs font-bold uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
                <th className="px-5 py-3.5">#</th>
                <th className="px-5 py-3.5">Student</th>
                <th className="px-5 py-3.5">Class</th>
                <th className="px-5 py-3.5">Progress</th>
                <th className="px-5 py-3.5 text-right">Points</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((student, i) => (
                <tr key={student.id} className="border-b border-zinc-50 last:border-0 dark:border-zinc-800/60">
                  <td className="px-5 py-3.5 font-bold text-zinc-400">{i + 1}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={student.fullNameEn} size={32} />
                      <span className="font-semibold text-zinc-800 dark:text-zinc-100">{student.fullNameEn}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-500">{student.className || '—'}</td>
                  <td className="w-56 px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-rose-500"
                          style={{ width: `${Math.max(2, ((student.totalPoints || 0) / max) * 100)}%` }}
                        />
                      </div>
                      <Sparkline data={[0, student.totalPoints || 0]} width={40} height={20} color="#fb7185" />
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Badge tone="brand">{formatNumber(student.totalPoints)}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </>
  )
}
