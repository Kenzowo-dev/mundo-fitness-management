/** Formatos compartidos por la página de Informes y sus exportaciones (Excel / PDF). */

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function parseMonth(month: string) {
  const [year, number] = month.split('-').map(Number);
  if (!year || !number || number > 12) return null;
  return new Date(year, number - 1, 1);
}

function parseDay(date: string) {
  const [year, month, day] = date.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

/** "2026-08" → "ago. 26" (etiqueta corta para los gráficos). */
export function monthLabel(month: string) {
  const date = parseMonth(month);
  if (!date) return '—';
  return new Intl.DateTimeFormat('es-PE', { month: 'short', year: '2-digit' }).format(date);
}

/** "2026-08" → "Agosto de 2026" (etiqueta completa para los archivos exportados). */
export function monthLongLabel(month: string) {
  const date = parseMonth(month);
  if (!date) return month;
  return capitalize(new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(date));
}

/** "2026-09-28" → "lun. 28" (etiqueta corta para los gráficos). */
export function dayLabel(date: string) {
  const parsed = parseDay(date);
  if (!parsed) return '—';
  return new Intl.DateTimeFormat('es-PE', { weekday: 'short', day: 'numeric' }).format(parsed);
}

/** "2026-09-28" → "Lun., 28/09/2026" (etiqueta completa para los archivos exportados). */
export function dayLongLabel(date: string) {
  const parsed = parseDay(date);
  if (!parsed) return date;
  return capitalize(
    new Intl.DateTimeFormat('es-PE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).format(parsed),
  );
}

export function statusLabel(status: string) {
  const labels: Record<string, string> = {
    active: 'Activos', inactive: 'Inactivos', suspended: 'Suspendidos',
    cancelled: 'Canceladas', expired: 'Vencidas', frozen: 'Congeladas', scheduled: 'Programadas',
  };
  return labels[status] ?? status;
}

export function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(value);
}
