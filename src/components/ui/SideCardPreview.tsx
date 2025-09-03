// src/components/ui/SideCardPreview.tsx
import { CardInstance, CardColor, CardCost } from "@/types/game";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Shield, Gem, Swords, Star, Users, BookOpen, Atom } from "lucide-react"; // Cần cài đặt lucide-react nếu chưa có

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

// Helper Component để hiển thị chi phí Ener
const CostDisplay = ({ cost }: { cost: CardCost }) => {
  const costEntries = Object.entries(cost).filter(([, value]) => value > 0);
  if (costEntries.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md bg-slate-800/50 p-2">
      <span className="text-xs font-semibold text-slate-300 mr-2">
        CHI PHÍ:
      </span>
      {costEntries.map(([color, value]) =>
        Array.from({ length: value }).map((_, i) => (
          <ColorIndicator key={`${color}-${i}`} colors={[color as CardColor]} />
        ))
      )}
    </div>
  );
};

interface SideCardPreviewProps {
  card: CardInstance | null;
}

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
            ref={ref}
            key={card.uuid}
            className="absolute top-4 left-4 z-[100] w-[300px] h-[calc(100vh-2rem)] p-4 bg-card/80 backdrop-blur-sm border rounded-lg shadow-2xl pointer-events-auto flex flex-col"
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
            <div className="flex-grow overflow-y-auto pr-2 space-y-4 text-sm">
              {/* Header */}
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-card-foreground pr-2">
                    {card.name}
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

              {/* Stats & Details */}
              <div className="space-y-1 text-xs border-t border-b border-white/10 py-2">
                {(card.level !== undefined || card.limit !== undefined) && (
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
                    <span className="italic">{card.class}</span>
                  </div>
                )}
              </div>

              {/* Cost */}
              {(card.growCost || card.cost) && (
                <CostDisplay cost={(card.growCost || card.cost)!} />
              )}

              {/* Keywords (Guard, Timing) */}
              {(card.Guard || card.timing) && (
                <div className="flex flex-wrap gap-2 text-xs">
                  {card.Guard && (
                    <span className="flex items-center gap-1 font-bold text-green-300 bg-green-900/50 px-2 py-1 rounded">
                      <Shield className="size-3" /> {t("card.ability_Guard")}
                    </span>
                  )}
                  {card.timing && card.timing.length > 0 && (
                    <span className="font-bold text-cyan-300 bg-cyan-900/50 px-2 py-1 rounded">
                      Timing: {card.timing.join(", ")}
                    </span>
                  )}
                </div>
              )}

              {/* Ability Condition */}
              {card.abilityCondition && (
                <div className="p-2 rounded-md border border-dashed border-yellow-500/50 bg-yellow-900/20">
                  <p className="text-xs font-bold text-yellow-400">
                    Điều kiện Team:
                  </p>
                  <p className="text-xs text-yellow-200">
                    Phải có Team &lt;{card.abilityCondition.value}&gt; trên sân
                    để sử dụng các kỹ năng bên dưới.
                  </p>
                </div>
              )}

              {/* Abilities */}
              <div className="space-y-3 text-foreground/90">
                {card.abilities?.map((ability, index) => (
                  <div key={index} className="border-t border-white/10 pt-2">
                    <p className="font-bold text-primary/90">
                      {getAbilityTypeLabel(ability.type)}
                    </p>
                    <p className="leading-snug text-sm">
                      {ability.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Life Burst */}
              {card.lifeBurstEffect && (
                <div className="mt-3 border-t-2 border-amber-400/50 pt-2">
                  <p className="flex items-center gap-1 font-bold text-amber-400">
                    <Star className="size-4" /> {t("card.lifeBurst")}
                  </p>
                  <p className="leading-snug text-sm">
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
