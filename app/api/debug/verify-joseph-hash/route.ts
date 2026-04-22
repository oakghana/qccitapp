import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co")
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-build-key")
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  try {
    // Fetch Joseph's current hash
    const { data: user } = await supabase
      .from("profiles")
      .select("username, email, password_hash")
      .eq("email", "joseph.asante@qccgh.com")
      .single()

    if (!user) {
      return NextResponse.json({ error: "User not found" })
    }

    const testPassword = "qcc@123"
    
    console.log("[v0] Testing hash verification")
    console.log("[v0] Current hash:", user.password_hash)
    console.log("[v0] Testing password:", testPassword)
    
    const isValid = await bcrypt.compare(testPassword, user.password_hash)
    
    console.log("[v0] Hash verification result:", isValid)
    
    // Generate a new hash for comparison
    const newHash = await bcrypt.hash(testPassword, 10)
    console.log("[v0] Newly generated hash:", newHash)
    
    const newHashVerify = await bcrypt.compare(testPassword, newHash)
    console.log("[v0] New hash verification:", newHashVerify)
    
    return NextResponse.json({
      username: user.username,
      currentHash: user.password_hash,
      currentHashValid: isValid,
      newlyGeneratedHash: newHash,
      newHashValid: newHashVerify,
      testPassword: testPassword
    })
  } catch (error: any) {
    console.error("[v0] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
