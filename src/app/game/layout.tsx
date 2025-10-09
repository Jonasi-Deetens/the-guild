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
} from "@/components/icons";

interface GameLayoutProps {
  children: React.ReactNode;
}

export default function GameLayout({ children }: GameLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Mock character data - will be replaced with real data from tRPC
  const character = {
    name: "TestPlayer",
    level: 5,
    gold: 1250,
    health: 85,
    maxHealth: 100,
    reputation: 15,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900/95 backdrop-blur-sm border-r border-gray-700/50 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-700/50">
            <h1 className="text-2xl font-bold text-white flex items-center">
              <Crown className="h-6 w-6 text-purple-400 mr-2" />
              The Guild
            </h1>
          </div>

          {/* Character Stats */}
          <div className="p-4 border-b border-gray-700/50">
            <Card className="glass">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Level</span>
                    <span className="text-sm font-semibold text-white">
                      {character.level}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Gold</span>
                    <span className="text-sm font-semibold text-yellow-400 flex items-center">
                      <Coins className="h-4 w-4 mr-1" />
                      {character.gold}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Health</span>
                    <span className="text-sm font-semibold text-red-400 flex items-center">
                      <Heart className="h-4 w-4 mr-1" />
                      {character.health}/{character.maxHealth}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Reputation</span>
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
                </div>
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
            <Link href="/game/profile">
              <Button variant="ghost" className="w-full justify-start">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
            </Link>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700/50">
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
        <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700/50 p-4">
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
              <span className="text-white font-semibold">{character.name}</span>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <span>Lv.{character.level}</span>
                <span>•</span>
                <span className="text-yellow-400">{character.gold}g</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
