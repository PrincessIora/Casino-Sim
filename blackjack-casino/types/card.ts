export type Suit = "hearts" | "diamonds" | "clubs" | "spades";

export type Card = {
  suit: Suit;
  value: string;
  numericValue: number;
};