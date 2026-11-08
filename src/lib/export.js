const APP_NAME = 'Reward Hub'
const BRAND_RGB = [225, 29, 42]

function normalizeColumns(columns) {
  return (columns || []).map((col) => (typeof col === 'string' ? { key: col, header: col } : col))
}

function cellText(value) {
  if (value === null || value === undefined) return ''
  return String(value)
}

function ensureExtension(filename, ext) {
  const base = (filename || 'export').replace(/\.[^./\\]+$/, '')
  return `${base}.${ext}`
}

function pad(value) {
  return String(value).padStart(2, '0')
}

export function exportFilename(prefix, date = new Date()) {
  const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`
  return `${prefix || 'export'}-${stamp}`
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function toCsv(columns, rows, { delimiter = ',' } = {}) {
  const cols = normalizeColumns(columns)
  const escape = (value) => {
    const text = cellText(value)
    if (text.includes(delimiter) || /["\r\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`
    }
    return text
  }

  const lines = [cols.map((c) => escape(c.header)).join(delimiter)]
  for (const row of rows || []) {
    lines.push(cols.map((c) => escape(row?.[c.key])).join(delimiter))
  }
  return lines.join('\r\n')
}

export function downloadCsv(filename, columns, rows) {
  const csv = `\uFEFF${toCsv(columns, rows)}`
  triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), ensureExtension(filename, 'csv'))
}

export async function downloadPdf({ filename, title, subtitle, columns, rows, summary = [] }) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])

  const cols = normalizeColumns(columns)
  const landscape = cols.length > 5
  const doc = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 36

  doc.setFillColor(...BRAND_RGB)
  doc.rect(0, 0, pageWidth, 64, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(APP_NAME, margin, 28)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(title || 'Report', margin, 46)

  doc.setFontSize(8)
  doc.text(`Generated ${new Date().toLocaleString('en-GB')}`, pageWidth - margin, 28, { align: 'right' })
  if (subtitle) doc.text(subtitle, pageWidth - margin, 46, { align: 'right' })

  let startY = 84

  if (summary.length) {
    doc.setTextColor(70, 70, 70)
    doc.setFontSize(9)
    doc.text(summary.map((s) => `${s.label}: ${s.value}`).join('     |     '), margin, startY)
    startY += 16
  }

  const body = (rows || []).map((row) => cols.map((c) => cellText(row?.[c.key])))
  if (body.length === 0) {
    body.push([{ content: 'No records', colSpan: cols.length, styles: { halign: 'center', textColor: [150, 150, 150] } }])
  }

  autoTable(doc, {
    head: [cols.map((c) => c.header)],
    body,
    startY,
    margin: { left: margin, right: margin, bottom: 40 },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak', textColor: [39, 39, 42] },
    headStyles: { fillColor: BRAND_RGB, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 248, 247] },
    didDrawPage: (data) => {
      doc.setFontSize(8)
      doc.setTextColor(160, 160, 160)
      doc.text(`Page ${data.pageNumber}`, pageWidth - margin, pageHeight - 18, { align: 'right' })
      doc.text(APP_NAME, margin, pageHeight - 18)
    },
  })

  doc.save(ensureExtension(filename, 'pdf'))
}

export function exportReport(format, { filename, title, subtitle, columns, rows, summary }) {
  if (format === 'csv') {
    downloadCsv(filename, columns, rows)
    return Promise.resolve()
  }
  return downloadPdf({ filename, title, subtitle, columns, rows, summary })
}
