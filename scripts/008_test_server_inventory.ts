import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function testServerInventory() {
  console.log("[v0] Starting server inventory test...")

  // Step 1: Add two servers to inventory
  console.log("\n[v0] Step 1: Adding two servers to device inventory...")

  const server1 = {
    device_type: "Server",
    brand: "Dell",
    model: "PowerEdge R750",
    serial_number: "SRV-2026-001",
    asset_tag: "QCCIT-SRV-001",
    purchase_date: "2026-01-01",
    warranty_expiry: "2029-01-01",
    location: "Head Office",
    status: "available",
    assigned_to: null,
    condition: "new",
    notes: "High-performance server for data center",
  }

  const server2 = {
    device_type: "Server",
    brand: "HP",
    model: "ProLiant DL380 Gen11",
    serial_number: "SRV-2026-002",
    asset_tag: "QCCIT-SRV-002",
    purchase_date: "2026-01-01",
    warranty_expiry: "2029-01-01",
    location: "Head Office",
    status: "available",
    assigned_to: null,
    condition: "new",
    notes: "Backup server for redundancy",
  }

  const { data: devices, error: devicesError } = await supabase.from("devices").insert([server1, server2]).select()

  if (devicesError) {
    console.error("[v0] Error adding servers:", devicesError)
    return
  }

  console.log("[v0] Successfully added servers:")
  console.log("  - Server 1:", devices[0].asset_tag, "-", devices[0].model)
  console.log("  - Server 2:", devices[1].asset_tag, "-", devices[1].model)

  // Step 2: Create a requisition for Kumasi region
  console.log("\n[v0] Step 2: Creating requisition for Kumasi region...")

  const requisition = {
    requested_by: "ohemengappiah@qccgh.com", // Replace with actual user ID
    location: "Kumasi",
    items: [
      {
        item_id: devices[0].id,
        item_name: `${devices[0].brand} ${devices[0].model}`,
        quantity: 1,
        unit_price: 15000,
        purpose: "Regional data center upgrade",
      },
    ],
    status: "pending",
    priority: "high",
    notes: "Required for new regional office IT infrastructure",
    total_estimated_cost: 15000,
  }

  const { data: reqData, error: reqError } = await supabase.from("store_requisitions").insert([requisition]).select()

  if (reqError) {
    console.error("[v0] Error creating requisition:", reqError)
    return
  }

  console.log("[v0] Successfully created requisition:")
  console.log("  - Requisition ID:", reqData[0].id)
  console.log("  - Location:", reqData[0].location)
  console.log("  - Status:", reqData[0].status)
  console.log("  - Items:", reqData[0].items.length)

  // Step 3: Verify data
  console.log("\n[v0] Step 3: Verifying data in database...")

  const { data: allServers, error: verifyError } = await supabase
    .from("devices")
    .select("*")
    .eq("device_type", "Server")
    .order("created_at", { ascending: false })
    .limit(2)

  if (verifyError) {
    console.error("[v0] Error verifying servers:", verifyError)
    return
  }

  console.log("[v0] Servers in database:", allServers.length)
  allServers.forEach((server, index) => {
    console.log(`  ${index + 1}. ${server.asset_tag} - ${server.brand} ${server.model} (${server.status})`)
  })

  const { data: allReqs, error: reqVerifyError } = await supabase
    .from("store_requisitions")
    .select("*")
    .eq("location", "Kumasi")
    .order("created_at", { ascending: false })
    .limit(1)

  if (reqVerifyError) {
    console.error("[v0] Error verifying requisition:", reqVerifyError)
    return
  }

  console.log("[v0] Requisitions for Kumasi:", allReqs.length)
  if (allReqs.length > 0) {
    console.log(`  - Status: ${allReqs[0].status}`)
    console.log(`  - Priority: ${allReqs[0].priority}`)
    console.log(`  - Total Cost: GHS ${allReqs[0].total_estimated_cost}`)
  }

  console.log("\n[v0] ✅ Server inventory test completed successfully!")
}

testServerInventory().catch(console.error)
