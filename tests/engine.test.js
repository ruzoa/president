/* 대부호 엔진 테스트: index.html에서 규칙·엔진 코드만 잘라서 node로 돌립니다.
   실행: node tests/engine.test.js
   내용: 규칙 판정 단위 테스트 + 봇끼리 150가지 설정으로 자동 대전(멈춤·반칙·순위·카드 수 확인) */
const fs=require('fs'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const cut=(a,b)=>{const s=html.indexOf(a),e=html.indexOf(b,s);if(s<0||e<0)throw new Error('marker not found: '+a);return html.slice(s,e)};
const consts=cut('/* 카드 id:','const PEER_PREFIX=');
const engine=cut('let H=null, flushQueued=false, lastBeat=0;','function snapFor(you){').replace('setInterval(engineTick,100);','');
const pre=`
const clock=()=>Date.now();
const rand=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.random()*a.length|0];
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a}
const store=()=>null;
let mode='host',lastPanelHtml='';
const myNick=()=>'나';
const sfx=()=>{};
function flush(){flushQueued=false}
globalThis.queueMicrotask=()=>{};
`;
const body=fs.readFileSync(path.join(__dirname,'engine.cases.js'),'utf8');
new Function(pre+consts+engine+body)();
