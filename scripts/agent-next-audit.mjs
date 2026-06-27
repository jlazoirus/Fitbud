#!/usr/bin/env node

// Selector y lock del loop de auditoria/QA de Fitbros.
//
// Es el espejo de agent-next-requirement.mjs pero para el rol auditor:
// no implementa requerimientos, elige el siguiente journey a auditar y
// produce a lo sumo un commit documental con REQ nuevos en REQUIREMENTS.md.
//
// COMPARTE el mismo lock que el agente desarrollador
// (.git/fitbros-agent-loop.lock) para que auditor y desarrollador nunca
// toquen el repositorio al mismo tiempo. Si el otro agente esta activo,
// este selector se detiene con reason "another_agent_active".

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const configPath = path.join(root, "agent-audit-loop.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
// Lock compartido con el desarrollador: exclusion mutua entre ambos loops.
const lockPath = path.join(root, ".git", "fitbros-agent-loop.lock");
// Cursor de rotacion de journeys (dentro de .git, no versionado).
const statePath = path.join(root, ".git", "fitbros-audit-state.json");
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

function fetchOriginBranch() {
  try {
    git("fetch", "--quiet", "origin", config.branch);
    return null;
  } catch (error) {
    return {
      action: "stop",
      reason: "remote_fetch_failed",
      message: error.stderr ? String(error.stderr).trim() : error.message,
    };
  }
}

function releaseLock() {
  if (fs.existsSync(lockPath)) {
    const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
    // Solo soltar el lock si lo tomo el auditor; no pisar al desarrollador.
    if (lock.role && lock.role !== "auditor") {
      output({ action: "not_released", reason: "lock_owned_by_other_role", lock });
      return;
    }
  }
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
    role: "auditor",
    acquiredAt: new Date().toISOString(),
    pid: process.pid,
    head: git("rev-parse", "HEAD"),
  };
  fs.writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
  return { ok: true, lock };
}

function readState() {
  if (!fs.existsSync(statePath)) return { cursor: -1, history: [] };
  try {
    return JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch {
    return { cursor: -1, history: [] };
  }
}

function advanceJourney() {
  const journeys = config.journeys;
  const state = readState();
  const nextCursor = (state.cursor + 1) % journeys.length;
  const journey = journeys[nextCursor];
  const newState = {
    cursor: nextCursor,
    lastJourney: journey,
    lastSelectedAt: new Date().toISOString(),
    history: [...(state.history || []), journey].slice(-journeys.length),
  };
  fs.writeFileSync(statePath, `${JSON.stringify(newState, null, 2)}\n`);
  return journey;
}

function nextRequirementId(markdown) {
  const ids = [...markdown.matchAll(/^## REQ-(\d+) - /gm)].map((m) => Number(m[1]));
  const max = ids.length ? Math.max(...ids) : 0;
  return `REQ-${max + 1}`;
}

function selfTest() {
  const journeys = config.journeys;
  if (!Array.isArray(journeys) || journeys.length === 0) {
    throw new Error("agent-audit-loop.json: journeys vacio");
  }
  const sample = "## REQ-12 - x\n## REQ-73 - y\n";
  if (nextRequirementId(sample) !== "REQ-74") {
    throw new Error(`nextRequirementId fallo: ${nextRequirementId(sample)}`);
  }
  if (config.limits.mayModifyAppCode !== false) {
    throw new Error("El auditor no debe poder modificar codigo de la app");
  }
  return { action: "self_test_passed", journeys: journeys.length };
}

function selectAudit() {
  const branch = git("branch", "--show-current");
  const dirty = git("status", "--porcelain");
  const head = git("rev-parse", "HEAD");

  if (branch !== config.branch) {
    return { action: "stop", reason: "branch_mismatch", expected: config.branch, actual: branch };
  }
  if (dirty) {
    return { action: "stop", reason: "dirty_worktree", files: dirty.split("\n") };
  }

  const fetchError = fetchOriginBranch();
  if (fetchError) return { ...fetchError, branch, head };

  let upstream = "";
  try {
    upstream = git("rev-parse", `origin/${config.branch}`);
  } catch {
    return { action: "stop", reason: "origin_branch_unavailable", branch, head };
  }
  if (head !== upstream) {
    return { action: "stop", reason: "remote_ahead_or_diverged", head, upstream };
  }

  const requirementPath = path.join(root, config.requirementFile);
  const markdown = fs.readFileSync(requirementPath, "utf8");

  return {
    action: "audit",
    journey: advanceJourney(),
    nextRequirementId: nextRequirementId(markdown),
    subagent: config.subagent,
    runbook: config.runbook,
    limits: config.limits,
    policy: config.policy,
    previousCommit: git("log", "-1", "--pretty=%H %s"),
  };
}

function checkPublish() {
  const branch = git("branch", "--show-current");
  const dirty = git("status", "--porcelain");
  const head = git("rev-parse", "HEAD");

  if (branch !== config.branch) {
    return { action: "stop", reason: "branch_mismatch", expected: config.branch, actual: branch };
  }
  if (dirty) {
    return { action: "stop", reason: "dirty_worktree_before_push", files: dirty.split("\n") };
  }

  const fetchError = fetchOriginBranch();
  if (fetchError) return { ...fetchError, branch, head };

  const upstream = git("rev-parse", `origin/${config.branch}`);
  let parent = "";
  try {
    parent = git("rev-parse", "HEAD^");
  } catch {
    return { action: "stop", reason: "commit_parent_unavailable", head, upstream };
  }
  if (parent !== upstream) {
    return { action: "stop", reason: "remote_advanced_during_run", head, parent, upstream };
  }

  return { action: "ready_to_push", head, parent, upstream };
}

if (args.has("--self-test")) {
  output(selfTest());
} else if (args.has("--release")) {
  releaseLock();
} else if (args.has("--check-publish")) {
  output(checkPublish());
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

  if (process.exitCode !== 2) {
    const selection = selectAudit();
    let lockReleased = false;
    if (selection.action === "stop" && lock && fs.existsSync(lockPath)) {
      fs.unlinkSync(lockPath);
      lockReleased = true;
    }
    output({ ...selection, lock, lockReleased });
  }
}
