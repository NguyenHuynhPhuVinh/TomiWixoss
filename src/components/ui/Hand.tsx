// src/components/ui/Hand.tsx
"use client";

import { useState, useRef } from "react";
import useGameStore from "@/store/gameStore";
import { useStore } from "zustand";
import Image from "next/image";
import { CardInstance } from "@/types/game";
import { AnimatePresence, motion } from "framer-motion";
import ContextMenu from "./ContextMenu";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";

interface HandProps {
  onCardSelect: (card: CardInstance | null) => void;
  onReturnSingleCard: (cardUuid: string) => void;
}

const CARD_BASE_WIDTH = 120;
const CARD_BASE_HEIGHT = 168;

export default function Hand({ onCardSelect, onReturnSingleCard }: HandProps) {
  const hand = useStore(useGameStore, (state) => state.player.hand);
  const numCards = hand.length;

  const [selectedCardUuid, setSelectedCardUuid] = useState<string | null>(null);
  const handRef = useRef<HTMLDivElement>(null);

  // Lấy phase và actions
  const phase = useGameStore((state) => state.phase);
  const chargeEnerAction = useGameStore((state) => state.chargeEner);
  const playSigniAction = useGameStore((state) => state.playSigni);
  const setPlayerAction = useGameStore((state) => state.setPlayerAction);

  useOnClickOutside(handRef, () => {
    setSelectedCardUuid(null);
    onCardSelect(null);
  });

  const handleCardClick = (card: CardInstance) => {
    if (selectedCardUuid === card.uuid) {
      setSelectedCardUuid(null);
      onCardSelect(null);
    } else {
      setSelectedCardUuid(card.uuid);
      onCardSelect(card);
    }
  };

  const handleDiscard = () => {
    if (selectedCardUuid) {
      onReturnSingleCard(selectedCardUuid);
      setSelectedCardUuid(null);
      onCardSelect(null);
    }
  };

  const handleChargeEner = (cardUuid: string) => {
    chargeEnerAction(cardUuid, "hand");
    setSelectedCardUuid(null);
    onCardSelect(null);
  };

  const handlePlaySigni = (card: CardInstance) => {
    // Khi người dùng click "Play SIGNI" từ tay
    setPlayerAction({ type: "place_signi", card, fromZone: "hand" });
    setSelectedCardUuid(null);
    onCardSelect(null);
  };

  if (numCards === 0) return null;

  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-[250px] flex justify-center items-end pb-4 pointer-events-none z-20"
      ref={handRef}
    >
      <div className="relative pointer-events-auto">
        <AnimatePresence>
          {hand.map((card, index) => {
            const isSelected = selectedCardUuid === card.uuid;
            const centerIndex = (numCards - 1) / 2;
            const distanceFromCenter = index - centerIndex;
            const transform = `translateX(${
              distanceFromCenter * 60
            }px) rotate(${distanceFromCenter * 4}deg)`;

            return (
              <motion.div
                key={card.uuid}
                className="absolute bottom-0 left-1/2 cursor-pointer origin-bottom"
                style={{
                  marginLeft: `-${CARD_BASE_WIDTH / 2}px`,
                  // zIndex cơ bản dựa trên vị trí
                  zIndex: numCards - Math.abs(distanceFromCenter),
                }}
                animate={{
                  y: isSelected ? -40 : 0,
                  scale: isSelected ? 1.2 : 1, // Lá được chọn sẽ to hơn một chút
                  transform: transform,
                  filter: isSelected
                    ? "drop-shadow(0 0 15px rgba(59, 130, 246, 0.8))"
                    : "drop-shadow(0 0 0 rgba(255, 255, 255, 0))", // Thay màu shadow cho đẹp hơn
                  transition: { type: "spring", stiffness: 400, damping: 30 },
                }}
                // === THÊM LẠI WHILEHOVER ===
                whileHover={{
                  // Chỉ áp dụng hiệu ứng hover nếu lá bài không đang được chọn
                  ...(!isSelected && {
                    y: -40,
                    scale: 1.15,
                    filter: "drop-shadow(0 0 15px rgba(255, 255, 255, 0.7))",
                  }),
                  // Luôn đưa lá bài đang hover lên trên cùng
                  zIndex: numCards + 1,
                }}
                // === KẾT THÚC THÊM LẠI WHILEHOVER ===

                onClick={() => handleCardClick(card)}
              >
                {/* Hiển thị ContextMenu nếu lá bài này đang được chọn */}
                {isSelected && (
                  <ContextMenu
                    onDiscard={handleDiscard}
                    showChargeEner={phase === "ener"}
                    onChargeEner={() => handleChargeEner(card.uuid)}
                    showPlaySigni={phase === "main"}
                    onPlaySigni={() => handlePlaySigni(card)}
                  />
                )}

                <div
                  className="relative"
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
    </div>
  );
}
