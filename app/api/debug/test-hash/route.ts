import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"

// This is a test endpoint to generate and verify bcrypt hashes
export async function GET(request: NextRequest) {
  try {
    const password = "qcc@123"
    
    // Generate a new bcrypt hash
    const salt = await bcrypt.genSalt(10)
    const newHash = await bcrypt.hash(password, salt)
    
    console.log("[v0] Generated new bcrypt hash for qcc@123:", newHash)
    
    // Test if the hash can be verified
    const isValid = await bcrypt.compare(password, newHash)
    console.log("[v0] Hash verification test:", isValid)
    
    // Also test with the hash we've been using
    const testHash = "$2a$10$G.FJ1.s48TG2c2fMn3L2I.r5z1x9LhfLq0KuFx8nqDjwDrpUxDH4e"
    const isTestValid = await bcrypt.compare(password, testHash)
    console.log("[v0] Test hash verification:", isTestValid)
    
    return NextResponse.json({
      password: password,
      newHash: newHash,
      newHashValid: isValid,
      testHash: testHash,
      testHashValid: isTestValid,
      message: "Hash generation test complete"
    })
  } catch (error) {
    console.error("[v0] Hash test error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
