"use client";

import { useState } from "react";
import { EquipmentSlot } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EquipmentSlotComponent } from "./EquipmentSlot";
import { getSlotPosition } from "@/lib/utils/equipment";
import { api } from "@/trpc/react";
import { Sword, Shield, Heart, Zap, Eye, Info } from "@/components/icons";

interface EquipmentManagerProps {
  className?: string;
}

export function EquipmentManager({ className = "" }: EquipmentManagerProps) {
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // tRPC queries
  const { data: equipment, refetch: refetchEquipment } =
    api.character.getEquipment.useQuery();
  const { data: calculatedStats, refetch: refetchStats } =
    api.character.getCalculatedStats.useQuery();
  const { data: character } = api.character.getCurrent.useQuery();

  // tRPC mutations
  const unequipMutation = api.character.unequipItem.useMutation();

  const handleUnequip = async (slot: EquipmentSlot) => {
    try {
      await unequipMutation.mutateAsync({ slot });
      await refetchEquipment();
      await refetchStats();
    } catch (error) {
      console.error("Failed to unequip item:", error);
    }
  };

  const handleItemClick = (item: any) => {
    setSelectedItem(item);
  };

  const equipmentSlots = [
    { slot: EquipmentSlot.HEAD, item: equipment?.head },
    { slot: EquipmentSlot.CHEST, item: equipment?.chest },
    { slot: EquipmentSlot.LEGS, item: equipment?.legs },
    { slot: EquipmentSlot.BOOTS, item: equipment?.boots },
    { slot: EquipmentSlot.WEAPON, item: equipment?.weapon },
    { slot: EquipmentSlot.OFF_HAND, item: equipment?.offHand },
    { slot: EquipmentSlot.GLOVES, item: equipment?.gloves },
    { slot: EquipmentSlot.RING, item: equipment?.ring1 },
    { slot: EquipmentSlot.AMULET, item: equipment?.amulet },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Equipment</h2>
        <p className="text-gray-300">Manage your character's equipment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Paper Doll */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-white text-center">Character</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full h-96 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg border-2 border-gray-600">
              {/* Character silhouette or placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-gray-500 text-center">
                  <div className="text-6xl mb-2">🧙‍♂️</div>
                  <div className="text-sm">Character</div>
                </div>
              </div>

              {/* Equipment slots positioned on the paper doll */}
              {equipmentSlots.map(({ slot, item }) => {
                const position = getSlotPosition(slot);
                return (
                  <div key={slot} className="absolute" style={position}>
                    <EquipmentSlotComponent
                      slot={slot}
                      item={item}
                      onUnequip={handleUnequip}
                      onItemClick={handleItemClick}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Stats Panel */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-white">Character Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {character && calculatedStats ? (
              <>
                {/* Base Stats */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">
                    Base Stats
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Sword className="h-4 w-4 text-orange-400" />
                      <span className="text-gray-300">Attack:</span>
                      <span className="text-white">{character.attack}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-blue-400" />
                      <span className="text-gray-300">Defense:</span>
                      <span className="text-white">{character.defense}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-green-400" />
                      <span className="text-gray-300">Speed:</span>
                      <span className="text-white">{character.speed}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-purple-400" />
                      <span className="text-gray-300">Perception:</span>
                      <span className="text-white">{character.perception}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Heart className="h-4 w-4 text-red-400" />
                      <span className="text-gray-300">Health:</span>
                      <span className="text-white">{character.maxHealth}</span>
                    </div>
                  </div>
                </div>

                {/* Equipment Bonuses */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">
                    Equipment Bonuses
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Sword className="h-4 w-4 text-orange-400" />
                      <span className="text-gray-300">Attack:</span>
                      <span className="text-green-400">
                        +{calculatedStats.attackBonus}
                        {calculatedStats.attackBonus > 0 && " (+equipment)"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-blue-400" />
                      <span className="text-gray-300">Defense:</span>
                      <span className="text-green-400">
                        +{calculatedStats.defenseBonus}
                        {calculatedStats.defenseBonus > 0 && " (+equipment)"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-green-400" />
                      <span className="text-gray-300">Speed:</span>
                      <span className="text-green-400">
                        +{calculatedStats.speedBonus}
                        {calculatedStats.speedBonus > 0 && " (+equipment)"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-purple-400" />
                      <span className="text-gray-300">Perception:</span>
                      <span className="text-green-400">
                        +{calculatedStats.perceptionBonus}
                        {calculatedStats.perceptionBonus > 0 && " (+equipment)"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Heart className="h-4 w-4 text-red-400" />
                      <span className="text-gray-300">Health:</span>
                      <span className="text-green-400">
                        +{calculatedStats.healthBonus}
                        {calculatedStats.healthBonus > 0 && " (+equipment)"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Total Stats */}
                <div className="space-y-2 pt-4 border-t border-gray-600">
                  <h3 className="text-lg font-semibold text-white">
                    Total Stats
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Sword className="h-4 w-4 text-orange-400" />
                      <span className="text-gray-300">Attack:</span>
                      <span className="text-yellow-400 font-semibold">
                        {calculatedStats.attack}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-blue-400" />
                      <span className="text-gray-300">Defense:</span>
                      <span className="text-yellow-400 font-semibold">
                        {calculatedStats.defense}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-green-400" />
                      <span className="text-gray-300">Speed:</span>
                      <span className="text-yellow-400 font-semibold">
                        {calculatedStats.speed}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-purple-400" />
                      <span className="text-gray-300">Perception:</span>
                      <span className="text-yellow-400 font-semibold">
                        {calculatedStats.perception}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Heart className="h-4 w-4 text-red-400" />
                      <span className="text-gray-300">Health:</span>
                      <span className="text-yellow-400 font-semibold">
                        {calculatedStats.health}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-400">
                Loading character stats...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Equipment Slots List */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-white">Equipment Slots</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {equipmentSlots.map(({ slot, item }) => (
              <EquipmentSlotComponent
                key={slot}
                slot={slot}
                item={item}
                onUnequip={handleUnequip}
                onItemClick={handleItemClick}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Help Text */}
      <Card className="glass border-blue-500/20">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-300">
              <p className="font-semibold text-blue-400 mb-1">Equipment Help</p>
              <ul className="space-y-1 text-xs">
                <li>• Click on equipment slots to view item details</li>
                <li>• Use the X button to unequip items</li>
                <li>• Equipment provides stat bonuses to your character</li>
                <li>• Some items have level and stat requirements</li>
                <li>• You can equip up to 2 rings</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
