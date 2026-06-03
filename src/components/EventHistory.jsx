import { useEffect, useState } from "react";
import CopyableAddress from "./CopyableAddress.jsx";
import { SEPOLIA_NETWORK } from "../contracts/config.js";
import { getContractEventHistory } from "../services/token.js";

const COLLAPSED_EVENT_COUNT = 3;

function formatHistoryTimestamp(unixSeconds) {
  if (!unixSeconds) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(unixSeconds * 1000));
}

function EventHistory({ refreshKey }) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMoreEvents = events.length > COLLAPSED_EVENT_COUNT;
  const visibleEvents = isExpanded
    ? events
    : events.slice(0, COLLAPSED_EVENT_COUNT);

  useEffect(() => {
    let isActive = true;

    async function loadEvents() {
      setIsLoading(true);
      setMessage("");

      try {
        const history = await getContractEventHistory();
        if (!isActive) return;
        setEvents(history);
        setIsExpanded(false);
      } catch (error) {
        if (!isActive) return;
        setMessage(error.message || "Failed to load event history.");
        setEvents([]);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadEvents();

    return () => {
      isActive = false;
    };
  }, [refreshKey]);

  return (
    <section className="tool-panel event-history-panel">
      <div className="panel-heading">
        <p className="card-label">History</p>
        <h2>Contract events</h2>
      </div>

      <p className="card-note">
        Live log of <code>Transfer</code>, <code>Claimed</code>, and <code>Minted</code> events on Sepolia.
      </p>

      {message && <p className="card-note">{message}</p>}

      {isLoading ? (
        <div className="history-empty">Loading event history...</div>
      ) : message ? null : events.length === 0 ? (
        <div className="history-empty">No contract events found yet.</div>
      ) : (
        <>
          <ol className="history-list">
            {visibleEvents.map((event) => (
              <li key={`${event.transactionHash}-${event.logIndex}`} className="history-item">
                <div className="history-item-top">
                  <div className="history-item-heading">
                    <span className={`history-badge ${event.kind.toLowerCase()}`}>
                      {event.kind}
                    </span>
                    <strong>{event.title}</strong>
                  </div>
                  <time className="history-time">{formatHistoryTimestamp(event.timestamp)}</time>
                </div>

                <p className="history-summary">{event.subtitle}</p>

                <div className="history-grid">
                  {event.kind === "Claimed" && (
                    <div className="history-field">
                      <span className="history-label">User</span>
                      <div className="history-value history-value-address">
                        <CopyableAddress address={event.actor} />
                      </div>
                    </div>
                  )}

                  {event.kind === "Minted" && (
                    <div className="history-field">
                      <span className="history-label">Recipient</span>
                      <div className="history-value history-value-address">
                        <CopyableAddress address={event.to} />
                      </div>
                    </div>
                  )}

                  {event.kind === "Transfer" && (
                    <>
                      <div className="history-field">
                        <span className="history-label">From</span>
                        <div className="history-value history-value-address">
                          <CopyableAddress address={event.from} />
                        </div>
                      </div>
                      <div className="history-field">
                        <span className="history-label">To</span>
                        <div className="history-value history-value-address">
                          <CopyableAddress address={event.to} />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="history-field">
                    <span className="history-label">Amount</span>
                    <span className="history-value">{event.amount}</span>
                  </div>

                  <div className="history-field">
                    <span className="history-label">Block</span>
                    <span className="history-value">{event.blockNumber}</span>
                  </div>

                  <div className="history-field">
                    <span className="history-label">Tx</span>
                    <span className="history-value history-value-link">
                      <a
                        className="explorer-link"
                        href={`${SEPOLIA_NETWORK.blockExplorerUrls[0]}/tx/${event.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View on Etherscan
                      </a>
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {hasMoreEvents && (
            <div className="history-toggle-row">
              <button
                className="secondary-button history-toggle-button"
                type="button"
                onClick={() => setIsExpanded((current) => !current)}
                aria-expanded={isExpanded}
              >
                {isExpanded
                  ? "Show fewer"
                  : `Show all ${events.length} events`}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default EventHistory;
