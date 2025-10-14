"use client";

import { useState } from "react";
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

interface TimelineViewerProps {
  events: DungeonEvent[];
  playerPositions: Record<string, string>; // characterId -> eventId
}

export function TimelineViewer({
  events,
  playerPositions,
}: TimelineViewerProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const getEventIcon = (type: string) => {
    switch (type) {
      case "COMBAT":
        return <Sword className="w-5 h-5" />;
      case "TREASURE":
        return <Coins className="w-5 h-5" />;
      case "TRAP":
        return <AlertTriangle className="w-5 h-5" />;
      case "PUZZLE":
        return (
          <div className="w-5 h-5 bg-purple-400 rounded flex items-center justify-center text-white text-xs font-bold">
            ?
          </div>
        );
      case "CHOICE":
        return <Users className="w-5 h-5" />;
      // BOSS events are now handled as COMBAT events
      case "NPC_ENCOUNTER":
        return <Eye className="w-5 h-5" />;
      case "ENVIRONMENTAL_HAZARD":
        return <Zap className="w-5 h-5" />;
      default:
        return <div className="w-5 h-5 bg-gray-400 rounded" />;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "COMBAT":
        return "border-red-500 bg-red-500/10 text-red-400";
      case "TREASURE":
        return "border-yellow-500 bg-yellow-500/10 text-yellow-400";
      case "TRAP":
        return "border-orange-500 bg-orange-500/10 text-orange-400";
      case "PUZZLE":
        return "border-amber-500 bg-amber-500/10 text-amber-400";
      case "CHOICE":
        return "border-blue-500 bg-blue-500/10 text-blue-400";
      // BOSS events are now handled as COMBAT events
      case "NPC_ENCOUNTER":
        return "border-green-500 bg-green-500/10 text-green-400";
      case "ENVIRONMENTAL_HAZARD":
        return "border-stone-500 bg-stone-500/10 text-stone-400";
      default:
        return "border-stone-500 bg-stone-500/10 text-stone-400";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "active":
        return "Active";
      case "pending":
        return "Pending";
      case "locked":
        return "Locked";
      default:
        return "Unknown";
    }
  };

  // Convert events to timeline nodes and organize them
  const timelineNodes = events.map((event) => ({
    id: event.id,
    type: event.template.type,
    name: event.template.name,
    description: event.template.description,
    eventNumber: event.eventNumber,
    status: event.status.toLowerCase() as
      | "completed"
      | "active"
      | "pending"
      | "locked",
    playerActions: event.playerActions,
  }));

  // Sort by event number (chronological order)
  const organizedTimeline = timelineNodes.sort(
    (a, b) => a.eventNumber - b.eventNumber
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Dungeon Timeline</h3>
        <div className="flex items-center space-x-4 text-sm text-stone-400">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Active</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-stone-500 rounded-full"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-stone-700 rounded-full"></div>
            <span>Locked</span>
          </div>
        </div>
      </div>

      {/* Timeline Events */}
      <div className="space-y-4">
        {organizedTimeline.map((node, index) => {
          const status = node.status || "pending";
          const isSelected = selectedNode === node.id;
          const playersHere = Object.entries(playerPositions).filter(
            ([, eventId]) => eventId === node.id
          );

          return (
            <div
              key={node.id}
              className={`relative transition-all duration-200 ${
                isSelected ? "scale-105" : "hover:scale-102"
              }`}
            >
              {/* Connection Line */}
              {index < organizedTimeline.length - 1 && (
                <div className="absolute left-6 top-16 w-0.5 h-8 bg-stone-600 z-0"></div>
              )}

              {/* Event Card */}
              <div
                className={`relative bg-stone-800 border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "border-yellow-400 shadow-lg shadow-yellow-400/20"
                    : "border-stone-600 hover:border-stone-500"
                } ${getEventTypeColor(node.type)}`}
                onClick={() => setSelectedNode(isSelected ? null : node.id)}
              >
                <div className="flex items-center space-x-4">
                  {/* Event Icon */}
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${getStatusColor(
                      status
                    )}`}
                  >
                    {getEventIcon(node.type)}
                  </div>

                  {/* Event Info */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-white">
                          {node.name}
                        </h4>
                        <p className="text-xs text-stone-400">
                          Event #{node.eventNumber} •{" "}
                          {node.type.replace("_", " ").toLowerCase()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            status === "completed"
                              ? "bg-green-500/20 text-green-400"
                              : status === "active"
                              ? "bg-blue-500/20 text-blue-400"
                              : status === "pending"
                              ? "bg-stone-500/20 text-stone-400"
                              : "bg-stone-700/20 text-stone-500"
                          }`}
                        >
                          {getStatusText(status)}
                        </span>
                        {playersHere.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                            <span className="text-xs text-yellow-400">
                              {playersHere.length} player
                              {playersHere.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-stone-300 text-sm mt-1">
                      {node.description}
                    </p>
                  </div>

                  {/* Expand/Collapse Arrow */}
                  <div
                    className={`transform transition-transform duration-200 ${
                      isSelected ? "rotate-180" : ""
                    }`}
                  >
                    <svg
                      className="w-5 h-5 text-stone-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {/* Expanded Details */}
                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-stone-600">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-stone-400">Event ID:</span>
                        <span className="text-white ml-2 font-mono text-xs">
                          {node.id.slice(-8)}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400">Event Number:</span>
                        <span className="text-white ml-2">
                          #{node.eventNumber}
                        </span>
                      </div>
                      {node.playerActions && node.playerActions.length > 0 && (
                        <div className="col-span-2">
                          <span className="text-stone-400">Participants:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {node.playerActions.map((action) => (
                              <span
                                key={action.characterId}
                                className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs"
                              >
                                {action.character?.name || "Unknown Player"}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Summary */}
      <div className="bg-stone-800 border border-stone-600 rounded-lg p-4">
        <h4 className="font-semibold text-white mb-3">Progress Summary</h4>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-400">
              {timelineNodes.filter((n) => n.status === "completed").length}
            </div>
            <div className="text-sm text-stone-400">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">
              {timelineNodes.filter((n) => n.status === "active").length}
            </div>
            <div className="text-sm text-stone-400">Active</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-stone-400">
              {timelineNodes.filter((n) => n.status === "pending").length}
            </div>
            <div className="text-sm text-stone-400">Pending</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-stone-500">
              {timelineNodes.filter((n) => n.status === "locked").length}
            </div>
            <div className="text-sm text-stone-400">Locked</div>
          </div>
        </div>
      </div>
    </div>
  );
}
