"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CardInstance } from "@/types/game";
import Image from "next/image";
import { useTranslation } from "react-i18next";

interface DeckViewerProps {
  title: string; // <-- Luôn nhận một tiêu đề tùy chỉnh
  cards: CardInstance[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCardClick: (card: CardInstance) => void; // <-- Prop này giờ sẽ luôn dùng để thực hiện hành động chính (như Grow)
  onCardHover: (card: CardInstance | null) => void; // <-- Prop mới để xem trước bài khi hover
}

export default function DeckViewer({
  title,
  cards,
  isOpen,
  onOpenChange,
  onCardClick,
  onCardHover,
}: DeckViewerProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl h-[80vh] flex flex-col"
        // Thêm onMouseLeave để xóa preview khi chuột rời khỏi dialog
        onMouseLeave={() => onCardHover(null)}
      >
        <DialogHeader>
          <DialogTitle>
            {title} ({t("deckViewer.cardCount", { count: cards.length })})
          </DialogTitle>
          <DialogDescription>{t("deckViewer.description")}</DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-4">
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
            {cards.map((card) => (
              <div
                key={card.uuid}
                className="relative aspect-[0.7] cursor-pointer"
                onClick={() => onCardClick(card)}
                // Thêm onMouseEnter để kích hoạt preview
                onMouseEnter={() => onCardHover(card)}
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
