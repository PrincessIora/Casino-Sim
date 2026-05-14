import { Card } from "@/types/card";

export function getCardImage(card: Card): string {
  const suit = card.suit;

  return `/cards/card${suit}${card.value}.png`;
}