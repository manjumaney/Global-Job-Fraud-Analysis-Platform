import { ChangeEvent, FormEvent, useMemo, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts'
import MetricCard from '../components/MetricCard'
import { api } from '../lib/api'

interface Summary {
  total: number
  flagged: number
  fraudRate: number
  highRisk: number
  mediumRisk: number
  lowRisk: number
  storedRows?: number
  avgScore?: number
}

interface Signal {
  signal: string
  count: number
}

interface DataRow {
  title?: string
  country?: string
  fraud_score: number
  risk_level: string
  prediction_label?: string
  explanations?: string[]
  description?: string
}

const PIE_COLORS = ['#8fbbe8', '#e8f1fb']
const BAR_COLORS: Record<string, string> = {
  Low: '#e8f1fb',
  Medium: '#b7d1ee',
  High: '#7faedc'
}

type FilterMode = 'flagged' | 'all' | 'high' | 'medium' | 'low'
type SortMode = 'score_desc' | 'score_asc' | 'title_asc' | 'title_desc'

export default function CsvAnalysisPage() {
  const [file, setFile] = useState<File | null>(null)
  const [country, setCountry] = useState('')
  const [consent, setConsent] = useState(false)

  const [summary, setSummary] = useState<Summary | null>(null)
  const [topSignals, setTopSignals] = useState<Signal[]>([])
  const [flaggedRows, setFlaggedRows] = useState<DataRow[]>([])
  const [allRows, setAllRows] = useState<DataRow[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [filterMode, setFilterMode] = useState<FilterMode>('flagged')
  const [sortMode, setSortMode] = useState<SortMode>('score_desc')

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] || null
    setFile(selected)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!file) {
      setError('Please choose a CSV file first.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('country', country)
      formData.append('consent', String(consent))

      const response = await api.post('/api/analyze', formData)

      setSummary(response.data.summary)
      setTopSignals(response.data.topSignals || [])
      setFlaggedRows(response.data.flaggedRows || [])
      setAllRows(response.data.allRows || [])
      setFilterMode('flagged')
      setSearch('')
      setSortMode('score_desc')
    } catch (err: any) {
      const message = err?.response?.data?.error || 'CSV analysis could not be completed.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const pieData = useMemo(() => {
    if (!summary) return []
    return [
      { name: 'Flagged', value: summary.flagged },
      { name: 'Remaining', value: Math.max(summary.total - summary.flagged, 0) }
    ]
  }, [summary])

  const riskBars = useMemo(() => {
    if (!summary) return []
    return [
      { name: 'Low', value: summary.lowRisk },
      { name: 'Medium', value: summary.mediumRisk },
      { name: 'High', value: summary.highRisk }
    ]
  }, [summary])

  const baseRows = useMemo(() => {
    switch (filterMode) {
      case 'all':
        return allRows
      case 'high':
        return allRows.filter((row) => row.risk_level === 'High')
      case 'medium':
        return allRows.filter((row) => row.risk_level === 'Medium')
      case 'low':
        return allRows.filter((row) => row.risk_level === 'Low')
      case 'flagged':
      default:
        return flaggedRows
    }
  }, [filterMode, allRows, flaggedRows])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()

    let rows = [...baseRows]

    if (q) {
      rows = rows.filter((row) => {
        const title = String(row.title || '').toLowerCase()
        const countryText = String(row.country || '').toLowerCase()
        const risk = String(row.risk_level || '').toLowerCase()
        const prediction = String(row.prediction_label || '').toLowerCase()
        const explanations = (row.explanations || []).join(' ').toLowerCase()

        return (
          title.includes(q) ||
          countryText.includes(q) ||
          risk.includes(q) ||
          prediction.includes(q) ||
          explanations.includes(q)
        )
      })
    }

    rows.sort((a, b) => {
      if (sortMode === 'score_desc') return (b.fraud_score ?? 0) - (a.fraud_score ?? 0)
      if (sortMode === 'score_asc') return (a.fraud_score ?? 0) - (b.fraud_score ?? 0)
      if (sortMode === 'title_asc') return String(a.title || '').localeCompare(String(b.title || ''))
      return String(b.title || '').localeCompare(String(a.title || ''))
    })

    return rows
  }, [baseRows, search, sortMode])

  const visibleRows = useMemo(() => filteredRows.slice(0, 12), [filteredRows])

  const downloadCsv = (rows: any[], filename: string) => {
    if (!rows.length) return

    const headers = Object.keys(rows[0])
    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            const safe = Array.isArray(value) ? value.join(' | ') : String(value ?? '')
            return `"${safe.replace(/"/g, '""')}"`
          })
          .join(',')
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const currentExportName = useMemo(() => {
    if (filterMode === 'all') return 'all_filtered_rows.csv'
    if (filterMode === 'high') return 'high_risk_rows.csv'
    if (filterMode === 'medium') return 'medium_risk_rows.csv'
    if (filterMode === 'low') return 'low_risk_rows.csv'
    return 'flagged_filtered_rows.csv'
  }, [filterMode])

  const riskBadgeClass = (risk: string) => {
    if (risk === 'High') return 'bg-blue-100 text-blue-800'
    if (risk === 'Medium') return 'bg-slate-200 text-slate-800'
    return 'bg-gray-100 text-gray-600'
  }

  return (
    <section className="section-shell py-12 sm:py-16">
      <div className="mb-8 max-w-4xl">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          CSV dataset analysis
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Upload a CSV file to review fraud rate, risk distribution, warning signals, and flagged postings.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-soft">
        <div className="grid gap-5 md:grid-cols-[1fr_240px_auto] md:items-end">
          <label>
            <span className="mb-2 block text-sm font-medium text-slate-700">CSV file</span>
            <input type="file" accept=".csv" onChange={handleFileChange} className="block w-full text-sm" />
          </label>

          <label>
            <span className="mb-2 block text-sm font-medium text-slate-700">Country (optional)</span>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              placeholder="Mixed / auto"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Analyzing...' : 'Analyze dataset'}
          </button>
        </div>

        <label className="mt-4 flex items-start gap-3 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <span>
            I agree that anonymized and processed rows from this dataset may be used for research and dataset improvement purposes.
          </span>
        </label>

        {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      </form>

      {summary ? (
        <div className="mt-8 space-y-8">
          <div className="flex flex-wrap gap-2 text-sm text-slate-600">
            <span className="rounded-full bg-slate-100 px-3 py-1">Rows analyzed: {summary.total}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1">Country: {country || 'Mixed / auto'}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1">
              Research consent: {consent ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Total" value={summary.total} />
            <MetricCard label="Flagged" value={summary.flagged} />
            <MetricCard label="Fraud %" value={`${summary.fraudRate}%`} />
            <MetricCard label="High Risk" value={summary.highRisk} />
            <MetricCard label="Avg Score" value={`${summary.avgScore ?? 0}%`} />
          </div>

          {summary.storedRows ? (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              {summary.storedRows} anonymized rows securely added to the research dataset.
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => downloadCsv(allRows, 'analyzed_dataset.csv')}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Download analyzed CSV
            </button>

            <button
              type="button"
              onClick={() => downloadCsv(filteredRows, currentExportName)}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Export filtered results
            </button>
          </div>

          <div className="grid gap-8 xl:grid-cols-[1fr_1fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft transition hover:shadow-md">
              <h2 className="text-lg font-semibold text-slate-900">Fraud distribution</h2>
              <div className="mt-6 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={2}
                      stroke="none"
                      isAnimationActive
                    >
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft transition hover:shadow-md">
              <h2 className="text-lg font-semibold text-slate-900">Risk breakdown</h2>
              <div className="mt-6 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskBars}>
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[14, 14, 0, 0]}>
                      {riskBars.map((entry, index) => (
                        <Cell key={index} fill={BAR_COLORS[entry.name]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft transition hover:shadow-md">
              <h2 className="text-lg font-semibold text-slate-900">Most common warning signals</h2>
              <div className="mt-5 space-y-3">
                {topSignals.map((item) => (
                  <div
                    key={item.signal}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                  >
                    <span className="text-sm text-slate-700">{item.signal}</span>
                    <span className="text-sm font-medium text-slate-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft transition hover:shadow-md">
              <h2 className="text-lg font-semibold text-slate-900">How to interpret this analysis</h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <p>
                  The fraud score estimates how closely postings match suspicious patterns seen in the model.
                </p>
                <p>
                  High-risk postings should be reviewed more carefully, especially when salary, employer details,
                  or description quality are limited.
                </p>
                <p>
                  These results are intended as a screening aid and should not be treated as a final decision.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Dataset results</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Search, sort, filter, and export the current view.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search title, country, risk, signals"
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-slate-900"
                />

                <select
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value as FilterMode)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-slate-900"
                >
                  <option value="flagged">Flagged only</option>
                  <option value="all">All rows</option>
                  <option value="high">High risk only</option>
                  <option value="medium">Medium risk only</option>
                  <option value="low">Low risk only</option>
                </select>

                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as SortMode)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-slate-900"
                >
                  <option value="score_desc">Sort: score high to low</option>
                  <option value="score_asc">Sort: score low to high</option>
                  <option value="title_asc">Sort: title A to Z</option>
                  <option value="title_desc">Sort: title Z to A</option>
                </select>
              </div>
            </div>

            <div className="mt-4 text-sm text-slate-500">
              Showing {visibleRows.length} of {filteredRows.length} matching rows.
            </div>

            <div className="mt-5 space-y-4">
              {visibleRows.length === 0 ? (
                <p className="text-sm text-slate-500">No rows match the current search and filter settings.</p>
              ) : (
                visibleRows.map((row, index) => (
                  <div
                    key={`${row.title}-${index}`}
                    className="rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{row.title || 'Untitled posting'}</p>
                        <div className="mt-1 text-xs leading-5 text-slate-500">
                          {(row.explanations || []).join(' • ')}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                          {Math.round((row.fraud_score || 0) * 100)}%
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-xs ${riskBadgeClass(row.risk_level)}`}>
                          {row.risk_level}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                          {row.country || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-sm text-slate-500">
            This platform is designed for portfolio, educational, and analytical use. Model outputs should be reviewed before making decisions.
          </div>
        </div>
      ) : null}
    </section>
  )
}