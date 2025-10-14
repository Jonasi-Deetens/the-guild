"use client";

import { useState, useEffect } from "react";
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
  Plus,
  Search,
  Crown,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
  AlertTriangle,
} from "@/components/icons";
import { useWebSocketStore } from "@/stores/websocket";
import { api } from "@/trpc/react";
import { PartyLootSettings } from "@/components/game/PartyLootSettings";

interface Party {
  id: string;
  name: string | null;
  isPublic: boolean;
  maxMembers: number;
  status: string;
  leader: {
    id: string;
    name: string;
    level: number;
    reputation: number;
  };
  members: Array<{
    character: {
      id: string;
      name: string;
      level: number;
      reputation: number;
    };
    isReady: boolean;
  }>;
  createdAt: string;
  lootDistributionType: string;
  masterLooterId?: string;
}

export default function PartiesPage() {
  const router = useRouter();
  const [parties, setParties] = useState<Party[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createForm, setCreateForm] = useState({
    name: "",
    isPublic: false,
    maxMembers: 5,
  });
  const [partyChat, setPartyChat] = useState<
    Array<{ message: string; sender: string; timestamp: string }>
  >([]);
  const [chatMessage, setChatMessage] = useState("");

  const {
    partyChat: wsPartyChat,
    createParty: wsCreateParty,
    joinParty: wsJoinParty,
    leaveParty: wsLeaveParty,
    toggleReady: wsToggleReady,
    sendPartyMessage,
  } = useWebSocketStore();

  // tRPC mutations
  const createPartyMutation = api.party.create.useMutation();
  const joinPartyMutation = api.party.join.useMutation();
  const leavePartyMutation = api.party.leave.useMutation();
  const toggleReadyMutation = api.party.toggleReady.useMutation();
  const updateVisibilityMutation = api.party.updateVisibility.useMutation();
  const { data: publicParties, refetch: refetchParties } =
    api.party.getPublic.useQuery();
  const { data: myCurrentParty, refetch: refetchMyParty } =
    api.party.getMyCurrent.useQuery();
  const { data: myCharacter } = api.character.getCurrentCharacter.useQuery();

  useEffect(() => {
    setPartyChat(wsPartyChat);
  }, [wsPartyChat]);

  useEffect(() => {
    if (publicParties) {
      setParties(publicParties as Party[]);
    }
  }, [publicParties]);

  const handleCreateParty = async () => {
    try {
      setCreateError("");
      await createPartyMutation.mutateAsync(createForm);
      setShowCreateModal(false);
      setCreateForm({ name: "", isPublic: false, maxMembers: 5 });
      // Refresh the parties list and current party
      await refetchParties();
      await refetchMyParty();
    } catch (error) {
      console.error("Failed to create party:", error);
      setCreateError("Failed to create party. You may already be in a party.");
    }
  };

  const handleJoinParty = async (partyId: string) => {
    try {
      await joinPartyMutation.mutateAsync({ partyId });
      // Refresh the parties list and current party
      await refetchParties();
      const updatedParty = await refetchMyParty();

      // Switch to party detail view with the joined party
      if (updatedParty.data) {
        setCurrentParty(updatedParty.data as Party);
      }
    } catch (error) {
      console.error("Failed to join party:", error);
    }
  };

  const handleLeaveParty = async () => {
    try {
      await leavePartyMutation.mutateAsync();
      setCurrentParty(null);
      // Refresh the parties list and current party
      await refetchParties();
      await refetchMyParty();
    } catch (error) {
      console.error("Failed to leave party:", error);
    }
  };

  const handleToggleReady = async (isReady: boolean) => {
    try {
      await toggleReadyMutation.mutateAsync({ isReady });
      // Refetch party data to update the UI
      await refetchMyParty();
    } catch (error) {
      console.error("Failed to toggle ready status:", error);
      // TODO: Show error message to user
    }
  };

  const handleToggleVisibility = async (isPublic: boolean) => {
    if (!myCurrentParty) return;

    try {
      await updateVisibilityMutation.mutateAsync({
        partyId: myCurrentParty.id,
        isPublic,
      });
      await refetchMyParty();
    } catch (error) {
      console.error("Failed to update party visibility:", error);
      // TODO: Show error message to user
    }
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      sendPartyMessage(chatMessage);
      setChatMessage("");
    }
  };

  const filteredParties = parties.filter(
    (party) =>
      (party.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        party.leader.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
      party.id !== myCurrentParty?.id
  );

  if (myCurrentParty) {
    return (
      <div className="h-screen overflow-y-auto p-8 space-y-6">
        {/* Party Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {myCurrentParty.name || "Unnamed Party"}
            </h1>
            <p className="text-gray-300">Status: {myCurrentParty.status}</p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Party Visibility Toggle - Only for party leader */}
            {myCharacter?.id === myCurrentParty.leader.id && (
              <Button
                variant={myCurrentParty.isPublic ? "default" : "outline"}
                size="sm"
                onClick={() => handleToggleVisibility(!myCurrentParty.isPublic)}
                disabled={updateVisibilityMutation.isPending}
              >
                {myCurrentParty.isPublic ? "Public" : "Private"}
              </Button>
            )}
            <Button variant="destructive" onClick={handleLeaveParty}>
              Leave Party
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Main Content Area */}
          <div className="space-y-6">
            {/* Party Members */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-400" />
                  Party Members ({myCurrentParty.members.length}/
                  {myCurrentParty.maxMembers})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {myCurrentParty.members.map((member) => (
                    <div
                      key={member.character.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                          {member.character.name[0]}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-medium">
                              {member.character.name}
                            </span>
                            {member.character.id ===
                              myCurrentParty.leader.id && (
                              <Crown className="h-4 w-4 text-yellow-400" />
                            )}
                          </div>
                          <div className="text-sm text-gray-400">
                            Lv.{member.character.level} •{" "}
                            {member.character.reputation > 0 ? "+" : ""}
                            {member.character.reputation} rep
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {member.isReady ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-400" />
                        )}
                        <span className="text-sm text-gray-400">
                          {member.isReady ? "Ready" : "Not Ready"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Party Chat */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2 text-green-400" />
                  Party Chat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-64 overflow-y-auto space-y-2">
                    {partyChat.map((message, index) => (
                      <div
                        key={index}
                        className="p-2 rounded-lg bg-gray-800/30"
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-white">
                            {message.sender}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300">
                          {message.message}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Type a message..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                    />
                    <Button onClick={handleSendMessage}>Send</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Content Area */}
          <div className="space-y-6">
            {/* Party Actions */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Party Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  onClick={() => {
                    const currentMember = myCurrentParty.members.find(
                      (m) => m.character.id === myCharacter?.id
                    );
                    if (currentMember) {
                      handleToggleReady(!currentMember.isReady);
                    }
                  }}
                >
                  {myCurrentParty.members.find(
                    (m) => m.character.id === myCharacter?.id
                  )?.isReady ? (
                    <XCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {myCurrentParty.members.find(
                    (m) => m.character.id === myCharacter?.id
                  )?.isReady
                    ? "Not Ready"
                    : "Ready"}
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Invite Players
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push("/game/missions")}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Start Mission
                </Button>
              </CardContent>
            </Card>

            {/* Loot Distribution Settings */}
            <PartyLootSettings
              partyId={myCurrentParty.id}
              isLeader={myCharacter?.id === myCurrentParty.leader.id}
              currentSettings={{
                lootDistributionType:
                  myCurrentParty.lootDistributionType || "AUTO",
                masterLooterId: myCurrentParty.masterLooterId,
              }}
              partyMembers={myCurrentParty.members}
            />

            {/* Party Settings */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Party Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-400">
                  <p>Max Members: {myCurrentParty.maxMembers}</p>
                  <p>
                    Created:{" "}
                    {new Date(myCurrentParty.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Parties</h1>
          <p className="text-gray-300">
            Join or create a party to embark on missions together
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Party
        </Button>
      </div>

      {/* Search */}
      <Card className="glass">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search parties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Parties List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredParties.map((party) => {
          const isMyParty = myCurrentParty?.id === party.id;
          return (
            <Card
              key={party.id}
              className={`glass hover:scale-105 transition-transform duration-300 ${
                isMyParty
                  ? "border-2 border-purple-500 shadow-lg shadow-purple-500/20"
                  : ""
              }`}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span>{party.name || "Unnamed Party"}</span>
                    {isMyParty && (
                      <Star className="h-4 w-4 text-purple-400 fill-purple-400" />
                    )}
                  </div>
                  <span className="text-sm text-gray-400">
                    {party.members.length}/{party.maxMembers}
                  </span>
                </CardTitle>
                <CardDescription>
                  Led by {party.leader.name} (Lv.{party.leader.level})
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Leader</span>
                    <div className="flex items-center space-x-2">
                      <Crown className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm text-white">
                        {party.leader.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Status</span>
                    <span
                      className={`text-sm ${
                        party.status === "FORMING"
                          ? "text-yellow-400"
                          : "text-green-400"
                      }`}
                    >
                      {party.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Members</span>
                    <div className="flex items-center space-x-1">
                      {party.members.map((member, index) => (
                        <div
                          key={index}
                          className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold"
                        >
                          {member.character.name[0]}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => handleJoinParty(party.id)}
                  disabled={
                    party.members.length >= party.maxMembers || isMyParty
                  }
                >
                  {isMyParty
                    ? "Your Party"
                    : party.members.length >= party.maxMembers
                    ? "Full"
                    : "Join Party"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
                  maxMembers: parseInt(e.target.value),
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
              className="rounded"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-300">
              Make party public
            </label>
          </div>
          <Button
            onClick={handleCreateParty}
            className="w-full"
            disabled={createPartyMutation.isPending}
          >
            {createPartyMutation.isPending ? "Creating..." : "Create Party"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
