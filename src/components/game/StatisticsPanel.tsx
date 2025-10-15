"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Trophy,
  Target,
  Clock,
  Coins,
  Sword,
  Heart,
  TrendingUp,
  Users,
  BarChart3,
  AlertTriangle,
} from "@/components/icons";
import { api } from "@/trpc/react";

interface StatisticsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StatisticsPanel({ isOpen, onClose }: StatisticsPanelProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "dungeons" | "leaderboard"
  >("overview");

  // Fetch statistics data with refetch on open
  const { data: performanceSummary, refetch: refetchPerformance } =
    api.statistics.getPerformanceSummary.useQuery();
  const { data: recentDungeons, refetch: refetchRecentDungeons } =
    api.statistics.getRecentDungeons.useQuery({
      limit: 5,
    });
  const { data: leaderboard, refetch: refetchLeaderboard } =
    api.statistics.getLeaderboard.useQuery({
      type: "dungeons",
      limit: 10,
    });

  // Refetch all data when panel opens
  React.useEffect(() => {
    if (isOpen) {
      refetchPerformance();
      refetchRecentDungeons();
      refetchLeaderboard();
    }
  }, [isOpen, refetchPerformance, refetchRecentDungeons, refetchLeaderboard]);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-stone-900 rounded-lg w-full max-w-6xl h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-700">
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <BarChart3 className="h-6 w-6" />
            <span>Statistics</span>
          </h2>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-700">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "dungeons", label: "Dungeons", icon: Target },
            { id: "leaderboard", label: "Leaderboard", icon: Trophy },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-full">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Performance Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="glass">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Target className="h-8 w-8 text-blue-400" />
                      <div>
                        <p className="text-sm text-stone-400">Dungeons</p>
                        <p className="text-2xl font-bold text-white">
                          {performanceSummary?.totalDungeons || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="h-8 w-8 text-green-400" />
                      <div>
                        <p className="text-sm text-stone-400">Success Rate</p>
                        <p className="text-2xl font-bold text-white">
                          {performanceSummary?.successRate?.toFixed(1) || 0}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-8 w-8 text-yellow-400" />
                      <div>
                        <p className="text-sm text-stone-400">Avg Time</p>
                        <p className="text-2xl font-bold text-white">
                          {formatTime(performanceSummary?.averageTime || 0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Coins className="h-8 w-8 text-yellow-400" />
                      <div>
                        <p className="text-sm text-stone-400">Total Gold</p>
                        <p className="text-2xl font-bold text-white">
                          {formatNumber(performanceSummary?.totalGold || 0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Combat Stats */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Sword className="h-5 w-5" />
                    <span>Combat Statistics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-400">
                        {formatNumber(performanceSummary?.totalEnemies || 0)}
                      </p>
                      <p className="text-sm text-stone-400">Enemies Defeated</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-400">
                        {formatNumber(
                          performanceSummary?.records?.mostEnemies || 0
                        )}
                      </p>
                      <p className="text-sm text-gray-400">
                        Best in One Dungeon
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-400">
                        {formatNumber(
                          performanceSummary?.records?.longestDungeon || 0
                        )}
                      </p>
                      <p className="text-sm text-gray-400">
                        Longest Dungeon (s)
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-400">
                        {formatNumber(
                          performanceSummary?.records?.mostGold || 0
                        )}
                      </p>
                      <p className="text-sm text-gray-400">Most Gold (1 run)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "dungeons" && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">
                Recent Dungeons
              </h3>
              {recentDungeons?.length === 0 ? (
                <Card className="glass">
                  <CardContent className="p-8 text-center">
                    <Target className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">
                      No dungeons completed yet
                    </p>
                    <p className="text-gray-500 text-sm">
                      Start your first adventure!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                recentDungeons?.map((dungeon) => (
                  <Card key={dungeon.id} className="glass">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-white">
                            {dungeon.mission.name}
                          </h4>
                          <p className="text-sm text-gray-400">
                            {dungeon.missionEndTime
                              ? new Date(
                                  dungeon.missionEndTime
                                ).toLocaleDateString()
                              : "In Progress"}
                          </p>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-lg font-bold ${
                              dungeon.status === "COMPLETED"
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {dungeon.status === "COMPLETED"
                              ? "Victory"
                              : "Defeat"}
                          </div>
                          {dungeon.statistics && (
                            <div className="text-sm text-gray-400">
                              {dungeon.statistics.totalEvents} events •{" "}
                              {formatTime(dungeon.statistics.totalTimeSpent)}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === "leaderboard" && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">
                Top Adventurers
              </h3>
              {leaderboard?.length === 0 ? (
                <Card className="glass">
                  <CardContent className="p-8 text-center">
                    <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">
                      No leaderboard data available
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {leaderboard?.map((entry, index) => (
                    <Card key={entry.id} className="glass">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                index === 0
                                  ? "bg-yellow-500 text-black"
                                  : index === 1
                                  ? "bg-gray-400 text-black"
                                  : index === 2
                                  ? "bg-orange-600 text-white"
                                  : "bg-gray-700 text-white"
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-semibold text-white">
                                {entry.character.name}
                              </h4>
                              <p className="text-sm text-gray-400">
                                Level {entry.character.level}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-white">
                              {entry.totalDungeonsCompleted}
                            </div>
                            <div className="text-sm text-gray-400">
                              Dungeons
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
