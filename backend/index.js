require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./firebase");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());

/* ── Supabase Admin Client (service role — server-side only) ── */
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/* ── Utility: map Supabase auth user → our shape ── */
const mapUser = (u) => ({
  id:          u.id,
  email:       u.email,
  full_name:   u.user_metadata?.full_name  || u.user_metadata?.name || u.email?.split("@")[0] || "—",
  username:    u.user_metadata?.username   || null,
  role:        u.user_metadata?.role       || "user",
  status:      u.user_metadata?.status     || (u.banned_until ? "banned" : "active"),
  created_at:  u.created_at,
  last_active: u.last_sign_in_at,
});


// Health check
app.get("/", (req, res) => {
  res.send("Backend running");
});


/* ══════════════════════════════════════════════
   SUPABASE ADMIN — USER MANAGEMENT ROUTES
══════════════════════════════════════════════ */

// GET all auth users
app.get("/api/admin/users", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw error;
    res.json(data.users.map(mapUser));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create a new auth user
app.post("/api/admin/users", async (req, res) => {
  try {
    const { email, password, full_name, username, role, status } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password required" });

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,          // auto-confirm so they can log in immediately
      user_metadata: {
        full_name: full_name || email.split("@")[0],
        username:  username  || null,
        role:      role      || "user",
        status:    status    || "active",
      },
    });
    if (error) throw error;
    res.json(mapUser(data.user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update a user's metadata — deep-merges so no fields are lost
app.patch("/api/admin/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, username, role, status } = req.body;

    // 1. Fetch current user to read existing metadata
    const { data: existing, error: fetchErr } = await supabaseAdmin.auth.admin.getUserById(id);
    if (fetchErr) throw fetchErr;

    const currentMeta = existing.user?.user_metadata || {};

    // 2. Merge — only overwrite fields that were explicitly passed
    const merged = {
      ...currentMeta,
      ...(full_name !== undefined && { full_name }),
      ...(username  !== undefined && { username }),
      ...(role      !== undefined && { role }),
      ...(status    !== undefined && { status }),
    };

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      user_metadata: merged,
    });
    if (error) throw error;
    res.json(mapUser(data.user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// DELETE a user
app.delete("/api/admin/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* ══════════════════════════════════════════════
   FIREBASE — ALERTS ROUTES (unchanged)
══════════════════════════════════════════════ */

// Get latest alert
app.get("/api/latest-alert", async (req, res) => {
  try {
    const snapshot = await db
      .collection("alerts")
      .orderBy("timestamp", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) return res.json(null);
    res.json(snapshot.docs[0].data());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Alert statistics
app.get("/api/alert-stats", async (req, res) => {
  try {
    const snapshot = await db.collection("alerts").get();
    const totalAlerts = snapshot.size;
    let alertsToday = 0, confidenceSum = 0;
    const last24h = Date.now() / 1000 - 86400;

    snapshot.forEach(doc => {
      const data = doc.data();
      confidenceSum += data.confidence;
      if (data.timestamp >= last24h) alertsToday++;
    });

    res.json({
      totalAlerts,
      alertsToday,
      avgConfidence: totalAlerts === 0 ? 0 : confidenceSum / totalAlerts,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all alerts
app.get("/api/alerts", async (req, res) => {
  try {
    const snapshot = await db.collection("alerts").orderBy("timestamp", "desc").get();
    const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(alerts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch alerts" });
  }
});

// Save alert
app.post("/api/alerts", async (req, res) => {
  try {
    const { type, confidence, deviceId, location } = req.body;
    if (!type || confidence === undefined) return res.status(400).json({ error: "Invalid data" });

    const alert = {
      type, confidence,
      deviceId: deviceId || "ESP32",
      location: location || "10.8505,76.2711",
      status: "Active",
      timestamp: Math.floor(Date.now() / 1000),
    };

    await db.collection("alerts").add(alert);
    res.json({ message: "Alert saved", alert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.listen(5000, "0.0.0.0", () => {
  console.log("Backend running on port 5000");
});