"""Verify the Flask API transports the unchanged Python graph results."""

import os
from pathlib import Path
import queue
import subprocess
import sys
import threading
import unittest
from urllib.request import urlopen
import json

from flask import Flask

from campus_graph import create_campus_graph
from server import app


class ServerTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def post(self, payload):
        response = self.client.post("/api/graph", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["Cache-Control"], "no-store")
        return response.get_json()

    def test_wsgi_app_and_health_routes(self):
        self.assertIsInstance(app, Flask)
        for route in ("/health", "/api/health"):
            response = self.client.get(route)
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.get_json(), {"status": "ok"})

    def test_graph_and_representations_match_python_in_all_modes(self):
        for mode in ("undirected", "directed", "weighted"):
            with self.subTest(mode=mode):
                expected = create_campus_graph(mode).snapshot()
                actual = self.post({"type": mode, "action": "graph"})
                self.assertEqual(actual, expected)
                self.assertEqual(set(actual), {
                    "directed", "vertices", "edges", "adjacencyList", "adjacencyMatrix",
                })

    def test_traversals_match_python_for_every_start_and_mode(self):
        for mode in ("undirected", "directed", "weighted"):
            graph = create_campus_graph(mode)
            for start in graph.vertices:
                for method in ("bfs", "dfs"):
                    with self.subTest(mode=mode, start=start, action=method):
                        actual = self.post({"type": mode, "action": method, "start": start})
                        self.assertEqual(actual, getattr(graph, method)(start))

    def test_connectivity_matches_python_for_every_pair_and_mode(self):
        for mode in ("undirected", "directed", "weighted"):
            graph = create_campus_graph(mode)
            for source in graph.vertices:
                for destination in graph.vertices:
                    with self.subTest(mode=mode, source=source, destination=destination):
                        actual = self.post({
                            "type": mode, "action": "connectivity",
                            "source": source, "destination": destination,
                        })
                        self.assertEqual(actual, graph.check_connectivity(source, destination))

    def test_default_graph_mode_is_preserved(self):
        self.assertEqual(self.post({"action": "graph"}), create_campus_graph().snapshot())

    def test_cors_on_operations_health_and_preflight(self):
        origin = "https://campus-frontend.vercel.app"
        response = self.client.post("/api/graph", json={"action": "bfs", "start": "gate"},
                                    headers={"Origin": origin})
        self.assertEqual(response.headers.get("Access-Control-Allow-Origin"), origin)
        response = self.client.options("/api/graph", headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("Access-Control-Allow-Origin"), origin)
        self.assertIn("POST", response.headers["Access-Control-Allow-Methods"])
        self.assertIn("Content-Type", response.headers["Access-Control-Allow-Headers"])
        for route in ("/health", "/api/health"):
            response = self.client.get(route, headers={"Origin": origin})
            self.assertEqual(response.headers.get("Access-Control-Allow-Origin"), origin)

    def test_validation_errors_keep_the_json_error_envelope(self):
        cases = [
            ([], "The request must be an object."),
            ({"action": "missing"}, "Unknown graph operation."),
            ({"action": "graph", "type": "missing"}, "Unknown graph type: missing"),
            ({"action": "bfs", "start": "missing"}, "Unknown vertex: missing"),
            ({"action": "dfs", "start": "missing"}, "Unknown vertex: missing"),
            ({"action": "connectivity", "source": "missing", "destination": "gate"}, "Unknown vertex: missing"),
        ]
        for payload, message in cases:
            response = self.client.post("/api/graph", json=payload)
            self.assertEqual(response.status_code, 400)
            self.assertEqual(response.get_json(), {"error": message})
        for data in (b"", b"x" * 4097):
            response = self.client.post("/api/graph", data=data)
            self.assertEqual(response.status_code, 400)
            self.assertEqual(response.get_json(), {"error": "Invalid request size."})
        response = self.client.post("/api/graph", data=b"{broken")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(set(response.get_json()), {"error"})
        response = self.client.get("/unknown")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.get_json(), {"error": "Not found."})

    def test_environment_port_and_local_ready_signal(self):
        # Use a real local HTTP socket: npm run dev relies on this startup line.
        process = subprocess.Popen(
            [sys.executable, "-u", "server.py", "--host", "127.0.0.1"],
            cwd=Path(__file__).resolve().parent,
            env={**os.environ, "PORT": "0"},
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
        )
        output = queue.Queue()
        reader = threading.Thread(target=lambda: output.put(process.stdout.readline()), daemon=True)
        reader.start()
        try:
            line = output.get(timeout=10).strip()
            prefix = "CAMPUS_PYTHON_READY:"
            self.assertTrue(line.startswith(prefix), line)
            url = line.removeprefix(prefix)
            self.assertNotEqual(url.rsplit(":", 1)[1], "0")
            with urlopen(f"{url}/health", timeout=5) as response:
                self.assertEqual(json.load(response), {"status": "ok"})
        finally:
            process.terminate()
            process.communicate(timeout=10)
            reader.join(timeout=1)


if __name__ == "__main__":
    unittest.main()
