"use client";

import { useState, useEffect } from "react";

interface RiddleGameProps {
  config: any;
  playerStats: {
    speed: number;
    perception: number;
    attack: number;
    defense: number;
  };
  onComplete: (result: any) => void;
}

const RIDDLES = [
  {
    question:
      "I speak without a mouth and hear without ears. I have no body, but come alive with wind. What am I?",
    answer: "echo",
    hints: [
      "It bounces back",
      "You hear it in mountains",
      "It repeats what you say",
    ],
  },
  {
    question: "The more you take, the more you leave behind. What am I?",
    answer: "footsteps",
    hints: [
      "You make them when walking",
      "They show where you've been",
      "They're left on the ground",
    ],
  },
  {
    question: "I'm tall when I'm young, and short when I'm old. What am I?",
    answer: "candle",
    hints: ["It burns", "It gives light", "It gets shorter over time"],
  },
  {
    question:
      "What has keys but no locks, space but no room, and you can enter but not go inside?",
    answer: "keyboard",
    hints: [
      "You use it to type",
      "It has letters and numbers",
      "It's connected to a computer",
    ],
  },
  {
    question:
      "I'm not alive, but I can grow. I don't have lungs, but I need air. I don't have a mouth, but water kills me. What am I?",
    answer: "fire",
    hints: ["It burns", "It needs oxygen", "Water puts it out"],
  },
];

export function RiddleGame({
  config,
  playerStats,
  onComplete,
}: RiddleGameProps) {
  const [gameState, setGameState] = useState({
    currentRiddle: 0,
    userAnswer: "",
    hintsUsed: 0,
    maxHints: 3,
    gameOver: false,
    success: false,
    score: 0,
  });

  const currentRiddle = RIDDLES[gameState.currentRiddle];
  const maxRiddles = Math.min(3, 1 + Math.floor(playerStats.perception / 3));

  const handleSubmit = () => {
    const isCorrect =
      gameState.userAnswer.toLowerCase().trim() ===
      currentRiddle.answer.toLowerCase();

    if (isCorrect) {
      const newScore = gameState.score + 100 - gameState.hintsUsed * 20;
      const nextRiddle = gameState.currentRiddle + 1;

      if (nextRiddle >= maxRiddles) {
        setGameState((prev) => ({
          ...prev,
          gameOver: true,
          success: true,
          score: newScore,
        }));
        onComplete({ success: true, score: newScore });
      } else {
        setGameState((prev) => ({
          ...prev,
          currentRiddle: nextRiddle,
          userAnswer: "",
          hintsUsed: 0,
          score: newScore,
        }));
      }
    } else {
      setGameState((prev) => ({
        ...prev,
        gameOver: true,
        success: false,
        score: prev.score,
      }));
      onComplete({ success: false, score: gameState.score });
    }
  };

  const useHint = () => {
    if (gameState.hintsUsed < gameState.maxHints) {
      setGameState((prev) => ({
        ...prev,
        hintsUsed: prev.hintsUsed + 1,
      }));
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 max-w-2xl">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">Ancient Riddle</h3>
        <p className="text-gray-400 text-sm mb-4">
          Solve the riddle to proceed. Higher perception gives you more riddles
          to solve!
        </p>
        <p className="text-yellow-400 text-sm">
          Your perception: {playerStats.perception} (Riddles:{" "}
          {gameState.currentRiddle + 1}/{maxRiddles})
        </p>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 w-full">
        <div className="text-center mb-6">
          <p className="text-white text-lg leading-relaxed">
            {currentRiddle.question}
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            value={gameState.userAnswer}
            onChange={(e) =>
              setGameState((prev) => ({ ...prev, userAnswer: e.target.value }))
            }
            placeholder="Your answer..."
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
            disabled={gameState.gameOver}
          />

          <div className="flex justify-between items-center">
            <button
              onClick={useHint}
              disabled={
                gameState.hintsUsed >= gameState.maxHints || gameState.gameOver
              }
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Hint ({gameState.maxHints - gameState.hintsUsed} left)
            </button>

            <button
              onClick={handleSubmit}
              disabled={!gameState.userAnswer.trim() || gameState.gameOver}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Submit
            </button>
          </div>
        </div>

        {gameState.hintsUsed > 0 && (
          <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-600 rounded-lg">
            <p className="text-yellow-400 text-sm font-semibold mb-2">Hint:</p>
            <p className="text-yellow-300 text-sm">
              {currentRiddle.hints[gameState.hintsUsed - 1]}
            </p>
          </div>
        )}

        <div className="mt-4 flex justify-between text-sm text-gray-400">
          <span>Score: {gameState.score}</span>
          <span>
            Riddle {gameState.currentRiddle + 1} of {maxRiddles}
          </span>
        </div>
      </div>

      {gameState.gameOver && (
        <div className="text-center">
          <p
            className={`text-lg font-semibold mb-2 ${
              gameState.success ? "text-green-400" : "text-red-400"
            }`}
          >
            {gameState.success ? "Riddle Solved!" : "Incorrect Answer!"}
          </p>
          <p className="text-gray-400">Final Score: {gameState.score}</p>
        </div>
      )}
    </div>
  );
}
