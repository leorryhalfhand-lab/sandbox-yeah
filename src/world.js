// world.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164/build/three.module.js';

import { Chunk, CHUNK_SIZE } from './chunk.js';
import { meshChunk } from './mesher.js';
import { BLOCKS, BLOCK_FROM_ID } from './blocks.js';

// Simplex noise for terrain
import SimplexNoise from 'https://cdn.jsdelivr.net/npm/simplex-noise@4.0.1/dist/esm/simplex-noise.js';

export class World {
  constructor(scene) {
    this.scene = scene;

    this.chunks = new Map(); // "cx,cy,cz" → Chunk
    this.simplex = new SimplexNoise('seed123');

    // Generate initial world
    this.generateArea(0, 0, 0, 4); // 4×4 chunks around origin
  }

  // ---------------------------------------------
  // Chunk key helper
  // ---------------------------------------------
  key(cx, cy, cz) {
    return `${cx},${cy},${cz}`;
  }

  // ---------------------------------------------
  // Get or create chunk
  // ---------------------------------------------
  getChunk(cx, cy, cz) {
    const k = this.key(cx, cy, cz);
    if (!this.chunks.has(k)) {
      const chunk = new Chunk(cx, cy, cz);
      this.generateChunk(chunk);
      this.chunks.set(k, chunk);
    }
    return this.chunks.get(k);
  }

  // ---------------------------------------------
  // Generate a region of chunks
  // ---------------------------------------------
  generateArea(cx, cy, cz, radius) {
    for (let x = cx - radius; x <= cx + radius; x++) {
      for (let z = cz - radius; z <= cz + radius; z++) {
        const chunk = this.getChunk(x, 0, z);
        this.buildChunkMesh(chunk);
      }
    }
  }

  // ---------------------------------------------
  // Terrain generation (noise-based)
  // ---------------------------------------------
  generateChunk(chunk) {
    const baseX = chunk.cx * CHUNK_SIZE;
    const baseZ = chunk.cz * CHUNK_SIZE;

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {

        // Heightmap using simplex noise
        const worldX = baseX + x;
        const worldZ = baseZ + z;

        const height =
          Math.floor(
            this.simplex.noise2D(worldX * 0.05, worldZ * 0.05) * 8
          ) + 20;

        for (let y = 0; y < CHUNK_SIZE; y++) {
          const worldY = chunk.cy * CHUNK_SIZE + y;

          let block = 'air';

          if (worldY === height) block = 'grass';
          else if (worldY < height && worldY > height - 3) block = 'dirt';
          else if (worldY < height - 3) block = 'stone';

          const id = BLOCKS[block].id;
          chunk.set(x, y, z, id);
        }
      }
    }
  }

  // ---------------------------------------------
  // Build mesh for a chunk
  // ---------------------------------------------
  buildChunkMesh(chunk) {
    if (!chunk.dirty) return;

    const { geometry, materials } = meshChunk(chunk, this);

    if (chunk.mesh) {
      this.scene.remove(chunk.mesh);
    }

    const mesh = new THREE.Mesh(geometry, materials);
    mesh.position.set(
      chunk.cx * CHUNK_SIZE,
      chunk.cy * CHUNK_SIZE,
      chunk.cz * CHUNK_SIZE
    );

    chunk.mesh = mesh;
    chunk.dirty = false;

    this.scene.add(mesh);
  }

  // ---------------------------------------------
  // Convert world coords → chunk coords
  // ---------------------------------------------
  worldToChunk(x, y, z) {
    const cx = Math.floor(x / CHUNK_SIZE);
    const cy = Math.floor(y / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    return { cx, cy, cz };
  }

  // Convert world coords → local chunk coords
  worldToLocal(x, y, z) {
    const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const ly = ((y % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return { lx, ly, lz };
  }

  // ---------------------------------------------
  // Get block in world space
  // ---------------------------------------------
  getBlockGlobal(x, y, z) {
    const { cx, cy, cz } = this.worldToChunk(x, y, z);
    const chunk = this.getChunk(cx, cy, cz);
    const { lx, ly, lz } = this.worldToLocal(x, y, z);
    return chunk.get(lx, ly, lz);
  }

  blockKey(id) {
    return BLOCK_FROM_ID[id] || 'air';
  }

  // ---------------------------------------------
  // Set block in world space
  // ---------------------------------------------
  setBlock(x, y, z, blockKey) {
    const id = BLOCKS[blockKey].id;

    const { cx, cy, cz } = this.worldToChunk(x, y, z);
    const chunk = this.getChunk(cx, cy, cz);

    const { lx, ly, lz } = this.worldToLocal(x, y, z);
    chunk.set(lx, ly, lz, id);

    // Mark this chunk and neighbors dirty
    chunk.dirty = true;

    // If block is on a chunk border, update neighbors too
    if (lx === 0) this.getChunk(cx - 1, cy, cz).dirty = true;
    if (lx === CHUNK_SIZE - 1) this.getChunk(cx + 1, cy, cz).dirty = true;

    if (ly === 0) this.getChunk(cx, cy - 1, cz).dirty = true;
    if (ly === CHUNK_SIZE - 1) this.getChunk(cx, cy + 1, cz).dirty = true;

    if (lz === 0) this.getChunk(cx, cy, cz - 1).dirty = true;
    if (lz === CHUNK_SIZE - 1) this.getChunk(cx, cy, cz + 1).dirty = true;

    // Rebuild meshes
    this.buildChunkMesh(chunk);
  }
}
