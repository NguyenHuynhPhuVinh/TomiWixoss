// src/components/ui/ContextMenu.tsx
import { motion } from "framer-motion";
import { Button } from "./button";

interface ContextMenuProps {
  onDiscard: () => void;
  onChargeEner?: () => void; // Thêm prop mới, optional
  showChargeEner?: boolean; // Cờ để hiển thị
  onPlaySigni?: () => void; // Thêm prop mới, optional
  showPlaySigni?: boolean; // Cờ để hiển thị
}

export default function ContextMenu({
  onDiscard,
  onChargeEner,
  showChargeEner,
  onPlaySigni,
  showPlaySigni,
}: ContextMenuProps) {
  return (
    <motion.div
      className="absolute -top-12 left-1/2 -translate-x-1/2 w-max bg-card border rounded-md shadow-lg p-1"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
    >
      {showChargeEner && onChargeEner && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onChargeEner}
          className="mr-1"
        >
          Charge Ener
        </Button>
      )}
      {showPlaySigni && onPlaySigni && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onPlaySigni}
          className="mr-1"
        >
          Play SIGNI
        </Button>
      )}
      <Button variant="destructive" size="sm" onClick={onDiscard}>
        Bỏ bài
      </Button>
    </motion.div>
  );
}
