function SendToken({ isEnabled }) {
  return (
    <section className="tool-panel">
      <div className="panel-heading">
        <p className="card-label">Transfer</p>
        <h2>Send ERC42</h2>
      </div>

      <form className="form-stack">
        <label>
          Recipient address
          <input placeholder="0x..." disabled={!isEnabled} />
        </label>
        <label>
          Amount
          <input placeholder="0.0" inputMode="decimal" disabled={!isEnabled} />
        </label>
        <button className="primary-button" type="button" disabled={!isEnabled}>
          Send
        </button>
      </form>
    </section>
  );
}

export default SendToken;
