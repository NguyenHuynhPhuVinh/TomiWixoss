// src/components/ui/ContextMenu.tsx
import { motion } from "framer-motion";
import { Button } from "./button";

interface ContextMenuProps {
  onDiscard: () => void;
}

export default function ContextMenu({ onDiscard }: ContextMenuProps) {
  return (
    <motion.div
      className="absolute -top-12 left-1/2 -translate-x-1/2 w-max bg-card border rounded-md shadow-lg p-1"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
    >
      <Button variant="destructive" size="sm" onClick={onDiscard}>
        Bỏ bài
      </Button>
    </motion.div>
  );
}
