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
import {
  CardInfoComponent,
  ZoneComponent,
  StatusComponent,
  GlobalStateComponent,
} from "@/logic/ecs/components/card.components";
import { GLOBAL_ENTITY } from "@/logic/ecs/game.factory";

interface HandProps {
  onCardSelect: (card: CardInstance | null) => void;
  // Xóa prop onMulliganSelectionChange vì không còn cần thiết
}

const CARD_BASE_WIDTH = 120;
const CARD_BASE_HEIGHT = 168;

export default function Hand({ onCardSelect }: HandProps) {
  const world = useStore(useGameStore, (state) => state.world);
  const worldVersion = useStore(useGameStore, (state) => state.worldVersion);

  // === TRUY VẤN DỮ LIỆU TAY BÀI TỪ WORLD ===
  const handEntities = useMemo(() => {
    if (!world) return [];
    return world
      .query([CardInfoComponent, ZoneComponent])
      .filter((e) => world.getComponent(e, ZoneComponent)!.zone === "hand");
  }, [world, worldVersion]);

  const hand: CardInstance[] = useMemo(() => {
    if (!world) return [];
    return handEntities.map((entity) => {
      const cardInfo = world.getComponent(entity, CardInfoComponent)!;
      const status = world.getComponent(entity, StatusComponent)!;
      const zone = world.getComponent(entity, ZoneComponent)!;
      return {
        ...cardInfo.data,
        ...status,
        uuid: entity.toString(),
        owner: zone.owner,
      };
    });
  }, [world, handEntities, worldVersion]);
  // ==========================================

  const phase = useStore(useGameStore, (state) => state.phase);
  // Tạm thời comment out các state/action chưa dùng
  // const mustDiscard = ...
  const initiatePlaceSigni = useStore(
    useGameStore,
    (state) => state.initiatePlaceSigni
  );
  const numCards = hand.length;

  const [selectedCardUuid, setSelectedCardUuid] = useState<string | null>(null);
  // Xóa state mulliganSelection cục bộ
  // const [mulliganSelection, setMulliganSelection] = useState<string[]>([]);
  const handRef = useRef<HTMLDivElement>(null);

  // Lấy mulliganSelection từ global state
  const globalState = world?.getComponent(GLOBAL_ENTITY, GlobalStateComponent);
  const mulliganSelection = globalState?.mulliganSelection ?? [];

  // === XÓA CÁC DÒNG GỌI ACTION KHÔNG TỒN TẠI ===
  // const phase = useGameStore((state) => state.phase);
  // const chargeEnerAction = useGameStore((state) => state.chargeEner);
  // const playSigniAction = useGameStore((state) => state.playSigni);
  // const setPlayerAction = useGameStore((state) => state.setPlayerAction);
  // ===========================================

  // Xóa useEffect gửi thay đổi lên component cha
  // useEffect(() => {
  //   if (phase === "mulligan") {
  //     onMulliganSelectionChange(mulliganSelection);
  //   }
  // }, [mulliganSelection, onMulliganSelectionChange, phase]);

  useOnClickOutside(handRef, () => {
    if (phase !== "mulligan") {
      // Chỉ hoạt động khi không ở phase mulligan
      setSelectedCardUuid(null);
      onCardSelect(null);
    }
  });

  const handleCardClick = (card: CardInstance) => {
    // Luôn cập nhật preview khi click, bất kể phase nào
    onCardSelect(card);
    const cardEntityId = parseInt(card.uuid);

    if (phase === "mulligan") {
      const newSelection = mulliganSelection.includes(cardEntityId)
        ? mulliganSelection.filter((id) => id !== cardEntityId)
        : [...mulliganSelection, cardEntityId];

      // Gửi lựa chọn mới lên global state
      dispatchUpdateMulliganSelection(newSelection);
    } else {
      // Logic click bình thường (chỉ để hiển thị preview, đã được xử lý ở dòng đầu tiên)
      // Chúng ta có thể thêm lại logic selectedUuid nếu muốn có hiệu ứng "khóa"
      if (selectedCardUuid === card.uuid) {
        setSelectedCardUuid(null);
        onCardSelect(null); // Click lần 2 thì ẩn preview
      } else {
        setSelectedCardUuid(card.uuid);
        // onCardSelect(card) đã được gọi ở trên
      }
    }
  };

  // Tạm thời vô hiệu hóa logic playableSigniUuids
  const playableSigniUuids = useMemo(() => {
    if (!world || phase !== "main") return [];

    // Logic kiểm tra Level/Limit y hệt như trong PlaceSigniSystem
    const lrigZoneEntities = world
      .query([ZoneComponent])
      .filter((e) => world.getComponent(e, ZoneComponent)!.zone === "lrigZone");
    const centerLrigEntity = lrigZoneEntities.find(
      (e) => world.getComponent(e, ZoneComponent)!.index === 1
    );
    if (!centerLrigEntity) return [];
    const centerLrigInfo = world.getComponent(
      centerLrigEntity,
      CardInfoComponent
    )!;
    const lrigLevel = centerLrigInfo.data.level ?? 0;
    const lrigLimit =
      typeof centerLrigInfo.data.limit === "number"
        ? centerLrigInfo.data.limit
        : 99;

    const signiOnField = world
      .query([ZoneComponent])
      .filter(
        (e) => world.getComponent(e, ZoneComponent)!.zone === "signiZone"
      );
    const currentTotalLevel = signiOnField.reduce((sum, entity) => {
      return (
        sum + (world.getComponent(entity, CardInfoComponent)!.data.level ?? 0)
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

  // ... logic state và ref của component giữ nguyên ...

  // Tạm thời comment out các hàm handler
  // const handleDiscard = (cardUuid: string) => {
  //   const command = new DiscardCardCommand(cardUuid);
  //   commandService.dispatch(command);
  //   // Không cần bỏ chọn vì người chơi có thể cần bỏ nhiều lá
  // };

  // const handleChargeEner = (cardUuid: string) => {
  //   const command = new ChargeEnerCommand({ from: "hand", cardUuid });
  //   commandService.dispatch(command);
  //   setSelectedCardUuid(null);
  //   onCardSelect(null);
  // };

  // --- LOGIC MỚI: XÁC ĐỊNH SIGNI HỢP LỆ ---
  // Tạm thời comment out vì chưa có dữ liệu từ world
  // const playableSigniUuids = useMemo(() => {
  //   if (phase !== "main" || !currentCenterLrig) return [];

  //   const lrigLevel = currentCenterLrig.level ?? 0;
  //   // Tạm thời xử lý limit là số, sẽ nâng cấp sau
  //   const lrigLimit =
  //     typeof currentCenterLrig.limit === "number"
  //       ? currentCenterLrig.limit
  //       : 99;
  //   const signiOnField = signiZone.filter(
  //     (card): card is CardInstance => card !== null
  //   );
  //   const currentTotalLevelOnField = signiOnField.reduce(
  //     (sum: number, signi) => sum + (signi?.level ?? 0),
  //     0
  //   );

  //   return hand
  //     .filter((card) => {
  //       if (card.type !== "SIGNI") return false;
  //       const cardLevel = card.level ?? 0;
  //       // Điều kiện 1: Level lá bài <= Level LRIG
  //       const levelOk = cardLevel <= lrigLevel;
  //       // Điều kiện 2: Tổng level trên sân + level lá bài <= Limit LRIG
  //       const limitOk = currentTotalLevelOnField + cardLevel <= lrigLimit;
  //       return levelOk && limitOk;
  //     })
  //     .map((card) => card.uuid);
  // }, [hand, phase, currentCenterLrig, signiZone]); // Thêm các dependency vào đây

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

            // ... logic transform ...
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
                  y: isSelectedForMulligan || isSelectedForPreview ? -40 : 0,
                  scale:
                    isSelectedForMulligan || isSelectedForPreview ? 1.2 : 1,
                  // Thêm hiệu ứng làm mờ
                  opacity:
                    phase === "main" &&
                    card.type === "SIGNI" &&
                    !playableSigniUuids.includes(card.uuid)
                      ? 0.5
                      : 1,
                  // ... transform và filter ...
                  transform: transform,
                  filter: isSelectedForPreview
                    ? "drop-shadow(0 0 15px rgba(59, 130, 246, 0.8))"
                    : isSelectedForMulligan
                    ? "drop-shadow(0 0 15px rgba(34, 197, 94, 0.8))" // Viền xanh cho mulligan
                    : "drop-shadow(0 0 0 rgba(255, 255, 255, 0))", // Thay màu shadow cho đẹp hơn
                  transition: { type: "spring", stiffness: 400, damping: 30 },
                }}
                // === THÊM LẠI WHILEHOVER ===
                whileHover={{
                  // Chỉ áp dụng hiệu ứng hover nếu lá bài không đang được chọn
                  ...(!(isSelectedForMulligan || isSelectedForPreview) && {
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
                {isSelectedForPreview && (
                  <ContextMenu
                    showChargeEner={phase === "ener"}
                    onChargeEner={() => {
                      // Chuyển đổi uuid (string) thành entityId (number)
                      dispatchChargeEnerAction("hand", parseInt(card.uuid));
                      setSelectedCardUuid(null);
                      onCardSelect(null);
                    }}
                    // Logic cũ cho End Phase
                    showDiscard={false /* phase === "end" && mustDiscard */}
                    onDiscard={() => {
                      /* handleDiscard(card.uuid) */
                    }}
                    showPlaySigni={
                      phase === "main" &&
                      card.type === "SIGNI" &&
                      playableSigniUuids.includes(card.uuid)
                    }
                    onPlaySigni={() => {
                      initiatePlaceSigni(card.uuid); // Kích hoạt chế độ đặt bài trong uiSlice
                      setSelectedCardUuid(null);
                      onCardSelect(null);
                    }}
                  />
                )}

                <div
                  className={cn(
                    "relative transition-all duration-300",
                    // Thêm viền xanh nếu được chọn cho mulligan
                    isSelectedForMulligan &&
                      "ring-4 ring-blue-500 ring-offset-2 ring-offset-background rounded-lg",
                    // Thêm hiệu ứng grayscale để rõ hơn
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
