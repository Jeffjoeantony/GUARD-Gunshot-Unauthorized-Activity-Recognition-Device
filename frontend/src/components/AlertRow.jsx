const AlertRow = ({ alert }) => {
  return (
    <tr>
      <td>{alert.id}</td>
      <td>{alert.type}</td>
      <td>{alert.confidence}%</td>
      <td>{alert.location}</td>
      <td>{alert.time}</td>
      <td className={`status ${alert.status.toLowerCase()}`}>
        {alert.status}
      </td>
    </tr>
  );
};

export default AlertRow;

