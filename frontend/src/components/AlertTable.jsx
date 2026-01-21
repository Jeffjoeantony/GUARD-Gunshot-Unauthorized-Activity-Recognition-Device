import AlertRow from "./AlertRow";
import "../styles/alertTable.css";


const AlertTable = ({ alerts }) => (
  <table className="alert-table">
  <thead>
    <tr>
      <th>ID</th>
      <th>Sound Type</th>
      <th>Confidence</th>
      <th>Device</th>
      <th>Timestamp</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    {alerts.map(alert => (
      <AlertRow key={alert.id} alert={alert} />
    ))}
  </tbody>
</table>

);

export default AlertTable;
