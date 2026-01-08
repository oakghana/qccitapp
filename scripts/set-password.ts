// Script to set password for ohemengappiah@qccgh.com
async function setPassword() {
  const response = await fetch("/api/admin/set-user-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "ohemengappiah@qccgh.com",
      password: "ghana",
    }),
  })

  const result = await response.json()
  console.log("Result:", result)
}

setPassword()
