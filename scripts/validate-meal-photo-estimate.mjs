#!/usr/bin/env node
// REQ-172 — Estimar macros con foto: el proxy acepta la imagen solo para
// meal_estimate, la valida antes de reservar cuota y la envía como bloque
// image antes del texto; la respuesta trae estimación + preguntas (0-2).
import assert from "node:assert/strict";
import fs from "node:fs";

const api = fs.readFileSync(new URL("../api/claude.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

// ── Comportamiento de imageInput() (extraído del proxy) ───────────────────────
const pick = (re, label) => { const m = api.match(re); assert.ok(m, `falta ${label}`); return m[0]; };
const src = [
  pick(/const IMAGE_ACTIONS = [^\n]+/, "IMAGE_ACTIONS"),
  pick(/const IMAGE_MEDIA_TYPES = [^\n]+/, "IMAGE_MEDIA_TYPES"),
  pick(/const MAX_IMAGE_BASE64 = [^\n]+/, "MAX_IMAGE_BASE64"),
  pick(/function imageInput\(body, action\) \{[\s\S]*?\n\}/, "imageInput"),
].join("\n");
const imageInput = new Function(`${src}\nreturn imageInput;`)();
const jpeg = { mediaType: "image/jpeg", data: "/9j/4AAQSkZJRgABAQ==" };
assert.equal(imageInput({}, "meal_estimate"), null, "sin imagen no hay bloque");
assert.deepEqual(imageInput({ image: jpeg }, "meal_estimate"), jpeg, "acepta JPEG base64 para meal_estimate");
assert.throws(() => imageInput({ image: jpeg }, "diet_day"), /no acepta imagenes/, "otras acciones no aceptan imagen");
assert.throws(() => imageInput({ image: { ...jpeg, mediaType: "image/gif" } }, "meal_estimate"), /Formato/, "rechaza tipos no soportados");
assert.throws(() => imageInput({ image: { ...jpeg, data: "no es base64!" } }, "meal_estimate"), /invalida/, "rechaza base64 inválido");
assert.throws(() => imageInput({ image: { ...jpeg, data: "A".repeat(3_000_004) } }, "meal_estimate"), /grande/, "rechaza imágenes demasiado grandes");
console.log("  imageInput: solo meal_estimate, tipos y tamaño validados");

// ── Cableado del proxy ────────────────────────────────────────────────────────
assert.ok(/STRUCTURED_OUTPUT_ACTIONS = new Set\([^)]*"meal_estimate"/.test(api), "meal_estimate usa structured outputs");
assert.ok(api.includes('required: ["nombre", "kcal", "proteina_g", "carbohidratos_g", "grasa_g", "nota", "preguntas"]'), "schema con preguntas");
const content = pick(/function userContent\(body, quota\) \{[\s\S]*?\n\}/, "userContent");
assert.ok(content.indexOf('type: "image"') < content.indexOf('type: "text"'), "la imagen va antes del texto");
const handler = api.slice(api.indexOf("export default async function handler"));
assert.ok(handler.indexOf("imageInput(body, quota.action)") < handler.indexOf("reserveCoachAction("),
  "la imagen se valida antes de reservar cuota");
console.log("  Proxy: schema, orden de bloques y validación previa a la cuota");

// ── Cableado del cliente ──────────────────────────────────────────────────────
const editor = html.slice(html.indexOf("function editorSheet("), html.indexOf("function readEditor("));
assert.ok(editor.includes('accept="image/*" capture="environment"'), "el editor (agregar/editar) ofrece cámara");
assert.ok(editor.includes("pickMealPhoto()"), "botón Estimar con foto");
assert.ok(html.includes("...(image?{image}:{})"), "callClaude envía la imagen al proxy");
assert.ok(html.includes("`photo:${st.hash}:${hashText(qa)}`"), "la reutilización de respuestas depende de la foto y las respuestas");
assert.ok(html.includes("MEAL_PHOTO_MAX_PX=1024") && html.includes('toDataURL("image/jpeg",0.82)'), "la foto se reduce antes de enviarse");
assert.ok(/st\.round<MEAL_PHOTO_MAX_ROUNDS/.test(html), "las preguntas tienen un tope de rondas");
console.log("  Cliente: cámara en el editor, reducción, rondas acotadas y clave por foto");

console.log("validate-meal-photo-estimate: OK");
