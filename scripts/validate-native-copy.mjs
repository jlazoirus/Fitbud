#!/usr/bin/env node
// NAT-28 — REQ-31 y textos sin compra en la app (COBRO-WEB.md §4).
// Análisis estático, no reemplaza la QA de cada pantalla ni revisa datos remotos.
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const ROOT=fileURLToPath(new URL("../",import.meta.url));
const normalize=value=>{
  let decoded=value.replace(/&#(x[0-9a-f]+|\d+);/gi,(_,number)=>{
    const code=number[0].toLowerCase()==="x"?parseInt(number.slice(1),16):Number(number);
    return code<=0x10ffff?String.fromCodePoint(code):"";
  });
  try{decoded=decodeURIComponent(decoded);}catch{/* Un '%' suelto también es copy válido. */}
  return decoded.normalize("NFD").replace(/[\u0300-\u036f\u200b-\u200d\ufeff]/g,"").toLowerCase();
};
const RULES=[
  ["REQ-31",/\b(?:ia|ai|claude|anthropic|openai|chatgpt|gpt|gemini|modelos?|prompts?|tokens?|cuotas?|proveedor(?:es)?)\b|inteligencia\s+artificial/],
  ["compra",/\b(?:comprar|compra|compras|planes|suscribete|suscribirse|suscripcion|suscripciones|renueva)\b|renovar\s+(?:tu\s+)?(?:acceso|plan|suscripcion)\b/],
  ["precio",/\bs\s*\/|\busd\b|\bus\$|\$\s*\d|\d\s*\$/],
  ["enlace de compra",/\/(?:planes|pago)(?=[/?#\s.]|$)/],
  // No hay un WhatsApp de soporte identificado en el contrato nativo actual.
  // Las URLs de WhatsApp son rutas comerciales hasta definir ese caso de uso.
  ["WhatsApp comercial",/wa\.me(?:\/|\b)|(?:api\.|web\.)?whatsapp\.com|whatsapp:\/\//],
];

function included(filename){
  const name=filename.replaceAll("\\","/");
  return /\.[cm]?[jt]sx?$/.test(name)
    && !/\.d\.[cm]?ts$/.test(name)
    && !/(?:^|\/)(?:__tests__|tests|__mocks__)(?:\/|$)/.test(name)
    && !/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(name)
    && !/(?:^|\/)src\/core\/types(?:\/|$)/.test(name);
}

function compound(node){
  return ts.isTemplateExpression(node)
    || (ts.isBinaryExpression(node)&&node.operatorToken.kind===ts.SyntaxKind.PlusToken);
}
function staticText(node){
  if(ts.isStringLiteralLike(node)||ts.isJsxText(node))return node.text;
  if(ts.isNumericLiteral(node))return node.text;
  if(ts.isParenthesizedExpression(node)||ts.isAsExpression(node)||ts.isSatisfiesExpression(node))return staticText(node.expression);
  if(ts.isBinaryExpression(node)&&node.operatorToken.kind===ts.SyntaxKind.PlusToken){
    const left=staticText(node.left),right=staticText(node.right);
    return left===null&&right===null?null:(left??" ")+(right??" ");
  }
  if(ts.isTemplateExpression(node)){
    return node.head.text+node.templateSpans.map(span=>(staticText(span.expression)??" ")+span.literal.text).join("");
  }
  return null;
}

function inspect(source,filename){
  const kind=/[jt]sx$/.test(filename)?ts.ScriptKind.TSX:ts.ScriptKind.TS;
  const file=ts.createSourceFile(filename,source,ts.ScriptTarget.Latest,true,kind);
  const issues=file.parseDiagnostics.map(diagnostic=>({
    file:filename,line:file.getLineAndCharacterOfPosition(diagnostic.start||0).line+1,
    rule:"sintaxis",text:ts.flattenDiagnosticMessageText(diagnostic.messageText," "),
  }));
  function visit(node){
    // Excepciones explícitas: nombres de símbolos/claves, tipos e imports son
    // identificadores internos, no copy. Los VALORES string sí se comprueban,
    // incluso en constantes, errores, etiquetas accesibles y funciones de datos.
    if(ts.isImportDeclaration(node)||ts.isExportDeclaration(node)||ts.isTypeNode(node))return;
    const parent=node.parent;
    const key=parent?.name===node&&(ts.isPropertyAssignment(parent)||ts.isMethodDeclaration(parent)
      ||ts.isPropertyDeclaration(parent)||ts.isPropertySignature(parent));
    const modulePath=parent&&ts.isCallExpression(parent)&&parent.arguments[0]===node
      && ((ts.isIdentifier(parent.expression)&&parent.expression.text==="require")
        ||parent.expression.kind===ts.SyntaxKind.ImportKeyword);
    const templatePart=parent&&(ts.isTemplateSpan(parent)||ts.isTemplateExpression(parent))
      && (ts.isTemplateHead(node)||ts.isTemplateMiddle(node)||ts.isTemplateTail(node));
    if(!key&&!modulePath&&!templatePart&&(ts.isStringLiteralLike(node)||ts.isJsxText(node)||compound(node))){
      const text=staticText(node);
      // Revisar también partes por separado: una expresión desconocida no debe
      // ocultar un literal prohibido que esté dentro de la concatenación.
      if(text!==null){
        for(const [rule,pattern] of RULES){
          if(pattern.test(normalize(text))){
            issues.push({file:filename,line:file.getLineAndCharacterOfPosition(node.getStart(file)).line+1,rule,text:text.trim().slice(0,120)});
          }
        }
      }
    }
    ts.forEachChild(node,visit);
  }
  visit(file);
  return issues.filter((issue,index,all)=>all.findIndex(other=>other.line===issue.line&&other.rule===issue.rule)===index);
}

function selfTest(){
  const bad=[
    '<Text>IA</Text>',
    '<Text accessibilityLabel="CUÓTAS">Tu coach</Text>',
    'const message = "El modelo Claude usa tokens";',
    '<Button title="Suscríbete" />',
    '<Text>Planes desde S/ 29.90</Text>',
    '<Text>{`USD ${amount}`}</Text>',
    'Linking.openURL("https://evolvapp.club/planes");',
    'Linking.openURL("/pago?plan=monthly");',
    'Linking.openURL("https://evolvapp.club/%70lanes");',
    'const label = "mo" + "delo";',
    'const label = `pro${"mpt"}`;',
    '<Text>I&#65;</Text>',
    'const href = "https://wa.me/51900000000";',
    '<Text>{`Tu proveedor es ${name}`}</Text>',
  ];
  for(const source of bad)assert.ok(inspect(source,"fixture.tsx").length,`Debe rechazar: ${source}`);
  const good=`
    import { token } from "./modelos";
    export { quota } from "./cuotas";
    type Internal = { token: string; provider: "claude" };
    const token = session.access_token;
    const fields = { "token": token, "modelo": value };
    const module = require("./planes");
    // IA, precios y cuotas en un comentario técnico no son copy.
    const UI = <Text accessibilityLabel="Tu coach">Tu día, a tu ritmo.</Text>;
    const help = "https://evolvapp.club/privacidad";
    const notice = "Tu acceso no está activo. Toca Actualizar.";
    const label = "Porción y calorías";
    const menu = "Renovar opciones de comida";
    const url = "https://evolvapp.club/settings/";
  `;
  assert.deepEqual(inspect(good,"fixture.tsx"),[]);
  assert.ok(inspect('<Text title="sin cerrar>',"broken.tsx").some(issue=>issue.rule==="sintaxis"));
  for(const filename of ["native/src/core/core.test.ts","native/app/screen.spec.tsx","native/src/__tests__/copy.tsx","native/src/core/types/domain.ts","native/src/data/api.d.ts"]){
    assert.equal(included(filename),false,filename);
  }
  assert.equal(included("native/src/features/hoy/Screen.tsx"),true);
  console.log(`Native copy: auto-test OK (${bad.length} casos negativos, copy válido y exclusiones).`);
}

function scan(directory){
  const files=[];
  if(!existsSync(directory))return files;
  for(const entry of readdirSync(directory,{withFileTypes:true})){
    const absolute=path.join(directory,entry.name);
    if(entry.isDirectory())files.push(...scan(absolute));
    else if(entry.isFile()&&included(path.relative(ROOT,absolute)))files.push(absolute);
  }
  return files.sort();
}

selfTest();
if(!process.argv.includes("--self-test")){
  const files=[...scan(path.join(ROOT,"native/app")),...scan(path.join(ROOT,"native/src"))];
  assert.ok(files.length,"NAT-28: no se encontraron fuentes nativas para revisar.");
  const issues=files.flatMap(file=>inspect(readFileSync(file,"utf8"),path.relative(ROOT,file)));
  for(const issue of issues)console.error(`${issue.file}:${issue.line}: ${issue.rule}: ${issue.text}`);
  if(issues.length)process.exitCode=1;
  else console.log(`Native copy: ${files.length} archivos sin lenguaje interno, precios ni rutas de compra.`);
}
