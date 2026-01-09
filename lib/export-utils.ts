export interface ExportData {
  title: string
  fileName: string
  headers: string[]
  rows: (string | number)[][]
}

export function downloadCSV(data: ExportData) {
  const { fileName, headers, rows } = data

  // Create CSV content
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((cell) => {
          // Escape quotes and wrap in quotes if contains comma or quote
          const stringCell = String(cell)
          if (stringCell.includes(",") || stringCell.includes('"') || stringCell.includes("\n")) {
            return `"${stringCell.replace(/"/g, '""')}"`
          }
          return stringCell
        })
        .join(","),
    ),
  ].join("\n")

  // Create blob and download
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
  // Simple print-to-PDF using browser's print functionality
  // The user can save as PDF using the browser's print dialog
  const element = document.getElementById(elementId)
  if (!element) {
    console.error(`Element with id "${elementId}" not found`)
    return
  }

  // Open print dialog with the specific element
  window.print()
}

export function exportToPDF(data: ExportData) {
  // For now, just download as CSV
  // You can integrate a PDF library like jsPDF if needed
  downloadCSV(data)
}
