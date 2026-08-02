import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, appendFileSync } from "node:fs";

const REPO_URL = "https://github.com/portfoliablejs/portfoliable";
const isDryRun = process.argv.includes("--dry-run");
const shouldSign = process.env.RELEASE_SIGN === "true";

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

function getLastTag(tagPrefix) {
  const match = `${tagPrefix}*`;
  return git(["describe", "--tags", "--match", match, "--abbrev=0"], { allowFailure: true });
}

function getCommitRange(lastTag) {
  if (lastTag) {
    return `${lastTag}..HEAD`;
  }
  const firstCommit = git(["rev-list", "--max-parents=0", "HEAD"]);
  return `${firstCommit}..HEAD`;
}

function parseCommitType(subject) {
  const match = subject.match(/^([a-z]+)(\([^)]+\))?(!)?:\s+/i);
  if (!match) {
    return { type: "", breakingByHeader: false };
  }
  return {
    type: match[1].toLowerCase(),
    breakingByHeader: Boolean(match[3]),
  };
}

function classifyCommit(subject, body) {
  const { type, breakingByHeader } = parseCommitType(subject);
  const hasBreakingBody = /BREAKING CHANGE:/i.test(body);

  if (breakingByHeader || hasBreakingBody) {
    return { level: "major", section: "Breaking Changes" };
  }

  if (type === "feat") {
    return { level: "minor", section: "Features" };
  }

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

function maxLevel(levels) {
  const rank = { none: 0, patch: 1, minor: 2, major: 3 };
  let best = "none";
  for (const level of levels) {
    if (rank[level] > rank[best]) {
      best = level;
    }
  }
  return best;
}

function readCommits(range, paths) {
  const format = "%H%x01%s%x01%b%x02";
  const output = git(["log", range, `--pretty=format:${format}`, "--", ...paths], { allowFailure: true });
  if (!output) {
    return [];
  }

  return output
    .split("\x02")
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record) => {
      const [hash = "", subject = "", body = ""] = record.split("\x01");
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

function bumpVersion(currentVersion, level) {
  const parts = currentVersion.split(".").map((part) => Number(part));
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

function updatePackageJson(filePath, nextVersion) {
  const raw = readFileSync(filePath, "utf8");
  const pkg = JSON.parse(raw);
  pkg.version = nextVersion;
  writeFileSync(filePath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
}

function buildReleaseEntry({ nextVersion, previousTag, nextTag, commits }) {
  const date = new Date().toISOString().slice(0, 10);
  const compareUrl = previousTag
    ? `${REPO_URL}/compare/${previousTag}...${nextTag}`
    : `${REPO_URL}/releases/tag/${nextTag}`;

  const lines = [`## [${nextVersion}](${compareUrl}) (${date})`, ""];

  const sections = ["Breaking Changes", "Features", "Bug Fixes", "Other"];
  for (const section of sections) {
    const sectionCommits = commits.filter((commit) => commit.section === section);
    if (!sectionCommits.length) {
      continue;
    }

    lines.push(`### ${section}`);
    lines.push("");

    for (const commit of sectionCommits) {
      const safeSubject = commit.subject.replace(/\s+/g, " ").trim();
      lines.push(`* ${safeSubject} ([${commit.shortHash}](${REPO_URL}/commit/${commit.hash}))`);
    }

    lines.push("");
  }

  return lines.join("\n").trim();
}

function prependChangelog(filePath, releaseEntry) {
  const existing = readFileSync(filePath, "utf8");
  const next = `${releaseEntry}\n\n${existing.trimStart()}\n`;
  writeFileSync(filePath, next, "utf8");
}

function setGithubOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) {
    return;
  }
  appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}

function createReleasePlan(pkg) {
  const previousTag = getLastTag(pkg.tagPrefix);
  const range = getCommitRange(previousTag);
  const commits = readCommits(range, pkg.paths);
  const releasableCommits = commits.filter((commit) => commit.level !== "none");
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

  const currentVersion = JSON.parse(readFileSync(pkg.packageJsonPath, "utf8")).version;
  const nextVersion = bumpVersion(currentVersion, bump);
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

function run() {
  const plans = packages.map(createReleasePlan);
  const releases = plans.filter((plan) => plan.released);

  for (const plan of plans) {
    setGithubOutput(`released_${plan.key}`, String(plan.released));
    if (plan.released) {
      setGithubOutput(`${plan.key}_version`, plan.nextVersion);
      setGithubOutput(`${plan.key}_tag`, plan.nextTag);
    }
  }

  setGithubOutput("released_any", String(releases.length > 0));

  if (!releases.length) {
    console.log("No releasable commits detected.");
    return;
  }

  for (const plan of releases) {
    console.log(`${plan.displayName}: ${plan.currentVersion} -> ${plan.nextVersion} (${plan.bump})`);
  }

  if (isDryRun) {
    console.log("Dry run enabled; skipping file updates, commit, and tags.");
    return;
  }

  for (const plan of releases) {
    updatePackageJson(plan.packageJsonPath, plan.nextVersion);
    const releaseEntry = buildReleaseEntry({
      nextVersion: plan.nextVersion,
      previousTag: plan.previousTag,
      nextTag: plan.nextTag,
      commits: plan.releasableCommits,
    });
    prependChangelog(plan.changelogPath, releaseEntry);
  }

  const assets = releases.flatMap((plan) => [plan.packageJsonPath, plan.changelogPath]);
  git(["add", ...assets]);

  const summary = releases.map((plan) => `${plan.displayName}@${plan.nextVersion}`).join(", ");
  const commitArgs = ["commit", "-m", `chore(release): ${summary} [skip ci]`];
  if (shouldSign) {
    commitArgs.splice(1, 0, "-S");
  }
  git(commitArgs);

  for (const plan of releases) {
    const tagExists = git(["rev-parse", "-q", "--verify", `refs/tags/${plan.nextTag}`], {
      allowFailure: true,
    });
    if (!tagExists) {
      const tagArgs = shouldSign
        ? ["tag", "-s", plan.nextTag, "-m", `Release ${plan.nextTag}`]
        : ["tag", "-a", plan.nextTag, "-m", `Release ${plan.nextTag}`];
      git(tagArgs);
    }
  }
}

run();
