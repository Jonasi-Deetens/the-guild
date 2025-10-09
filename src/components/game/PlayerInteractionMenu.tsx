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
import { Modal } from "@/components/ui/Modal";
import {
  User,
  MessageCircle,
  Handshake,
  Eye,
  Coins,
  Star,
  AlertTriangle,
  Crown,
  Shield,
} from "@/components/icons";
import TradingModal from "./TradingModal";
import TheftModal from "./TheftModal";

interface PlayerInteractionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  player: {
    id: string;
    name: string;
    level: number;
    reputation: number;
    gold: number;
    perception: number;
    isOnline: boolean;
    lastSeen: string;
  };
  onTradeRequest: (data: any) => void;
  onTheftAttempt: (data: any) => void;
  onSendMessage: (message: string) => void;
}

export default function PlayerInteractionMenu({
  isOpen,
  onClose,
  player,
  onTradeRequest,
  onTheftAttempt,
  onSendMessage,
}: PlayerInteractionMenuProps) {
  const [showTradingModal, setShowTradingModal] = useState(false);
  const [showTheftModal, setShowTheftModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [message, setMessage] = useState("");

  const getReputationColor = (reputation: number) => {
    if (reputation >= 50) return "text-green-400";
    if (reputation >= 0) return "text-yellow-400";
    if (reputation >= -25) return "text-orange-400";
    return "text-red-400";
  };

  const getReputationLabel = (reputation: number) => {
    if (reputation >= 75) return "Heroic";
    if (reputation >= 50) return "Honorable";
    if (reputation >= 25) return "Trustworthy";
    if (reputation >= 0) return "Neutral";
    if (reputation >= -25) return "Suspicious";
    if (reputation >= -50) return "Dishonest";
    return "Villainous";
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage("");
      setShowMessageModal(false);
    }
  };

  // Don't render if player is null
  if (!player) {
    return null;
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Player Interaction">
        <div className="space-y-6">
          {/* Player Info */}
          <Card className="glass">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl">
                  {player?.name?.[0] || "?"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-xl font-semibold text-white">
                      {player?.name || "Unknown Player"}
                    </h3>
                    {player.isOnline ? (
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    ) : (
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Crown className="h-4 w-4 text-yellow-400" />
                      <span className="text-gray-400">Level:</span>
                      <span className="text-white">{player.level}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star
                        className={`h-4 w-4 ${getReputationColor(
                          player.reputation
                        )}`}
                      />
                      <span className="text-gray-400">Rep:</span>
                      <span className={getReputationColor(player.reputation)}>
                        {player.reputation > 0 ? "+" : ""}
                        {player.reputation}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Coins className="h-4 w-4 text-yellow-400" />
                      <span className="text-gray-400">Gold:</span>
                      <span className="text-yellow-400">
                        {player.gold.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4 text-purple-400" />
                      <span className="text-gray-400">Perception:</span>
                      <span className="text-purple-400">
                        {player.perception}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span
                      className={`text-sm font-medium ${getReputationColor(
                        player.reputation
                      )}`}
                    >
                      {getReputationLabel(player.reputation)}
                    </span>
                    {!player.isOnline && (
                      <span className="text-xs text-gray-500 ml-2">
                        Last seen:{" "}
                        {new Date(player.lastSeen).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interaction Options */}
          <div className="grid grid-cols-2 gap-4">
            {/* Trade */}
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2"
              onClick={() => setShowTradingModal(true)}
            >
              <Handshake className="h-6 w-6 text-green-400" />
              <span>Trade</span>
            </Button>

            {/* Send Message */}
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2"
              onClick={() => setShowMessageModal(true)}
            >
              <MessageCircle className="h-6 w-6 text-blue-400" />
              <span>Message</span>
            </Button>

            {/* Inspect Profile */}
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2"
              onClick={() => {
                // TODO: Navigate to player profile
                console.log("Inspect profile:", player.id);
              }}
            >
              <User className="h-6 w-6 text-purple-400" />
              <span>Profile</span>
            </Button>

            {/* Attempt Theft */}
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2 border-red-500/50 hover:border-red-500"
              onClick={() => setShowTheftModal(true)}
            >
              <Eye className="h-6 w-6 text-red-400" />
              <span>Steal</span>
            </Button>
          </div>

          {/* Reputation Warning */}
          {player.reputation < -25 && (
            <Card className="glass border-red-500/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <div>
                    <h4 className="text-red-400 font-medium">
                      Dangerous Player
                    </h4>
                    <p className="text-sm text-gray-300">
                      This player has a very low reputation. Interact with
                      caution.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* High Reputation Bonus */}
          {player.reputation >= 50 && (
            <Card className="glass border-green-500/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-green-400" />
                  <div>
                    <h4 className="text-green-400 font-medium">
                      Honorable Player
                    </h4>
                    <p className="text-sm text-gray-300">
                      This player has a high reputation and is known for fair
                      dealings.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Trading Modal */}
      <TradingModal
        isOpen={showTradingModal}
        onClose={() => setShowTradingModal(false)}
        targetCharacter={player}
        onTradeRequest={onTradeRequest}
      />

      {/* Theft Modal */}
      <TheftModal
        isOpen={showTheftModal}
        onClose={() => setShowTheftModal(false)}
        targetCharacter={player}
        onTheftAttempt={onTheftAttempt}
      />

      {/* Message Modal */}
      <Modal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        title={`Send Message to ${player.name}`}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full p-3 rounded-lg border border-gray-600 bg-gray-800 text-white resize-none"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-400">
              {message.length}/500 characters
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowMessageModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              className="flex-1"
              disabled={!message.trim()}
            >
              Send Message
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
