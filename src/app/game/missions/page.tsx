"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  Sword,
  Search,
  Star,
  Users,
  Clock,
  Coins,
  Zap,
  Shield,
  Eye,
  Heart,
  Lock,
  CheckCircle,
  XCircle,
  Crown,
  AlertTriangle,
} from "@/components/icons";
import { api } from "@/trpc/react";
import { EnvironmentBackground } from "@/components/game/EnvironmentBackground";

interface Mission {
  id: string;
  name: string;
  description: string;
  difficulty: number;
  minLevel: number;
  maxPlayers: number;
  minPlayers: number;
  baseReward: number;
  experienceReward: number;
  isActive: boolean;
}

export default function MissionsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(
    null
  );
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [startError, setStartError] = useState("");

  // tRPC Queries
  const { data: missions, isLoading: missionsLoading } =
    api.mission.getAll.useQuery();
  const { data: character, isLoading: characterLoading } =
    api.character.getCurrent.useQuery();
  const { data: myCurrentParty, refetch: refetchParty } =
    api.party.getMyCurrent.useQuery();
  const startPartySessionMutation = api.dungeon.startPartySession.useMutation();
  const startSoloSessionMutation = api.dungeon.startSoloSession.useMutation();
  const leavePartyMutation = api.party.leave.useMutation();

  // Loading state
  if (missionsLoading || characterLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading missions...</p>
        </div>
      </div>
    );
  }

  // Helper functions
  const isLocked = (mission: Mission) => {
    return character && character.level < mission.minLevel;
  };

  const handleMissionClick = (mission: Mission) => {
    setSelectedMission(mission);
    setShowMissionModal(true);
    setStartError("");
  };

  const handleLeaveParty = async () => {
    try {
      await leavePartyMutation.mutateAsync();
      // Refetch party data to update UI
      await refetchParty();
    } catch (error) {
      console.error("Failed to leave party:", error);
      setStartError(
        error instanceof Error ? error.message : "Failed to leave party"
      );
    }
  };

  const handleStartMission = async () => {
    if (!selectedMission || !character) return;

    setStartError("");

    // Check if this is a solo mission
    const isSoloMission =
      selectedMission.minPlayers === 1 && selectedMission.maxPlayers === 1;

    if (isSoloMission) {
      // Solo mission logic
      if (character.level < selectedMission.minLevel) {
        setStartError(
          `You need to be level ${selectedMission.minLevel} (currently level ${character.level})`
        );
        return;
      }

      if (myCurrentParty) {
        setStartError(
          "You cannot start a solo mission while in a party. Leave your party first."
        );
        return;
      }

      try {
        const session = await startSoloSessionMutation.mutateAsync({
          missionId: selectedMission.id,
        });

        // Success! Redirect to dungeon
        router.push(`/game/dungeon/${session.id}`);
      } catch (error) {
        console.error("Failed to start solo mission:", error);
        setStartError(
          error instanceof Error
            ? error.message
            : "Failed to start solo mission"
        );
      }
    } else {
      // Party mission logic
      if (!myCurrentParty) {
        setStartError("You need to be in a party to start this mission");
        return;
      }

      if (myCurrentParty.leaderId !== character.id) {
        setStartError("Only the party leader can start missions");
        return;
      }

      const partySize = myCurrentParty.members?.length || 0;
      if (partySize < selectedMission.minPlayers) {
        setStartError(
          `Your party needs at least ${selectedMission.minPlayers} members (currently ${partySize})`
        );
        return;
      }

      if (partySize > selectedMission.maxPlayers) {
        setStartError(
          `Your party has too many members for this mission (max ${selectedMission.maxPlayers})`
        );
        return;
      }

      const allReady = myCurrentParty.members?.every((m) => m.isReady);
      if (!allReady) {
        setStartError("Not all party members are ready");
        return;
      }

      if (character.level < selectedMission.minLevel) {
        setStartError(
          `You need to be level ${selectedMission.minLevel} (currently level ${character.level})`
        );
        return;
      }

      try {
        const session = await startPartySessionMutation.mutateAsync({
          missionId: selectedMission.id,
        });

        // Success! Redirect to dungeon
        router.push(`/game/dungeon/${session.id}`);
      } catch (error) {
        console.error("Failed to start mission:", error);
        setStartError(
          error instanceof Error ? error.message : "Failed to start mission"
        );
      }
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1:
        return "text-green-400";
      case 2:
        return "text-yellow-400";
      case 3:
        return "text-orange-400";
      case 4:
        return "text-red-400";
      case 5:
        return "text-purple-400";
      default:
        return "text-gray-400";
    }
  };

  const getDifficultyLabel = (difficulty: number) => {
    switch (difficulty) {
      case 1:
        return "Easy";
      case 2:
        return "Normal";
      case 3:
        return "Hard";
      case 4:
        return "Expert";
      case 5:
        return "Legendary";
      default:
        return "Unknown";
    }
  };

  const getDifficultyIcon = (difficulty: number) => {
    switch (difficulty) {
      case 1:
        return <Shield className="h-4 w-4" />;
      case 2:
        return <Sword className="h-4 w-4" />;
      case 3:
        return <Zap className="h-4 w-4" />;
      case 4:
        return <Eye className="h-4 w-4" />;
      case 5:
        return <Heart className="h-4 w-4" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  const filteredMissions = (missions || []).filter((mission) => {
    const matchesSearch =
      mission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mission.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty =
      selectedDifficulty === null || mission.difficulty === selectedDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <div className="relative h-full overflow-hidden">
      <EnvironmentBackground environmentType="missions" />

      {/* Main content with relative z-index and max height */}
      <div className="relative z-10 p-6 space-y-6 h-full overflow-y-auto">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Missions</h1>
          <p className="text-gray-300">Choose your next adventure</p>
        </div>

        {/* Filters */}
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search missions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-300">Difficulty:</span>
                <select
                  value={selectedDifficulty || ""}
                  onChange={(e) =>
                    setSelectedDifficulty(
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className="px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white"
                >
                  <option value="">All</option>
                  <option value="1">Easy</option>
                  <option value="2">Normal</option>
                  <option value="3">Hard</option>
                  <option value="4">Expert</option>
                  <option value="5">Legendary</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Missions Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMissions.map((mission) => {
            const locked = isLocked(mission);
            return (
              <Card
                key={mission.id}
                className={`glass transition-transform duration-300 cursor-pointer ${
                  locked
                    ? "opacity-60 grayscale"
                    : "hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20"
                }`}
                onClick={() => !locked && handleMissionClick(mission)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-xl">{mission.name}</CardTitle>
                    <div
                      className={`flex items-center space-x-1 ${getDifficultyColor(
                        mission.difficulty
                      )}`}
                    >
                      {getDifficultyIcon(mission.difficulty)}
                      <span className="text-sm font-medium">
                        {getDifficultyLabel(mission.difficulty)}
                      </span>
                    </div>
                  </div>
                  <CardDescription className="text-sm">
                    {mission.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Mission Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Level:</span>
                      <span className="text-white">{mission.minLevel}+</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Players:</span>
                      <span
                        className={`${
                          mission.minPlayers === 1 && mission.maxPlayers === 1
                            ? "text-blue-400 font-semibold"
                            : "text-white"
                        }`}
                      >
                        {mission.minPlayers === 1 && mission.maxPlayers === 1
                          ? "Solo"
                          : `${mission.minPlayers}-${mission.maxPlayers}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Reward:</span>
                      <span className="text-yellow-400 flex items-center">
                        <Coins className="h-4 w-4 mr-1" />
                        {mission.baseReward}g
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">XP:</span>
                      <span className="text-green-400">
                        {mission.experienceReward}
                      </span>
                    </div>
                  </div>

                  {/* Difficulty Stars */}
                  <div className="flex items-center space-x-1">
                    <span className="text-sm text-gray-400">Difficulty:</span>
                    <div className="flex space-x-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < mission.difficulty
                              ? getDifficultyColor(mission.difficulty)
                              : "text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Locked Badge or Action Button */}
                  {locked ? (
                    <div className="flex items-center justify-center p-3 rounded-lg bg-red-900/20 border border-red-500/30">
                      <Lock className="h-4 w-4 mr-2 text-red-400" />
                      <span className="text-sm text-red-300">
                        Requires Level {mission.minLevel}
                      </span>
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMissionClick(mission);
                      }}
                    >
                      <Sword className="h-4 w-4 mr-2" />
                      View Mission
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* No Results */}
        {filteredMissions.length === 0 && (
          <Card className="glass">
            <CardContent className="p-8 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No missions found
              </h3>
              <p className="text-gray-400">
                Try adjusting your search criteria or difficulty filter.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Mission Categories */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass hover:scale-105 transition-transform duration-300 cursor-pointer">
            <CardContent className="p-4 text-center">
              <Shield className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-white mb-1">
                Beginner
              </h3>
              <p className="text-sm text-gray-400">
                Easy missions for new players
              </p>
            </CardContent>
          </Card>

          <Card className="glass hover:scale-105 transition-transform duration-300 cursor-pointer">
            <CardContent className="p-4 text-center">
              <Sword className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-white mb-1">
                Intermediate
              </h3>
              <p className="text-sm text-gray-400">
                Challenging missions for experienced players
              </p>
            </CardContent>
          </Card>

          <Card className="glass hover:scale-105 transition-transform duration-300 cursor-pointer">
            <CardContent className="p-4 text-center">
              <Zap className="h-8 w-8 text-orange-400 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-white mb-1">
                Advanced
              </h3>
              <p className="text-sm text-gray-400">
                Difficult missions for skilled players
              </p>
            </CardContent>
          </Card>

          <Card className="glass hover:scale-105 transition-transform duration-300 cursor-pointer">
            <CardContent className="p-4 text-center">
              <Heart className="h-8 w-8 text-red-400 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-white mb-1">
                Legendary
              </h3>
              <p className="text-sm text-gray-400">
                Epic missions for the most daring adventurers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Mission Detail Modal */}
        {selectedMission && (
          <Modal
            isOpen={showMissionModal}
            onClose={() => {
              setShowMissionModal(false);
              setStartError("");
            }}
            title={selectedMission.name}
          >
            <div className="space-y-4">
              {/* Description */}
              <p className="text-gray-300">{selectedMission.description}</p>

              {/* Mission Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                    <span className="text-sm text-gray-400">Difficulty:</span>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < selectedMission.difficulty
                              ? getDifficultyColor(selectedMission.difficulty)
                              : "text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                    <span className="text-sm text-gray-400">
                      Level Required:
                    </span>
                    <span className="text-white font-medium">
                      {selectedMission.minLevel}+
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                    <span className="text-sm text-gray-400">Players:</span>
                    <span
                      className={`font-medium ${
                        selectedMission.minPlayers === 1 &&
                        selectedMission.maxPlayers === 1
                          ? "text-blue-400"
                          : "text-white"
                      }`}
                    >
                      {selectedMission.minPlayers === 1 &&
                      selectedMission.maxPlayers === 1
                        ? "Solo"
                        : `${selectedMission.minPlayers}-${selectedMission.maxPlayers}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                    <span className="text-sm text-gray-400">Rewards:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-yellow-400">
                        {selectedMission.baseReward}g
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-green-400">
                        {selectedMission.experienceReward} XP
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Party Status */}
              <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Party Status
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">In Party:</span>
                    {myCurrentParty ? (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-sm text-green-400">
                          Yes ({myCurrentParty.members?.length || 0} members)
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <XCircle className="h-4 w-4 text-red-400" />
                        <span className="text-sm text-red-400">No</span>
                      </div>
                    )}
                  </div>
                  {myCurrentParty && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">
                          Party Leader:
                        </span>
                        {myCurrentParty.leaderId === character?.id ? (
                          <div className="flex items-center space-x-2">
                            <Crown className="h-4 w-4 text-yellow-400" />
                            <span className="text-sm text-yellow-400">You</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-300">
                            {myCurrentParty.leader?.name || "Unknown"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">
                          All Ready:
                        </span>
                        {myCurrentParty.members?.every((m) => m.isReady) ? (
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <span className="text-sm text-green-400">Yes</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-yellow-400" />
                            <span className="text-sm text-yellow-400">
                              Waiting
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="pt-2 space-y-2">
                        <Button
                          onClick={handleLeaveParty}
                          disabled={leavePartyMutation.isPending}
                          variant="outline"
                          size="sm"
                          className="w-full text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                        >
                          {leavePartyMutation.isPending
                            ? "Leaving..."
                            : "Leave Party"}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {startError && (
                <div className="p-3 rounded-lg bg-red-900/50 border border-red-500/50 flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-300">{startError}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowMissionModal(false);
                    setStartError("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStartMission}
                  disabled={
                    (selectedMission.minPlayers > 1 && !myCurrentParty) ||
                    (selectedMission.minPlayers > 1 &&
                      myCurrentParty?.leaderId !== character?.id) ||
                    startPartySessionMutation.isPending ||
                    startSoloSessionMutation.isPending
                  }
                  className="flex-1"
                >
                  {startPartySessionMutation.isPending ||
                  startSoloSessionMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Starting...
                    </>
                  ) : (
                    <>
                      <Sword className="h-4 w-4 mr-2" />
                      {selectedMission.minPlayers === 1 &&
                      selectedMission.maxPlayers === 1
                        ? "Start Solo Mission"
                        : "Start Mission"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
