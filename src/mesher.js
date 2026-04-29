// mesher.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164/build/three.module.js';
import { CHUNK_SIZE } from './chunk.js';
import { BLOCKS, MATERIALS, BLOCK_FROM_ID } from './blocks.js';

// Directions for each face
const DIRS = [
  { name: 'px', x: 1, y: 0, z: 0 },
  { name: 'nx', x: -1, y: 0, z: 0 },
  { name: 'py', x: 0, y: 1, z: 0 },
  { name: 'ny', x: 0, y: -1, z: 0 },
  { name: 'pz', x: 0, y: 0, z: 1 },
  { name: 'nz', x: 0, y: 0, z: -1 }
];

// Face → material selector
function getMaterial(blockKey, face) {
  const mat = MATERIALS[blockKey];
  if (!mat) return null;

  if (face === 'py') return mat.top;
  if (face === 'ny') return mat.bottom;
  return mat.side;
}

export function meshChunk(chunk, world) {
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const normals = [];
  const uvs = [];
  const materials = [];

  // Greedy meshing per face direction
  for (const dir of DIRS) {
    const mask = [];

    const u = dir.y !== 0 ? 'x' : 'y';
    const v = dir.z !== 0 ? 'x' : 'z';

    const du = { x: 0, y: 0, z: 0 };
    const dv = { x: 0, y: 0, z: 0 };

    if (u === 'x') du.x = 1;
    if (u === 'y') du.y = 1;
    if (u === 'z') du.z = 1;

    if (v === 'x') dv.x = 1;
    if (v === 'y') dv.y = 1;
    if (v === 'z') dv.z = 1;

    const dims = { x: CHUNK_SIZE, y: CHUNK_SIZE, z: CHUNK_SIZE };

    // Sweep through the chunk
    for (let w = -1; w < dims[dir.name[1]]; w++) {
      let n = 0;

      for (let j = 0; j < dims[v]; j++) {
        for (let i = 0; i < dims[u]; i++) {

          const x = dir.x === 1 ? w : (dir.x === -1 ? w + 1 : i);
          const y = dir.y === 1 ? w : (dir.y === -1 ? w + 1 : (u === 'y' ? i : j));
          const z = dir.z === 1 ? w : (dir.z === -1 ? w + 1 : (v === 'z' ? j : i));

          const blockID = world.getBlockGlobal(
            chunk.cx * CHUNK_SIZE + x,
            chunk.cy * CHUNK_SIZE + y,
            chunk.cz * CHUNK_SIZE + z
          );

          const neighborID = world.getBlockGlobal(
            chunk.cx * CHUNK_SIZE + x + dir.x,
            chunk.cy * CHUNK_SIZE + y + dir.y,
            chunk.cz * CHUNK_SIZE + z + dir.z
          );

          const blockKey = BLOCK_FROM_ID[blockID];
          const neighborKey = BLOCK_FROM_ID[neighborID];

          const block = BLOCKS[blockKey];
          const neighbor = BLOCKS[neighborKey];

          if (block && block.solid && (!neighbor || !neighbor.solid)) {
            mask[n++] = blockKey;
          } else {
            mask[n++] = null;
          }
        }
      }

      // Greedy merge
      n = 0;
      for (let j = 0; j < dims[v]; j++) {
        for (let i = 0; i < dims[u]; ) {
          const blockKey = mask[n];
          if (!blockKey) {
            i++;
            n++;
            continue;
          }

          let width = 1;
          while (i + width < dims[u] && mask[n + width] === blockKey) {
            width++;
          }

          let height = 1;
          outer: for (let k = 1; j + k < dims[v]; k++) {
            for (let l = 0; l < width; l++) {
              if (mask[n + l + k * dims[u]] !== blockKey) break outer;
            }
            height++;
          }

          // Create quad
          const x = chunk.cx * CHUNK_SIZE;
          const y = chunk.cy * CHUNK_SIZE;
          const z = chunk.cz * CHUNK_SIZE;

          const material = getMaterial(blockKey, dir.name);

          const dux = du.x * width;
          const duy = du.y * width;
          const duz = du.z * width;

          const dvx = dv.x * height;
          const dvy = dv.y * height;
          const dvz = dv.z * height;

          const px = x + (dir.x === 1 ? w + 1 : w);
          const py = y + (dir.y === 1 ? w + 1 : w);
          const pz = z + (dir.z === 1 ? w + 1 : w);

          const ax = px + (u === 'x' ? i : 0);
          const ay = py + (u === 'y' ? i : (v === 'y' ? j : 0));
          const az = pz + (u === 'z' ? i : (v === 'z' ? j : 0));

          const v1 = [ax, ay, az];
          const v2 = [ax + dux, ay + duy, az + duz];
          const v3 = [ax + dux + dvx, ay + duy + dvy, az + duz + dvz];
          const v4 = [ax + dvx, ay + dvy, az + dvz];

          positions.push(...v1, ...v2, ...v3, ...v1, ...v3, ...v4);

          const normal = [dir.x, dir.y, dir.z];
          normals.push(...normal, ...normal, ...normal, ...normal, ...normal, ...normal);

          uvs.push(
            0, 0,
            width, 0,
            width, height,
            0, 0,
            width, height,
            0, height
          );

          materials.push(material);

          // Mark merged area as empty
          for (let k = 0; k < height; k++) {
            for (let l = 0; l < width; l++) {
              mask[n + l + k * dims[u]] = null;
            }
          }

          i += width;
          n += width;
        }
      }
    }
  }

  // Build geometry
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

  geometry.computeBoundingSphere();

  return { geometry, materials };
}
