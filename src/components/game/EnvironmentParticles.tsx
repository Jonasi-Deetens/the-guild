"use client";

interface ParticleConfig {
  count: number;
  type: "ember" | "dust" | "leaf" | "water-drop" | "wisp" | "firefly";
  color: string;
  speed: number;
}

interface EnvironmentParticlesProps {
  environmentType: string;
}

export function EnvironmentParticles({
  environmentType,
}: EnvironmentParticlesProps) {
  const getParticleConfig = (): ParticleConfig => {
    switch (environmentType) {
      case "dungeon_corridor":
        return { count: 30, type: "ember", color: "#ff6b35", speed: 2 };
      case "cave":
        return { count: 20, type: "water-drop", color: "#4a9eff", speed: 3 };
      case "training_ground":
        return { count: 40, type: "leaf", color: "#90EE90", speed: 1 };
      case "forest":
        return { count: 25, type: "firefly", color: "#ffeb3b", speed: 1.5 };
      case "crypt":
        return { count: 35, type: "wisp", color: "#9c27b0", speed: 1 };
      case "inn":
        return { count: 25, type: "ember", color: "#ffa500", speed: 1.5 };
      case "missions":
        return { count: 30, type: "wisp", color: "#6366f1", speed: 1.2 };
      default:
        return { count: 20, type: "dust", color: "#ffffff", speed: 1 };
    }
  };

  const config = getParticleConfig();

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: config.count }).map((_, i) => (
        <Particle key={i} config={config} index={i} />
      ))}
    </div>
  );
}

function Particle({
  config,
  index,
}: {
  config: ParticleConfig;
  index: number;
}) {
  // Use deterministic values based on index to avoid hydration mismatches
  const deterministicRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const style = {
    left: `${deterministicRandom(index) * 100}%`,
    animationDelay: `${deterministicRandom(index + 1000) * 5}s`,
    animationDuration: `${
      10 / config.speed + deterministicRandom(index + 2000) * 5
    }s`,
  };

  const getParticleClass = () => {
    switch (config.type) {
      case "ember":
        return "w-1 h-1 bg-orange-500 rounded-full shadow-[0_0_8px_2px_rgba(255,107,53,0.6)] animate-float-up";
      case "water-drop":
        return "w-0.5 h-2 bg-blue-400 rounded-full opacity-60 animate-fall";
      case "leaf":
        return "w-2 h-2 bg-green-400 rounded-sm opacity-40 animate-float-diagonal";
      case "firefly":
        return "w-1.5 h-1.5 bg-yellow-300 rounded-full shadow-[0_0_10px_3px_rgba(255,235,59,0.8)] animate-float-random";
      case "wisp":
        return "w-3 h-3 bg-purple-400 rounded-full opacity-30 blur-sm animate-float-slow";
      default:
        return "w-1 h-1 bg-gray-300 rounded-full opacity-20 animate-float-up";
    }
  };

  return <div className={getParticleClass()} style={style} />;
}
