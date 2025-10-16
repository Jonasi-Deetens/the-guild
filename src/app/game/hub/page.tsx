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
  Users,
  Sword,
  MessageCircle,
  Search,
  Plus,
  Crown,
  Star,
  Coins,
  Heart,
  Zap,
  AlertTriangle,
  XCircle,
  Package,
} from "@/components/icons";
import PlayerInteractionMenu from "@/components/game/PlayerInteractionMenu";
import { EnvironmentBackground } from "@/components/game/EnvironmentBackground";
import { api } from "@/trpc/react";

export default function HubPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [showInteractionMenu, setShowInteractionMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createForm, setCreateForm] = useState({
    name: "",
    isPublic: false,
    maxMembers: 5,
  });

  // tRPC queries and mutations
  const createPartyMutation = api.party.create.useMutation();
  const leavePartyMutation = api.party.leave.useMutation();
  const restMutation = api.character.rest.useMutation();
  const { data: myCurrentParty, refetch: refetchMyParty } =
    api.party.getMyCurrent.useQuery();
  const { data: character } = api.character.getCurrent.useQuery();
  const { data: goldAmount } = api.character.getGoldAmount.useQuery();
  const { data: onlinePlayers = [], isLoading: playersLoading } =
    api.character.getOnline.useQuery();

  const { data: inventory = [] } = api.character.getInventory.useQuery();

  const giveStartingItemsMutation =
    api.character.giveStartingItems.useMutation();

  const recentActivity = [
    {
      id: "1",
      message: "ShadowThief stole 50 gold from MerchantKing",
      type: "theft",
      timestamp: "2m ago",
    },
    {
      id: "2",
      message: 'HolyPaladin completed "Goblin Cave" mission',
      type: "mission",
      timestamp: "5m ago",
    },
    {
      id: "3",
      message: "DungeonMaster created a new party",
      type: "party",
      timestamp: "8m ago",
    },
    {
      id: "4",
      message: "LoneWolf traded with MerchantKing",
      type: "trade",
      timestamp: "12m ago",
    },
  ];

  const { data: allMissions } = api.mission.getAll.useQuery();
  const availableMissions = (allMissions || []).slice(0, 3);

  const handlePlayerClick = (player: any) => {
    setSelectedPlayer(player);
    setShowInteractionMenu(true);
  };

  const handleTradeRequest = (data: any) => {
    // TODO: Implement trade request via tRPC
    console.log("Trade request:", data);
  };

  const handleTheftAttempt = (data: any) => {
    // TODO: Implement theft attempt via tRPC
    console.log("Theft attempt:", data);
  };

  const handleSendMessage = (message: string) => {
    // TODO: Implement message sending via WebSocket
    console.log("Send message:", message);
  };

  const handleCreateParty = async () => {
    try {
      setCreateError("");
      await createPartyMutation.mutateAsync(createForm);
      setShowCreateModal(false);
      setCreateForm({ name: "", isPublic: false, maxMembers: 5 });
      await refetchMyParty();
    } catch (error) {
      console.error("Failed to create party:", error);
      setCreateError("Failed to create party. You may already be in a party.");
    }
  };

  const handleLeaveParty = async () => {
    try {
      await leavePartyMutation.mutateAsync();
      await refetchMyParty();
    } catch (error) {
      console.error("Failed to leave party:", error);
    }
  };

  return (
    <div className="relative h-full overflow-hidden">
      <EnvironmentBackground environmentType="inn" />

      {/* Main content with relative z-index and max height */}
      <div className="relative z-10 p-6 space-y-6 h-full overflow-y-auto">
        {/* Welcome Section */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome to The Guild Hub
          </h1>
          <p className="text-gray-300">
            A living society where every choice shapes your destiny
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Online Players */}
          <div className="space-y-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-400" />
                  Online Players ({onlinePlayers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {playersLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center space-x-3 p-3 rounded-lg bg-gray-800/50"
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-700 rounded w-24 mb-2 animate-pulse"></div>
                            <div className="h-3 bg-gray-700 rounded w-16 animate-pulse"></div>
                          </div>
                          <div className="h-4 w-12 bg-gray-700 rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    onlinePlayers
                      .filter((player) => player.id !== character?.id) // Filter out current user
                      .map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors cursor-pointer"
                          onClick={() => handlePlayerClick(player)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                              {player.name[0]}
                            </div>
                            <div>
                              <div className="text-white font-medium">
                                {player.name}
                              </div>
                              <div className="text-sm text-gray-400">
                                Lv.{player.level}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-sm ${
                                player.reputation >= 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {player.reputation > 0 ? "+" : ""}
                              {player.reputation}
                            </span>
                            <Button size="sm" variant="ghost">
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {myCurrentParty ? (
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={handleLeaveParty}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Leave Party
                  </Button>
                ) : (
                  <Button
                    className="w-full justify-start"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Party
                  </Button>
                )}

                {/* Starting Items Button - only show if character has no items */}
                {inventory.length === 0 && (
                  <Button
                    className="w-full justify-start"
                    onClick={async () => {
                      try {
                        const result =
                          await giveStartingItemsMutation.mutateAsync();
                        alert(result.message);
                      } catch (error) {
                        alert(
                          error instanceof Error
                            ? error.message
                            : "Failed to get starting items"
                        );
                      }
                    }}
                    disabled={giveStartingItemsMutation.isPending}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    {giveStartingItemsMutation.isPending
                      ? "Getting Items..."
                      : "Get Starting Items"}
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push("/game/missions")}
                >
                  <Sword className="h-4 w-4 mr-2" />
                  Browse Missions
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Global Chat
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Center Column - Activity Feed */}
          <div className="space-y-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-yellow-400" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-3 p-3 rounded-lg bg-gray-800/30 hover:bg-gray-700/30 transition-colors"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${
                          activity.type === "theft"
                            ? "bg-red-400"
                            : activity.type === "mission"
                            ? "bg-green-400"
                            : activity.type === "party"
                            ? "bg-blue-400"
                            : "bg-yellow-400"
                        }`}
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-300">
                          {activity.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Character Stats, Missions & Stats */}
          <div className="space-y-6">
            {/* Character Stats */}
            {character && (
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Heart className="h-5 w-5 mr-2 text-red-400" />
                    Character Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Health Bar */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Health</span>
                        <span className="text-sm text-white">
                          {character.currentHealth}/{character.maxHealth}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${
                              (character.currentHealth / character.maxHealth) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Level:</span>
                        <span className="text-white font-semibold">
                          {character.level}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Gold:</span>
                        <span className="text-yellow-400 font-semibold">
                          {goldAmount || character.gold}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Attack:</span>
                        <span className="text-white">{character.attack}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Defense:</span>
                        <span className="text-white">{character.defense}</span>
                      </div>
                    </div>

                    {/* Rest Actions */}
                    {character.currentHealth < character.maxHealth && (
                      <div className="pt-4 border-t border-gray-700">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              restMutation.mutate(
                                { restType: "quick" },
                                {
                                  onSuccess: () => {
                                    // Refresh character data
                                    window.location.reload();
                                  },
                                  onError: (error) => {
                                    alert(error.message);
                                  },
                                }
                              );
                            }}
                            disabled={
                              restMutation.isPending ||
                              (goldAmount || character.gold) < 10
                            }
                            className="flex-1"
                          >
                            Quick Rest (10g)
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              restMutation.mutate(
                                { restType: "full" },
                                {
                                  onSuccess: () => {
                                    // Refresh character data
                                    window.location.reload();
                                  },
                                  onError: (error) => {
                                    alert(error.message);
                                  },
                                }
                              );
                            }}
                            disabled={
                              restMutation.isPending ||
                              (goldAmount || character.gold) < 25
                            }
                            className="flex-1"
                          >
                            Full Rest (25g)
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Quick rest restores 50% health. Full rest restores
                          100% health.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sword className="h-5 w-5 mr-2 text-purple-400" />
                  Available Missions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {availableMissions.map((mission) => (
                    <div
                      key={mission.id}
                      className="p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors cursor-pointer"
                      onClick={() => router.push("/game/missions")}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium">
                          {mission.name}
                        </h4>
                        <span className="text-sm text-gray-400">
                          {mission.minPlayers}-{mission.maxPlayers} players
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-yellow-400">
                            {mission.baseReward}g
                          </span>
                          <span className="text-sm text-gray-400">•</span>
                          <span className="text-sm text-gray-400">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                className={`inline h-3 w-3 ${
                                  i < mission.difficulty
                                    ? "text-yellow-400"
                                    : "text-gray-600"
                                }`}
                              />
                            ))}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push("/game/missions");
                          }}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full mt-3"
                    onClick={() => router.push("/game/missions")}
                  >
                    View All Missions
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Player Search */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2 text-green-400" />
                  Find Players
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Input
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button className="w-full">Search</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Player Interaction Menu */}
        <PlayerInteractionMenu
          isOpen={showInteractionMenu}
          onClose={() => setShowInteractionMenu(false)}
          player={selectedPlayer}
          onTradeRequest={handleTradeRequest}
          onTheftAttempt={handleTheftAttempt}
          onSendMessage={handleSendMessage}
        />

        {/* Create Party Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setCreateError("");
          }}
          title="Create New Party"
        >
          <div className="space-y-4">
            {createError && (
              <div className="p-3 rounded-lg bg-red-900/50 border border-red-500/50 flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{createError}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-300">
                Party Name
              </label>
              <Input
                placeholder="Enter party name..."
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm({ ...createForm, name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Max Members
              </label>
              <Input
                type="number"
                min="2"
                max="10"
                value={createForm.maxMembers}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    maxMembers: parseInt(e.target.value) || 5,
                  })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={createForm.isPublic}
                onChange={(e) =>
                  setCreateForm({ ...createForm, isPublic: e.target.checked })
                }
                className="rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
              />
              <label htmlFor="isPublic" className="text-sm text-gray-300">
                Make party public (visible to all players)
              </label>
            </div>
            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateError("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateParty}
                disabled={createPartyMutation.isPending}
                className="flex-1"
              >
                {createPartyMutation.isPending ? "Creating..." : "Create Party"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
