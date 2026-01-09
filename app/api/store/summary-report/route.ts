import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    },
  )

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || (profile.role !== "admin" && profile.role !== "it_store_head")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  // Calculate date ranges
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastYear = new Date(now.getFullYear() - 1, 0, 1)
  const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59)

  // Fetch all stock items with current levels
  const { data: items, error: itemsError } = await supabase.from("store_items").select("*").order("name")

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  // Build summary report
  const summaryData = await Promise.all(
    items.map(async (item) => {
      // Get quantity procured last year
      const { data: lastYearData } = await supabase
        .from("store_items")
        .select("quantity")
        .eq("id", item.id)
        .gte("created_at", lastYear.toISOString())
        .lte("created_at", endOfLastYear.toISOString())
        .single()

      const quantityProcuredLastYear = lastYearData?.quantity || 0

      // Get quantity issued this month (from transfer history or assignments)
      const { data: thisMonthIssues } = await supabase
        .from("store_items")
        .select("quantity")
        .eq("id", item.id)
        .gte("updated_at", startOfMonth.toISOString())

      const quantityIssuedThisMonth = item.initial_quantity - item.quantity // Assuming quantity reduction = issued

      // Calculate quantity required (reorder_level - current_stock if below reorder)
      const quantityRequired = item.quantity < item.reorder_level ? item.reorder_level - item.quantity : 0

      return {
        itemName: item.name,
        category: item.category,
        quantityProcuredLastYear,
        quantityIssuedThisMonth,
        currentStock: item.quantity,
        reorderLevel: item.reorder_level,
        quantityRequired,
        unitPrice: item.unit_price,
        totalValue: item.quantity * item.unit_price,
        location: item.location,
        status: item.quantity === 0 ? "Out of Stock" : item.quantity < item.reorder_level ? "Low Stock" : "In Stock",
      }
    }),
  )

  return NextResponse.json({ report: summaryData })
}
