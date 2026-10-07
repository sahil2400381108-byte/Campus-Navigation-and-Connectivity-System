import { useEffect, useRef, useState } from "react";
import { runGraphOperation } from "../data/campusGraph.js";
import LocationSelect from "./LocationSelect.jsx";
import Icon from "./Icon.jsx";

export default function ConnectivityPanel({
  graph,
  onHighlight,
  onClear,
  disabled = false,
  onBusyChange,
}) {
  const [source, setSource] = useState("gate");
  const [destination, setDestination] = useState("library");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const generation = useRef(0);
  useEffect(
    () => () => {
      generation.current += 1;
    },
    [],
  );
  function update(setter, value) {
    setter(value);
    setResult(null);
    setError("");
    onClear();
  }
  async function check() {
    const ticket = ++generation.current;
    setBusy(true);
    onBusyChange(true);
    setResult(null);
    onClear();
    setError("");
    try {
      const next = await runGraphOperation(graph.type, "connectivity", {
        source,
        destination,
      });
      if (ticket !== generation.current) return;
      setResult(next);
      onHighlight({
        kind: next.connected ? "path" : "traversal",
        nodes: next.connected ? next.path : next.order,
        path: next.path,
      });
    } catch (problem) {
      if (ticket === generation.current) setError(problem.message);
    } finally {
      if (ticket === generation.current) {
        setBusy(false);
        onBusyChange(false);
      }
    }
  }
  return (
    <section
      id="connectivity"
      className="card connectivity-card"
      aria-labelledby="connectivity-title"
    >
      <div className="card-heading">
        <div>
          <div className="eyebrow">04</div>
          <h2 id="connectivity-title">Connectivity check</h2>
        </div>
        <span className="heading-icon">
          <Icon name="both" size={21} />
        </span>
      </div>
      <div className="panel-body">
        <LocationSelect
          id="source-location"
          label="Source location"
          value={source}
          graph={graph}
          disabled={busy || disabled}
          onChange={(value) => update(setSource, value)}
        />
        <LocationSelect
          id="destination-location"
          label="Destination location"
          value={destination}
          graph={graph}
          disabled={busy || disabled}
          onChange={(value) => update(setDestination, value)}
        />
        <button
          className="button primary full-width"
          disabled={busy || disabled}
          aria-label="Check Connectivity"
          onClick={check}
        >
          {busy ? "Checking connection…" : "Check Connectivity"}
          {busy ? (
            <span className="spinner small" />
          ) : (
            <Icon name="arrow" size={17} />
          )}
        </button>
        {disabled && (
          <p className="control-hint">
            Finish or reset the traversal to check a connection.
          </p>
        )}
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <div aria-live="polite" aria-atomic="true">
          {result ? (
            <div
              className={`connectivity-result ${result.connected ? "success" : "unreachable"}`}
            >
              <h3>
                <Icon name={result.connected ? "check" : "info"} />
                {result.connected ? "Connected" : "Not Connected"}
              </h3>
              <p>
                {result.connected
                  ? source === destination
                    ? "The source and destination are the same vertex."
                    : "A path exists from source to destination."
                  : "No path reaches the destination in the current graph direction."}
              </p>
              <h4>
                {result.connected
                  ? "BFS discovery path"
                  : "Locations explored by BFS"}
              </h4>
              <ol className="path-sequence">
                {(result.connected ? result.path : result.order).map(
                  (id, index) => (
                    <li key={id}>
                      {index > 0 && <span aria-hidden="true">→</span>}
                      {graph.vertices.get(id).name}
                    </li>
                  ),
                )}
              </ol>
            </div>
          ) : null}
        </div>
        <div className="connectivity-note">
          <Icon name="info" size={17} />
          <p>Connectivity uses BFS. Distances are not used to choose a path.</p>
        </div>
      </div>
    </section>
  );
}
