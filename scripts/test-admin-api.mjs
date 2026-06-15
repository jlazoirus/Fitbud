import fs from "node:fs";

async function importHandler(path) {
  const source = fs.readFileSync(new URL("../" + path, import.meta.url), "utf8");
  const url = "data:text/javascript;base64," + Buffer.from(source).toString("base64");
  return (await import(url)).default;
}

function response(status, data) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  };
}

function capture() {
  return {
    statusCode: 0,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

process.env.SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_PUBLISHABLE_KEY = "publishable";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service";

const admin = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  email: "admin@example.com",
};
const testUser = {
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  email: "qa-flow@fitbros.app",
  user_metadata: { fitbros_test_user: true },
};
const handler = await importHandler("api/admin.js");

let requests = [];
global.fetch = async (url, options = {}) => {
  const value = String(url);
  requests.push({ url: value, method: options.method || "GET", body: options.body || "" });
  if (value.endsWith("/auth/v1/user")) return response(200, admin);
  if (value.includes("/rest/v1/profiles?id=eq." + admin.id)) {
    return response(200, [{ id: admin.id, email: admin.email, is_admin: true, active: true }]);
  }
  if (value.includes("/auth/v1/admin/users?page=")) return response(200, { users: [] });
  if (value.endsWith("/auth/v1/admin/users") && options.method === "POST") return response(200, testUser);
  if (value.includes("/auth/v1/admin/users/" + testUser.id) && options.method === "PUT") return response(200, testUser);
  if (value.includes("/storage/v1/object/list/progress-photos")) return response(200, []);
  if (value.includes("/rest/v1/") && options.method === "DELETE") return response(204, {});
  if (value.includes("/rest/v1/profiles?on_conflict=id") && options.method === "POST") return response(200, [{}]);
  throw new Error("Ruta no simulada: " + value);
};

let res = capture();
await handler({
  method: "POST",
  headers: { authorization: "Bearer admin-token" },
  body: {
    action: "prepareTestUser",
    email: testUser.email,
    password: "FitbrosQA!2026",
  },
}, res);
assert(res.statusCode === 200 && res.body.created === true, "Debe crear la cuenta QA si no existe.");
assert(requests.some((item) => item.url.endsWith("/auth/v1/admin/users") && item.method === "POST"), "Debe crear el usuario en Auth.");
assert(requests.filter((item) => item.method === "DELETE" && item.url.includes("/rest/v1/")).length === 6, "Debe limpiar las seis tablas personales.");
assert(requests.some((item) => item.url.includes("/rest/v1/profiles?on_conflict=id") && item.method === "POST"), "Debe reiniciar el perfil.");

requests = [];
global.fetch = async (url, options = {}) => {
  const value = String(url);
  requests.push({ url: value, method: options.method || "GET", body: options.body || "" });
  if (value.endsWith("/auth/v1/user")) return response(200, admin);
  if (value.includes("/rest/v1/profiles?id=eq." + admin.id)) {
    return response(200, [{ id: admin.id, email: admin.email, is_admin: true, active: true }]);
  }
  if (value.includes("/auth/v1/admin/users?page=")) return response(200, { users: [testUser] });
  if (value.includes("/rest/v1/profiles?id=eq." + testUser.id)) {
    return response(200, [{ id: testUser.id, email: testUser.email, is_admin: false, active: true }]);
  }
  if (value.includes("/auth/v1/admin/users/" + testUser.id) && options.method === "PUT") return response(200, testUser);
  if (value.includes("/storage/v1/object/list/progress-photos")) return response(200, []);
  if (value.includes("/rest/v1/") && options.method === "DELETE") return response(204, {});
  if (value.includes("/rest/v1/profiles?on_conflict=id") && options.method === "POST") return response(200, [{}]);
  throw new Error("Ruta no simulada: " + value);
};

res = capture();
await handler({
  method: "POST",
  headers: { authorization: "Bearer admin-token" },
  body: {
    action: "prepareTestUser",
    email: testUser.email,
    password: "FitbrosQA!2026",
  },
}, res);
assert(res.statusCode === 200 && res.body.created === false, "Debe reiniciar una cuenta QA existente.");
assert(!requests.some((item) => item.url.endsWith("/auth/v1/admin/users") && item.method === "POST"), "No debe duplicar la cuenta QA.");

global.fetch = async (url) => {
  const value = String(url);
  if (value.endsWith("/auth/v1/user")) return response(200, admin);
  if (value.includes("/rest/v1/profiles?id=eq." + admin.id)) {
    return response(200, [{ id: admin.id, email: admin.email, is_admin: true, active: true }]);
  }
  if (value.includes("/auth/v1/admin/users?page=")) {
    return response(200, { users: [{ ...testUser, user_metadata: {} }] });
  }
  throw new Error("Ruta no simulada: " + value);
};

res = capture();
await handler({
  method: "POST",
  headers: { authorization: "Bearer admin-token" },
  body: {
    action: "prepareTestUser",
    email: testUser.email,
    password: "FitbrosQA!2026",
  },
}, res);
assert(res.statusCode === 409, "No debe limpiar una cuenta normal con el mismo correo.");

console.log("API admin: usuario QA reiniciable verificado con mocks.");
