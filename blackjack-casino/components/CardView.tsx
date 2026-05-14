import { Card } from "@/types/card";
import { getCardImage } from "@/lib/cardImage";


// components/CardView.tsx
export default function CardView({ card, faceDown = false }: { card: Card; faceDown?: boolean }) {
  return (
    <div className="w-20 h-28 ...">
      <img
        src={faceDown ? "/Cards/cardBack_green5.png" : getCardImage(card)}
        alt={faceDown ? "Hidden card" : `${card.value} of ${card.suit}`}
        className="w-full h-full rounded-lg shadow-lg"
      />
    </div>
  );
}