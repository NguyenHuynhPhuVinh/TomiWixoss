"use client";
import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CardInstance } from "@/types/game";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next"; // Import hook

interface LrigSelectorProps {
  isOpen: boolean;
  fullLrigDeck: CardInstance[];
  onConfirm: (
    centerUuid: string,
    assist1Uuid: string,
    assist2Uuid: string
  ) => void;
}

export default function LrigSelector({
  isOpen,
  fullLrigDeck,
  onConfirm,
}: LrigSelectorProps) {
  const { t } = useTranslation(); // Sử dụng hook
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);
  const [selectedAssists, setSelectedAssists] = useState<string[]>([]);

  const { centerCandidates, assistCandidates } = useMemo(() => {
    const level0Lrigs = fullLrigDeck.filter((c) => c.level === 0);
    const centers: CardInstance[] = [];
    const assists: CardInstance[] = [];
    for (const lrig of level0Lrigs) {
      const hasLevel3 = fullLrigDeck.some(
        (evo) => evo.lrigType === lrig.lrigType && evo.level === 3
      );
      if (hasLevel3) centers.push(lrig);
      else assists.push(lrig);
    }
    return { centerCandidates: centers, assistCandidates: assists };
  }, [fullLrigDeck]);

  // Tự động chọn Center LRIG nếu chỉ có 1
  useEffect(() => {
    if (centerCandidates.length === 1 && !selectedCenter) {
      setSelectedCenter(centerCandidates[0].uuid);
    }
  }, [centerCandidates, selectedCenter]);

  const handleAssistClick = (uuid: string) => {
    setSelectedAssists((prev) => {
      if (prev.includes(uuid)) {
        return prev.filter((id) => id !== uuid);
      }
      if (prev.length < 2) {
        return [...prev, uuid];
      }
      // Nếu đã chọn 2, thay thế lá đầu tiên
      return [prev[1], uuid];
    });
  };

  const isSelectionComplete = selectedCenter && selectedAssists.length === 2;
  const getAssistLabel = () => {
    if (selectedAssists.length === 0)
      return t("lrigSelector.assistLabel_plural");
    if (selectedAssists.length === 1)
      return t("lrigSelector.assistLabel_singular");
    return t("lrigSelector.assistLabel_done");
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-3xl pointer-events-auto">
        <DialogHeader>
          <DialogTitle>{t("lrigSelector.title")}</DialogTitle>
          <DialogDescription>{t("lrigSelector.description")}</DialogDescription>
        </DialogHeader>

        <div>
          <h4 className="font-bold mb-2">{t("lrigSelector.centerLabel")}</h4>
          <div className="flex gap-4 p-2 bg-muted/50 rounded-lg">
            {centerCandidates.map((card) => {
              const isSelected = selectedCenter === card.uuid;
              return (
                <motion.div
                  key={card.uuid}
                  className="cursor-pointer relative"
                  onClick={() => setSelectedCenter(card.uuid)}
                  animate={{
                    scale: isSelected ? 1.1 : 1,
                    opacity: isSelected || !selectedCenter ? 1 : 0.6,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Image
                    src={card.imageUrl}
                    alt={card.name}
                    width={120}
                    height={168}
                    className={cn(
                      "rounded-lg transition-all",
                      isSelected && "ring-4 ring-amber-400"
                    )}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          <h4 className="font-bold mb-2">{getAssistLabel()}</h4>
          <div className="flex gap-4 p-2 bg-muted/50 rounded-lg">
            {assistCandidates.map((card) => {
              const isSelected = selectedAssists.includes(card.uuid);
              const isFull = selectedAssists.length === 2;
              return (
                <motion.div
                  key={card.uuid}
                  className="cursor-pointer relative"
                  onClick={() => handleAssistClick(card.uuid)}
                  animate={{
                    scale: isSelected ? 1.1 : 1,
                    opacity: isSelected || !isFull ? 1 : 0.6,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Image
                    src={card.imageUrl}
                    alt={card.name}
                    width={120}
                    height={168}
                    className={cn(
                      "rounded-lg transition-all",
                      isSelected && "ring-4 ring-sky-400"
                    )}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button
            disabled={!isSelectionComplete}
            onClick={() =>
              onConfirm(selectedCenter!, selectedAssists[0], selectedAssists[1])
            }
          >
            {t("lrigSelector.confirmButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
