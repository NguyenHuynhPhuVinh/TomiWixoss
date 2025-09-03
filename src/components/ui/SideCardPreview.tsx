// src/components/ui/SideCardPreview.tsx
import { CardInstance } from "@/types/game";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { forwardRef } from "react"; // <-- THÊM IMPORT

interface SideCardPreviewProps {
  card: CardInstance | null;
}

// THAY ĐỔI: Bọc component bằng forwardRef
const SideCardPreview = forwardRef<HTMLDivElement, SideCardPreviewProps>(
  function SideCardPreview({ card }, ref) {
    const { t } = useTranslation();

    const getAbilityTypeLabel = (type: string) => {
      const formattedType = type.replace(/([A-Z])/g, " $1").trim();
      const key = `card.ability_${type}`;
      const translated = t(key);
      return translated === key ? `[${formattedType}]` : translated;
    };

    return (
      <AnimatePresence>
        {card && (
          <motion.div
            ref={ref} // <-- Gán ref vào đây
            key={card.uuid} // <-- THÊM KEY DUY NHẤT VÀO ĐÂY
            className="absolute top-4 left-4 z-[100] w-[300px] h-[calc(100vh-2rem)] p-4 bg-card/80 backdrop-blur-sm border rounded-lg shadow-2xl pointer-events-auto flex flex-col" // <-- Đổi lại pointer-events-auto
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

              {/* === THÊM HIỂN THỊ CHO GUARD VÀ TIMING === */}
              <div className="flex gap-2 mb-3 text-xs">
                {card.Guard && (
                  <span className="font-bold text-green-400 bg-green-900/50 px-2 py-1 rounded">
                    {t("card.ability_Guard")}
                  </span>
                )}
                {card.timing && card.timing.length > 0 && (
                  <span className="font-bold text-cyan-400 bg-cyan-900/50 px-2 py-1 rounded">
                    Timing: {card.timing.join(", ")}
                  </span>
                )}
              </div>
              {/* === CHỈNH SỬA CÁCH HIỂN THỊ ABILITIES === */}
              <div className="space-y-3 text-xs text-foreground/90">
                {card.abilities?.map((ability, index) => (
                  <div key={index} className="border-t pt-2">
                    <p className="font-bold text-primary/80">
                      {/* Bây giờ chúng ta lấy type từ object ability */}
                      {getAbilityTypeLabel(ability.type)}
                    </p>
                    <p className="text-sm leading-snug">
                      {/* Description vẫn lấy như cũ */}
                      {ability.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Phần hiển thị Life Burst Effect */}
              {card.lifeBurstEffect && (
                <div className="mt-3 border-t-2 border-amber-400 pt-2">
                  <p className="font-bold text-amber-400">
                    {t("card.lifeBurst")}
                  </p>
                  <p className="text-sm leading-snug">
                    {card.lifeBurstEffect.description}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

export default SideCardPreview;
