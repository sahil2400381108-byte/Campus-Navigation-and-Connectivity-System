import { useState } from "react";
import AdjacencyList from "./AdjacencyList.jsx";
import AdjacencyMatrix from "./AdjacencyMatrix.jsx";
import Icon from "./Icon.jsx";

export default function RepresentationPanel({ graph, type }) {
  const [view, setView] = useState("list");
  function handleKeys(event) {
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const next =
        event.key === "Home"
          ? "list"
          : event.key === "End"
            ? "matrix"
            : view === "list"
              ? "matrix"
              : "list";
      setView(next);
      document.getElementById(`tab-${next}`).focus();
    }
  }
  return (
    <section
      id="representations"
      className="card representation-card"
      aria-labelledby="representation-title"
    >
      <div className="card-heading">
        <div>
          <div className="eyebrow">02</div>
          <h2 id="representation-title">Graph representations</h2>
        </div>
        <span className="small-badge">
          {type === "weighted"
            ? "Weighted · Two-way"
            : graph.directed
              ? "One-way edges"
              : "Two-way edges"}
        </span>
      </div>
      <div
        className="representation-tabs"
        role="tablist"
        aria-label="Graph representation"
        onKeyDown={handleKeys}
      >
        {["list", "matrix"].map((id) => (
          <button
            role="tab"
            key={id}
            id={`tab-${id}`}
            aria-selected={view === id}
            aria-controls={`panel-${id}`}
            tabIndex={view === id ? 0 : -1}
            onClick={() => setView(id)}
          >
            <Icon name={id} />
            Adjacency {id === "list" ? "List" : "Matrix"}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        key={view}
        id={`panel-${view}`}
        aria-labelledby={`tab-${view}`}
        className="representation-body tab-entrance"
        tabIndex={0}
      >
        {view === "list" ? (
          <AdjacencyList graph={graph} weighted={type === "weighted"} />
        ) : (
          <AdjacencyMatrix graph={graph} />
        )}
      </div>
      <div className="card-footnote">
        <Icon name="info" size={15} />
        {view === "list"
          ? "Each vertex lists the locations directly reachable by an edge."
          : "The matrix shows direct edges, not reachability through multiple edges."}
      </div>
    </section>
  );
}
