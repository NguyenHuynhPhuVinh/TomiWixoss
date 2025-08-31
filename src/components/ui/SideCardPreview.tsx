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
          <p className="text-sm text-muted-foreground">
            {card.type} - Level {card.level ?? "N/A"}
          </p>
          <div className="mt-2 text-xs text-foreground/80">
            <p>Mô tả chi tiết và hiệu ứng của lá bài...</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
