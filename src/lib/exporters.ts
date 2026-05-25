import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// =====================================================================
// Utilitários de exportação de relatórios (PDF e Excel)
// =====================================================================

export type Column = { header: string; key: string };

const stamp = () => new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

// Cor institucional (azul TJRO) usada nos cabeçalhos do PDF.
const BRAND: [number, number, number] = [29, 78, 137];

/** Exporta uma tabela para .xlsx (uma planilha). */
export function exportExcel(rows: Record<string, unknown>[], fileName: string, sheetName = "Dados") {
  const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{}]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, `${fileName}-${stamp()}.xlsx`);
}

/** Exporta várias planilhas em um único arquivo .xlsx. */
export function exportExcelMulti(
  sheets: { name: string; rows: Record<string, unknown>[] }[],
  fileName: string,
) {
  const wb = XLSX.utils.book_new();
  for (const s of sheets) {
    const ws = XLSX.utils.json_to_sheet(s.rows.length ? s.rows : [{}]);
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
  }
  XLSX.writeFile(wb, `${fileName}-${stamp()}.xlsx`);
}

/** Exporta uma tabela para PDF (A4 paisagem) com cabeçalho institucional. */
export function exportPdfTable(opts: {
  title: string;
  subtitle?: string;
  columns: Column[];
  rows: Record<string, unknown>[];
  fileName: string;
  orientation?: "portrait" | "landscape";
}) {
  const { title, subtitle, columns, rows, fileName, orientation = "landscape" } = opts;
  const doc = new jsPDF({ orientation, unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFontSize(14);
  doc.setTextColor(...BRAND);
  doc.text(title, 40, 40);

  doc.setFontSize(9);
  doc.setTextColor(110);
  const sub = subtitle ? `${subtitle}  ·  ` : "";
  doc.text(`${sub}Gerado em ${new Date().toLocaleString("pt-BR")}  —  COSEPH / TJRO`, 40, 56);

  autoTable(doc, {
    startY: 70,
    head: [columns.map((c) => c.header)],
    body: rows.map((r) => columns.map((c) => fmtCell(r[c.key]))),
    styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
    headStyles: { fillColor: BRAND, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [244, 247, 251] },
    margin: { left: 40, right: 40 },
    didDrawPage: () => {
      const page = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Página ${page}`, pageW - 70, doc.internal.pageSize.getHeight() - 20);
    },
  });

  doc.save(`${fileName}-${stamp()}.pdf`);
}

function fmtCell(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "number") return v.toLocaleString("pt-BR");
  return String(v);
}
