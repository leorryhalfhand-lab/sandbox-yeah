// input.js

export const input = {
  forward: false,
  back: false,
  left: false,
  right: false,
  jump: false,
  mouseDX: 0,
  mouseDY: 0,
  mouseDown: false
};

export function setupInput(canvas) {

  // -----------------------------
  // Pointer Lock
  // -----------------------------
  canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
  });

  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement !== canvas) {
      input.mouseDX = 0;
      input.mouseDY = 0;
    }
  });

  // -----------------------------
  // Mouse movement
  // -----------------------------
  document.addEventListener('mousemove', e => {
    if (document.pointerLockElement === canvas) {
      input.mouseDX += e.movementX;
      input.mouseDY += e.movementY;
    }
  });

  // -----------------------------
  // Keyboard
  // -----------------------------
  document.addEventListener('keydown', e => {
    switch (e.code) {
      case 'KeyW': input.forward = true; break;
      case 'KeyS': input.back = true; break;
      case 'KeyA': input.left = true; break;
      case 'KeyD': input.right = true; break;
      case 'Space': input.jump = true; break;
    }
  });

  document.addEventListener('keyup', e => {
    switch (e.code) {
      case 'KeyW': input.forward = false; break;
      case 'KeyS': input.back = false; break;
      case 'KeyA': input.left = false; break;
      case 'KeyD': input.right = false; break;
      case 'Space': input.jump = false; break;
    }
  });

  // -----------------------------
  // Mouse buttons
  // -----------------------------
  document.addEventListener('mousedown', () => {
    input.mouseDown = true;
  });

  document.addEventListener('mouseup', () => {
    input.mouseDown = false;
  });
}
