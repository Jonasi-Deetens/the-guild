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
  Search,
  Star,
  Shield,
  Sword,
  Heart,
  Zap,
  Crown,
  Lock,
  CheckCircle,
  XCircle,
} from "@/components/icons";
import { api } from "@/trpc/react";

interface NPCCompanion {
  id: string;
  name: string;
  level: number;
  class: string;
  description?: string;
  backstory?: string;
  maxHealth: number;
  attack: number;
  defense: number;
  speed: number;
  agility: number;
  perception: number;
  blockStrength: number;
  criticalChance: number;
  hireCost: number;
  unlockType: "GOLD" | "MILESTONE";
  unlockRequirement?: number;
  rarity: "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY";
  abilities?: Record<string, unknown>;
}

export default function CompanionsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNPC, setSelectedNPC] = useState<NPCCompanion | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filterType, setFilterType] = useState<"ALL" | "GOLD" | "MILESTONE">(
    "ALL"
  );
  const [filterRarity, setFilterRarity] = useState<
    "ALL" | "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY"
  >("ALL");

  // tRPC queries
  const { data: availableNPCs, isLoading: npcsLoading } =
    api.npc.getAvailable.useQuery();
  const { data: unlockedNPCs } = api.npc.getUnlocked.useQuery();
  const { data: hiredNPCs } = api.npc.getHired.useQuery();
  const { data: character, isLoading: characterLoading } =
    api.character.getCurrentCharacter.useQuery();
  const { data: myCurrentParty, isLoading: partyLoading } =
    api.party.getMyCurrent.useQuery();

  // tRPC mutations
  const hireNPCMutation = api.npc.hire.useMutation();
  const dismissNPCMutation = api.npc.dismiss.useMutation();
  const checkUnlocksMutation = api.npc.checkUnlocks.useMutation();

  useEffect(() => {
    // Only redirect if data has finished loading
    if (characterLoading || partyLoading) {
      return;
    }

    // Check if user is authenticated
    if (!character) {
      router.push("/auth/login");
      return;
    }

    // Check if user is in a party
    if (!myCurrentParty) {
      router.push("/game/parties");
      return;
    }
  }, [character, myCurrentParty, characterLoading, partyLoading, router]);

  // Show loading while data is being fetched or while redirects are happening
  if (characterLoading || partyLoading || !character || !myCurrentParty) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-900 via-amber-950 to-stone-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  const filteredNPCs =
    availableNPCs?.filter((npc) => {
      const matchesSearch =
        npc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        npc.class.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "ALL" || npc.unlockType === filterType;
      const matchesRarity =
        filterRarity === "ALL" || npc.rarity === filterRarity;

      return matchesSearch && matchesType && matchesRarity;
    }) || [];

  const handleNPCClick = (npc: NPCCompanion) => {
    setSelectedNPC(npc);
    setShowDetailsModal(true);
  };

  const handleHireNPC = async (npc: NPCCompanion) => {
    try {
      const result = await hireNPCMutation.mutateAsync({ npcId: npc.id });
      if (result.success) {
        setShowDetailsModal(false);
        window.location.reload();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Failed to hire NPC:", error);
      alert("Failed to hire NPC");
    }
  };

  const handleDismissNPC = async (npc: NPCCompanion) => {
    try {
      const result = await dismissNPCMutation.mutateAsync({ npcId: npc.id });
      if (result.success) {
        setShowDetailsModal(false);
        window.location.reload();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Failed to dismiss NPC:", error);
      alert("Failed to dismiss NPC");
    }
  };

  const handleCheckUnlocks = async () => {
    try {
      const result = await checkUnlocksMutation.mutateAsync();
      if (result.success && result.newlyUnlocked.length > 0) {
        alert(result.message);
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to check unlocks:", error);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "COMMON":
        return "text-gray-400";
      case "UNCOMMON":
        return "text-green-400";
      case "RARE":
        return "text-blue-400";
      case "EPIC":
        return "text-purple-400";
      case "LEGENDARY":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case "COMMON":
        return "bg-gray-800/50";
      case "UNCOMMON":
        return "bg-green-800/20";
      case "RARE":
        return "bg-blue-800/20";
      case "EPIC":
        return "bg-purple-800/20";
      case "LEGENDARY":
        return "bg-yellow-800/20";
      default:
        return "bg-gray-800/50";
    }
  };

  const isNPCHired = (npcId: string) => {
    return hiredNPCs?.some((hired) => hired.id === npcId) || false;
  };

  const isNPCUnlocked = (npcId: string) => {
    return unlockedNPCs?.some((unlocked) => unlocked.id === npcId) || false;
  };

  const canHireNPC = (npc: NPCCompanion) => {
    if (!character || !myCurrentParty) return false;
    if (isNPCHired(npc.id)) return false;
    if (npc.unlockType === "GOLD" && character.gold < npc.hireCost)
      return false;
    if (npc.unlockType === "MILESTONE" && !isNPCUnlocked(npc.id)) return false;
    if (myCurrentParty.members.length >= myCurrentParty.maxMembers)
      return false;
    return true;
  };

  if (npcsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading companions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Companions</h1>
          <p className="text-gray-300">
            Hire NPCs to join your party and help you on missions
          </p>
        </div>
        <Button onClick={handleCheckUnlocks} variant="outline">
          <Star className="h-4 w-4 mr-2" />
          Check Unlocks
        </Button>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search companions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex space-x-4">
          <div className="flex space-x-2">
            <Button
              variant={filterType === "ALL" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("ALL")}
            >
              All
            </Button>
            <Button
              variant={filterType === "GOLD" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("GOLD")}
            >
              Gold Hire
            </Button>
            <Button
              variant={filterType === "MILESTONE" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("MILESTONE")}
            >
              Milestone
            </Button>
          </div>

          <div className="flex space-x-2">
            <Button
              variant={filterRarity === "ALL" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterRarity("ALL")}
            >
              All Rarities
            </Button>
            <Button
              variant={filterRarity === "COMMON" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterRarity("COMMON")}
            >
              Common
            </Button>
            <Button
              variant={filterRarity === "RARE" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterRarity("RARE")}
            >
              Rare
            </Button>
            <Button
              variant={filterRarity === "LEGENDARY" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterRarity("LEGENDARY")}
            >
              Legendary
            </Button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNPCs.map((npc) => (
          <Card
            key={npc.id}
            className={`glass hover:scale-105 transition-transform duration-300 cursor-pointer ${getRarityBg(
              npc.rarity
            )}`}
            onClick={() => handleNPCClick(npc)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{npc.name}</CardTitle>
                <div className="flex items-center space-x-2">
                  {npc.rarity === "LEGENDARY" && (
                    <Crown className="h-4 w-4 text-yellow-400" />
                  )}
                  {npc.unlockType === "MILESTONE" && (
                    <Lock className="h-4 w-4 text-blue-400" />
                  )}
                  {isNPCHired(npc.id) && (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  )}
                </div>
              </div>
              <CardDescription>
                <span className={`font-medium ${getRarityColor(npc.rarity)}`}>
                  {npc.rarity}
                </span>
                <span className="text-gray-400"> • </span>
                <span>
                  Level {npc.level} {npc.class}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-300 line-clamp-2">
                  {npc.description}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center space-x-1">
                    <Heart className="h-3 w-3 text-red-400" />
                    <span>{npc.maxHealth}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Sword className="h-3 w-3 text-orange-400" />
                    <span>{npc.attack}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Shield className="h-3 w-3 text-blue-400" />
                    <span>{npc.defense}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Zap className="h-3 w-3 text-yellow-400" />
                    <span>{npc.speed}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-sm">
                    {npc.unlockType === "GOLD" ? (
                      <span className="text-yellow-400">
                        {npc.hireCost} gold
                      </span>
                    ) : (
                      <span className="text-blue-400">
                        {npc.unlockRequirement} reputation
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    {isNPCHired(npc.id) ? (
                      <XCircle className="h-4 w-4 text-red-400" />
                    ) : canHireNPC(npc) ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredNPCs.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            No companions found
          </h3>
          <p className="text-gray-400">
            Try adjusting your search terms or filters
          </p>
        </div>
      )}

      {selectedNPC && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title={selectedNPC.name}
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span
                  className={`font-medium ${getRarityColor(
                    selectedNPC.rarity
                  )}`}
                >
                  {selectedNPC.rarity}
                </span>
                <span className="text-gray-400">•</span>
                <span>
                  Level {selectedNPC.level} {selectedNPC.class}
                </span>
              </div>
              <p className="text-gray-300">{selectedNPC.description}</p>
              {selectedNPC.backstory && (
                <p className="text-sm text-gray-400 italic">
                  {selectedNPC.backstory}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-white">Combat Stats</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Health:</span>
                    <span className="text-white">{selectedNPC.maxHealth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Attack:</span>
                    <span className="text-white">{selectedNPC.attack}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Defense:</span>
                    <span className="text-white">{selectedNPC.defense}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Speed:</span>
                    <span className="text-white">{selectedNPC.speed}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-white">Secondary Stats</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Agility:</span>
                    <span className="text-white">{selectedNPC.agility}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Perception:</span>
                    <span className="text-white">{selectedNPC.perception}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Block:</span>
                    <span className="text-white">
                      {selectedNPC.blockStrength}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Crit Chance:</span>
                    <span className="text-white">
                      {(selectedNPC.criticalChance * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {selectedNPC.abilities && (
              <div className="space-y-2">
                <h4 className="font-medium text-white">Abilities</h4>
                <div className="space-y-1">
                  {Object.entries(selectedNPC.abilities).map(
                    ([name, description]) => (
                      <div key={name} className="text-sm">
                        <span className="font-medium text-blue-400">
                          {name}:
                        </span>
                        <span className="text-gray-300 ml-2">
                          {description as string}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="font-medium text-white">Hiring</h4>
              <div className="text-sm">
                {selectedNPC.unlockType === "GOLD" ? (
                  <div>
                    <span className="text-gray-400">Cost: </span>
                    <span className="text-yellow-400">
                      {selectedNPC.hireCost} gold per mission
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-gray-400">Requirement: </span>
                    <span className="text-blue-400">
                      {selectedNPC.unlockRequirement} reputation
                    </span>
                    {!isNPCUnlocked(selectedNPC.id) && (
                      <div className="text-red-400 mt-1">Not unlocked yet</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              {isNPCHired(selectedNPC.id) ? (
                <Button
                  variant="destructive"
                  onClick={() => handleDismissNPC(selectedNPC)}
                  disabled={dismissNPCMutation.isPending}
                  className="flex-1"
                >
                  {dismissNPCMutation.isPending ? "Dismissing..." : "Dismiss"}
                </Button>
              ) : canHireNPC(selectedNPC) ? (
                <Button
                  onClick={() => handleHireNPC(selectedNPC)}
                  disabled={hireNPCMutation.isPending}
                  className="flex-1"
                >
                  {hireNPCMutation.isPending ? "Hiring..." : "Hire"}
                </Button>
              ) : (
                <Button disabled className="flex-1">
                  Cannot Hire
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
