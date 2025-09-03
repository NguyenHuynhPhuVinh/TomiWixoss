// src/components/ui/SideCardPreview.tsx
import { CardInstance, CardColor, CardCost } from "@/types/game";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import {
  Shield,
  Gem,
  Swords,
  Star,
  Users,
  BookOpen,
  Atom,
  RefreshCw,
  Clock,
} from "lucide-react";
import useGameStore from "@/store/gameStore";
import { useStore } from "zustand";

// Helper Component để hiển thị các chấm màu
const ColorIndicator = ({ colors }: { colors: CardColor[] }) => {
  const colorMap: Record<CardColor, string> = {
    White: "bg-gray-200 border-gray-400",
    Red: "bg-red-500",
    Blue: "bg-sky-500",
    Green: "bg-green-500",
    Black: "bg-black",
    Colorless: "bg-gray-400",
  };
  return (
    <div className="flex items-center gap-1.5">
      {colors.map((color, index) => (
        <div
          key={index}
          className={cn(
            "size-3 rounded-full border",
            colorMap[color] || "bg-transparent"
          )}
        />
      ))}
    </div>
  );
};

// Helper Component để hiển thị chi phí Ener (ĐÃ SỬA LỖI)
const CostDisplay = ({
  cost,
  label = "CHI PHÍ:",
}: {
  cost: CardCost;
  label?: string;
}) => {
  // Bỏ bộ lọc sai. Chỉ cần kiểm tra xem cost có tồn tại không.
  const costEntries = cost ? Object.entries(cost) : [];
  if (costEntries.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md bg-slate-800/50 p-2 text-xs">
      <span className="font-semibold text-slate-300 mr-1">{label}</span>
      {costEntries.map(([color, value]) => (
        <div key={color} className="flex items-center gap-1">
          {/* Vẫn hiển thị màu, ngay cả khi value là 0 */}
          <ColorIndicator colors={[color as CardColor]} />
          {/* Hiển thị số lượng nếu nó bằng 0 */}
          {value === 0 && <span className="font-bold text-slate-400">0</span>}
          {/* Hiển thị nhiều chấm màu nếu value > 1 */}
          {value > 1 &&
            Array.from({ length: value - 1 }).map((_, i) => (
              <ColorIndicator
                key={`${color}-${i}`}
                colors={[color as CardColor]}
              />
            ))}
        </div>
      ))}
    </div>
  );
};

interface SideCardPreviewProps {
  card: CardInstance | null;
}

const SideCardPreview = forwardRef<HTMLDivElement, SideCardPreviewProps>(
  function SideCardPreview({ card }, ref) {
    const { t } = useTranslation();
    const cardTranslations = useStore(
      useGameStore,
      (state) => state.cardTranslations
    );

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
            ref={ref}
            key={card.uuid}
            className="absolute top-4 left-4 z-[100] w-[300px] h-[calc(100vh-2rem)] p-4 bg-card/80 backdrop-blur-sm border rounded-lg shadow-2xl pointer-events-auto flex flex-col"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="relative aspect-[0.716] w-full mb-4 shrink-0">
              <Image
                src={card.imageUrl}
                alt={card.name}
                fill
                sizes="300px"
                className="object-contain rounded-md"
              />
            </div>
            <div className="flex-grow overflow-y-auto pr-2 space-y-4 text-sm">
              {(() => {
                const translation = cardTranslations[card.id];
                const displayName = translation?.name || card.name;
                const displayClass = translation?.class || card.class;

                return (
                  <>
                    {/* ... Header, Stats, Keywords không đổi ... */}
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold text-card-foreground pr-2">
                          {displayName}
                        </h3>
                        <ColorIndicator colors={card.colors} />
                      </div>
                      <div className="flex justify-between items-center text-muted-foreground mt-1">
                        <span className="font-semibold">{card.type}</span>
                        {card.power !== undefined && (
                          <div className="flex items-center gap-1 font-bold text-lg text-foreground">
                            <Swords className="size-4" />
                            {card.power}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1 text-xs border-t border-b border-white/10 py-2">
                      {(card.level !== undefined ||
                        card.limit !== undefined) && (
                        <div className="flex items-center gap-1">
                          <Atom className="size-4 text-cyan-400" />
                          <span className="font-bold">Level:</span>
                          <span>{card.level}</span>
                          {card.limit !== undefined && (
                            <>
                              <span className="mx-1">/</span>
                              <span className="font-bold">Limit:</span>
                              <span>{card.limit}</span>
                            </>
                          )}
                        </div>
                      )}
                      {card.lrigType && (
                        <div className="flex items-center gap-1">
                          <BookOpen className="size-4 text-purple-400" />
                          <span className="font-bold">LRIG Type:</span>
                          <span>{card.lrigType}</span>
                        </div>
                      )}
                      {card.team && (
                        <div className="flex items-center gap-1">
                          <Users className="size-4 text-orange-400" />
                          <span className="font-bold">Team:</span>
                          <span>{card.team}</span>
                        </div>
                      )}
                      {card.class && (
                        <div className="flex items-center gap-1">
                          <Gem className="size-4 text-pink-400" />
                          <span className="font-bold">Class:</span>
                          <span className="italic">{displayClass}</span>
                        </div>
                      )}
                    </div>
                    {(card.growCost || card.cost) && (
                      <CostDisplay cost={(card.growCost || card.cost)!} />
                    )}
                    {(card.Guard || card.timing) && (
                      <div className="flex flex-wrap gap-2 text-xs">
                        {card.Guard && (
                          <span className="flex items-center gap-1 font-bold text-green-300 bg-green-900/50 px-2 py-1 rounded">
                            <Shield className="size-3" />{" "}
                            {t("card.ability_Guard")}
                          </span>
                        )}
                        {card.timing && card.timing.length > 0 && (
                          <span className="font-bold text-cyan-300 bg-cyan-900/50 px-2 py-1 rounded">
                            Timing: {card.timing.join(", ")}
                          </span>
                        )}
                      </div>
                    )}
                    {card.abilityCondition && (
                      <div className="p-2 rounded-md border border-dashed border-yellow-500/50 bg-yellow-900/20">
                        <p className="text-xs font-bold text-yellow-400">
                          Điều kiện Team:
                        </p>
                        <p className="text-xs text-yellow-200">
                          Phải có Team &lt;{card.abilityCondition.value}&gt;
                          trên sân để sử dụng các kỹ năng bên dưới.
                        </p>
                      </div>
                    )}

                    {/* Abilities */}
                    <div className="space-y-3 text-foreground/90">
                      {card.abilities?.map((ability, index) => {
                        const translatedDesc =
                          translation?.abilities?.[index]?.description ||
                          ability.description;

                        return (
                          <div
                            key={index}
                            className="border-t border-white/10 pt-2 space-y-1.5"
                          >
                            <p className="font-bold text-primary/90">
                              {getAbilityTypeLabel(ability.type)}
                            </p>

                            {/* Metadata của kỹ năng */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                              {/* ĐIỀU KIỆN ĐÃ SỬA LẠI */}
                              {ability.turnLimit !== undefined && (
                                <span className="flex items-center gap-1">
                                  <RefreshCw className="size-3" />
                                  Mỗi lượt: {ability.turnLimit}
                                </span>
                              )}
                              {ability.timing && ability.timing.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Clock className="size-3" />
                                  Timing: {ability.timing.join(", ")}
                                </span>
                              )}
                            </div>

                            {/* Chi phí của kỹ năng */}
                            {ability.cost && (
                              <CostDisplay cost={ability.cost} label="Cost:" />
                            )}

                            <p className="leading-snug text-sm">
                              {translatedDesc}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Life Burst */}
                    {card.lifeBurstEffect && (
                      <div className="mt-3 border-t-2 border-amber-400/50 pt-2">
                        <p className="flex items-center gap-1 font-bold text-amber-400">
                          <Star className="size-4" /> {t("card.lifeBurst")}
                        </p>
                        <p className="leading-snug text-sm">
                          {translation?.lifeBurstEffect?.description ||
                            card.lifeBurstEffect.description}
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

export default SideCardPreview;
