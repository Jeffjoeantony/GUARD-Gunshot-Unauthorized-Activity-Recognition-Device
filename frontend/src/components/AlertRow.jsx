import { useNavigate } from "react-router-dom";

const AlertRow = ({ alert }) => {

  const navigate = useNavigate();

  const coords = alert.location
    ? alert.location.split(",").map(Number)
    : [10.8505, 76.2711];

  return (
    <tr>
      <td>{alert.id}</td>
      <td>{alert.type}</td>
      <td>{Math.round(alert.confidence * 100)}%</td>
      <td>{alert.deviceId}</td>
      <td>{new Date(alert.timestamp * 1000).toLocaleString()}</td>
      <td className="status new">New</td>

      <td>
        {alert.location ? (
          <button
            onClick={() => navigate("/map", { state: { coords } })}
            style={{
              background: "none",
              border: "none",
              color: "#00aaff",
              cursor: "pointer",
              textDecoration: "underline"
            }}
          >
            View Map
          </button>
        ) : (
          "No Location"
        )}
      </td>

    </tr>
  );
};

export default AlertRow;