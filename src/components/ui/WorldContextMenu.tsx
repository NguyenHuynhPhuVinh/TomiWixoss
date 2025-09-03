"use client";
import { useRef } from "react";
import { useStore } from "zustand";
import useGameStore from "@/store/gameStore";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./button";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";

export default function WorldContextMenu() {
  const isOpen = useStore(
    useGameStore,
    (state) => state.isWorldContextMenuOpen
  );
  const position = useStore(
    useGameStore,
    (state) => state.worldContextMenuPosition
  );
  const options = useStore(
    useGameStore,
    (state) => state.worldContextMenuOptions
  );
  const closeMenu = useStore(
    useGameStore,
    (state) => state.closeWorldContextMenu
  );

  const menuRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(menuRef, closeMenu);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          className="absolute z-50 w-max bg-card border rounded-md shadow-lg p-1 flex flex-col gap-1"
          style={{
            top: position.y,
            left: position.x,
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.1 }}
        >
          {options.map((option, index) => (
            <Button
              key={index}
              variant="secondary"
              size="sm"
              onClick={() => {
                option.action();
                closeMenu();
              }}
            >
              {option.label}
            </Button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
