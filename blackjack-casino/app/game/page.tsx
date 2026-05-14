"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/types/card";
import { createDeck } from "@/lib/deck";
import CardView from "@/components/CardView";
import {
  calculateHandValue,
  isBust,
  isBlackjack,
  isFiveCardCharlie,
  playDealerTurn,
} from "@/lib/blackjack";

type ResultInfo = {
  outcome: "won" | "lost" | "push" | "blackjack" | "fivecard";
  payout: number;
};

export default function GamePage() {
  // ─────────────────────────────
  // STATE
  // ─────────────────────────────
  const [deck, setDeck] = useState<Card[]>(createDeck());
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [playerHands, setPlayerHands] = useState<Card[][]>([]);
  const [isSplit, setIsSplit] = useState(false);
  const [activeHand, setActiveHand] = useState(0);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [balance, setBalance] = useState(1000);
  const [activeBet, setActiveBet] = useState(0);
  const [holeCardRevealed, setHoleCardRevealed] = useState(false);
  const [lastResult, setLastResult] = useState<ResultInfo | null>(null);
  const [gameState, setGameState] = useState<"idle" | "playing" | "won" | "lost" | "split">("idle");

  // ─────────────────────────────
  // CHIP SYSTEM
  // ─────────────────────────────
  const CHIP_VALUES = [1, 5, 10, 50, 100] as const;
  type ChipValue = typeof CHIP_VALUES[number];
  const [chips, setChips] = useState<ChipValue[]>([]);

  const bet = chips.reduce((sum, c) => sum + c, 0);
  const addChip = (value: ChipValue) => {
    if (balance < value) return;
    setChips((prev) => [...prev, value]);
  };
  const clearChips = () => setChips([]);

  // ─────────────────────────────
  // HELPERS
  // ─────────────────────────────
  const canSplit =
    playerHand.length === 2 && playerHand[0]?.value === playerHand[1]?.value;

  const resetRound = () => {
    setPlayerHand([]);
    setPlayerHands([]);
    setDealerHand([]);
    clearChips();
    setIsSplit(false);
    setActiveHand(0);
    setHoleCardRevealed(false);
    setGameState("idle");
  };

  const finishRound = (result: ResultInfo) => {
    setLastResult(result);
    setGameState(result.outcome === "lost" ? "lost" : "won");
  };

  // ─────────────────────────────
  // DEAL
  // ─────────────────────────────
  const deal = () => {
    if (bet <= 0 || bet > balance) return;

    const newDeck = createDeck();
    const player = [newDeck.pop()!, newDeck.pop()!];
    const dealer = [newDeck.pop()!, newDeck.pop()!];

    setDeck(newDeck);
    setPlayerHand(player);
    setPlayerHands([player]);
    setDealerHand(dealer);
    setIsSplit(false);
    setActiveHand(0);
    setHoleCardRevealed(false);
    setBalance((b) => b - bet);
    setActiveBet(bet);
    clearChips();
    setGameState("playing");
  };

  // ─────────────────────────────
  // SPLIT
  // ─────────────────────────────
  const split = () => {
    if (!canSplit || gameState !== "playing") return;

    const newDeck = [...deck];
    const hand1: Card[] = [playerHand[0], newDeck.pop()!];
    const hand2: Card[] = [playerHand[1], newDeck.pop()!];

    setPlayerHands([hand1, hand2]);
    setIsSplit(true);
    setActiveHand(0);
    setDeck(newDeck);
    setGameState("split");
  };

  // ─────────────────────────────
  // HIT
  // ─────────────────────────────
  const hit = () => {
    if (gameState !== "playing" && gameState !== "split") return;

    const newDeck = [...deck];
    const card = newDeck.pop()!;
    setDeck(newDeck);

    if (!isSplit) {
      const updated = [...playerHand, card];
      setPlayerHand(updated);
      if (isBust(updated)) {
        finishRound({ outcome: "lost", payout: 0 });
        return;
      }
      if (isFiveCardCharlie(updated)) {
        setBalance((b) => b + activeBet * 4); // 3:1 pays back 4x (bet + 3x profit)
        finishRound({ outcome: "fivecard", payout: activeBet * 3 });
      }
      return;
    }

    const hands = [...playerHands];
    if (!hands[activeHand]) return;
    hands[activeHand] = [...hands[activeHand], card];
    setPlayerHands(hands);

    if (isBust(hands[activeHand]) || isFiveCardCharlie(hands[activeHand])) {
      nextHand();
    }
  };

  // ─────────────────────────────
  // NEXT HAND (split)
  // ─────────────────────────────
  const nextHand = () => {
    if (activeHand >= playerHands.length - 1) {
      stand();
    } else {
      setActiveHand((h) => h + 1);
    }
  };

  // ─────────────────────────────
  // DOUBLE DOWN
  // ─────────────────────────────
  const doubleDown = () => {
    if (gameState !== "playing") return;
    if (playerHand.length !== 2) return;
    if (activeBet > balance) return;

    const newDeck = [...deck];
    const card = newDeck.pop()!;
    setDeck(newDeck);

    const updated = [...playerHand, card];
    setPlayerHand(updated);
    setBalance((b) => b - activeBet);

    setTimeout(() => stand(), 200);
  };

  // ─────────────────────────────
  // STAND
  // ─────────────────────────────
  const stand = () => {
    const playerScore = calculateHandValue(playerHand);

    if (isBust(playerHand)) {
      finishRound({ outcome: "lost", payout: 0 });
      return;
    }

    setHoleCardRevealed(true);

    let newDeck = [...deck];
    const result = playDealerTurn(dealerHand, newDeck);
    const dealer = result.hand;
    newDeck = result.deck;

    setDealerHand(dealer);
    setDeck(newDeck);

    const dealerScore = calculateHandValue(dealer);
    const playerBJ = isBlackjack(playerHand);
    const dealerBJ = isBlackjack(dealer);

    // PUSH
    if (playerScore === dealerScore) {
      setBalance((b) => b + activeBet);
      finishRound({ outcome: "push", payout: 0 });
      return;
    }

    // BLACKJACK (2:1 per spec → player gets back bet + 2x profit = 3x total)
    if (playerBJ && !dealerBJ) {
      setBalance((b) => b + activeBet * 3);
      finishRound({ outcome: "blackjack", payout: activeBet * 2 });
      return;
    }

    if (dealerBJ && !playerBJ) {
      finishRound({ outcome: "lost", payout: 0 });
      return;
    }

    // DEALER BUST
    if (dealerScore > 21) {
      setBalance((b) => b + activeBet * 2);
      finishRound({ outcome: "won", payout: activeBet });
      return;
    }

    // FIVE CARD CHARLIE (3:1 per spec)
    if (isFiveCardCharlie(playerHand)) {
      setBalance((b) => b + activeBet * 4);
      finishRound({ outcome: "fivecard", payout: activeBet * 3 });
      return;
    }

    // NORMAL WIN / LOSE
    if (playerScore > dealerScore) {
      setBalance((b) => b + activeBet * 2);
      finishRound({ outcome: "won", payout: activeBet });
    } else {
      finishRound({ outcome: "lost", payout: 0 });
    }
  };

  // ─────────────────────────────
  // UI
  // ─────────────────────────────
  const handsToRender = isSplit ? playerHands : [playerHand];

  return (
    <div className="min-h-screen bg-green-800 text-white p-6 flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-center">Blackjack Table</h1>

      {/* DEALER */}
      <div className="border-b border-green-600 pb-4">
        <h2 className="text-xl mb-2">
          Dealer {holeCardRevealed ? `(${calculateHandValue(dealerHand)})` : "(?)"}
        </h2>
        <div className="flex gap-3">
          {dealerHand.map((c, i) => (
            <CardView key={i} card={c} faceDown={i === 0 && !holeCardRevealed} />
          ))}
        </div>
      </div>

      {/* STATUS */}
      <div className="text-center text-2xl opacity-80">
        {gameState.toUpperCase()}
      </div>

      {/* PLAYER HANDS */}
      <div className="border-t border-green-600 pt-4 flex flex-col gap-4">
        {handsToRender.map((hand, idx) => (
          <div key={idx}>
            <h2 className="text-lg mb-2">
              Hand {idx + 1} ({calculateHandValue(hand)})
              {isSplit && idx === activeHand && (
                <span className="ml-2 text-yellow-300 text-sm">← Active</span>
              )}
            </h2>
            <div className="flex gap-3">
              {hand.map((c, i) => (
                <CardView key={i} card={c} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* CHIP PANEL */}
      <div className="text-center space-y-2">
        <p>Balance: ${balance}</p>
        <p>Bet: ${gameState === "idle" ? bet : activeBet}</p>
        <div className="flex gap-2 justify-center flex-wrap">
          {CHIP_VALUES.map((value) => (
            <button
              key={value}
              onClick={() => addChip(value)}
              disabled={gameState !== "idle"}
              className="bg-yellow-500 px-3 py-1 rounded disabled:opacity-40"
            >
              +${value}
            </button>
          ))}
        </div>
        <button onClick={clearChips} className="text-sm underline opacity-70">
          Clear Chips
        </button>
      </div>

      {/* CONTROLS */}
      <div className="flex gap-3 justify-center flex-wrap">
        <button
          onClick={deal}
          disabled={gameState !== "idle"}
          className="bg-blue-500 px-4 py-2 rounded disabled:opacity-40"
        >
          Deal
        </button>
        <button
          onClick={hit}
          disabled={gameState !== "playing" && gameState !== "split"}
          className="bg-green-500 px-4 py-2 rounded disabled:opacity-40"
        >
          Hit
        </button>
        <button
          onClick={stand}
          disabled={gameState !== "playing" && gameState !== "split"}
          className="bg-red-500 px-4 py-2 rounded disabled:opacity-40"
        >
          Stand
        </button>
        <button
          onClick={doubleDown}
          disabled={gameState !== "playing" || playerHand.length !== 2}
          className="bg-yellow-500 px-4 py-2 rounded disabled:opacity-40"
        >
          Double Down
        </button>
        <button
          onClick={split}
          disabled={!canSplit || gameState !== "playing"}
          className="bg-purple-500 px-4 py-2 rounded disabled:opacity-40"
        >
          Split
        </button>
      </div>

      {/* RESULT OVERLAY */}
      {lastResult && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white text-black rounded-2xl p-8 text-center space-y-4 shadow-2xl">
            <h2 className="text-3xl font-bold">
              {lastResult.outcome === "blackjack" && "Blackjack! 🃏"}
              {lastResult.outcome === "won" && "You Win! 🎉"}
              {lastResult.outcome === "lost" && "Dealer Wins 😞"}
              {lastResult.outcome === "push" && "Push — Bet Returned"}
              {lastResult.outcome === "fivecard" && "Five Card Charlie! 🌟"}
            </h2>
            <p className="text-xl">
              {lastResult.payout > 0
                ? `+$${lastResult.payout}`
                : lastResult.outcome === "push"
                ? `Bet returned: $${activeBet}`
                : `-$${activeBet}`}
            </p>
            <p className="text-gray-500">Balance: ${balance}</p>

            {balance <= 0 ? (
              <Link
                href="/"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg block"
              >
                Go to Main Menu to Withdraw
              </Link>
            ) : (
              <button
                onClick={() => { setLastResult(null); resetRound(); }}
                className="bg-green-600 text-white px-6 py-2 rounded-lg text-lg"
              >
                Next Hand
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}