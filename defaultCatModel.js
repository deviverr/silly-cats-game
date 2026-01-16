import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';

export function createDefaultCat(){
  const g = new THREE.Group();
  // stylized low-poly body
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2,1.4,1.2), new THREE.MeshStandardMaterial({color:0xffe0f0, flatShading:true}));
  body.position.set(0,1.05,0); g.add(body);
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.1,1.0,1.1), new THREE.MeshStandardMaterial({color:0xffe0f0, flatShading:true}));
  head.position.set(0,2.05,0.5); g.add(head);
  const leftEar = new THREE.Mesh(new THREE.ConeGeometry(0.18,0.5,4), new THREE.MeshStandardMaterial({color:0xffc0d8, flatShading:true}));
  leftEar.position.set(-0.35,2.6,0.3); leftEar.rotation.z = 0.25; g.add(leftEar);
  const rightEar = leftEar.clone(); rightEar.position.x = 0.35; rightEar.rotation.z = -0.25; g.add(rightEar);
  const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.12,0.12,0.02), new THREE.MeshStandardMaterial({color:0x111111})); leftEye.position.set(-0.2,2.05,1.0); g.add(leftEye);
  const rightEye = leftEye.clone(); rightEye.position.x = 0.2; g.add(rightEye);
  const tongue = new THREE.Mesh(new THREE.PlaneGeometry(0.28,0.32), new THREE.MeshStandardMaterial({color:0xff6a99, side:THREE.DoubleSide, flatShading:true}));
  tongue.position.set(0,1.85,1.05); tongue.rotation.x = -0.6; g.add(tongue);
  // tail
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.18,0.18,1.1), new THREE.MeshStandardMaterial({color:0xffe0f0, flatShading:true}));
  tail.position.set(1.3,1.25,-0.15); tail.rotation.z = -0.6; g.add(tail);
  g.userData.isDefaultModel = true;
  return g;
}
