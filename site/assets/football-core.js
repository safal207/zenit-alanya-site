(function(root){'use strict';
function inputVector(x,z,camera,target){const length=Math.hypot(x,z);if(length<.06)return{x:0,z:0};x/=Math.max(1,length);z/=Math.max(1,length);let fx=target.x-camera.x,fz=target.z-camera.z;const n=Math.hypot(fx,fz)||1;fx/=n;fz/=n;return{x:x*fz+z*fx,z:-x*fx+z*fz};}
function segmentDistance(point,a,b){const dx=b.x-a.x,dz=b.z-a.z,n=dx*dx+dz*dz;if(!n)return Math.hypot(point.x-a.x,point.z-a.z);const t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.z-a.z)*dz)/n));return Math.hypot(point.x-a.x-t*dx,point.z-a.z-t*dz);}
function passScore(origin,target,opponents,dir){const distance=Math.hypot(target.x-origin.x,target.z-origin.z),danger=opponents.reduce((sum,p)=>sum+Math.max(0,2.4-segmentDistance(p,origin,target))*12,0);return distance-Math.max(0,(target.z-origin.z)*dir)*.65+danger;}
function canShoot(z,dir,held,delay=1){return z*dir>13&&held>delay;}
const DIFFICULTIES = {
  rookie: {name:'Первый матч',speed:3.7,keeper:3.4,shotDelay:1.5,passDelay:4,accuracy:1.8},
  club: {name:'Клубный',speed:4.6,keeper:4.5,shotDelay:1,passDelay:2.8,accuracy:.8},
  pro: {name:'Профи',speed:5.5,keeper:5.8,shotDelay:.55,passDelay:1.6,accuracy:.25}
};
const CUP = [
  {name:'Четвертьфинал',opponent:'TOROS'},
  {name:'Полуфинал',opponent:'AKDENIZ'},
  {name:'Финал',opponent:'KALE'}
];
const api={inputVector,segmentDistance,passScore,canShoot,DIFFICULTIES,CUP};if(typeof module==='object'&&module.exports)module.exports=api;else root.FootballCore=api;
})(typeof window==='undefined'?globalThis:window);
