"use client";

import { useRef, useEffect, useState } from "react";

interface ClosingWallsGameProps {
  config: any;
  playerStats: {
    speed: number;
    perception: number;
    attack: number;
    defense: number;
  };
  onComplete: (result: any) => void;
}

export function ClosingWallsGame({
  config,
  playerStats,
  onComplete,
}: ClosingWallsGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState({
    playerX: 400,
    playerY: 150,
    walls: [] as Array<{ x: number; width: number; closing: boolean }>,
    score: 0,
    gameOver: false,
    gameStarted: false,
    timeLeft: 30,
  });

  // Game constants modified by player stats
  const MOVE_SPEED = 4 + playerStats.speed * 0.5;
  const WALL_CLOSE_SPEED = 2 - playerStats.perception * 0.1;
  const SAFE_ZONE_SIZE = 60 + playerStats.perception * 5;

  useEffect(() => {
    // Generate walls
    const walls = [];
    for (let i = 0; i < 3; i++) {
      walls.push({
        x: 100 + i * 200,
        width: 200,
        closing: false,
      });
    }
    setGameState((prev) => ({ ...prev, walls }));
  }, []);

  useEffect(() => {
    if (!gameState.gameStarted || gameState.gameOver) return;

    // Game loop
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrame: number;
    let lastTime = Date.now();

    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Update physics
      let newState = { ...gameState };

      // Update timer
      newState.timeLeft -= deltaTime / 1000;

      // Randomly start closing walls
      newState.walls = newState.walls.map((wall) => {
        if (!wall.closing && Math.random() < 0.01) {
          return { ...wall, closing: true };
        }
        return wall;
      });

      // Update closing walls
      newState.walls = newState.walls.map((wall) => {
        if (wall.closing) {
          const newWidth = Math.max(0, wall.width - WALL_CLOSE_SPEED);
          return { ...wall, width: newWidth };
        }
        return wall;
      });

      // Check collision with walls
      const collision = newState.walls.some((wall) => {
        const wallCenter = wall.x + wall.width / 2;
        const distance = Math.abs(newState.playerX - wallCenter);
        return distance < wall.width / 2 + 20;
      });

      if (collision) {
        newState.gameOver = true;
        onComplete({ success: false, score: newState.score });
      }

      // Check win condition
      if (newState.timeLeft <= 0) {
        newState.gameOver = true;
        onComplete({ success: true, score: newState.score });
      }

      setGameState(newState);

      // Render
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw walls
      newState.walls.forEach((wall) => {
        ctx.fillStyle = wall.closing ? "#dc2626" : "#6b7280";
        ctx.fillRect(wall.x, 0, wall.width, canvas.height);

        // Draw safe zone
        ctx.fillStyle = "rgba(34, 197, 94, 0.3)";
        const safeZoneX = wall.x + wall.width / 2 - SAFE_ZONE_SIZE / 2;
        ctx.fillRect(safeZoneX, 0, SAFE_ZONE_SIZE, canvas.height);
      });

      // Draw player
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(newState.playerX - 15, newState.playerY - 15, 30, 30);

      // Draw UI
      ctx.fillStyle = "#ffffff";
      ctx.font = "20px Arial";
      ctx.fillText(
        `Time: ${Math.max(0, Math.ceil(newState.timeLeft))}s`,
        10,
        30
      );
      ctx.fillText(`Score: ${newState.score}`, 10, 60);

      if (!newState.gameOver) {
        animationFrame = requestAnimationFrame(gameLoop);
      }
    };

    animationFrame = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animationFrame);
  }, [gameState, onComplete]);

  const handleKeyPress = (e: KeyboardEvent) => {
    if (!gameState.gameStarted || gameState.gameOver) return;

    let newState = { ...gameState };

    switch (e.key) {
      case "ArrowLeft":
        newState.playerX = Math.max(30, newState.playerX - MOVE_SPEED);
        break;
      case "ArrowRight":
        newState.playerX = Math.min(770, newState.playerX + MOVE_SPEED);
        break;
    }

    setGameState(newState);
  };

  const startGame = () => {
    setGameState((prev) => ({ ...prev, gameStarted: true }));
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameState]);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">Closing Walls</h3>
        <p className="text-gray-400 text-sm mb-4">
          Avoid the closing walls! Use arrow keys to move.
        </p>
        <p className="text-yellow-400 text-sm">
          Your perception: {playerStats.perception} (Safe zone: {SAFE_ZONE_SIZE}
          px)
        </p>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={300}
        className="border border-gray-600 rounded-lg bg-gray-900"
      />

      {!gameState.gameStarted && (
        <button
          onClick={startGame}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
        >
          Start Game
        </button>
      )}

      {gameState.gameStarted && !gameState.gameOver && (
        <div className="text-center">
          <p className="text-gray-400 text-sm">Use ← → arrow keys to move</p>
        </div>
      )}

      {gameState.gameOver && (
        <div className="text-center">
          <p className="text-lg font-semibold text-white mb-2">
            {gameState.timeLeft <= 0 ? "Success!" : "Failed!"}
          </p>
          <p className="text-gray-400">Final Score: {gameState.score}</p>
        </div>
      )}
    </div>
  );
}
