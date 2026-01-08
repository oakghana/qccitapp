import bcrypt from "bcryptjs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function resetAllPasswords() {
  console.log("[v0] Starting password reset for all approved users...")

  // Generate bcryptjs hash for 'qcc@123'
  const newPasswordHash = await bcrypt.hash("qcc@123", 10)
  console.log("[v0] Generated bcryptjs hash for qcc@123")

  // Fetch all approved users
  const usersResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?status=eq.approved&select=username,email,role`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  })

  const users = await usersResponse.json()
  console.log(`[v0] Found ${users.length} approved users`)

  // Update each user's password
  for (const user of users) {
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?username=eq.${user.username}`, {
      method: "PATCH",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString(),
      }),
    })

    if (updateResponse.ok) {
      console.log(`[v0] ✓ Reset password for ${user.username}`)
    } else {
      console.error(`[v0] ✗ Failed to reset password for ${user.username}`)
    }
  }

  console.log("[v0] Password reset complete!")
}

resetAllPasswords().catch(console.error)
