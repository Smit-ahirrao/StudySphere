import confetti from 'canvas-confetti';

let canvasRef: HTMLCanvasElement | null = null;
let fireRef: confetti.CreateTypes | null = null;

const getFire = () => {
  if (!canvasRef) {
    canvasRef = document.createElement('canvas');
    canvasRef.style.position = 'fixed';
    canvasRef.style.inset = '0';
    canvasRef.style.width = '100%';
    canvasRef.style.height = '100%';
    canvasRef.style.pointerEvents = 'none';
    canvasRef.style.zIndex = '9999';
    document.body.appendChild(canvasRef);
  }

  if (!fireRef) {
    fireRef = confetti.create(canvasRef, { resize: true, useWorker: true });
  }

  return fireRef;
};

export const triggerConfetti = (origin: 'task' | 'focus' = 'task') => {
  const fire = getFire();
  const baseOrigin = origin === 'task' ? { x: 0.68, y: 0.25 } : { x: 0.5, y: 0.45 };

  fire({
    particleCount: 70,
    spread: 70,
    startVelocity: 42,
    ticks: 260,
    gravity: 0.9,
    scalar: 0.9,
    origin: baseOrigin,
    colors: ['#22d3ee', '#0ea5e9', '#2563eb', '#14b8a6', '#f8fafc'],
  });

  fire({
    particleCount: 45,
    spread: 110,
    startVelocity: 32,
    decay: 0.93,
    scalar: 1.05,
    ticks: 220,
    gravity: 1,
    origin: { x: Math.max(0.15, baseOrigin.x - 0.16), y: baseOrigin.y + 0.03 },
    colors: ['#38bdf8', '#a5f3fc', '#93c5fd', '#14b8a6'],
  });
};
