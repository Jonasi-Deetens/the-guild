"use client";

import { useState } from "react";
import {
  Heart,
  Sword,
  Shield,
  Star,
  MessageCircle,
  Send,
} from "@/components/icons";

interface PartyMember {
  id: string;
  name: string;
  currentHealth: number;
  maxHealth: number;
  attack: number;
  defense: number;
  level: number;
  isDead?: boolean;
}

interface ChatMessage {
  sender: string;
  message: string;
  timestamp: string;
}

interface PartyMembersSidebarProps {
  partyMembers: PartyMember[];
  partyChat?: ChatMessage[];
  onSendMessage?: (message: string) => void;
  className?: string;
}

export function PartyMembersSidebar({
  partyMembers,
  partyChat = [],
  onSendMessage,
  className = "",
}: PartyMembersSidebarProps) {
  const [chatMessage, setChatMessage] = useState("");

  const handleSendMessage = () => {
    if (chatMessage.trim() && onSendMessage) {
      onSendMessage(chatMessage.trim());
      setChatMessage("");
    }
  };
  const getHealthColor = (health: number, maxHealth: number) => {
    const percentage = (health / maxHealth) * 100;
    if (percentage > 60) return "bg-green-500";
    if (percentage > 30) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getCharacterIcon = (name: string) => {
    // Simple character icon based on name
    const firstLetter = name.charAt(0).toUpperCase();
    return (
      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
        {firstLetter}
      </div>
    );
  };

  return (
    <div
      className={`w-64 bg-stone-900/95 backdrop-blur-sm border-r border-amber-900/30 h-full flex flex-col ${className}`}
    >
      {/* Party Members Section */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          <Star className="h-5 w-5 mr-2 text-amber-400" />
          Party
        </h3>

        <div className="space-y-3">
          {partyMembers.length > 0 ? (
            partyMembers.map((member) => (
              <div
                key={member.id}
                className={`p-3 rounded-lg border transition-all duration-200 ${
                  member.isDead
                    ? "bg-red-900/20 border-red-500/50"
                    : "bg-gray-800/50 border-gray-600/50 hover:border-gray-500/50"
                }`}
              >
                {/* Character Header */}
                <div className="flex items-center space-x-3 mb-3">
                  {getCharacterIcon(member.name)}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium truncate">
                      {member.name}
                    </h4>
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <span>Lv.{member.level}</span>
                      {member.isDead && (
                        <span className="text-red-400 font-semibold">DEAD</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Health Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-1">
                      <Heart className="h-3 w-3 text-red-400" />
                      <span className="text-xs text-gray-300">Health</span>
                    </div>
                    <span className="text-xs text-gray-300">
                      {member.currentHealth}/{member.maxHealth}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getHealthColor(
                        member.currentHealth,
                        member.maxHealth
                      )}`}
                      style={{
                        width: `${Math.min(
                          (member.currentHealth / member.maxHealth) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Sword className="h-3 w-3 text-orange-400" />
                      <span className="text-gray-400">ATK</span>
                    </div>
                    <span className="text-orange-400 font-medium">
                      {member.attack}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Shield className="h-3 w-3 text-blue-400" />
                      <span className="text-gray-400">DEF</span>
                    </div>
                    <span className="text-blue-400 font-medium">
                      {member.defense}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-400">
              <p className="text-sm">No party members</p>
              <p className="text-xs mt-1">Solo mission</p>
            </div>
          )}
        </div>
      </div>

      {/* Party Chat Section */}
      {onSendMessage && (
        <div className="border-t border-amber-900/30 bg-stone-800/50">
          <div className="p-3 border-b border-gray-700/50">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-white">Party Chat</span>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="h-32 overflow-y-auto p-3 space-y-2">
            {partyChat.length === 0 ? (
              <p className="text-gray-400 text-xs text-center">
                No messages yet. Start the conversation!
              </p>
            ) : (
              partyChat.map((message, index) => (
                <div key={index} className="text-xs">
                  <span className="font-semibold text-blue-400">
                    {message.sender}:
                  </span>
                  <span className="text-gray-300 ml-2">{message.message}</span>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t border-gray-700/50">
            <div className="flex space-x-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage();
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
              />
              <button
                onClick={handleSendMessage}
                disabled={!chatMessage.trim()}
                className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
