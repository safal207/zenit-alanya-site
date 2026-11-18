(() => {
  const copy = {
    ru: [
      ['Игровая зона', 'Выбери игру и задание.', 'Малышам', 'Детям', 'Старшим 12+', 'Футбол', 'Шахматы', 'Футбол и шахматы', 'Уровень задания'],
      ['Проведи мяч между фишками.', 'Ведение мяча', 'Найди, куда лучше поставить коня.', 'Урок с конём'],
      ['Выбери угол и попробуй обыграть вратаря.', 'Удары по воротам', 'Атакуй две фигуры одним ходом.', 'Вилка конём'],
      ['Разыграй атаку и доведи её до удара.', 'Матч 5×5', 'Сыграй партию с клубным ботом.', 'Партия с ботом']
    ],
    tr: [
      ['Oyun alanı', 'Oyunu ve görevi seç.', 'Minikler', 'Çocuklar', '12 yaş ve üzeri', 'Futbol', 'Satranç', 'Futbol ve satranç', 'Görev seviyesi'],
      ['Topu konilerin arasından sür.', 'Top sürme', 'At için iyi bir kare bul.', 'Atla ilk ders'],
      ['Köşeyi seç ve kaleciyi geçmeye çalış.', 'Şut çek', 'Tek hamlede iki taşa saldır.', 'At çatalı'],
      ['Takımınla hücum et ve şut çek.', '5’e 5 maç', 'Kulüp seviyesinde bota karşı oyna.', 'Bota karşı oyna']
    ],
    en: [
      ['Play zone', 'Pick a challenge.', 'Little ones', 'Kids', 'Ages 12+', 'Football', 'Chess', 'Football and chess', 'Challenge level'],
      ['Dribble the ball between the cones.', 'Dribble the ball', 'Find a good square for your knight.', 'Try the knight lesson'],
      ['Pick a corner and try to beat the keeper.', 'Shoot at goal', 'Attack two pieces with one move.', 'Try the knight fork'],
      ['Build an attack and finish with a shot.', 'Play 5-a-side', 'Play a game against the club-level bot.', 'Play the chess bot']
    ]
  };
  const modes = [
    ['dribble', 'lesson=develop'],
    ['shoot', 'lesson=fork'],
    ['match', 'level=9']
  ];
  const root = document.documentElement;
  const map = document.querySelector('.play-map');
  const levels = document.querySelector('.play-levels');
  const buttons = [...document.querySelectorAll('[data-play-level]')];
  let level = 0;
  try {
    const saved = localStorage.getItem('zenit-play-level');
    if (['0', '1', '2'].includes(saved)) level = Number(saved);
  } catch {}
  function render() {
    const language = Object.hasOwn(copy, root.lang) ? root.lang : 'ru';
    const [labels, ...challenges] = copy[language];
    const keys = ['zone', 'lead', 'little', 'kids', 'older', 'football', 'chess', 'shortcut'];
    document.querySelectorAll('[data-play-text]').forEach(node => {
      node.textContent = labels[keys.indexOf(node.dataset.playText)];
    });
    const shortcut = document.querySelector('.play-shortcut');
    if (shortcut) {
      const href = new URL(shortcut.href);
      href.searchParams.set('lang', language);
      shortcut.href = href.href;
    }
    if (!map) return;
    levels.setAttribute('aria-label', labels[8]);
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === level)));
    const [football, footballAction, chess, chessAction] = challenges[level];
    const [footballMode, chessMode] = modes[level];
    map.querySelector('[data-football-goal]').textContent = football;
    map.querySelector('[data-chess-goal]').textContent = chess;
    const footballLink = map.querySelector('[data-football-quest]');
    const chessLink = map.querySelector('[data-chess-quest]');
    footballLink.textContent = footballAction + ' →';
    chessLink.textContent = chessAction + ' →';
    footballLink.href = 'play/football.html?mode=' + footballMode;
    chessLink.href = 'play/chess.html?' + chessMode;
  }
  buttons.forEach((button, i) => button.addEventListener('click', () => {
    level = i;
    try { localStorage.setItem('zenit-play-level', String(level)); } catch {}
    render();
  }));
  if (levels) levels.hidden = false;
  render();
  new MutationObserver(render).observe(root, { attributes: true, attributeFilter: ['lang'] });
})();
