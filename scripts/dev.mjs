import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

// Launch Python and Vite together. Both stop when the user presses Ctrl+C.
const root = fileURLToPath(new URL("../", import.meta.url));
const python = spawn(
  process.env.PYTHON || "python",
  ["-u", "python/server.py", "--host", "127.0.0.1", "--port", "0"],
  {
    cwd: root,
    stdio: ["ignore", "pipe", "inherit"],
  },
);
let vite;
let stopping = false;
let startupOutput = "";
const timer = setTimeout(() => {
  console.error(
    "Python did not start within 15 seconds. Check your Python installation.",
  );
  stop(1);
}, 15000);
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  clearTimeout(timer);
  python.kill();
  vite?.kill();
  process.exitCode = code;
}
python.on("error", (error) => {
  console.error(
    `Could not start Python: ${error.message}. Install Python 3.10+ and add it to PATH.`,
  );
  stop(1);
});
python.on("exit", (code) => {
  if (!stopping) stop(code || 1);
});
python.stdout.on("data", (chunk) => {
  startupOutput += chunk.toString();
  const match = startupOutput.match(
    /CAMPUS_PYTHON_READY:(http:\/\/127\.0\.0\.1:\d+)\r?\n/,
  );
  if (!match || vite || stopping) return;
  clearTimeout(timer);
  console.log(`Python graph logic ready at ${match[1]}\n`);
  const preview = process.argv.includes("--preview");
  vite = spawn(
    process.execPath,
    [
      "node_modules/vite/bin/vite.js",
      ...(preview ? ["preview"] : []),
      "--host",
      "127.0.0.1",
      ...process.argv.slice(2).filter((arg) => arg !== "--preview"),
    ],
    {
      cwd: root,
      stdio: "inherit",
      env: { ...process.env, CAMPUS_BACKEND_URL: match[1] },
    },
  );
  vite.on("error", (error) => {
    console.error(error.message);
    stop(1);
  });
  vite.on("exit", (code) => {
    if (!stopping) stop(code || 0);
  });
});
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
process.on("exit", () => {
  python.kill();
  vite?.kill();
});
