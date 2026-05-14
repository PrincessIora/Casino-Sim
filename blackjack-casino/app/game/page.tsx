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
    if (activeBet > balance) return;

    const newDeck = [...deck];
    const hand1: Card[] = [playerHand[0], newDeck.pop()!];
    const hand2: Card[] = [playerHand[1], newDeck.pop()!];

    setBalance((b) => b - activeBet); // second hand costs another bet
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
        setBalance((b) => b + activeBet * 4);
        finishRound({ outcome: "fivecard", payout: activeBet * 3 });
      }
      return;
    }

    const hands = [...playerHands];
    if (!hands[activeHand]) return;
    hands[activeHand] = [...hands[activeHand], card];
    setPlayerHands(hands);

    if (isBust(hands[activeHand]) || isFiveCardCharlie(hands[activeHand])) {
      // Pass current hands to avoid stale closure in stand()
      nextHand(hands);
    }
  };

  // ─────────────────────────────
  // NEXT HAND (split)
  // ─────────────────────────────
  const nextHand = (currentHands?: Card[][]) => {
    if (activeHand >= playerHands.length - 1) {
      stand(currentHands);
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
  const stand = (overrideHands?: Card[][]) => {
    // In split mode, standing on a non-final hand just advances to the next
    if (isSplit && activeHand < playerHands.length - 1) {
      setActiveHand((h) => h + 1);
      return;
    }

    // Single-hand bust (hit() already catches it, but guard for doubleDown)
    if (!isSplit && isBust(playerHand)) {
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
    const dealerBust = dealerScore > 21;
    const dealerBJ = isBlackjack(dealer);

    // ── Single hand ──
    if (!isSplit) {
      const playerScore = calculateHandValue(playerHand);
      const playerBJ = isBlackjack(playerHand);

      if (playerBJ && !dealerBJ) {
        setBalance((b) => b + activeBet * 3);
        finishRound({ outcome: "blackjack", payout: activeBet * 2 });
        return;
      }
      if (dealerBJ && !playerBJ) {
        finishRound({ outcome: "lost", payout: 0 });
        return;
      }
      if (playerScore === dealerScore) {
        setBalance((b) => b + activeBet);
        finishRound({ outcome: "push", payout: 0 });
        return;
      }
      if (isFiveCardCharlie(playerHand)) {
        setBalance((b) => b + activeBet * 4);
        finishRound({ outcome: "fivecard", payout: activeBet * 3 });
        return;
      }
      if (dealerBust) {
        setBalance((b) => b + activeBet * 2);
        finishRound({ outcome: "won", payout: activeBet });
        return;
      }
      if (playerScore > dealerScore) {
        setBalance((b) => b + activeBet * 2);
        finishRound({ outcome: "won", payout: activeBet });
      } else {
        finishRound({ outcome: "lost", payout: 0 });
      }
      return;
    }

    // ── Split hands: evaluate each against the dealer ──
    // Use overrideHands when called synchronously from hit() to avoid stale state
    const handsToEval = overrideHands ?? playerHands;
    const totalWagered = activeBet * handsToEval.length;
    let totalReturn = 0;

    for (const hand of handsToEval) {
      if (isBust(hand)) continue; // lost this hand

      const handScore = calculateHandValue(hand);

      if (isFiveCardCharlie(hand)) {
        totalReturn += activeBet * 4; // 3:1 payout
      } else if (handScore === dealerScore) {
        totalReturn += activeBet; // push
      } else if (dealerBust || handScore > dealerScore) {
        totalReturn += activeBet * 2; // win
      }
      // else lost — no return
    }

    setBalance((b) => b + totalReturn);
    const net = totalReturn - totalWagered;

    if (net > 0) {
      finishRound({ outcome: "won", payout: net });
    } else if (net === 0) {
      finishRound({ outcome: "push", payout: 0 });
    } else {
      finishRound({ outcome: "lost", payout: 0 });
    }
  };

  // ─────────────────────────────
  // UI
  // ─────────────────────────────
  const handsToRender = isSplit ? playerHands : [playerHand];
return (
  <div
    className="relative w-full h-screen overflow-hidden"
    style={{ backgroundImage: "url('/BlackJackTable.png')", backgroundSize: "cover", backgroundPosition: "center" }}
  >
    {/* DEALER AREA — top center where the two card outlines are */}
    <div className="absolute top-[6%] left-1/2 -translate-x-1/2 flex gap-3">
      {dealerHand.map((c, i) => (
        <CardView key={i} card={c} faceDown={i === 0 && !holeCardRevealed} />
      ))}
      <p className="absolute -bottom-6 w-full text-center text-white text-sm">
        {holeCardRevealed ? `Dealer: ${calculateHandValue(dealerHand)}` : "Dealer: ?"}
      </p>
    </div>

    {/* PLAYER AREA — bottom center card outline */}
    <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
      {handsToRender.map((hand, idx) => (
        <div key={idx} className="flex gap-3">
          {hand.map((c, i) => (
            <CardView key={i} card={c} />
          ))}
        </div>
      ))}
      <p className="text-white text-sm mt-1">
        {handsToRender[0]?.length > 0 ? `You: ${calculateHandValue(handsToRender[activeHand] ?? [])}` : ""}
      </p>
    </div>

    {/* CHIP / BET AREA — over the center circle */}
    <div className="absolute bottom-[30%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
      <p className="text-white font-bold text-lg">Bet: ${gameState === "idle" ? bet : activeBet}</p>
      <p className="text-white font-semibold">Balance: ${balance}</p>
      
      <div className="flex gap-2">
        {CHIP_VALUES.map((value) => (
          <button
            key={value}
            onClick={() => addChip(value)}
            disabled={gameState !== "idle"}
            className="bg-yellow-500 text-black font-bold w-10 h-10 rounded-full text-sm disabled:opacity-40 shadow-lg"
          >
            {value}
          </button>
        ))}
      </div>
    </div>

    {/* TOP BAR — balance, back button */}
    <div className="absolute top-3 left-4 right-4 flex justify-between items-center">
      <Link href="/" className="text-white text-sm underline opacity-70">← Menu</Link>
      <p className="text-white font-semibold">Balance: ${balance}</p>
    </div>

    {/* ACTION BUTTONS — bottom strip */}
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
      <button onClick={deal} disabled={gameState !== "idle"} className="bg-blue-600 px-4 py-2 rounded text-white disabled:opacity-40">Deal</button>
      <button onClick={hit} disabled={gameState !== "playing" && gameState !== "split"} className="bg-green-600 px-4 py-2 rounded text-white disabled:opacity-40">Hit</button>
      <button onClick={stand} disabled={gameState !== "playing" && gameState !== "split"} className="bg-red-600 px-4 py-2 rounded text-white disabled:opacity-40">Stand</button>
      <button onClick={doubleDown} disabled={gameState !== "playing" || playerHand.length !== 2} className="bg-yellow-500 px-4 py-2 rounded text-black disabled:opacity-40">Double Down</button>
      <button onClick={split} disabled={!canSplit || gameState !== "playing"} className="bg-purple-600 px-4 py-2 rounded text-white disabled:opacity-40">Split</button>
      <button onClick={clearChips} disabled={gameState !== "idle"} className="bg-gray-600 px-4 py-2 rounded text-white disabled:opacity-40">Clear</button>
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