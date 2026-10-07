import { useEffect, useRef, useState } from "react";
import { runGraphOperation } from "../data/campusGraph.js";

export const VISIT_INTERVAL = 600;
const initial = {
  status: "ready",
  method: null,
  order: [],
  count: 0,
  error: "",
};

/** Playback only: the visit order always comes from the existing Python algorithm. */
export default function useTraversal(graph) {
  const [state, setState] = useState(initial);
  const [start, setStart] = useState("gate");
  const generation = useRef(0);
  const [reducedMotion, setReducedMotion] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    preference.addEventListener("change", update);
    return () => {
      preference.removeEventListener("change", update);
      generation.current += 1;
    };
  }, []);

  useEffect(() => {
    if (state.status !== "playing") return;
    if (reducedMotion) {
      setState((previous) => ({
        ...previous,
        count: previous.order.length,
        status: "complete",
      }));
      return;
    }
    const timer = setTimeout(() => {
      setState((previous) => {
        const count = Math.min(previous.count + 1, previous.order.length);
        return {
          ...previous,
          count,
          status: count === previous.order.length ? "complete" : "playing",
        };
      });
    }, VISIT_INTERVAL);
    return () => clearTimeout(timer);
  }, [state.status, state.count, reducedMotion]);

  function reset() {
    generation.current += 1;
    setState(initial);
  }
  async function run(method) {
    const ticket = ++generation.current;
    setState({ ...initial, method, status: "requesting" });
    try {
      const { order } = await runGraphOperation(
        graph.type,
        method.toLowerCase(),
        { start },
      );
      if (ticket !== generation.current) return;
      const complete = reducedMotion || order.length <= 1;
      setState({
        method,
        order,
        count: complete ? order.length : 1,
        status: complete ? "complete" : "playing",
        error: "",
      });
    } catch (problem) {
      if (ticket === generation.current)
        setState({ ...initial, status: "error", error: problem.message });
    }
  }
  const busy = ["requesting", "playing", "paused"].includes(state.status);
  return {
    ...state,
    start,
    busy,
    run,
    reset,
    changeStart(value) {
      reset();
      setStart(value);
    },
    pause() {
      setState((previous) => ({ ...previous, status: "paused" }));
    },
    resume() {
      setState((previous) => ({ ...previous, status: "playing" }));
    },
    finish() {
      setState((previous) => ({
        ...previous,
        count: previous.order.length,
        status: "complete",
      }));
    },
  };
}
