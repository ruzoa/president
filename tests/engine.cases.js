let fails=0;
const fail=m=>{fails++;if(fails<15)console.log('FAIL',m)};
// --- 규칙 단위 테스트 ---
const R={run:1,rev:1,r8:1,lock:1,b11:1};
const id=(rk,s)=>rk*4+s;   // rk 0=3 ... 12=2
const S0={tk:null,rev:false,b11:false,lock:null};
const tkOf=ids=>({...parseCombo(ids,R),ids});
// 단일
let S={...S0,tk:tkOf([id(4,0)])};   // 7
if(playError([id(5,1)],S,R)!=='')fail('8 > 7');
if(playError([id(3,1)],S,R)==='')fail('6 < 7');
if(playError([id(4,1)],S,R)==='')fail('7 = 7 not allowed');
if(playError([id(5,0),id(5,1)],S,R)==='')fail('pair vs single');
if(playError([JOKER_BASE],S,R)!=='')fail('joker beats 7');
// 혁명
S={...S0,tk:tkOf([id(4,0)]),rev:true};
if(playError([id(3,1)],S,R)!=='')fail('rev: 6 beats 7');
if(playError([id(5,1)],S,R)==='')fail('rev: 8 not beat 7');
if(playError([JOKER_BASE],S,R)!=='')fail('rev: joker beats');
// 11백과 혁명 상쇄
S={...S0,tk:tkOf([id(4,0)]),rev:true,b11:true};
if(playError([id(5,1)],S,R)!=='')fail('rev+11back cancel');
// 계단
if(!parseCombo([id(2,1),id(3,1),id(4,1)],R))fail('run parse');
if(parseCombo([id(2,1),id(3,2),id(4,1)],R))fail('run mixed suit');
if(parseCombo([id(2,1),id(3,1),id(5,1)],R))fail('run gap');
S={...S0,tk:tkOf([id(2,1),id(3,1),id(4,1)])};
if(playError([id(3,2),id(4,2),id(5,2)],S,R)!=='')fail('run higher');
if(playError([id(0,2),id(1,2),id(2,2)],S,R)==='')fail('run lower');
if(playError([id(3,2),id(4,2),id(5,2),id(6,2)],S,R)==='')fail('run len differ');
// 조커 와일드
const c=parseCombo([id(6,0),JOKER_BASE],R);if(!c||c.ty!=='set'||c.k!==6||c.n!==2)fail('joker pair');
// 묶기
S={...S0,tk:tkOf([id(4,0),id(4,1)]),lock:[0,1]};
if(playError([id(6,0),id(6,1)],S,R)!=='')fail('lock ok');
if(playError([id(6,2),id(6,3)],S,R)==='')fail('lock violated');
if(playError([id(6,0),JOKER_BASE],S,R)!=='')fail('lock joker ok');
// legalPlays 일관성
for(let it=0;it<300;it++){
  const deck=shuffle([...Array(52).keys(),100,101]);const hand=deck.slice(0,12);
  const lead=Math.random()<.4;
  let S={tk:null,rev:Math.random()<.3,b11:Math.random()<.2,lock:null};
  if(!lead){const o=deck.slice(12,12+1+(Math.random()*3|0));const c=parseCombo(o,R);if(c)S.tk={...c,ids:o}}
  const mv=legalPlays(hand,S,R);
  const hs=new Set(hand);
  for(const m of mv){if(m.some(x=>!hs.has(x))||new Set(m).size!==m.length)fail('legal bad ids');if(playError(m,S,R))fail('legal not legal')}
  // 완전성 검사: 단일/쌍 전수 비교
  if(S.tk&&S.tk.ty==='set'&&S.tk.n<=2){
    const all=[];const n=S.tk.n;
    if(n===1)hand.forEach(a=>all.push([a]));
    else for(let i=0;i<hand.length;i++)for(let j=i+1;j<hand.length;j++)all.push([hand[i],hand[j]]);
    const seen=new Set();const ok=all.filter(m=>{if(playError(m,S,R))return false;const k=m.map(x=>x>=100?100:x).sort((a,b)=>a-b).join();if(seen.has(k))return false;seen.add(k);return true}).length;
    const got=mv.length;
    // joker 쌍/조합 중복 없이 같은 수여야 함 (조커 2장은 서로 구분되므로 hand 조합과 일치)
    if(ok!==got)fail(`legal count ${got} vs brute ${ok} n=${n}`);
  }
}
// --- 봇 자동 대전 ---
function simulate(n,cfgO,lvs){
  Object.assign(cfg,cfgO);
  hostNew(false,'tst','t');
  H.members=[];
  for(let i=0;i<n;i++)H.members.push({name:'b'+i,bot:true,conn:null,host:i===0,lv:lvs[i%lvs.length]});
  let rounds=0,steps=0,total=0;
  for(let r=0;r<4;r++){
    hostStart();
    total=H.players.reduce((a,p)=>a+p.hand.length,0);
    const expect=52+H.cfg.jokers;
    if(total!==expect)fail(`deal total ${total} != ${expect}`);
    let guard=0;
    while(H.phase==='play'&&guard++<4000){
      const cur=H.players[H.turn];
      if(!cur||cur.finished||!cur.hand.length){fail('turn on inactive');break}
      const origPlay=doPlay;
      botTurn(H.turn);steps++;
    }
    if(H.phase!=='over'){fail(`stuck n=${n} cfg=${JSON.stringify(cfgO)} guard=${guard}`);return}
    const ranks=H.players.map(p=>p.rank).sort((a,b)=>a-b);
    if(!H.cfg.fast){const exp=Array.from({length:n},(_,i)=>i+1);if(JSON.stringify(ranks)!==JSON.stringify(exp))fail('ranks '+ranks)}
    rounds++;
  }
  return steps;
}
// doPlay 검증용 래퍼: 합법성 검사
const _doPlay=doPlay;
doPlay=function(i,ids){
  const err=playError(ids,stateH(),H.cfg);
  if(err)fail(`illegal play by bot: ${err} ${ids.map(cardStr)} tk=${H.tk&&H.tk.ids.map(cardStr)}`);
  const hs=new Set(H.players[i].hand);if(ids.some(x=>!hs.has(x)))fail('play card not in hand');
  return _doPlay(i,ids);
};
let sim=0;
for(let rep=0;rep<150;rep++){
  const n=2+(rep%7);
  const cf={fast:rep%5===0?1:0,jokers:rep%3,r8:rep%2,rev:(rep>>1)%2,run:(rep>>2)%2,lock:(rep>>1)%2,b11:(rep>>3)%2,swap:1,turn:30,max:8};
  sim+=simulate(n,cf,[0,1,2,1]);
}
console.log('bot steps',sim,'fails',fails);
process.exit(fails?1:0);
