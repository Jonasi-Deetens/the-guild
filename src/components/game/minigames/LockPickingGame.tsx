"use client";

import { useState, useEffect } from "react";

interface LockPickingGameProps {
  config: any;
  playerStats: {
    speed: number;
    perception: number;
    attack: number;
    defense: number;
  };
  onComplete: (result: any) => void;
}

export function LockPickingGame({
  config,
  playerStats,
  onComplete,
}: LockPickingGameProps) {
  const [gameState, setGameState] = useState({
    pins: [] as Array<{
      position: number;
      difficulty: number;
      picked: boolean;
    }>,
    currentPin: 0,
    attempts: 0,
    maxAttempts: 3,
    gameOver: false,
    success: false,
  });

  // Game constants modified by player stats
  const PIN_COUNT = 4 + Math.floor(playerStats.perception / 2);
  const DIFFICULTY_BASE = 50 - playerStats.perception * 5;

  useEffect(() => {
    // Generate pins
    const pins = [];
    for (let i = 0; i < PIN_COUNT; i++) {
      pins.push({
        position: Math.random() * 100,
        difficulty: DIFFICULTY_BASE + Math.random() * 20,
        picked: false,
      });
    }
    setGameState((prev) => ({ ...prev, pins }));
  }, []);

  const handlePinClick = (pinIndex: number) => {
    if (gameState.gameOver || gameState.pins[pinIndex].picked) return;

    const pin = gameState.pins[pinIndex];
    const success = Math.random() * 100 < 100 - pin.difficulty;

    let newState = { ...gameState };

    if (success) {
      newState.pins[pinIndex].picked = true;
      newState.currentPin++;

      // Check if all pins are picked
      if (newState.currentPin >= PIN_COUNT) {
        newState.gameOver = true;
        newState.success = true;
        onComplete({ success: true, score: 100 });
      }
    } else {
      newState.attempts++;

      if (newState.attempts >= newState.maxAttempts) {
        newState.gameOver = true;
        newState.success = false;
        onComplete({ success: false, score: newState.currentPin * 25 });
      }
    }

    setGameState(newState);
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">Lock Picking</h3>
        <p className="text-gray-400 text-sm mb-4">
          Click on the pins to pick the lock. Higher perception helps!
        </p>
        <p className="text-yellow-400 text-sm">
          Your perception: {playerStats.perception} (Difficulty:{" "}
          {DIFFICULTY_BASE})
        </p>
      </div>

      <div className="relative w-80 h-40 bg-gray-800 border-2 border-gray-600 rounded-lg overflow-hidden">
        {/* Lock mechanism */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 border-4 border-gray-600 rounded-full relative">
            {/* Lock pins */}
            {gameState.pins.map((pin, index) => (
              <div
                key={index}
                className={`absolute w-3 h-3 rounded-full cursor-pointer transition-all ${
                  pin.picked
                    ? "bg-green-500"
                    : "bg-yellow-500 hover:bg-yellow-400"
                }`}
                style={{
                  left: `${pin.position}%`,
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                }}
                onClick={() => handlePinClick(index)}
              />
            ))}
          </div>
        </div>

        {/* Progress indicator */}
        <div className="absolute bottom-2 left-2 right-2">
          <div className="flex justify-between text-xs text-gray-400">
            <span>
              Pins: {gameState.currentPin}/{PIN_COUNT}
            </span>
            <span>
              Attempts: {gameState.attempts}/{gameState.maxAttempts}
            </span>
          </div>
        </div>
      </div>

      {!gameState.gameOver && (
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            Click on the yellow pins to pick them. Be careful - failed attempts
            count against you!
          </p>
        </div>
      )}

      {gameState.gameOver && (
        <div className="text-center">
          <p
            className={`text-lg font-semibold mb-2 ${
              gameState.success ? "text-green-400" : "text-red-400"
            }`}
          >
            {gameState.success ? "Lock Picked!" : "Lock Jammed!"}
          </p>
          <p className="text-gray-400">
            Pins picked: {gameState.currentPin}/{PIN_COUNT}
          </p>
        </div>
      )}
    </div>
  );
}
