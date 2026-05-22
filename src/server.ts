import app from "@/app"
import env from "@/env"

app.listen(env.PORT, async () => {
  console.log(`Server running on port ${env.PORT}`)
})
