import LocationSelect from "./LocationSelect.jsx";
import Icon from "./Icon.jsx";

export default function TraversalPanel({
  graph,
  playback,
  disabled,
  onRun,
  onStartChange,
}) {
  const { start, method, order, count, status, busy, error } = playback;
  const hasResult = order.length > 0;
  const current = order[count - 1];
  const complete = status === "complete";
  return (
    <section
      id="traversals"
      className="card traversal-card"
      aria-labelledby="traversal-title"
    >
      <div className="card-heading">
        <div>
          <div className="eyebrow">03</div>
          <h2 id="traversal-title">Graph traversal</h2>
        </div>
        <span className={`state-tag ${busy ? "is-running" : ""}`}>
          <i />
          {status === "requesting"
            ? "Preparing"
            : status === "playing"
              ? "Running"
              : status === "paused"
                ? "Paused"
                : complete
                  ? "Complete"
                  : "Ready to explore"}
        </span>
      </div>
      <div className="panel-body">
        <LocationSelect
          id="traversal-start"
          label="Starting location"
          value={start}
          graph={graph}
          disabled={busy || disabled}
          onChange={onStartChange}
        />
        <div className="traversal-actions">
          {["BFS", "DFS"].map((algorithm) => (
            <button
              key={algorithm}
              className={`button ${algorithm === "BFS" ? "primary" : "secondary"}`}
              disabled={busy || disabled}
              onClick={() => onRun(algorithm)}
              aria-label={`Run ${algorithm}`}
            >
              <span
                className={busy && method === algorithm ? "spinner small" : ""}
              >
                {!(busy && method === algorithm) && (
                  <Icon name="play" size={15} />
                )}
              </span>
              {busy && method === algorithm
                ? `${status === "paused" ? "Paused" : "Running"} ${algorithm}`
                : `Run ${algorithm}`}
            </button>
          ))}
        </div>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <div className={`traversal-result ${hasResult ? "has-result" : ""}`}>
          {hasResult ? (
            <>
              <div className="result-heading">
                <h3>
                  {method === "BFS"
                    ? "Breadth First Search (BFS)"
                    : "Depth First Search (DFS)"}
                </h3>
                <span>
                  {count}
                  <em> / {order.length}</em>
                </span>
              </div>
              <div
                className="playback-progress"
                role="progressbar"
                aria-label="Traversal progress"
                aria-valuemin={0}
                aria-valuemax={order.length}
                aria-valuenow={count}
              >
                <span style={{ width: `${(count / order.length) * 100}%` }} />
              </div>
              <div className="playback-status" role="status" aria-live="polite">
                {complete ? (
                  <>
                    <Icon name="check" size={15} />
                    {count} of {graph.vertices.size} locations reached
                  </>
                ) : (
                  <>
                    <span
                      className={`live-dot ${status === "paused" ? "paused" : ""}`}
                    />
                    {status === "paused" ? "Paused at" : "Visiting"}{" "}
                    <strong>{graph.vertices.get(current).name}</strong>
                  </>
                )}
              </div>
              <ol className="visit-list" aria-label={`${method} visit order`}>
                {order.slice(0, count).map((id, index) => (
                  <li
                    className={
                      !complete && index === count - 1 ? "current-visit" : ""
                    }
                    key={id}
                    data-vertex={id}
                  >
                    <span className="visit-index">{index + 1}</span>
                    {graph.vertices.get(id).name}
                  </li>
                ))}
              </ol>
              <div className="playback-controls">
                {!complete ? (
                  <>
                    <button
                      className="text-button"
                      onClick={
                        status === "paused" ? playback.resume : playback.pause
                      }
                    >
                      <Icon
                        name={status === "paused" ? "play" : "pause"}
                        size={14}
                      />
                      {status === "paused" ? "Resume" : "Pause"}
                    </button>
                    <button className="text-button" onClick={playback.finish}>
                      Show full result
                      <Icon name="skip" size={14} />
                    </button>
                  </>
                ) : (
                  <span className="result-caption">
                    Visit order from {graph.vertices.get(start).name}
                  </span>
                )}
              </div>
              {!complete && (
                <a href="#campus" className="follow-graph">
                  <Icon name="graph" size={14} />
                  View animated graph
                </a>
              )}
              {complete && order.length < graph.vertices.size && (
                <p className="reachability-note">
                  <Icon name="info" size={14} />
                  {graph.vertices.size - order.length} location(s) cannot be
                  reached from this starting point.
                </p>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-network" aria-hidden="true">
                <span />
                <i />
                <span />
                <i />
                <span />
              </div>
              <h3>
                {status === "requesting"
                  ? "Preparing traversal…"
                  : "Ready to explore"}
              </h3>
              <p>
                {status === "requesting"
                  ? "Loading visit order."
                  : "Select a location and run BFS or DFS."}
              </p>
            </div>
          )}
        </div>
        <div className="algorithm-notes">
          <div>
            <span>BFS</span>
            <p>
              Level by level <small>Queue</small>
            </p>
          </div>
          <div>
            <span>DFS</span>
            <p>
              Branch by branch <small>Recursion</small>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
