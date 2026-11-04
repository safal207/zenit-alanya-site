(() => {
  'use strict';
  const translations = {
    ru: {
      add: 'Добавить фото', change: 'Заменить фото', alt: 'Фото игрока',
      invalid: 'Выбери JPG, PNG или WebP до 12 МБ.',
      unreadable: 'Не удалось открыть фото. Попробуй другой файл.',
      unavailable: 'Не удалось сохранить изменения. Попробуй ещё раз.',
      photoSaved: 'Фото сохранено в аккаунте.', photoRemoved: 'Фото удалено.',
      planSaved: 'Твой план сохранён.'
    },
    tr: {
      back: '← Kulüp sitesine dön', kicker: 'Oyuncu alanı', title: 'Benim futbolum',
      lead: 'Neleri yapabiliyorum, neyi geliştiriyorum ve bundan sonra ne istiyorum?',
      add: 'Fotoğraf ekle', change: 'Fotoğrafı değiştir', remove: 'Fotoğrafı kaldır', alt: 'Oyuncu fotoğrafı',
      photoNote: 'Fotoğrafını yalnızca kendi hesabında görebilirsin. En fazla 12 MB, JPG, PNG veya WebP.',
      step: '01 · Bir sonraki adımım', plan: 'Antrenörümle planım', name: 'Adım ne?',
      nameExample: 'Adın veya takma adın', strength: 'Artık yapabildiğim şey',
      strengthExample: 'Örneğin, boşta olan takım arkadaşımı görüyorum',
      goal: 'Antrenmanda ne deneyeceğim?', goalExample: 'Örneğin, topu almadan önce başımı kaldırmak',
      directions: '02 · Bundan sonra ne istiyorum?',
      routeNote: 'Şu anda ilgini çeken yolu seç. Uygun grupları, maçları ve seçmeleri antrenörünle konuş.',
      team: 'Takımımda gelişmek', teamNote: 'Oyna, yeni roller dene ve güçlü yanlarını geliştir.',
      matches: 'Daha fazla maç oynamak', matchesNote: 'Sana uygun maç ve grupları öğren.',
      academy: 'Seçmeler hakkında bilgi almak', academyNote: 'Antrenörüne nasıl hazırlanabileceğini sor.',
      open: 'Henüz karar vermedim', openNote: 'Farklı bir tempo, yeni bir rol veya ara vermeyi konuşabilirsin.',
      save: 'Planımı kaydet', planSaved: 'Planın kaydedildi.',
      invalid: 'En fazla 12 MB boyutunda bir JPG, PNG veya WebP seç.',
      unreadable: 'Fotoğraf açılamadı. Başka bir dosya dene.',
      unavailable: 'Değişiklikler kaydedilemedi. Tekrar dene.',
      photoSaved: 'Fotoğraf hesabına kaydedildi.', photoRemoved: 'Fotoğraf kaldırıldı.'
    },
    en: {
      back: '← Back to the club', kicker: 'Player dashboard', title: 'My football',
      lead: 'What I can do, what I’m working on and where I want to go next.',
      add: 'Add a photo', change: 'Change photo', remove: 'Remove photo', alt: 'Player photo',
      photoNote: 'Your photo is visible only in your account. JPG, PNG or WebP up to 12 MB.',
      step: '01 · My next step', plan: 'My plan with my coach', name: 'What’s my name?',
      nameExample: 'Name or nickname', strength: 'What I can already do',
      strengthExample: 'For example, I can spot a teammate in space',
      goal: 'What I’ll try at training', goalExample: 'For example, look up before receiving the ball',
      directions: '02 · Where I want to go next',
      routeNote: 'Choose what interests you now. Talk to your coach about suitable groups, matches and trials.',
      team: 'Grow with my team', teamNote: 'Play, try new roles and build on your strengths.',
      matches: 'Play more matches', matchesNote: 'Find out which matches and groups might suit you.',
      academy: 'Learn about trials', academyNote: 'Ask your coach what to work on and how to prepare.',
      open: 'I’m still deciding', openNote: 'Talk about a different pace, a new role or taking a break.',
      save: 'Save my plan', planSaved: 'Your plan was saved.',
      invalid: 'Choose a JPG, PNG or WebP image up to 12 MB.',
      unreadable: 'The photo couldn’t be opened. Try another file.',
      unavailable: 'The changes couldn’t be saved. Try again.',
      photoSaved: 'Your photo was saved to your account.', photoRemoved: 'Your photo was removed.'
    }
  };
  const accountText = {
    ru: {
      login: 'Логин', loginNote: 'От 3 до 24 знаков. Латинские буквы, цифры, дефис или подчёркивание.',
      password: 'Пароль', passwordNote: 'От 12 символов. Сохрани пароль, чтобы войти с другого устройства.',
      invite: 'Одноразовый код клуба', importDraft: 'Перенести черновик с устройства', signout: 'Выйти',
      signIn: 'Войти', signInTitle: 'Войти в кабинет', signInIntro: 'Войди, чтобы открыть своё фото и футбольный план.',
      register: 'Создать аккаунт', registerIntro: 'Введи код клуба и придумай свой логин и пароль.',
      toRegister: 'У меня есть код клуба', toLogin: 'У меня уже есть аккаунт',
      loading: 'Открываем кабинет…', expired: 'Сеанс завершён. Войди ещё раз.',
      invalid_login: 'Проверь логин и пароль.', invalid_input: 'Проверь формат логина, пароля и кода.',
      registration_unavailable: 'Код недействителен или логин занят. Проверь код и попробуй другой логин.',
      try_later: 'Слишком много попыток. Попробуй немного позже.',
      registered: 'Аккаунт создан. Войди с новым логином и паролем.',
      accountError: 'Не удалось открыть кабинет. Попробуй ещё раз.',
      imported: 'Черновик перенесён в аккаунт.'
    },
    tr: {
      login: 'Kullanıcı adı', loginNote: '3–24 karakter. Latin harfleri, rakamlar, kısa çizgi veya alt çizgi.',
      password: 'Şifre', passwordNote: 'En az 12 karakter. Başka bir cihazdan giriş için şifreni sakla.',
      invite: 'Tek kullanımlık kulüp kodu', importDraft: 'Bu cihazdaki taslağı aktar', signout: 'Çıkış yap',
      signIn: 'Giriş yap', signInTitle: 'Oyuncu hesabına giriş', signInIntro: 'Fotoğrafını ve futbol planını görmek için giriş yap.',
      register: 'Hesap oluştur', registerIntro: 'Kulüp kodunu gir, kullanıcı adını ve şifreni seç.',
      toRegister: 'Kulüp kodum var', toLogin: 'Zaten hesabım var',
      loading: 'Hesap açılıyor…', expired: 'Oturum sona erdi. Yeniden giriş yap.',
      invalid_login: 'Kullanıcı adını ve şifreni kontrol et.', invalid_input: 'Kullanıcı adı, şifre ve kod biçimini kontrol et.',
      registration_unavailable: 'Kod geçersiz veya kullanıcı adı kullanılıyor. Kodu kontrol et ve başka bir ad dene.',
      try_later: 'Çok fazla deneme. Daha sonra tekrar dene.',
      registered: 'Hesap oluşturuldu. Yeni kullanıcı adın ve şifrenle giriş yap.',
      accountError: 'Hesap açılamadı. Tekrar dene.', imported: 'Taslak hesabına aktarıldı.'
    },
    en: {
      login: 'Username', loginNote: '3–24 characters. Latin letters, numbers, hyphens or underscores.',
      password: 'Password', passwordNote: 'At least 12 characters. Keep your password to sign in on another device.',
      invite: 'One-time club code', importDraft: 'Move the draft from this device', signout: 'Sign out',
      signIn: 'Sign in', signInTitle: 'Sign in to your player account', signInIntro: 'Sign in to open your photo and football plan.',
      register: 'Create account', registerIntro: 'Enter your club code and choose a username and password.',
      toRegister: 'I have a club code', toLogin: 'I already have an account',
      loading: 'Opening your account…', expired: 'Your session has ended. Sign in again.',
      invalid_login: 'Check your username and password.', invalid_input: 'Check the username, password and code format.',
      registration_unavailable: 'The code is invalid or the username is taken. Check the code and try another username.',
      try_later: 'Too many attempts. Try again in a little while.',
      registered: 'Account created. Sign in with your new username and password.',
      accountError: 'Your account couldn’t be opened. Try again.', imported: 'Your draft was moved to your account.'
    }
  };
  const get = id => document.getElementById(id);
  const requested = new URLSearchParams(window.location.search).get('lang');
  const language = ['tr', 'en'].includes(requested) ? requested : 'ru';
  const copy = {...translations[language], ...accountText[language]};
  document.documentElement.lang = language;
  if (copy.title) document.title = copy.title + ' — Zenit Alanya';
  document.querySelectorAll('[data-copy]').forEach(el => {
    const value = copy[el.dataset.copy];
    if (value) el.textContent = value;
  });
  document.querySelectorAll('[data-placeholder]').forEach(el => {
    const value = copy[el.dataset.placeholder];
    if (value) el.placeholder = value;
  });

  const form = get('player-form');
  const profileKey = 'zenit-alanya-player-v1';
  const photoKey = 'zenit-alanya-player-photo-v1';
  const photo = get('player-photo');
  const photoInput = get('photo-input');
  const photoRemove = get('photo-remove');
  const photoStatus = get('photo-status');
  const planStatus = get('plan-status');
  const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const supportedRoutes = ['team', 'matches', 'academy', ''];
  const api = window.ZenitPlayer;
  const auth = get('auth-form');
  const accountStatus = get('account-status');
  const importButton = get('import-draft');
  const lockTargets = [photoInput, photoRemove, importButton, get('save-plan'), get('signout')];
  let profile = null;
  let mode = 'login';
  let busy = false;

  function read(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  function readProfile() {
    try { return JSON.parse(read(profileKey)) || {}; } catch { return {}; }
  }
  function clean(value, length) {
    return typeof value === 'string' ? value.trim().slice(0, length) : '';
  }
  function showName(value) {
    const name = get('player-name');
    name.textContent = value;
    name.hidden = !value;
  }
  function isPhoto(value) {
    return typeof value === 'string' && value.length <= 320_000 &&
      /^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]+={0,2}$/.test(value);
  }
  function showPhoto(value) {
    const valid = isPhoto(value);
    if (valid) photo.src = value;
    else photo.removeAttribute('src');
    photo.alt = copy.alt;
    photo.hidden = !valid;
    get('avatar-placeholder').hidden = valid;
    photoRemove.hidden = !valid;
    get('photo-label').textContent = valid ? copy.change : copy.add;
  }
  async function resizePhoto(file) {
    const url = URL.createObjectURL(file);
    try {
      const source = new Image();
      source.src = url;
      await source.decode();
      if (!source.naturalWidth || !source.naturalHeight ||
          source.naturalWidth * source.naturalHeight > 50_000_000) throw Error('Unsupported image size');
      const scale = Math.min(1, 512 / Math.max(source.naturalWidth, source.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(source.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(source.naturalHeight * scale));
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) throw Error('Canvas unavailable');
      context.fillStyle = '#e4f2f8';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(source, 0, 0, canvas.width, canvas.height);
      const result = canvas.toDataURL('image/jpeg', 0.85);
      if (!isPhoto(result)) throw Error('Image conversion failed');
      return result;
    } finally { URL.revokeObjectURL(url); }
  }

  function fields(data) {
    return {
      nickname: clean(data.nickname, 40),
      strength: clean(data.strength, 180),
      goal: clean(data.goal, 180),
      route: supportedRoutes.includes(data.route) ? data.route : ''
    };
  }

  function draft() {
    const values = fields(readProfile());
    const oldPhoto = read(photoKey);
    return isPhoto(oldPhoto) ? {...values, photo_jpeg: oldPhoto} : values;
  }

  function updateDraftOption() {
    importButton.hidden = !profile || Object.values(profile).some(Boolean) ||
      !Object.values(draft()).some(Boolean);
  }

  function setMode(next) {
    mode = next;
    const registering = mode === 'register';
    get('account-title').textContent = copy[registering ? 'register' : 'signInTitle'];
    get('account-intro').textContent = copy[registering ? 'registerIntro' : 'signInIntro'];
    get('auth-submit').textContent = copy[registering ? 'register' : 'signIn'];
    get('auth-switch').textContent = copy[registering ? 'toLogin' : 'toRegister'];
    get('invite-field').hidden = !registering;
    auth.elements.invite.required = registering;
    auth.elements.invite.disabled = !registering;
    auth.elements.password.autocomplete = registering ? 'new-password' : 'current-password';
    if (!registering) auth.elements.invite.value = '';
  }

  function showGuest(message = '') {
    profile = null;
    form.reset();
    showName('');
    showPhoto(null);
    form.hidden = true;
    get('player-tools').hidden = true;
    get('player-avatar').hidden = true;
    get('photo-actions').hidden = true;
    get('photo-note').hidden = true;
    get('player-hero').classList.add('is-guest');
    photoStatus.textContent = '';
    planStatus.textContent = '';
    auth.hidden = false;
    setMode('login');
    accountStatus.textContent = message;
  }

  function showAccount(data) {
    profile = {...fields(data), photo_jpeg: isPhoto(data.photo_jpeg) ? data.photo_jpeg : null};
    Object.entries(fields(profile)).forEach(([name, value]) => { form.elements[name].value = value; });
    showName(profile.nickname);
    showPhoto(profile.photo_jpeg);
    updateDraftOption();
    accountStatus.textContent = '';
    auth.hidden = true;
    auth.reset();
    form.hidden = false;
    get('player-tools').hidden = false;
    get('player-avatar').hidden = false;
    get('photo-actions').hidden = false;
    get('photo-note').hidden = false;
    get('player-hero').classList.remove('is-guest');
  }

  async function loadAccount() {
    accountStatus.textContent = copy.loading;
    try {
      showAccount(await api.load());
    } catch (error) {
      showGuest(error.code === 'expired' ? copy.expired : copy.accountError);
    }
  }

  get('auth-switch').addEventListener('click', () => {
    setMode(mode === 'login' ? 'register' : 'login');
    accountStatus.textContent = '';
    auth.elements.login.focus();
  });

  auth.addEventListener('submit', async event => {
    event.preventDefault();
    const action = mode;
    const {login, password, invite} = auth.elements;
    const buttons = [get('auth-submit'), get('auth-switch')];
    buttons.forEach(button => { button.disabled = true; });
    accountStatus.textContent = copy.loading;
    try {
      const signedIn = await api.authenticate(action, login.value, password.value, invite.value);
      password.value = '';
      if (signedIn) await loadAccount();
      else {
        setMode('login');
        accountStatus.textContent = copy.registered;
        password.focus();
      }
    } catch (error) {
      accountStatus.textContent = copy[error.code] || copy.accountError;
    } finally { buttons.forEach(button => { button.disabled = false; }); }
  });

  async function writeChanges(status, operation) {
    if (busy || !profile) return;
    busy = true;
    lockTargets.forEach(control => { control.disabled = true; });
    status.textContent = '';
    try {
      await operation();
    } catch (error) {
      if (error.code === 'expired') showGuest(copy.expired);
      else status.textContent = copy.unavailable;
    } finally {
      busy = false;
      lockTargets.forEach(control => { control.disabled = false; });
    }
  }

  async function save(changes) {
    await api.save(changes);
    Object.assign(profile, changes);
    updateDraftOption();
  }

  form.addEventListener('input', () => { planStatus.textContent = ''; });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const changes = fields(Object.fromEntries(new FormData(form)));
    return writeChanges(planStatus, async () => {
      await save(changes);
      showName(changes.nickname);
      planStatus.textContent = copy.planSaved;
    });
  });

  photoInput.addEventListener('change', () => {
    const file = photoInput.files[0];
    photoInput.value = '';
    if (!file || busy) return;
    if (!supportedTypes.includes(file.type) || !file.size || file.size > 12 * 1024 * 1024) {
      photoStatus.textContent = copy.invalid;
      return;
    }
    return writeChanges(photoStatus, async () => {
      let photo;
      try { photo = await resizePhoto(file); }
      catch { photoStatus.textContent = copy.unreadable; return; }
      await save({photo_jpeg: photo});
      showPhoto(photo);
      photoStatus.textContent = copy.photoSaved;
    });
  });

  photoRemove.addEventListener('click', async () => {
    await writeChanges(photoStatus, async () => {
      await save({photo_jpeg: null});
      showPhoto(null);
      photoStatus.textContent = copy.photoRemoved;
    });
    if (photoRemove.hidden && profile) photoInput.focus();
  });

  importButton.addEventListener('click', () => writeChanges(planStatus, async () => {
    if (!profile || Object.values(profile).some(Boolean)) return;
    const savedDraft = draft();
    await save(savedDraft);
    try {
      localStorage.removeItem(profileKey);
      if (savedDraft.photo_jpeg) localStorage.removeItem(photoKey);
    } catch {}
    showAccount(profile);
    planStatus.textContent = copy.imported;
  }));

  get('signout').addEventListener('click', () => {
    if (busy) return;
    void api.logout();
    showGuest();
    auth.elements.login.focus();
  });

  if (api.hasSession()) void loadAccount();
  else showGuest();
})();
