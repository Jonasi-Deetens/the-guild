"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Clock, Star } from "@/components/icons";
import { PartyMembersSidebar } from "@/components/game/PartyMembersSidebar";
import { EnvironmentBackground } from "@/components/game/EnvironmentBackground";
import { LootDistributionModal } from "@/components/game/LootDistributionModal";
import { CombatArenaLayout, RestPhaseUI } from "@/components/game/phases";
import { useDungeonSession } from "@/contexts/DungeonSessionContext";
import { api } from "@/trpc/react";

export default function DungeonPage() {
  const router = useRouter();
  const [showLootModal, setShowLootModal] = useState(false);

  const {
    session,
    currentPhase,
    phaseStatus,
    partyMembers,
    remainingTime,
    showCompletion,
    partyChat,
    isLoading,
    startMission,
    submitAction,
    sendChatMessage,
  } = useDungeonSession();

  // Get session loot for completion modal
  const { data: sessionLoot } = api.dungeon.getSessionLoot.useQuery(
    { sessionId: session?.id || "" },
    { enabled: !!session?.id && showCompletion }
  );

  // Phase mutations
  const endRestMutation = api.phase.endRest.useMutation();
  const getPartyHealthStatus = api.phase.getPartyHealthStatus.useQuery(
    { sessionId: session?.id || "" },
    { enabled: !!session?.id && phaseStatus === "RESTING" }
  );

  const handleMinigameComplete = (result: unknown) => {
    submitAction("minigame_complete", result);
  };

  const handleRestContinue = async (didRest: boolean) => {
    if (!session || !currentPhase) return;

    try {
      await endRestMutation.mutateAsync({
        sessionId: session.id,
        phaseNumber: currentPhase.phaseNumber,
        didRest,
      });
    } catch (error) {
      console.error("Failed to end rest period:", error);
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white">Loading mission...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen relative">
      <EnvironmentBackground
        environmentType={session.mission.environmentType}
      />

      {/* Main content with relative z-index */}
      <div className="relative z-10 flex w-full h-full">
        {/* Party Members Sidebar */}
        <PartyMembersSidebar
          partyMembers={partyMembers}
          partyChat={partyChat}
          onSendMessage={sendChatMessage}
        />

        {/* Main Game Area */}
        <div className="flex-1 flex flex-col overflow-hidden w-full">
          {/* Header */}
          <div className="p-4 border-b border-amber-900/30 bg-stone-900/50">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-1">
                {session.mission.name}
              </h1>
              <p className="text-gray-300 text-sm mb-2">
                {session.mission.description}
              </p>
              <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
                <span>Status: {session.status}</span>
                <span>•</span>
                <span>
                  Difficulty:{" "}
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`inline h-3 w-3 ${
                        i < session.mission.difficulty
                          ? "text-yellow-400"
                          : "text-gray-600"
                      }`}
                    />
                  ))}
                </span>
                <span>•</span>
                <span>
                  Environment:{" "}
                  {session.mission.environmentType.replace("_", " ")}
                </span>
              </div>
              {/* Mission Timer */}
              {session.status === "ACTIVE" && (
                <div className="mt-3">
                  <div className="flex items-center justify-center space-x-2 bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-2">
                    <Clock className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-semibold text-white">
                      Time: {Math.floor(remainingTime / 60)}:
                      {(remainingTime % 60).toString().padStart(2, "0")}
                    </span>
                    {session.pausedAt && (
                      <span className="text-xs text-yellow-400 ml-2">
                        (Paused)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Game Window */}
          <div className="flex-1 overflow-hidden w-full">
            {session.status === "WAITING" && (
              <div className="flex items-center justify-center h-full p-6">
                {/* Centered Card Container */}
                <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                  <div className="flex flex-col items-center justify-center">
                    {/* Mission Icon */}
                    <div className="text-6xl mb-6 animate-pulse">⚔️</div>

                    {/* Mission Title */}
                    <h2 className="text-3xl font-bold text-white mb-4">
                      Mission Ready
                    </h2>

                    {/* Mission Info */}
                    <div className="text-center mb-6">
                      <p className="text-gray-300 mb-2">
                        {session.mission.name}
                      </p>
                      <p className="text-sm text-gray-400">
                        Duration:{" "}
                        {Math.floor(session.mission.baseDuration / 60)} minutes
                      </p>
                      <p className="text-sm text-blue-400 mt-1">
                        Phases: {session.mission.totalPhases || 3}
                      </p>
                    </div>

                    {/* Start Button */}
                    <Button
                      onClick={startMission}
                      disabled={isLoading}
                      className="px-8 py-3 text-lg font-semibold"
                    >
                      {isLoading ? "Starting..." : "Start Mission"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {session.status === "ACTIVE" &&
              phaseStatus === "ACTIVE" &&
              currentPhase && (
                <CombatArenaLayout
                  phaseNumber={currentPhase.phaseNumber}
                  totalPhases={session.mission.totalPhases}
                  phaseStatus={phaseStatus}
                  monsters={currentPhase.monstersSpawned || []}
                  partyMembers={partyMembers}
                  environmentType={session.mission.environmentType}
                  remainingTime={remainingTime}
                  sessionId={session.id}
                  onPhaseComplete={handleMinigameComplete}
                />
              )}

            {session.status === "ACTIVE" &&
              phaseStatus === "RESTING" &&
              currentPhase && (
                <RestPhaseUI
                  sessionId={session.id}
                  currentPhase={currentPhase.phaseNumber}
                  totalPhases={session.mission.totalPhases}
                  partyMembers={getPartyHealthStatus.data || partyMembers}
                  onContinue={handleRestContinue}
                  restDuration={session.mission.restDuration}
                />
              )}

            {session.status === "ACTIVE" && phaseStatus === "PENDING" && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-4xl mb-4 animate-pulse">⏳</div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Preparing Phase {currentPhase?.phaseNumber || 1}
                  </h2>
                  <p className="text-gray-300">
                    Setting up the next combat encounter...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      {showCompletion && (
        <Modal
          isOpen={true}
          onClose={() => router.push("/game/hub")}
          title={
            session?.status === "COMPLETED"
              ? "Mission Complete!"
              : "Mission Failed"
          }
        >
          <div className="p-6 text-center">
            <div className="mb-6">
              {session?.status === "COMPLETED" ? (
                <div className="text-green-400 text-6xl mb-4">🎉</div>
              ) : (
                <div className="text-red-400 text-6xl mb-4">💀</div>
              )}
              <h2 className="text-2xl font-bold text-white mb-2">
                {session?.status === "COMPLETED"
                  ? "Congratulations!"
                  : "Mission Failed"}
              </h2>
              <p className="text-gray-300">
                {session?.status === "COMPLETED"
                  ? "You have successfully completed the mission!"
                  : "The mission has ended in failure."}
              </p>
            </div>

            {session?.status === "COMPLETED" && (
              <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Rewards Earned
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Experience:</span>
                    <span className="text-yellow-400 font-semibold">
                      +{session?.mission?.experienceReward || 0} XP
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Gold:</span>
                    <span className="text-yellow-400 font-semibold">
                      +{session?.mission?.baseReward || 0} Gold
                    </span>
                  </div>
                </div>

                {/* Loot Display */}
                {sessionLoot && sessionLoot.length > 0 && (
                  <div className="border-t border-gray-700 pt-4">
                    <h4 className="text-md font-semibold text-blue-400 mb-3">
                      Items Obtained
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {sessionLoot.map(
                        (
                          loot: {
                            itemName: string;
                            quantity: number;
                            rarity: string;
                            value: number;
                          },
                          index: number
                        ) => (
                          <div
                            key={index}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-300">
                                {loot.itemName} x{loot.quantity}
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  loot.rarity === "LEGENDARY"
                                    ? "bg-purple-600 text-purple-100"
                                    : loot.rarity === "RARE"
                                    ? "bg-blue-600 text-blue-100"
                                    : loot.rarity === "UNCOMMON"
                                    ? "bg-green-600 text-green-100"
                                    : "bg-gray-600 text-gray-100"
                                }`}
                              >
                                {loot.rarity}
                              </span>
                            </div>
                            <span className="text-gray-400 text-xs">
                              {loot.value * loot.quantity} gold value
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex space-x-4">
              <Button
                onClick={() => {
                  router.push("/game/hub");
                }}
                className="flex-1"
              >
                Return to Hub
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Loot Distribution Modal */}
      {session && (
        <LootDistributionModal
          isOpen={showLootModal}
          onClose={() => setShowLootModal(false)}
          sessionId={session.id}
          characterId={
            session.party?.members.find((member) => member.character)?.character
              ?.id || ""
          }
          isMasterLooter={false} // TODO: Get from session data when available
        />
      )}
    </div>
  );
}
