const AlertFilters = ({ setFilterType }) => {
  return (
    <div className="filters">
      <button onClick={() => setFilterType("All")}>All</button>
      <button onClick={() => setFilterType("Gunshot")}>Gunshot</button>
      <button onClick={() => setFilterType("Chainsaw")}>Chainsaw</button>
      <button onClick={() => setFilterType("Ambient")}>Ambient</button>
    </div>
  );
};

export default AlertFilters;
