import Papa from "papaparse"

export interface DeviceImportRecord {
  device_type: string
  brand: string
  model: string
  serial_number: string
  status?: string
  purchase_date?: string
  warranty_expiry?: string
  assigned_to?: string
  room_number?: string
  building?: string
  floor?: string
  toner_type?: string
  toner_model?: string
  toner_yield?: string
  monthly_print_volume?: string
}

export interface ValidationError {
  row: number
  field: string
  message: string
  value?: string
}

export interface ValidationResult {
  isValid: boolean
  records: DeviceImportRecord[]
  errors: ValidationError[]
  warnings: ValidationError[]
}

export const DEVICE_TYPES = [
  "laptop",
  "desktop",
  "printer",
  "photocopier",
  "handset",
  "ups",
  "stabiliser",
  "mobile",
  "server",
  "other",
]

export const DEVICE_STATUSES = ["active", "repair", "maintenance", "retired"]

export const REQUIRED_FIELDS = ["device_type", "brand", "model", "serial_number"]

export function parseCsvFile(fileOrText: File | string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(fileOrText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        resolve(results.data)
      },
      error: (error: any) => {
        reject(new Error(`CSV parsing error: ${error.message}`))
      },
    })
  })
}

export function validateDeviceRecord(
  record: any,
  rowNumber: number,
  existingSerialNumbers: Set<string>
): { record: DeviceImportRecord | null; errors: ValidationError[] } {
  const errors: ValidationError[] = []

  // Normalize field names (trim and lowercase)
  const normalizedRecord: any = {}
  for (const [key, value] of Object.entries(record)) {
    const normalizedKey = key.trim().toLowerCase()
    normalizedRecord[normalizedKey] = value
  }

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!normalizedRecord[field] || normalizedRecord[field].toString().trim() === "") {
      errors.push({
        row: rowNumber,
        field,
        message: `${field} is required`,
        value: normalizedRecord[field],
      })
    }
  }

  // Validate device_type
  if (normalizedRecord.device_type) {
    const deviceType = normalizedRecord.device_type.toString().toLowerCase().trim()
    if (!DEVICE_TYPES.includes(deviceType)) {
      errors.push({
        row: rowNumber,
        field: "device_type",
        message: `Invalid device type. Must be one of: ${DEVICE_TYPES.join(", ")}`,
        value: normalizedRecord.device_type,
      })
    }
  }

  // Validate status
  if (normalizedRecord.status) {
    const status = normalizedRecord.status.toString().toLowerCase().trim()
    if (status !== "" && !DEVICE_STATUSES.includes(status)) {
      errors.push({
        row: rowNumber,
        field: "status",
        message: `Invalid status. Must be one of: ${DEVICE_STATUSES.join(", ")}`,
        value: normalizedRecord.status,
      })
    }
  }

  // Validate serial number uniqueness
  if (normalizedRecord.serial_number) {
    const serialNumber = normalizedRecord.serial_number.toString().trim()
    if (existingSerialNumbers.has(serialNumber.toLowerCase())) {
      errors.push({
        row: rowNumber,
        field: "serial_number",
        message: "Serial number already exists in the system",
        value: serialNumber,
      })
    }
  }

  // Validate dates (must be ISO format YYYY-MM-DD)
  if (normalizedRecord.purchase_date && normalizedRecord.purchase_date.toString().trim() !== "") {
    if (!isValidIsoDate(normalizedRecord.purchase_date.toString())) {
      errors.push({
        row: rowNumber,
        field: "purchase_date",
        message: "Invalid date format. Use YYYY-MM-DD",
        value: normalizedRecord.purchase_date,
      })
    }
  }

  if (normalizedRecord.warranty_expiry && normalizedRecord.warranty_expiry.toString().trim() !== "") {
    if (!isValidIsoDate(normalizedRecord.warranty_expiry.toString())) {
      errors.push({
        row: rowNumber,
        field: "warranty_expiry",
        message: "Invalid date format. Use YYYY-MM-DD",
        value: normalizedRecord.warranty_expiry,
      })
    }
  }

  // Validate printer-specific fields
  const deviceType = normalizedRecord.device_type?.toString().toLowerCase().trim()
  if (deviceType === "printer" || deviceType === "photocopier") {
    if (!normalizedRecord.toner_type || normalizedRecord.toner_type.toString().trim() === "") {
      errors.push({
        row: rowNumber,
        field: "toner_type",
        message: "Toner type is required for printers and photocopiers",
      })
    }
  }

  // Build clean record with normalized field names
  const cleanRecord: DeviceImportRecord = {
    device_type: normalizedRecord.device_type?.toString().toLowerCase().trim() || "",
    brand: normalizedRecord.brand?.toString().trim() || "",
    model: normalizedRecord.model?.toString().trim() || "",
    serial_number: normalizedRecord.serial_number?.toString().trim() || "",
    status: normalizedRecord.status?.toString().toLowerCase().trim() || "active",
    purchase_date: normalizedRecord.purchase_date?.toString().trim() || undefined,
    warranty_expiry: normalizedRecord.warranty_expiry?.toString().trim() || undefined,
    assigned_to: normalizedRecord.assigned_to?.toString().trim() || undefined,
    room_number: normalizedRecord.room_number?.toString().trim() || undefined,
    building: normalizedRecord.building?.toString().trim() || undefined,
    floor: normalizedRecord.floor?.toString().trim() || undefined,
    toner_type: normalizedRecord.toner_type?.toString().trim() || undefined,
    toner_model: normalizedRecord.toner_model?.toString().trim() || undefined,
    toner_yield: normalizedRecord.toner_yield?.toString().trim() || undefined,
    monthly_print_volume: normalizedRecord.monthly_print_volume?.toString().trim() || undefined,
  }

  return {
    record: errors.length === 0 ? cleanRecord : null,
    errors,
  }
}

function isValidIsoDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateString)) return false
  const date = new Date(dateString + "T00:00:00Z")
  return date instanceof Date && !isNaN(date.getTime())
}

export async function validateCsvImport(
  fileOrText: File | string,
  existingSerialNumbers: Set<string>
): Promise<ValidationResult> {
  try {
    const csvData = await parseCsvFile(fileOrText)

    if (csvData.length === 0) {
      return {
        isValid: false,
        records: [],
        errors: [{ row: 0, field: "file", message: "CSV file is empty" }],
        warnings: [],
      }
    }

    const validRecords: DeviceImportRecord[] = []
    const allErrors: ValidationError[] = []

    for (let i = 0; i < csvData.length; i++) {
      const { record, errors } = validateDeviceRecord(csvData[i], i + 2, existingSerialNumbers) // +2 because row 1 is headers

      if (record) {
        validRecords.push(record)
      } else {
        allErrors.push(...errors)
      }
    }

    return {
      isValid: allErrors.length === 0,
      records: validRecords,
      errors: allErrors,
      warnings: [],
    }
  } catch (error: any) {
    return {
      isValid: false,
      records: [],
      errors: [{ row: 0, field: "file", message: error.message }],
      warnings: [],
    }
  }
}

export function generateCsvTemplate(): string {
  const headers = [
    "device_type",
    "brand",
    "model",
    "serial_number",
    "status",
    "purchase_date",
    "warranty_expiry",
    "assigned_to",
    "room_number",
    "building",
    "floor",
    "toner_type",
  ]

  const examples = [
    [
      "laptop",
      "Dell",
      "Latitude 5520",
      "SN12345",
      "active",
      "2023-01-15",
      "2025-01-15",
      "John Doe",
      "204",
      "Main Block",
      "2nd Floor",
      "",
    ],
    [
      "printer",
      "HP",
      "LaserJet M404",
      "SN12347",
      "active",
      "2023-03-10",
      "2025-03-10",
      "Print Room",
      "101",
      "Main Block",
      "Ground Floor",
      "CF217A",
    ],
    [
      "desktop",
      "Lenovo",
      "ThinkCentre M90",
      "SN12348",
      "active",
      "2023-04-05",
      "2025-04-05",
      "Admin Dept",
      "105",
      "Admin Bldg",
      "1st Floor",
      "",
    ],
  ]

  const csvLines = [
    headers.join(","),
    ...examples.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ]

  return csvLines.join("\n")
}
