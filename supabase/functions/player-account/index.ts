const allowedOrigins = new Set(["https://safal207.github.io", "https://zenit-alanya-club-concept.safalex.chatgpt.site"]);
const backend = Deno.env.get("SUPABASE_URL")!;
const publicKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
Deno.serve(async request => {
  const origin = request.headers.get("Origin") || "";
  if (!allowedOrigins.has(origin)) return new Response(null, { status: 403 });
const cors = {
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Headers": "apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
  Vary: "Origin",
};

function reply(status: number, value: object): Response {
  return Response.json(value, { status, headers: cors });
}

function send(path: string, body: object, privileged = false): Promise<Response> {
  const key = privileged ? serviceKey : publicKey;
  return fetch(backend + path, {
    method: "POST",
    headers: {
      apikey: key,
      ...(privileged ? { Authorization: "Bearer " + key } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function rpc(name: string, payload: object) {
  const result = await send("/rest/v1/rpc/" + name, payload, true);
  if (!result.ok) throw Error("Database operation failed");
  if (result.status === 204) return null;
  return result.json();
}

function passwordSession(alias: string, password: string): Promise<Response> {
  return send("/auth/v1/token?grant_type=password", { email: alias, password });
}

async function signIn(alias: string, password: string): Promise<Response> {
  const response = await passwordSession(alias, password);
  if (response.status === 429) return reply(429, { code: "try_later" });
  if (response.status >= 500) return reply(503, { code: "unavailable" });
  if (!response.ok) return reply(401, { code: "invalid_login" });
  const { access_token, refresh_token } = await response.json();
  if (typeof access_token !== "string" || typeof refresh_token !== "string") {
    return reply(503, { code: "unavailable" });
  }
  return reply(200, { access_token, refresh_token });
}

async function register(login: string, password: string, invite: string): Promise<Response> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(invite));
  const hash = Array.from(new Uint8Array(bytes), n => n.toString(16).padStart(2, "0")).join("");
  const freshAlias = crypto.randomUUID() + "@players.example.com";
  const reserved = await rpc("zenit_claim_invite", { p_hash: hash, p_login: login, p_alias: freshAlias });
  const pending = reserved ? { claim: reserved, alias: freshAlias }
    : await rpc("zenit_pending_signup", { p_hash: hash, p_login: login });
  if (!pending) return reply(409, { code: "registration_unavailable" });
  const { claim, alias } = pending;

  const created = await send("/auth/v1/admin/users", {
    email: alias, password, email_confirm: true,
  }, true);
  let id;
  if (created.ok) {
    ({ id } = await created.json());
  } else {
    const problem = await created.json().catch(() => ({}));
    if (problem.code === "weak_password") return reply(400, { code: "invalid_input" });
    if (!["email_exists", "user_already_exists"].includes(problem.code)) {
      return reply(503, { code: "unavailable" });
    }
    // An earlier attempt may have created the Auth account before losing its response.
    const existing = await passwordSession(alias, password);
    if (existing.status === 429) return reply(429, { code: "try_later" });
    if (!existing.ok) return reply(401, { code: "invalid_login" });
    id = (await existing.json()).user?.id;
  }
  if (typeof id !== "string") return reply(503, { code: "unavailable" });
  const finished = await rpc("zenit_finish_signup", { p_claim: claim, p_user: id });
  if (!finished && await rpc("zenit_login_alias", { p_login: login }) !== alias) {
    return reply(503, { code: "unavailable" });
  }
  // The account is ready even if the login provider is briefly unavailable.
  try {
    const session = await signIn(alias, password);
    if (session.ok) return session;
  } catch {
    // The player can sign in again with the login and password just chosen.
  }
  return reply(201, { registered: true });
}

  if (request.method === "OPTIONS") return new Response(null, { headers: cors });
  if (request.method !== "POST") return reply(405, { code: "invalid_request" });
  if (!request.headers.get("Content-Type")?.startsWith("application/json")) {
    return reply(415, { code: "invalid_request" });
  }

  let input;
  try {
    const reader = request.body?.getReader();
    if (!reader) return reply(400, { code: "invalid_request" });
    const decoder = new TextDecoder("utf-8", { fatal: true });
    let body = "", size = 0;
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > 2048) {
        await reader.cancel();
        return reply(413, { code: "invalid_request" });
      }
      body += decoder.decode(part.value, { stream: true });
    }
    input = JSON.parse(body + decoder.decode());
  } catch {
    return reply(400, { code: "invalid_request" });
  }
  if (!input || typeof input !== "object") return reply(400, { code: "invalid_request" });

  const login = typeof input.login === "string" ? input.login.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (!/^[a-z0-9][a-z0-9_-]{2,23}$/.test(login) || password.length < 12 ||
      new TextEncoder().encode(password).byteLength > 72) {
    return reply(400, { code: "invalid_input" });
  }
  try {
    if (input.action === "register") {
      const invite = typeof input.invite === "string" ? input.invite.trim() : "";
      if (!/^[A-Za-z0-9_-]{22}$/.test(invite)) return reply(400, { code: "invalid_input" });
      return await register(login, password, invite);
    }
    if (input.action === "login") {
      const alias = await rpc("zenit_login_alias", { p_login: login });
      return alias ? await signIn(alias, password) : reply(401, { code: "invalid_login" });
    }
    return reply(400, { code: "invalid_request" });
  } catch {
    return reply(503, { code: "unavailable" });
  }
});
