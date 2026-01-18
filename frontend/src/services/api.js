const API_BASE = "http://localhost:5000/api"

export const getLatestAlert = async () => {
  const res = await fetch(`${API_BASE}/latest-alert`)
  return res.json()
}

export const getAlertStats = async () => {
  const res = await fetch(`${API_BASE}/alert-stats`)
  return res.json()
}
