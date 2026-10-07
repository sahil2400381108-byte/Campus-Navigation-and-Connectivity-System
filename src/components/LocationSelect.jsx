import Icon from "./Icon.jsx";

export default function LocationSelect({
  id,
  label,
  value,
  onChange,
  graph,
  disabled = false,
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className={`select-wrap ${disabled ? "is-disabled" : ""}`}>
        <Icon name="pin" size={17} />
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        >
          {[...graph.vertices.values()].map(({ id: key, name }) => (
            <option key={key} value={key}>
              {name}
            </option>
          ))}
        </select>
        <Icon name="chevron" size={16} />
      </div>
    </div>
  );
}
