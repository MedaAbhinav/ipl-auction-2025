import React, { useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  alpha: number; color: string; r: number;
}

export default function Fireworks({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { qualityMode } = useStore();
  const rafRef    = useRef<number>(0);
  const particles = useRef<Particle[]>([]);
  const burstsDone = useRef(0);

  useEffect(() => {
    if (!active || qualityMode === 'battery') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    particles.current = [];
    burstsDone.current = 0;

    const COLORS   = ['#f9cd05','#ffb800','#ff6b35','#a855f7','#22c55e','#3b82f6','#ec4899','#fff'];
    const COUNT    = qualityMode === 'high' ? 10 : 5;
    const PER_BURST= qualityMode === 'high' ? 70 : 40;

    function burst(x: number, y: number) {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      for (let i = 0; i < PER_BURST; i++) {
        const angle = (Math.PI * 2 * i) / PER_BURST;
        const speed = 1.5 + Math.random() * 4.5;
        particles.current.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5,
          alpha: 1,
          color,
          r: 1.5 + Math.random() * 2.5
        });
      }
    }

    // Schedule bursts
    for (let i = 0; i < COUNT; i++) {
      setTimeout(() => {
        burst(
          canvas.width  * (.1 + Math.random() * .8),
          canvas.height * (.08 + Math.random() * .45)
        );
      }, i * 380);
    }

    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.09; // gravity
        p.alpha -= 0.014;
        if (p.alpha <= 0) { particles.current.splice(i, 1); continue; }
        ctx!.globalAlpha = p.alpha;
        ctx!.fillStyle   = p.color;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
      if (particles.current.length > 0) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, qualityMode]);

  if (!active || qualityMode === 'battery') return null;

  return (
    <canvas ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ mixBlendMode: 'screen' }} />
  );
}
