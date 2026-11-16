import type { ClientReports, MembershipReports, PaymentReports } from '../../types/api';
import { createXlsx, type XlsxCell, type XlsxSheet } from '../../utils/xlsx';
import { PdfDocument } from '../../utils/pdf';
import { dayLongLabel, formatCurrency, monthLongLabel, statusLabel } from './reportFormat';

export const REPORT_PERIOD_NOTE =
  'Los gráficos muestran los últimos seis meses o los últimos siete días. Los ingresos se presentan por moneda.';

const BRAND_COLOR = '#c92332';
const EMPTY_TEXT = 'No hay datos para este periodo.';

export interface ReportExportInput {
  clients?: ClientReports;
  memberships?: MembershipReports;
  payments?: PaymentReports;
  generatedAt?: Date;
}

export interface ReportTable {
  section: string;
  title: string;
  sheetName: string;
  labelHeader: string;
  valueHeader: string;
  rows: Array<{ label: string; value: number }>;
  /** Moneda, solo en los informes de ingresos. */
  currency?: string;
  emptyText?: string;
}

export interface ReportExportData {
  generatedAt: Date;
  tables: ReportTable[];
  /** Secciones que no se pudieron cargar y no van en el archivo. */
  missingSections: string[];
}

export function buildReportTables(input: ReportExportInput): ReportExportData {
  const tables: ReportTable[] = [];
  const missingSections: string[] = [];

  if (input.clients) {
    tables.push({
      section: 'Socios',
      title: 'Nuevos socios por mes',
      sheetName: 'Nuevos socios',
      labelHeader: 'Mes',
      valueHeader: 'Nuevos socios',
      rows: input.clients.clientsByMonth.map((row) => ({ label: monthLongLabel(row.month), value: Number(row.count) })),
    });
    tables.push({
      section: 'Socios',
      title: 'Socios por estado',
      sheetName: 'Socios por estado',
      labelHeader: 'Estado',
      valueHeader: 'Socios',
      rows: input.clients.clientsByStatus.map((row) => ({ label: statusLabel(row.status), value: Number(row.count) })),
    });
  } else {
    missingSections.push('Socios');
  }

  if (input.memberships) {
    tables.push({
      section: 'Membresías y asistencia',
      title: 'Membresías por estado',
      sheetName: 'Membresías por estado',
      labelHeader: 'Estado',
      valueHeader: 'Membresías',
      rows: input.memberships.membershipsByStatus.map((row) => ({ label: statusLabel(row.status), value: Number(row.count) })),
    });
    tables.push({
      section: 'Membresías y asistencia',
      title: 'Check-ins por día',
      sheetName: 'Check-ins',
      labelHeader: 'Día',
      valueHeader: 'Check-ins',
      rows: input.memberships.visitsByDay.map((row) => ({ label: dayLongLabel(row.date), value: Number(row.count) })),
    });
  } else {
    missingSections.push('Membresías y asistencia');
  }

  if (input.payments) {
    const currencies = [...new Set(input.payments.map((row) => row.currency))];
    if (currencies.length === 0) {
      tables.push({
        section: 'Ingresos',
        title: 'Ingresos cobrados por mes',
        sheetName: 'Ingresos',
        labelHeader: 'Mes',
        valueHeader: 'Monto',
        rows: [],
        emptyText: 'No hay pagos completados para mostrar todavía.',
      });
    }
    for (const currency of currencies) {
      tables.push({
        section: 'Ingresos',
        title: `Ingresos por mes (${currency})`,
        sheetName: `Ingresos ${currency}`,
        labelHeader: 'Mes',
        valueHeader: `Monto (${currency})`,
        currency,
        rows: input.payments
          .filter((row) => row.currency === currency)
          .map((row) => ({ label: monthLongLabel(row.month), value: Number(row.amount) })),
      });
    }
  } else {
    missingSections.push('Ingresos');
  }

  return { generatedAt: input.generatedAt ?? new Date(), tables, missingSections };
}

export function tableTotal(table: ReportTable) {
  const total = table.rows.reduce((sum, row) => sum + (Number.isFinite(row.value) ? row.value : 0), 0);
  return table.currency ? Math.round(total * 100) / 100 : total;
}

function formatValue(table: ReportTable, value: number) {
  return table.currency ? formatCurrency(value, table.currency) : String(value);
}

export function generatedAtLabel(date: Date) {
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'long', timeStyle: 'short' }).format(date);
}

/** "informes-mundo-fitness-2026-11-13.xlsx" con la fecha local. */
export function reportFileName(date: Date, extension: 'xlsx' | 'pdf') {
  const pad = (value: number) => String(value).padStart(2, '0');
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `informes-mundo-fitness-${day}.${extension}`;
}

/* --------------------------------- Excel --------------------------------- */

export function createReportWorkbook(data: ReportExportData) {
  const summaryRows: XlsxCell[][] = [
    [{ value: 'Mundo Fitness — Informes', style: 'title' }],
    [{ value: `Generado el ${generatedAtLabel(data.generatedAt)}`, style: 'muted' }],
    [{ value: REPORT_PERIOD_NOTE, style: 'muted' }],
    [],
    [
      { value: 'Sección', style: 'header' },
      { value: 'Informe', style: 'header' },
      { value: 'Total', style: 'header' },
      { value: 'Hoja', style: 'header' },
    ],
    ...data.tables.map((table): XlsxCell[] => [
      table.section,
      table.title,
      { value: tableTotal(table), style: table.currency ? 'money' : undefined },
      table.sheetName,
    ]),
  ];
  if (data.missingSections.length > 0) {
    summaryRows.push([], [{ value: `No se pudieron cargar: ${data.missingSections.join(', ')}.`, style: 'muted' }]);
  }

  const sheets: XlsxSheet[] = [{ name: 'Resumen', columnWidths: [26, 32, 16, 24], rows: summaryRows }];

  for (const table of data.tables) {
    const valueStyle = table.currency ? 'money' : undefined;
    const rows: XlsxCell[][] = [
      [{ value: table.title, style: 'title' }],
      [{ value: table.section, style: 'muted' }],
      [],
      [
        { value: table.labelHeader, style: 'header' },
        { value: table.valueHeader, style: 'header' },
      ],
    ];
    if (table.rows.length === 0) {
      rows.push([{ value: table.emptyText ?? EMPTY_TEXT, style: 'muted' }]);
    } else {
      rows.push(...table.rows.map((row): XlsxCell[] => [row.label, { value: row.value, style: valueStyle }]));
      rows.push([
        { value: 'Total', style: 'bold' },
        { value: tableTotal(table), style: table.currency ? 'boldMoney' : 'bold' },
      ]);
    }
    sheets.push({ name: table.sheetName, columnWidths: [30, 18], rows });
  }

  return createXlsx(sheets, data.generatedAt);
}

/* ---------------------------------- PDF ---------------------------------- */

export function createReportPdf(data: ReportExportData) {
  const pdf = new PdfDocument('Informes Mundo Fitness');
  const margin = 50;
  const right = pdf.width - margin;
  const bottomLimit = 70;
  const rowHeight = 18;
  const valueX = 330;
  const barX = 345;
  const barMaxWidth = right - barX;
  let y = 0;

  const newPage = () => {
    pdf.addPage();
    pdf.rect(0, pdf.height - 6, pdf.width, 6, BRAND_COLOR);
    y = pdf.height - 50;
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < bottomLimit) newPage();
  };

  const drawTableHeader = (table: ReportTable) => {
    pdf.rect(margin, y - 5, right - margin, rowHeight, BRAND_COLOR);
    pdf.text(table.labelHeader, margin + 6, y, { size: 9.5, bold: true, color: '#ffffff' });
    pdf.text(table.valueHeader, valueX, y, { size: 9.5, bold: true, color: '#ffffff', align: 'right' });
    pdf.text('Gráfico', barX, y, { size: 9.5, bold: true, color: '#ffffff' });
    y -= rowHeight;
  };

  newPage();
  pdf.text('Mundo Fitness', margin, y, { size: 22, bold: true, color: BRAND_COLOR });
  y -= 22;
  pdf.text('Informes de gestión', margin, y, { size: 13, bold: true });
  y -= 18;
  pdf.text(`Generado el ${generatedAtLabel(data.generatedAt)}`, margin, y, { size: 9, color: '#4b5563' });
  y -= 13;
  pdf.text(REPORT_PERIOD_NOTE, margin, y, { size: 9, color: '#4b5563' });
  y -= 10;
  pdf.line(margin, y, right, y);
  y -= 22;

  if (data.missingSections.length > 0) {
    pdf.text(`No se pudieron cargar: ${data.missingSections.join(', ')}.`, margin, y, { size: 10, color: BRAND_COLOR });
    y -= 22;
  }

  let currentSection = '';
  for (const table of data.tables) {
    const tableHeight = 20 + rowHeight * (Math.max(1, table.rows.length) + 2) + 14;
    if (table.section !== currentSection) {
      ensureSpace(26 + Math.min(tableHeight, 160));
      currentSection = table.section;
      pdf.text(table.section, margin, y, { size: 15, bold: true, color: BRAND_COLOR });
      y -= 24;
    } else {
      ensureSpace(Math.min(tableHeight, 160));
    }

    pdf.text(table.title, margin, y, { size: 11.5, bold: true });
    y -= 18;
    drawTableHeader(table);

    if (table.rows.length === 0) {
      pdf.text(table.emptyText ?? EMPTY_TEXT, margin + 6, y, { size: 10, color: '#6b7280' });
      y -= rowHeight;
    } else {
      const maxValue = Math.max(1, ...table.rows.map((row) => row.value));
      table.rows.forEach((row, index) => {
        if (y - rowHeight < bottomLimit) {
          newPage();
          pdf.text(`${table.title} (continuación)`, margin, y, { size: 11.5, bold: true });
          y -= 18;
          drawTableHeader(table);
        }
        if (index % 2 === 1) pdf.rect(margin, y - 5, right - margin, rowHeight, '#f6f6f7');
        pdf.text(pdf.fitText(row.label, valueX - margin - 100), margin + 6, y, { size: 10 });
        pdf.text(formatValue(table, row.value), valueX, y, { size: 10, align: 'right' });
        if (row.value > 0) pdf.rect(barX, y - 1, Math.max(2, (row.value / maxValue) * barMaxWidth), 9, BRAND_COLOR);
        y -= rowHeight;
      });
      pdf.line(margin, y + rowHeight - 5, right, y + rowHeight - 5, '#9ca3af');
      pdf.text('Total', margin + 6, y, { size: 10, bold: true });
      pdf.text(formatValue(table, tableTotal(table)), valueX, y, { size: 10, bold: true, align: 'right' });
      y -= rowHeight;
    }
    y -= 16;
  }

  if (data.tables.length === 0) {
    pdf.text('No hay informes disponibles para exportar.', margin, y, { size: 11, color: '#6b7280' });
  }

  const totalPages = pdf.pageCount;
  for (let index = 0; index < totalPages; index++) {
    pdf.setPage(index);
    pdf.line(margin, 42, right, 42);
    pdf.text('Mundo Fitness · Informes', margin, 28, { size: 8.5, color: '#6b7280' });
    pdf.text(`Página ${index + 1} de ${totalPages}`, right, 28, { size: 8.5, color: '#6b7280', align: 'right' });
  }

  return pdf.toBytes();
}

/* ------------------------------- Descarga ------------------------------- */

export const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const PDF_MIME_TYPE = 'application/pdf';

export function downloadFile(bytes: Uint8Array<ArrayBuffer>, fileName: string, mimeType: string) {
  const url = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
