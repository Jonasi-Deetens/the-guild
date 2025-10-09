import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Sword, Users, Crown, Zap } from "@/components/icons";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 animate-glow">
            The Guild
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            An Isekai RPG Social Experiment
          </p>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Enter a living society where you can be anyone you want. Become a
            thief, a hero, a merchant, or forge your own path. The choice is
            yours in this interactive world of dungeons, betrayal, and endless
            possibilities.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="glass hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <Sword className="h-8 w-8 text-purple-400 mb-2" />
              <CardTitle className="text-lg">Dungeon Exploration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Venture into dangerous dungeons with other players. Will you
                survive? Will you be betrayed?
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="glass hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <Users className="h-8 w-8 text-blue-400 mb-2" />
              <CardTitle className="text-lg">Living Society</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Interact with a dynamic community where every action has
                consequences.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="glass hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <Crown className="h-8 w-8 text-yellow-400 mb-2" />
              <CardTitle className="text-lg">Player Freedom</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Be whoever you want to be. No restrictions, no classes - just
                pure player agency.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="glass hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <Zap className="h-8 w-8 text-green-400 mb-2" />
              <CardTitle className="text-lg">Real-time Action</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Experience real-time interactions with turn-based dungeon
                mechanics.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Begin Your Journey?
            </h2>
            <p className="text-gray-300 mb-8">
              Create your character and step into a world of endless
              possibilities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-4">
                <Link href="/auth/login">Enter the Guild</Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                <Link href="/auth/register">Create Account</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-gray-500">
          <p>Built with Next.js, tRPC, Prisma, and Socket.io</p>
        </div>
      </div>
    </div>
  );
}
