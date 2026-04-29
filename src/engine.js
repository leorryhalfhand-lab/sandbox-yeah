// engine.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164/build/three.module.js';

import { setupInput, input } from './input.js';
import { Player } from './player.js';
import { World } from './world.js';
import { BLOCKS, loadBlockTextures } from './blocks.js';
import { raycastBlock } from './raycast.js';

export async function startEngine() {

  // -----------------------------
  // Renderer
  // -----------------------------
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // -----------------------------
  // Camera
  // -----------------------------
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    500
  );

  // -----------------------------
  // Scene
  // -----------------------------
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  // -----------------------------
  // Lighting
  // -----------------------------
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(1, 1, 0.5);
  scene.add(light);

  // -----------------------------
  // Load block textures
  // -----------------------------
  await loadBlockTextures();

  // -----------------------------
  // Input + Player
  // -----------------------------
  setupInput(renderer.domElement);
  const player = new Player(camera);

  // -----------------------------
  // World
  // -----------------------------
  const world = new World(scene);

  // -----------------------------
  // Hotbar
  // -----------------------------
  let selectedBlock = 'grass';

  document.querySelectorAll('.slot').forEach(slot => {
    slot.addEventListener('click', () => {
      document.querySelectorAll('.slot').forEach(s => s.classList.remove('selected'));
      slot.classList.add('selected');
      selectedBlock = slot.dataset.block;
    });
  });

  // Number keys
  window.addEventListener('keydown', e => {
    const n = parseInt(e.key);
    if (n >= 1 && n <= 4) {
      const slots = document.querySelectorAll('.slot');
      slots.forEach(s => s.classList.remove('selected'));
      slots[n - 1].classList.add('selected');
      selectedBlock = slots[n - 1].dataset.block;
    }
  });

  // -----------------------------
  // Mouse actions
  // -----------------------------
  window.addEventListener('mousedown', e => {
    if (!document.pointerLockElement) return;

    const hit = raycastBlock(camera, world);

    if (!hit) return;

    if (e.button === 0) {
      // Break block
      world.setBlock(hit.x, hit.y, hit.z, 'air');
    }

    if (e.button === 2) {
      // Place block on the face hit
      const nx = hit.x + hit.normal.x;
      const ny = hit.y + hit.normal.y;
      const nz = hit.z + hit.normal.z;

      world.setBlock(nx, ny, nz, selectedBlock);
    }
  });

  // -----------------------------
  // Resize
  // -----------------------------
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  // -----------------------------
  // Game Loop
  // -----------------------------
  function loop() {
    requestAnimationFrame(loop);

    player.update(input, world);
    renderer.render(scene, camera);
  }

  loop();
}
