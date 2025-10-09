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
} from "@/components/icons";
import PlayerInteractionMenu from "@/components/game/PlayerInteractionMenu";
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
  const { data: myCurrentParty, refetch: refetchMyParty } =
    api.party.getMyCurrent.useQuery();

  // Mock data - will be replaced with real data from tRPC
  const onlinePlayers = [
    {
      id: "1",
      name: "ShadowThief",
      level: 8,
      reputation: -25,
      gold: 500,
      isOnline: true,
    },
    {
      id: "2",
      name: "HolyPaladin",
      level: 12,
      reputation: 45,
      gold: 1200,
      isOnline: true,
    },
    {
      id: "3",
      name: "MerchantKing",
      level: 6,
      reputation: 15,
      gold: 2500,
      isOnline: true,
    },
    {
      id: "4",
      name: "DungeonMaster",
      level: 15,
      reputation: 60,
      gold: 800,
      isOnline: true,
    },
    {
      id: "5",
      name: "LoneWolf",
      level: 10,
      reputation: 0,
      gold: 750,
      isOnline: true,
    },
  ];

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

  // Get missions from tRPC
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
    <div className="space-y-6">
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
                {onlinePlayers.map((player) => (
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
                ))}
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

        {/* Right Column - Missions & Stats */}
        <div className="space-y-6">
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
                      <h4 className="text-white font-medium">{mission.name}</h4>
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
  );
}
