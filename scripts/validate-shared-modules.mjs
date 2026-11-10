#!/usr/bin/env node
// NAT-02 — portabilidad del dominio compartido, sin APIs del navegador.
// Acorn y eslint-scope son herramientas de desarrollo, nunca runtime de la app.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { parse } from "acorn";
import { analyze } from "eslint-scope";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const CURRENT = [
  ["js/nutrition-pure.js", "FITBUD_NUTRITION_PURE"],
  ["js/nutrition-domain.js", "FITBUD_NUTRITION_DOMAIN"],
  ["domain-contracts.js", "FITBUD_DOMAIN_CONTRACTS"],
  ["exercise-catalog.js", "FITBUD_EXERCISES"],
  ["workout-player.js", "FITBUD_WORKOUT_PLAYER"],
  ["training-plan.js", "FITBUD_TRAINING_PLAN"],
  ["sync-conflicts.js", "FITBUD_SYNC_CONFLICTS"],
];
const BROWSER = new Set([
  "window", "document", "localStorage", "sessionStorage", "location",
  "navigator", "fetch", "XMLHttpRequest", "self",
]);
const identifier = (node, name) => node?.type === "Identifier" && node.name === name;
const propertyName = (node) => node.computed
  ? node.property.type === "Literal" ? node.property.value : null
  : node.property.name;

function walk(node, visit) {
  if (!node || typeof node.type !== "string") return;
  visit(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach((child) => walk(child, visit));
    else if (value && typeof value === "object") walk(value, visit);
  }
}

function isRootFallback(node) {
  const test = node?.test;
  return node?.type === "ConditionalExpression"
    && test?.type === "BinaryExpression" && test.operator === "!=="
    && test.left.type === "UnaryExpression" && test.left.operator === "typeof"
    && identifier(test.left.argument, "window")
    && test.right.type === "Literal" && test.right.value === "undefined"
    && identifier(node.consequent, "window") && identifier(node.alternate, "globalThis");
}

function inspect(source, filename) {
  const comments = [];
  const ast = parse(source, {
    ecmaVersion: "latest", sourceType: "script", locations: true, ranges: true,
    onComment: comments,
  });
  const allowedWindow = new Set();
  const rootNames = new Set(["globalThis"]);
  const namespaces = new Set();
  const errors = [];
  const fail = (node, message) => errors.push(`${filename}:${node.loc.start.line}: ${message}`);
  walk(ast, (node) => {
    if (isRootFallback(node)) {
      allowedWindow.add(node.test.left.argument);
      allowedWindow.add(node.consequent);
    }
    // Reconocer el parámetro de las IIFE que reciben la raíz portable.
    if (node.type === "CallExpression" && /FunctionExpression$/.test(node.callee.type)) {
      node.arguments.forEach((argument, i) => {
        if ((isRootFallback(argument) || identifier(argument, "globalThis"))
          && node.callee.params[i]?.type === "Identifier") rootNames.add(node.callee.params[i].name);
      });
    }
  });
  let previousSize;
  do {
    previousSize = rootNames.size;
    walk(ast, (node) => {
      const target = node.type === "VariableDeclarator" ? node.id : node.type === "AssignmentExpression" ? node.left : null;
      const value = node.type === "VariableDeclarator" ? node.init : node.right;
      if (target?.type === "Identifier" && value?.type === "Identifier" && rootNames.has(value.name)) rootNames.add(target.name);
    });
  } while (rootNames.size !== previousSize);
  const scopes = analyze(ast, { ecmaVersion: 2024, sourceType: "script" });
  for (const { identifier: ref } of scopes.globalScope.through) {
    if (BROWSER.has(ref.name) && !allowedWindow.has(ref)) fail(ref, `API web global: ${ref.name}`);
    if (["eval", "Function"].includes(ref.name)) fail(ref, "código dinámico no verificable");
  }
  walk(ast, (node) => {
    const pattern = node.type === "VariableDeclarator" ? node.id
      : node.type === "AssignmentExpression" ? node.left : null;
    const value = node.type === "VariableDeclarator" ? node.init : node.right;
    if (pattern?.type === "ObjectPattern" && rootNames.has(value?.name)) {
      for (const property of pattern.properties) {
        const name = property.computed ? property.key?.value : property.key?.name;
        if (BROWSER.has(name)) fail(property, `API web extraída de la raíz: ${name}`);
        if (property.type === "RestElement" || name == null) fail(property, "extracción dinámica de la raíz no verificable");
      }
    }
    if (node.type === "MemberExpression" && rootNames.has(node.object.name)) {
      const name = propertyName(node);
      if (name == null) fail(node, "acceso dinámico a la raíz global no verificable");
      if (BROWSER.has(name) || ["eval", "Function"].includes(name)) fail(node, `API web/global no permitida: ${name}`);
    }
    if (node.type === "AssignmentExpression" && node.left.type === "MemberExpression"
      && rootNames.has(node.left.object.name)) {
      const name = propertyName(node.left);
      if (typeof name === "string" && /^FITBUD_[A-Z0-9_]+$/.test(name)) namespaces.add(name);
    }
  });
  if (errors.length) throw new Error(errors.join("\n"));
  return {
    namespaces,
    marked: comments.some((comment) => comment.type === "Line" && comment.value.trim() === "shared-module"),
  };
}

function newContext() {
  // Las primitivas ECMAScript (Array, Object, Map, etc.) las provee vm.
  // Sin require/process, DOM, almacenamiento, red ni temporizadores inyectados.
  return vm.createContext({ console, Intl, Date, Math, JSON }, {
    codeGeneration: { strings: false, wasm: false },
  });
}

function load(source, filename, context, expectedNamespace) {
  const { namespaces } = inspect(source, filename);
  assert.ok(namespaces.size, `${filename}: no publica un namespace FITBUD_*`);
  if (expectedNamespace) assert.ok(namespaces.has(expectedNamespace), `${filename}: falta ${expectedNamespace}`);
  const before = new Map([...namespaces].map((name) => [name, context[name]]));
  new vm.Script(source, { filename }).runInContext(context, { timeout: 1000 });
  for (const name of namespaces) {
    assert.ok(context[name] && ["object", "function"].includes(typeof context[name]), `${filename}: ${name} no se publicó`);
    assert.notEqual(context[name], before.get(name), `${filename}: ${name} no se inicializó`);
  }
}

function selfTest() {
  const wrap = (body) => `(function(root){${body};root.FITBUD_TEST={ok:true};})(typeof window!=="undefined"?window:globalThis);`;
  load(wrap('/* document */ const text="window.document"; const re=/navigator/; const location="gym"; const data={location};'), "positive.js", newContext());
  for (const body of [
    "function unused(){ return document.body; }",
    "function unused(){ return window.document; }",
    "function unused(){ return localStorage.getItem('x'); }",
    "function unused(){ return sessionStorage.getItem('x'); }",
    "function unused(){ return location.href; }",
    "function unused(){ return navigator.onLine; }",
    "function unused(){ return fetch('/api'); }",
    "function unused(){ return new XMLHttpRequest(); }",
    "function unused(){ return root['document']; }",
    "function unused(){ const {document} = globalThis; return document; }",
    "function unused(){ const env=globalThis; return env.document; }",
    "function unused(){ return `${document.title}`; }",
    "function local(){const location='gym';} function unused(){return location.href;}",
    "function unused(){ const key='document'; return globalThis[key]; }",
    "function unused(){ return eval('document'); }",
  ]) assert.throws(() => inspect(wrap(body), "negative.js"), /API web|no verificable/, body);
  assert.throws(() => load("const a = 1;", "missing.js", newContext()), /no publica/);
  assert.throws(() => load("if(false) globalThis.FITBUD_TEST={};", "unpublished.js", newContext()), /no se publicó/);
  assert.throws(() => load(wrap("throw new Error('broken')"), "broken.js", newContext()), /broken/);
  assert.equal(inspect('// shared-module\nglobalThis.FITBUD_TEST={};', "marker.js").marked, true);
  assert.equal(inspect('const text="// shared-module";', "not-marker.js").marked, false);
  console.log("Shared modules: auto-test de APIs web, scope, namespace y ejecución OK.");
}

function jsFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? jsFiles(file) : entry.isFile() && file.endsWith(".js") ? [file] : [];
  }).sort();
}

selfTest();
if (!process.argv.includes("--self-test")) {
  const files = new Map(CURRENT);
  for (const absolute of jsFiles(path.join(ROOT, "js"))) {
    const file = path.relative(ROOT, absolute);
    if (files.has(file)) continue;
    const source = readFileSync(absolute, "utf8");
    // Solo los módulos declarados compartidos entran en este contrato.
    const comments = [];
    parse(source, { ecmaVersion: "latest", sourceType: "module", onComment: comments });
    if (comments.some((c) => c.type === "Line" && c.value.trim() === "shared-module")) files.set(file, null);
  }
  const context = newContext();
  for (const [file, expected] of files) {
    load(readFileSync(path.join(ROOT, file), "utf8"), file, context, expected);
    console.log(`  OK ${file}`);
  }
  console.log(`Shared modules: ${files.size} módulos cargan sin navegador. La ejecución en Hermes se verifica en native/.`);
}
