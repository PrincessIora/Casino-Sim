// app/page.tsx
import Link from "next/link";

export default function MenuPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-8">
      <h1 className="text-5xl font-bold">🎰 Casino</h1>
      <p className="text-gray-400">Select a game to play</p>

      <div className="grid grid-cols-2 gap-4 w-full max-w-lg px-4">
        <Link href="/game"
          className="bg-green-700 hover:bg-green-600 rounded-xl p-6 text-center text-xl font-semibold transition"
        >
          🃏 Blackjack
        </Link>

        {["🎲 Craps", "🎡 Roulette", "♠️ Poker", "🎰 Slots"].map((name) => (
          <div key={name}
            className="bg-gray-700 rounded-xl p-6 text-center text-xl font-semibold opacity-50 relative"
          >
            {name}
            <span className="absolute top-2 right-2 text-xs bg-yellow-500 text-black px-1 rounded">
              Coming Soon
            </span>
          </div>
        ))}
      </div>

      
    </div>
  );
}