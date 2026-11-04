import { Chess } from './vendor/chess/chess.js';
import { BOT_LEVELS, chooseStarterMove } from './chess-bots.js';
const $=s=>document.querySelector(s),names={p:'пешка',n:'конь',b:'слон',r:'ладья',q:'ферзь',k:'король'},lessons={
develop:{fen:'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',goal:'Выведи коня ближе к центру, чтобы он контролировал больше полей.',idea:'Сравни, сколько полей конь контролирует у края доски и ближе к центру.',solutions:['b1c3','g1f3'],hint:'Конь на c3 или f3 помогает контролировать центр и готовит развитие остальных фигур.',title:'Развивай фигуры.'},
defend:{fen:'4r1k1/8/8/8/8/8/2B5/4K3 w - - 0 1',goal:'Чёрная ладья дала шах по вертикали e. Уведи короля с этой линии.',idea:'Проследи линию от чёрной ладьи к королю. Проверь соседние поля за пределами этой линии.',solutions:['e1d1','e1f1'],hint:'На d1 и f1 король уходит с линии ладьи.',title:'Защити короля.'},
mate:{fen:'7k/8/5KQ1/8/8/8/8/8 w - - 0 1',goal:'Поставь мат чёрному королю за один ход. Король должен помогать ферзю.',idea:'Ферзь может закрыть соседние поля. Поищи поле для шаха, которое защищает белый король.',solutions:['g6g7'],hint:'Ферзь идёт на g7: король f6 защищает его, а у чёрного короля нет безопасного поля.',title:'Мат — когда от шаха нет защиты.'},
fork:{fen:'2r3k1/8/8/5N2/8/8/8/6K1 w - - 0 1',goal:'Найди ход конём, который одновременно атакует короля и ладью.',idea:'Проверь прыжки коня с шахом. С какого поля он сможет атаковать и ладью?',solutions:['f5e7'],hint:'Конь на e7 даёт шах королю g8 и одновременно атакует ладью c8.',title:'Две угрозы одним ходом.'},
capture:{fen:'4k3/8/8/8/4q3/8/4R3/4K3 w - - 0 1',goal:'Посмотри, какую дорогую фигуру можно забрать без потери своей.',idea:'Найди самую ценную чёрную фигуру и проверь, кто защищает её поле.',solutions:['e2e4'],hint:'Ладья e2 может забрать ферзя на e4. Проверь, защищено ли это поле.',title:'Сначала проверь незащищённые фигуры.'},
castle:{fen:'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',goal:'Сделай рокировку. Здесь и короткая, и длинная рокировка разрешены правилами.',idea:'При рокировке король перемещается на две клетки в сторону ладьи.',solutions:['e1g1','e1c1'],hint:'Выбери короля e1 и поле g1 или c1. Ладья переместится вместе с королём.',title:'Король и ладья делают общий ход.'}
};
let game=new Chess(),selected=null,focusSquare='e2',legal=[],flipped=false,mode='play',lastMove=null,hintSquares=[],pendingPromotion=null,lessonDone=false,engineReady=false,worker,activeJob=null,generation=0,readyResolve,readyReject;
const lessonSelect = $('#lesson-select');
const levelSelect = $('#chess-level');
const lessonOrder = Array.from(lessonSelect.options, option => option.value);
const solved = new Set();
const progressKey = 'zenit-chess-lessons-v1';
const levelKey = 'zenit-chess-level-v1';
let hintStep = 0, hintPending = false, hintMove = '', engineFailed = false;
try {
  for (const id of JSON.parse(localStorage.getItem(progressKey) || '[]')) {
    if (lessonOrder.includes(id)) solved.add(id);
  }
  const savedLevel = localStorage.getItem(levelKey);
  if (Object.hasOwn(BOT_LEVELS, savedLevel)) levelSelect.value = savedLevel;
} catch {}
function save(key, value) {
  try { localStorage.setItem(key, value); } catch {}
}
function resetHint() {
  hintSquares = [];
  hintStep = 0;
  hintPending = false;
  hintMove = '';
}
function renderPractice() {
  const bot = BOT_LEVELS[levelSelect.value];
  $('#opponent-name').textContent = mode === 'learn' ? 'Чёрные' : bot.name;
  $('#bot-description').textContent = bot.description;
  $('#lesson-progress').textContent = 'Пройдено ' + solved.size + ' из ' + lessonOrder.length;
  $('#next-lesson').disabled = !lessonDone || solved.size === lessonOrder.length;
  $('#new-game').textContent = mode === 'learn' ? 'Сначала' : 'Новая партия';
  const hint = $('#hint-move');
  hint.textContent = ['✦ Подсказка', 'Показать фигуру', 'Показать ход', 'Ход показан'][hintStep];
  hint.disabled = hintPending || lessonDone || game.turn() !== 'w' || game.isGameOver() || hintStep === 3;
}
const enginePromise=new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject;});enginePromise.catch(()=>{});
function notice(s){$('#chess-notice').textContent=s;}
function cancelSearch(){generation++;if(activeJob){activeJob.discard=true;worker?.postMessage('stop');}}
function render(){const restoreFocus=document.activeElement?.dataset?.square;const board=$('#chessboard');board.replaceChildren();const files=(flipped?'hgfedcba':'abcdefgh').split(''),ranks=flipped?[1,2,3,4,5,6,7,8]:[8,7,6,5,4,3,2,1];for(let row=0;row<8;row++)for(let col=0;col<8;col++){const square=files[col]+ranks[row],piece=game.get(square),b=document.createElement('button');b.type='button';b.className='square';b.classList.toggle('dark',((square.charCodeAt(0)-97)+Number(square[1]))%2===1);b.classList.toggle('selected',selected===square);b.classList.toggle('legal',legal.some(m=>m.to===square));b.classList.toggle('last',!!lastMove&&(lastMove.from===square||lastMove.to===square));b.classList.toggle('hint',hintSquares.includes(square));b.classList.toggle('check',piece?.type==='k'&&piece.color===game.turn()&&game.isCheck());b.setAttribute('aria-label',((col===0?String(ranks[row]):'')+(row===7?files[col]:''))+((col===0||row===7)?' · ':'')+square+(piece?' · '+(piece.color==='w'?'белые: ':'чёрные: ')+names[piece.type]:''));b.setAttribute('aria-pressed',String(selected===square));b.dataset.square=square;b.tabIndex=square===focusSquare?0:-1;b.addEventListener('focus',()=>{focusSquare=square;});b.addEventListener('keydown',e=>{const moves={ArrowLeft:[0,-1],ArrowRight:[0,1],ArrowUp:[-1,0],ArrowDown:[1,0]};if(!moves[e.key])return;e.preventDefault();const [dr,dc]=moves[e.key],r=Math.max(0,Math.min(7,row+dr)),c=Math.max(0,Math.min(7,col+dc));focusSquare=files[c]+ranks[r];board.querySelectorAll('.square').forEach(el=>el.tabIndex=el.dataset.square===focusSquare?0:-1);board.querySelector('[data-square="'+focusSquare+'"]').focus();});if(piece){const img=document.createElement('img');img.src='./../assets/vendor/chess/pieces/'+piece.color+piece.type.toUpperCase()+'.svg';img.alt='';img.draggable=false;b.append(img);}if(col===0){const rank=document.createElement('span');rank.className='coord rank';rank.setAttribute('aria-hidden','true');rank.textContent=ranks[row];b.append(rank);}if(row===7){const file=document.createElement('span');file.className='coord file';file.setAttribute('aria-hidden','true');file.textContent=files[col];b.append(file);}b.addEventListener('click',()=>{focusSquare=square;choose(square);});board.append(b);}
const status=$('#board-status');if(game.isCheckmate())status.textContent=game.turn()==='b'?'Мат! Ты победил.':'Мат. Можно разобрать партию и попробовать снова.';else if(game.isStalemate())status.textContent='Пат — ничья.';else if(game.isDraw())status.textContent='Ничья по правилам.';else if(mode==='learn')status.textContent=lessonDone?'Задача решена. Выбери следующую.':game.isCheck()?'Твой король под шахом. Найди защиту.':'Найди решение задачи.';else status.textContent=game.turn()==='w'?(game.isCheck()?'Шах! Защити своего короля.':'Твой ход. Выбери фигуру.'):engineFailed&&levelSelect.value!=='starter'?'Выбери «Новичок», чтобы продолжить.':'Соперник обдумывает ход…';$('#opponent-label').textContent=mode==='learn'?'Учебная позиция':BOT_LEVELS[levelSelect.value].name;const moves=game.history(),list=$('#move-list');list.replaceChildren();for(let i=0;i<moves.length;i+=2){const li=document.createElement('li');li.textContent=moves[i]+(moves[i+1]?'  ·  '+moves[i+1]:'');list.append(li);}$('#undo-move').disabled=game.history().length===0;renderPractice();if(restoreFocus)board.querySelector('[data-square="'+focusSquare+'"]')?.focus({preventScroll:true});}
function choose(square){if(game.isGameOver()||lessonDone||mode==='play'&&game.turn()!=='w')return;const piece=game.get(square);if(selected&&legal.some(m=>m.to===square)){const promotions=legal.filter(m=>m.to===square&&m.promotion);if(promotions.length){pendingPromotion={from:selected,to:square};const choices=$('#promotion-choices');choices.replaceChildren();for(const p of ['q','r','b','n']){const button=document.createElement('button'),img=document.createElement('img');img.src='../assets/vendor/chess/pieces/w'+p.toUpperCase()+'.svg';img.alt=names[p];button.append(img);button.addEventListener('click',()=>{$('#promotion-dialog').close();move(pendingPromotion.from,pendingPromotion.to,p);});choices.append(button);}$('#promotion-dialog').showModal();}else move(selected,square);return;}if(piece&&piece.color===game.turn()){selected=square;legal=game.moves({square,verbose:true});hintSquares=[];}else{selected=null;legal=[];}render();}
function move(from,to,promotion='q'){let result;try{result=game.move({from,to,promotion});}catch{notice('Этот ход не разрешён правилами. Выбери подсвеченное поле.');return;}selected=null;legal=[];resetHint();lastMove=result;notice('');if(mode==='learn'){const lesson=lessons[$('#lesson-select').value],uci=from+to+(result.promotion||'');if(lesson.solutions.includes(uci)){lessonDone=true;solved.add(lessonSelect.value);save(progressKey,JSON.stringify([...solved]));$('#coach-heading').textContent='Верно! '+lesson.title;$('#coach-message').textContent=lesson.hint;$('#engine-line').textContent='Решение: '+result.san;notice('Отлично! Выбери следующую задачу или начни партию.');}else{game.undo();lastMove=null;$('#coach-heading').textContent='Ход законный — попробуй найти тактику.';$('#coach-message').textContent=lesson.goal;notice('Подумай о шахах, взятиях и одновременных угрозах.');}render();return;}$('#coach-heading').textContent=result.captured?'Взятие: '+names[result.captured]+'.':'Ход '+result.san;$('#coach-message').textContent=result.san.includes('+')?'Ты дал шах. Соперник обязан защитить короля.':'Теперь посмотри, какие поля контролирует твоя фигура и что может ответить соперник.';render();if(!game.isGameOver()&&game.turn()==='b')search('move');}
function positionIdea() {
  if (game.isCheck()) return 'Найди безопасное поле, возьми атакующую фигуру или закрой линию шаха.';
  if (game.moves({ verbose: true }).some(move => move.isCapture() || move.isEnPassant())) return 'Проверь доступные взятия и чем может ответить соперник.';
  if (game.moveNumber() <= 5) return 'Посмотри, какую фигуру можно развить к центру.';
  return 'Сначала проверь шахи и угрозы. Как изменится позиция после твоего хода?';
}
function revealHint(uci, full) {
  hintMove = uci;
  hintStep = full ? 3 : 2;
  hintSquares = full ? [uci.slice(0, 2), uci.slice(2, 4)] : [uci.slice(0, 2)];
  if (!full) {
    $('#coach-heading').textContent = 'Посмотри на эту фигуру.';
    $('#coach-message').textContent = 'Какой ход выделенной фигурой решает задачу?';
  } else {
    $('#coach-heading').textContent = 'Вот ход.';
    if (mode === 'learn') $('#coach-message').textContent = lessons[lessonSelect.value].hint;
    else {
      const move = new Chess(game.fen()).move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]});
      $('#coach-message').textContent = move.captured ? 'Ход ' + move.san + ' забирает фигуру: ' + names[move.captured] + '.' :
        /[+#]$/.test(move.san) ? 'Ход ' + move.san + ' даёт шах. Проверь ответы короля.' :
        'Попробуй ' + move.san + ' и посмотри, какие поля будет контролировать фигура.';
    }
  }
  notice('');
  render();
}
function showHint() {
  if (hintStep === 0) {
    hintStep = 1;
    $('#coach-heading').textContent = 'Начни с идеи.';
    $('#coach-message').textContent = mode === 'learn' ? lessons[lessonSelect.value].idea : positionIdea();
    render();
  } else if (hintStep === 1) {
    if (mode === 'learn') revealHint(lessons[lessonSelect.value].solutions[0], false);
    else if (engineFailed) notice('Разбор партии недоступен. Подсказки в уроках работают.');
    else {
      hintPending = true;
      renderPractice();
      search('hint');
    }
  } else if (hintStep === 2) {
    revealHint(hintMove, true);
  }
}
function applyBotMove(move) {
  lastMove = game.move(move);
  $('#engine-line').textContent = 'Соперник сыграл ' + lastMove.san + '.';
  $('#coach-heading').textContent = game.isGameOver() ? 'Партия завершена.' : game.isCheck() ? 'Твоему королю шах.' : 'Теперь твой ход.';
  $('#coach-message').textContent = game.isGameOver() ? 'Ходы партии можно скопировать для разбора.' : positionIdea();
  render();
}
async function search(kind) {
  const request = ++generation, fen = game.fen(), bot = BOT_LEVELS[levelSelect.value];
  if (kind === 'move' && bot.skill === null) {
    if (activeJob) { activeJob.discard = true; worker.postMessage('stop'); }
    $('#eval-text').textContent = '—';
    await new Promise(resolve => setTimeout(resolve, 180));
    if (request !== generation || game.fen() !== fen) return;
    const move = chooseStarterMove(game);
    if (move) applyBotMove(move);
    return;
  }
  try {
    await enginePromise;
    if (engineFailed) throw new Error('Engine unavailable');
  } catch {
    if (request !== generation) return;
    hintPending = false;
    notice('Движок недоступен. Можно выбрать «Новичок» или открыть урок.');
    render();
    return;
  }
  if (request !== generation) return;
  if (activeJob) {
    const previous = activeJob;
    previous.discard = true;
    worker.postMessage('stop');
    await previous.done;
  }
  if (request !== generation || game.fen() !== fen) return;
  let resolveDone;
  const done = new Promise(resolve => { resolveDone = resolve; });
  activeJob = {request,fen,kind,done,resolveDone,discard:false,evalText:''};
  worker.postMessage('setoption name Skill Level value ' + (kind === 'hint' ? 20 : bot.skill));
  worker.postMessage('position fen ' + fen);
  worker.postMessage('go movetime ' + (kind === 'hint' ? 1000 : bot.time));
  if (kind === 'hint') notice('Наставник ищет ход…');
}
function engineLine(raw){const line=raw.trim();if(!line)return;if(line==='uciok'){worker.postMessage('setoption name Hash value 16');worker.postMessage('setoption name Threads value 1');worker.postMessage('setoption name MultiPV value 1');worker.postMessage('isready');return;}if(line==='readyok'&&!engineReady){engineReady=true;$('#engine-state').textContent='Stockfish 19 · готов';readyResolve();return;}const job=activeJob;if(!job)return;if(line.startsWith('info ')&&!job.discard){const cp=line.match(/score cp (-?\d+)/),mate=line.match(/score mate (-?\d+)/);const sign=job.fen.split(' ')[1]==='w'?1:-1;if(cp){const value=Number(cp[1])*sign/100;job.evalText=(value>0?'+':'')+value.toFixed(2);}if(mate)job.evalText='Мат '+Number(mate[1])*sign;return;}if(line.startsWith('bestmove ')){activeJob=null;job.resolveDone();if(job.discard||job.request!==generation||game.fen()!==job.fen)return;const uci=line.split(/\s+/)[1];if(!uci||uci==='(none)'||uci==='0000'){hintPending=false;render();return;}$('#eval-text').textContent=job.evalText||'—';if(job.kind==='move'){
  applyBotMove({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]});
}else{
  hintPending=false;
  revealHint(uci,false);
}}}
function failEngine() {
  engineFailed = true;
  readyReject(new Error('Engine unavailable'));
  activeJob?.resolveDone();
  activeJob = null;
  hintPending = false;
  $('#engine-state').textContent = 'Stockfish недоступен · уроки и новичок работают';
  render();
}
function setupWorker() {
  try {
    worker = new Worker('../assets/vendor/chess/stockfish-19-lite-single.js');
    worker.onmessage = event => String(event.data).split(/\r?\n/).forEach(engineLine);
    worker.onerror = failEngine;
    worker.postMessage('uci');
  } catch { failEngine(); }
}
function newGame(){cancelSearch();game=new Chess();selected=null;legal=[];resetHint();lastMove=null;lessonDone=false;$('#eval-text').textContent='—';$('#engine-line').textContent='';$('#coach-heading').textContent='Сначала посмотри на всю доску.';$('#coach-message').textContent='Займи центр, развивай фигуры и помни о безопасности короля.';notice('');worker?.postMessage('ucinewgame');render();}
function loadLesson(){cancelSearch();const lesson=lessons[$('#lesson-select').value];game=new Chess(lesson.fen);selected=null;legal=[];resetHint();lastMove=null;lessonDone=false;$('#lesson-goal').textContent=lesson.goal;$('#coach-heading').textContent=lesson.title;$('#coach-message').textContent=lesson.goal;$('#engine-line').textContent='';$('#eval-text').textContent='—';notice('Белые начинают. Найди решение.');render();}
document.querySelectorAll('[data-chess-mode]').forEach(button=>button.addEventListener('click',()=>{mode=button.dataset.chessMode;document.querySelectorAll('[data-chess-mode]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});$('#play-settings').hidden=mode!=='play';$('#lesson-settings').hidden=mode!=='learn';if(mode==='play')newGame();else loadLesson();}));lessonSelect.addEventListener('change', loadLesson);
$('#next-lesson').addEventListener('click', () => {
  const start = lessonOrder.indexOf(lessonSelect.value) + 1;
  lessonSelect.value = [...lessonOrder.slice(start), ...lessonOrder.slice(0, start)].find(id => !solved.has(id));
  loadLesson();
  lessonSelect.focus();
});
levelSelect.addEventListener('change', () => {
  save(levelKey, levelSelect.value);
  notice('');
  render();
  if (mode === 'play' && game.turn() === 'b') search('move');
});$('#new-game').addEventListener('click',()=>mode==='learn'?loadLesson():newGame());$('#flip-board').addEventListener('click',()=>{flipped=!flipped;render();});$('#undo-move').addEventListener('click',()=>{cancelSearch();if(mode==='learn'){loadLesson();return;}const turn=game.turn();game.undo();if(turn==='w')game.undo();selected=null;legal=[];resetHint();lastMove=null;$('#engine-line').textContent='';notice('Ход отменён. Можно попробовать другой план.');render();});$('#hint-move').addEventListener('click', showHint);
$('#copy-pgn').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(game.pgn());notice('PGN партии скопирован.');}catch{notice(game.pgn()||'В партии пока нет ходов.');}});$('#promotion-dialog').addEventListener('cancel',()=>{pendingPromotion=null;});window.addEventListener('beforeunload',()=>worker?.terminate());render();setupWorker();
