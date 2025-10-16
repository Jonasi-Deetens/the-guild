"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { api } from "@/trpc/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  User,
  Star,
  Coins,
  Heart,
  Sword,
  Shield,
  Zap,
  Eye,
  Crown,
  Trophy,
  Clock,
  TrendingUp,
} from "@/components/icons";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [characterName, setCharacterName] = useState("");

  // Get real character data from tRPC
  const { data: character, isLoading: characterLoading } =
    api.character.getCurrent.useQuery();
  const { data: goldAmount } = api.character.getGoldAmount.useQuery();

  // Update character name when data loads
  useEffect(() => {
    if (character?.name) {
      setCharacterName(character.name);
    }
  }, [character?.name]);

  const stats = {
    missionsCompleted: 23,
    missionsFailed: 3,
    totalDamageDealt: 12500,
    totalDamageTaken: 8500,
    totalHealing: 3200,
    partiesJoined: 15,
    partiesLed: 8,
    totalPlayTime: "45h 30m",
  };

  const achievements = [
    {
      id: "1",
      name: "First Steps",
      description: "Complete your first mission",
      icon: Trophy,
      unlocked: true,
      unlockedAt: "2024-01-15",
    },
    {
      id: "2",
      name: "Party Leader",
      description: "Lead 5 successful parties",
      icon: Crown,
      unlocked: true,
      unlockedAt: "2024-01-18",
    },
    {
      id: "3",
      name: "Dragon Slayer",
      description: "Defeat a dragon",
      icon: Sword,
      unlocked: false,
      unlockedAt: null,
    },
    {
      id: "4",
      name: "Master Thief",
      description: "Successfully steal 100 gold",
      icon: Eye,
      unlocked: false,
      unlockedAt: null,
    },
  ];

  const recentActivity = [
    {
      id: "1",
      type: "mission",
      message: "Completed 'Dragon Lair' mission",
      timestamp: "2 hours ago",
      icon: Trophy,
    },
    {
      id: "2",
      type: "party",
      message: "Joined party 'Dragon Slayers'",
      timestamp: "4 hours ago",
      icon: Crown,
    },
    {
      id: "3",
      type: "trade",
      message: "Traded with MerchantKing",
      timestamp: "1 day ago",
      icon: Coins,
    },
    {
      id: "4",
      type: "theft",
      message: "Stole 50 gold from ShadowThief",
      timestamp: "2 days ago",
      icon: Eye,
    },
  ];

  const handleSaveName = () => {
    // TODO: Implement name change with tRPC
    console.log("Saving name:", characterName);
    setIsEditing(false);
  };

  // Show loading state
  if (characterLoading || !character) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center text-white">
            <div className="text-xl">Loading character data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">
          Character Profile
        </h1>
        <p className="text-gray-300">View and manage your character</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Character Info */}
        <div className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-400" />
                Character Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl">
                  {character.name[0]}
                </div>
                <div className="flex-1">
                  {isEditing ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        value={characterName}
                        onChange={(e) => setCharacterName(e.target.value)}
                        className="flex-1"
                      />
                      <Button size="sm" onClick={handleSaveName}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xl font-semibold text-white">
                        {character.name}
                      </h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditing(true)}
                      >
                        Edit
                      </Button>
                    </div>
                  )}
                  <p className="text-sm text-gray-400">
                    Level {character.level}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Experience:</span>
                  <span className="text-white">
                    {character.experience.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Gold:</span>
                  <span className="text-yellow-400 flex items-center">
                    <Coins className="h-4 w-4 mr-1" />
                    {(goldAmount || character?.gold || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Reputation:</span>
                  <span
                    className={`flex items-center ${
                      character.reputation >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    <Star className="h-4 w-4 mr-1" />
                    {character.reputation > 0 ? "+" : ""}
                    {character.reputation}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Health:</span>
                  <span className="text-red-400 flex items-center">
                    <Heart className="h-4 w-4 mr-1" />
                    {character.currentHealth}/{character.maxHealth}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Character Stats */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Character Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Attack:</span>
                  <span className="text-orange-400 flex items-center">
                    <Sword className="h-4 w-4 mr-1" />
                    {character.attack}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Defense:</span>
                  <span className="text-blue-400 flex items-center">
                    <Shield className="h-4 w-4 mr-1" />
                    {character.defense}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Speed:</span>
                  <span className="text-green-400 flex items-center">
                    <Zap className="h-4 w-4 mr-1" />
                    {character.speed}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Perception:</span>
                  <span className="text-purple-400 flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    {character.perception}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center Column - Statistics */}
        <div className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-400" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Missions Completed:</span>
                  <span className="text-white">{stats.missionsCompleted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Missions Failed:</span>
                  <span className="text-white">{stats.missionsFailed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Damage Dealt:</span>
                  <span className="text-orange-400">
                    {stats.totalDamageDealt.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Damage Taken:</span>
                  <span className="text-red-400">
                    {stats.totalDamageTaken.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Healing Done:</span>
                  <span className="text-green-400">
                    {stats.totalHealing.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Parties Joined:</span>
                  <span className="text-blue-400">{stats.partiesJoined}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Parties Led:</span>
                  <span className="text-purple-400">{stats.partiesLed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total Play Time:</span>
                  <span className="text-white">{stats.totalPlayTime}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-yellow-400" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-3 p-2 rounded-lg bg-gray-800/30"
                    >
                      <Icon className="h-4 w-4 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-white">{activity.message}</p>
                        <p className="text-xs text-gray-500">
                          {activity.timestamp}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Achievements */}
        <div className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {achievements.map((achievement) => {
                  const Icon = achievement.icon;
                  return (
                    <div
                      key={achievement.id}
                      className={`p-3 rounded-lg transition-all ${
                        achievement.unlocked
                          ? "bg-green-500/10 border border-green-500/20"
                          : "bg-gray-800/30 border border-gray-700/50"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon
                          className={`h-6 w-6 ${
                            achievement.unlocked
                              ? "text-yellow-400"
                              : "text-gray-600"
                          }`}
                        />
                        <div className="flex-1">
                          <h4
                            className={`font-medium ${
                              achievement.unlocked
                                ? "text-white"
                                : "text-gray-400"
                            }`}
                          >
                            {achievement.name}
                          </h4>
                          <p className="text-sm text-gray-400">
                            {achievement.description}
                          </p>
                          {achievement.unlocked && achievement.unlockedAt && (
                            <p className="text-xs text-green-400 mt-1">
                              Unlocked:{" "}
                              {new Date(
                                achievement.unlockedAt
                              ).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        {achievement.unlocked && (
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
