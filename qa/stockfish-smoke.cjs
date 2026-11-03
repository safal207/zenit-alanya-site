const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const engine=spawn(process.execPath,['dist/assets/vendor/chess/stockfish-19-lite-single.js'],{stdio:['pipe','pipe','pipe']});
let buffer='',ready=false,done=false;
const timer=setTimeout(()=>finish(new Error('Stockfish handshake/search timeout')),20000);
function finish(error){if(done)return;done=true;clearTimeout(timer);engine.stdin.end('quit\n');if(error){console.error(error.message);process.exitCode=1;}else console.log('PASS Stockfish 19: UCI handshake, legal bestmove and bounded search');setTimeout(()=>engine.kill(),500).unref();}
engine.stdout.on('data',chunk=>{buffer+=chunk;let at;while((at=buffer.indexOf('\n'))!==-1){const line=buffer.slice(0,at).trim();buffer=buffer.slice(at+1);if(line==='uciok')engine.stdin.write('setoption name Hash value 16\nisready\n');if(line==='readyok'&&!ready){ready=true;engine.stdin.write('position startpos moves e2e4\ngo movetime 150\n');}if(line.startsWith('bestmove ')){try{assert.match(line,/^bestmove [a-h][1-8][a-h][1-8]/);const u=line.split(/\s+/)[1];import('../dist/assets/vendor/chess/chess.js').then(({Chess})=>{const g=new Chess();g.move('e4');g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||'q'});finish();}).catch(finish);}catch(e){finish(e);}}}});
engine.on('error',finish);engine.on('exit',code=>{if(!done)finish(new Error('Engine exited early: '+code));});engine.stdin.write('uci\n');
