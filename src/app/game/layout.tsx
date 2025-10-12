"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
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
import { LevelUpPanel } from "@/components/game/LevelUpPanel";
import { Inventory } from "@/components/game/Inventory";
import { StatisticsPanel } from "@/components/game/StatisticsPanel";
import { getExperienceInfo } from "@/lib/utils/experience";
import { useWebSocketStore } from "@/stores/websocket";

interface GameLayoutProps {
  children: React.ReactNode;
}

export default function GameLayout({ children }: GameLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isDungeonPage = pathname?.includes("/game/dungeon/");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [statisticsOpen, setStatisticsOpen] = useState(false);
  const [showLevelUpPanel, setShowLevelUpPanel] = useState(false);

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut({
        redirect: false,
        callbackUrl: "/auth/login",
      });
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Fetch real character data
  const utils = api.useUtils();
  const { data: character, isLoading: characterLoading } =
    api.character.getCurrent.useQuery();
  const { data: canLevelUpData } = api.character.canLevelUp.useQuery();

  // Calculate experience info from character data using shared utility
  const experienceInfo = character
    ? getExperienceInfo(character.level, character.experience)
    : null;

  // Debug logging for character data
  useEffect(() => {
    if (character) {
      console.log("🎮 [Layout] Character data updated:", {
        id: character.id,
        name: character.name,
        level: character.level,
        experience: character.experience,
        gold: character.gold,
      });
    }
  }, [character]);

  useEffect(() => {
    if (experienceInfo) {
      console.log("🎮 [Layout] Experience info updated:", experienceInfo);
    }
  }, [experienceInfo]);

  useEffect(() => {
    if (canLevelUpData) {
      console.log("🎮 [Layout] Can level up data:", canLevelUpData);
    }
  }, [canLevelUpData]);

  // WebSocket store for level-up and experience notifications
  const {
    levelUpNotification,
    setLevelUpNotification,
    experienceUpdateNotification,
    setExperienceUpdateNotification,
  } = useWebSocketStore();

  // Handle level-up and experience update notifications and invalidate character queries
  useEffect(() => {
    if (levelUpNotification || experienceUpdateNotification) {
      console.log("🔄 Invalidating character queries due to notification:", {
        levelUpNotification,
        experienceUpdateNotification,
      });
      // Invalidate character query to refresh the UI with updated stats and experience
      utils.character.getCurrent.invalidate();
    }
  }, [levelUpNotification, experienceUpdateNotification, utils]);

  // If we're in a dungeon page, render children directly without the game layout
  if (isDungeonPage) {
    return (
      <>
        {children}
        {/* Still show level up notifications and modals */}
        <LevelUpNotification
          notification={levelUpNotification}
          onClose={() => setLevelUpNotification(null)}
        />
        <Inventory
          isOpen={inventoryOpen}
          onClose={() => setInventoryOpen(false)}
        />
        <StatisticsPanel
          isOpen={statisticsOpen}
          onClose={() => setStatisticsOpen(false)}
        />
        <LevelUpPanel
          isOpen={showLevelUpPanel}
          onClose={async () => {
            setShowLevelUpPanel(false);
            await utils.character.getCurrent.invalidate();
            await utils.character.canLevelUp.invalidate();
          }}
        />
      </>
    );
  }

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
                        {character.currentHealth}/{character.maxHealth}
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
                        <div className="w-full bg-stone-700 rounded-full h-2 relative">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              experienceInfo.canLevelUp
                                ? "bg-gradient-to-r from-green-500 to-green-400 animate-pulse"
                                : "bg-gradient-to-r from-yellow-500 to-yellow-400"
                            }`}
                            style={{
                              width: `${Math.min(
                                experienceInfo.progressPercentage,
                                100
                              )}%`,
                            }}
                          />
                          {experienceInfo.canLevelUp && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                              <span className="text-xs text-black font-bold">
                                !
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-stone-400 text-center">
                          {experienceInfo.canLevelUp ? (
                            <span className="text-green-400 font-semibold">
                              Ready to Level Up!
                            </span>
                          ) : experienceInfo.isMaxLevel ? (
                            <span className="text-purple-400 font-semibold">
                              Max Level Reached
                            </span>
                          ) : (
                            `${experienceInfo.experienceToNext} XP to Level ${
                              experienceInfo.currentLevel + 1
                            }`
                          )}
                        </div>
                      </div>
                    )}

                    {/* Level Up Button */}
                    {(canLevelUpData?.canLevelUp ||
                      experienceInfo?.canLevelUp) && (
                      <div className="mt-3">
                        <Button
                          className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold"
                          onClick={() => setShowLevelUpPanel(true)}
                        >
                          <Star className="h-4 w-4 mr-2" />
                          Level Up! ({canLevelUpData?.pendingLevels || 1} level
                          {(canLevelUpData?.pendingLevels || 1) > 1 ? "s" : ""})
                        </Button>
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
                onClick={handleLogout}
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

      {/* Level Up Panel */}
      <LevelUpPanel
        isOpen={showLevelUpPanel}
        onClose={async () => {
          setShowLevelUpPanel(false);
          // Refresh character data when panel closes
          await utils.character.getCurrent.invalidate();
          await utils.character.canLevelUp.invalidate();
        }}
      />
    </div>
  );
}
