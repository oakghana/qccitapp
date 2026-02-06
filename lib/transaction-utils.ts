export type TransactionPayload = Record<string, any>

export function normalizeTransactionType(tt?: string | null) {
  if (!tt) return "adjustment"
  const t = tt.toString().toLowerCase()

  if (["issue", "issued"].includes(t)) return "issue"
  if (["assignment", "assigned", "assign"].includes(t)) return "issue"
  if (t === "assignment_edit") return "adjustment"

  if (["addition", "stock_addition", "initial_stock"].includes(t)) return "receipt"
  if (["received", "receipt", "stock_in"].includes(t)) return "receipt"

  if (t.startsWith("transfer_in")) return "transfer_in"
  if (t.startsWith("transfer_out")) return "transfer_out"
  if (t.startsWith("transfer")) return "transfer_out"

  if (t === "requisition" || t === "head_office_requisition") return "requisition"

  if (t === "adjustment" || t === "return") return t

  // Fallback
  return t
}

export function buildTransactionPayload(input: TransactionPayload): TransactionPayload {
  const payload = { ...(input || {}) }
  payload.transaction_type = normalizeTransactionType(payload.transaction_type)

  // Ensure we populate a consistent location_name field
  payload.location_name = payload.location_name || payload.location || payload.to_location || payload.from_location || payload.office_location || "Unknown"

  if (!payload.created_at) payload.created_at = new Date().toISOString()

  return payload
}

export async function recordTransaction(supabaseClient: any, input: TransactionPayload) {
  const payload = buildTransactionPayload(input)
  try {
    const { data, error } = await supabaseClient.from("stock_transactions").insert(payload)
    if (error) {
      console.warn("[v0] Could not record normalized transaction:", error)
      return { error }
    }
    return { data }
  } catch (e) {
    console.error("[v0] recordTransaction error:", e)
    return { error: e }
  }
}
