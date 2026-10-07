# Campus Navigation and Connectivity System

A complete interactive campus graph website with a React/Vite interface and **Python DSA logic**. Nine campus locations are vertices; twelve campus paths are edges.

## Run the website

Requirements: Node.js 22.12+ and Python 3.10+ on PATH. No third-party Python packages are needed.

```bash
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

All graph data, vertex/edge creation, representations, BFS, DFS, and connectivity are implemented in `python/campus_graph.py`. React only renders the Python results. `python/server.py` uses Python's standard library to connect the website to those operations over localhost. There are no external APIs, databases, accounts, or extra graph algorithms.

You can optionally run `python/demo.py` in an IDE, or:

```bash
python python/demo.py
```

To change the campus, edit `LOCATIONS` and `EDGES` in `python/campus_graph.py`, then restart the app. Neighbor insertion order determines the deterministic traversal order. Weighted mode uses the same two-way connections as undirected mode.

## Project structure

```text
python/
  campus_graph.py       # Graph class, campus data, BFS, DFS, connectivity
  server.py             # Small local bridge to the website
  demo.py               # Optional IDE/terminal demonstration
  test_campus_graph.py  # DSA correctness tests
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

## DSA complexity

For V vertices and E edges, BFS and DFS take O(V + E) time and O(V) auxiliary space. The adjacency list requires O(V + E) storage; the binary adjacency matrix requires O(V²) storage. DFS uses the recursion call stack; BFS uses a queue and a visited set. Connectivity adds parent pointers to reconstruct the discovered path without computing distances.
