"use client";

import { useState } from "react";
import { EquipmentSlot } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  getSlotIcon,
  getSlotName,
  getRarityClass,
  getRarityBorderClass,
} from "@/lib/utils/equipment";
import { X, Info } from "@/components/icons";

interface EquippedItem {
  id: string;
  name: string;
  description: string;
  rarity: string;
  attack?: number;
  defense?: number;
  speed?: number;
  perception?: number;
  health?: number;
  attackPercent?: number;
  defensePercent?: number;
  speedPercent?: number;
  perceptionPercent?: number;
}

interface EquipmentSlotProps {
  slot: EquipmentSlot;
  item?: EquippedItem;
  onUnequip: (slot: EquipmentSlot) => void;
  onItemClick?: (item: EquippedItem) => void;
  className?: string;
}

export function EquipmentSlotComponent({
  slot,
  item,
  onUnequip,
  onItemClick,
  className = "",
}: EquipmentSlotProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const slotIcon = getSlotIcon(slot);
  const slotName = getSlotName(slot);

  const handleUnequip = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUnequip(slot);
  };

  const handleItemClick = () => {
    if (item && onItemClick) {
      onItemClick(item);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Card
        className={`
          glass cursor-pointer transition-all hover:scale-105 min-h-[80px] min-w-[80px] flex items-center justify-center
          ${
            item
              ? `${getRarityBorderClass(item.rarity)} border-2`
              : "border border-gray-600"
          }
        `}
        onClick={handleItemClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <CardContent className="p-2 text-center">
          {item ? (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-white truncate">
                {item.name}
              </div>
              <div className="text-xs text-gray-400">
                {item.attack && `+${item.attack} ATK`}
                {item.defense && ` +${item.defense} DEF`}
                {item.speed && ` +${item.speed} SPD`}
                {item.perception && ` +${item.perception} PER`}
                {item.health && ` +${item.health} HP`}
              </div>
              <Button
                size="sm"
                variant="destructive"
                className="h-6 w-6 p-0"
                onClick={handleUnequip}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-gray-500">{slotIcon}</div>
              <div className="text-xs text-gray-500">{slotName}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tooltip */}
      {showTooltip && item && (
        <div className="absolute z-50 bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-lg min-w-[200px] top-full left-1/2 transform -translate-x-1/2 mt-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className={`font-semibold ${getRarityClass(item.rarity)}`}>
                {item.name}
              </h3>
              <span className="text-xs text-gray-400">{item.rarity}</span>
            </div>

            <p className="text-sm text-gray-300">{item.description}</p>

            {/* Stats */}
            <div className="space-y-1">
              {item.attack && (
                <div className="flex justify-between text-sm">
                  <span className="text-orange-400">Attack:</span>
                  <span className="text-white">
                    +{item.attack}
                    {item.attackPercent &&
                      ` (+${Math.round(item.attackPercent * 100)}%)`}
                  </span>
                </div>
              )}
              {item.defense && (
                <div className="flex justify-between text-sm">
                  <span className="text-blue-400">Defense:</span>
                  <span className="text-white">
                    +{item.defense}
                    {item.defensePercent &&
                      ` (+${Math.round(item.defensePercent * 100)}%)`}
                  </span>
                </div>
              )}
              {item.speed && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-400">Speed:</span>
                  <span className="text-white">
                    +{item.speed}
                    {item.speedPercent &&
                      ` (+${Math.round(item.speedPercent * 100)}%)`}
                  </span>
                </div>
              )}
              {item.perception && (
                <div className="flex justify-between text-sm">
                  <span className="text-purple-400">Perception:</span>
                  <span className="text-white">
                    +{item.perception}
                    {item.perceptionPercent &&
                      ` (+${Math.round(item.perceptionPercent * 100)}%)`}
                  </span>
                </div>
              )}
              {item.health && (
                <div className="flex justify-between text-sm">
                  <span className="text-red-400">Health:</span>
                  <span className="text-white">+{item.health}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-gray-600">
              <Button
                size="sm"
                variant="destructive"
                className="w-full"
                onClick={handleUnequip}
              >
                Unequip
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
