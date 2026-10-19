#!/usr/bin/env node
// Selector y validador del backlog de migración nativa (docs/native-migration/PLAN.md).
// Coordina a varios agentes en paralelo: el estado vive en native-migration.json en
// origin/main y un reclamo es un commit que pasa la tarea a "en_curso".
//
// Uso:
//   node scripts/native-next-task.mjs --validate            valida JSON + BACKLOG.md
//   node scripts/native-next-task.mjs --list [--all]        tareas disponibles (o todas)
//   node scripts/native-next-task.mjs --status              resumen por fase y estado
//   node scripts/native-next-task.mjs --next                siguiente tarea disponible
//   node scripts/native-next-task.mjs --claim NAT-xx --agent <id> [--no-fetch] [--no-commit]
//   node scripts/native-next-task.mjs --release NAT-xx      vuelve a "pendiente"
//   node scripts/native-next-task.mjs --done NAT-xx [--human]
//   node scripts/native-next-task.mjs --block NAT-xx --reason "<texto>"
//   node scripts/native-next-task.mjs --stale               reclamos vencidos
//   node scripts/native-next-task.mjs --pause --reason "<texto>" [--resume-when "<condición>"]
//   node scripts/native-next-task.mjs --resume --human      solo una persona reanuda
//   node scripts/native-next-task.mjs --self-test
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PLAN_FILE = "native-migration.json";
const PLAN_PATH = path.join(ROOT, PLAN_FILE);
const argv = process.argv.slice(2);
const has = (flag) => argv.includes(flag);
const valueOf = (flag) => {
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : null;
};

function output(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function fail(reason, extra = {}) {
  output({ action: "stop", reason, ...extra });
  process.exit(1);
}

function git(...args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function readPlan() {
  return JSON.parse(fs.readFileSync(PLAN_PATH, "utf8"));
}

function writePlan(plan) {
  fs.writeFileSync(PLAN_PATH, `${JSON.stringify(plan, null, 2)}\n`);
}

function remotePlan(branch) {
  try {
    return JSON.parse(git("show", `origin/${branch}:${PLAN_FILE}`));
  } catch {
    return null;
  }
}

function byId(plan) {
  return new Map(plan.tasks.map((task) => [task.id, task]));
}

function findCycle(tasks) {
  const map = new Map(tasks.map((task) => [task.id, task]));
  const state = new Map();
  const stack = [];
  const visit = (id) => {
    if (state.get(id) === "done") return null;
    if (state.get(id) === "visiting") return [...stack.slice(stack.indexOf(id)), id];
    state.set(id, "visiting");
    stack.push(id);
    for (const dep of map.get(id)?.deps || []) {
      if (!map.has(dep)) continue;
      const cycle = visit(dep);
      if (cycle) return cycle;
    }
    stack.pop();
    state.set(id, "done");
    return null;
  };
  for (const task of tasks) {
    const cycle = visit(task.id);
    if (cycle) return cycle;
  }
  return null;
}

function validate(plan, backlogText) {
  const errors = [];
  if (!plan || !Array.isArray(plan.tasks) || !plan.tasks.length) return ["native-migration.json has no tasks"];
  if (plan.paused != null && (typeof plan.paused !== "object" || !plan.paused.since || !plan.paused.reason)) {
    errors.push("paused must be null or an object with since and reason");
  }
  const statuses = new Set(plan.statuses || []);
  const ids = new Set();
  for (const task of plan.tasks) {
    const where = task.id || "(sin id)";
    if (!/^NAT-(H\d+|\d{2})$/.test(task.id || "")) errors.push(`${where}: id must match NAT-Hn or NAT-nn`);
    if (ids.has(task.id)) errors.push(`${where}: duplicate id`);
    ids.add(task.id);
    if (!task.title) errors.push(`${where}: missing title`);
    if (!Number.isInteger(task.phase) || !(String(task.phase) in (plan.phases || {}))) errors.push(`${where}: unknown phase ${task.phase}`);
    if (!statuses.has(task.status)) errors.push(`${where}: invalid status "${task.status}"`);
    if (task.human !== String(task.id).startsWith("NAT-H")) errors.push(`${where}: human flag must match NAT-H prefix`);
    if (!Array.isArray(task.deps)) errors.push(`${where}: deps must be an array`);
    if (!Array.isArray(task.paths) || !task.paths.length) errors.push(`${where}: paths must list the write scope`);
    if (task.status === "en_curso" && (!task.owner || !task.claimedAt)) errors.push(`${where}: en_curso requires owner and claimedAt`);
    if (task.status === "bloqueado" && !task.note) errors.push(`${where}: bloqueado requires a note`);
  }
  const map = byId(plan);
  for (const task of plan.tasks) {
    for (const dep of task.deps || []) {
      if (!map.has(dep)) errors.push(`${task.id}: unknown dependency ${dep}`);
      if (dep === task.id) errors.push(`${task.id}: depends on itself`);
    }
    if (task.status === "hecho") {
      const open = (task.deps || []).filter((dep) => map.get(dep)?.status !== "hecho");
      if (open.length) errors.push(`${task.id}: hecho but dependencies are not: ${open.join(", ")}`);
    }
  }
  const cycle = findCycle(plan.tasks);
  if (cycle) errors.push(`dependency cycle: ${cycle.join(" -> ")}`);
  const groups = new Map();
  for (const task of plan.tasks) {
    if (task.exclusiveGroup && task.status === "en_curso") {
      groups.set(task.exclusiveGroup, [...(groups.get(task.exclusiveGroup) || []), task.id]);
    }
  }
  for (const [group, owners] of groups) {
    if (owners.length > 1) errors.push(`exclusiveGroup ${group} has several tasks en_curso: ${owners.join(", ")}`);
  }
  if (typeof backlogText === "string") {
    const headings = new Set([...backlogText.matchAll(/^## (NAT-(?:H\d+|\d{2})) — /gm)].map((m) => m[1]));
    for (const id of ids) if (!headings.has(id)) errors.push(`${id}: missing "## ${id} — " section in ${plan.backlog}`);
    for (const id of headings) if (!ids.has(id)) errors.push(`${id}: section in ${plan.backlog} without task in ${PLAN_FILE}`);
  }
  return errors;
}

function busyGroups(plan) {
  return new Set(plan.tasks.filter((task) => task.status === "en_curso" && task.exclusiveGroup).map((task) => task.exclusiveGroup));
}

function availability(plan, task) {
  const map = byId(plan);
  if (plan.paused) return { ok: false, reason: "plan_paused" };
  if (task.status !== "pendiente") return { ok: false, reason: `status_${task.status}` };
  if (task.human) return { ok: false, reason: "human_decision" };
  const open = task.deps.filter((dep) => map.get(dep)?.status !== "hecho");
  if (open.length) return { ok: false, reason: "dependencies_open", open };
  if (task.exclusiveGroup && busyGroups(plan).has(task.exclusiveGroup)) {
    return { ok: false, reason: "exclusive_group_busy", group: task.exclusiveGroup };
  }
  return { ok: true };
}

function available(plan) {
  return plan.tasks
    .filter((task) => availability(plan, task).ok)
    .sort((a, b) => a.phase - b.phase || a.id.localeCompare(b.id));
}

// Tareas que más trabajo desbloquean primero: así varios agentes no se pisan en la cola.
function unblockScore(plan, id) {
  const dependents = plan.tasks.filter((task) => task.deps.includes(id));
  return dependents.length + dependents.reduce((sum, task) => sum + unblockScore(plan, task.id), 0);
}

function summarize(task) {
  return {
    id: task.id,
    title: task.title,
    phase: task.phase,
    track: task.track,
    deps: task.deps,
    paths: task.paths,
    ...(task.exclusiveGroup ? { exclusiveGroup: task.exclusiveGroup } : {}),
  };
}

function mutate(id, change) {
  const plan = readPlan();
  const task = byId(plan).get(id);
  if (!task) fail("unknown_task", { id });
  const result = change(plan, task);
  const errors = validate(plan, null);
  if (errors.length) fail("invalid_after_change", { id, errors });
  writePlan(plan);
  return { plan, task, result };
}

function commitPlan(message) {
  git("add", PLAN_FILE);
  git("commit", "-m", message, "--", PLAN_FILE);
  return git("rev-parse", "HEAD");
}

function cmdClaim(id) {
  const agent = valueOf("--agent") || process.env.NATIVE_AGENT_ID;
  if (!agent) fail("missing_agent", { hint: "Pasa --agent <id> o define NATIVE_AGENT_ID" });
  const local = readPlan();
  if (!has("--no-commit") && git("status", "--porcelain")) fail("dirty_worktree");
  if (!has("--no-fetch")) {
    try {
      git("fetch", "--quiet", "origin", local.branch);
    } catch (error) {
      fail("remote_fetch_failed", { message: String(error.stderr || error.message).trim() });
    }
  }
  const remote = remotePlan(local.branch) || local;
  if (local.paused || remote.paused) fail("plan_paused", { paused: remote.paused || local.paused });
  const remoteTask = byId(remote).get(id);
  if (!remoteTask) fail("unknown_task", { id });
  const check = availability(remote, remoteTask);
  if (!check.ok) fail("not_available_on_origin", { id, ...check, owner: remoteTask.owner });
  const localTask = byId(local).get(id);
  if (!localTask || localTask.status !== remoteTask.status) {
    fail("local_plan_out_of_date", { id, hint: `Actualiza tu rama con origin/${local.branch} antes de reclamar` });
  }
  const { task } = mutate(id, (_plan, t) => {
    t.status = "en_curso";
    t.owner = agent;
    t.claimedAt = new Date().toISOString();
  });
  const commit = has("--no-commit") ? null : commitPlan(`chore(native): ${id} en curso (${agent})`);
  output({
    action: "claimed",
    task: summarize(task),
    owner: agent,
    commit,
    next: commit
      ? `git push origin HEAD:${local.branch}  # si lo rechaza, otro agente reclamó antes: ver NATIVE_AGENT.md`
      : "Commitea native-migration.json como primer commit de tu PR",
  });
}

function selfTest() {
  const mk = (id, deps = [], extra = {}) => ({
    id, title: id, phase: 1, track: "core", human: id.startsWith("NAT-H"), deps, paths: ["x"],
    status: "pendiente", owner: null, claimedAt: null, doneAt: null, note: "", ...extra,
  });
  const base = { statuses: ["pendiente", "en_curso", "hecho", "bloqueado"], phases: { 1: "x" }, backlog: "B" };
  const plan = {
    ...base,
    tasks: [
      mk("NAT-H1"),
      mk("NAT-01"),
      mk("NAT-02", ["NAT-01"]),
      mk("NAT-03", [], { exclusiveGroup: "g", status: "en_curso", owner: "a", claimedAt: "2026-01-01T00:00:00Z" }),
      mk("NAT-04", [], { exclusiveGroup: "g" }),
      mk("NAT-05", ["NAT-H1"]),
    ],
  };
  const ids = available(plan).map((task) => task.id);
  if (ids.join(",") !== "NAT-01") throw new Error(`availability failed: ${ids}`);
  if (availability(plan, byId(plan).get("NAT-04")).reason !== "exclusive_group_busy") throw new Error("exclusive group not enforced");
  if (availability(plan, byId(plan).get("NAT-H1")).reason !== "human_decision") throw new Error("human task offered to agent");
  if (availability(plan, byId(plan).get("NAT-05")).reason !== "dependencies_open") throw new Error("human dependency not enforced");
  if (unblockScore(plan, "NAT-01") !== 1) throw new Error("unblock score failed");
  const cyclic = { ...base, tasks: [mk("NAT-01", ["NAT-02"]), mk("NAT-02", ["NAT-01"])] };
  if (!validate(cyclic, null).some((e) => e.startsWith("dependency cycle"))) throw new Error("cycle not detected");
  const doneEarly = { ...base, tasks: [mk("NAT-01"), mk("NAT-02", ["NAT-01"], { status: "hecho" })] };
  if (!validate(doneEarly, null).some((e) => e.includes("hecho but dependencies"))) throw new Error("done-before-deps not detected");
  const paused = { ...plan, paused: { since: "2026-01-01", reason: "x" } };
  if (available(paused).length || availability(paused, byId(paused).get("NAT-01")).reason !== "plan_paused") throw new Error("pause not enforced");
  if (!validate({ ...base, paused: { since: "2026-01-01" }, tasks: [mk("NAT-01")] }, null).some((e) => e.startsWith("paused"))) throw new Error("invalid pause not detected");
  const missingDoc = validate({ ...base, tasks: [mk("NAT-01")] }, "## NAT-02 — x\n");
  if (missingDoc.length !== 2) throw new Error(`backlog cross-check failed: ${missingDoc}`);
  const errors = validate(readPlan(), readBacklog(readPlan()));
  if (errors.length) throw new Error(`real plan invalid: ${errors.join("; ")}`);
  return { action: "self_test_passed", checks: 11 };
}

function readBacklog(plan) {
  const file = path.join(ROOT, plan.backlog);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}

const plan = readPlan();
const id = argv.find((arg) => /^NAT-/.test(arg));

if (has("--self-test")) {
  output(selfTest());
} else if (has("--validate")) {
  const errors = validate(plan, readBacklog(plan));
  if (errors.length) {
    console.error("Native migration plan validation failed:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  const counts = Object.fromEntries(plan.statuses.map((s) => [s, plan.tasks.filter((t) => t.status === s).length]));
  console.log(`Native migration plan OK: ${plan.tasks.length} tasks ${JSON.stringify(counts)}, ${available(plan).length} available.`);
} else if (has("--status")) {
  const phases = Object.entries(plan.phases).map(([phase, name]) => {
    const tasks = plan.tasks.filter((task) => String(task.phase) === phase);
    const count = (s) => tasks.filter((task) => task.status === s).length;
    return { phase: Number(phase), name, total: tasks.length, hecho: count("hecho"), en_curso: count("en_curso"), bloqueado: count("bloqueado") };
  });
  const inProgress = plan.tasks.filter((t) => t.status === "en_curso").map((t) => ({ id: t.id, owner: t.owner, claimedAt: t.claimedAt }));
  const humanOpen = plan.tasks.filter((t) => t.human && t.status !== "hecho").map((t) => `${t.id} ${t.title}`);
  output({ action: "status", paused: plan.paused || null, phases, inProgress, humanDecisionsOpen: humanOpen });
} else if (has("--list")) {
  const tasks = has("--all") ? plan.tasks : available(plan);
  output({
    action: "list",
    tasks: tasks.map((task) => ({ ...summarize(task), status: task.status, ...(has("--all") ? { availability: availability(plan, task) } : {}) })),
  });
} else if (has("--next")) {
  const candidates = available(plan).sort((a, b) => unblockScore(plan, b.id) - unblockScore(plan, a.id) || a.phase - b.phase || a.id.localeCompare(b.id));
  if (plan.paused) {
    output({ action: "stop", reason: "plan_paused", paused: plan.paused });
  } else if (!candidates.length) {
    const blockedByHumans = plan.tasks.filter((t) => t.human && t.status !== "hecho").map((t) => t.id);
    output({ action: plan.tasks.every((t) => t.status === "hecho") ? "complete" : "stop", reason: "no_available_task", humanDecisionsOpen: blockedByHumans });
  } else {
    output({ action: "implement", task: summarize(candidates[0]), alternatives: candidates.slice(1, 6).map((t) => t.id) });
  }
} else if (has("--claim")) {
  if (!id) fail("missing_task_id");
  cmdClaim(id);
} else if (has("--release")) {
  if (!id) fail("missing_task_id");
  const { task } = mutate(id, (_p, t) => {
    if (t.status !== "en_curso" && t.status !== "bloqueado") fail("not_claimed", { id, status: t.status });
    t.status = "pendiente";
    t.owner = null;
    t.claimedAt = null;
  });
  output({ action: "released", id: task.id });
} else if (has("--done")) {
  if (!id) fail("missing_task_id");
  const { task } = mutate(id, (p, t) => {
    if (t.human && !has("--human")) fail("human_task_requires_flag", { id, hint: "Solo una persona cierra NAT-Hx (usa --human)" });
    const open = t.deps.filter((dep) => byId(p).get(dep)?.status !== "hecho");
    if (open.length) fail("dependencies_open", { id, open });
    t.status = "hecho";
    t.doneAt = new Date().toISOString().slice(0, 10);
  });
  output({ action: "done", id: task.id, unblocks: plan.tasks.filter((t) => t.deps.includes(task.id)).map((t) => t.id) });
} else if (has("--block")) {
  const reason = valueOf("--reason");
  if (!id || !reason) fail("missing_task_id_or_reason");
  const { task } = mutate(id, (_p, t) => {
    t.status = "bloqueado";
    t.note = reason;
  });
  output({ action: "blocked", id: task.id, note: task.note });
} else if (has("--pause")) {
  const reason = valueOf("--reason");
  if (!reason) fail("missing_reason");
  const next = readPlan();
  next.paused = { since: new Date().toISOString().slice(0, 10), reason, ...(valueOf("--resume-when") ? { resumeWhen: valueOf("--resume-when") } : {}) };
  writePlan(next);
  output({ action: "paused", paused: next.paused, inProgress: next.tasks.filter((t) => t.status === "en_curso").map((t) => t.id) });
} else if (has("--resume")) {
  if (!has("--human")) fail("resume_requires_human", { hint: "Solo una persona reanuda la migración (usa --human)" });
  const next = readPlan();
  if (!next.paused) fail("not_paused");
  next.paused = null;
  writePlan(next);
  output({ action: "resumed", available: available(next).map((t) => t.id) });
} else if (has("--stale")) {
  const limit = plan.claimStaleDays * 86400000;
  const stale = plan.tasks.filter((t) => t.status === "en_curso" && Date.now() - Date.parse(t.claimedAt) > limit);
  output({ action: "stale", claimStaleDays: plan.claimStaleDays, tasks: stale.map((t) => ({ id: t.id, owner: t.owner, claimedAt: t.claimedAt })) });
} else {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 18).map((l) => l.replace(/^\/\/ ?/, "")).join("\n"));
}
