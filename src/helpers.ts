import { execSync, spawn } from "child_process";

import { writeFileSync } from "fs";
import { Logger } from "./logger";

export function findChangedFiles(refA?: string, refB?: string): string[] {
  if (refA === undefined) {
    refA = "HEAD";
  }
  if (refB === undefined) {
    refB = "";
  }

  let output = execSync(
    `git diff --name-only --diff-filter=ACMR ${refA} ${refB}`,
    { encoding: "utf-8" }
  );
  return output.split("\n").filter((fileName) => fileName.length > 0);
}

export async function updateDependencies(
  logger: Logger,
  previousHead: string
): Promise<void> {
  let pnpmInstalled = false;
  try {
    const child_process = await import("child_process");
    child_process.execSync("pnpm --version", {
      encoding: "utf-8",
      stdio: "ignore",
    });
    pnpmInstalled = true;
  } catch {
    // pnpm is not installed.
  }

  if (pnpmInstalled && pnpmLockFileChanged(previousHead, "HEAD")) {
    logger.log("hooks", "Running pnpm install...");
    await pnpmInstall();
  } else {
    if (npmLockFileChanged(previousHead, "HEAD")) {
      logger.log("hooks", "Running npm install...");
      npmInstall();
    } else {
      logger.log("hooks", "No need to run (p)npm install");
    }
  }
}

async function pnpmInstall(): Promise<void> {
  const child_process = await import("child_process");
  try {
    child_process.execSync("pnpm install", {
      encoding: "utf-8",
      stdio: [0, 1, 2],
    });
  } catch (installError) {
    // eslint-disable-next-line no-console
    console.error("pnpm install failed");
    // eslint-disable-next-line no-console
    console.log("Retrying with npm install");

    npmInstall();
  }
}

function npmInstall(): void {
  let scriptPath = `${process.cwd()}/build/npm-install.js`;
  let currentDir = process.cwd().replace(/\\/g, "\\\\");

  writeFileSync(
    scriptPath,
    `
var fs = require('fs');

var tryNpmInstall = function() {
  if (fs.existsSync('.git/index.lock')) {
    return false;
  }
  console.log('Updating dependencies, please wait...');
  const child_process = require('child_process');
  try {
    try {
      child_process.execSync('npm install --no-package-lock', { encoding: 'UTF-8', stdio: [0, 1, 2] });
    } catch (installError) {
      console.error('Retrying npm install');
      child_process.execSync('npm install --no-package-lock', { encoding: 'UTF-8', stdio: [0, 1, 2] });
    }
  } catch (secondError) {
    console.error('npm install failed');
    console.log('Press enter to continue');
    process.stdin.once('data', function(){
      process.exit(1);
    });
  }
  process.exit(0);
}

fs.watch('.git', {persistent: true}, tryNpmInstall);

if (!tryNpmInstall()) {
  console.log('waiting for git before running npm install');
}
`
  );
  let install = spawn("node", ["./build/npm-install.js"], {
    stdio: "ignore",
    shell: true,
    detached: true,
    cwd: currentDir,
  });
  install.unref();
}

export function pnpmLockFileChanged(refA: string, refB: string): boolean {
  return (
    findChangedFiles(refA, refB).filter(
      (f) => f.indexOf("pnpm-lock.yaml") !== -1
    ).length >= 1
  );
}

export function npmLockFileChanged(refA: string, refB: string): boolean {
  return (
    findChangedFiles(refA, refB).filter(
      (f) => f.indexOf("package-lock.json") !== -1
    ).length >= 1
  );
}

export function filterTsFiles(files: string[]): string[] {
  return files.filter((f) => f.slice(-3) === ".ts" && f.slice(-5) !== ".d.ts");
}
