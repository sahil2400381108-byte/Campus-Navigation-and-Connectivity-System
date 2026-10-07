import { graphTypes } from "../data/campusGraph.js";
import Icon from "./Icon.jsx";

export default function CampusGraph({
  graph,
  type,
  highlight,
  onClear,
  busy,
  onPause,
  onResume,
}) {
  const activeNodes = highlight?.nodes || [];
  const path = highlight?.path || [];
  const isPathEdge = (from, to) =>
    path.some(
      (id, index) =>
        index > 0 &&
        ((path[index - 1] === from && id === to) ||
          (!graph.directed && path[index - 1] === to && id === from)),
    );

  return (
    <section
      id="campus"
      className="card campus-card"
      aria-labelledby="campus-title"
    >
      <div className="card-heading">
        <div>
          <div className="eyebrow">01</div>
          <h2 id="campus-title">Campus graph</h2>
        </div>
        <button
          className="icon-button"
          onClick={onClear}
          disabled={!highlight || busy}
          title="Clear graph highlights"
          aria-label="Clear graph highlights"
        >
          <Icon name="reset" />
        </button>
      </div>
      <div className="graph-canvas">
        <span className="canvas-label">
          <span className="status-dot" />
          {graphTypes.find(({ id }) => id === type).label}
        </span>
        {highlight && (
          <span className="canvas-caption">
            {highlight.method || "BFS PATH"} <span>/</span>{" "}
            {highlight.nodes.length} VISITED
          </span>
        )}
        <svg
          className="campus-svg"
          viewBox="0 0 780 535"
          role="img"
          aria-labelledby="graph-svg-title graph-svg-desc"
        >
          <title id="graph-svg-title">Campus {type} graph</title>
          <desc id="graph-svg-desc">
            Nine campus locations and twelve paths.{" "}
            {graph.directed
              ? "Arrows show permitted travel direction."
              : "All paths allow travel in both directions."}{" "}
            Full connections are available in the adjacency list and matrix
            below.
          </desc>
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M0 0 8 4 0 8Z" fill="#94a9c2" />
            </marker>
            <marker
              id="arrowhead-active"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M0 0 8 4 0 8Z" fill="#3469bb" />
            </marker>
          </defs>
          {graph.edges.map(({ from, to, weight }, edgeIndex) => {
            const a = graph.vertices.get(from),
              b = graph.vertices.get(to);
            const length = Math.hypot(b.x - a.x, b.y - a.y);
            const dx = (b.x - a.x) / length,
              dy = (b.y - a.y) / length;
            const active = isPathEdge(from, to);
            return (
              <g
                className="edge-enter"
                style={{ "--delay": `${edgeIndex * 25}ms` }}
                key={`${type}-${from}-${to}`}
              >
                <line
                  pathLength="1"
                  x1={a.x + dx * 27}
                  y1={a.y + dy * 27}
                  x2={b.x - dx * 31}
                  y2={b.y - dy * 31}
                  className={`graph-edge ${active ? "active" : ""}`}
                  markerEnd={
                    graph.directed
                      ? `url(#arrowhead${active ? "-active" : ""})`
                      : undefined
                  }
                />
                {type === "weighted" && (
                  <g
                    className="edge-weight"
                    transform={`translate(${(a.x + b.x) / 2}, ${(a.y + b.y) / 2})`}
                  >
                    <rect x="-27" y="-11" width="54" height="22" rx="6" />
                    <text textAnchor="middle" dominantBaseline="central">
                      {weight} m
                    </text>
                  </g>
                )}
              </g>
            );
          })}
          {[...graph.vertices.values()].map((vertex, nodeIndex) => {
            const index = activeNodes.indexOf(vertex.id);
            return (
              <g
                key={vertex.id}
                className={`graph-node ${index >= 0 ? "visited" : ""} ${highlight?.current === vertex.id ? "current" : ""} ${highlight?.status === "paused" ? "is-paused" : ""}`}
                data-vertex={vertex.id}
                style={{ "--delay": `${nodeIndex * 35}ms` }}
                transform={`translate(${vertex.x}, ${vertex.y})`}
              >
                <title>
                  {vertex.name}
                  {index >= 0 ? ` — visit ${index + 1}` : ""}
                </title>
                <circle className="current-ring" r="36" />
                <circle className="node-halo" r="32" />
                <circle className="node-circle" r="25" />
                <text
                  className="node-code"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {vertex.short}
                </text>
                <text
                  className="node-label"
                  y={vertex.labelDy}
                  textAnchor="middle"
                >
                  {vertex.name}
                </text>
                {index >= 0 && (
                  <g transform="translate(23,-23)">
                    <circle className="visit-badge" r="10" />
                    <text
                      className="visit-number"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {index + 1}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      {highlight?.current && (
        <div className="graph-playback-status">
          <span>
            <span
              className={`live-dot ${highlight.status === "paused" ? "paused" : ""}`}
            />
            {highlight.status === "paused" ? "Paused at" : "Visiting"}{" "}
            <strong>{graph.vertices.get(highlight.current).name}</strong>
          </span>
          <button
            className="text-button"
            onClick={highlight.status === "paused" ? onResume : onPause}
          >
            <Icon
              name={highlight.status === "paused" ? "play" : "pause"}
              size={13}
            />
            {highlight.status === "paused"
              ? "Resume playback"
              : "Pause playback"}
          </button>
        </div>
      )}
      <div className="graph-footer">
        <div className="legend">
          <span>
            <i className="legend-node" />
            Location
          </span>
          <span>
            <i className="legend-edge" />
            Campus path
          </span>
          {highlight && (
            <span>
              <i className="legend-node highlighted" />
              {highlight.kind === "path" ? "BFS path" : "Visited"}
            </span>
          )}
        </div>
        <span className="graph-count">
          {graph.vertices.size} vertices <span>·</span> {graph.edges.length}{" "}
          edges
        </span>
      </div>
      {highlight && (
        <p className="graph-highlight-note">
          <Icon name="info" size={14} />
          {highlight?.kind === "path"
            ? "Highlighted: BFS discovery path. Numbers show the path order."
            : highlight
              ? "Numbers show visit order; consecutive visits may not share an edge."
              : "Run a traversal to follow the visit order, or check a connection to reveal its path."}
        </p>
      )}
    </section>
  );
}
