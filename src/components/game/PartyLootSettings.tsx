"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/Button";

interface PartyLootSettingsProps {
  partyId: string;
  isLeader: boolean;
  currentSettings: {
    lootDistributionType: string;
    masterLooterId?: string;
  };
  partyMembers: Array<{
    character: {
      id: string;
      name: string;
    };
  }>;
}

export function PartyLootSettings({
  partyId,
  isLeader,
  currentSettings,
  partyMembers,
}: PartyLootSettingsProps) {
  const [distributionType, setDistributionType] = useState(
    currentSettings.lootDistributionType
  );
  const [masterLooterId, setMasterLooterId] = useState(
    currentSettings.masterLooterId || ""
  );

  const updateSettingsMutation = api.party.updateLootSettings.useMutation({
    onSuccess: () => {
      // Optionally show success message
    },
  });

  const handleSaveSettings = () => {
    if (!isLeader) return;

    updateSettingsMutation.mutate({
      partyId,
      lootDistributionType: distributionType as
        | "AUTO"
        | "NEED_GREED"
        | "MASTER_LOOTER",
      masterLooterId: masterLooterId || undefined,
    });
  };

  if (!isLeader) {
    return (
      <div className="bg-black/20 border border-white/10 rounded-lg p-4">
        <h3 className="font-semibold text-white mb-2">Loot Distribution</h3>
        <div className="text-sm text-gray-400">
          Current:{" "}
          <span className="font-semibold">
            {currentSettings.lootDistributionType}
          </span>
        </div>
        {currentSettings.masterLooterId && (
          <div className="text-sm text-gray-400 mt-1">
            Master Looter:{" "}
            {
              partyMembers.find(
                (m) => m.character.id === currentSettings.masterLooterId
              )?.character.name
            }
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-black/20 border border-white/10 rounded-lg p-4">
      <h3 className="font-semibold text-white mb-4">
        Loot Distribution Settings
      </h3>

      <div className="space-y-4">
        {/* Distribution Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Distribution Type
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="AUTO"
                checked={distributionType === "AUTO"}
                onChange={(e) => setDistributionType(e.target.value)}
                className="mr-2"
              />
              <span className="text-sm text-gray-300">
                Auto - All members get all loot (current system)
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="NEED_GREED"
                checked={distributionType === "NEED_GREED"}
                onChange={(e) => setDistributionType(e.target.value)}
                className="mr-2"
              />
              <span className="text-sm text-gray-300">
                Need/Greed - Players roll for items they want
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="MASTER_LOOTER"
                checked={distributionType === "MASTER_LOOTER"}
                onChange={(e) => setDistributionType(e.target.value)}
                className="mr-2"
              />
              <span className="text-sm text-gray-300">
                Master Looter - One player distributes all loot
              </span>
            </label>
          </div>
        </div>

        {/* Master Looter Selection */}
        {distributionType === "MASTER_LOOTER" && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Master Looter
            </label>
            <select
              value={masterLooterId}
              onChange={(e) => setMasterLooterId(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white"
            >
              <option value="">Select master looter...</option>
              {partyMembers.map((member) => (
                <option key={member.character.id} value={member.character.id}>
                  {member.character.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Info Text */}
        <div className="text-xs text-gray-400 bg-black/10 rounded p-3">
          <div className="font-semibold mb-1">How it works:</div>
          <ul className="space-y-1">
            <li>
              • <strong>Gold Coins</strong> are always split equally among all
              party members
            </li>
            <li>
              • <strong>Need rolls</strong> (100) have priority over Greed rolls
              (1-100)
            </li>
            <li>
              • <strong>Master Looter</strong> can assign items to any party
              member
            </li>
            <li>• Only the party leader can change these settings</li>
          </ul>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSaveSettings}
          disabled={updateSettingsMutation.isPending}
          className="w-full"
        >
          {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
