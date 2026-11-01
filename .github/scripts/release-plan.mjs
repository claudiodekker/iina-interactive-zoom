import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";

/**
 * Run git and return its trimmed output.
 */
function git(...args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

/**
 * Stop the workflow with a message that says how to fix the version fields.
 */
function fail(message) {
  console.error(`::error file=Info.json::${message}`);
  process.exit(1);
}

/**
 * Hand a value to later workflow steps.
 */
function output(name, value) {
  console.log(`${name}=${value}`);

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
  }
}

const info = JSON.parse(readFileSync("Info.json", "utf8"));

if (typeof info.version !== "string" || !Number.isInteger(info.ghVersion)) {
  fail("Info.json needs a version string and a whole-number ghVersion.");
}

if (process.env.GITHUB_REPOSITORY && info.ghRepo !== process.env.GITHUB_REPOSITORY) {
  fail(`ghRepo is "${info.ghRepo}" but this repository is "${process.env.GITHUB_REPOSITORY}".`);
}

const latestTag = git("tag", "--list", "v*", "--sort=-v:refname").split("\n")[0];

output("version", info.version);

if (latestTag === "") {
  output("release", "true");
  process.exit(0);
}

const released = JSON.parse(git("show", `${latestTag}:Info.json`));

// IINA offers an update when ghVersion rises and then installs the latest release, so the two must move together.
if (info.version === released.version) {
  if (info.ghVersion !== released.ghVersion) {
    fail(`ghVersion changed but version is still ${info.version}. Raise version too, or put ghVersion back to ${released.ghVersion}.`);
  }

  output("release", "false");
  process.exit(0);
}

if (info.ghVersion <= released.ghVersion) {
  fail(`version changed to ${info.version} but ghVersion is still ${info.ghVersion}. Raise ghVersion above ${released.ghVersion}.`);
}

output("release", "true");
