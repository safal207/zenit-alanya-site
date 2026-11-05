(function(root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.ZenitPath = api; api.mount(document); }
})(typeof window === 'undefined' ? globalThis : window, function() {
  'use strict';
  const stages = ['start', 'team', 'away', 'international', 'trial', 'academy', 'adult'];
  const targets = ['', 'kemer', 'jwca', 'alanyaspor', 'benfica'];
  const actions = ['practice', 'video', 'coach', 'questions'];
  const text = (v, n) => typeof v === 'string' ? v.trim().slice(0, n) : '';
  function validDate(v) {
    if (typeof v !== 'string' || !/^20\d{2}-\d{2}-\d{2}$/.test(v)) return false;
    const date = new Date(v + 'T12:00:00Z');
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === v;
  }
  function normalize(value) {
    const v = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    return {version: 1, stage: stages.includes(v.stage) ? v.stage : '',
      target: targets.includes(v.target) ? v.target : '', review: validDate(v.review) ? v.review : '',
      practice: text(v.practice, 240), reflection: text(v.reflection, 240),
      actions: actions.filter(id => Array.isArray(v.actions) && v.actions.includes(id))};
  }
  function hasContent(value) {
    const v = normalize(value);
    return Boolean(v.stage || v.target || v.review || v.practice || v.reflection || v.actions.length);
  }
  const locales = {
    ru: {
      eyebrow: 'ПУТЬ ИГРОКА', title: 'Мой путь в футболе',
      intro: 'У каждого свой темп. Выбери интересный шаг и обсуди подготовку с тренером.',
      progress: 'Как увижу прогресс', question: 'Что спрошу у тренера', pick: 'Сделать моей целью',
      model: 'Ориентиры развития. Поездка, просмотр, зачисление и контракт — отдельные решения клуба.',
      plan: '02 · Подготовка к следующему шагу', planIntro: 'Это твой план для разговора с тренером. Отметки ниже — твоя самооценка.',
      stage: 'Моя ближайшая цель', emptyStage: 'Выбрать вместе с тренером',
      target: 'Выезд или академия, о которых хочу узнать', emptyTarget: 'Пока без конкретного направления',
      review: 'Когда пересмотрим план', practice: 'Над чем работаю до встречи',
      practiceExample: 'Например: приём мяча и пас под давлением; вместе выберем упражнения',
      preparation: 'Мои шаги подготовки', practiceAction: 'Потренировал выбранный навык',
      videoAction: 'Выбрал игровые эпизоды для разбора', coachAction: 'Обсудил готовность с тренером',
      questionsAction: 'Подготовил вопросы о выезде или просмотре',
      reflectionTitle: 'После матча, поездки или просмотра', reflection: 'Что получилось и что попробую дальше',
      reflectionExample: 'Один удачный эпизод, один вопрос тренеру и моя следующая попытка',
      summaryEmpty: 'Выбери ближайший шаг. Его можно менять вместе с тренером.',
      summaryPrefix: 'Моя цель: ', reviewPrefix: 'Пересмотр плана: ',
      opportunities: 'Выезды и следующие возможности', opportunitiesIntro: 'Сведения проверены 05.11.2026. Актуальные даты, состав, стоимость и условия участия уточняет Анна.',
      trips: 'Поездки из материалов школы', academies: 'Академии: варианты для обсуждения',
      jwcaBadge: 'Прошедший турнир · 2026', jwca: 'Junior World Cup Antalya',
      jwcaCopy: 'В материалах школы есть обращение перед турниром и турнирный ролик. В программе организатора: 17–26 октября 2026. Следующий выезд школы пока не объявлен здесь.',
      jwcaLink: 'Программа организатора ↗', schoolLink: 'Публикация школы ↗',
      kemerBadge: 'Детали уточняются', kemer: 'Турнир в Кемере',
      kemerCopy: 'В материалах школы упоминается турнир в Кемере. Дату, название соревнования, возрастную группу и результат уточни у Анны.',
      alanyaBadge: 'Пример завершённого отбора', alanya: 'Академия Alanyaspor',
      alanyaCopy: 'На сезон 2026/27 клуб объявлял отбор 20 июня — 1 июля для игроков 2008–2014 годов рождения. Эти даты уже прошли. Новый набор и допуск уточняются у академии.',
      benficaBadge: 'Как устроен отбор', benfica: 'Академия Benfica',
      benficaCopy: 'Скауты наблюдают игроков в соревнованиях; следующий шаг зависит от оценки и приглашения. Elite Training Camps — отдельная программа развития и отчёта, участие не означает зачисление в команду.',
      conditions: 'Условия академии ↗', contact: 'Уточнить у Анны в Telegram ↗',
      partnerNote: 'Это направления для изучения. Партнёрство школы с этими академиями и места на просмотр здесь не подтверждены.',
      minorNote: 'Для переходов несовершеннолетних за границу действуют правила FIFA. Регистрацию и документы нужно обсуждать с принимающим клубом и родителями.',
      fifaLink: 'Правила и материалы FIFA ↗', exampleTitle: 'Реальный пример из футбола школы',
      example: '27 апреля 2026 КФФ включила Жибек Марат, указанную как игрок «Зенит-Аланья», в состав сборной Казахстана WU16. Этапы её подготовки в школе нужно уточнить отдельно.',
      exampleLink: 'Публикация КФФ ↗', loginPick: 'Войди, чтобы сохранить выбранный шаг в своём плане.',
      steps: [
        ['Начинаю играть', 'Осваиваюсь с мячом, знакомлюсь с командой и замечаю, что мне нравится в игре.', 'Могу назвать, что уже получается, и показать это на тренировке.', 'Какой один навык мне сейчас полезнее попробовать?'],
        ['Играю за команду', 'Учусь видеть партнёров, выбирать передачу и пробовать разные роли в матчах.', 'Вместе с тренером разбираю игровые эпизоды и свою роль.', 'Какие решения на поле мне стоит потренировать?'],
        ['Мой первый выезд', 'Готовлюсь к игре с незнакомыми соперниками и первому командному выезду.', 'Знаю свою игровую задачу, а после матча обсуждаю, что получилось.', 'К какому выезду я готов и какую задачу возьму на игру?'],
        ['Международный турнир', 'Пробую свои силы против команд других школ и знакомлюсь с разными стилями игры.', 'Сравниваю свои решения в матчах и сохраняю эпизоды для разбора.', 'Какой турнир подходит моей группе и чему мы там учимся?'],
        ['Готовлюсь к просмотру', 'Вместе выбираем подходящую академию, собираем профиль, игровые записи и вопросы.', 'Есть рекомендация тренера, проверенные условия отбора и понятный следующий контакт.', 'Что мне ещё улучшить и как получить официальный ответ академии?'],
        ['Играю в академии', 'После успешного отбора учусь в программе академии и играю за её команду.', 'Зачисление и участие подтверждены самой академией; цели пересматриваются с её тренером.', 'Какие требования моей возрастной команды и над чем работаю дальше?'],
        ['Взрослый футбол', 'Возможная дальняя цель: молодёжная или взрослая команда и профессиональный контракт.', 'Решение о месте в команде и контракте принимает клуб по результатам подготовки.', 'Какие промежуточные команды и соревнования помогут развиваться дальше?']
      ]
    },
    en: {
      eyebrow: 'PLAYER PATHWAY', title: 'My football journey', intro: 'Everyone has their own pace. Choose a step that interests you and plan with your coach.',
      progress: 'How I will see progress', question: 'What I will ask my coach', pick: 'Make this my goal',
      model: 'Development milestones. Travel, trials, admission and a contract each require a separate club decision.',
      plan: '02 · Prepare for my next step', planIntro: 'Your plan for a conversation with your coach. The ticks below are your own assessment.',
      stage: 'My next goal', emptyStage: 'Choose with my coach', target: 'Trip or academy I want to learn about', emptyTarget: 'No specific destination yet',
      review: 'When we will review my plan', practice: 'What I am working on before we meet', practiceExample: 'For example, receiving and passing under pressure; choose exercises together',
      preparation: 'My preparation steps', practiceAction: 'Practised my chosen skill', videoAction: 'Selected match clips to review', coachAction: 'Discussed readiness with my coach', questionsAction: 'Prepared questions about a trip or trial',
      reflectionTitle: 'After a match, trip or trial', reflection: 'What went well and what I will try next', reflectionExample: 'One good moment, one question for my coach and my next attempt',
      summaryEmpty: 'Choose a next step. You can change it with your coach.', summaryPrefix: 'My goal: ', reviewPrefix: 'Plan review: ',
      opportunities: 'Trips and next opportunities', opportunitiesIntro: 'Information checked on 5 Nov 2026. Ask Anna about current dates, squads, costs and participation terms.',
      trips: 'Trips in the school materials', academies: 'Academies: options to discuss', jwcaBadge: 'Past tournament · 2026', jwca: 'Junior World Cup Antalya',
      jwcaCopy: 'School materials include a pre-tournament message and a tournament video. Organizer programme: 17–26 October 2026. A future school trip is not announced here.', jwcaLink: 'Organizer programme ↗', schoolLink: 'School publication ↗',
      kemerBadge: 'Details to confirm', kemer: 'Tournament in Kemer', kemerCopy: 'School materials mention a tournament in Kemer. Ask Anna to confirm the event name, date, age group and result.',
      alanyaBadge: 'Example of a completed selection', alanya: 'Alanyaspor Academy', alanyaCopy: 'For 2026/27 the club announced selection on 20 June–1 July for players born in 2008–2014. Those dates have passed. Check the next intake and eligibility with the academy.',
      benficaBadge: 'How recruitment works', benfica: 'Benfica Academy', benficaCopy: 'Scouts observe players in competition; evaluation and an invitation determine the next step. Elite Training Camps is a separate development and reporting programme; attendance does not mean team admission.',
      conditions: 'Academy conditions ↗', contact: 'Ask Anna on Telegram ↗', partnerNote: 'These are options to explore. School partnerships with these academies and trial places are not confirmed here.',
      minorNote: 'FIFA rules apply to international transfers of minors. Discuss registration and documents with the receiving club and parents.', fifaLink: 'FIFA rules and guidance ↗',
      exampleTitle: 'A real example from the school’s football', example: 'On 27 April 2026 KFF named Zhibek Marat, listed as a Zenit-Alanya player, in the Kazakhstan WU16 squad. Her development history at the school needs separate confirmation.', exampleLink: 'KFF publication ↗', loginPick: 'Sign in to save this step in your plan.',
      steps: [
        ['Starting to play', 'Get comfortable with the ball, meet my team and discover what I enjoy.', 'I can name a skill that is improving and show it in training.', 'Which one skill would be useful to try now?'],
        ['Playing for my team', 'Learn to see teammates, choose a pass and try different match roles.', 'Review match moments and my role with my coach.', 'Which decisions on the pitch should I practise?'],
        ['My first away trip', 'Prepare for unfamiliar opponents and a first team trip.', 'Know my match task and discuss what worked afterwards.', 'Which trip suits me and what is my match task?'],
        ['International tournament', 'Test my game against other schools and experience different playing styles.', 'Compare my decisions in matches and save clips for review.', 'Which tournament fits my group and what will we learn?'],
        ['Preparing for a trial', 'Choose a suitable academy together and prepare my profile, match recordings and questions.', 'A coach recommendation, verified selection terms and a clear next contact.', 'What should I improve and how can I get an official academy reply?'],
        ['Playing in an academy', 'After successful selection, learn in an academy programme and play for its team.', 'Admission and participation confirmed by the academy; review goals with its coach.', 'What are my age-group requirements and my next focus?'],
        ['Senior football', 'A possible long-term goal: a youth or senior team and a professional contract.', 'The club decides team places and contracts based on development.', 'Which intermediate teams and competitions support my next step?']
      ]
    },
    tr: {
      eyebrow: 'OYUNCU YOLCULUĞU', title: 'Futbol yolculuğum', intro: 'Herkesin gelişim hızı farklı. İlgini çeken adımı seç ve antrenörünle hazırlan.',
      progress: 'Gelişimi nasıl göreceğim?', question: 'Antrenörüme ne soracağım?', pick: 'Hedefim olarak seç', model: 'Gelişim durakları. Gezi, seçme, kabul ve sözleşme için kulübün ayrı kararları gerekir.',
      plan: '02 · Bir sonraki adıma hazırlık', planIntro: 'Antrenörünle konuşmak için planın. Aşağıdaki işaretler kendi değerlendirmen.',
      stage: 'Bir sonraki hedefim', emptyStage: 'Antrenörümle seçelim', target: 'Bilgi almak istediğim gezi veya akademi', emptyTarget: 'Henüz belirli bir yer yok',
      review: 'Planı ne zaman gözden geçireceğiz?', practice: 'Görüşmeden önce ne çalışıyorum?', practiceExample: 'Örneğin baskı altında top kontrolü ve pas; çalışmaları birlikte seçelim',
      preparation: 'Hazırlık adımlarım', practiceAction: 'Seçtiğim beceriyi çalıştım', videoAction: 'İncelemek için maç anlarını seçtim', coachAction: 'Hazırlığımı antrenörümle konuştum', questionsAction: 'Gezi veya seçme sorularımı hazırladım',
      reflectionTitle: 'Maç, gezi veya seçmeden sonra', reflection: 'Ne iyi gitti, sonra ne deneyeceğim?', reflectionExample: 'İyi bir an, antrenörüme bir soru ve sonraki denemem',
      summaryEmpty: 'Bir sonraki adımı seç. Antrenörünle değiştirebilirsin.', summaryPrefix: 'Hedefim: ', reviewPrefix: 'Planı değerlendirme: ',
      opportunities: 'Geziler ve sonraki fırsatlar', opportunitiesIntro: 'Bilgiler 05.11.2026 tarihinde kontrol edildi. Güncel tarihleri, kadroyu, ücreti ve katılım koşullarını Anna’ya sor.',
      trips: 'Okulun paylaşımlarındaki geziler', academies: 'Akademiler: konuşulacak seçenekler', jwcaBadge: 'Tamamlanan turnuva · 2026', jwca: 'Junior World Cup Antalya',
      jwcaCopy: 'Okul materyallerinde turnuva öncesi mesaj ve turnuva videosu var. Organizatör programı: 17–26 Ekim 2026. Okulun sonraki gezisi burada duyurulmadı.', jwcaLink: 'Organizatör programı ↗', schoolLink: 'Okul paylaşımı ↗',
      kemerBadge: 'Ayrıntılar teyit edilecek', kemer: 'Kemer’de turnuva', kemerCopy: 'Okulun paylaşımlarında Kemer’de bir turnuva geçiyor. Turnuvanın adını, tarihini, yaş grubunu ve sonucunu Anna’ya sor.',
      alanyaBadge: 'Tamamlanmış seçme örneği', alanya: 'Alanyaspor Akademisi', alanyaCopy: 'Kulüp 2026/27 sezonu için 2008–2014 doğumlu oyunculara 20 Haziran–1 Temmuz seçmelerini duyurdu. Bu tarihler geçti. Yeni seçmeleri ve katılım şartlarını akademiye sor.',
      benficaBadge: 'Oyuncu seçimi nasıl işliyor?', benfica: 'Benfica Akademisi', benficaCopy: 'Gözlemciler oyuncuları müsabakalarda izler; değerlendirme ve davet sonraki adımı belirler. Elite Training Camps ayrı bir gelişim ve raporlama programıdır; katılım takıma kabul anlamına gelmez.',
      conditions: 'Akademi koşulları ↗', contact: 'Telegram’da Anna’ya sor ↗', partnerNote: 'Bunlar araştırılacak seçenekler. Okulun bu akademilerle ortaklığı ve seçme kontenjanları burada teyit edilmedi.',
      minorNote: 'Reşit olmayan oyuncuların uluslararası transferlerinde FIFA kuralları geçerlidir. Kayıt ve belgeleri yeni kulüp ve ebeveynlerle görüşün.', fifaLink: 'FIFA kuralları ve rehberleri ↗',
      exampleTitle: 'Okul futbolundan gerçek bir örnek', example: 'KFF, 27 Nisan 2026’da Zenit-Alanya oyuncusu olarak gösterilen Zhibek Marat’ı Kazakistan WU16 kadrosuna aldı. Okuldaki gelişim aşamaları ayrıca teyit edilmeli.', exampleLink: 'KFF yayını ↗', loginPick: 'Bu adımı planına kaydetmek için giriş yap.',
      steps: [
        ['Futbola başlıyorum', 'Topa alışıyor, takımla tanışıyor ve oyunda neyi sevdiğimi keşfediyorum.', 'Gelişen bir becerimi söyleyip antrenmanda gösterebiliyorum.', 'Şimdi hangi beceriyi denemem faydalı olur?'],
        ['Takımım için oynuyorum', 'Takım arkadaşımı görmeyi, pas seçmeyi ve farklı rolleri denemeyi öğreniyorum.', 'Maç anlarını ve rolümü antrenörümle değerlendiriyorum.', 'Sahada hangi kararları çalışmalıyım?'],
        ['İlk deplasmanım', 'Yeni rakiplere ve ilk takım gezime hazırlanıyorum.', 'Maç görevimi biliyor, sonrasında nelerin iyi gittiğini konuşuyorum.', 'Hangi gezi bana uygun ve maç görevim ne?'],
        ['Uluslararası turnuva', 'Başka okullara karşı oynuyor, farklı oyun tarzlarını tanıyorum.', 'Maç kararlarımı karşılaştırıyor, incelemek için görüntü seçiyorum.', 'Hangi turnuva grubumuza uygun, orada ne öğreneceğiz?'],
        ['Seçmeye hazırlanıyorum', 'Uygun akademiyi birlikte seçiyor, profilimi, maç videolarımı ve sorularımı hazırlıyorum.', 'Antrenör önerisi, doğrulanmış koşullar ve net bir sonraki iletişim adımı var.', 'Neyi geliştirmeliyim, akademiden nasıl resmî yanıt alırım?'],
        ['Akademide oynuyorum', 'Başarılı seçmeden sonra akademi programında öğreniyor ve takımında oynuyorum.', 'Kabul ve katılımı akademi doğruladı; hedefleri antrenörüyle değerlendiriyorum.', 'Yaş grubumun gereklilikleri ve sonraki çalışma alanım ne?'],
        ['Yetişkin futbolu', 'Olası uzun vadeli hedef: genç veya yetişkin takım ve profesyonel sözleşme.', 'Takım yeri ve sözleşme kararını gelişimime göre kulüp verir.', 'Hangi ara takımlar ve turnuvalar gelişimimi destekler?']
      ]
    }
  };
  let ui;
  function mount(doc) {
    const view = doc.getElementById('path-overview');
    if (!view) return;
    const requested = new URLSearchParams(location.search).get('lang');
    const lang = ['en', 'tr'].includes(requested) ? requested : 'ru';
    const t = locales[lang], form = doc.getElementById('player-form');
    const get = id => doc.getElementById(id);
    doc.querySelectorAll('[data-path-copy]').forEach(el => { el.textContent = t[el.dataset.pathCopy]; });
    doc.querySelectorAll('[data-path-placeholder]').forEach(el => { el.placeholder = t[el.dataset.pathPlaceholder]; });
    const buttons = [...doc.querySelectorAll('[data-path-step]')];
    buttons.forEach((button, i) => { button.querySelector('span').textContent = t.steps[i][0]; });
    [...form.elements.journey_stage.options].slice(1).forEach((o, i) => { o.textContent = t.steps[i][0]; });
    const labels = {kemer: t.kemer, jwca: t.jwca, alanyaspor: t.alanya, benfica: t.benfica};
    [...form.elements.journey_target.options].slice(1).forEach(o => { o.textContent = labels[o.value]; });
    let selected = 'start';
    function select(stage) {
      selected = stages.includes(stage) ? stage : 'start';
      const i = stages.indexOf(selected), step = t.steps[i];
      buttons.forEach(button => { button.setAttribute('aria-pressed', String(button.dataset.pathStep === selected)); });
      get('path-number').textContent = String(i + 1).padStart(2, '0');
      ['path-step-title', 'path-step-intro', 'path-step-progress', 'path-step-question'].forEach((id, j) => { get(id).textContent = step[j]; });
    }
    function readForm() {
      return normalize({stage: form.elements.journey_stage.value, target: form.elements.journey_target.value,
        review: form.elements.journey_review.value, practice: form.elements.journey_practice.value,
        reflection: form.elements.journey_reflection.value,
        actions: [...form.querySelectorAll('[name=journey_actions]:checked')].map(el => el.value)});
    }
    function summary() {
      const v = readForm(), i = stages.indexOf(v.stage);
      get('path-summary').textContent = i < 0 ? t.summaryEmpty : t.summaryPrefix + t.steps[i][0];
      get('path-review-summary').textContent = v.review ? t.reviewPrefix + new Intl.DateTimeFormat(lang, {dateStyle: 'medium'}).format(new Date(v.review + 'T12:00:00Z')) : '';
    }
    function writeForm(value) {
      const v = normalize(value);
      for (const name of ['stage', 'target', 'review', 'practice', 'reflection']) form.elements['journey_' + name].value = v[name];
      form.querySelectorAll('[name=journey_actions]').forEach(el => { el.checked = v.actions.includes(el.value); });
      select(v.stage); summary();
    }
    buttons.forEach(button => button.addEventListener('click', () => select(button.dataset.pathStep)));
    get('path-pick').addEventListener('click', () => {
      doc.dispatchEvent(new CustomEvent('zenit-path-pick', {detail: {stage: selected, message: t.loginPick}}));
    });
    form.addEventListener('input', summary);
    form.elements.journey_stage.addEventListener('change', () => select(form.elements.journey_stage.value));
    ui = {readForm, writeForm, select};
    writeForm({});
  }
  return {normalize, hasContent, mount, stages, locales,
    readForm: () => ui ? ui.readForm() : normalize({}), writeForm: value => ui?.writeForm(value), select: stage => ui?.select(stage)};
});
