// src/components/ui/SideCardPreview.tsx
import { CardInstance } from "@/types/game";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface SideCardPreviewProps {
  card: CardInstance | null;
}

export default function SideCardPreview({ card }: SideCardPreviewProps) {
  const { t } = useTranslation(); // Lấy hàm t

  // Hàm helper để dịch loại năng lực
  const getAbilityTypeLabel = (type: string) => {
    // Dùng key động dựa trên loại năng lực
    const key = `card.ability_${type}`;
    // `t` sẽ tự động trả về key nếu không tìm thấy bản dịch
    return t(key);
  };

  return (
    <AnimatePresence>
      {card && (
        <motion.div
          // === THAY ĐỔI VỊ TRÍ VÀ KÍCH THƯỚC ===
          className="absolute top-4 left-4 z-30 w-[300px] h-[calc(100vh-2rem)] p-4 bg-card/80 backdrop-blur-sm border rounded-lg shadow-2xl pointer-events-none flex flex-col"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {/* Phần hình ảnh */}
          <div className="relative aspect-[0.716] w-full mb-4 shrink-0">
            <Image
              src={card.imageUrl}
              alt={card.name}
              fill
              sizes="300px"
              className="object-contain rounded-md"
            />
          </div>

          {/* Phần thông tin */}
          <div className="flex-grow overflow-y-auto pr-2 pointer-events-auto">
            <h3 className="text-xl font-bold text-card-foreground">
              {card.name}
            </h3>
            <div className="flex justify-between items-center text-sm text-muted-foreground mb-1">
              <span>
                {card.type}
                {card.level !== undefined
                  ? ` - ${t("card.levelLabel")} ${card.level}`
                  : ""}
              </span>
              {card.power !== undefined && (
                <span className="font-bold text-lg">{card.power}</span>
              )}
            </div>
            {card.class && (
              <p className="text-xs text-muted-foreground italic mb-4">
                {card.class}
              </p>
            )}

            {/* Phần hiển thị Abilities */}
            <div className="space-y-3 text-xs text-foreground/90">
              {card.abilities?.map((ability, index) => (
                <div key={index} className="border-t pt-2">
                  <p className="font-bold text-primary/80">
                    {/* Dịch loại năng lực */}
                    {getAbilityTypeLabel(ability.type)}{" "}
                    {ability.timing?.join(", ")}
                  </p>
                  <p className="text-sm leading-snug">
                    {ability.description} {/* Mô tả đã được dịch */}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
