"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface LootDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  characterId: string;
  isMasterLooter?: boolean;
}

export function LootDistributionModal({
  isOpen,
  onClose,
  sessionId,
  characterId,
  isMasterLooter = false,
}: LootDistributionModalProps) {
  const [selectedLootId, setSelectedLootId] = useState<string | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("");

  // Get loot distribution status
  const { data: lootStatus, refetch } =
    api.lootDistribution.getLootStatus.useQuery(
      { sessionId },
      { enabled: isOpen }
    );

  // Submit loot roll mutation
  const submitRollMutation = api.lootDistribution.submitLootRoll.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Assign loot manually mutation
  const assignLootMutation =
    api.lootDistribution.assignLootManually.useMutation({
      onSuccess: () => {
        refetch();
        setSelectedLootId(null);
        setSelectedCharacterId("");
      },
    });

  const handleNeedRoll = (lootId: string) => {
    submitRollMutation.mutate({
      lootId,
      characterId,
      rollType: "NEED",
    });
  };

  const handleGreedRoll = (lootId: string) => {
    submitRollMutation.mutate({
      lootId,
      characterId,
      rollType: "GREED",
    });
  };

  const handleAssignLoot = () => {
    if (selectedLootId && selectedCharacterId) {
      assignLootMutation.mutate({
        lootId: selectedLootId,
        characterId: selectedCharacterId,
        masterLooterId: characterId,
      });
    }
  };

  if (!lootStatus) {
    return null;
  }

  const { unclaimedLoot, distributionType, masterLooterId } = lootStatus;
  const partyMembers = lootStatus.session.party?.members || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Loot Distribution">
      <div className="space-y-4">
        <div className="text-sm text-gray-300">
          Distribution Type:{" "}
          <span className="font-semibold">{distributionType}</span>
        </div>

        {unclaimedLoot.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No unclaimed loot available
          </div>
        ) : (
          <div className="space-y-3">
            {unclaimedLoot.map((loot: any) => (
              <div
                key={loot.id}
                className="bg-black/20 border border-white/10 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-white">
                      {loot.item.name}
                    </h4>
                    <p className="text-sm text-gray-400">
                      Quantity: {loot.quantity} | Rarity: {loot.item.rarity}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-yellow-400 font-semibold">
                      {loot.item.value * loot.quantity} gold
                    </span>
                  </div>
                </div>

                {/* Gold items are automatically split */}
                {loot.item.name === "Gold Coin" ? (
                  <div className="text-green-400 text-sm">
                    ✅ Gold will be split equally among all party members
                  </div>
                ) : (
                  <>
                    {/* Need/Greed System */}
                    {distributionType === "NEED_GREED" && (
                      <div className="space-y-2">
                        <div className="text-sm text-gray-300">
                          Roll for this item:
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleNeedRoll(loot.id)}
                            disabled={submitRollMutation.isPending}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Need (100)
                          </Button>
                          <Button
                            onClick={() => handleGreedRoll(loot.id)}
                            disabled={submitRollMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Greed (1-100)
                          </Button>
                        </div>

                        {/* Show existing rolls */}
                        {loot.lootRolls && loot.lootRolls.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <div className="text-xs text-gray-400">
                              Current rolls:
                            </div>
                            {loot.lootRolls.map((roll: any) => (
                              <div
                                key={roll.id}
                                className="text-xs bg-black/20 rounded px-2 py-1"
                              >
                                {roll.character.name}: {roll.rollType} (
                                {roll.rollValue})
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Master Looter System */}
                    {distributionType === "MASTER_LOOTER" && isMasterLooter && (
                      <div className="space-y-2">
                        <div className="text-sm text-gray-300">Assign to:</div>
                        <div className="flex gap-2">
                          <select
                            value={selectedCharacterId}
                            onChange={(e) =>
                              setSelectedCharacterId(e.target.value)
                            }
                            className="bg-black/20 border border-white/10 rounded px-3 py-1 text-white"
                          >
                            <option value="">Select character...</option>
                            {partyMembers
                              .filter((member: any) => member.character) // Only show player characters
                              .map((member: any) => (
                                <option
                                  key={member.character.id}
                                  value={member.character.id}
                                >
                                  {member.character.name}
                                </option>
                              ))}
                          </select>
                          <Button
                            onClick={() => {
                              setSelectedLootId(loot.id);
                              handleAssignLoot();
                            }}
                            disabled={
                              !selectedCharacterId ||
                              assignLootMutation.isPending
                            }
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            Assign
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Show if already assigned */}
                    {loot.assignedTo && (
                      <div className="text-green-400 text-sm">
                        ✅ Assigned to: {loot.assignedTo}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-white/10">
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
