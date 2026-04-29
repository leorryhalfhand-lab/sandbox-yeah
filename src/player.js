// player.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164/build/three.module.js';

export class Player {
  constructor(camera) {
    this.camera = camera;

    // Player position
    this.pos = new THREE.Vector3(0, 40, 0);

    // Velocity
    this.vel = new THREE.Vector3(0, 0, 0);

    // Camera rotation
    this.pitch = 0;
    this.yaw = 0;

    // Constants
    this.speed = 0.08;
    this.jumpForce = 0.22;
    this.gravity = 0.01;

    // Player height
    this.eyeHeight = 1.7;

    // Collision box
    this.width = 0.4;
    this.height = 1.8;
  }

  update(input, world) {

    // -----------------------------
    // Mouse look
    // -----------------------------
    this.yaw -= input.mouseDX * 0.002;
    this.pitch -= input.mouseDY * 0.002;

    this.pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.pitch));

    input.mouseDX = 0;
    input.mouseDY = 0;

    this.camera.rotation.set(this.pitch, this.yaw, 0);

    // -----------------------------
    // Movement direction
    // -----------------------------
    const forward = new THREE.Vector3(
      Math.sin(this.yaw),
      0,
      Math.cos(this.yaw)
    );

    const right = new THREE.Vector3(
      Math.cos(this.yaw),
      0,
      -Math.sin(this.yaw)
    );

    let move = new THREE.Vector3();

    if (input.forward) move.add(forward);
    if (input.back) move.sub(forward);
    if (input.left) move.sub(right);
    if (input.right) move.add(right);

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(this.speed);
      this.vel.x = move.x;
      this.vel.z = move.z;
    } else {
      this.vel.x = 0;
      this.vel.z = 0;
    }

    // -----------------------------
    // Gravity
    // -----------------------------
    this.vel.y -= this.gravity;

    // -----------------------------
    // Jump
    // -----------------------------
    if (input.jump && this.onGround(world)) {
      this.vel.y = this.jumpForce;
    }

    // -----------------------------
    // Apply velocity
    // -----------------------------
    this.pos.add(this.vel);

    // -----------------------------
    // Collision
    // -----------------------------
    this.resolveCollisions(world);

    // -----------------------------
    // Update camera position
    // -----------------------------
    this.camera.position.set(
      this.pos.x,
      this.pos.y + this.eyeHeight,
      this.pos.z
    );
  }

  // -----------------------------------
  // Collision detection helpers
  // -----------------------------------
  onGround(world) {
    const footY = Math.floor(this.pos.y - 0.1);
    return world.isSolid(
      Math.floor(this.pos.x),
      footY,
      Math.floor(this.pos.z)
    );
  }

  resolveCollisions(world) {
    const px = this.pos.x;
    const py = this.pos.y;
    const pz = this.pos.z;

    const minX = Math.floor(px - this.width);
    const maxX = Math.floor(px + this.width);
    const minY = Math.floor(py);
    const maxY = Math.floor(py + this.height);
    const minZ = Math.floor(pz - this.width);
    const maxZ = Math.floor(pz + this.width);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          if (world.isSolid(x, y, z)) {
            // Push player out of block
            const dx = px - (x + 0.5);
            const dz = pz - (z + 0.5);

            if (Math.abs(dx) > Math.abs(dz)) {
              this.pos.x = dx > 0 ? x + 1 + this.width : x - this.width;
            } else {
              this.pos.z = dz > 0 ? z + 1 + this.width : z - this.width;
            }

            // Vertical collision
            if (py < y + 1 && this.vel.y > 0) {
              this.pos.y = y - this.height;
              this.vel.y = 0;
            }
            if (py > y && this.vel.y < 0) {
              this.pos.y = y + 1;
              this.vel.y = 0;
            }
          }
        }
      }
    }
  }
}
