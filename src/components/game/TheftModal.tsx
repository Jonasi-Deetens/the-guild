"use client";

import { useState } from "react";
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
  Eye,
  Coins,
  AlertTriangle,
  User,
  Shield,
  Zap,
} from "@/components/icons";

interface TheftModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCharacter: {
    id: string;
    name: string;
    level: number;
    reputation: number;
    gold: number;
    perception: number;
  };
  onTheftAttempt: (data: { targetId: string; amount: number }) => void;
}

export default function TheftModal({
  isOpen,
  onClose,
  targetCharacter,
  onTheftAttempt,
}: TheftModalProps) {
  const [amount, setAmount] = useState(100);
  const [isCalculating, setIsCalculating] = useState(false);

  // Calculate success chance based on perception vs level difference
  const calculateSuccessChance = (
    targetLevel: number,
    targetPerception: number,
    myLevel: number = 10
  ) => {
    const levelDifference = targetLevel - myLevel;
    const perceptionBonus = targetPerception * 2; // Each perception point adds 2% detection chance
    const levelPenalty = Math.max(0, levelDifference * 5); // Each level difference adds 5% detection chance

    const detectionChance = Math.min(95, perceptionBonus + levelPenalty); // Max 95% detection chance
    const successChance = 100 - detectionChance;

    return {
      successChance: Math.max(5, successChance), // Min 5% success chance
      detectionChance: Math.min(95, detectionChance),
    };
  };

  const { successChance, detectionChance } = calculateSuccessChance(
    targetCharacter.level,
    targetCharacter.perception
  );

  const handleTheftAttempt = () => {
    if (amount <= 0 || amount > targetCharacter.gold) {
      alert("Invalid amount");
      return;
    }

    if (amount > 1000) {
      alert("Cannot steal more than 1000 gold per attempt");
      return;
    }

    setIsCalculating(true);

    // Simulate calculation delay
    setTimeout(() => {
      onTheftAttempt({
        targetId: targetCharacter.id,
        amount,
      });
      setIsCalculating(false);
      onClose();
    }, 1000);
  };

  const getRiskLevel = (chance: number) => {
    if (chance >= 70) return { level: "High Risk", color: "text-red-400" };
    if (chance >= 40) return { level: "Medium Risk", color: "text-yellow-400" };
    return { level: "Low Risk", color: "text-green-400" };
  };

  const riskLevel = getRiskLevel(detectionChance);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Attempt Theft">
      <div className="space-y-6">
        {/* Warning */}
        <Card className="glass border-red-500/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-400" />
              <div>
                <h3 className="text-red-400 font-medium">Warning</h3>
                <p className="text-sm text-gray-300">
                  Theft attempts will damage your reputation and may result in
                  retaliation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Target Character Info */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-400" />
              Target: {targetCharacter.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Level:</span>
                <span className="text-white">{targetCharacter.level}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Perception:</span>
                <span className="text-purple-400 flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {targetCharacter.perception}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Gold:</span>
                <span className="text-yellow-400 flex items-center">
                  <Coins className="h-4 w-4 mr-1" />
                  {targetCharacter.gold.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Reputation:</span>
                <span
                  className={`${
                    targetCharacter.reputation >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {targetCharacter.reputation > 0 ? "+" : ""}
                  {targetCharacter.reputation}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theft Amount */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Theft Amount</CardTitle>
            <CardDescription>
              How much gold do you want to attempt to steal?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Amount (Gold)
              </label>
              <div className="flex items-center space-x-2">
                <Coins className="h-4 w-4 text-yellow-400" />
                <Input
                  type="number"
                  min="1"
                  max={Math.min(1000, targetCharacter.gold)}
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-gray-400">
                Maximum: {Math.min(1000, targetCharacter.gold).toLocaleString()}{" "}
                gold
              </p>
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[50, 100, 250, 500].map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setAmount(Math.min(quickAmount, targetCharacter.gold))
                  }
                  disabled={quickAmount > targetCharacter.gold}
                >
                  {quickAmount}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Success Analysis */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-blue-400" />
              Success Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {successChance}%
                </div>
                <div className="text-sm text-gray-400">Success Chance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">
                  {detectionChance}%
                </div>
                <div className="text-sm text-gray-400">Detection Chance</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Risk Level:</span>
                <span className={riskLevel.color}>{riskLevel.level}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">
                  Reputation Loss (Success):
                </span>
                <span className="text-red-400">-{Math.floor(amount / 10)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">
                  Reputation Loss (Failure):
                </span>
                <span className="text-red-400">-{Math.floor(amount / 20)}</span>
              </div>
            </div>

            {/* Success/Failure Consequences */}
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center space-x-2 mb-1">
                  <Zap className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium text-green-400">
                    If Successful:
                  </span>
                </div>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>• Gain {amount} gold</li>
                  <li>• Lose {Math.floor(amount / 10)} reputation</li>
                  <li>• Target may place bounty on you</li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center space-x-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span className="text-sm font-medium text-red-400">
                    If Failed:
                  </span>
                </div>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>• No gold gained</li>
                  <li>• Lose {Math.floor(amount / 20)} reputation</li>
                  <li>• Target is alerted to your attempt</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleTheftAttempt}
            className="flex-1"
            disabled={
              isCalculating || amount <= 0 || amount > targetCharacter.gold
            }
          >
            {isCalculating ? "Calculating..." : "Attempt Theft"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
