import { Card } from "@/types/card";

// ─────────────────────────────
// HAND VALUE
// ─────────────────────────────
export function calculateHandValue(hand: Card[]): number {
  let total = 0;
  let aces = 0;

  for (const card of hand) {
    total += card.numericValue;
    if (card.value === "A") aces++;
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
}

// ─────────────────────────────
// STATES
// ─────────────────────────────
export function isBust(hand: Card[]): boolean {
  return calculateHandValue(hand) > 21;
}

export function isBlackjack(hand: Card[]): boolean {
  return hand.length === 2 && calculateHandValue(hand) === 21;
}

export function isFiveCardCharlie(hand: Card[]): boolean {
  return hand.length === 5 && calculateHandValue(hand) <= 21;
}

// ─────────────────────────────
// DEALER AI
// ─────────────────────────────
export function playDealerTurn(
  dealerHand: Card[],
  deck: Card[]
): { hand: Card[]; deck: Card[] } {
  const newHand: Card[] = [...dealerHand];
  const newDeck: Card[] = [...deck];

  while (calculateHandValue(newHand) < 17) {
    const card = newDeck.pop();
    if (!card) break;
    newHand.push(card);
  }

  return {
    hand: newHand,
    deck: newDeck,
  };
}