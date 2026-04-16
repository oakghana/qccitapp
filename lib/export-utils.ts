import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const BRAND_NAME = "Quality Control Company Limited"
const BRAND_SUBTITLE = "Intranet Report"
const LOGO_PATH = "/images/qcc-logo.png"
const COMPANY_REG_TEXT = "Reg. No 3071"

export interface ExportData {
  title: string
  fileName: string
  headers: string[]
  rows: (string | number)[][]
}

export type ITFormType = "requisition" | "maintenance" | "new-gadget"

export interface ITFormPDFData {
  formType: ITFormType
  fileName: string
  requestNumber: string
  staffName: string
  department: string
  requestDate: string
  summary: string
  purpose?: string
  status?: string
  gadgetMake?: string
  serialNumber?: string
  yearOfPurchase?: string | number
  dateOfPurchase?: string
  timesRepaired?: string | number
  hodName?: string
  hodDate?: string
  extraNotes?: string
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

function formatStatus(status?: string) {
  if (!status) return "Pending"
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function addSectionHeader(doc: jsPDF, title: string, sectionCode: string, y: number) {
  doc.setFillColor(248, 244, 232)
  doc.rect(14, y - 4, 182, 7, "F")
  doc.setDrawColor(120, 120, 120)
  doc.rect(14, y - 4, 182, 7)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text(title, 16, y)
  doc.text(sectionCode, 192, y, { align: "right" })
  return y + 9
}

function addFieldLine(doc: jsPDF, label: string, value: string, x: number, y: number) {
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text(`${label}: ${value || "................................"}`, x, y)
  return y + 6
}

function addWrappedField(doc: jsPDF, label: string, value: string, x: number, y: number, valueOffset = 36, maxWidth = 135) {
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text(`${label}:`, x, y)
  const safeValue = value?.trim() || "................................"
  const lines = doc.splitTextToSize(safeValue, maxWidth)
  doc.text(lines, x + valueOffset, y)
  return y + Math.max(7, lines.length * 5 + 2)
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

export async function exportITFormPDF(data: ITFormPDFData) {
  const doc = new jsPDF("p", "mm", "a4")
  const logoDataUrl = await getLogoDataUrl()
  const pageWidth = doc.internal.pageSize.getWidth()

  const title =
    data.formType === "maintenance"
      ? "MAINTENANCE AND REPAIRS REQUEST FORM"
      : data.formType === "new-gadget"
        ? "NEW IT GADGET REQUEST FORM"
        : "REQUISITION FORM: COMPUTER CONSUMABLE (TONER & GADGET)"

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", pageWidth / 2 - 8, 10, 16, 16)
  }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text("FOR ISD DEPARTMENT OF QCC", pageWidth / 2, 31, { align: "center" })
  doc.setFontSize(15)
  doc.text(title, pageWidth / 2, 39, { align: "center" })
  doc.setFontSize(9)
  doc.rect(165, 12, 30, 9)
  doc.text(COMPANY_REG_TEXT, 180, 18, { align: "center" })

  let y = 49

  y = addSectionHeader(doc, "REQUESTING STAFF INFORMATION", "SECTION A", y)
  y = addFieldLine(doc, "Name of staff making request", data.staffName, 16, y)
  y = addFieldLine(doc, "Department name", data.department, 16, y)
  y = addWrappedField(doc, data.formType === "new-gadget" ? "Complaints / reason" : "Items / complaint", data.summary, 16, y)
  y = addFieldLine(doc, "Date of request", data.requestDate, 16, y)

  if (data.formType === "requisition") {
    y = addSectionHeader(doc, "REQUISITION DETAILS", "SECTION B", y + 2)
    y = addFieldLine(doc, "Request / requisition no", data.requestNumber, 16, y)
    y = addFieldLine(doc, "Supplier name", data.gadgetMake || "N/A", 16, y)
    y = addWrappedField(doc, "Purpose", data.purpose || "N/A", 16, y)
  }

  if (data.formType === "new-gadget") {
    y = addSectionHeader(doc, "PREVIOUS IT GADGET HISTORY", "SECTION B", y + 2)
    y = addFieldLine(doc, "Make of IT gadget", data.gadgetMake || "N/A", 16, y)
    y = addFieldLine(doc, "Serial number", data.serialNumber || "N/A", 16, y)
    y = addFieldLine(doc, "Year of purchase", String(data.yearOfPurchase || "N/A"), 16, y)
    y = addWrappedField(doc, "Any other comments", data.extraNotes || data.purpose || "N/A", 16, y)
  }

  if (data.formType === "maintenance") {
    y = addSectionHeader(doc, "TECHNICIAN USE ONLY: INITIAL DIAGNOSIS", "SECTION B", y + 2)
    y = addFieldLine(doc, "Part / item", data.gadgetMake || "IT Gadget", 16, y)
    y = addFieldLine(doc, "Make / serial no", data.serialNumber || "N/A", 16, y)
    y = addWrappedField(doc, "Fault / remarks", data.summary, 16, y)
    y = addWrappedField(doc, "Any other comments", data.extraNotes || data.purpose || "N/A", 16, y)
    y = addFieldLine(doc, "Date of last repairs", data.requestDate, 16, y)
    y = addFieldLine(doc, "Date of purchase", data.dateOfPurchase || "N/A", 16, y)
    y = addFieldLine(doc, "Number of times repaired", String(data.timesRepaired || "N/A"), 16, y)
  }

  y = addSectionHeader(doc, "AUTHORIZATION FROM THE HEAD OF DEPARTMENT", "SECTION C", y + 2)
  y = addFieldLine(doc, "Name of sectional / departmental head", data.hodName || "Pending HOD Review", 16, y)
  y = addFieldLine(doc, "Date", data.hodDate || "Pending", 16, y)

  y = addSectionHeader(doc, "IS MANAGER / OFFICE USE ONLY", "SECTION D", y + 2)
  y = addFieldLine(doc, "Request number", data.requestNumber, 16, y)
  y = addFieldLine(doc, "Current workflow status", formatStatus(data.status), 16, y)
  y = addWrappedField(doc, "Further action / notes", data.purpose || data.extraNotes || "Pending review by IT unit", 16, y)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(90, 90, 90)
  doc.text(`${BRAND_NAME} • ${BRAND_SUBTITLE}`, 14, 286)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 196, 286, { align: "right" })

  doc.save(`${data.fileName}-${new Date().toISOString().split("T")[0]}.pdf`)
}
