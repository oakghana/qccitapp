import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const BRAND_NAME = "Quality Control Company Limited"
const BRAND_SUBTITLE = "Intranet Report"
const LOGO_PATH = "/images/qcc-logo.png"

export interface ExportData {
  title: string
  fileName: string
  headers: string[]
  rows: (string | number)[][]
}

async function getLogoDataUrl() {
  try {
    const response = await fetch(LOGO_PATH)
    if (!response.ok) return null

    const blob = await response.blob()
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error("[export-utils] Failed to load report logo:", error)
    return null
  }
}

export function downloadCSV(data: ExportData) {
  const { fileName, headers, rows } = data

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((cell) => {
          const stringCell = String(cell)
          if (stringCell.includes(",") || stringCell.includes('"') || stringCell.includes("\n")) {
            return `"${stringCell.replace(/"/g, '""')}"`
          }
          return stringCell
        })
        .join(","),
    ),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", `${fileName}-${new Date().toISOString().split("T")[0]}.csv`)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function printToPDF(elementId: string, fileName: string) {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error(`Element with id "${elementId}" not found`)
    return
  }

  const printWindow = window.open("", "_blank", "width=1024,height=768")
  if (!printWindow) {
    window.print()
    return
  }

  const logoUrl = `${window.location.origin}${LOGO_PATH}`
  printWindow.document.write(`
    <html>
      <head>
        <title>${fileName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }
          .report-header { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #8b5e00; padding-bottom: 14px; margin-bottom: 20px; }
          .report-header img { width: 64px; height: 64px; object-fit: contain; }
          .report-header h1 { margin: 0; font-size: 20px; color: #3b2b12; }
          .report-header p { margin: 4px 0 0; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="report-header">
          <img src="${logoUrl}" alt="QCC Logo" />
          <div>
            <h1>${BRAND_NAME}</h1>
            <p>${BRAND_SUBTITLE}</p>
          </div>
        </div>
        ${element.outerHTML}
      </body>
    </html>
  `)

  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}

export async function exportToPDF(data: ExportData) {
  const { title, fileName, headers, rows } = data

  const doc = new jsPDF()
  const generatedAt = new Date().toLocaleString()
  const logoDataUrl = await getLogoDataUrl()

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", 14, 10, 20, 20)
  }

  doc.setFontSize(14)
  doc.setTextColor(60, 43, 18)
  doc.text(BRAND_NAME, 40, 16)
  doc.setFontSize(10)
  doc.setTextColor(110, 110, 110)
  doc.text(BRAND_SUBTITLE, 40, 22)

  doc.setDrawColor(139, 94, 0)
  doc.line(14, 32, 196, 32)

  doc.setFontSize(16)
  doc.setTextColor(20, 20, 20)
  doc.text(title, 14, 42)
  doc.setFontSize(10)
  doc.text(`Generated: ${generatedAt}`, 14, 49)

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 56,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [34, 84, 61] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { top: 20, left: 14, right: 14, bottom: 18 },
  })

  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(9)
    doc.setTextColor(110, 110, 110)
    doc.text(`${BRAND_NAME} • Page ${i} of ${pageCount}`, 14, 288)
  }

  doc.save(`${fileName}-${new Date().toISOString().split("T")[0]}.pdf`)
}
