import { useCallback, useEffect, useState } from 'react'
import { Award, Send, ListFilter, History, TrendingUp, TrendingDown, Coins } from 'lucide-react'
import { SectionCard, PageHeader, Button, Input, Select, Field, Badge, Avatar, EmptyState, LoadingState, StatTile } from '../components/ui'
import ExportMenu from '../components/ExportMenu'
import { rewardsApi, studentsApi, referenceApi } from '../lib/api'
import { exportFilename, exportReport } from '../lib/export'
import { cn, formatNumber, formatSigned, formatDateTime } from '../lib/format'

const EXPORT_COLUMNS = [
  { key: 'student', header: 'Student' },
  { key: 'reason', header: 'Reason' },
  { key: 'by', header: 'By' },
  { key: 'date', header: 'Date' },
  { key: 'points', header: 'Points' },
]

export default function PointsPage() {
  const [grades, setGrades] = useState([])
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [settings, setSettings] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [rosterLoading, setRosterLoading] = useState(false)

  const [gradeId, setGradeId] = useState('')
  const [classId, setClassId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [direction, setDirection] = useState('add')
  const [value, setValue] = useState(5)
  const [rewardSettingId, setRewardSettingId] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [filter, setFilter] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [classList, rules, history] = await Promise.all([
        referenceApi.classes().catch(() => []),
        rewardsApi.settings().catch(() => []),
        rewardsApi.logs().catch(() => []),
      ])
      const allClasses = classList || []
      setClasses(allClasses)
      const gradeMap = new Map()
      allClasses.forEach((c) => {
        if (c.gradeId && c.gradeName) gradeMap.set(String(c.gradeId), { id: c.gradeId, name: c.gradeName })
      })
      setGrades([...gradeMap.values()].sort((a, b) => Number(a.id) - Number(b.id)))
      setSettings(rules || [])
      setLogs(history || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const loadRoster = useCallback(async (cid) => {
    setRosterLoading(true)
    try {
      const roster = await studentsApi
        .list({ classId: cid, pageSize: 1000 })
        .catch(() => ({ items: [] }))
      setStudents(roster?.items || [])
    } finally {
      setRosterLoading(false)
    }
  }, [])

  useEffect(() => {
    if (classId) {
      loadRoster(classId)
    } else {
      setStudents([])
    }
  }, [classId, loadRoster])

  const changeGrade = (e) => {
    setGradeId(e.target.value)
    setClassId('')
    setStudentId('')
  }

  const changeClass = (e) => {
    setClassId(e.target.value)
    setStudentId('')
  }

  const changeReason = (e) => {
    const id = e.target.value
    setRewardSettingId(id)
    const reason = settings.find((s) => String(s.id) === id)
    if (reason) setValue(Math.abs(Number(reason.points) || 0))
  }

  const changeDirection = (dir) => {
    setDirection(dir)
    const reason = settings.find((s) => String(s.id) === rewardSettingId)
    if (reason) {
      const matches = dir === 'add' ? Number(reason.points) > 0 : Number(reason.points) < 0
      if (!matches) setRewardSettingId('')
    }
  }

  const classOptions = gradeId ? classes.filter((c) => String(c.gradeId) === gradeId) : []

  const reasonOptions = settings.filter((s) =>
    direction === 'add' ? Number(s.points) > 0 : Number(s.points) < 0,
  )

  const selectedReason = settings.find((s) => String(s.id) === rewardSettingId)

  const submit = async (e) => {
    e.preventDefault()
    setFeedback(null)
    const target = Number(studentId)
    const points = Number(value) || 0
    if (!target) return setFeedback({ type: 'error', text: 'Please choose a student.' })
    if (points <= 0) return setFeedback({ type: 'error', text: 'Points must be greater than zero.' })

    setSaving(true)
    try {
      await rewardsApi.assignPoints({
        assignedToAccId: target,
        points: direction === 'add' ? points : -points,
        notes: notes || undefined,
        rewardSettingId: rewardSettingId ? Number(rewardSettingId) : null,
      })
      setFeedback({ type: 'success', text: 'Points saved successfully.' })
      setNotes('')
      load()
    } catch (err) {
      setFeedback({ type: 'error', text: err?.message || 'Failed to save points.' })
    } finally {
      setSaving(false)
    }
  }

  const triggerAutoDeduction = async () => {
    setAutoSaving(true)
    setFeedback(null)
    try {
      const result = await rewardsApi.deductAbsencesAndLateSubmissions()
      const created = result?.logsCreated ?? result?.LogsCreated ?? 0
      const deducted = result?.totalDeductedPoints ?? result?.TotalDeductedPoints ?? 0
      const message = result?.message ?? result?.Message
      setFeedback({
        type: 'success',
        text:
          created > 0
            ? `Deducted ${formatNumber(deducted)} points across ${formatNumber(created)} record(s).`
            : message || 'No new absences or late submissions to deduct.',
      })
      load()
    } catch (err) {
      setFeedback({ type: 'error', text: err?.message || 'Failed to trigger auto-deduction.' })
    } finally {
      setAutoSaving(false)
    }
  }

  const filtered = logs.filter((log) => {
    if (filter === 'added') return (log.points ?? 0) >= 0
    if (filter === 'deducted') return (log.points ?? 0) < 0
    return true
  })

  const added = logs.filter((l) => (l.points ?? 0) >= 0).reduce((s, l) => s + (l.points || 0), 0)
  const deducted = logs.filter((l) => (l.points ?? 0) < 0).reduce((s, l) => s + Math.abs(l.points || 0), 0)

  const exportRows = filtered.map((log) => ({
    student: log.assignedToName || `#${log.assignedToAccId}`,
    reason: log.rewardTitle || log.notes || '',
    by: log.assignedByName || '',
    date: formatDateTime(log.logDate),
    points: log.points ?? 0,
  }))

  const handleExport = (format) =>
    exportReport(format, {
      filename: exportFilename('transactions'),
      title: 'Point transactions',
      subtitle: `${filtered.length} records · ${filter} filter`,
      columns: EXPORT_COLUMNS,
      rows: exportRows,
      summary: [
        { label: 'Added', value: `+${formatNumber(added)}` },
        { label: 'Deducted', value: `-${formatNumber(deducted)}` },
        { label: 'Net', value: formatSigned(added - deducted) },
      ],
    })

  return (
    <>
      <PageHeader
        title="Assign Points"
        subtitle="Reward or deduct points and review the transaction ledger."
        action={<ExportMenu onExport={handleExport} disabled={filtered.length === 0} />}
      />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Points added" value={`+${formatNumber(added)}`} tone="success" />
        <StatTile label="Points deducted" value={`-${formatNumber(deducted)}`} tone="danger" />
        <StatTile label="Net" value={formatSigned(added - deducted)} tone="brand" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <SectionCard title="New adjustment" icon={Award} className="lg:col-span-1">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <Field label="Grade">
                <Select value={gradeId} onChange={changeGrade}>
                  <option value="">Select a grade…</option>
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </Select>
              </Field>

              <Field label="Class">
                <Select value={classId} onChange={changeClass} disabled={!gradeId}>
                  <option value="">{gradeId ? 'Select a class…' : 'Choose a grade first'}</option>
                  {classOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </Field>

              <Field label="Student">
                <Select value={studentId} onChange={(e) => setStudentId(e.target.value)} disabled={!classId}>
                  <option value="">
                    {!classId
                      ? 'Choose a class first'
                      : rosterLoading
                        ? 'Loading…'
                        : students.length === 0
                          ? 'No students in this class'
                          : 'Select a student…'}
                  </option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.fullNameEn}{s.className ? ` — ${s.className}` : ''}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => changeDirection('add')}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-bold transition',
                  direction === 'add'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'border-zinc-200 text-zinc-500 dark:border-zinc-700',
                )}
              >
                <TrendingUp size={15} /> Add
              </button>
              <button
                type="button"
                onClick={() => changeDirection('deduct')}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-bold transition',
                  direction === 'deduct'
                    ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400'
                    : 'border-zinc-200 text-zinc-500 dark:border-zinc-700',
                )}
              >
                <TrendingDown size={15} /> Deduct
              </button>
            </div>

            <Field label={`Reason rule (${direction === 'add' ? 'addition' : 'deduction'})`}>
              <Select value={rewardSettingId} onChange={changeReason}>
                <option value="">
                  {reasonOptions.length === 0
                    ? `No ${direction === 'add' ? 'addition' : 'deduction'} reasons yet`
                    : 'Custom'}
                </option>
                {reasonOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.rewardTitle}{s.points != null ? ` · ${Math.abs(s.points)} pts` : ''}
                  </option>
                ))}
              </Select>
            </Field>

            {selectedReason ? (
              <div className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-2.5 dark:bg-zinc-800/50">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Points from reason</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-100">{formatNumber(value)}</span>
              </div>
            ) : (
              <Field label="Points">
                <Input type="number" min="1" value={value} onChange={(e) => setValue(e.target.value)} />
              </Field>
            )}

            <Field label="Notes (optional)">
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Great teamwork in science" />
            </Field>

            {feedback && (
              <p className={cn('text-sm font-semibold', feedback.type === 'success' ? 'text-emerald-600' : 'text-brand-600')}>
                {feedback.text}
              </p>
            )}

            <Button type="submit" loading={saving} className="w-full">
              <Send size={15} /> {saving ? 'Saving…' : 'Save adjustment'}
            </Button>

            <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
              <p className="mb-2 text-xs text-zinc-400">
                Uses the absence/late rules from Settings. Each absence or late task is deducted once.
              </p>
              <Button
                type="button"
                variant="outline"
                loading={autoSaving}
                onClick={triggerAutoDeduction}
                className="w-full"
              >
                <TrendingDown size={15} /> {autoSaving ? 'Applying…' : 'Apply absence & late deductions'}
              </Button>
            </div>
          </form>
        </SectionCard>

        <SectionCard
          title="Transactions"
          subtitle={`${formatNumber(filtered.length)} records`}
          icon={History}
          className="lg:col-span-2"
          bodyClassName="p-0"
          action={
            <div className="flex items-center gap-2">
              <ListFilter size={15} className="text-zinc-400" />
              <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="h-9 w-32 text-xs">
                <option value="all">All</option>
                <option value="added">Added</option>
                <option value="deducted">Deducted</option>
              </Select>
            </div>
          }
        >
          {loading ? (
            <LoadingState />
          ) : filtered.length === 0 ? (
            <EmptyState icon={Coins} title="No transactions" description="Adjustments you make will show up here." />
          ) : (
            <div className="max-h-[560px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white dark:bg-zinc-900">
                  <tr className="border-b border-zinc-100 text-left text-xs font-bold uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
                    <th className="px-5 py-3">Student</th>
                    <th className="px-5 py-3">Reason</th>
                    <th className="px-5 py-3">By</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3 text-right">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log) => (
                    <tr key={log.id} className="border-b border-zinc-50 last:border-0 dark:border-zinc-800/60">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={log.assignedToName} size={30} />
                          <span className="font-semibold text-zinc-700 dark:text-zinc-200">{log.assignedToName || `#${log.assignedToAccId}`}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-zinc-500">{log.rewardTitle || log.notes || '—'}</td>
                      <td className="px-5 py-3 text-zinc-500">{log.assignedByName || '—'}</td>
                      <td className="px-5 py-3 text-zinc-400">{formatDateTime(log.logDate)}</td>
                      <td className="px-5 py-3 text-right">
                        <Badge tone={(log.points ?? 0) >= 0 ? 'success' : 'danger'}>{formatSigned(log.points)}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </>
  )
}
