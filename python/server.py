"""Minimal localhost bridge to the plain Python DSA module. Standard library only."""
import argparse
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from campus_graph import create_campus_graph


def execute(request):
    if not isinstance(request, dict):
        raise ValueError("The request must be an object.")
    graph = create_campus_graph(request.get("type", "undirected"))
    action = request.get("action")
    if action == "graph":
        return graph.snapshot()
    if action == "bfs":
        return graph.bfs(request.get("start"))
    if action == "dfs":
        return graph.dfs(request.get("start"))
    if action == "connectivity":
        return graph.check_connectivity(request.get("source"), request.get("destination"))
    raise ValueError("Unknown graph operation.")


class CampusServer(ThreadingHTTPServer):
    # Browser tabs can open several requests together (including React dev checks).
    request_queue_size = 64


class Handler(BaseHTTPRequestHandler):
    def respond(self, status, data):
        payload = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def do_POST(self):
        if self.path != "/api/graph":
            self.respond(404, {"error": "Not found."})
            return
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if not 0 < size <= 4096:
                raise ValueError("Invalid request size.")
            self.respond(200, execute(json.loads(self.rfile.read(size))))
        except (ValueError, TypeError, KeyError) as error:
            self.respond(400, {"error": str(error)})

    def do_GET(self):
        self.respond(200 if self.path == "/api/health" else 404,
                     {"status": "ok"} if self.path == "/api/health" else {"error": "Not found."})

    def log_message(self, *_args):
        pass


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    server = CampusServer(("127.0.0.1", args.port), Handler)
    print(f"CAMPUS_PYTHON_READY:http://127.0.0.1:{server.server_port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
