import { graphTypes } from "../data/campusGraph.js";
import Icon from "./Icon.jsx";

export default function GraphTypeSelector({ type, onChange }) {
  return (
    <div
      className="graph-type-selector"
      style={{
        "--selected-index": graphTypes.findIndex(({ id }) => id === type),
      }}
      role="group"
      aria-label="Graph type"
    >
      <span className="mode-indicator" aria-hidden="true" />
      {graphTypes.map(({ id, label }, index) => (
        <button
          key={id}
          type="button"
          aria-pressed={type === id}
          className={type === id ? "selected" : ""}
          onClick={() => onChange(id)}
        >
          <Icon name={["both", "arrow", "weight"][index]} />
          {label}
        </button>
      ))}
    </div>
  );
}
