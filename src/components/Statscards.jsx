import { useEffect, useState } from "react"
import { getLatestAlert } from "../services/api"

const Statscards = () => {
  const [alert, setAlert] = useState(null)

  useEffect(() => {
    getLatestAlert()
      .then(setAlert)
      .catch(console.error)
  }, [])

  const formatTime = (timestamp) => {
    if (!timestamp) return "--"
    return new Date(timestamp * 1000).toLocaleString()
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

      {/* LATEST ALERT CARD */}
      <div className="bg-white p-6 rounded-xl text-black shadow-md">
        <h3 className="text-sm text-gray-500 mb-4">
          Latest Alert
        </h3>

        {alert ? (
          <div className="space-y-2">
            <p className="text-lg font-semibold capitalize">
              Type: <span className="font-bold">{alert.type}</span>
            </p>

            <p className="text-md">
              Confidence:{" "}
              <span className="font-bold">
                {(alert.confidence * 100).toFixed(0)}%
              </span>
            </p>

            <p className="text-sm text-gray-600">
              Time: {formatTime(alert.timestamp)}
            </p>
          </div>
        ) : (
          <p className="text-gray-400">Loading...</p>
        )}
      </div>

    </div>
  )
}

export default Statscards
