import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.152.2/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.152.2/examples/jsm/loaders/GLTFLoader.js';
import { createDefaultCat } from './defaultCatModel.js';

const canvas = document.getElementById('c');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xffffff, 0.02);
const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// low-poly material helper
function lowMat(hex){
  return new THREE.MeshStandardMaterial({ color: hex, flatShading: true, roughness: 0.7, metalness: 0 });
}

const camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 2000);
camera.position.set(0,8,18);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0,3,0);
controls.enableDamping = true;

window.addEventListener('resize',()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Lights
const hemi = new THREE.HemisphereLight(0xffffee, 0xaaaaee, 0.9);
scene.add(hemi);
const dir = new THREE.DirectionalLight(0xffffff, 0.7);
dir.position.set(5,10,2);
scene.add(dir);

// Ground (low-poly look)
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200,200),
  lowMat(0xf6f3ff)
);
ground.rotation.x = -Math.PI/2; ground.position.y = 0; scene.add(ground);

// Utility: create a cute, simple cat made from primitives
const cats = [];
let gltfCat = null;
let useUploadedModel = false;
let defaultModel = createDefaultCat();

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

// score + audio for clicks
let score = 0;
const scoreSpan = document.getElementById('score');

function playMeow(){
  if(!window.AudioContext && !window.webkitAudioContext) return;
  const ctx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  const now = ctx.currentTime;
  // two oscillators for a meow-like vowel
  const o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.setValueAtTime(350 + Math.random()*80, now);
  const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.setValueAtTime(220 + Math.random()*120, now);
  const gain = ctx.createGain(); gain.gain.setValueAtTime(0.001, now);
  const filter = ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.setValueAtTime(600, now);
  o1.connect(filter); o2.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
  // pitch sweep down like a meow
  o1.frequency.exponentialRampToValueAtTime(o1.frequency.value * 0.45, now+0.25);
  o2.frequency.exponentialRampToValueAtTime(o2.frequency.value * 0.6, now+0.28);
  gain.gain.exponentialRampToValueAtTime(0.18, now+0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now+0.7);
  o1.start(now); o2.start(now);
  o1.stop(now+0.8); o2.stop(now+0.8);
}
function createCat(x,z,color){
  const g = new THREE.Group();
  if(gltfCat && useUploadedModel){
    const cloned = gltfCat.scene ? gltfCat.scene.clone(true) : gltfCat.clone(true);
    cloned.traverse(node=>{ if(node.isMesh) node.castShadow = true; });
    cloned.scale.setScalar(1.8 + Math.random()*0.6);
    cloned.position.set(0,0.2,0);
    g.add(cloned);
  } else if(defaultModel){
    const cloned = defaultModel.clone(true);
    cloned.position.set(0,0,0);
    cloned.scale.setScalar(1.0 + Math.random()*0.25);
    g.add(cloned);
  } else {
    // body
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.6,1.6,1.4), lowMat(color));
    body.position.set(0,1.1,0);
    body.castShadow = true;
    g.add(body);
    // head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.9,8,8), lowMat(color));
    head.position.set(0,2.2,0.8);
    g.add(head);
    // ears
    const earMat = lowMat(0xffe4f0);
    const earGeom = new THREE.ConeGeometry(0.25,0.6,6);
    const leftEar = new THREE.Mesh(earGeom, earMat); leftEar.position.set(-0.45,2.8,0.6); leftEar.rotation.z = 0.25; g.add(leftEar);
    const rightEar = new THREE.Mesh(earGeom, earMat); rightEar.position.set(0.45,2.8,0.6); rightEar.rotation.z = -0.25; g.add(rightEar);
    // eyes
    const eyeMat = lowMat(0x111111);
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.12,6,6), eyeMat); leftEye.position.set(-0.28,2.15,1.35); g.add(leftEye);
    const rightEye = leftEye.clone(); rightEye.position.x = 0.28; g.add(rightEye);
    // tongue (silly)
    const tongue = new THREE.Mesh(new THREE.PlaneGeometry(0.3,0.35), new THREE.MeshStandardMaterial({color:0xff87b6, side: THREE.DoubleSide, flatShading:true}));
    tongue.position.set(0,1.9,1.6); tongue.rotation.x = -0.6; g.add(tongue);
  }
  // store animations
  g.userData = { bobPhase: Math.random()*Math.PI*2, spinTimer: Math.random()*4, tongueDown:true };
  g.position.set(x,0,z);
  scene.add(g);
  cats.push(g);
}

// spawn a bunch
const palette = [0xffccf2, 0xffe9b3, 0xcfefff, 0xe7ffd6, 0xffdfd6];
for(let i=0;i<5;i++){
  const x = (Math.random()-0.5)*12;
  const z = (Math.random()-0.5)*12;
  createCat(x,z, palette[i % palette.length]);
}

// Add playful particle-ish orbs floating around
const orbs = new THREE.Group();
for(let i=0;i<12;i++){
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.18,6,4), new THREE.MeshStandardMaterial({color:0xffffff, transparent:true, opacity:0.9, flatShading:true}));
  m.position.set((Math.random()-0.5)*18, 2 + Math.random()*3, (Math.random()-0.5)*18);
  orbs.add(m);
}
scene.add(orbs);

// --- Silliness features: confetti, emotes, dance party ---
const confetti = [];
let confettiEnabled = false;
function spawnConfettiBurst(x=0,z=0,count=36){
  for(let i=0;i<count;i++){
    const geom = new THREE.PlaneGeometry(0.18,0.12);
    const mat = new THREE.MeshStandardMaterial({color: Math.random()*0xffffff, side:THREE.DoubleSide});
    const p = new THREE.Mesh(geom, mat);
    p.position.set(x + (Math.random()-0.5)*2, 4 + Math.random()*2, z + (Math.random()-0.5)*2);
    p.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
    p.userData.vel = new THREE.Vector3((Math.random()-0.5)*3, -1 - Math.random()*2, (Math.random()-0.5)*3);
    p.userData.spin = new THREE.Vector3(Math.random()*3, Math.random()*3, Math.random()*3);
    scene.add(p); confetti.push(p);
  }
}

function updateConfetti(dt){
  for(let i=confetti.length-1;i>=0;i--){
    const p = confetti[i];
    p.userData.vel.y -= 3 * dt; // gravity
    p.position.addScaledVector(p.userData.vel, dt);
    p.rotation.x += p.userData.spin.x * dt;
    p.rotation.y += p.userData.spin.y * dt;
    if(p.position.y < 0){ scene.remove(p); confetti.splice(i,1); }
  }
}

// emote sprites above cats
const emoteTextures = [];
function makeEmoteTexture(text){
  const size = 128; const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(255,255,255,0)'; ctx.fillRect(0,0,size,size);
  ctx.font = '64px Luckiest Guy, Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillStyle = '#111'; ctx.fillText(text, size/2, size/2+8);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true; return tex;
}
[':3','^_^','uwu','meow',':D','!'].forEach(t=> emoteTextures.push(makeEmoteTexture(t)));

function spawnEmoteAbove(cat, textureIndex=null, duration=1600){
  const tex = emoteTextures[textureIndex ?? Math.floor(Math.random()*emoteTextures.length)];
  const mat = new THREE.SpriteMaterial({map:tex, depthTest:true});
  const spr = new THREE.Sprite(mat);
  spr.scale.set(1.4,1.4,1);
  spr.position.set(cat.position.x, cat.position.y + 3.2, cat.position.z);
  spr.userData.start = performance.now(); spr.userData.dur = duration;
  scene.add(spr);
  // remove later
  setTimeout(()=>{ scene.remove(spr); }, duration+200);
}

function makeNameSprite(name){
  const size = 256; const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = 64;
  const ctx = canvas.getContext('2d'); ctx.clearRect(0,0,size,64);
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(0,0,size,64);
  ctx.font = '28px Luckiest Guy, Arial'; ctx.fillStyle = '#222'; ctx.textBaseline='middle'; ctx.textAlign='center';
  ctx.fillText(name, size/2, 32);
  const tex = new THREE.CanvasTexture(canvas); tex.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({map:tex, depthTest:true});
  const spr = new THREE.Sprite(mat); spr.scale.set(2.2,0.6,1);
  return spr;
}

function assignCatToPlayer(username){
  if(!username) return;
  if(playersMap.has(username)) return playersMap.get(username);
  // find a cat without owner
  let target = cats.find(c=>!c.userData.owner);
  if(!target){ // create a new one
    const x=(Math.random()-0.5)*12; const z=(Math.random()-0.5)*12; createCat(x,z,palette[Math.floor(Math.random()*palette.length)]);
    target = cats[cats.length-1];
  }
  target.userData.owner = username;
  const nameSprite = makeNameSprite(username);
  nameSprite.position.set(0, 2.8, 0);
  target.add(nameSprite);
  playersMap.set(username, {cat: target, nameSprite});
  return {cat: target, nameSprite};
}

// dance party mode
let danceParty = false;
let danceStart = 0;
function toggleDanceParty(){
  danceParty = !danceParty;
  danceStart = performance.now();
  const el = document.getElementById('danceBtn'); el.textContent = danceParty ? 'End Dance' : 'Dance Party';
  const note = danceParty ? 'Dance party! Cats go bouncy~' : 'Dance party ended.';
  const splash = document.createElement('div'); splash.className='splash-note'; splash.textContent = note; document.body.appendChild(splash);
  setTimeout(()=>splash.remove(), 1400);
}

// snapshot
function snapshotPNG(){
  const link = document.createElement('a'); link.download = 'silly-cats-snapshot.png';
  renderer.domElement.toBlob(blob=>{ const url = URL.createObjectURL(blob); link.href = url; link.click(); URL.revokeObjectURL(url); }, 'image/png');
}


// Animation loop
const clock = new THREE.Clock();
function animate(){
  const t = clock.getElapsedTime();
  for(const c of cats){
    const ud = c.userData;
    // bob
    c.position.y = Math.abs(Math.sin(t*2 + ud.bobPhase))*0.6;
    // tiny head nod and body tilt
    c.rotation.y = Math.sin(t + ud.bobPhase)*0.12;
    // random silly spin every few seconds
    ud.spinTimer -= clock.getDelta();
    if(ud.spinTimer <= 0){
      ud.spinTimer = 2 + Math.random()*6;
      // schedule a short spin
      const spinDur = 0.6 + Math.random()*0.6;
      const start = t;
      const from = c.rotation.y;
      const to = c.rotation.y + (Math.random()>0.5?Math.PI*2:-Math.PI*2);
      let elapsed = 0;
      const spin = (dt)=>{
        elapsed += dt;
        const p = Math.min(1, elapsed / spinDur);
        c.rotation.y = from + (to-from)*( -Math.cos(p*Math.PI)/2 + 0.5 );
        if(p<1) requestAnimationFrame(()=>spin(clock.getDelta()));
      };
      requestAnimationFrame(()=>spin(0));
    }
    // tongue waggle: toggle every second-ish
    ud.tongueDown = Math.sin(t*3 + ud.bobPhase) > 0.2;
    const tongue = c.children.find(ch=>ch.geometry && ch.geometry.type === 'PlaneGeometry');
    if(tongue) tongue.visible = ud.tongueDown;
  }

  // orbs float
  let i=0; for(const orb of orbs.children){ orb.position.y = 2 + Math.sin(t*1.2 + i)*0.6; i++; }

  // animate city indicator bob
  if(typeof cityIndicator !== 'undefined'){
    cityIndicator.position.y = origCityIndicatorY + Math.sin(t*2.2)*0.7;
    cityIndicator.rotation.y += 0.01;
  }

  // FPS update
  updateFps();
  // update confetti
  updateConfetti(clock.getDelta());

  // dance party effects
  if(danceParty){
    const beat = Math.sin(t*6);
    for(const c of cats){ c.position.y = Math.abs(Math.sin(t*2 + c.userData.bobPhase))*0.9 + (beat>0?0.2:0); c.rotation.y += 0.02 * (beat>0?1:0); }
    // occasional emotes
    if(Math.random() < 0.01) spawnEmoteAbove(cats[Math.floor(Math.random()*cats.length)]);
  }

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// --- Low-poly city + 3D indicator ---
const city = new THREE.Group();
const cityCenter = new THREE.Vector3(10,0,-6);
function createCity(){
  for(let x=0;x<6;x++){
    for(let z=0;z<4;z++){
      const w = 1 + Math.random()*2;
      const d = 1 + Math.random()*2;
      const h = 1 + Math.random()*8;
      const b = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), lowMat(0xdedede + Math.floor(Math.random()*0x333333)));
      b.position.set(cityCenter.x + (x-2.5)*3, h/2, cityCenter.z + (z-1.5)*3);
      city.add(b);
    }
  }
  const park = new THREE.Mesh(new THREE.BoxGeometry(6,0.1,6), lowMat(0xcfffd6));
  park.position.set(cityCenter.x, 0.05, cityCenter.z + 8);
  city.add(park);
  scene.add(city);
}
createCity();

const cityIndicator = new THREE.Mesh(new THREE.ConeGeometry(0.4,1.2,6), lowMat(0xff77aa));
cityIndicator.position.set(cityCenter.x, 6, cityCenter.z);
cityIndicator.rotation.x = Math.PI;
scene.add(cityIndicator);

// animate indicator in main loop
const origCityIndicatorY = cityIndicator.position.y;

// camera travel to city
function gotoCity(){
  const fromPos = camera.position.clone();
  const toPos = new THREE.Vector3(cityCenter.x, 8, cityCenter.z + 12);
  const fromTarget = controls.target.clone();
  const toTarget = cityCenter.clone();
  const dur = 1000; const start = performance.now();
  (function step(now){
    const p = Math.min(1,(now-start)/dur);
    camera.position.lerpVectors(fromPos,toPos, p);
    controls.target.lerpVectors(fromTarget,toTarget, p);
    controls.update();
    if(p<1) requestAnimationFrame(step);
  })(start);
}

// --- FPS counter ---
const fpsEl = document.getElementById('fpsVal');
let frames = 0; let lastFpsTime = performance.now();
function updateFps(){
  frames++;
  const now = performance.now();
  if(now - lastFpsTime >= 500){
    const fps = Math.round((frames * 1000) / (now - lastFpsTime));
    if(fpsEl) fpsEl.textContent = String(fps);
    frames = 0; lastFpsTime = now;
  }
}

// show small tip when confetti toggled
const splash = document.createElement('div'); splash.className='splash-note'; splash.style.display='none'; document.body.appendChild(splash);

// --- Chat (local) ---
const chatEl = document.getElementById('chat');
const messagesEl = document.getElementById('messages');
const chatInput = document.getElementById('chatInput');
const sendChat = document.getElementById('sendChat');
function postMessage(sender, text){
  const d = document.createElement('div');
  const time = (arguments.length>2 && arguments[2]) ? new Date(arguments[2]) : new Date();
  const hh = String(time.getHours()).padStart(2,'0');
  const mm = String(time.getMinutes()).padStart(2,'0');
  d.textContent = `[${hh}:${mm}] ${sender}: ${text}`;
  messagesEl.appendChild(d); messagesEl.scrollTop = messagesEl.scrollHeight;
}
sendChat.addEventListener('click', ()=>{ if(!chatInput.value) return; const text = chatInput.value; sendChatMessage(text); chatInput.value=''; });

// WebSocket integration (connect if server provides ws)
let ws = null;
const playersMap = new Map(); // username -> {cat, nameSprite}
function tryConnectWS(){
  try{
    const proto = (location.protocol === 'https:') ? 'wss' : 'ws';
    const url = `${proto}://${location.host}`; // server.js runs on same host:port when started with npm start
    ws = new WebSocket(url);
    ws.onopen = ()=>{ postMessage('System','Connected to chat server');
      // send join
      const name = localStorage.getItem('silly_name') || 'Player';
      ws.send(JSON.stringify({type:'join', user: name}));
    };
    ws.onmessage = (ev)=>{
      try{
        const payload = JSON.parse(ev.data);
        if(payload.type === 'history' && Array.isArray(payload.messages)){
          payload.messages.forEach(m=> postMessage(m.user || 'Anon', m.text || '', m.time));
        } else if(payload.type === 'chat'){
          postMessage(payload.user || 'Anon', payload.text || '', payload.time);
          // reaction: play boop and confetti for other players
          if(payload.user !== (localStorage.getItem('silly_name')||'Player')){
            playBoop();
            if(Math.random()>0.3) spawnConfettiBurst(payload.posX||camera.position.x, payload.posZ||camera.position.z, 20);
          }
        } else if(payload.type === 'join'){
          postMessage('System', `${payload.user || 'Anon'} joined`, payload.time || Date.now());
          // assign a cat to this player (if not existing)
          assignCatToPlayer(payload.user || 'Anon');
        }
      } catch(e){ console.error(e); }
    };
    ws.onclose = ()=>{ postMessage('System','Disconnected from chat server'); ws = null; };
  }catch(e){ console.warn('WS connect failed', e); ws = null; }
}

function sendChatMessage(text){
  const name = localStorage.getItem('silly_name') || 'Player';
  const payload = { type:'chat', user: name, text };
  if(ws && ws.readyState === WebSocket.OPEN){ ws.send(JSON.stringify(payload)); }
  else { postMessage(name, text); }
}

// Try to connect on load
tryConnectWS();

// small boop sound
function playBoop(){
  if(!window.AudioContext && !window.webkitAudioContext) return;
  const ctx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  const now = ctx.currentTime;
  const o = ctx.createOscillator(); o.type='square'; o.frequency.setValueAtTime(800, now);
  const g = ctx.createGain(); g.gain.setValueAtTime(0.001, now);
  o.connect(g); g.connect(ctx.destination);
  g.gain.exponentialRampToValueAtTime(0.07, now+0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now+0.18);
  o.start(now); o.stop(now+0.2);
}

// menu buttons
const goCityBtn = document.getElementById('goCityBtn');
const toggleChatBtn = document.getElementById('toggleChatBtn');
const startServerBtn = document.getElementById('startServerBtn');
const menuToggle = document.getElementById('menuToggle');
const menuContent = document.getElementById('menuContent');
menuToggle.addEventListener('click', ()=>{ menuContent.style.display = menuContent.style.display === 'none' ? 'flex' : 'none'; });
goCityBtn.addEventListener('click', ()=> gotoCity());
toggleChatBtn.addEventListener('click', ()=>{ if(!chatEl) return; chatEl.classList.toggle('hidden'); });
startServerBtn.addEventListener('click', ()=>{ alert('To start the server locally: run start-server.ps1 (PowerShell) or `npm install` then `npm start` if you prefer Node.'); });

// username input
const usernameInput = document.getElementById('usernameInput');
const saveNameBtn = document.getElementById('saveNameBtn');
usernameInput.value = localStorage.getItem('silly_name') || '';
saveNameBtn.addEventListener('click', ()=>{ localStorage.setItem('silly_name', usernameInput.value || 'Player'); alert('Saved name'); tryConnectWS(); });
// also assign local player to a cat immediately
if(localStorage.getItem('silly_name')) assignCatToPlayer(localStorage.getItem('silly_name'));

// Procedural 'cilly' music via WebAudio
let audioCtx = null; let isPlaying = false; let musicNodes = [];
function startMusic(){
  if(audioCtx==null) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if(isPlaying) return; isPlaying=true;
  // create playful arpeggio using oscillators and noise percussive
  const master = audioCtx.createGain(); master.gain.value = 0.12; master.connect(audioCtx.destination);
  const baseNotes = [440, 523.25, 659.25, 880];
  let beat = 0;
  const playStep = ()=>{
    if(!isPlaying) return;
    const now = audioCtx.currentTime;
    const note = baseNotes[Math.floor(Math.random()*baseNotes.length)] * (Math.random()>0.7?2:1);
    const osc = audioCtx.createOscillator(); osc.type = Math.random()>0.6? 'sawtooth':'triangle'; osc.frequency.setValueAtTime(note * (0.5 + Math.random()*1.5), now);
    const env = audioCtx.createGain(); env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(1, now+0.03);
    env.gain.exponentialRampToValueAtTime(0.001, now+0.5 + Math.random()*0.6);
    osc.connect(env); env.connect(master);
    osc.start(now); osc.stop(now+1.5);
    musicNodes.push(osc);
    // light percussive pop
    if(Math.random()>0.4){
      const pop = audioCtx.createOscillator(); pop.type='square'; pop.frequency.setValueAtTime(100 + Math.random()*800, now);
      const pg = audioCtx.createGain(); pg.gain.setValueAtTime(0.01, now);
      pg.gain.exponentialRampToValueAtTime(0.0001, now+0.12);
      pop.connect(pg); pg.connect(master);
      pop.start(now); pop.stop(now+0.13);
      musicNodes.push(pop);
    }
    beat++;
    setTimeout(playStep, 230 + Math.random()*250);
  };
  playStep();
}
function stopMusic(){ isPlaying=false; musicNodes=[]; }

// UI hooks
const musicToggle = document.getElementById('musicToggle');
musicToggle.addEventListener('click', async ()=>{
  if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if(!isPlaying){ await audioCtx.resume(); startMusic(); musicToggle.textContent = 'Stop Cilly Music'; }
  else { stopMusic(); musicToggle.textContent = 'Toggle Cilly Music'; }
});

const moreCats = document.getElementById('moreCats');
moreCats.addEventListener('click', ()=>{ const x=(Math.random()-0.5)*12; const z=(Math.random()-0.5)*12; createCat(x,z,palette[Math.floor(Math.random()*palette.length)]); });

// new UI buttons: confetti, dance, snapshot
const sparkleBtn = document.getElementById('sparkleBtn');
const danceBtn = document.getElementById('danceBtn');
const snapshotBtn = document.getElementById('snapshotBtn');
sparkleBtn.addEventListener('click', ()=>{ confettiEnabled = !confettiEnabled; sparkleBtn.classList.toggle('button-silly'); if(confettiEnabled){ spawnConfettiBurst(camera.position.x, camera.position.z, 48); } });
danceBtn.addEventListener('click', ()=>{ toggleDanceParty(); });
snapshotBtn.addEventListener('click', ()=>{ snapshotPNG(); });

// Model loader UI
const modelInput = document.getElementById('modelInput');
const loadModelBtn = document.getElementById('loadModelBtn');
const useModelBtn = document.getElementById('useModelBtn');
loadModelBtn.addEventListener('click', ()=> modelInput.click());
modelInput.addEventListener('change', (ev)=>{
  const file = ev.target.files && ev.target.files[0];
  if(!file) return;
  const url = URL.createObjectURL(file);
  const loader = new GLTFLoader();
  loader.load(url, gltf=>{
    gltfCat = gltf;
    useUploadedModel = true;
    useModelBtn.textContent = 'Using Uploaded Model';
    alert('Model loaded—new cats will use your model.');
  }, undefined, err=>{ console.error(err); alert('Failed to load model'); });
});
useModelBtn.addEventListener('click', ()=>{ useUploadedModel = !useUploadedModel; useModelBtn.textContent = useUploadedModel? 'Using Uploaded Model' : 'Using Primitives'; });

// Click interactions: select cat, increment score, play meow and bounce
renderer.domElement.addEventListener('pointerdown', (e)=>{
  pointer.x = ( e.clientX / window.innerWidth ) * 2 - 1;
  pointer.y = - ( e.clientY / window.innerHeight ) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  let hit = null; let minDist = Infinity;
  for(const g of cats){
    const intersects = raycaster.intersectObjects(g.children, true);
    if(intersects.length){
      const d = intersects[0].distance;
      if(d < minDist){ minDist = d; hit = g; }
    }
  }
  if(hit){
    score += 1;
    scoreSpan.textContent = String(score);
    playMeow();
    // quick bounce animation
    const orig = hit.scale.clone();
    const start = performance.now();
    const dur = 300;
    (function bounce(now){
      const p = Math.min(1,(now - start)/dur);
      const s = 1 + Math.sin(p*Math.PI)*0.25;
      hit.scale.set(orig.x * s, orig.y * s, orig.z * s);
      if(p<1) requestAnimationFrame(bounce);
      else hit.scale.copy(orig);
    })(start);
  }
});

// Recording (WebM) via MediaRecorder
const recordBtn = document.getElementById('recordBtn');
const recordStatus = document.getElementById('recordStatus');
let recorder = null; let recordedChunks = [];
recordBtn.addEventListener('click', ()=>{
  if(!recorder){
    const stream = canvas.captureStream(60);
    recorder = new MediaRecorder(stream, {mimeType:'video/webm;codecs=vp9'});
    recordedChunks = [];
    recorder.ondataavailable = e=>{ if(e.data.size) recordedChunks.push(e.data); };
    recorder.onstop = ()=>{
      const blob = new Blob(recordedChunks, {type:'video/webm'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'silly-cats.webm'; a.click();
      URL.revokeObjectURL(url);
      recorder = null; recordBtn.textContent = 'Start Recording'; recordStatus.textContent = 'Saved recording';
    };
    recorder.start(); recordBtn.textContent = 'Stop Recording'; recordStatus.textContent = 'Recording...';
  } else {
    recorder.stop();
  }
});

// Download project zip using JSZip
const downloadProjectBtn = document.getElementById('downloadProjectBtn');
downloadProjectBtn.addEventListener('click', async ()=>{
  if(!window.JSZip){
    recordStatus.textContent = 'Loading zipper...';
    await new Promise((res,rej)=>{ const s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'; s.onload=res; s.onerror=rej; document.head.appendChild(s); });
  }
  recordStatus.textContent = 'Fetching files...';
  const files = ['index.html','main.js','style.css','README.md'];
  const zip = new JSZip();
  await Promise.all(files.map(async (f)=>{ try{ const r = await fetch(f); const txt = await r.text(); zip.file(f, txt); } catch(e){ console.warn('fetch failed',f,e); } }));
  recordStatus.textContent = 'Creating zip...';
  const blob = await zip.generateAsync({type:'blob'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'silly-cats-game.zip'; a.click(); URL.revokeObjectURL(url);
  recordStatus.textContent = 'Download ready';
});

// fun little camera intro
let introT = 0; const introDur = 2.2;
(function intro(){ if(introT<introDur){ introT += 0.02; camera.position.lerp(new THREE.Vector3(0,8,18).multiplyScalar(1 - Math.sin(introT/introDur)*0.1),0.06); requestAnimationFrame(intro);} })();

// export for debugging in console
window.__SILLY = { scene, cats, startMusic, stopMusic };
