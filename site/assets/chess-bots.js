export const BOT_LEVELS = {
  starter: { name: 'Новичок', description: 'Простой соперник. Ищи открытые фигуры и пробуй свои первые комбинации.', skill: null, time: 0 },
  0: { name: 'Первые шаги', description: 'Первый уровень Stockfish для спокойной практики.', skill: 0, time: 200 },
  5: { name: 'Любитель', description: 'Удобный уровень, чтобы закрепить основы и заметить тактические угрозы.', skill: 5, time: 450 },
  9: { name: 'Клубный', description: 'Соперник чаще наказывает за оставленные без защиты фигуры.', skill: 9, time: 650 },
  12: { name: 'Сильный', description: 'Требует аккуратной защиты и расчёта ответов соперника.', skill: 12, time: 850 },
  20: { name: 'Эксперт', description: 'Самый сильный уровень в этой мастерской.', skill: 20, time: 1800 }
};

const pieceValue = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

export function chooseStarterMove(game, random = Math.random) {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;
  const mate = moves.find(move => move.san.endsWith('#'));
  if (mate) return mate;

  // Mix simple moves with occasional captures so a first opponent leaves room to practise.
  const weights = moves.map(move => 1 + (pieceValue[move.captured] || 0) + Number(move.san.endsWith('+')));
  let pick = random() * weights.reduce((sum, weight) => sum + weight, 0);
  for (let i = 0; i < moves.length; i++) {
    pick -= weights[i];
    if (pick < 0) return moves[i];
  }
  return moves[moves.length - 1];
}
