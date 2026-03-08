const AlertRow = ({ alert }) => {
  return (
    <tr>
      <td>{alert.id}</td>
      <td>{alert.type}</td>
      <td>{Math.round(alert.confidence * 100)}%</td>
      <td>{alert.deviceId}</td>
      <td>{new Date(alert.timestamp * 1000).toLocaleString()}</td>
      <td className={`status new`}>New</td>
      <td>
  {alert.latitude ? (
    <a
      href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      View Map
    </a>
  ) : (
    "No Location"
  )}
</td>
    </tr>
  );
};

export default AlertRow;
