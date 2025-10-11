"use client";

import { useEffect, useRef, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
}

interface ParticleEffectProps {
  isActive: boolean;
  type: "levelUp" | "experience" | "celebration";
  duration?: number;
  particleCount?: number;
  className?: string;
}

export function ParticleEffect({
  isActive,
  type,
  duration = 2000,
  particleCount = 50,
  className = "",
}: ParticleEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [particles, setParticles] = useState<Particle[]>([]);

  const getParticleConfig = (type: string) => {
    switch (type) {
      case "levelUp":
        return {
          colors: ["#fbbf24", "#f59e0b", "#d97706", "#92400e"],
          shapes: ["star", "circle"],
          sizes: [3, 6],
          speeds: [1, 3],
        };
      case "experience":
        return {
          colors: ["#10b981", "#059669", "#047857"],
          shapes: ["circle", "diamond"],
          sizes: [2, 4],
          speeds: [0.5, 2],
        };
      case "celebration":
        return {
          colors: ["#8b5cf6", "#7c3aed", "#6d28d9", "#5b21b6"],
          shapes: ["star", "circle", "diamond"],
          sizes: [2, 5],
          speeds: [1, 4],
        };
      default:
        return {
          colors: ["#6b7280"],
          shapes: ["circle"],
          sizes: [2, 4],
          speeds: [1, 2],
        };
    }
  };

  const createParticle = (id: number, canvas: HTMLCanvasElement): Particle => {
    const config = getParticleConfig(type);
    const color =
      config.colors[Math.floor(Math.random() * config.colors.length)];
    const size =
      config.sizes[0] + Math.random() * (config.sizes[1] - config.sizes[0]);
    const speed =
      config.speeds[0] + Math.random() * (config.speeds[1] - config.speeds[0]);

    // Start from center of canvas
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Random direction
    const angle = Math.random() * Math.PI * 2;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    return {
      id,
      x: centerX + (Math.random() - 0.5) * 20,
      y: centerY + (Math.random() - 0.5) * 20,
      vx,
      vy,
      life: 0,
      maxLife: 60 + Math.random() * 40, // 1-1.67 seconds at 60fps
      size,
      color,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
    };
  };

  const updateParticle = (particle: Particle): Particle => {
    return {
      ...particle,
      x: particle.x + particle.vx,
      y: particle.y + particle.vy,
      life: particle.life + 1,
      rotation: particle.rotation + particle.rotationSpeed,
      // Add gravity for some particles
      vy: particle.vy + (type === "levelUp" ? 0.05 : 0),
    };
  };

  const drawParticle = (ctx: CanvasRenderingContext2D, particle: Particle) => {
    const alpha = 1 - particle.life / particle.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation);

    // Draw different shapes based on type
    if (type === "levelUp" && Math.random() > 0.5) {
      // Draw star
      ctx.beginPath();
      const spikes = 5;
      const outerRadius = particle.size;
      const innerRadius = particle.size * 0.4;

      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / spikes;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();
    } else if (type === "experience" && Math.random() > 0.7) {
      // Draw diamond
      ctx.beginPath();
      ctx.moveTo(0, -particle.size);
      ctx.lineTo(particle.size, 0);
      ctx.lineTo(0, particle.size);
      ctx.lineTo(-particle.size, 0);
      ctx.closePath();
      ctx.fill();
    } else {
      // Draw circle
      ctx.beginPath();
      ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw particles
    setParticles((prevParticles) => {
      const updatedParticles = prevParticles
        .map(updateParticle)
        .filter((particle) => particle.life < particle.maxLife);

      // Draw all particles
      updatedParticles.forEach((particle) => {
        drawParticle(ctx, particle);
      });

      return updatedParticles;
    });

    // Continue animation if there are particles or effect is still active
    if (particles.length > 0 || isActive) {
      animationRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (isActive) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Set canvas size
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }

      // Create initial particles
      const newParticles: Particle[] = [];
      for (let i = 0; i < particleCount; i++) {
        newParticles.push(createParticle(i, canvas));
      }
      setParticles(newParticles);

      // Start animation
      animate();

      // Auto-stop after duration
      const timer = setTimeout(() => {
        setParticles([]);
      }, duration);

      return () => {
        clearTimeout(timer);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    } else {
      setParticles([]);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  }, [isActive, particleCount, duration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
}
