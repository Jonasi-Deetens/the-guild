"use client";

import { PhaseStatus } from "@prisma/client";

interface PhaseProgressIndicatorProps {
  currentPhase: number;
  totalPhases: number;
  phaseStatus: PhaseStatus;
}

export function PhaseProgressIndicator({
  currentPhase,
  totalPhases,
  phaseStatus,
}: PhaseProgressIndicatorProps) {
  const isFinalPhase = currentPhase === totalPhases;
  const isBossPhase = isFinalPhase;

  const getStatusColor = (status: PhaseStatus) => {
    switch (status) {
      case "PENDING":
        return "text-gray-400";
      case "ACTIVE":
        return "text-red-400";
      case "RESTING":
        return "text-blue-400";
      case "COMPLETED":
        return "text-green-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusText = (status: PhaseStatus) => {
    switch (status) {
      case "PENDING":
        return "Waiting";
      case "ACTIVE":
        return isBossPhase ? "Boss Fight!" : "Combat";
      case "RESTING":
        return "Rest Period";
      case "COMPLETED":
        return "Completed";
      default:
        return "Unknown";
    }
  };

  const getPhaseIcon = (
    phaseNumber: number,
    isActive: boolean,
    isCompleted: boolean
  ) => {
    if (isCompleted) {
      return "✅";
    } else if (isActive) {
      return isBossPhase ? "👑" : "⚔️";
    } else {
      return isBossPhase ? "👑" : "⚔️";
    }
  };

  return (
    <div className="flex items-center justify-center space-x-1 mb-2">
      {Array.from({ length: totalPhases }, (_, i) => {
        const phaseNumber = i + 1;
        const isActive = phaseNumber === currentPhase;
        const isCompleted = phaseNumber < currentPhase;
        const isPending = phaseNumber > currentPhase;
        const isThisBoss = phaseNumber === totalPhases;

        return (
          <div
            key={phaseNumber}
            className={`flex items-center space-x-1 ${
              isActive ? "scale-110" : ""
            } transition-transform duration-200`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                isCompleted
                  ? "bg-green-600 text-green-100"
                  : isActive
                  ? isThisBoss
                    ? "bg-purple-600 text-purple-100 animate-pulse"
                    : "bg-red-600 text-red-100 animate-pulse"
                  : isPending
                  ? "bg-gray-600 text-gray-400"
                  : "bg-gray-600 text-gray-400"
              }`}
            >
              {getPhaseIcon(phaseNumber, isActive, isCompleted)}
            </div>
            {phaseNumber < totalPhases && (
              <div
                className={`w-2 h-0.5 ${
                  isCompleted ? "bg-green-600" : "bg-gray-600"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
