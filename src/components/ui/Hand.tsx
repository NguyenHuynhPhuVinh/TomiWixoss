// src/components/ui/Hand.tsx
"use client";

import useGameStore from "@/store/gameStore";
import { useStore } from "zustand";
import Image from "next/image";
import { CardInstance } from "@/types/game";
import { Button } from "./button";
import { AnimatePresence, motion } from "framer-motion";

interface HandProps {
  onCardClick: (card: CardInstance) => void;
  onReturnCards: () => void;
}

// --- CÁC THAM SỐ MỚI ĐỂ TÙY CHỈNH ---
const CARD_BASE_WIDTH = 120; // Kích thước lá bài lớn hơn
const CARD_BASE_HEIGHT = 168;
const FAN_ANGLE_PER_CARD = 4; // Góc nghiêng cho mỗi lá bài
const OVERLAP_DISTANCE = 60; // Khoảng cách chồng lên nhau giữa các lá bài (pixel)
const HOVER_Y_OFFSET = -40; // Độ nhô lên khi hover

export default function Hand({ onCardClick, onReturnCards }: HandProps) {
  const hand = useStore(useGameStore, (state) => state.player.hand);
  const numCards = hand.length;

  if (numCards === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[250px] flex justify-center items-end pb-4 pointer-events-none z-20">
      <div className="relative pointer-events-auto">
        <AnimatePresence>
          {hand.map((card, index) => {
            // Tính toán vị trí tâm của dải bài
            const centerIndex = (numCards - 1) / 2;
            const distanceFromCenter = index - centerIndex;

            // Tính toán transform cho từng lá bài
            const transform = `
              translateX(${distanceFromCenter * OVERLAP_DISTANCE}px)
              rotate(${distanceFromCenter * FAN_ANGLE_PER_CARD}deg)
            `;

            return (
              <motion.div
                key={card.uuid}
                className="absolute bottom-0 left-1/2 cursor-pointer origin-bottom"
                // Áp dụng style trực tiếp ở đây
                style={{
                  // Dịch chuyển về tâm trước khi áp dụng transform
                  marginLeft: `-${CARD_BASE_WIDTH / 2}px`,
                  zIndex: numCards - Math.abs(distanceFromCenter),
                }}
                // Animation và transform
                initial={{ opacity: 0, y: 100, scale: 0.5 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transform: transform, // Áp dụng transform động
                  transition: { type: "spring", stiffness: 400, damping: 30 },
                }}
                exit={{
                  opacity: 0,
                  y: 50,
                  scale: 0.5,
                  transition: { duration: 0.3 },
                }}
                whileHover={{
                  y: HOVER_Y_OFFSET,
                  scale: 1.15,
                  zIndex: numCards + 1,
                }}
                onClick={() => onCardClick(card)}
              >
                <div
                  className="relative drop-shadow-xl"
                  style={{
                    width: `${CARD_BASE_WIDTH}px`,
                    height: `${CARD_BASE_HEIGHT}px`,
                  }}
                >
                  <Image
                    src={card.imageUrl}
                    alt={card.name}
                    fill
                    sizes={`${CARD_BASE_WIDTH}px`}
                    priority={true}
                    className="object-contain"
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-4 right-4 pointer-events-auto">
        <Button onClick={onReturnCards} variant="outline" size="sm">
          Bỏ bài
        </Button>
      </div>
    </div>
  );
}
