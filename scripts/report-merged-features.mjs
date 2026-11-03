#!/usr/bin/env node

/**
 * Draft a Markdown report of numbered changes merged into a branch over a date
 * range. It is a starting point, not a finished report: the descriptions are
 * extracted from archived proposals and still need a short human review.
 *
 * Usage:
 *   node scripts/report-merged-features.mjs \
 *     --since 2026-10-01 --until 2026-11-01 \
 *     --out docs/merged-features-2026-10.md
 *
 * Options:
 *   --since YYYY-MM-DD   required, inclusive
 *   --until YYYY-MM-DD   required, inclusive
 *   --ref REF            branch/ref to read (default: origin/master)
 *   --kinds LIST         feature,fix,refactor,research or all (default: feature)
 *   --out FILE           write here; stdout when omitted
 *
 * Descriptions come from `## What Changes` first bullet, falling back to the
 * first `## Why` paragraph. Review them before committing a report.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const POOLS = ["feature", "fix", "refactor", "research"];

const args = process.argv.slice(2);
const getArg = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const since = getArg("--since");
const until = getArg("--until");

if (!since || !until) {
  console.error("Usage: node scripts/report-merged-features.mjs --since YYYY-MM-DD --until YYYY-MM-DD [--ref origin/master] [--kinds feature] [--out FILE]");
  process.exit(1);
}

const ref = getArg("--ref", "origin/master");
const kindsArg = getArg("--kinds", "feature");
const kinds = kindsArg === "all" ? POOLS : kindsArg.split(",").map((kind) => kind.trim()).filter(Boolean);

for (const kind of kinds) {
  if (!POOLS.includes(kind)) {
    console.error(`Unknown kind "${kind}". Use feature, fix, refactor, research, or all.`);
    process.exit(1);
  }
}

const stripMarkdown = (value) =>
  value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

const shorten = (value, limit = 220) => {
  if (value.length <= limit) return value;

  return `${value.slice(0, limit - 1).replace(/\s+\S*$/, "")}…`;
};

const extractDescription = (proposal) => {
  const whatChanges = proposal.split("## What Changes")[1]?.split(/\n## /)[0] ?? "";
  const firstBullet = whatChanges
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith("- "));

  if (firstBullet) {
    return shorten(stripMarkdown(firstBullet.slice(2)));
  }

  const why = proposal.split("## Why")[1]?.split(/\n## /)[0] ?? "";
  const firstParagraph = why.split(/\n\s*\n/).find((paragraph) => paragraph.trim());

  return firstParagraph ? shorten(stripMarkdown(firstParagraph)) : "_No description found._";
};

const findChangeDirectory = (slug) => {
  const archive = "openspec/changes/archive";

  if (existsSync(archive)) {
    const match = readdirSync(archive)
      .filter((entry) => entry.endsWith(`-${slug}`))
      .sort()
      .at(-1);

    if (match) return `${archive}/${match}`;
  }

  const active = `openspec/changes/${slug}`;
  return existsSync(active) ? active : null;
};

const log = execFileSync(
  "git",
  ["log", ref, "--merges", `--since=${since}`, `--until=${until}`, "--pretty=format:%ad|%s", "--date=short"],
  { encoding: "utf8" },
);

const rows = [];

for (const line of log.split("\n")) {
  if (!line.trim()) continue;

  const [date, ...subjectParts] = line.split("|");
  const subject = subjectParts.join("|");
  if (date < since || date > until) continue;

  const match = subject.match(/from\s+\S+\/((feature|fix|refactor|research)-\d{3}-[a-z0-9-]+)/);

  if (!match) continue;

  const slug = match[1];
  const kind = match[2];
  if (!kinds.includes(kind)) continue;

  const directory = findChangeDirectory(slug);
  const description = directory
    ? extractDescription(readFileSync(`${directory}/proposal.md`, "utf8"))
    : "_No archived proposal found._";

  rows.push({ date, slug, description });
}

rows.sort((first, second) => first.date.localeCompare(second.date) || first.slug.localeCompare(second.slug));

const kindLabel =
  kinds.length === 1
    ? { feature: "Features", fix: "Fixes", refactor: "Refactors", research: "Research" }[kinds[0]]
    : "Changes";

const title = `# ${kindLabel} merged to ${ref} — ${since} to ${until}`;
const note = "Drafted from merge commits and archived proposals. Review and shorten the descriptions before committing.";
const table = ["| Merged | Change | Description |", "| --- | --- | --- |"]
  .concat(rows.map((row) => `| ${row.date} | \`${row.slug}\` | ${row.description} |`))
  .join("\n");

const report = `${title}\n\n${note}\n\n${table}\n`;
const out = getArg("--out");

if (out) {
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, report);
  console.log(`Wrote ${rows.length} rows to ${out}`);
} else {
  process.stdout.write(report);
}
