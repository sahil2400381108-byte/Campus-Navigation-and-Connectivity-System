# Campus Navigation and Connectivity System

A complete interactive campus graph website with a React/Vite interface and **Python DSA logic**. Nine campus locations are vertices; twelve campus paths are edges.

## Run the website

Requirements: Node.js 22.12+ and Python 3.10+ on PATH.

```bash
python -m pip install -r python/requirements.txt
npm install
npm run dev
```

Open the local URL printed by Vite, normally **http://127.0.0.1:5173**. This command starts both the website and the small local Python process. Press Ctrl+C to stop them. Do not open `index.html` directly or use Live Server; those do not start React or Python.

## What the website demonstrates

- **Undirected graph:** every campus path works both ways.
- **Directed graph:** follow arrowheads. Parking → Main Gate is allowed; Main Gate → Parking is not reachable.
- **Weighted graph:** two-way paths display distances in metres. Distances are never used to select a path.
- **Adjacency list:** neighbors directly reachable from each location, with weights in weighted mode.
- **Adjacency matrix:** rows are sources, columns are destinations; 1 means an edge exists and 0 means it does not. It stays binary in weighted mode.
- **BFS:** Python `collections.deque` implements a FIFO queue; locations are visited level by level.
- **DFS:** Python recursion explores each branch before backtracking.
- **Connectivity:** BFS determines reachability and reconstructs a discovery path from parent pointers.

Select a starting location and run BFS or DFS to see numbered visits on the graph. Visit order is not a continuous walking path: consecutive traversal entries need not share an edge. Connectivity results highlight an actual BFS discovery path. Changing graph mode clears previous results. In directed mode, connectivity always means reachability **from the selected source to the selected destination**.

### Traversal playback

The frontend reveals the exact Python visit order one node every 600 ms. The active node, numbered results, and progress indicator stay synchronized. Pause/resume from the result panel or graph, use **Show full result** to finish immediately, or use the graph reset button to clear playback. Changing graph mode safely discards previous requests and timers. Connectivity controls are disabled during playback so two operations cannot compete for the graph highlights.

On smaller screens, **View animated graph** jumps from the traversal panel to the graph, where playback can also be paused. The interface respects the operating system's reduced-motion preference: it disables decorative motion and displays complete traversal results immediately. Representation tabs support arrow keys, Home, and End.

## Python code for your project demonstration

All graph data, vertex/edge creation, representations, BFS, DFS, and connectivity are implemented in `python/campus_graph.py`. React only renders the Python results. `python/server.py` is a Flask communication layer with CORS enabled, usable both locally and through Gunicorn on Render. The DSA module itself requires only Python's standard library. There are no external data APIs, databases, accounts, or extra graph algorithms.

You can optionally run `python/demo.py` in an IDE, or:

```bash
python python/demo.py
```

To change the campus, edit `LOCATIONS` and `EDGES` in `python/campus_graph.py`, then restart the app. Neighbor insertion order determines the deterministic traversal order. Weighted mode uses the same two-way connections as undirected mode.

## Project structure

```text
python/
  campus_graph.py       # Graph class, campus data, BFS, DFS, connectivity
  server.py             # Flask API, CORS, and local startup
  requirements.txt      # Flask, flask-cors, gunicorn
  demo.py               # Optional IDE/terminal demonstration
  test_campus_graph.py  # DSA correctness tests
  test_server.py        # API compatibility, CORS, health, and startup tests
scripts/
  dev.mjs               # Starts and stops Python + Vite together
src/
  components/           # Graph, representations, selectors, traversal, connectivity
  hooks/useTraversal.js # Visual playback of Python results; no graph algorithms
  data/campusGraph.js   # Requests Python results; no DSA implementation
  App.jsx
  main.jsx
  styles.css
tests/campus.spec.js    # Browser interaction tests
tests/playback.spec.js  # Frame/order, pause/reset, race, and responsive checks
```

## Verification and production preview

```bash
npm test
npm run test:ui
npm run build
npm run preview
```

Browser tests use installed Google Chrome by default. If Chrome is unavailable, install Playwright Chromium using `npx playwright install chromium`, then set `PLAYWRIGHT_CHANNEL=chromium` before running tests (PowerShell: `$env:PLAYWRIGHT_CHANNEL='chromium'`). Tests cover the real Python-backed interface, representations, both traversal orders, directionality, distances, connectivity, connection failure recovery, and mobile layout.

`npm run preview` starts Python and serves the production build. Because the algorithms run in Python, the website needs its local Python process; the `dist` folder alone cannot execute graph operations.

## Flask API and local server

From the project root, install the backend dependencies and start the server:

```bash
python -m pip install -r python/requirements.txt
python python/server.py
```

The default port is **8765**. The server reads the `PORT` environment variable; `--port` overrides it. You can also pass `--host`. `npm run dev` still starts Flask and Vite together, using an automatically assigned local Flask port. Direct Python startup uses Werkzeug's development server; Render uses Gunicorn.

| Method | Route | Response / purpose |
|---|---|---|
| GET | `/health` | `{"status":"ok"}`; Render health check |
| GET | `/api/health` | `{"status":"ok"}`; existing health route |
| POST | `/api/graph` | Existing graph operations, selected by JSON `action` |
| OPTIONS | `/api/graph` | Automatic CORS preflight for cross-origin POST requests |

Flask also supplies automatic OPTIONS responses and HEAD support on the two GET routes. CORS accepts browser origins without requiring credentials.

All graph requests use the same endpoint and retain their existing JSON structures:

| JSON request | Returned fields |
|---|---|
| `{"type":"undirected","action":"graph"}` | `directed`, `vertices`, `edges`, `adjacencyList`, `adjacencyMatrix` |
| `{"type":"undirected","action":"bfs","start":"gate"}` | `order`, `parents` |
| `{"type":"undirected","action":"dfs","start":"gate"}` | `order` |
| `{"type":"undirected","action":"connectivity","source":"gate","destination":"library"}` | `connected`, `path`, `order` |

The `type` can be `undirected`, `directed`, or `weighted`. Validation errors retain HTTP 400 and the `{"error":"message"}` envelope; requests are limited to 4096 bytes. Campus data and calculation code are unchanged.

## Deploy the backend to Render

Create a **Python Web Service** with these settings:

- **Root directory:** `python`
- **Build command:** `pip install -r requirements.txt`
- **Start command:** `gunicorn server:app --bind 0.0.0.0:$PORT`
- **Health check path:** `/health`

With `python` as the service root, `gunicorn server:app` imports the Flask `app` from `server.py`. The explicit bind uses Render's assigned port and listens on all interfaces. Gunicorn runs on Linux (Render); use the Python startup command above on Windows. See [Render's Flask deployment guide](https://render.com/docs/deploy-flask) and [Flask's Gunicorn guide](https://flask.palletsprojects.com/en/stable/deploying/gunicorn/).

## Connect the Vercel frontend to Render

After Render provides your backend URL, set this environment variable in the Vercel frontend project:

```text
VITE_API_BASE_URL=https://your-campus-backend.onrender.com
```

Use the backend origin, without `/api/graph`. **Redeploy the Vercel frontend** after setting it; Vite reads this variable at build time. Requests will then go directly to the Render Flask API, which permits CORS. Leave it empty locally to retain the Vite proxy. `.env.example` documents the setting; no deployed URL is hardcoded.

## DSA complexity

For V vertices and E edges, BFS and DFS take O(V + E) time and O(V) auxiliary space. The adjacency list requires O(V + E) storage; the binary adjacency matrix requires O(V²) storage. DFS uses the recursion call stack; BFS uses a queue and a visited set. Connectivity adds parent pointers to reconstruct the discovered path without computing distances.
