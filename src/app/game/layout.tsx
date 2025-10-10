"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  Home,
  Users,
  Sword,
  User,
  Settings,
  LogOut,
  Crown,
  Coins,
  Heart,
  Star,
  Menu,
  Package,
  BarChart3,
} from "@/components/icons";
import { api } from "@/trpc/react";
import { LevelUpNotification } from "@/components/game/LevelUpNotification";
import { Inventory } from "@/components/game/Inventory";
import { StatisticsPanel } from "@/components/game/StatisticsPanel";
import { useWebSocketStore } from "@/stores/websocket";

interface GameLayoutProps {
  children: React.ReactNode;
}

export default function GameLayout({ children }: GameLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [statisticsOpen, setStatisticsOpen] = useState(false);

  // Fetch real character data
  const { data: character, isLoading: characterLoading } =
    api.character.getCurrent.useQuery();

  // Fetch experience info
  const { data: experienceInfo } = api.character.getExperienceInfo.useQuery();

  // WebSocket store for level-up notifications
  const { levelUpNotification, setLevelUpNotification } = useWebSocketStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-amber-950 to-stone-900">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-stone-900/95 backdrop-blur-sm border-r border-amber-900/30 shadow-2xl transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-amber-900/30 bg-gradient-to-r from-burgundy-900/20 to-transparent">
            <h1 className="text-2xl font-bold text-white flex items-center">
              <Crown className="h-6 w-6 text-amber-500 mr-2" />
              The Guild
            </h1>
          </div>

          {/* Character Stats */}
          <div className="p-4 border-b border-amber-900/30">
            <Card className="glass">
              <CardContent className="p-4">
                {characterLoading ? (
                  <div className="space-y-3">
                    <div className="animate-pulse">
                      <div className="h-4 bg-stone-700 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-stone-700 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-stone-700 rounded w-2/3 mb-2"></div>
                      <div className="h-4 bg-stone-700 rounded w-1/2"></div>
                    </div>
                  </div>
                ) : character ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-stone-300">Level</span>
                      <span className="text-sm font-semibold text-white">
                        {character.level}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-stone-300">Gold</span>
                      <span className="text-sm font-semibold text-yellow-400 flex items-center">
                        <Coins className="h-4 w-4 mr-1" />
                        {character.gold}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-stone-300">Health</span>
                      <span className="text-sm font-semibold text-red-400 flex items-center">
                        <Heart className="h-4 w-4 mr-1" />
                        {character.health}/{character.maxHealth}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-stone-300">Reputation</span>
                      <span
                        className={`text-sm font-semibold flex items-center ${
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
                    {experienceInfo && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-stone-300">
                            Experience
                          </span>
                          <span className="text-sm font-semibold text-yellow-400">
                            {experienceInfo.experienceProgress}/
                            {experienceInfo.experienceNeeded}
                          </span>
                        </div>
                        <div className="w-full bg-stone-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${experienceInfo.progressPercentage}%`,
                            }}
                          />
                        </div>
                        <div className="text-xs text-stone-400 text-center">
                          {experienceInfo.experienceToNext} XP to Level{" "}
                          {experienceInfo.currentLevel + 1}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-stone-400 text-sm">
                    No character found
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <Link href="/game/hub">
              <Button variant="ghost" className="w-full justify-start">
                <Home className="h-4 w-4 mr-2" />
                Hub
              </Button>
            </Link>
            <Link href="/game/parties">
              <Button variant="ghost" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Parties
              </Button>
            </Link>
            <Link href="/game/missions">
              <Button variant="ghost" className="w-full justify-start">
                <Sword className="h-4 w-4 mr-2" />
                Missions
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setInventoryOpen(true)}
            >
              <Package className="h-4 w-4 mr-2" />
              Inventory
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setStatisticsOpen(true)}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Statistics
            </Button>
            <Link href="/game/profile">
              <Button variant="ghost" className="w-full justify-start">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
            </Link>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-amber-900/30">
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-red-400 hover:text-red-300"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <div className="bg-stone-900/50 backdrop-blur-sm border-b border-amber-900/30 p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-4">
              {characterLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-20 bg-stone-700 rounded animate-pulse"></div>
                  <div className="h-4 w-16 bg-stone-700 rounded animate-pulse"></div>
                </div>
              ) : character ? (
                <>
                  <span className="text-white font-semibold">
                    {character.name}
                  </span>
                  <div className="flex items-center space-x-2 text-sm text-stone-300">
                    <span>Lv.{character.level}</span>
                    <span>•</span>
                    <span className="text-yellow-400">{character.gold}g</span>
                  </div>
                </>
              ) : (
                <span className="text-stone-400 text-sm">No character</span>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>

      {/* Level Up Notification */}
      <LevelUpNotification
        notification={levelUpNotification}
        onClose={() => setLevelUpNotification(null)}
      />

      {/* Inventory Modal */}
      <Inventory
        isOpen={inventoryOpen}
        onClose={() => setInventoryOpen(false)}
      />

      {/* Statistics Panel */}
      <StatisticsPanel
        isOpen={statisticsOpen}
        onClose={() => setStatisticsOpen(false)}
      />
    </div>
  );
}
