require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./firebase");
const { createClient } = require("@supabase/supabase-js");

const app = express();

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// Manual OPTIONS handler — app.options wildcard breaks on Express 5 + path-to-regexp v8
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const requireAdmin = async (req, res, next) => {
  const token = (req.headers.authorization || "").replace("Bearer ", "").trim();
  if (!token) return res.status(401).json({ error: "Unauthorized: no token provided" });

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: "Unauthorized: invalid or expired token" });

  const role = user.user_metadata?.role;
  if (role !== "admin") return res.status(403).json({ error: "Forbidden: admin access required" });

  req.adminUser = user;
  next();
};

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

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.get("/api/admin/users", requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw error;
    res.json(data.users.map(mapUser));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/users", requireAdmin, async (req, res) => {
  try {
    const { email, password, full_name, username, role, status } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password required" });

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
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

app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, username, role, status } = req.body;

    const { data: existing, error: fetchErr } = await supabaseAdmin.auth.admin.getUserById(id);
    if (fetchErr) throw fetchErr;

    const currentMeta = existing.user?.user_metadata || {};
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

app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/user/password", async (req, res) => {
  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "").trim();
    if (!token) return res.status(401).json({ error: "No authorization token provided." });

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: "Invalid or expired session. Please log in again." });

    const { password } = req.body;
    if (!password || password.length < 8)
      return res.status(400).json({ error: "Password must be at least 8 characters." });

    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password });
    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

/* ─────────────────────────────────────────────────────────────────
   DEVICE REGISTRY  –  Firestore `devices` collection
   Fields: name, deviceId, location, status, addedAt, notes
──────────────────────────────────────────────────────────────────*/

// GET /api/devices — public, used by user analytics + admin dashboard
app.get("/api/devices", async (req, res) => {
  try {
    const snapshot = await db.collection("devices").orderBy("addedAt", "desc").get();
    const devices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(devices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/devices — register a new IoT node (admin only)
app.post("/api/admin/devices", requireAdmin, async (req, res) => {
  try {
    const { name, deviceId, location, status, notes } = req.body;
    if (!name || !deviceId) return res.status(400).json({ error: "name and deviceId are required" });

    const device = {
      name:      name.trim(),
      deviceId:  deviceId.trim(),
      location:  location  || "",
      status:    status    || "online",
      notes:     notes     || "",
      addedAt:   Math.floor(Date.now() / 1000),
    };

    const ref = await db.collection("devices").add(device);
    res.json({ id: ref.id, ...device });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/devices/:id — update a device (admin only)
app.patch("/api/admin/devices/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, deviceId, location, status, notes } = req.body;

    const updates = {};
    if (name      !== undefined) updates.name      = name.trim();
    if (deviceId  !== undefined) updates.deviceId  = deviceId.trim();
    if (location  !== undefined) updates.location  = location;
    if (status    !== undefined) updates.status    = status;
    if (notes     !== undefined) updates.notes     = notes;

    await db.collection("devices").doc(id).update(updates);
    const updated = await db.collection("devices").doc(id).get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/devices/:id — remove a device (admin only)
app.delete("/api/admin/devices/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection("devices").doc(id).delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, "0.0.0.0", () => {
  console.log("Backend running on port 5000");
});