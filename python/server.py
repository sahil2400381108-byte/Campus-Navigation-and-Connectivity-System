"""Flask communication layer for the campus graph module.

Local: python python/server.py
Render (root directory: python): gunicorn server:app --bind 0.0.0.0:$PORT
All graph calculations remain in campus_graph.py.
"""

import argparse
import json
import os

from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.exceptions import RequestEntityTooLarge
from werkzeug.serving import make_server

from campus_graph import create_campus_graph


app = Flask(__name__, static_folder=None)
app.json.sort_keys = False
app.config["MAX_CONTENT_LENGTH"] = 4096
# The API contains only public sample campus data and does not use credentials.
CORS(app, resources={r"/api/*": {"origins": "*"}, r"/health": {"origins": "*"}})


def execute(payload):
    """Dispatch existing request actions without changing their result shapes."""
    if not isinstance(payload, dict):
        raise ValueError("The request must be an object.")
    graph = create_campus_graph(payload.get("type", "undirected"))
    action = payload.get("action")
    if action == "graph":
        return graph.snapshot()
    if action == "bfs":
        return graph.bfs(payload.get("start"))
    if action == "dfs":
        return graph.dfs(payload.get("start"))
    if action == "connectivity":
        return graph.check_connectivity(payload.get("source"), payload.get("destination"))
    raise ValueError("Unknown graph operation.")


@app.after_request
def prevent_stale_results(response):
    response.headers["Cache-Control"] = "no-store"
    return response


@app.get("/health")
@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/api/graph")
def graph_operation():
    try:
        # Match the existing server's payload limit and JSON error envelope.
        data = request.get_data(cache=False)
        if not 0 < len(data) <= app.config["MAX_CONTENT_LENGTH"]:
            raise ValueError("Invalid request size.")
        return jsonify(execute(json.loads(data)))
    except (ValueError, TypeError, KeyError) as error:
        return jsonify({"error": str(error)}), 400


@app.errorhandler(RequestEntityTooLarge)
def payload_too_large(_error):
    return jsonify({"error": "Invalid request size."}), 400


@app.errorhandler(404)
def not_found(_error):
    return jsonify({"error": "Not found."}), 404


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", "8765")))
    parser.add_argument("--host", default="0.0.0.0")
    args = parser.parse_args()
    # Werkzeug is Flask's development server. Binding first lets the existing
    # Node launcher learn the actual port when it requests an available port (0).
    server = make_server(args.host, args.port, app, threaded=True)
    print(f"CAMPUS_PYTHON_READY:http://127.0.0.1:{server.server_port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
