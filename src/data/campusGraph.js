// JavaScript only adapts Python results for display. All graph logic is in Python.
export const graphTypes = [
  {
    id: "undirected",
    label: "Undirected Graph",
    description: "Two-way paths · edges can be explored in either direction.",
  },
  {
    id: "directed",
    label: "Directed Graph",
    description: "One-way paths · follow the arrows to explore the campus.",
  },
  {
    id: "weighted",
    label: "Weighted Graph",
    description: "Two-way paths with distances · weights are for display only.",
  },
];

export async function runGraphOperation(type, action, parameters = {}) {
  try {
    const response = await fetch("/api/graph", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, action, ...parameters }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("Graph operation failed.");
    return await response.json();
  } catch {
    throw new Error(
      "Cannot reach the local Python program. Restart the app with npm run dev and try again.",
    );
  }
}

export async function createCampusGraph(type) {
  const data = await runGraphOperation(type, "graph");
  return {
    type,
    directed: data.directed,
    vertices: new Map(data.vertices.map((vertex) => [vertex.id, vertex])),
    edges: data.edges,
    getAdjacencyList: () => data.adjacencyList,
    getAdjacencyMatrix: () => data.adjacencyMatrix,
  };
}
