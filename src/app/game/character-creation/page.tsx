"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Crown, Sword, Shield, Zap, Eye, Heart } from "@/components/icons";

export default function CharacterCreationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    class: "warrior", // warrior, mage, rogue, cleric
  });

  const classes = [
    {
      id: "warrior",
      name: "Warrior",
      description: "High health and defense, perfect for tanking",
      icon: Shield,
      stats: { health: 120, attack: 12, defense: 15, speed: 8, perception: 6 },
    },
    {
      id: "mage",
      name: "Mage",
      description: "High attack and speed, low health",
      icon: Zap,
      stats: { health: 80, attack: 18, defense: 5, speed: 12, perception: 10 },
    },
    {
      id: "rogue",
      name: "Rogue",
      description: "High speed and perception, good for stealth",
      icon: Eye,
      stats: { health: 90, attack: 14, defense: 8, speed: 15, perception: 18 },
    },
    {
      id: "cleric",
      name: "Cleric",
      description: "Balanced stats with healing abilities",
      icon: Heart,
      stats: {
        health: 100,
        attack: 10,
        defense: 10,
        speed: 10,
        perception: 12,
      },
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement character creation with tRPC
    console.log("Creating character:", formData);
    router.push("/game/hub");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="glass">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white flex items-center justify-center">
              <Crown className="h-8 w-8 text-purple-400 mr-3" />
              Create Your Character
            </CardTitle>
            <CardDescription className="text-lg">
              Choose your path in The Guild
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Character Name */}
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-300"
                >
                  Character Name
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your character name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              {/* Class Selection */}
              <div className="space-y-4">
                <label className="text-sm font-medium text-gray-300">
                  Choose Your Class
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classes.map((cls) => {
                    const Icon = cls.icon;
                    return (
                      <div
                        key={cls.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          formData.class === cls.id
                            ? "border-purple-500 bg-purple-500/10"
                            : "border-gray-600 bg-gray-800/50 hover:border-gray-500"
                        }`}
                        onClick={() =>
                          setFormData({ ...formData, class: cls.id })
                        }
                      >
                        <div className="flex items-start space-x-3">
                          <Icon className="h-6 w-6 text-purple-400 mt-1" />
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white">
                              {cls.name}
                            </h3>
                            <p className="text-sm text-gray-400 mb-3">
                              {cls.description}
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Health:</span>
                                <span className="text-red-400">
                                  {cls.stats.health}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Attack:</span>
                                <span className="text-orange-400">
                                  {cls.stats.attack}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Defense:</span>
                                <span className="text-blue-400">
                                  {cls.stats.defense}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Speed:</span>
                                <span className="text-green-400">
                                  {cls.stats.speed}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center">
                <Button type="submit" size="lg" className="px-8">
                  <Sword className="h-5 w-5 mr-2" />
                  Create Character
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
