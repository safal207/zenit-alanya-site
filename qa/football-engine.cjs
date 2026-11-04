const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..'),B=require(root+'/dist/assets/vendor/babylon.js');
Object.assign(B,require(root+'/dist/assets/vendor/babylonjs.loaders.min.js'));
const Havok=require(root+'/dist/assets/vendor/HavokPhysics_umd.js');
(async()=>{const hk=await Havok({wasmBinary:fs.readFileSync(root+'/dist/assets/vendor/HavokPhysics.wasm')});const engine=new B.NullEngine({renderWidth:960,renderHeight:540});engine.getDeltaTime=()=>1000/60;const scene=new B.Scene(engine),camera=new B.FreeCamera('qa-camera',new B.Vector3(25,31,-34),scene);camera.setTarget(B.Vector3.Zero());scene.enablePhysics(new B.Vector3(0,-9.81,0),new B.HavokPlugin(true,hk));
const binary=fs.readFileSync(root+'/dist/assets/models/player.glb');const jsonLength=binary.readUInt32LE(12),json=JSON.parse(binary.subarray(20,20+jsonLength).toString()),bin=binary.subarray(20+jsonLength+8);const data={json,bin:{byteLength:bin.length,readAsync:(off,len)=>Promise.resolve(new Uint8Array(bin.subarray(off,off+len)))}};const loader=new B.GLTFFileLoader();const asset=await loader.loadAssetContainerAsync(scene,data,'');
const noop=()=>{},element=()=>({textContent:'',hidden:false,value:'',dataset:{},setAttribute:noop,replaceChildren:noop,focus:noop,style:{},classList:{add:noop,remove:noop,toggle:noop}});const ui={score:element(),clock:element(),msg:element(),tip:element(),overlay:element(),heading:element(),description:element(),loading:element(),progress:element(),start:element()};const elements=new Map(),$=key=>{if(!elements.has(key))elements.set(key,element());return elements.get(key);};
const storage=new Map(),localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)};
const context={F:require(root+'/dist/assets/football-core.js'),B,engine,scene,camera,asset,ui,$,document:{hidden:false,querySelectorAll:()=>[]},canvas:{focus:noop},window:{localStorage},localStorage,console,performance,setTimeout:noop,clearTimeout:noop};vm.createContext(context);const source=fs.readFileSync(root+'/dist/assets/football3d.js','utf8');const config=source.slice(source.indexOf('const config='),source.indexOf('let aim='));vm.runInContext(config+`\nlet ball,ballBody,players=[],active=0,owner=null,mode='match',ready=true,running=true,paused=false,elapsed=0,last=0,kickLock=0,goalLock=0,round=0,goals=[0,0],practiceScore=0,practiceTries=0,cameraStyle=0,joy={x:0,z:0},keys=new Set(),messageUntil=0,lastGoalZ=0,dribbleGates=[],audio=null,sound=false,aim={x:3.1,y:2.1},selectedTarget=-1,passTarget=null,gateIndex=0,practiceDeadline=null,restartAt=null,control={x:0,z:0},shotPower=1;\nfunction textMessage(s,seconds=2){ui.msg.textContent=s;messageUntil=elapsed+seconds;}\n`+source.slice(source.indexOf('function mat('),source.indexOf('async function initialize('))+`\nthis.test={setup(){stadium();makeBall();const homes=[{x:0,z:-8},{x:-10,z:-9},{x:10,z:-5},{x:0,z:7},{x:0,z:-25}];for(let team=0;team<2;team++)for(let i=0;i<5;i++)spawn(team,i,team===0?homes[i]:{x:-homes[i].x,z:-homes[i].z});for(let i=0;i<5;i++){const gate=box('qa-gate'+i,4.2,.03,.5,(i%2===0?-1:1)*5,.04,-13+i*7.2,mat('qa-gate-material'+i,'#48ddff'));dribbleGates.push(gate);}kickoff();},tick(){scene.physicsEnabled=running&&!paused;update(1/60);scene.render();},snapshot(){return {elapsed,running,gateIndex,players:players.length,positions:players.map(p=>p.pos.asArray()),ball:ball.position.asArray(),owner:owner?owner.team:null,recipientCaught:!!owner&&owner===passTarget,practiceTries,score:goals.slice(),practiceScore,meshes:scene.meshes.length,rigged:players.every(p=>!!p.run&&!!p.idle),season:JSON.parse(JSON.stringify(season)),pauseLabel:$('#pause-button').textContent};},shoot(){mode='shoot';elapsed=0;practiceScore=0;running=true;kickoff();update(1/60);scene.render();update(1/60);scene.render();aim={x:3.1,y:2.1};action('shoot');},aiShot(z){mode='match';elapsed=0;running=true;paused=false;kickoff();putPlayer(players[5],0,z);own(players[5]);setBall(0,z-1);elapsed=1.6;updateAI(1/60);return owner===players[5];},pass(){mode='pass';elapsed=0;practiceScore=0;practiceTries=0;running=true;kickoff();action('pass');},dribble(withBall){mode='dribble';elapsed=0;running=true;paused=false;kickoff();if(!withBall)release(B.Vector3.Zero());putPlayer(players[0],dribbleGates[0].position.x,dribbleGates[0].position.z);},pause(value){paused=value;},expire(){elapsed=config[mode].duration-.001;},
begin(next='match',difficulty='club'){setDifficulty(difficulty);selectMode(next);start();},
finishScore(home,away){goals=[home,away];elapsed=config[mode].duration;finish();},
finishAgain(){finish();},
nextRound(){nextCupRound();},
goal(team){owner=null;goalLock=0;lastGoalZ=0;setBall(0,team===0?28:-28,.5);checkGoals();},
movement(difficulty){setDifficulty(difficulty);selectMode('match');start();putPlayer(players[5],0,15);const before=players[5].pos.clone();updateAI(.1);return B.Vector3.Distance(before,players[5].pos);},
sprint(value){season.sprint=value;keys.clear();if(value)keys.add('w');},
restart(){start();},
};`,context);
context.test.setup();for(let i=0;i<180;i++)context.test.tick();let result=context.test.snapshot();if(result.players!==10||!result.rigged||result.positions.some(v=>v.some(n=>!Number.isFinite(n))))throw Error('Invalid player state');console.log('PASS native scene / model / animation / AI:',JSON.stringify(result));context.test.shoot();for(let i=0;i<140;i++)context.test.tick();result=context.test.snapshot();if(result.practiceScore!==1)throw Error('Shot did not score');console.log('PASS native shooting:',JSON.stringify({ball:result.ball,practiceScore:result.practiceScore}));context.test.pass();for(let i=0;i<100;i++)context.test.tick();result=context.test.snapshot();if(!result.recipientCaught||result.practiceScore!==1||result.practiceTries!==0)throw Error('Pass must score immediately on reception, before deadline');console.log('PASS native passing:',JSON.stringify({ball:result.ball,ownerTeam:result.owner,recipientCaught:result.recipientCaught}));if(result.ball.some(n=>!Number.isFinite(n)))throw Error('Invalid physics state');for(let i=0;i<25;i++)context.test.tick();if(context.test.snapshot().practiceScore!==1)throw Error('Pass scored more than once');console.log('PASS reception scores once');if(!context.test.aiShot(20))throw Error('Opponent shoots from its own half');console.log('PASS AI keeps possession in own half');if(context.test.aiShot(-20))throw Error('Opponent fails to shoot near attacking goal');console.log('PASS AI shoots toward attacking goal');context.test.dribble(false);context.test.tick();result=context.test.snapshot();if(result.gateIndex!==0)throw Error('Dribbling counted a gate without the ball');console.log('PASS dribbling requires possession');context.test.dribble(true);context.test.tick();if(context.test.snapshot().gateIndex!==1)throw Error('Dribbling with ball failed');console.log('PASS dribbling with ball');context.test.pause(true);const frozen=context.test.snapshot();for(let i=0;i<60;i++)context.test.tick();result=context.test.snapshot();if(result.elapsed!==frozen.elapsed||result.ball.some((v,i)=>Math.abs(v-frozen.ball[i])>.001))throw Error('Pause did not freeze time/ball');console.log('PASS pause freezes simulation');context.test.pause(false);context.test.expire();context.test.tick();if(context.test.snapshot().running)throw Error('Timed round did not finish');console.log('PASS timed round completion');
const assert=require('node:assert/strict'),game=context.test;
const tick=count=>{for(let i=0;i<count;i++)game.tick();};
const rookieDistance=game.movement('rookie');
const proDistance=game.movement('pro');
assert.ok(rookieDistance>0&&proDistance>rookieDistance*1.1,'Difficulty must change real opponent movement');
console.log('PASS difficulty changes opponent movement');
game.begin('match','invalid');
assert.equal(game.snapshot().season.difficulty,'club');
console.log('PASS invalid difficulty falls back to club');

game.begin('cup','rookie');
game.finishScore(2,0);
result=game.snapshot();
assert.equal(result.running,false);
assert.ok(result.season.finished&&result.season.advance);
game.finishAgain();
assert.equal(game.snapshot().season.records.wins,result.season.records.wins);
game.nextRound();
assert.equal(game.snapshot().season.stage,1);
assert.ok(game.snapshot().running);
game.nextRound();
assert.equal(game.snapshot().season.stage,1,'Repeated next-round action must not skip a stage');
game.finishScore(1,0);
game.nextRound();
assert.equal(game.snapshot().season.stage,2);
const cupsBefore=game.snapshot().season.records.cups;
game.finishScore(3,1);
result=game.snapshot();
assert.ok(result.season.awarded&&!result.season.advance);
assert.equal(result.season.records.cups,cupsBefore+1);
game.finishAgain();
game.nextRound();
assert.equal(game.snapshot().season.records.cups,cupsBefore+1);
assert.equal(game.snapshot().season.stage,2);
console.log('PASS three cup rounds advance once and award one trophy');

game.begin('cup');
game.finishScore(0,0);
result=game.snapshot();
assert.ok(result.running&&result.season.overtime&&!result.season.finished);
game.goal(0);
result=game.snapshot();
assert.ok(!result.running&&result.season.finished&&result.season.advance);
assert.equal(result.score[0],1);
console.log('PASS tied cup enters golden goal and ends on the scored goal');
game.begin('cup');
game.finishScore(0,1);
game.nextRound();
result=game.snapshot();
assert.ok(result.season.finished&&!result.season.advance&&!result.running);
assert.equal(result.season.stage,0);
console.log('PASS cup loss cannot advance');

game.begin('match');
game.sprint(true);
tick(60);
assert.ok(game.snapshot().season.stamina<100,'Moving with sprint must consume stamina');
game.sprint(false);
const depleted=game.snapshot().season.stamina;
tick(60);
assert.ok(game.snapshot().season.stamina>depleted,'Resting must recover stamina');
game.restart();
assert.equal(game.snapshot().season.stamina,100);
console.log('PASS sprint drains, resting recovers and a new match resets stamina');
game.pause(true);
$('#pause-button').textContent='▶';
game.restart();
assert.equal(game.snapshot().pauseLabel,'Ⅱ');
console.log('PASS new match resets pause control');
scene.dispose();engine.dispose();})().catch(error=>{console.error('QA ERROR:',error.name,error.message);process.exitCode=1;});
