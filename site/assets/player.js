(() => {
  'use strict';
  const translations = {
    ru: {
      add: 'Добавить фото', change: 'Заменить фото', alt: 'Фото игрока',
      invalid: 'Выбери JPG, PNG или WebP до 12 МБ.',
      unreadable: 'Не удалось открыть фото. Попробуй другой файл.',
      unavailable: 'Браузер не сохранил изменения. Проверь доступное место и настройки хранения.',
      photoSaved: 'Фото сохранено в этом браузере.', photoRemoved: 'Фото удалено.',
      planSaved: 'Твой план сохранён.'
    },
    tr: {
      back: '← Kulüp sitesine dön', kicker: 'Oyuncu alanı', title: 'Benim futbolum',
      lead: 'Neleri yapabiliyorum, neyi geliştiriyorum ve bundan sonra ne istiyorum?',
      add: 'Fotoğraf ekle', change: 'Fotoğrafı değiştir', remove: 'Fotoğrafı kaldır', alt: 'Oyuncu fotoğrafı',
      photoNote: 'Fotoğraf ve plan yalnızca bu tarayıcıda saklanır. En fazla 12 MB, JPG, PNG veya WebP.',
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
      unavailable: 'Tarayıcı değişiklikleri kaydedemedi. Depolama alanını ve ayarlarını kontrol et.',
      photoSaved: 'Fotoğraf bu tarayıcıya kaydedildi.', photoRemoved: 'Fotoğraf kaldırıldı.'
    },
    en: {
      back: '← Back to the club', kicker: 'Player dashboard', title: 'My football',
      lead: 'What I can do, what I’m working on and where I want to go next.',
      add: 'Add a photo', change: 'Change photo', remove: 'Remove photo', alt: 'Player photo',
      photoNote: 'Your photo and plan stay in this browser. JPG, PNG or WebP up to 12 MB.',
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
      unavailable: 'Your browser couldn’t save the changes. Check its storage settings and available space.',
      photoSaved: 'Your photo was saved in this browser.', photoRemoved: 'Your photo was removed.'
    }
  };
  const get = id => document.getElementById(id);
  const requested = new URLSearchParams(window.location.search).get('lang');
  const language = ['tr', 'en'].includes(requested) ? requested : 'ru';
  const copy = translations[language];
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
  let photoAttempt = 0;

  function read(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  function write(key, value) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
      return true;
    } catch { return false; }
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
  function showPhoto(value) {
    const valid = typeof value === 'string' && value.length < 750_000 &&
      /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
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
      if (!result.startsWith('data:image/jpeg;base64,') || result.length >= 750_000) throw Error('Image conversion failed');
      return result;
    } finally { URL.revokeObjectURL(url); }
  }

  const saved = readProfile();
  form.elements.nickname.value = clean(saved.nickname, 40);
  form.elements.strength.value = clean(saved.strength, 180);
  form.elements.goal.value = clean(saved.goal, 180);
  form.elements.route.value = supportedRoutes.includes(saved.route) ? saved.route : '';
  showName(form.elements.nickname.value);
  showPhoto(read(photoKey));

  form.addEventListener('input', () => { planStatus.textContent = ''; });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const route = form.elements.route.value;
    const next = {
      nickname: clean(form.elements.nickname.value, 40),
      strength: clean(form.elements.strength.value, 180),
      goal: clean(form.elements.goal.value, 180),
      route: supportedRoutes.includes(route) ? route : ''
    };
    const ok = write(profileKey, JSON.stringify(next));
    if (ok) showName(next.nickname);
    planStatus.textContent = ok ? copy.planSaved : copy.unavailable;
  });
  photoInput.addEventListener('change', async () => {
    const file = photoInput.files[0];
    photoInput.value = '';
    if (!file) return;
    const attempt = ++photoAttempt;
    photoStatus.textContent = '';
    if (!supportedTypes.includes(file.type) || !file.size || file.size > 12 * 1024 * 1024) {
      photoStatus.textContent = copy.invalid;
      return;
    }
    let result;
    try { result = await resizePhoto(file); }
    catch {
      if (attempt === photoAttempt) photoStatus.textContent = copy.unreadable;
      return;
    }
    if (attempt !== photoAttempt) return;
    const ok = write(photoKey, result);
    if (ok) showPhoto(result);
    photoStatus.textContent = ok ? copy.photoSaved : copy.unavailable;
  });
  photoRemove.addEventListener('click', () => {
    photoAttempt += 1;
    const ok = write(photoKey, null);
    if (ok) {
      showPhoto(null);
      photoInput.focus();
    }
    photoStatus.textContent = ok ? copy.photoRemoved : copy.unavailable;
  });
  form.hidden = false;
  get('photo-actions').hidden = false;
})();
