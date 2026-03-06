import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  isBackground: boolean; // Distinguish between background stars and interaction particles
}

interface StarDustCanvasProps {
  targetCoords: { x: number; y: number } | null;
  isNormalized: boolean;
  isAttracting?: boolean;
}

export const StarDustCanvas: React.FC<StarDustCanvasProps> = ({ targetCoords, isNormalized, isAttracting = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initBackgroundParticles(); // Re-initialize on resize
    };
    window.addEventListener('resize', resize);
    
    // Stardust colors: Blue-purple, Lavender, White
    const colors = ['#8b5cf6', '#a78bfa', '#e9d5ff', '#ffffff'];

    const createParticle = (x: number, y: number, isBackground: boolean = false) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = isBackground ? Math.random() * 0.2 + 0.05 : Math.random() * 2 + 1;
      
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: isBackground ? Infinity : Math.random() * 50 + 50,
        size: isBackground ? Math.random() * 2 + 0.5 : Math.random() * 3 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        isBackground,
      });
    };

    const initBackgroundParticles = () => {
      // Background particles are now handled by StarField3D
      particlesRef.current = particlesRef.current.filter(p => !p.isBackground);
    };

    resize(); // Initial setup

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Handle Interaction Particles
      if (targetCoords) {
        const px = isNormalized ? targetCoords.x * canvas.width : targetCoords.x;
        const py = isNormalized ? targetCoords.y * canvas.height : targetCoords.y;
        
        // Spawn interaction particles
        const spawnCount = isAttracting ? 5 : 2;
        for (let i = 0; i < spawnCount; i++) {
           const spawnX = isAttracting ? px + (Math.random() - 0.5) * 50 : px;
           const spawnY = isAttracting ? py + (Math.random() - 0.5) * 50 : py;
           
           const angle = Math.random() * Math.PI * 2;
           const speed = Math.random() * 2 + 1;
           
           particlesRef.current.push({
             x: spawnX,
             y: spawnY,
             vx: Math.cos(angle) * speed,
             vy: Math.sin(angle) * speed,
             life: 0,
             maxLife: Math.random() * 50 + 50,
             size: Math.random() * 3 + 1,
             color: colors[Math.floor(Math.random() * colors.length)],
             isBackground: false,
           });
        }
      }

      // Update and Draw Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        
        // Interaction Logic (Attraction)
        if (isAttracting && targetCoords) {
          const px = isNormalized ? targetCoords.x * canvas.width : targetCoords.x;
          const py = isNormalized ? targetCoords.y * canvas.height : targetCoords.y;
          const dx = px - p.x;
          const dy = py - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            p.vx += (dx / dist) * 0.5;
            p.vy += (dy / dist) * 0.5;
            p.vx *= 0.95;
            p.vy *= 0.95;
          }
        }

        // Movement
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        if (p.life >= p.maxLife) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        // Drawing
        const opacity = 1 - p.life / p.maxLife;
          
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = opacity;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [targetCoords, isNormalized, isAttracting]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0" // Changed z-index to 0 to be behind content but visible
    />
  );
};
