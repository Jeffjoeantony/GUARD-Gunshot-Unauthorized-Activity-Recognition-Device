export const getLatestAlert = async () => {
  const res = await fetch("http://localhost:5000/api/latest-alert")
  return res.json()
}
