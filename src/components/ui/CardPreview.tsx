// src/components/ui/CardPreview.tsx
"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CardInstance } from "@/types/game";
import Image from "next/image";

interface CardPreviewProps {
  card: CardInstance | null;
  onOpenChange: (isOpen: boolean) => void;
}

export default function CardPreview({ card, onOpenChange }: CardPreviewProps) {
  if (!card) return null;

  return (
    <Dialog open={!!card} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl grid grid-cols-2 gap-6">
        <div className="relative aspect-[0.716] w-full">
          <Image
            src={card.imageUrl}
            alt={card.name}
            fill
            className="object-contain rounded-lg"
          />
        </div>
        <div>
          <DialogHeader>
            <DialogTitle className="text-2xl">{card.name}</DialogTitle>
            <DialogDescription>
              {card.type} - Level {card.level ?? "N/A"}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <p>
              Mô tả chi tiết và hiệu ứng của lá bài sẽ được hiển thị ở đây...
            </p>
            {/* Thêm các thông tin khác như Power, Cost... */}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
