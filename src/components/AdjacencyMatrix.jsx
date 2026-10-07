export default function AdjacencyMatrix({ graph }) {
  const { vertices, matrix } = graph.getAdjacencyMatrix();
  return (
    <div>
      <div
        className="matrix-scroll"
        tabIndex="0"
        role="region"
        aria-label="Adjacency matrix, scroll horizontally on small screens"
      >
        <table className="matrix-table">
          <caption>
            Rows: source · Columns: destination · 1 = connected, 0 = no edge
          </caption>
          <thead>
            <tr>
              <th scope="col">From / To</th>
              {vertices.map(({ id, name, short }) => (
                <th scope="col" key={id}>
                  <abbr title={name}>{short}</abbr>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vertices.map(({ id, name, short }, row) => (
              <tr key={id}>
                <th scope="row">
                  <abbr title={name}>{short}</abbr>
                </th>
                {matrix[row].map((value, column) => (
                  <td
                    key={vertices[column].id}
                    className={value ? "connected-cell" : ""}
                    title={`${name} → ${vertices[column].name}: ${value ? "direct edge" : "no direct edge"}`}
                  >
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="matrix-key">
        {vertices.map(({ id, name, short }) => (
          <span key={id}>
            <b>{short}</b> {name}
          </span>
        ))}
      </div>
    </div>
  );
}
