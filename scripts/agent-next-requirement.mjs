#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const configPath = path.join(root, "agent-loop.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const lockPath = path.join(root, ".git", "fitbros-agent-loop.lock");
const args = new Set(process.argv.slice(2));

function git(...gitArgs) {
  return execFileSync("git", gitArgs, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function output(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function releaseLock() {
  if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
  output({ action: "released", lockPath });
}

function acquireLock() {
  if (fs.existsSync(lockPath)) {
    const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
    const ageMinutes = (Date.now() - Date.parse(lock.acquiredAt)) / 60000;
    if (Number.isFinite(ageMinutes) && ageMinutes < config.limits.lockStaleMinutes) {
      return {
        ok: false,
        reason: "another_agent_active",
        lock,
        ageMinutes: Math.round(ageMinutes),
      };
    }
    fs.unlinkSync(lockPath);
  }

  const lock = {
    acquiredAt: new Date().toISOString(),
    pid: process.pid,
    head: git("rev-parse", "HEAD"),
  };
  fs.writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
  return { ok: true, lock };
}

function parseRequirements(markdown) {
  const matches = [...markdown.matchAll(/^## (REQ-\d+) - (.+)$/gm)];
  const result = new Map();

  matches.forEach((match, index) => {
    const start = match.index;
    const end = index + 1 < matches.length ? matches[index + 1].index : markdown.length;
    const body = markdown.slice(start, end);
    const statusMatch = body.match(/^\*\*Estado:\s*([^*]+)\*\*$/m);
    const status = statusMatch ? statusMatch[1].trim() : "sin estado";
    result.set(match[1], {
      id: match[1],
      title: match[2].trim(),
      status,
      implemented: /\bimplementado\b/i.test(status),
      blocked: /\bbloqueado\b/i.test(status),
      pending: /\bpendiente\b/i.test(status),
    });
  });

  return result;
}

function selectNext() {
  const branch = git("branch", "--show-current");
  const dirty = git("status", "--porcelain");
  const head = git("rev-parse", "HEAD");
  let upstream = "";

  try {
    upstream = git("rev-parse", "origin/main");
  } catch {
    return { action: "stop", reason: "origin_main_unavailable", branch, head };
  }

  if (branch !== config.branch) {
    return { action: "stop", reason: "branch_mismatch", expected: config.branch, actual: branch };
  }
  if (dirty) {
    return { action: "stop", reason: "dirty_worktree", files: dirty.split("\n") };
  }
  if (head !== upstream) {
    return { action: "stop", reason: "remote_ahead_or_diverged", head, upstream };
  }

  const requirementPath = path.join(root, config.requirementFile);
  const requirements = parseRequirements(fs.readFileSync(requirementPath, "utf8"));

  for (const id of config.queue) {
    const requirement = requirements.get(id);
    if (!requirement) return { action: "stop", reason: "requirement_missing", id };
    if (requirement.blocked) return { action: "stop", reason: "requirement_blocked", requirement };
    if (!requirement.implemented) {
      if (!requirement.pending) {
        return { action: "stop", reason: "unknown_requirement_status", requirement };
      }
      return {
        action: "implement",
        requirement,
        limits: config.limits,
        previousCommit: git("log", "-1", "--pretty=%H %s"),
      };
    }
  }

  if (config.continuousImprovement.includeUnlistedPendingRequirements) {
    const configured = new Set(config.queue);
    const discovered = [...requirements.values()]
      .filter((requirement) => !configured.has(requirement.id))
      .sort((a, b) => Number(a.id.slice(4)) - Number(b.id.slice(4)));

    for (const requirement of discovered) {
      if (requirement.blocked) return { action: "stop", reason: "requirement_blocked", requirement };
      if (requirement.pending) {
        return {
          action: "implement",
          requirement,
          discovered: true,
          limits: config.limits,
          previousCommit: git("log", "-1", "--pretty=%H %s"),
        };
      }
    }
  }

  return {
    action: config.continuousImprovement.auditWhenQueueIsComplete ? "audit" : "complete",
    reason: "queue_complete",
    limits: config.limits,
  };
}

if (args.has("--release")) {
  releaseLock();
} else {
  let lock = null;
  if (args.has("--acquire")) {
    const acquired = acquireLock();
    if (!acquired.ok) {
      output({ action: "stop", ...acquired });
      process.exitCode = 2;
    } else {
      lock = acquired.lock;
    }
  }

  if (process.exitCode !== 2) output({ ...selectNext(), lock });
}
