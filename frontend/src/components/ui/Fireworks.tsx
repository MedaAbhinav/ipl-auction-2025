import React, { useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';

export default function Fireworks({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { qualityMode } = useStore();
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active || qualityMode === 'battery') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const count = qualityMode === 'high' ? 8 : 4;
    const particles: any[] = [];

    const colors = ['#f9cd05', '#ff6b35', '#ff3366', '#00d4ff', '#7c3aed', '#10b981'];

    function burst(x: number, y: number) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < (qualityMode === 'high' ? 60 : 30); i++) {
        const angle = (Math.PI * 2 * i) / (qualityMode === 'high' ? 60 : 30);
        const speed = 2 + Math.random() * 4;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1,
          alpha: 1,
          color,
          r: 2 + Math.random() * 2
        });
      }
    }

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        burst(
          canvas.width * (0.1 + Math.random() * 0.8),
          canvas.height * (0.1 + Math.random() * 0.5)
        );
      }, i * 400);
    }

    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.alpha -= 0.015;
        if (p.alpha <= 0) { particles.splice(i, 1); continue; }
        ctx!.globalAlpha = p.alpha;
        ctx!.fillStyle = p.color;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
      if (particles.length > 0) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }
    rafRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafRef.current);
  }, [active, qualityMode]);

  if (!active || qualityMode === 'battery') return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
