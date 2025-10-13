"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Clock, Star } from "@/components/icons";
import { EventCard } from "@/components/game/EventCard";
import { MinigameContainer } from "@/components/game/minigames";
import { PartyMembersSidebar } from "@/components/game/PartyMembersSidebar";
import { MissionAnimation } from "@/components/game/MissionAnimation";
import { EnvironmentBackground } from "@/components/game/EnvironmentBackground";
import { useDungeonSession } from "@/contexts/DungeonSessionContext";

export default function DungeonPage() {
  const router = useRouter();

  const {
    session,
    currentEvent,
    partyMembers,
    playerStats,
    remainingTime,
    showMinigame,
    setShowMinigame,
    showCompletion,
    partyChat,
    hasPlayerSubmittedAction,
    isLoading,
    startMission,
    submitAction,
    sendChatMessage,
  } = useDungeonSession();

  const handleMinigameComplete = (result: unknown) => {
    setShowMinigame(false);
    submitAction("minigame_complete", result);
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
      <div className="relative z-10 flex w-full">
        {/* Party Members Sidebar */}
        <PartyMembersSidebar
          partyMembers={partyMembers}
          partyChat={partyChat}
          onSendMessage={sendChatMessage}
        />

        {/* Main Game Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
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
            </div>
          </div>

          {/* Mission Timer */}
          {session.status === "ACTIVE" && (
            <div className="p-4 border-b border-amber-900/30">
              <div className="flex items-center justify-center space-x-2">
                <Clock className="h-5 w-5 text-blue-400" />
                <span className="text-lg font-semibold text-white">
                  Time Remaining: {Math.floor(remainingTime / 60)}:
                  {(remainingTime % 60).toString().padStart(2, "0")}
                </span>
                {session.pausedAt && (
                  <span className="text-sm text-yellow-400 ml-2">
                    (Paused for event)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Main Game Window */}
          <div className="flex-1 overflow-y-auto p-6">
            {session.status === "WAITING" && (
              <div className="flex items-center justify-center h-full">
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
                    </div>

                    {/* Start Button */}
                    <Button
                      onClick={startMission}
                      disabled={isLoading}
                      className="px-8 py-3 text-lg font-semibold"
                    >
                      {isLoading ? "Starting..." : "Start Mission"}
                    </Button>

                    {/* Environment-specific decorations */}
                    <div className="mt-6 text-3xl opacity-40">
                      {session.mission.environmentType === "training_ground" &&
                        "🥋"}
                      {session.mission.environmentType === "dungeon_corridor" &&
                        "🏰"}
                      {session.mission.environmentType === "cave" && "🕳️"}
                      {session.mission.environmentType === "forest" && "🌲"}
                      {session.mission.environmentType === "crypt" && "⚰️"}
                      {session.mission.environmentType === "ruins" && "🏛️"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {session.status === "ACTIVE" && !currentEvent && (
              <MissionAnimation
                environmentType={session.mission.environmentType}
                remainingTime={remainingTime}
                totalDuration={session.mission.baseDuration}
                className="h-full"
              />
            )}

            {session.status === "ACTIVE" && currentEvent && (
              <div className="max-w-4xl mx-auto">
                <EventCard
                  event={currentEvent}
                  onActionSubmit={submitAction}
                  playerStats={playerStats}
                  hasSubmitted={hasPlayerSubmittedAction}
                  partyMembers={partyMembers}
                />
              </div>
            )}

            {/* Minigame Modal */}
            {showMinigame && currentEvent?.template?.minigameType && (
              <Modal
                isOpen={showMinigame}
                onClose={() => setShowMinigame(false)}
                title="Minigame"
              >
                <MinigameContainer
                  type={currentEvent.template.minigameType}
                  config={currentEvent.template.config}
                  onComplete={handleMinigameComplete}
                  playerStats={playerStats}
                  partyMembers={partyMembers}
                />
              </Modal>
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
                <div className="grid grid-cols-2 gap-4 text-sm">
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
    </div>
  );
}
