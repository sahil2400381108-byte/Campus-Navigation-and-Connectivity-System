import { useEffect, useState } from "react";
import { createCampusGraph, graphTypes } from "./data/campusGraph.js";
import GraphTypeSelector from "./components/GraphTypeSelector.jsx";
import Workspace from "./components/Workspace.jsx";
import Icon from "./components/Icon.jsx";

const sections = [
  ["campus", "Campus graph"],
  ["representations", "Representations"],
  ["traversals", "Traversals"],
  ["connectivity", "Connectivity"],
];

export default function App() {
  const [type, setType] = useState("undirected");
  const [graph, setGraph] = useState(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [activeSection, setActiveSection] = useState("campus");
  useEffect(() => {
    const syncSection = () => {
      const id = window.location.hash.slice(1);
      setActiveSection(
        sections.some(([section]) => section === id) ? id : "campus",
      );
    };
    syncSection();
    window.addEventListener("hashchange", syncSection);
    return () => window.removeEventListener("hashchange", syncSection);
  }, []);
  useEffect(() => {
    let cancelled = false;
    setError("");
    createCampusGraph(type)
      .then((next) => {
        if (!cancelled) setGraph(next);
      })
      .catch((problem) => {
        if (!cancelled) setError(problem.message);
      });
    return () => {
      cancelled = true;
    };
  }, [type, retry]);
  const currentGraph = graph?.type === type ? graph : null;
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to workspace
      </a>
      <header className="topbar">
        <div className="topbar-inner">
          <a href="#main" className="brand">
            <span className="brand-mark">
              <Icon name="graph" size={25} />
            </span>
            <span>
              Campus<span className="brand-light">Graph</span>
            </span>
          </a>
        </div>
      </header>
      <main id="main" className="page-shell">
        <section className="page-intro">
          <div>
            <h1>
              Campus Navigation and
              <br className="desktop-break" /> Connectivity System
              <span className="title-dot">.</span>
            </h1>
          </div>
          <div className="campus-stats" aria-label="Campus graph overview">
            <div>
              <strong>09</strong>
              <span>Locations</span>
            </div>
            <div>
              <strong>12</strong>
              <span>Paths</span>
            </div>
            <div>
              <strong>02</strong>
              <span>Traversals</span>
            </div>
          </div>
        </section>
        <nav className="section-nav" aria-label="Lab sections">
          {sections.map(([id, label], index) => (
            <a
              key={id}
              href={`#${id}`}
              aria-current={activeSection === id ? "location" : undefined}
              onClick={() => setActiveSection(id)}
            >
              <span>0{index + 1}</span>
              {label}
              <Icon name="arrow" size={14} />
            </a>
          ))}
        </nav>
        <section className="mode-toolbar" aria-label="Graph configuration">
          <div className="mode-copy">
            <span className="eyebrow">GRAPH TYPE</span>
            <p key={type}>
              {graphTypes.find(({ id }) => id === type).description}
            </p>
          </div>
          <GraphTypeSelector type={type} onChange={setType} />
        </section>
        {error ? (
          <div className="card loading-panel" role="alert">
            <span className="empty-icon">
              <Icon name="info" size={25} />
            </span>
            <h2>Connection unavailable</h2>
            <p>{error}</p>
            <button
              className="button secondary"
              onClick={() => setRetry((value) => value + 1)}
            >
              <Icon name="reset" />
              Try again
            </button>
          </div>
        ) : !currentGraph ? (
          <div className="card loading-panel" role="status">
            <span className="spinner" />
            <h2>Preparing your campus</h2>
            <p>Loading locations and their connections…</p>
          </div>
        ) : (
          <Workspace key={`${type}-${retry}`} graph={currentGraph} />
        )}
        <footer className="page-footer">
          <span>
            <Icon name="graph" size={17} />
            CampusGraph
          </span>
        </footer>
      </main>
    </>
  );
}
