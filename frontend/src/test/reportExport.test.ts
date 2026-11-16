import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  buildReportTables,
  createReportPdf,
  createReportWorkbook,
  downloadFile,
  reportFileName,
  tableTotal,
} from '@/pages/reports/reportExport'
import { createXlsx } from '@/utils/xlsx'
import { PdfDocument, toWinAnsi } from '@/utils/pdf'

const reports = {
  clients: {
    clientsByMonth: [{ month: '2026-08', count: 4 }, { month: '2026-09', count: 7 }],
    clientsByStatus: [{ status: 'active', count: 20 }, { status: 'inactive', count: 2 }],
  },
  memberships: {
    membershipsByStatus: [{ status: 'active', count: 12 }, { status: 'expired', count: 5 }],
    visitsByDay: [{ date: '2026-09-28', count: 8 }, { date: '2026-09-29', count: 11 }],
  },
  payments: [
    { month: '2026-08', currency: 'PEN', amount: 400.5 },
    { month: '2026-09', currency: 'PEN', amount: 500 },
    { month: '2026-09', currency: 'USD', amount: 50 },
  ],
  generatedAt: new Date(2026, 10, 13, 10, 30),
}

/** Lee las entradas de un ZIP sin compresión y comprueba su estructura. */
function readZip(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const decoder = new TextDecoder()
  const files: Record<string, string> = {}
  let offset = 0
  while (view.getUint32(offset, true) === 0x04034b50) {
    expect(view.getUint16(offset + 8, true)).toBe(0)
    const size = view.getUint32(offset + 18, true)
    const nameLength = view.getUint16(offset + 26, true)
    const name = decoder.decode(bytes.slice(offset + 30, offset + 30 + nameLength))
    files[name] = decoder.decode(bytes.slice(offset + 30 + nameLength, offset + 30 + nameLength + size))
    offset += 30 + nameLength + size
  }
  expect(view.getUint32(offset, true)).toBe(0x02014b50)
  const end = bytes.length - 22
  expect(view.getUint32(end, true)).toBe(0x06054b50)
  expect(view.getUint16(end + 10, true)).toBe(Object.keys(files).length)
  expect(view.getUint32(end + 16, true)).toBe(offset)
  return files
}

function latin1(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
}

describe('buildReportTables', () => {
  it('creates one table per chart, with readable labels and one income table per currency', () => {
    const data = buildReportTables(reports)
    expect(data.tables.map((table) => table.title)).toEqual([
      'Nuevos socios por mes',
      'Socios por estado',
      'Membresías por estado',
      'Check-ins por día',
      'Ingresos por mes (PEN)',
      'Ingresos por mes (USD)',
    ])
    expect(data.tables[0].rows[0]).toEqual({ label: 'Agosto de 2026', value: 4 })
    expect(data.tables[1].rows.map((row) => row.label)).toEqual(['Activos', 'Inactivos'])
    expect(data.tables[3].rows[0].label).toMatch(/28\/09\/2026/)
    expect(tableTotal(data.tables[4])).toBe(900.5)
    expect(data.missingSections).toEqual([])
  })

  it('lists sections that could not be loaded and explains when there are no payments', () => {
    const data = buildReportTables({ memberships: reports.memberships, payments: [] })
    expect(data.missingSections).toEqual(['Socios'])
    const income = data.tables.find((table) => table.section === 'Ingresos')
    expect(income?.rows).toEqual([])
    expect(income?.emptyText).toBe('No hay pagos completados para mostrar todavía.')
  })

  it('names the files with the local date', () => {
    expect(reportFileName(new Date(2026, 0, 5), 'xlsx')).toBe('informes-mundo-fitness-2026-01-05.xlsx')
    expect(reportFileName(new Date(2026, 10, 13), 'pdf')).toBe('informes-mundo-fitness-2026-11-13.pdf')
  })
})

describe('createReportWorkbook', () => {
  it('produces a valid xlsx package with a summary sheet and one sheet per report', () => {
    const files = readZip(createReportWorkbook(buildReportTables(reports)))
    expect(Object.keys(files)).toEqual(expect.arrayContaining([
      '[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml', 'xl/_rels/workbook.xml.rels', 'xl/styles.xml',
      'xl/worksheets/sheet1.xml', 'xl/worksheets/sheet7.xml',
    ]))
    const workbook = files['xl/workbook.xml']
    for (const name of ['Resumen', 'Nuevos socios', 'Socios por estado', 'Membresías por estado', 'Check-ins', 'Ingresos PEN', 'Ingresos USD']) {
      expect(workbook).toContain(`name="${name}"`)
    }
    expect(files['xl/worksheets/sheet1.xml']).toContain('Mundo Fitness — Informes')
    const newClients = files['xl/worksheets/sheet2.xml']
    expect(newClients).toContain('Agosto de 2026')
    expect(newClients).toContain('<v>4</v>')
    expect(newClients).toContain('<v>11</v>') // total 4 + 7
    expect(files['xl/worksheets/sheet6.xml']).toContain('<v>900.5</v>')
  })

  it('escapes XML characters and avoids duplicated or invalid sheet names', () => {
    const files = readZip(createXlsx([
      { name: 'Datos', rows: [['<a & "b">']] },
      { name: 'Datos', rows: [[1]] },
      { name: 'Ventas: 2026/11?', rows: [[2]] },
    ]))
    expect(files['xl/worksheets/sheet1.xml']).toContain('&lt;a &amp; &quot;b&quot;&gt;')
    expect(files['xl/workbook.xml']).toContain('name="Datos (2)"')
    expect(files['xl/workbook.xml']).toContain('name="Ventas  2026 11"')
  })
})

describe('createReportPdf', () => {
  it('produces a PDF whose cross-reference table points at every object', () => {
    const text = latin1(createReportPdf(buildReportTables(reports)))
    expect(text.startsWith('%PDF-1.4')).toBe(true)
    expect(text.trimEnd().endsWith('%%EOF')).toBe(true)
    const xrefStart = Number(text.match(/startxref\n(\d+)/)?.[1])
    expect(text.slice(xrefStart, xrefStart + 4)).toBe('xref')
    const offsets = [...text.slice(xrefStart).matchAll(/(\d{10}) 00000 n /g)].map((match) => Number(match[1]))
    expect(offsets.length).toBeGreaterThan(5)
    offsets.forEach((offset, index) => expect(text.slice(offset).startsWith(`${index + 1} 0 obj`)).toBe(true))
    for (const title of ['Mundo Fitness', 'Nuevos socios por mes', 'Check-ins por día', 'Ingresos por mes \\(USD\\)', 'Página 1 de 2', 'Página 2 de 2']) {
      expect(text).toContain(title)
    }
  })

  it('declares stream lengths that match their content', () => {
    const text = latin1(createReportPdf(buildReportTables(reports)))
    const streams = [...text.matchAll(/<< \/Length (\d+) >>\nstream\n/g)]
    expect(streams.length).toBeGreaterThan(0)
    for (const match of streams) {
      const start = (match.index ?? 0) + match[0].length
      const length = Number(match[1])
      expect(text.slice(start + length, start + length + 10)).toBe('\nendstream')
    }
  })

  it('adds pages when a table does not fit and mentions sections that could not load', () => {
    const visitsByDay = Array.from({ length: 60 }, (_, index) => ({
      date: `2026-09-${String((index % 28) + 1).padStart(2, '0')}`,
      count: index,
    }))
    const text = latin1(createReportPdf(buildReportTables({ memberships: { membershipsByStatus: [], visitsByDay } })))
    expect(text).toMatch(/\/Count [2-9]/)
    expect(text).toContain('(continuación\\)')
    expect(text).toContain('No se pudieron cargar: Socios, Ingresos.')
  })
})

describe('pdf helpers', () => {
  it('encodes Spanish characters and typographic symbols as WinAnsi', () => {
    expect(toWinAnsi('Año ñ ¿ü? — “x” €')).toBe('Año ñ ¿ü? \u0097 \u0093x\u0094 \u0080')
    expect(toWinAnsi('S/ 10 😀')).toBe('S/ 10 ?')
  })

  it('shortens text that is too wide', () => {
    const pdf = new PdfDocument()
    const fitted = pdf.fitText('Un texto muy largo que no entra en la columna', 80)
    expect(fitted.endsWith('…')).toBe(true)
    expect(pdf.textWidth(fitted)).toBeLessThanOrEqual(80)
  })
})

describe('downloadFile', () => {
  afterEach(() => vi.restoreAllMocks())

  it('downloads the bytes with the given name', () => {
    const createObjectURL = vi.fn(() => 'blob:informe')
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    downloadFile(new Uint8Array([1, 2, 3]), 'informe.pdf', 'application/pdf')
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    const link = click.mock.contexts[0] as HTMLAnchorElement
    expect(link.download).toBe('informe.pdf')
    expect(link.href).toBe('blob:informe')
    expect(document.querySelector('a[download]')).toBeNull()
  })
})
