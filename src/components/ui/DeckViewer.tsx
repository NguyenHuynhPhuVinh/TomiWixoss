"use client";
import { useState, useEffect } from "react"; // Thêm useEffect
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CardInstance } from "@/types/game";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface DeckViewerProps {
  title: string;
  cards: CardInstance[];
  isOpen: boolean;
  mode: "view" | "select";
  onOpenChange: (isOpen: boolean) => void;
  onCardSelect: (card: CardInstance | null) => void;
  onConfirm: (card: CardInstance) => void;
}

export default function DeckViewer({
  title,
  cards,
  isOpen,
  mode,
  onOpenChange,
  onCardSelect,
  onConfirm,
}: DeckViewerProps) {
  const { t } = useTranslation();
  const [selectedCard, setSelectedCard] = useState<CardInstance | null>(null);

  // Sử dụng useEffect để reset state khi dialog được mở
  useEffect(() => {
    if (isOpen) {
      setSelectedCard(null);
      onCardSelect(null);
    }
  }, [isOpen, onCardSelect]);

  const handleCardClick = (card: CardInstance) => {
    if (selectedCard?.uuid === card.uuid) {
      setSelectedCard(null);
      onCardSelect(null);
    } else {
      setSelectedCard(card);
      onCardSelect(card);
    }
  };

  const handleConfirm = () => {
    if (selectedCard) {
      onConfirm(selectedCard);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-4xl h-[80vh] flex flex-col",
          // THAY ĐỔI 1: Thêm hiệu ứng mờ nền trực tiếp vào đây
          "bg-card/80 backdrop-blur-sm"
        )}
        // THAY ĐỔI 2: Xóa hoàn toàn onMouseLeave
      >
        <DialogHeader>
          <DialogTitle>
            {title} ({t("deckViewer.cardCount", { count: cards.length })})
          </DialogTitle>
          <DialogDescription>
            {mode === "select"
              ? "Bấm để chọn một lá bài, sau đó bấm Xác nhận."
              : "Bấm vào lá bài để xem chi tiết."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-4">
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
            {cards.map((card) => (
              <div
                key={card.uuid}
                className="relative aspect-[0.7] cursor-pointer"
                onClick={() => handleCardClick(card)}
              >
                <Image
                  src={card.imageUrl}
                  alt={card.name}
                  fill
                  sizes="150px"
                  className={cn(
                    "object-contain rounded-lg transition-all duration-200",
                    selectedCard?.uuid === card.uuid &&
                      "ring-4 ring-offset-2 ring-blue-500 ring-offset-background"
                  )}
                />
              </div>
            ))}
          </div>
        </div>

        {mode === "select" && (
          <DialogFooter className="mt-4">
            <Button onClick={handleConfirm} disabled={!selectedCard}>
              Xác nhận lựa chọn
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
