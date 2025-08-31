// src/components/ui/SideCardPreview.tsx
import { CardInstance } from "@/types/game";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

interface SideCardPreviewProps {
  card: CardInstance | null;
}

export default function SideCardPreview({ card }: SideCardPreviewProps) {
  return (
    <AnimatePresence>
      {card && (
        <motion.div
          className="absolute top-24 left-4 z-30 w-[250px] p-4 bg-card border rounded-lg shadow-2xl pointer-events-none"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div className="relative aspect-[0.716] w-full mb-4">
            <Image
              src={card.imageUrl}
              alt={card.name}
              fill
              sizes="250px"
              className="object-contain rounded-md"
            />
          </div>
          <h3 className="text-lg font-bold text-card-foreground">
            {card.name}
          </h3>
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>
              {card.type}
              {card.level !== undefined ? ` - Lv ${card.level}` : ""}
            </span>
            {card.power !== undefined && (
              <span className="font-bold">{card.power}</span>
            )}
          </div>
          {card.class && (
            <p className="text-xs text-muted-foreground">{card.class}</p>
          )}

          <div className="mt-4 space-y-2 text-xs text-foreground/90">
            {card.abilities?.map((ability, index) => (
              <div key={index} className="border-t pt-2">
                <p className="font-bold">[{ability.type}]</p>
                <p>{ability.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
