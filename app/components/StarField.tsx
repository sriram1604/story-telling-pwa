'use client';

import { useEffect, useRef } from 'react';

/**
 * Decorative twinkling starfield rendered on a <canvas>.
 * Pure visual effect – no interactivity.
 */
export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Star data
    interface Star {
      x: number;
      y: number;
      r: number;
      speed: number;
      alpha: number;
      dir: 1 | -1;
    }

    const NUM_STARS = 120;
    let stars: Star[] = [];
    let animId: number;
    let w = 0;
    let h = 0;

    function resize() {
      w = canvas!.width  = window.innerWidth;
      h = canvas!.height = window.innerHeight;
      // Regenerate stars on resize
      stars = Array.from({ length: NUM_STARS }, () => ({
        x:     Math.random() * w,
        y:     Math.random() * h,
        r:     Math.random() * 1.5 + 0.3,
        speed: Math.random() * 0.008 + 0.002,
        alpha: Math.random(),
        dir:   (Math.random() > 0.5 ? 1 : -1) as 1 | -1,
      }));
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.alpha += s.speed * s.dir;
        if (s.alpha <= 0.05) { s.alpha = 0.05; s.dir = 1; }
        if (s.alpha >= 1)    { s.alpha = 1;    s.dir = -1; }

        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255,255,255,${s.alpha})`;
        ctx!.fill();
      }
      animId = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
