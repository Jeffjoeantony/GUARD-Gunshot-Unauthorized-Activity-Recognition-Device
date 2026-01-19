const AlertRow = ({ alert }) => {
  return (
    <tr>
      <td>{alert.id}</td>
      <td>{alert.type}</td>
      <td>{Math.round(alert.confidence * 100)}%</td>
      <td>{alert.deviceId}</td>
      <td>{new Date(alert.timestamp * 1000).toLocaleString()}</td>
      <td className={`status new`}>New</td>
    </tr>
  );
};

export default AlertRow;
