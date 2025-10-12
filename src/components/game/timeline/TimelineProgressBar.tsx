"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { TimelineViewer } from "./TimelineViewer";
import {
  Sword,
  Coins,
  AlertTriangle,
  Users,
  Skull,
  Eye,
  Zap,
} from "@/components/icons";

interface DungeonEvent {
  id: string;
  eventNumber: number;
  status: string;
  template: {
    type: string;
    name: string;
    description: string;
  };
  playerActions: Array<{
    characterId: string;
    character?: {
      name: string;
    };
  }>;
}

interface TimelineProgressBarProps {
  events: DungeonEvent[];
  playerPositions: Record<string, string>;
  className?: string;
}

export function TimelineProgressBar({
  events,
  playerPositions,
  className = "",
}: TimelineProgressBarProps) {
  const [showFullTimeline, setShowFullTimeline] = useState(false);

  const getEventIcon = (type: string) => {
    switch (type) {
      case "COMBAT":
        return <Sword className="w-4 h-4" />;
      case "TREASURE":
        return <Coins className="w-4 h-4" />;
      case "TRAP":
        return <AlertTriangle className="w-4 h-4" />;
      case "PUZZLE":
        return (
          <div className="w-4 h-4 bg-purple-400 rounded flex items-center justify-center text-white text-xs font-bold">
            ?
          </div>
        );
      case "CHOICE":
        return <Users className="w-4 h-4" />;
      case "BOSS":
        return <Skull className="w-4 h-4" />;
      case "NPC_ENCOUNTER":
        return <Eye className="w-4 h-4" />;
      case "ENVIRONMENTAL_HAZARD":
        return <Zap className="w-4 h-4" />;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded" />;
    }
  };

  const getEventStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-500 border-green-400";
      case "active":
        return "bg-blue-500 border-blue-400 animate-pulse";
      case "pending":
        return "bg-stone-500 border-stone-400";
      case "locked":
        return "bg-stone-700 border-stone-600 opacity-50";
      default:
        return "bg-stone-500 border-stone-400";
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "COMBAT":
        return "text-red-400";
      case "TREASURE":
        return "text-yellow-400";
      case "TRAP":
        return "text-orange-400";
      case "PUZZLE":
        return "text-amber-400";
      case "CHOICE":
        return "text-blue-400";
      case "BOSS":
        return "text-red-500";
      case "NPC_ENCOUNTER":
        return "text-green-400";
      case "ENVIRONMENTAL_HAZARD":
        return "text-stone-400";
      default:
        return "text-stone-400";
    }
  };

  // Sort events by event number
  const sortedEvents = [...events].sort(
    (a, b) => a.eventNumber - b.eventNumber
  );

  // Calculate progress
  const completedEvents = sortedEvents.filter(
    (e) => e.status.toLowerCase() === "completed"
  ).length;
  const totalEvents = sortedEvents.length;
  const progressPercentage =
    totalEvents > 0 ? (completedEvents / totalEvents) * 100 : 0;

  return (
    <>
      <div
        className={`bg-stone-800/50 border border-stone-600 rounded-lg p-3 ${className}`}
      >
        {/* Progress Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-semibold text-white">
              Dungeon Progress
            </h3>
            <span className="text-xs text-gray-400">
              {completedEvents}/{totalEvents} events
            </span>
          </div>
          <button
            onClick={() => setShowFullTimeline(true)}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            View Full Timeline
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-stone-700 rounded-full h-2 mb-3">
          <div
            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Event Timeline */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {sortedEvents.map((event, index) => {
            const status = event.status.toLowerCase();
            const isActive = status === "active";
            const isCompleted = status === "completed";
            const isLocked = status === "locked";

            return (
              <div
                key={event.id}
                className={`flex flex-col items-center space-y-1 min-w-0 flex-shrink-0 ${
                  isActive ? "scale-110" : ""
                } transition-transform duration-200`}
              >
                {/* Event Icon */}
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${getEventStatusColor(
                    status
                  )} ${getEventTypeColor(event.template.type)}`}
                  title={`${event.template.name} - ${event.template.type}`}
                >
                  {getEventIcon(event.template.type)}
                </div>

                {/* Event Number */}
                <span className="text-xs text-gray-400 font-mono">
                  #{event.eventNumber}
                </span>

                {/* Connection Line */}
                {index < sortedEvents.length - 1 && (
                  <div className="absolute left-8 top-4 w-8 h-0.5 bg-stone-600 -z-10" />
                )}
              </div>
            );
          })}
        </div>

        {/* Current Event Info */}
        {sortedEvents.find((e) => e.status.toLowerCase() === "active") && (
          <div className="mt-3 p-2 bg-blue-900/20 border border-blue-500/30 rounded text-center">
            <p className="text-xs text-blue-400">
              Current:{" "}
              {
                sortedEvents.find((e) => e.status.toLowerCase() === "active")
                  ?.template.name
              }
            </p>
          </div>
        )}
      </div>

      {/* Full Timeline Modal */}
      <Modal
        isOpen={showFullTimeline}
        onClose={() => setShowFullTimeline(false)}
        title="Dungeon Timeline"
        size="large"
      >
        <TimelineViewer events={events} playerPositions={playerPositions} />
      </Modal>
    </>
  );
}
