(()=>{'use strict';
const F=window.FootballCore;
const $=s=>document.querySelector(s),canvas=$('#arena'),ui={score:$('#match-score'),clock:$('#match-clock'),msg:$('#arena-message'),tip:$('#arena-tip'),overlay:$('#arena-overlay'),heading:$('#arena-heading'),description:$('#arena-description'),loading:$('#arena-loading'),progress:$('#loading-progress'),start:$('#start-match')};
let B,engine,scene,camera,asset,ball,ballBody,players=[],active=0,owner=null,mode=new URLSearchParams(location.search).get('mode')||'match',ready=false,running=false,paused=false,elapsed=0,last=0,kickLock=0,goalLock=0,round=0,goals=[0,0],practiceScore=0,practiceTries=0,cameraStyle=0,joy={x:0,z:0},keys=new Set(),messageUntil=0,lastGoalZ=0,dribbleGates=[],audio=null,sound=false,physicsPlugin;
if(!['match','cup','shoot','pass','dribble'].includes(mode))mode='match';
const config={match:{heading:'ТВОЙ МАТЧ.\nТВОЯ КОМАНДА.',desc:'Мини-матч 5×5: двигайся, отдавай пас, ищи свободную зону и бей по воротам. Компьютерный соперник играет против твоей команды.',tip:'Джойстик / WASD — движение · E — пас · пробел — удар · Q — смена игрока',duration:120},shoot:{heading:'ВЫБЕРИ УГОЛ.\nЗАБЕЙ ГОЛ.',desc:'Пять ударов по настоящему 3D-мячу. Коснись точки в воротах или смести прицел стрелками, затем нажми «Удар».',tip:'Коснись ворот для прицеливания · стрелки — прицел · пробел — удар',duration:120},pass:{heading:'ТОЧНЫЙ ПАС.\nИГРАЕМ ВМЕСТЕ.',desc:'Найди партнёра в голубой форме и отправь ему мяч. Пять попыток: сила, направление и движение мяча рассчитываются физикой.',tip:'E / «Пас» — передача · Q / «Выбор» — следующий партнёр · золотое кольцо — получатель',duration:120},dribble:{heading:'ДЕРЖИ МЯЧ.\nПРОЙДИ МАРШРУТ.',desc:'Проведи мяч через голубые ворота между фишками. Управляй джойстиком или стрелками. Короткая тренировка длится 45 секунд.',tip:'Джойстик / WASD — ведение · пройди голубые ворота по порядку',duration:45}};
const season = {
  type:'friendly',stage:0,advance:false,finished:false,difficulty:'club',
  overtime:false,stamina:100,sprint:false,exhausted:false,awarded:false,lastPass:null,
  stats:{shots:[0,0],passes:0,accurate:0,ownSeconds:0,ballSeconds:0},
  records:{wins:0,cups:0}
};
try {
  const saved = JSON.parse(window.localStorage.getItem('zenit-football-v1') || '{}');
  if (Object.hasOwn(F.DIFFICULTIES, saved.difficulty)) season.difficulty = saved.difficulty;
  for (const key of ['wins','cups']) {
    if (Number.isSafeInteger(saved[key]) && saved[key] >= 0) season.records[key] = saved[key];
  }
} catch {}
let aim={x:2,y:1.1},selectedTarget=-1,passTarget=null,gateIndex=0,practiceDeadline=null,restartAt=null,control={x:0,z:0},shotPower=1;
function textMessage(s,seconds=2){ui.msg.textContent=s;messageUntil=elapsed+seconds;}
function loadScript(path){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=new URL(path,location.href).href;s.onload=resolve;s.onerror=()=>reject(new Error('Не загрузился игровой модуль.'));document.head.append(s);});}
function progress(v,text){ui.progress.style.width=v+'%';ui.loading.textContent=text;}
function mat(name,color,rough=1){const m=new B.StandardMaterial(name,scene);m.diffuseColor=B.Color3.FromHexString(color);m.specularColor=new B.Color3(.07,.09,.1);m.roughness=rough;return m;}
function staticBody(mesh,type=B.PhysicsShapeType.BOX,restitution=.25){return new B.PhysicsAggregate(mesh,type,{mass:0,friction:.65,restitution},scene);}
function box(name,w,h,d,x,y,z,material,collision=false){const m=B.MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);m.position.set(x,y,z);m.material=material;m.receiveShadows=true;if(collision)staticBody(m);return m;}
function line(name,points,color='#e5fcf5'){const mesh=B.MeshBuilder.CreateLines(name,{points:points.map(v=>new B.Vector3(...v))},scene);mesh.color=B.Color3.FromHexString(color);mesh.isPickable=false;return mesh;}
function circle(name,r,z=0){const points=[];for(let i=0;i<=80;i++){const a=i/80*Math.PI*2;points.push([Math.cos(a)*r,.035,Math.sin(a)*r+z]);}line(name,points);}
function makeGoal(z){const white=mat('goalwhite'+z,'#effaff'),sign=Math.sign(z);for(const x of [-3.8,3.8]){const p=B.MeshBuilder.CreateCylinder('post',{height:2.6,diameter:.15,tessellation:12},scene);p.position.set(x,1.3,z);p.material=white;staticBody(p,B.PhysicsShapeType.CAPSULE,.65);}const cross=B.MeshBuilder.CreateCylinder('crossbar',{height:7.75,diameter:.15,tessellation:12},scene);cross.rotation.z=Math.PI/2;cross.position.set(0,2.6,z);cross.material=white;staticBody(cross,B.PhysicsShapeType.CAPSULE,.7);const lines=[];for(let x=-3.8;x<=3.81;x+=.38){lines.push([new B.Vector3(x,0,z+sign*1.8),new B.Vector3(x,2.6,z+sign*1.8)]);lines.push([new B.Vector3(x,2.6,z),new B.Vector3(x,2.6,z+sign*1.8)]);}for(let y=0;y<=2.61;y+=.32){lines.push([new B.Vector3(-3.8,y,z+sign*1.8),new B.Vector3(3.8,y,z+sign*1.8)]);lines.push([new B.Vector3(-3.8,y,z),new B.Vector3(-3.8,y,z+sign*1.8)]);lines.push([new B.Vector3(3.8,y,z),new B.Vector3(3.8,y,z+sign*1.8)]);}const net=B.MeshBuilder.CreateLineSystem('net',{lines},scene);net.color=new B.Color3(.76,.89,.9);net.alpha=.52;for(const side of [-1,1]){const wall=box('net-side',.12,2.6,1.9,side*3.8,1.3,z+sign*.95,white,true);wall.visibility=0;}const back=box('net-back',7.6,2.6,.12,0,1.3,z+sign*1.88,white,true);back.visibility=0;}
function stadium(){const grass=mat('grass','#23865b'),pitch=B.MeshBuilder.CreateGround('pitch',{width:35,height:55,subdivisions:2},scene);pitch.material=grass;pitch.receiveShadows=true;const groundCollider=box('ground',100,.2,110,0,-.13,0,grass,true);groundCollider.visibility=0;for(let z=-25;z<28;z+=5){const stripe=B.MeshBuilder.CreateGround('mown-stripe',{width:34,height:5},scene);stripe.position.set(0,.009,z);stripe.material=mat('stripe'+z,z%10===0?'#2a9263':'#26885d');stripe.receiveShadows=true;}
line('boundary',[[-17,.04,-27],[17,.04,-27],[17,.04,27],[-17,.04,27],[-17,.04,-27]]);line('half',[[-17,.04,0],[17,.04,0]]);circle('center',4.5);for(const s of [-1,1]){const z=s*27;line('penalty',[[-8,.04,z],[-8,.04,z-s*10],[8,.04,z-s*10],[8,.04,z]]);line('box',[[-4.5,.04,z],[-4.5,.04,z-s*4],[4.5,.04,z-s*4],[4.5,.04,z]]);makeGoal(z);}
const blue=mat('stands-blue','#087cb3'),white=mat('stands-white','#dcecf3'),dark=mat('arena-dark','#164a61');for(const side of [-1,1]){for(let row=0;row<5;row++){box('stand-base',4,.45,58,side*(20+row*.8),.35+row*.55,0,dark);for(let z=-27;z<=27;z+=3){box('seats',1.1,.55,2.4,side*(18.8+row*.9),.7+row*.55,z,(Math.floor(z/3)+row)%3===0?white:blue);}}for(let z of [-31,31]){box('score-wall',35,2,.7,0,1,z,blue);}}
for(const x of [-23,23])for(const z of [-22,22]){const pole=B.MeshBuilder.CreateCylinder('floodlight',{height:13,diameter:.22,tessellation:8},scene);pole.position.set(x,6.5,z);pole.material=white;box('light-bank',2.2,.8,.6,x,13,z,white);}
const ring=B.MeshBuilder.CreateTorus('selected-player',{diameter:1.35,thickness:.055,tessellation:40},scene);ring.material=mat('selection','#5ee8ff');ring.material.emissiveColor=new B.Color3(.12,.65,.83);ring.position.y=.04;ring.isPickable=false;const receiver=B.MeshBuilder.CreateTorus('pass-recipient',{diameter:1.8,thickness:.09,tessellation:40},scene);receiver.material=mat('recipient-color','#ffe26b');receiver.material.emissiveColor=new B.Color3(.65,.5,.08);receiver.isPickable=false;receiver.setEnabled(false);const aimMark=B.MeshBuilder.CreateTorus('goal-target',{diameter:.7,thickness:.06,tessellation:32},scene);aimMark.rotation.x=Math.PI/2;aimMark.material=receiver.material;aimMark.isPickable=false;aimMark.setEnabled(false);scene.metadata={ring,receiver,aimMark};
const brand=B.MeshBuilder.CreatePlane('club-sign',{width:6,height:6},scene);brand.position.set(0,5.2,31.35);brand.rotation.y=0;const brandMat=new B.StandardMaterial('club-sign-material',scene);brandMat.diffuseTexture=new B.Texture('../assets/club-logo.jpg',scene);brandMat.emissiveColor=new B.Color3(.38,.38,.38);brandMat.backFaceCulling=false;brand.material=brandMat;}
function makeBall(){const mesh=B.MeshBuilder.CreateSphere('match-ball',{diameter:.46,segments:24},scene);mesh.position.set(0,.45,0);const material=mat('ball-white','#f6fcff');material.specularColor=new B.Color3(.28,.28,.3);mesh.material=material;const patches=[];for(let i=0;i<12;i++){const y=1-(i+.5)*2/12,a=i*2.399963,x=Math.cos(a)*Math.sqrt(1-y*y),z=Math.sin(a)*Math.sqrt(1-y*y);const disc=B.MeshBuilder.CreateDisc('ball-panel',{radius:.073,tessellation:5},scene);disc.parent=mesh;disc.position.set(x*.231,y*.231,z*.231);disc.lookAt(disc.position.scale(2));disc.material=mat('panel'+i,'#132b40');disc.isPickable=false;patches.push(disc);}ball=mesh;ballBody=new B.PhysicsAggregate(ball,B.PhysicsShapeType.SPHERE,{mass:.43,friction:.58,restitution:.48},scene).body;ballBody.setLinearDamping(.2);ballBody.setAngularDamping(.3);return mesh;}
function spawn(team,index,home){const instance=asset.instantiateModelsToScene(n=>'p'+team+'_'+index+'_'+n,true,{doNotInstantiate:true}),root=new B.TransformNode('player-'+team+'-'+index,scene);instance.rootNodes.forEach(n=>{n.parent=root;});root.computeWorldMatrix(true);let min=new B.Vector3(Infinity,Infinity,Infinity),max=new B.Vector3(-Infinity,-Infinity,-Infinity);root.getChildMeshes().forEach(m=>{m.computeWorldMatrix(true);const b=m.getBoundingInfo().boundingBox;min=B.Vector3.Minimize(min,b.minimumWorld);max=B.Vector3.Maximize(max,b.maximumWorld);});const scale=1.78/Math.max(.1,max.y-min.y);root.scaling.setAll(scale);const offset=-min.y*scale;root.position.set(home.x,offset,home.z);root.getChildMeshes().forEach(mesh=>{mesh.receiveShadows=true;mesh.isPickable=false;const material=mesh.material;if(material){if(/shirt/i.test(material.name)){if(material.albedoColor)material.albedoColor=team===0?new B.Color3(0,.59,.9):new B.Color3(1,.42,.16);if(material.diffuseColor)material.diffuseColor=team===0?new B.Color3(0,.59,.9):new B.Color3(1,.42,.16);}if(/pants|socks/i.test(material.name)){if(material.albedoColor)material.albedoColor=team===0?new B.Color3(.92,.98,1):new B.Color3(.07,.16,.25);if(material.diffuseColor)material.diffuseColor=team===0?new B.Color3(.92,.98,1):new B.Color3(.07,.16,.25);}}});const idle=instance.animationGroups.find(a=>/Man_Idle/.test(a.name)),run=instance.animationGroups.find(a=>/Man_Run$/.test(a.name));if(idle){idle.start(true);idle.setWeightForAllAnimatables(1);}if(run){run.start(true);run.setWeightForAllAnimatables(0);run.speedRatio=1.05;}const collider=B.MeshBuilder.CreateCapsule('player-collider',{height:1.6,radius:.29,tessellation:8},scene);collider.visibility=0;collider.isPickable=false;collider.position.set(home.x,.8,home.z);const body=new B.PhysicsAggregate(collider,B.PhysicsShapeType.CAPSULE,{mass:0,friction:.45,restitution:.1},scene).body;body.setMotionType(B.PhysicsMotionType.ANIMATED);const p={team,index,root,instance,idle,run,offset,body,collider,pos:new B.Vector3(home.x,0,home.z),home:{...home},yaw:team===0?0:Math.PI,moving:0,kick:0,hasBallSince:0};players.push(p);return p;}
function teleportBody(body,node,position,rotation=B.Quaternion.Identity()){node.position.copyFrom(position);node.rotationQuaternion=rotation.clone();node.computeWorldMatrix(true);body.setPrestepType(B.PhysicsPrestepType.TELEPORT);scene.getPhysicsEngine().getPhysicsPlugin().setPhysicsBodyTransformation(body,node);body.setLinearVelocity(B.Vector3.Zero());body.setAngularVelocity(B.Vector3.Zero());}
function putPlayer(p,x,z){p.pos.set(x,0,z);p.root.position.set(x,p.offset,z);teleportBody(p.body,p.collider,new B.Vector3(x,.8,z));}
function setBall(x,z,y=.35){ballBody.setMotionType(B.PhysicsMotionType.ANIMATED);teleportBody(ballBody,ball,new B.Vector3(x,y,z));}
function own(p){owner=p;p.hasBallSince=elapsed;ballBody.setMotionType(B.PhysicsMotionType.ANIMATED);}
function release(v){owner=null;ballBody.setMotionType(B.PhysicsMotionType.DYNAMIC);ballBody.setLinearVelocity(v);ballBody.setAngularVelocity(new B.Vector3(v.z*1.8,0,-v.x*1.8));kickLock=elapsed+.35;}
function kickoff(team=0){season.lastPass=null;practiceDeadline=null;restartAt=null;selectedTarget=-1;passTarget=null;control={x:0,z:0};players.forEach(p=>{p.root.setEnabled(mode==='match'||(p.team===0&&p.index<3)||(p.team===1&&p.index===4));p.collider.setEnabled(p.root.isEnabled());p.body.shape.filterCollideMask=p.root.isEnabled()?0xffffffff:0;putPlayer(p,p.home.x,p.home.z);p.moving=0;p.yaw=p.team===0?0:Math.PI;});active=0;if(mode==='match'){putPlayer(players[0],0,-1.2);putPlayer(players[5],0,4);own(players[team===0?0:5]);setBall(0,0);}else if(mode==='shoot'){players.forEach(p=>{p.root.setEnabled(p===players[0]||p===players[9]);p.collider.setEnabled(p.root.isEnabled());p.body.shape.filterCollideMask=p.root.isEnabled()?0xffffffff:0;});putPlayer(players[0],0,11.4);putPlayer(players[9],0,25.5);own(players[0]);setBall(0,12.3);aim={x:practiceTries%2===0?2:-2,y:1.2};}else if(mode==='pass'){players.forEach(p=>{p.root.setEnabled(p.team===0&&p.index<3);p.collider.setEnabled(p.root.isEnabled());p.body.shape.filterCollideMask=p.root.isEnabled()?0xffffffff:0;});const side=practiceTries%2===0?1:-1;putPlayer(players[0],-5*side,-8);putPlayer(players[1],6*side,3);putPlayer(players[2],-5*side,14);active=0;own(players[0]);setBall(-5*side,-7);}else{players.forEach(p=>{p.root.setEnabled(p===players[0]);p.collider.setEnabled(p===players[0]);p.body.shape.filterCollideMask=p===players[0]?0xffffffff:0;});putPlayer(players[0],0,-21);active=0;own(players[0]);setBall(0,-20);gateIndex=0;dribbleGates.forEach(g=>g.material.emissiveColor=new B.Color3(.04,.35,.45));}dribbleGates.forEach(g=>g.setEnabled(mode==='dribble'));lastGoalZ=0;round++;goalLock=elapsed+(mode==='match'?1:.15);}
function action(kind='shoot'){if(!running||paused)return;const p=players[active];if(!owner||owner.team!==0||owner!==p){switchPlayer();return;}p.kick=.45;const dir=1;let target;if(kind==='pass'||mode==='pass'){const mate=chooseRecipient(p);if(!mate)return;target=mate.pos.clone();passTarget=mate;if(mode==='match'){season.stats.passes++;season.lastPass={from:p,to:mate};}const distance=B.Vector3.Distance(p.pos,target),v=target.subtract(p.pos).normalize().scale(Math.min(19,8+distance*.45));v.y=.45;release(v);if(mode==='match')active=players.indexOf(mate);textMessage('Пас! Ищи свободную зону.',1.4);}else{if(mode==='match')season.stats.shots[0]++;season.lastPass=null;target=new B.Vector3(mode==='shoot'?aim.x:Math.max(-3.1,Math.min(3.1,p.pos.x*.2)),mode==='shoot'?aim.y:1.1,27.5);const distance=Math.hypot(target.x-ball.position.x,target.z-ball.position.z),speed=Math.min(30,(17+distance*.27)*(mode==='shoot'?shotPower:1)),time=distance/speed;const v=new B.Vector3((target.x-ball.position.x)/Math.max(.2,time),(target.y-ball.position.y+4.905*time*time)/Math.max(.2,time),(target.z-ball.position.z)/Math.max(.2,time));release(v);tone(220,.08);textMessage('Удар!',1.1);}if(mode!=='match'&&mode!=='dribble'){practiceDeadline={at:elapsed+(mode==='pass'?2.4:2.7),round,passer:p};}}
function chooseRecipient(p){const rivals=players.filter(q=>q.team!==p.team&&q.root.isEnabled()).map(q=>q.pos);const mates=players.filter(q=>q.team===p.team&&q!==p&&q.index!==4&&q.root.isEnabled());mates.sort((a,b)=>F.passScore(p.pos,a.pos,rivals,p.team===0?1:-1)-F.passScore(p.pos,b.pos,rivals,p.team===0?1:-1));return mates.find(q=>players.indexOf(q)===selectedTarget)||mates[0];}
function switchPlayer(){if(mode==='pass'&&owner){const mates=players.filter(q=>q.team===0&&q!==owner&&q.root.isEnabled()),chosen=chooseRecipient(owner);selectedTarget=players.indexOf(mates[(mates.indexOf(chosen)+1)%mates.length]);textMessage('Получатель выделен золотым кольцом.',1.1);return;}const field=players.filter(p=>p.team===0&&p.index!==4&&p.root.isEnabled());if(!field.length)return;field.sort((a,b)=>B.Vector3.Distance(a.pos,ball.position)-B.Vector3.Distance(b.pos,ball.position));active=players.indexOf(field[0]);textMessage('Игрок выбран',.7);}
function movePlayer(p,target,dt,speed=4.9){const dx=target.x-p.pos.x,dz=target.z-p.pos.z,distance=Math.hypot(dx,dz);if(distance>.15){const step=Math.min(distance,speed*dt);p.pos.x+=dx/distance*step;p.pos.z+=dz/distance*step;p.yaw=Math.atan2(dx,dz);p.moving=Math.min(1,p.moving+dt*5);}else p.moving=Math.max(0,p.moving-dt*6);p.pos.x=Math.max(-16.5,Math.min(16.5,p.pos.x));p.pos.z=Math.max(-26,Math.min(26,p.pos.z));}
function updateAI(dt){const difficulty=opponentDifficulty();const nearestByTeam=[0,1].map(team=>players.filter(p=>p.team===team&&p.index!==4&&p.root.isEnabled()).sort((a,b)=>B.Vector3.Distance(a.pos,ball.position)-B.Vector3.Distance(b.pos,ball.position))[0]);for(const p of players){if(!p.root.isEnabled()||p===players[active])continue;const dir=p.team===0?1:-1;let target={x:p.home.x,z:p.home.z};if(p.index===4){target={x:Math.max(-3,Math.min(3,ball.position.x*.6)),z:dir*-25.1};movePlayer(p,target,dt,p.team===1?difficulty.keeper:4.5);continue;}if(mode!=='match'){p.moving=Math.max(0,p.moving-dt*4);continue;}if(owner===p){target={x:p.pos.x*.8,z:dir*25};if(F.canShoot(p.pos.z,dir,elapsed-p.hasBallSince,p.team===1?difficulty.shotDelay:1)){season.stats.shots[p.team]++;const error=p.team===1?Math.sin(elapsed*3.7)*difficulty.accuracy:0;const goal=new B.Vector3(Math.sin(elapsed*2)*2.6+error,.8,dir*28),dist=B.Vector3.Distance(p.pos,goal),time=dist/21;release(new B.Vector3((goal.x-ball.position.x)/time,(goal.y-ball.position.y+4.905*time*time)/time,(goal.z-ball.position.z)/time));p.kick=.4;tone(180,.05);}else if(elapsed-p.hasBallSince>(p.team===1?difficulty.passDelay:3.4)&&p.pos.z*dir<=13){const rivals=players.filter(q=>q.team!==p.team&&q.root.isEnabled()).map(q=>q.pos);const mate=players.filter(q=>q.team===p.team&&q!==p&&q.index!==4&&(q.pos.z-p.pos.z)*dir>1).sort((a,b)=>F.passScore(p.pos,a.pos,rivals,dir)-F.passScore(p.pos,b.pos,rivals,dir))[0];if(mate){const v=mate.pos.subtract(p.pos).normalize().scale(14);v.y=.4;release(v);p.kick=.4;}}}else if(p===nearestByTeam[p.team]&&(!owner||owner.team!==p.team)){target={x:ball.position.x,z:ball.position.z};}else if(owner?.team===p.team){target={x:p.home.x+Math.sin(elapsed*.6+p.index)*2,z:Math.max(-21,Math.min(21,ball.position.z-dir*4+p.index*dir*2))};}else{target={x:p.home.x*.7+ball.position.x*.3,z:p.home.z*.55+ball.position.z*.35};}movePlayer(p,target,dt,p.team===0?4.7:difficulty.speed);}}
function animatePlayer(p,dt){p.root.position.set(p.pos.x,p.offset,p.pos.z);let delta=((p.yaw-p.root.rotation.y+Math.PI*3)%(Math.PI*2))-Math.PI;p.root.rotation.y+=delta*Math.min(1,dt*10);p.root.rotation.x=p.kick>0?Math.sin(p.kick/.45*Math.PI)*.12:0;p.kick=Math.max(0,p.kick-dt);if(p.idle)p.idle.setWeightForAllAnimatables(1-p.moving);if(p.run)p.run.setWeightForAllAnimatables(p.moving);p.body.setTargetTransform(new B.Vector3(p.pos.x,.8,p.pos.z),B.Quaternion.RotationYawPitchRoll(p.yaw,0,0));}
function updateHUD() {
  ui.score.textContent = mode === 'match' ? goals.join(' : ') :
    mode === 'dribble' ? gateIndex + ' / 5' : practiceScore + ' / 5';
  const seconds = season.overtime ? Math.floor(elapsed - config[mode].duration) :
    Math.max(0, Math.ceil(config[mode].duration - elapsed));
  ui.clock.textContent = (season.overtime ? '+' : '') +
    String(Math.floor(seconds / 60)).padStart(2,'0') + ':' + String(seconds % 60).padStart(2,'0');
  $('#practice-progress').textContent = mode === 'match' ?
    (season.overtime ? 'Золотой гол · следующий гол решает матч' :
      (season.type === 'cup' ? F.CUP[season.stage].name + ' · ' : 'Товарищеский матч · ') +
      opponentDifficulty().name) :
    mode === 'dribble' ? 'Веди мяч через подсвеченные ворота' :
    'Попытка ' + Math.min(5,practiceTries+1) + ' из 5 · ' + (mode === 'pass' ? 'выбери получателя' : 'выбери угол ворот');
  $('#stamina').value = Math.round(season.stamina);
  $('#sprint-button').setAttribute('aria-pressed',String(season.sprint));
}
function tone(freq,duration=.1){if(!sound)return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=freq;o.connect(g);g.connect(audio.destination);g.gain.setValueAtTime(.03,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.start();o.stop(audio.currentTime+duration);}catch{}}
function checkGoals(){if(elapsed<goalLock)return;const z=ball.position.z;if(Math.abs(z)>27.15&&Math.abs(ball.position.x)<3.72&&ball.position.y<2.52&&Math.sign(z)!==lastGoalZ){lastGoalZ=Math.sign(z);goalLock=elapsed+2.2;if(mode==='match'){goals[z>0?0:1]++;textMessage(z>0?'ГОООЛ! ЗЕНИТ АЛАНЬЯ!':'Гол соперника. Играем дальше!',2);tone(z>0?660:180,.3);updateHUD();if(season.overtime){finish();return;}restartAt={at:elapsed+1.5,team:z>0?1:0,round};}else if(mode==='shoot'){practiceScore++;textMessage('ГОООЛ! Отличный удар!',2);tone(660,.25);updateHUD();}}if(mode==='match'&&(Math.abs(ball.position.x)>18||Math.abs(z)>30||ball.position.y<-2)){textMessage('Мяч за линией. Возобновляем игру.',1.2);kickoff(owner?.team===1?0:1);}}
function update(dt){if(!running||paused)return;elapsed+=dt;if(mode==='match'&&owner){season.stats.ballSeconds+=dt;if(owner.team===0)season.stats.ownSeconds+=dt;}if(elapsed>messageUntil)ui.msg.textContent='';kickLock=Math.max(0,kickLock);const p=players[active],dir={x:joy.x+(keys.has('d')||keys.has('ArrowRight')?1:0)-(keys.has('a')||keys.has('ArrowLeft')?1:0),z:joy.z+(keys.has('w')||keys.has('ArrowUp')?1:0)-(keys.has('s')||keys.has('ArrowDown')?1:0)};if(mode==='shoot'){aim.x=Math.max(-3.4,Math.min(3.4,aim.x+dir.x*dt*2.3));aim.y=Math.max(.35,Math.min(2.25,aim.y+dir.z*dt*1.5));p.moving=0;}else if(mode==='pass'){p.moving=0;}else{const movement=F.inputVector(dir.x,dir.z,camera.position,camera.getTarget()),blend=1-Math.exp(-12*dt);
if(season.stamina<=1)season.exhausted=true;
if(season.stamina>=25)season.exhausted=false;
const sprinting=(season.sprint||keys.has('Shift'))&&!season.exhausted&&season.stamina>1&&Math.hypot(dir.x,dir.z)>.1;
season.stamina=Math.max(0,Math.min(100,season.stamina+(sprinting?-27:14)*dt));
const pace=sprinting?8:5.6;
control.x+=(movement.x*pace-control.x)*blend;control.z+=(movement.z*pace-control.z)*blend;const speed=Math.hypot(control.x,control.z);if(speed>.08)movePlayer(p,{x:p.pos.x+control.x,z:p.pos.z+control.z},dt,speed);else p.moving=Math.max(0,p.moving-dt*7);}
updateAI(dt);for(const q of players){if(q.root.isEnabled())animatePlayer(q,dt);}if(owner){if(!owner.root.isEnabled())owner=null;else{const f=new B.Vector3(Math.sin(owner.yaw),0,Math.cos(owner.yaw));const point=owner.pos.add(f.scale(.72));const q=B.Quaternion.RotationYawPitchRoll(elapsed*owner.moving*7,elapsed*.1,elapsed*owner.moving*3);teleportBody(ballBody,ball,new B.Vector3(point.x,.27,point.z),q);if(mode==='match'&&elapsed>kickLock){const steal=players.find(q=>q.team!==owner.team&&q.root.isEnabled()&&B.Vector3.Distance(q.pos,owner.pos)<.8);if(steal){season.lastPass=null;own(steal);if(steal.team===0&&steal.index!==4)active=players.indexOf(steal);kickLock=elapsed+1;textMessage(steal.team===0?'Перехват!':'Соперник перехватил мяч',.8);}}}}
if(!owner&&elapsed>kickLock&&ball.position.y<1.4){const near=players.filter(q=>q.root.isEnabled()).sort((a,b)=>B.Vector3.Distance(a.pos,ball.position)-B.Vector3.Distance(b.pos,ball.position))[0];if(near&&Math.hypot(near.pos.x-ball.position.x,near.pos.z-ball.position.z)<.85){if(season.lastPass){if(near===season.lastPass.to)season.stats.accurate++;season.lastPass=null;}own(near);if(near.team===0&&mode==='match'&&near.index!==4)active=players.indexOf(near);if(mode==='pass'&&near===passTarget&&practiceDeadline&&!practiceDeadline.scored){practiceDeadline.scored=true;practiceScore++;practiceDeadline.at=elapsed+1.1;textMessage('Точный пас! Партнёр получил мяч.',1.1);tone(580,.13);}}}
if(owner?.index===4&&elapsed-owner.hasBallSince>.7){const mate=players.find(q=>q.team===owner.team&&q.index!==4),v=mate.pos.subtract(owner.pos).normalize().scale(15);v.y=.5;release(v);}
if(mode==='dribble'&&gateIndex<5){const gate=dribbleGates[gateIndex];if(owner===p&&Math.abs(ball.position.z-gate.position.z)<1.3&&Math.abs(ball.position.x-gate.position.x)<2.2){gate.material.emissiveColor=new B.Color3(.4,.95,.4);gateIndex++;textMessage('Отлично! Следующие ворота.',1);updateHUD();if(gateIndex===5)finish();}}
checkGoals();if(!running)return;if(restartAt&&elapsed>=restartAt.at&&restartAt.round===round)kickoff(restartAt.team);if(practiceDeadline&&elapsed>=practiceDeadline.at&&practiceDeadline.round===round){if(mode==='pass'&&!practiceDeadline.scored)textMessage('Не дошёл. Выбери партнёра ближе.',1.3);practiceTries++;if(practiceTries>=5)finish();else kickoff();}updateHUD();if(!season.overtime&&elapsed>=config[mode].duration)finish();const receiver=scene.metadata.receiver,aimMark=scene.metadata.aimMark;const mate=owner===p&&(mode==='pass'||mode==='match')?chooseRecipient(p):null;receiver.setEnabled(!!mate);if(mate)receiver.position.set(mate.pos.x,.06,mate.pos.z);aimMark.setEnabled(mode==='shoot'&&owner===p);if(mode==='shoot')aimMark.position.set(aim.x,aim.y,26.88);const ring=scene.metadata.ring;ring.position.set(p.pos.x,.05,p.pos.z);ring.setEnabled(p.root.isEnabled());const focus=mode==='shoot'?new B.Vector3(0,0,18):mode==='pass'?new B.Vector3(0,0,4):new B.Vector3(ball.position.x*.35,0,ball.position.z*.55);let pos;if(mode==='shoot')pos=new B.Vector3(0,7.5,-2);else if(mode==='dribble')pos=new B.Vector3(p.pos.x*.35,14,p.pos.z-15);else pos=cameraStyle===0?new B.Vector3(focus.x+23,29,focus.z-27):new B.Vector3(focus.x,23,focus.z-32);camera.position=B.Vector3.Lerp(camera.position,pos,Math.min(1,dt*2.8));camera.setTarget(focus.add(new B.Vector3(0,0,mode==='shoot'?5:2)));}
function opponentDifficulty() {
  const levels = Object.keys(F.DIFFICULTIES);
  const base = levels.indexOf(season.difficulty);
  return F.DIFFICULTIES[levels[Math.min(2,base + (season.type === 'cup' ? season.stage : 0))]];
}
function saveCareer() {
  try { window.localStorage.setItem('zenit-football-v1',JSON.stringify({...season.records,difficulty:season.difficulty})); } catch {}
}
function refreshLobby() {
  $('#football-difficulty').value = season.difficulty;
  $('#difficulty-description').textContent = {
    rookie:'Больше времени на решение. Соперник медленнее двигается и чаще ошибается.',
    club:'Соперник ищет передачи и атакует свободные зоны.',
    pro:'Быстрые решения, плотная опека и точные удары.'
  }[season.difficulty];
  $('#competition-summary').textContent = season.type === 'cup' ?
    'Три победы до кубка. Сложность растёт до уровня «Профи». При ничьей — золотой гол.' :
    'Две минуты на поле. Выбери сложность и сыграй за голубую команду.';
  $('#cup-bracket').hidden = season.type !== 'cup';
  $('#opponent-team').textContent = season.type === 'cup' ? F.CUP[season.stage].opponent : 'GUESTS';
  document.querySelectorAll('[data-round]').forEach(item => {
    const stage = Number(item.dataset.round);
    item.classList.toggle('current',stage === season.stage);
    item.classList.toggle('won',stage < season.stage || season.awarded);
    if(stage === season.stage) item.setAttribute('aria-current','step');
    else item.removeAttribute('aria-current');
  });
  $('#career-summary').textContent = 'Твои победы ' + season.records.wins + ' · Кубки ' + season.records.cups;
}
function finish() {
  if (season.finished) return;
  if (mode === 'match' && season.type === 'cup' && goals[0] === goals[1]) {
    season.overtime = true;
    textMessage('ЗОЛОТОЙ ГОЛ · играем до первого гола',4);
    updateHUD();
    return;
  }
  season.finished = true;
  running = false;
  paused = false;
  season.sprint = false;
  $('#pause-button').textContent = 'Ⅱ';
  $('#sprint-button').setAttribute('aria-pressed','false');
  ui.overlay.hidden = false;
  ui.overlay.classList.add('finished');
  const won = mode === 'match' && goals[0] > goals[1];
  season.advance = won && season.type === 'cup' && season.stage < F.CUP.length-1;
  season.awarded = won && season.type === 'cup' && season.stage === F.CUP.length-1;
  if(won) { season.records.wins++; if(season.awarded) season.records.cups++; saveCareer(); }
  ui.heading.textContent = season.awarded ? 'КУБОК ТВОЙ!' : mode === 'match' ?
    (won ? 'ПОБЕДА!' : goals[0] === goals[1] ? 'НИЧЬЯ' : 'ЕЩЁ ОДНА ПОПЫТКА') : 'ТРЕНИРОВКА ЗАВЕРШЕНА';
  const advice = season.stats.passes < 2 ? 'Используй пас, чтобы выйти из-под опеки.' :
    season.stats.shots[0] < 2 ? 'Подойди ближе к воротам и ищи момент для удара.' :
    'Меняй направление атаки и оставляй силы для рывка.';
  ui.description.textContent = mode === 'match' ?
    'Зенит ' + goals.join(' : ') + ' ' + (season.type === 'cup' ? F.CUP[season.stage].opponent : 'Гости') +
    '. ' + (season.awarded ? 'Три победы подряд. Ты чемпион клубного кубка!' : advice) :
    mode === 'dribble' ? 'Пройдено ворот ' + gateIndex + ' из 5. Рывок помогает на прямых, перед воротами сбавляй темп.' :
    'Результат ' + practiceScore + ' из 5. ' + (mode === 'shoot' ? 'Пробуй разные углы и силу удара.' : 'Выбирай партнёра со свободной линией передачи.');
  $('#match-report').hidden = mode !== 'match';
  $('#stats-shots').textContent = season.stats.shots.join(' / ');
  $('#stats-passes').textContent = season.stats.accurate + ' из ' + season.stats.passes;
  $('#stats-possession').textContent = (season.stats.ballSeconds ? Math.round(100*season.stats.ownSeconds/season.stats.ballSeconds) : 0) + '%';
  $('#arena-settings').hidden = true;
  $('#next-round').hidden = !season.advance;
  $('#next-exercise').hidden = season.type === 'cup';
  ui.start.hidden = season.advance;
  ui.start.textContent = season.type === 'cup' ? (season.awarded ? 'НОВЫЙ КУБОК ↗' : 'ПОВТОРИТЬ РАУНД ↗') : 'СЫГРАТЬ ЕЩЁ ↗';
  keys.clear();
  joy = {x:0,z:0};
  refreshLobby();
  (season.advance ? $('#next-round') : ui.start).focus();
}
function selectMode(next) {
  mode = next === 'cup' ? 'match' : next;
  season.type = next === 'cup' ? 'cup' : 'friendly';
  season.stage = 0;
  season.advance = false;
  season.finished = false;
  season.overtime = false;
  season.awarded = false;
  season.sprint = false;
  $('#next-round').hidden = true;
  $('#next-exercise').hidden = true;
  $('#match-report').hidden = true;
  $('#arena-settings').hidden = mode !== 'match';
  $('#stamina-control').hidden = mode !== 'match' && mode !== 'dribble';
  $('#sprint-button').hidden = mode !== 'match' && mode !== 'dribble';
  $('#shot-power-control').hidden = mode !== 'shoot';
  $('#switch-player').textContent = mode === 'pass' ? 'ВЫБОР' : 'СМЕНА';
  $('#pause-button').textContent = 'Ⅱ';
  running = false;
  paused = false;
  keys.clear();
  joy = {x:0,z:0};
  if(ready) kickoff();
  document.querySelectorAll('[data-mode]').forEach(button => {
    const chosen = button.dataset.mode === next;
    button.classList.toggle('active',chosen);
    button.setAttribute('aria-pressed',String(chosen));
  });
  ui.overlay.hidden = false;
  ui.overlay.classList.remove('finished');
  ui.heading.textContent = next === 'cup' ? 'ТРИ ПОБЕДЫ.\nОДИН КУБОК.' : config[mode].heading;
  ui.heading.style.whiteSpace = 'pre-line';
  ui.description.textContent = next === 'cup' ? 'Пройди четвертьфинал, полуфинал и финал. Веди команду к клубному кубку Аланьи.' : config[mode].desc;
  ui.tip.textContent = config[mode].tip + (mode === 'match' || mode === 'dribble' ? ' · Shift — рывок' : '');
  ui.start.hidden = false;
  ui.start.textContent = next === 'cup' ? 'НАЧАТЬ КУБОК ↗' : 'НАЧАТЬ ' + (mode === 'match' ? 'МАТЧ' : 'ТРЕНИРОВКУ') + ' ↗';
  ui.score.textContent = '0 : 0';
  ui.clock.textContent = mode === 'dribble' ? '00:45' : '02:00';
  refreshLobby();
}
function start() {
  if(!ready) { if(ui.start.dataset.failed) location.reload(); return; }
  if(season.awarded) season.stage = 0;
  season.finished = false;
  season.overtime = false;
  season.awarded = false;
  season.advance = false;
  season.stamina = 100;
  season.exhausted = false;
  season.sprint = false;
  season.stats = {shots:[0,0],passes:0,accurate:0,ownSeconds:0,ballSeconds:0};
  elapsed = 0;
  goals = [0,0];
  practiceScore = 0;
  practiceTries = 0;
  gateIndex = 0;
  running = true;
  paused = false;
  keys.clear();
  joy = {x:0,z:0};
  $('#pause-button').textContent = 'Ⅱ';
  $('#next-exercise').hidden = true;
  $('#next-round').hidden = true;
  ui.overlay.hidden = true;
  ui.overlay.classList.remove('finished');
  kickoff();
  refreshLobby();
  updateHUD();
  textMessage(season.type === 'cup' ? F.CUP[season.stage].name + ' · игра началась!' :
    mode === 'match' ? 'Игра началась!' : mode === 'shoot' ? 'Выбери угол и бей!' :
    mode === 'pass' ? 'Найди партнёра в голубой форме' : 'Пройди голубые ворота!',2.5);
  canvas.focus({preventScroll:true});
}
function nextCupRound() {
  if(!season.advance || !season.finished) return;
  season.stage++;
  start();
}
function setDifficulty(value) {
  season.difficulty = Object.hasOwn(F.DIFFICULTIES,value) ? value : 'club';
  saveCareer();
  selectMode(season.type === 'cup' ? 'cup' : mode);
}
async function initialize(){try{progress(10,'Открываем стадион…');await loadScript('../assets/vendor/babylon.js');B=window.BABYLON;if(!B.Engine.isSupported())throw new Error('Для 3D-футбола нужна поддержка WebGL в браузере.');progress(30,'Готовим игроков и мяч…');await Promise.all([loadScript('../assets/vendor/babylonjs.loaders.min.js'),loadScript('../assets/vendor/HavokPhysics_umd.js')]);engine=new B.Engine(canvas,true,{preserveDrawingBuffer:true,stencil:true,powerPreference:'high-performance'},true);engine.setHardwareScalingLevel(Math.max(1,(window.devicePixelRatio||1)/1.4));scene=new B.Scene(engine);scene.clearColor=new B.Color4(.055,.10,.19,1);scene.ambientColor=new B.Color3(.14,.17,.2);scene.fogMode=B.Scene.FOGMODE_LINEAR;scene.fogStart=70;scene.fogEnd=135;scene.fogColor=new B.Color3(.055,.10,.19);camera=new B.FreeCamera('broadcast-camera',new B.Vector3(25,31,-34),scene);camera.setTarget(B.Vector3.Zero());camera.minZ=.1;camera.maxZ=200;const hemi=new B.HemisphericLight('sky',new B.Vector3(0,1,0),scene);hemi.intensity=.65;hemi.groundColor=new B.Color3(.27,.42,.37);const sun=new B.DirectionalLight('sun',new B.Vector3(-.6,-1,.4),scene);sun.position=new B.Vector3(30,45,-25);sun.intensity=1.1;sun.diffuse=new B.Color3(.88,.94,1);const shadows=new B.ShadowGenerator(1024,sun);shadows.useBlurExponentialShadowMap=true;shadows.blurKernel=16;const hk=await window.HavokPhysics({locateFile:file=>new URL('../assets/vendor/'+file,location.href).href});physicsPlugin=new B.HavokPlugin(true,hk);scene.enablePhysics(new B.Vector3(0,-9.81,0),physicsPlugin);progress(60,'Создаём поле и команду…');stadium();makeBall();asset=await B.SceneLoader.LoadAssetContainerAsync('../assets/models/','player.glb',scene);const homes=[{x:0,z:-8},{x:-10,z:-9},{x:10,z:-5},{x:0,z:7},{x:0,z:-25}];for(let team=0;team<2;team++)for(let i=0;i<5;i++){const home=team===0?homes[i]:{x:-homes[i].x,z:-homes[i].z};const p=spawn(team,i,home);p.root.getChildMeshes().forEach(m=>shadows.addShadowCaster(m));}shadows.addShadowCaster(ball);for(let i=0;i<5;i++){const material=mat('gate-material'+i,'#48ddff');material.emissiveColor=new B.Color3(.04,.35,.45);const z=-13+i*7.2,x=(i%2===0?-1:1)*5;const gate=box('training-gate',4.2,.035,.5,x,.04,z,material);gate.setEnabled(false);dribbleGates.push(gate);for(const side of [-1,1]){const cone=B.MeshBuilder.CreateCylinder('training-cone',{height:.6,diameterTop:.03,diameterBottom:.4,tessellation:8},scene);cone.position.set(x+side*2.3,.3,z);cone.material=mat('cone'+i+side,'#f7a243');cone.parent=gate;cone.position.set(side*2.3,.28,0);}}
ready=true;progress(100,'Арена готова. Управляй джойстиком или клавиатурой.');ui.start.disabled=false;selectMode(season.type==='cup'?'cup':mode);kickoff();last=performance.now();engine.runRenderLoop(()=>{const now=performance.now(),dt=Math.min(.035,(now-last)/1000);last=now;if(!document.hidden){scene.physicsEnabled=running&&!paused;update(dt);scene.render();}});window.addEventListener('resize',()=>engine.resize());setTimeout(()=>engine.resize(),100);}catch(error){console.error('Football initialization:',error);ui.loading.textContent=error.message||'Не удалось открыть арену.';ui.start.disabled=false;ui.start.dataset.failed='true';ui.start.textContent='ПОВТОРИТЬ ЗАГРУЗКУ ↻';}}
$('#football-difficulty').addEventListener('change',event => setDifficulty(event.target.value));
$('#next-round').addEventListener('click',nextCupRound);
const sprintButton = $('#sprint-button');
sprintButton.addEventListener('pointerdown',event => {
  if(!running || paused) return;
  sprintButton.setPointerCapture(event.pointerId);
  season.sprint = true;
});
for(const event of ['pointerup','pointercancel','lostpointercapture']) {
  sprintButton.addEventListener(event,() => { season.sprint = false; });
}
sprintButton.addEventListener('keydown',event => {
  if(event.key===' ' || event.key==='Enter') { event.preventDefault(); season.sprint=true; }
});
sprintButton.addEventListener('keyup',() => { season.sprint=false; });
sprintButton.addEventListener('blur',() => { season.sprint=false; });
$('#shot-power').addEventListener('input',e=>{shotPower=Number(e.target.value)/100;$('#shot-power-value').textContent=e.target.value+'%';});$('#next-exercise').addEventListener('click',()=>{const order=['shoot','pass','dribble','match'];selectMode(order[(order.indexOf(mode)+1)%order.length]);start();});ui.start.addEventListener('click',start);document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>selectMode(b.dataset.mode)));$('#pass-ball').addEventListener('click',()=>action('pass'));$('#shoot-ball').addEventListener('click',()=>action('shoot'));$('#switch-player').addEventListener('click',switchPlayer);$('#camera-button').addEventListener('click',()=>{cameraStyle=1-cameraStyle;});$('#pause-button').addEventListener('click',()=>{if(!running)return;paused=!paused;season.sprint=false;keys.clear();joy={x:0,z:0};$('#pause-button').textContent=paused?'▶':'Ⅱ';textMessage(paused?'Пауза':'Играем!',1);});$('#sound-button').addEventListener('click',()=>{sound=!sound;$('#sound-button').textContent=sound?'Звук вкл.':'Звук выкл.';$('#sound-button').setAttribute('aria-pressed',String(sound));if(sound)tone(440,.12);});document.addEventListener('keydown',e=>{if(/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName))return;if(/^(BUTTON|A)$/.test(e.target.tagName)&&[' ','Enter'].includes(e.key))return;if(['Shift','ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','w','a','s','d','e','q','W','A','S','D','E','Q'].includes(e.key)){e.preventDefault();const key=e.key.length===1?e.key.toLowerCase():e.key;keys.add(key);if(!e.repeat){if(key===' ')action('shoot');if(key==='e')action('pass');if(key==='q')switchPlayer();}}});document.addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));window.addEventListener('blur',()=>{season.sprint=false;keys.clear();joy={x:0,z:0};});const joystick=$('#joystick'),knob=$('#joystick-knob');function joystickMove(e){const r=joystick.getBoundingClientRect(),radius=r.width*.32,dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,length=Math.hypot(dx,dy),scale=Math.min(1,radius/Math.max(1,length));joy.x=dx*scale/radius;joy.z=-dy*scale/radius;knob.style.transform='translate(calc(-50% + '+dx*scale+'px),calc(-50% + '+dy*scale+'px))';}joystick.addEventListener('pointerdown',e=>{joystick.setPointerCapture(e.pointerId);joystickMove(e);});joystick.addEventListener('pointermove',e=>{if(e.buttons)joystickMove(e);});function joystickUp(){joy={x:0,z:0};knob.style.transform='translate(-50%,-50%)';}joystick.addEventListener('pointerup',joystickUp);joystick.addEventListener('pointercancel',joystickUp);canvas.addEventListener('pointerdown',e=>{if(!ready||!running)return;const r=canvas.getBoundingClientRect(),ray=scene.createPickingRay((e.clientX-r.left)*engine.getRenderWidth()/r.width,(e.clientY-r.top)*engine.getRenderHeight()/r.height,B.Matrix.Identity(),camera);if(mode==='shoot'){const d=ray.intersectsPlane(new B.Plane(0,0,1,-27));if(d!==null&&d>0){const point=ray.origin.add(ray.direction.scale(d));aim.x=Math.max(-3.45,Math.min(3.45,point.x));aim.y=Math.max(.3,Math.min(2.3,point.y));textMessage('Прицел выбран. Нажми «Удар».',1.1);}}else if(mode==='pass'){const d=ray.intersectsPlane(new B.Plane(0,1,0,0));if(d!==null&&d>0){const point=ray.origin.add(ray.direction.scale(d));const mates=players.filter(p=>p.team===0&&p!==owner&&p.root.isEnabled());mates.sort((a,b)=>B.Vector3.Distance(a.pos,point)-B.Vector3.Distance(b.pos,point));if(mates[0]){selectedTarget=players.indexOf(mates[0]);textMessage('Получатель выбран. Нажми «Пас».',1.2);}}}});selectMode(mode);initialize();
})();
