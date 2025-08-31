// src/components/ui/LrigSelector.tsx
"use client";
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CardInstance } from "@/types/game";
import Image from "next/image";
import { cn } from "@/lib/utils";

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
      if (hasLevel3) {
        centers.push(lrig);
      } else {
        assists.push(lrig);
      }
    }
    return { centerCandidates: centers, assistCandidates: assists };
  }, [fullLrigDeck]);

  const handleAssistClick = (uuid: string) => {
    setSelectedAssists((prev) => {
      if (prev.includes(uuid)) {
        return prev.filter((id) => id !== uuid); // Bỏ chọn
      }
      if (prev.length < 2) {
        return [...prev, uuid]; // Chọn thêm
      }
      return prev; // Đã đủ 2, không làm gì
    });
  };

  const isSelectionComplete = selectedCenter && selectedAssists.length === 2;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Chọn LRIG Khởi đầu</DialogTitle>
        </DialogHeader>

        <div>
          <h4 className="font-bold mb-2">Chọn 1 Center LRIG</h4>
          <div className="flex gap-4">
            {centerCandidates.map((card) => (
              <div
                key={card.uuid}
                className="cursor-pointer"
                onClick={() => setSelectedCenter(card.uuid)}
              >
                <Image
                  src={card.imageUrl}
                  alt={card.name}
                  width={100}
                  height={140}
                  className={cn(
                    "rounded-md",
                    selectedCenter === card.uuid && "ring-4 ring-amber-400"
                  )}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <h4 className="font-bold mb-2">Chọn 2 Assist LRIG</h4>
          <div className="flex gap-4">
            {assistCandidates.map((card) => (
              <div
                key={card.uuid}
                className="cursor-pointer"
                onClick={() => handleAssistClick(card.uuid)}
              >
                <Image
                  src={card.imageUrl}
                  alt={card.name}
                  width={100}
                  height={140}
                  className={cn(
                    "rounded-md",
                    selectedAssists.includes(card.uuid) && "ring-4 ring-sky-400"
                  )}
                />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button
            disabled={!isSelectionComplete}
            onClick={() =>
              onConfirm(selectedCenter!, selectedAssists[0], selectedAssists[1])
            }
          >
            Xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
