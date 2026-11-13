/**
 * Generador mínimo de PDF (texto, rectángulos y líneas) sin dependencias externas.
 *
 * Usa las fuentes estándar Helvetica / Helvetica-Bold con codificación WinAnsi,
 * que cubre el español (tildes, ñ, ¿, ¡). Las coordenadas usan el origen PDF:
 * (0, 0) es la esquina inferior izquierda de la página.
 */

export type PdfColor = string; // "#rrggbb"

export interface PdfTextOptions {
  size?: number;
  bold?: boolean;
  color?: PdfColor;
  align?: 'left' | 'right' | 'center';
}

/** Anchos de Helvetica (1/1000 em) para los caracteres ASCII 32–126. */
const HELVETICA_WIDTHS = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, // espacio – /
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, // 0–9
  278, 278, 584, 584, 584, 556, 1015, // : – @
  667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, // A–M
  722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, // N–Z
  278, 278, 278, 469, 556, 333, // [ – `
  556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, // a–m
  556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, // n–z
  334, 260, 334, 584, // { – ~
];

/** Caracteres Unicode que WinAnsi guarda en el rango 0x80–0x9F. */
const WIN_ANSI_EXTRAS: Record<string, number> = {
  '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87, 'ˆ': 0x88,
  '‰': 0x89, 'Š': 0x8a, '‹': 0x8b, 'Œ': 0x8c, 'Ž': 0x8e, '‘': 0x91, '’': 0x92, '“': 0x93,
  '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '˜': 0x98, '™': 0x99, 'š': 0x9a, '›': 0x9b,
  'œ': 0x9c, 'ž': 0x9e, 'Ÿ': 0x9f,
};

/** Convierte texto Unicode a una cadena de bytes WinAnsi (un carácter = un byte). */
export function toWinAnsi(text: string) {
  let result = '';
  for (const char of text) {
    const code = char.codePointAt(0) ?? 63;
    if (WIN_ANSI_EXTRAS[char] !== undefined) result += String.fromCharCode(WIN_ANSI_EXTRAS[char]);
    else if (code === 0x202f || code === 0x2009 || code === 0x2007) result += ' ';
    else if (code >= 0x20 && code <= 0x7e) result += char;
    else if (code >= 0xa0 && code <= 0xff) result += char;
    else if (code === 0x09) result += ' ';
    else result += '?';
  }
  return result;
}

function charWidth(char: string) {
  // Las letras con tilde miden lo mismo que su letra base.
  const base = char.normalize('NFD').charAt(0);
  const code = base.charCodeAt(0);
  if (code >= 32 && code <= 126) return HELVETICA_WIDTHS[code - 32];
  if (code === 0xa0) return 278;
  return 556;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function rgb(color: PdfColor) {
  const hex = color.replace('#', '');
  const channels = [0, 2, 4].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
  return channels.map((channel) => formatNumber(Number.isFinite(channel) ? channel : 0)).join(' ');
}

function escapePdfString(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

export class PdfDocument {
  /** Tamaño A4 en puntos. */
  readonly width = 595.28;
  readonly height = 841.89;
  private readonly pages: string[][] = [];
  private current = -1;

  private readonly title: string;

  constructor(title = 'Documento') {
    this.title = title;
  }

  get pageCount() {
    return this.pages.length;
  }

  addPage() {
    this.pages.push([]);
    this.current = this.pages.length - 1;
    return this.current;
  }

  /** Cambia la página en la que se dibuja (útil para pies de página al final). */
  setPage(index: number) {
    if (index < 0 || index >= this.pages.length) throw new Error(`La página ${index} no existe.`);
    this.current = index;
  }

  private draw(operation: string) {
    if (this.current < 0) this.addPage();
    this.pages[this.current].push(operation);
  }

  textWidth(text: string, size = 10, bold = false) {
    let units = 0;
    for (const char of text) units += charWidth(char);
    // Helvetica-Bold es un poco más ancha en letras; los dígitos miden lo mismo.
    return (units * size * (bold && /\D/.test(text) ? 1.04 : 1)) / 1000;
  }

  /** Recorta el texto con "…" para que no supere `maxWidth`. */
  fitText(text: string, maxWidth: number, size = 10, bold = false) {
    if (this.textWidth(text, size, bold) <= maxWidth) return text;
    let result = text;
    while (result.length > 1 && this.textWidth(`${result}…`, size, bold) > maxWidth) result = result.slice(0, -1);
    return `${result.trimEnd()}…`;
  }

  text(text: string, x: number, y: number, options: PdfTextOptions = {}) {
    const { size = 10, bold = false, color = '#111827', align = 'left' } = options;
    const width = this.textWidth(text, size, bold);
    const startX = align === 'right' ? x - width : align === 'center' ? x - width / 2 : x;
    const encoded = escapePdfString(toWinAnsi(text));
    this.draw(
      `BT ${rgb(color)} rg /${bold ? 'F2' : 'F1'} ${formatNumber(size)} Tf ${formatNumber(startX)} ${formatNumber(y)} Td (${encoded}) Tj ET`,
    );
  }

  rect(x: number, y: number, width: number, height: number, fill: PdfColor) {
    this.draw(`${rgb(fill)} rg ${formatNumber(x)} ${formatNumber(y)} ${formatNumber(width)} ${formatNumber(height)} re f`);
  }

  line(x1: number, y1: number, x2: number, y2: number, color: PdfColor = '#d1d5db', lineWidth = 0.75) {
    this.draw(
      `${rgb(color)} RG ${formatNumber(lineWidth)} w ${formatNumber(x1)} ${formatNumber(y1)} m ${formatNumber(x2)} ${formatNumber(y2)} l S`,
    );
  }

  toBytes(): Uint8Array<ArrayBuffer> {
    if (this.pages.length === 0) this.addPage();
    const objects: string[] = [];
    const pageCount = this.pages.length;
    const firstPageObject = 6;
    const kids = Array.from({ length: pageCount }, (_, index) => `${firstPageObject + index * 2} 0 R`).join(' ');

    objects.push('<< /Type /Catalog /Pages 2 0 R >>');
    objects.push(`<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>`);
    objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    objects.push(`<< /Title (${escapePdfString(toWinAnsi(this.title))}) /Producer (Mundo Fitness) >>`);

    this.pages.forEach((operations, index) => {
      const contentObject = firstPageObject + index * 2 + 1;
      objects.push(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.width} ${this.height}] ` +
          `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObject} 0 R >>`,
      );
      const stream = operations.join('\n');
      objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    });

    let output = '%PDF-1.4\n%âãÏÓ\n';
    const offsets: number[] = [];
    objects.forEach((body, index) => {
      offsets.push(output.length);
      output += `${index + 1} 0 obj\n${body}\nendobj\n`;
    });
    const xrefStart = output.length;
    output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    output += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
    output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

    const bytes = new Uint8Array(output.length);
    for (let i = 0; i < output.length; i++) bytes[i] = output.charCodeAt(i) & 0xff;
    return bytes;
  }
}
