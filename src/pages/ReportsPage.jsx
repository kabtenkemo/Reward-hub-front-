import { useCallback, useEffect, useState } from 'react'
import { FileText, Megaphone, CheckCircle2, XCircle } from 'lucide-react'
import { SectionCard, PageHeader, Select, Field, Input, Button, Badge, LoadingState, EmptyState, Avatar } from '../components/ui'
import ExportMenu from '../components/ExportMenu'
import { appealsApi } from '../lib/api'
import { exportFilename, exportReport } from '../lib/export'
import { formatDateTime, relativeTime } from '../lib/format'
import { useAuth } from '../context/AuthContext'

const STAFF_ROLES = ['Teacher', 'Admin', 'Management']

const APPEAL_TYPES = [
  'Points deduction',
  'Points adjustment',
  'Teacher behaviour',
  'Other',
]

const APPEAL_COLUMNS = [
  { key: 'student', header: 'Student' },
  { key: 'type', header: 'Type' },
  { key: 'subject', header: 'Subject' },
  { key: 'details', header: 'Details' },
  { key: 'status', header: 'Status' },
  { key: 'resolution', header: 'Resolution' },
  { key: 'created', header: 'Created' },
]

function appealRows(appeals) {
  return appeals.map((a) => ({
    student: a.appellantName || (a.appellantAccId ? `#${a.appellantAccId}` : ''),
    type: a.appealType || '',
    subject: a.subject || '',
    details: a.details || '',
    status: a.status || '',
    resolution: a.resolution || '',
    created: formatDateTime(a.createdAt),
  }))
}

const STATUS_TONE = {
  Pending: 'warning',
  Approved: 'success',
  Rejected: 'danger',
  Resolved: 'neutral',
}

function StatusBadge({ status }) {
  return <Badge tone={STATUS_TONE[status] || 'neutral'}>{status}</Badge>
}

function StudentAppeals() {
  const [appeals, setAppeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ appealType: APPEAL_TYPES[0], subject: '', details: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setAppeals(await appealsApi.mine())
    } catch {
      setAppeals([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.details.trim()) {
      setError('Please describe your appeal before submitting.')
      return
    }
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      await appealsApi.create({
        appealType: form.appealType,
        subject: form.subject || null,
        details: form.details,
      })
      setSuccess('Your appeal has been submitted successfully.')
      setForm({ appealType: APPEAL_TYPES[0], subject: '', details: '' })
      load()
    } catch (err) {
      setError(err?.message || 'Could not submit your appeal. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleExport = (format) =>
    exportReport(format, {
      filename: exportFilename('my-appeals'),
      title: 'My appeals',
      subtitle: `${appeals.length} records`,
      columns: APPEAL_COLUMNS,
      rows: appealRows(appeals),
      summary: [{ label: 'Appeals', value: appeals.length }],
    })

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <SectionCard
        title="Submit an appeal"
        subtitle="File an appeal against a point deduction or anything related to points or a teacher."
        icon={Megaphone}
        className="lg:col-span-1"
      >
        <form onSubmit={submit} className="space-y-4">
          <Field label="Appeal type">
            <Select value={form.appealType} onChange={(e) => setForm({ ...form, appealType: e.target.value })}>
              {APPEAL_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </Field>

          <Field label="Subject" hint="Optional, short title for your appeal">
            <Input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="e.g. Unfair deduction of 5 points"
              maxLength={255}
            />
          </Field>

          <Field label="Details" hint="Describe what happened">
            <textarea
              value={form.details}
              onChange={(e) => setForm({ ...form, details: e.target.value })}
              placeholder="Explain the deduction or the issue with your points or teacher…"
              rows={5}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </Field>

          {error && <p className="text-sm font-semibold text-brand-600">{error}</p>}
          {success && <p className="text-sm font-semibold text-emerald-600">{success}</p>}

          <Button type="submit" loading={submitting} className="w-full">
            Submit appeal
          </Button>
        </form>
      </SectionCard>

      <SectionCard
        title="My appeals"
        subtitle="Track the status and resolution of your appeals."
        icon={FileText}
        className="lg:col-span-2"
        bodyClassName="p-0"
        action={<ExportMenu onExport={handleExport} size="sm" disabled={appeals.length === 0} />}
      >
        {loading ? (
          <div className="p-5">
            <LoadingState />
          </div>
        ) : appeals.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={FileText} title="No appeals yet" description="Submitted appeals and their status will appear here." />
          </div>
        ) : (
          <ul className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
            {appeals.map((a) => (
              <li key={a.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-zinc-800 dark:text-zinc-100">{a.subject || a.appealType || 'Appeal'}</span>
                  <StatusBadge status={a.status} />
                  <span className="ml-auto text-xs text-zinc-400">{relativeTime(a.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{a.details}</p>
                {a.resolution && (
                  <p className="mt-2 rounded-xl bg-zinc-50 px-3 py-2 text-xs text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
                    <span className="font-semibold text-zinc-600 dark:text-zinc-300">Resolution: </span>
                    {a.resolution}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  )
}

function StaffAppeals() {
  const [appeals, setAppeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [resolutions, setResolutions] = useState({})
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setAppeals(await appealsApi.list())
    } catch {
      setAppeals([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const resolve = async (a, status) => {
    setBusyId(a.id)
    try {
      const updated = await appealsApi.resolve(a.id, {
        status,
        resolution: resolutions[a.id] || null,
      })
      setAppeals((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
      setResolutions((prev) => ({ ...prev, [a.id]: '' }))
    } catch {
      // leave as-is on failure
    } finally {
      setBusyId(null)
    }
  }

  const handleExport = (format) =>
    exportReport(format, {
      filename: exportFilename('appeals'),
      title: 'Appeals inbox',
      subtitle: `${appeals.length} records`,
      columns: APPEAL_COLUMNS,
      rows: appealRows(appeals),
      summary: [
        { label: 'Total', value: appeals.length },
        { label: 'Pending', value: appeals.filter((a) => a.status === 'Pending').length },
      ],
    })

  return (
    <SectionCard
      title="Appeals inbox"
      subtitle="Appeals filed by students against point adjustments or teachers."
      icon={Megaphone}
      bodyClassName="p-0"
      action={<ExportMenu onExport={handleExport} size="sm" disabled={appeals.length === 0} />}
    >
      {loading ? (
        <div className="p-5">
          <LoadingState />
        </div>
      ) : appeals.length === 0 ? (
        <div className="p-5">
          <EmptyState icon={Megaphone} title="No appeals" description="Student appeals will appear here for review." />
        </div>
      ) : (
        <ul className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
          {[...appeals]
            .sort((a, b) => (a.status === 'Pending' ? -1 : 1) - (b.status === 'Pending' ? -1 : 1))
            .map((a) => (
              <li key={a.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[1fr_auto_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Avatar name={a.appellantName} size={28} />
                    <span className="font-bold text-zinc-800 dark:text-zinc-100">{a.appellantName || a.appellantAccId}</span>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="mt-1 text-sm font-semibold text-zinc-600 dark:text-zinc-300">{a.subject || a.appealType || 'Appeal'}</p>
                  <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{a.details}</p>
                  {a.resolution && <p className="mt-1 text-xs text-zinc-400">Resolution: {a.resolution}</p>}
                </div>
                <Input
                  value={resolutions[a.id] || ''}
                  onChange={(e) => setResolutions((prev) => ({ ...prev, [a.id]: e.target.value }))}
                  placeholder="Resolution note"
                  className="lg:w-64"
                  disabled={a.status !== 'Pending'}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="success"
                    disabled={busyId === a.id || a.status !== 'Pending'}
                    onClick={() => resolve(a, 'Approved')}
                  >
                    <CheckCircle2 size={15} /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={busyId === a.id || a.status !== 'Pending'}
                    onClick={() => resolve(a, 'Rejected')}
                  >
                    <XCircle size={15} /> Reject
                  </Button>
                </div>
              </li>
            ))}
        </ul>
      )}
    </SectionCard>
  )
}

export default function ReportsPage() {
  const { role } = useAuth()
  if (!STAFF_ROLES.includes(role)) {
    return (
      <>
        <PageHeader title="Appeals & Complaints" subtitle="Submit an appeal against a point deduction or anything related to points or a teacher, and track its status." />
        <StudentAppeals />
      </>
    )
  }
  return (
    <>
      <PageHeader title="Appeals" subtitle="Review and resolve appeals filed by students." />
      <StaffAppeals />
    </>
  )
}