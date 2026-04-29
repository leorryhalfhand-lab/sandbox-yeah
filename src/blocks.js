// blocks.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164/build/three.module.js';

export const BLOCKS = {
  air: {
    id: 0,
    solid: false
  },

  grass: {
    id: 1,
    solid: true,
    textures: {
      top: 'grass_top.png',
      bottom: 'grass_bottom.png',
      side: 'grass_side.png'
    }
  },

  dirt: {
    id: 2,
    solid: true,
    textures: {
      all: 'dirt.png'
    }
  },

  stone: {
    id: 3,
    solid: true,
    textures: {
      all: 'stone.png'
    }
  },

  wood: {
    id: 4,
    solid: true,
    textures: {
      all: 'wood.png'
    }
  }
};

// Maps block ID → block key
export const BLOCK_FROM_ID = {};
for (const key in BLOCKS) {
  BLOCK_FROM_ID[BLOCKS[key].id] = key;
}

export const MATERIALS = {}; // Filled after textures load

// ---------------------------------------------
// Load textures for all blocks
// ---------------------------------------------
export async function loadBlockTextures() {
  const loader = new THREE.TextureLoader();

  function loadTexture(name) {
    return new Promise(resolve => {
      loader.load(`./textures/${name}`, tex => {
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        resolve(tex);
      });
    });
  }

  for (const key in BLOCKS) {
    const block = BLOCKS[key];
    if (!block.textures) continue;

    const faces = {};

    if (block.textures.all) {
      const tex = await loadTexture(block.textures.all);
      faces.top = faces.bottom = faces.side = tex;
    } else {
      faces.top = await loadTexture(block.textures.top);
      faces.bottom = await loadTexture(block.textures.bottom);
      faces.side = await loadTexture(block.textures.side);
    }

    MATERIALS[key] = {
      top: new THREE.MeshLambertMaterial({ map: faces.top }),
      bottom: new THREE.MeshLambertMaterial({ map: faces.bottom }),
      side: new THREE.MeshLambertMaterial({ map: faces.side })
    };
  }
}
