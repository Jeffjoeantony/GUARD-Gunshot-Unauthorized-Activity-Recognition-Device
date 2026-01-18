const express = require("express")
const cors = require("cors")
const db = require("./firebase")

const app = express()
app.use(cors())
app.use(express.json())

// Health check
app.get("/", (req, res) => {
  res.send("Backend running")
})

/**
 * GET latest alert
 */
app.get("/api/latest-alert", async (req, res) => {
  try {
    const snapshot = await db
      .collection("alerts")
      .orderBy("timestamp", "desc")
      .limit(1)
      .get()

    if (snapshot.empty) {
      return res.json(null)
    }

    res.json(snapshot.docs[0].data())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET 
 */
app.get("/api/alert-stats", async (req, res) => {
  try {
    const snapshot = await db.collection("alerts").get()

    const totalAlerts = snapshot.size
    let alertsToday = 0
    let confidenceSum = 0

    const now = Date.now() / 1000
    const last24h = now - 86400

    snapshot.forEach(doc => {
      const data = doc.data()
      confidenceSum += data.confidence
      if (data.timestamp >= last24h) alertsToday++
    })

    const avgConfidence =
      totalAlerts === 0 ? 0 : confidenceSum / totalAlerts

    res.json({
      totalAlerts,
      alertsToday,
      avgConfidence,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// POST

app.post("/api/alerts", async (req, res) => {
  try {
    const { type, confidence, deviceId } = req.body

    if (!type || confidence === undefined) {
      return res.status(400).json({ error: "Invalid data" })
    }

    const alert = {
      type,
      confidence,
      deviceId: deviceId || "unknown",
      timestamp: Math.floor(Date.now() / 1000)
    }

    await db.collection("alerts").add(alert)

    res.json({ message: "Alert saved", alert })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


const PORT = 5000
app.listen(PORT, () =>
  console.log(`Backend running on http://localhost:${PORT}`)
)
