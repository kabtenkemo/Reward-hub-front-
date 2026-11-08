import { useCallback, useEffect, useState } from 'react'
import { Save, Tag, User, Palette, PlusCircle, Trash2 } from 'lucide-react'
import { SectionCard, PageHeader, Button, Input, Badge, Toggle, Avatar, EmptyState, LoadingState } from '../components/ui'
import ExportMenu from '../components/ExportMenu'
import { adminApi } from '../lib/api'
import { exportFilename, exportReport } from '../lib/export'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { formatNumber } from '../lib/format'

const RULE_COLUMNS = [
  { key: 'reason', header: 'Reason' },
  { key: 'points', header: 'Points' },
  { key: 'entity', header: 'Business entity' },
]

export default function SettingsPage() {
  const { user, role } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [newReason, setNewReason] = useState({ rewardTitle: '', points: 5 })
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminApi.rules()
      setRules(data || [])
    } catch {
      setRules([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const save = async (rule) => {
    setSavingId(rule.id)
    setFeedback('')
    try {
      const updated = await adminApi.updateRule(rule.id, {
        id: rule.id,
        rewardTitle: rule.rewardTitle,
        bussinessEntityId: rule.bussinessEntityId,
        points: Number(rule.points) || 0,
      })
      setRules((prev) => prev.map((r) => (r.id === rule.id ? updated || rule : r)))
      setFeedback('Reason saved successfully.')
    } catch (err) {
      setFeedback(err?.message || 'Failed to save the reason.')
    } finally {
      setSavingId(null)
    }
  }

  const remove = async (rule) => {
    if (!window.confirm(`Delete the reason "${rule.rewardTitle || 'Untitled reason'}"?`)) return
    setDeletingId(rule.id)
    setFeedback('')
    try {
      await adminApi.deleteRule(rule.id)
      setRules((prev) => prev.filter((r) => r.id !== rule.id))
      setFeedback('Reason deleted successfully.')
    } catch (err) {
      setFeedback(err?.message || 'Failed to delete the reason.')
    } finally {
      setDeletingId(null)
    }
  }

  const addReason = async (e) => {
    e.preventDefault()
    if (!newReason.rewardTitle.trim()) {
      setFeedback('Please enter a reason title.')
      return
    }
    setAdding(true)
    setFeedback('')
    try {
      const created = await adminApi.createRule({
        rewardTitle: newReason.rewardTitle.trim(),
        points: Number(newReason.points) || 0,
        bussinessEntityId: user?.businessEntityId ?? null,
      })
      if (created) setRules((prev) => [...prev, created])
      setNewReason({ rewardTitle: '', points: 5 })
      setFeedback('Reason added successfully.')
    } catch (err) {
      setFeedback(err?.message || 'Failed to add the reason.')
    } finally {
      setAdding(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Reason rules, your profile and appearance."
        action={
          <ExportMenu
            onExport={(format) =>
              exportReport(format, {
                filename: exportFilename('point-rules'),
                title: 'Point rules',
                subtitle: `${rules.length} rules`,
                columns: RULE_COLUMNS,
                rows: rules.map((rule) => ({
                  reason: rule.rewardTitle || 'Untitled reason',
                  points: rule.points ?? 0,
                  entity: rule.bussinessEntityId ?? '',
                })),
                summary: [{ label: 'Rules', value: rules.length }],
              })
            }
            disabled={rules.length === 0}
          />
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <SectionCard title="Reason rules" subtitle="Reasons staff pick when adding or deducting points" icon={Tag} className="lg:col-span-2">
          <form onSubmit={addReason} className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-dashed border-zinc-200 p-4 dark:border-zinc-700">
            <div className="min-w-[200px] flex-1">
              <span className="mb-1.5 block text-xs font-semibold text-zinc-600 dark:text-zinc-400">New reason</span>
              <Input
                value={newReason.rewardTitle}
                onChange={(e) => setNewReason({ ...newReason, rewardTitle: e.target.value })}
                placeholder="e.g. Excellent participation"
                maxLength={255}
              />
            </div>
            <div className="w-24">
              <span className="mb-1.5 block text-xs font-semibold text-zinc-600 dark:text-zinc-400">Points</span>
              <Input
                type="number"
                value={newReason.points}
                onChange={(e) => setNewReason({ ...newReason, points: e.target.value })}
              />
            </div>
            <Button type="submit" loading={adding}>
              <PlusCircle size={16} /> Add reason
            </Button>
          </form>

          {loading ? (
            <LoadingState />
          ) : rules.length === 0 ? (
            <EmptyState icon={PlusCircle} title="No reasons yet" description="Add your first reason using the form above." />
          ) : (
            <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
              {rules.map((rule) => (
                <div key={rule.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-zinc-800 dark:text-zinc-100">{rule.rewardTitle || 'Untitled reason'}</p>
                    <p className="text-xs text-zinc-400">Business entity #{rule.bussinessEntityId ?? '—'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-400">points</span>
                    <Input
                      type="number"
                      value={rule.points ?? 0}
                      onChange={(e) =>
                        setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, points: Number(e.target.value) } : r)))
                      }
                      className="h-9 w-24"
                    />
                    <Button size="sm" loading={savingId === rule.id} onClick={() => save(rule)}>
                      <Save size={14} /> Save
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      loading={deletingId === rule.id}
                      onClick={() => remove(rule)}
                      aria-label="Delete reason"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {feedback && <p className="mt-3 text-sm font-semibold text-brand-600">{feedback}</p>}

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-950/50">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Rules</p>
              <p className="mt-1 text-xl font-extrabold text-zinc-800 dark:text-zinc-100">{formatNumber(rules.length)}</p>
            </div>
            <div className="rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-950/50">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Total weight</p>
              <p className="mt-1 text-xl font-extrabold text-zinc-800 dark:text-zinc-100">
                {formatNumber(rules.reduce((s, r) => s + (Number(r.points) || 0), 0))}
              </p>
            </div>
            <div className="rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-950/50">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Avg weight</p>
              <p className="mt-1 text-xl font-extrabold text-zinc-800 dark:text-zinc-100">
                {formatNumber(rules.length ? Math.round(rules.reduce((s, r) => s + (Number(r.points) || 0), 0) / rules.length) : 0)}
              </p>
            </div>
          </div>
        </SectionCard>

        <div className="flex flex-col gap-5">
          <SectionCard title="Profile" icon={User}>
            <div className="flex items-center gap-4">
              <Avatar name={user?.fullNameEn || user?.email} size={56} />
              <div className="min-w-0">
                <p className="truncate font-extrabold text-zinc-900 dark:text-zinc-50">{user?.fullNameEn || '—'}</p>
                <p className="truncate text-sm text-zinc-400">{user?.email}</p>
                <div className="mt-1 flex gap-2">
                  <Badge tone="brand">{role}</Badge>
                  {user?.businessEntityName && <Badge>{user.businessEntityName}</Badge>}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Appearance" icon={Palette}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Dark mode</p>
                <p className="text-xs text-zinc-400">Switch between light and dark themes.</p>
              </div>
              <Toggle checked={isDark} onChange={toggleTheme} />
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  )
}
