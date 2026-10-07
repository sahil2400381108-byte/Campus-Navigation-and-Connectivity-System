export default function AdjacencyList({ graph, weighted }) {
  return (
    <>
      <div className="list-column-labels">
        <span>LOCATION</span>
        <span>DIRECT CONNECTIONS</span>
      </div>
      <dl className="adjacency-list">
        {graph.getAdjacencyList().map(({ vertex, neighbors }) => (
          <div className="adjacency-row" key={vertex.id}>
            <dt>
              <span className="location-code">{vertex.short}</span>
              {vertex.name}
            </dt>
            <dd>
              <span className="adjacency-arrow" aria-hidden="true">
                →
              </span>
              <div className="neighbor-list">
                {neighbors.length ? (
                  neighbors.map(({ id, weight }) => (
                    <span className="neighbor-chip" key={id}>
                      {graph.vertices.get(id).name}
                      {weighted && <small>{weight} m</small>}
                    </span>
                  ))
                ) : (
                  <span className="no-neighbors">No outgoing connections</span>
                )}
              </div>
            </dd>
          </div>
        ))}
      </dl>
    </>
  );
}
