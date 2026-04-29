// raycast.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164/build/three.module.js';
import { BLOCKS } from './blocks.js';

const MAX_DISTANCE = 8; // how far the player can reach

export function raycastBlock(camera, world) {
  const origin = camera.position.clone();
  const direction = new THREE.Vector3(0, 0, -1)
    .applyQuaternion(camera.quaternion)
    .normalize();

  let pos = origin.clone();

  const step = 0.1;

  for (let d = 0; d < MAX_DISTANCE / step; d++) {
    pos.addScaledVector(direction, step);

    const bx = Math.floor(pos.x);
    const by = Math.floor(pos.y);
    const bz = Math.floor(pos.z);

    const blockID = world.getBlockGlobal(bx, by, bz);
    const blockKey = world.blockKey(blockID);

    if (blockKey !== 'air' && BLOCKS[blockKey].solid) {
      // Compute hit normal
      const prev = pos.clone().subScaledVector(direction, step);
      const px = Math.floor(prev.x);
      const py = Math.floor(prev.y);
      const pz = Math.floor(prev.z);

      const normal = new THREE.Vector3(
        bx - px,
        by - py,
        bz - pz
      );

      return {
        x: bx,
        y: by,
        z: bz,
        normal
      };
    }
  }

  return null;
}
