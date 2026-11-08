import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Users,
  Gauge,
  Activity,
  PieChart,
  Trophy,
  ListChecks,
  RefreshCw,
} from 'lucide-react'
import { SectionCard, PageHeader, Button, Badge, LoadingState, EmptyState, Avatar } from '../components/ui'
import ExportMenu from '../components/ExportMenu'
import { HorizontalBars, Donut, Legend, AreaChart, Sparkline } from '../components/charts'
import DraggableGrid from '../components/DraggableGrid'
import { adminApi, rewardsApi } from '../lib/api'
import { exportFilename, exportReport } from '../lib/export'
import { buildDailySeries, cn, formatDateTime, formatNumber, formatSigned, relativeTime } from '../lib/format'
import { useAuth } from '../context/AuthContext'

const ACTIVITY_COLUMNS = [
  { key: 'student', header: 'Student' },
  { key: 'reason', header: 'Reason' },
  { key: 'by', header: 'By' },
  { key: 'date', header: 'Date' },
  { key: 'points', header: 'Points' },
]

function MetricCard({ icon: Icon, label, value, hint, tone = 'brand', spark, sparkColor }) {
  return (
    <div className="card-surface rounded-2xl p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              'grid h-9 w-9 place-items-center rounded-xl',
              tone === 'brand' && 'bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400',
              tone === 'success' && 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
              tone === 'danger' && 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400',
              tone === 'neutral' && 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
            )}
          >
            <Icon size={18} />
          </span>
          <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">{label}</span>
        </div>
      </div>
      <p className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">{value}</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-xs text-zinc-400">{hint}</span>
        {spark && <Sparkline data={spark} color={sparkColor} width={92} height={28} />}
      </div>
    </div>
  )
}

function reasonsFromLogs(logs, positive) {
  const map = new Map()
  for (const log of logs) {
    const points = Number(log.points) || 0
    if (positive ? points <= 0 : points >= 0) continue
    const key = log.rewardTitle || 'Uncategorised'
    map.set(key, (map.get(key) || 0) + Math.abs(points))
  }
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
}

export default function DashboardPage() {
  const { user, role } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState(null)
  const [addition, setAddition] = useState([])
  const [deduction, setDeduction] = useState([])
  const [logs, setLogs] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (role === 'Student') {
        const me = await rewardsApi.myPoints()
        const myLogs = me?.logs || []
        setStats({
          totalPoints: me?.totalPoints ?? 0,
          pointsAdded: me?.addedPoints ?? 0,
          pointsDeducted: me?.deductedPoints ?? 0,
          studentsCount: 0,
          topStudents: [],
          recentLogs: myLogs,
        })
        setLogs(myLogs)
        setAddition(reasonsFromLogs(myLogs, true))
        setDeduction(reasonsFromLogs(myLogs, false))
      } else {
        const [dash, add, ded, allLogs] = await Promise.all([
          adminApi.dashboard(),
          adminApi.additionReasons().catch(() => []),
          adminApi.deductionReasons().catch(() => []),
          rewardsApi.logs().catch(() => []),
        ])
        setStats(dash)
        setAddition(add || [])
        setDeduction(ded || [])
        setLogs(allLogs || [])
      }
    } catch (err) {
      setError(err?.message || 'Unable to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [role])

  useEffect(() => {
    load()
  }, [load])

  const daily = useMemo(() => buildDailySeries(logs, 14), [logs])
  const addedSeries = useMemo(() => daily.map((d) => d.added), [daily])
  const deductedSeries = useMemo(() => daily.map((d) => d.deducted), [daily])
  const netSeries = useMemo(() => daily.map((d) => d.net), [daily])

  const total = stats?.totalPoints ?? 0
  const added = stats?.pointsAdded ?? 0
  const deducted = stats?.pointsDeducted ?? 0
  const studentsCount = stats?.studentsCount ?? 0
  const average = studentsCount ? Math.round(total / studentsCount) : 0

  const additionBars = (addition.length ? addition : reasonsFromLogs(logs, true))
    .slice(0, 6)
    .map((r) => ({ label: r.reason || r.label, value: Math.abs(r.totalPoints ?? r.value ?? 0) }))
  const deductionBars = (deduction.length ? deduction : reasonsFromLogs(logs, false))
    .slice(0, 6)
    .map((r) => ({ label: r.reason || r.label, value: Math.abs(r.totalPoints ?? r.value ?? 0) }))

  const topStudents = (stats?.topStudents?.length
    ? stats.topStudents
    : [...logs]
        .reduce((acc, log) => {
          const id = log.assignedToAccId
          if (!id) return acc
          const found = acc.find((s) => s.id === id)
          if (found) found.totalPoints += Number(log.points) || 0
          else acc.push({ id, fullNameEn: log.assignedToName || `#${id}`, totalPoints: Number(log.points) || 0 })
          return acc
        }, [])
        .sort((a, b) => b.totalPoints - a.totalPoints))
    .slice(0, 7)
    .map((s) => ({ label: s.fullNameEn, value: s.totalPoints }))

  const recent = (stats?.recentLogs?.length ? stats.recentLogs : logs).slice(0, 8)

  const handleExport = (format) =>
    exportReport(format, {
      filename: exportFilename('rewards-report'),
      title: 'Rewards report',
      subtitle: `${logs.length} records`,
      columns: ACTIVITY_COLUMNS,
      rows: logs.map((log) => ({
        student: log.assignedToName || `#${log.assignedToAccId}`,
        reason: log.rewardTitle || log.notes || '',
        by: log.assignedByName || '',
        date: formatDateTime(log.logDate),
        points: log.points ?? 0,
      })),
      summary: [
        { label: 'Total', value: formatNumber(total) },
        { label: 'Added', value: `+${formatNumber(added)}` },
        { label: 'Deducted', value: `-${formatNumber(deducted)}` },
        { label: 'Students', value: formatNumber(studentsCount) },
        { label: 'Avg', value: formatNumber(average) },
      ],
    })

  if (loading) return <LoadingState label="Loading your dashboard…" />

  if (error) {
    return (
      <>
        <PageHeader title="Dashboard" subtitle="Reward analytics and activity" />
        <SectionCard>
          <EmptyState
            icon={Activity}
            title="Could not load dashboard"
            description={error}
            action={
              <Button variant="outline" onClick={load}>
                <RefreshCw size={15} /> Retry
              </Button>
            }
          />
        </SectionCard>
      </>
    )
  }

  const widgets = [
    {
      id: 'metrics',
      span: 'lg:col-span-12',
      node: (
        <div className="group relative grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard icon={Coins} label="Total Points" value={formatNumber(total)} hint="Current balance" tone="brand" spark={netSeries} sparkColor="#e11d2a" />
          <MetricCard icon={TrendingUp} label="Points Added" value={`+${formatNumber(added)}`} hint="All time" tone="success" spark={addedSeries} sparkColor="#10b981" />
          <MetricCard icon={TrendingDown} label="Points Deducted" value={`-${formatNumber(deducted)}`} hint="All time" tone="danger" spark={deductedSeries} sparkColor="#e11d2a" />
          <MetricCard icon={Users} label="Students" value={formatNumber(studentsCount)} hint={role === 'Student' ? 'School wide' : 'Registered'} tone="neutral" />
          <MetricCard icon={Gauge} label="Avg / Student" value={formatNumber(average)} hint="Mean points" tone="brand" />
        </div>
      ),
    },
    {
      id: 'trend',
      span: 'lg:col-span-8',
      node: (
        <SectionCard title="Points activity" subtitle="Added vs deducted over the last 14 days" icon={Activity} className="h-full">
          <AreaChart
            data={daily}
            height={236}
            series={[
              { key: 'added', label: 'Added', color: '#10b981' },
              { key: 'deducted', label: 'Deducted', color: '#e11d2a' },
            ]}
          />
          <Legend className="mt-4" items={[{ label: 'Added', color: '#10b981' }, { label: 'Deducted', color: '#e11d2a' }]} />
        </SectionCard>
      ),
    },
    {
      id: 'mix',
      span: 'lg:col-span-4',
      node: (
        <SectionCard title="Point mix" subtitle="Distribution of points" icon={PieChart} className="h-full" bodyClassName="flex flex-col items-center justify-center gap-4">
          <Donut
            segments={[
              { label: 'Added', value: added, color: '#10b981' },
              { label: 'Deducted', value: deducted, color: '#e11d2a' },
            ]}
            centerValue={formatNumber(total)}
            centerLabel="Net points"
          />
          <Legend items={[{ label: `Added · ${formatNumber(added)}`, color: '#10b981' }, { label: `Deducted · ${formatNumber(deducted)}`, color: '#e11d2a' }]} />
        </SectionCard>
      ),
    },
    {
      id: 'addition-reasons',
      span: 'lg:col-span-6',
      node: (
        <SectionCard title="Why points are added" subtitle="Top reasons for awarded points" icon={TrendingUp} className="h-full">
          <HorizontalBars data={additionBars} emptyText="No awarded points yet" />
        </SectionCard>
      ),
    },
    {
      id: 'deduction-reasons',
      span: 'lg:col-span-6',
      node: (
        <SectionCard title="Why points are deducted" subtitle="Top reasons for deducted points" icon={TrendingDown} className="h-full">
          <HorizontalBars data={deductionBars} emptyText="No deducted points yet" />
        </SectionCard>
      ),
    },
    {
      id: 'top-students',
      span: 'lg:col-span-6',
      node: (
        <SectionCard title="Top students" subtitle="Highest point earners" icon={Trophy} className="h-full">
          <HorizontalBars data={topStudents} emptyText="No student data yet" />
        </SectionCard>
      ),
    },
    {
      id: 'recent',
      span: 'lg:col-span-6',
      node: (
        <SectionCard title="Recent activity" subtitle="Latest point movements" icon={ListChecks} className="h-full" bodyClassName="p-3">
          <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
            {recent.map((log) => (
              <div key={log.id} className="flex items-center gap-3 px-2 py-2.5">
                <Avatar name={log.assignedToName || log.rewardTitle} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                    {log.assignedToName || `#${log.assignedToAccId}`}
                  </p>
                  <p className="truncate text-xs text-zinc-400">{log.rewardTitle || log.notes || 'Points'} · {relativeTime(log.logDate)}</p>
                </div>
                <Badge tone={(log.points ?? 0) >= 0 ? 'success' : 'danger'}>
                  {formatSigned(log.points)}
                </Badge>
              </div>
            ))}
            {recent.length === 0 && <EmptyState icon={Activity} title="No activity yet" description="Point movements will appear here." />}
          </div>
        </SectionCard>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title={`Hi, ${user?.fullNameEn?.split(' ')[0] || user?.email || 'there'}`}
        subtitle="Everything happening with rewards, at a glance."
        action={
          <div className="flex items-center gap-2">
            <ExportMenu onExport={handleExport} disabled={logs.length === 0} />
            <Button variant="outline" onClick={load}>
              <RefreshCw size={15} /> Refresh
            </Button>
          </div>
        }
      />
      <DraggableGrid items={widgets} storageKey={`rh-dash-${role}`} renderItem={(item) => item.node} />
    </>
  )
}
