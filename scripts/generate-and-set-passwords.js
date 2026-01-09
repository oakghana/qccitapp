import bcryptjs from "bcryptjs"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function resetAllPasswords() {
  try {
    console.log("[v0] Starting password reset for all users...")

    // Generate proper bcryptjs hash for "ghana@1"
    const password = "ghana@1"
    const saltRounds = 10
    const hash = await bcryptjs.hash(password, saltRounds)

    console.log('[v0] Generated hash for "ghana@1":', hash.substring(0, 20) + "...")

    // Get all approved and active users
    const { data: users, error: fetchError } = await supabase
      .from("profiles")
      .select("username, full_name, role")
      .eq("status", "approved")
      .eq("is_active", true)

    if (fetchError) {
      console.error("[v0] Error fetching users:", fetchError)
      return
    }

    console.log(`[v0] Found ${users.length} users to update`)

    // Update each user's password
    let successCount = 0
    let failCount = 0

    for (const user of users) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          password_hash: hash,
          updated_at: new Date().toISOString(),
        })
        .eq("username", user.username)

      if (updateError) {
        console.error(`[v0] Failed to update ${user.username}:`, updateError.message)
        failCount++
      } else {
        console.log(`[v0] ✓ Updated password for ${user.username} (${user.full_name})`)
        successCount++
      }
    }

    console.log("\n[v0] Password reset complete!")
    console.log(`[v0] Success: ${successCount} users`)
    console.log(`[v0] Failed: ${failCount} users`)
    console.log("\n[v0] All users can now login with password: ghana@1")

    // Verify the first user
    const { data: verifyUser } = await supabase
      .from("profiles")
      .select("username, password_hash")
      .eq("username", "ohemengappiah@qccgh.com")
      .single()

    if (verifyUser) {
      console.log("\n[v0] Verification for ohemengappiah@qccgh.com:")
      console.log("[v0] Hash preview:", verifyUser.password_hash.substring(0, 20) + "...")

      // Test the hash
      const isValid = await bcryptjs.compare("ghana@1", verifyUser.password_hash)
      console.log("[v0] Password verification test:", isValid ? "PASS ✓" : "FAIL ✗")
    }
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
  }
}

resetAllPasswords()
