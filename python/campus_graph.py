"""Campus graph operations using only adjacency lists, matrices, BFS, and DFS.

This module is independent of the user interface and uses Python's standard library.
Distances are stored on edges for display; traversals never use them.
"""

from collections import deque


LOCATIONS = [
    {"id": "gate", "name": "Main Gate", "short": "MG", "x": 90, "y": 190, "labelDy": -40},
    {"id": "admin", "name": "Admin Block", "short": "AB", "x": 275, "y": 95, "labelDy": -40},
    {"id": "library", "name": "Library", "short": "LI", "x": 480, "y": 95, "labelDy": -40},
    {"id": "lab", "name": "Computer Lab", "short": "CL", "x": 685, "y": 95, "labelDy": -40},
    {"id": "canteen", "name": "Canteen", "short": "CA", "x": 480, "y": 270, "labelDy": 48},
    {"id": "auditorium", "name": "Auditorium", "short": "AU", "x": 685, "y": 340, "labelDy": 48},
    {"id": "classroom", "name": "Classroom Block", "short": "CB", "x": 275, "y": 270, "labelDy": 48},
    {"id": "parking", "name": "Parking", "short": "PA", "x": 90, "y": 365, "labelDy": 48},
    {"id": "playground", "name": "Playground", "short": "PG", "x": 480, "y": 445, "labelDy": 48},
]

EDGES = [
    ("gate", "admin", 100),
    ("parking", "gate", 80),
    ("admin", "library", 120),
    ("admin", "classroom", 90),
    ("library", "lab", 75),
    ("library", "canteen", 60),
    ("classroom", "canteen", 85),
    ("classroom", "playground", 140),
    ("canteen", "auditorium", 110),
    ("playground", "auditorium", 130),
    ("lab", "auditorium", 100),
    ("gate", "classroom", 150),
]


class Graph:
    """A simple graph; dictionary insertion order makes traversals reproducible."""

    def __init__(self, directed=False):
        self.directed = directed
        self.vertices = {}
        self.adjacency = {}
        self.edges = []

    def add_vertex(self, vertex_id, **metadata):
        if not vertex_id:
            raise ValueError("A vertex requires an id.")
        if vertex_id not in self.vertices:
            self.vertices[vertex_id] = {**metadata, "id": vertex_id}
            self.adjacency[vertex_id] = {}
        return self

    def require_vertex(self, vertex_id):
        if vertex_id not in self.vertices:
            raise ValueError(f"Unknown vertex: {vertex_id}")

    def add_edge(self, source, destination, weight=1):
        self.require_vertex(source)
        self.require_vertex(destination)
        if not isinstance(weight, (int, float)) or not 0 <= weight < float("inf"):
            raise ValueError("Weight must be a finite nonnegative number.")
        # Each neighbor maps to a distance. Two-way paths add a reverse entry.
        self.adjacency[source][destination] = weight
        if not self.directed:
            self.adjacency[destination][source] = weight
        for edge in self.edges:
            same = edge["from"] == source and edge["to"] == destination
            reverse = not self.directed and edge["from"] == destination and edge["to"] == source
            if same or reverse:
                edge["weight"] = weight
                break
        else:
            self.edges.append({"from": source, "to": destination, "weight": weight})
        return self

    def adjacency_list(self):
        return [
            {"vertex": dict(vertex), "neighbors": [
                {"id": neighbor, "weight": weight}
                for neighbor, weight in self.adjacency[vertex_id].items()
            ]}
            for vertex_id, vertex in self.vertices.items()
        ]

    def adjacency_matrix(self):
        # A row is the source and a column is the destination. Entries remain binary.
        return {
            "vertices": list(self.vertices.values()),
            "matrix": [
                [int(destination in self.adjacency[source]) for destination in self.vertices]
                for source in self.vertices
            ],
        }

    def bfs(self, start, destination=None):
        """Explore level by level with a FIFO queue; optionally stop at a target."""
        self.require_vertex(start)
        if destination is not None:
            self.require_vertex(destination)
        queue = deque([start])
        visited = {start}
        parents = {start: None}
        order = []
        while queue:
            current = queue.popleft()
            order.append(current)
            if current == destination:
                break
            for neighbor in self.adjacency[current]:
                if neighbor not in visited:
                    # Mark on enqueue so cycles cannot add duplicate queue entries.
                    visited.add(neighbor)
                    parents[neighbor] = current
                    queue.append(neighbor)
        return {"order": order, "parents": parents}

    def dfs(self, start):
        """Explore each branch recursively, backtracking after its neighbors."""
        self.require_vertex(start)
        visited = set()
        order = []

        def visit(current):
            visited.add(current)
            order.append(current)
            for neighbor in self.adjacency[current]:
                if neighbor not in visited:
                    visit(neighbor)

        visit(start)
        return {"order": order}

    def check_connectivity(self, source, destination):
        result = self.bfs(source, destination)
        parents = result["parents"]
        if destination not in parents:
            return {"connected": False, "path": [], "order": result["order"]}
        # Parent pointers reconstruct the BFS discovery path, ignoring distances.
        path = []
        current = destination
        while current is not None:
            path.append(current)
            current = parents[current]
        return {"connected": True, "path": path[::-1], "order": result["order"]}

    def snapshot(self):
        return {
            "directed": self.directed,
            "vertices": list(self.vertices.values()),
            "edges": self.edges,
            "adjacencyList": self.adjacency_list(),
            "adjacencyMatrix": self.adjacency_matrix(),
        }


def create_campus_graph(graph_type="undirected"):
    if graph_type not in ("undirected", "directed", "weighted"):
        raise ValueError(f"Unknown graph type: {graph_type}")
    graph = Graph(directed=graph_type == "directed")
    for location in LOCATIONS:
        metadata = dict(location)
        vertex_id = metadata.pop("id")
        graph.add_vertex(vertex_id, **metadata)
    for source, destination, distance in EDGES:
        graph.add_edge(source, destination, distance)
    return graph
