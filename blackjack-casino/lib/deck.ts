import { Card, Suit } from "@/types/card";

const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];

const values: { value: string; num: number }[] = [
  { value: "A", num: 11 },
  { value: "2", num: 2 },
  { value: "3", num: 3 },
  { value: "4", num: 4 },
  { value: "5", num: 5 },
  { value: "6", num: 6 },
  { value: "7", num: 7 },
  { value: "8", num: 8 },
  { value: "9", num: 9 },
  { value: "10", num: 10 },
  { value: "J", num: 10 },
  { value: "Q", num: 10 },
  { value: "K", num: 10 },
];

export function createDeck(): Card[] {
  const deck: Card[] = [];

  for (const suit of suits) {
    for (const v of values) {
      deck.push({
        suit,
        value: v.value,
        numericValue: v.num,
      });
    }
  }

  return shuffle(deck);
}

export function shuffle(deck: Card[]): Card[] {
  return [...deck].sort(() => Math.random() - 0.5);
}