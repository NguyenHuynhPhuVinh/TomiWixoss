// src/components/ui/Hand.tsx
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import useGameStore from "@/store/gameStore";
import { useStore } from "zustand";
import Image from "next/image";
import { CardInstance } from "@/types/game";
import { AnimatePresence, motion } from "framer-motion";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";
import { cn } from "@/lib/utils"; // Import cn utility
import ContextMenu from "./ContextMenu"; // Thêm import ContextMenu
import { dispatchChargeEnerAction } from "@/logic/ecs/actions"; // <-- IMPORT
import { dispatchUpdateMulliganSelection } from "@/logic/ecs/actions";
import { dispatchDiscardCardAction } from "@/logic/ecs/actions"; // <-- IMPORT
import {
  CardInfoComponent,
  ZoneComponent,
  StatusComponent,
  GlobalStateComponent,
} from "@/logic/ecs/components/card.components";
import { GLOBAL_ENTITY } from "@/logic/ecs/game.factory";

interface HandProps {
  onCardSelect: (card: CardInstance | null) => void;
}

const CARD_BASE_WIDTH = 120;
const CARD_BASE_HEIGHT = 168;

export default function Hand({ onCardSelect }: HandProps) {
  const world = useStore(useGameStore, (state) => state.world);
  const worldVersion = useStore(useGameStore, (state) => state.worldVersion);

  const handEntities = useMemo(() => {
    if (!world) return [];
    return world
      .query(["CardInfo", "Zone"])
      .filter(
        (e) => world.getComponent<ZoneComponent>(e, "Zone")!.zone === "hand"
      );
  }, [world, worldVersion]);

  const hand: CardInstance[] = useMemo(() => {
    if (!world) return [];
    return handEntities.map((entity) => {
      const cardInfo = world.getComponent<CardInfoComponent>(
        entity,
        "CardInfo"
      )!;
      const status = world.getComponent<StatusComponent>(entity, "Status")!;
      const zone = world.getComponent<ZoneComponent>(entity, "Zone")!;
      return {
        ...cardInfo.data,
        ...status,
        uuid: entity.toString(),
        owner: zone.owner,
      };
    });
  }, [world, handEntities, worldVersion]);

  const phase = useStore(useGameStore, (state) => state.phase);
  const mustDiscard = useStore(useGameStore, (state) => state.mustDiscard);
  const initiatePlaceSigni = useStore(
    useGameStore,
    (state) => state.initiatePlaceSigni
  );
  const numCards = hand.length;

  const [selectedCardUuid, setSelectedCardUuid] = useState<string | null>(null);
  const handRef = useRef<HTMLDivElement>(null);

  const globalState = world?.getComponent<GlobalStateComponent>(
    GLOBAL_ENTITY,
    "GlobalState"
  );
  const mulliganSelection = globalState?.mulliganSelection ?? [];

  useOnClickOutside(handRef, () => {
    if (phase !== "mulligan") {
      setSelectedCardUuid(null);
      onCardSelect(null);
    }
  });

  const handleCardClick = (card: CardInstance) => {
    onCardSelect(card);
    const cardEntityId = parseInt(card.uuid);

    if (phase === "mulligan") {
      const newSelection = mulliganSelection.includes(cardEntityId)
        ? mulliganSelection.filter((id) => id !== cardEntityId)
        : [...mulliganSelection, cardEntityId];
      dispatchUpdateMulliganSelection(newSelection);
    } else {
      if (selectedCardUuid === card.uuid) {
        setSelectedCardUuid(null);
        onCardSelect(null);
      } else {
        setSelectedCardUuid(card.uuid);
      }
    }
  };

  const playableSigniUuids = useMemo(() => {
    if (!world || phase !== "main") return [];

    const lrigZoneEntities = world
      .query(["Zone"])
      .filter(
        (e) => world.getComponent<ZoneComponent>(e, "Zone")!.zone === "lrigZone"
      );
    const centerLrigEntity = lrigZoneEntities.find(
      (e) => world.getComponent<ZoneComponent>(e, "Zone")!.index === 1
    );
    if (!centerLrigEntity) return [];
    const centerLrigInfo = world.getComponent<CardInfoComponent>(
      centerLrigEntity,
      "CardInfo"
    )!;
    const lrigLevel = centerLrigInfo.data.level ?? 0;
    const lrigLimit =
      typeof centerLrigInfo.data.limit === "number"
        ? centerLrigInfo.data.limit
        : 99;

    const signiOnField = world
      .query(["Zone"])
      .filter(
        (e) =>
          world.getComponent<ZoneComponent>(e, "Zone")!.zone === "signiZone"
      );
    const currentTotalLevel = signiOnField.reduce((sum, entity) => {
      return (
        sum +
        (world.getComponent<CardInfoComponent>(entity, "CardInfo")!.data
          .level ?? 0)
      );
    }, 0);

    return hand
      .filter((card) => {
        if (card.type !== "SIGNI") return false;
        const cardLevel = card.level ?? 0;
        const levelOk = cardLevel <= lrigLevel;
        const limitOk = currentTotalLevel + cardLevel <= lrigLimit;
        return levelOk && limitOk;
      })
      .map((card) => card.uuid);
  }, [world, worldVersion, phase, hand]);

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
              phase === "mulligan" &&
              mulliganSelection.includes(parseInt(card.uuid));
            const isSelectedForPreview =
              phase !== "mulligan" && selectedCardUuid === card.uuid;

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
                    phase === "main" &&
                    card.type === "SIGNI" &&
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
                    showChargeEner={phase === "ener"}
                    onChargeEner={() => {
                      dispatchChargeEnerAction("hand", parseInt(card.uuid));
                      setSelectedCardUuid(null);
                      onCardSelect(null);
                    }}
                    showDiscard={phase === "end" && mustDiscard}
                    onDiscard={() => {
                      dispatchDiscardCardAction(parseInt(card.uuid));
                      setSelectedCardUuid(null);
                      onCardSelect(null);
                    }}
                    showPlaySigni={
                      phase === "main" &&
                      card.type === "SIGNI" &&
                      playableSigniUuids.includes(card.uuid)
                    }
                    onPlaySigni={() => {
                      initiatePlaceSigni(card.uuid);
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
                    phase === "main" &&
                      card.type === "SIGNI" &&
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
