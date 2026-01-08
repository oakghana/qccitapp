import bcrypt from "bcryptjs"

// This script generates bcryptjs hashes for the default password
// Run this to get the hash values to update in the database

const password = "qcc@123"
const saltRounds = 10

async function generateHash() {
  console.log("Generating bcryptjs hash for password: qcc@123")
  const hash = await bcrypt.hash(password, saltRounds)
  console.log("\nGenerated hash:", hash)
  console.log("\nRun this SQL to update all user passwords:")
  console.log(`
UPDATE profiles
SET password_hash = '${hash}',
    updated_at = NOW()
WHERE status = 'approved';
  `)

  // Test the hash
  const isValid = await bcrypt.compare(password, hash)
  console.log("\nHash validation test:", isValid ? "PASSED" : "FAILED")
}

generateHash()
