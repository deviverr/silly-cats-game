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
  new THREE.MeshStandardMaterial({ color: 0xf6f3ff, side: THREE.DoubleSide })
);
ground.rotation.x = -Math.PI/2;
ground.receiveShadow = true;
scene.add(ground);
// collections and helpers
const cats = [];
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let score = 0;
const scoreSpan = document.getElementById('score');

// createCat: build a single cat group and add to scene
function createCat(x, z, color){
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8,1.2,1.6), lowMat(color));
  body.position.set(0,1.05,0);
  g.add(body);
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

// Movement & input
const keys = {};
window.addEventListener('keydown', (e)=>{ let k = e.key; if(k === ' ') k = 'space'; if(k === 'Spacebar') k = 'space'; try{ keys[k.toLowerCase()] = true; }catch(e){} });
window.addEventListener('keyup', (e)=>{ let k = e.key; if(k === ' ') k = 'space'; if(k === 'Spacebar') k = 'space'; try{ keys[k.toLowerCase()] = false; }catch(e){} });

function playMeow(){
  try{
    const ctx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 440;
    const g = ctx.createGain(); g.gain.value = 0.002;
    o.connect(g); g.connect(ctx.destination);
    g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    o.start(); o.stop(ctx.currentTime + 0.6);
  }catch(e){ }
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
  // mark local-control flag if this is our local saved name
  if(getLocalName() === username) target.userData.isLocal = true;
  const nameSprite = makeNameSprite(username);
  nameSprite.position.set(0, 2.8, 0);
  target.add(nameSprite);
  playersMap.set(username, {cat: target, nameSprite});
  return {cat: target, nameSprite};
}

// send immediate position update (used after local movement)
function sendPositionNow(){
  const name = getLocalName();
  const player = playersMap.get(name);
  if(player && player.cat){
    const c = player.cat;
    const payload = { type: 'pos', user: name, room: currentRoom, posX: c.position.x, posY: c.position.y, posZ: c.position.z, rotY: c.rotation.y, time: Date.now() };
    try{ if(ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload)); }catch(e){}
  }
}

// apply movement to the local player's cat using WASD / arrow keys
function applyLocalMovement(dt){
  const name = getLocalName();
  if(!name) return;
  const info = playersMap.get(name);
  if(!info || !info.cat) return;
  const cat = info.cat;
  const speed = 5.0; // units per second
  // ensure physics state
  if(!cat.userData.velocity) cat.userData.velocity = new THREE.Vector3(0,0,0);
  if(typeof cat.userData.onGround === 'undefined') cat.userData.onGround = true;
  const move = new THREE.Vector3();
  // derive forward from camera direction (flattened)
  const forward = new THREE.Vector3(); camera.getWorldDirection(forward); forward.y = 0; forward.normalize();
  const right = new THREE.Vector3(); right.crossVectors(forward, new THREE.Vector3(0,1,0)).normalize();
  if(keys['w'] || keys['arrowup']) move.add(forward);
  if(keys['s'] || keys['arrowdown']) move.sub(forward);
  if(keys['a'] || keys['arrowleft']) move.sub(right);
  if(keys['d'] || keys['arrowright']) move.add(right);
  if(move.lengthSq() > 0.0001){
    move.normalize();
    cat.position.addScaledVector(move, speed * dt);
    // rotate to face movement direction smoothly
    const yaw = Math.atan2(move.x, move.z);
    cat.rotation.y += (((yaw - cat.rotation.y + Math.PI) % (Math.PI*2)) - Math.PI) * Math.min(1, dt * 8);
    // keep within bounds
    cat.position.x = Math.max(-90, Math.min(90, cat.position.x));
    cat.position.z = Math.max(-90, Math.min(90, cat.position.z));
    // send immediate update (and rely on periodic updates too)
    sendPositionNow();
  }
  // Jump (space)
  if((keys['space']) && cat.userData.onGround){ cat.userData.velocity.y = 6.0; cat.userData.onGround = false; }
  // gravity
  const g = 20.0;
  cat.userData.velocity.y -= g * dt;
  cat.position.y += cat.userData.velocity.y * dt;
  if(cat.position.y <= 0){ cat.position.y = 0; cat.userData.velocity.y = 0; cat.userData.onGround = true; }
}

// allow wheel zoom when not in orbit mode (zoom camera towards/away from player)
renderer.domElement.addEventListener('wheel', (e)=>{
  try{
    if(cameraMode === 'orbit') return; // let OrbitControls handle
    const name = getLocalName(); if(!name) return;
    const info = playersMap.get(name); if(!info || !info.cat) return;
    e.preventDefault();
    // adjust cameraDistance instead of forcing camera.position so updateCamera keeps it
    const delta = e.deltaY * 0.03; // sensitivity
    cameraDistance = Math.max(1.2, Math.min(40, cameraDistance + delta));
  }catch(err){}
},{ passive: false });

// camera modes: 'third', 'first', 'orbit'
let cameraMode = 'third';
function setCameraMode(mode){ cameraMode = mode; const btn = document.getElementById('cameraModeBtn'); if(btn) btn.textContent = `Camera: ${mode=== 'third' ? '3rd' : mode==='first' ? '1st' : 'Orbit'}`; }
function cycleCameraMode(){ if(cameraMode==='third') setCameraMode('first'); else if(cameraMode==='first') setCameraMode('orbit'); else setCameraMode('third'); }

function updateCamera(){
  if(cameraMode === 'orbit'){
    controls.enabled = true; return;
  }
  controls.enabled = false;
  const name = getLocalName(); if(!name) return;
  const info = playersMap.get(name); if(!info || !info.cat) return;
  const cat = info.cat;
  if(cameraMode === 'third'){
    // behind and above, use cameraDistance (adjustable via wheel)
    const offset = new THREE.Vector3(0, 3.2, cameraDistance);
    offset.applyAxisAngle(new THREE.Vector3(0,1,0), cat.rotation.y);
    const camPos = new THREE.Vector3().copy(cat.position).add(offset);
    camera.position.lerp(camPos, 0.22);
    const target = new THREE.Vector3().copy(cat.position).add(new THREE.Vector3(0,1.6,0));
    camera.lookAt(target);
  } else if(cameraMode === 'first'){
    // position near cat head, cameraDistance controls forward offset
    const head = new THREE.Vector3(0,1.6,0);
    const worldHead = cat.localToWorld(head.clone());
    // desired head position plus a slight forward/back offset
    const forward = new THREE.Vector3(0,0,1).applyAxisAngle(new THREE.Vector3(0,1,0), cat.rotation.y).normalize();
    const camPos = new THREE.Vector3().copy(worldHead).add(forward.multiplyScalar(cameraDistance*0.2));
    camera.position.lerp(camPos, 0.6);
    const look = new THREE.Vector3().copy(cat.position).add(new THREE.Vector3(0,1.6,0)).add(forward.multiplyScalar(8));
    camera.lookAt(look);
  }
}

// dance party mode
let danceParty = false;
let danceStart = 0;
function toggleDanceParty(){
  danceParty = !danceParty;
  danceStart = performance.now();
  const el = document.getElementById('danceBtn'); if(el) el.textContent = danceParty ? 'End Dance' : 'Dance Party';
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
  const dt = clock.getDelta();
  // apply local movement (before interpolation)
  try{ applyLocalMovement(dt); }catch(e){ }
  for(const c of cats){
    const ud = c.userData;
    // bob for non-physics cats
    if(!ud.velocity){ c.position.y = Math.abs(Math.sin(t*2 + ud.bobPhase))*0.6; }
    // tiny head nod and body tilt
    c.rotation.y = Math.sin(t + ud.bobPhase)*0.12;
    // random silly spin every few seconds
    ud.spinTimer -= dt;
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

  // update NPC cat AI
  try{ updateCatsAI(dt); }catch(e){}

  // animate city indicator bob
  if(typeof cityIndicator !== 'undefined'){
    cityIndicator.position.y = origCityIndicatorY + Math.sin(t*2.2)*0.7;
    cityIndicator.rotation.y += 0.01;
  }

  // FPS update
  updateFps();
  // update confetti
  updateConfetti(dt);

  // dance party effects
  if(danceParty){
    const beat = Math.sin(t*6);
    for(const c of cats){ c.position.y = Math.abs(Math.sin(t*2 + c.userData.bobPhase))*0.9 + (beat>0?0.2:0); c.rotation.y += 0.02 * (beat>0?1:0); }
    // occasional emotes
    if(Math.random() < 0.01) spawnEmoteAbove(cats[Math.floor(Math.random()*cats.length)]);
  }

  // interpolate remote players smoothly
  try{
    const localName = getLocalName();
    for(const [name, info] of playersMap){
      if(!info || !info.cat) continue;
      if(name === localName) continue;
      if(info.targetPos){
        info.cat.position.lerp(info.targetPos, Math.min(1, dt * 8));
      }
      if(typeof info.targetRotY === 'number'){
        const a = info.targetRotY;
        let diff = a - info.cat.rotation.y;
        diff = ((diff + Math.PI) % (Math.PI*2)) - Math.PI;
        info.cat.rotation.y += diff * Math.min(1, dt * 8);
      }
    }
  }catch(e){ /* swallow interpolation errors */ }

  controls.update();
  // update camera based on mode
  try{ updateCamera(); }catch(e){}
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// --- Low-poly city + 3D indicator ---
const city = new THREE.Group();
const cityCenter = new THREE.Vector3(10,0,-6);
function createCity(){
  // make a fuller, larger city grid
  const gx = 14, gz = 10; const spacing = 3.2;
  for(let x=0;x<gx;x++){
    for(let z=0;z<gz;z++){
      // some variety: plazas and parks
      if(Math.random() < 0.08){
        const park = new THREE.Mesh(new THREE.BoxGeometry(2.5,0.1,2.5), lowMat(0xcfffd6));
        park.position.set(cityCenter.x + (x-(gx/2))*spacing, 0.05, cityCenter.z + (z-(gz/2))*spacing);
        city.add(park); continue;
      }
      const w = 1 + Math.random()*2;
      const d = 1 + Math.random()*2;
      const h = 1 + Math.random()*10;
      const col = 0xdedede + Math.floor(Math.random()*0x444444);
      const b = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), lowMat(col));
      b.position.set(cityCenter.x + (x-(gx/2))*spacing, h/2, cityCenter.z + (z-(gz/2))*spacing);
      city.add(b);
    }
  }
  // a larger central park
  const park = new THREE.Mesh(new THREE.BoxGeometry(10,0.1,8), lowMat(0xcfffd6));
  park.position.set(cityCenter.x, 0.05, cityCenter.z + (gz/2)*0.5);
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

// --- NPC cat AI: simple wandering for unowned cats ---
function updateCatsAI(dt){
  for(const c of cats){
    if(c.userData.owner) continue; // skip owned cats
    if(!c.userData.aiTarget || Math.random() < 0.005){
      // pick a random point within bounds
      c.userData.aiTarget = new THREE.Vector3((Math.random()-0.5)*80, 0, (Math.random()-0.5)*80);
    }
    const tgt = c.userData.aiTarget;
    const dir = new THREE.Vector3().subVectors(tgt, c.position);
    const dist = dir.length();
    if(dist > 0.4){ dir.normalize(); const sp = 0.6 + Math.random()*0.6; c.position.addScaledVector(dir, sp * dt * 10); // move
      // face toward movement
      const yaw = Math.atan2(dir.x, dir.z);
      c.rotation.y += (((yaw - c.rotation.y + Math.PI) % (Math.PI*2)) - Math.PI) * Math.min(1, dt * 2);
    } else {
      // reached, wait a bit
      if(Math.random() < 0.02) c.userData.aiTarget = null;
    }
  }
}

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
let posInterval = null;
let currentRoom = null;

function getLocalName(){ return localStorage.getItem('silly_name') || ''; }

function hasLocalName(){ const n = localStorage.getItem('silly_name'); return (typeof n === 'string' && n.trim().length > 0); }

function getRoomFromUrl(){ try{ const p = new URL(location.href); return p.searchParams.get('room'); }catch(e){ return null; } }
function setRoom(room){ currentRoom = room || null; const input = document.getElementById('roomInput'); if(input) input.value = room || ''; }
function createRoomId(){ return Math.random().toString(36).slice(2,8); }
function createRoom(){ const id = createRoomId(); setRoom(id); const u = new URL(location.href); u.searchParams.set('room', id); history.replaceState({}, '', u.toString()); postMessage('System', `Created room ${id}. Share the link to invite players.`); }
function joinRoomFromInput(){ const input = document.getElementById('roomInput'); if(!input) return; const id = input.value.trim(); if(!id) return postMessage('System','Enter a room id to join'); setRoom(id); const u = new URL(location.href); u.searchParams.set('room', id); history.replaceState({}, '', u.toString()); if(ws && ws.readyState === WebSocket.OPEN){ const name = getLocalName(); ws.send(JSON.stringify({ type:'join', user: name, room: currentRoom })); } }

function copyRoomLink(){
  if(!currentRoom){
    // create a room id first
    const id = createRoomId(); setRoom(id);
    const u = new URL(location.href); u.searchParams.set('room', id); history.replaceState({}, '', u.toString());
    postMessage('System', `Created room ${id}`);
    // if connected, notify server
    try{ if(ws && ws.readyState === WebSocket.OPEN){ const name = getLocalName(); ws.send(JSON.stringify({ type:'join', user: name, room: currentRoom })); startPositionUpdates(); } }catch(e){}
  }
  const u = new URL(location.href); u.searchParams.set('room', currentRoom); navigator.clipboard.writeText(u.toString()).then(()=> postMessage('System','Room link copied to clipboard'));
}

function startPositionUpdates(){
  if(posInterval) return;
  posInterval = setInterval(()=>{
    const name = getLocalName();
    const player = playersMap.get(name);
    if(player && player.cat && ws && ws.readyState === WebSocket.OPEN){
      const c = player.cat;
      const payload = { type: 'pos', user: name, room: currentRoom, posX: c.position.x, posY: c.position.y, posZ: c.position.z, rotY: c.rotation.y, time: Date.now() };
      try{ ws.send(JSON.stringify(payload)); }catch(e){}
    }
  }, 150);
}

function stopPositionUpdates(){ if(posInterval){ clearInterval(posInterval); posInterval = null; } }
function tryConnectWS(){
  try{
    const proto = (location.protocol === 'https:') ? 'wss' : 'ws';
    const url = `${proto}://${location.host}`; // server.js runs on same host:port when started with npm start
    ws = new WebSocket(url);
    ws.onopen = ()=>{ postMessage('System','Connected to chat server');
      // send join (include room if present) only if user has set a name
      const urlRoom = getRoomFromUrl(); if(urlRoom) setRoom(urlRoom);
      if(!hasLocalName()){
        postMessage('System','Please set a display name before joining the room.');
      } else {
        const name = getLocalName();
        ws.send(JSON.stringify({type:'join', user: name, room: currentRoom}));
        // start sending position updates for our player
        startPositionUpdates();
      }
    };
    ws.onmessage = (ev)=>{
      try{
        const payload = JSON.parse(ev.data);
        const type = payload && payload.type;
        if(type === 'history' && Array.isArray(payload.messages)){
          payload.messages.forEach(m=> postMessage(m.user || 'Anon', m.text || '', m.time));
          return;
        }
        if(type === 'members'){
          // payload: {type:'members', room, members: []}
          try{ renderPlayers(payload.members || []); (payload.members || []).forEach(n=> assignCatToPlayer(n)); }catch(e){}
          return;
        }
        if(type === 'host'){
          try{
            const hostEl = document.getElementById('hostName'); if(hostEl) hostEl.textContent = payload.user || '-';
            const startBtn = document.getElementById('startRoomBtn'); const local = getLocalName();
            if(startBtn) startBtn.disabled = (payload.user !== local);
            if(payload.user === local) postMessage('System','You are the host of this room');
          }catch(e){}
          return;
        }
        if(type === 'chat'){
          postMessage(payload.user || 'Anon', payload.text || '');
          return;
        }
            if(type === 'emote'){
              try{
                const who = payload.user;
                if(who){ if(!playersMap.has(who)) assignCatToPlayer(who); const info = playersMap.get(who); if(info && info.cat){ spawnEmoteAbove(info.cat, payload.emoteIndex); } }
              }catch(e){}
              return;
            }
        if(type === 'pos'){
          // update remote player's target position (do not snap)
          const localName = getLocalName();
          if(payload.user && payload.user !== localName){
            if(!playersMap.has(payload.user)) assignCatToPlayer(payload.user);
            const entry = playersMap.get(payload.user);
            if(entry && entry.cat){
              try{
                entry.targetPos = new THREE.Vector3(payload.posX, payload.posY, payload.posZ);
                entry.targetRotY = (typeof payload.rotY === 'number') ? payload.rotY : entry.cat.rotation.y;
                entry.lastUpdate = Date.now();
              }catch(e){}
            }
          }
          return;
        }
        if(type === 'start'){
          postMessage('System', 'Room has started — have fun!');
          // hide start modal if still visible
          try{ hideStartModal(); }catch(e){}
          return;
        }
        if(type === 'kicked'){
          const local = getLocalName();
          if(payload.user === local){ alert('You have been kicked from the room'); try{ ws.close(); }catch(e){} location.reload(); }
          else { postMessage('System', `${payload.user} was kicked by host`); }
          return;
        }
        if(type === 'kick_notice'){
          postMessage('System', `${payload.user} was kicked by ${payload.by}`);
          return;
        }
        if(type === 'leave'){
          postMessage('System', `${payload.user || 'Anon'} left`, payload.time || Date.now());
          if(payload.user && playersMap.has(payload.user)){
            const info = playersMap.get(payload.user);
            if(info && info.cat){ if(info.nameSprite && info.cat.children.includes(info.nameSprite)) info.cat.remove(info.nameSprite); info.cat.userData.owner = null; }
            playersMap.delete(payload.user);
          }
          return;
        }
        if(type === 'error'){
          postMessage('System', `Server: ${payload.message || 'error'}`);
          return;
        }
      } catch(e){ console.error(e); }
    };
    ws.onclose = ()=>{ postMessage('System','Disconnected from chat server'); ws = null; stopPositionUpdates(); };
  }catch(e){ console.warn('WS connect failed', e); ws = null; }
}

function sendChatMessage(text){
  const name = localStorage.getItem('silly_name') || 'Player';
  const payload = { type:'chat', user: name, text, room: currentRoom };
  if(ws && ws.readyState === WebSocket.OPEN){ ws.send(JSON.stringify(payload)); }
  else { postMessage(name, text); }
}

function sendEmote(index){
  const name = getLocalName();
  if(!name) return;
  // spawn locally
  const info = playersMap.get(name);
  if(info && info.cat) spawnEmoteAbove(info.cat, index);
  // send to server if connected
  const payload = { type:'emote', user: name, room: currentRoom, emoteIndex: index, time: Date.now() };
  try{ if(ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload)); }catch(e){}
}

// Do not auto-connect on load — wait for player to choose multiplayer in the Start menu
// tryConnectWS();

// wire room UI buttons
const createRoomBtn = document.getElementById('createRoomBtn');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const copyRoomBtn = document.getElementById('copyRoomBtn');
if(createRoomBtn) createRoomBtn.addEventListener('click', ()=> createRoom());
if(joinRoomBtn) joinRoomBtn.addEventListener('click', ()=> joinRoomFromInput());
if(copyRoomBtn) copyRoomBtn.addEventListener('click', ()=> copyRoomLink());

// Start Room button
const startRoomBtn = document.getElementById('startRoomBtn');
if(startRoomBtn) startRoomBtn.addEventListener('click', ()=>{
  if(!(startRoomBtn.disabled === false)) return postMessage('System','Only the host can start the room');
  if(!ws || ws.readyState !== WebSocket.OPEN) return postMessage('System','Not connected');
  ws.send(JSON.stringify({ type: 'start', room: currentRoom, user: getLocalName(), time: Date.now() }));
  postMessage('System','Start message sent');
});

// Kick UI
const kickInput = document.getElementById('kickInput');
const kickBtn = document.getElementById('kickBtn');
if(kickBtn) kickBtn.addEventListener('click', ()=>{
  const target = kickInput && kickInput.value && kickInput.value.trim();
  if(!target) return postMessage('System','Enter a username to kick');
  if(!ws || ws.readyState !== WebSocket.OPEN) return postMessage('System','Not connected');
  ws.send(JSON.stringify({ type: 'kick', room: currentRoom, user: getLocalName(), target }));
  postMessage('System', `Kick request sent for ${target}`);
});

// set initial room from URL if present
const initialRoom = getRoomFromUrl(); if(initialRoom) setRoom(initialRoom);

// Public rooms (lobby) UI
const lobbyBtn = document.getElementById('lobbyBtn');
const roomsPanel = document.getElementById('roomsPanel');
const roomsList = document.getElementById('roomsList');
const refreshRoomsBtn = document.getElementById('refreshRoomsBtn');

async function fetchRooms(){
  try{
    const resp = await fetch('/rooms');
    if(!resp.ok) throw new Error('Fetch failed');
    const data = await resp.json();
    if(!Array.isArray(data) || data.length===0){ roomsList.innerHTML = '<div>No active rooms</div>'; return; }
    roomsList.innerHTML = '';
    data.sort((a,b)=>b.count - a.count);
    for(const r of data){
      const el = document.createElement('div');
      el.style.display='flex'; el.style.justifyContent='space-between'; el.style.alignItems='center'; el.style.padding='6px 0';
      const title = document.createElement('div'); title.textContent = `${r.room} — ${r.count} player(s)`;
      const btn = document.createElement('button'); btn.textContent = 'Join'; btn.style.marginLeft='8px';
      btn.addEventListener('click', ()=>{ setRoom(r.room); const u = new URL(location.href); u.searchParams.set('room', r.room); history.replaceState({},'',u.toString()); if(ws && ws.readyState===WebSocket.OPEN){ ws.send(JSON.stringify({type:'join', user: getLocalName(), room: r.room})); } roomsPanel.style.display='none'; });
      el.appendChild(title); el.appendChild(btn); roomsList.appendChild(el);
    }
  }catch(e){ roomsList.innerHTML = '<div>Error fetching rooms</div>'; }
}

if(lobbyBtn) lobbyBtn.addEventListener('click', ()=>{ if(roomsPanel.style.display==='none'){ roomsPanel.style.display='block'; fetchRooms(); } else { roomsPanel.style.display='none'; } });
if(refreshRoomsBtn) refreshRoomsBtn.addEventListener('click', ()=> fetchRooms());

// players panel helpers
const playersList = document.getElementById('playersList');
const playersCount = document.getElementById('playersCount');
function renderPlayers(members){
  try{
    if(!playersList) return;
    playersList.innerHTML = '';
    if(!members || members.length===0){ playersList.innerHTML = '<div>No players</div>'; if(playersCount) playersCount.textContent = '0'; return; }
    for(const name of members){
      const el = document.createElement('div'); el.style.display='flex'; el.style.justifyContent='space-between'; el.style.alignItems='center'; el.style.padding='4px 0';
      const n = document.createElement('div'); n.textContent = name; n.style.cursor='pointer'; n.addEventListener('click', ()=>{ const k = document.getElementById('kickInput'); if(k) k.value = name; });
      el.appendChild(n);
      playersList.appendChild(el);
    }
    if(playersCount) playersCount.textContent = String(members.length);
  }catch(e){ console.warn('renderPlayers', e); }
}


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
// initialize name from localStorage or URL param `user`
const urlParams = (()=>{ try{ return new URL(location.href).searchParams; }catch(e){ return new URLSearchParams(window.location.search); } })();
const urlUser = urlParams.get('user');
if(urlUser && (!localStorage.getItem('silly_name') || localStorage.getItem('silly_name')!==urlUser)){
  localStorage.setItem('silly_name', urlUser);
}
usernameInput.value = localStorage.getItem('silly_name') || (urlUser || '');
saveNameBtn.addEventListener('click', ()=>{
  const v = (usernameInput.value || '').trim();
  if(!v){ alert('Enter a name before saving'); return; }
  localStorage.setItem('silly_name', v);
  postMessage('System', `Saved name: ${v}`);
  // if WS exists and is open, send a join now
  try{ if(ws && ws.readyState === WebSocket.OPEN){ ws.send(JSON.stringify({ type:'join', user: v, room: currentRoom })); startPositionUpdates(); } else { tryConnectWS(); } }catch(e){}
});
// also assign local player to a cat immediately (use URL user if present)
const initialName = localStorage.getItem('silly_name') || urlUser;
if(initialName) assignCatToPlayer(initialName);

// ESC toggles menu
window.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape'){
    const menu = document.getElementById('menuContent'); if(menu) menu.style.display = (menu.style.display === 'none' ? 'flex' : 'none');
  }
  if(e.key.toLowerCase() === 'c') cycleCameraMode();
});

// camera button
const cameraModeBtn = document.getElementById('cameraModeBtn'); if(cameraModeBtn){ cameraModeBtn.addEventListener('click', ()=> cycleCameraMode()); }

// Procedural 'cilly' music via WebAudio
let audioCtx = null; let isPlaying = false; let musicNodes = [];
let masterGain = null;
function startMusic(){
  if(audioCtx==null) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if(isPlaying) return; isPlaying=true;
  // create playful arpeggio using oscillators and noise percussive
  if(!masterGain){ masterGain = audioCtx.createGain(); masterGain.gain.value = 0.12; masterGain.connect(audioCtx.destination); }
  const master = masterGain;
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

// --- Start modal wiring (pre-game screen)
const startModalEl = document.getElementById('startModal');
const playBtn = document.getElementById('playBtn');
const optionsBtn = document.getElementById('optionsBtn');
const startName = document.getElementById('startName');
const startRoomInput = document.getElementById('startRoomInput');
const startVolume = document.getElementById('startVolume');

function hideStartModal(){ if(startModalEl) startModalEl.style.display = 'none'; }

function applyStartVolume(v){ try{ if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if(!masterGain) masterGain = audioCtx.createGain(); masterGain.gain.value = Number(v); masterGain.connect(audioCtx.destination); }catch(e){} }

if(startVolume){ startVolume.addEventListener('input', (e)=> applyStartVolume(e.target.value)); }

if(playBtn){ playBtn.addEventListener('click', ()=>{
  const name = (startName && startName.value && startName.value.trim()) ? startName.value.trim() : null;
  if(!name){ alert('Please enter a nickname to play.'); return; }
  localStorage.setItem('silly_name', name);
  // mode selection
  const modeEl = document.querySelector('input[name="mode"]:checked');
  const mode = modeEl ? modeEl.value : 'single';
  // room if provided
  const r = (startRoomInput && startRoomInput.value && startRoomInput.value.trim()) ? startRoomInput.value.trim() : null;
  if(mode === 'multi'){
    if(r) setRoom(r);
    tryConnectWS();
    // server join will be sent on ws.onopen
  } else {
    assignCatToPlayer(name);
  }
  if(startVolume) applyStartVolume(startVolume.value);
  hideStartModal();
}); }

if(optionsBtn){ optionsBtn.addEventListener('click', ()=>{ const s = document.getElementById('startOptions'); if(s) s.style.display = s.style.display === 'none' ? 'block' : 'none'; }); }

// new UI buttons: confetti, dance, snapshot
const sparkleBtn = document.getElementById('sparkleBtn');
const danceBtn = document.getElementById('danceBtn');
const snapshotBtn = document.getElementById('snapshotBtn');
if(sparkleBtn) sparkleBtn.addEventListener('click', ()=>{ confettiEnabled = !confettiEnabled; sparkleBtn.classList.toggle('button-silly'); if(confettiEnabled){ spawnConfettiBurst(camera.position.x, camera.position.z, 48); } });
if(danceBtn) danceBtn.addEventListener('click', ()=>{ toggleDanceParty(); });
if(snapshotBtn) snapshotBtn.addEventListener('click', ()=>{ snapshotPNG(); });

// Model loader UI
const modelInput = document.getElementById('modelInput');
const loadModelBtn = document.getElementById('loadModelBtn');
const useModelBtn = document.getElementById('useModelBtn');
if(loadModelBtn && modelInput){ loadModelBtn.addEventListener('click', ()=> modelInput.click()); modelInput.addEventListener('change', (ev)=>{
  const file = ev.target.files && ev.target.files[0];
  if(!file) return;
  const url = URL.createObjectURL(file);
  const loader = new GLTFLoader();
  loader.load(url, gltf=>{
    gltfCat = gltf;
    useUploadedModel = true;
    if(useModelBtn) useModelBtn.textContent = 'Using Uploaded Model';
    alert('Model loaded—new cats will use your model.');
  }, undefined, err=>{ console.error(err); alert('Failed to load model'); });
}); }
if(useModelBtn) useModelBtn.addEventListener('click', ()=>{ useUploadedModel = !useUploadedModel; useModelBtn.textContent = useUploadedModel? 'Using Uploaded Model' : 'Using Primitives'; });

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
    // mission progress
    try{ if(currentMission){ currentMission.progress++; updateMissionUI(); } }catch(e){}
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

// --- Missions (simple example) ---
let currentMission = null;
function startMission(id){
  if(id === 'find5'){
    currentMission = { id:'find5', title:'Find 5 cats', goal:5, progress:0, completed:false };
  }
  updateMissionUI();
}
function updateMissionUI(){
  const missionText = document.getElementById('missionText');
  const missionProgress = document.getElementById('missionProgress');
  if(!currentMission){ if(missionText) missionText.textContent = 'None'; if(missionProgress) missionProgress.textContent=''; return; }
  if(missionText) missionText.textContent = currentMission.title;
  if(missionProgress) missionProgress.textContent = `(${currentMission.progress}/${currentMission.goal})`;
  if(currentMission.progress >= currentMission.goal && !currentMission.completed){ currentMission.completed = true; postMessage('System','Mission completed!'); }
}
// auto-start a mission for demo
startMission('find5');

// Recording (WebM) via MediaRecorder
const recordBtn = document.getElementById('recordBtn');
const recordStatus = document.getElementById('recordStatus');
let recorder = null; let recordedChunks = [];
if(recordBtn){ recordBtn.addEventListener('click', ()=>{
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
}); }

// optional download button (guarded in case element exists)
const downloadProjectBtn = document.getElementById('downloadProjectBtn');
if(downloadProjectBtn){ downloadProjectBtn.addEventListener('click', async ()=>{
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
}); }

// fun little camera intro
let introT = 0; const introDur = 2.2;
(function intro(){ if(introT<introDur){ introT += 0.02; camera.position.lerp(new THREE.Vector3(0,8,18).multiplyScalar(1 - Math.sin(introT/introDur)*0.1),0.06); requestAnimationFrame(intro);} })();

// export for debugging in console
window.__SILLY = { scene, cats, startMusic, stopMusic };
