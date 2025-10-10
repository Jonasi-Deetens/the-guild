"use client";

import { useState, useEffect, useRef } from "react";

interface QuickTimeGameProps {
  config: any;
  playerStats: {
    speed: number;
    perception: number;
    attack: number;
    defense: number;
  };
  onComplete: (result: any) => void;
}

export function QuickTimeGame({
  config,
  playerStats,
  onComplete,
}: QuickTimeGameProps) {
  const [gameState, setGameState] = useState({
    sequence: [] as string[],
    currentStep: 0,
    userInput: [] as string[],
    gameStarted: false,
    gameOver: false,
    success: false,
    score: 0,
    timeLeft: 0,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Game constants modified by player stats
  const SEQUENCE_LENGTH = 4 + Math.floor(playerStats.perception / 2);
  const REACTION_TIME = Math.max(0.5, 2 - playerStats.speed * 0.1);

  const KEYS = ["A", "S", "D", "F"];

  useEffect(() => {
    // Generate sequence
    const sequence = [];
    for (let i = 0; i < SEQUENCE_LENGTH; i++) {
      sequence.push(KEYS[Math.floor(Math.random() * KEYS.length)]);
    }
    setGameState((prev) => ({ ...prev, sequence }));
  }, []);

  const startGame = () => {
    setGameState((prev) => ({
      ...prev,
      gameStarted: true,
      timeLeft: REACTION_TIME,
    }));

    // Start countdown
    timerRef.current = setInterval(() => {
      setGameState((prev) => {
        const newTimeLeft = prev.timeLeft - 0.1;
        if (newTimeLeft <= 0) {
          clearInterval(timerRef.current!);
          return {
            ...prev,
            gameOver: true,
            success: false,
            timeLeft: 0,
          };
        }
        return { ...prev, timeLeft: newTimeLeft };
      });
    }, 100);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (!gameState.gameStarted || gameState.gameOver) return;

    const key = e.key.toUpperCase();
    if (!KEYS.includes(key)) return;

    const newUserInput = [...gameState.userInput, key];
    const isCorrect = key === gameState.sequence[gameState.currentStep];

    if (isCorrect) {
      const nextStep = gameState.currentStep + 1;
      if (nextStep >= SEQUENCE_LENGTH) {
        // Sequence completed successfully
        clearInterval(timerRef.current!);
        const finalScore = Math.floor(
          (REACTION_TIME - gameState.timeLeft) * 100
        );
        setGameState((prev) => ({
          ...prev,
          gameOver: true,
          success: true,
          score: finalScore,
        }));
        onComplete({ success: true, score: finalScore });
      } else {
        setGameState((prev) => ({
          ...prev,
          currentStep: nextStep,
          userInput: newUserInput,
        }));
      }
    } else {
      // Wrong key
      clearInterval(timerRef.current!);
      setGameState((prev) => ({
        ...prev,
        gameOver: true,
        success: false,
        score: prev.currentStep * 25,
      }));
      onComplete({ success: false, score: gameState.currentStep * 25 });
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState]);

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">Quick Time Event</h3>
        <p className="text-gray-400 text-sm mb-4">
          Press the keys in sequence as fast as you can! Your speed stat helps.
        </p>
        <p className="text-yellow-400 text-sm">
          Your speed: {playerStats.speed} (Time limit:{" "}
          {REACTION_TIME.toFixed(1)}s)
        </p>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 w-full max-w-md">
        {!gameState.gameStarted ? (
          <div className="text-center">
            <p className="text-white mb-4">Press the keys in this order:</p>
            <div className="flex justify-center space-x-2 mb-6">
              {gameState.sequence.map((key, index) => (
                <div
                  key={index}
                  className="w-12 h-12 bg-gray-700 border border-gray-600 rounded-lg flex items-center justify-center text-white font-bold"
                >
                  {key}
                </div>
              ))}
            </div>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
            >
              Start
            </button>
          </div>
        ) : !gameState.gameOver ? (
          <div className="text-center">
            <div className="mb-4">
              <p className="text-white mb-2">
                Press: {gameState.sequence[gameState.currentStep]}
              </p>
              <p className="text-yellow-400 text-sm">
                Time left: {gameState.timeLeft.toFixed(1)}s
              </p>
            </div>

            <div className="flex justify-center space-x-2 mb-4">
              {KEYS.map((key) => (
                <div
                  key={key}
                  className={`w-12 h-12 border-2 rounded-lg flex items-center justify-center text-white font-bold ${
                    key === gameState.sequence[gameState.currentStep]
                      ? "border-yellow-400 bg-yellow-400/20"
                      : "border-gray-600 bg-gray-700"
                  }`}
                >
                  {key}
                </div>
              ))}
            </div>

            <div className="text-sm text-gray-400">
              Progress: {gameState.currentStep}/{SEQUENCE_LENGTH}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p
              className={`text-lg font-semibold mb-2 ${
                gameState.success ? "text-green-400" : "text-red-400"
              }`}
            >
              {gameState.success ? "Success!" : "Time Up!"}
            </p>
            <p className="text-gray-400">Score: {gameState.score}</p>
          </div>
        )}
      </div>
    </div>
  );
}
