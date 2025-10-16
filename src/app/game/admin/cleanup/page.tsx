"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";

export default function CleanupAdminPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastCleanup, setLastCleanup] = useState<any>(null);

  // Queries
  const { data: expiredStats, refetch: refetchStats } =
    api.missionCleanup.getExpiredStats.useQuery();

  // Mutations
  const cleanupExpiredMutation =
    api.missionCleanup.cleanupExpired.useMutation();
  const cleanupOlderThanMutation =
    api.missionCleanup.cleanupOlderThan.useMutation();

  const handleCleanupExpired = async () => {
    setIsLoading(true);
    try {
      const result = await cleanupExpiredMutation.mutateAsync();
      setLastCleanup({
        type: "expired",
        result,
        timestamp: new Date().toISOString(),
      });
      await refetchStats();
    } catch (error) {
      console.error("Cleanup failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanupOlderThan = async (days: number) => {
    setIsLoading(true);
    try {
      const result = await cleanupOlderThanMutation.mutateAsync({ days });
      setLastCleanup({
        type: `older than ${days} days`,
        result,
        timestamp: new Date().toISOString(),
      });
      await refetchStats();
    } catch (error) {
      console.error("Cleanup failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Mission Cleanup Admin</h1>
      </div>

      {/* Expired Mission Statistics */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Expired Mission Statistics
        </h2>
        {expiredStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="text-2xl font-bold text-white">
                {expiredStats.totalExpired}
              </div>
              <div className="text-gray-400">Total Expired</div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="text-2xl font-bold text-white">
                {expiredStats.byStatus.COMPLETED || 0}
              </div>
              <div className="text-gray-400">Completed</div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="text-2xl font-bold text-white">
                {expiredStats.byStatus.FAILED || 0}
              </div>
              <div className="text-gray-400">Failed</div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="text-2xl font-bold text-white">
                {expiredStats.byStatus.ABANDONED || 0}
              </div>
              <div className="text-gray-400">Abandoned</div>
            </div>
          </div>
        ) : (
          <div className="text-gray-400">Loading statistics...</div>
        )}

        {expiredStats && (
          <div className="mt-4 text-sm text-gray-400">
            <div>
              Oldest expired:{" "}
              {expiredStats.oldestExpired
                ? new Date(expiredStats.oldestExpired).toLocaleString()
                : "None"}
            </div>
            <div>
              Newest expired:{" "}
              {expiredStats.newestExpired
                ? new Date(expiredStats.newestExpired).toLocaleString()
                : "None"}
            </div>
          </div>
        )}
      </Card>

      {/* Cleanup Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Cleanup Actions
        </h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={handleCleanupExpired}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? "Cleaning..." : "Clean Expired Missions"}
            </Button>

            <Button
              onClick={() => handleCleanupOlderThan(1)}
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Clean Missions Older Than 1 Day
            </Button>

            <Button
              onClick={() => handleCleanupOlderThan(7)}
              disabled={isLoading}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Clean Missions Older Than 7 Days
            </Button>

            <Button
              onClick={() => handleCleanupOlderThan(30)}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Clean Missions Older Than 30 Days
            </Button>
          </div>
        </div>
      </Card>

      {/* Last Cleanup Result */}
      {lastCleanup && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Last Cleanup Result
          </h2>
          <div className="space-y-2">
            <div className="text-gray-400">
              <strong>Type:</strong> {lastCleanup.type}
            </div>
            <div className="text-gray-400">
              <strong>Timestamp:</strong>{" "}
              {new Date(lastCleanup.timestamp).toLocaleString()}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
              <div className="bg-gray-800 p-3 rounded">
                <div className="text-lg font-bold text-white">
                  {lastCleanup.result.cleanedSessions}
                </div>
                <div className="text-sm text-gray-400">Sessions</div>
              </div>
              <div className="bg-gray-800 p-3 rounded">
                <div className="text-lg font-bold text-white">
                  {lastCleanup.result.cleanedPhases}
                </div>
                <div className="text-sm text-gray-400">Phases</div>
              </div>
              <div className="bg-gray-800 p-3 rounded">
                <div className="text-lg font-bold text-white">
                  {lastCleanup.result.cleanedLoot}
                </div>
                <div className="text-sm text-gray-400">Loot</div>
              </div>
              <div className="bg-gray-800 p-3 rounded">
                <div className="text-lg font-bold text-white">
                  {lastCleanup.result.cleanedStatistics}
                </div>
                <div className="text-sm text-gray-400">Statistics</div>
              </div>
              <div className="bg-gray-800 p-3 rounded">
                <div className="text-lg font-bold text-white">
                  {lastCleanup.result.cleanedTurns}
                </div>
                <div className="text-sm text-gray-400">Turns</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Information */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          About Mission Cleanup
        </h2>
        <div className="text-gray-400 space-y-2">
          <p>
            <strong>Expired Missions:</strong> Missions that have ended more
            than 30 seconds ago and are in COMPLETED, FAILED, or ABANDONED
            status.
          </p>
          <p>
            <strong>Automatic Cleanup:</strong> The system automatically runs
            cleanup every 5 minutes to remove expired missions.
          </p>
          <p>
            <strong>Manual Cleanup:</strong> Use the buttons above to manually
            trigger cleanup operations.
          </p>
          <p>
            <strong>Data Removed:</strong> Cleanup removes dungeon sessions,
            phases, loot, statistics, and turns for expired missions.
          </p>
        </div>
      </Card>
    </div>
  );
}
