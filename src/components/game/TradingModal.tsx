"use client";

import { useState, useEffect } from "react";
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
  Coins,
  Package,
  User,
  ArrowRight,
  X,
  Plus,
  Minus,
} from "@/components/icons";

interface TradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCharacter: {
    id: string;
    name: string;
    level: number;
    reputation: number;
  };
  onTradeRequest: (data: {
    targetId: string;
    offeredItems: Array<{ itemId: string; quantity: number }>;
    offeredGold: number;
    requestedItems: Array<{ itemId: string; quantity: number }>;
    requestedGold: number;
    message?: string;
  }) => void;
}

interface Item {
  id: string;
  name: string;
  type: string;
  value: number;
  quantity: number;
}

export default function TradingModal({
  isOpen,
  onClose,
  targetCharacter,
  onTradeRequest,
}: TradingModalProps) {
  const [offeredGold, setOfferedGold] = useState(0);
  const [requestedGold, setRequestedGold] = useState(0);
  const [offeredItems, setOfferedItems] = useState<
    Array<{ itemId: string; quantity: number }>
  >([]);
  const [requestedItems, setRequestedItems] = useState<
    Array<{ itemId: string; quantity: number }>
  >([]);
  const [message, setMessage] = useState("");
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [targetItems, setTargetItems] = useState<Item[]>([]);

  useEffect(() => {
    if (isOpen) {
      // TODO: Load character's inventory via tRPC
      const mockMyItems: Item[] = [
        { id: "1", name: "Iron Sword", type: "WEAPON", value: 50, quantity: 1 },
        {
          id: "2",
          name: "Health Potion",
          type: "CONSUMABLE",
          value: 10,
          quantity: 5,
        },
        {
          id: "3",
          name: "Leather Armor",
          type: "ARMOR",
          value: 30,
          quantity: 1,
        },
      ];
      setMyItems(mockMyItems);

      const mockTargetItems: Item[] = [
        {
          id: "4",
          name: "Steel Sword",
          type: "WEAPON",
          value: 100,
          quantity: 1,
        },
        {
          id: "5",
          name: "Mana Potion",
          type: "CONSUMABLE",
          value: 15,
          quantity: 3,
        },
      ];
      setTargetItems(mockTargetItems);
    }
  }, [isOpen]);

  const addOfferedItem = (item: Item) => {
    const existing = offeredItems.find((i) => i.itemId === item.id);
    if (existing) {
      setOfferedItems((prev) =>
        prev.map((i) =>
          i.itemId === item.id
            ? { ...i, quantity: Math.min(i.quantity + 1, item.quantity) }
            : i
        )
      );
    } else {
      setOfferedItems((prev) => [...prev, { itemId: item.id, quantity: 1 }]);
    }
  };

  const removeOfferedItem = (itemId: string) => {
    setOfferedItems((prev) => prev.filter((i) => i.itemId !== itemId));
  };

  const updateOfferedItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeOfferedItem(itemId);
      return;
    }

    const item = myItems.find((i) => i.id === itemId);
    if (item && quantity <= item.quantity) {
      setOfferedItems((prev) =>
        prev.map((i) => (i.itemId === itemId ? { ...i, quantity } : i))
      );
    }
  };

  const addRequestedItem = (item: Item) => {
    const existing = requestedItems.find((i) => i.itemId === item.id);
    if (existing) {
      setRequestedItems((prev) =>
        prev.map((i) =>
          i.itemId === item.id
            ? { ...i, quantity: Math.min(i.quantity + 1, item.quantity) }
            : i
        )
      );
    } else {
      setRequestedItems((prev) => [...prev, { itemId: item.id, quantity: 1 }]);
    }
  };

  const removeRequestedItem = (itemId: string) => {
    setRequestedItems((prev) => prev.filter((i) => i.itemId !== itemId));
  };

  const updateRequestedItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeRequestedItem(itemId);
      return;
    }

    const item = targetItems.find((i) => i.id === itemId);
    if (item && quantity <= item.quantity) {
      setRequestedItems((prev) =>
        prev.map((i) => (i.itemId === itemId ? { ...i, quantity } : i))
      );
    }
  };

  const handleSubmit = () => {
    if (offeredItems.length === 0 && offeredGold === 0) {
      alert("You must offer something in the trade");
      return;
    }

    onTradeRequest({
      targetId: targetCharacter.id,
      offeredItems,
      offeredGold,
      requestedItems,
      requestedGold,
      message: message.trim() || undefined,
    });

    onClose();
  };

  const getItemName = (itemId: string, items: Item[]) => {
    return items.find((i) => i.id === itemId)?.name || "Unknown Item";
  };

  const getTotalValue = (
    items: Array<{ itemId: string; quantity: number }>,
    itemList: Item[]
  ) => {
    return items.reduce((total, item) => {
      const itemData = itemList.find((i) => i.id === item.itemId);
      return total + (itemData?.value || 0) * item.quantity;
    }, 0);
  };

  const offeredValue = getTotalValue(offeredItems, myItems) + offeredGold;
  const requestedValue =
    getTotalValue(requestedItems, targetItems) + requestedGold;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Trade Request">
      <div className="space-y-6">
        {/* Target Character Info */}
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                {targetCharacter.name[0]}
              </div>
              <div>
                <h3 className="text-white font-medium">
                  {targetCharacter.name}
                </h3>
                <p className="text-sm text-gray-400">
                  Level {targetCharacter.level} •{" "}
                  {targetCharacter.reputation > 0 ? "+" : ""}
                  {targetCharacter.reputation} reputation
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trade Interface */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Your Offer */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg">Your Offer</CardTitle>
              <CardDescription>
                What you're offering to {targetCharacter.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Gold Offer */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Gold
                </label>
                <div className="flex items-center space-x-2">
                  <Coins className="h-4 w-4 text-yellow-400" />
                  <Input
                    type="number"
                    min="0"
                    value={offeredGold}
                    onChange={(e) =>
                      setOfferedGold(parseInt(e.target.value) || 0)
                    }
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Items Offer */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Items
                </label>
                <div className="space-y-2">
                  {offeredItems.map((item) => (
                    <div
                      key={item.itemId}
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-800/50"
                    >
                      <span className="text-sm text-white">
                        {getItemName(item.itemId, myItems)} x{item.quantity}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateOfferedItemQuantity(
                              item.itemId,
                              item.quantity - 1
                            )
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm text-gray-400 w-8 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateOfferedItemQuantity(
                              item.itemId,
                              item.quantity + 1
                            )
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeOfferedItem(item.itemId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Items */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Available Items
                </label>
                <div className="space-y-1">
                  {myItems.map((item) => (
                    <Button
                      key={item.id}
                      variant="outline"
                      size="sm"
                      className="w-full justify-between"
                      onClick={() => addOfferedItem(item)}
                    >
                      <span>
                        {item.name} x{item.quantity}
                      </span>
                      <span className="text-yellow-400">{item.value}g</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Value:</span>
                  <span className="text-yellow-400">{offeredValue}g</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Their Offer */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg">Requesting</CardTitle>
              <CardDescription>
                What you want from {targetCharacter.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Gold Request */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Gold
                </label>
                <div className="flex items-center space-x-2">
                  <Coins className="h-4 w-4 text-yellow-400" />
                  <Input
                    type="number"
                    min="0"
                    value={requestedGold}
                    onChange={(e) =>
                      setRequestedGold(parseInt(e.target.value) || 0)
                    }
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Items Request */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Items
                </label>
                <div className="space-y-2">
                  {requestedItems.map((item) => (
                    <div
                      key={item.itemId}
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-800/50"
                    >
                      <span className="text-sm text-white">
                        {getItemName(item.itemId, targetItems)} x{item.quantity}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateRequestedItemQuantity(
                              item.itemId,
                              item.quantity - 1
                            )
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm text-gray-400 w-8 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateRequestedItemQuantity(
                              item.itemId,
                              item.quantity + 1
                            )
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeRequestedItem(item.itemId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Items */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Available Items
                </label>
                <div className="space-y-1">
                  {targetItems.map((item) => (
                    <Button
                      key={item.id}
                      variant="outline"
                      size="sm"
                      className="w-full justify-between"
                      onClick={() => addRequestedItem(item)}
                    >
                      <span>
                        {item.name} x{item.quantity}
                      </span>
                      <span className="text-yellow-400">{item.value}g</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Value:</span>
                  <span className="text-yellow-400">{requestedValue}g</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trade Message */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">
            Message (Optional)
          </label>
          <Input
            placeholder="Add a message to your trade request..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={200}
          />
        </div>

        {/* Trade Summary */}
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-sm text-gray-400">Your Offer</div>
                <div className="text-lg font-semibold text-white">
                  {offeredValue}g
                </div>
              </div>
              <ArrowRight className="h-6 w-6 text-gray-400" />
              <div className="text-center">
                <div className="text-sm text-gray-400">Requesting</div>
                <div className="text-lg font-semibold text-white">
                  {requestedValue}g
                </div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <div className="text-sm text-gray-400">
                Trade Value Difference
              </div>
              <div
                className={`text-lg font-semibold ${
                  Math.abs(offeredValue - requestedValue) < 50
                    ? "text-green-400"
                    : "text-yellow-400"
                }`}
              >
                {Math.abs(offeredValue - requestedValue)}g
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="flex-1">
            Send Trade Request
          </Button>
        </div>
      </div>
    </Modal>
  );
}
