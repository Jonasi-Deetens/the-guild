"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface PartyMember {
  id: string;
  name: string;
  currentHealth: number;
  maxHealth: number;
  isNPC: boolean;
  healing?: number;
}

interface RestPhaseUIProps {
  sessionId: string;
  currentPhase: number;
  totalPhases: number;
  partyMembers: PartyMember[];
  onContinue: (didRest: boolean) => void;
  restDuration: number; // Time penalty in seconds
}

export function RestPhaseUI({
  sessionId,
  currentPhase,
  totalPhases,
  partyMembers,
  onContinue,
  restDuration,
}: RestPhaseUIProps) {
  const [isResting, setIsResting] = useState(false);
  const [selectedAction, setSelectedAction] = useState<
    "rest" | "continue" | null
  >(null);

  const aliveMembers = partyMembers.filter((m) => !m.isNPC);
  const npcMembers = partyMembers.filter((m) => m.isNPC);

  const getHealthPercentage = (current: number, max: number) => {
    return Math.max(0, Math.min(100, (current / max) * 100));
  };

  const getHealthColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    if (percentage >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  const handleRest = () => {
    setIsResting(true);
    setSelectedAction("rest");
    // Simulate rest duration
    setTimeout(() => {
      onContinue(true);
    }, 2000);
  };

  const handleContinue = () => {
    setSelectedAction("continue");
    onContinue(false);
  };

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Phase Progress */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Rest Period</h1>
          <p className="text-gray-300">
            Phase {currentPhase} of {totalPhases} completed
          </p>
          {currentPhase === totalPhases && (
            <p className="text-yellow-400 font-semibold mt-2">
              🎉 Final phase completed! Mission successful!
            </p>
          )}
        </div>

        {/* Party Health Status */}
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Party Health Status
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Player Characters */}
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Players</h3>
                <div className="space-y-3">
                  {aliveMembers.map((member) => (
                    <div key={member.id} className="bg-black/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">
                          {member.name}
                        </span>
                        <span className="text-sm text-gray-400">
                          {member.currentHealth}/{member.maxHealth} HP
                        </span>
                      </div>

                      {/* Current Health Bar */}
                      <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getHealthColor(
                            getHealthPercentage(
                              member.currentHealth,
                              member.maxHealth
                            )
                          )}`}
                          style={{
                            width: `${getHealthPercentage(
                              member.currentHealth,
                              member.maxHealth
                            )}%`,
                          }}
                        />
                      </div>

                      {/* Healing Preview */}
                      {member.healing && member.healing > 0 && (
                        <div className="text-xs text-green-400">
                          +{member.healing} HP from rest
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* NPCs */}
              <div>
                <h3 className="text-lg font-medium text-white mb-3">
                  Companions
                </h3>
                <div className="space-y-3">
                  {npcMembers.map((member) => (
                    <div key={member.id} className="bg-black/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">
                          {member.name}
                        </span>
                        <span className="px-1.5 py-0.5 bg-blue-600 text-blue-100 text-xs rounded">
                          NPC
                        </span>
                      </div>

                      <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${getHealthPercentage(
                              member.currentHealth,
                              member.maxHealth
                            )}%`,
                          }}
                        />
                      </div>

                      <div className="text-xs text-gray-400">
                        {member.currentHealth}/{member.maxHealth} HP
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Rest Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rest Option */}
          <Card className="border-green-500/30">
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">😴</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Rest & Heal
              </h3>
              <p className="text-gray-300 mb-4">
                Take time to rest and recover. All party members will be healed.
              </p>

              <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-3 mb-4">
                <p className="text-yellow-400 text-sm">
                  ⏰ Time Penalty:{" "}
                  {restDuration >= 60
                    ? `+${Math.floor(restDuration / 60)} minutes`
                    : `+${restDuration} seconds`}
                </p>
              </div>

              <Button
                onClick={handleRest}
                disabled={isResting || selectedAction !== null}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {isResting ? "Resting..." : "Rest & Heal"}
              </Button>
            </div>
          </Card>

          {/* Continue Option */}
          <Card className="border-blue-500/30">
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">🏃</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Continue Immediately
              </h3>
              <p className="text-gray-300 mb-4">
                Press on without resting. No time penalty, but no healing.
              </p>

              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3 mb-4">
                <p className="text-blue-400 text-sm">⚡ No time penalty</p>
              </div>

              <Button
                onClick={handleContinue}
                disabled={isResting || selectedAction !== null}
                variant="outline"
                className="w-full border-blue-500 text-blue-400 hover:bg-blue-500/10 disabled:opacity-50"
              >
                Continue
              </Button>
            </div>
          </Card>
        </div>

        {/* Action Status */}
        {selectedAction && (
          <div className="mt-6 text-center">
            <div className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg p-4">
              <p className="text-white">
                {selectedAction === "rest" &&
                  "Resting and healing party members..."}
                {selectedAction === "continue" && "Continuing to next phase..."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
