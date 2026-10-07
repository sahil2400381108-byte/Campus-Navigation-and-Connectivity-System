import { useState } from "react";
import useTraversal from "../hooks/useTraversal.js";
import CampusGraph from "./CampusGraph.jsx";
import RepresentationPanel from "./RepresentationPanel.jsx";
import TraversalPanel from "./TraversalPanel.jsx";
import ConnectivityPanel from "./ConnectivityPanel.jsx";

export default function Workspace({ graph }) {
  const playback = useTraversal(graph);
  const [connection, setConnection] = useState(null);
  const [checking, setChecking] = useState(false);
  const [highlightOwner, setHighlightOwner] = useState("traversal");
  const visited = playback.order.slice(0, playback.count);
  const highlight =
    connection ||
    (highlightOwner === "traversal" && visited.length
      ? {
          kind: "traversal",
          nodes: visited,
          method: playback.method,
          current: ["playing", "paused"].includes(playback.status)
            ? visited.at(-1)
            : null,
          status: playback.status,
        }
      : null);
  function clear() {
    playback.reset();
    setConnection(null);
  }
  return (
    <div className="workspace-grid">
      <CampusGraph
        graph={graph}
        type={graph.type}
        highlight={highlight}
        onClear={clear}
        busy={checking || playback.status === "requesting"}
        onPause={playback.pause}
        onResume={playback.resume}
      />
      <RepresentationPanel graph={graph} type={graph.type} />
      <TraversalPanel
        graph={graph}
        playback={playback}
        disabled={checking}
        onRun={(method) => {
          setHighlightOwner("traversal");
          setConnection(null);
          playback.run(method);
        }}
        onStartChange={(value) => {
          setHighlightOwner("traversal");
          setConnection(null);
          playback.changeStart(value);
        }}
      />
      <ConnectivityPanel
        graph={graph}
        onHighlight={setConnection}
        onClear={() => {
          setHighlightOwner("connectivity");
          setConnection(null);
        }}
        disabled={playback.busy}
        onBusyChange={setChecking}
      />
    </div>
  );
}
