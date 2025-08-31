// src/components/ui/DeckViewer.tsx
"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CardInstance } from "@/types/game";
import Image from "next/image";

interface DeckViewerProps {
  title: string;
  cards: CardInstance[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCardClick: (card: CardInstance) => void;
}

export default function DeckViewer({
  title,
  cards,
  isOpen,
  onOpenChange,
  onCardClick,
}: DeckViewerProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {title} ({cards.length} lá)
          </DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-4">
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
            {cards.map((card) => (
              <div
                key={card.uuid}
                className="relative aspect-[0.7] cursor-pointer"
                onClick={() => onCardClick(card)}
              >
                <Image
                  src={card.imageUrl}
                  alt={card.name}
                  fill
                  sizes="150px"
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
