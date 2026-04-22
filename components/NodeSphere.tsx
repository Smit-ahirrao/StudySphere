import React, { useEffect, useRef } from 'react';

export interface NodeSphereProps {
  /** Radius of the 3D sphere */
  radius?: number;
  /** Number of particles in the sphere */
  nodeCount?: number;
  /** Distance threshold to draw a connecting line */
  connectionDistance?: number;
  /** Base hue for the particles. The light mode theme uses a sky blue similar to 195. */
  baseHue?: number;
  /** Opacity of the background (0 to 1). If 0, it relies on the parent background. */
  backgroundOpacity?: number;
}

export const NodeSphere: React.FC<NodeSphereProps> = ({
  radius = 200,
  nodeCount = 200,
  connectionDistance = 60,
  baseHue = 195, // Matches Sky 500 / Cyan 500
  backgroundOpacity = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    
    // Support high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // 3D Point Structure
    interface Point3D {
      x: number;
      y: number;
      z: number;
      originalX: number;
      originalY: number;
      originalZ: number;
    }

    const points: Point3D[] = [];

    // Generate points using Fibonacci sphere distribution for even spread
    const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle
    for (let i = 0; i < nodeCount; i++) {
      const y = 1 - (i / (nodeCount - 1)) * 2; // y goes from 1 to -1
      const r = Math.sqrt(1 - y * y); // radius at y
      const theta = phi * i; // golden angle increment

      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;

      points.push({
        x: x * radius,
        y: y * radius,
        z: z * radius,
        originalX: x * radius,
        originalY: y * radius,
        originalZ: z * radius,
      });
    }

    let animationFrameId: number;
    let rotationX = 0;
    let rotationY = 0;

    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      if (backgroundOpacity > 0) {
        ctx.fillStyle = `rgba(15, 23, 42, ${backgroundOpacity})`; // Slate 900
        ctx.fillRect(0, 0, width, height);
      }

      const centerX = width / 2;
      const centerY = height / 2;

      // Update rotations for the current frame
      rotationX += 0.002;
      rotationY += 0.003;

      const cosX = Math.cos(rotationX);
      const sinX = Math.sin(rotationX);
      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);

      // Rotate all points
      const rotatedPoints = points.map((p) => {
        // Rotate around Y axis
        const x1 = p.originalX * cosY - p.originalZ * sinY;
        const z1 = p.originalX * sinY + p.originalZ * cosY;

        // Rotate around X axis
        const y2 = p.originalY * cosX - z1 * sinX;
        const z2 = p.originalY * sinX + z1 * cosX;

        return { x: x1, y: y2, z: z2 };
      });

      // Sort points by Z to draw back-to-front (simple depth sorting)
      // Since transparency is used, drawing order matters.
      const pointsWithDepth = rotatedPoints.map((p, index) => {
        return {
          ...p,
          index,
          alpha: (p.z + radius) / (2 * radius) * 0.7 + 0.1, // Map Z to alpha (0.1 to 0.8)
          scale: (p.z + radius) / (2 * radius) * 0.5 + 0.5, // Map Z to scale (0.5 to 1.0)
        };
      });

      pointsWithDepth.sort((a, b) => a.z - b.z);

      // Draw lines between nearby points
      for (let i = 0; i < pointsWithDepth.length; i++) {
        const p1 = pointsWithDepth[i];

        // Draw connections
        for (let j = i + 1; j < pointsWithDepth.length; j++) {
          const p2 = pointsWithDepth[j];
          
          // Fast bounding box check before expensive square root
          if (Math.abs(p1.x - p2.x) > connectionDistance) continue;
          if (Math.abs(p1.y - p2.y) > connectionDistance) continue;
          if (Math.abs(p1.z - p2.z) > connectionDistance) continue;

          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dz = p1.z - p2.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < connectionDistance) {
            // Line alpha based on distance and point depth
            const lineAlpha = (1 - dist / connectionDistance) * Math.min(p1.alpha, p2.alpha) * 0.6;
            if (lineAlpha > 0.01) {
              ctx.beginPath();
              // LSL lightness adjusted for visibility
              ctx.strokeStyle = `hsla(${baseHue}, 80%, 55%, ${lineAlpha})`;
              ctx.lineWidth = 1 * ((p1.scale + p2.scale) / 2);
              ctx.moveTo(centerX + p1.x, centerY + p1.y);
              ctx.lineTo(centerX + p2.x, centerY + p2.y);
              ctx.stroke();
            }
          }
        }

        // Draw the point itself
        ctx.beginPath();
        ctx.fillStyle = `hsla(${baseHue}, 90%, 65%, ${p1.alpha})`;
        ctx.arc(centerX + p1.x, centerY + p1.y, 2 * p1.scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Add a subtle glow to front-facing points
        if (p1.z > radius * 0.5) {
          ctx.beginPath();
          ctx.fillStyle = `hsla(${baseHue}, 90%, 75%, ${p1.alpha * 0.5})`;
          ctx.arc(centerX + p1.x, centerY + p1.y, 4 * p1.scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Handle Resize
    const handleResize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [radius, nodeCount, connectionDistance, baseHue, backgroundOpacity]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
};

export default NodeSphere;
