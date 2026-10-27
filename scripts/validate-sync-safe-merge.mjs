// REQ-280 — Conflictos de sync: el botón "Combinar seguro" nunca aparecía.
//
// Causa raíz: _resolveQueuedConflictPayload() calculaba merged.merged con
// mergeDayLogStates() (que ya conserva los cambios NO conflictivos de ambos
// lados) pero lo descartaba cuando merged.ok===false, y _markSyncConflict()
// nunca escribía item.conflict.autoMergedPayload. Los dos lectores de esa
// propiedad (hasMerge en openSyncConflicts, la rama "merge" de
// resolveSyncConflict) quedaban muertos desde el commit original de REQ-73.
//
// Este test ejecuta las funciones REALES extraídas de index.html (no una
// reimplementación) contra un conflicto con un campo en disputa y cambios
// no conflictivos en ambos lados, y verifica que autoMergedPayload termine
// escrito en la cola con el merge parcial correcto.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import "../sync-conflicts.js";

const SYNC_ENGINE = globalThis.FITBUD_SYNC_CONFLICTS;
assert.ok(SYNC_ENGINE && SYNC_ENGINE.mergeDayLogStates, "sync-conflicts.js debe exponer mergeDayLogStates");

const HERE = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(HERE, "..", "index.html"), "utf8");

function extractFunctionSource(source, signature) {
  const start = source.indexOf(signature);
  assert.ok(start >= 0, `No se encontró "${signature}" en index.html`);
  let depth = 0, i = source.indexOf("{", start);
  for (; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") { depth--; if (depth === 0) break; }
  }
  return source.slice(start, i + 1);
}

const appendLogSrc = extractFunctionSource(html, "function appendSyncResolutionLogToPayload(");
const payloadSameEnoughSrc = extractFunctionSource(html, "function _payloadSameEnough(");
const resolveSrc = extractFunctionSource(html, "function _resolveQueuedConflictPayload(");
const markConflictSrc = extractFunctionSource(html, "function _markSyncConflict(");

// _markSyncConflict debe aceptar y guardar el merge parcial.
assert.ok(markConflictSrc.includes("autoMergedPayload"), "_markSyncConflict debe guardar autoMergedPayload en item.conflict");

// El llamador en drainSyncQueue debe propagar resolved.autoMergedPayload.
assert.ok(
  html.includes("_markSyncConflict(item,remotePayload,resolved.conflicts,resolved.autoMergedPayload)"),
  "drainSyncQueue debe pasar resolved.autoMergedPayload a _markSyncConflict"
);

// resolveSyncConflict (acción "merge") debe aplicar el estado localmente,
// igual que la acción "local", para que el botón funcione de punta a punta.
const resolveConflictSrc = extractFunctionSource(html, "function resolveSyncConflict(id,action){");
assert.ok(
  /action==="merge"[\s\S]*?S\.days\[item\.entityKey\]=payload\.state/.test(resolveConflictSrc),
  'resolveSyncConflict("merge") debe aplicar payload.state a S.days antes de reencolar'
);

let queue = [];
function _getSyncQ() { return JSON.parse(JSON.stringify(queue)); }
function _setSyncQ(q) { queue = q; }
function _updateSyncBadge() {}
function syncClientId() { return "test-client"; }

const context = vm.createContext({ SYNC_ENGINE, _getSyncQ, _setSyncQ, _updateSyncBadge, syncClientId, console });
vm.runInContext(appendLogSrc, context, { filename: "appendSyncResolutionLogToPayload.js" });
vm.runInContext(payloadSameEnoughSrc, context, { filename: "_payloadSameEnough.js" });
vm.runInContext(resolveSrc, context, { filename: "_resolveQueuedConflictPayload.js" });
vm.runInContext(markConflictSrc, context, { filename: "_markSyncConflict.js" });

// Repro exacta del auditor: base {lunch}, local cambia lunch + agrega
// breakfast y un extra; remoto cambia lunch distinto.
const baseState = { meals: { lunch: { done: false } }, extras: [] };
const localState = { meals: { lunch: { done: true }, breakfast: { done: true } }, extras: [{ name: "Fruta", kcal: 80 }] };
const remoteState = { meals: { lunch: { done: false, note: "cambiado en el otro dispositivo" } }, extras: [] };

const item = {
  id: "item-1",
  uid: "u1",
  entity: "day_log",
  entityKey: "2026-10-26",
  payload: { user_id: "u1", log_date: "2026-10-26", state: localState, updated_at: "2026-10-26T09:00:00.000Z" },
  basePayload: { state: baseState },
  baseRemoteUpdatedAt: "2026-10-26T08:00:00.000Z",
};
queue = [{ ...item, status: "pending", retries: 0 }];

const remotePayload = { user_id: "u1", log_date: "2026-10-26", state: remoteState, updated_at: "2026-10-26T09:30:00.000Z" };

context.item = item;
context.remotePayload = remotePayload;
const resolved = vm.runInContext("_resolveQueuedConflictPayload(item, remotePayload)", context);

assert.equal(resolved.ok, false, "meals.lunch distinto en ambos lados debe seguir marcando conflicto");
assert.ok(Array.isArray(resolved.conflicts) && resolved.conflicts.includes("meals.lunch"), "el conflicto debe identificar meals.lunch");
assert.ok(resolved.autoMergedPayload, "REQ-280: debe calcular un autoMergedPayload aun cuando ok===false");
assert.equal(resolved.autoMergedPayload.state.meals.breakfast.done, true, "el merge parcial conserva el cambio local no conflictivo (breakfast)");
assert.equal(resolved.autoMergedPayload.state.extras.length, 1, "el merge parcial conserva el extra agregado localmente");
assert.ok(
  resolved.autoMergedPayload.state.syncResolutionLog.some(e => e.type === "safe_merge"),
  "el payload combinado queda etiquetado como safe_merge en el historial"
);

context.resolved = resolved;
vm.runInContext("_markSyncConflict(item, remotePayload, resolved.conflicts, resolved.autoMergedPayload)", context);

const stored = queue.find(x => x.id === "item-1");
assert.equal(stored.status, "conflict", "el ítem debe quedar en estado conflict");
assert.ok(stored.conflict && stored.conflict.autoMergedPayload, "REQ-280: item.conflict.autoMergedPayload debe existir tras _markSyncConflict");
assert.equal(stored.conflict.autoMergedPayload.state.meals.breakfast.done, true, "el merge parcial guardado en la cola conserva breakfast");

// hasMerge en openSyncConflicts (index.html) es exactamente esta condición.
const hasMerge = !!(stored.conflict && stored.conflict.autoMergedPayload);
assert.equal(hasMerge, true, 'con este conflicto, el modal debe poder mostrar el botón "Combinar seguro"');

// weight_log sigue sin oferta de merge (fuera de alcance de REQ-280).
const weightItem = {
  id: "item-2", uid: "u1", entity: "weight_log", entityKey: "w2",
  payload: { user_id: "u1", cycle_start: "2026-10-19", week: 2, kg: 79.7, bf_pct: 20, updated_at: "2026-10-26T09:00:00.000Z" },
  basePayload: { user_id: "u1", cycle_start: "2026-10-19", week: 2, kg: 80, bf_pct: 20, updated_at: "2026-10-26T08:00:00.000Z" },
  baseRemoteUpdatedAt: "2026-10-26T08:00:00.000Z",
};
const remoteWeight = { user_id: "u1", cycle_start: "2026-10-19", week: 2, kg: 80.4, bf_pct: 20, updated_at: "2026-10-26T09:30:00.000Z" };
context.item = weightItem;
context.remotePayload = remoteWeight;
const resolvedWeight = vm.runInContext("_resolveQueuedConflictPayload(item, remotePayload)", context);
assert.equal(resolvedWeight.ok, false, "kg distinto en ambos lados debe conflictuar");
assert.equal(resolvedWeight.autoMergedPayload, undefined, "weight_log no debe ofrecer Combinar seguro (fuera de alcance de REQ-280)");

console.log("REQ-280: autoMergedPayload se calcula, se propaga y se guarda — \"Combinar seguro\" puede aparecer en el modal.");
