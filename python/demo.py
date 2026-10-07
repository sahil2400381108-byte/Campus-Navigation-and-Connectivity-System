"""Run this file in any Python IDE to demonstrate the graph DSA concepts."""
from campus_graph import create_campus_graph


def show_names(graph, ids):
    return " -> ".join(graph.vertices[vertex]["name"] for vertex in ids)


def main():
    for mode in ("undirected", "directed", "weighted"):
        graph = create_campus_graph(mode)
        print(f"\n{'=' * 65}\n{mode.upper()} GRAPH\n{'=' * 65}")
        print("\nAdjacency List:")
        for item in graph.adjacency_list():
            neighbors = [graph.vertices[n["id"]]["name"] + (f' ({n["weight"]} m)' if mode == "weighted" else "") for n in item["neighbors"]]
            print(f'{item["vertex"]["name"]}: {", ".join(neighbors) or "No outgoing edges"}')
        print("\nAdjacency Matrix (row = source, column = destination):")
        representation = graph.adjacency_matrix()
        print("    " + " ".join(v["short"] for v in representation["vertices"]))
        for vertex, row in zip(representation["vertices"], representation["matrix"]):
            print(f'{vertex["short"]:>2}  ' + "  ".join(map(str, row)))
        print("\nBreadth First Search (BFS) from Main Gate:")
        print(show_names(graph, graph.bfs("gate")["order"]))
        print("\nDepth First Search (DFS) from Main Gate:")
        print(show_names(graph, graph.dfs("gate")["order"]))
        for source, destination in (("gate", "library"), ("gate", "parking")):
            result = graph.check_connectivity(source, destination)
            print(f'\n{graph.vertices[source]["name"]} -> {graph.vertices[destination]["name"]}: ' + ("Connected" if result["connected"] else "Not Connected"))
            if result["connected"]:
                print("BFS discovery path: " + show_names(graph, result["path"]))


if __name__ == "__main__":
    main()
