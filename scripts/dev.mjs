import { spawn } from "node:child_process";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const services = ["backend", "frontend"];
const children = services.map((service) =>
  spawn(npm, ["run", "dev"], {
    cwd: new URL(`../${service}/`, import.meta.url),
    stdio: "inherit",
  }),
);

let shuttingDown = false;

function stop(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }

  process.exitCode = exitCode;
}

for (const child of children) {
  child.on("error", (error) => {
    console.error(`No se pudo iniciar un servicio: ${error.message}`);
    stop(1);
  });

  child.on("exit", (code, signal) => {
    if (!shuttingDown) {
      const exitCode = code ?? (signal ? 1 : 0);
      stop(exitCode);
    }
  });
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
