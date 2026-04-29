// chunk.js

export const CHUNK_SIZE = 16;

export class Chunk {
  constructor(cx, cy, cz) {
    this.cx = cx; // chunk coordinate (not world coords)
    this.cy = cy;
    this.cz = cz;

    // 3D array of block IDs
    this.blocks = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE);

    // Mesh reference (added by world.js)
    this.mesh = null;

    // Whether this chunk needs remeshing
    this.dirty = true;
  }

  // Convert (x,y,z) inside chunk → index in array
  index(x, y, z) {
    return x + CHUNK_SIZE * (y + CHUNK_SIZE * z);
  }

  // Get block ID at local chunk coords
  get(x, y, z) {
    if (
      x < 0 || x >= CHUNK_SIZE ||
      y < 0 || y >= CHUNK_SIZE ||
      z < 0 || z >= CHUNK_SIZE
    ) return 0; // air

    return this.blocks[this.index(x, y, z)];
  }

  // Set block ID at local chunk coords
  set(x, y, z, id) {
    if (
      x < 0 || x >= CHUNK_SIZE ||
      y < 0 || y >= CHUNK_SIZE ||
      z < 0 || z >= CHUNK_SIZE
    ) return;

    this.blocks[this.index(x, y, z)] = id;
    this.dirty = true;
  }
}
