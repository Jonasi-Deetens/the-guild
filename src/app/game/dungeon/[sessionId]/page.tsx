"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import {
  Sword,
  Shield,
  Heart,
  Zap,
  Clock,
  Users,
  Star,
  Coins,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "@/components/icons";
import { useWebSocketStore } from "@/stores/websocket";

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
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<DungeonSession | null>(null);
  const [selectedAction, setSelectedAction] = useState<string>("WAIT");
  const [selectedTarget, setSelectedTarget] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionSubmitted, setActionSubmitted] = useState(false);

  const { currentSession, submitDungeonAction } = useWebSocketStore();

  useEffect(() => {
    if (currentSession && currentSession.sessionId === sessionId) {
      setTimeRemaining(
        Math.max(
          0,
          Math.floor(
            (new Date(currentSession.endsAt).getTime() - Date.now()) / 1000
          )
        )
      );
    }
  }, [currentSession, sessionId]);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining]);

  const handleActionSubmit = () => {
    if (selectedAction === "ATTACK" && !selectedTarget) {
      alert("Please select a target for attack");
      return;
    }

    submitDungeonAction({
      sessionId,
      action: selectedAction as any,
      targetId: selectedTarget || undefined,
    });

    setActionSubmitted(true);
    setShowActionModal(false);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "ATTACK":
        return <Sword className="h-4 w-4" />;
      case "DEFEND":
        return <Shield className="h-4 w-4" />;
      case "USE_ITEM":
        return <Zap className="h-4 w-4" />;
      case "FLEE":
        return <XCircle className="h-4 w-4" />;
      case "BETRAY":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "ATTACK":
        return "text-red-400";
      case "DEFEND":
        return "text-blue-400";
      case "USE_ITEM":
        return "text-green-400";
      case "FLEE":
        return "text-yellow-400";
      case "BETRAY":
        return "text-purple-400";
      default:
        return "text-gray-400";
    }
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            {session.mission.name}
          </h1>
          <p className="text-gray-300 mb-4">{session.mission.description}</p>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
            <span>
              Turn {session.currentTurn} of {session.maxTurns}
            </span>
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

        {/* Turn Timer */}
        {session.status === "ACTIVE" && timeRemaining > 0 && (
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

        <div className="grid lg:grid-cols-3 gap-6">
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
                  {session.party.members.map((member) => (
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
                          <span className="text-sm text-gray-400">Health</span>
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
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center Column - Action Selection */}
          <div className="space-y-4">
            {session.status === "ACTIVE" && !actionSubmitted && (
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Choose Your Action</CardTitle>
                  <CardDescription>
                    Select an action for this turn
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        id: "ATTACK",
                        label: "Attack",
                        icon: Sword,
                        color: "text-red-400",
                      },
                      {
                        id: "DEFEND",
                        label: "Defend",
                        icon: Shield,
                        color: "text-blue-400",
                      },
                      {
                        id: "USE_ITEM",
                        label: "Use Item",
                        icon: Zap,
                        color: "text-green-400",
                      },
                      {
                        id: "WAIT",
                        label: "Wait",
                        icon: Clock,
                        color: "text-gray-400",
                      },
                    ].map((action) => {
                      const Icon = action.icon;
                      return (
                        <Button
                          key={action.id}
                          variant={
                            selectedAction === action.id ? "default" : "outline"
                          }
                          className="justify-start"
                          onClick={() => setSelectedAction(action.id)}
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {action.label}
                        </Button>
                      );
                    })}
                  </div>

                  {selectedAction === "ATTACK" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">
                        Select Target
                      </label>
                      <select
                        value={selectedTarget}
                        onChange={(e) => setSelectedTarget(e.target.value)}
                        className="w-full p-2 rounded-lg border border-gray-600 bg-gray-800 text-white"
                      >
                        <option value="">Choose target...</option>
                        {session.party.members.map((member) => (
                          <option
                            key={member.character.id}
                            value={member.character.id}
                          >
                            {member.character.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={handleActionSubmit}
                    disabled={selectedAction === "ATTACK" && !selectedTarget}
                  >
                    Submit Action
                  </Button>
                </CardContent>
              </Card>
            )}

            {actionSubmitted && (
              <Card className="glass border-green-500/50">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                  <p className="text-white font-medium">Action Submitted!</p>
                  <p className="text-sm text-gray-400">
                    Waiting for other players...
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Turn Results */}
            {session.turns.length > 0 && (
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Turn Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {session.turns.map((turn, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-2 rounded-lg bg-gray-800/30"
                      >
                        {getActionIcon(turn.action)}
                        <div className="flex-1">
                          <p className="text-sm text-white">
                            {turn.character.name} {turn.action.toLowerCase()}
                            {turn.damage && ` for ${turn.damage} damage`}
                            {turn.healing &&
                              ` and heals for ${turn.healing} HP`}
                          </p>
                        </div>
                        {turn.isResolved && (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Loot */}
          <div className="space-y-4">
            {session.loot.length > 0 && (
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Coins className="h-5 w-5 mr-2 text-yellow-400" />
                    Loot
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {session.loot.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-gray-800/50"
                      >
                        <div>
                          <p className="text-white font-medium">
                            {item.item.name}
                          </p>
                          <p className="text-sm text-gray-400">
                            {item.item.type} • {item.quantity}x
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-yellow-400">
                            {item.item.value}g
                          </span>
                          {item.claimedBy ? (
                            <span className="text-xs text-green-400">
                              Claimed
                            </span>
                          ) : (
                            <Button size="sm">Claim</Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
