"""Run with: python -m unittest discover -s python -v"""

import unittest

from campus_graph import Graph, create_campus_graph


class CampusGraphTests(unittest.TestCase):
    def test_sample_bfs_order(self):
        graph = create_campus_graph()
        self.assertEqual(graph.bfs("gate")["order"], [
            "gate", "admin", "parking", "classroom", "library", "canteen",
            "playground", "lab", "auditorium",
        ])

    def test_sample_dfs_order(self):
        graph = create_campus_graph()
        self.assertEqual(graph.dfs("gate")["order"], [
            "gate", "admin", "library", "lab", "auditorium", "canteen",
            "classroom", "playground", "parking",
        ])

    def test_matrix_matches_list_in_every_mode(self):
        for mode in ("undirected", "directed", "weighted"):
            with self.subTest(mode=mode):
                graph = create_campus_graph(mode)
                representation = graph.adjacency_matrix()
                ids = list(graph.vertices)
                for row, source in enumerate(ids):
                    for column, destination in enumerate(ids):
                        expected = int(destination in graph.adjacency[source])
                        self.assertEqual(representation["matrix"][row][column], expected)
                        if mode != "directed":
                            self.assertEqual(expected, representation["matrix"][column][row])

    def test_direction_and_unreachable_destination(self):
        graph = create_campus_graph("directed")
        self.assertEqual(graph.check_connectivity("parking", "gate")["path"], ["parking", "gate"])
        self.assertFalse(graph.check_connectivity("gate", "parking")["connected"])
        self.assertEqual(graph.bfs("auditorium")["order"], ["auditorium"])
        self.assertEqual(len(graph.bfs("gate")["order"]), 8)

    def test_bfs_discovery_path(self):
        for mode in ("undirected", "directed", "weighted"):
            graph = create_campus_graph(mode)
            result = graph.check_connectivity("gate", "library")
            self.assertTrue(result["connected"])
            self.assertEqual(result["path"], ["gate", "admin", "library"])

    def test_same_vertex(self):
        graph = create_campus_graph("directed")
        self.assertEqual(graph.check_connectivity("parking", "parking"), {
            "connected": True, "path": ["parking"], "order": ["parking"],
        })

    def test_cycles_isolation_and_self_loop(self):
        graph = Graph()
        for vertex in ("a", "b", "c", "isolated"):
            graph.add_vertex(vertex)
        graph.add_edge("a", "b").add_edge("b", "c").add_edge("c", "a").add_edge("a", "a")
        self.assertEqual(graph.bfs("a")["order"], ["a", "b", "c"])
        self.assertEqual(graph.dfs("a")["order"], ["a", "b", "c"])
        self.assertFalse(graph.check_connectivity("a", "isolated")["connected"])

    def test_weights_do_not_change_traversals(self):
        graph = create_campus_graph("weighted")
        expected_bfs = graph.bfs("gate")["order"]
        expected_dfs = graph.dfs("gate")["order"]
        graph.add_edge("gate", "admin", 99999)
        self.assertEqual(graph.bfs("gate")["order"], expected_bfs)
        self.assertEqual(graph.dfs("gate")["order"], expected_dfs)
        self.assertEqual(graph.adjacency["admin"]["gate"], 99999)
        self.assertEqual(len(graph.edges), 12)

    def test_invalid_input(self):
        graph = create_campus_graph()
        for action in (lambda: graph.bfs("missing"), lambda: graph.dfs("missing"),
                       lambda: graph.add_edge("gate", "missing"),
                       lambda: graph.add_edge("gate", "admin", -1),
                       lambda: graph.add_edge("gate", "admin", float("nan")),
                       lambda: graph.check_connectivity("gate", "missing"),
                       lambda: create_campus_graph("unknown")):
            with self.assertRaises(ValueError):
                action()

    def test_all_pairs_paths_follow_real_edges(self):
        for mode in ("undirected", "directed", "weighted"):
            graph = create_campus_graph(mode)
            for source in graph.vertices:
                reachable = set(graph.bfs(source)["order"])
                self.assertEqual(set(graph.dfs(source)["order"]), reachable)
                for destination in graph.vertices:
                    result = graph.check_connectivity(source, destination)
                    self.assertEqual(result["connected"], destination in reachable)
                    if result["connected"]:
                        self.assertEqual(result["path"][0], source)
                        self.assertEqual(result["path"][-1], destination)
                        for a, b in zip(result["path"], result["path"][1:]):
                            self.assertIn(b, graph.adjacency[a])


if __name__ == "__main__":
    unittest.main()
