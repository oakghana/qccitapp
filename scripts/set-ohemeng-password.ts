import bcrypt from "bcryptjs"

// Generate bcryptjs hash for "ghana"
const password = "ghana"
const saltRounds = 10

bcrypt.hash(password, saltRounds).then((hash) => {
  console.log('[v0] Generated bcryptjs hash for "ghana":')
  console.log(hash)
  console.log("\nUse this hash in the SQL UPDATE query")
})
