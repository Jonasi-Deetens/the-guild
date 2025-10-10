"use client";

import { useRef, useEffect, useState } from "react";

interface JumpingGapsGameProps {
  config: any;
  playerStats: {
    speed: number;
    perception: number;
    attack: number;
    defense: number;
  };
  onComplete: (result: any) => void;
}

export function JumpingGapsGame({
  config,
  playerStats,
  onComplete,
}: JumpingGapsGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState({
    playerX: 50,
    playerY: 200,
    velocityY: 0,
    isJumping: false,
    gaps: [] as Array<{ x: number; width: number }>,
    score: 0,
    gameOver: false,
    gameStarted: false,
  });

  // Physics constants modified by player stats
  const JUMP_STRENGTH = 15 + playerStats.speed * 0.5;
  const MOVE_SPEED = 3 + playerStats.speed * 0.3;
  const GRAVITY = 0.6;

  useEffect(() => {
    // Generate gaps
    const gaps = [];
    for (let i = 0; i < (config.gapCount || 5); i++) {
      gaps.push({
        x: 200 + i * 250,
        width: 80 + Math.random() * 60,
      });
    }
    setGameState((prev) => ({ ...prev, gaps }));
  }, [config]);

  useEffect(() => {
    if (!gameState.gameStarted || gameState.gameOver) return;

    // Game loop
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrame: number;

    const gameLoop = () => {
      // Update physics
      let newState = { ...gameState };

      // Apply gravity
      newState.velocityY += GRAVITY;
      newState.playerY += newState.velocityY;

      // Ground collision
      if (newState.playerY >= 200) {
        newState.playerY = 200;
        newState.velocityY = 0;
        newState.isJumping = false;

        // Check if on gap
        const onGap = newState.gaps.some(
          (gap) =>
            newState.playerX > gap.x && newState.playerX < gap.x + gap.width
        );

        if (onGap) {
          newState.gameOver = true;
          onComplete({ success: false, score: newState.score });
        }
      }

      // Move forward automatically
      newState.playerX += MOVE_SPEED;

      // Check win condition
      if (newState.playerX > 1500) {
        newState.gameOver = true;
        onComplete({ success: true, score: newState.score });
      }

      setGameState(newState);

      // Render
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw ground
      ctx.fillStyle = "#4a5568";
      ctx.fillRect(0, 250, canvas.width, 50);

      // Draw gaps
      ctx.fillStyle = "#1a202c";
      newState.gaps.forEach((gap) => {
        ctx.fillRect(gap.x - newState.playerX + 50, 250, gap.width, 50);
      });

      // Draw player
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(50, newState.playerY, 30, 30);

      // Draw score
      ctx.fillStyle = "#ffffff";
      ctx.font = "20px Arial";
      ctx.fillText(`Score: ${newState.score}`, 10, 30);

      if (!newState.gameOver) {
        animationFrame = requestAnimationFrame(gameLoop);
      }
    };

    animationFrame = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animationFrame);
  }, [gameState, onComplete]);

  const handleJump = () => {
    if (
      !gameState.isJumping &&
      gameState.playerY >= 200 &&
      gameState.gameStarted
    ) {
      setGameState((prev) => ({
        ...prev,
        velocityY: -JUMP_STRENGTH,
        isJumping: true,
        score: prev.score + 10,
      }));
    }
  };

  const startGame = () => {
    setGameState((prev) => ({ ...prev, gameStarted: true }));
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleJump();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameState]);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">Jumping Gaps</h3>
        <p className="text-gray-400 text-sm mb-4">
          Use your speed stat to jump over gaps! Press Space to jump.
        </p>
        <p className="text-yellow-400 text-sm">
          Your speed: {playerStats.speed} (Jump strength:{" "}
          {JUMP_STRENGTH.toFixed(1)})
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
        <button
          onClick={handleJump}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
        >
          Jump (Space)
        </button>
      )}

      {gameState.gameOver && (
        <div className="text-center">
          <p className="text-lg font-semibold text-white mb-2">
            {gameState.score > 0 ? "Success!" : "Failed!"}
          </p>
          <p className="text-gray-400">Final Score: {gameState.score}</p>
        </div>
      )}
    </div>
  );
}
