export interface FileAttachment {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadedAt: Date
}

class FileManager {
  private files: Map<string, FileAttachment> = new Map()

  uploadFile(file: File): Promise<FileAttachment> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        const attachment: FileAttachment = {
          id: Date.now().toString(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: reader.result as string,
          uploadedAt: new Date(),
        }
        this.files.set(attachment.id, attachment)
        resolve(attachment)
      }
      reader.readAsDataURL(file)
    })
  }

  getFile(id: string): FileAttachment | undefined {
    return this.files.get(id)
  }

  deleteFile(id: string): boolean {
    return this.files.delete(id)
  }

  generateRepairForm(deviceId: string, requestId: string): string {
    const formContent = `
QCC IT DEVICE REPAIR FORM
========================

Device ID: ${deviceId}
Request ID: ${requestId}
Date: ${new Date().toLocaleDateString()}

DEVICE INFORMATION:
- Serial Number: ________________
- Device Type: ________________
- Brand/Model: ________________

PROBLEM DESCRIPTION:
_________________________________
_________________________________
_________________________________

TECHNICIAN ASSESSMENT:
_________________________________
_________________________________
_________________________________

REPAIR ACTIONS TAKEN:
_________________________________
_________________________________
_________________________________

PARTS REPLACED:
_________________________________
_________________________________

TECHNICIAN SIGNATURE: ________________
DATE COMPLETED: ________________

QCC IT Department
Quality Control Company Limited
    `

    return formContent
  }

  downloadFile(content: string, filename: string, mimeType = "text/plain") {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  exportToCSV(data: any[], filename: string) {
    if (data.length === 0) return

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            return typeof value === "string" && value.includes(",") ? `"${value}"` : value
          })
          .join(","),
      ),
    ].join("\n")

    this.downloadFile(csvContent, filename, "text/csv")
  }
}

export const fileManager = new FileManager()
