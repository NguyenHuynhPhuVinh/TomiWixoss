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
import { useTranslation } from "react-i18next"; // Import hook

interface DeckViewerProps {
  // title prop giờ có thể bỏ nếu muốn, vì chúng ta sẽ tự tính
  cards: CardInstance[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCardClick: (card: CardInstance) => void;
  // Thêm prop để xác định context
  context: "center_grow" | "assist_grow";
}

export default function DeckViewer({
  cards,
  isOpen,
  onOpenChange,
  onCardClick,
  context,
}: DeckViewerProps) {
  const { t } = useTranslation(); // Sử dụng hook

  const dialogTitle =
    context === "center_grow"
      ? t("deckViewer.title_center")
      : t("deckViewer.title_assist");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {dialogTitle} ({t("deckViewer.cardCount", { count: cards.length })})
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
