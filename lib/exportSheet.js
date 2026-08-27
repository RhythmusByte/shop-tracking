// Builds a formatted worksheet: a merged title band (store/report name +
// date range), a bold header row with a colored fill and borders, data rows
// with per-column number formats and thin borders, sensible column widths,
// and a frozen header row so it stays visible while scrolling.
//
// columns: [{ header: string, key: string, width?: number, numFmt?: string }]
// rows: array of plain objects keyed by column `key`
export function addStyledSheet(workbook, { sheetName, title, subtitle, columns, rows }) {
  const sheet = workbook.addWorksheet(sheetName.slice(0, 31)); // Excel sheet name limit

  const colCount = columns.length;

  // Title band
  sheet.mergeCells(1, 1, 1, colCount);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7C3AED" } };
  sheet.getRow(1).height = 26;

  if (subtitle) {
    sheet.mergeCells(2, 1, 2, colCount);
    const subCell = sheet.getCell(2, 1);
    subCell.value = subtitle;
    subCell.font = { italic: true, size: 10, color: { argb: "FF4B5563" } };
    sheet.getRow(2).height = 18;
  }

  const headerRowIndex = subtitle ? 4 : 3;
  sheet.getRow(headerRowIndex - 1).height = 6; // small spacer row

  // Header row
  const headerRow = sheet.getRow(headerRowIndex);
  columns.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = col.header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF8B5CF6" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = thinBorder();
  });
  headerRow.height = 20;

  // Data rows
  rows.forEach((rowData, rowIdx) => {
    const row = sheet.getRow(headerRowIndex + 1 + rowIdx);
    columns.forEach((col, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      cell.value = rowData[col.key] ?? "";
      cell.border = thinBorder();
      if (col.numFmt) cell.numFmt = col.numFmt;
      if (rowIdx % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F3FF" } };
      }
    });
  });

  // Column widths
  columns.forEach((col, i) => {
    sheet.getColumn(i + 1).width = col.width || Math.max(12, col.header.length + 2);
  });

  // Freeze the header row (and everything above it) so it stays visible.
  sheet.views = [{ state: "frozen", ySplit: headerRowIndex }];

  // Auto-filter on the header row.
  if (rows.length > 0) {
    sheet.autoFilter = {
      from: { row: headerRowIndex, column: 1 },
      to: { row: headerRowIndex, column: colCount },
    };
  }

  return sheet;
}

function thinBorder() {
  const style = { style: "thin", color: { argb: "FFE2E8F0" } };
  return { top: style, left: style, bottom: style, right: style };
}

// Triggers a browser download of a workbook built with exceljs.
export async function downloadWorkbook(workbook, filename) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
