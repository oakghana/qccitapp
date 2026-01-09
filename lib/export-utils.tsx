export interface ExportData {
  headers: string[]
  rows: (string | number)[][]
  title: string
  fileName: string
}

export function downloadCSV(data: ExportData) {
  const csv = [data.headers.join(","), ...data.rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

  const blob = new Blob([csv], { type: "text/csv" })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${data.fileName}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}

export function printToPDF(elementId: string, fileName: string) {
  const element = document.getElementById(elementId)
  if (!element) return

  const printWindow = window.open("", "", "width=800,height=600")
  if (!printWindow) return

  printWindow.document.write(`
    <html>
      <head>
        <title>${fileName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          h1 { color: #333; }
          .header { margin-bottom: 20px; }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
    </html>
  `)

  printWindow.document.close()
  printWindow.focus()

  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 250)
}
