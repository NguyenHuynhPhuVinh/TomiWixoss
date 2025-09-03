"use client";
import { useState } from "react"; // Thêm import useState
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter, // Thêm import DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button"; // Thêm import Button
import { CardInstance } from "@/types/game";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils"; // Thêm import cn

interface DeckViewerProps {
  title: string;
  cards: CardInstance[];
  isOpen: boolean;
  mode: "view" | "select"; // Prop mới để xác định chế độ
  onOpenChange: (isOpen: boolean) => void;
  onCardSelect: (card: CardInstance | null) => void; // Prop này giờ chỉ dùng để preview
  onConfirm: (card: CardInstance) => void; // Prop mới cho hành động xác nhận
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

  const handleCardClick = (card: CardInstance) => {
    // Nếu click lại lá đã chọn, bỏ chọn nó
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

  // Reset state khi dialog đóng/mở
  if (!isOpen && selectedCard) {
    setSelectedCard(null);
    onCardSelect(null);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl h-[80vh] flex flex-col"
        onMouseLeave={() => {
          // Khi ở chế độ view, di chuột ra ngoài sẽ tắt preview
          if (mode === "view") onCardSelect(null);
        }}
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
                    // Thêm hiệu ứng viền sáng khi được chọn
                    selectedCard?.uuid === card.uuid &&
                      "ring-4 ring-offset-2 ring-blue-500 ring-offset-background"
                  )}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Chỉ hiển thị footer và nút Xác nhận ở chế độ 'select' */}
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
