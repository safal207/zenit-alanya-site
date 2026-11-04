(() => {
  'use strict';
  const base = 'https://tqhewqpzpfviwhicsnzm.supabase.co';
  const key = 'sb_publishable_lBf2dxU2XctPKcKode-VQA__Dsv47Wc';
  const storageKey = 'zenit-player-session-v1';
  const profile = '/rest/v1/zenit_player_profiles';
  let session = null;
  let refresh = null;
  let profileId = null;

  function tokenPair(value) {
    return typeof value?.access_token === 'string' && typeof value?.refresh_token === 'string'
      ? { access_token: value.access_token, refresh_token: value.refresh_token } : null;
  }

  try { session = tokenPair(JSON.parse(sessionStorage.getItem(storageKey))); } catch {}

  function setSession(next) {
    session = tokenPair(next);
    try {
      if (session) sessionStorage.setItem(storageKey, JSON.stringify(session));
      else sessionStorage.removeItem(storageKey);
    } catch {}
  }

  function request(path, method = 'GET', body, token, prefer) {
    return fetch(base + path, {
      method,
      cache: 'no-store',
      headers: {
        apikey: key,
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(prefer ? { Prefer: prefer } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
  }

  function fail(code) { throw Object.assign(new Error(code), { code }); }

  async function renew(used) {
    if (!session) fail('expired');
    if (session !== used) return;
    if (!refresh) {
      refresh = (async () => {
        const response = await request('/auth/v1/token?grant_type=refresh_token', 'POST', { refresh_token: used.refresh_token });
        if (session !== used) return;
        if ([400, 401, 403].includes(response.status)) {
          setSession(null);
          fail('expired');
        }
        if (!response.ok) fail('unavailable');
        const next = tokenPair(await response.json());
        if (!next) fail('unavailable');
        setSession(next);
      })().finally(() => { refresh = null; });
    }
    await refresh;
  }

  async function authorized(path, method, data, prefer) {
    const used = session;
    if (!used) fail('expired');
    let response = await request(path, method, data, used.access_token, prefer);
    if (response.status === 401) {
      await renew(used);
      if (!session) fail('expired');
      response = await request(path, method, data, session.access_token, prefer);
    }
    if (response.status === 401) { setSession(null); fail('expired'); }
    if (!response.ok) fail('unavailable');
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length !== 1) fail('unavailable');
    return rows[0];
  }

  window.ZenitPlayer = {
    hasSession: () => Boolean(session),
    async authenticate(action, login, password, invite) {
      const response = await request('/functions/v1/player-account', 'POST', { action, login, password, invite });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) fail(data?.code || 'unavailable');
      if (data?.registered) return false;
      if (!tokenPair(data)) fail('unavailable');
      profileId = null;
      setSession(data);
      return true;
    },
    async load() {
      const row = await authorized(profile + '?select=id,nickname,strength,goal,route,photo_jpeg');
      if (!/^[a-f0-9-]{36}$/.test(row.id)) fail('unavailable');
      profileId = row.id;
      return row;
    },
    async save(changes) {
      if (!profileId) fail('expired');
      return authorized(profile + '?id=eq.' + profileId + '&select=id', 'PATCH', changes, 'return=representation');
    },
    async logout() {
      const token = session?.access_token;
      profileId = null;
      setSession(null);
      if (token) await request('/auth/v1/logout?scope=local', 'POST', {}, token).catch(() => {});
    }
  };
})();
