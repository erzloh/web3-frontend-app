function Faucet({ isEnabled }) {
  return (
    <section className="tool-panel">
      <div className="panel-heading">
        <p className="card-label">Faucet</p>
        <h2>Claim test tokens</h2>
      </div>

      <div className="faucet-body">
        <p>100 E42 per claim</p>
        <button className="secondary-button" type="button" disabled={!isEnabled}>
          Claim E42
        </button>
      </div>
    </section>
  );
}

export default Faucet;
