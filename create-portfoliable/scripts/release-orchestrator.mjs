// File: create-portfoliable/scripts/release-orchestrator.mjs
// Purpose: Compute semantic release plans and perform package/changelog/tag mutations for releases.
// Author: Lio Schimanko

// === IMPORTS ===
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, appendFileSync } from "node:fs";

// === RELEASE CONFIGURATION ===
// Defines canonical repository URL used for changelog compare and commit links.
const REPO_URL = "https://github.com/portfoliablejs/portfoliable";
// Enables dry-run behavior when --dry-run is provided on process args.
const isDryRun = process.argv.includes("--dry-run");
// Enables signing release commit and tag objects when RELEASE_SIGN=true.
const shouldSign = process.env.RELEASE_SIGN === "true";

// Declares releasable package configurations included in the orchestrator run.
const packages = [
  {
    key: "package",
    displayName: "create-portfoliable",
    packageJsonPath: "create-portfoliable/package.json",
    changelogPath: "create-portfoliable/CHANGELOG.md",
    tagPrefix: "v",
    paths: ["create-portfoliable"],
  },
];

// === GIT HELPERS ===
// Executes git with standardized options and optional allow-failure behavior.
function git(args, options = {}) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    }).trim();
  } catch (error) {
    if (options.allowFailure) {
      return "";
    }
    throw error;
  }
}

// Resolves the latest tag matching a package-specific prefix.
function getLastTag(tagPrefix) {
  // Builds wildcard match expression for tag lookup.
  const match = `${tagPrefix}*`;
  return git(["describe", "--tags", "--match", match, "--abbrev=0"], { allowFailure: true });
}

// Computes the commit range from baseline tag (or first commit) to HEAD.
function getCommitRange(lastTag) {
  if (lastTag) {
    return `${lastTag}..HEAD`;
  }
  // Resolves initial commit hash for repositories without prior release tags.
  const firstCommit = git(["rev-list", "--max-parents=0", "HEAD"]);
  return `${firstCommit}..HEAD`;
}

// === COMMIT CLASSIFICATION ===
// Parses conventional commit headers and detects explicit breaking marker in header.
function parseCommitType(subject) {
  // Matches conventional commit headers with optional scope and breaking marker.
  const match = subject.match(/^([a-z]+)(\([^)]+\))?(!)?:\s+/i);
  if (!match) {
    return { type: "", breakingByHeader: false };
  }
  return {
    type: match[1].toLowerCase(),
    breakingByHeader: Boolean(match[3]),
  };
}

// Classifies a commit into semantic bump level and changelog section.
function classifyCommit(subject, body) {
  // Extracts parsed type and breaking-by-header signal from commit subject.
  const { type, breakingByHeader } = parseCommitType(subject);
  // Detects BREAKING CHANGE trailer in commit body.
  const hasBreakingBody = /BREAKING CHANGE:/i.test(body);

  if (breakingByHeader || hasBreakingBody) {
    return { level: "major", section: "Breaking Changes" };
  }

  if (type === "feat") {
    return { level: "minor", section: "Features" };
  }

  // Defines all commit types that map to patch-level release bumps.
  const patchTypes = new Set([
    "fix",
    "perf",
    "refactor",
    "chore",
    "docs",
    "style",
    "test",
    "build",
    "ci",
  ]);

  if (patchTypes.has(type)) {
    return { level: "patch", section: "Bug Fixes" };
  }

  return { level: "none", section: "Other" };
}

// Returns the highest semantic bump level from a list of levels.
function maxLevel(levels) {
  // Defines precedence ordering for semantic bump levels.
  const rank = { none: 0, patch: 1, minor: 2, major: 3 };
  // Tracks the highest level found during iteration.
  let best = "none";
  for (const level of levels) {
    if (rank[level] > rank[best]) {
      best = level;
    }
  }
  return best;
}

// Reads commits in a range and returns normalized records with release classification metadata.
function readCommits(range, paths) {
  // Configures git log delimiters for robust field splitting.
  const format = "%H%x01%s%x01%b%x02";
  // Reads scoped commit log output.
  const output = git(["log", range, `--pretty=format:${format}`, "--", ...paths], { allowFailure: true });
  if (!output) {
    return [];
  }

  return output
    .split("\x02")
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record) => {
      // Splits serialized git record into hash, subject, and body fields.
      const [hash = "", subject = "", body = ""] = record.split("\x01");
      // Classifies commit into semantic release level and changelog section.
      const classification = classifyCommit(subject, body);
      return {
        hash,
        shortHash: hash.slice(0, 7),
        subject,
        body,
        level: classification.level,
        section: classification.section,
      };
    });
}

// === VERSION AND FILE MUTATION HELPERS ===
// Computes the next semantic version string from current semver and bump level.
function bumpVersion(currentVersion, level) {
  // Parses the current semver string into numeric tuple components.
  const parts = currentVersion.split(".").map((part) => Number(part));
  // Destructures numeric semver components for bump logic.
  const [major, minor, patch] = parts;

  if ([major, minor, patch].some((part) => Number.isNaN(part))) {
    throw new Error(`Invalid semver version: ${currentVersion}`);
  }

  if (level === "major") {
    return `${major + 1}.0.0`;
  }
  if (level === "minor") {
    return `${major}.${minor + 1}.0`;
  }
  return `${major}.${minor}.${patch + 1}`;
}

// Updates package.json version field with computed release version.
function updatePackageJson(filePath, nextVersion) {
  // Reads and parses package manifest.
  const raw = readFileSync(filePath, "utf8");
  // Parses package JSON structure.
  const pkg = JSON.parse(raw);
  pkg.version = nextVersion;
  writeFileSync(filePath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
}

// Builds markdown changelog release entry from classified commit list.
function buildReleaseEntry({ nextVersion, previousTag, nextTag, commits }) {
  // Captures release date in YYYY-MM-DD format.
  const date = new Date().toISOString().slice(0, 10);
  // Builds compare or release URL depending on baseline-tag availability.
  const compareUrl = previousTag
    ? `${REPO_URL}/compare/${previousTag}...${nextTag}`
    : `${REPO_URL}/releases/tag/${nextTag}`;

  // Initializes release heading and spacer line.
  const lines = [`## [${nextVersion}](${compareUrl}) (${date})`, ""];

  // Defines changelog sections in desired output order.
  const sections = ["Breaking Changes", "Features", "Bug Fixes", "Other"];
  for (const section of sections) {
    // Selects commits assigned to current changelog section.
    const sectionCommits = commits.filter((commit) => commit.section === section);
    if (!sectionCommits.length) {
      continue;
    }

    lines.push(`### ${section}`);
    lines.push("");

    for (const commit of sectionCommits) {
      // Normalizes subject whitespace for markdown list readability.
      const safeSubject = commit.subject.replace(/\s+/g, " ").trim();
      lines.push(`* ${safeSubject} ([${commit.shortHash}](${REPO_URL}/commit/${commit.hash}))`);
    }

    lines.push("");
  }

  return lines.join("\n").trim();
}

// Prepends new release entry to changelog while preserving existing content below.
function prependChangelog(filePath, releaseEntry) {
  // Reads existing changelog text.
  const existing = readFileSync(filePath, "utf8");
  // Prepends release entry while preserving existing history below.
  const next = `${releaseEntry}\n\n${existing.trimStart()}\n`;
  writeFileSync(filePath, next, "utf8");
}

// Writes workflow outputs for downstream GitHub Actions steps.
function setGithubOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) {
    return;
  }
  appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}

// === RELEASE PLANNING ===
// Creates release plan for a single package configuration.
function createReleasePlan(pkg) {
  // Resolves previous tag baseline and scoped commit range.
  const previousTag = getLastTag(pkg.tagPrefix);
  // Computes commit range from baseline to HEAD.
  const range = getCommitRange(previousTag);
  // Reads and classifies scoped commits.
  const commits = readCommits(range, pkg.paths);
  // Filters to commits that map to release levels.
  const releasableCommits = commits.filter((commit) => commit.level !== "none");
  // Selects highest release bump level among releasable commits.
  const bump = maxLevel(releasableCommits.map((commit) => commit.level));

  if (bump === "none") {
    return {
      ...pkg,
      released: false,
      previousTag,
      range,
      commits,
      releasableCommits,
    };
  }

  // Reads current package version and computes next semantic version/tag.
  const currentVersion = JSON.parse(readFileSync(pkg.packageJsonPath, "utf8")).version;
  // Computes next version using selected bump level.
  const nextVersion = bumpVersion(currentVersion, bump);
  // Builds package tag string from prefix and next version.
  const nextTag = `${pkg.tagPrefix}${nextVersion}`;

  return {
    ...pkg,
    released: true,
    previousTag,
    range,
    commits,
    releasableCommits,
    bump,
    currentVersion,
    nextVersion,
    nextTag,
  };
}

// === ORCHESTRATION ENTRYPOINT ===
// Coordinates planning, optional mutation, commit creation, and tag creation.
function run() {
  // Builds release plans for all configured packages and filters to releasable subset.
  const plans = packages.map(createReleasePlan);
  // Filters plans to packages that require release mutation.
  const releases = plans.filter((plan) => plan.released);

  for (const plan of plans) {
    setGithubOutput(`released_${plan.key}`, String(plan.released));
    if (plan.released) {
      setGithubOutput(`${plan.key}_version`, plan.nextVersion);
      setGithubOutput(`${plan.key}_tag`, plan.nextTag);
    }
  }

  // Exports aggregate release flag for workflow conditions.
  setGithubOutput("released_any", String(releases.length > 0));

  if (!releases.length) {
    console.log("No releasable commits detected.");
    return;
  }

  // Applies version and changelog mutations for releasable packages.
  for (const plan of releases) {
    console.log(`${plan.displayName}: ${plan.currentVersion} -> ${plan.nextVersion} (${plan.bump})`);
  }

  if (isDryRun) {
    console.log("Dry run enabled; skipping file updates, commit, and tags.");
    return;
  }

  for (const plan of releases) {
    updatePackageJson(plan.packageJsonPath, plan.nextVersion);
    // Builds markdown release entry from releasable commits.
    const releaseEntry = buildReleaseEntry({
      nextVersion: plan.nextVersion,
      previousTag: plan.previousTag,
      nextTag: plan.nextTag,
      commits: plan.releasableCommits,
    });
    prependChangelog(plan.changelogPath, releaseEntry);
  }

  // Stages mutated assets and creates one release commit summarizing package bumps.
  const assets = releases.flatMap((plan) => [plan.packageJsonPath, plan.changelogPath]);
  git(["add", ...assets]);

  // Formats release summary list used in release commit message.
  const summary = releases.map((plan) => `${plan.displayName}@${plan.nextVersion}`).join(", ");
  // Builds git commit arguments for release mutation commit.
  const commitArgs = ["commit", "-m", `chore(release): ${summary} [skip ci]`];
  if (shouldSign) {
    commitArgs.splice(1, 0, "-S");
  }
  git(commitArgs);

  // Creates annotated or signed tags for each release if tag is not already present.
  for (const plan of releases) {
    // Checks whether target tag already exists in repository.
    const tagExists = git(["rev-parse", "-q", "--verify", `refs/tags/${plan.nextTag}`], {
      allowFailure: true,
    });
    if (!tagExists) {
      // Selects signed or annotated tag command based on RELEASE_SIGN flag.
      const tagArgs = shouldSign
        ? ["tag", "-s", plan.nextTag, "-m", `Release ${plan.nextTag}`]
        : ["tag", "-a", plan.nextTag, "-m", `Release ${plan.nextTag}`];
      git(tagArgs);
    }
  }
}

// Executes orchestrator logic as the script main entrypoint.
run();
