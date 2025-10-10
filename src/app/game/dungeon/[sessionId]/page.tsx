"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import {
  Heart,
  Clock,
  Users,
  Star,
  MessageCircle,
  Send,
} from "@/components/icons";
import { useWebSocketStore } from "@/stores/websocket";
import { TimelineViewer, EventCard } from "@/components/game/timeline";
import { MinigameContainer } from "@/components/game/minigames";
import { api } from "@/trpc/react";

interface DungeonSession {
  id: string;
  status: string;
  currentTurn: number;
  maxTurns: number;
  turnTimeLimit: number;
  turnEndsAt: string | null;
  mission: {
    name: string;
    description: string;
    difficulty: number;
    baseReward: number;
    experienceReward: number;
  };
  party: {
    members: Array<{
      character: {
        id: string;
        name: string;
        level: number;
        health: number;
        maxHealth: number;
        attack: number;
        defense: number;
        speed: number;
        perception: number;
      };
      isReady: boolean;
    }>;
  };
  turns: Array<{
    character: {
      name: string;
    };
    action: string;
    targetId: string | null;
    damage: number | null;
    healing: number | null;
    isResolved: boolean;
  }>;
  loot: Array<{
    id: string;
    item: {
      name: string;
      type: string;
      value: number;
    };
    quantity: number;
    claimedBy: string | null;
  }>;
}

export default function DungeonPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<DungeonSession | null>(null);
  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const [playerPositions, setPlayerPositions] = useState<
    Record<string, string>
  >({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [actionSubmitted, setActionSubmitted] = useState(false);
  const [showMinigame, setShowMinigame] = useState(false);
  const [minigameResult, setMinigameResult] = useState<any>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");

  // WebSocket store for party chat
  const { partyChat, sendPartyMessage } = useWebSocketStore();

  // tRPC queries
  const { data: sessionData, refetch: refetchSession } =
    api.dungeon.getSession.useQuery({ sessionId }, { enabled: !!sessionId });

  const { data: currentEventData, refetch: refetchEvent } =
    api.dungeonEvent.getCurrentEvent.useQuery(
      { sessionId },
      { enabled: !!sessionId }
    );

  const { data: timelineData, refetch: refetchTimeline } =
    api.dungeonEvent.getTimeline.useQuery(
      { sessionId },
      { enabled: !!sessionId }
    );

  const { data: playerActionStatus } =
    api.dungeonEvent.getPlayerActionStatus.useQuery(
      { eventId: currentEvent?.id },
      { enabled: !!currentEvent?.id }
    );

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Mutations
  const submitEventActionMutation =
    api.dungeonEvent.submitEventAction.useMutation();

  // Update state when data changes
  useEffect(() => {
    if (sessionData) {
      setSession(sessionData);
    }
  }, [sessionData]);

  useEffect(() => {
    if (currentEventData) {
      setCurrentEvent(currentEventData);

      // Reset action submitted state when a new event starts
      if (currentEventData.status === "ACTIVE") {
        setActionSubmitted(false);
      }
    }
  }, [currentEventData]);

  useEffect(() => {
    if (timelineData) {
      setPlayerPositions(
        timelineData.events.reduce(
          (acc: Record<string, string>, event: any) => {
            event.playerActions?.forEach((action: any) => {
              acc[action.characterId] = event.id;
            });
            return acc;
          },
          {}
        )
      );
    }
  }, [timelineData]);

  useEffect(() => {
    if (playerActionStatus) {
      setActionSubmitted(playerActionStatus.hasSubmitted);
    }
  }, [playerActionStatus]);

  // Timer for current event - fixed to prevent resetting
  useEffect(() => {
    if (
      currentEvent?.template?.config?.timeLimit &&
      currentEvent.status === "ACTIVE"
    ) {
      const timeLimit = currentEvent.template.config.timeLimit;
      setTimeRemaining(timeLimit);

      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [
    currentEvent?.id,
    currentEvent?.status,
    currentEvent?.template?.config?.timeLimit,
  ]); // Include timeLimit in dependencies

  // WebSocket event listeners
  const lastEvent = useWebSocketStore((state) => state.lastEvent);
  const levelUpNotification = useWebSocketStore(
    (state) => state.levelUpNotification
  );
  const experienceUpdateNotification = useWebSocketStore(
    (state) => state.experienceUpdateNotification
  );

  useEffect(() => {
    if (
      lastEvent?.type === "eventCompleted" &&
      lastEvent.sessionId === sessionId
    ) {
      refetchEvent();
      refetchSession();
      refetchTimeline();
      setActionSubmitted(false);
    }
    if (
      lastEvent?.type === "dungeonCompleted" &&
      lastEvent.sessionId === sessionId
    ) {
      refetchEvent();
      refetchSession();
      refetchTimeline();
      // Invalidate character and statistics cache
      utils.character.getCurrent.invalidate();
      utils.statistics.getPerformanceSummary.invalidate();
      utils.statistics.getEventTypeBreakdown.invalidate();
      utils.statistics.getRecentDungeons.invalidate();
    }
  }, [
    lastEvent,
    sessionId,
    refetchEvent,
    refetchSession,
    refetchTimeline,
    utils,
  ]);

  // Handle level-up and experience update notifications and invalidate character queries
  useEffect(() => {
    if (levelUpNotification || experienceUpdateNotification) {
      console.log(
        "🔄 [Dungeon] Invalidating character queries due to notification:",
        {
          levelUpNotification,
          experienceUpdateNotification,
        }
      );
      // Invalidate character query to refresh the UI with updated stats and experience
      utils.character.getCurrent.invalidate();
    }
  }, [levelUpNotification, experienceUpdateNotification, utils]);

  // Polling fallback - refetch data every 3 seconds
  useEffect(() => {
    if (!sessionId) return;

    const pollInterval = setInterval(() => {
      refetchEvent();
      refetchSession();
      refetchTimeline();
    }, 3000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [sessionId, refetchEvent, refetchSession, refetchTimeline]);

  useEffect(() => {
    if (session?.status === "COMPLETED" || session?.status === "FAILED") {
      setShowCompletion(true);
    }
  }, [session?.status]);

  const handleEventActionSubmit = (actionType: string, actionData: any) => {
    if (!currentEvent) return;

    submitEventActionMutation.mutate(
      {
        eventId: currentEvent.id,
        actionType,
        actionData: { ...actionData, minigameResult },
      },
      {
        onSuccess: () => {
          setActionSubmitted(true);
          setShowMinigame(false);
          setMinigameResult(null);
          // Refetch timeline to update event statuses
          refetchTimeline();
        },
        onError: (error) => {
          console.error("Failed to submit action:", error);
          alert("Failed to submit action. Please try again.");
        },
      }
    );
  };

  const handleMinigameComplete = (result: any) => {
    setMinigameResult(result);
    setShowMinigame(false);
  };

  const handleSendChatMessage = () => {
    if (chatMessage.trim() && session?.party) {
      const currentCharacter = getCurrentCharacter();
      sendPartyMessage({
        message: chatMessage.trim(),
        sender: currentCharacter?.name || "Unknown",
        timestamp: new Date().toISOString(),
      });
      setChatMessage("");
    }
  };

  const getCurrentCharacter = () => {
    // For party missions, return the first member (works for solo too)
    if (session?.party?.members && session.party.members.length > 0) {
      return session.party.members[0]?.character;
    }

    // For solo missions without party data, try to get character from events
    if (
      session &&
      "events" in session &&
      session.events &&
      (session.events as any).length > 0
    ) {
      const characterActions = (session as any).events
        .flatMap((event: any) => event.playerActions)
        .map((action: any) => action.character);
      return characterActions[0];
    }

    return null;
  };

  const getPlayerStats = () => {
    const character = getCurrentCharacter();
    if (!character) {
      // Return default stats if character not found
      // This can happen during initial loading or if there's a data issue
      return {
        speed: 5,
        perception: 5,
        attack: 10,
        defense: 5,
      };
    }
    return {
      speed: character.speed || 5,
      perception: character.perception || 5,
      attack: character.attack || 10,
      defense: character.defense || 5,
    };
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading dungeon session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            {session.mission.name}
          </h1>
          <p className="text-gray-300 mb-4">{session.mission.description}</p>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
            <span>Status: {session.status}</span>
            <span>•</span>
            <span>
              Difficulty:{" "}
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`inline h-4 w-4 ${
                    i < session.mission.difficulty
                      ? "text-yellow-400"
                      : "text-gray-600"
                  }`}
                />
              ))}
            </span>
          </div>
        </div>

        {/* Event Timer */}
        {currentEvent &&
          currentEvent.status === "ACTIVE" &&
          timeRemaining > 0 && (
            <Card className="glass border-red-500/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-center space-x-2">
                  <Clock className="h-5 w-5 text-red-400" />
                  <span className="text-lg font-semibold text-white">
                    Time Remaining: {Math.floor(timeRemaining / 60)}:
                    {(timeRemaining % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

        {/* Timeline Viewer */}
        {timelineData && (
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-400" />
                Dungeon Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TimelineViewer
                events={timelineData?.events || []}
                playerPositions={playerPositions}
              />
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Party Members */}
          <div className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-400" />
                  Party Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {session.party?.members?.length ? (
                    session.party.members.map((member) => (
                      <div
                        key={member.character.id}
                        className="p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-medium">
                            {member.character.name}
                          </h4>
                          <span className="text-sm text-gray-400">
                            Lv.{member.character.level}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">
                              Health
                            </span>
                            <div className="flex items-center space-x-2">
                              <Heart className="h-4 w-4 text-red-400" />
                              <span className="text-sm text-white">
                                {member.character.health}/
                                {member.character.maxHealth}
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-red-500 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${
                                  (member.character.health /
                                    member.character.maxHealth) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Attack:</span>
                              <span className="text-orange-400">
                                {member.character.attack}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Defense:</span>
                              <span className="text-blue-400">
                                {member.character.defense}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-400">
                      <p>No party members found.</p>
                      <p className="text-sm mt-1">
                        This might be a solo mission.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Party Chat */}
            {session?.party && (
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="h-5 w-5" />
                      <span>Party Chat</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowChat(!showChat)}
                    >
                      {showChat ? "Hide" : "Show"}
                    </Button>
                  </CardTitle>
                </CardHeader>
                {showChat && (
                  <CardContent className="space-y-4">
                    {/* Chat Messages */}
                    <div className="h-48 overflow-y-auto space-y-2 border border-gray-700 rounded-lg p-3">
                      {partyChat.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center">
                          No messages yet. Start the conversation!
                        </p>
                      ) : (
                        partyChat.map((message, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-semibold text-blue-400">
                              {message.sender}:
                            </span>
                            <span className="text-gray-300 ml-2">
                              {message.message}
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Chat Input */}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleSendChatMessage();
                          }
                        }}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <Button
                        onClick={handleSendChatMessage}
                        disabled={!chatMessage.trim()}
                        size="sm"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            )}
          </div>

          {/* Right Column - Current Event */}
          <div className="space-y-4">
            {currentEvent && (
              <EventCard
                event={currentEvent}
                onActionSubmit={handleEventActionSubmit}
                playerStats={getPlayerStats()}
                hasSubmitted={actionSubmitted}
              />
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
                  playerStats={getPlayerStats()}
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
                  // Invalidate all relevant caches before returning to hub
                  utils.character.getCurrent.invalidate();
                  utils.statistics.getPerformanceSummary.invalidate();
                  utils.statistics.getEventTypeBreakdown.invalidate();
                  utils.statistics.getRecentDungeons.invalidate();
                  utils.party.getMyCurrent.invalidate();
                  router.push("/game/hub");
                }}
                className="flex-1"
              >
                Return to Hub
              </Button>
              {session?.status === "COMPLETED" && (
                <Button
                  onClick={() => {
                    // Invalidate all relevant caches before returning to hub
                    utils.character.getCurrent.invalidate();
                    utils.statistics.getPerformanceSummary.invalidate();
                    utils.statistics.getEventTypeBreakdown.invalidate();
                    utils.statistics.getRecentDungeons.invalidate();
                    utils.party.getMyCurrent.invalidate();
                    router.push("/game/hub");
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Claim Rewards
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
