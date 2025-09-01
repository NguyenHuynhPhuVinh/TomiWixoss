// src/components/ui/Hand.tsx
"use client";
import { useState, useRef, useMemo } from "react";
import useGameStore from "@/store/gameStore";
import { useStore } from "zustand";
import Image from "next/image";
import { CardInstance } from "@/types/game";
import { AnimatePresence, motion } from "framer-motion";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";
import { cn } from "@/lib/utils";
import ContextMenu from "./ContextMenu";

// --- THAY ĐỔI LỚN ---
import { world, globalEntity } from "@/logic/ecs/world.miniplex";
import { Entity } from "@/logic/ecs/types.miniplex";
import {
  chargeEnerAction,
  discardCardAction,
  updateMulliganSelectionAction,
  initiatePlayerAction,
} from "@/logic/actions.miniplex";
// === THAY ĐỔI: Import hook mới và constants ===
import { useWorldQuery } from "@/hooks/useWorldQuery";
import { GamePhase, CardType, Zone } from "@/logic/constants";

interface HandProps {
  onCardSelect: (card: CardInstance | null) => void;
}

const CARD_BASE_WIDTH = 120;
const CARD_BASE_HEIGHT = 168;

export default function Hand({ onCardSelect }: HandProps) {
  // === THAY ĐỔI: Sử dụng hook mới để lấy dữ liệu trực tiếp từ world ===
  const handEntities = useWorldQuery(
    () =>
      Array.from(
        world
          .with("uuid", "cardInfo", "status", "zone")
          .where((e: Entity) => e.zone?.zone === Zone.HAND)
      ) // <-- Sử dụng hằng số
  );

  const hand: CardInstance[] = useMemo(() => {
    return handEntities.map(
      (entity: Entity): CardInstance => ({
        ...entity.cardInfo!.data,
        ...entity.status!,
        uuid: entity.uuid,
        owner: entity.zone!.owner,
      })
    );
  }, [handEntities]);

  // === THAY ĐỔI: Lấy state game trực tiếp từ globalEntity ===
  const phase = globalEntity.globalState?.phase;
  const mustDiscard = useStore(useGameStore, (state) => state.mustDiscard); // Vẫn lấy từ store vì đây là UI state
  // const initiatePlaceSigni = useStore( // <-- KHÔNG CẦN NỮA
  //   useGameStore,
  //   (state) => state.initiatePlaceSigni
  // );
  const numCards = hand.length;

  const [selectedCardUuid, setSelectedCardUuid] = useState<string | null>(null);
  const handRef = useRef<HTMLDivElement>(null);

  const mulliganSelectionUuids =
    globalEntity.globalState?.mulliganSelection ?? [];

  useOnClickOutside(handRef, () => {
    if (phase !== GamePhase.MULLIGAN) {
      // <-- Sử dụng hằng số
      setSelectedCardUuid(null);
      onCardSelect(null);
    }
  });

  const handleCardClick = (card: CardInstance) => {
    onCardSelect(card);

    if (phase === GamePhase.MULLIGAN) {
      // <-- Sử dụng hằng số
      updateMulliganSelectionAction(card.uuid); // Gọi action mới
    } else {
      setSelectedCardUuid((prev) => (prev === card.uuid ? null : card.uuid));
    }
  };

  const playableSigniUuids = useMemo(() => {
    // THÊM ĐIỀU KIỆN BẢO VỆ
    if (!world || phase !== GamePhase.MAIN) return []; // <-- Sử dụng hằng số

    const lrigsOnField = [];
    for (const e of world.with("zone", "cardInfo")) {
      if (e.zone?.zone === Zone.LRIG_ZONE) {
        // <-- Sử dụng hằng số
        lrigsOnField.push(e);
      }
    }
    const centerLrig = lrigsOnField.find((e: Entity) => e.zone?.index === 1);
    if (!centerLrig) return [];

    const lrigLevel = Number(centerLrig.cardInfo!.data.level ?? 0);
    const lrigLimit = Number(centerLrig.cardInfo!.data.limit ?? 99);

    const signiOnField = [];
    for (const e of world.with("zone", "cardInfo")) {
      if (e.zone?.zone === Zone.SIGNI_ZONE) {
        // <-- Sử dụng hằng số
        signiOnField.push(e);
      }
    }
    const currentTotalLevel = signiOnField.reduce(
      (sum: number, entity: Entity) => sum + (entity.cardInfo!.data.level ?? 0),
      0
    );

    return hand
      .filter((card) => {
        if (card.type !== CardType.SIGNI) return false; // <-- Sử dụng hằng số
        const cardLevel = Number(card.level ?? 0);
        return (
          cardLevel <= lrigLevel && currentTotalLevel + cardLevel <= lrigLimit
        );
      })
      .map((card) => card.uuid);
  }, [world, phase, hand]); // <-- Loại bỏ worldVersion

  if (numCards === 0) return null;

  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-[250px] flex justify-center items-end pb-4 pointer-events-none z-20"
      ref={handRef}
    >
      <div className="relative pointer-events-auto">
        <AnimatePresence>
          {hand.map((card, index) => {
            const isSelectedForMulligan =
              phase === GamePhase.MULLIGAN && // <-- Sử dụng hằng số
              mulliganSelectionUuids.includes(card.uuid);
            const isSelectedForPreview =
              phase !== GamePhase.MULLIGAN && selectedCardUuid === card.uuid; // <-- Sử dụng hằng số

            // === ADDED GUARD CLAUSE TO PREVENT NaN ERROR ===
            const numCards = hand.length;
            if (numCards === 0) return null;
            // ===============================================

            const centerIndex = (numCards - 1) / 2;
            const distanceFromCenter = index - centerIndex;
            const translateX =
              isNaN(distanceFromCenter) || !isFinite(distanceFromCenter)
                ? 0
                : distanceFromCenter * 60;
            const rotateZ =
              isNaN(distanceFromCenter) || !isFinite(distanceFromCenter)
                ? 0
                : distanceFromCenter * 4;
            const transform = `translateX(${translateX}px) rotate(${rotateZ}deg)`;

            return (
              <motion.div
                key={card.uuid}
                className="absolute bottom-0 left-1/2 cursor-pointer origin-bottom"
                style={{
                  marginLeft: `-${CARD_BASE_WIDTH / 2}px`,
                  zIndex: numCards - Math.abs(distanceFromCenter),
                }}
                animate={{
                  y: isSelectedForMulligan || isSelectedForPreview ? -40 : 0,
                  scale:
                    isSelectedForMulligan || isSelectedForPreview ? 1.2 : 1,
                  opacity:
                    phase === GamePhase.MAIN && // <-- Sử dụng hằng số
                    card.type === CardType.SIGNI && // <-- Sử dụng hằng số
                    !playableSigniUuids.includes(card.uuid)
                      ? 0.5
                      : 1,
                  transform: transform,
                  filter: isSelectedForPreview
                    ? "drop-shadow(0 0 15px rgba(59, 130, 246, 0.8))"
                    : isSelectedForMulligan
                    ? "drop-shadow(0 0 15px rgba(34, 197, 94, 0.8))"
                    : "drop-shadow(0 0 0 rgba(255, 255, 255, 0))",
                  transition: { type: "spring", stiffness: 400, damping: 30 },
                }}
                whileHover={{
                  ...(!(isSelectedForMulligan || isSelectedForPreview) && {
                    y: -40,
                    scale: 1.15,
                    filter: "drop-shadow(0 0 15px rgba(255, 255, 255, 0.7))",
                  }),
                  zIndex: numCards + 1,
                }}
                onClick={() => handleCardClick(card)}
              >
                {isSelectedForPreview && (
                  <ContextMenu
                    showChargeEner={phase === GamePhase.ENER} // <-- Sử dụng hằng số
                    onChargeEner={() => {
                      chargeEnerAction(card.uuid); // Gọi action mới
                      setSelectedCardUuid(null);
                      onCardSelect(null);
                    }}
                    showDiscard={phase === GamePhase.END && mustDiscard} // <-- Sử dụng hằng số
                    onDiscard={() => {
                      discardCardAction(card.uuid); // Gọi action mới
                      setSelectedCardUuid(null);
                      onCardSelect(null);
                    }}
                    showPlaySigni={
                      phase === GamePhase.MAIN && // <-- Sử dụng hằng số
                      card.type === CardType.SIGNI && // <-- Sử dụng hằng số
                      playableSigniUuids.includes(card.uuid)
                    }
                    onPlaySigni={() => {
                      initiatePlayerAction({
                        type: "place_signi",
                        cardUuid: card.uuid,
                      });
                      setSelectedCardUuid(null);
                      onCardSelect(null);
                    }}
                  />
                )}
                <div
                  className={cn(
                    "relative transition-all duration-300",
                    isSelectedForMulligan &&
                      "ring-4 ring-blue-500 ring-offset-2 ring-offset-background rounded-lg",
                    phase === GamePhase.MAIN && // <-- Sử dụng hằng số
                      card.type === CardType.SIGNI && // <-- Sử dụng hằng số
                      !playableSigniUuids.includes(card.uuid) &&
                      "grayscale pointer-events-none"
                  )}
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
