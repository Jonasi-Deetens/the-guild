"use client";

import { useState } from "react";
import { EquipmentManager } from "@/components/game/EquipmentManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Inventory } from "@/components/game/Inventory";
import { api } from "@/trpc/react";
import { EquipmentSlot } from "@prisma/client";
import {
  meetsRequirements,
  formatItemRequirements,
  getRequirementClass,
  getRarityClass,
  getRarityBorderClass,
} from "@/lib/utils/equipment";
import { Package, Sword, Shield, Heart, Zap, Eye } from "@/components/icons";

export default function EquipmentPage() {
  const [showInventory, setShowInventory] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // tRPC queries
  const { data: inventory = [], refetch: refetchInventory } =
    api.character.getInventory.useQuery();
  const { data: character } = api.character.getCurrent.useQuery();
  const { data: equipment, refetch: refetchEquipment } =
    api.character.getEquipment.useQuery();

  // tRPC mutations
  const equipMutation = api.character.equipItem.useMutation();

  // Filter equippable items
  const equippableItems = inventory.filter(
    (item) => item.item.equipmentSlot && !item.equipped
  );

  const handleEquipItem = async (itemId: string) => {
    try {
      const result = await equipMutation.mutateAsync({ itemId });
      if (result.success) {
        await refetchInventory();
        await refetchEquipment();
        setSelectedItem(null);
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to equip item");
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case "WEAPON":
        return <Sword className="h-5 w-5 text-orange-400" />;
      case "ARMOR":
        return <Shield className="h-5 w-5 text-blue-400" />;
      case "ACCESSORY":
        return <Heart className="h-5 w-5 text-red-400" />;
      default:
        return <Package className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            Equipment Management
          </h1>
          <p className="text-gray-300">
            Equip items to boost your character's stats
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Equipment Manager - Takes up 2 columns */}
          <div className="xl:col-span-2">
            <EquipmentManager />
          </div>

          {/* Equipment List - Takes up 1 column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setShowInventory(true)}
                  className="w-full"
                >
                  Open Full Inventory
                </Button>
              </CardContent>
            </Card>

            {/* Available Equipment */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-white">
                  Available Equipment
                </CardTitle>
              </CardHeader>
              <CardContent>
                {equippableItems.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <Package className="h-12 w-12 mx-auto mb-2 text-gray-500" />
                    <p>No equippable items in inventory</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                    {equippableItems.map((item) => {
                      const requirements = formatItemRequirements(item.item);
                      const meetsReqs = character
                        ? meetsRequirements(character, item.item)
                        : { meets: false };

                      return (
                        <div
                          key={item.id}
                          className={`
                            p-3 rounded-lg border cursor-pointer transition-all hover:scale-105
                            ${getRarityBorderClass(item.item.rarity)} border-2
                            ${
                              meetsReqs.meets
                                ? "hover:bg-gray-800/50"
                                : "opacity-50 cursor-not-allowed"
                            }
                          `}
                          onClick={() =>
                            meetsReqs.meets && setSelectedItem(item)
                          }
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {getItemIcon(item.item.type)}
                              <div>
                                <h3
                                  className={`font-semibold ${getRarityClass(
                                    item.item.rarity
                                  )}`}
                                >
                                  {item.item.name}
                                </h3>
                                <p className="text-xs text-gray-400">
                                  {item.item.equipmentSlot}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs text-gray-400">
                              {item.item.rarity}
                            </span>
                          </div>

                          {/* Stats */}
                          <div className="space-y-1 mb-2">
                            {item.item.attack && (
                              <div className="flex items-center space-x-2 text-xs">
                                <Sword className="h-3 w-3 text-orange-400" />
                                <span className="text-gray-300">Attack:</span>
                                <span className="text-white">
                                  +{item.item.attack}
                                </span>
                              </div>
                            )}
                            {item.item.defense && (
                              <div className="flex items-center space-x-2 text-xs">
                                <Shield className="h-3 w-3 text-blue-400" />
                                <span className="text-gray-300">Defense:</span>
                                <span className="text-white">
                                  +{item.item.defense}
                                </span>
                              </div>
                            )}
                            {item.item.speed && (
                              <div className="flex items-center space-x-2 text-xs">
                                <Zap className="h-3 w-3 text-green-400" />
                                <span className="text-gray-300">Speed:</span>
                                <span className="text-white">
                                  +{item.item.speed}
                                </span>
                              </div>
                            )}
                            {item.item.perception && (
                              <div className="flex items-center space-x-2 text-xs">
                                <Eye className="h-3 w-3 text-purple-400" />
                                <span className="text-gray-300">
                                  Perception:
                                </span>
                                <span className="text-white">
                                  +{item.item.perception}
                                </span>
                              </div>
                            )}
                            {item.item.health && (
                              <div className="flex items-center space-x-2 text-xs">
                                <Heart className="h-3 w-3 text-red-400" />
                                <span className="text-gray-300">Health:</span>
                                <span className="text-white">
                                  +{item.item.health}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Requirements */}
                          {requirements.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs text-gray-400">
                                Requirements:
                              </p>
                              {requirements.map((req, index) => (
                                <p
                                  key={index}
                                  className={`text-xs ${getRequirementClass(
                                    meetsReqs.meets
                                  )}`}
                                >
                                  {req}
                                </p>
                              ))}
                            </div>
                          )}

                          {/* Equip Button */}
                          <Button
                            size="sm"
                            className="w-full mt-2"
                            disabled={
                              !meetsReqs.meets || equipMutation.isPending
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEquipItem(item.item.id);
                            }}
                          >
                            {equipMutation.isPending ? "Equipping..." : "Equip"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Inventory Modal */}
        <Inventory
          isOpen={showInventory}
          onClose={() => setShowInventory(false)}
        />
      </div>
    </div>
  );
}
