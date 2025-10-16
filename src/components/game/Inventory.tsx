"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import {
  Sword,
  Shield,
  Heart,
  Package,
  Star,
  Coins,
  Eye,
  Zap,
} from "@/components/icons";
import { api } from "@/trpc/react";

interface InventoryItem {
  id: string;
  quantity: number;
  equipped: boolean;
  item: {
    id: string;
    name: string;
    description: string;
    type: string;
    rarity: string;
    value: number;
    attack?: number;
    defense?: number;
    healing?: number;
  };
}

interface InventoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Inventory({ isOpen, onClose }: InventoryProps) {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // tRPC queries and mutations
  const { data: inventory = [], refetch: refetchInventory } =
    api.character.getInventory.useQuery();
  const useItemMutation = api.character.useItem.useMutation();
  const toggleEquipMutation = api.character.toggleEquip.useMutation();

  const handleUseItem = async (item: InventoryItem) => {
    try {
      const result = await useItemMutation.mutateAsync({
        inventoryId: item.id,
      });
      alert(result.message);
      refetchInventory();
      setSelectedItem(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to use item");
    }
  };

  const handleToggleEquip = async (item: InventoryItem) => {
    try {
      const result = await toggleEquipMutation.mutateAsync({
        inventoryId: item.id,
      });
      alert(result.message);
      refetchInventory();
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
      case "CONSUMABLE":
        return <Heart className="h-5 w-5 text-red-400" />;
      default:
        return <Package className="h-5 w-5 text-gray-400" />;
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

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case "COMMON":
        return "border-gray-600";
      case "UNCOMMON":
        return "border-green-600";
      case "RARE":
        return "border-blue-600";
      case "EPIC":
        return "border-purple-600";
      case "LEGENDARY":
        return "border-yellow-600";
      default:
        return "border-gray-600";
    }
  };

  const canUse = (item: InventoryItem) => {
    return item.item.type === "CONSUMABLE" && item.item.healing;
  };

  const canEquip = (item: InventoryItem) => {
    return item.item.type === "WEAPON" || item.item.type === "ARMOR";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Inventory">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Your Items</h2>
          <p className="text-gray-400">Manage your equipment and consumables</p>
        </div>

        {inventory.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Your inventory is empty</p>
            <p className="text-gray-500 text-sm">
              Complete dungeons to find items!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Gold Display - Prominent at top */}
            {(() => {
              const goldItem = inventory.find(
                (item) =>
                  item.item.name === "Gold" && item.item.type === "CURRENCY"
              );
              return goldItem ? (
                <Card className="glass border-2 border-yellow-400 bg-gradient-to-r from-yellow-900/20 to-amber-900/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-yellow-400 p-3 rounded-full">
                          <Coins className="h-8 w-8 text-yellow-900" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-yellow-400">
                            Gold
                          </h3>
                          <p className="text-yellow-200">Universal currency</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-yellow-400">
                          {goldItem.quantity.toLocaleString()}
                        </div>
                        <div className="text-yellow-200 text-sm">
                          Gold Coins
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null;
            })()}

            {/* Other Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventory
                .filter(
                  (item) =>
                    !(
                      item.item.name === "Gold" && item.item.type === "CURRENCY"
                    )
                )
                .map((item) => (
                  <Card
                    key={item.id}
                    className={`glass cursor-pointer transition-all hover:scale-105 ${
                      item.equipped ? "ring-2 ring-yellow-400" : ""
                    } ${getRarityBorder(item.item.rarity)}`}
                    onClick={() => setSelectedItem(item)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getItemIcon(item.item.type)}
                          <div>
                            <h3 className="font-semibold text-white">
                              {item.item.name}
                            </h3>
                            <p
                              className={`text-sm ${getRarityColor(
                                item.item.rarity
                              )}`}
                            >
                              {item.item.rarity}
                            </p>
                          </div>
                        </div>
                        {item.equipped && (
                          <div className="bg-yellow-400 text-black text-xs px-2 py-1 rounded font-semibold">
                            EQUIPPED
                          </div>
                        )}
                      </div>

                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                        {item.item.description}
                      </p>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-1 text-yellow-400">
                          <Coins className="h-4 w-4" />
                          <span>{item.item.value}</span>
                        </div>
                        {item.quantity > 1 && (
                          <span className="text-gray-400">
                            x{item.quantity}
                          </span>
                        )}
                      </div>

                      {/* Item Stats */}
                      <div className="mt-3 space-y-1">
                        {item.item.attack && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Sword className="h-4 w-4 text-orange-400" />
                            <span className="text-gray-300">
                              Attack: {item.item.attack}
                            </span>
                          </div>
                        )}
                        {item.item.defense && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Shield className="h-4 w-4 text-blue-400" />
                            <span className="text-gray-300">
                              Defense: {item.item.defense}
                            </span>
                          </div>
                        )}
                        {item.item.healing && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Heart className="h-4 w-4 text-red-400" />
                            <span className="text-gray-300">
                              Healing: {item.item.healing}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {/* Item Detail Modal */}
        {selectedItem && (
          <Modal
            isOpen={!!selectedItem}
            onClose={() => setSelectedItem(null)}
            title={selectedItem.item.name}
          >
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  {getItemIcon(selectedItem.item.type)}
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {selectedItem.item.name}
                    </h2>
                    <p
                      className={`text-lg ${getRarityColor(
                        selectedItem.item.rarity
                      )}`}
                    >
                      {selectedItem.item.rarity}
                    </p>
                  </div>
                </div>

                <p className="text-gray-300 mb-4">
                  {selectedItem.item.description}
                </p>

                <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Item Stats
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Coins className="h-5 w-5 text-yellow-400" />
                      <span className="text-gray-300">Value:</span>
                      <span className="text-yellow-400 font-semibold">
                        {selectedItem.item.value} gold
                      </span>
                    </div>
                    {selectedItem.item.attack && (
                      <div className="flex items-center space-x-2">
                        <Sword className="h-5 w-5 text-orange-400" />
                        <span className="text-gray-300">Attack:</span>
                        <span className="text-orange-400 font-semibold">
                          +{selectedItem.item.attack}
                        </span>
                      </div>
                    )}
                    {selectedItem.item.defense && (
                      <div className="flex items-center space-x-2">
                        <Shield className="h-5 w-5 text-blue-400" />
                        <span className="text-gray-300">Defense:</span>
                        <span className="text-blue-400 font-semibold">
                          +{selectedItem.item.defense}
                        </span>
                      </div>
                    )}
                    {selectedItem.item.healing && (
                      <div className="flex items-center space-x-2">
                        <Heart className="h-5 w-5 text-red-400" />
                        <span className="text-gray-300">Healing:</span>
                        <span className="text-red-400 font-semibold">
                          +{selectedItem.item.healing}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                {canUse(selectedItem) && (
                  <Button
                    onClick={() => handleUseItem(selectedItem)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={useItemMutation.isPending}
                  >
                    {useItemMutation.isPending ? "Using..." : "Use Item"}
                  </Button>
                )}
                {canEquip(selectedItem) && (
                  <Button
                    onClick={() => handleToggleEquip(selectedItem)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={toggleEquipMutation.isPending}
                  >
                    {toggleEquipMutation.isPending
                      ? "Processing..."
                      : selectedItem.equipped
                      ? "Unequip"
                      : "Equip"}
                  </Button>
                )}
                <Button
                  onClick={() => setSelectedItem(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Modal>
  );
}
