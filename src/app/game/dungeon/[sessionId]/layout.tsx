import { DungeonSessionProvider } from "@/contexts/DungeonSessionContext";

export default function DungeonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DungeonSessionProvider>{children}</DungeonSessionProvider>;
}
