const express = require("express")
const cors = require("cors")
const db = require("./firebase")

const app = express()
app.use(cors())
app.use(express.json())

app.get("/", (req,res) => {
    res.send("Backend running")
})

app.get("/api/latest-alert", async (req, res) => {
  try {
    const snapshot = await db
      .collection("alerts")
      .orderBy("timestamp", "desc")
      .limit(1)
      .get()

    if (snapshot.empty) {
      return res.json({ message: "No alerts yet" })
    }

    const alert = snapshot.docs[0].data()
    res.json(alert)

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const PORT = 5000
app.listen(PORT, () =>
    console.log(`Backend running on http://localhost:${PORT}`)
)