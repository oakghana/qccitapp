import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const password = "qcc@123"
    console.log("[v0] Generating bcryptjs hash for password:", password)
    
    // Generate hash with bcryptjs using salt rounds 10
    const hash = await bcrypt.hash(password, 10)
    console.log("[v0] Generated hash:", hash)
    
    // Test the hash
    const isValid = await bcrypt.compare(password, hash)
    console.log("[v0] Hash verification test:", isValid)
    
    return NextResponse.json({
      password,
      hash,
      verified: isValid,
      rounds: 10,
      library: "bcryptjs"
    })
  } catch (error) {
    console.error("[v0] Error generating hash:", error)
    return NextResponse.json({ error: error.toString() }, { status: 500 })
  }
}
